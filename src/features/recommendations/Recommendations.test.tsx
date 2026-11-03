import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { Recommendations } from './Recommendations'
import { toCsv } from '../../lib/csv'

vi.mock('../../api', async () => {
  const { createMockClient } = await import('../../api/mock/client')
  return { api: createMockClient({ delayMs: 0, errorRate: 0 }) }
})
it('filters by SKU, selects the resulting row, and exports its real sample values', async () => {
  const user = userEvent.setup()
  const createUrl = vi.fn().mockReturnValue('blob:test')
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = createUrl
      static revokeObjectURL = vi.fn()
    },
  )
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <Recommendations />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await screen.findByText('BEV-1001')
  expect(screen.getByRole('button', { name: 'Export selected' })).toBeDisabled()
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search items' }), {
    target: { value: 'BEV-1001' },
  })
  await waitFor(() => expect(screen.getByText('1 matching items · 0 selected')).toBeInTheDocument())
  await user.click(screen.getByRole('checkbox', { name: 'Select all visible rows' }))
  await user.click(screen.getByRole('button', { name: 'Export selected' }))
  expect(createUrl).toHaveBeenCalledOnce()
  expect(click).toHaveBeenCalledOnce()
  expect(screen.getByRole('status')).toHaveTextContent('Exported 1 sample recommendations')
  click.mockRestore()
  vi.unstubAllGlobals()
})
it('quotes CSV delimiters and neutralizes spreadsheet formulas', () => {
  expect(toCsv([['=HYPERLINK("bad")', 'juice, tea', 12]])).toBe(
    '\uFEFF"\'=HYPERLINK(""bad"")","juice, tea","12"',
  )
})
it('recovers from a failed recommendation request using Retry', async () => {
  const { api } = await import('../../api')
  const failure = vi
    .spyOn(api, 'getRecommendations')
    .mockRejectedValueOnce(new Error('Interrupted'))
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <Recommendations />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await screen.findByRole('alert')
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('BEV-1001')).toBeInTheDocument()
  failure.mockRestore()
})
