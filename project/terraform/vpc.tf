module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "main"
  cidr = "10.0.0.0/16"

  azs             = var.availability_zones
  private_subnets = ["10.0.0.0/19", "10.0.32.0/19"]
  public_subnets  = ["10.0.64.0/19", "10.0.96.0/19"]

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }

  enable_nat_gateway     = true
  single_nat_gateway     = true
  one_nat_gateway_per_az = false

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Environment = "dev"
  }
}

# # ACM Certificate Request
# resource "aws_acm_certificate" "cert" {
#   domain_name       = var.domain_name
#   validation_method = "DNS"
# }

# # Fetch Route 53 Hosted Zone
# data "aws_route53_zone" "cert" {
#   name         = var.hosted_zone_name
#   private_zone = false
# }

# # Create DNS Records for Validation
# resource "aws_route53_record" "cert" {
#   for_each = {
#     for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
#       name   = dvo.resource_record_name
#       record = dvo.resource_record_value
#       type   = dvo.resource_record_type
#     }
#   }

#   allow_overwrite = true
#   name            = each.value.name
#   records         = [each.value.record]
#   ttl             = 60
#   type            = each.value.type
#   zone_id         = data.aws_route53_zone.cert.zone_id
# }

# # ACM Certificate Validation
# resource "aws_acm_certificate_validation" "cert" {
#   certificate_arn         = aws_acm_certificate.cert.arn
#   validation_record_fqdns = [for record in aws_route53_record.cert : record.fqdn]

#   depends_on = [aws_route53_record.cert]
# }

# # Outputs
# output "certificate_arn" {
#   value = aws_acm_certificate.cert.arn
# }