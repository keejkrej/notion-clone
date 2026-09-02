import type {
  DatabaseSchema,
  DatabaseView,
  Filter,
  Page,
  PropertyDef,
  PropertyType,
  Sort,
} from './types'

export function opsForPropertyType(type: PropertyType): Filter['op'][] {
  switch (type) {
    case 'checkbox':
      return ['checked', 'unchecked']
    case 'multi_select':
      return ['contains', 'is_empty', 'is_not_empty']
    case 'title':
    case 'text':
    case 'url':
      return ['equals', 'contains', 'is_empty', 'is_not_empty']
    case 'number':
    case 'date':
    case 'select':
    case 'status':
      return ['equals', 'is_empty', 'is_not_empty']
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function filterOpLabel(op: Filter['op']): string {
  switch (op) {
    case 'equals':
      return 'Equals'
    case 'contains':
      return 'Contains'
    case 'is_empty':
      return 'Is empty'
    case 'is_not_empty':
      return 'Is not empty'
    case 'checked':
      return 'Checked'
    case 'unchecked':
      return 'Unchecked'
    default: {
      const _exhaustive: never = op
      return _exhaustive
    }
  }
}

export function filterNeedsValue(op: Filter['op']): boolean {
  return op === 'equals' || op === 'contains'
}

function optionName(def: PropertyDef, id: string | null | undefined): string {
  if (!id) return ''
  return def.options?.find((o) => o.id === id)?.name ?? ''
}

function optionIndex(def: PropertyDef, id: string | null | undefined): number {
  if (!id) return Number.POSITIVE_INFINITY
  const i = (def.options ?? []).findIndex((o) => o.id === id)
  return i < 0 ? Number.POSITIVE_INFINITY : i
}

export function propertySearchText(page: Page, def: PropertyDef): string {
  if (def.type === 'title') return page.title
  const v = page.properties?.[def.id]
  if (!v) return ''
  switch (v.type) {
    case 'title':
      return page.title
    case 'text':
    case 'url':
      return v.value
    case 'number':
      return v.value == null ? '' : String(v.value)
    case 'date':
      return v.value ?? ''
    case 'checkbox':
      return v.value ? 'true' : 'false'
    case 'select':
    case 'status':
      return optionName(def, v.optionId)
    case 'multi_select':
      return v.optionIds.map((id) => optionName(def, id)).join(' ')
    default: {
      const _exhaustive: never = v
      return _exhaustive
    }
  }
}

function isEmptyValue(page: Page, def: PropertyDef): boolean {
  if (def.type === 'title') return !page.title.trim()
  const v = page.properties?.[def.id]
  if (!v) return true
  switch (v.type) {
    case 'title':
      return !page.title.trim()
    case 'text':
    case 'url':
      return !v.value.trim()
    case 'number':
      return v.value === null
    case 'date':
      return !v.value
    case 'checkbox':
      return !v.value
    case 'select':
    case 'status':
      return !v.optionId
    case 'multi_select':
      return v.optionIds.length === 0
    default: {
      const _exhaustive: never = v
      return _exhaustive
    }
  }
}

function isChecked(page: Page, def: PropertyDef): boolean {
  const v = page.properties?.[def.id]
  return v?.type === 'checkbox' && v.value
}

function optionIdOf(page: Page, def: PropertyDef): string | null {
  const v = page.properties?.[def.id]
  if (v?.type === 'select' || v?.type === 'status') return v.optionId
  return null
}

function optionIdsOf(page: Page, def: PropertyDef): string[] {
  const v = page.properties?.[def.id]
  return v?.type === 'multi_select' ? v.optionIds : []
}

export function matchesFilter(page: Page, filter: Filter, schema: DatabaseSchema): boolean {
  const def = schema.properties.find((p) => p.id === filter.propertyId)
  if (!def) return true
  const needle = (filter.value ?? '').trim()
  switch (filter.op) {
    case 'is_empty':
      return isEmptyValue(page, def)
    case 'is_not_empty':
      return !isEmptyValue(page, def)
    case 'checked':
      return isChecked(page, def)
    case 'unchecked':
      return !isChecked(page, def)
    case 'contains':
      if (def.type === 'multi_select') return optionIdsOf(page, def).includes(filter.value ?? '')
      return propertySearchText(page, def).toLowerCase().includes(needle.toLowerCase())
    case 'equals':
      if (def.type === 'select' || def.type === 'status') return optionIdOf(page, def) === (filter.value || null)
      if (def.type === 'number') {
        const v = page.properties?.[def.id]
        if (v?.type !== 'number' || v.value === null || needle === '') return false
        const n = Number(needle)
        return !Number.isNaN(n) && v.value === n
      }
      if (def.type === 'date') {
        const v = page.properties?.[def.id]
        return v?.type === 'date' && (v.value ?? '') === needle
      }
      if (def.type === 'checkbox') return needle === 'true' ? isChecked(page, def) : !isChecked(page, def)
      return propertySearchText(page, def).toLowerCase() === needle.toLowerCase()
    default: {
      const _exhaustive: never = filter.op
      return _exhaustive
    }
  }
}

export function matchesSearch(page: Page, query: string, schema: DatabaseSchema): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  if (page.title.toLowerCase().includes(needle)) return true
  if (page.icon?.toLowerCase().includes(needle)) return true
  for (const def of schema.properties) {
    if (propertySearchText(page, def).toLowerCase().includes(needle)) return true
  }
  return false
}

type SortKey = { empty: boolean; n: number; s: string }

function sortKey(page: Page, def: PropertyDef): SortKey {
  if (def.type === 'title') {
    const s = page.title.trim()
    return { empty: !s, n: 0, s }
  }
  const v = page.properties?.[def.id]
  if (!v || v.type === 'title') return { empty: true, n: 0, s: '' }
  switch (v.type) {
    case 'text':
    case 'url':
      return { empty: !v.value.trim(), n: 0, s: v.value }
    case 'number':
      return { empty: v.value === null, n: v.value ?? 0, s: '' }
    case 'date':
      return { empty: !v.value, n: 0, s: v.value ?? '' }
    case 'checkbox':
      return { empty: false, n: v.value ? 1 : 0, s: '' }
    case 'select':
    case 'status':
      return { empty: !v.optionId, n: optionIndex(def, v.optionId), s: optionName(def, v.optionId) }
    case 'multi_select':
      return {
        empty: v.optionIds.length === 0,
        n: optionIndex(def, v.optionIds[0] ?? null),
        s: v.optionIds.map((id) => optionName(def, id)).join(', '),
      }
    default: {
      const _exhaustive: never = v
      return _exhaustive
    }
  }
}

function compareKeys(a: SortKey, b: SortKey, direction: Sort['direction']): number {
  if (a.empty && b.empty) return 0
  if (a.empty) return 1
  if (b.empty) return -1
  const byNum = a.n - b.n
  const byStr = a.s.localeCompare(b.s, undefined, { numeric: true, sensitivity: 'base' })
  const cmp = byNum !== 0 ? byNum : byStr
  return direction === 'desc' ? -cmp : cmp
}

export function applySorts(rows: Page[], sorts: Sort[], schema: DatabaseSchema): Page[] {
  if (!sorts.length) return rows
  const defs = new Map(schema.properties.map((p) => [p.id, p]))
  return [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const def = defs.get(sort.propertyId)
      if (!def) continue
      const cmp = compareKeys(sortKey(a, def), sortKey(b, def), sort.direction)
      if (cmp !== 0) return cmp
    }
    return 0
  })
}

