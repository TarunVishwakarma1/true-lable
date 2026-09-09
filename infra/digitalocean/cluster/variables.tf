variable "do_token" {
  type        = string
  sensitive   = true
  description = "DigitalOcean API token (Settings → API → Generate New Token)."
}

variable "region" {
  type    = string
  default = "nyc1"
}

variable "cluster_name" {
  type    = string
  default = "true-label"
}

variable "cluster_version_prefix" {
  type        = string
  default     = "1.31"
  description = "DOKS retires exact patch versions over time — this resolves to whatever patch DO currently supports for this minor version (see main.tf), instead of hardcoding one that goes stale."
}

variable "node_size" {
  type        = string
  default     = "s-2vcpu-4gb"
  description = "~$24/mo per node. DOKS's control plane itself is free, unlike EKS's flat $73/mo."
}

variable "node_min_size" {
  type    = number
  default = 1
}

variable "node_max_size" {
  type    = number
  default = 3
}

variable "node_desired_size" {
  type    = number
  default = 2
}
