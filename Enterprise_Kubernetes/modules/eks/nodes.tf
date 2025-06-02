# IAM Role for Moderate Workload Node Group
resource "aws_iam_role" "eks_node_group_moderate" {
  name = "${var.cluster-name}-node-group-moderate"

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

resource "aws_iam_role_policy_attachment" "eks_node_group_moderate_AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group_moderate.name
}

resource "aws_iam_role_policy_attachment" "eks_node_group_moderate_AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group_moderate.name
}

resource "aws_iam_role_policy_attachment" "eks_node_group_moderate_AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group_moderate.name
}

# Moderate Workload Node Group
resource "aws_eks_node_group" "moderate" {
  cluster_name    = aws_eks_cluster.eks_cluster.name
  node_group_name = "${var.cluster-name}-moderate"
  node_role_arn   = aws_iam_role.eks_node_group_moderate.arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    desired_size = var.desired_moderate_nodes
    min_size     = var.min_moderate_nodes
    max_size     = var.max_moderate_nodes
  }

  labels = {
    role = "moderate"
  }
  tags = {
    "Name" = "${var.cluster-name}-moderate-nodes"
    "k8s.io/cluster-autoscaler/enabled" : "true"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.eks_cluster.name}" : "owned"
  }

  instance_types = var.moderate_instance_types
  capacity_type  = "ON_DEMAND"

  lifecycle {
    ignore_changes = [scaling_config[0].desired_size]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_group_moderate_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.eks_node_group_moderate_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.eks_node_group_moderate_AmazonEC2ContainerRegistryReadOnly,
  ]
}

# IAM Role for Small Workload Node Group
resource "aws_iam_role" "eks_node_group_small" {
  name = "${var.cluster-name}-node-group-small"

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

resource "aws_iam_role_policy_attachment" "eks_node_group_small_AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group_small.name
}

resource "aws_iam_role_policy_attachment" "eks_node_group_small_AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group_small.name
}

resource "aws_iam_role_policy_attachment" "eks_node_group_small_AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group_small.name
}

# Small Workload Node Group
resource "aws_eks_node_group" "small" {
  cluster_name    = aws_eks_cluster.eks_cluster.name
  node_group_name = "${var.cluster-name}-small"
  node_role_arn   = aws_iam_role.eks_node_group_small.arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    desired_size = var.desired_small_nodes
    min_size     = var.min_small_nodes
    max_size     = var.max_small_nodes
  }

  labels = {
    role = "small"
  }
  tags = {
    "Name" = "${var.cluster-name}-small-nodes"
    "k8s.io/cluster-autoscaler/enabled" : "true"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.eks_cluster.name}" : "owned"
  }

  instance_types = var.small_instance_types
  capacity_type  = "ON_DEMAND"

  lifecycle {
    ignore_changes = [scaling_config[0].desired_size]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_group_small_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.eks_node_group_small_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.eks_node_group_small_AmazonEC2ContainerRegistryReadOnly,
  ]
}

# IAM Role for Spot Node Group (existing)
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

# Spot Node Group (existing)
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
    "k8s.io/cluster-autoscaler/enabled" : "true"
    "k8s.io/cluster-autoscaler/${aws_eks_cluster.eks_cluster.name}" : "owned"
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






# resource "aws_iam_role" "eks_node_group_general" {
#   name = "${var.cluster-name}-node-group-general"

#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Principal = {
#           Service = "ec2.amazonaws.com"
#         }
#         Action = "sts:AssumeRole"
#       },
#     ]
#   })
# }

# resource "aws_iam_role_policy_attachment" "eks_node_group_general_AmazonEKSWorkerNodePolicy" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
#   role       = aws_iam_role.eks_node_group_general.name
# }

# resource "aws_iam_role_policy_attachment" "eks_node_group_general_AmazonEKS_CNI_Policy" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
#   role       = aws_iam_role.eks_node_group_general.name
# }

