'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DatabaseSchema, DatabaseView, Page, PropertyDef, PropertyValue } from '@/lib/types'
import { selectColorClass } from '@/lib/types'
import { groupRows } from '@/lib/database-query'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/workspace-store'
import { PropertyChips } from './property-editor'

function groupValue(def: PropertyDef, optionId: string | null): PropertyValue {
  if (def.type === 'status') return { type: 'status', optionId }
  return { type: 'select', optionId }
}

function BoardCard({
  row,
  chipDefs,
  groupBy,
}: {
  row: Page
  chipDefs: PropertyDef[]
  groupBy?: PropertyDef
}) {
  const router = useRouter()
  const { updatePropertyValue } = useWorkspace()
  return (
    <Card
      role="button"
      tabIndex={0}
      className="cursor-pointer gap-2 py-3 shadow-xs hover:bg-accent/40"
      onClick={() => router.push(`/p/${row.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/p/${row.id}`)
        }
      }}
    >
      <CardHeader className="px-3">
        <CardTitle className={cn('text-sm font-medium', !row.title && 'text-muted-foreground')}>
          <span className="flex items-start gap-2">
            {row.icon && <span className="text-base leading-none">{row.icon}</span>}
            <span className="min-w-0 flex-1 leading-snug">{row.title || 'Untitled'}</span>
          </span>
        </CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Card actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => router.push(`/p/${row.id}`)}>Open</DropdownMenuItem>
              {groupBy && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {(groupBy.options ?? []).map((opt) => (
                      <DropdownMenuItem
                        key={opt.id}
                        onClick={() =>
                          updatePropertyValue(row.id, groupBy.id, groupValue(groupBy, opt.id))
                        }
                      >
                        {opt.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      onClick={() => updatePropertyValue(row.id, groupBy.id, groupValue(groupBy, null))}
                    >
                      No status
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      {chipDefs.length > 0 && (
        <CardContent className="px-3">
          <PropertyChips page={row} defs={chipDefs} />
        </CardContent>
      )}
    </Card>
  )
}

export function BoardView({
  databaseId,
  schema,
  view,
  rows,
}: {
  databaseId: string
  schema: DatabaseSchema
  view: DatabaseView
  rows: Page[]
}) {
  const { addRow } = useWorkspace()
  const groupBy =
    schema.properties.find((p) => p.id === view.groupBy) ??
    schema.properties.find((p) => p.type === 'status' || p.type === 'select')
  const columns = groupRows(rows, groupBy)
  const chipDefs = schema.properties
    .filter((p) => p.type !== 'title' && p.id !== groupBy?.id)
    .slice(0, 2)

  function newInColumn(optionId: string | null) {
    const properties = groupBy ? { [groupBy.id]: groupValue(groupBy, optionId) } : undefined
    addRow(databaseId, undefined, properties)
  }

  return (
    <div className="flex min-w-0 gap-3 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:thin]">
      {columns.map((col) => (
        <section
          key={col.key ?? 'none'}
          className="flex w-72 shrink-0 flex-col gap-2 rounded-lg bg-muted/40 p-2"
          aria-label={col.label}
        >
          <header className="flex items-center gap-2 px-1 py-1">
            {col.color ? (
              <Badge variant="secondary" className={cn('rounded-sm border-0 font-medium', selectColorClass(col.color))}>
                {col.label}
              </Badge>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">{col.label}</span>
            )}
            <span className="text-xs text-muted-foreground">{col.rows.length}</span>
          </header>
          <div className="flex flex-col gap-2">
            {col.rows.map((row) => (
              <BoardCard
                key={row.id}
                row={row}
                chipDefs={chipDefs}
                groupBy={groupBy}
              />
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="justify-start text-muted-foreground"
              onClick={() => newInColumn(col.key)}
            >
              <Plus data-icon="inline-start" /> New
            </Button>
          </div>
        </section>
      ))}
    </div>
  )
}
