'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ActionList, Text, TextInput } from '@primer/react'
import { Dialog } from '@primer/react/experimental'
import { FileIcon, SearchIcon } from '@primer/octicons-react'
import type { Page } from '@/lib/types'
import { useWorkspace } from '@/lib/workspace-store'

function snippetFor(page: Page, q: string) {
  const text = page.blocks.map((b) => b.content).join(' ')
  if (!q) return text.slice(0, 90)
  const idx = text.toLowerCase().indexOf(q)
  if (idx === -1) return text.slice(0, 90)
  const start = Math.max(0, idx - 30)
  return (start > 0 ? '…' : '') + text.slice(start, start + 100)
}

export function SearchDialog() {
  const router = useRouter()
  const { searchOpen, setSearchOpen, livePages, breadcrumbsFor } = useWorkspace()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...livePages].sort((a, b) => b.updatedAt - a.updatedAt)
    if (!q) return sorted.slice(0, 8)
    return sorted
      .map((p) => {
        const title = p.title.toLowerCase()
        const body = p.blocks.map((b) => b.content).join(' ').toLowerCase()
        let score = 0
        if (title.startsWith(q)) score += 3
        else if (title.includes(q)) score += 2
        if (body.includes(q)) score += 1
        return { p, score }
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.p)
  }, [query, livePages])

  useEffect(() => {
    if (searchOpen) {
      setQuery('')
      setActive(0)
      // Focus after the dialog mounts.
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [searchOpen])

  useEffect(() => setActive(0), [query])

  function go(page: Page) {
    setSearchOpen(false)
    router.push(`/p/${page.id}`)
  }

  if (!searchOpen) return null

  const q = query.trim().toLowerCase()

  return (
    <Dialog
      title="Search"
      onClose={() => setSearchOpen(false)}
      width="large"
      renderHeader={() => (
        <div
          style={{
            padding: 'var(--base-size-12)',
            borderBottom: 'var(--borderWidth-thin) solid var(--borderColor-default)',
          }}
        >
          <TextInput
            ref={inputRef}
            block
            size="large"
            leadingVisual={SearchIcon}
            aria-label="Search pages"
            placeholder="Search pages and content…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((i) => Math.min(results.length - 1, i + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((i) => Math.max(0, i - 1))
              } else if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                e.preventDefault()
                const r = results[active]
                if (r) go(r)
              }
            }}
          />
        </div>
      )}
    >
      <div style={{ margin: 'calc(-1 * var(--base-size-16))', minHeight: 200 }}>
        {results.length === 0 ? (
          <div style={{ padding: 'var(--base-size-24)', textAlign: 'center' }}>
            <Text style={{ color: 'var(--fgColor-muted)' }}>No pages match &ldquo;{query}&rdquo;</Text>
          </div>
        ) : (
          <ActionList role="listbox" aria-label="Search results">
            <ActionList.GroupHeading>{q ? 'Results' : 'Recently edited'}</ActionList.GroupHeading>
            {results.map((p, i) => {
              const crumbs = breadcrumbsFor(p.id).slice(0, -1)
              return (
                <ActionList.Item
                  key={p.id}
                  role="option"
                  active={i === active}
                  onSelect={() => go(p)}
                  onMouseEnter={() => setActive(i)}
                >
                  <ActionList.LeadingVisual>
                    {p.icon ? <span aria-hidden>{p.icon}</span> : <FileIcon />}
                  </ActionList.LeadingVisual>
                  {p.title || 'Untitled'}
                  <ActionList.Description variant="block" truncate>
                    {crumbs.length > 0
                      ? `${crumbs.map((c) => c.title || 'Untitled').join(' / ')} — `
                      : ''}
                    {snippetFor(p, q)}
                  </ActionList.Description>
                </ActionList.Item>
              )
            })}
          </ActionList>
        )}
        <div
          style={{
            padding: 'var(--base-size-8) var(--base-size-16)',
            borderTop: 'var(--borderWidth-thin) solid var(--borderColor-default)',
          }}
        >
          <Text size="small" style={{ color: 'var(--fgColor-muted)' }}>
            ↑↓ to navigate · Enter to open · Esc to close
          </Text>
        </div>
      </div>
    </Dialog>
  )
}
