locals {
  cluster-name = var.cluster-name
}

resource "aws_vpc" "eks-vpc" {
  cidr_block           = var.vpc-cidr-block
  enable_dns_support   = true
  enable_dns_hostnames = true

# Tags are defined in the providers.tf for each environment
#   tags = {
#     Name = "${local.env}-main"
#   }
}