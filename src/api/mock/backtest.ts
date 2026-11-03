import type { BacktestResult, BacktestResults, ItemDetail } from '../types'
import { seededRandom } from '../../lib/random'

/** A reproducible toy inventory replay. It is not evidence of real model accuracy. */
export function simulateBacktest(dataset: ItemDetail[]): BacktestResults {
  const methods: BacktestResult['method'][] = ['opslens', 'seasonal-naive', 'reorder-point']
  const results = methods.map((method) => {
    let stockoutDays = 0,
      inventoryCost = 0,
      requested = 0,
      served = 0,
      covered = 0,
      observations = 0
    for (const [index, detail] of dataset.entries()) {
      const { item, supplier, history } = detail
      const training = history.slice(0, 56)
      const mean = training.reduce((sum, point) => sum + point.units, 0) / training.length
      const variance =
        training.reduce((sum, point) => sum + (point.units - mean) ** 2, 0) / (training.length - 1)
      const lead = supplier.leadTimeDays
      const uncertainty = Math.sqrt(lead * variance + mean ** 2 * supplier.leadTimeStdDevDays ** 2)
      // Start each policy with identical stock and no open orders; only the training
      // window informs policy parameters. Actual held-out demand is revealed daily.
      let stock = Math.ceil(mean * lead)
      const orders: { arrival: number; units: number }[] = []
      const random = seededRandom(8800 + index)
      for (let day = 56; day < history.length; day++) {
        for (const order of orders.filter((order) => order.arrival === day)) stock += order.units
        const prediction = method === 'seasonal-naive' ? history[day - 7].units : mean
        const spread = 1.281552 * Math.sqrt(variance)
        const actual = history[day].units
        covered += Number(
          actual >= Math.max(0, prediction - spread) && actual <= prediction + spread,
        )
        observations++
        requested += actual
        const fulfilled = Math.min(stock, actual)
        served += fulfilled
        if (fulfilled < actual) stockoutDays++
        stock -= fulfilled
        inventoryCost += (stock * item.unitCost * item.annualHoldingCostRate) / 365
        const onOrder = orders
          .filter((order) => order.arrival > day)
          .reduce((sum, order) => sum + order.units, 0)
        // OpsLens includes lead-time uncertainty; the standard rule holds a fixed
        // three days of demand as safety stock. Naive repeats last week's demand.
        const target =
          method === 'opslens'
            ? Math.ceil(mean * lead + 1.644854 * uncertainty)
            : method === 'reorder-point'
              ? Math.ceil(mean * (lead + 3))
              : Math.ceil(prediction * lead)
        const quantity =
          Math.ceil(Math.max(0, target - stock - onOrder) / item.packSize) * item.packSize
        // Same delivery schedule for all policies: lead time varies within ±1 std dev.
        const realizedLead = Math.max(
          1,
          Math.round(lead + (random() * 2 - 1) * supplier.leadTimeStdDevDays),
        )
        if (quantity) orders.push({ arrival: day + realizedLead, units: quantity })
      }
    }
    return {
      method,
      label:
        method === 'opslens'
          ? 'OpsLens sample policy'
          : method === 'seasonal-naive'
            ? 'Seasonal naive (weekly)'
            : 'Standard reorder-point rule',
      stockoutDays,
      inventoryCost: Math.round(inventoryCost * 100) / 100,
      serviceLevel: Math.round((served / requested) * 1000) / 10,
      forecastRangeCoverage: Math.round((covered / observations) * 1000) / 10,
    }
  })
  return {
    source: 'sample-simulation',
    startDate: dataset[0].history[56].date,
    endDate: dataset[0].history.at(-1)!.date,
    itemCount: dataset.length,
    dayCount: 56,
    results,
    definitions: {
      stockoutDays:
        'Sum of item-days with unmet demand, across all items; not distinct calendar days.',
      inventoryCost:
        'USD holding cost over the 56-day replay: daily closing stock × unit cost × annual holding rate / 365. Excludes purchase and shortage costs.',
      serviceLevel:
        'Unit fill rate (%): units fulfilled immediately / units requested. This differs from the per-item cycle service target.',
      forecastRangeCoverage:
        'Percentage of held-out item-days whose demand falls within the illustrative P10–P90 range.',
    },
    note: 'Illustrative simulation on seeded sample demand, not trained model output. First 56 days train the rules; the next 56 days are replayed with lost sales, variable delivery times, and identical starting stock. OpsLens and the standard rule share a mean forecast, so their forecast coverage is identical. Normal ranges are heuristics and are not calibrated for intermittent demand.',
  }
}
