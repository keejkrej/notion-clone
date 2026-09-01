'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import type { Block, Page, Workspace } from './types'
import { block, createSeedWorkspace, uid } from './seed'

type Action =
  | { type: 'create-page'; id: string; parentId: string | null; title?: string }
  | { type: 'update-page'; id: string; patch: Partial<Pick<Page, 'title' | 'icon' | 'cover' | 'favorite'>> }
  | { type: 'set-blocks'; id: string; blocks: Block[] }
  | { type: 'trash-page'; id: string }
  | { type: 'restore-page'; id: string }
  | { type: 'delete-page'; id: string }
  | { type: 'empty-trash' }

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

function reducer(ws: Workspace, action: Action): Workspace {
  switch (action.type) {
    case 'create-page': {
      const now = Date.now()
      const page: Page = {
        id: action.id,
        parentId: action.parentId,
        title: action.title ?? '',
        icon: null,
        cover: null,
        blocks: [block('paragraph')],
        favorite: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      const next: Workspace = {
        ...ws,
        pages: { ...ws.pages, [page.id]: page },
      }
      if (action.parentId === null) {
        next.rootOrder = [...ws.rootOrder, page.id]
      } else {
        next.childOrder = {
          ...ws.childOrder,
          [action.parentId]: [...(ws.childOrder[action.parentId] ?? []), page.id],
        }
      }
      return next
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
    default:
      return ws
  }
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
  createPage: (parentId?: string | null, title?: string) => string
  updatePage: (id: string, patch: Partial<Pick<Page, 'title' | 'icon' | 'cover' | 'favorite'>>) => void
  setBlocks: (id: string, blocks: Block[]) => void
  trashPage: (id: string) => void
  restorePage: (id: string) => void
  deletePage: (id: string) => void
  emptyTrash: () => void
  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  trashOpen: boolean
  setTrashOpen: (open: boolean) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ws, dispatch] = useReducer(reducer, undefined, createSeedWorkspace)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [trashOpen, setTrashOpen] = useState(false)

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

  const createPage = useCallback((parentId: string | null = null, title?: string) => {
    const id = uid('p')
    dispatch({ type: 'create-page', id, parentId, title })
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
      sidebarOpen,
      setSidebarOpen,
      searchOpen,
      setSearchOpen,
      trashOpen,
      setTrashOpen,
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
      sidebarOpen,
      searchOpen,
      trashOpen,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
