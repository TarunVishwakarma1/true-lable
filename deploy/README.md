# Deploying the API to a droplet

nginx terminates TLS for `api.truelabel.fun` and proxies to the binary on
`127.0.0.1:8080`, which systemd keeps running.

```
firewall                →  22, 80, 443 only
nginx (TLS, edge caps)  →  127.0.0.1:8080
systemd                 →  /usr/local/bin/truelabel-backend
```

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

The service logs an error at boot if it detects either mistake.

## Steps

```bash
# Build for the droplet (Debian/Ubuntu, x86_64)
cargo build --release --target x86_64-unknown-linux-gnu

# On the droplet
sudo useradd --system --no-create-home --shell /usr/sbin/nologin truelabel
sudo install -m 0755 truelabel-backend /usr/local/bin/
sudo install -d -m 0750 -o root -g truelabel /etc/truelabel
sudo install -m 0640 -o root -g truelabel backend.env /etc/truelabel/backend.env
sudo install -m 0644 truelabel-backend.service /etc/systemd/system/

sudo cp nginx-api.truelabel.fun.conf /etc/nginx/sites-available/api.truelabel.fun
sudo ln -s /etc/nginx/sites-available/api.truelabel.fun /etc/nginx/sites-enabled/
# add the two limit zones to the http{} block first, then
sudo nginx -t && sudo systemctl reload nginx

sudo systemctl daemon-reload
sudo systemctl enable --now truelabel-backend
```

Migrations run automatically at boot, so the database role needs `CREATE`
rights and must be able to `CREATE EXTENSION pg_trgm` the first time.

## Checking it worked

```bash
# Loopback only: the first answers, the second must time out.
curl -s localhost:8080/health
curl -s --max-time 5 http://<droplet-ip>:8080/health

# Through nginx, with the headers the app sets.
curl -sI https://api.truelabel.fun/health | grep -Ei 'cache-control|strict-transport|x-frame'

# Real client addresses are reaching the app.
journalctl -u truelabel-backend -f | grep -i 'rate limit'
```

If a rate-limit warning ever names `127.0.0.1` as the subject, the hop count
is wrong and every user is sharing one bucket.

## Postgres and Redis

Both should listen on loopback only — `listen_addresses = 'localhost'` and
`bind 127.0.0.1`. They hold every profile and every device-token hash, and
neither speaks TLS in this setup, so nothing but the API should be able to
open a socket to them.
