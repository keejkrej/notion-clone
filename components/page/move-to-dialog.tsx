'use client'

import { useMemo } from 'react'
import { Check, Home } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useWorkspace, wouldCreateCycle } from '@/lib/workspace-store'
import { PageKindIcon } from './page-kind-icon'

export function MoveToDialog({
  pageId,
  open,
  onOpenChange,
}: {
  pageId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { ws, livePages, breadcrumbsFor, movePage } = useWorkspace()
  const page = ws.pages[pageId]

  const destinations = useMemo(() => {
    return livePages
      .filter((p) => !wouldCreateCycle(ws, pageId, p.id))
      .sort((a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled'))
  }, [livePages, pageId, ws])

  function move(parentId: string | null) {
    if (!page) return
    if (page.parentId === parentId) {
      onOpenChange(false)
      return
    }
    if (wouldCreateCycle(ws, page.id, parentId)) return
    movePage(page.id, parentId)
    onOpenChange(false)
  }

  if (!page) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle>Move to</DialogTitle>
          <DialogDescription>Choose a new parent, or move this page to the workspace root.</DialogDescription>
        </DialogHeader>
        <Command className="rounded-none">
          <CommandInput placeholder="Search pages…" />
          <CommandList className="max-h-80">
            <CommandEmpty>No matching destinations.</CommandEmpty>
            <CommandGroup heading="Workspace">
              <CommandItem value="no parent workspace root" onSelect={() => move(null)}>
                <Home />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">No parent</span>
                  <span className="block truncate text-xs text-muted-foreground">Workspace root</span>
                </span>
                {page.parentId === null && <Check className="ml-auto size-4" />}
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Pages">
              {destinations.map((dest) => {
                const path = breadcrumbsFor(dest.id)
                  .slice(0, -1)
                  .map((c) => c.title || 'Untitled')
                  .join(' / ')
                return (
                  <CommandItem
                    key={dest.id}
                    value={`${dest.title || 'Untitled'} ${path} ${dest.id}`}
                    onSelect={() => move(dest.id)}
                  >
                    <PageKindIcon page={dest} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{dest.title || 'Untitled'}</span>
                      {path ? (
                        <span className="block truncate text-xs text-muted-foreground">{path}</span>
                      ) : null}
                    </span>
                    {page.parentId === dest.id && <Check className="ml-auto size-4" />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
