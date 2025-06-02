variable "role_name" {
  type = string
}

variable "create_role" {
 type = bool
}

variable "role_requires_mfa" {
  type = bool
}

variable "custom_role_policy_arns" {
  type = list(string)
}

variable "trusted_role_arns" {
  type = list(string)
}


