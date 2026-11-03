import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { EmptyState } from './States'

export interface Column<T> {
  id: string
  label: string
  render: (row: T) => ReactNode
  /** Omit to make the column non-sortable. Sorting always uses raw values. */
  sortValue?: (row: T) => string | number
  numeric?: boolean
}
interface DataTableProps<T> {
  caption: string
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  rowLabel: (row: T) => string
  selection?: { selectedIds: ReadonlySet<string>; onChange: (ids: Set<string>) => void }
  onRowClick?: (row: T) => void
  emptyAction?: ReactNode
}
function SelectAll({
  checked,
  mixed,
  onChange,
  label,
}: {
  checked: boolean
  mixed: boolean
  onChange: () => void
  label: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed
  }, [mixed])
  return (
    <input ref={ref} type="checkbox" checked={checked} aria-label={label} onChange={onChange} />
  )
}
export function DataTable<T>({
  caption,
  rows,
  columns,
  rowKey,
  rowLabel,
  selection,
  emptyAction,
  onRowClick,
}: DataTableProps<T>) {
  const id = useId()
  const [sort, setSort] = useState<{ id: string; direction: 'ascending' | 'descending' } | null>(
    null,
  )
  const sorted = useMemo(() => {
    const column = columns.find((column) => column.id === sort?.id)
    const value = column?.sortValue
    if (!sort || !value) return rows
    return [...rows].sort((a, b) => {
      const left = value(a),
        right = value(b)
      const comparison =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right))
      return sort.direction === 'ascending' ? comparison : -comparison
    })
  }, [rows, columns, sort])
  if (!rows.length) return <EmptyState action={emptyAction} />
  const selectedCount = rows.filter((row) => selection?.selectedIds.has(rowKey(row))).length
  const toggleAll = () => {
    if (!selection) return
    const next = new Set(selection.selectedIds)
    rows.forEach((row) =>
      selectedCount === rows.length ? next.delete(rowKey(row)) : next.add(rowKey(row)),
    )
    selection.onChange(next)
  }
  return (
    <div role="region" aria-labelledby={id} tabIndex={0} className="ui-table-scroll">
      <table className="ui-table">
        <caption id={id}>{caption}</caption>
        <thead>
          <tr>
            {selection && (
              <th scope="col" className="ui-table-check">
                <SelectAll
                  checked={selectedCount === rows.length}
                  mixed={selectedCount > 0 && selectedCount < rows.length}
                  onChange={toggleAll}
                  label="Select all visible rows"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                scope="col"
                key={column.id}
                className={column.numeric ? 'is-numeric' : ''}
                aria-sort={
                  column.sortValue ? (sort?.id === column.id ? sort.direction : 'none') : undefined
                }
              >
                {column.sortValue ? (
                  <button
                    type="button"
                    className="ui-sort"
                    onClick={() =>
                      setSort({
                        id: column.id,
                        direction:
                          sort?.id === column.id && sort.direction === 'ascending'
                            ? 'descending'
                            : 'ascending',
                      })
                    }
                  >
                    {column.label}
                    {sort?.id !== column.id ? (
                      <ArrowUpDown size={13} aria-hidden="true" />
                    ) : sort.direction === 'ascending' ? (
                      <ArrowUp size={13} aria-hidden="true" />
                    ) : (
                      <ArrowDown size={13} aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? 'is-clickable' : undefined}
              onClick={(event) => {
                // The row is a pointer convenience. Its item link remains the keyboard action.
                if (
                  onRowClick &&
                  !(event.target as HTMLElement).closest('a,button,input,select,label')
                )
                  onRowClick(row)
              }}
              data-selected={selection?.selectedIds.has(rowKey(row)) || undefined}
            >
              {selection && (
                <td className="ui-table-check">
                  <input
                    type="checkbox"
                    aria-label={`Select ${rowLabel(row)}`}
                    checked={selection.selectedIds.has(rowKey(row))}
                    onChange={() => {
                      const next = new Set(selection.selectedIds)
                      if (next.has(rowKey(row))) next.delete(rowKey(row))
                      else next.add(rowKey(row))
                      selection.onChange(next)
                    }}
                  />
                </td>
              )}
              {columns.map((column) => (
                <td key={column.id} className={column.numeric ? 'is-numeric' : ''}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
