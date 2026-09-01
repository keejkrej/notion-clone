import type { ComponentType } from 'react'
import {
  type OcticonProps,
  CodeIcon,
  HeadingIcon,
  HorizontalRuleIcon,
  InfoIcon,
  ListOrderedIcon,
  ListUnorderedIcon,
  QuoteIcon,
  TasklistIcon,
  TypographyIcon,
} from '@primer/octicons-react'
import type { BlockType } from '@/lib/types'

export interface BlockTypeDef {
  type: BlockType
  label: string
  description: string
  icon: ComponentType<OcticonProps>
  keywords: string[]
  /** Markdown-style shortcut typed at the start of a block, e.g. "# " */
  shortcut?: string
}

export const BLOCK_TYPES: BlockTypeDef[] = [
  { type: 'paragraph', label: 'Text', description: 'Plain text paragraph.', icon: TypographyIcon, keywords: ['text', 'paragraph', 'p'] },
  { type: 'heading1', label: 'Heading 1', description: 'Large section heading.', icon: HeadingIcon, keywords: ['h1', 'heading', 'title'], shortcut: '# ' },
  { type: 'heading2', label: 'Heading 2', description: 'Medium section heading.', icon: HeadingIcon, keywords: ['h2', 'heading', 'subtitle'], shortcut: '## ' },
  { type: 'heading3', label: 'Heading 3', description: 'Small section heading.', icon: HeadingIcon, keywords: ['h3', 'heading'], shortcut: '### ' },
  { type: 'bulleted', label: 'Bulleted list', description: 'Simple bulleted list.', icon: ListUnorderedIcon, keywords: ['bullet', 'list', 'ul'], shortcut: '- ' },
  { type: 'numbered', label: 'Numbered list', description: 'List with numbering.', icon: ListOrderedIcon, keywords: ['number', 'list', 'ol'], shortcut: '1. ' },
  { type: 'todo', label: 'To-do list', description: 'Track tasks with a checkbox.', icon: TasklistIcon, keywords: ['todo', 'task', 'check'], shortcut: '[] ' },
  { type: 'quote', label: 'Quote', description: 'Capture a quotation.', icon: QuoteIcon, keywords: ['quote', 'blockquote'], shortcut: '> ' },
  { type: 'callout', label: 'Callout', description: 'Make writing stand out.', icon: InfoIcon, keywords: ['callout', 'info', 'note'] },
  { type: 'code', label: 'Code', description: 'Capture a code snippet.', icon: CodeIcon, keywords: ['code', 'snippet'], shortcut: '```' },
  { type: 'divider', label: 'Divider', description: 'Visually divide blocks.', icon: HorizontalRuleIcon, keywords: ['divider', 'hr', 'rule'], shortcut: '---' },
]

export function defFor(type: BlockType) {
  return BLOCK_TYPES.find((b) => b.type === type) ?? BLOCK_TYPES[0]
}

export function matchShortcut(text: string): BlockTypeDef | null {
  for (const def of BLOCK_TYPES) {
    if (def.shortcut && text === def.shortcut) return def
  }
  return null
}

export function placeholderFor(type: BlockType) {
  switch (type) {
    case 'heading1':
      return 'Heading 1'
    case 'heading2':
      return 'Heading 2'
    case 'heading3':
      return 'Heading 3'
    case 'bulleted':
    case 'numbered':
      return 'List'
    case 'todo':
      return 'To-do'
    case 'quote':
      return 'Quote'
    case 'callout':
      return 'Type something…'
    case 'code':
      return 'Write some code…'
    default:
      return "Type '/' for commands"
  }
}
