module "iam_policy" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-policy"
  version = "5.48.0"
  name          = var.name
  create_policy = var.create_policy
  policy = var.policy
}