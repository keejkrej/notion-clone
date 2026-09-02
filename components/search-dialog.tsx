'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import type { Page } from '@/lib/types'
import { useWorkspace } from '@/lib/workspace-store'

function snippetFor(page: Page, q: string) {
  const text = page.blocks.map((b) => b.content).join(' ')
  if (!q) return text.slice(0, 90)
  const idx = text.toLowerCase().indexOf(q)
  return idx < 0 ? text.slice(0, 90) : `${idx > 30 ? '…' : ''}${text.slice(Math.max(0, idx - 30), idx + 70)}`
}

export function SearchDialog() {
  const router = useRouter()
  const { searchOpen, setSearchOpen, livePages, breadcrumbsFor } = useWorkspace()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...livePages]
      .map((p) => ({ p, score: q ? (p.title.toLowerCase().includes(q) ? 3 : 0) + (p.blocks.some((b) => b.content.toLowerCase().includes(q)) ? 1 : 0) : 1 }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.p.updatedAt - a.p.updatedAt)
      .slice(0, 12)
      .map((x) => x.p)
  }, [query, livePages])
  useEffect(() => { if (searchOpen) setTimeout(() => inputRef.current?.focus(), 30) }, [searchOpen])
  function go(page: Page) { setSearchOpen(false); router.push(`/p/${page.id}`) }
  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-4 py-3"><DialogTitle>Search pages</DialogTitle></DialogHeader>
        <div className="flex items-center gap-2 border-b px-4"><Search className="size-4 text-muted-foreground" /><Input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pages and content…" className="border-0 px-0 shadow-none focus-visible:ring-0" /></div>
        <Command className="rounded-none"><CommandList className="max-h-80"><CommandEmpty>No pages match “{query}”.</CommandEmpty><CommandGroup heading={query ? 'Results' : 'Recently edited'}>{results.map((p) => <CommandItem key={p.id} value={`${p.title} ${p.blocks.map((b) => b.content).join(' ')}`} onSelect={() => go(p)} className="items-start gap-3 py-3"><span className="mt-0.5">{p.icon ?? <FileText className="size-4" />}</span><span className="min-w-0"><span className="block truncate font-medium">{p.title || 'Untitled'}</span><span className="block truncate text-xs text-muted-foreground">{breadcrumbsFor(p.id).slice(0, -1).map((c) => c.title || 'Untitled').join(' / ')} {snippetFor(p, query)}</span></span></CommandItem>)}</CommandGroup></CommandList></Command>
        <p className="border-t px-4 py-2 text-xs text-muted-foreground">Type to search · Enter to open · Esc to close</p>
      </DialogContent>
    </Dialog>
  )
}
