'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import type {
  Block,
  DatabaseSchema,
  DatabaseView,
  Page,
  PropertyDef,
  PropertyValue,
  SelectOption,
  Workspace,
} from './types'
import { defaultPropertiesFromSchema, defaultPropertyValue, isDatabase, propertyTypeLabel } from './types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  block,
  createDatabaseView,
  createDefaultDatabaseSchema,
  createSeedWorkspace,
  defaultOptionsForType,
  uid,
} from './seed'

export const WORKSPACE_STORAGE_KEY = 'notion-clone:workspace'

export {
  defaultPropertiesFromSchema,
  defaultPropertyValue,
  isDatabase,
  liveRowsOf,
  propertyTypeLabel,
  selectColorClass,
  SELECT_COLOR_CLASSES,
  SELECT_COLOR_IDS,
} from './types'

const EMPTY_WORKSPACE: Workspace = {
  name: '',
  pages: {},
  rootOrder: [],
  childOrder: {},
}

type Action =
  | { type: 'hydrate'; workspace: Workspace }
  | { type: 'rename-workspace'; name: string }
  | { type: 'create-page'; id: string; parentId: string | null; title?: string; icon?: string | null; blocks?: Block[] }
  | { type: 'create-database'; id: string; parentId: string | null; title?: string; schema: DatabaseSchema }
  | { type: 'update-page'; id: string; patch: Partial<Pick<Page, 'title' | 'icon' | 'cover' | 'favorite'>> }
  | { type: 'set-blocks'; id: string; blocks: Block[] }
  | { type: 'trash-page'; id: string }
  | { type: 'restore-page'; id: string }
  | { type: 'delete-page'; id: string }
  | { type: 'empty-trash' }
  | { type: 'duplicate-page'; id: string; newId: string }
  | { type: 'move-page'; id: string; parentId: string | null; index?: number }
  | { type: 'reorder-pages'; parentId: string | null; orderedIds: string[] }
  | { type: 'reorder-blocks'; pageId: string; orderedIds: string[] }
  | { type: 'add-row'; databaseId: string; id: string; title?: string; properties?: Record<string, PropertyValue> }
  | { type: 'update-property-value'; pageId: string; propertyId: string; value: PropertyValue }
  | { type: 'add-property'; databaseId: string; property: PropertyDef }
  | { type: 'update-property'; databaseId: string; propertyId: string; patch: Partial<Omit<PropertyDef, 'id'>> }
  | { type: 'delete-property'; databaseId: string; propertyId: string }
  | { type: 'add-view'; databaseId: string; view: DatabaseView }
  | {
      type: 'update-view'
      databaseId: string
      viewId: string
      patch: Partial<Omit<DatabaseView, 'id'>>
      setDefault?: boolean
    }
  | { type: 'delete-view'; databaseId: string; viewId: string }
  | { type: 'add-select-option'; databaseId: string; propertyId: string; option: SelectOption }

function touch(p: Page): Page {
  return { ...p, updatedAt: Date.now() }
}

function descendants(ws: Workspace, id: string): string[] {
  const out: string[] = []
  const stack = [...(ws.childOrder[id] ?? [])]
  while (stack.length) {
    const cur = stack.pop()!
    out.push(cur)
    stack.push(...(ws.childOrder[cur] ?? []))
  }
  return out
}

export function wouldCreateCycle(ws: Workspace, id: string, newParentId: string | null): boolean {
  if (newParentId === null) return false
  let cur: string | null = newParentId
  const seen = new Set<string>()
  while (cur) {
    if (cur === id) return true
    if (seen.has(cur)) break
    seen.add(cur)
    cur = ws.pages[cur]?.parentId ?? null
  }
  return false
}

function insertAfter(order: string[], afterId: string, newId: string): string[] {
  const idx = order.indexOf(afterId)
  if (idx === -1) return [...order, newId]
  return [...order.slice(0, idx + 1), newId, ...order.slice(idx + 1)]
}

function mergeOrder(current: string[], orderedIds: string[]): string[] {
  const currentSet = new Set(current)
  const next = orderedIds.filter((id) => currentSet.has(id))
  for (const id of current) {
    if (!next.includes(id)) next.push(id)
  }
  return next
}

