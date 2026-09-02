let meta = #{
    name: "finish-notion-mvp",
    description: "Finish the Notion clone MVP: core page/database logic, shadcn default theme, Refero-informed UI",
    when_to_use: "Finish or rebuild the Notion-style workspace MVP in this repo",
    phases: [
        #{ title: "Audit", detail: "inventory the current app against the MVP spec" },
        #{ title: "Foundation", detail: "domain model, persistence, store actions, seed" },
        #{ title: "Features", detail: "databases UI, editor, navigation" },
        #{ title: "Visual", detail: "shadcn default theme and Notion-like chrome" },
        #{ title: "Verify", detail: "build and product review" },
        #{ title: "Fix", detail: "close remaining gaps" },
    ],
};

let status_schema = #{
    "type": "object",
    "required": ["ok", "summary"],
    "properties": #{
        "ok": #{ "type": "boolean" },
        "summary": #{ "type": "string" },
        "files": #{
            "type": "array",
            "items": #{ "type": "string" },
        },
    },
};

let review_schema = #{
    "type": "object",
    "required": ["passed", "issues"],
    "properties": #{
        "passed": #{ "type": "boolean" },
        "issues": #{
            "type": "array",
            "maxItems": 12,
            "items": #{ "type": "string" },
        },
        "evidence": #{ "type": "string" },
    },
};

fn rules() {
    let s = "";
    s += "Workspace: /home/jack/workspace/notion-clone. Spec: /home/jack/workspace/notion-clone/docs/MVP.md. ";
    s += "You MUST read the spec and inspect existing files with read_file, grep, and list_dir before editing. Do not answer from memory. ";
    s += "HARD RULES: (1) Use shadcn/ui primitives for all chrome. Add missing ones with `pnpm dlx shadcn@latest add <name> --yes`. ";
    s += "(2) Keep the default shadcn Neutral/New York CSS variables in app/globals.css. Do not invent a custom palette. Light mode is default. ";
    s += "(3) Implement Notion core logic: pages nest, databases are pages whose children are rows, rows are pages with properties, views (table/board/list) with filter/sort, trash cascades, localStorage persistence. ";
    s += "(4) Do not add auth, comments, collab, formulas, relations, or a backend. ";
    s += "(5) TypeScript strict; pnpm build must pass. Match existing code style. No drive-by refactors. ";
    s += "(6) When done, return {ok, summary, files} describing what you changed.";
    s
}

fn impl_opts(label, schema) {
    #{
        label: label,
        capability_mode: "all",
        agent_type: "general-purpose",
        output_schema: schema,
    }
}

fn ok_of(r) {
    r != () && r.success && (r.output.ok == () || r.output.ok == true)
}

// --- Audit ---
phase("Audit");
log("Auditing the current app against the MVP spec");

let audit_prompt = "";
audit_prompt += "You are auditing a Notion-clone Next.js app. ";
audit_prompt += rules();
audit_prompt += " READ-ONLY. Do not edit files. ";
audit_prompt += "Read docs/MVP.md, lib/types.ts, lib/workspace-store.tsx, lib/seed.ts, components/ (app-shell, editor, page, sidebar, search, trash), app/layout.tsx, app/globals.css, package.json, components.json. ";
audit_prompt += "Return ok=true and a summary listing: (a) what already works, (b) the gaps the later agents must fill, (c) files they should touch. files = paths you actually read.";

let audit = agent(audit_prompt, #{
    label: "audit",
    capability_mode: "read-only",
    agent_type: "general-purpose",
    output_schema: status_schema,
});
if !ok_of(audit) {
    log("Audit did not return a usable summary; implementers will rely on the spec file");
}

// --- Foundation ---
phase("Foundation");
log("Implementing domain model, persistence, and store");

let found_prompt = "";
found_prompt += "You are implementing the FOUNDATION of a Notion clone. ";
found_prompt += rules();
found_prompt += " Scope for THIS agent only: ";
found_prompt += "1. Extend lib/types.ts with PageKind, properties, schema, views as specified in docs/MVP.md. Keep existing Block types. ";
found_prompt += "2. Extend lib/workspace-store.tsx reducer + context with hydrate, rename-workspace, duplicate-page, move-page, reorder-pages, reorder-blocks, create-database, add-row, update-property-value, add/update/delete-property, add/update/delete-view, add-select-option. Preserve existing create/update/trash/restore/delete/empty-trash. ";
found_prompt += "3. Persist workspace to localStorage key notion-clone:workspace with SSR-safe hydration (skeleton until loaded; do not flash seed then overwrite). ";
found_prompt += "4. Update lib/seed.ts: existing pages get kind:'page'; add a Tasks database (Status To-do/In progress/Done, Assignee text, Due date, Priority select, ~5 rows, table + board views) and convert Reading list into a database. Update Getting started copy — this is not Primer. ";
found_prompt += "5. Export typed helpers for default property values and for collecting live rows of a database (children that are not trashed). ";
found_prompt += "Do not build database UI components yet. Other agents will. After edits, run a TypeScript check if practical.";

