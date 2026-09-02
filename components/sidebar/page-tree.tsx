'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { PageKindIcon } from '@/components/page/page-kind-icon'
import { PageOptionsMenu } from '@/components/page/page-options-menu'
import type { Page } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/workspace-store'
import { NewPageMenu } from './new-page-menu'

export function PageTree({ currentPageId }: { currentPageId: string }) {
  const { rootPages, favorites } = useWorkspace()
  return (
    <div className="page-tree flex flex-col gap-5" aria-label="Workspace pages">
      <section>
        <div className="mb-1 px-2 text-xs font-medium text-muted-foreground">Favorites</div>
        {favorites.length ? (
          favorites.map((p) => (
            <PageTreeItem key={`fav-${p.id}`} page={p} currentPageId={currentPageId} flat />
          ))
        ) : (
          <p className="px-2 text-xs text-muted-foreground">No favorites yet</p>
        )}
      </section>
      <section>
        <div className="mb-1 flex items-center justify-between px-2 text-xs font-medium text-muted-foreground">
          <span>Private</span>
          <NewPageMenu variant="icon" />
        </div>
        {rootPages.length ? (
          rootPages.map((p) => <PageTreeItem key={p.id} page={p} currentPageId={currentPageId} />)
        ) : (
          <p className="px-2 text-xs text-muted-foreground">No pages yet.</p>
        )}
      </section>
    </div>
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
  const { childrenOf, breadcrumbsFor, createPage } = useWorkspace()
  const children = flat ? [] : childrenOf(page.id)
  const current = page.id === currentPageId
  const contains = !flat && breadcrumbsFor(currentPageId).some((b) => b.id === page.id)
  const name = page.title || 'Untitled'

  const row = (
    <div
      role="treeitem"
      aria-current={current ? 'page' : undefined}
      className={cn(
        'group flex min-w-0 items-center gap-0.5 rounded-md py-0.5 pr-0.5 pl-0.5 text-sm transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        current && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
      )}
    >
      {!flat ? (
        children.length ? (
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-muted-foreground hover:bg-transparent [&[data-state=open]_svg]:rotate-90"
              aria-label={`Toggle sub-pages of ${name}`}
            >
              <ChevronRight className="size-3.5 transition-transform" />
            </Button>
          </CollapsibleTrigger>
        ) : (
          <span className="size-6 shrink-0" aria-hidden />
        )
      ) : null}
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 px-1 text-left"
        onClick={() => router.push(`/p/${page.id}`)}
      >
        <PageKindIcon page={page} />
        <span className="truncate">{name}</span>
      </button>
      {!flat && (
        <Button
          variant="ghost"
          size="icon-xs"
          data-slot="tree-action"
          className="shrink-0 text-muted-foreground hover:bg-transparent"
          aria-label={`Add sub-page to ${name}`}
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/p/${createPage(page.id)}`)
          }}
        >
          <Plus />
        </Button>
      )}
      <PageOptionsMenu page={page} align="start" triggerClassName="size-6" treeAction />
    </div>
  )

  if (flat || !children.length) return row

  return (
    <Collapsible defaultOpen={contains || current}>
      {row}
      <CollapsibleContent className="ml-3 border-l border-sidebar-border pl-1">
        {children.map((c) => (
          <PageTreeItem key={c.id} page={c} currentPageId={currentPageId} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
