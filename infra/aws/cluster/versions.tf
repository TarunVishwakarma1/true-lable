terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.33"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Bucket/table come from infra/aws/bootstrap. Values filled in at
  # `terraform init -backend-config=backend.hcl` time — see backend.hcl.example.
  backend "s3" {}
}

provider "aws" {
  region = var.region
}
