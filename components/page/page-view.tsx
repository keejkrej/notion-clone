'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ActionList, Text } from '@primer/react'
import { FileIcon } from '@primer/octicons-react'
import { useWorkspace } from '@/lib/workspace-store'
import { PageToolbar } from './page-toolbar'
import { PageHero } from './page-hero'
import { BlockEditor } from '../editor/block-editor'

export function PageView({ pageId }: { pageId: string }) {
  const router = useRouter()
  const { ws, setBlocks, childrenOf } = useWorkspace()
  const page = ws.pages[pageId]
  const [focusSignal, setFocusSignal] = useState(0)
  const children = childrenOf(pageId)

  if (!page) return null

  return (
    <article className="page-view" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageToolbar page={page} />
      <PageHero page={page} onFocusFirstBlock={() => setFocusSignal((s) => s + 1)} />
      <div
        style={{
          maxWidth: 760,
          width: '100%',
          margin: '0 auto',
          padding: 'var(--base-size-16) var(--base-size-24) var(--base-size-96)',
        }}
      >
        <BlockEditor
          blocks={page.blocks}
          onChange={(blocks) => setBlocks(page.id, blocks)}
          focusFirstSignal={focusSignal}
        />

        {children.length > 0 && (
          <section aria-labelledby="subpages-heading" style={{ marginTop: 'var(--base-size-8)' }}>
            <Text
              as="h2"
              id="subpages-heading"
              size="small"
              weight="semibold"
              style={{ color: 'var(--fgColor-muted)', display: 'block', marginBottom: 'var(--base-size-4)' }}
            >
              Sub-pages
            </Text>
            <ActionList variant="full">
              {children.map((c) => (
                <ActionList.Item key={c.id} onSelect={() => router.push(`/p/${c.id}`)}>
                  <ActionList.LeadingVisual>
                    {c.icon ? <span aria-hidden>{c.icon}</span> : <FileIcon />}
                  </ActionList.LeadingVisual>
                  {c.title || 'Untitled'}
                </ActionList.Item>
              ))}
            </ActionList>
          </section>
        )}
      </div>
    </article>
  )
}
