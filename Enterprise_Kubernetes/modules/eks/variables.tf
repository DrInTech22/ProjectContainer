variable "cluster-name" {}
variable "endpoint-private-access" {
    type        = bool
}
variable "endpoint-public-access" {
    type        = bool
}
variable "private_subnet_ids" {
    type        = list(string)
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
variable "spot_instance_types" {
    type        = list(string)
}

# variable "desired_general_nodes" {
#     type        = number
# }
# variable "max_general_nodes" {
#     type        = number
# }
# variable "min_general_nodes" {
#     type        = number
# }  
# variable "general_instance_types" {
#     type        = list(string)
# }

# Moderate Workload Node Group Variables
variable "desired_moderate_nodes" {
  type        = number
  description = "Desired number of moderate workload nodes"
  default     = 2
}


variable "min_moderate_nodes" {
  type        = number
  description = "Minimum number of moderate workload nodes"
  default     = 1
}

variable "max_moderate_nodes" {
  type        = number
  description = "Maximum number of moderate workload nodes"
  default     = 4
}

variable "moderate_instance_types" {
  type        = list(string)
  description = "Instance types for moderate workload nodes"
  default     = ["t3.medium"]
}

# Small Workload Node Group Variables
variable "desired_small_nodes" {
  type        = number
  description = "Desired number of small workload nodes"
  default     = 2
}

variable "min_small_nodes" {
  type        = number
  description = "Minimum number of small workload nodes"
  default     = 1
}

variable "max_small_nodes" {
  type        = number
  description = "Maximum number of small workload nodes"
  default     = 3
}

variable "small_instance_types" {
  type        = list(string)
  description = "Instance types for small workload nodes"
  default     = ["t2.micro"]
}

variable "addons" {
  type = list(object({
    name    = string
    version = string
  }))
}
variable "aws-region" {}
variable "vpc_id" {}