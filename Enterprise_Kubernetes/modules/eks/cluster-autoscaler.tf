module "cluster_autoscaler" {
  source = "terraform-iaac/cluster-autoscaler/kubernetes"
  version = "1.0.1" # Example version, check the registry for latest
  cluster_name = aws_eks_cluster.eks_cluster.name
  aws_region   = var.aws-region # Or use a variable
  aws_role_arn = aws_iam_role.cluster_autoscaler_role.arn
  cloud_provider = "aws"
#   service_monitor_enable = true
#   metrics_namespace      = "monitoring-prometheus"
}


data "aws_iam_policy_document" "cluster_autoscaler_policy_document" {
  statement {
    effect = "Allow"
    actions = [
      "autoscaling:SetDesiredCapacity",
      "autoscaling:TerminateInstanceInAutoScalingGroup"
    ]
    resources = ["*"] # Resource is set to "*" but restricted by conditions below
    condition {
      test = "StringEquals"
      values = [
        "true"
      ]
      variable = "aws:ResourceTag/k8s.io/cluster-autoscaler/enabled"
    }
    condition {
      test = "StringEquals"
      values = [
        "owned"
      ]
      variable = "aws:ResourceTag/k8s.io/cluster-autoscaler/${local.cluster-name}" # Or aws_eks_cluster.eks_cluster.name
    }
  }

  statement {
    effect = "Allow"
    actions = [
      "autoscaling:DescribeAutoScalingGroups",
      "autoscaling:DescribeAutoScalingInstances",
      "autoscaling:DescribeLaunchConfigurations",
      "autoscaling:DescribeScalingActivities",
      "autoscaling:DescribeTags",
      "ec2:DescribeImages",
      "ec2:DescribeInstanceTypes",
      "ec2:DescribeLaunchTemplateVersions",
      "ec2:GetInstanceTypesFromInstanceRequirements", # Often useful/needed
      "eks:DescribeNodegroup" # Useful/needed for managed node groups
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "cluster_autoscaler_policy" {
  name   = "${local.cluster-name}-cluster-autoscaler-policy" # Example naming
  policy = data.aws_iam_policy_document.cluster_autoscaler_policy_document.json
}
# Create the IAM role for Cluster Autoscaler
data "aws_iam_policy_document" "cluster_autoscaler_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.oidc.arn]
    }
    actions = ["sts:AssumeRoleWithWebIdentity"]
    condition {
      test     = "StringEquals"
      variable = "${aws_iam_openid_connect_provider.oidc.url}:sub"
      # The service account name used by the module for Cluster Autoscaler
      values   = ["system:serviceaccount:cluster-autoscaler:cluster-autoscaler"]
    }
    condition {
      test     = "StringEquals"
       variable = "${aws_iam_openid_connect_provider.oidc.url}:aud"
       values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cluster_autoscaler_role" {
  name               = "${local.cluster-name}-cluster-autoscaler-role" # Example naming
  assume_role_policy = data.aws_iam_policy_document.cluster_autoscaler_assume_role.json
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler_policy_attachment" {
  role       = aws_iam_role.cluster_autoscaler_role.name
  policy_arn = aws_iam_policy.cluster_autoscaler_policy.arn
}