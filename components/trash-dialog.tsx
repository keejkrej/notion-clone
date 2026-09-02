'use client'

import { IconButton, Stack, Text } from '@primer/react'
import { Blankslate, Dialog } from '@primer/react/experimental'
import { FileIcon, HistoryIcon, TrashIcon, XIcon } from '@primer/octicons-react'
import { useWorkspace } from '@/lib/workspace-store'

export function TrashDialog() {
  const { trashOpen, setTrashOpen, trashedPages, restorePage, deletePage, emptyTrash, ws } = useWorkspace()

  if (!trashOpen) return null

  // Only show top-level trashed pages (children were trashed with their parent).
  const topLevel = trashedPages.filter((p) => !p.parentId || !ws.pages[p.parentId]?.deletedAt)

  return (
    <Dialog
      title="Trash"
      subtitle="Pages in the trash can be restored or permanently deleted."
      onClose={() => setTrashOpen(false)}
      width="medium"
      footerButtons={
        topLevel.length
          ? [
              { buttonType: 'default', content: 'Close', onClick: () => setTrashOpen(false) },
              {
                buttonType: 'danger',
                content: 'Empty trash',
                onClick: () => {
                  emptyTrash()
                  setTrashOpen(false)
                },
              },
            ]
          : [{ buttonType: 'default', content: 'Close', onClick: () => setTrashOpen(false) }]
      }
    >
      {topLevel.length === 0 ? (
        <Blankslate>
          <Blankslate.Visual>
            <TrashIcon size="medium" />
          </Blankslate.Visual>
          <Blankslate.Heading>Trash is empty</Blankslate.Heading>
          <Blankslate.Description>Pages you move to the trash will show up here.</Blankslate.Description>
        </Blankslate>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {topLevel.map((p, i) => {
            const title = p.title || 'Untitled'
            return (
              <li
                key={p.id}
                style={{
                  borderTop: i === 0 ? undefined : 'var(--borderWidth-thin) solid var(--borderColor-muted)',
                }}
              >
                <Stack
                  direction="horizontal"
                  align="center"
                  gap="condensed"
                  style={{ padding: 'var(--base-size-8) 0', minHeight: 'var(--control-medium-size)' }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 'var(--base-size-16)',
                      display: 'inline-flex',
                      justifyContent: 'center',
                      color: 'var(--fgColor-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {p.icon ? p.icon : <FileIcon />}
                  </span>
                  <Stack direction="horizontal" align="baseline" gap="condensed" style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      weight="semibold"
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {title}
                    </Text>
                    <Text size="small" style={{ color: 'var(--fgColor-muted)', whiteSpace: 'nowrap' }}>
                      Deleted {new Date(p.deletedAt ?? 0).toLocaleDateString()}
                    </Text>
                  </Stack>
                  <Stack direction="horizontal" gap="condensed">
                    <IconButton
                      icon={HistoryIcon}
                      aria-label={`Restore ${title}`}
                      variant="invisible"
                      size="small"
                      onClick={() => restorePage(p.id)}
                    />
                    <IconButton
                      icon={XIcon}
                      aria-label={`Permanently delete ${title}`}
                      variant="invisible"
                      size="small"
                      onClick={() => deletePage(p.id)}
                    />
                  </Stack>
                </Stack>
              </li>
            )
          })}
        </ul>
      )}
    </Dialog>
  )
}