function blankPage(id: string, parentId: string | null, title: string, now: number): Page {
  return {
    id,
    parentId,
    kind: 'page',
    title,
    icon: null,
    cover: null,
    blocks: [block('paragraph')],
    favorite: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }
}

function propertiesForParent(ws: Workspace, parentId: string | null): Record<string, PropertyValue> | undefined {
  if (!parentId) return undefined
  const parent = ws.pages[parentId]
  if (!isDatabase(parent) || !parent.schema) return undefined
  return defaultPropertiesFromSchema(parent.schema)
}

function insertChild(ws: Workspace, page: Page, index?: number): Workspace {
  const pages = { ...ws.pages, [page.id]: page }
  if (page.parentId === null) {
    const rootOrder = [...ws.rootOrder]
    rootOrder.splice(index ?? rootOrder.length, 0, page.id)
    return { ...ws, pages, rootOrder }
  }
  const siblings = [...(ws.childOrder[page.parentId] ?? [])]
  siblings.splice(index ?? siblings.length, 0, page.id)
  return {
    ...ws,
    pages,
    childOrder: { ...ws.childOrder, [page.parentId]: siblings },
  }
}

function mapDatabaseRows(
  ws: Workspace,
  pages: Record<string, Page>,
  databaseId: string,
  fn: (row: Page) => Page,
): void {
  for (const id of ws.childOrder[databaseId] ?? []) {
    const row = pages[id]
    if (row) pages[id] = fn(row)
  }
}

