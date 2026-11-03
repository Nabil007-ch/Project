import { ApiError, validateServiceLevel, type ApiClient } from '../client'
import type { ItemDetail } from '../types'
import { seededRandom } from '../../lib/random'
import { generateDataset, SAMPLE_AS_OF, suppliers } from './generate'
import { recommend, stockPosition } from './recommendation'
import { simulateBacktest } from './backtest'

export interface MockOptions {
  seed?: number
  delayMs?: number
  /** Use 0 for reliable demos, 1 for error-state testing; default is 2%. */
  errorRate?: number
}
export function createMockClient({
  seed,
  delayMs = 250,
  errorRate = 0.02,
}: MockOptions = {}): ApiClient {
  const records = generateDataset(seed)
  const backtest = simulateBacktest(records)
  const random = seededRandom(1901)
  // Mutations happen only after the simulated request succeeds. Return deep copies
  // so callers (and query caches) cannot accidentally mutate mock server state.
  async function request<T>(action: () => T): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    if (random() < errorRate)
      throw new ApiError('Sample request interrupted. Please retry.', 503, 'SIMULATED_FAILURE')
    return structuredClone(action())
  }
  const find = (id: string): ItemDetail => {
    const record = records.find((record) => record.item.id === id)
    if (!record) throw new ApiError('This item could not be found.', 404, 'ITEM_NOT_FOUND')
    return record
  }
  const matches = (detail: ItemDetail, search = '', supplierId?: string) => {
    const query = search.trim().toLowerCase()
    return (
      (!supplierId || detail.supplier.id === supplierId) &&
      `${detail.item.name} ${detail.item.sku}`.toLowerCase().includes(query)
    )
  }
  return {
    getItems: (filters = {}) =>
      request(() =>
        records
          .filter(
            (record) =>
              matches(record, filters.search, filters.supplierId) &&
              (!filters.state || record.item.stock.state === filters.state),
          )
          .map((record) => record.item),
      ),
    getSuppliers: () => request(() => suppliers),
    getRecommendations: (filters = {}) =>
      request(() =>
        records
          .filter(
            (record) =>
              matches(record, filters.search, filters.supplierId) &&
              (!filters.urgency || record.recommendation.urgency === filters.urgency),
          )
          .map(({ item, supplier, forecast, recommendation }) => ({
            item,
            supplier,
            forecast,
            recommendation,
          })),
      ),
    getItemDetail: (id) => request(() => find(id)),
    getBacktestResults: () => request(() => backtest),
    getDataSourceStatus: () =>
      request(() => ({
        source: 'sample',
        status: 'ready',
        label: 'Sample data',
        asOf: SAMPLE_AS_OF,
        itemCount: records.length,
        readOnly: true,
      })),
    updateServiceLevel: (id, serviceLevel) =>
      request(() => {
        validateServiceLevel(serviceLevel)
        const record = find(id)
        const inputs = {
          itemId: id,
          forecast: record.forecast,
          serviceLevel,
          stock: record.item.stock,
          packSize: record.item.packSize,
        }
        record.item.serviceLevel = serviceLevel
        record.item.stock = stockPosition(inputs)
        record.recommendation = recommend(inputs)
        return record
      }),
    testConnection: () =>
      request(() => ({
        success: true,
        message:
          'Sample data is available: 60 beverage items. No Dynamics GP connection was attempted.',
        simulated: true,
      })),
  }
}
