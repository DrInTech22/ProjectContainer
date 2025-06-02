aws-region   = "us-west-2"
env          = "demo"
cluster-name = "demo-cluster"

# vpc module variable
vpc-cidr-block = "10.1.0.0/16"
igw-name       = "demo-igw"
pub-cidr-block = ["10.1.0.0/20", "10.1.16.0/20"]
pri-cidr-block = ["10.1.128.0/20" , "10.1.144.0/20"]
pub-sub-count  = 2
pri-sub-count  = 2
pub-az         = ["us-west-2a", "us-west-2b"]
pri-az         = ["us-west-2a", "us-west-2b"]
pub-sub-name   = "demo-public-subnet"
pri-sub-name   = "demo-private-subnet"
natgw-name     = "demo-natgw"

# eks module variable
endpoint-private-access = false
endpoint-public-access = true
eks-version = "1.29"
desired_spot_nodes = 0
max_spot_nodes = 1
min_spot_nodes = 0
desired_general_nodes = 1
max_general_nodes = 3
min_general_nodes = 1
general_instance_types = ["t3.micro"]
spot_instance_types = ["t3.micro", "t3.small"]
addons = [
    {
        name    = "kube-proxy"
        version = "v1.29.0-eksbuild.1"
    },
    {
        name    = "vpc-cni"
        version = "v1.18.0-eksbuild.1"
    },
    {
        name    = "coredns"
        version = "v1.11.0-eksbuild.1"
    },
    {
        name    = "aws-ebs-csi-driver"
        version = "v1.25.0-eksbuild.1"
    },
]

# ###############
# IAM Admin & Developer variables
# ###############
admin_usernames    = ["alice", "bob"]
dev_team_usernames = ["carol", "dave"]

# ###############
# IAM Group variables
# ###############
admin_iam_group_name    = "demo-admin"
dev_team_iam_group_name = "demo-dev-team"
create_group            = true
enable_mfa_enforcement  = false

# ###############
# IAM Policy variables
# ###############
admin_iam_policy_name    = "demo-admin-policy"
dev_team_iam_policy_name = "demo-dev-team-policy"
create_policy            = true

# ###############
# Role variables
# ###############
admin_role_name    = "demo-admin-role"
dev_team_role_name = "demo-dev-team-role"
create_assume_role = true
role_requires_mfa  = false

# ###############
# IAM Policy Assume variables
# ###############
assume_eks_admin_iam_role          = "demo-assume-eks-admin-role"
assume_eks_dev_team_iam_role       = "demo-assume-eks-dev-team-role"
create_eks_assume_user_role_policy = true