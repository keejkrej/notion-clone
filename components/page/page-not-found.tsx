'use client'

import { useRouter } from 'next/navigation'
import { FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useWorkspace } from '@/lib/workspace-store'

export function PageNotFound({ pageId, trashed }: { pageId: string; trashed: boolean }) {
  const router = useRouter()
  const { restorePage, setTrashOpen, createPage } = useWorkspace()
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Empty className="max-w-md border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {trashed ? <Trash2 /> : <FileText />}
          </EmptyMedia>
          <EmptyTitle>{trashed ? 'This page is in the trash' : 'Page not found'}</EmptyTitle>
          <EmptyDescription>
            {trashed
              ? 'Restore it to keep editing, or open the trash to permanently delete it.'
              : 'The page you are looking for does not exist or was permanently deleted.'}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={() => {
                if (trashed) restorePage(pageId)
                else {
                  const id = createPage(null)
                  router.push(`/p/${id}`)
                }
              }}
            >
              {trashed ? 'Restore page' : 'Create a new page'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => (trashed ? setTrashOpen(true) : router.push('/p/getting-started'))}
            >
              {trashed ? 'Open trash' : 'Back to Getting started'}
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </main>
  )
}
