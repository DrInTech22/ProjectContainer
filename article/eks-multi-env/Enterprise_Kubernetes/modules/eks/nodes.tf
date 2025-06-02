resource "aws_iam_role" "eks_node_group_general" {
  name = "${var.cluster-name}-node-group-general"

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
  cluster_name    = aws_eks_cluster.eks_cluster.name
  node_group_name = "${var.cluster-name}-general"
  node_role_arn   = aws_iam_role.eks_node_group_general.arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    desired_size = var.desired_general_nodes
    min_size     = var.min_general_nodes
    max_size     = var.max_general_nodes
  }

  labels = {
    role = "general"
  }
  tags = {
    "Name" = "${var.cluster-name}-general-nodes"
  }

  instance_types = var.general_instance_types
  capacity_type  = "ON_DEMAND"

  lifecycle {
    ignore_changes = [scaling_config[0].desired_size]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_group_general_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.eks_node_group_general_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.eks_node_group_general_AmazonEC2ContainerRegistryReadOnly,
  ]

}

resource "aws_iam_role" "eks_node_group_spot" {
  name = "${var.cluster-name}-node-group-spot"

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

resource "aws_iam_role_policy_attachment" "eks_node_group_spot_AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group_spot.name
}

resource "aws_iam_role_policy_attachment" "eks_node_group_spot_AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group_spot.name
}

resource "aws_iam_role_policy_attachment" "eks_node_group_spot_AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group_spot.name
}

resource "aws_eks_node_group" "spot" {
  cluster_name    = aws_eks_cluster.eks_cluster.name
  node_group_name = "${var.cluster-name}-spot"
  node_role_arn   = aws_iam_role.eks_node_group_spot.arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    desired_size = var.desired_spot_nodes
    min_size     = var.min_spot_nodes
    max_size     = var.max_spot_nodes
  }

  labels = {
    role = "spot"
  }
  tags = {
    "Name" = "${var.cluster-name}-spot-nodes"
  }

  taint {
    key    = "market"
    value  = "spot"
    effect = "NO_SCHEDULE"
  }

  instance_types = var.spot_instance_types
  capacity_type  = "SPOT"

  lifecycle {
    ignore_changes = [scaling_config[0].desired_size]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_group_spot_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.eks_node_group_spot_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.eks_node_group_spot_AmazonEC2ContainerRegistryReadOnly,
  ]
}

