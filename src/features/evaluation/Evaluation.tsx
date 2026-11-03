import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip } from 'recharts'
import { FlaskConical } from 'lucide-react'
import { useBacktestResults } from '../../api/queries'
import {
  Badge,
  Card,
  ChartContainer,
  ChartFrame,
  DataTable,
  PageHeading,
  QueryState,
} from '../../components'
import { money, number, shortDate } from '../../lib/format'

export function Evaluation() {
  const query = useBacktestResults()
  const report = query.data
  const chartRows =
    report?.results.map((result) => ({
      ...result,
      name:
        result.method === 'opslens'
          ? 'OpsLens'
          : result.method === 'seasonal-naive'
            ? 'Weekly naive'
            : 'Reorder rule',
    })) ?? []
  return (
    <>
      <PageHeading
        eyebrow="EVALUATION"
        title="See how the approach compares."
        description="Explore the balance between stock availability and holding cost on the same sample demand."
        action={<Badge label="Sample simulation" />}
      />
      <QueryState
        loading={query.isPending}
        error={query.isError}
        empty={!report?.results.length}
        onRetry={() => void query.refetch()}
      >
        {report && (
          <>
            <div className="evaluation-context">
              <span className="icon-tile">
                <FlaskConical size={22} />
              </span>
              <div>
                <h2>A shared test, three buying rules</h2>
                <p>
                  {report.itemCount} sample items · {report.dayCount} held-out days ·{' '}
                  {shortDate(report.startDate)}–{shortDate(report.endDate)}, 2026
                </p>
              </div>
              <Badge label="Illustrative results" tone="healthy" />
            </div>
            <Card
              title="The results, side by side"
              description="Lower stock-out days and holding cost are preferable. Higher service is preferable; coverage should be near the nominal 80% band."
            >
              <DataTable
                caption="Simulated inventory-policy comparison · not real model performance"
                rows={report.results}
                rowKey={(row) => row.method}
                rowLabel={(row) => row.label}
                columns={[
                  {
                    id: 'method',
                    label: 'Approach',
                    render: (row) => (
                      <strong className={row.method === 'opslens' ? 'accent-text' : ''}>
                        {row.label}
                      </strong>
                    ),
                  },
                  {
                    id: 'stockout',
                    label: 'Stock-out item-days ↓',
                    render: (row) => number(row.stockoutDays),
                    numeric: true,
                    sortValue: (row) => row.stockoutDays,
                  },
                  {
                    id: 'cost',
                    label: 'Holding cost ↓',
                    render: (row) => money(row.inventoryCost),
                    numeric: true,
                    sortValue: (row) => row.inventoryCost,
                  },
                  {
                    id: 'service',
                    label: 'Unit fill rate ↑',
                    render: (row) => `${row.serviceLevel}%`,
                    numeric: true,
                    sortValue: (row) => row.serviceLevel,
                  },
                  {
                    id: 'coverage',
                    label: 'Range coverage',
                    render: (row) => `${row.forecastRangeCoverage}%`,
                    numeric: true,
                    sortValue: (row) => row.forecastRangeCoverage,
                  },
                ]}
              />
            </Card>
            <div className="evaluation-charts">
              {[
                {
                  key: 'serviceLevel' as const,
                  title: 'Availability at a glance',
                  summary:
                    'Share of requested units fulfilled immediately in the replay. This is a measured sample fill rate, not the cycle-service target used for item planning.',
                  axis: 'Fill rate (%)',
                  max: 100,
                  color: 'var(--accent)',
                },
                {
                  key: 'inventoryCost' as const,
                  title: 'The cost of the buffer',
                  summary:
                    'Holding cost in USD over the same 56-day replay. A larger buffer can improve availability while increasing carrying cost.',
                  axis: 'Holding cost (USD)',
                  max: undefined,
                  color: 'var(--overstock)',
                },
              ].map((chart) => (
                <ChartFrame
                  key={chart.key}
                  title={chart.title}
                  summary={chart.summary}
                  dataTable={
                    <DataTable
                      caption={chart.axis}
                      rows={chartRows}
                      rowKey={(row) => row.method}
                      rowLabel={(row) => row.name}
                      columns={[
                        { id: 'name', label: 'Approach', render: (row) => row.name },
                        {
                          id: 'value',
                          label: chart.axis,
                          render: (row) =>
                            chart.key === 'serviceLevel'
                              ? `${row[chart.key]}%`
                              : money(row[chart.key]),
                          numeric: true,
                        },
                      ]}
                    />
                  }
                >
                  <ChartContainer>
                    <BarChart data={chartRows} margin={{ top: 10, right: 10, left: -15 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'var(--muted)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, chart.max ?? 'auto']}
                        tick={{ fill: 'var(--muted)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ChartTooltip
                        contentStyle={{
                          background: 'var(--surface)',
                          color: 'var(--text)',
                          borderColor: 'var(--border)',
                          borderRadius: 8,
                        }}
                      />
                      <Bar
                        dataKey={chart.key}
                        name={chart.axis}
                        fill={chart.color}
                        radius={[5, 5, 0, 0]}
                        maxBarSize={64}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ChartContainer>
                </ChartFrame>
              ))}
            </div>
            <Card title="How to read this" description="A clearer result needs a clear definition.">
              <dl className="metric-definitions">
                <div>
                  <dt>Stock-out item-days</dt>
                  <dd>{report.definitions.stockoutDays}</dd>
                </div>
                <div>
                  <dt>Holding cost</dt>
                  <dd>{report.definitions.inventoryCost}</dd>
                </div>
                <div>
                  <dt>Service level / unit fill rate</dt>
                  <dd>{report.definitions.serviceLevel}</dd>
                </div>
                <div>
                  <dt>Forecast range coverage</dt>
                  <dd>{report.definitions.forecastRangeCoverage}</dd>
                </div>
              </dl>
              <p className="evaluation-caveat">{report.note}</p>
            </Card>
          </>
        )}
      </QueryState>
    </>
  )
}
