import { useState } from 'react'
import { Check, Download } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  ChartFrame,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
  StockBadge,
  Tooltip,
  UrgencyBadge,
} from '../../components'

const rows = [
  { id: 'focus', name: 'Keyboard focus', state: 'Visible outlines' },
  { id: 'labels', name: 'Risk indicators', state: 'Icon and label' },
  { id: 'theme', name: 'Appearance', state: 'Light, dark, or system' },
]
export function InterfacePreview() {
  const [selected, setSelected] = useState(new Set<string>())
  const [retry, setRetry] = useState(false)
  return (
    <>
      <PageHeading
        eyebrow="INTERFACE PREVIEW"
        title="One consistent language."
        description="Shared building blocks for every purchasing decision. These examples contain no inventory records."
        action={<Badge label="Component preview" />}
      />
      <div className="ui-demo-grid">
        <Card title="Actions" description="Clear primary and secondary choices.">
          <div className="ui-demo-row">
            <Button icon={<Check size={16} />}>Primary action</Button>
            <Button variant="secondary" icon={<Download size={16} />}>
              Secondary
            </Button>
            <Button disabled>Unavailable</Button>
            <Button busy>Working</Button>
          </div>
        </Card>
        <Card
          title="States you can read"
          description="Risk is always paired with a label and an icon."
        >
          <div className="ui-demo-stack">
            <div className="ui-demo-row">
              <StockBadge state="at-risk" />
              <StockBadge state="healthy" />
              <StockBadge state="overstock" />
            </div>
            <div className="ui-demo-row">
              <UrgencyBadge urgency="urgent" />
              <UrgencyBadge urgency="soon" />
              <UrgencyBadge urgency="none" />
            </div>
          </div>
        </Card>
        <Card title="Loading">
          <LoadingState label="Loading preview" />
        </Card>
        <Card title="Helpful context">
          <div className="ui-demo-row">
            Service level
            <Tooltip term="service level">
              The target chance of meeting demand during a supplier’s lead time without running out.
              A higher target usually means keeping more safety stock.
            </Tooltip>
          </div>
          <p className="ui-demo-caption">
            Focus, hover, or tap the help icon. Press Escape to dismiss.
          </p>
        </Card>
        <Card title="Nothing to show yet">
          <EmptyState
            title="No matching items"
            description="Try another search or clear the filters to see more items."
            action={<Button variant="secondary">Clear filters</Button>}
          />
        </Card>
        <Card title="A clear path to retry">
          {retry ? (
            <div className="ui-state" role="status">
              <Check size={27} />
              <h3>Retry action received</h3>
              <p>This preview exercises the action without making a network request.</p>
              <Button variant="ghost" onClick={() => setRetry(false)}>
                Show error again
              </Button>
            </div>
          ) : (
            <ErrorState onRetry={() => setRetry(true)} />
          )}
        </Card>
        <Card
          title="Tables that work with a keyboard"
          description={`${selected.size} selected. Sort by either heading or select visible rows.`}
          className="ui-demo-full"
        >
          <DataTable
            caption="Interface checklist — not inventory data"
            rows={rows}
            columns={[
              {
                id: 'name',
                label: 'Component',
                render: (row) => row.name,
                sortValue: (row) => row.name,
              },
              {
                id: 'state',
                label: 'Behavior',
                render: (row) => row.state,
                sortValue: (row) => row.state,
              },
            ]}
            rowKey={(row) => row.id}
            rowLabel={(row) => row.name}
            selection={{ selectedIds: selected, onChange: setSelected }}
          />
        </Card>
      </div>
      <ChartFrame
        title="Charts with context"
        summary="Every chart will include a short explanation and a data-table alternative. No purchasing data is plotted in this component preview."
        dataTable={<p className="ui-demo-caption">There are no plotted records in this preview.</p>}
      >
        <div className="ui-demo-placeholder">Chart area · ready for the sample-data screens</div>
      </ChartFrame>
    </>
  )
}
