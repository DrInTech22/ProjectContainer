variable "aws-region" {}
variable "env" {}
variable "cluster-name" {}

# vpc module variable
variable "vpc-cidr-block" {}
variable "igw-name" {}
variable "pub-cidr-block" {
  type = list(string)
}
variable "pri-cidr-block" {
  type = list(string)
}
variable "pub-sub-count" {}
variable "pri-sub-count" {}
variable "pub-az" {
    type = list(string)
}
variable "pri-az" {
    type = list(string)
}
variable "pub-sub-name" {}
variable "pri-sub-name" {}
variable "natgw-name" {}

# eks module variable
variable "endpoint-private-access" {
    type        = bool
}
variable "endpoint-public-access" {
    type        = bool
}
variable "eks-version" {}
variable "desired_spot_nodes" {
    type        = number
}
variable "max_spot_nodes" {
    type        = number
}
variable "min_spot_nodes" {
    type        = number
}
variable "desired_general_nodes" {
    type        = number
}
variable "max_general_nodes" {
    type        = number
}
variable "min_general_nodes" {
    type        = number
}  
variable "general_instance_types" {
    type        = list(string)
}
variable "spot_instance_types" {
    type        = list(string)
}

# IAM Admin & dev_team variables
variable "admin_usernames" {
  description = "List of admin usernames"
  type        = list(string)
}

variable "dev_team_usernames" {
  description = "List of dev team usernames"
  type        = list(string)
}

variable "force_destroy" {
  type    = bool
  default = true
}

variable "create_user" {
  type    = bool
  default = true
}

variable "password_length" {
  type    = number
  default = 30
}

variable "password_reset_required" {
  type    = bool
  default = true
}


# IAM Group variables
variable "admin_iam_group_name" {
  type = string
}

variable "dev_team_iam_group_name" {
  type = string
}

variable "create_group" {
  type = bool
}

variable "enable_mfa_enforcement" {
  type = bool
}

# IAM Policy variables
variable "admin_iam_policy_name" {
  type = string
}

variable "dev_team_iam_policy_name" {
  type = string
}

variable "create_policy" {
  type = bool
}


# Role variables
variable "admin_role_name" {
  type = string
}

variable "dev_team_role_name" {
  type = string
}

variable "create_assume_role" {
  type = bool
}

variable "role_requires_mfa" {
  type = bool
}


# IAM Policy Assume variables
variable "assume_eks_admin_iam_role" {
  type = string
}

variable "assume_eks_dev_team_iam_role" {
  type = string
}

variable "create_eks_assume_user_role_policy" {
  type = bool
}