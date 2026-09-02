'use client'

import { Label } from '@/components/ui/label'
import type { DatabaseSchema, Page } from '@/lib/types'
import { PropertyEditor } from './property-editor'
import { PropertyTypeIcon } from './view-toolbar'

export function RowProperties({
  page,
  schema,
  databaseId,
}: {
  page: Page
  schema: DatabaseSchema
  databaseId: string
}) {
  const defs = schema.properties.filter((p) => p.type !== 'title')
  if (defs.length === 0) return null
  return (
    <div className="mb-6 flex flex-col gap-0.5 border-b pb-5">
      {defs.map((def) => (
        <div
          key={def.id}
          className="grid grid-cols-[minmax(7rem,9rem)_1fr] items-center gap-2 rounded-md py-0.5 hover:bg-accent/40"
        >
          <Label className="min-w-0 px-2 font-normal text-muted-foreground">
            <PropertyTypeIcon type={def.type} className="size-3.5 text-muted-foreground" />
            <span className="truncate">{def.name}</span>
          </Label>
          <div>
            <PropertyEditor databaseId={databaseId} page={page} def={def} />
          </div>
        </div>
      ))}
    </div>
  )
}