function reducer(ws: Workspace, action: Action): Workspace {
  switch (action.type) {
    case 'hydrate':
      return action.workspace
    case 'rename-workspace':
      return { ...ws, name: action.name }
    case 'create-page': {
      const now = Date.now()
      const page = blankPage(action.id, action.parentId, action.title ?? '', now)
      if (action.icon !== undefined) page.icon = action.icon
      if (action.blocks) page.blocks = action.blocks
      const properties = propertiesForParent(ws, action.parentId)
      if (properties) page.properties = properties
      return insertChild(ws, page)
    }
    case 'create-database': {
      const now = Date.now()
      const page: Page = {
        ...blankPage(action.id, action.parentId, action.title ?? '', now),
        kind: 'database',
        schema: action.schema,
      }
      return insertChild(ws, page)
    }
    case 'update-page': {
      const p = ws.pages[action.id]
      if (!p) return ws
      return { ...ws, pages: { ...ws.pages, [p.id]: touch({ ...p, ...action.patch }) } }
    }
    case 'set-blocks': {
      const p = ws.pages[action.id]
      if (!p) return ws
      return { ...ws, pages: { ...ws.pages, [p.id]: touch({ ...p, blocks: action.blocks }) } }
    }
    case 'trash-page': {
      const ids = [action.id, ...descendants(ws, action.id)]
      const now = Date.now()
      const pages = { ...ws.pages }
      for (const id of ids) {
        if (pages[id]) pages[id] = { ...pages[id], deletedAt: now, favorite: false }
      }
      return { ...ws, pages }
    }
    case 'restore-page': {
      const ids = [action.id, ...descendants(ws, action.id)]
      const pages = { ...ws.pages }
      for (const id of ids) {
        if (pages[id]) pages[id] = { ...pages[id], deletedAt: null }
      }
      // If the parent is still in the trash, promote to root so it's reachable.
      const p = pages[action.id]
      let rootOrder = ws.rootOrder
      let childOrder = ws.childOrder
      if (p?.parentId && pages[p.parentId]?.deletedAt) {
        childOrder = {
          ...childOrder,
          [p.parentId]: (childOrder[p.parentId] ?? []).filter((c) => c !== p.id),
        }
        rootOrder = [...rootOrder, p.id]
        pages[p.id] = { ...p, parentId: null }
      }
      return { ...ws, pages, rootOrder, childOrder }
    }
    case 'delete-page': {
      const ids = new Set([action.id, ...descendants(ws, action.id)])
      const p = ws.pages[action.id]
      const pages = { ...ws.pages }
      const childOrder = { ...ws.childOrder }
      for (const id of ids) {
        delete pages[id]
        delete childOrder[id]
      }
      let rootOrder = ws.rootOrder.filter((id) => !ids.has(id))
      if (p?.parentId && childOrder[p.parentId]) {
        childOrder[p.parentId] = childOrder[p.parentId].filter((c) => c !== p.id)
      }
      return { ...ws, pages, rootOrder, childOrder }
    }
    case 'empty-trash': {
      let next = ws
      for (const p of Object.values(ws.pages)) {
        if (p.deletedAt && next.pages[p.id]) {
          next = reducer(next, { type: 'delete-page', id: p.id })
        }
      }
      return next
    }
    case 'duplicate-page': {
      const src = ws.pages[action.id]
      if (!src) return ws
      const now = Date.now()
      const ids = [action.id, ...descendants(ws, action.id)]
      const idMap = new Map<string, string>()
      idMap.set(action.id, action.newId)
      for (const oldId of ids) {
        if (oldId !== action.id) idMap.set(oldId, uid('p'))
      }
      const pages = { ...ws.pages }
      const childOrder = { ...ws.childOrder }
      for (const oldId of ids) {
        const p = ws.pages[oldId]
        if (!p) continue
        const newId = idMap.get(oldId)!
        const newParentId =
          oldId === action.id ? p.parentId : p.parentId ? (idMap.get(p.parentId) ?? p.parentId) : null
        pages[newId] = {
          ...p,
          id: newId,
          parentId: newParentId,
          favorite: false,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
          blocks: p.blocks.map((b) => ({ ...b, id: uid('b') })),
          schema: p.schema ? structuredClone(p.schema) : undefined,
          properties: p.properties ? structuredClone(p.properties) : undefined,
        }
        const kids = ws.childOrder[oldId]
        if (kids?.length) {
          childOrder[newId] = kids.map((c) => idMap.get(c)).filter((c): c is string => !!c)
        }
      }
      let rootOrder = ws.rootOrder
      if (src.parentId === null) {
        rootOrder = insertAfter(ws.rootOrder, action.id, action.newId)
      } else {
        childOrder[src.parentId] = insertAfter(childOrder[src.parentId] ?? [], action.id, action.newId)
      }
      return { ...ws, pages, rootOrder, childOrder }
    }
    case 'move-page': {
      const p = ws.pages[action.id]
      if (!p) return ws
      if (wouldCreateCycle(ws, action.id, action.parentId)) return ws
      if (action.parentId && !ws.pages[action.parentId]) return ws

      let rootOrder = ws.rootOrder
      let childOrder = { ...ws.childOrder }
      if (p.parentId === null) {
        rootOrder = rootOrder.filter((id) => id !== p.id)
      } else {
        childOrder[p.parentId] = (childOrder[p.parentId] ?? []).filter((id) => id !== p.id)
      }

      if (action.parentId === null) {
        const idx = Math.min(Math.max(action.index ?? rootOrder.length, 0), rootOrder.length)
        rootOrder = [...rootOrder.slice(0, idx), p.id, ...rootOrder.slice(idx)]
      } else {
        const siblings = [...(childOrder[action.parentId] ?? [])]
        const idx = Math.min(Math.max(action.index ?? siblings.length, 0), siblings.length)
        siblings.splice(idx, 0, p.id)
        childOrder[action.parentId] = siblings
      }

      let nextPage: Page = touch({ ...p, parentId: action.parentId })
      const dest = action.parentId ? ws.pages[action.parentId] : undefined
      if (isDatabase(dest) && dest.schema) {
        nextPage = {
          ...nextPage,
          properties: {
            ...defaultPropertiesFromSchema(dest.schema),
            ...nextPage.properties,
          },
        }
      }
      return { ...ws, pages: { ...ws.pages, [p.id]: nextPage }, rootOrder, childOrder }
    }
    case 'reorder-pages': {
      const current = action.parentId === null ? ws.rootOrder : (ws.childOrder[action.parentId] ?? [])
      const next = mergeOrder(current, action.orderedIds)
      if (action.parentId === null) return { ...ws, rootOrder: next }
      return { ...ws, childOrder: { ...ws.childOrder, [action.parentId]: next } }
    }
    case 'reorder-blocks': {
      const p = ws.pages[action.pageId]
      if (!p) return ws
      const byId = new Map(p.blocks.map((b) => [b.id, b]))
      const next: Block[] = []
      for (const id of action.orderedIds) {
        const b = byId.get(id)
        if (b) {
          next.push(b)
          byId.delete(id)
        }
      }
      for (const b of p.blocks) {
        if (byId.has(b.id)) next.push(b)
      }
      return { ...ws, pages: { ...ws.pages, [p.id]: touch({ ...p, blocks: next }) } }
    }
    case 'add-row': {
      const db = ws.pages[action.databaseId]
      if (!isDatabase(db) || !db.schema) return ws
      const now = Date.now()
      const page = blankPage(action.id, action.databaseId, action.title ?? '', now)
      page.properties = {
        ...defaultPropertiesFromSchema(db.schema),
        ...action.properties,
      }
      return insertChild({ ...ws, pages: { ...ws.pages, [db.id]: touch(db) } }, page)
    }
    case 'update-property-value': {
      const p = ws.pages[action.pageId]
      if (!p) return ws
      return {
        ...ws,
        pages: {
          ...ws.pages,
          [p.id]: touch({
            ...p,
            properties: { ...p.properties, [action.propertyId]: action.value },
          }),
        },
      }
    }
    case 'add-property': {
      const db = ws.pages[action.databaseId]
      if (!isDatabase(db) || !db.schema) return ws
      if (db.schema.properties.some((prop) => prop.id === action.property.id)) return ws
      const schema: DatabaseSchema = {
        ...db.schema,
        properties: [...db.schema.properties, action.property],
      }
      const pages = { ...ws.pages, [db.id]: touch({ ...db, schema }) }
      if (action.property.type !== 'title') {
        const value = defaultPropertyValue(action.property)
        mapDatabaseRows(ws, pages, db.id, (row) =>
          touch({
            ...row,
            properties: { ...row.properties, [action.property.id]: row.properties?.[action.property.id] ?? value },
          }),
        )
      }
      return { ...ws, pages }
    }
    case 'update-property': {
      const db = ws.pages[action.databaseId]
      if (!isDatabase(db) || !db.schema) return ws
      const idx = db.schema.properties.findIndex((prop) => prop.id === action.propertyId)
      if (idx < 0) return ws
      const prev = db.schema.properties[idx]
      const nextDef: PropertyDef = { ...prev, ...action.patch, id: prev.id }
      const properties = [...db.schema.properties]
      properties[idx] = nextDef
      const schema: DatabaseSchema = { ...db.schema, properties }
      const pages = { ...ws.pages, [db.id]: touch({ ...db, schema }) }
      if (action.patch.type && action.patch.type !== prev.type) {
        mapDatabaseRows(ws, pages, db.id, (row) => {
          const nextProps = { ...row.properties }
          if (nextDef.type === 'title') {
            delete nextProps[nextDef.id]
          } else {
            nextProps[nextDef.id] = defaultPropertyValue(nextDef)
          }
          return touch({ ...row, properties: nextProps })
        })
      }
      return { ...ws, pages }
    }
    case 'delete-property': {
      const db = ws.pages[action.databaseId]
      if (!isDatabase(db) || !db.schema) return ws
      const def = db.schema.properties.find((prop) => prop.id === action.propertyId)
      if (!def) return ws
      if (def.type === 'title' && db.schema.properties.filter((prop) => prop.type === 'title').length <= 1) {
        return ws
      }
      const properties = db.schema.properties.filter((prop) => prop.id !== action.propertyId)
      const views = db.schema.views.map((view) => ({
        ...view,
        groupBy: view.groupBy === action.propertyId ? undefined : view.groupBy,
        sorts: view.sorts.filter((s) => s.propertyId !== action.propertyId),
        filters: view.filters.filter((f) => f.propertyId !== action.propertyId),
      }))
      const schema: DatabaseSchema = { ...db.schema, properties, views }
      const pages = { ...ws.pages, [db.id]: touch({ ...db, schema }) }
      mapDatabaseRows(ws, pages, db.id, (row) => {
        if (!row.properties || !(action.propertyId in row.properties)) return row
        const { [action.propertyId]: _removed, ...rest } = row.properties
        return touch({ ...row, properties: rest })
      })
      return { ...ws, pages }
    }
    case 'add-view': {
      const db = ws.pages[action.databaseId]
      if (!isDatabase(db) || !db.schema) return ws
      const groupBy =
        action.view.groupBy ??
        (action.view.type === 'board'
          ? db.schema.properties.find((prop) => prop.type === 'status' || prop.type === 'select')?.id
          : undefined)
      const view: DatabaseView = { ...action.view, groupBy }
      const schema: DatabaseSchema = { ...db.schema, views: [...db.schema.views, view] }
      return { ...ws, pages: { ...ws.pages, [db.id]: touch({ ...db, schema }) } }
    }
    case 'update-view': {
      const db = ws.pages[action.databaseId]
      if (!isDatabase(db) || !db.schema) return ws
      if (!db.schema.views.some((view) => view.id === action.viewId)) return ws
      const views = db.schema.views.map((view) =>
        view.id === action.viewId ? { ...view, ...action.patch, id: view.id } : view,
      )
      const schema: DatabaseSchema = {
        ...db.schema,
        views,
        defaultViewId: action.setDefault ? action.viewId : db.schema.defaultViewId,
      }
      return { ...ws, pages: { ...ws.pages, [db.id]: touch({ ...db, schema }) } }
    }
    case 'delete-view': {
      const db = ws.pages[action.databaseId]
      if (!isDatabase(db) || !db.schema) return ws
      if (db.schema.views.length <= 1) return ws
      const views = db.schema.views.filter((view) => view.id !== action.viewId)
      if (views.length === db.schema.views.length) return ws
      const schema: DatabaseSchema = {
        ...db.schema,
        views,
        defaultViewId: db.schema.defaultViewId === action.viewId ? views[0].id : db.schema.defaultViewId,
      }
      return { ...ws, pages: { ...ws.pages, [db.id]: touch({ ...db, schema }) } }
    }
    case 'add-select-option': {
      const db = ws.pages[action.databaseId]
      if (!isDatabase(db) || !db.schema) return ws
      const properties = db.schema.properties.map((prop) => {
        if (prop.id !== action.propertyId) return prop
        if (prop.type !== 'select' && prop.type !== 'multi_select' && prop.type !== 'status') return prop
        if ((prop.options ?? []).some((opt) => opt.id === action.option.id)) return prop
        return { ...prop, options: [...(prop.options ?? []), action.option] }
      })
      const schema: DatabaseSchema = { ...db.schema, properties }
      return { ...ws, pages: { ...ws.pages, [db.id]: touch({ ...db, schema }) } }
    }
    default:
      return ws
  }
}

