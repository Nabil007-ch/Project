import { useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ArrowDownToLine, ArrowRight, BarChart3, Boxes, ChevronRight, CircleHelp, ClipboardList, Database, LayoutDashboard, Menu, PackageSearch, PanelLeftClose, Settings2, Sparkles, X } from 'lucide-react'
import { ThemeControl } from './components/ThemeProvider'

const navigation = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/recommendations', label: 'Recommendations', icon: ClipboardList },
  { to: '/evaluation', label: 'Evaluation', icon: BarChart3 },
  { to: '/settings', label: 'Settings & data', icon: Settings2 },
]
const pages: Record<string, { title: string; eyebrow: string; description: string; stage: string }> = {
  '/': { title: 'A clearer view of what’s next.', eyebrow: 'YOUR PURCHASING WORKSPACE', description: 'Make confident buying decisions, with the context behind every order.', stage: 'Dashboard arrives in stage 4' },
  '/recommendations': { title: 'Every order, with a reason.', eyebrow: 'RECOMMENDATIONS', description: 'Find what needs attention, compare suggested quantities, and plan your next order.', stage: 'Recommendations arrive in stage 4' },
  '/evaluation': { title: 'See how the approach compares.', eyebrow: 'EVALUATION', description: 'Compare purchasing outcomes and understand the trade-offs in your inventory.', stage: 'Evaluation arrives in stage 6' },
  '/settings': { title: 'Your data. A clear starting point.', eyebrow: 'SETTINGS & DATA SOURCE', description: 'Manage your workspace appearance and see how data will connect to OpsLens.', stage: 'Data-source controls arrive in stage 6' },
}

function WorkspacePage() {
  const { pathname } = useLocation()
  const page = pages[pathname]
  if (!page) return <section className="empty-card"><PackageSearch size={32} /><h1>Page not found</h1><p>This page isn’t part of your workspace.</p><Link className="button" to="/">Back to overview <ArrowRight size={16} /></Link></section>
  return <>
    <div className="page-heading"><div><div className="eyebrow">{page.eyebrow}</div><h1>{page.title}</h1><p>{page.description}</p></div><span className="group-label"><Boxes size={15} /> Beverages</span></div>
    <section className="welcome-panel" aria-labelledby="welcome-title">
      <div className="welcome-copy"><span className="section-tag"><Sparkles size={14} /> A LITTLE CLARITY GOES A LONG WAY</span><h2 id="welcome-title">The right stock.<br />At the right time.</h2><p>One place to understand demand, spot inventory risks, and decide what to order next.</p><div className="progress-caption"><span className="small-dot" /> Data foundation ready · Stage 2 of 7</div></div>
      <div className="flow-diagram" aria-label="OpsLens workflow: inventory data leads to demand insight and a clear buying decision"><div className="flow-node"><Database size={20} /><span>Your inventory<small>A shared starting point</small></span></div><div className="flow-line" /><div className="flow-node highlighted"><Sparkles size={20} /><span>A clearer picture<small>Demand, stock, and timing</small></span></div><div className="flow-line" /><div className="flow-node"><ClipboardList size={20} /><span>Your next move<small>A recommendation you can explain</small></span><ArrowRight size={17} /></div></div>
    </section>
    <div className="section-heading"><div><h2>A workspace built around your decisions</h2><p>From inventory questions to a confident purchasing plan.</p></div><span className="muted-label">ONE PRODUCT GROUP TO START</span></div>
    <div className="destination-grid">{[
      { icon: PackageSearch, number: '01', title: 'Know what needs attention', text: 'A focused overview of stock-out risks, excess stock, and your most urgent items.', to: '/', label: 'Overview', stage: 'Stage 4' },
      { icon: ClipboardList, number: '02', title: 'Understand what to order', text: 'Suggested quantities with a plain-language explanation of the numbers behind them.', to: '/recommendations', label: 'Recommendations', stage: 'Stages 4–5' },
      { icon: BarChart3, number: '03', title: 'See the bigger picture', text: 'Compare service and inventory outcomes before putting the approach into practice.', to: '/evaluation', label: 'Evaluation', stage: 'Stage 6' },
    ].map(card => <article className="destination-card" key={card.number}><div className="card-top"><span className="icon-tile"><card.icon size={21} /></span><span className="card-number">{card.number}</span></div><h3>{card.title}</h3><p>{card.text}</p><div className="card-bottom"><Link to={card.to}>{card.label}<ArrowRight size={15} /></Link><span>{card.stage}</span></div></article>)}</div>
    <section className="foundation-note" aria-label="Current build status"><div className="note-icon"><CircleHelp size={20} /></div><div><h3>{page.stage}</h3><p>The typed sample API now contains 60 beverage items. Charts and purchasing actions will connect to it in the next stages.</p></div></section>
    {pathname === '/settings' && <section className="settings-panel"><h2>Workspace appearance</h2><p>Follow your device’s theme or choose the look you prefer.</p><ThemeControl /></section>}
  </>
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const currentLabel = navigation.find(item => item.to === pathname)?.label ?? 'Page not found'
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a>
    {menuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Workspace sidebar">
      <Link to="/" className="brand" onClick={() => setMenuOpen(false)}><span className="brand-mark"><Boxes size={23} /></span>OpsLens<span className="brand-period">.</span></Link>
      <button className="mobile-close icon-button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X size={20} /></button>
      <div className="workspace-switch"><span className="workspace-avatar">ND</span><div>Northstar Distribution<small>Purchasing workspace</small></div></div>
      <div className="nav-heading">WORKSPACE</div>
      <nav aria-label="Main navigation">{navigation.map(item => <NavLink end={item.to === '/'} to={item.to} key={item.to} onClick={() => setMenuOpen(false)}><item.icon size={18} /><span>{item.label}</span><ChevronRight className="nav-chevron" size={14} /></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="sample-note"><span className="sample-note-icon"><Database size={18} /></span><h3>A safe place to explore</h3><p>This workspace uses sample data. Your live inventory is never affected.</p><span className="sample-pill">Sample data</span></div><ThemeControl /><div className="profile"><span className="profile-avatar">BY</span><div>Buyer workspace<small>OpsLens · Senior project</small></div><PanelLeftClose size={16} aria-hidden="true" /></div></div>
    </aside>
    <div className="main-column"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Menu size={21} /></button><span className="breadcrumb-parent">Workspace</span><ChevronRight size={14} /><span>{currentLabel}</span></div><div className="source-status"><span className="status-dot" /><span>Sample data</span><span className="source-divider" /><span className="source-caption">No live connection</span></div></header>
      <main id="main-content" tabIndex={-1}><Routes><Route path="*" element={<WorkspacePage />} /></Routes></main>
      <footer><span>OpsLens <span className="footer-separator">/</span> Purchasing intelligence, explained.</span><span className="footer-right"><ArrowDownToLine size={13} /> Frontend preview · Stage 2</span></footer>
    </div>
  </div>
}
