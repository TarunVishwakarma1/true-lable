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
│ lookup_count      INT NOT NULL DEFAULT 0   │      │ created_at       TIMESTAMPTZ         │
│ created_at        TIMESTAMPTZ              │      │ updated_at       TIMESTAMPTZ         │
│ updated_at        TIMESTAMPTZ              │◀─────│ final_product_id UUID FK (nullable)  │
└────────────────────────────────────────────┘      └──────────────────────────────────────┘
```

Notes that matter when querying:

- **`nutrition_facts`** always carries the same thirteen keys — `energy_kcal`,
  `protein`, `carbs`, `fat`, `saturated_fat`, `trans_fat`, `fiber`, `sugar`,
  `sodium`, `cholesterol`, `potassium`, `calcium`, `iron` — per 100 g, with
  `sodium` in grams. Values may be `null`; a user-contributed product with no
  nutrition table stores `{}`.
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

Resolution order is Redis (5 min TTL) → Postgres → Open Food Facts (rate
limited to 12 req/min across the whole service). A product fetched from Open
Food Facts is written to Postgres before it is returned, so the second
look-up is local. Each resolved look-up increments `products.lookup_count`,
which is what `/trending` ranks on.

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
    "ingredients": "Gram flour, edible vegetable oil (palm), potato, salt…",
    "allergens": "en:peanuts",
    "source": "open_food_facts",
    "verified": false,
    "verification_count": 1,
    "additives": ["E330", "E500II"],
    "nova_group": 4,
    "nutriscore_grade": "d",
    "is_vegan": true,
    "is_vegetarian": true,
    "is_palm_oil_free": false,
    "category": "namkeen"
  }
}
```

Every nutrient is **per 100 g**, and `sodium` is in **grams** (Open Food Facts'
convention), not milligrams. The three dietary flags are deliberately
tri-state: `null` means the source has no definitive answer, never "no".

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

`GET /api/v1/products/needs-verification?country=IN&device_id=<uuid>&limit=12`

Products below the 3-confirmation threshold that this device hasn't already
voted on. Omitting `device_id` skips the exclusion rather than failing.

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
{ "barcode": "8901030895564", "country": "IN", "device_id": "9B1D6F20-…" }
```

Records a row in `verifications`, increments `products.verification_count`,
flips `verified` to true at 3, busts the product's cache entry, and returns the
refreshed product in the standard envelope.

---

### 7. Submit a label read on-device

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

`product_name`, `brand` and `nutrition` are optional — older clients send only
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
