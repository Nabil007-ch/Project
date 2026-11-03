import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { Settings } from './Settings'
vi.mock('../../api', async () => {
  const { createMockClient } = await import('../../api/mock/client')
  return { api: createMockClient({ delayMs: 0, errorRate: 0 }) }
})
it('keeps GP disabled and reports an explicitly simulated connection test', async () => {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <Settings />
    </QueryClientProvider>,
  )
  await screen.findByText('Sample data is active')
  expect(screen.getByRole('radio', { name: /Microsoft Dynamics GP/ })).toBeDisabled()
  await userEvent.click(screen.getByRole('button', { name: 'Test connection' }))
  expect(await screen.findByRole('status')).toHaveTextContent(
    'No Dynamics GP connection was attempted',
  )
  await userEvent.click(screen.getByRole('radio', { name: /CSV upload preview/ }))
  expect(screen.getByLabelText('Choose CSV for local preview')).toBeInTheDocument()
  expect(screen.getByText('Sample data is active')).toBeInTheDocument()
})