function isWorkspaceShape(value: unknown): value is Workspace {
  if (!value || typeof value !== 'object') return false
  const v = value as Workspace
  return (
    typeof v.name === 'string' &&
    !!v.pages &&
    typeof v.pages === 'object' &&
    Array.isArray(v.rootOrder) &&
    !!v.childOrder &&
    typeof v.childOrder === 'object'
  )
}

function migrateBlockType(type: unknown): Block['type'] {
  switch (type) {
    case 'paragraph':
    case 'heading1':
    case 'heading2':
    case 'heading3':
    case 'bulleted':
    case 'numbered':
    case 'todo':
    case 'quote':
    case 'code':
    case 'divider':
    case 'callout':
      return type
    default:
      return 'paragraph'
  }
}

function migratePage(id: string, raw: Page): Page {
  const p = raw as Partial<Page> & { kind?: string }
  const kind = p.kind === 'database' ? 'database' : 'page'
  const blocks: Block[] = Array.isArray(p.blocks)
    ? p.blocks
        .filter((b): b is Block => !!b && typeof b === 'object')
        .map((b) => ({
          id: typeof b.id === 'string' && b.id ? b.id : uid('b'),
          type: migrateBlockType(b.type),
          content: typeof b.content === 'string' ? b.content : '',
          checked: b.checked,
        }))
    : []
  const schema =
    kind === 'database'
      ? p.schema && Array.isArray(p.schema.properties) && Array.isArray(p.schema.views) && p.schema.views.length > 0
        ? p.schema
        : createDefaultDatabaseSchema()
      : p.schema
  return {
    id: typeof p.id === 'string' && p.id ? p.id : id,
    parentId: p.parentId ?? null,
    kind,
    title: typeof p.title === 'string' ? p.title : '',
    icon: p.icon ?? null,
    cover: p.cover ?? null,
    blocks,
    favorite: !!p.favorite,
    deletedAt: typeof p.deletedAt === 'number' ? p.deletedAt : null,
    createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
    updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : Date.now(),
    schema,
    properties: p.properties,
  }
}

