# PixGen — System Architecture Audit

This file tracks identified issues, bugs, and areas for improvement in the PixGen image-generation-platform monorepo.

## 🛠 Backend Issues

### Project Structure & Configuration
- [ ] **Single-File Backend**: All 9 API routes are defined in a single 312-line `index.ts` file. As the app grows, this becomes unmaintainable.
  - *Impact*: Poor code organization, difficult to navigate and test individual routes
  - *Effort*: Medium (extract route handlers into separate modules like `routes/ai.ts`, `routes/packs.ts`, `routes/webhooks.ts`)
- [ ] **`@types/*` in Production Dependencies**: `@types/cors`, `@types/express`, and `@types/jsonwebtoken` are listed under `dependencies` instead of `devDependencies` in `apps/backend/package.json`.
  - *Impact*: Bloats production bundle unnecessarily
  - *Effort*: Trivial (move to `devDependencies`)
- [ ] **Console.log in Production Code**: Debug `console.log` statements left in pre-signed URL generation (line 37) and training request (lines 70–71) of `index.ts`.
  - *Impact*: Leaks internal URLs and keys to stdout in production
  - *Effort*: Trivial (replace with structured logging or remove)
- [ ] **Stale `.env.example`**: `apps/backend/.env.example` still references `FAL_KEY` (removed dependency) and is missing `MODAL_BASE_URL`, `MODAL_DEV`, `MODAL_WEBHOOK_SECRET`, and `FRONTEND_URL`.
  - *Impact*: New contributors cannot set up the backend without guessing required variables
  - *Effort*: Trivial (update file to reflect actual env vars)
- [ ] **Missing Frontend `.env.example`**: `apps/web/.env` contains real keys but no `.env.example` template exists for contributors.
  - *Impact*: Onboarding friction; risk of accidentally committing real keys
  - *Effort*: Trivial (create `.env.example` with placeholder values)
- [x] **Next.js Build Compatibility**: Wrapped `useSearchParams` dependent logic in `DashboardContent` with `<Suspense />` boundaries.
- [x] **Git Hygiene**: Improved `.gitignore` patterns to accurately filter Bun and Next.js temporary files.
- [ ] **Clerk Middleware File Naming**: Clerk middleware is still in `proxy.ts` instead of the Next.js-standard `middleware.ts`.
  - *Impact*: Next.js may not auto-detect the middleware; confusing for contributors
  - *Effort*: Trivial (rename `proxy.ts` → `middleware.ts`)

### Security

#### 🔴 CRITICAL Priority
- [ ] **Unauthenticated Pre-Signed URL Endpoint**: `GET /pre-signed-url` has **no `authMiddleware`** — anyone can generate S3/R2 upload URLs without authentication.
  - *Impact*: Attackers can upload arbitrary files to your Cloudflare R2 bucket, leading to storage abuse and potential malicious content hosting
  - *Effort*: Trivial (add `authMiddleware` to the route)

- [ ] **No Rate Limiting**: All API endpoints have zero request throttling. No `express-rate-limit` or equivalent is configured.
  - *Impact*: Vulnerable to brute-force attacks, DoS, and abuse of GPU training endpoints (each training run costs real money on Modal)
  - *Effort*: Medium (install `express-rate-limit`, configure per-route limits)

- [ ] **Non-Null Assertion on Secrets**: `process.env.AUTH_JWT_KEY!`, `process.env.MODAL_WEBHOOK_SECRET!`, and other secrets use TypeScript non-null assertions. If env vars are missing, the server starts but silently fails on first request.
  - *Impact*: Silent authentication bypass or crash on first request in misconfigured deployments
  - *Effort*: Low (add startup validation — check all required env vars exist before `app.listen()`)

#### 🟠 HIGH Priority
- [ ] **No Input Sanitization on Pack/Bulk Endpoints**: `GET /pack/bulk` returns all packs without pagination or filtering. `GET /image/bulk` accepts `limit` and `offset` as raw strings with no max cap.
  - *Impact*: Database overload from excessively large queries; potential data exfiltration
  - *Effort*: Low (add server-side max limits, validate numeric inputs)

- [ ] **Missing Error Handling in `/ai/generate`**: Unlike `/ai/training` which has try-catch, the `/ai/generate` endpoint has no error handling — a Modal API failure will crash the request with an unhandled promise rejection.
  - *Impact*: Unhandled errors cause 500 responses with stack traces leaked to the client
  - *Effort*: Low (wrap in try-catch like the training endpoint)

- [ ] **Missing Error Handling in `/pack/generate`**: Same issue as `/ai/generate` — no try-catch around the Modal API calls or bulk database operations.
  - *Impact*: A single failed image generation in a pack breaks the entire batch with no graceful error
  - *Effort*: Low (add try-catch, consider partial failure handling)

