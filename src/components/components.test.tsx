import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { useState } from 'react'
import { Button, DataTable, QueryState, StockBadge, Tooltip } from './index'

it('disables a busy action without losing its accessible name', async () => {
  const action = vi.fn()
  render(
    <Button busy onClick={action}>
      Export selected
    </Button>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Export selected' }))
  expect(action).not.toHaveBeenCalled()
  expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
})
it('opens help on keyboard focus and dismisses it with Escape', async () => {
  const user = userEvent.setup()
  render(<Tooltip term="service level">Your target chance of avoiding a stock-out.</Tooltip>)
  await user.tab()
  expect(screen.getByRole('tooltip')).toHaveTextContent('Your target chance')
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
})
it('sorts numeric values and maintains partial/all visible selection', async () => {
  const user = userEvent.setup()
  function Table() {
    const [ids, setIds] = useState(new Set<string>())
    return (
      <DataTable
        caption="Test items"
        rows={[
          { id: 'a', value: 100 },
          { id: 'b', value: 9 },
        ]}
        rowKey={(row) => row.id}
        rowLabel={(row) => row.id}
        columns={[
          {
            id: 'value',
            label: 'Units',
            render: (row) => row.value,
            sortValue: (row) => row.value,
            numeric: true,
          },
        ]}
        selection={{ selectedIds: ids, onChange: setIds }}
      />
    )
  }
  render(<Table />)
  await user.click(screen.getByRole('button', { name: 'Units' }))
  expect(within(screen.getAllByRole('row')[1]).getByText('9')).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Units' })).toHaveAttribute(
    'aria-sort',
    'ascending',
  )
  await user.click(screen.getByRole('checkbox', { name: 'Select a' }))
  expect(screen.getByRole('checkbox', { name: 'Select all visible rows' })).toBePartiallyChecked()
  await user.click(screen.getByRole('checkbox', { name: 'Select all visible rows' }))
  expect(screen.getAllByRole('checkbox').every((box) => (box as HTMLInputElement).checked)).toBe(
    true,
  )
  await user.click(screen.getByRole('checkbox', { name: 'Select all visible rows' }))
  expect(screen.getAllByRole('checkbox').every((box) => !(box as HTMLInputElement).checked)).toBe(
    true,
  )
})
it('provides a real retry action and distinct loading, empty, and success states', async () => {
  const retry = vi.fn()
  const view = render(
    <QueryState loading error empty onRetry={retry}>
      Results
    </QueryState>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('Loading your workspace')
  view.rerender(
    <QueryState loading={false} error empty onRetry={retry}>
      Results
    </QueryState>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(retry).toHaveBeenCalledOnce()
  view.rerender(
    <QueryState loading={false} error={false} empty onRetry={retry}>
      Results
    </QueryState>,
  )
  expect(screen.getByText('No matching items')).toBeInTheDocument()
  view.rerender(
    <QueryState loading={false} error={false} empty={false} onRetry={retry}>
      Results
    </QueryState>,
  )
  expect(screen.getByText('Results')).toBeInTheDocument()
})
it('labels risk without relying on its color', () => {
  render(<StockBadge state="at-risk" />)
  expect(screen.getByText('Stock-out risk')).toBeInTheDocument()
})