function migrateWorkspace(raw: Workspace): Workspace {
  const pages: Record<string, Page> = {}
  for (const [id, p] of Object.entries(raw.pages)) {
    if (!p || typeof p !== 'object') continue
    pages[id] = migratePage(id, p)
  }
  const rootOrder = (Array.isArray(raw.rootOrder) ? raw.rootOrder : []).filter((id) => id in pages)
  const childOrder: Record<string, string[]> = {}
  for (const [parent, ids] of Object.entries(raw.childOrder ?? {})) {
    childOrder[parent] = (Array.isArray(ids) ? ids : []).filter((id) => id in pages)
  }
  for (const id of Object.keys(pages)) {
    const p = pages[id]
    const parentId = p.parentId && pages[p.parentId] ? p.parentId : null
    if (parentId !== p.parentId) pages[id] = { ...p, parentId }
    if (parentId === null) {
      if (!rootOrder.includes(id)) rootOrder.push(id)
    } else if (!(childOrder[parentId] ?? []).includes(id)) {
      childOrder[parentId] = [...(childOrder[parentId] ?? []), id]
    }
  }
  return {
    name: raw.name || 'Workspace',
    pages,
    rootOrder: rootOrder.filter((id) => pages[id]?.parentId === null),
    childOrder: Object.fromEntries(
      Object.entries(childOrder).map(([parent, ids]) => [
        parent,
        ids.filter((id) => pages[id]?.parentId === parent),
      ]),
    ),
  }
}

