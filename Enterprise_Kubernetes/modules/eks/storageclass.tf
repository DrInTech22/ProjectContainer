resource "kubernetes_storage_class" "gp3" {
  metadata {
    name = "gp3"
    annotations = {
      "storageclass.kubernetes.io/is-default-class" = "true"
    }
  }

  storage_provisioner = "ebs.csi.aws.com"

  parameters = {
    type      = "gp3"
    encrypted = "true"
  }

  volume_binding_mode    = "WaitForFirstConsumer"
  allow_volume_expansion = true
}

resource "null_resource" "disable_gp2_default" {
  provisioner "local-exec" {
    command = <<EOT
      kubectl patch storageclass gp2 -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'
    EOT
  }

  depends_on = [kubernetes_storage_class.gp3]
}
