# TrueLabel Performance & Scalability Architecture Guide

> [!NOTE]
> This guide outlines architecture, database, caching, and client-side optimization strategies to scale **TrueLabel** from early-stage traffic to **10,000 active mobile users** and **5,000 concurrent dashboard users**, ensuring high resilience, sub-100ms read latency, and zero data loss during peak scanning bursts.
>
> *(Per project requirements, this document contains purely architectural recommendations, patterns, and configuration strategies without code modifications.)*

---

## 1. Backend (Rust / Axum) Optimizations

### Database Connection Pool
* **Current Bottleneck:** `MAX_DB_CONNECTIONS=10` in [docker-compose.yml](file:///Users/tarunvishwakarma/Documents/MacAntigravity/personal-proj/true-lable/docker-compose.yml) and no `min_connections` configured in [postgres.rs](file:///Users/tarunvishwakarma/Documents/MacAntigravity/personal-proj/true-lable/backend/src/db/postgres.rs).
* **Pool Sizing:** Scale to **50–100** `max_connections` per backend instance. With 5,000 concurrent dashboard users and 5,000 active mobile users, 10 connections create an immediate queue bottleneck behind `acquire_timeout(30s)`.
* **Warm Connections:** Set `min_connections` to **10–20** so sudden traffic spikes and cold-start requests do not incur TCP handshake, TLS negotiation, and Postgres authentication latency.
* **Connection Lifecycle:** Configure `idle_timeout` (e.g., 10 minutes) and `max_lifetime` (e.g., 30 minutes) to cleanly recycle idle connections before network firewalls or Postgres terminate them abruptly.

### Query-Level Optimizations
* **Consolidate Verification Round-Trips:**
  In [product_service.rs](file:///Users/tarunvishwakarma/Documents/MacAntigravity/personal-proj/true-lable/backend/src/services/product_service.rs), `verify_product()` executes 4 to 5 sequential database round-trips:
  1. `SELECT` product details.
  2. `INSERT` verification record.
  3. `UPDATE` increment verification count with `RETURNING`.
  4. Conditional `UPDATE` marking product as verified.
  5. Final `SELECT` re-reading updated state.
  * *Strategy:* Consolidate steps 2 through 5 into a single SQL transaction block or Common Table Expression (CTE). This reduces database round-trips from 5 to 2 (one read, one write), cutting endpoint latency under high concurrency from ~200ms+ down to sub-50ms.
* **Batch Lookup Counter Updates:**
  Currently, `bump_lookup()` invokes `tokio::spawn` to fire an individual `UPDATE` per product scan.
  * *Strategy:* Under 10,000 concurrent scans, individual fire-and-forget writes create severe row lock contention on popular barcodes. Buffer increments in Redis (`INCR`) or an in-memory accumulator and flush to Postgres periodically (every 5–10 seconds) using a single batched `UPDATE ... FROM unnest(...)`. This reduces database write IOPS by ~100x.
* **Anti-Join in `find_needs_verification()`:**
  The query uses a correlated subquery (`NOT EXISTS (SELECT 1 FROM verifications v JOIN products p2 ...)`) that executes row-by-row.
  * *Strategy:* Add a composite index on `verifications(device_id, product_id)` and rewrite the query to a `LEFT JOIN ... WHERE v.id IS NULL` pattern, allowing the Postgres query planner to use an efficient hash anti-join.
* **Trigram Index for Text Search:**
  In `query_products()`, `ILIKE '%term%'` forces a sequential scan across the table because leading wildcards cannot utilize B-tree indexes or standard trigram GIN indexes efficiently.
  * *Strategy:* Use the PostgreSQL trigram similarity operator (`product_name % $1` or strict word similarity) backed by the existing `pg_trgm` GIN index to achieve index scans instead of full-table scans.
* **Window Functions in Administrative Listings:**
  `list_admin()` evaluates the identical filter criteria twice — once to retrieve paginated records and once to calculate total count.
  * *Strategy:* Leverage the `COUNT(*) OVER()` window function within the primary query to retrieve total row count alongside results in a single round-trip.
* **User Profile & Contribution Stats:**
  In [user_service.rs](file:///Users/tarunvishwakarma/Documents/MacAntigravity/personal-proj/true-lable/backend/src/services/user_service.rs), `stats()` triggers multiple sequential `COUNT(*)` subqueries over verification and submission tables.
  * *Strategy:* Ensure indexes exist on foreign keys (`verifications(device_id)`, `ocr_submissions(device_id)`) or maintain pre-aggregated counters on the user record updated via asynchronous events.

### Caching Layer Enhancements
* **In-Process L1 Cache (Moka / Mini-Moka):**
  While [cache_service.rs](file:///Users/tarunvishwakarma/Documents/MacAntigravity/personal-proj/true-lable/backend/src/services/cache_service.rs) integrates Redis (L2), introducing a high-performance in-memory cache (e.g., the `moka` crate) in the backend pods absorbs repeated reads for top trending items. Eliminating Redis network hops for top keys cuts p99 latency to microseconds.
* **Redis Pipelining:**
  When checking for cached products and negative lookup markers (cache misses), pipeline both queries into a single network transmission rather than two sequential round-trips.
* **TTL Caching for User Profiles & Verification Queues:**
  Profile statistics and country-specific verification queues should be cached with short TTLs (30–60 seconds). These endpoints are frequently refreshed by active users but change incrementally.

### Rate Limiting at Scale
* **Device-Token Limiting:**
  The current global rate limiter in [routes/mod.rs](file:///Users/tarunvishwakarma/Documents/MacAntigravity/personal-proj/true-lable/backend/src/routes/mod.rs) uses client IP addresses. Under carrier-grade NAT (CGNAT) or corporate Wi-Fi, thousands of distinct mobile users share a single IP address.
  * *Strategy:* Apply IP-based rate limiting only to unauthenticated routes (e.g., login, register). For all authenticated routes, key rate-limit buckets by the authenticated device token or user ID.

### Horizontal Scaling & Pod Disruption
* **Autoscaling:** Increase `maxReplicas` from 6 to 12–15 in [hpa.yaml](file:///Users/tarunvishwakarma/Documents/MacAntigravity/personal-proj/true-lable/k8s/base/backend/hpa.yaml).
* **Multi-Metric Scaling:** Scale on both CPU and memory, and incorporate Prometheus request-per-second (RPS) metrics to react instantly before CPU saturation occurs.
* **Availability:** Define a `PodDisruptionBudget` (`minAvailable: 50%`) to guarantee zero downtime during rolling upgrades.

---

## 2. Database (PostgreSQL) Resilience at 10K Users

### High Availability Architecture
* **Current Risk:** The [postgres deployment](file:///Users/tarunvishwakarma/Documents/MacAntigravity/personal-proj/true-lable/k8s/base/postgres/deployment.yaml) runs as a single K8s pod with `strategy: Recreate`. Any node crash or pod restart causes complete system downtime.
* **Target Topology:**
  * **Option A (Managed Cloud DB):** Migrate to AWS RDS, Google Cloud SQL, or DigitalOcean Managed PostgreSQL for automated multi-AZ failover, read replicas, and continuous WAL archiving.
  * **Option B (Kubernetes Operator):** Deploy the **CloudNativePG** operator to orchestrate high-availability PostgreSQL with automated streaming replication, primary election, and failover within the cluster.

### Read / Write Splitting
* Dashboard workflows (inspecting products, reviewing audit logs, browsing crash reports) are read-heavy.
* Route all dashboard analytical queries to a dedicated **Read Replica**, reserving the primary instance exclusively for write transactions (scans, OCR submissions, verifications).
* Split the backend `PgPool` into write and read handles to cleanly direct traffic at the service layer.

### Connection Pooling with PgBouncer
> [!IMPORTANT]
> PgBouncer is the single most critical infrastructure component for scaling to 10K concurrent users.
* Without PgBouncer, 10–15 backend replicas with 50–100 connections each would overwhelm PostgreSQL with 500–1,500 active connection backends, degrading query throughput.
* Deploy PgBouncer in **Transaction Pooling Mode** between Axum and PostgreSQL. Thousands of backend client sessions will be multiplexed into 100–200 persistent database connections.

### Missing Indexes Matrix
Ensure the following indexes are applied across migrations:

| Table | Index Columns | Query / Purpose |
| :--- | :--- | :--- |
| `products` | `(country, category, barcode)` | Optimizes `find_alternatives()` multi-column filter |
| `products` | `(country, verification_count) WHERE verification_count < 3` | Partial index for `find_needs_verification()` queue |
| `products` | `(country, lookup_count DESC, verification_count DESC)` | Index-only scan for `trending()` feed |
| `verifications` | `(device_id, product_id)` | Speeds up unverified product anti-joins |
| `dashboard_notifications` | `(user_id, is_read, created_at DESC)` | Fast inbox pagination & unread count badge |
| `ocr_submissions` | `(device_id)` | Eliminates sequential scan in `stats()` calculation |

### Engine Parameter Tuning
For production database nodes (minimum 4 vCPU, 8–16 GB RAM recommended for 10K users):
* `shared_buffers = 25% of total RAM` (caches frequently read index and table blocks)
* `effective_cache_size = 75% of total RAM` (guides query planner cost estimates)
* `work_mem = 16MB – 32MB` (prevents disk spills during sorts and hash joins)
* `random_page_cost = 1.1` (tuned for NVMe / SSD disk storage)
* Enable `pg_stat_statements` to monitor query latency percentiles in real time.

---

## 3. Redis Resilience

* **High Availability Failover:** Replace single-instance Redis in [redis deployment](file:///Users/tarunvishwakarma/Documents/MacAntigravity/personal-proj/true-lable/k8s/base/redis/deployment.yaml) with **Redis Sentinel** (1 primary, 2 replicas) or Redis Cluster to avoid a single point of failure.
* **Data Durability:** Enable Append-Only File (`appendonly yes` with `appendfsync everysec`) so restart events do not flush cached sessions and rate-limiting history.
* **Memory Management:** Set `maxmemory` and configure `maxmemory-policy allkeys-lru` to evict cold keys automatically instead of throwing out-of-memory errors.
* **Local Failover Rate Limiter:** While the current Redis limiter fails open, a prolonged Redis outage removes rate protection. Configure Axum to fall back to an in-memory token bucket (via the `governor` crate) if Redis becomes unreachable.

---

## 4. Dashboard (Next.js) Optimizations for 5K Concurrent Users

### Notification Delivery: SSE / WebSockets vs. Polling
* **Problem:** 5,000 active dashboard admins polling an endpoint every 5 seconds generates 1,000 requests per second solely for unread notification checks.
* **Solution:** Replace client polling with **Server-Sent Events (SSE)** or WebSockets. A single long-lived lightweight connection delivers updates only when new notifications arrive.
* **Fallback Polling:** If polling is maintained, increase the interval to 30–60 seconds and implement `ETag` / `304 Not Modified` headers so unchanged data consumes minimal CPU and zero bandwidth.

### Client-Side Data Fetching & Caching
* Integrate **SWR** or **TanStack Query** (React Query) configured with `stale-while-revalidate` semantics. Navigating between dashboard tabs instantly renders cached data while synchronizing in the background.
* Use Next.js Route Handlers with tag-based revalidation (`revalidateTag`) to cache expensive read endpoints at the server layer.

### Pagination & Query Efficiency
* Transition large data grids (products catalog, audit trails, user rosters) from `OFFSET / LIMIT` to **cursor-based pagination** (keyset pagination on `id` or timestamp). Deep offset queries scan and discard thousands of rows in PostgreSQL.

### Bundle & Asset Delivery
* Enable Next.js `output: 'standalone'` for minimal Docker container images and rapid deployment rollouts.
* Use dynamic imports (`next/dynamic`) for heavy modals, charts, and product review drawers so initial page load remains lean.

---

## 5. iOS App Optimizations

* **Enable URLCache:** In [APIClient.swift](file:///Users/tarunvishwakarma/Documents/MacAntigravity/personal-proj/true-lable/ios/truelable/truelable/Core/APIClient.swift), replace `reloadIgnoringLocalCacheData` with standard cache policies for GET requests (`useProtocolCachePolicy`). Static endpoints (trending, alternatives) should be served from local disk cache when valid.
* **Offline Persistence:** Persist scanned product details locally in SwiftData / CoreData so previously looked-up items can be viewed without active cellular reception in grocery stores.
* **Image Caching Pipeline:** Cache Open Food Facts images using libraries like Kingfisher or Nuke with disk-backed cache and automatic downsampling.
* **Network Batching & Multiplexing:** Use HTTP/2 multiplexing or batch endpoints on initial launch instead of firing disparate simultaneous requests for profile, trending, and notifications.
* **Scanner Debouncing:** Introduce client-side scan debouncing so holding the camera over a barcode fires only one network request instead of bursts of duplicate lookups.
* **Background Alternative Prefetching:** Once a barcode resolves, prefetch healthy alternatives in the background so they display immediately upon scrolling.

---

## 6. Android App Optimizations

* **Network Caching:** Configure OkHttp with a local `Cache` directory (10–20MB) and appropriate `Cache-Control` header interceptors.
* **Image Optimization:** Utilize Coil with memory and disk cache enabled, paired with hardware bitmap rendering.
* **CameraX Frame Throttling:** In `BarcodeAnalyzer`, throttle preview frames to process every 3rd or 4th frame. Analyzing at 30–60fps overheats the device and wastes battery with zero accuracy gain.
* **ViewModel State Preservation:** Store retrieved product and scan states in `SavedStateHandle` to prevent network re-fetches across screen rotation and activity lifecycle events.
* **Verification Feed Prefetching:** Fetch the top 5 verification candidates during idle moments post-launch so the verification tab opens without spinner latency.
* **R8 / ProGuard Shrinking:** Enable aggressive code shrinking, obfuscation, and resource stripping in release builds to decrease APK download size and improve cold-start time.

---

## 7. Handling 10K Simultaneous Product Submissions

> [!WARNING]
> When thousands of users scan and submit information for the same product at the same moment, direct synchronous writes to PostgreSQL will create severe database lock contention and connection pool exhaustion.

### Mitigation Architecture
* **Advisory Locks on Barcode:**
  The `products` table enforces a `UNIQUE` constraint on barcode. Multiple concurrent `INSERT ... ON CONFLICT DO UPDATE` statements fight over row locks.
  * *Strategy:* Acquire an explicit transaction-level PostgreSQL advisory lock (`pg_advisory_xact_lock(hashtext(barcode))`). Incoming transactions for the same barcode serialize cleanly without deadlocks.
* **Asynchronous Redis Submission Queue:**
  Decouple submission ingestion from database writes:
  1. The mobile client sends OCR/product submission payload.
  2. Axum validates payload schema and pushes it into a Redis list or stream (`RPUSH` / `XADD`).
  3. The API immediately responds with `202 Accepted` and a submission reference ID.
  4. A dedicated background worker pulls submissions in batches (e.g., 50–100 items) and persists them using batched SQL operations.
* **Circuit Breakers for External Services:**
  When resolving metadata from Open Food Facts, apply a circuit breaker (e.g., `failsafe-rs`). If external API latency exceeds acceptable thresholds, fast-fail or queue requests rather than occupying Axum worker threads for 10-second timeouts.
* **Load Shedding & Graceful Degradation:**
  If the database connection pool approaches 95% saturation, Axum should shed non-critical load (e.g., analytics, voluntary feedback) and return `503 Service Unavailable` with a `Retry-After` header rather than holding connections until client timeout.

---

## 8. Infrastructure, Deployment & Observability

### Global Edge CDN
* Deploy **Cloudflare** or **AWS CloudFront** in front of API and Web endpoints:
  * Terminate TLS at the edge to reduce CPU load on backend pods.
  * Absorb layer 7 DDoS and volumetric attacks.
  * Cache public read responses (documentation, dashboard assets, public product details) at regional edge locations.

### Observability & Tracing
* **Prometheus Metrics:** Expose key system indicators:
  * Connection pool saturation (`pool.connections.in_use / pool.connections.max`).
  * Endpoint latency histograms (p50, p95, p99).
  * Redis hit/miss ratios.
  * External API (Open Food Facts) latency.
* **Distributed Tracing:** Instrument Axum and database queries with **OpenTelemetry**. Trace requests across mobile clients, backend handlers, and database queries to instantly isolate bottlenecks.
* **Alerting Rules:** Trigger high-priority alerts when:
  * Database pool utilization > 80% for > 2 minutes.
  * Error rate (5xx) > 1% over a 5-minute window.
  * p99 endpoint latency > 1,000ms.

### Disaster Recovery & Backups
* Schedule automated daily snapshots combined with continuous Write-Ahead Log (WAL) archiving to cloud object storage (e.g., AWS S3, DO Spaces).
* Perform quarterly automated restore drills to validate Recovery Point Objective (RPO < 5 minutes) and Recovery Time Objective (RTO < 30 minutes).

---

## 9. Implementation Priority Matrix

| Priority | Strategy | Primary Impact | Estimated Effort |
| :---: | :--- | :--- | :---: |
| 🔴 **P0** | Scale DB connection pool to 50+ connections & warm pool | Prevents connection timeout crashes | 15 mins |
| 🔴 **P0** | Deploy PgBouncer in transaction mode | Allows backend to scale past 6 replicas | 1–2 hours |
| 🔴 **P0** | Migrate PostgreSQL to HA setup (Managed / CloudNativePG) | Eliminates single point of failure | 2–4 hours |
| 🟡 **P1** | Batch `bump_lookup()` counter updates | 100x reduction in write IOPS | 2 hours |
| 🟡 **P1** | Add in-process L1 cache (Moka) for hot products | Eliminates Redis/DB hops for top scans | 1–2 hours |
| 🟡 **P1** | Replace `ILIKE` with Trigram Similarity (`%`) | Query time drops from ~500ms to ~5ms | 30 mins |
| 🟡 **P1** | Consolidate `verify_product()` queries into 1 transaction | Halves round-trip latency | 1–2 hours |
| 🟡 **P1** | Add missing database indexes | Accelerates alternative & verification lookups | 30 mins |
| 🟢 **P2** | Redis Queue for asynchronous product submissions | Absorbs massive scan/upload spikes smoothly | 3–4 hours |
| 🟢 **P2** | Server-Sent Events (SSE) for dashboard notifications | Eliminates thousands of polling requests/sec | 3–4 hours |
| 🟢 **P2** | Enable response & image caching on iOS & Android | Reduces mobile bandwidth & backend calls by 50%+ | 2–3 hours |
| 🟢 **P2** | Redis Sentinel failover & AOF persistence | Guarantees cache & rate limit reliability | 2–3 hours |
| 🟢 **P2** | Prometheus metrics, OpenTelemetry & alerting | End-to-end visibility into production bottlenecks | 3–4 hours |
| 🔵 **P3** | Read replicas for dashboard analytics queries | Offloads read traffic from primary database | 2–3 hours |
| 🔵 **P3** | Cloudflare / CDN edge caching & TLS termination | Edge security and regional latency reduction | 1–2 hours |
| 🔵 **P3** | Keyset / Cursor-based pagination on large datasets | Stable query performance on deep pages | 2–3 hours |

---

### Key Takeaway
Implementing the **P0 items** (Connection Pool Tuning, PgBouncer, and High-Availability Database) eliminates the immediate architectural roadblocks preventing TrueLabel from scaling to 10,000 users. Executing the **P1 items** addresses query-level hot spots and write contention, ensuring sub-100ms response times under continuous production load.
