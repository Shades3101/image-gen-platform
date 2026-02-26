# Changelog

All notable changes to this project will be documented in this file.

## 2026-02-26

### Removed
- **Fal.ai Integration**: Completely removed all Fal.ai dependencies and legacy logic.
  - Deleted `apps/backend/models/FalAIModel.ts` and `apps/backend/models/BaseModel.ts`.
  - Removed `@fal-ai/client` from `apps/backend/package.json`.
  - Removed the "Migration Alert" banner and unused imports from `apps/web/components/Hero.tsx`.
  - Polished `README.md` to remove Fal.ai from architecture diagrams and environment configuration guides.

### Added
- **Modal.com Compute Endpoints** (`apps/modal-compute/src/main.py`): 
  - `start_training`: Implemented Flux LoRA training endpoints utilizing `A100` and `A10G` GPU profiles.
  - `generate_image`: Formed an inference function for generating images via Modal instead of local inference.
  - `verify_signature`: Wrote a webhook signature verification pipeline to authenticate status callbacks against `MODAL_WEBHOOK_SECRET`.
  - Added a `requirements.txt` specifically for the Modal environment to manage Python dependencies (`modal`, `fastapi`).
- **Backend Modal Abstract** (`apps/backend/models/ModalModel.ts`): 
  - `trainModel` and `generateImage`: Added bridge interface classes within the Node.js Express server to facilitate executing Modal API payloads.
- **Deployment Workflows** (`turbo.json`, `packages/db/package.json`):
  - `generate`: Introduced a formal task sequence across Turborepo to reliably trigger Prisma client builds.
  - `postinstall`: Included a script inside `packages/db` that forces `prisma generate`, resolving "missing database Prisma client" errors.
- **Developer Experience** (`.env.example`):
  - Added comprehensive templates specifying required credentials (`FRONTEND_URL`, `MODAL_WEBHOOK_SECRET`) for developers.

### Changed
- **Server Dynamic Configurations** (`apps/backend/index.ts`, `apps/backend/package.json`):
  - `app.listen()`: Replaced hardcoded localhost bindings with `0.0.0.0` to permit external network routing (e.g. for Render).
  - Refactored server configuration to inherit the explicit process `PORT` environment variable seamlessly.
  - Integrated `bun` into the primary sequence for faster server instantiations.
  - `build`: Introduced production build compiling (`tsc -b`) configured within `tsconfig.json`.
  - Removed debug `console.log` statements and unused `USER_ID` constants across the file.
- **Global Project Rebranding** (`apps/web/app/config.ts`, `apps/web/app/layout.tsx`, `apps/web/components/AppBar.tsx`):
  - Renamed operations from "PhotoAI" / "Pic-X" to its finalized metadata name "**PixGen**". 
- **Turborepo Proxies and Task Configurations** (`turbo.json`):
  - Restructured dependency pipelines for explicit passthroughs (`"passThroughEnv": ["*"]`). By securely exposing injected environment secrets dynamically across `build`, `start`, and `generate` tasks, the apps avoid `undefined` reference errors.
- **Visuals and Hero Component Enhancements** (`apps/web/components/Hero.tsx`):
  - `Hero()`: Exchanged broken image placeholders for cohesive, selected, high-quality Unsplash source graphics.
  - `Hero()`: Built a "Migration Alert" UI component notifying end-users of temporary backend transition downtime.
- **Monorepo Dependency Refresh** (`package.json`, `bun.lock`):
  - Updated major architectural libraries (`next` to 16.1.6, `turbo` to 2.8.9, `react` to 19.2.4). 

### Fixed
- **TypeScript Ethnicity Enum Assignments** (`apps/web/components/Train.tsx`, `packages/common/types.ts`):
  - `Train()`: Investigated and resolved a restrictive type assignment constraint. The localized `Ethnicity` enum keys from the Next.js training forms were misaligned against the expected schema definitions.
- **Container Build Deployment Errors** (`apps/modal-compute/src/main.py`):
  - Fixed persistent `FileNotFoundError` scenarios encountered during the `modal deploy` image building process. Adjusted file copying and absolute pathname resolutions handling `.env` dependencies.
- **CORS Error in Production** (`apps/backend/index.ts`):
  - API setup: Requests from the frontend to the backend were dropping preflight checks due to absent origins. Implemented the official `cors` Express extension securely.

## 2026-02-14

### Added
- `seed.ts` in `packages/db` for initial database population.
- `Camera` component (`apps/web/components/Camera.tsx`) for captured training images.
- `Upload` component (`apps/web/components/upload.tsx`) with multi-file support and preview logic.
- `PackCard` and `Model` display components (`apps/web/components/PackCard.tsx`, `Model.tsx`).
- `PacksClient` logic (`apps/web/app/dashboard/PacksClient.tsx`) for managing pack interactions.

### Changed
- `Train()` component logic and UI updates (`apps/web/components/Train.tsx`).
- `OutputImageStatusEnum` and enhanced model relations (`packages/db/prisma/schema.prisma`).
- `FalAIModel` integration refactor (`apps/http-backend`, `apps/web`).
- Shared `types` and validator schemas (`packages/common/types.ts`).
- Nav and `Hero()` section improvements.
- `turbo.json` build configuration optimization.

### Improved
- Global styling and UI responsiveness.
- Middleware logic for auth integration (`apps/web/middleware.ts`).
- TypeScript definitions across the monorepo.
