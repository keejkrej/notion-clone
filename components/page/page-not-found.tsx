'use client'

import { useRouter } from 'next/navigation'
import { Button, Stack } from '@primer/react'
import { Blankslate } from '@primer/react/experimental'
import { FileIcon, TrashIcon } from '@primer/octicons-react'
import { useWorkspace } from '@/lib/workspace-store'

export function PageNotFound({ pageId, trashed }: { pageId: string; trashed: boolean }) {
  const router = useRouter()
  const { restorePage, setTrashOpen, createPage } = useWorkspace()

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--base-size-24)',
      }}
    >
      <div style={{ maxWidth: 480, width: '100%' }}>
        <Blankslate border spacious>
          <Blankslate.Visual>
            {trashed ? <TrashIcon size="medium" /> : <FileIcon size="medium" />}
          </Blankslate.Visual>
          <Blankslate.Heading>{trashed ? 'This page is in the trash' : 'Page not found'}</Blankslate.Heading>
          <Blankslate.Description>
            {trashed
              ? 'Restore it to keep editing, or open the trash to permanently delete it.'
              : 'The page you are looking for does not exist or was permanently deleted.'}
          </Blankslate.Description>
        </Blankslate>
        <Stack direction="horizontal" justify="center" gap="condensed" style={{ marginTop: 'var(--base-size-16)' }}>
          <Button
            variant="primary"
            onClick={() => {
              if (trashed) {
                restorePage(pageId)
              } else {
                const id = createPage(null)
                router.push(`/p/${id}`)
              }
            }}
          >
            {trashed ? 'Restore page' : 'Create a new page'}
          </Button>
          <Button
            variant="invisible"
            onClick={() => {
              if (trashed) setTrashOpen(true)
              else router.push('/p/getting-started')
            }}
          >
            {trashed ? 'Open trash' : 'Back to Getting started'}
          </Button>
        </Stack>
      </div>
    </div>
  )
}
