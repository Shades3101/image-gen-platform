<div align="center">
  <img src="https://raw.githubusercontent.com/Shades3101/PixGen/main/apps/web/public/turborepo-dark.svg" alt="PixGen Logo" width="120" />
  <h1>PixGen</h1>
  <p><strong>The Ultimate AI Photo Generation & Personalized Model Fine-Tuning Platform</strong></p>

  <p align="center">
    <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" /></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
    <a href="https://turbo.build/"><img src="https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turborepo" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  </p>
</div>

---

## 🌟 Overview

**PixGen** represents the next generation of personalized AI creativity. Unlike generic image generators, PixGen empowers users to create **their own digital twins** through SDXL LoRA fine-tuning. By uploading a small dataset of photos, users can train a custom AI model that understands their unique likeness, allowing them to generate hyper-realistic portraits in any setting, style, or outfit imaginable.

Built on a robust, high-performance monorepo architecture, PixGen is designed for scale, speed, and seamless developer experience.

---

## 📸 Project Showcase

> *Add your screenshots here manually to showcase the stunning UI!*

<div align="center">
  <img src="https://via.placeholder.com/800x450?text=PixGen+Dashboard+Preview" alt="Dashboard Preview" width="800" />
  <br />
  <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
    <img src="https://via.placeholder.com/400x225?text=Model+Training+UI" alt="Training" width="400" />
    <img src="https://via.placeholder.com/400x225?text=Personalized+Gallery" alt="Gallery" width="400" />
  </div>
</div>

---

## 🏗️ Architecture & Flow

PixGen orchestrates a complex workflow involving cloud storage, GPU training clusters, and a responsive frontend.

```mermaid
graph TD
    User[User] -->|Uploads Photos| Frontend[Next.js Frontend]
    Frontend -->|Request Pre-signed URL| Backend[Express Backend]
    Backend -->|Return S3/R2 URL| Frontend
    Frontend -->|Upload Zip| S3[Cloudflare R2 / AWS S3]
    Frontend -->|Trigger Training| Backend
    Backend -->|Start LoRA Training| Modal[Modal.com GPU Cluster]
    Modal -- Webhook (Training Complete) --> Backend
    Backend -- Update Status --> DB[(PostgreSQL)]
    
    User -->|Generate Image| Frontend
    Frontend -->|Request Generation| Backend
    Backend -->|Inference Request| Modal
    Modal -- Webhook (Image Ready) --> Backend
    Backend -- Store Image URL --> DB
```

1. **Upload & Zip**: User selects 5-20 photos. The frontend zips them and securely uploads to Object Storage (S3/R2) using a pre-signed URL.
2. **Training**: The backend triggers a Modal.com SDXL LoRA training job using the uploaded zip.
3. **Async Webhooks**: Modal notifies the backend via webhooks when training is done or when images are generated, ensuring non-blocking operations.
4. **Inference**: Users select a trained model (or a generic one) and a "Prompt Pack" style to generate new images.

---

## 🧠 Core Features

### 1. Personalized AI Training
- **SDXL LoRA Integration**: Leverage the highly efficient and capable SDXL 1.0 architecture for high-fidelity facial and feature retention on cost-effective GPUs.
- **Dataset Orchestration**: Automated handling of image uploads, zip creation, and cloud storage syncing.
- **Asynchronous Processing**: Background training tasks with real-time status updates (Pending, Generated, Failed).

### 2. Intelligent Image Generation
- **Prompt Packs**: Pre-configured creative prompt libraries for instant results (e.g., "Cyberpunk", "Professional Headshots", "Ancient Warrior").
- **Custom Inference**: Full control over text-to-image prompts using your own fine-tuned models.

### 3. Developer-First Architecture
- **Turborepo Monorepo**: Blazing-fast build pipelines and optimized local development using a unified workspace.
- **Type-Safe Ecosystem**: End-to-end TypeScript spanning from the Prisma database schema to the React frontend.
- **Shared Packages**: Common logic, UI components, and TypeScript configurations shared across apps for maximum consistency.



---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Monorepo** | [Turborepo](https://turbo.build/) | Performance-focused workspace management. |
| **Frontend** | [Next.js 16](https://nextjs.org/) | React 19 framework for a fast, SEO-optimized UI. |
| **Backend** | [Express.js](https://expressjs.com/) | Scalable API orchestration running on [Bun](https://bun.sh). |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Robust relational data storage. |
| **ORM** | [Prisma](https://www.prisma.io/) | Modern database toolkit and type-safe client. |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS for rapid, modern UI building. |
| **AI Workload**| [Modal.com](https://modal.com) | Standard GPU-accelerated model training and inference. |
| **Storage** | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) | S3-compatible object storage for datasets. |

---

## 📂 Project Structure

```bash
PixGen/
├── apps/
│   ├── web/               # Next.js Frontend (React 19)
│   ├── backend/           # API Service (Express + Bun)
│   ├── modal-compute/     # Modal compute workers (Python)
├── packages/
│   ├── common/            # Shared Zod schemas, Types & Constants
│   ├── db/                # Prisma Schema & Database Client
│   ├── ui/                # Premium React Component Library (Radix UI)
│   ├── eslint-config/     # Strict linting standards
│   └── typescript-config/ # Base TS configurations
├── turbo.json             # Build cache & pipeline config
└── package.json           # Root workspace configuration
```

---

##  Database Schema

The core entities in the PostgreSQL database:

- **User**: Stores user metadata (synced with Clerk).
- **Model**: Represents a fine-tuned LoRA model (contains `tensorPath`, `triggerWord`).
- **OutputImages**: Stores generated images and their status (`Pending`, `Generated`, `Failed`).
- **Packs & PackPrompts**: Curated styles and prompt templates for users to choose from.

---

## 🚀 Getting Started

### Prerequisites
- **Bun**: `curl -fsSL https://bun.sh/install | bash`
- **PostgreSQL**: Local instance or remote provider (Supabase, Neon).
- **Accounts**: Clerk (Auth), Cloudflare R2/S3 (Storage), [Modal.com](https://modal.com) (AI Workload).

### Step-by-Step Installation

1. **Clone & Install**:
   ```bash
   git clone https://github.com/Shades3101/PixGen.git
   cd PixGen
   bun install
   ```

2. **Environment Configuration**:
   Create `.env` files in `apps/web/`, `apps/backend/`, and `packages/db/`.

   #### `apps/backend/.env`
   ```env
   PORT=3001
   FRONTEND_URL="http://localhost:3000"
   # Storage (R2/S3)
   S3_ACCESS_KEY="your-access-key"
   S3_SECRET_KEY="your-secret-key"
   ENDPOINT="your-s3-endpoint"
   BUCKET_NAME="pixgen-models"
   # Auth & AI
   AUTH_JWT_KEY="your-rsa-public-key"
   MODAL_WEBHOOK_SECRET="your-modal-webhook-secret"
   MODAL_BASE_URL="https://your-modal-app-url"
   WEBHOOK_BASE_URL="your-ngrok-or-prod-url"
   # DB
   DATABASE_URL="postgresql://user:password@localhost:5432/pixgen"
   ```

   #### `apps/web/.env`
   ```env
   NEXT_PUBLIC_BACKEND_URL="http://localhost:3001"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   NEXT_PUBLIC_CLOUDFLARE_URL="https://pub-..."
   ```

3. **Database Setup**:
   ```bash
   cd packages/db
   bunx prisma generate
   bunx prisma db push
   ```

4. **Launch the platform**:
   ```bash
   # From root
   bun run dev
   ```

---
