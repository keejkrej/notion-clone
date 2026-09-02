'use client'

import {
  ArrowUpDown,
  Calendar,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Columns3,
  Hash,
  Link,
  List,
  ListFilter,
  Plus,
  Table2,
  Tags,
  Type,
  X,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DatabaseSchema, DatabaseView, Filter, PropertyType } from '@/lib/types'
import { uid } from '@/lib/seed'
import {
  ADDABLE_PROPERTY_TYPES,
  filterNeedsValue,
  filterOpLabel,
  opsForPropertyType,
} from '@/lib/database-query'
import { propertyTypeLabel } from '@/lib/types'
import { useWorkspace } from '@/lib/workspace-store'

const VIEW_ICONS: Record<DatabaseView['type'], ComponentType<{ className?: string }>> = {
  table: Table2,
  board: Columns3,
  list: List,
}

const PROPERTY_ICONS: Record<PropertyType, ComponentType<{ className?: string }>> = {
  title: Type,
  text: Type,
  number: Hash,
  select: ChevronDown,
  multi_select: Tags,
  status: CircleDot,
  date: Calendar,
  checkbox: CheckSquare,
  url: Link,
}

export function ViewTypeIcon({ type, className }: { type: DatabaseView['type']; className?: string }) {
  const Icon = VIEW_ICONS[type]
  return <Icon className={className} />
}

export function PropertyTypeIcon({ type, className }: { type: PropertyType; className?: string }) {
  const Icon = PROPERTY_ICONS[type]
  return <Icon className={className} />
}

