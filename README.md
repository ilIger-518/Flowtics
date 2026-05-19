# Flowtics

Flowtics is a Next.js (App Router) project with a minimal drag-and-drop image uploader UI, Prisma-backed data modeling, and Tailwind CSS styling.

## Architecture Overview
- Next.js App Router pages live in `app/` with a root layout in `app/layout.tsx` and the home page in `app/page.tsx`.
- UI uses React 19 client components where needed (e.g., the uploader uses drag-and-drop and browser APIs).
- Prisma Client is generated to `app/generated/prisma` and used for database access (no server routes are currently wired in this repo).
- Static assets and uploaded files are intended to be stored under `public/` and `uploads/` respectively.

## Folder and File Responsibilities
- `app/`
	- `layout.tsx`: Root layout, global fonts, HTML/body structure.
	- `page.tsx`: Home page (client component) with drag-and-drop image selection, previews, and an upload action.
	- `globals.css`: Global styles.
	- `generated/prisma/`: Prisma Client output.
- `prisma/`
	- `schema.prisma`: Database schema and generator config.
	- `migrations/`: Prisma migration history.
- `public/`: Static assets.
- `uploads/`: Intended destination for uploaded images (API route not yet implemented).
- `types/`: Shared type definitions.
- `components/`, `lib/`: Reserved for UI components and shared utilities (currently empty).

## Data Flow and Execution Flow
1) The home page renders a drag-and-drop zone using `react-dropzone`.
2) Dropped/selected files are stored in component state and previewed via `URL.createObjectURL`.
3) Clicking Upload posts a `multipart/form-data` request to `/api/upload` with `files` entries.
4) The upload API route is not yet implemented, so the request currently 404s unless you add the handler.

## API Endpoints
There are no API routes in the repo right now.

Planned endpoint (referenced by the UI):
- `POST /api/upload`
	- Request: `multipart/form-data` with one or more `files` fields.
	- Response: JSON payload indicating success and any stored paths.
	- Status: Not implemented.

## Environment Variables and Configuration
- `DATABASE_URL`: PostgreSQL connection string for Prisma.

## Setup and Development
Install dependencies, then run the dev server:

```bash
npm install
npm run dev
```

## Important Implementation Details
- The home page is a client component because it uses browser APIs (drag-and-drop, object URLs).
- Previews are created with `URL.createObjectURL` and revoked on cleanup to avoid memory leaks.
- Upload requests currently POST to `/api/upload`, which must be added to persist files.

## Dependency Usage and Rationale
- `next`: App Router, routing, and server rendering.
- `react` / `react-dom`: UI framework.
- `react-dropzone`: Drag-and-drop file selection with browser fallback.
- `tailwindcss`: Utility-first styling.
- `prisma` / `@prisma/client`: Database schema and client.
- `recharts`: Charting (not currently used).
- `sharp`: Image processing (not currently used).

## State Management Patterns
- Local component state via `useState` for selected files and upload progress.
- Effects via `useEffect` for cleanup of object URLs.

## Database Schema and Migrations
Prisma uses a PostgreSQL datasource. The `Receipt` model is defined in [prisma/schema.prisma](prisma/schema.prisma):

- `Receipt`
	- `id` (Int, primary key)
	- `merchant` (String, nullable)
	- `total` (Float, nullable)
	- `category` (String, nullable)
	- `receiptDate` (DateTime, nullable)
	- `imagePath` (String)
	- `rawText` (String, nullable)
	- `createdAt` (DateTime, defaults to now)

Migrations live under `prisma/migrations/`.

## Known Limitations and Edge Cases
- `/api/upload` is referenced by the UI but not implemented, so uploads do not persist yet.
- `uploads/` is not served by Next.js by default; you may need a static serving strategy or custom route.
- `recharts` and `sharp` are installed but unused.
