'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageKindIcon } from '@/components/page/page-kind-icon'
import { isDatabase, type Page, type PropertyValue, type Workspace } from '@/lib/types'
import { useWorkspace } from '@/lib/workspace-store'

function optionName(page: Page, ws: Workspace, propertyId: string, optionId: string | null): string {
  if (!optionId) return ''
  const parent = page.parentId ? ws.pages[page.parentId] : undefined
  const schema = isDatabase(parent) ? parent.schema : page.schema
  return schema?.properties.find((p) => p.id === propertyId)?.options?.find((o) => o.id === optionId)?.name ?? ''
}

function propertyValueText(page: Page, ws: Workspace, propertyId: string, value: PropertyValue): string {
  switch (value.type) {
    case 'title':
      return ''
    case 'text':
    case 'url':
      return value.value
    case 'number':
      return value.value == null ? '' : String(value.value)
    case 'date':
      return value.value ?? ''
    case 'checkbox':
      return value.value ? 'checked yes' : ''
    case 'select':
    case 'status':
      return optionName(page, ws, propertyId, value.optionId)
    case 'multi_select':
      return value.optionIds.map((id) => optionName(page, ws, propertyId, id)).filter(Boolean).join(' ')
    default: {
      const _exhaustive: never = value
      return _exhaustive
    }
  }
}

function propertyHaystack(page: Page, ws: Workspace): string {
  if (!page.properties) return ''
  return Object.entries(page.properties)
    .map(([id, value]) => propertyValueText(page, ws, id, value))
    .filter(Boolean)
    .join(' ')
}

function snippetFor(page: Page, q: string, propsText: string) {
  if (!q) return ''
  const text = (page.blocks ?? []).map((b) => b.content ?? '').join(' ')
  const idx = text.toLowerCase().indexOf(q)
  if (idx >= 0) {
    return `${idx > 30 ? '…' : ''}${text.slice(Math.max(0, idx - 30), idx + 70)}`
  }
  const pidx = propsText.toLowerCase().indexOf(q)
  if (pidx >= 0) return propsText.slice(Math.max(0, pidx - 16), pidx + 48)
  return ''
}

function kindLabel(page: Page, ws: Workspace): string {
  if (isDatabase(page)) return 'Database'
  const parent = page.parentId ? ws.pages[page.parentId] : undefined
  if (isDatabase(parent)) return `Row in ${parent.title || 'Untitled'}`
  return ''
}

export function SearchDialog() {
  const router = useRouter()
  const { searchOpen, setSearchOpen, livePages, breadcrumbsFor, ws } = useWorkspace()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...livePages]
      .map((p) => {
        const propsText = propertyHaystack(p, ws)
        const titleHit = q ? p.title.toLowerCase().includes(q) : false
        const propHit = q ? propsText.toLowerCase().includes(q) : false
        const blockHit = q ? (p.blocks ?? []).some((b) => (b.content ?? '').toLowerCase().includes(q)) : false
        const score = q ? (titleHit ? 5 : 0) + (propHit ? 3 : 0) + (blockHit ? 1 : 0) : 1
        return { p, score, propsText }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.p.updatedAt - a.p.updatedAt)
      .slice(0, 12)
  }, [query, livePages, ws])

  function close() {
    setSearchOpen(false)
    setQuery('')
  }

  function go(page: Page) {
    close()
    router.push(`/p/${page.id}`)
  }

  return (
    <Dialog
      open={searchOpen}
      onOpenChange={(open) => {
        setSearchOpen(open)
        if (!open) setQuery('')
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search pages, database rows, and property values.</DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false} className="rounded-none">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search pages, rows, and properties…"
          />
          <CommandList className="max-h-80">
            <CommandEmpty>No matching pages, rows, or properties.</CommandEmpty>
            <CommandGroup heading={query.trim() ? 'Results' : 'Recently edited'}>
              {results.map(({ p, propsText }) => {
                const path = breadcrumbsFor(p.id)
                  .slice(0, -1)
                  .map((c) => c.title || 'Untitled')
                  .join(' / ')
                const kind = kindLabel(p, ws)
                const snippet = snippetFor(p, query.trim().toLowerCase(), propsText)
                const meta = [kind || path, snippet].filter(Boolean).join(' · ')
                return (
                  <CommandItem
                    key={p.id}
                    value={`${p.id} ${p.title} ${propsText} ${(p.blocks ?? []).map((b) => b.content ?? '').join(' ')}`}
                    onSelect={() => go(p)}
                    className="items-start gap-3 py-3"
                  >
                    <span className="mt-0.5">
                      <PageKindIcon page={p} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.title || 'Untitled'}</span>
                      {meta ? (
                        <span className="block truncate text-xs text-muted-foreground">{meta}</span>
                      ) : null}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <p className="border-t px-4 py-2 text-xs text-muted-foreground">
          Type to search · ↑↓ to move · Enter to open · Esc to close
        </p>
      </DialogContent>
    </Dialog>
  )
}
