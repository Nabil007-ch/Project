import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download, Search } from 'lucide-react'
import { useRecommendations, useSuppliers } from '../../api/queries'
import type { RecommendationRow, Urgency } from '../../api/types'
import {
  Badge,
  Button,
  Card,
  DataTable,
  PageHeading,
  QueryState,
  Tooltip,
  UrgencyBadge,
  type Column,
} from '../../components'
import { number } from '../../lib/format'
import { downloadCsv } from '../../lib/csv'

const columns: Column<RecommendationRow>[] = [
  {
    id: 'item',
    label: 'Item',
    render: ({ item }) => (
      <Link to={`/items/${item.id}`} className="item-link">
        {item.name}
        <span>{item.sku}</span>
      </Link>
    ),
    sortValue: (row) => row.item.name,
  },
  {
    id: 'stock',
    label: 'On hand',
    render: (row) => number(row.item.stock.onHand),
    sortValue: (row) => row.item.stock.onHand,
    numeric: true,
  },
  {
    id: 'lead',
    label: 'Lead time',
    render: (row) => `${row.supplier.leadTimeDays} days`,
    sortValue: (row) => row.supplier.leadTimeDays,
  },
  {
    id: 'forecast',
    label: 'Lead-time demand',
    render: (row) => (
      <span className="table-value">
        {number(row.forecast.leadTime.expected)} units
        <small>
          {number(row.forecast.leadTime.p10)}–{number(row.forecast.leadTime.p90)} range
        </small>
      </span>
    ),
    sortValue: (row) => row.forecast.leadTime.expected,
    numeric: true,
  },
  {
    id: 'quantity',
    label: 'Order qty',
    render: (row) => <strong>{number(row.recommendation.quantity)}</strong>,
    sortValue: (row) => row.recommendation.quantity,
    numeric: true,
  },
  {
    id: 'urgency',
    label: 'Timing',
    render: (row) => <UrgencyBadge urgency={row.recommendation.urgency} />,
    sortValue: (row) => ({ urgent: 0, soon: 1, none: 2 })[row.recommendation.urgency],
  },
  {
    id: 'reason',
    label: 'Why this order',
    render: (row) => <span className="table-reason">{row.recommendation.explanation.summary}</span>,
  },
]
export function Recommendations() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [urgency, setUrgency] = useState<Urgency | ''>('')
  const [supplierId, setSupplier] = useState('')
  const [selected, setSelected] = useState(new Set<string>())
  const [exportMessage, setExportMessage] = useState('')
  const query = useRecommendations({
    search,
    urgency: urgency || undefined,
    supplierId: supplierId || undefined,
  })
  const suppliers = useSuppliers()
  const rows = query.data ?? []
  const selectedRows = rows.filter((row) => selected.has(row.item.id))
  const clearSelection = () => {
    setSelected(new Set())
    setExportMessage('')
  }
  const clearFilters = () => {
    setSearch('')
    setUrgency('')
    setSupplier('')
    clearSelection()
  }
  const exportSelected = () => {
    downloadCsv('opslens-sample-recommendations.csv', [
      [
        'Source',
        'SKU',
        'Item',
        'Supplier',
        'On hand',
        'On order',
        'Allocated',
        'Lead time (days)',
        'Expected lead-time demand',
        'P10',
        'P90',
        'Service target (%)',
        'Safety stock',
        'Pack size',
        'Order quantity',
        'Timing',
        'Reason',
      ],
      ...selectedRows.map(({ item, supplier, forecast, recommendation: rec }) => [
        'Sample data',
        item.sku,
        item.name,
        supplier.name,
        item.stock.onHand,
        item.stock.onOrder,
        item.stock.allocated,
        supplier.leadTimeDays,
        forecast.leadTime.expected,
        forecast.leadTime.p10,
        forecast.leadTime.p90,
        item.serviceLevel,
        rec.explanation.safetyStock,
        item.packSize,
        rec.quantity,
        rec.urgency,
        rec.explanation.summary,
      ]),
    ])
    setExportMessage(
      `Exported ${selectedRows.length} sample recommendations. No orders were placed.`,
    )
  }
  return (
    <>
      <PageHeading
        eyebrow="RECOMMENDATIONS"
        title="Every order, with a reason."
        description="Compare suggested quantities, understand the context, and make the final call."
        action={<Badge label="Sample data" />}
      />
      <Card
        title="Your buying plan"
        description="Select items to export a review list. Exporting never places an order."
      >
        <div className="filter-bar">
          <label className="search-field">
            <span className="sr-only">Search items</span>
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search item or SKU…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                clearSelection()
              }}
            />
          </label>
          <label className="filter-field">
            Timing
            <select
              value={urgency}
              onChange={(e) => {
                setUrgency(e.target.value as Urgency | '')
                clearSelection()
              }}
            >
              <option value="">All timing</option>
              <option value="urgent">Order now</option>
              <option value="soon">Order soon</option>
              <option value="none">No order needed</option>
            </select>
          </label>
          <label className="filter-field">
            Supplier
            <select
              value={supplierId}
              disabled={suppliers.isPending || suppliers.isError}
              onChange={(e) => {
                setSupplier(e.target.value)
                clearSelection()
              }}
            >
              <option value="">All suppliers</option>
              {suppliers.data?.map((supplier) => (
                <option value={supplier.id} key={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          <Button variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
        {suppliers.isError && (
          <div className="inline-error" role="alert">
            Supplier options couldn’t load.
            <Button variant="ghost" onClick={() => void suppliers.refetch()}>
              Retry suppliers
            </Button>
          </div>
        )}
        <div className="table-toolbar">
          <span>
            {rows.length} matching items · {selectedRows.length} selected
          </span>
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            disabled={!selectedRows.length || query.isFetching || query.isError}
            onClick={exportSelected}
          >
            Export selected
          </Button>
        </div>
        <QueryState
          loading={query.isPending}
          error={query.isError}
          empty={!rows.length}
          onRetry={() => void query.refetch()}
          emptyAction={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        >
          <DataTable
            caption="Beverages · suggested order quantities in individual units"
            rows={rows}
            columns={columns}
            rowKey={(row) => row.item.id}
            rowLabel={(row) => row.item.name}
            selection={{ selectedIds: selected, onChange: setSelected }}
            onRowClick={(row) => navigate(`/items/${row.item.id}`)}
          />
        </QueryState>
        <p role="status" className="export-message">
          {exportMessage}
        </p>
      </Card>
      <p className="sample-footnote">
        Sample recommendations, not real model output.{' '}
        <span>
          Forecast range
          <Tooltip term="forecast range">
            The illustrative P10–P90 band shows a lower and upper demand estimate. These sample
            ranges are not calibrated probabilities.
          </Tooltip>
        </span>
      </p>
    </>
  )
}
