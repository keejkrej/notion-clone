'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './sidebar/sidebar'
import { PageView } from './page/page-view'
import { SearchDialog } from './search-dialog'
import { SettingsSheet } from './settings-sheet'
import { TrashDialog } from './trash-dialog'
import { useWorkspace } from '@/lib/workspace-store'
import { PageNotFound } from './page/page-not-found'

export function AppShell({ pageId }: { pageId: string }) {
  const { ws, setSearchOpen, createPage } = useWorkspace()
  const router = useRouter()
  const page = ws.pages[pageId]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing || e.repeat) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setSearchOpen(false)
        router.push(`/p/${createPage(null)}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSearchOpen, createPage, router])

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
      <Sidebar currentPageId={pageId} />
      <main className="min-w-0 flex-1 overflow-y-auto bg-background">
        {page && !page.deletedAt ? (
          <PageView key={page.id} pageId={page.id} />
        ) : (
          <PageNotFound pageId={pageId} trashed={!!page?.deletedAt} />
        )}
      </main>
      <SearchDialog />
      <TrashDialog />
      <SettingsSheet />
    </div>
  )
}
