module "eks-metrics-server" {
  source  = "DNXLabs/eks-metrics-server/aws"
  version = "1.0.0"
  helm_chart_repo = "https://kubernetes-sigs.github.io/metrics-server/"
  helm_chart_name = "metrics-server"
  helm_chart_version = "3.12.2"
}