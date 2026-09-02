'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/lib/workspace-store'
import { PageToolbar } from './page-toolbar'
import { PageHero } from './page-hero'
import { BlockEditor } from '../editor/block-editor'

export function PageView({ pageId }: { pageId: string }) {
  const router = useRouter()
  const { ws, setBlocks, childrenOf } = useWorkspace()
  const page = ws.pages[pageId]
  const [focusSignal, setFocusSignal] = useState(0)
  if (!page) return null
  const children = childrenOf(pageId)
  return <article className="page-view flex min-h-full flex-col"><PageToolbar page={page} /><PageHero page={page} onFocusFirstBlock={() => setFocusSignal((s) => s + 1)} /><div className="mx-auto w-full max-w-3xl px-6 pb-24 pt-4"><BlockEditor blocks={page.blocks} onChange={(blocks) => setBlocks(page.id, blocks)} focusFirstSignal={focusSignal} />{children.length > 0 && <section className="mt-8"><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sub-pages</h2><div className="flex flex-col gap-1">{children.map((c) => <Button key={c.id} variant="ghost" className="justify-start gap-3" onClick={() => router.push(`/p/${c.id}`)}><FileText className="size-4 text-muted-foreground" />{c.icon || '📄'} {c.title || 'Untitled'}</Button>)}</div></section>}</div></article>
}
