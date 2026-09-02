'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import type { BlockType } from '@/lib/types'
import { BLOCK_TYPES } from './block-types'

interface SlashMenuProps { query: string; activeIndex: number; onHover: (i: number) => void; onPick: (type: BlockType) => void }
export function filterBlockTypes(query: string) { const q = query.trim().toLowerCase(); return q ? BLOCK_TYPES.filter((b) => b.label.toLowerCase().includes(q) || b.keywords.some((k) => k.includes(q))) : BLOCK_TYPES }
export function SlashMenu({ query, activeIndex, onHover, onPick }: SlashMenuProps) {
  const items = useMemo(() => filterBlockTypes(query), [query]); const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => { listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' }) }, [activeIndex])
  return (
    <Command
      ref={listRef}
      shouldFilter={false}
      onMouseDown={(e) => e.preventDefault()}
      className="absolute left-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-lg border bg-popover shadow-md sm:w-80"
    >
      <CommandList className="max-h-80">
        <CommandEmpty>No results</CommandEmpty>
        <CommandGroup heading="Basic blocks">
          {items.map((b, i) => {
            const Icon = b.icon
            return (
              <CommandItem
                key={b.type}
                data-index={i}
                value={`${b.type} ${b.label}`}
                onMouseEnter={() => onHover(i)}
                onSelect={() => onPick(b.type)}
                className={i === activeIndex ? 'bg-accent' : ''}
              >
                <Icon data-icon="inline-start" />
                <span>
                  <span className="block">{b.label}</span>
                  <span className="block text-xs text-muted-foreground">{b.description}</span>
                </span>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
