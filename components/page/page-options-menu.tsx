'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Copy, FolderInput, MoreHorizontal, Plus, Star, StarOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Page } from '@/lib/types'
import { useWorkspace } from '@/lib/workspace-store'
import { MoveToDialog } from './move-to-dialog'

export function PageOptionsMenu({
  page,
  align = 'end',
  triggerClassName,
  treeAction = false,
}: {
  page: Page
  align?: 'start' | 'end'
  triggerClassName?: string
  treeAction?: boolean
}) {
  const router = useRouter()
  const params = useParams<{ id?: string }>()
  const currentPageId = params.id
  const { createPage, duplicatePage, updatePage, trashPage, breadcrumbsFor } = useWorkspace()
  const [moveOpen, setMoveOpen] = useState(false)
  const name = page.title || 'Untitled'

  function addSubPage() {
    router.push(`/p/${createPage(page.id)}`)
  }

  function duplicate() {
    router.push(`/p/${duplicatePage(page.id)}`)
  }

  function trash() {
    const viewingCrumbs = currentPageId ? breadcrumbsFor(currentPageId) : []
    const shouldLeave = currentPageId === page.id || viewingCrumbs.some((c) => c.id === page.id)
    trashPage(page.id)
    if (shouldLeave) router.push('/p/getting-started')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={treeAction ? 'icon-xs' : 'icon-sm'}
            data-slot={treeAction ? 'tree-action' : undefined}
            className={cn('shrink-0', treeAction && 'text-muted-foreground hover:bg-transparent', triggerClassName)}
            aria-label={`Page options for ${name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={addSubPage}>
            <Plus data-icon="inline-start" /> Add sub-page
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={duplicate}>
            <Copy data-icon="inline-start" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setTimeout(() => setMoveOpen(true), 0)}>
            <FolderInput data-icon="inline-start" /> Move to
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => updatePage(page.id, { favorite: !page.favorite })}>
            {page.favorite ? <StarOff data-icon="inline-start" /> : <Star data-icon="inline-start" />}
            {page.favorite ? 'Remove from favorites' : 'Favorite'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={trash}>
            <Trash2 data-icon="inline-start" /> Move to trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <MoveToDialog pageId={page.id} open={moveOpen} onOpenChange={setMoveOpen} />
    </>
  )
}
