import { Link, useParams } from 'react-router-dom'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
} from 'recharts'
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb } from 'lucide-react'
import { useItemDetail, useUpdateServiceLevel } from '../../api/queries'
import { serviceLevels } from '../../api/client'
import type { ServiceLevel } from '../../api/types'
import {
  Badge,
  Button,
  Card,
  ChartContainer,
  ChartFrame,
  DataTable,
  PageHeading,
  QueryState,
  StockBadge,
  Tooltip,
  UrgencyBadge,
} from '../../components'
import { money, number, shortDate } from '../../lib/format'

export function ItemDetail() {
  const { id = '' } = useParams()
  const query = useItemDetail(id)
  const mutation = useUpdateServiceLevel()
  const detail = query.data
  const chart = detail
    ? [
        ...detail.history.slice(-28).map((point) => ({
          date: point.date,
          actual: point.units,
          p50: undefined as number | undefined,
          band: undefined as [number, number] | undefined,
        })),
        ...detail.forecast.daily.map((point) => ({
          date: point.date,
          actual: undefined as number | undefined,
          p50: point.p50,
          band: [point.p10, point.p90] as [number, number],
        })),
      ]
    : []
  return (
    <>
      <Link className="text-link back-link" to="/recommendations">
        <ArrowLeft size={15} /> All recommendations
      </Link>
      <PageHeading
        eyebrow={detail ? `${detail.item.sku} · BEVERAGES` : 'ITEM DETAIL'}
        title={detail?.item.name ?? 'Your item, explained.'}
        description={
          detail
            ? `${detail.supplier.name} · All quantities in individual units`
            : 'Loading the context behind this recommendation.'
        }
        action={<Badge label="Sample data" />}
      />
      <QueryState
        loading={query.isPending}
        error={query.isError}
        empty={!detail}
        onRetry={() => void query.refetch()}
      >
        {detail && (
          <>
            <div className="item-summary">
              <StockBadge state={detail.item.stock.state} />
              <span>
                <strong>{number(detail.item.stock.onHand)}</strong> on hand
              </span>
              <span>
                <strong>{number(detail.item.stock.onOrder)}</strong> on order
              </span>
              <span>
                <strong>{number(detail.item.stock.allocated)}</strong> allocated
              </span>
              <span>
                <strong>{number(detail.item.stock.daysOfCover)}</strong> days of stock
              </span>
            </div>
            <div className="item-layout">
              <div className="item-main">
                <ChartFrame
                  title="Demand history & the range ahead"
                  summary="Daily units: the last 28 observed days and the next 28 illustrative forecast days. The shaded band is P10–P90; it is not a calibrated probability interval. Stock and reorder point are flat snapshot reference lines, not projected balances."
                  dataTable={
                    <DataTable
                      caption="Daily demand history and sample forecast (units)"
                      rows={chart}
                      rowKey={(row) => row.date}
                      rowLabel={(row) => row.date}
                      columns={[
                        { id: 'date', label: 'Date', render: (row) => shortDate(row.date) },
                        {
                          id: 'history',
                          label: 'Observed',
                          render: (row) => row.actual ?? '—',
                          numeric: true,
                        },
                        {
                          id: 'lower',
                          label: 'P10',
                          render: (row) => row.band?.[0] ?? '—',
                          numeric: true,
                        },
                        {
                          id: 'forecast',
                          label: 'P50 proxy',
                          render: (row) => row.p50 ?? '—',
                          numeric: true,
                        },
                        {
                          id: 'upper',
                          label: 'P90',
                          render: (row) => row.band?.[1] ?? '—',
                          numeric: true,
                        },
                      ]}
                    />
                  }
                >
                  <ChartContainer>
                    <ComposedChart data={chart} margin={{ left: -20, right: 18, top: 20 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={shortDate}
                        minTickGap={35}
                        tick={{ fill: 'var(--muted)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'var(--muted)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ChartTooltip
                        labelFormatter={(value) => shortDate(String(value))}
                        contentStyle={{
                          background: 'var(--surface)',
                          color: 'var(--text)',
                          borderColor: 'var(--border)',
                          borderRadius: 8,
                        }}
                      />
                      <Area
                        dataKey="band"
                        name="P10–P90 sample range"
                        fill="var(--accent)"
                        fillOpacity={0.15}
                        stroke="none"
                        isAnimationActive={false}
                      />
                      <Line
                        dataKey="actual"
                        name="Observed demand"
                        stroke="var(--text)"
                        strokeWidth={1.8}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        dataKey="p50"
                        name="P50 proxy"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        strokeDasharray="5 3"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <ReferenceLine
                        x={detail.history.at(-1)!.date}
                        stroke="var(--muted)"
                        strokeDasharray="3 3"
                      />
                      <ReferenceLine
                        y={detail.item.stock.onHand}
                        stroke="var(--overstock)"
                        strokeDasharray="7 4"
                        ifOverflow="extendDomain"
                      />
                      <ReferenceLine
                        y={detail.item.stock.reorderPoint}
                        stroke="var(--risk)"
                        strokeDasharray="3 3"
                        ifOverflow="extendDomain"
                      />
                    </ComposedChart>
                  </ChartContainer>
                  <ul className="chart-legend" aria-label="Chart legend">
                    <li>
                      <span className="legend-line observed" />
                      Observed daily demand
                    </li>
                    <li>
                      <span className="legend-line forecast" />
                      P50 proxy / shaded P10–P90
                    </li>
                    <li>
                      <span className="legend-line stock" />
                      On hand: {detail.item.stock.onHand}
                    </li>
                    <li>
                      <span className="legend-line target" />
                      Reorder point: {detail.item.stock.reorderPoint}
                    </li>
                  </ul>
                </ChartFrame>
                <section className="explanation-panel" aria-labelledby="explanation-title">
                  <div className="explanation-heading">
                    <span className="icon-tile">
                      <Lightbulb size={21} />
                    </span>
                    <div>
                      <div className="eyebrow">THE REASON BEHIND THE ORDER</div>
                      <h2 id="explanation-title">
                        {detail.recommendation.quantity
                          ? `Order ${number(detail.recommendation.quantity)} units`
                          : 'No new order needed'}
                      </h2>
                    </div>
                    <UrgencyBadge urgency={detail.recommendation.urgency} />
                  </div>
                  <p aria-live="polite">{detail.recommendation.explanation.detail}</p>
                  <div className="order-equation">
                    <span>
                      Target<strong>{detail.recommendation.explanation.targetStock}</strong>
                    </span>
                    <span>−</span>
                    <span>
                      Inventory position<strong>{detail.item.stock.inventoryPosition}</strong>
                    </span>
                    <span>
                      <ArrowRight size={16} />
                    </span>
                    <span>
                      Gap<strong>{detail.recommendation.explanation.shortfall}</strong>
                    </span>
                    <span>
                      <ArrowRight size={16} />
                    </span>
                    <span>
                      Pack-rounded order<strong>{detail.recommendation.quantity}</strong>
                    </span>
                  </div>
                </section>
              </div>
              <aside className="item-side" aria-label="Recommendation inputs">
                <Card
                  title="What this order uses"
                  description="A transparent view of the planning assumptions."
                >
                  <dl className="input-list">
                    <div>
                      <dt>Average lead time</dt>
                      <dd>{detail.supplier.leadTimeDays} days</dd>
                    </div>
                    <div>
                      <dt>
                        Lead-time variability
                        <Tooltip term="lead-time variability">
                          The standard deviation of supplier delivery time. More variation generally
                          calls for a larger stock buffer.
                        </Tooltip>
                      </dt>
                      <dd>{detail.supplier.leadTimeStdDevDays} days</dd>
                    </div>
                    <div>
                      <dt>
                        Service target
                        <Tooltip term="service level">
                          Target chance of covering demand during lead time. It is a planning input,
                          not a guarantee of fulfillment.
                        </Tooltip>
                      </dt>
                      <dd>{detail.item.serviceLevel}%</dd>
                    </div>
                    <div>
                      <dt>Annual holding rate</dt>
                      <dd>{detail.item.annualHoldingCostRate * 100}%</dd>
                    </div>
                    <div>
                      <dt>Unit cost</dt>
                      <dd>{money(detail.item.unitCost, 2)}</dd>
                    </div>
                    <div>
                      <dt>Supplier pack</dt>
                      <dd>{detail.item.packSize} units</dd>
                    </div>
                    <div>
                      <dt>Safety stock</dt>
                      <dd>{detail.recommendation.explanation.safetyStock} units</dd>
                    </div>
                  </dl>
                  <p className="input-note">
                    Holding cost provides context. This sample rule does not optimize cost.
                  </p>
                </Card>
                <Card
                  title="What if you changed the target?"
                  description="Compare the stock buffer and suggested quantity immediately."
                >
                  <label className="service-control">
                    Service target
                    <select
                      value={detail.item.serviceLevel}
                      disabled={mutation.isPending}
                      onChange={(e) =>
                        mutation.mutate({
                          id,
                          serviceLevel: Number(e.target.value) as ServiceLevel,
                        })
                      }
                    >
                      {serviceLevels.map((level) => (
                        <option value={level} key={level}>
                          {level}%
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="input-note">
                    Higher targets usually require more safety stock. Changes affect this sample
                    session only.
                  </p>
                  {mutation.isPending && (
                    <p role="status" className="input-note">
                      Preview shown · saving sample target…
                    </p>
                  )}
                  {mutation.isSuccess && (
                    <p role="status" className="saved-note">
                      <CheckCircle2 size={14} /> Sample target updated
                    </p>
                  )}
                  {mutation.isError && (
                    <div role="alert" className="inline-error">
                      The change couldn’t be saved; the previous target was restored.
                      <Button
                        variant="ghost"
                        onClick={() => mutation.variables && mutation.mutate(mutation.variables)}
                      >
                        Retry change
                      </Button>
                    </div>
                  )}
                </Card>
              </aside>
            </div>
            <p className="sample-footnote">
              Sample heuristics, not trained forecasts. The P50 proxy uses mean daily demand; ranges
              are illustrative. Open orders are assumed to arrive in time.
            </p>
          </>
        )}
      </QueryState>
    </>
  )
}
