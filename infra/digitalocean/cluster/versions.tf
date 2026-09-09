# Local state, deliberately — unlike infra/aws (which has bootstrap/ for
# S3+DynamoDB remote state), this is a solo-operator project applying one
# cloud at a time. ponytail: add a remote backend (DO Spaces or Terraform
# Cloud) if more than one person ever runs `terraform apply` here.
terraform {
  required_version = ">= 1.9"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}
