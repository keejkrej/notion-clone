# Notion Clone MVP

Finish the existing Next.js 15 app at `/home/jack/workspace/notion-clone` into an authentic Notion-style workspace. Keep the current architecture (App Router, client workspace store, shadcn/ui New York + Neutral). Do not rewrite from scratch.

## Non-negotiable UI rules

1. **Use shadcn/ui primitives only for chrome.** Buttons, menus, dialogs, popovers, command palette, tabs, selects, switches, sheets, checkboxes, badges, separators, tooltips, empty states, scroll areas, inputs, textareas, alerts. Add missing primitives with `pnpm dlx shadcn@latest add <name>` (or `npx shadcn@latest add`). Do not invent parallel unstyled widgets.
2. **Start from the default shadcn theme.** Keep the existing `:root` and `.dark` CSS variables in `app/globals.css` (Neutral / New York). Do not replace them with a custom Notion palette. Do not add Primer `data-color-mode` attributes. Default to **light mode**. Optional dark mode via the `dark` class on `<html>` plus a settings toggle that persists to localStorage.
3. **Notion-like layout using tokens, not a new palette.** Sidebar `bg-sidebar` if the token exists, otherwise `bg-muted/40`. Canvas `bg-background`. Ghost/icon buttons for chrome. Hover-revealed block handles and tree actions. Content column `max-w-3xl` for pages; databases may go full width.
4. **No Primer leftovers.** Metadata currently claims Primer; layout forces dark via `data-color-mode="dark"`. Fix both.

## Refero-informed product patterns

Refero does not have first-party Notion app screens. Use these product-screen analogues (already researched):

- **Craft editor** (`91d0ab05-d436-4c34-a480-7c339696ede0`): light canvas, large gray "Untitled" title placeholder, sparse chrome, sidebar + writing column, insertable block types.
- **Fibery kanban** (`263e09e8-efbb-4bbc-8358-c5723eefe88f`): columns from a status field, top toolbar (search, view toggle, filter, sort, New), stacked cards with colored tags, left workspace nav.
- **n8n data table** (`7e488722-96f2-41bc-ba1a-6ceadb2b1fd7`): spreadsheet grid, muted "Empty" cells, Add row / Add column, checkbox select, inline edit, search.
- **Zapier tables** (`d2d0e1fa-abb2-497c-bcee-9bf56f360b23`): prominent "+ Create" in the sidebar, search + recency filter over structured records.
- **shadcn UI** style (`c14c0a94-1037-449e-bf5b-4cb972656ac7`) and **Perplexity** (`b95e58ce-d00e-4de1-ad6b-6f1c7d7a5593`): monochrome, token-driven, airy sidebar + canvas.

## Core business logic (this is the product)

Notion's model, not a notes app:

1. **Everything is a page.** Pages nest infinitely. A page has title, icon, cover, blocks, favorite, trash state, parent, timestamps.
2. **A database is a page** whose children are rows. Each row is also a full page (properties on top, blocks below).
3. **Properties** live on row pages. Schema lives on the database page.
4. **Views** are named windows over the same rows (table, board, list) with independent sorts and filters.
5. **Trash is soft-delete** and cascades to descendants. Restore reattaches, or promotes to root if the parent is still trashed. Permanent delete and empty-trash exist.
6. **Search** covers titles, block text, and property values.
7. **Workspace persists** in `localStorage` (key `notion-clone:workspace`) with SSR-safe hydration.

### Domain types (extend `lib/types.ts`)

```ts
type PageKind = 'page' | 'database'

type PropertyType =
  | 'title' | 'text' | 'number' | 'select' | 'multi_select'
  | 'date' | 'checkbox' | 'url' | 'status'

interface SelectOption { id: string; name: string; color: string }

interface PropertyDef {
  id: string
  name: string
  type: PropertyType
  options?: SelectOption[] // select, multi_select, status
}

type PropertyValue =
  | { type: 'title' } // title is Page.title
  | { type: 'text'; value: string }
  | { type: 'number'; value: number | null }
  | { type: 'select'; optionId: string | null }
  | { type: 'multi_select'; optionIds: string[] }
  | { type: 'date'; value: string | null } // YYYY-MM-DD
  | { type: 'checkbox'; value: boolean }
  | { type: 'url'; value: string }
  | { type: 'status'; optionId: string | null }

interface Filter {
  id: string
  propertyId: string
  op: 'equals' | 'contains' | 'is_empty' | 'is_not_empty' | 'checked' | 'unchecked'
  value?: string
}

interface Sort { propertyId: string; direction: 'asc' | 'desc' }

interface DatabaseView {
  id: string
  name: string
  type: 'table' | 'board' | 'list'
  groupBy?: string // property id (select/status) for board
  sorts: Sort[]
  filters: Filter[]
}

interface DatabaseSchema {
  properties: PropertyDef[]
  views: DatabaseView[]
  defaultViewId: string
}

interface Page {
  id: string
  parentId: string | null
  kind: PageKind
  title: string
  icon: string | null
  cover: string | null
  blocks: Block[]
  favorite: boolean
  deletedAt: number | null
  createdAt: number
  updatedAt: number
  schema?: DatabaseSchema       // databases only
  properties?: Record<string, PropertyValue> // rows of a database
}

interface Workspace {
  name: string
  pages: Record<string, Page>
  rootOrder: string[]
  childOrder: Record<string, string[]>
}
```