let foundation = agent(found_prompt, impl_opts("foundation", status_schema));
if !ok_of(foundation) {
    complete(#{ ok: false, phase: "Foundation", summary: "Foundation agent failed; stopping." });
}

// --- Features ---
phase("Features");
log("Building databases UI");

let db_prompt = "";
db_prompt += "You are implementing DATABASES UI for a Notion clone. ";
db_prompt += rules();
db_prompt += " The foundation (types, store, seed, persistence) should already exist — read lib/types.ts and lib/workspace-store.tsx first and use those APIs. Do not re-model the domain. ";
db_prompt += " Build: ";
db_prompt += "1. components/database/ — table view, board view, list view, view toolbar (Tabs + Filter + Sort + Search + New), property cell editors using shadcn Input, Checkbox, Select, Button, Badge, DropdownMenu, Popover, Empty. ";
db_prompt += "2. Wire PageView so database pages render hero + views; row pages (parent is a database) render a properties panel under the title then the block editor. ";
db_prompt += "3. Table: title opens the row; inline cell edit; Empty placeholder; Add property; New row. ";
db_prompt += "4. Board: columns from groupBy select/status + No status; New in a column sets that status; card menu Move to. ";
db_prompt += "5. List: compact title + chips. ";
db_prompt += "6. Filters and sorts per docs/MVP.md. ";
db_prompt += "Add shadcn tabs/select/label if missing. Refero analogues: n8n table, Fibery board.";

let databases = agent(db_prompt, impl_opts("databases", status_schema));
if !ok_of(databases) {
    log("Databases agent reported failure; continuing so later agents can repair");
}

log("Polishing editor and page chrome");

let editor_prompt = "";
editor_prompt += "You are upgrading the PAGE EDITOR of a Notion clone. ";
editor_prompt += rules();
editor_prompt += " Keep the working slash menu, markdown shortcuts, block types, enter/backspace, covers, icons. ";
editor_prompt += " Add Duplicate page and Move to (Command/Dialog picking a destination or workspace root; block cycles) in page-toolbar and sidebar tree menus. ";
editor_prompt += " If store helpers for duplicate/move/reorder already exist, use them. ";
editor_prompt += " Sidebar tree: show a table-ish icon for kind==='database'. ";
editor_prompt += " Page options: Add sub-page, Duplicate, Move to, Favorite, Trash. ";
editor_prompt += " Do not restyle the whole app (visual agent does that). Do not rebuild databases UI unless it is broken and unusable. ";
editor_prompt += " Refero analogue: Craft editor — large Untitled placeholder, hover-revealed handles, light canvas.";

let editor = agent(editor_prompt, impl_opts("editor", status_schema));
if !ok_of(editor) {
    log("Editor agent reported failure; continuing");
}

log("Upgrading navigation, search, settings, templates");

let nav_prompt = "";
nav_prompt += "You are upgrading NAVIGATION of a Notion clone. ";
nav_prompt += rules();
nav_prompt += " 1. Sidebar: workspace name, Search (⌘K), New page dropdown (Empty page, Meeting notes, Task database), Favorites, Private tree, Trash, Settings. Use shadcn Button, DropdownMenu, Separator, ScrollArea. ";
nav_prompt += " 2. Settings as a shadcn Sheet: workspace name, appearance Light/Dark/System persisted with the dark class on html. Add `pnpm dlx shadcn@latest add sheet switch --yes` if missing. ";
nav_prompt += " 3. Search dialog: include database rows and property values; keep keyboard open. ";
nav_prompt += " 4. Cmd/Ctrl+N creates an empty page. ";
nav_prompt += " 5. Trash dialog stays; ensure restore/delete/empty still work with databases and rows. ";
nav_prompt += " 6. Remove Primer leftovers from app/layout.tsx metadata (this is a Notion-style workspace). Do not force dark mode. ";
nav_prompt += " Refero analogue: Zapier tables + Create, Craft sidebar.";

let nav = agent(nav_prompt, impl_opts("navigation", status_schema));
if !ok_of(nav) {
    log("Navigation agent reported failure; continuing");
}

// --- Visual ---
phase("Visual");
log("Applying shadcn default theme and Notion-like chrome");

let visual_prompt = "";
visual_prompt += "You are the VISUAL pass for a Notion clone. ";
visual_prompt += rules();
visual_prompt += " 1. Keep default shadcn tokens in app/globals.css. You may add sidebar tokens ONLY if they match the official shadcn sidebar recipe; otherwise use bg-muted/40. ";
visual_prompt += " 2. Default light mode. Remove data-color-mode and Primer attributes. Support class-based dark. ";
visual_prompt += " 3. Wire Geist or the existing --font-geist-sans/--font-sans on body. ";
visual_prompt += " 4. Notion-like density: 240-260px sidebar, hover-revealed tree/block gutters, ghost icon buttons, page title ~text-4xl font-bold, muted placeholders, databases full-width with horizontal scroll on small screens. ";
visual_prompt += " 5. Theme toggle must work if Settings already has one; if not, add it using shadcn Switch or a Button group. ";
visual_prompt += " 6. Do not change business logic except to fix layout bugs you encounter. ";
visual_prompt += " Refero: Craft light canvas, shadcn monochrome, Perplexity airy sidebar.";

let visual = agent(visual_prompt, impl_opts("visual", status_schema));
if !ok_of(visual) {
    log("Visual agent reported failure; continuing into verify");
}

// --- Verify ---
phase("Verify");
log("Building and reviewing the MVP");

let build_prompt = "";
build_prompt += "Verify the Notion clone at /home/jack/workspace/notion-clone. ";
build_prompt += "Run `pnpm install` if node_modules is missing, then `pnpm exec tsc --noEmit` and `pnpm build`. ";
build_prompt += "Read the spec at /home/jack/workspace/notion-clone/docs/MVP.md. ";
build_prompt += "Set passed=true only if the production build succeeds. issues = compiler/build errors (empty list if none). evidence = last 40 lines of build output. ";
build_prompt += "If the build fails, do not start a large rewrite; just report the errors.";

let review_prompt = "";
review_prompt += "Adversarial product review of /home/jack/workspace/notion-clone against /home/jack/workspace/notion-clone/docs/MVP.md. ";
review_prompt += "Use grep and read_file. Do not edit. ";
review_prompt += "Confirm with evidence: (1) shadcn primitives used, default theme CSS variables still present, light default not forced dark; ";
review_prompt += "(2) Page kind database + properties + table/board/list views exist in UI not just types; ";
review_prompt += "(3) localStorage persistence; (4) duplicate/move/trash; (5) settings appearance; (6) seed includes a Tasks database. ";
review_prompt += "passed=true only if those six are evidenced in code. issues = concrete missing items (file paths). evidence = files you read.";

let verify_jobs = [
    #{
        prompt: build_prompt,
        label: "build",
        capability_mode: "execute",
        agent_type: "general-purpose",
        output_schema: review_schema,
    },
    #{
        prompt: review_prompt,
        label: "review",
        capability_mode: "read-only",
        agent_type: "general-purpose",
        output_schema: review_schema,
    },
];
let verify = parallel(verify_jobs);

