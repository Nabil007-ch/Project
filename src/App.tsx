import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ChevronRight,
  ClipboardList,
  Database,
  LayoutDashboard,
  Menu,
  PackageSearch,
  Settings2,
  X,
} from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
import { useDataSourceStatus } from './api/queries'
import { Button, LoadingState } from './components'
import { ThemeControl } from './components/ThemeProvider'

// Keep the shell fast to load; chart-heavy screens are loaded only when visited.
const Dashboard = lazy(() =>
  import('./features/dashboard/Dashboard').then((module) => ({ default: module.Dashboard })),
)
const Recommendations = lazy(() =>
  import('./features/recommendations/Recommendations').then((module) => ({
    default: module.Recommendations,
  })),
)
const ItemDetail = lazy(() =>
  import('./features/item-detail/ItemDetail').then((module) => ({ default: module.ItemDetail })),
)
const Evaluation = lazy(() =>
  import('./features/evaluation/Evaluation').then((module) => ({ default: module.Evaluation })),
)
const Settings = lazy(() =>
  import('./features/settings/Settings').then((module) => ({ default: module.Settings })),
)
const InterfacePreview = lazy(() =>
  import('./features/interface-preview/InterfacePreview').then((module) => ({
    default: module.InterfacePreview,
  })),
)
const navigation = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/recommendations', label: 'Recommendations', icon: ClipboardList },
  { to: '/evaluation', label: 'Evaluation', icon: BarChart3 },
  { to: '/settings', label: 'Settings & data', icon: Settings2 },
]
function SourceStatus() {
  const source = useDataSourceStatus()
  if (source.isPending)
    return (
      <span role="status" className="source-status">
        Checking sample source…
      </span>
    )
  if (source.isError)
    return (
      <div role="alert" className="source-status">
        Source unavailable
        <Button variant="ghost" onClick={() => void source.refetch()}>
          Retry
        </Button>
      </div>
    )
  return (
    <div className="source-status">
      <span className="status-dot" />
      <span>{source.data?.label ?? 'No source selected'}</span>
      <span className="source-divider" />
      <span className="source-caption">No live connection</span>
    </div>
  )
}
function NotFound() {
  return (
    <section className="empty-card">
      <PackageSearch size={32} />
      <h1>Page not found</h1>
      <p>This page isn’t part of your workspace.</p>
      <Link className="button" to="/">
        Back to overview <ArrowRight size={16} />
      </Link>
    </section>
  )
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobile, setMobile] = useState(
    () => window.matchMedia?.('(max-width: 700px)').matches ?? false,
  )
  const sidebar = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const main = useRef<HTMLElement>(null)
  const restoreMenuFocus = useRef(false)
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  const modal = mobile && menuOpen
  const currentLabel =
    navigation.find((item) => item.to === pathname)?.label ??
    (pathname.startsWith('/items/')
      ? 'Item detail'
      : pathname === '/ui'
        ? 'Interface preview'
        : 'Page not found')

  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 700px)')
    const update = () => {
      setMobile(media?.matches ?? false)
      if (!media?.matches) setMenuOpen(false)
    }
    media?.addEventListener('change', update)
    return () => media?.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    document.title = `${currentLabel} · OpsLens`
    if (previousPath.current !== pathname) main.current?.focus()
    previousPath.current = pathname
  }, [pathname, currentLabel])
  useEffect(() => {
    if (!modal) {
      if (restoreMenuFocus.current) {
        menuButton.current?.focus()
        restoreMenuFocus.current = false
      }
      return
    }
    closeButton.current?.focus()
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        restoreMenuFocus.current = true
        setMenuOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [
        ...(sidebar.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), select',
        ) ?? []),
      ]
      const first = focusable[0],
        last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = oldOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [modal])
  const closeMenu = () => {
    restoreMenuFocus.current = true
    setMenuOpen(false)
  }
  return (
    <div className="app-shell">
      <Analytics />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {modal && (
        <button
          tabIndex={-1}
          className="sidebar-backdrop"
          aria-label="Close navigation overlay"
          onClick={closeMenu}
        />
      )}
      <aside
        ref={sidebar}
        id="workspace-navigation"
        className={`sidebar ${menuOpen ? 'is-open' : ''}`}
        role={modal ? 'dialog' : undefined}
        aria-modal={modal || undefined}
        aria-label="Workspace navigation"
      >
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">
            <Boxes size={23} />
          </span>
          OpsLens<span className="brand-period">.</span>
        </Link>
        <button
          ref={closeButton}
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={closeMenu}
        >
          <X size={20} />
        </button>
        <div className="workspace-switch">
          <span className="workspace-avatar">ND</span>
          <div>
            Northstar Distribution<small>Sample purchasing workspace</small>
          </div>
        </div>
        <div className="nav-heading">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              end={item.to === '/'}
              to={item.to}
              key={item.to}
              onClick={() => setMenuOpen(false)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              <ChevronRight className="nav-chevron" size={14} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sample-note">
            <span className="sample-note-icon">
              <Database size={18} />
            </span>
            <h3>A safe place to explore</h3>
            <p>This workspace uses sample data. Your live inventory is never affected.</p>
            <span className="sample-pill">Sample data</span>
          </div>
          <ThemeControl />
          <div className="profile">
            <span className="profile-avatar">BY</span>
            <div>
              Buyer workspace<small>OpsLens · Senior project</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-column" inert={modal || undefined}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              ref={menuButton}
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              aria-controls="workspace-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb-parent">Workspace</span>
            <ChevronRight size={14} />
            <span>{currentLabel}</span>
          </div>
          <SourceStatus />
        </header>
        <main ref={main} id="main-content" tabIndex={-1}>
          <Suspense fallback={<LoadingState label="Opening this screen" />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="/evaluation" element={<Evaluation />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/ui" element={<InterfacePreview />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <footer>
          <span>
            OpsLens <span className="footer-separator">/</span> Purchasing intelligence, explained.
          </span>
          <span>Sample data · Frontend prototype</span>
        </footer>
      </div>
    </div>
  )
}
