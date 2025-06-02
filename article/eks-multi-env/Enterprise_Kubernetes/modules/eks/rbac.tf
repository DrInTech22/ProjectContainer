resource "kubernetes_namespace" "dev-team" {
  metadata {
    name = "dev-team"

    labels = {
      managed_by = "terraform"
    }
  }
}

resource "kubernetes_role" "dev-team-role" {
  metadata {
    name      = "dev-team-role"
    namespace = "dev-team"
  }

  rule {
    api_groups = ["*"]
    resources  = ["pods", "services", "deployment", "configmap", "secret"]
    verbs      = ["get", "list", "describe", "watch"]
  }
}

resource "kubernetes_role_binding" "dev-team-role-binding" {
  metadata {
    name      = "dev-team-role-binding"
    namespace = "dev-team"
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = "dev-team-role"
  }
  subject {
    kind      = "Group"
    name      = "dev-team"
    api_group = "rbac.authorization.k8s.io"
  }
}

resource "kubernetes_cluster_role_binding" "admin-cluster-role-binding" {
  metadata {
    name = "admin-cluster-role-binding"
  }

  role_ref {
    kind      = "ClusterRole"
    name      = "cluster-admin"
    api_group = "rbac.authorization.k8s.io"
  }

  subject {
    kind      = "Group"
    name      = "my-admin"
    api_group = "rbac.authorization.k8s.io"
  }
}



#############################################
#   We used the default admin ClusterRole   #
#############################################

# resource "kubernetes_cluster_role" "cluster_viewer" {
#   metadata {
#     name = "admin-cluster-role"
#   }

#   rule {
#     api_groups = [""]
#     resources  = ["*"]
#     verbs      = ["get", "list", "watch", "describe"]
#   }

#   rule {
#     api_groups = [""]
#     resources  = ["pods/portforward"]
#     verbs      = ["get", "list", "create"]
#   }

#   rule {
#     api_groups = ["apiextensions.k8s.io"]
#     resources  = ["customresourcedefinitions"]
#     verbs      = ["get", "list", "describe"]
#   }

#   rule {
#     api_groups = [""]
#     resources  = ["pods/exec", "pods/attach"]
#     verbs      = ["get", "list", "create"]
#   }

#   rule {
#     api_groups = [""]
#     resources  = ["pods"]
#     verbs      = ["get", "list", "create", "describe", "delete", "update"]
#   }
# }
