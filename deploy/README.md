# Deploying the API to a plain VM (EC2 or a DO droplet)

nginx terminates TLS and proxies to the backend binary on `127.0.0.1:8080`,
which systemd keeps running. Postgres and Redis are external managed
services (Neon, Upstash) — nothing to run or firewall on this box besides
the API itself.

```
firewall                →  22, 80, 443 only
nginx (TLS, edge caps)  →  127.0.0.1:8080
systemd                 →  /usr/local/bin/truelabel-backend
```

Everything below is provider-agnostic on purpose — the files in this
directory (`nginx-*.conf`, `truelabel-backend.service`, `backend.env.example`)
don't know or care whether the box is an EC2 instance or a DO droplet, only
that it's a Debian/Ubuntu VM they can SSH into. The only genuinely
provider-specific part is provisioning the VM and opening its firewall,
covered separately below for each.

> This is the low-cost, single-machine alternative to the Kubernetes path in
> [`docs/deployment.mdx`](../web/apps/docs/content/docs/deployment.mdx) —
> reach for this when traffic doesn't justify a cluster; reach for that when
> it does. Both read the exact same `DATABASE_URL`/`REDIS_URL`, so nothing
> about the app changes between them.

## Provisioning the VM

Either provider works identically from here on — pick one.

**Use Ubuntu 24.04 LTS specifically, not 22.04.** The binary (below) is
built against Debian bookworm's glibc (2.36), which is *newer* than 22.04's
glibc (2.35, older) but older than 24.04's (2.39) — glibc only runs binaries
built against an equal or older version, so 22.04 would fail to even start
the binary. This isn't a concern on the Kubernetes path, since that image
carries its own glibc; it only matters here because the binary runs
directly on the host's.

<details>
<summary><strong>DigitalOcean droplet</strong></summary>

```bash
doctl compute droplet create truelabel-api \
  --region blr1 \
  --size s-1vcpu-1gb \
  --image ubuntu-24-04-x64 \
  --ssh-keys <your-ssh-key-fingerprint> \
  --wait

# Firewall: 22/80/443 in, everything out. Get the droplet id from the
# create command's output first.
doctl compute firewall create \
  --name truelabel-api-fw \
  --droplet-ids <droplet-id> \
  --inbound-rules "protocol:tcp,ports:22,address:0.0.0.0/0,address:::/0 protocol:tcp,ports:80,address:0.0.0.0/0,address:::/0 protocol:tcp,ports:443,address:0.0.0.0/0,address:::/0" \
  --outbound-rules "protocol:tcp,ports:all,address:0.0.0.0/0,address:::/0 protocol:udp,ports:all,address:0.0.0.0/0,address:::/0"
```

`s-1vcpu-1gb` (~$6/mo) is plenty for a single-instance API behind Redis
caching — bump to `s-1vcpu-2gb` if `journalctl` shows OOM kills.

</details>

<details>
<summary><strong>AWS EC2</strong></summary>

```bash
# Security group first, so its id is ready for run-instances.
aws ec2 create-security-group --group-name truelabel-api-sg \
  --description "TrueLabel API: 22/80/443 only"
aws ec2 authorize-security-group-ingress --group-name truelabel-api-sg --protocol tcp --port 22  --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name truelabel-api-sg --protocol tcp --port 80  --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name truelabel-api-sg --protocol tcp --port 443 --cidr 0.0.0.0/0

# Look up the current Ubuntu 24.04 LTS AMI for your region — it differs per
# region and Canonical publishes new ones regularly, so don't hardcode one:
aws ec2 describe-images --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*" "Name=state,Values=available" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text

aws ec2 run-instances \
  --image-id <ami-from-above> \
  --instance-type t3.micro \
  --key-name <your-key-pair-name> \
  --security-groups truelabel-api-sg \
  --count 1
```

`t3.micro` is the free-tier-eligible size and plenty for this workload —
same reasoning as the droplet size above.

</details>

Either way: note the VM's public IP once it's up — DNS and the nginx config
both need it.

## Point DNS at it

An `A` record for `api.truelabel.fun` (or whatever host this API answers
on) → the VM's public IP. Give it a few minutes to propagate before the
certbot step below, which needs the domain to actually resolve here.

## Building the binary

Cross-compiling `x86_64-unknown-linux-gnu` directly from macOS needs a
cross-linker and glibc headers that aren't there by default and isn't worth
fighting — `backend/Dockerfile` already produces a correct Linux binary (it's
the same build the Kubernetes path ships), so pull the binary out of that
image instead of building one separately:

```bash
docker build --target builder -t truelabel-backend-builder backend
docker create --name extract-tmp truelabel-backend-builder
docker cp extract-tmp:/app/target/release/truelabel-backend ./truelabel-backend
docker rm extract-tmp

scp truelabel-backend <user>@<vm-ip>:~/
```

## TLS, before nginx can fully start

The full nginx config's `443` server block references certificate files
that don't exist yet — `nginx -t` will refuse to even validate it, let
alone start, until they do. So the cert has to come first, via a minimal
config that only serves the ACME challenge:

