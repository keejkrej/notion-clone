# Notion clone

A Notion-style workspace that runs entirely in the browser. Pages nest, databases are pages whose children are rows, and rows are full pages with properties on top and blocks below. There is no account, no backend, and no collaboration — the workspace is saved to `localStorage` under `notion-clone:workspace`.

## Run it

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Production build:

```bash
pnpm build
pnpm start
```

## What’s in the MVP

- **Pages** nest infinitely. Title, icon, cover, favorites, breadcrumbs.
- **Block editor** with slash commands (`/` on an empty block) and markdown shortcuts (`# `, `## `, `- `, `1. `, `[] `, `> `, ` ``` `, `---`).
- **Databases** with table, board, and list views. Independent filters and sorts per view. Inline property editors. Rows open as pages.
- **Search** (`⌘K` / `Ctrl+K`) over titles, block text, and property values.
- **Trash** is soft-delete and cascades to descendants. Restore reattaches, or promotes to root if the parent is still trashed. Empty trash permanently deletes.
- **Move to** and **Duplicate** from the page `…` menu and the sidebar tree.
- **⌘N** / **Ctrl+N** creates a page. Sidebar **New page** also has Meeting notes and Task database templates.
- **Settings** for workspace name and appearance (Light / Dark / System). Light is the default.

The first run seeds Getting started, a product roadmap with sub-pages, a **Tasks** database, a **Reading list** database, and meeting notes.

Not in scope: auth, sharing, comments, realtime collab, formulas, relations, rollups, file uploads, calendar/gallery views, public pages, or AI.
