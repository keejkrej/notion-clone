'use client'

import { useRouter } from 'next/navigation'
import { List, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type { DatabaseSchema, Page } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PropertyChips } from './property-editor'

export function ListView({
  schema,
  rows,
  onNewRow,
}: {
  schema: DatabaseSchema
  rows: Page[]
  onNewRow: () => void
}) {
  const router = useRouter()
  const chipDefs = schema.properties.filter((p) => p.type !== 'title')
  if (rows.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <List />
          </EmptyMedia>
          <EmptyTitle>No pages</EmptyTitle>
          <EmptyDescription>Add a row or clear filters to see pages here.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" size="sm" onClick={onNewRow}>
            <Plus data-icon="inline-start" /> New
          </Button>
        </EmptyContent>
      </Empty>
    )
  }
  return (
    <div className="flex flex-col">
      {rows.map((row) => (
        <button
          key={row.id}
          type="button"
          className="flex w-full min-w-0 flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent"
          onClick={() => router.push(`/p/${row.id}`)}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {row.icon && <span className="text-base leading-none">{row.icon}</span>}
            <span className={cn('truncate font-medium', !row.title && 'text-muted-foreground')}>
              {row.title || 'Untitled'}
            </span>
          </span>
          <PropertyChips page={row} defs={chipDefs} />
        </button>
      ))}
      <Button type="button" variant="ghost" size="sm" className="mt-1 justify-start text-muted-foreground" onClick={onNewRow}>
        <Plus data-icon="inline-start" /> New
      </Button>
    </div>
  )
}
