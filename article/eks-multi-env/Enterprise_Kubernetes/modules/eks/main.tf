locals {
  cluster-name = var.cluster-name
  eks-version  = var.eks-version
}

resource "aws_iam_role" "eks-role" {
  name = "eks-${local.cluster-name}-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sts:AssumeRole",
          "sts:TagSession"
        ]
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cluster_AmazonEKSClusterPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks-role.name
}

resource "aws_eks_cluster" "eks_cluster" {
  name     = local.cluster-name
  role_arn = aws_iam_role.eks-role.arn
  version  = local.eks-version

  access_config {
    authentication_mode = "API"
    bootstrap_cluster_creator_admin_permissions = true
  }



  vpc_config {
    endpoint_private_access = var.endpoint-private-access
    endpoint_public_access  = var.endpoint-public-access
    subnet_ids              = var.private_subnet_ids
  }

  # Ensure that IAM Role permissions are created before and deleted
  # after EKS Cluster handling. Otherwise, EKS will not be able to
  # properly delete EKS managed EC2 infrastructure such as Security Groups.
  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
  ]
}

