import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { ThemeProvider } from './components/ThemeProvider'
const mount = (path = '/') => render(<ThemeProvider><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></ThemeProvider>)
beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
})
it('navigates and marks the current destination', () => {
  mount()
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'Recommendations' }))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Every order, with a reason.')
  expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'Recommendations' })).toHaveAttribute('aria-current', 'page')
})
it('follows system theme and persists manual appearance', () => {
  mount()
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  fireEvent.change(screen.getByLabelText('Appearance'), { target: { value: 'light' } })
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  expect(localStorage.getItem('opslens-theme')).toBe('light')
})
it('closes mobile navigation after selecting a route', () => {
  mount()
  const toggle = screen.getByRole('button', { name: 'Open navigation' })
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'Settings & data' }))
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your data.')
})
it('offers recovery for an unknown route', () => {
  mount('/missing')
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to overview' })).toHaveAttribute('href', '/')
})