```bash
sudo apt update && sudo apt install -y nginx certbot
sudo mkdir -p /var/www/certbot

# A minimal port-80-only site, just enough to prove domain ownership.
cat <<'EOF' | sudo tee /etc/nginx/sites-available/api.truelabel.fun
server {
    listen 80;
    listen [::]:80;
    server_name api.truelabel.fun;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 404; }
}
EOF
sudo ln -s /etc/nginx/sites-available/api.truelabel.fun /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo certbot certonly --webroot -w /var/www/certbot -d api.truelabel.fun
```

Webroot mode, not `certbot --nginx` or `--standalone`: this repo's nginx
config is hand-authored, not certbot-managed, and webroot means renewal
(certbot's own timer handles this automatically) never needs to stop nginx
— it just re-proves ownership through the same location block, live traffic
uninterrupted. That's also why the real config below already has that exact
`/.well-known/acme-challenge/` location wired in.

Now the real config, which has valid cert paths to reference:

```bash
sudo cp nginx-api.truelabel.fun.conf /etc/nginx/sites-available/api.truelabel.fun
# add the two limit zones (limit_req_zone/limit_conn_zone — see the file's
# own header comment) to the http{} block in /etc/nginx/nginx.conf first
sudo nginx -t && sudo systemctl reload nginx
```

## Deploying the binary

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin truelabel
sudo install -m 0755 truelabel-backend /usr/local/bin/
sudo install -d -m 0750 -o root -g truelabel /etc/truelabel
sudo install -m 0640 -o root -g truelabel backend.env /etc/truelabel/backend.env
sudo install -m 0644 truelabel-backend.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable --now truelabel-backend
```

Migrations run automatically at boot, so the Neon role the connection
string authenticates as needs `CREATE` rights and must be able to
`CREATE EXTENSION pg_trgm` the first time.

## Registering the GitHub webhook (optional)

Only needed if `GITHUB_WEBHOOK_SECRET` is set in `backend.env` — skip this
if it's commented out. This step is entirely on GitHub's side; the backend
already has the endpoint (`POST /api/v1/webhooks/github`) and refuses
cleanly if the secret's absent, so nothing breaks by skipping it.

```bash
openssl rand -hex 32   # this becomes GITHUB_WEBHOOK_SECRET on the VM
```

Put that value in `backend.env` (see above), redeploy/restart the service
so it picks it up, then on GitHub: repo **Settings → Webhooks → Add
webhook** — Payload URL `https://api.truelabel.fun/api/v1/webhooks/github`,
content type `application/json`, secret = the same value, subscribed to
**Issues** only (not "send everything," which would also fire `ping` and
every other event type this endpoint doesn't care about). GitHub sends a
`ping` delivery immediately on save — the endpoint checks the HMAC
signature first (so the secret still has to match), then sees this isn't
an `issues` event and answers `200` with no further parsing. Check
**Recent Deliveries** on the webhook's page to confirm it landed as a
green check, not a red X. Closing or reopening an issue linked to a crash
report should then sync its status back within seconds.

## The two settings that matter

Everything else here is convenience. These two are not.

**`SERVER_HOST=127.0.0.1`**, not `0.0.0.0`. The default binds every interface,
which leaves port 8080 answering the open internet beside nginx — without TLS
and, worse, without the header nginx adds. A caller reaching it directly
writes `X-Forwarded-For` themselves and so picks their own rate-limit bucket
on every request, at which point the limits mean nothing. Binding to loopback
makes that unreachable. A firewall on 8080 is a good second belt but not a
substitute, because a container or VPN peer added later is already inside it.

**`TRUSTED_PROXY_HOPS=1`**. Behind a proxy every request arrives *from the
proxy*, so with this left at `0` the peer address is `127.0.0.1` for everyone
and the whole internet shares a single bucket. The global backstop is 3,000
requests an hour, so the API would start returning `429` to everybody within
minutes of real traffic. Count only hops that append to the header: nginx
alone is `1`, a CDN in front of it makes `2`. **Setting it higher than the
truth is worse than leaving it at zero**, because the surplus entries are the
caller's own.

The service logs an error at boot if it detects either mistake — and here,
unlike the Kubernetes path, that check is checking something real: this box
really is the only thing standing between the process and the open internet,
so leave `TRUST_CONTAINER_NETWORK` out of `backend.env` entirely (it exists
only to silence that same check inside a k8s pod, where a Service — not the
process's own bind address — is what actually decides reachability; see
`backend/.env.example` for the full explanation).

## Checking it worked

```bash
# Loopback only: the first answers, the second must time out.
curl -s localhost:8080/health
curl -s --max-time 5 http://<vm-ip>:8080/health

# Through nginx, with the headers the app sets.
curl -sI https://api.truelabel.fun/health | grep -Ei 'cache-control|strict-transport|x-frame'

# Real client addresses are reaching the app.
journalctl -u truelabel-backend -f | grep -i 'rate limit'
```

If a rate-limit warning ever names `127.0.0.1` as the subject, the hop count
is wrong and every user is sharing one bucket.

## Neon and Upstash

Both are reached over the network with their own TLS (Neon requires
`sslmode=require`; Upstash Redis uses `rediss://`, which the backend's
`redis` crate already supports) — nothing to firewall to loopback on this
box the way a self-hosted Postgres/Redis would need. Migrating either to
something self-hosted later — on this same box, or elsewhere — is
`DATABASE_URL`/`REDIS_URL` changing in `backend.env` and nothing else; the
app never reads anything provider-specific.
