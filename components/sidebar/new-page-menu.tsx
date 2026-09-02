'use client'

import { useRouter } from 'next/navigation'
import { FileText, Plus, StickyNote, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { meetingNotesBlocks } from '@/lib/seed'
import { useWorkspace } from '@/lib/workspace-store'

export function NewPageMenu({
  variant = 'default',
}: {
  variant?: 'default' | 'icon'
}) {
  const router = useRouter()
  const { createPage, createDatabase, updatePage } = useWorkspace()

  function emptyPage() {
    router.push(`/p/${createPage(null)}`)
  }

  function meetingNotes() {
    router.push(
      `/p/${createPage(null, 'Meeting notes', { icon: '📝', blocks: meetingNotesBlocks() })}`,
    )
  }

  function taskDatabase() {
    const id = createDatabase(null, 'Tasks')
    updatePage(id, { icon: '✅' })
    router.push(`/p/${id}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="New page"
          >
            <Plus />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="New page"
          >
            <Plus className="size-4" />
            New page
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onSelect={emptyPage}>
          <FileText />
          Empty page
          <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={meetingNotes}>
          <StickyNote />
          Meeting notes
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={taskDatabase}>
          <Table2 />
          Task database
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
