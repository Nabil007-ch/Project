import { seededRandom } from '../../lib/random'
import type { DemandPoint, Forecast, ItemDetail, Supplier } from '../types'
import { recommend, stockPosition } from './recommendation'

export const SAMPLE_AS_OF = '2026-11-02'
export const SAMPLE_SEED = 27017
const DAY = 86_400_000
export function dateAt(offset: number) {
  return new Date(Date.parse(`${SAMPLE_AS_OF}T00:00:00Z`) + offset * DAY).toISOString().slice(0, 10)
}
export const suppliers: Supplier[] = [
  { id: 'sup-01', name: 'Cedar Beverage Co.', leadTimeDays: 7, leadTimeStdDevDays: 2 },
  { id: 'sup-02', name: 'Valley Springs', leadTimeDays: 14, leadTimeStdDevDays: 4 },
  { id: 'sup-03', name: 'Orchard Trade Partners', leadTimeDays: 21, leadTimeStdDevDays: 6 },
  { id: 'sup-04', name: 'Harbor Imports', leadTimeDays: 28, leadTimeStdDevDays: 8 },
  { id: 'sup-05', name: 'Summit Roasters', leadTimeDays: 10, leadTimeStdDevDays: 3 },
]
const products = [
  'Sparkling Water',
  'Still Mineral Water',
  'Apple Juice',
  'Orange Juice',
  'Lemon Iced Tea',
  'Peach Iced Tea',
  'Cola',
  'Ginger Ale',
  'Cold Brew Coffee',
  'Coconut Water',
  'Berry Seltzer',
  'Mango Nectar',
]
const formats = ['250 ml can', '330 ml can', '500 ml bottle', '750 ml bottle', '1 L carton']

export function generateDataset(seed = SAMPLE_SEED): ItemDetail[] {
  const random = seededRandom(seed)
  return Array.from({ length: 60 }, (_, index) => {
    const id = `bev-${String(index + 1).padStart(3, '0')}`
    const supplier = suppliers[index % suppliers.length]
    const saleProbability = 0.2 + random() * 0.65
    const saleSize = 7 + Math.floor(random() * 28)
    const history: DemandPoint[] = Array.from({ length: 112 }, (_, day) => ({
      date: dateAt(day - 111),
      units:
        random() < saleProbability
          ? Math.max(1, Math.round(saleSize * (0.4 + random()) * (day % 7 === 4 ? 1.3 : 1)))
          : 0,
    }))
    const mean = history.reduce((sum, point) => sum + point.units, 0) / history.length
    const variance =
      history.reduce((sum, point) => sum + (point.units - mean) ** 2, 0) / (history.length - 1)
    // A simple constant daily mean is a proxy for P50 in this demo; for intermittent
    // items it is NOT a calibrated median. The backend must replace these heuristics.
    const p50 = Math.max(1, Math.round(mean))
    const dailySpread = 1.281552 * Math.sqrt(variance)
    const expected = p50 * supplier.leadTimeDays
    // Independent daily demand and variable lead time: Var(D_L) ≈ L Var(D) + mean(D)^2 Var(L).
    const standardDeviation = Math.sqrt(
      supplier.leadTimeDays * variance + p50 ** 2 * supplier.leadTimeStdDevDays ** 2,
    )
    const forecast: Forecast = {
      itemId: id,
      method: 'sample-heuristic',
      daily: Array.from({ length: 28 }, (_, day) => ({
        date: dateAt(day + 1),
        p10: Math.max(0, Math.floor(p50 - dailySpread)),
        p50,
        p90: Math.ceil(p50 + dailySpread),
      })),
      leadTime: {
        days: supplier.leadTimeDays,
        expected,
        p50: expected,
        p10: Math.max(0, Math.floor(expected - 1.281552 * standardDeviation)),
        p90: Math.ceil(expected + 1.281552 * standardDeviation),
        standardDeviation,
      },
    }
    const packSize = [6, 12, 24][index % 3]
    const serviceLevel = 95 as const
    const emptyStock = { onHand: 0, onOrder: 0, allocated: 0 }
    const target = recommend({ itemId: id, forecast, serviceLevel, stock: emptyStock, packSize })
      .explanation.targetStock
    const allocated = Math.floor(random() * 12)
    const onOrder = index % 4 === 0 ? packSize * (1 + Math.floor(random() * 3)) : 0
    const category = index % 3
    const onHand =
      category === 0
        ? Math.floor(expected * (0.1 + random() * 0.5)) + allocated
        : category === 1
          ? Math.ceil(
              index % 2 ? expected + (target - expected) * 0.35 : target + random() * target * 0.35,
            ) + allocated
          : Math.ceil(target * (2.3 + random())) + allocated
    const inputs = {
      itemId: id,
      forecast,
      serviceLevel,
      stock: { onHand, onOrder, allocated },
      packSize,
    }
    return {
      item: {
        id,
        sku: `BEV-${1001 + index}`,
        name: `${products[index % products.length]} · ${formats[Math.floor(index / products.length)]}`,
        productGroupId: 'beverages',
        supplierId: supplier.id,
        unitCost: Math.round((0.65 + random() * 3.8) * 100) / 100,
        packSize,
        annualHoldingCostRate: 0.22,
        serviceLevel,
        stock: stockPosition(inputs),
      },
      supplier: { ...supplier },
      history,
      forecast,
      recommendation: recommend(inputs),
    }
  })
}
