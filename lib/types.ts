export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulleted'
  | 'numbered'
  | 'todo'
  | 'quote'
  | 'code'
  | 'divider'
  | 'callout'

export interface Block {
  id: string
  type: BlockType
  content: string
  checked?: boolean
}

export type PageKind = 'page' | 'database'

export type PropertyType =
  | 'title'
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'status'

export interface SelectOption {
  id: string
  name: string
  color: string
}

export interface PropertyDef {
  id: string
  name: string
  type: PropertyType
  options?: SelectOption[] // select, multi_select, status
}

export type PropertyValue =
  | { type: 'title' } // title is Page.title
  | { type: 'text'; value: string }
  | { type: 'number'; value: number | null }
  | { type: 'select'; optionId: string | null }
  | { type: 'multi_select'; optionIds: string[] }
  | { type: 'date'; value: string | null } // YYYY-MM-DD
  | { type: 'checkbox'; value: boolean }
  | { type: 'url'; value: string }
  | { type: 'status'; optionId: string | null }

export interface Filter {
  id: string
  propertyId: string
  op: 'equals' | 'contains' | 'is_empty' | 'is_not_empty' | 'checked' | 'unchecked'
  value?: string
}

export interface Sort {
  propertyId: string
  direction: 'asc' | 'desc'
}

export interface DatabaseView {
  id: string
  name: string
  type: 'table' | 'board' | 'list'
  groupBy?: string // property id (select/status) for board
  sorts: Sort[]
  filters: Filter[]
}

export interface DatabaseSchema {
  properties: PropertyDef[]
  views: DatabaseView[]
  defaultViewId: string
}

export interface Page {
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
  schema?: DatabaseSchema // databases only
  properties?: Record<string, PropertyValue> // rows of a database
}

export interface Workspace {
  name: string
  pages: Record<string, Page>
  /** Ordered ids of root pages */
  rootOrder: string[]
  /** Ordered ids of children per parent */
  childOrder: Record<string, string[]>
}

/** Select option color ids and Tailwind classes that work in light + dark. */
export const SELECT_COLOR_CLASSES: Record<string, string> = {
  gray: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-200',
  brown: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
}

export const SELECT_COLOR_IDS = Object.keys(SELECT_COLOR_CLASSES)

export function selectColorClass(color: string): string {
  return SELECT_COLOR_CLASSES[color] ?? SELECT_COLOR_CLASSES.gray
}

export function propertyTypeLabel(type: PropertyType): string {
  switch (type) {
    case 'title':
      return 'Name'
    case 'text':
      return 'Text'
    case 'number':
      return 'Number'
    case 'select':
      return 'Select'
    case 'multi_select':
      return 'Multi-select'
    case 'date':
      return 'Date'
    case 'checkbox':
      return 'Checkbox'
    case 'url':
      return 'URL'
    case 'status':
      return 'Status'
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function defaultPropertyValue(def: PropertyDef): PropertyValue {
  switch (def.type) {
    case 'title':
      return { type: 'title' }
    case 'text':
      return { type: 'text', value: '' }
    case 'number':
      return { type: 'number', value: null }
    case 'select':
      return { type: 'select', optionId: null }
    case 'multi_select':
      return { type: 'multi_select', optionIds: [] }
    case 'date':
      return { type: 'date', value: null }
    case 'checkbox':
      return { type: 'checkbox', value: false }
    case 'url':
      return { type: 'url', value: '' }
    case 'status':
      return { type: 'status', optionId: def.options?.[0]?.id ?? null }
    default: {
      const _exhaustive: never = def.type
      return _exhaustive
    }
  }
}

/** Default property values for a row. Title is stored on `Page.title`, not here. */
export function defaultPropertiesFromSchema(schema: DatabaseSchema): Record<string, PropertyValue> {
  const values: Record<string, PropertyValue> = {}
  for (const def of schema.properties) {
    if (def.type === 'title') continue
    values[def.id] = defaultPropertyValue(def)
  }
  return values
}

/** Missing or unknown `kind` is treated as a regular page (old localStorage). */
export function isDatabase<T extends { kind?: string }>(
  page: T | null | undefined,
): page is T & { kind: 'database' } {
  return !!page && page.kind === 'database'
}

/** Direct children of a database that are not in the trash, in `childOrder`. */
export function liveRowsOf(ws: Workspace, databaseId: string): Page[] {
  const db = ws.pages[databaseId]
  if (!isDatabase(db)) return []
  return (ws.childOrder[databaseId] ?? [])
    .map((id) => ws.pages[id])
    .filter((p): p is Page => !!p && !p.deletedAt)
}
