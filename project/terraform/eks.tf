module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "18.29.0"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  enable_irsa = true

  tags = {
    Environment = "dev"
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
  subnet_ids      = module.vpc.private_subnets

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
    ignore_changes = [
      scaling_config[0].desired_size,
      scaling_config[0].min_size,
      scaling_config[0].max_size
    ]
  }
}

resource "aws_iam_role" "eks_node_group_spot" {
  name = "eks-node-group-spot"

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
  cluster_name    = module.eks.cluster_id
  node_group_name = "spot"
  node_role_arn   = aws_iam_role.eks_node_group_spot.arn
  subnet_ids      = module.vpc.private_subnets

  scaling_config {
    desired_size = 1
    min_size     = 1
    max_size     = 10
  }

  labels = {
    role = "spot"
  }

  taint {
    key    = "market"
    value  = "spot"
    effect = "NO_SCHEDULE"
  }

  instance_types = ["t3.micro"]
  capacity_type  = "SPOT"

  lifecycle {
    ignore_changes = [
      scaling_config[0].desired_size,
      scaling_config[0].min_size,
      scaling_config[0].max_size
    ]
  }
}

# https://github.com/terraform-aws-modules/terraform-aws-eks/issues/2009
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

# module "eks" {
#   source  = "terraform-aws-modules/eks/aws"
#   version = "18.29.0"

#   cluster_name    = var.cluster_name
#   cluster_version = var.cluster_version

#   cluster_endpoint_private_access = true
#   cluster_endpoint_public_access  = true

#   vpc_id     = module.vpc.vpc_id
#   subnet_ids = module.vpc.private_subnets

#   enable_irsa = true

#   eks_managed_node_group_defaults = {
#     disk_size = 50
#   }

#   eks_managed_node_groups = {
#     general = {
#       desired_size = 2
#       min_size     = 1
#       max_size     = 10

#       labels = {
#         role = "general"
#       }

#       instance_types = ["t2.small"]
#       capacity_type  = "ON_DEMAND"

#       lifecycle = {
#         ignore_changes = [desired_size]
#       }
#     }

#     spot = {
#       desired_size = 1
#       min_size     = 1
#       max_size     = 10

#       labels = {
#         role = "spot"
#       }

#       taints = [{
#         key    = "market"
#         value  = "spot"
#         effect = "NO_SCHEDULE"
#       }]

#       instance_types = ["t3.micro"]
#       capacity_type  = "SPOT"

#       lifecycle = {
#         ignore_changes = [desired_size]
#       }
#     }
#   }

#   manage_aws_auth_configmap = true
#   aws_auth_roles = [
#     {
#       rolearn  = module.eks_admins_iam_role.iam_role_arn
#       username = module.eks_admins_iam_role.iam_role_name
#       groups   = ["system:masters"]
#     },
#   ]

#   node_security_group_additional_rules = {
#     ingress_allow_access_from_control_plane = {
#       type                          = "ingress"
#       protocol                      = "tcp"
#       from_port                     = 9443
#       to_port                       = 9443
#       source_cluster_security_group = true
#       description                   = "Allow access from control plane to webhook port of AWS load balancer controller"
#     }
#     ingress_allow_access_from_control_plane_8443 = {
#     type                          = "ingress"
#     protocol                      = "tcp"
#     from_port                     = 8443
#     to_port                       = 8443
#     source_cluster_security_group = true
#     description                   = "Allow access from control plane to port 8443"
#     }

#     # Needed for nginx ingress controller
#     ingress_self_all = {
#       description = "Node to node all ports/protocols"
#       protocol    = "-1"
#       from_port   = 0
#       to_port     = 0
#       type        = "ingress"
#       self        = true
#     }
#     egress_all = {
#       description      = "Node all egress"
#       protocol         = "-1"
#       from_port        = 0
#       to_port          = 0
#       type             = "egress"
#       cidr_blocks      = ["0.0.0.0/0"]
#       ipv6_cidr_blocks = ["::/0"]
#     }
#   }
#   tags = {
#     Environment = "dev"
#   }
# }

# # https://github.com/terraform-aws-modules/terraform-aws-eks/issues/2009
# data "aws_eks_cluster" "default" {
#   name = module.eks.cluster_id
# }

# data "aws_eks_cluster_auth" "default" {
#   name = module.eks.cluster_id
# }

# provider "kubernetes" {
#   host                   = data.aws_eks_cluster.default.endpoint
#   cluster_ca_certificate = base64decode(data.aws_eks_cluster.default.certificate_authority[0].data)
#   # token                  = data.aws_eks_cluster_auth.default.token

#   exec {
#     api_version = "client.authentication.k8s.io/v1beta1"
#     args        = ["eks", "get-token", "--cluster-name", data.aws_eks_cluster.default.id]
#     command     = "aws"
#   }
# }

