import { useId, type ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import { Card } from './Card'

/** Charts must include a plain-language summary AND an equivalent data table. */
export function ChartFrame({
  title,
  summary,
  children,
  dataTable,
}: {
  title: string
  summary: string
  children: ReactNode
  dataTable: ReactNode
}) {
  const id = useId()
  return (
    <Card title={title}>
      <figure aria-describedby={id} className="ui-chart-figure">
        <figcaption id={id}>{summary}</figcaption>
        <div className="ui-chart-visual">{children}</div>
      </figure>
      <details className="ui-chart-details">
        <summary>View chart data as a table</summary>
        {dataTable}
      </details>
    </Card>
  )
}
export function ChartContainer({ children }: { children: ReactNode }) {
  return (
    <ResponsiveContainer width="100%" height={280} minWidth={0}>
      {children}
    </ResponsiveContainer>
  )
}