Keep existing `Block` / `BlockType`. Add `'toggle'` and `'page'` (child-page / link-to-page) if you can do them cleanly; otherwise skip those two block types rather than half-shipping them.

Select option colors must be shadcn semantic tokens or a small fixed map of Tailwind classes that work in both themes (`bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200`, etc.). Do not add new CSS variables for them.

### Store actions (extend `lib/workspace-store.tsx`)

Keep the reducer. Add:

- `hydrate` from localStorage
- `rename-workspace`
- `duplicate-page` (deep-copy page + descendants, new ids, insert after original)
- `move-page` (change parent, update rootOrder/childOrder, prevent cycles)
- `reorder-pages` (sibling order in rootOrder or childOrder)
- `reorder-blocks`
- `create-database` (page kind=database with Title + Status + a table view + a board view grouped by Status)
- `add-row` (child page of a database with default property values)
- `update-property-value`
- `add-property` / `update-property` / `delete-property` (and strip values from rows)
- `add-view` / `update-view` / `delete-view`
- `add-select-option`

Existing create/update/trash/restore/delete/empty-trash must keep working. New pages default `kind: 'page'`. When creating a child of a database, it is a row (`kind: 'page'` with `properties` initialized from schema).

### Persistence

- Load once after mount. Until hydrated, show a simple shadcn skeleton (muted bars), not the seed flash then overwrite.
- Save on every workspace change after hydration.
- Seed (`lib/seed.ts`) is the first-run default. Include at least:
  - Getting started page (existing, updated copy — this is a Notion-style workspace, not Primer)
  - Product roadmap page with sub-pages
  - **Tasks** database: Status (To-do / In progress / Done), Assignee text, Due date, Priority select; ~5 rows; table + board views
  - **Reading list** as a database (Title, Status, Type select) rather than a todo page
  - Meeting notes page

### Databases UI

When `page.kind === 'database'`:

- Page hero (icon, cover, title) then a **view bar** using shadcn `Tabs` (one tab per view) plus a "New" dropdown (`DropdownMenu`) to add Table / Board / List.
- Toolbar: Filter (`Popover`), Sort (`Popover`), Search (`Input`), New row (`Button`).
- **Table:** title column (opens the row page) + one column per property. Cells edit inline (Input, Checkbox, Select, date `Input type="date"`). Empty cells show muted "Empty". Header "Add property" adds a column. Footer "New" adds a row. Clicking a title navigates to `/p/{rowId}`.
- **Board:** columns from the grouped select/status options + an "No status" column. Cards show title + up to two other properties as `Badge`s. Dragging is optional; a card menu "Move to" that sets the group property is required. "New" in a column creates a row with that status.
- **List:** compact rows with title + property chips; click opens the page.
- Filters apply to all three views. Sorts apply to table and list; board sorts within a column.

When opening a **row page** whose parent is a database, render a properties panel under the title (label + editor per property) then the block editor.

### Editor / pages (keep what works)

Existing slash menu, markdown shortcuts, block types, enter/backspace, covers, icons, breadcrumbs, favorites, trash, search (⌘K), nested tree — keep and polish.

Add:

- Duplicate page and Move to (command in page `...` menu and tree `...` menu). Move to is a `Command`/`Dialog` picking a destination page (or "No parent" / workspace root). Block moving a page into itself or a descendant.
- New page templates in the sidebar "+": Empty page, Meeting notes, Task database.
- Settings `Sheet`: workspace name, appearance (Light / Dark / System).
- Cmd/Ctrl+N creates a page (in addition to existing Cmd+Alt+N if you keep it).
- Sidebar: Favorites, Private (root pages), a "New page" control, Search, Trash, Settings. Database pages show a table icon vs document icon.

### What not to build

Auth, sharing, comments, realtime collab, formulas, relations, rollups, file uploads, calendar/timeline/gallery views, public pages, AI.

## Quality bar

- TypeScript strict, `pnpm build` must pass.
- Client-only store is fine; no backend.
- Accessible labels on icon buttons and dialogs.
- Empty states use shadcn `Empty`.
- Mobile: sidebar collapses (existing pattern); databases horizontally scroll rather than crush.
- Update README to describe the MVP and `pnpm dev`.
- Seed copy should teach slash commands, databases, views, trash, search.

## Current code (do not throw away)

- `lib/types.ts`, `lib/seed.ts`, `lib/workspace-store.tsx`
- `components/editor/*`, `components/page/*`, `components/sidebar/*`
- `components/search-dialog.tsx`, `components/trash-dialog.tsx`, `components/app-shell.tsx`
- `components/ui/*` shadcn primitives already present: alert-dialog, avatar, badge, button, card, checkbox, collapsible, command, dialog, dropdown-menu, empty, input, popover, scroll-area, separator, textarea, tooltip

Add primitives as needed: `tabs`, `select`, `switch`, `sheet`, `label`, `context-menu`. Prefer `input type="date"` over adding a calendar package.
