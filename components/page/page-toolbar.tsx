'use client'

import { useRouter } from 'next/navigation'
import { ActionList, ActionMenu, Breadcrumbs, IconButton, Stack, Text } from '@primer/react'
import {
  KebabHorizontalIcon,
  PlusIcon,
  StarFillIcon,
  StarIcon,
  TrashIcon,
} from '@primer/octicons-react'
import type { Page } from '@/lib/types'
import { useWorkspace } from '@/lib/workspace-store'

function relativeTime(ts: number) {
  const diff = Date.now() - ts
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export function PageToolbar({ page }: { page: Page }) {
  const router = useRouter()
  const { breadcrumbsFor, updatePage, trashPage, createPage, sidebarOpen } = useWorkspace()
  const crumbs = breadcrumbsFor(page.id)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        backgroundColor: 'var(--bgColor-default)',
        padding: `var(--base-size-8) var(--base-size-12) var(--base-size-8) ${
          sidebarOpen ? 'var(--base-size-12)' : 'var(--base-size-48)'
        }`,
      }}
    >
      <Stack direction="horizontal" align="center" justify="space-between" gap="normal">
        <Breadcrumbs>
          {crumbs.map((c, i) => (
            <Breadcrumbs.Item
              key={c.id}
              href={`/p/${c.id}`}
              selected={i === crumbs.length - 1}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                router.push(`/p/${c.id}`)
              }}
            >
              {c.icon ? `${c.icon} ` : ''}
              {c.title || 'Untitled'}
            </Breadcrumbs.Item>
          ))}
        </Breadcrumbs>

        <Stack direction="horizontal" align="center" gap="condensed">
          <Text size="small" style={{ color: 'var(--fgColor-muted)', whiteSpace: 'nowrap' }}>
            Edited {relativeTime(page.updatedAt)}
          </Text>
          <IconButton
            icon={page.favorite ? StarFillIcon : StarIcon}
            aria-label={page.favorite ? 'Remove from favorites' : 'Add to favorites'}
            variant="invisible"
            size="small"
            onClick={() => updatePage(page.id, { favorite: !page.favorite })}
          />
          <ActionMenu>
            <ActionMenu.Anchor>
              <IconButton
                icon={KebabHorizontalIcon}
                aria-label="Page options"
                variant="invisible"
                size="small"
              />
            </ActionMenu.Anchor>
            <ActionMenu.Overlay width="small" align="end">
              <ActionList>
                <ActionList.Item
                  onSelect={() => {
                    const id = createPage(page.id)
                    router.push(`/p/${id}`)
                  }}
                >
                  <ActionList.LeadingVisual>
                    <PlusIcon />
                  </ActionList.LeadingVisual>
                  Add sub-page
                </ActionList.Item>
                <ActionList.Divider />
                <ActionList.Item
                  variant="danger"
                  onSelect={() => {
                    trashPage(page.id)
                    router.push('/p/getting-started')
                  }}
                >
                  <ActionList.LeadingVisual>
                    <TrashIcon />
                  </ActionList.LeadingVisual>
                  Move to trash
                </ActionList.Item>
              </ActionList>
            </ActionMenu.Overlay>
          </ActionMenu>
        </Stack>
      </Stack>
    </header>
  )
}
