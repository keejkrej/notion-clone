'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import type { Page, PropertyDef, PropertyValue, SelectOption } from '@/lib/types'
import { SELECT_COLOR_IDS, selectColorClass } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/workspace-store'

const cellClass =
  'h-8 w-full min-w-0 border-transparent bg-transparent shadow-none hover:bg-accent/60 focus-visible:border-ring focus-visible:bg-background'

function EmptyHint({ className }: { className?: string }) {
  return <span className={cn('text-muted-foreground', className)}>Empty</span>
}

function nextOptionColor(options: SelectOption[] | undefined): string {
  return SELECT_COLOR_IDS[(options?.length ?? 0) % SELECT_COLOR_IDS.length] ?? 'gray'
}

function OptionBadge({ option }: { option: SelectOption }) {
  return (
    <Badge variant="secondary" className={cn('rounded-sm border-0 font-normal', selectColorClass(option.color))}>
      {option.name}
    </Badge>
  )
}

function AddOptionForm({
  onAdd,
}: {
  onAdd: (name: string) => void
}) {
  const [name, setName] = useState('')
  return (
    <form
      className="p-1"
      onSubmit={(e) => {
        e.preventDefault()
        const next = name.trim()
        if (!next) return
        onAdd(next)
        setName('')
      }}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add option"
        aria-label="Add option"
        className="h-8"
      />
    </form>
  )
}

