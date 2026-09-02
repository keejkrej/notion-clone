import type {
  Block,
  BlockType,
  DatabaseSchema,
  DatabaseView,
  Page,
  PageKind,
  PropertyDef,
  PropertyType,
  PropertyValue,
  SelectOption,
  Workspace,
} from './types'
import { defaultPropertiesFromSchema } from './types'

let counter = 0
export function uid(prefix = 'id') {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`
}

export function block(type: BlockType, content = '', checked?: boolean): Block {
  return { id: uid('b'), type, content, checked }
}

function page(
  id: string,
  parentId: string | null,
  title: string,
  icon: string | null,
  cover: string | null,
  blocks: Block[],
  favorite = false,
  extras?: {
    kind?: PageKind
    schema?: DatabaseSchema
    properties?: Record<string, PropertyValue>
  },
): Page {
  const now = Date.now()
  return {
    id,
    parentId,
    kind: extras?.kind ?? 'page',
    title,
    icon,
    cover,
    blocks,
    favorite,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    schema: extras?.schema,
    properties: extras?.properties,
  }
}

export const COVERS: { id: string; label: string; css: string }[] = [
  { id: 'aurora', label: 'Aurora', css: 'linear-gradient(135deg, var(--primary), var(--accent))' },
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(135deg, var(--destructive), var(--secondary))' },
  { id: 'meadow', label: 'Meadow', css: 'linear-gradient(135deg, var(--secondary), var(--primary))' },
  { id: 'ember', label: 'Ember', css: 'linear-gradient(135deg, var(--destructive), var(--muted))' },
  { id: 'slate', label: 'Slate', css: 'linear-gradient(135deg, var(--muted-foreground), var(--border))' },
  { id: 'lavender', label: 'Lavender', css: 'linear-gradient(135deg, var(--accent), var(--primary))' },
]

export function coverCss(id: string | null) {
  return COVERS.find((c) => c.id === id)?.css ?? null
}

export function defaultStatusOptions(): SelectOption[] {
  return [
    { id: uid('opt'), name: 'To-do', color: 'gray' },
    { id: uid('opt'), name: 'In progress', color: 'blue' },
    { id: uid('opt'), name: 'Done', color: 'green' },
  ]
}

export function defaultOptionsForType(type: PropertyType): SelectOption[] | undefined {
  if (type === 'status') return defaultStatusOptions()
  if (type === 'select' || type === 'multi_select') return []
  return undefined
}

export function createDefaultDatabaseSchema(): DatabaseSchema {
  const titleId = uid('prop')
  const statusId = uid('prop')
  const options = defaultStatusOptions()
  const tableId = uid('view')
  const boardId = uid('view')
  return {
    properties: [
      { id: titleId, name: 'Name', type: 'title' },
      { id: statusId, name: 'Status', type: 'status', options },
    ],
    views: [
      { id: tableId, name: 'Table', type: 'table', sorts: [], filters: [] },
      { id: boardId, name: 'Board', type: 'board', groupBy: statusId, sorts: [], filters: [] },
    ],
    defaultViewId: tableId,
  }
}

export function meetingNotesBlocks(): Block[] {
  return [
    block('heading3', 'Attendees'),
    block('bulleted', ''),
    block('heading3', 'Notes'),
    block('bulleted', ''),
    block('heading3', 'Action items'),
    block('todo', ''),
  ]
}

export function createDatabaseView(
  type: DatabaseView['type'],
  schema?: DatabaseSchema,
  name?: string,
): DatabaseView {
  const groupBy =
    type === 'board'
      ? schema?.properties.find((p) => p.type === 'status' || p.type === 'select')?.id
      : undefined
  return {
    id: uid('view'),
    name: name ?? (type === 'table' ? 'Table' : type === 'board' ? 'Board' : 'List'),
    type,
    groupBy,
    sorts: [],
    filters: [],
  }
}

function tasksSchema(): DatabaseSchema {
  const title: PropertyDef = { id: 'prop_tasks_title', name: 'Name', type: 'title' }
  const status: PropertyDef = {
    id: 'prop_tasks_status',
    name: 'Status',
    type: 'status',
    options: [
      { id: 'opt_todo', name: 'To-do', color: 'gray' },
      { id: 'opt_in_progress', name: 'In progress', color: 'blue' },
      { id: 'opt_done', name: 'Done', color: 'green' },
    ],
  }
  const assignee: PropertyDef = { id: 'prop_tasks_assignee', name: 'Assignee', type: 'text' }
  const due: PropertyDef = { id: 'prop_tasks_due', name: 'Due', type: 'date' }
  const priority: PropertyDef = {
    id: 'prop_tasks_priority',
    name: 'Priority',
    type: 'select',
    options: [
      { id: 'opt_pri_low', name: 'Low', color: 'gray' },
      { id: 'opt_pri_med', name: 'Medium', color: 'yellow' },
      { id: 'opt_pri_high', name: 'High', color: 'red' },
    ],
  }
  return {
    properties: [title, status, assignee, due, priority],
    views: [
      { id: 'view_tasks_table', name: 'Table', type: 'table', sorts: [], filters: [] },
      {
        id: 'view_tasks_board',
        name: 'Board',
        type: 'board',
        groupBy: status.id,
        sorts: [],
        filters: [],
      },
    ],
    defaultViewId: 'view_tasks_table',
  }
}

function readingSchema(): DatabaseSchema {
  const title: PropertyDef = { id: 'prop_reading_title', name: 'Name', type: 'title' }
  const status: PropertyDef = {
    id: 'prop_reading_status',
    name: 'Status',
    type: 'status',
    options: [
      { id: 'opt_reading_todo', name: 'To-do', color: 'gray' },
      { id: 'opt_reading_reading', name: 'In progress', color: 'blue' },
      { id: 'opt_reading_done', name: 'Done', color: 'green' },
    ],
  }
  const kind: PropertyDef = {
    id: 'prop_reading_type',
    name: 'Type',
    type: 'select',
    options: [
      { id: 'opt_reading_book', name: 'Book', color: 'purple' },
      { id: 'opt_reading_article', name: 'Article', color: 'blue' },
      { id: 'opt_reading_paper', name: 'Paper', color: 'orange' },
    ],
  }
  return {
    properties: [title, status, kind],
    views: [
      { id: 'view_reading_table', name: 'Table', type: 'table', sorts: [], filters: [] },
      {
        id: 'view_reading_board',
        name: 'Board',
        type: 'board',
        groupBy: status.id,
        sorts: [],
        filters: [],
      },
    ],
    defaultViewId: 'view_reading_table',
  }
}

function rowProps(
  schema: DatabaseSchema,
  patch: Record<string, PropertyValue>,
): Record<string, PropertyValue> {
  return { ...defaultPropertiesFromSchema(schema), ...patch }
}

export function createSeedWorkspace(): Workspace {
  const tasks = tasksSchema()
  const reading = readingSchema()

  const pages: Page[] = [
    page(
      'getting-started',
      null,
      'Getting started',
      '👋',
      'aurora',
      [
        block('heading1', 'Welcome to your workspace'),
        block(
          'paragraph',
          'This is a Notion-style workspace. Everything is a page: notes nest under notes, and a database is a page whose children are rows — each row is a full page with properties on top and blocks below.',
        ),
        block('callout', 'Tip: type / at the start of an empty block to open the slash menu and insert headings, lists, todos, quotes, code, or a callout.'),
        block('heading2', 'Things to try'),
        block('todo', 'Create a new page from the sidebar', true),
        block('todo', 'Open Tasks, switch Table / Board, then add a List view from the + next to the tabs'),
        block('todo', 'Filter or sort a database, then click a row title to open it as a page'),
        block('todo', 'Add an emoji icon and a cover to a page'),
        block('todo', 'Star a page to pin it under Favorites'),
        block('todo', 'Press Cmd/Ctrl + K to search titles, block text, and properties'),
        block('todo', 'Move a page to Trash — restore it, or empty trash to delete forever'),
        block('heading2', 'Keyboard'),
        block('bulleted', 'Enter — new block below'),
        block('bulleted', 'Backspace on an empty block — delete it'),
        block('bulleted', 'Arrow up / down — move between blocks'),
        block('bulleted', 'Cmd/Ctrl + N — new page'),
        block('bulleted', 'Cmd/Ctrl + K — search'),
        block('divider'),
        block('quote', 'The best tool is the one that gets out of your way.'),
      ],
      true,
    ),
    page(
      'product-roadmap',
      null,
      'Product roadmap',
      '🗺️',
      'meadow',
      [
        block('heading1', 'Q3 roadmap'),
        block('paragraph', 'Priorities for the quarter, grouped by theme. Sub-pages hold the detailed specs.'),
        block('heading2', 'Themes'),
        block('numbered', 'Editor reliability'),
        block('numbered', 'Collaboration primitives'),
        block('numbered', 'Search & navigation'),
        block('heading2', 'Status'),
        block('todo', 'Kick-off meeting', true),
        block('todo', 'Write specs for each theme'),
        block('todo', 'Review with design'),
      ],
      true,
    ),
    page('editor-reliability', 'product-roadmap', 'Editor reliability', '🛠️', null, [
      block('heading2', 'Problem'),
      block('paragraph', 'Undo history is lost when a page is reopened, and large pages feel sluggish.'),
      block('heading2', 'Proposal'),
      block('bulleted', 'Persist undo stack per page'),
      block('bulleted', 'Virtualize block rendering above 500 blocks'),
      block('code', 'const stack = useUndoStack(pageId)\nstack.push(snapshot)'),
    ]),
    page('collaboration', 'product-roadmap', 'Collaboration primitives', '🤝', null, [
      block('paragraph', 'Presence, cursors, and comments. Start with presence.'),
      block('todo', 'Presence avatars in the header'),
      block('todo', 'Inline comments on blocks'),
    ]),
    page(
      'tasks',
      null,
      'Tasks',
      '✅',
      'ember',
      [
        block(
          'paragraph',
          'A database of work items. Switch views in the toolbar: Table is a spreadsheet, Board groups by Status. Each row opens as its own page.',
        ),
      ],
      false,
      { kind: 'database', schema: tasks },
    ),
    page(
      'task-editor-polish',
      'tasks',
      'Ship block editor polish',
      '✨',
      null,
      [block('paragraph', 'Slash menu, markdown shortcuts, and empty-block backspace should feel invisible.')],
      false,
      {
        properties: rowProps(tasks, {
          prop_tasks_status: { type: 'status', optionId: 'opt_done' },
          prop_tasks_assignee: { type: 'text', value: 'Ada' },
          prop_tasks_due: { type: 'date', value: '2026-08-28' },
          prop_tasks_priority: { type: 'select', optionId: 'opt_pri_high' },
        }),
      },
    ),
    page(
      'task-database-views',
      'tasks',
      'Database views',
      '📊',
      null,
      [block('paragraph', 'Table, board, and list over the same rows, with independent filters and sorts.')],
      false,
      {
        properties: rowProps(tasks, {
          prop_tasks_status: { type: 'status', optionId: 'opt_in_progress' },
          prop_tasks_assignee: { type: 'text', value: 'Grace' },
          prop_tasks_due: { type: 'date', value: '2026-09-08' },
          prop_tasks_priority: { type: 'select', optionId: 'opt_pri_high' },
        }),
      },
    ),
    page(
      'task-search',
      'tasks',
      'Command palette search',
      '🔎',
      null,
      [block('paragraph', 'Search should cover page titles, block text, and property values.')],
      false,
      {
        properties: rowProps(tasks, {
          prop_tasks_status: { type: 'status', optionId: 'opt_done' },
          prop_tasks_assignee: { type: 'text', value: 'Linus' },
          prop_tasks_due: { type: 'date', value: '2026-08-20' },
          prop_tasks_priority: { type: 'select', optionId: 'opt_pri_med' },
        }),
      },
    ),
    page(
      'task-trash',
      'tasks',
      'Trash restore edge cases',
      '🗑️',
      null,
      [block('paragraph', 'Trashing a page cascades to descendants. Restore reattaches, or promotes to root if the parent is still trashed.')],
      false,
      {
        properties: rowProps(tasks, {
          prop_tasks_status: { type: 'status', optionId: 'opt_todo' },
          prop_tasks_assignee: { type: 'text', value: 'Ada' },
          prop_tasks_due: { type: 'date', value: '2026-09-12' },
          prop_tasks_priority: { type: 'select', optionId: 'opt_pri_med' },
        }),
      },
    ),
    page(
      'task-mobile-sidebar',
      'tasks',
      'Mobile sidebar',
      '📱',
      null,
      [block('paragraph', 'Collapse the sidebar on small screens. Databases should scroll horizontally rather than crush.')],
      false,
      {
        properties: rowProps(tasks, {
          prop_tasks_status: { type: 'status', optionId: 'opt_todo' },
          prop_tasks_assignee: { type: 'text', value: 'Grace' },
          prop_tasks_due: { type: 'date', value: '2026-09-15' },
          prop_tasks_priority: { type: 'select', optionId: 'opt_pri_low' },
        }),
      },
    ),
    page(
      'reading-list',
      null,
      'Reading list',
      '📚',
      'lavender',
      [block('paragraph', 'Books and long-form articles worth revisiting. Open a row to add notes underneath the properties.')],
      false,
      { kind: 'database', schema: reading },
    ),
    page(
      'reading-doet',
      'reading-list',
      'The Design of Everyday Things',
      '📘',
      null,
      [block('quote', 'Simple things should be simple, complex things should be possible.')],
      false,
      {
        properties: rowProps(reading, {
          prop_reading_status: { type: 'status', optionId: 'opt_reading_done' },
          prop_reading_type: { type: 'select', optionId: 'opt_reading_book' },
        }),
      },
    ),
    page(
      'reading-systems',
      'reading-list',
      'Thinking in Systems',
      '🌿',
      null,
      [block('paragraph', 'Feedback loops, stocks, and flows. Re-read the chapter on delays.')],
      false,
      {
        properties: rowProps(reading, {
          prop_reading_status: { type: 'status', optionId: 'opt_reading_reading' },
          prop_reading_type: { type: 'select', optionId: 'opt_reading_book' },
        }),
      },
    ),
    page(
      'reading-philosophy',
      'reading-list',
      'A Philosophy of Software Design',
      '🧩',
      null,
      [block('paragraph', 'Deep modules, information hiding, and defining errors out of existence.')],
      false,
      {
        properties: rowProps(reading, {
          prop_reading_status: { type: 'status', optionId: 'opt_reading_todo' },
          prop_reading_type: { type: 'select', optionId: 'opt_reading_book' },
        }),
      },
    ),
    page(
      'reading-mythical',
      'reading-list',
      'The Mythical Man-Month',
      '📅',
      null,
      [block('paragraph', 'Adding people to a late project makes it later.')],
      false,
      {
        properties: rowProps(reading, {
          prop_reading_status: { type: 'status', optionId: 'opt_reading_todo' },
          prop_reading_type: { type: 'select', optionId: 'opt_reading_book' },
        }),
      },
    ),
    page(
      'reading-silver-bullet',
      'reading-list',
      'No Silver Bullet',
      '📝',
      null,
      [block('paragraph', 'Brooks on essential vs accidental complexity. Short enough to revisit yearly.')],
      false,
      {
        properties: rowProps(reading, {
          prop_reading_status: { type: 'status', optionId: 'opt_reading_done' },
          prop_reading_type: { type: 'select', optionId: 'opt_reading_article' },
        }),
      },
    ),
    page('meeting-notes', null, 'Meeting notes', '📝', null, [
      block('heading1', 'Weekly sync'),
      block('paragraph', 'Standing notes for the team sync. Newest at the top.'),
      block('heading3', 'Attendees'),
      block('bulleted', 'Ada, Grace, Linus'),
      block('heading3', 'Notes'),
      block('bulleted', 'Shipped the sidebar tree view'),
      block('bulleted', 'Search dialog needs keyboard shortcuts'),
      block('heading3', 'Action items'),
      block('todo', 'Grace: write the search spec'),
      block('todo', 'Linus: fix cover image sizing'),
    ]),
  ]

  const ws: Workspace = {
    name: 'Acme workspace',
    pages: {},
    rootOrder: [],
    childOrder: {},
  }

  for (const p of pages) {
    ws.pages[p.id] = p
    if (p.parentId === null) {
      ws.rootOrder.push(p.id)
    } else {
      ws.childOrder[p.parentId] = [...(ws.childOrder[p.parentId] ?? []), p.id]
    }
  }

  return ws
}
