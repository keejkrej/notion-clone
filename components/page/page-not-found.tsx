'use client'

import { useRouter } from 'next/navigation'
import { FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useWorkspace } from '@/lib/workspace-store'

export function PageNotFound({ pageId, trashed }: { pageId: string; trashed: boolean }) {
  const router = useRouter(); const { restorePage, setTrashOpen, createPage } = useWorkspace()
  return <main className="flex flex-1 items-center justify-center p-6"><Card className="w-full max-w-lg"><CardContent className="flex flex-col items-center gap-4 p-8 text-center"><div className="grid size-12 place-items-center rounded-full bg-muted">{trashed ? <Trash2 className="size-6 text-muted-foreground" /> : <FileText className="size-6 text-muted-foreground" />}</div><h1 className="text-xl font-semibold">{trashed ? 'This page is in the trash' : 'Page not found'}</h1><p className="text-sm text-muted-foreground">{trashed ? 'Restore it to keep editing, or open the trash to permanently delete it.' : 'The page you are looking for does not exist or was permanently deleted.'}</p><div className="flex gap-2"><Button onClick={() => { if (trashed) restorePage(pageId); else { const id = createPage(null); router.push(`/p/${id}`) } }}>{trashed ? 'Restore page' : 'Create a new page'}</Button><Button variant="ghost" onClick={() => trashed ? setTrashOpen(true) : router.push('/p/getting-started')}>{trashed ? 'Open trash' : 'Back to Getting started'}</Button></div></CardContent></Card></main>
}
