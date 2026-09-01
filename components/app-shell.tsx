'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './sidebar/sidebar'
import { PageView } from './page/page-view'
import { SearchDialog } from './search-dialog'
import { TrashDialog } from './trash-dialog'
import { useWorkspace } from '@/lib/workspace-store'
import { PageNotFound } from './page/page-not-found'

export function AppShell({ pageId }: { pageId: string }) {
  const { ws, setSearchOpen, createPage } = useWorkspace()
  const router = useRouter()
  const page = ws.pages[pageId]

  // Global shortcuts: Cmd/Ctrl+K opens search, Cmd/Ctrl+N creates a page.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (mod && e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        const id = createPage(null)
        router.push(`/p/${id}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSearchOpen, createPage, router])

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--bgColor-default)',
      }}
    >
      <Sidebar currentPageId={pageId} />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {page && !page.deletedAt ? (
          <PageView key={page.id} pageId={page.id} />
        ) : (
          <PageNotFound pageId={pageId} trashed={!!page?.deletedAt} />
        )}
      </main>
      <SearchDialog />
      <TrashDialog />
    </div>
  )
}
