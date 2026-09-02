'use client'

import { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Block, BlockType } from '@/lib/types'
import { BLOCK_TYPES, placeholderFor } from './block-types'
import { SlashMenu, filterBlockTypes } from './slash-menu'

export interface BlockRowProps {
  block: Block
  index: number
  listNumber?: number
  onChange: (patch: Partial<Block>) => void
  onEnter: (textAfterCursor: string, textBeforeCursor: string) => void
  onBackspaceEmpty: () => void
  onArrow: (dir: 'up' | 'down') => void
  onInsertBelow: () => void
  onDelete: () => void
  onTurnInto: (type: BlockType, clearContent?: boolean) => void
}

function textClassFor(type: BlockType): string {
  switch (type) {
    case 'heading1':
      return 'mt-6 text-3xl font-bold leading-tight tracking-tight'
    case 'heading2':
      return 'mt-4 text-2xl font-semibold leading-snug tracking-tight'
    case 'heading3':
      return 'mt-2 text-xl font-semibold leading-snug'
    case 'code':
      return 'font-mono text-sm leading-relaxed'
    case 'quote':
      return 'text-lg leading-relaxed text-muted-foreground'
    default:
      return 'text-lg leading-relaxed'
  }
}

export const BlockRow = forwardRef<HTMLTextAreaElement, BlockRowProps>(function BlockRow(
  { block, listNumber, onChange, onEnter, onBackspaceEmpty, onArrow, onInsertBelow, onDelete, onTurnInto },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null)
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashIndex, setSlashIndex] = useState(0)

  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [block.content, block.type])

  function setRefs(el: HTMLTextAreaElement | null) {
    innerRef.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }

  function pickSlash(type: BlockType) {
    setSlashOpen(false)
    setSlashQuery('')
    onTurnInto(type, true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget
    const composing = e.nativeEvent.isComposing || e.keyCode === 229
    if (slashOpen) {
      const items = filterBlockTypes(slashQuery)
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlashIndex((i) => (i + 1) % Math.max(items.length, 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashIndex((i) => (i - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1))
        return
      }
      if (e.key === 'Enter' && !composing) {
        e.preventDefault()
        if (items[slashIndex]) pickSlash(items[slashIndex].type)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setSlashOpen(false)
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey && !composing) {
      if (block.type === 'code') return
      e.preventDefault()
      const pos = el.selectionStart ?? el.value.length
      onEnter(el.value.slice(pos), el.value.slice(0, pos))
      return
    }
    if (e.key === 'Backspace' && el.value === '') {
      e.preventDefault()
      onBackspaceEmpty()
      return
    }
    if (e.key === 'ArrowUp' && !slashOpen && !el.value.slice(0, el.selectionStart ?? 0).includes('\n')) {
      e.preventDefault()
      onArrow('up')
    }
    if (
      e.key === 'ArrowDown' &&
      !slashOpen &&
      !el.value.slice(el.selectionEnd ?? el.value.length).includes('\n')
    ) {
      e.preventDefault()
      onArrow('down')
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    if (value.startsWith('/') && !value.includes(' ') && block.type === 'paragraph') {
      setSlashOpen(true)
      setSlashQuery(value.slice(1))
      setSlashIndex(0)
    } else if (slashOpen) {
      setSlashOpen(false)
    }
    if (block.type === 'paragraph') {
      const match = BLOCK_TYPES.find((b) => b.shortcut && value === b.shortcut)
      if (match) {
        onTurnInto(match.type, true)
        return
      }
    }
    onChange({ content: value })
  }

  const isDivider = block.type === 'divider'

  return (
    <div className="block-row relative flex gap-1">
      <div className="block-gutter -ml-14 flex w-12 shrink-0 items-start justify-end pt-0.5">
        <Button variant="ghost" size="icon-xs" aria-label="Add block below" onClick={onInsertBelow}>
          <Plus />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label="Block options">
              <GripVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Turn into</DropdownMenuLabel>
            {BLOCK_TYPES.filter((b) => b.type !== 'divider').map((b) => {
              const I = b.icon
              return (
                <DropdownMenuItem key={b.type} onClick={() => onTurnInto(b.type)}>
                  <I data-icon="inline-start" />
                  {b.label}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 data-icon="inline-start" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="relative min-w-0 flex-1">
        {isDivider ? (
          <button
            type="button"
            aria-label="Divider"
            className="w-full border-0 bg-transparent py-3"
            onKeyDown={(e) => {
              if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault()
                onDelete()
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                onInsertBelow()
              }
              if (e.key === 'ArrowUp') onArrow('up')
              if (e.key === 'ArrowDown') onArrow('down')
            }}
          >
            <div className="border-t" />
          </button>
        ) : (
          <BlockFrame block={block} listNumber={listNumber} onToggle={() => onChange({ checked: !block.checked })}>
            <textarea
              ref={setRefs}
              value={block.content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setSlashOpen(false)}
              placeholder={placeholderFor(block.type)}
              rows={1}
              aria-label={`${block.type} block`}
              spellCheck={block.type !== 'code'}
              className={cn(
                'block-textarea w-full py-0.5 font-sans',
                textClassFor(block.type),
                block.type === 'todo' && block.checked && 'text-muted-foreground line-through',
              )}
            />
          </BlockFrame>
        )}
        {slashOpen && (
          <SlashMenu query={slashQuery} activeIndex={slashIndex} onHover={setSlashIndex} onPick={pickSlash} />
        )}
      </div>
    </div>
  )
})

function BlockFrame({
  block,
  listNumber,
  onToggle,
  children,
}: {
  block: Block
  listNumber?: number
  onToggle: () => void
  children: React.ReactNode
}) {
  switch (block.type) {
    case 'bulleted':
      return (
        <div className="flex items-start gap-2">
          <span className="w-6 shrink-0 pt-1 text-center text-lg text-muted-foreground">•</span>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      )
    case 'numbered':
      return (
        <div className="flex items-start gap-2">
          <span className="w-6 shrink-0 pt-1 text-right tabular-nums text-muted-foreground">
            {listNumber ?? 1}.
          </span>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      )
    case 'todo':
      return (
        <div className="flex items-start gap-2">
          <div className="flex w-6 shrink-0 justify-center pt-2">
            <Checkbox
              checked={!!block.checked}
              onCheckedChange={onToggle}
              aria-label={block.checked ? 'Mark as not done' : 'Mark as done'}
            />
          </div>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      )
    case 'quote':
      return <div className="my-1 border-l-2 border-foreground/20 pl-4">{children}</div>
    case 'callout':
      return (
        <div className="my-1 flex items-start gap-3 rounded-lg border bg-muted/50 px-4 py-3">
          <span aria-hidden className="text-lg">
            💡
          </span>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      )
    case 'code':
      return <div className="my-1 rounded-lg border bg-muted p-4">{children}</div>
    default:
      return <>{children}</>
  }
}
