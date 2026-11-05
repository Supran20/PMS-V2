# PMS-V2 — Podcast Management System (Frontend)

A full-featured **Podcast Management System** dashboard built with Next.js 16 and React 19. It provides end-to-end studio workflow management including guest handling, interview scheduling, media management, channel administration, subscription plans, and platform-admin tooling.

---

## Tech Stack

| Category | Library / Tool |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [Material UI v7](https://mui.com/) |
| **Headless UI** | [@headlessui/react](https://headlessui.com/) |
| **Forms & Validation** | [React Hook Form v7](https://react-hook-form.com/) + [Zod v4](https://zod.dev/) |
| **HTTP Client** | [Axios](https://axios-http.com/) |
| **Drag & Drop** | [@dnd-kit](https://dndkit.com/) (core, sortable, utilities) |
| **Date Picker** | [react-datepicker](https://reactdatepicker.com/) |
| **Select** | [react-select](https://react-select.com/) |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) |
| **Icons** | [@iconify/react](https://iconify.design/) + `@mui/icons-material` |
| **Auth Cookies** | [js-cookie](https://github.com/js-cookie/js-cookie) |
| **Class Utilities** | `clsx` + `tailwind-merge` |
| **Language** | TypeScript 5 |
| **Package Manager** | pnpm |

---

## Project Structure

```
PMS-V2/
├── public/                      # Static assets (icons, images, SVGs)
├── src/
│   ├── app/                     # Next.js App Router — pages & layouts
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Login / landing page
│   │   ├── verify-otp/          # OTP verification flow
│   │   └── dashboard/           # Authenticated dashboard area
│   │       ├── layout.tsx       # Dashboard shell layout
│   │       ├── page.tsx         # Dashboard home
│   │       ├── guest/           # Guest management (list, add, edit, view)
│   │       ├── interview/       # Interview scheduling (list, add, edit)
│   │       ├── media/           # Media library (list, add, edit)
│   │       ├── studio/          # Studio management (list, add, edit)
│   │       ├── tags/            # Tag management
│   │       ├── users/           # User management
│   │       ├── settings/        # Account & app settings
│   │       └── platform-admin/  # Platform-admin tooling
│   │           ├── admins/      # Admin user CRUD
│   │           ├── channels/    # Channel CRUD
│   │           └── plans/       # Subscription plan CRUD
│   ├── components/              # Reusable UI components
│   │   ├── channels/            # Channel-specific components
│   │   ├── guest/               # Guest-specific components (reapproval modal, etc.)
│   │   ├── media/               # Media selector modal
│   │   ├── plans/               # Platform plan field components
│   │   ├── sortable/            # Drag-and-drop sortable list & item
│   │   └── ui/                  # Generic UI primitives (Button, Card, FormField, Pagination, Modals…)
│   ├── context/                 # React Context providers
│   │   ├── AuthContext.tsx      # Authentication state & helpers
│   │   └── InterviewContext.tsx # Interview workflow state
│   ├── hooks/                   # Custom React hooks
│   │   └── useConfirmDialog.ts
│   └── lib/                     # Shared utilities & API layer
│       ├── axios.ts             # Axios instance with interceptors
│       ├── utils.ts             # General utility functions
│       ├── date-utils.ts        # Date formatting helpers
│       ├── api/                 # Per-domain API modules
│       │   ├── auth.ts
│       │   ├── channel.ts
│       │   ├── channelProfile.ts
│       │   ├── guest.ts
│       │   ├── guestReapproval.ts
│       │   ├── guest_note.ts
│       │   ├── interview.ts
│       │   ├── media.ts
│       │   ├── permissions.ts
│       │   ├── permissionSettings.ts
│       │   ├── platformAdmin.ts
│       │   ├── roles.ts
│       │   ├── settings.ts
│       │   ├── studio.ts
│       │   ├── subscriptionPlan.ts
│       │   ├── tags.ts
│       │   └── user.ts
│       └── validations/         # Zod schemas (one per domain)
├── .github/workflows/
│   └── deploy.yml               # CI/CD — auto-deploy on push to `frontend` branch
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** v20+
- **pnpm** (recommended)

### Installation & Development

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
#    Review .env.local and populate the required variables

# 3. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

---

## Deployment

Deployment is automated via **GitHub Actions** ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

- **Trigger**: push to the `frontend` branch (or manual `workflow_dispatch`)
- **Target**: remote server via SSH
- **Process**: `git pull` → `pnpm install` → `pnpm build` → `pm2 restart 3`

> [!IMPORTANT]
> The `SSH_PRIVATE_KEY` secret must be configured in the repository's GitHub Actions secrets.

---

## Context for AI Assistants

Guidelines when working on this codebase:

1. **Routing & Layouts** — Use Next.js **App Router** (`src/app`). New pages go in `page.tsx` files inside their route directory. Use Server Components by default; add `'use client'` only when client interactivity is needed.
2. **Styling** — Primary engine is **Tailwind CSS v4**. Prefer utility classes over custom CSS. Use `clsx` + `tailwind-merge` for conditional class merging. MUI components are used for complex interactive widgets.
3. **Forms & Validation** — Always use `react-hook-form` with `@hookform/resolvers/zod` and a Zod schema defined in `src/lib/validations/`.
4. **Data Fetching** — Use the per-domain API modules in `src/lib/api/` (backed by the shared Axios instance in `src/lib/axios.ts`).
5. **State Management** — `useState` / `useReducer` for local state; Context providers in `src/context/` for global state.
6. **Imports** — Keep imports organized; follow the existing structure and patterns in the codebase.
7. **Code Quality** — Keep components single-responsibility. Maintain accessible, responsive, modern UI. Use `@headlessui/react` for custom interactive primitives.
8. **New API domains** — Add an API module in `src/lib/api/` and a matching Zod validation file in `src/lib/validations/`.
