'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, FileText, MoreHorizontal, Plus, Star, StarOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useWorkspace } from '@/lib/workspace-store'

export function PageTree({ currentPageId }: { currentPageId: string }) {
  const { rootPages, favorites } = useWorkspace()
  return <div className="page-tree flex flex-col gap-4" aria-label="Workspace pages"><section><div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Favorites</div>{favorites.length ? favorites.map(p => <PageTreeItem key={`fav-${p.id}`} page={p} currentPageId={currentPageId} flat />) : <p className="px-2 text-xs text-muted-foreground">No favorites yet</p>}</section><section><div className="mb-1 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><span>Private</span><NewPageButton /></div>{rootPages.length ? rootPages.map(p => <PageTreeItem key={p.id} page={p} currentPageId={currentPageId} />) : <p className="px-2 text-xs text-muted-foreground">No pages yet.</p>}</section></div>
}

function NewPageButton() { const router = useRouter(); const { createPage } = useWorkspace(); return <Button variant="ghost" size="icon" className="size-6" aria-label="Add a page" onClick={() => router.push(`/p/${createPage(null)}`)}><Plus className="size-3.5" /></Button> }

function PageTreeItem({ page, currentPageId, flat }: { page: any; currentPageId: string; flat?: boolean }) {
  const router = useRouter(); const { childrenOf, breadcrumbsFor, createPage, updatePage, trashPage } = useWorkspace(); const children = flat ? [] : childrenOf(page.id); const current = page.id === currentPageId; const contains = !flat && breadcrumbsFor(currentPageId).some((b) => b.id === page.id); const name = page.title || 'Untitled'
  const actions = <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-slot="tree-action" className="size-7 shrink-0" aria-label={`Actions for ${name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem onClick={() => updatePage(page.id, { favorite: !page.favorite })}>{page.favorite ? <StarOff data-icon="inline-start" /> : <Star data-icon="inline-start" />} {page.favorite ? 'Remove favorite' : 'Add favorite'}</DropdownMenuItem><DropdownMenuItem onClick={() => router.push(`/p/${createPage(page.id)}`)}><Plus data-icon="inline-start" /> Add sub-page</DropdownMenuItem><DropdownMenuItem onClick={() => { trashPage(page.id); if (current || contains) router.push('/p/getting-started') }}><Trash2 data-icon="inline-start" /> Move to trash</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
  const row = <div className={`group flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent ${current ? 'bg-accent font-medium' : ''}`}><button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => router.push(`/p/${page.id}`)}><FileText className="size-4 shrink-0 text-muted-foreground" /><span className="shrink-0">{page.icon || '📄'}</span><span className="truncate">{name}</span></button>{actions}</div>
  if (!children.length) return row
  return <Collapsible defaultOpen={contains || current}><div>{<CollapsibleTrigger asChild><div className="flex items-center"> <ChevronRight className="size-3 shrink-0 text-muted-foreground transition-transform data-[state=open]:rotate-90" />{row}</div></CollapsibleTrigger>}<CollapsibleContent className="ml-4 border-l pl-1">{children.map((c: any) => <PageTreeItem key={c.id} page={c} currentPageId={currentPageId} />)}</CollapsibleContent></div></Collapsible>
}