- [ ] **Account Enumeration via Error Messages**: API returns specific error messages like `"Model not found"` and `"Input incorrect"` which could help attackers map valid resources.
  - *Impact*: Information leakage about system internals
  - *Effort*: Low (use generic error messages in production)

#### 🟡 MEDIUM Priority
- [ ] **No API Versioning**: All routes are at the root level (`/ai/training`, `/models`, etc.) with no version prefix.
  - *Impact*: Breaking changes to the API will affect all clients simultaneously
  - *Effort*: Low (prefix all routes with `/api/v1/`)

- [ ] **No Health Check Endpoint**: No `GET /health` or `GET /status` endpoint for monitoring backend availability.
  - *Impact*: Load balancers and monitoring tools cannot determine if the backend is healthy
  - *Effort*: Trivial (add a simple health endpoint)

- [ ] **CORS Wildcard Risk**: CORS origin is set from `process.env.FRONTEND_URL` with no fallback validation. If the env var is unset, `cors({ origin: undefined })` allows all origins.
  - *Impact*: Any website could make authenticated API requests on behalf of users
  - *Effort*: Trivial (throw on missing `FRONTEND_URL` or default to strict)

- [ ] **Missing Security Headers**: No `helmet` middleware or manual security headers configured on the Express server.
  - *Impact*: Vulnerable to clickjacking, MIME sniffing, and other header-based attacks
  - *Effort*: Low (install and configure `helmet`)

---

## 🗄 Database Issues

### Schema Design
- [ ] **`User` Model is Unused**: The `User` table exists in the Prisma schema but no API endpoint creates, reads, or references it. Authentication is handled entirely by Clerk.
  - *Impact*: Dead schema cruft; confusing for contributors
  - *Effort*: Trivial (remove the model or integrate it for user profile data)

