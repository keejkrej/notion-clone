'use client'

import { useRouter } from 'next/navigation'
import { TreeView } from '@primer/react'
import { FileIcon, PlusIcon, StarFillIcon, StarIcon, TrashIcon } from '@primer/octicons-react'
import type { Page } from '@/lib/types'
import { useWorkspace } from '@/lib/workspace-store'

interface PageTreeProps {
  pages: Page[]
  currentPageId: string
  label: string
  /** When true, sub-pages are not rendered (used for Favorites) */
  flat?: boolean
}

export function PageTree({ pages, currentPageId, label, flat }: PageTreeProps) {
  return (
    <TreeView aria-label={label}>
      {pages.map((p) => (
        <PageTreeItem key={p.id} page={p} currentPageId={currentPageId} flat={flat} />
      ))}
    </TreeView>
  )
}

function PageTreeItem({
  page,
  currentPageId,
  flat,
}: {
  page: Page
  currentPageId: string
  flat?: boolean
}) {
  const router = useRouter()
  const { childrenOf, breadcrumbsFor, createPage, updatePage, trashPage } = useWorkspace()
  const children = flat ? [] : childrenOf(page.id)
  const isCurrent = page.id === currentPageId
  // Keep the branch open when the current page lives inside it.
  const containsCurrent = !flat && breadcrumbsFor(currentPageId).some((b) => b.id === page.id)
  const name = page.title || 'Untitled'

  return (
    <TreeView.Item
      id={`${flat ? 'fav' : 'tree'}-${page.id}`}
      current={isCurrent}
      defaultExpanded={containsCurrent}
      onSelect={() => router.push(`/p/${page.id}`)}
      secondaryActions={[
        {
          label: page.favorite ? 'Remove from favorites' : 'Add to favorites',
          icon: page.favorite ? StarFillIcon : StarIcon,
          onClick: () => updatePage(page.id, { favorite: !page.favorite }),
        },
        {
          label: 'Add sub-page',
          icon: PlusIcon,
          onClick: () => {
            const id = createPage(page.id)
            router.push(`/p/${id}`)
          },
        },
        {
          label: 'Move to trash',
          icon: TrashIcon,
          onClick: () => {
            trashPage(page.id)
            if (isCurrent || containsCurrent) router.push('/p/getting-started')
          },
        },
      ]}
    >
      <TreeView.LeadingVisual label={page.icon ? '' : 'Page'}>
        {page.icon ? (
          <span aria-hidden style={{ fontSize: 'var(--text-body-size-medium)', lineHeight: 1 }}>
            {page.icon}
          </span>
        ) : (
          <FileIcon />
        )}
      </TreeView.LeadingVisual>
      {name}
      {children.length > 0 && (
        <TreeView.SubTree aria-label={`Pages inside ${name}`}>
          {children.map((c) => (
            <PageTreeItem key={c.id} page={c} currentPageId={currentPageId} />
          ))}
        </TreeView.SubTree>
      )}
    </TreeView.Item>
  )
}
