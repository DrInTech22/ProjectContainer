aws-region   = "us-east-1"
env          = "prod"
cluster-name = "demo-cluster"

# vpc module variable
vpc-cidr-block = "10.0.0.0/16"
igw-name       = "eks-igw"
pub-cidr-block = ["10.0.0.0/20", "10.0.16.0/20"]
pri-cidr-block = ["10.0.128.0/20" , "10.0.144.0/20"]
pub-sub-count  = 2
pri-sub-count  = 2
pub-az         = ["us-east-1a", "us-east-1b"]
pri-az         = ["us-east-1a", "us-east-1b"]
pub-sub-name   = "public-subnet"
pri-sub-name   = "private-subnet"
natgw-name     = "eks-natgw"

# eks module variable
endpoint-private-access = false
endpoint-public-access = true
eks-version = "1.30"
desired_spot_nodes = 1
max_spot_nodes = 2
min_spot_nodes = 1
desired_general_nodes = 2
max_general_nodes = 2
min_general_nodes = 1
general_instance_types = ["t3.small"]
spot_instance_types = ["c5a.large", "c5a.xlarge", "m5a.large", "m5a.xlarge", "c5.large", "m5.large", "t3a.large", "t3a.xlarge", "t3a.medium"]

# ###############
# IAM Admin & Developer variables
# ###############
admin_usernames    = ["odun", "theo"]
dev_team_usernames = ["drintech", "tinubu"]

# ###############
# IAM Group variables
# ###############
admin_iam_group_name    = "my-admin"
dev_team_iam_group_name = "dev_team"
create_group            = true
enable_mfa_enforcement  = false

# ###############
# IAM Policy variables
# ###############
admin_iam_policy_name    = "allow-eks-access-admin-policy"
dev_team_iam_policy_name = "allow-eks-access-dev-team-policy"
create_policy            = true

# ###############
# Role variables
# ###############
admin_role_name    = "admin_role"
dev_team_role_name = "dev_team_role"
create_assume_role = true
role_requires_mfa  = false

# ###############
# IAM Policy Assume variables
# ###############
assume_eks_admin_iam_role          = "assume-eks-admin-iam-role"
assume_eks_dev_team_iam_role       = "assume-eks-dev-team-iam-role"
create_eks_assume_user_role_policy = true