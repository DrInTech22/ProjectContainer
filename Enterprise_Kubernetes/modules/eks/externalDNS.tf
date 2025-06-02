# First, create an IAM role for ExternalDNS with appropriate permissions
module "external_dns_irsa_role" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "5.30.0"

  role_name = "external-dns"

  # Attach the required Route53 permissions
  attach_external_dns_policy = true
  external_dns_hosted_zone_arns = ["arn:aws:route53:::hostedzone/*"] # Or specify your exact hosted zone ARN

  # Connect to your EKS OIDC provider
  oidc_providers = {
    ex = {
      provider_arn               = aws_iam_openid_connect_provider.oidc.arn
      namespace_service_accounts = ["kube-system:external-dns"]
    }
  }
}

# Then, deploy ExternalDNS with the IAM role
module "external-dns" {
  source  = "terraform-iaac/external-dns/kubernetes"
  version = "1.3.2"
  
  # Basic configuration
  dns            = ["drintech.online"]
  dns_provider   = "aws"

  create_namespace     = false
  namespace            = "kube-system"
  
  # Connect the service account to the IAM role
  service_account_annotations = {
    "eks.amazonaws.com/role-arn" = module.external_dns_irsa_role.iam_role_arn
  }


}