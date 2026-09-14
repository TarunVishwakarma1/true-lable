# Infra

`digitalocean/` is what's live — see
[`docs/deployment.mdx`](../web/apps/docs/content/docs/deployment.mdx) for the
full setup. `aws/` was an earlier option, scaffolded but never deployed to;
kept only as reference, not wired into CI/CD.

```bash
cd infra/digitalocean/cluster
cp terraform.tfvars.example terraform.tfvars   # fill in do_token, gitignored
terraform init
terraform apply
doctl kubernetes cluster kubeconfig save true-label
```

Local state, deliberately (see `versions.tf`'s comment) — this is a
solo-operator project applying one cloud at a time.
