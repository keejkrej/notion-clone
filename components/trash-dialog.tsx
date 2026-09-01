'use client'

import { ActionList, Button, IconButton, Stack, Text } from '@primer/react'
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
        <div style={{ margin: 'calc(-1 * var(--base-size-8)) calc(-1 * var(--base-size-16))' }}>
          <ActionList variant="full" showDividers>
            {topLevel.map((p) => (
              <ActionList.Item key={p.id} onSelect={() => restorePage(p.id)}>
                <ActionList.LeadingVisual>
                  {p.icon ? <span aria-hidden>{p.icon}</span> : <FileIcon />}
                </ActionList.LeadingVisual>
                {p.title || 'Untitled'}
                <ActionList.Description variant="inline">
                  Deleted {new Date(p.deletedAt ?? 0).toLocaleDateString()}
                </ActionList.Description>
                <ActionList.TrailingVisual>
                  <Stack direction="horizontal" gap="condensed">
                    <IconButton
                      icon={HistoryIcon}
                      aria-label={`Restore ${p.title || 'Untitled'}`}
                      variant="invisible"
                      size="small"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        restorePage(p.id)
                      }}
                    />
                    <IconButton
                      icon={XIcon}
                      aria-label={`Permanently delete ${p.title || 'Untitled'}`}
                      variant="invisible"
                      size="small"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        deletePage(p.id)
                      }}
                    />
                  </Stack>
                </ActionList.TrailingVisual>
              </ActionList.Item>
            ))}
          </ActionList>
        </div>
      )}
    </Dialog>
  )
}
