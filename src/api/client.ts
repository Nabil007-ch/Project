import type { BacktestResults, ConnectionTestResult, DataSourceStatus, Item, ItemDetail, ItemFilters, RecommendationFilters, RecommendationRow, ServiceLevel, Supplier } from './types'

export interface ApiClient {
  getItems(filters?: ItemFilters): Promise<Item[]>
  getSuppliers(): Promise<Supplier[]>
  getRecommendations(filters?: RecommendationFilters): Promise<RecommendationRow[]>
  getItemDetail(id: string): Promise<ItemDetail>
  getBacktestResults(): Promise<BacktestResults>
  getDataSourceStatus(): Promise<DataSourceStatus>
  updateServiceLevel(id: string, serviceLevel: ServiceLevel): Promise<ItemDetail>
  testConnection(): Promise<ConnectionTestResult>
}
export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string) {
    super(message)
    this.name = 'ApiError'
  }
}
export const serviceLevels: readonly ServiceLevel[] = [90, 95, 98, 99]
export function validateServiceLevel(value: number): asserts value is ServiceLevel {
  if (!serviceLevels.includes(value as ServiceLevel)) throw new ApiError('Choose a service target of 90%, 95%, 98%, or 99%.', 400, 'INVALID_SERVICE_LEVEL')
}