export function AddPropertyMenu({
  databaseId,
  trigger,
}: {
  databaseId: string
  trigger?: ReactNode
}) {
  const { addProperty } = useWorkspace()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
            <Plus data-icon="inline-start" /> Add property
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ADDABLE_PROPERTY_TYPES.map((type) => (
          <DropdownMenuItem key={type} onClick={() => addProperty(databaseId, { type })}>
            <PropertyTypeIcon type={type} />
            {propertyTypeLabel(type)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FilterValueInput({
  schema,
  filter,
  onChange,
}: {
  schema: DatabaseSchema
  filter: Filter
  onChange: (value: string) => void
}) {
  const def = schema.properties.find((p) => p.id === filter.propertyId)
  if (!def || !filterNeedsValue(filter.op)) return null
  if (def.type === 'select' || def.type === 'status' || def.type === 'multi_select') {
    return (
      <Select value={filter.value || '__empty__'} onValueChange={(v) => onChange(v === '__empty__' ? '' : v)}>
        <SelectTrigger size="sm" className="w-full">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__empty__">Empty</SelectItem>
          {(def.options ?? []).map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  const inputType = def.type === 'number' ? 'number' : def.type === 'date' ? 'date' : 'text'
  return (
    <Input
      type={inputType}
      value={filter.value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value"
      aria-label="Filter value"
      className="h-8"
    />
  )
}

function FilterPopover({
  databaseId,
  schema,
  view,
}: {
  databaseId: string
  schema: DatabaseSchema
  view: DatabaseView
}) {
  const { updateView } = useWorkspace()
  function setFilters(filters: Filter[]) {
    updateView(databaseId, view.id, { filters })
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={view.filters.length ? 'text-foreground' : 'text-muted-foreground'}
        >
          <ListFilter data-icon="inline-start" />
          Filter
          {view.filters.length > 0 && (
            <Badge variant="secondary" className="rounded-sm px-1.5">
              {view.filters.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="mb-3">
          <p className="text-sm font-medium">Filter</p>
          <p className="text-xs text-muted-foreground">Show rows that match every rule.</p>
        </div>
        <div className="flex flex-col gap-2">
          {view.filters.map((filter) => {
            const def = schema.properties.find((p) => p.id === filter.propertyId)
            const ops = opsForPropertyType(def?.type ?? 'text')
            return (
              <div key={filter.id} className="flex flex-col gap-2 rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={filter.propertyId}
                    onValueChange={(propertyId) => {
                      const next = schema.properties.find((p) => p.id === propertyId)
                      const nextOps = opsForPropertyType(next?.type ?? 'text')
                      setFilters(
                        view.filters.map((f) =>
                          f.id === filter.id
                            ? { ...f, propertyId, op: nextOps[0], value: '' }
                            : f,
                        ),
                      )
                    }}
                  >
                    <SelectTrigger size="sm" className="min-w-0 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {schema.properties.map((prop) => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filter.op}
                    onValueChange={(op) =>
                      setFilters(
                        view.filters.map((f) =>
                          f.id === filter.id ? { ...f, op: op as Filter['op'], value: f.value } : f,
                        ),
                      )
                    }
                  >
                    <SelectTrigger size="sm" className="w-[9.5rem] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ops.map((op) => (
                        <SelectItem key={op} value={op}>
                          {filterOpLabel(op)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Remove filter"
                    onClick={() => setFilters(view.filters.filter((f) => f.id !== filter.id))}
                  >
                    <X />
                  </Button>
                </div>
                <FilterValueInput
                  schema={schema}
                  filter={filter}
                  onChange={(value) =>
                    setFilters(view.filters.map((f) => (f.id === filter.id ? { ...f, value } : f)))
                  }
                />
              </div>
            )
          })}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => {
            const prop = schema.properties[0]
            if (!prop) return
            setFilters([
              ...view.filters,
              {
                id: uid('f'),
                propertyId: prop.id,
                op: opsForPropertyType(prop.type)[0],
                value: '',
              },
            ])
          }}
        >
          <Plus data-icon="inline-start" /> Add filter
        </Button>
      </PopoverContent>
    </Popover>
  )
}

function SortPopover({
  databaseId,
  schema,
  view,
}: {
  databaseId: string
  schema: DatabaseSchema
  view: DatabaseView
}) {
  const { updateView } = useWorkspace()
  function setSorts(sorts: DatabaseView['sorts']) {
    updateView(databaseId, view.id, { sorts })
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={view.sorts.length ? 'text-foreground' : 'text-muted-foreground'}
        >
          <ArrowUpDown data-icon="inline-start" />
          Sort
          {view.sorts.length > 0 && (
            <Badge variant="secondary" className="rounded-sm px-1.5">
              {view.sorts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="mb-3">
          <p className="text-sm font-medium">Sort</p>
          <p className="text-xs text-muted-foreground">Order rows by property.</p>
        </div>
        <div className="flex flex-col gap-2">
          {view.sorts.map((sort, index) => (
            <div key={`${sort.propertyId}-${index}`} className="flex items-center gap-2">
              <Select
                value={sort.propertyId}
                onValueChange={(propertyId) =>
                  setSorts(view.sorts.map((s, i) => (i === index ? { ...s, propertyId } : s)))
                }
              >
                <SelectTrigger size="sm" className="min-w-0 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schema.properties.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sort.direction}
                onValueChange={(direction) =>
                  setSorts(
                    view.sorts.map((s, i) =>
                      i === index ? { ...s, direction: direction as 'asc' | 'desc' } : s,
                    ),
                  )
                }
              >
                <SelectTrigger size="sm" className="w-[8.5rem] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove sort"
                onClick={() => setSorts(view.sorts.filter((_, i) => i !== index))}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => {
            const used = new Set(view.sorts.map((s) => s.propertyId))
            const prop = schema.properties.find((p) => !used.has(p.id)) ?? schema.properties[0]
            if (!prop) return
            setSorts([...view.sorts, { propertyId: prop.id, direction: 'asc' }])
          }}
        >
          <Plus data-icon="inline-start" /> Add sort
        </Button>
      </PopoverContent>
    </Popover>
  )
}

export function ViewToolbar({
  databaseId,
  schema,
  view,
  search,
  onSearch,
  onViewChange,
  onAddView,
  onNewRow,
}: {
  databaseId: string
  schema: DatabaseSchema
  view: DatabaseView
  search: string
  onSearch: (value: string) => void
  onViewChange: (viewId: string) => void
  onAddView: (type: DatabaseView['type']) => void
  onNewRow: () => void
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Tabs value={view.id} onValueChange={onViewChange} className="min-w-0 gap-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          <TabsList variant="line" className="h-8">
            {schema.views.map((v) => (
              <TabsTrigger key={v.id} value={v.id} className="px-2.5">
                <ViewTypeIcon type={v.type} />
                {v.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-xs" aria-label="Add view">
                <Plus />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onAddView('table')}>
                <Table2 data-icon="inline-start" /> Table
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddView('board')}>
                <Columns3 data-icon="inline-start" /> Board
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddView('list')}>
                <List data-icon="inline-start" /> List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Tabs>
      <div className="ml-auto flex flex-wrap items-center gap-1">
        <FilterPopover databaseId={databaseId} schema={schema} view={view} />
        <SortPopover databaseId={databaseId} schema={schema} view={view} />
        <div className="relative">
          <Label htmlFor={`db-search-${databaseId}`} className="sr-only">
            Search
          </Label>
          <Input
            id={`db-search-${databaseId}`}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search"
            className="h-8 w-36 md:w-48"
          />
        </div>
        <Button type="button" size="sm" onClick={onNewRow}>
          <Plus data-icon="inline-start" /> New
        </Button>
      </div>
    </div>
  )
}