- [ ] **No Foreign Key on `userId`**: Both `Model.userId` and `OutputImages.userId` are plain strings with no `@relation` to the `User` model. There is zero referential integrity.
  - *Impact*: Orphaned records, no cascade deletes, impossible to join user data
  - *Effort*: Medium (add relations and run migration — breaking if `userId` values don't match `User.id`)

- [ ] **Field Naming Typo**: `updateAt` is used instead of the standard `updatedAt` in `User`, `Model`, and `OutputImages` models.
  - *Impact*: Inconsistency with Prisma conventions and community expectations
  - *Effort*: Low (rename via migration — non-breaking at app level since Prisma maps it)

- [ ] **No Indexes on Frequently Queried Fields**: No explicit indexes on `Model.userId`, `OutputImages.userId`, `OutputImages.modelId`, or `OutputImages.status`.
  - *Impact*: Slow query performance as data grows, especially for the image bulk endpoint which filters by userId + status
  - *Effort*: Low (add `@@index` declarations in schema)

- [ ] **Inconsistent ID Strategy**: All models use UUID strings which is consistent — but no indexes are optimized for UUID lookups at scale.
  - *Impact*: UUID primary keys are slower than sequential IDs for B-tree indexes
  - *Effort*: Low (acceptable trade-off for distributed systems, but consider ULID for ordered UUIDs)

---

## 🎨 Frontend Issues

### Code Quality & Standards
- [ ] **Dual UI Component Libraries**: `packages/ui/src/` has 3 components (`button`, `card`, `code`) while `apps/web/components/ui/` has 19 shadcn/ui components. The two libraries are disconnected.
  - *Impact*: Duplicate button/card implementations; unclear which to use
  - *Effort*: Medium (consolidate into one location, likely `packages/ui/`)

- [ ] **Hardcoded Backend URL in `.env`**: `NEXT_PUBLIC_BACKEND_URL=http://localhost:8080` is committed in the `.env` file rather than `.env.local`.
  - *Impact*: Overrides production environment variables; confuses deployment
  - *Effort*: Trivial (move to `.env.local`, add to `.gitignore`)

### Error Handling & Resilience
- [ ] **No Global Error Boundary**: No `error.tsx` or `global-error.tsx` in the Next.js app directory to catch rendering errors.
  - *Impact*: Unhandled component errors show a blank white screen to users
  - *Effort*: Low (add error boundary components)

- [ ] **No Loading States at Route Level**: No `loading.tsx` files in route segments for streaming SSR fallbacks.
  - *Impact*: Users see no feedback during page transitions
  - *Effort*: Low (add `loading.tsx` with skeleton UI)

- [ ] **Missing `not-found.tsx`**: No custom 404 page defined in the app directory.
  - *Impact*: Users see the default Next.js 404 instead of a branded page
  - *Effort*: Trivial (add a styled `not-found.tsx`)

### UI/UX Issues
- [ ] **No Responsive Image Optimization**: Images in `public/` (gallery-1/2/3.png, hero-image.png) are served as raw PNGs with no Next.js `<Image>` optimization.
  - *Impact*: Slow page loads on mobile (600KB+ of unoptimized images)
  - *Effort*: Low (use `next/image` with width/height props)

- [ ] **Incomplete `next.config.js`**: While build issues were resolved for static generation, the config is still empty. No image domains (R2), redirects, rewrites, or security headers are configured.
  - *Impact*: Missing image optimization for external domains (Cloudflare R2 URLs), no security headers
  - *Effort*: Low (add `images.remotePatterns` and `headers()` config)

- [ ] **Dashboard Uses Client-Side Tab Routing**: Tab state is managed via `useSearchParams` query params, requiring a full `"use client"` boundary on the entire dashboard page.
  - *Impact*: Entire dashboard is client-rendered; no SSR benefits for initial load
  - *Effort*: Medium (consider server-side tab routing with parallel routes)

---

## 🐍 Modal Compute Issues

### GPU Service (`apps/modal-compute/src/main.py`)
- [x] **No Retry Logic on Webhook Failures**: Fixed by adding 3-attempt exponential backoff retry and a 60-second timeout to mitigate Render backend cold wake-ups.

- [ ] **Hardcoded Training Parameters**: Resolution (512), batch size (1), and LoRA rank (8) are fixed in the `TrainConfig` dataclass with no API override.
  - *Impact*: No ability to tune quality vs. cost per training run
  - *Effort*: Low (accept optional overrides in the training payload)

- [x] **Fal.ai Integration Purge**: All 10 redundant components and Fal.ai logic (`FalAIModel.ts`) have been removed in favor of Modal.
- [ ] **No GPU Fallback**: The service targets L4 GPUs specifically. If L4 capacity is unavailable on Modal, jobs will queue indefinitely.
  - *Impact*: Training jobs blocked during GPU shortages
  - *Effort*: Low (add fallback GPU tiers in Modal config)

---

## 🚀 Performance & Scalability

### Backend Bottlenecks
- [ ] **Synchronous Webhook Processing**: Webhook handlers (`/modal/webhook/train`, `/modal/webhook/image`) perform database updates synchronously. Under high load, webhook processing could back up.
  - *Solution*: Queue webhook payloads and process asynchronously
- [ ] **No Connection Pooling Configuration**: The Prisma client uses `@prisma/adapter-pg` with a raw connection string. No explicit pool size or timeout configuration.
  - *Solution*: Configure `PrismaPg` with pool settings appropriate for expected load
- [ ] **No Caching Layer**: Every `/models` and `/pack/bulk` request hits the database directly. These rarely-changing datasets are prime caching candidates.
  - *Solution*: Add Redis or in-memory caching with TTL for static-ish data

### Deployment & DevOps
- [ ] **No CI/CD Pipeline**: No GitHub Actions, Vercel config, or deployment scripts of any kind.
  - *Impact*: Manual deployments; no automated testing or build verification before merge
  - *Effort*: Medium (set up GitHub Actions for lint, type-check, build)
- [ ] **No Dockerization**: No `Dockerfile` or `docker-compose.yml` for containerized deployments.
  - *Impact*: Environment-specific bugs; difficult to reproduce production issues locally
  - *Effort*: Medium (create multi-stage Docker builds for backend and web)
- [ ] **No Monitoring/Observability**: No error tracking (Sentry), structured logging (Pino), or APM tooling.
  - *Impact*: Production issues are invisible until users report them
  - *Effort*: Medium (integrate Sentry + structured logging)

### Testing & Reliability
- [ ] **Zero Test Coverage**: No unit, integration, or E2E tests exist anywhere in the monorepo.
  - *Impact*: Every code change is a potential regression; no confidence in refactors
  - *Effort*: High (establish testing infrastructure with Vitest + Playwright)
- [ ] **No API Documentation**: No OpenAPI/Swagger documentation for the 9 REST endpoints.
  - *Impact*: Frontend developers must read backend source code to understand API contracts
  - *Effort*: Medium (add Swagger via `express-openapi` or manual OpenAPI spec)

---

## 📦 Dependency & Configuration Audit

### Version Matrix

| Dependency | Version | Package | Notes |
|---|---|---|---|
| TypeScript | 5.9.2 | Root + all packages | ✅ Aligned |
| React | ^19.2.4 | web, ui | ✅ Current |
| Next.js | ^16.1.6 | web | ✅ Current |
| Express | ^5.2.1 | backend | ✅ Current |
| Prisma | ^7.4.0 | db | ✅ Current |
| Tailwind CSS | ^4.1.18 | web | ✅ v4 |
| Zod | ^4.3.6 | common | ✅ Current |
| Bun | 1.3.3 | Root | ✅ Current |
| Turbo | ^2.8.9 | Root | ✅ Current |
| Modal (Python) | 1.2.6 | modal-compute | ✅ Current |

### Monorepo Workspace Map

| Package | Name | Internal Consumers |
|---|---|---|
| `packages/db` | `db` | backend |
| `packages/common` | `common` | backend, web |
| `packages/ui` | `@repo/ui` | web |
| `packages/eslint-config` | `@repo/eslint-config` | web, ui |
| `packages/typescript-config` | `@repo/typescript-config` | web, ui |

---

## 🗺 Phase 2: Production Readiness Roadmap

To move beyond the current development state, the following changes are required for a **production-grade deployment**.

### 1. Security Hardening
- [ ] **Authenticate all endpoints**: Add `authMiddleware` to `/pre-signed-url` and validate `/pack/bulk` access.
- [ ] **Rate limiting**: Install `express-rate-limit` with per-route limits (training: 5/hr, generation: 30/hr, general: 100/15min).
- [ ] **Startup env validation**: Verify all required environment variables exist before `app.listen()`.
- [ ] **Security headers**: Add `helmet` middleware and configure Next.js security headers.
- [ ] **Input validation hardening**: Add max length/size constraints to all Zod schemas.

### 2. Reliability & Error Handling
- [ ] **Global error handlers**: Add Express error middleware and Next.js error boundaries.
- [ ] **Webhook retry logic**: Implement exponential backoff in Modal compute for failed webhook deliveries.
- [ ] **Graceful shutdown**: Handle `SIGTERM`/`SIGINT` to drain connections before exit.
- [ ] **Database indexes**: Add indexes on `userId`, `modelId`, `status`, and `createdAt` fields.

### 3. Developer Experience
- [ ] **Route modularization**: Split `index.ts` into separate route modules.
- [ ] **Testing infrastructure**: Set up Vitest for unit tests, Playwright for E2E.
- [ ] **CI/CD pipeline**: GitHub Actions for lint → type-check → test → build → deploy.
- [ ] **API documentation**: Generate OpenAPI spec from route definitions.
- [ ] **Update `.env.example` files**: Ensure all required variables are documented.

### 4. Scalability
- [ ] **Redis caching**: Cache model listings, pack data, and user sessions.
- [ ] **Connection pooling**: Configure PgBouncer or Prisma Accelerate for database connections.
- [ ] **CDN for static assets**: Serve gallery images and fonts from a CDN edge.
- [ ] **Image optimization**: Configure Next.js `<Image>` with remote pattern support for R2 URLs.
- [ ] **Background job processing**: Queue expensive operations (training, bulk generation) via BullMQ.

---

## 📅 Tracking History
- **2026-02-26**: Comprehensive system architecture audit performed by Antigravity.
- **2026-02-28 (Execution)**: Addressed critical build failures, codebase hygiene, branding overhaul, and performance bottlenecks:
  - **Asynchronous Training Logic**: Refactored the backend to fire-and-forget Modal training jobs, resolving the "Step 3" frontend hang where users were stuck on a loader for ~10 minutes.
  - **Request Robustness**: Added background `try-catch` blocks to Modal compute triggers to safeguard against unhandled promise rejections.
  - Fixed Next.js build de-optimization via `<Suspense />` boundaries.
  - Purged Fal.ai dependencies and legacy UI components (10 components removed).
  - Implemented PixGen branding and modern dark-mode aesthetics.
  - Relaxed dependency ranges in `modal-compute` for improved stability.
  - Integrated Radix UI / Shadcn suite (`Sonner`, `Badge`, `Slider`, etc.).
  - Implemented Prisma Singleton pattern for database stability.
  - Refined `.gitignore` for the monorepo environment.
  - Fully migrated from FLUX.1-dev to SDXL 1.0 (saving ~$2/hr per job using T4 GPUs).
  - Resolved `Float/Half` mixed-precision SDXL generation bugs by pinning `peft==0.15.2` and `diffusers==0.31.0`.
  - Configured successful Modal → Render webhook pipeline mapping (addressed HMAC JSON mismatches + added 60-second timeouts).
- **Still Pending**: Security hardening (Rate limiting, Auth on pre-signed URLs), Console log cleanup, and UI library consolidation remain high-priority tasks for the next sprint.
