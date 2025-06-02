terraform {
  backend "s3" {
    bucket         = "microservices-gitops"
    region         = "us-east-1"
    key            = "microservices-gitops/terraform.tfstate"
    dynamodb_table = "ansible-terraform01-lock"
    encrypt        = true
  }
}



