'use client'

import { useMemo, useState } from 'react'
import type { DatabaseView, Page } from '@/lib/types'
import { liveRowsOf } from '@/lib/types'
import { queryRows } from '@/lib/database-query'
import { useWorkspace } from '@/lib/workspace-store'
import { BoardView } from './board-view'
import { ListView } from './list-view'
import { TableView } from './table-view'
import { ViewToolbar } from './view-toolbar'

export function DatabaseViews({ page }: { page: Page }) {
  const { ws, addRow, addView, updateView } = useWorkspace()
  const [search, setSearch] = useState('')
  const schema = page.schema
  const view = schema?.views.find((v) => v.id === schema.defaultViewId) ?? schema?.views[0]

  const rows = useMemo(() => {
    if (!schema || !view) return []
    return queryRows(liveRowsOf(ws, page.id), schema, view, search)
  }, [ws, page.id, schema, view, search])

  if (!schema || !view) return null

  function onViewChange(viewId: string) {
    updateView(page.id, viewId, {}, true)
  }

  function onAddView(type: DatabaseView['type']) {
    const id = addView(page.id, type)
    updateView(page.id, id, {}, true)
  }

  function onNewRow() {
    addRow(page.id)
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 px-3 pb-24 pt-4 sm:px-6">
      <ViewToolbar
        databaseId={page.id}
        schema={schema}
        view={view}
        search={search}
        onSearch={setSearch}
        onViewChange={onViewChange}
        onAddView={onAddView}
        onNewRow={onNewRow}
      />
      {view.type === 'table' && (
        <TableView databaseId={page.id} schema={schema} rows={rows} onNewRow={onNewRow} />
      )}
      {view.type === 'board' && (
        <BoardView databaseId={page.id} schema={schema} view={view} rows={rows} />
      )}
      {view.type === 'list' && <ListView schema={schema} rows={rows} onNewRow={onNewRow} />}
    </div>
  )
}
