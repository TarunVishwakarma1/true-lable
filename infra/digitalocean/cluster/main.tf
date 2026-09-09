data "digitalocean_kubernetes_versions" "current" {
  version_prefix = "${var.cluster_version_prefix}."
}

resource "digitalocean_vpc" "main" {
  name   = "${var.cluster_name}-vpc"
  region = var.region
}

resource "digitalocean_kubernetes_cluster" "main" {
  name     = var.cluster_name
  region   = var.region
  version  = data.digitalocean_kubernetes_versions.current.latest_version
  vpc_uuid = digitalocean_vpc.main.id

  # DOKS ships the do-block-storage CSI driver + a default StorageClass and
  # a working cloud-controller-manager for LoadBalancer Services out of the
  # box — no EBS-CSI/IRSA-style setup needed here, unlike infra/aws.
  node_pool {
    name       = "default"
    size       = var.node_size
    auto_scale = true
    min_nodes  = var.node_min_size
    max_nodes  = var.node_max_size
    node_count = var.node_desired_size
  }
}