function loadStoredWorkspace(): Workspace | null {
  try {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isWorkspaceShape(parsed)) return null
    return migrateWorkspace(parsed)
  } catch {
    return null
  }
}

function WorkspaceSkeleton() {
  return (
    <div
      className="flex h-svh w-full overflow-hidden bg-background"
      role="status"
      aria-label="Loading workspace"
    >
      <div className="hidden w-[248px] shrink-0 border-r border-sidebar-border bg-sidebar p-3 md:block">
        <Skeleton className="mb-4 h-7 w-36" />
        <Skeleton className="mb-3 h-8 w-full" />
        <Skeleton className="mb-2 h-4 w-20" />
        <Skeleton className="mb-2 h-8 w-full" />
        <Skeleton className="mb-2 h-8 w-5/6" />
        <Skeleton className="mb-4 h-8 w-full" />
        <Skeleton className="mb-2 h-4 w-16" />
        <Skeleton className="mb-2 h-8 w-full" />
        <Skeleton className="mb-2 h-8 w-4/5" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col px-14 pt-12 sm:px-16">
        <Skeleton className="mb-8 h-4 w-48" />
        <Skeleton className="mb-4 h-10 w-72" />
        <Skeleton className="mb-3 h-4 w-full max-w-2xl" />
        <Skeleton className="mb-3 h-4 w-full max-w-xl" />
        <Skeleton className="mb-3 h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-2/3 max-w-lg" />
      </div>
    </div>
  )
}