function SelectPicker({
  databaseId,
  def,
  optionId,
  onChange,
}: {
  databaseId: string
  def: PropertyDef
  optionId: string | null
  onChange: (optionId: string | null) => void
}) {
  const { addSelectOption } = useWorkspace()
  const [open, setOpen] = useState(false)
  const selected = def.options?.find((o) => o.id === optionId)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-start px-2 font-normal"
          aria-label={def.name}
        >
          {selected ? <OptionBadge option={selected} /> : <EmptyHint />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start font-normal"
          onClick={() => {
            onChange(null)
            setOpen(false)
          }}
        >
          <EmptyHint />
        </Button>
        {(def.options ?? []).map((opt) => (
          <Button
            key={opt.id}
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-between font-normal"
            onClick={() => {
              onChange(opt.id)
              setOpen(false)
            }}
          >
            <OptionBadge option={opt} />
            {opt.id === optionId && <Check className="size-3.5 text-muted-foreground" />}
          </Button>
        ))}
        <Separator className="my-1" />
        <AddOptionForm
          onAdd={(name) => {
            const id = addSelectOption(databaseId, def.id, name, nextOptionColor(def.options))
            onChange(id)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

function MultiSelectPicker({
  databaseId,
  def,
  optionIds,
  onChange,
}: {
  databaseId: string
  def: PropertyDef
  optionIds: string[]
  onChange: (optionIds: string[]) => void
}) {
  const { addSelectOption } = useWorkspace()
  const [open, setOpen] = useState(false)
  const selected = (def.options ?? []).filter((o) => optionIds.includes(o.id))
  function toggle(id: string) {
    onChange(optionIds.includes(id) ? optionIds.filter((x) => x !== id) : [...optionIds, id])
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-start gap-1 overflow-hidden px-2 font-normal"
          aria-label={def.name}
        >
          {selected.length === 0 ? (
            <EmptyHint />
          ) : (
            selected.map((opt) => <OptionBadge key={opt.id} option={opt} />)
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        {(def.options ?? []).map((opt) => (
          <label
            key={opt.id}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          >
            <Checkbox checked={optionIds.includes(opt.id)} onCheckedChange={() => toggle(opt.id)} />
            <OptionBadge option={opt} />
          </label>
        ))}
        {(def.options ?? []).length === 0 && (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">No options</p>
        )}
        <Separator className="my-1" />
        <AddOptionForm
          onAdd={(name) => {
            const id = addSelectOption(databaseId, def.id, name, nextOptionColor(def.options))
            onChange([...optionIds, id])
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export function PropertyEditor({
  databaseId,
  page,
  def,
}: {
  databaseId: string
  page: Page
  def: PropertyDef
}) {
  const { updatePage, updatePropertyValue } = useWorkspace()
  const value: PropertyValue | undefined = page.properties?.[def.id]

  switch (def.type) {
    case 'title':
      return (
        <Input
          aria-label={def.name}
          value={page.title}
          placeholder="Untitled"
          className={cellClass}
          onChange={(e) => updatePage(page.id, { title: e.target.value })}
        />
      )
    case 'text':
      return (
        <Input
          aria-label={def.name}
          value={value?.type === 'text' ? value.value : ''}
          placeholder="Empty"
          className={cellClass}
          onChange={(e) => updatePropertyValue(page.id, def.id, { type: 'text', value: e.target.value })}
        />
      )
    case 'url':
      return (
        <Input
          type="url"
          aria-label={def.name}
          value={value?.type === 'url' ? value.value : ''}
          placeholder="Empty"
          className={cellClass}
          onChange={(e) => updatePropertyValue(page.id, def.id, { type: 'url', value: e.target.value })}
        />
      )
    case 'number':
      return (
        <Input
          type="number"
          aria-label={def.name}
          value={value?.type === 'number' && value.value !== null ? String(value.value) : ''}
          placeholder="Empty"
          className={cellClass}
          onChange={(e) => {
            const raw = e.target.value
            updatePropertyValue(page.id, def.id, {
              type: 'number',
              value: raw === '' ? null : Number(raw),
            })
          }}
        />
      )
    case 'date':
      return (
        <div className="group relative">
          <Input
            type="date"
            aria-label={def.name}
            value={value?.type === 'date' ? (value.value ?? '') : ''}
            className={cn(cellClass, !(value?.type === 'date' && value.value) && 'text-transparent group-focus-within:text-foreground')}
            onChange={(e) =>
              updatePropertyValue(page.id, def.id, { type: 'date', value: e.target.value || null })
            }
          />
          {!(value?.type === 'date' && value.value) && (
            <span className="pointer-events-none absolute inset-0 flex items-center px-3 text-sm text-muted-foreground group-focus-within:hidden">
              Empty
            </span>
          )}
        </div>
      )
    case 'checkbox':
      return (
        <div className="flex h-8 items-center px-2">
          <Checkbox
            aria-label={def.name}
            checked={value?.type === 'checkbox' ? value.value : false}
            onCheckedChange={(checked) =>
              updatePropertyValue(page.id, def.id, { type: 'checkbox', value: checked === true })
            }
          />
        </div>
      )
    case 'select':
      return (
        <SelectPicker
          databaseId={databaseId}
          def={def}
          optionId={value?.type === 'select' ? value.optionId : null}
          onChange={(optionId) => updatePropertyValue(page.id, def.id, { type: 'select', optionId })}
        />
      )
    case 'status':
      return (
        <SelectPicker
          databaseId={databaseId}
          def={def}
          optionId={value?.type === 'status' ? value.optionId : null}
          onChange={(optionId) => updatePropertyValue(page.id, def.id, { type: 'status', optionId })}
        />
      )
    case 'multi_select':
      return (
        <MultiSelectPicker
          databaseId={databaseId}
          def={def}
          optionIds={value?.type === 'multi_select' ? value.optionIds : []}
          onChange={(optionIds) => updatePropertyValue(page.id, def.id, { type: 'multi_select', optionIds })}
        />
      )
    default: {
      const _exhaustive: never = def.type
      return _exhaustive
    }
  }
}

export function PropertyChips({ page, defs }: { page: Page; defs: PropertyDef[] }) {
  const chips: { key: string; option?: SelectOption; label: string }[] = []
  for (const def of defs) {
    const v = page.properties?.[def.id]
    if (!v) continue
    switch (v.type) {
      case 'title':
        break
      case 'text':
      case 'url':
        if (v.value.trim()) chips.push({ key: def.id, label: v.value })
        break
      case 'number':
        if (v.value !== null) chips.push({ key: def.id, label: String(v.value) })
        break
      case 'date':
        if (v.value) chips.push({ key: def.id, label: v.value })
        break
      case 'checkbox':
        if (v.value) chips.push({ key: def.id, label: def.name })
        break
      case 'select':
      case 'status': {
        const opt = def.options?.find((o) => o.id === v.optionId)
        if (opt) chips.push({ key: def.id, option: opt, label: opt.name })
        break
      }
      case 'multi_select':
        for (const id of v.optionIds) {
          const opt = def.options?.find((o) => o.id === id)
          if (opt) chips.push({ key: `${def.id}-${id}`, option: opt, label: opt.name })
        }
        break
      default: {
        const _exhaustive: never = v
        return _exhaustive
      }
    }
  }
  if (chips.length === 0) return null
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {chips.map((chip) =>
        chip.option ? (
          <OptionBadge key={chip.key} option={chip.option} />
        ) : (
          <Badge key={chip.key} variant="secondary" className="rounded-sm font-normal">
            {chip.label}
          </Badge>
        ),
      )}
    </div>
  )
}
