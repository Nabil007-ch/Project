import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip } from 'recharts'
import { AlertTriangle, ArrowRight, CalendarDays, PackagePlus, ShieldCheck } from 'lucide-react'
import { useRecommendations } from '../../api/queries'
import {
  Badge,
  Card,
  ChartContainer,
  ChartFrame,
  DataTable,
  PageHeading,
  QueryState,
  Tooltip,
  UrgencyBadge,
} from '../../components'
import { money, number } from '../../lib/format'

export function Dashboard() {
  const query = useRecommendations()
  const rows = query.data ?? []
  const atRisk = rows.filter((row) => row.item.stock.state === 'at-risk')
  const overstockValue = rows
    .filter((row) => row.item.stock.state === 'overstock')
    .reduce(
      (sum, { item }) =>
        sum +
        Math.max(0, item.stock.onHand - item.stock.allocated - item.stock.reorderPoint) *
          item.unitCost,
      0,
    )
  const planned = rows.length
    ? rows.reduce((sum, row) => sum + row.item.serviceLevel, 0) / rows.length
    : 0
  const recommended = rows.filter((row) => row.recommendation.quantity > 0)
  const priority = [...recommended]
    .sort((a, b) => a.item.stock.daysOfCover - b.item.stock.daysOfCover)
    .slice(0, 5)
  const risk = [1, 2, 3, 4].map((week) => ({
    week: `Week ${week}`,
    count: rows.filter(
      ({ item, forecast }) => item.stock.inventoryPosition < forecast.daily[0].p50 * 7 * week,
    ).length,
  }))
  return (
    <>
      <PageHeading
        eyebrow="PURCHASING OVERVIEW"
        title="A clearer view of what’s next."
        description="A focused look at your beverage inventory and the orders worth reviewing."
        action={<Badge label="Sample data · 60 items" />}
      />
      <QueryState
        loading={query.isPending}
        error={query.isError}
        empty={!rows.length}
        onRetry={() => void query.refetch()}
      >
        <div className="kpi-grid">
          {[
            {
              label: 'Items at risk',
              value: number(atRisk.length),
              note: 'On hand below lead-time demand',
              icon: AlertTriangle,
              tone: 'risk',
            },
            {
              label: 'Overstock value',
              value: money(overstockValue),
              note: 'Excess on-hand value above target',
              icon: PackagePlus,
              tone: 'overstock',
            },
            {
              label: 'Planned service level',
              value: `${number(planned)}%`,
              note: 'Average item target; not a projection',
              icon: ShieldCheck,
              tone: 'healthy',
            },
            {
              label: 'Orders to review',
              value: number(recommended.length),
              note: 'Suggested this planning cycle',
              icon: CalendarDays,
              tone: 'neutral',
            },
          ].map((metric) => (
            <section key={metric.label} className={`kpi-card kpi-card--${metric.tone}`}>
              <div className="kpi-label">
                {metric.label}
                <metric.icon size={17} aria-hidden="true" />
              </div>
              <strong>{metric.value}</strong>
              <p>{metric.note}</p>
            </section>
          ))}
        </div>
        <div className="planning-banner">
          <div>
            <Badge label="This week’s focus" tone="healthy" />
            <h2>{atRisk.length} items need a closer look.</h2>
            <p>
              Start with the shortest stock coverage. Every suggested order includes the numbers
              behind it.
            </p>
          </div>
          <Link className="button" to="/recommendations">
            Review recommendations <ArrowRight size={17} />
          </Link>
        </div>
        <div className="dashboard-grid">
          <Card
            title="Your priority list"
            description="Suggested orders, ranked by available days of stock."
            action={
              <Link className="text-link" to="/recommendations">
                View all <ArrowRight size={14} />
              </Link>
            }
          >
            <div className="priority-list">
              {priority.map(({ item, recommendation }) => (
                <Link key={item.id} to={`/items/${item.id}`} className="priority-item">
                  <div className="priority-icon">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="priority-copy">
                    <strong>{item.name}</strong>
                    <span>
                      {item.sku} · {number(item.stock.daysOfCover)} days of stock
                    </span>
                  </div>
                  <div className="priority-quantity">
                    <strong>{number(recommendation.quantity)} units</strong>
                    <UrgencyBadge urgency={recommendation.urgency} />
                  </div>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </Card>
          <ChartFrame
            title="Stock pressure ahead"
            summary="Cumulative items whose inventory position falls below expected demand by each week, if no new orders are placed. Open orders are included in inventory position; timing is simplified."
            dataTable={
              <DataTable
                caption="Illustrative stock pressure, not a calibrated stock-out probability"
                rows={risk}
                rowKey={(row) => row.week}
                rowLabel={(row) => row.week}
                columns={[
                  { id: 'week', label: 'Horizon', render: (row) => row.week },
                  {
                    id: 'count',
                    label: 'Items below demand',
                    render: (row) => row.count,
                    numeric: true,
                  },
                ]}
              />
            }
          >
            <ChartContainer>
              <AreaChart data={risk} margin={{ left: -25, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="risk-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: 'var(--muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'var(--muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 60]}
                />
                <ChartTooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    borderColor: 'var(--border)',
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Items"
                  stroke="var(--accent)"
                  fill="url(#risk-fill)"
                  strokeWidth={2.5}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          </ChartFrame>
        </div>
        <p className="sample-footnote">
          Sample planning estimates, not real model output.{' '}
          <span>
            Service level
            <Tooltip term="service level">
              An item’s target chance of covering demand during lead time. Planned service here is
              the average configured target, not a measured or predicted outcome.
            </Tooltip>
          </span>
        </p>
      </QueryState>
    </>
  )
}
