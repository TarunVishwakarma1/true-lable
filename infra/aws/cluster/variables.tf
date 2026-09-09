variable "region" {
  type    = string
  default = "us-east-1"
}

variable "cluster_name" {
  type    = string
  default = "true-label"
}

variable "cluster_version" {
  type    = string
  default = "1.31"
}

variable "node_instance_type" {
  type        = string
  default     = "t3.medium"
  description = "Kept single-type and on-demand for the stateful (Postgres) node too — swap to spot only if you split stateful workloads onto a separate on-demand-only node group."
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

variable "github_repo" {
  type        = string
  default     = "TarunVishwakarma1/true-lable"
  description = "org/repo — scopes which GitHub Actions runs may assume the deploy IAM role."
}
