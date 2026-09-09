output "cluster_name" {
  value = digitalocean_kubernetes_cluster.main.name
}

output "cluster_endpoint" {
  value = digitalocean_kubernetes_cluster.main.endpoint
}

output "region" {
  value = var.region
}

output "update_kubeconfig_command" {
  value = "doctl kubernetes cluster kubeconfig save ${digitalocean_kubernetes_cluster.main.name}"
}