interface WorkspaceContextValue {
  ws: Workspace
  /** Live (non-trashed) pages */
  livePages: Page[]
  trashedPages: Page[]
  favorites: Page[]
  rootPages: Page[]
  childrenOf: (id: string) => Page[]
  breadcrumbsFor: (id: string) => Page[]
  createPage: (
    parentId?: string | null,
    title?: string,
    extras?: { icon?: string | null; blocks?: Block[] },
  ) => string
  updatePage: (id: string, patch: Partial<Pick<Page, 'title' | 'icon' | 'cover' | 'favorite'>>) => void
  setBlocks: (id: string, blocks: Block[]) => void
  trashPage: (id: string) => void
  restorePage: (id: string) => void
  deletePage: (id: string) => void
  emptyTrash: () => void
  renameWorkspace: (name: string) => void
  duplicatePage: (id: string) => string
  movePage: (id: string, parentId: string | null, index?: number) => void
  reorderPages: (parentId: string | null, orderedIds: string[]) => void
  reorderBlocks: (pageId: string, orderedIds: string[]) => void
  createDatabase: (parentId?: string | null, title?: string) => string
  addRow: (databaseId: string, title?: string, properties?: Record<string, PropertyValue>) => string
  updatePropertyValue: (pageId: string, propertyId: string, value: PropertyValue) => void
  addProperty: (databaseId: string, def: Pick<PropertyDef, 'type'> & Partial<Omit<PropertyDef, 'type'>>) => string
  updateProperty: (databaseId: string, propertyId: string, patch: Partial<Omit<PropertyDef, 'id'>>) => void
  deleteProperty: (databaseId: string, propertyId: string) => void
  addView: (databaseId: string, type: DatabaseView['type'], name?: string) => string
  updateView: (
    databaseId: string,
    viewId: string,
    patch: Partial<Omit<DatabaseView, 'id'>>,
    setDefault?: boolean,
  ) => void
  deleteView: (databaseId: string, viewId: string) => void
  addSelectOption: (databaseId: string, propertyId: string, name?: string, color?: string) => string
  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  trashOpen: boolean
  setTrashOpen: (open: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ws, dispatch] = useReducer(reducer, EMPTY_WORKSPACE)
  const [hydrated, setHydrated] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [trashOpen, setTrashOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const stored = loadStoredWorkspace()
    dispatch({ type: 'hydrate', workspace: stored ?? createSeedWorkspace() })
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(ws))
    } catch {
      // ignore quota / private-mode failures
    }
  }, [ws, hydrated])

  const livePages = useMemo(() => Object.values(ws.pages).filter((p) => !p.deletedAt), [ws.pages])
  const trashedPages = useMemo(
    () =>
      Object.values(ws.pages)
        .filter((p) => p.deletedAt)
        .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0)),
    [ws.pages],
  )
  const favorites = useMemo(() => livePages.filter((p) => p.favorite), [livePages])
  const rootPages = useMemo(
    () => ws.rootOrder.map((id) => ws.pages[id]).filter((p): p is Page => !!p && !p.deletedAt),
    [ws.rootOrder, ws.pages],
  )

  const childrenOf = useCallback(
    (id: string) =>
      (ws.childOrder[id] ?? []).map((c) => ws.pages[c]).filter((p): p is Page => !!p && !p.deletedAt),
    [ws.childOrder, ws.pages],
  )

  const breadcrumbsFor = useCallback(
    (id: string) => {
      const chain: Page[] = []
      let cur: Page | undefined = ws.pages[id]
      while (cur) {
        chain.unshift(cur)
        cur = cur.parentId ? ws.pages[cur.parentId] : undefined
      }
      return chain
    },
    [ws.pages],
  )

  const createPage = useCallback(
    (parentId: string | null = null, title?: string, extras?: { icon?: string | null; blocks?: Block[] }) => {
      const id = uid('p')
      dispatch({
        type: 'create-page',
        id,
        parentId,
        title,
        icon: extras?.icon,
        blocks: extras?.blocks,
      })
      return id
    },
    [],
  )

  const createDatabase = useCallback((parentId: string | null = null, title?: string) => {
    const id = uid('p')
    dispatch({ type: 'create-database', id, parentId, title, schema: createDefaultDatabaseSchema() })
    return id
  }, [])

  const duplicatePage = useCallback((id: string) => {
    const newId = uid('p')
    dispatch({ type: 'duplicate-page', id, newId })
    return newId
  }, [])

  const addRow = useCallback((databaseId: string, title?: string, properties?: Record<string, PropertyValue>) => {
    const id = uid('p')
    dispatch({ type: 'add-row', databaseId, id, title, properties })
    return id
  }, [])

  const addProperty = useCallback(
    (databaseId: string, def: Pick<PropertyDef, 'type'> & Partial<Omit<PropertyDef, 'type'>>) => {
      const id = def.id ?? uid('prop')
      const property: PropertyDef = {
        id,
        name: def.name ?? propertyTypeLabel(def.type),
        type: def.type,
        options: def.options ?? defaultOptionsForType(def.type),
      }
      dispatch({ type: 'add-property', databaseId, property })
      return id
    },
    [],
  )

  const addView = useCallback((databaseId: string, type: DatabaseView['type'], name?: string) => {
    const view = createDatabaseView(type, ws.pages[databaseId]?.schema, name)
    dispatch({ type: 'add-view', databaseId, view })
    return view.id
  }, [ws.pages])

  const addSelectOption = useCallback((databaseId: string, propertyId: string, name?: string, color?: string) => {
    const id = uid('opt')
    const option: SelectOption = { id, name: name ?? 'Option', color: color ?? 'gray' }
    dispatch({ type: 'add-select-option', databaseId, propertyId, option })
    return id
  }, [])

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ws,
      livePages,
      trashedPages,
      favorites,
      rootPages,
      childrenOf,
      breadcrumbsFor,
      createPage,
      updatePage: (id, patch) => dispatch({ type: 'update-page', id, patch }),
      setBlocks: (id, blocks) => dispatch({ type: 'set-blocks', id, blocks }),
      trashPage: (id) => dispatch({ type: 'trash-page', id }),
      restorePage: (id) => dispatch({ type: 'restore-page', id }),
      deletePage: (id) => dispatch({ type: 'delete-page', id }),
      emptyTrash: () => dispatch({ type: 'empty-trash' }),
      renameWorkspace: (name) => dispatch({ type: 'rename-workspace', name }),
      duplicatePage,
      movePage: (id, parentId, index) => dispatch({ type: 'move-page', id, parentId, index }),
      reorderPages: (parentId, orderedIds) => dispatch({ type: 'reorder-pages', parentId, orderedIds }),
      reorderBlocks: (pageId, orderedIds) => dispatch({ type: 'reorder-blocks', pageId, orderedIds }),
      createDatabase,
      addRow,
      updatePropertyValue: (pageId, propertyId, value) =>
        dispatch({ type: 'update-property-value', pageId, propertyId, value }),
      addProperty,
      updateProperty: (databaseId, propertyId, patch) =>
        dispatch({ type: 'update-property', databaseId, propertyId, patch }),
      deleteProperty: (databaseId, propertyId) => dispatch({ type: 'delete-property', databaseId, propertyId }),
      addView,
      updateView: (databaseId, viewId, patch, setDefault) =>
        dispatch({ type: 'update-view', databaseId, viewId, patch, setDefault }),
      deleteView: (databaseId, viewId) => dispatch({ type: 'delete-view', databaseId, viewId }),
      addSelectOption,
      sidebarOpen,
      setSidebarOpen,
      searchOpen,
      setSearchOpen,
      trashOpen,
      setTrashOpen,
      settingsOpen,
      setSettingsOpen,
    }),
    [
      ws,
      livePages,
      trashedPages,
      favorites,
      rootPages,
      childrenOf,
      breadcrumbsFor,
      createPage,
      duplicatePage,
      createDatabase,
      addRow,
      addProperty,
      addView,
      addSelectOption,
      sidebarOpen,
      searchOpen,
      trashOpen,
      settingsOpen,
    ],
  )

  if (!hydrated) return <WorkspaceSkeleton />

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
