'use client'

import { FileText, History, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useWorkspace } from '@/lib/workspace-store'

export function TrashDialog() {
  const { trashOpen, setTrashOpen, trashedPages, restorePage, deletePage, emptyTrash, ws } = useWorkspace()
  const topLevel = trashedPages.filter((p) => !p.parentId || !ws.pages[p.parentId]?.deletedAt)
  return <Dialog open={trashOpen} onOpenChange={setTrashOpen}><DialogContent><DialogHeader><DialogTitle>Trash</DialogTitle><DialogDescription>Pages in the trash can be restored or permanently deleted.</DialogDescription></DialogHeader>{topLevel.length === 0 ? <Empty><EmptyHeader><EmptyMedia variant="icon"><Trash2 /></EmptyMedia><EmptyTitle>Trash is empty</EmptyTitle><EmptyDescription>Pages you move to the trash will show up here.</EmptyDescription></EmptyHeader></Empty> : <div className="flex flex-col">{topLevel.map((p, i) => <div key={p.id}>{i > 0 && <Separator />}<div className="flex items-center gap-3 py-3"><span className="text-muted-foreground">{p.icon ?? <FileText className="size-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.title || 'Untitled'}</p><p className="text-xs text-muted-foreground">Deleted {new Date(p.deletedAt ?? 0).toLocaleDateString()}</p></div><Button variant="ghost" size="icon" aria-label={`Restore ${p.title || 'Untitled'}`} onClick={() => restorePage(p.id)}><History /></Button><Button variant="ghost" size="icon" aria-label={`Permanently delete ${p.title || 'Untitled'}`} onClick={() => deletePage(p.id)}><X /></Button></div></div>)}</div>}<DialogFooter><Button variant="outline" onClick={() => setTrashOpen(false)}>Close</Button>{topLevel.length > 0 && <Button variant="destructive" onClick={() => { emptyTrash(); setTrashOpen(false) }}>Empty trash</Button>}</DialogFooter></DialogContent></Dialog>
}
