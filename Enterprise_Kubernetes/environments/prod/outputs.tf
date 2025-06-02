# VPC OUTPUT  
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "admin_iam_user_names" {
  description = "The names of the admin IAM users"
  value       = { for key, user in module.admin_iam_users : key => user.iam_user_name }
}

output "dev_team_iam_user_names" {
  description = "The names of the dev_team IAM users"
  value       = { for key, user in module.dev_team_iam_users : key => user.iam_user_name }
}

output "admin_iam_role_arn" {
  description = "Admin Role ARN"
  value       = module.admin_iam_role.iam_role_arn
}

output "dev_team_iam_role_arn" {
  description = "Dev-team Role ARN"
  value       = module.dev_team_iam_role.iam_role_arn
}