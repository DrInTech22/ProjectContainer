variable "env" {
  description = "The environment name"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "The AWS region"
  type        = string
  default     = "us-east-1"
}

variable "zone1" {
  description = "The first availability zone"
  type        = string
  default     = "us-east-1a"
}

variable "zone2" {
  description = "The second availability zone"
  type        = string
  default     = "us-east-1b"
}

variable "addons" {
  type = list(object({
    name    = string
    version = string
  }))

  default = [
    {
      name    = "kube-proxy"
      version = "v1.29.11-eksbuild.2"
    },
    {
      name    = "vpc-cni"
      version = "v1.19.2-eksbuild.1"
    },
    {
      name    = "coredns"
      version = "v1.11.4-eksbuild.2"
    },
    {
      name    = "aws-ebs-csi-driver"
      version = "v1.36.0-eksbuild.1"
    }
  ]
}
