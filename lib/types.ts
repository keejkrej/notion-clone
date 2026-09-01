export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulleted'
  | 'numbered'
  | 'todo'
  | 'quote'
  | 'code'
  | 'divider'
  | 'callout'

export interface Block {
  id: string
  type: BlockType
  content: string
  checked?: boolean
}

export interface Page {
  id: string
  parentId: string | null
  title: string
  icon: string | null
  cover: string | null
  blocks: Block[]
  favorite: boolean
  deletedAt: number | null
  createdAt: number
  updatedAt: number
}

export interface Workspace {
  name: string
  pages: Record<string, Page>
  /** Ordered ids of root pages */
  rootOrder: string[]
  /** Ordered ids of children per parent */
  childOrder: Record<string, string[]>
}
