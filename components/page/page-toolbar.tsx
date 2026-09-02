'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, Star, StarOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Page } from '@/lib/types'
import { useWorkspace } from '@/lib/workspace-store'
import { PageOptionsMenu } from './page-options-menu'

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
  const { breadcrumbsFor, updatePage, sidebarOpen } = useWorkspace()
  const crumbs = breadcrumbsFor(page.id)

  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-12 items-center justify-between gap-4 bg-background/90 pr-4 backdrop-blur sm:pr-6',
        sidebarOpen ? 'pl-14 md:pl-6' : 'pl-14',
      )}
    >
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((c, i) => (
          <span key={c.id} className="flex min-w-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 min-w-0 px-2 ${i === crumbs.length - 1 ? 'font-medium text-foreground' : ''}`}
              onClick={() => router.push(`/p/${c.id}`)}
            >
              <span className="truncate">
                {c.icon ? `${c.icon} ` : ''}
                {c.title || 'Untitled'}
              </span>
            </Button>
            {i < crumbs.length - 1 && <ChevronRight className="size-3.5 shrink-0" />}
          </span>
        ))}
      </nav>
      <div className="flex shrink-0 items-center gap-1">
        <span className="hidden text-xs text-muted-foreground sm:inline">Edited {relativeTime(page.updatedAt)}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={page.favorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={() => updatePage(page.id, { favorite: !page.favorite })}
        >
          {page.favorite ? <Star className="size-4 fill-current" /> : <StarOff className="size-4" />}
        </Button>
        <PageOptionsMenu page={page} />
      </div>
    </header>
  )
}
