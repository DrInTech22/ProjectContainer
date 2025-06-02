output "iam_user_name" {
  description = "The user's name"
  value       = module.iam_user.iam_user_name
}

output "policy_arns" {
  description = "The list of ARNs of policies directly assigned to the IAM user"
  value       = module.iam_user.policy_arns
}