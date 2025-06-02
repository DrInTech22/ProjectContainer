resource "helm_release" "my_vcluster" {
  name             = "team-x-vcluster"
  namespace        = "team-x"
  create_namespace = true

  repository       = "https://charts.loft.sh"
  chart            = "vcluster"

  # If you didn't create a vcluster.yaml, remove the values section.
  values = [
    file("${path.module}/../../manifests/team-x.yaml")
  ]
}