'use client'

import { History, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { PageKindIcon } from '@/components/page/page-kind-icon'
import { isDatabase, type Page, type Workspace } from '@/lib/types'
import { useWorkspace } from '@/lib/workspace-store'

function trashedDescendantCount(ws: Workspace, id: string): number {
  let n = 0
  for (const childId of ws.childOrder[id] ?? []) {
    const child = ws.pages[childId]
    if (!child?.deletedAt) continue
    n += 1 + trashedDescendantCount(ws, childId)
  }
  return n
}

function trashMeta(page: Page, ws: Workspace): string {
  const when = page.deletedAt ? `Deleted ${new Date(page.deletedAt).toLocaleDateString()}` : 'Deleted'
  if (isDatabase(page)) {
    const nested = trashedDescendantCount(ws, page.id)
    return nested > 0 ? `${when} · Database · ${nested} nested` : `${when} · Database`
  }
  const parent = page.parentId ? ws.pages[page.parentId] : undefined
  if (isDatabase(parent)) {
    return `${when} · Row in ${parent.title || 'Untitled'}`
  }
  const nested = trashedDescendantCount(ws, page.id)
  return nested > 0 ? `${when} · ${nested} nested` : when
}

export function TrashDialog() {
  const { trashOpen, setTrashOpen, trashedPages, restorePage, deletePage, emptyTrash, ws } = useWorkspace()
  const topLevel = trashedPages.filter((p) => !p.parentId || !ws.pages[p.parentId]?.deletedAt)

  return (
    <Dialog open={trashOpen} onOpenChange={setTrashOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trash</DialogTitle>
          <DialogDescription>
            Pages, databases, and rows in the trash can be restored or permanently deleted. Restoring a
            database restores its rows.
          </DialogDescription>
        </DialogHeader>
        {topLevel.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Trash2 />
              </EmptyMedia>
              <EmptyTitle>Trash is empty</EmptyTitle>
              <EmptyDescription>Pages you move to the trash will show up here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="flex flex-col pr-3">
              {topLevel.map((p, i) => (
                <div key={p.id}>
                  {i > 0 ? <Separator /> : null}
                  <div className="flex items-center gap-3 py-3">
                    <span className="text-muted-foreground">
                      <PageKindIcon page={p} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title || 'Untitled'}</p>
                      <p className="truncate text-xs text-muted-foreground">{trashMeta(p, ws)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Restore ${p.title || 'Untitled'}`}
                      onClick={() => restorePage(p.id)}
                    >
                      <History />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Permanently delete ${p.title || 'Untitled'}`}
                      onClick={() => deletePage(p.id)}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setTrashOpen(false)}>
            Close
          </Button>
          {topLevel.length > 0 ? (
            <Button
              variant="destructive"
              onClick={() => {
                emptyTrash()
                setTrashOpen(false)
              }}
            >
              Empty trash
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