export function queryRows(
  rows: Page[],
  schema: DatabaseSchema,
  view: DatabaseView,
  search: string,
): Page[] {
  const filtered = rows.filter(
    (row) => matchesSearch(row, search, schema) && view.filters.every((f) => matchesFilter(row, f, schema)),
  )
  return applySorts(filtered, view.sorts, schema)
}

export interface BoardColumn {
  key: string | null
  label: string
  color?: string
  rows: Page[]
}

export function groupRows(rows: Page[], groupBy: PropertyDef | undefined): BoardColumn[] {
  if (!groupBy || (groupBy.type !== 'select' && groupBy.type !== 'status')) {
    return [{ key: null, label: 'No status', rows }]
  }
  const buckets = new Map<string | null, Page[]>()
  for (const opt of groupBy.options ?? []) buckets.set(opt.id, [])
  buckets.set(null, [])
  for (const row of rows) {
    const id = optionIdOf(row, groupBy)
    const key = id && buckets.has(id) ? id : null
    buckets.get(key)!.push(row)
  }
  const cols: BoardColumn[] = (groupBy.options ?? []).map((opt) => ({
    key: opt.id,
    label: opt.name,
    color: opt.color,
    rows: buckets.get(opt.id) ?? [],
  }))
  cols.push({ key: null, label: 'No status', rows: buckets.get(null) ?? [] })
  return cols
}

export const ADDABLE_PROPERTY_TYPES: PropertyType[] = [
  'text',
  'number',
  'select',
  'multi_select',
  'status',
  'date',
  'checkbox',
  'url',
]
