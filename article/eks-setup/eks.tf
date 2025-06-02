module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "18.29.0"

  cluster_name    = local.eks_name
  cluster_version = local.eks_version

  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true

  vpc_id     = aws_vpc.eks_vpc.id
  subnet_ids = [aws_subnet.private_zone1.id, aws_subnet.private_zone2.id]

  enable_irsa = true

  tags = {
    Environment = var.env
  }
}

resource "aws_iam_role" "eks_node_group_general" {
  name = "eks-node-group-general"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_node_group_general_AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group_general.name
}

resource "aws_iam_role_policy_attachment" "eks_node_group_general_AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group_general.name
}

resource "aws_iam_role_policy_attachment" "eks_node_group_general_AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group_general.name
}

resource "aws_eks_node_group" "general" {
  cluster_name    = module.eks.cluster_id
  node_group_name = "general"
  node_role_arn   = aws_iam_role.eks_node_group_general.arn
  subnet_ids      = [aws_subnet.private_zone1.id, aws_subnet.private_zone2.id]

  scaling_config {
    desired_size = 2
    min_size     = 1
    max_size     = 10
  }

  labels = {
    role = "general"
  }

  instance_types = ["t2.small"]
  capacity_type  = "ON_DEMAND"

  lifecycle {
    ignore_changes = [scaling_config[0].desired_size]
  }
}

data "aws_eks_cluster" "default" {
  name = module.eks.cluster_id
}

data "aws_eks_cluster_auth" "default" {
  name = module.eks.cluster_id
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.default.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.default.certificate_authority[0].data)
  # token                  = data.aws_eks_cluster_auth.default.token

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    args        = ["eks", "get-token", "--cluster-name", data.aws_eks_cluster.default.id]
    command     = "aws"
  }
}

resource "aws_eks_addon" "addons" {
  for_each                = { for addon in var.addons : addon.name => addon }
  cluster_name            = local.eks_name
  addon_name              = each.value.name
  addon_version           = each.value.version
  resolve_conflicts_on_update = "OVERWRITE"
}