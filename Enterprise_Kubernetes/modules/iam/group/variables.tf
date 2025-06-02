variable "name" {
  type = string
}

variable "create_group" {
  type = bool
}

variable "group_users" {
  type = list(string)
}

variable "custom_group_policy_arns" {
  type = list(string)
}

variable "enable_mfa_enforcement" {
  type = bool
}