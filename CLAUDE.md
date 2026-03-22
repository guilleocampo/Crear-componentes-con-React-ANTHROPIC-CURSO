# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps + generate Prisma client + run migrations)
npm run setup

# Development server (Turbopack)
npm run dev

# Build
npm run build

# Lint
npm run lint

# Tests (Vitest + jsdom)
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Reset database
npm run db:reset

# Prisma migrations (after schema changes)
npx prisma migrate dev

# Regenerate Prisma client
npx prisma generate
```

## Architecture Overview

UIGen is a Next.js 15 App Router application that lets users describe React components in a chat, then generates and previews them in real time via Claude AI.

### Data flow

1. User types a prompt in `ChatInterface` → `ChatContext` sends it to `POST /api/chat`
2. The API route streams a response using Vercel AI SDK's `streamText`, with two AI tools:
   - `str_replace_editor` — view/create/edit files via string replacement or line insertion
   - `file_manager` — rename/delete files
3. Tool calls stream back to the client; `FileSystemContext.handleToolCall` applies them to the in-memory `VirtualFileSystem`
4. `PreviewFrame` watches `refreshTrigger` from `FileSystemContext`, rebuilds an import map from all virtual files via `createImportMap`, and writes a full HTML document into a sandboxed `<iframe>` srcdoc

### Virtual File System (`src/lib/file-system.ts`)

All generated files exist only in memory — nothing is written to disk. `VirtualFileSystem` is a tree of `FileNode` objects (files and directories) stored in a flat `Map<path, FileNode>`. It serializes to/from plain JSON for network transport and database storage.

### Preview pipeline (`src/lib/transform/jsx-transformer.ts`)

- `transformJSX` uses `@babel/standalone` to transpile TSX/JSX in the browser
- `createImportMap` builds a browser import map: local files become `Blob` URLs; unknown third-party packages are resolved via `https://esm.sh/`; missing local imports get placeholder stub modules
- `createPreviewHTML` generates the full iframe HTML with Tailwind CDN, the import map, collected CSS, and an error boundary

### Authentication (`src/lib/auth.ts`)

Custom JWT auth using `jose`. Sessions are stored in an httpOnly cookie (`auth-token`, 7-day expiry). There is no OAuth — only email/password via bcrypt. `src/middleware.ts` is where route protection can be added.

### Persistence

SQLite via Prisma (`prisma/dev.db`). The `Project` model stores `messages` (JSON string) and `data` (serialized VirtualFileSystem JSON). Projects are saved at the end of each streaming response in `onFinish` inside the chat route.

### AI provider (`src/lib/provider.ts`)

If `ANTHROPIC_API_KEY` is absent, a `MockLanguageModel` is used that returns static counter/form/card components without calling the real API. The real model is `claude-haiku-4-5`.

### Context providers

- `FileSystemProvider` — owns the `VirtualFileSystem` instance and exposes file CRUD + `handleToolCall`
- `ChatProvider` — wraps Vercel AI SDK's `useChat`, passes the serialized file system in every request body, and routes tool calls to `FileSystemContext`

Both providers are composed in `src/app/[projectId]/page.tsx` (authenticated project view) and `src/app/main-content.tsx` (anonymous/home view).

### Key environment variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Real Claude API (falls back to mock if absent) |
| `JWT_SECRET` | Signs session tokens (defaults to `development-secret-key`) |
| `DATABASE_URL` | Prisma SQLite path (set in `.env`) |

## Database

The schema is defined in `prisma/schema.prisma` — consult it as the source of truth whenever you need to understand data models, relations, or available fields.

## Code Style

- Add specific comments to every component: describe its purpose, key props/state, and any non-obvious logic.

### Path alias

`@/` maps to `src/` (configured in `tsconfig.json`). The preview iframe also resolves `@/` imports when building the browser import map.
