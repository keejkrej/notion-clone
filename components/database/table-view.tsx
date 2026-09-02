'use client'

import { useRouter } from 'next/navigation'
import { Plus, Table2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import type { DatabaseSchema, Page, PropertyDef } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/workspace-store'
import { AddPropertyMenu, PropertyTypeIcon } from './view-toolbar'
import { PropertyEditor } from './property-editor'

function PropertyHeader({ databaseId, def }: { databaseId: string; def: PropertyDef }) {
  const { updateProperty, deleteProperty } = useWorkspace()
  const canDelete = def.type !== 'title'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 max-w-full justify-start gap-1.5 px-1 font-medium text-muted-foreground"
        >
          <PropertyTypeIcon type={def.type} className="size-3.5" />
          <span className="truncate">{def.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <div className="p-1">
          <Input
            aria-label="Property name"
            defaultValue={def.name}
            className="h-8"
            onBlur={(e) => {
              const name = e.target.value.trim()
              if (name && name !== def.name) updateProperty(databaseId, def.id, { name })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
          />
        </div>
        {canDelete && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => deleteProperty(databaseId, def.id)}
          >
            <Trash2 data-icon="inline-start" /> Delete property
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TableView({
  databaseId,
  schema,
  rows,
  onNewRow,
}: {
  databaseId: string
  schema: DatabaseSchema
  rows: Page[]
  onNewRow: () => void
}) {
  const router = useRouter()
  const colCount = schema.properties.length + 1
  return (
    <div className="min-w-0 overflow-x-auto rounded-lg border bg-background">
      <table className="w-full min-w-max border-collapse text-sm" aria-label="Database table">
        <thead>
          <tr className="bg-muted/50">
            {schema.properties.map((def) => (
              <th
                key={def.id}
                className={cn(
                  'border-b border-r px-2 py-1 text-left font-medium',
                  def.type === 'title' ? 'min-w-[220px]' : def.type === 'checkbox' ? 'w-16 min-w-16' : 'min-w-[160px]',
                )}
              >
                <PropertyHeader databaseId={databaseId} def={def} />
              </th>
            ))}
            <th className="min-w-[140px] border-b px-2 py-1 text-left">
              <AddPropertyMenu databaseId={databaseId} />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="p-0">
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Table2 />
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
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/40">
                {schema.properties.map((def) => (
                  <td
                    key={def.id}
                    className="border-b border-r p-0 align-middle"
                  >
                    {def.type === 'title' ? (
                      <button
                        type="button"
                        className="flex h-9 w-full items-center gap-2 px-2 text-left hover:bg-accent/60"
                        onClick={() => router.push(`/p/${row.id}`)}
                      >
                        {row.icon && <span className="text-base leading-none">{row.icon}</span>}
                        <span className={cn('truncate', !row.title && 'text-muted-foreground')}>
                          {row.title || 'Untitled'}
                        </span>
                      </button>
                    ) : (
                      <PropertyEditor databaseId={databaseId} page={row} def={def} />
                    )}
                  </td>
                ))}
                <td className="border-b" />
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={colCount} className="px-1 py-1">
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={onNewRow}>
                <Plus data-icon="inline-start" /> New
              </Button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
