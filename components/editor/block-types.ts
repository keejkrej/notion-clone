import type { ComponentType } from 'react'
import { Code2, Heading, Minus, Info, ListOrdered, List, Quote, ListChecks, Type } from 'lucide-react'
import type { BlockType } from '@/lib/types'

export interface BlockTypeDef { type: BlockType; label: string; description: string; icon: ComponentType<{ className?: string; 'data-icon'?: string }>; keywords: string[]; shortcut?: string }

export const BLOCK_TYPES: BlockTypeDef[] = [
  { type: 'paragraph', label: 'Text', description: 'Plain text paragraph.', icon: Type, keywords: ['text', 'paragraph', 'p'] },
  { type: 'heading1', label: 'Heading 1', description: 'Large section heading.', icon: Heading, keywords: ['h1', 'heading', 'title'], shortcut: '# ' },
  { type: 'heading2', label: 'Heading 2', description: 'Medium section heading.', icon: Heading, keywords: ['h2', 'heading', 'subtitle'], shortcut: '## ' },
  { type: 'heading3', label: 'Heading 3', description: 'Small section heading.', icon: Heading, keywords: ['h3', 'heading'], shortcut: '### ' },
  { type: 'bulleted', label: 'Bulleted list', description: 'Simple bulleted list.', icon: List, keywords: ['bullet', 'list', 'ul'], shortcut: '- ' },
  { type: 'numbered', label: 'Numbered list', description: 'List with numbering.', icon: ListOrdered, keywords: ['number', 'list', 'ol'], shortcut: '1. ' },
  { type: 'todo', label: 'To-do list', description: 'Track tasks with a checkbox.', icon: ListChecks, keywords: ['todo', 'task', 'check'], shortcut: '[] ' },
  { type: 'quote', label: 'Quote', description: 'Capture a quotation.', icon: Quote, keywords: ['quote', 'blockquote'], shortcut: '> ' },
  { type: 'callout', label: 'Callout', description: 'Make writing stand out.', icon: Info, keywords: ['callout', 'info', 'note'] },
  { type: 'code', label: 'Code', description: 'Capture a code snippet.', icon: Code2, keywords: ['code', 'snippet'], shortcut: '```' },
  { type: 'divider', label: 'Divider', description: 'Visually divide blocks.', icon: Minus, keywords: ['divider', 'hr', 'rule'], shortcut: '---' },
]

export function defFor(type: BlockType) { return BLOCK_TYPES.find((b) => b.type === type) ?? BLOCK_TYPES[0] }
export function matchShortcut(text: string) { return BLOCK_TYPES.find((b) => b.shortcut === text) ?? null }
export function placeholderFor(type: BlockType) {
  if (type.startsWith('heading')) return type.replace('heading', 'Heading ')
  if (type === 'bulleted' || type === 'numbered') return 'List'
  if (type === 'todo') return 'To-do'
  if (type === 'quote') return 'Quote'
  if (type === 'callout') return 'Type something…'
  if (type === 'code') return 'Write some code…'
  return "Type '/' for commands"
}
