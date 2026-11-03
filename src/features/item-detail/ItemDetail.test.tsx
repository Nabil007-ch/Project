import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { ItemDetail } from './ItemDetail'

vi.mock('../../api', async () => {
  const { createMockClient } = await import('../../api/mock/client')
  return { api: createMockClient({ delayMs: 30, errorRate: 0 }) }
})
// Recharts measures its container in a real browser; test the screen's data and interactions here.
vi.mock('../../components/ChartFrame', () => ({
  ChartFrame: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <section aria-label={title}>{children}</section>
  ),
  ChartContainer: () => <div>Chart</div>,
}))
it('updates the order and explanation when the target changes', async () => {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/items/bev-001']}>
        <Routes>
          <Route path="/items/:id" element={<ItemDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await screen.findByRole('heading', { name: 'Sparkling Water · 250 ml can' })
  const original = screen.getByText(/Recommend ordering/).textContent
  fireEvent.change(screen.getByRole('combobox', { name: 'Service target' }), {
    target: { value: '99' },
  })
  await waitFor(() =>
    expect(screen.getByText(/Recommend ordering/)).toHaveTextContent('99% service target'),
  )
  expect(screen.getByText(/Recommend ordering/).textContent).not.toBe(original)
  await screen.findByText('Sample target updated')
})
it('restores the prior service target when saving a preview fails', async () => {
  const { api } = await import('../../api')
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/items/bev-002']}>
        <Routes>
          <Route path="/items/:id" element={<ItemDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await screen.findByRole('heading', { name: 'Still Mineral Water · 250 ml can' })
  const select = screen.getByRole('combobox', { name: 'Service target' }) as HTMLSelectElement
  const original = select.value
  const fail = vi
    .spyOn(api, 'updateServiceLevel')
    .mockRejectedValueOnce(new Error('Simulated interruption'))
  fireEvent.change(select, { target: { value: '99' } })
  await screen.findByRole('alert')
  expect(select.value).toBe(original)
  expect(screen.getByText(/Recommend ordering/)).toHaveTextContent(`${original}% service target`)
  fail.mockRestore()
})
