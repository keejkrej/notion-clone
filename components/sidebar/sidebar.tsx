'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { PanelLeftClose, PanelLeftOpen, Search, Settings, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useWorkspace } from '@/lib/workspace-store'
import { NewPageMenu } from './new-page-menu'
import { PageTree } from './page-tree'

export function Sidebar({ currentPageId }: { currentPageId: string }) {
  const { sidebarOpen, setSidebarOpen } = useWorkspace()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <nav
        aria-label="Workspace"
        className={sidebarOpen ? 'hidden h-svh w-[248px] shrink-0 flex-col md:flex' : 'hidden'}
      >
        <SidebarBody currentPageId={currentPageId} onClose={() => setSidebarOpen(false)} />
      </nav>

      {!sidebarOpen && (
        <div className="fixed left-2 top-2 z-10 hidden md:block">
          <OpenSidebarButton onClick={() => setSidebarOpen(true)} />
        </div>
      )}

      <div className="fixed left-2 top-2 z-10 md:hidden">
        <OpenSidebarButton onClick={() => setMobileOpen(true)} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[248px] gap-0 bg-sidebar p-0 text-sidebar-foreground sm:max-w-[248px]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Workspace</SheetTitle>
            <SheetDescription>Navigate pages, search, trash, and settings.</SheetDescription>
          </SheetHeader>
          <SidebarBody
            currentPageId={currentPageId}
            onClose={() => setMobileOpen(false)}
            onOpenPanel={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}

function OpenSidebarButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label="Open sidebar" onClick={onClick}>
      <PanelLeftOpen />
    </Button>
  )
}

function SidebarBody({
  currentPageId,
  onClose,
  onOpenPanel,
}: {
  currentPageId: string
  onClose: () => void
  onOpenPanel?: () => void
}) {
  const router = useRouter()
  const { ws, setSearchOpen, setTrashOpen, setSettingsOpen } = useWorkspace()
  const trashCount = Object.values(ws.pages).filter((p) => p.deletedAt).length
  const homeId = ws.rootOrder.find((id) => ws.pages[id] && !ws.pages[id].deletedAt) ?? 'getting-started'
  const workspaceName = ws.name.trim() || 'Untitled workspace'

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-12 items-center justify-between gap-1 px-2">
        <Button
          variant="ghost"
          className="h-8 min-w-0 flex-1 justify-start gap-2 px-2 font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => router.push(`/p/${homeId}`)}
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
            {workspaceName.charAt(0).toUpperCase()}
          </span>
          <span className="truncate text-sm">{workspaceName}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label="Close sidebar"
          onClick={onClose}
        >
          <PanelLeftClose />
        </Button>
      </div>

      <div className="flex flex-col gap-0.5 px-2 pb-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => {
            onOpenPanel?.()
            setSearchOpen(true)
          }}
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search</span>
          <span className="text-[11px] text-muted-foreground">⌘K</span>
        </Button>
        <NewPageMenu />
      </div>

      <Separator className="bg-sidebar-border" />

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-2 py-3">
          <PageTree currentPageId={currentPageId} />
        </div>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      <div className="flex flex-col gap-0.5 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => {
            onOpenPanel?.()
            setTrashOpen(true)
          }}
        >
          <Trash2 className="size-4" />
          <span className="flex-1 text-left">Trash</span>
          {trashCount > 0 ? <span className="text-xs text-muted-foreground">{trashCount}</span> : null}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => {
            onOpenPanel?.()
            setSettingsOpen(true)
          }}
        >
          <Settings className="size-4" />
          <span className="flex-1 text-left">Settings</span>
        </Button>
      </div>
    </div>
  )
}
