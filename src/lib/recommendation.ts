import type {
  Explanation,
  Forecast,
  Recommendation,
  ServiceLevel,
  StockPosition,
} from '../api/types'

const zScore: Record<ServiceLevel, number> = {
  90: 1.281552,
  95: 1.644854,
  98: 2.053749,
  99: 2.326348,
}
export interface RecommendationInputs {
  itemId: string
  forecast: Forecast
  serviceLevel: ServiceLevel
  stock: Pick<StockPosition, 'onHand' | 'onOrder' | 'allocated'>
  packSize: number
}

/**
 * Transparent sample policy, not a trained forecasting model.
 * Safety stock = ceil(z(service target) × uncertainty during lead time).
 * Target stock = expected lead-time demand + safety stock.
 * Inventory position = on hand + on order - allocated.
 * Order the positive gap, rounded UP to the supplier's pack size.
 */
export function recommend({
  itemId,
  forecast,
  serviceLevel,
  stock,
  packSize,
}: RecommendationInputs): Recommendation {
  const expected = forecast.leadTime.expected
  const safetyStock = Math.ceil(zScore[serviceLevel] * forecast.leadTime.standardDeviation)
  const targetStock = expected + safetyStock
  const inventoryPosition = stock.onHand + stock.onOrder - stock.allocated
  const shortfall = Math.max(0, targetStock - inventoryPosition)
  const quantity = Math.ceil(shortfall / packSize) * packSize
  const urgency =
    quantity === 0 ? 'none' : stock.onHand - stock.allocated < expected ? 'urgent' : 'soon'
  const likelyRange = { low: forecast.leadTime.p10, high: forecast.leadTime.p90 }
  const explanation: Explanation = {
    expectedLeadTimeDemand: expected,
    likelyRange,
    safetyStock,
    targetStock,
    inventoryPosition,
    shortfall,
    packSize,
    roundingUnits: quantity - shortfall,
    summary: quantity
      ? `${shortfall} units below target; order ${quantity} in packs of ${packSize}.`
      : 'Stock already meets your lead-time target; no order needed.',
    detail: `Recommend ordering ${quantity} units because expected demand over the ${forecast.leadTime.days}-day lead time is ${expected} units (sample range ${likelyRange.low}–${likelyRange.high}). Stock on hand is ${stock.onHand}, with ${stock.onOrder} on order and ${stock.allocated} allocated, giving an inventory position of ${inventoryPosition}. Your ${serviceLevel}% service target adds ${safetyStock} units of safety stock, for a target of ${targetStock}. ${quantity ? `The ${shortfall}-unit gap is rounded up to packs of ${packSize}, adding ${quantity - shortfall} units.` : 'There is no gap to fill.'} This is an illustrative calculation using sample data.`,
  }
  return { itemId, quantity, urgency, serviceLevel, explanation }
}

export function stockPosition(inputs: RecommendationInputs): StockPosition {
  const recommendation = recommend(inputs)
  const { targetStock, inventoryPosition, expectedLeadTimeDemand } = recommendation.explanation
  const dailyDemand = expectedLeadTimeDemand / inputs.forecast.leadTime.days
  const available = Math.max(0, inputs.stock.onHand - inputs.stock.allocated)
  return {
    ...inputs.stock,
    inventoryPosition,
    daysOfCover: Math.round((available / dailyDemand) * 10) / 10,
    reorderPoint: targetStock,
    state:
      available < expectedLeadTimeDemand
        ? 'at-risk'
        : inventoryPosition > targetStock * 2
          ? 'overstock'
          : 'healthy',
  }
}
