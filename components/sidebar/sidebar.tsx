'use client'

import { useRouter } from 'next/navigation'
import { Plus, Search, PanelLeftOpen, PanelLeftClose, Trash2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useWorkspace } from '@/lib/workspace-store'
import { PageTree } from './page-tree'

export function Sidebar({ currentPageId }: { currentPageId: string }) {
  const router = useRouter()
  const { ws, sidebarOpen, setSidebarOpen, setSearchOpen, setTrashOpen } = useWorkspace()

  if (!sidebarOpen) {
    return (
      <div className="fixed left-2 top-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open sidebar"
          onClick={() => setSidebarOpen(true)}
        >
          <PanelLeftOpen className="size-5" />
        </Button>
      </div>
    )
  }

  return (
    <nav
      aria-label="Workspace"
      className="flex h-screen w-64 shrink-0 flex-col border-r bg-muted/20"
    >
      <div className="flex h-14 items-center justify-between px-3">
        <Button
          variant="ghost"
          className="gap-2 font-semibold"
          onClick={() => router.push(`/p/${ws.rootOrder[0] ?? ''}`)}
        >
          <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            {ws.name.charAt(0)}
          </span>
          <span className="truncate text-sm">{ws.name}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        >
          <PanelLeftClose className="size-5" />
        </Button>
      </div>

      <div className="px-2 py-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search</span>
          <span className="text-xs">⌘K</span>
        </Button>
      </div>

      <Separator />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-3">
        <PageTree currentPageId={currentPageId} />
      </div>

      <Separator />

      <div className="flex flex-col gap-1 p-2">
        <Button
          variant="ghost"
          className="justify-start gap-3"
          onClick={() => setTrashOpen(true)}
        >
          <Trash2 className="size-4" />
          <span className="flex-1 text-left">Trash</span>
          {Object.values(ws.pages).filter(p => p.deletedAt).length > 0 && (
            <span className="text-xs text-muted-foreground">
              {Object.values(ws.pages).filter(p => p.deletedAt).length}
            </span>
          )}
        </Button>
        <Button variant="ghost" className="justify-start gap-3">
          <Settings className="size-4" />
          <span className="flex-1 text-left">Settings</span>
        </Button>
      </div>
    </nav>
  )
}
