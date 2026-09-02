import type { Block, BlockType, Page, Workspace } from './types'

let counter = 0
export function uid(prefix = 'id') {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`
}

export function block(type: BlockType, content = '', checked?: boolean): Block {
  return { id: uid('b'), type, content, checked }
}

function page(
  id: string,
  parentId: string | null,
  title: string,
  icon: string | null,
  cover: string | null,
  blocks: Block[],
  favorite = false,
): Page {
  const now = Date.now()
  return {
    id,
    parentId,
    title,
    icon,
    cover,
    blocks,
    favorite,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }
}

export const COVERS: { id: string; label: string; css: string }[] = [
  { id: 'aurora', label: 'Aurora', css: 'linear-gradient(135deg, var(--primary), var(--accent))' },
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(135deg, var(--destructive), var(--secondary))' },
  { id: 'meadow', label: 'Meadow', css: 'linear-gradient(135deg, var(--secondary), var(--primary))' },
  { id: 'ember', label: 'Ember', css: 'linear-gradient(135deg, var(--destructive), var(--muted))' },
  { id: 'slate', label: 'Slate', css: 'linear-gradient(135deg, var(--bgColor-neutral-emphasis), var(--bgColor-inset))' },
  { id: 'lavender', label: 'Lavender', css: 'linear-gradient(135deg, var(--bgColor-done-emphasis), var(--bgColor-sponsors-emphasis))' },
]

export function coverCss(id: string | null) {
  return COVERS.find((c) => c.id === id)?.css ?? null
}

export function createSeedWorkspace(): Workspace {
  const pages: Page[] = [
    page(
      'getting-started',
      null,
      'Getting started',
      '👋',
      'aurora',
      [
        block('heading1', 'Welcome to your workspace'),
        block(
          'paragraph',
          'This is a Notion-style editor built entirely with the Primer design system. Every page is made of blocks — click anywhere and start typing.',
        ),
        block('callout', 'Tip: type / at the start of an empty block to open the block menu.'),
        block('heading2', 'Things to try'),
        block('todo', 'Create a new page from the sidebar', true),
        block('todo', 'Add an emoji icon and a cover to a page'),
        block('todo', 'Star a page to pin it under Favorites'),
        block('todo', 'Press Cmd/Ctrl + K to search'),
        block('heading2', 'Keyboard'),
        block('bulleted', 'Enter — new block below'),
        block('bulleted', 'Backspace on an empty block — delete it'),
        block('bulleted', 'Arrow up / down — move between blocks'),
        block('divider'),
        block('quote', 'The best tool is the one that gets out of your way.'),
      ],
      true,
    ),
    page(
      'product-roadmap',
      null,
      'Product roadmap',
      '🗺️',
      'meadow',
      [
        block('heading1', 'Q3 roadmap'),
        block('paragraph', 'Priorities for the quarter, grouped by theme. Sub-pages hold the detailed specs.'),
        block('heading2', 'Themes'),
        block('numbered', 'Editor reliability'),
        block('numbered', 'Collaboration primitives'),
        block('numbered', 'Search & navigation'),
        block('heading2', 'Status'),
        block('todo', 'Kick-off meeting', true),
        block('todo', 'Write specs for each theme'),
        block('todo', 'Review with design'),
      ],
      true,
    ),
    page('editor-reliability', 'product-roadmap', 'Editor reliability', '🛠️', null, [
      block('heading2', 'Problem'),
      block('paragraph', 'Undo history is lost when a page is reopened, and large pages feel sluggish.'),
      block('heading2', 'Proposal'),
      block('bulleted', 'Persist undo stack per page'),
      block('bulleted', 'Virtualize block rendering above 500 blocks'),
      block('code', 'const stack = useUndoStack(pageId)\nstack.push(snapshot)'),
    ]),
    page('collaboration', 'product-roadmap', 'Collaboration primitives', '🤝', null, [
      block('paragraph', 'Presence, cursors, and comments. Start with presence.'),
      block('todo', 'Presence avatars in the header'),
      block('todo', 'Inline comments on blocks'),
    ]),
    page(
      'meeting-notes',
      null,
      'Meeting notes',
      '📝',
      null,
      [
        block('heading1', 'Weekly sync'),
        block('paragraph', 'Standing notes for the team sync. Newest at the top.'),
        block('heading3', 'Attendees'),
        block('bulleted', 'Ada, Grace, Linus'),
        block('heading3', 'Notes'),
        block('bulleted', 'Shipped the sidebar tree view'),
        block('bulleted', 'Search dialog needs keyboard shortcuts'),
        block('heading3', 'Action items'),
        block('todo', 'Grace: write the search spec'),
        block('todo', 'Linus: fix cover image sizing'),
      ],
    ),
    page('reading-list', null, 'Reading list', '📚', 'lavender', [
      block('paragraph', 'Books and long-form articles worth revisiting.'),
      block('todo', 'The Design of Everyday Things', true),
      block('todo', 'Thinking in Systems'),
      block('todo', 'A Philosophy of Software Design'),
      block('quote', 'Simple things should be simple, complex things should be possible.'),
    ]),
  ]

  const ws: Workspace = {
    name: 'Acme workspace',
    pages: {},
    rootOrder: [],
    childOrder: {},
  }

  for (const p of pages) {
    ws.pages[p.id] = p
    if (p.parentId === null) {
      ws.rootOrder.push(p.id)
    } else {
      ws.childOrder[p.parentId] = [...(ws.childOrder[p.parentId] ?? []), p.id]
    }
  }

  return ws
}
