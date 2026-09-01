'use client'

import { useRouter } from 'next/navigation'
import { ActionList, Button, CounterLabel, IconButton, Stack, Text } from '@primer/react'
import {
  PlusIcon,
  SearchIcon,
  SidebarCollapseIcon,
  SidebarExpandIcon,
  TrashIcon,
} from '@primer/octicons-react'
import { useWorkspace } from '@/lib/workspace-store'
import { PageTree } from './page-tree'

export function Sidebar({ currentPageId }: { currentPageId: string }) {
  const router = useRouter()
  const {
    ws,
    rootPages,
    favorites,
    trashedPages,
    createPage,
    sidebarOpen,
    setSidebarOpen,
    setSearchOpen,
    setTrashOpen,
  } = useWorkspace()

  if (!sidebarOpen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 'var(--base-size-8)',
          left: 'var(--base-size-8)',
          zIndex: 10,
        }}
      >
        <IconButton
          icon={SidebarExpandIcon}
          aria-label="Open sidebar"
          variant="invisible"
          onClick={() => setSidebarOpen(true)}
        />
      </div>
    )
  }

  function newPage() {
    const id = createPage(null)
    router.push(`/p/${id}`)
  }

  return (
    <nav
      aria-label="Workspace"
      style={{
        width: 264,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bgColor-inset)',
        borderRight: 'var(--borderWidth-thin) solid var(--borderColor-default)',
      }}
    >
      {/* Workspace header */}
      <div
        style={{
          padding: 'var(--base-size-8) var(--base-size-8) var(--base-size-4) var(--base-size-12)',
        }}
      >
        <Stack direction="horizontal" align="center" justify="space-between" gap="condensed">
          <Stack direction="horizontal" align="center" gap="condensed" style={{ minWidth: 0 }}>
            <span
              aria-hidden
              style={{
                width: 20,
                height: 20,
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--borderRadius-small)',
                backgroundColor: 'var(--bgColor-accent-emphasis)',
                color: 'var(--fgColor-onEmphasis)',
                fontSize: 'var(--text-caption-size)',
                fontWeight: 'var(--base-text-weight-semibold, 600)',
              }}
            >
              {ws.name.charAt(0)}
            </span>
            <Text
              weight="semibold"
              size="small"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {ws.name}
            </Text>
          </Stack>
          <IconButton
            icon={SidebarCollapseIcon}
            aria-label="Close sidebar"
            variant="invisible"
            size="small"
            onClick={() => setSidebarOpen(false)}
          />
        </Stack>
      </div>

      {/* Primary actions */}
      <div style={{ padding: '0 var(--base-size-8)' }}>
        <ActionList variant="full">
          <ActionList.Item onSelect={() => setSearchOpen(true)}>
            <ActionList.LeadingVisual>
              <SearchIcon />
            </ActionList.LeadingVisual>
            Search
            <ActionList.TrailingVisual>
              <Text size="small" style={{ color: 'var(--fgColor-muted)' }}>
                ⌘K
              </Text>
            </ActionList.TrailingVisual>
          </ActionList.Item>
          <ActionList.Item onSelect={newPage}>
            <ActionList.LeadingVisual>
              <PlusIcon />
            </ActionList.LeadingVisual>
            New page
          </ActionList.Item>
        </ActionList>
      </div>

      {/* Scrollable tree area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--base-size-8)' }}>
        <Stack direction="vertical" gap="normal" style={{ paddingTop: 'var(--base-size-12)' }}>
          {favorites.length > 0 && (
            <section aria-labelledby="favorites-heading">
              <SectionHeading id="favorites-heading">Favorites</SectionHeading>
              <PageTree pages={favorites} currentPageId={currentPageId} label="Favorite pages" flat />
            </section>
          )}

          <section aria-labelledby="private-heading">
            <Stack direction="horizontal" align="center" justify="space-between">
              <SectionHeading id="private-heading">Private</SectionHeading>
              <IconButton
                icon={PlusIcon}
                aria-label="Add a page"
                variant="invisible"
                size="small"
                onClick={newPage}
              />
            </Stack>
            {rootPages.length > 0 ? (
              <PageTree pages={rootPages} currentPageId={currentPageId} label="Pages" />
            ) : (
              <div style={{ padding: 'var(--base-size-8) var(--base-size-8)' }}>
                <Text size="small" style={{ color: 'var(--fgColor-muted)' }}>
                  No pages yet.
                </Text>
              </div>
            )}
          </section>
        </Stack>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: 'var(--base-size-8)',
          borderTop: 'var(--borderWidth-thin) solid var(--borderColor-default)',
        }}
      >
        <ActionList variant="full">
          <ActionList.Item onSelect={() => setTrashOpen(true)}>
            <ActionList.LeadingVisual>
              <TrashIcon />
            </ActionList.LeadingVisual>
            Trash
            {trashedPages.length > 0 && (
              <ActionList.TrailingVisual>
                <CounterLabel>{trashedPages.length}</CounterLabel>
              </ActionList.TrailingVisual>
            )}
          </ActionList.Item>
        </ActionList>
        <div style={{ padding: 'var(--base-size-8) var(--base-size-8) 0' }}>
          <Button block variant="default" size="small" leadingVisual={PlusIcon} onClick={newPage}>
            New page
          </Button>
        </div>
      </div>
    </nav>
  )
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Text
      as="h2"
      id={id}
      size="small"
      weight="semibold"
      style={{
        color: 'var(--fgColor-muted)',
        padding: 'var(--base-size-4) var(--base-size-8)',
        textTransform: 'none',
        fontSize: 'var(--text-caption-size)',
        display: 'block',
      }}
    >
      {children}
    </Text>
  )
}
