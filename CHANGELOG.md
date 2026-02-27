# Changelog

All notable changes to this project will be documented in this file.


## 2026-02-28

### Added
- **Premium UI Component Library**: Integrated a comprehensive suite of polished, accessible components in `apps/web/components/ui/`:
  - `Badge`, `Separator`, `Slider`, `Sonner`, `Toast`, `Toaster`, `Toggle`, and `Tooltip`.
  - Expanded `Button` and `Textarea` capabilities with enhanced variant support.
- **Enhanced Visual Assets**: Added high-quality showcase images and branding assets for the "PixGen" identity (`apps/web/public/`).
- **Dashboard & Landing Layouts**: Introduced new `landing` and `dashboard` component directories to house modern, feature-rich UI sections.

### Changed
- **Branding & Identity**: Full migration to the **PixGen** brand across `layout.tsx`, `page.tsx`, and site metadata.
- **Global Aesthetics**: Refined `apps/web/app/globals.css` with a modern dark-mode color palette, custom utility classes, and optimized typography.
- **Infrastructure & Dependencies**:
  - Relaxed dependency version ranges in `apps/modal-compute/requirements.txt` (Modal, Click, Typer) for better environment compatibility.
  - Refactored `packages/db/index.ts` to implement a robust Prisma Singleton pattern with PostgreSQL adapter support.
  - Updated monorepo dependencies in `package.json` and `bun.lock` for better stability.

### Fixed
- **Next.js Build Compatibility**: 
  - Wrapped `useSearchParams` dependent logic in `DashboardContent` with `<Suspense />` boundaries to resolve build-time de-optimization errors.
  - Corrected `next.config.js` to ensure reliable static generation.
- **Git & Environment Hygiene**: 
  - Improved `.gitignore` patterns to accurately filter Bun and Next.js temporary files.
  - Resolved `CORS` and environment variable passthrough issues in backend routing.

### Removed
- **Legacy UI Components**: Performed a major codebase cleanup by deleting 10 redundant top-level components in `apps/web/components/` after verifying full feature parity in the new modular architecture:
  - `AppBar.tsx` & `Hero.tsx` (Replaced by `landing/Navbar` and `landing/HeroSection`).
  - `Train.tsx` (Replaced by the multi-step `dashboard/TrainTab`).
  - `Packs.tsx`, `PacksClient.tsx`, & `PackCard.tsx` (Replaced by `dashboard/PacksTab`).
  - `Camera.tsx`, `GenerateImage.tsx`, `ImageCard.tsx`, & `Model.tsx` (Replaced by optimized `dashboard/` tabs).
- **Fal.ai Integration**: Completely purged all remaining Fal.ai logic, model definitions (`FalAIModel.ts`), and package dependencies in favor of the new Modal compute pipeline.

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
