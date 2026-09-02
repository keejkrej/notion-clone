import { FileText, Table2 } from 'lucide-react'
import { isDatabase, type Page } from '@/lib/types'

export function PageKindIcon({ page }: { page: Page }) {
  if (page.icon) {
    return (
      <span className="grid size-4 shrink-0 place-items-center text-sm leading-none" aria-hidden>
        {page.icon}
      </span>
    )
  }
  if (isDatabase(page)) {
    return <Table2 className="size-4 shrink-0 text-muted-foreground" />
  }
  return <FileText className="size-4 shrink-0 text-muted-foreground" />
}
