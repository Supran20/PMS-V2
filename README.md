# Podcast Frontend (rst-frontend)

This is a modern web application built for managing a podcast studio and dashboard. It is built using the latest React and Next.js features, focusing on high performance, modern design aesthetics, and a smooth developer experience.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Material UI](https://mui.com/)
- **Form Management & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Data Fetching**: [Axios](https://axios-http.com/) & [SWR](https://swr.vercel.app/) (Note: swr is in the root package.json, while other deps are in rst-frontend/package.json)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Icons**: [@iconify/react](https://iconify.design/) and `@mui/icons-material`

## Project Structure

The project follows a standard Next.js App Router structure:

- `/src/app`: Contains all Next.js routes, layouts, and page components.
  - `/app/dashboard`: Main authenticated area with sub-modules like `guest`, `interview`, `media`, `settings`, `studio`, `tags`, and `users`.
  - `/app/verify-otp`: Authentication and OTP verification flows.
- `/src/components`: Reusable UI components.
  - `/components/media`: Media playback and management components.
  - `/components/sortable`: Drag-and-drop sortable components utilizing `dnd-kit`.
  - `/components/ui`: Generic and headless UI components.
- `/src/context`: React Context providers for global state management.
- `/src/lib`: Utility functions, API configurations (e.g., Axios instances), and shared helpers.

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- `pnpm` (recommended package manager for this project)

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Set up environment variables:
   Review the existing `.env.local` or `.env` files and populate necessary variables.

3. Run the development server:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Context for Claude & AI Assistants

This section provides specific instructions for Claude (or other AI coding assistants) working on this project:

1. **Routing and Layouts**: We use the Next.js **App Router** (`src/app`). Any new pages should be created as `page.tsx` within their respective directory in `src/app`. Layouts (`layout.tsx`) wrap specific route segments. Use Server Components by default unless client interactivity is required (then add `'use client'` at the top of the file).
2. **Styling Approach**: The primary styling engine is **Tailwind CSS**. Prefer Tailwind utility classes over custom CSS. Material UI components are used for complex interactive widgets. We use `clsx` and `tailwind-merge` to conditionally join classes safely.
3. **Forms and Validation**: Always use `react-hook-form` coupled with `zod` resolvers for form state and validation.
4. **Data Fetching**: Use `axios` for REST API calls. For client-side data fetching and caching, utilize `swr`.
5. **State Management**: For local state, use React hooks (`useState`, `useReducer`). For global state, refer to the providers in `src/context`. 
6. **Imports**: Keep imports organized and follow the existing codebase structure.
7. **Design & Code Quality**: Maintain a modern, vibrant, and responsive design language. Keep components modular (single-responsibility). Ensure accessibility (a11y) standards are met when building custom UI elements using `@headlessui/react`.
