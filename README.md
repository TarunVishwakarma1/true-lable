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

```markdown
┌───────────────────────────────────────┐       ┌───────────────────────────────────────┐
│              products                 │       │             verifications             │
├───────────────────────────────────────┤       ├───────────────────────────────────────┤
│ id: UUID (PK)                         │◀──┐   │ id: UUID (PK)                         │
│ barcode: VARCHAR(50) [UNIQUE, INDEX]  │   └───│ product_id: UUID (FK)                 │
│ country: VARCHAR(2) [INDEX]           │       │ barcode: VARCHAR(50) [INDEX]          │
│ product_name: TEXT                    │       │ user_id: VARCHAR(100) (Device UUID)   │
│ brand: TEXT [INDEX]                   │       │ country: VARCHAR(2)                   │
│ image_url: TEXT                       │       │ verified: BOOLEAN                     │
│ nutrition_facts: JSONB                │       │ created_at: TIMESTAMP                 │
│ ingredients: TEXT                     │       │ metadata: JSONB                       │
│ allergens: TEXT                       │       └───────────────────────────────────────┘
│ source: VARCHAR(30)                   │
│ verification_count: INT DEFAULT 0     │       ┌───────────────────────────────────────┐
│ verified: BOOLEAN DEFAULT FALSE       │       │            ocr_submissions            │
│ verified_at: TIMESTAMP (NULLABLE)     │       ├───────────────────────────────────────┤
│ confidence_score: FLOAT               │       │ id: UUID (PK)                         │
│ created_at: TIMESTAMP                 │       │ barcode: VARCHAR(50) [INDEX]          │
│ updated_at: TIMESTAMP                 │       │ image_url: TEXT                       │
└───────────────────────────────────────┘       │ extracted_text: TEXT                  │
                   ▲                            │ parsed_nutrition: JSONB               │
                   │                            │ confidence_score: FLOAT               │
                   │                            │ status: VARCHAR(30)                   │
                   │                            │ reason_discarded: TEXT                │
                   │                            │ created_at: TIMESTAMP                 │
                   └────────────────────────────│ final_product_id: UUID (FK, NULLABLE) │
                                                └───────────────────────────────────────┘
```

### Table Indices

- **`products`**:
  - `CREATE UNIQUE INDEX idx_products_barcode ON products(barcode);`
  - `CREATE INDEX idx_products_country_barcode ON products(country, barcode);`
  - `CREATE INDEX idx_products_verified ON products(verified);`
  - `CREATE INDEX idx_products_created_at ON products(created_at DESC);`
- **`verifications`**:
  - `CREATE INDEX idx_verifications_product_created ON verifications(product_id, created_at);`
  - `CREATE INDEX idx_verifications_barcode_country ON verifications(barcode, country);`
- **`ocr_submissions`**:
  - `CREATE INDEX idx_ocr_barcode ON ocr_submissions(barcode);`
  - `CREATE INDEX idx_ocr_status ON ocr_submissions(status);`
  - `CREATE INDEX idx_ocr_confidence ON ocr_submissions(confidence_score DESC);`

---

## 📡 API Contract

### 1. Search Product by Barcode

- **Endpoint**: `GET /api/v1/products/search`
- **Query Parameters**:
  - `barcode`: `string` (required)
  - `country`: `string` (default: `"IN"`)

#### Response (`200 OK` - Found)

```json
{
  "status": "found",
  "data": {
    "barcode": "8901030825415",
    "product_name": "Classic Salted Potato Chips",
    "brand": "Lays",
    "nutrition_facts": {
      "energy_kcal": 540,
      "protein_g": 6.8,
      "carbohydrates_g": 52.5,
      "fat_g": 33.7,
      "sodium_mg": 520
    },
    "source": "open_food_facts",
    "verified": true,
    "verification_count": 4,
    "confidence_score": 0.95,
    "cached": true
  }
}
```

#### Response (`404 Not Found`)

```json
{
  "status": "not_found",
  "message": "Product not found in Open Food Facts or crowdsourced database."
}
```

---

### 2. Submit Label Photo (OCR Extraction)

- **Endpoint**: `POST /api/v1/products/submit_label`
- **Request Body**:

```json
{
  "barcode": "8901030825415",
  "country": "IN",
  "image": "<base64_encoded_jpeg>",
  "user_device_id": "9B1D6F20-80E2-47DB-9D9B-FDF6ECFA8B85"
}
```

#### Response (`200 OK`)

```json
{
  "ocr_submission_id": "b18b6250-9d04-4cc4-9c09-a1b9ceec848a",
  "extracted_data": {
    "product_name": "Classic Salted Potato Chips",
    "brand": "Lays",
    "nutrition_facts": {
      "energy_kcal": 540,
      "protein_g": 6.8,
      "fat_g": 33.7
    }
  },
  "confidence_score": 0.92,
  "needs_user_confirmation": true
}
```

---

### 3. Verify Product Data

- **Endpoint**: `POST /api/v1/products/verify`
- **Request Body**:

```json
{
  "barcode": "8901030825415",
  "country": "IN",
  "confirmed": true,
  "user_device_id": "9B1D6F20-80E2-47DB-9D9B-FDF6ECFA8B85",
  "product_id": "b18b6250-9d04-4cc4-9c09-a1b9ceec848a"
}
```

#### Response (`200 OK`)

```json
{
  "status": "verified",
  "verification_count": 3,
  "product_now_verified": true
}
```

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
