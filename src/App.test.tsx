import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { ThemeProvider } from './components/ThemeProvider'
const mount = (path = '/') =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ThemeProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  )
beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  )
})
it('navigates and marks the current destination', async () => {
  mount()
  fireEvent.click(
    within(screen.getByRole('navigation')).getByRole('link', { name: 'Recommendations' }),
  )
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Every order, with a reason.' }),
  ).toBeInTheDocument()
  expect(
    within(screen.getByRole('navigation')).getByRole('link', { name: 'Recommendations' }),
  ).toHaveAttribute('aria-current', 'page')
})
it('follows system theme and persists manual appearance', () => {
  mount()
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  fireEvent.change(screen.getByLabelText('Appearance'), { target: { value: 'light' } })
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  expect(localStorage.getItem('opslens-theme')).toBe('light')
})
it('closes mobile navigation after selecting a route', async () => {
  mount()
  const toggle = screen.getByRole('button', { name: 'Open navigation' })
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  fireEvent.click(
    within(screen.getByRole('navigation')).getByRole('link', { name: 'Settings & data' }),
  )
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Your data. A clear starting point.' }),
  ).toBeInTheDocument()
})
it('offers recovery for an unknown route', () => {
  mount('/missing')
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to overview' })).toHaveAttribute('href', '/')
})
it('returns focus to the menu button after dismissing the mobile drawer', () => {
  mount()
  const toggle = screen.getByRole('button', { name: 'Open navigation' })
  fireEvent.click(toggle)
  expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveFocus()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(toggle).toHaveFocus()
})