# resource "aws_iam_role_policy_attachment" "eks_node_group_general_AmazonEC2ContainerRegistryReadOnly" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
#   role       = aws_iam_role.eks_node_group_general.name
# }

# resource "aws_eks_node_group" "general" {
#   cluster_name    = aws_eks_cluster.eks_cluster.name
#   node_group_name = "${var.cluster-name}-general"
#   node_role_arn   = aws_iam_role.eks_node_group_general.arn
#   subnet_ids      = var.private_subnet_ids

#   scaling_config {
#     desired_size = var.desired_general_nodes
#     min_size     = var.min_general_nodes
#     max_size     = var.max_general_nodes
#   }

#   labels = {
#     role = "general"
#   }
#   tags = {
#     "Name" = "${var.cluster-name}-general-nodes"
#     "k8s.io/cluster-autoscaler/enabled" : "true"
#     "k8s.io/cluster-autoscaler/${aws_eks_cluster.eks_cluster.name}" : "owned"
#   }

#   instance_types = var.general_instance_types
#   capacity_type  = "ON_DEMAND"

#   lifecycle {
#     ignore_changes = [scaling_config[0].desired_size]
#   }

#   depends_on = [
#     aws_iam_role_policy_attachment.eks_node_group_general_AmazonEKSWorkerNodePolicy,
#     aws_iam_role_policy_attachment.eks_node_group_general_AmazonEKS_CNI_Policy,
#     aws_iam_role_policy_attachment.eks_node_group_general_AmazonEC2ContainerRegistryReadOnly,
#   ]

# }

# resource "aws_iam_role" "eks_node_group_spot" {
#   name = "${var.cluster-name}-node-group-spot"

#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Principal = {
#           Service = "ec2.amazonaws.com"
#         }
#         Action = "sts:AssumeRole"
#       },
#     ]
#   })
# }

# resource "aws_iam_role_policy_attachment" "eks_node_group_spot_AmazonEKSWorkerNodePolicy" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
#   role       = aws_iam_role.eks_node_group_spot.name
# }

# resource "aws_iam_role_policy_attachment" "eks_node_group_spot_AmazonEKS_CNI_Policy" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
#   role       = aws_iam_role.eks_node_group_spot.name
# }

# resource "aws_iam_role_policy_attachment" "eks_node_group_spot_AmazonEC2ContainerRegistryReadOnly" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
#   role       = aws_iam_role.eks_node_group_spot.name
# }

# resource "aws_eks_node_group" "spot" {
#   cluster_name    = aws_eks_cluster.eks_cluster.name
#   node_group_name = "${var.cluster-name}-spot"
#   node_role_arn   = aws_iam_role.eks_node_group_spot.arn
#   subnet_ids      = var.private_subnet_ids

#   scaling_config {
#     desired_size = var.desired_spot_nodes
#     min_size     = var.min_spot_nodes
#     max_size     = var.max_spot_nodes
#   }

#   labels = {
#     role = "spot"
#   }
#   tags = {
#     "Name" = "${var.cluster-name}-spot-nodes"
#     "k8s.io/cluster-autoscaler/enabled" : "true"
#     "k8s.io/cluster-autoscaler/${aws_eks_cluster.eks_cluster.name}" : "owned"
#   }

#   taint {
#     key    = "market"
#     value  = "spot"
#     effect = "NO_SCHEDULE"
#   }

#   instance_types = var.spot_instance_types
#   capacity_type  = "SPOT"

#   lifecycle {
#     ignore_changes = [scaling_config[0].desired_size]
#   }

#   depends_on = [
#     aws_iam_role_policy_attachment.eks_node_group_spot_AmazonEKSWorkerNodePolicy,
#     aws_iam_role_policy_attachment.eks_node_group_spot_AmazonEKS_CNI_Policy,
#     aws_iam_role_policy_attachment.eks_node_group_spot_AmazonEC2ContainerRegistryReadOnly,
#   ]
# }

