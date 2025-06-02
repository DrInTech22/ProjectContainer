resource "helm_release" "nginx" {
  name = "nginx"

  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "kube-system"
  create_namespace = true
  version          = "4.10.1"

  values = [file("${path.module}/../../manifests/ingress-nginx.yml")]

#   depends_on = [helm_release.aws_load_balancer_controller]
}