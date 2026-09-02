'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { isDatabase } from '@/lib/types'
import { useWorkspace } from '@/lib/workspace-store'
import { DatabaseViews } from '@/components/database/database-views'
import { RowProperties } from '@/components/database/row-properties'
import { BlockEditor } from '../editor/block-editor'
import { PageHero } from './page-hero'
import { PageKindIcon } from './page-kind-icon'
import { PageToolbar } from './page-toolbar'

export function PageView({ pageId }: { pageId: string }) {
  const router = useRouter()
  const { ws, setBlocks, childrenOf } = useWorkspace()
  const page = ws.pages[pageId]
  const [focusSignal, setFocusSignal] = useState(0)
  if (!page) return null

  const parent = page.parentId ? ws.pages[page.parentId] : undefined

  if (isDatabase(page)) {
    return (
      <article className="page-view flex min-h-full flex-col">
        <PageToolbar page={page} />
        <PageHero page={page} onFocusFirstBlock={() => {}} />
        <DatabaseViews page={page} />
      </article>
    )
  }

  const children = childrenOf(pageId)
  return (
    <article className="page-view flex min-h-full flex-col">
      <PageToolbar page={page} />
      <PageHero page={page} onFocusFirstBlock={() => setFocusSignal((s) => s + 1)} />
      <div className="page-column pb-24 pt-3">
        {isDatabase(parent) && parent.schema ? (
          <RowProperties page={page} schema={parent.schema} databaseId={parent.id} />
        ) : null}
        <BlockEditor
          blocks={page.blocks ?? []}
          onChange={(blocks) => setBlocks(page.id, blocks)}
          focusFirstSignal={focusSignal}
        />
        {children.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 px-1 text-xs font-medium text-muted-foreground">Sub-pages</h2>
            <div className="flex flex-col">
              {children.map((c) => (
                <Button
                  key={c.id}
                  variant="ghost"
                  className="h-8 justify-start gap-2 px-2 font-normal"
                  onClick={() => router.push(`/p/${c.id}`)}
                >
                  <PageKindIcon page={c} />
                  <span className="truncate">{c.title || 'Untitled'}</span>
                </Button>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
