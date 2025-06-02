terraform {
  backend "s3" {
    bucket         = "microservices-gitops"
    region         = "us-east-1"
    key            = "env/dev.tfstate"
    dynamodb_table = "eks-gitops-lock"
    encrypt        = true
  }
}