let build_ok = false;
let review_ok = false;
let issue_list = [];
if verify[0] != () && verify[0].success && verify[0].output.passed == true {
    build_ok = true;
}
if verify[0] != () && verify[0].success && verify[0].output.issues != () {
    for i in verify[0].output.issues { issue_list.push(i); }
}
if verify[1] != () && verify[1].success && verify[1].output.passed == true {
    review_ok = true;
}
if verify[1] != () && verify[1].success && verify[1].output.issues != () {
    for i in verify[1].output.issues { issue_list.push(i); }
}
log("Build passed=" + build_ok.to_string() + " review passed=" + review_ok.to_string() + " issues=" + issue_list.len().to_string());

// --- Fix ---
phase("Fix");
log("Closing remaining gaps");

let issues_json = json_encode(issue_list);

let fix_prompt = "";
fix_prompt += "You are the FIX pass for a Notion clone. ";
fix_prompt += rules();
fix_prompt += " Build passed=" + build_ok.to_string() + ". Product review passed=" + review_ok.to_string() + ". ";
fix_prompt += " Reported issues JSON: " + issues_json + " ";
fix_prompt += " Read docs/MVP.md and the current code. Fix every concrete issue. If the build failed, make `pnpm exec tsc --noEmit` and `pnpm build` succeed. ";
fix_prompt += " If issues is empty and both passed, still do a quick pass: README, seed copy, and any obvious crash (missing kind on old pages — treat missing kind as 'page'). ";
fix_prompt += " Then run the build again and only return ok=true if it passes.";

let fix = agent(fix_prompt, impl_opts("fix", status_schema));

let report = "";
report += "# finish-notion-mvp result\n\n";
if audit != () && audit.success && audit.output.summary != () {
    report += "## Audit\n" + audit.output.summary + "\n\n";
}
if foundation != () && foundation.success && foundation.output.summary != () {
    report += "## Foundation\n" + foundation.output.summary + "\n\n";
}
if databases != () && databases.success && databases.output.summary != () {
    report += "## Databases\n" + databases.output.summary + "\n\n";
}
if editor != () && editor.success && editor.output.summary != () {
    report += "## Editor\n" + editor.output.summary + "\n\n";
}
if nav != () && nav.success && nav.output.summary != () {
    report += "## Navigation\n" + nav.output.summary + "\n\n";
}
if visual != () && visual.success && visual.output.summary != () {
    report += "## Visual\n" + visual.output.summary + "\n\n";
}
report += "## Verify\nbuild_ok=" + build_ok.to_string() + " review_ok=" + review_ok.to_string() + "\n\n";
if fix != () && fix.success && fix.output.summary != () {
    report += "## Fix\n" + fix.output.summary + "\n";
}

let path = write_scratch_file("report.md", report);
let final_ok = ok_of(fix) && (build_ok || ok_of(fix));
complete(#{
    ok: final_ok,
    path: path,
    build_ok: build_ok,
    review_ok: review_ok,
    issue_count: issue_list.len(),
});
