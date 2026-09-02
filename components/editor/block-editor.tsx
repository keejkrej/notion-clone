'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Block, BlockType } from '@/lib/types'
import { block as makeBlock } from '@/lib/seed'
import { BlockRow } from './block-row'

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
  /** Increment to focus the first block from outside (e.g. Enter on the title) */
  focusFirstSignal?: number
}

export function BlockEditor({ blocks, onChange, focusFirstSignal }: BlockEditorProps) {
  const refs = useRef<Map<string, HTMLTextAreaElement>>(new Map())
  const [pendingFocus, setPendingFocus] = useState<{ id: string; caret: 'start' | 'end' } | null>(null)

  // Apply focus after the DOM has updated with the new block.
  useEffect(() => {
    if (!pendingFocus) return
    const el = refs.current.get(pendingFocus.id)
    if (el) {
      el.focus()
      const pos = pendingFocus.caret === 'end' ? el.value.length : 0
      el.setSelectionRange(pos, pos)
    }
    setPendingFocus(null)
  }, [pendingFocus, blocks])

  useEffect(() => {
    if (focusFirstSignal && blocks[0]) {
      setPendingFocus({ id: blocks[0].id, caret: 'start' })
    }
  }, [focusFirstSignal, blocks])

  const update = useCallback(
    (index: number, patch: Partial<Block>) => {
      const next = blocks.slice()
      next[index] = { ...next[index], ...patch }
      onChange(next)
    },
    [blocks, onChange],
  )

  function insertAfter(index: number, type: BlockType = 'paragraph', content = '') {
    const nb = makeBlock(type, content)
    const next = blocks.slice()
    next.splice(index + 1, 0, nb)
    onChange(next)
    setPendingFocus({ id: nb.id, caret: 'start' })
  }

  function handleEnter(index: number, after: string, before: string) {
    const cur = blocks[index]
    // Pressing Enter on an empty list item exits the list.
    const listTypes: BlockType[] = ['bulleted', 'numbered', 'todo']
    if (listTypes.includes(cur.type) && cur.content === '') {
      update(index, { type: 'paragraph' })
      return
    }
    const continueType: BlockType = listTypes.includes(cur.type) ? cur.type : 'paragraph'
    const next = blocks.slice()
    next[index] = { ...cur, content: before }
    const nb = makeBlock(continueType, after)
    next.splice(index + 1, 0, nb)
    onChange(next)
    setPendingFocus({ id: nb.id, caret: 'start' })
  }

  function handleBackspaceEmpty(index: number) {
    const cur = blocks[index]
    if (cur.type !== 'paragraph') {
      update(index, { type: 'paragraph', checked: undefined })
      return
    }
    if (blocks.length === 1) return
    const next = blocks.slice()
    next.splice(index, 1)
    onChange(next)
    const target = next[Math.max(0, index - 1)]
    if (target) setPendingFocus({ id: target.id, caret: 'end' })
  }

  function handleDelete(index: number) {
    if (blocks.length === 1) {
      onChange([makeBlock('paragraph')])
      return
    }
    const next = blocks.slice()
    next.splice(index, 1)
    onChange(next)
  }

  function handleArrow(index: number, dir: 'up' | 'down') {
    const target = blocks[dir === 'up' ? index - 1 : index + 1]
    if (!target) return
    if (target.type === 'divider') {
      // Skip over dividers
      const beyond = blocks[dir === 'up' ? index - 2 : index + 2]
      if (beyond) setPendingFocus({ id: beyond.id, caret: dir === 'up' ? 'end' : 'start' })
      return
    }
    setPendingFocus({ id: target.id, caret: dir === 'up' ? 'end' : 'start' })
  }

  function handleTurnInto(index: number, type: BlockType, clearContent = false) {
    const cur = blocks[index]
    const content = clearContent || type === 'divider' ? '' : cur.content
    const next = blocks.slice()
    next[index] = { ...cur, type, content, checked: type === 'todo' ? !!cur.checked : undefined }
    if (type === 'divider') {
      // Add a paragraph after a divider so the user can keep typing.
      const nb = makeBlock('paragraph')
      next.splice(index + 1, 0, nb)
      onChange(next)
      setPendingFocus({ id: nb.id, caret: 'start' })
    } else {
      onChange(next)
      setPendingFocus({ id: cur.id, caret: 'end' })
    }
  }

  // Compute numbering for consecutive numbered blocks.
  let counter = 0
  const numbers = blocks.map((b) => {
    if (b.type === 'numbered') {
      counter += 1
      return counter
    }
    counter = 0
    return undefined
  })

  return (
    <div
      className="block-editor flex flex-col gap-1"
    >
      {blocks.map((b, i) => (
        <BlockRow
          key={b.id}
          ref={(el) => {
            if (el) refs.current.set(b.id, el)
            else refs.current.delete(b.id)
          }}
          block={b}
          index={i}
          listNumber={numbers[i]}
          onChange={(patch) => update(i, patch)}
          onEnter={(after, before) => handleEnter(i, after, before)}
          onBackspaceEmpty={() => handleBackspaceEmpty(i)}
          onArrow={(dir) => handleArrow(i, dir)}
          onInsertBelow={() => insertAfter(i)}
          onDelete={() => handleDelete(i)}
          onTurnInto={(type, clear) => handleTurnInto(i, type, clear)}
        />
      ))}
      <button
        type="button"
        aria-label="Add a block at the end"
        onClick={() => insertAfter(blocks.length - 1)}
        className="h-32 w-full cursor-text border-0 bg-transparent"
      />
    </div>
  )
}
