import { describe, expect, it, vi } from 'vitest'
import { generateDataset } from './generate'
import { createMockClient } from './client'
import { recommend } from './recommendation'
import { simulateBacktest } from './backtest'
import { serviceLevels } from '../client'

const dataset = generateDataset()
describe('seeded sample contract', () => {
  it('reproduces 60 unique items with intermittent histories and three stock states', () => {
    expect(generateDataset()).toEqual(dataset)
    expect(generateDataset(42)).not.toEqual(dataset)
    expect(new Set(dataset.map(row => row.item.id)).size).toBe(60)
    expect(new Set(dataset.map(row => row.item.name)).size).toBe(60)
    expect(new Set(dataset.map(row => row.recommendation.urgency))).toEqual(new Set(['urgent', 'soon', 'none']))
    expect(new Set(dataset.map(row => row.item.stock.state))).toEqual(new Set(['at-risk', 'healthy', 'overstock']))
    for (const row of dataset) {
      expect(row.history).toHaveLength(112)
      expect(row.history.some(point => point.units === 0)).toBe(true)
      expect(row.history.some(point => point.units > 0)).toBe(true)
      expect(row.forecast.daily).toHaveLength(28)
      expect(row.forecast.daily[0].date).toBe('2026-11-03')
    }
  })
  it('keeps all ranges ordered and lead-time demand consistent with daily forecasts', () => {
    for (const { forecast } of dataset) {
      for (const point of [...forecast.daily, forecast.leadTime]) {
        expect(point.p10).toBeGreaterThanOrEqual(0)
        expect(point.p10).toBeLessThanOrEqual(point.p50)
        expect(point.p50).toBeLessThanOrEqual(point.p90)
      }
      expect(forecast.leadTime.expected).toBe(forecast.daily.slice(0, forecast.leadTime.days).reduce((sum, point) => sum + point.p50, 0))
    }
  })
  it('orders the exact pack-rounded shortfall and uses identical explanation inputs', () => {
    for (const { item, forecast, recommendation: r } of dataset) {
      const e = r.explanation
      expect(e.inventoryPosition).toBe(item.stock.onHand + item.stock.onOrder - item.stock.allocated)
      expect(e.targetStock).toBe(forecast.leadTime.expected + e.safetyStock)
      expect(e.targetStock).toBe(item.stock.reorderPoint)
      expect(e.shortfall).toBe(Math.max(0, e.targetStock - e.inventoryPosition))
      expect(r.quantity).toBe(Math.ceil(e.shortfall / item.packSize) * item.packSize)
      expect(e.roundingUnits).toBe(r.quantity - e.shortfall)
      expect(e.roundingUnits).toBeLessThan(item.packSize)
      expect(e.likelyRange).toEqual({ low: forecast.leadTime.p10, high: forecast.leadTime.p90 })
      expect(e.detail).toContain(`ordering ${r.quantity} units`)
      expect(r.quantity === 0).toBe(r.urgency === 'none')
    }
  })
  it('matches a hand-worked order including allocations and pending deliveries', () => {
    const forecast = structuredClone(dataset[0].forecast)
    forecast.leadTime = { days: 14, expected: 85, p10: 59, p50: 85, p90: 111, standardDeviation: 20 }
    const result = recommend({ itemId: 'example', forecast, serviceLevel: 95, stock: { onHand: 20, onOrder: 12, allocated: 2 }, packSize: 12 })
    expect(result.explanation).toMatchObject({ safetyStock: 33, targetStock: 118, inventoryPosition: 30, shortfall: 88, roundingUnits: 8 })
    expect(result.quantity).toBe(96)
  })
  it('never reduces the suggested quantity as the service target increases', () => {
    for (const { item, forecast } of dataset) {
      const quantities = serviceLevels.map(serviceLevel => recommend({ itemId: item.id, forecast, serviceLevel, stock: item.stock, packSize: item.packSize }).quantity)
      expect(quantities).toEqual([...quantities].sort((a, b) => a - b))
    }
  })
})
describe('mock API', () => {
  const create = () => createMockClient({ delayMs: 0, errorRate: 0 })
  it('filters items and recommendations and returns empty lists for no matches', async () => {
    const api = create()
    const items = await api.getItems({ supplierId: 'sup-01', state: 'at-risk' })
    expect(items.length).toBeGreaterThan(0)
    expect(items.every(item => item.supplierId === 'sup-01' && item.stock.state === 'at-risk')).toBe(true)
    expect(await api.getItems({ search: 'no-such-beverage' })).toEqual([])
    expect(await api.getItems({ search: ' bev-1001 ' })).toHaveLength(1)
    const rows = await api.getRecommendations({ urgency: 'urgent', supplierId: 'sup-01' })
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every(row => row.recommendation.urgency === 'urgent' && row.supplier.id === 'sup-01')).toBe(true)
  })
  it('returns copies and preserves updated targets across all relevant endpoints', async () => {
    const api = create()
    const id = dataset[0].item.id
    const original = await api.getItemDetail(id)
    original.item.stock.onHand = 99999
    expect((await api.getItemDetail(id)).item.stock.onHand).not.toBe(99999)
    const updated = await api.updateServiceLevel(id, 99)
    expect(updated.item.serviceLevel).toBe(99)
    expect(updated.recommendation.serviceLevel).toBe(99)
    expect((await api.getItems({ search: updated.item.sku }))[0]).toEqual(updated.item)
    expect((await api.getRecommendations({ search: updated.item.sku }))[0].recommendation).toEqual(updated.recommendation)
    expect(updated.recommendation.quantity).toBeGreaterThanOrEqual(dataset[0].recommendation.quantity)
    expect((await create().getItemDetail(id)).item.serviceLevel).toBe(95)
  })
  it('returns typed not-found and validation errors', async () => {
    const api = create()
    await expect(api.getItemDetail('missing')).rejects.toMatchObject({ status: 404, code: 'ITEM_NOT_FOUND' })
    // Exercise runtime validation for untyped callers or future external inputs.
    await expect(api.updateServiceLevel('bev-001', 70 as 95)).rejects.toMatchObject({ status: 400, code: 'INVALID_SERVICE_LEVEL' })
  })
  it('can force read and mutation failures for error-state testing', async () => {
    const api = createMockClient({ delayMs: 0, errorRate: 1 })
    await expect(api.getItems()).rejects.toMatchObject({ status: 503, code: 'SIMULATED_FAILURE' })
    await expect(api.updateServiceLevel('bev-001', 99)).rejects.toMatchObject({ code: 'SIMULATED_FAILURE' })
  })
  it('waits for simulated latency before resolving', async () => {
    vi.useFakeTimers()
    try {
      const api = createMockClient({ delayMs: 250, errorRate: 0 })
      let resolved = false
      const request = api.getItems().then(items => { resolved = true; return items })
      await vi.advanceTimersByTimeAsync(249)
      expect(resolved).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      expect(await request).toHaveLength(60)
    } finally { vi.useRealTimers() }
  })
  it('reports an explicitly simulated data source and connection result', async () => {
    const api = create()
    expect(await api.getSuppliers()).toHaveLength(5)
    expect(await api.getDataSourceStatus()).toMatchObject({ source: 'sample', itemCount: 60, readOnly: true })
    expect(await api.testConnection()).toMatchObject({ success: true, simulated: true })
  })
  it('replays the same held-out period with bounded metrics and explicit definitions', async () => {
    const report = await create().getBacktestResults()
    expect(report).toEqual(simulateBacktest(dataset))
    expect(report).toMatchObject({ source: 'sample-simulation', itemCount: 60, dayCount: 56, startDate: dataset[0].history[56].date, endDate: '2026-11-02' })
    expect(report.results).toHaveLength(3)
    for (const result of report.results) {
      expect(result.stockoutDays).toBeGreaterThanOrEqual(0)
      expect(result.stockoutDays).toBeLessThanOrEqual(60 * 56)
      expect(result.inventoryCost).toBeGreaterThanOrEqual(0)
      expect(result.serviceLevel).toBeGreaterThanOrEqual(0)
      expect(result.serviceLevel).toBeLessThanOrEqual(100)
      expect(result.forecastRangeCoverage).toBeGreaterThanOrEqual(0)
      expect(result.forecastRangeCoverage).toBeLessThanOrEqual(100)
    }
    expect(report.results[0].forecastRangeCoverage).toBe(report.results[2].forecastRangeCoverage)
  })
})
