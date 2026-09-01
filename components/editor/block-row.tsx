'use client'

import { forwardRef, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { ActionList, ActionMenu, Checkbox, IconButton } from '@primer/react'
import { GrabberIcon, PlusIcon, TrashIcon } from '@primer/octicons-react'
import type { Block, BlockType } from '@/lib/types'
import { BLOCK_TYPES, placeholderFor } from './block-types'
import { SlashMenu, filterBlockTypes } from './slash-menu'

export interface BlockRowProps {
  block: Block
  index: number
  /** For numbered lists: the 1-based number to display */
  listNumber?: number
  onChange: (patch: Partial<Block>) => void
  onEnter: (textAfterCursor: string, textBeforeCursor: string) => void
  onBackspaceEmpty: () => void
  onArrow: (dir: 'up' | 'down') => void
  onInsertBelow: () => void
  onDelete: () => void
  onTurnInto: (type: BlockType) => void
}

const textStyleFor = (type: BlockType): CSSProperties => {
  switch (type) {
    case 'heading1':
      return { fontSize: 30, fontWeight: 700, lineHeight: 1.25, marginTop: 'var(--base-size-24)' }
    case 'heading2':
      return { fontSize: 24, fontWeight: 600, lineHeight: 1.3, marginTop: 'var(--base-size-16)' }
    case 'heading3':
      return { fontSize: 20, fontWeight: 600, lineHeight: 1.35, marginTop: 'var(--base-size-8)' }
    case 'code':
      return {
        fontFamily: 'var(--fontStack-monospace)',
        fontSize: 'var(--text-codeBlock-size)',
        lineHeight: 'var(--text-codeBlock-lineHeight)',
      }
    case 'quote':
      return { fontSize: 'var(--text-body-size-large)', lineHeight: 'var(--text-body-lineHeight-large)' }
    default:
      return { fontSize: 'var(--text-body-size-large)', lineHeight: 1.6 }
  }
}

export const BlockRow = forwardRef<HTMLTextAreaElement, BlockRowProps>(function BlockRow(
  {
    block,
    listNumber,
    onChange,
    onEnter,
    onBackspaceEmpty,
    onArrow,
    onInsertBelow,
    onDelete,
    onTurnInto,
  },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null)
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashIndex, setSlashIndex] = useState(0)

  // Auto-size the textarea to its content.
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
    // Strip the "/query" text from the block.
    onChange({ content: '' })
    onTurnInto(type)
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
        const pick = items[slashIndex]
        if (pick) pickSlash(pick.type)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setSlashOpen(false)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !composing) {
      if (block.type === 'code') return // newline inside code
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

    if (e.key === 'ArrowUp' && !slashOpen) {
      const beforeCursor = el.value.slice(0, el.selectionStart ?? 0)
      if (!beforeCursor.includes('\n')) {
        e.preventDefault()
        onArrow('up')
      }
    }
    if (e.key === 'ArrowDown' && !slashOpen) {
      const afterCursor = el.value.slice(el.selectionEnd ?? el.value.length)
      if (!afterCursor.includes('\n')) {
        e.preventDefault()
        onArrow('down')
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value

    // Slash command: only when the block starts with "/" and there's no space yet.
    if (value.startsWith('/') && !value.includes(' ') && block.type === 'paragraph') {
      setSlashOpen(true)
      setSlashQuery(value.slice(1))
      setSlashIndex(0)
    } else if (slashOpen) {
      setSlashOpen(false)
    }

    // Markdown shortcuts: "# ", "- ", "[] " etc.
    if (block.type === 'paragraph') {
      const match = BLOCK_TYPES.find((b) => b.shortcut && value === b.shortcut)
      if (match) {
        onChange({ content: '' })
        onTurnInto(match.type)
        return
      }
    }

    onChange({ content: value })
  }

  const isDivider = block.type === 'divider'

  return (
    <div className="block-row" style={{ position: 'relative', display: 'flex', gap: 'var(--base-size-4)' }}>
      {/* Gutter controls */}
      <div
        className="block-gutter"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0,
          marginLeft: -60,
          width: 56,
          flexShrink: 0,
          paddingTop: block.type.startsWith('heading') ? 'var(--base-size-8)' : 'var(--base-size-4)',
        }}
      >
        <IconButton
          icon={PlusIcon}
          aria-label="Add block below"
          variant="invisible"
          size="small"
          onClick={onInsertBelow}
        />
        <ActionMenu>
          <ActionMenu.Anchor>
            <IconButton icon={GrabberIcon} aria-label="Block options" variant="invisible" size="small" />
          </ActionMenu.Anchor>
          <ActionMenu.Overlay width="small">
            <ActionList>
              <ActionList.Group>
                <ActionList.GroupHeading>Turn into</ActionList.GroupHeading>
                {BLOCK_TYPES.filter((b) => b.type !== 'divider').map((b) => {
                  const IconComp = b.icon
                  return (
                    <ActionList.Item key={b.type} selected={b.type === block.type} onSelect={() => onTurnInto(b.type)}>
                      <ActionList.LeadingVisual>
                        <IconComp />
                      </ActionList.LeadingVisual>
                      {b.label}
                    </ActionList.Item>
                  )
                })}
              </ActionList.Group>
              <ActionList.Divider />
              <ActionList.Item variant="danger" onSelect={onDelete}>
                <ActionList.LeadingVisual>
                  <TrashIcon />
                </ActionList.LeadingVisual>
                Delete
              </ActionList.Item>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        {isDivider ? (
          <button
            type="button"
            aria-label="Divider"
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
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: 'var(--base-size-12) 0',
              cursor: 'default',
              borderRadius: 'var(--borderRadius-small)',
            }}
          >
            <hr
              style={{
                border: 'none',
                borderTop: 'var(--borderWidth-thin) solid var(--borderColor-default)',
              }}
            />
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
              className="block-textarea"
              style={{
                width: '100%',
                resize: 'none',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color:
                  block.type === 'todo' && block.checked
                    ? 'var(--fgColor-muted)'
                    : 'var(--fgColor-default)',
                textDecoration: block.type === 'todo' && block.checked ? 'line-through' : 'none',
                padding: 'var(--base-size-4) 0',
                overflow: 'hidden',
                fontFamily: 'inherit',
                ...textStyleFor(block.type),
              }}
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

/** Wraps the textarea with the visual chrome for lists, quotes, callouts, code. */
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
        <div style={{ display: 'flex', gap: 'var(--base-size-8)', alignItems: 'flex-start' }}>
          <span
            aria-hidden
            style={{
              width: 24,
              flexShrink: 0,
              textAlign: 'center',
              fontSize: 'var(--text-body-size-large)',
              lineHeight: 1.6,
              paddingTop: 'var(--base-size-4)',
            }}
          >
            •
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        </div>
      )
    case 'numbered':
      return (
        <div style={{ display: 'flex', gap: 'var(--base-size-8)', alignItems: 'flex-start' }}>
          <span
            aria-hidden
            style={{
              width: 24,
              flexShrink: 0,
              textAlign: 'right',
              fontSize: 'var(--text-body-size-large)',
              lineHeight: 1.6,
              paddingTop: 'var(--base-size-4)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {listNumber ?? 1}.
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        </div>
      )
    case 'todo':
      return (
        <div style={{ display: 'flex', gap: 'var(--base-size-8)', alignItems: 'flex-start' }}>
          <div style={{ width: 24, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 'var(--base-size-8)' }}>
            <Checkbox
              checked={!!block.checked}
              onChange={onToggle}
              aria-label={block.checked ? 'Mark as not done' : 'Mark as done'}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        </div>
      )
    case 'quote':
      return (
        <div
          style={{
            borderLeft: '3px solid var(--fgColor-default)',
            paddingLeft: 'var(--base-size-16)',
            margin: 'var(--base-size-4) 0',
          }}
        >
          {children}
        </div>
      )
    case 'callout':
      return (
        <div
          style={{
            display: 'flex',
            gap: 'var(--base-size-12)',
            alignItems: 'flex-start',
            padding: 'var(--base-size-12) var(--base-size-16)',
            margin: 'var(--base-size-4) 0',
            backgroundColor: 'var(--bgColor-accent-muted)',
            border: 'var(--borderWidth-thin) solid var(--borderColor-accent-muted)',
            borderRadius: 'var(--borderRadius-medium)',
          }}
        >
          <span aria-hidden style={{ fontSize: 20, lineHeight: 1.4 }}>
            💡
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        </div>
      )
    case 'code':
      return (
        <div
          style={{
            padding: 'var(--base-size-16)',
            margin: 'var(--base-size-4) 0',
            backgroundColor: 'var(--bgColor-muted)',
            border: 'var(--borderWidth-thin) solid var(--borderColor-default)',
            borderRadius: 'var(--borderRadius-medium)',
          }}
        >
          {children}
        </div>
      )
    default:
      return <>{children}</>
  }
}
