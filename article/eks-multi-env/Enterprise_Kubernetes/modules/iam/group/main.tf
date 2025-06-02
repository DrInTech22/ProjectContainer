module "iam_group" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-group-with-policies"
  version = "5.48.0"
  name                              = var.name
  create_group                      = var.create_group
  group_users                       = var.group_users
  custom_group_policy_arns          = var.custom_group_policy_arns
  enable_mfa_enforcement            = var.enable_mfa_enforcement
}