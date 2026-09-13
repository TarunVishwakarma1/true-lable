# TrueLabel 🏷️

> **Open-source barcode scanner with a crowdsourced, community-verified nutrition database.**

TrueLabel empowers consumers to scan barcodes, instantly retrieve accurate food and nutrition facts, and crowdsource missing or unverified food labels using AI-driven OCR and peer verification.

---

## 📑 Table of Contents

1. [Local Development Setup](#-local-development-setup)
   - [Prerequisites](#prerequisites)
   - [Option A: Running Locally with Cargo](#option-a-running-locally-with-cargo)
   - [Option B: Running on Local Kubernetes (KinD)](#option-b-running-on-local-kubernetes-kind)
2. [Product Roadmap](#-product-roadmap)
3. [System Architecture](#-system-architecture)
   - [High-Level Diagram](#high-level-diagram)
   - [Data Flow: Successful Barcode Scan](#data-flow-successful-barcode-scan)
   - [Data Flow: Product Not Found (Crowdsourced Flow)](#data-flow-product-not-found-crowdsourced-flow)
4. [Database Schema](#-database-schema)
5. [API Contract](#-api-contract)
6. [Project Structure](#-project-structure)
7. [SDLC & Sprint Workflow](#-sdlc--sprint-workflow)
8. [Architectural Decisions (ADRs)](#-architectural-decisions-adrs)
9. [Data Quality & Verification Strategy](#-data-quality--verification-strategy)
10. [Deployment & Infrastructure](#-deployment--infrastructure)
11. [Monitoring & Analytics](#-monitoring--analytics)
12. [Testing Strategy](#-testing-strategy)
13. [Timeline Overview](#-timeline-overview)

---

## 🛠️ Local Development Setup

### Prerequisites

- **Rust**: 1.85+ (`rustup default stable`)
- **Docker**: Docker Desktop / OrbStack / Docker CLI
- **Kubernetes & KinD**: `kind` CLI and `kubectl` (for cluster testing)
- **Xcode**: 16+ (for iOS App development)
- **PostgreSQL & Redis**: (Optional if running native without containers)

---

### Option A: Running Locally with Cargo

1. **Navigate to the backend directory**:

   ```bash
   cd backend
   ```

2. **Configure Environment Variables**:
   Copy `.env.local` to `.env`:

   ```bash
   cp .env.local .env
   ```

   *Default local configuration:*

   ```ini
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
   REDIS_URL=redis://localhost:6379
   SERVER_HOST=0.0.0.0
   SERVER_PORT=8080
   APP_ENV=development
   ```

3. **Run Postgres and Redis** (via Docker or native):

   ```bash
   docker run -d --name truelabel-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:latest
   docker run -d --name truelabel-redis -p 6379:6379 redis:latest
   ```

4. **Run Backend Service**:

   ```bash
   cargo run
   ```

5. **Verify Health**:

   ```bash
   curl http://localhost:8080/health
   curl http://localhost:8080/health/ready
   ```

---

### Option B: Running on Local Kubernetes (KinD)

1. **Create the KinD Cluster**:

   ```bash
   kind create cluster --config .kind/local-cluster.yml --name true-lable-cluster
   ```

2. **Apply Secrets, Persistent Volumes, and Services**:

   ```bash
   kubectl apply -f .kind/secrets/backend-secrets.yml
   kubectl apply -f .kind/deployment/db-init.yaml
   kubectl apply -f .kind/deployment/redis-init.yaml
   kubectl apply -f .kind/service/db-service.yml
   kubectl apply -f .kind/service/redis-service.yml
   ```

3. **Build and Load Backend Docker Image**:

   ```bash
   docker build -t true-lable-backend:latest ./backend
   kind load docker-image true-lable-backend:latest --name true-lable-cluster
   ```

4. **Deploy Backend**:

   ```bash
   kubectl apply -f .kind/deployment/backend-deployment.yml
   kubectl apply -f .kind/service/backend-service.yml
   ```

5. **Verify Pod Status**:

   ```bash
   kubectl get pods -w
   ```

---

## 🗺️ Product Roadmap

```
  Phase 0: MVP (Weeks 1-5)             Phase 1: Crowdsourcing (Weeks 6-10)
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ • Scan barcode → OFF Lookup     │   │ • Photo label capture (OCR)     │
│ • "Product not found" state     │──▶│ • Postgres persistence          │
│ • Redis 5-min caching           │   │ • Unverified product queue      │
│ • 10 internal beta users        │   │ • 100+ beta users, 1K+ items    │
└─────────────────────────────────┘   └─────────────────────────────────┘
                 │
                 ▼
  Phase 2: Smart Serving (Weeks 11-14) Phase 3: Public Launch (Weeks 15-16)
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ • ≥3 verifications = Verified   │   │ • iOS App Store + TestFlight    │
│ • 1-2 verifications = Badge     │──▶│ • India community launch        │
│ • Confidence scoring engine     │   │ • Sentry & PostHog monitoring   │
│ • 500+ DAU (80%+ success rate)  │   │ • 1000+ DAU target              │
└─────────────────────────────────┘   └─────────────────────────────────┘
```

### Phase 0: MVP (Weeks 1–5)

- **Goal**: Validate core flow.
- Scan barcode → Lookup from Open Food Facts.
- If not found → Show "Product not found".
- Local history caching in iOS.
- **Database**: Redis only (API caching).
- **Users**: Internal testing + 10 beta users.
- **Success Metric**: 10 successful scans from beta users.

### Phase 1: Crowdsourced Verification (Weeks 6–10)

- **Goal**: Enable data collection.
- Product not found → Capture photo of nutrition label.
- Google Vision OCR extracts barcode, name, ingredients, and nutrition.
- Prompt user: *"Is this correct?"* → Save to DB as `unverified`.
- Subsequent users prompted: *"Help verify this product (X people added it)"*.
- **Database**: PostgreSQL (Products, Verifications, OCR Submissions).
- **Users**: 100+ beta users.
- **Success Metric**: 1,000+ products added and verified by 2+ users.

### Phase 2: Smart Serving (Weeks 11–14)

- **Goal**: Show verified data confidently.
- $\ge 3$ verifications $\rightarrow$ Serve as **Verified** (Green Checkmark).
- $1\text{--}2$ verifications $\rightarrow$ Serve with **"Unverified"** badge.
- $0$ verifications $\rightarrow$ Prompt user to verify label.
- Confidence scoring system based on OCR quality + user confirmations.
- **Users**: 500+ DAU.
- **Success Metric**: 80%+ scan success rate.

### Phase 3: Launch Public (Weeks 15–16)

- **Goal**: Public beta on iOS + TestFlight release.
- India-specific community marketing (Instagram, fitness/health groups).
- Monitor data quality and volunteer verification rate.
- **Users**: 1,000+ DAU target.

---

## 🏛️ System Architecture

### High-Level Diagram

```markdown
┌─────────────────────────────────────────────────────────────┐
│                     iOS App (Swift)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • Barcode Scanner (VisionKit / AVFoundation)         │  │
│  │ • Photo Capture (Nutrition Labels)                   │  │
│  │ • Local History Cache (CoreData / SwiftData)         │  │
│  │ • Device State & Location Management                 │  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────┘
                      │ HTTPS (REST API)
        ┌─────────────┴──────────────┐
        │                            │
        ▼                            ▼
    ┌──────────────────────┐  ┌──────────────────┐
    │  Rust Backend API    │  │ AWS S3 / Cloud   │
    │  (Axum / Tokio)      │  │ (Image storage)  │
    │  Port: 8080          │  │                  │
    └──────────┬───────────┘  └──────────────────┘
               │
    ┌──────────┼──────────┬─────────────┐
    │          │          │             │
    ▼          ▼          ▼             ▼
┌─────────┐ ┌──────┐ ┌──────────┐ ┌─────────┐
│ Redis   │ │  DB  │ │  Open    │ │ Google  │
│ (Cache) │ │Post- │ │  Food    │ │ Vision  │
│5min TTL │ │ gres │ │  Facts   │ │ (OCR)   │
└─────────┘ └──────┘ └──────────┘ └─────────┘
```

---

### Data Flow: Successful Barcode Scan

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant iOS as iOS App
    participant API as Rust Backend
    participant Redis as Redis Cache
    participant DB as PostgreSQL
    participant FoodFacts as Open Food Facts

    User->>iOS: Scans Barcode
    iOS->>API: GET /api/v1/products/search?barcode=...&country=IN
    API->>Redis: Check Cache

    alt Cache Hit
        Redis-->>API: Return Cached Product JSON
    else Cache Miss (Found in PostgreSQL)
        API->>DB: Query products table by barcode
        DB-->>API: Return Product Record
        API->>Redis: Set Cache (5-min TTL)
    else Cache Miss (Not in DB, Found in Open Food Facts)
        API->>FoodFacts: Fetch from Open Food Facts API
        FoodFacts-->>API: Product Data
        API->>Redis: Set Cache (5-min TTL)
    end

    API-->>iOS: 200 OK (Product Data + Verified Status)
    iOS->>User: Display Product Details (Verified/Unverified Badge)
```

---

### Data Flow: Product Not Found (Crowdsourced Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User1 as Contributor
    participant iOS1 as Contributor App
    participant API as Rust Backend
    participant Vision as Google Vision OCR
    participant DB as PostgreSQL
    actor User2 as Verifier
    participant iOS2 as Verifier App

    User1->>iOS1: Scans Barcode (Not Found)
    iOS1->>User1: Prompt: "Product Not Found. Help us add it?"
    User1->>iOS1: Captures Label Photo
    iOS1->>API: POST /api/v1/products/submit_label
    API->>Vision: Text Detection and OCR Extraction
    Vision-->>API: Raw Text and Confidence Score
    API->>API: Parse Nutrition, Ingredients, and Brand
    API->>DB: Insert ocr_submissions and unverified product
    API-->>iOS1: Extracted Nutrition Data
    iOS1->>User1: "Is this correct?" (Review and Edit)
    User1->>iOS1: Clicks Confirm
    iOS1->>API: POST /api/v1/products/verify (confirmed: true)
    API->>DB: Insert verification record (count = 1)
    
    Note over User2, DB: Next User Scans Same Barcode
    User2->>iOS2: Scans Same Barcode
    iOS2->>API: GET /api/v1/products/search
    API-->>iOS2: Unverified Product (verification_count: 1)
    iOS2->>User2: Prompt: "1 person added this. Help verify?"
    User2->>iOS2: Clicks Verify
    iOS2->>API: POST /api/v1/products/verify
    API->>DB: Increment count (3+ verifications marks verified)
```

---

## 🗄️ Database Schema

Migrations run automatically at boot (`db::run_migrations`), in
`backend/migrations/`. This is the schema they actually produce.

```markdown
┌────────────────────────────────────────────┐      ┌──────────────────────────────────────┐
│                  products                  │      │            verifications             │
├────────────────────────────────────────────┤      ├──────────────────────────────────────┤
│ id                UUID PK                  │◀──┐  │ id           UUID PK                 │
│ barcode           VARCHAR(20) UNIQUE       │   └──│ product_id   UUID FK → products(id)  │
│ country           VARCHAR(2)               │      │ barcode      VARCHAR(20)             │
│ product_name      VARCHAR(255)             │      │ country      VARCHAR(2)              │
│ brand             VARCHAR(255)             │      │ device_id    VARCHAR(255)            │
│ image_url         TEXT                     │      │ verified     BOOLEAN NOT NULL        │
│ nutrition_facts   JSONB NOT NULL           │      │ created_at   TIMESTAMPTZ             │
│ ingredients       TEXT                     │      └──────────────────────────────────────┘
│ allergens         TEXT                     │
│ source            VARCHAR(50)              │      ┌──────────────────────────────────────┐
│ verified          BOOLEAN  DEFAULT FALSE   │      │           ocr_submissions            │
│ verification_count INT     DEFAULT 0       │      ├──────────────────────────────────────┤
│ confidence_score  FLOAT                    │      │ id               UUID PK             │
│ additives         JSONB                    │      │ barcode          VARCHAR(20)         │
│ nova_group        SMALLINT                 │      │ country          VARCHAR(2)          │
│ nutriscore_grade  VARCHAR(1)               │      │ image_url        TEXT (nullable)     │
│ is_vegan          BOOLEAN (tri-state)      │      │ extracted_text   TEXT NOT NULL       │
│ is_vegetarian     BOOLEAN (tri-state)      │      │ parsed_nutrition JSONB               │
│ is_palm_oil_free  BOOLEAN (tri-state)      │      │ confidence_score FLOAT               │
│ category          TEXT                     │      │ status           VARCHAR(50)         │
│ lookup_count      INT NOT NULL DEFAULT 0   │
│ off_synced_at     TIMESTAMPTZ              │
│ off_last_modified BIGINT                   │      │ created_at       TIMESTAMPTZ         │
│ created_at        TIMESTAMPTZ              │      │ updated_at       TIMESTAMPTZ         │
│ updated_at        TIMESTAMPTZ              │◀─────│ final_product_id UUID FK (nullable)  │
└────────────────────────────────────────────┘      └──────────────────────────────────────┘
```

A fourth table, `users`, is one row per device — `device_id` (the primary
key), `country`, `dietary_preferences` (a JSONB array), and the three Plus
columns `plus_since` / `plus_expires_at` / `plus_source`. There are no
accounts, so nothing links a row to a person beyond the vendor identifier the
device already hands out.

Notes that matter when querying:

- **`nutrition_facts`** always carries the same thirteen keys — `energy_kcal`,
  `protein`, `carbs`, `fat`, `saturated_fat`, `trans_fat`, `fiber`, `sugar`,
  `sodium`, `cholesterol`, `potassium`, `calcium`, `iron` — per 100 g, with
  `sodium` in grams. A key we could not find is stored as `null` rather than
  omitted, so a client can tell "Open Food Facts doesn't publish this" from
  "we failed to map it". A user-contributed product with no nutrition table
  stores `{}`.
- **`off_synced_at` / `off_last_modified`** are how far behind Open Food Facts
  this row is: when we last brought it in step, and their own last-edited
  stamp at that moment. `NULL` on rows we sourced ourselves.
- **`additives`** is a JSON array of E-numbers (`["E150D","E338"]`). `NULL`
  means "the source has no additive data", which is not the same claim as
  "no additives".
- **`is_vegan` / `is_vegetarian` / `is_palm_oil_free`** are genuinely
  three-valued. `NULL` is "unknown" and must never be collapsed to `false`.
- **`category`** is Open Food Facts' most specific `categories_tags` entry
  (`"fruit-nectars"`). It is what same-shelf alternatives match on; rows
  without one are excluded from that feature rather than matched loosely.
- **`lookup_count`** increments on every resolved look-up, asynchronously so
  it never sits on the scan path. It ranks `/products/trending` and breaks
  ties in search.

### Indices

```sql
-- products
CREATE INDEX idx_products_barcode            ON products(barcode);
CREATE INDEX idx_products_barcode_country    ON products(barcode, country);
CREATE INDEX idx_products_verified           ON products(verified);
CREATE INDEX idx_products_category_country   ON products(category, country);
CREATE INDEX idx_products_country_popularity ON products(country, lookup_count DESC);
CREATE INDEX idx_products_name_trgm          ON products USING gin (product_name gin_trgm_ops);
CREATE INDEX idx_products_brand_trgm         ON products USING gin (brand gin_trgm_ops);

-- verifications
CREATE INDEX idx_verifications_product_id       ON verifications(product_id);
CREATE INDEX idx_verifications_barcode_country  ON verifications(barcode, country);

-- ocr_submissions
CREATE INDEX idx_ocr_submissions_barcode ON ocr_submissions(barcode);
CREATE INDEX idx_ocr_submissions_status  ON ocr_submissions(status);
```

The two GIN indices need the `pg_trgm` extension, which the search migration
creates (`CREATE EXTENSION IF NOT EXISTS pg_trgm`). On a managed Postgres the
role running migrations must be allowed to create extensions; every major
provider ships `pg_trgm` on its allowed list.

---

## 📡 API Contract

### Authentication

There are no accounts, so a **device** is the subject. It proves itself with
a bearer token, not with its identifier:

```
POST /api/v1/auth/device        (no body, no auth)
→ { "device_id": "…", "token": "…" }
```

The token is issued once per install and returned once. Only its SHA-256 is
stored, so a database leak does not hand over credentials. Every per-user
endpoint then takes it:

```
Authorization: Bearer <token>
```

**The device id never appears in a path or query again.** It previously did,
which meant anyone holding one could read that person's profile, cancel their
Plus, or delete their account — and a device identifier is not a secret: iOS
hands the same one to every app from a vendor, and anything in a URL lands in
proxy and access logs. The token is the identity, so a caller has no way to
name anybody but itself. The server, not the client, generates the id, so
there is nothing to guess or claim.

On the client the token lives in the **Keychain**, which survives deleting the
app — that is what lets a reinstall keep its profile. A `401` means the row
behind the token is gone; the client registers afresh and retries once.

| Endpoint | Auth |
|---|---|
| `/health*`, `/products/search`, `/query`, `/trending`, `/alternatives` | none |
| `/products/needs-verification` | optional — a token lets it skip what you already voted on |
| `/products/verify`, `/ocr/submit`, all of `/me/*` | **required** |

### Transport and browser posture

Every response carries `Cache-Control: no-store`, `X-Content-Type-Options`,
`X-Frame-Options: DENY`, `Content-Security-Policy: default-src 'none'`,
`Referrer-Policy: no-referrer` and HSTS. These are set on the router, not per
route, so an endpoint added tomorrow is covered without anyone remembering.
`no-store` is the one that matters most: an authenticated reply carries a
profile and a subscription state, and without it a shared proxy may keep a
copy and hand it to the next person through.

**CORS is closed by default.** `ALLOWED_ORIGINS` is an explicit allowlist and
starts empty. A native client sends no `Origin`, so an empty list costs the
app nothing and stops the API being used as somebody else's free backend.
Credentials are never allowed and never needed.

**CSRF does not apply here, structurally rather than by mitigation.** This API
authenticates with an `Authorization` header, which a browser never attaches
on its own, and it sets no cookies. There is no ambient authority for a
cross-site request to borrow. That property is worth protecting: the moment a
cookie carries auth, every state-changing route needs a token of its own.

**Requests time out at 25 seconds**, longer than any call this service makes
outward, so a request can only expire here once its own dependencies already
have. Calls to Open Food Facts carry their own 10-second ceiling. Without
these a hung connection holds a worker and a database handle indefinitely,
which is how a slow client takes a service down with no volume at all.

### Rate limits

Per hour, counted in Redis. The subject is the **token** when there is one and
the **address** otherwise, because mobile networks put thousands of people
behind one address and limiting everybody by IP would punish a whole carrier
for one script.

| Bucket | Limit | Subject |
|---|---|---|
| Barcode look-up | 600 | device or address |
| Text search | 200 | device or address |
| Confirm a label | 60 | device |
| Add a product | 20 | device |
| Profile / subscription / link writes | 60 | device |
| Register a device | 10 | address |

Over the limit returns `429`. The counter is a fixed window incremented and
expired in one Lua call, so a process dying mid-sequence cannot leave a key
without a TTL and jam a subject out permanently. It **fails open**: if Redis
is unreachable the request is allowed and the failure is logged, because this
limiter exists to blunt abuse and taking the API down when the cache blinks is
the worse outcome.

**`X-Forwarded-For` needs a hop count, not a boolean.** It is a list each
proxy appends to, so everything left of what *your own* proxies added is
written by the caller. Reading the leftmost entry — the obvious thing — means
a client sends `X-Forwarded-For: <anything>` and picks a fresh rate-limit
bucket on every request.

`TRUSTED_PROXY_HOPS` is the number of proxies in front of this process, and
the client is the entry that many places from the right: the address the
outermost trusted proxy actually observed. It defaults to `0`, which ignores
the header and uses the socket's peer address, which no caller can forge.

Count only hops that append to the header. `ingress-nginx` alone is `1`; a CDN
in front of it makes `2`; an L4 load balancer does not append and does not
count. **Setting it higher than the truth is worse than leaving it at zero**,
because the surplus entries are the caller's.

A global backstop of 3,000 requests per hour per address covers every route,
including ones added later, so a flood at an endpoint nobody remembered to
protect still costs something. Health checks are exempt: limiting them would
pull the service out of rotation under exactly the load the limit exists for.

**On DDoS, plainly.** Application code cannot absorb a volumetric attack. What
it can do is refuse to amplify, bound the work any one caller can cause, fail
fast, and never exhaust its own resources — all of which is above. Absorbing
volume is the edge's job: the ingress carries connection and request-rate
caps and short client timeouts, and anything serious needs a CDN or scrubbing
provider in front of the cluster.

Postgres and Redis are closed to everything but the backend by NetworkPolicy.
They hold every product row, profile and token hash, and neither speaks TLS
inside the cluster, so a compromised sidecar reaching them directly is the
failure worth preventing.

Request bodies are capped at 256 KB, and an OCR submission at 20,000
characters of recognised text.



Every response is wrapped in the same envelope:

```json
{ "status": "success", "data": { }, "cached": false, "timestamp": "2026-09-13T10:00:00Z" }
```

Errors reply `{ "status": "error", "error": "...", "timestamp": "..." }` with a
`400` (bad barcode/country/query), `404` (product not in the catalogue),
`502` (Open Food Facts unreachable) or `500`.

`country` is a 2-letter code everywhere and defaults to `IN`.

---

### 1. Look up a product by barcode

`GET /api/v1/products/search?barcode=<8–14 digits>&country=IN`

Resolution order is Redis (1 hour TTL) → Postgres → Open Food Facts (rate
limited to 12 req/min across the whole service). A product fetched from Open
Food Facts is written to Postgres before it is returned, so the second
look-up is local. A barcode Open Food Facts doesn't have either is remembered
as a miss for 10 minutes, so re-scanning an unknown pack doesn't spend the
shared budget. Each resolved look-up increments `products.lookup_count`,
which is what `/trending` ranks on.

**Staying in step with Open Food Facts.** Our row is a cache of theirs, not a
fork of it, and two things keep it honest:

- *One mapping.* Every column we take from a product is produced by a single
  `OffFields::from`, used by the first insert and by every later refresh.
  Nutrients go through one table that reads `<nutrient>_100g` first, then the
  bare key, then `_value`. Every figure this API publishes is per 100 g, so
  only `_100g` may be trusted — the bare key is historical, is not guaranteed
  to be normalised, and is often absent entirely.
- *Refresh on read.* A read of an Open-Food-Facts-sourced row whose
  `off_synced_at` is more than 30 days old kicks off a background refresh.
  It is opportunistic: if the per-minute budget has no free slot it gives up
  rather than queue, because a refresh is never the urgent request and a live
  scan is. The reader is served the existing row either way.

A refresh rewrites only the columns Open Food Facts owns. `verified`,
`verification_count` and `lookup_count` are ours and are never overwritten,
and a `user_contributed` row is never touched at all. `off_last_modified`
records their own last-edited stamp at the moment we synced, so "are we in
step with them" is answerable without re-reading the product.

```json
{
  "status": "success",
  "cached": false,
  "data": {
    "id": "b18b6250-9d04-4cc4-9c09-a1b9ceec848a",
    "barcode": "8901030895564",
    "country": "IN",
    "product_name": "Aloo Bhujia",
    "brand": "Haldiram's",
    "image_url": "https://images.openfoodfacts.org/…/front.jpg",
    "nutrition_facts": {
      "energy_kcal": 546, "protein": 9.2, "carbs": 43.8, "fat": 36.4,
      "saturated_fat": 12.1, "trans_fat": 0, "fiber": 3,
      "sugar": 2.4, "sodium": 1.18, "cholesterol": null,
      "potassium": null, "calcium": null, "iron": null
    },
    "nutrition_per_serving": { "energy_kcal": 163.8, "sugar": 0.72, "…": null },
    "nutrient_levels": { "fat": "high", "saturated_fat": "high", "sugar": "low", "sodium": "high" },
    "serving_size": "30 g",
    "serving_quantity": 30,
    "quantity": "200 g",
    "ingredients": "Gram flour, edible vegetable oil (palm), potato, salt…",
    "allergens": ["peanuts"],
    "traces": ["tree-nuts"],
    "labels": ["vegetarian", "no-added-sugar"],
    "additives": ["E330", "E500II"],
    "categories": ["snacks", "salty-snacks", "namkeen"],
    "source": "open_food_facts",
    "verified": false,
    "verification_count": 1,
    "off_synced_at": "2026-09-13T10:00:00Z",
    "completeness": 0.85,
    "nova_group": 4,
    "nutriscore_grade": "d",
    "nutriscore_score": 18,
    "ecoscore_grade": "d",
    "is_vegan": true,
    "is_vegetarian": true,
    "is_palm_oil_free": false,
    "category": "namkeen"
  }
}
```

Everything in `nutrition_facts` is **per 100 g**, and `sodium` is in **grams**
(Open Food Facts' convention), not milligrams. `nutrition_per_serving` is the
same document scaled by `serving_quantity` — arithmetic only, and absent
rather than guessed when the pack states no serving size.

`nutrient_levels` is `low` / `moderate` / `high` per nutrient. It is Open
Food Facts' own where they publish one, and the UK FSA front-of-pack
thresholds where they do not — with the separate drinks thresholds applied
when the product is a beverage, because 12 g of sugar is moderate in a
biscuit and high in a bottle.

**Three-valued fields, throughout.** The dietary flags, `allergens`,
`traces`, `labels`, `additives` and `categories` are all `null` when the
source publishes nothing and `[]` / `false` when it publishes "none". Those
are different claims to make about food and must never be collapsed.
`traces` is the "may contain" line and is kept apart from `allergens` on
purpose: a trace is not an ingredient, and for an allergy it is often the
line that decides it.

Tags travel as **slugs with the locale prefix stripped** — `"tree-nuts"`,
not `"en:tree-nuts"` and not `"Tree Nuts"`. A slug can be both matched on and
prettified; a display string can only be shown.

Nutrient figures are sanity-checked before storage: anything negative, or
above 100 g per 100 g, or above 900 kcal per 100 g, is dropped rather than
stored. Open Food Facts is crowd-edited and does contain data-entry errors,
and rendering one is worse than rendering nothing.

---

### 2. Search products by name or brand

`GET /api/v1/products/query?q=<2–60 chars>&country=IN&limit=20`

Local catalogue first, ranked by trigram similarity against `product_name`
and `brand` then by popularity. When fewer than five local rows match, the
list is topped up from Open Food Facts' search endpoint, which runs on its
own 8 req/min budget and is **skipped rather than queued** when that budget is
spent — a thin result beats a slow one. Results are cached for 10 minutes.

Returns an array of product cards:

```json
{
  "status": "success",
  "cached": false,
  "data": [
    {
      "barcode": "8901030895564",
      "product_name": "Aloo Bhujia",
      "brand": "Haldiram's",
      "image_url": "https://…/front.jpg",
      "nutriscore_grade": "d",
      "nova_group": 4,
      "verified": false,
      "energy_kcal": 546,
      "sugar": 2.4,
      "sodium": 1.18
    }
  ]
}
```

---

### 3. Trending products

`GET /api/v1/products/trending?country=IN&limit=10`

The same card shape, ordered by `lookup_count`, then verification count, then
recency — so a freshly seeded database still returns something rather than an
empty list. Products still named `Unknown` are excluded.

---

### 4. Same-shelf alternatives

`GET /api/v1/products/alternatives?barcode=…&country=IN&sort_by=sugar&limit=3`

Products sharing the scanned product's `category`, ranked on one nutrient.
`sort_by` accepts `sugar`, `sodium`, `fat`, `saturated_fat`, `energy_kcal`,
`carbs` (ascending — less is better), `protein`, `fiber` (descending — more is
better), or `score` (Nutri-Score then NOVA). `limit` is clamped to 1–10.

Returns product cards with an extra `sort_value` (the ranked nutrient's per-100 g
figure). A product with no `category` returns `[]` — an unmatched shelf beats a
wrong one.

---

### 5. Verification queue

`GET /api/v1/products/needs-verification?country=IN&limit=12`

Products below the 3-confirmation threshold that this device hasn't already
voted on. Works without a token; sending one is what lets it skip what you
have already voted on.

```json
{
  "status": "success",
  "data": [
    {
      "barcode": "8901030895564",
      "product_name": "Aloo Bhujia",
      "brand": "Haldiram's",
      "image_url": "https://…/front.jpg",
      "nutriscore_grade": "d",
      "energy_kcal": 546,
      "sugar": 2.4,
      "sodium": 1.18,
      "verification_count": 1
    }
  ]
}
```

---

### 6. Confirm a product matches its label

`POST /api/v1/products/verify`

```json
{ "barcode": "8901030895564", "country": "IN" }
```

Who is confirming comes from the token, never from the body.

Records a row in `verifications`, increments `products.verification_count`,
flips `verified` to true at 3, busts the product's cache entry, and returns the
refreshed product in the standard envelope.

---

### 7. Profile

`GET /api/v1/me/profile`

There are no accounts. `identifierForVendor` is the identity, and **reading a
profile creates it**, so the client never needs a registration step. `country`
seeds the row on first read and is ignored afterwards.

```json
{
  "status": "success",
  "data": {
    "device_id": "9B1D6F20-80E2-47DB-9D9B-FDF6ECFA8B85",
    "country": "IN",
    "dietary_preferences": ["Vegetarian", "Low sugar"],
    "subscription": { "tier": "plus", "active": true, "since": "2026-09-13T10:00:00Z", "expires_at": null, "source": "complimentary" },
    "created_at": "2026-09-13T09:12:00Z"
  }
}
```

`PUT /api/v1/me/profile`

```json
{ "country": "IN", "dietary_preferences": ["Vegetarian", "Low sugar"], "display_name": "Tarun" }
```

`display_name` is settable here without an account — a name is not an
identity, and it is the only thing a client can offer when Sign in with Apple
is unavailable to it. An empty string clears it; absent leaves it alone.

Every field is optional — absent means "leave it alone", so country can
change without resending the preference list. The backend does not own the
preference vocabulary (the app does, and it grows), so entries are stored as
given, but trimmed, de-duplicated, and capped at 32 entries of 64 characters
so one client cannot write an unbounded blob into a shared table. 

---

### 8. Contribution stats

`GET /api/v1/me/stats`

```json
{ "confirmations": 12, "contributions": 3, "helped_verify": 5, "member_since": "2026-09-13T09:12:00Z" }
```

Deliberately about **contribution, not consumption**. How much someone scans
never leaves their phone; what they put into the shared catalogue is the only
thing counted here. `helped_verify` is the subset of their confirmations that
sit on products which have since crossed the threshold and are now verified
for everyone — the number worth showing a person.

All three come back in one round trip, because three separate counts on a
profile screen is three chances to be half-loaded.

---

### 9. Subscription

`GET /api/v1/me/subscription`
`POST /api/v1/me/subscription` — activate
`DELETE /api/v1/me/subscription` — cancel

```json
{ "tier": "plus", "active": true, "since": "2026-09-13T10:00:00Z", "expires_at": null, "source": "complimentary" }
```

**TrueLabel Plus is free right now, and there is no payment step.** `POST`
takes no body: while Plus is complimentary, asking for it is the whole
transaction. It sets `since` and leaves `expires_at` as `null`, which means
*on, with no expiry* — `active` must never be computed in a way that reads a
missing expiry as lapsed.

`source` records how the tier was granted, `"complimentary"` today and
`"paid"` once payments exist. When they do, `POST` takes a receipt, verifies
it, and writes a real `expires_at`; the response shape does not change, so
clients written against this contract keep working.

The iOS client treats either the backend or a StoreKit entitlement as
sufficient for Plus, so that switch needs no client change either.

---

### 10. Sign in, sign out, delete

> **Sign in with Apple needs a paid Apple Developer Program team.** A personal
> team cannot create a provisioning profile that declares the entitlement, so
> signing fails outright rather than degrading. The iOS build therefore ships
> with the capability off (`Capabilities.signInWithApple = false`, and no
> `CODE_SIGN_ENTITLEMENTS` on the target) and the account page falls back to a
> display name the person chooses, set through the profile endpoint. **The
> backend below is live either way** — it verifies identity tokens as soon as
> a build starts sending them, so enabling the capability is a client-only
> change. See `truelable.entitlements` for the two switches.

`POST /api/v1/me/link`

```json
{ "identity_token": "<Apple identity token>", "display_name": "Tarun Vishwakarma" }
```

Sign in with Apple is the only provider, so there are no passwords stored and
no email to deliver. The token is verified end to end before anything is
written — Apple's signature over Apple's published key, issued by Apple, with
this app's bundle id as audience, unexpired. This endpoint is otherwise
unauthenticated, so an unverified token would let a caller claim any account.
Apple's keys are cached for six hours and re-fetched on an unknown key id.

`display_name` is optional and must be sent by the client: Apple hands the
name over on the **first authorization only** and never puts it in the token.
`email` likewise arrives once, and the user may hide it, so both are stored
with `COALESCE` and never blanked by a later sign-in.

If that Apple identity already owns a row on another device, the account
**moves**: Plus state and preferences come across, the old row is deleted, and
that phone reverts to anonymous. One active device per account. There is no
cross-device sync, so anything else would silently duplicate an entitlement.

`POST /api/v1/me/unlink` detaches the identity and keeps the
row, which is what signing out should do — the app keeps working and nothing
is destroyed.

`DELETE /api/v1/me/account` deletes the account for real, not a
deactivation flag. The App Store requires any app that creates accounts to
offer this from inside the app. Verifications the device submitted are left
alone: they carry no identity beyond a device id, and removing them would
silently unverify products other people rely on.

The profile response carries an `identity` block alongside `subscription`:

```json
"identity": { "signed_in": true, "provider": "apple", "email": null, "display_name": "Tarun", "linked_at": "2026-09-13T10:00:00Z" }
```

`signed_in: false` is the normal state. Nothing in the app requires an account.

---

### 11. Submit a label read on-device

`POST /api/v1/ocr/submit`

The client runs OCR itself (Vision framework, live multi-frame) and sends the
untouched recognized text alongside what the user confirmed after reviewing it.

```json
{
  "barcode": "8901030895564",
  "country": "IN",
  "extracted_text": "HALDIRAM'S\nAloo Bhujia\nIngredients: Gram flour…",
  "reviewed_ingredients": "Gram flour, Palm oil, Salt",
  "reviewed_allergens": ["Peanut"],
  "product_name": "Aloo Bhujia",
  "brand": "Haldiram's",
  "nutrition": { "energy_kcal": 546, "fat": 36.4, "sugar": 2.4, "sodium": 1.18 }
}
```

The contribution is attributed to the token's device, so it can be counted
back on the profile screen. `product_name`, `brand` and `nutrition` are optional — older clients send only
the ingredient side. `extracted_text` is kept as the audit trail: the server
re-parses it and compares against the reviewed fields, so a submission that
silently drops an allergen OCR clearly found is stored
`flagged_allergen_mismatch`, and one whose ingredients were wholesale replaced
is stored `flagged_low_confidence`. `nutrition` is filtered to the thirteen
known keys with finite values in `0…1000` before anything is written.

A successful submission also inserts the product itself (`source:
"user_contributed"`, `verified: false`) with `ON CONFLICT (barcode) DO NOTHING`,
so the barcode is searchable immediately without unverified data ever
clobbering an existing row.

---

## 📂 Project Structure

```markdown
true-lable/
├── backend/                        # Rust Backend Service
│   ├── Cargo.toml
│   ├── Dockerfile                  # Multi-stage release build (34 MB)
│   ├── .dockerignore
│   ├── .env.local                  # Local development config
│   ├── .env.docker                 # Container environment config
│   └── src/
│       ├── main.rs                 # Server entrypoint & graceful shutdown
│       ├── lib.rs                  # Library root & app assembler
│       ├── config/
│       │   ├── mod.rs
│       │   └── env.rs              # Typed configuration with credential masking
│       ├── db/
│       │   ├── mod.rs
│       │   ├── postgres.rs         # Postgres pool manager & health checks
│       │   └── redis.rs            # Redis multiplexed connection manager
│       ├── error.rs                # Centralized AppError enum (Axum IntoResponse)
│       ├── state.rs                # AppState container (PgPool, Redis, Config)
│       └── routes/
│           ├── mod.rs              # Root router + CORS + TraceLayer
│           ├── health.rs           # /health, /health/live, /health/ready
│           └── v1/
│               ├── mod.rs
│               └── products.rs     # Search & barcode lookup endpoints
├── ios/                            # iOS Native App (SwiftUI)
│   └── BarcodeScanner/
│       ├── App/                    # App lifecycle
│       ├── Models/                 # Product, Nutrition, Verification models
│       ├── Views/                  # ScannerView, DetailView, OCRConfirmView
│       ├── ViewModels/             # ScannerViewModel, ProductViewModel
│       └── Services/               # APIClient, LocalHistory, CameraService
├── .kind/                          # Local Kubernetes (KinD) manifests
│   ├── local-cluster.yml           # 3-node cluster with port mappings
│   ├── deployment/                 # Backend, Postgres, Redis deployments
│   ├── service/                    # ClusterIP and NodePort services
│   └── secrets/                    # Secret configurations
└── README.md
```

---

## 📅 SDLC & Sprint Workflow

### Phase 0: MVP (Weeks 1–5)

- **Sprint 1 (Week 1)**: Rust backend foundation (`axum`, `sqlx`, `redis`), `GET /products/search` draft, basic iOS Vision scanner.
- **Sprint 2 (Week 2)**: Open Food Facts API integration, Redis 5-min caching layer, end-to-end barcode scan flow.
- **Sprint 3 (Week 3)**: iOS local scan history persistence (CoreData/SwiftData), structured error handling, and request logging.
- **Sprint 4 (Week 4)**: "Product Not Found" fallback handling, backend rate-limiting (3–4 req/sec), staging deployment.
- **Sprint 5 (Week 5)**: UI polish, 10-user internal beta test, Sentry instrumentation.

### Phase 1: Crowdsourced Verification (Weeks 6–10)

- **Sprint 6 (Week 6)**: `ocr_submissions` + `verifications` schema, `POST /products/submit_label`, Google Vision OCR integration.
- **Sprint 7 (Week 7)**: iOS label photo capture, image compression, OCR result preview & edit screen.
- **Sprint 8 (Week 8)**: `POST /products/verify` endpoint, verification counting logic ($\ge 3$ threshold).
- **Sprint 9 (Week 9)**: Unverified product discovery UI ("Help verify this product"), peer-verification loop.
- **Sprint 10 (Week 10)**: OCR confidence score integration, 100+ beta testers via TestFlight.

---

## ⚖️ Architectural Decisions (ADRs)

| Component | Choice | Rationale | Alternatives Considered |
| --- | --- | --- | --- |
| **Database** | **PostgreSQL** | Relational integrity, JSONB support for variable nutrition tables, indexed lookup for millions of rows. | *Redis-only* (no persistence), *CockroachDB* (overkill for MVP). |
| **Cache** | **Redis** | Sub-5ms response time for repeat scans; 5-min TTL absorbs traffic spikes from popular items. | *In-memory LRU* (doesn't scale across replicas). |
| **OCR Engine** | **Google Vision API** | 95%+ accuracy on curved/glossy food packaging; fast cloud inference; cost negligible (~$1.50/1K requests). | *On-device ML* (large app size, high battery drain, low accuracy on wrinkled labels). |
| **Backend Framework** | **Rust (Axum + Tokio)** | Memory safety, blazing performance, low resource footprint (runs in 64MB container), strong async ecosystem. | *Actix-web*, *Go/Gin*, *Node.js*. |

---

## 🛡️ Data Quality & Verification Strategy

```markdown
                          ┌───────────────────────────┐
                          │ User submits label photo  │
                          └─────────────┬─────────────┘
                                        ▼
                          ┌───────────────────────────┐
                          │ Google Vision OCR extracts│
                          └─────────────┬─────────────┘
                                        │
                         Confidence Score > 0.85?
                                ├─── Yes ───▶ Show extracted values for 1-click confirmation
                                └───  No  ───▶ Prompt user to manually fill missing fields
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │ Stored as "Unverified"    │
                          │ (verification_count = 1)  │
                          └─────────────┬─────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
  Count < 3: Serve with "Unverified" Badge      Count ≥ 3: Mark "Verified" (Green Checkmark)
```

1. **Verification Thresholds**:
   - `0-2 Verifications`: Served with an **"Unverified - X people added this"** badge.
   - `≥ 3 Verifications`: Automatically upgraded to **Verified** status with full confidence.
2. **Confidence Scoring**: Google Vision OCR returns token confidence; if confidence $< 0.85$, the user is prompted to verify and edit raw text.
3. **Manual Overrides**: Any edits made by users during submission are flagged and given higher weight upon subsequent peer confirmations.

---

## 🚀 Deployment & Infrastructure

### Cost Breakdown (Estimated MVP / Month 1)

| Service | Provider | Purpose | Estimated Monthly Cost |
| --- | --- | --- | --- |
| **API Compute** | Railway / Fly.io / KinD | Rust backend container | \$10 – \$20 |
| **Database** | Supabase / Railway | Managed PostgreSQL | \$0 – \$10 (Free Tier) |
| **Cache** | Upstash / Railway | Managed Redis | \$0 – \$5 (Free Tier) |
| **OCR API** | Google Cloud Vision | Text detection from label photos | \$0 – \$20 (First 1K free) |
| **Image Storage** | Cloudflare R2 / AWS S3 | Cropped nutrition label images | \$1 – \$5 |
| **Total** | | | **\$15 – \$60 / month** |

---

## 📊 Monitoring & Analytics

- **Performance Metrics**:
  - P95 API Latency (Target: $< 500\text{ms}$)
  - Cache Hit Ratio (Target: $> 70\%$)
  - Open Food Facts API failure rate
- **Data Quality Metrics**:
  - Verification count distribution
  - Average OCR confidence score
  - User edit rate per submission
- **Tools**:
  - **Sentry**: Error reporting and panic monitoring.
  - **PostHog**: Product analytics (Scans/day, verification conversion rate).
  - **Prometheus + Grafana**: Container CPU/memory and latency metrics.

---

## 🧪 Testing Strategy

- **Unit Tests**:
  - Nutrition parser test suite with mock OCR outputs.
  - Configuration environment variable loaders (race-free with mutex guards).
  - Error code status mapping (`AppError` $\rightarrow$ HTTP Status Code).

  ```bash
  cd backend && cargo test
  ```

- **Integration Tests**:
  - Full HTTP request lifecycle tests using `tower::ServiceExt::oneshot`.
  - Database pool connectivity and health ping validation.
- **Load Testing**:
  - 100 concurrent simulated scans via `k6` / `drill` to ensure sub-500ms P95 latency.

---

## ⏱️ Timeline Overview

| Period | Phase | Key Deliverable |
| --- | --- | --- |
| **Weeks 1–5** | **Phase 0: MVP** | Barcode scan $\rightarrow$ Open Food Facts $\rightarrow$ Local history caching |
| **Weeks 6–10** | **Phase 1: Crowdsourcing** | Label capture $\rightarrow$ Google Vision OCR $\rightarrow$ Peer verification |
| **Weeks 11–14** | **Phase 2: Smart Serving** | Confidence scoring, verification threshold engine ($\ge 3$), TestFlight beta |
| **Weeks 15–16** | **Phase 3: Public Launch** | App Store public release, monitoring, community outreach |

---

## 📄 License

This project is licensed under the [Apache License 2.0](file:///Users/tarunvishwakarma/Documents/MacAntigravity/personal-proj/true-lable/License).
