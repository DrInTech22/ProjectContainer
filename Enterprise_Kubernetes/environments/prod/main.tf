data "aws_caller_identity" "current" {}

# Reference existing IAM groups
data "aws_iam_group" "existing_admin_group" {
  group_name = "yamify-cloud-infra"
}

data "aws_iam_group" "existing_dev_group" {
  group_name = "dev_yamify"
}

module vpc {
  source = "../../modules/vpc"
  cluster-name = var.cluster-name
  vpc-cidr-block = var.vpc-cidr-block
  igw-name = var.igw-name
  pub-cidr-block = var.pub-cidr-block
  pri-cidr-block = var.pri-cidr-block
  pub-sub-count = var.pub-sub-count
  pri-sub-count = var.pri-sub-count
  pub-az = var.pub-az
  pri-az = var.pri-az
  pub-sub-name = var.pub-sub-name
  pri-sub-name = var.pri-sub-name
  natgw-name = var.natgw-name
}

module eks {
  source = "../../modules/eks"
  cluster-name = var.cluster-name
  endpoint-private-access = var.endpoint-private-access
  endpoint-public-access = var.endpoint-public-access
  private_subnet_ids = module.vpc.private_subnet_ids
  eks-version = var.eks-version

  desired_spot_nodes = var.desired_spot_nodes
  max_spot_nodes = var.max_spot_nodes
  min_spot_nodes = var.min_spot_nodes
  spot_instance_types = var.spot_instance_types

  # Moderate Node Group
  desired_moderate_nodes = var.desired_moderate_nodes
  max_moderate_nodes = var.max_moderate_nodes
  min_moderate_nodes = var.min_moderate_nodes
  moderate_instance_types = var.moderate_instance_types
  
  # Small Node Group
  desired_small_nodes = var.desired_small_nodes
  max_small_nodes = var.max_small_nodes
  min_small_nodes = var.min_small_nodes
  small_instance_types = var.small_instance_types

  # desired_general_nodes = var.desired_general_nodes
  # max_general_nodes = var.max_general_nodes
  # min_general_nodes = var.min_general_nodes
  # general_instance_types = var.general_instance_types

  addons = var.addons
  aws-region = var.aws-region
  vpc_id = module.vpc.vpc_id
}

# # Admin User To Access Cluster
# module "admin_iam_users" {
#   source                  = "../../modules/iam/user"
#   for_each                = toset(var.admin_usernames)
#   name                    = each.key
#   force_destroy           = var.force_destroy
#   create_user             = var.create_user
#   password_length         = var.password_length
#   password_reset_required = var.password_reset_required
# }

# IAM Policy With Admin Access Inside AWS Account
module "admin_iam_policy" {
  source = "../../modules/iam/policy"
  name   = var.admin_iam_policy_name
  create_policy = var.create_policy
  policy        = file("../../policies/eks-admin-access.json")
}

# # Create Group To Admin Users & Attach IAM Policy Assuming EKS
# module "admin_iam_group" {
#   source                   = "../../modules/iam/group"
#   name                     = var.admin_iam_group_name
#   create_group             = var.create_group
#   enable_mfa_enforcement   = var.enable_mfa_enforcement
#   custom_group_policy_arns = [module.allow_assume_eks_admins_iam_policy.arn]
#   group_users              = [for user in module.admin_iam_users : user.iam_user_name]
# }

# IAM Role Granting Admin Privileges to access EKS Cluster
module "admin_iam_role" {
  source                  = "../../modules/iam/role"
  role_name               = var.admin_role_name
  create_role             = var.create_assume_role
  role_requires_mfa       = var.role_requires_mfa
  custom_role_policy_arns = [module.admin_iam_policy.arn]
  trusted_role_arns       = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
}

module "allow_assume_eks_admins_iam_policy" {
  source        = "../../modules/iam/policy"
  name          = var.assume_eks_admin_iam_role
  create_policy = true
  policy = templatefile(
    "../../templates/assume-eks-admin-iam-policy.tpl",
    {
      assume_eks_admin_iam_policy = module.admin_iam_role.iam_role_arn
    }
  )
}

# Attach assume role policy to existing dev group
resource "aws_iam_group_policy_attachment" "dev_group_assume_role_policy" {
  group      = data.aws_iam_group.existing_dev_group.group_name
  policy_arn = module.allow_assume_eks_dev_team_iam_policy.arn
}

# Developer User To Access Cluster
# module "dev_team_iam_users" {
#   source                  = "../../modules/iam/user"
#   for_each                = toset(var.dev_team_usernames)
#   name                    = each.key
#   force_destroy           = var.force_destroy
#   create_user             = var.create_user
#   password_length         = var.password_length
#   password_reset_required = var.password_reset_required
# }

# module "dev_team_iam_group" {
#   source                   = "../../modules/iam/group"
#   name                     = var.dev_team_iam_group_name
#   create_group             = var.create_group
#   enable_mfa_enforcement   = var.enable_mfa_enforcement
#   group_users              = [for user in module.dev_team_iam_users : user.iam_user_name]
#   custom_group_policy_arns = [module.allow_assume_eks_dev_team_iam_policy.arn]
# }


module "dev_team_iam_policy" {
  source        = "../../modules/iam/policy"
  name          = var.dev_team_iam_policy_name
  create_policy = var.create_policy
  policy        = file("../../policies/eks-dev-team-access.json")
}

module "dev_team_iam_role" {
  source                  = "../../modules/iam/role"
  role_name               = var.dev_team_role_name
  create_role             = var.create_assume_role
  role_requires_mfa       = var.role_requires_mfa
  custom_role_policy_arns = [module.dev_team_iam_policy.arn]
  trusted_role_arns       = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
}

module "allow_assume_eks_dev_team_iam_policy" {
  source        = "../../modules/iam/policy"
  name          = var.assume_eks_dev_team_iam_role
  create_policy = true
  policy = templatefile(
    "${path.module}/../../templates/assume-eks-dev-team-iam-policy.tpl",
    {
      assume_eks_dev_team_iam_policy = module.dev_team_iam_role.iam_role_arn
    }
  )
}

# Attach assume role policy to existing admin group
resource "aws_iam_group_policy_attachment" "admin_group_assume_role_policy" {
  group      = data.aws_iam_group.existing_admin_group.group_name
  policy_arn = module.allow_assume_eks_admins_iam_policy.arn
}

# Best practice: use IAM roles due to temporary credentials
resource "aws_eks_access_entry" "eks_admin_entry" {
  cluster_name      = module.eks.cluster_name
  principal_arn     = module.admin_iam_role.iam_role_arn
  kubernetes_groups = ["my-admin"]
}

resource "aws_eks_access_entry" "eks_dev_team_entry" {
  cluster_name      = module.eks.cluster_name
  principal_arn     = module.dev_team_iam_role.iam_role_arn
  kubernetes_groups = ["dev-team"]
}
