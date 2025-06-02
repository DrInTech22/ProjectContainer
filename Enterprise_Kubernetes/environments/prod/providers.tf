terraform {

  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.53"
    }
    kubernetes = {
      source = "hashicorp/kubernetes"
      version = "2.36.0"
    }
}
}

provider "aws" {
  region = var.aws-region

  # Ensures all resource are tagged 
  default_tags {
    tags = {
      Terraform   = "true"
      Environment = var.env
      Platform    = "EKS-${var.cluster-name}"
    }
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    command     = "aws"
  }
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
}

# Configure the Helm provider to use the Kubernetes provider configuration
provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}