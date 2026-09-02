'use client'

import { useEffect, useMemo, useRef } from 'react'
import { ActionList, Text } from '@primer/react'
import type { BlockType } from '@/lib/types'
import { BLOCK_TYPES } from './block-types'

interface SlashMenuProps {
  query: string
  activeIndex: number
  onHover: (i: number) => void
  onPick: (type: BlockType) => void
}

export function filterBlockTypes(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return BLOCK_TYPES
  return BLOCK_TYPES.filter(
    (b) => b.label.toLowerCase().includes(q) || b.keywords.some((k) => k.includes(q)),
  )
}

export function SlashMenu({ query, activeIndex, onHover, onPick }: SlashMenuProps) {
  const items = useMemo(() => filterBlockTypes(query), [query])
  const listRef = useRef<HTMLDivElement>(null)

  // Keep the active item visible when navigating with the keyboard.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  return (
    <div
      ref={listRef}
      role="presentation"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 20,
        marginTop: 'var(--base-size-4)',
        width: 320,
        maxHeight: 320,
        overflowY: 'auto',
        backgroundColor: 'var(--overlay-bgColor)',
        border: 'var(--borderWidth-thin) solid var(--borderColor-default)',
        borderRadius: 'var(--borderRadius-large)',
        boxShadow: 'var(--shadow-floating-medium)',
      }}
    >
      {items.length === 0 ? (
        <div style={{ padding: 'var(--base-size-12)' }}>
          <Text size="small" style={{ color: 'var(--fgColor-muted)' }}>
            No results
          </Text>
        </div>
      ) : (
        <ActionList role="listbox" aria-label="Block types">
          <ActionList.GroupHeading>Basic blocks</ActionList.GroupHeading>
          {items.map((b, i) => {
            const IconComp = b.icon
            return (
              <ActionList.Item
                key={b.type}
                role="option"
                active={i === activeIndex}
                onSelect={() => onPick(b.type)}
                onMouseEnter={() => onHover(i)}
                data-index={i}
              >
                <ActionList.LeadingVisual>
                  <IconComp />
                </ActionList.LeadingVisual>
                {b.label}
                <ActionList.Description variant="block">{b.description}</ActionList.Description>
              </ActionList.Item>
            )
          })}
        </ActionList>
      )}
    </div>
  )
}
