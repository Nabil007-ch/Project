/** Backend contract. Quantities are individual units, costs USD, dates UTC YYYY-MM-DD. */
export type ServiceLevel = 90 | 95 | 98 | 99
export type StockState = 'at-risk' | 'healthy' | 'overstock'
export type Urgency = 'urgent' | 'soon' | 'none'

export interface Supplier {
  id: string
  name: string
  leadTimeDays: number
  leadTimeStdDevDays: number
}
export interface DemandPoint { date: string; units: number }
export interface ForecastPoint { date: string; p10: number; p50: number; p90: number }
export interface Forecast {
  itemId: string
  daily: ForecastPoint[]
  leadTime: { days: number; expected: number; p10: number; p50: number; p90: number; standardDeviation: number }
  method: 'sample-heuristic'
}
export interface StockPosition {
  onHand: number
  onOrder: number
  allocated: number
  inventoryPosition: number
  daysOfCover: number
  reorderPoint: number
  state: StockState
}
export interface Explanation {
  expectedLeadTimeDemand: number
  likelyRange: { low: number; high: number }
  safetyStock: number
  targetStock: number
  inventoryPosition: number
  shortfall: number
  packSize: number
  roundingUnits: number
  summary: string
  detail: string
}
export interface Recommendation {
  itemId: string
  quantity: number
  urgency: Urgency
  serviceLevel: ServiceLevel
  explanation: Explanation
}
export interface Item {
  id: string
  sku: string
  name: string
  productGroupId: 'beverages'
  supplierId: string
  unitCost: number
  packSize: number
  annualHoldingCostRate: number
  serviceLevel: ServiceLevel
  stock: StockPosition
}
export interface ItemDetail {
  item: Item
  supplier: Supplier
  history: DemandPoint[]
  forecast: Forecast
  recommendation: Recommendation
}
export interface ItemFilters { search?: string; supplierId?: string; state?: StockState }
export interface RecommendationFilters { search?: string; supplierId?: string; urgency?: Urgency }
export interface RecommendationRow {
  item: Item
  supplier: Supplier
  forecast: Forecast
  recommendation: Recommendation
}
export interface BacktestResult {
  method: 'opslens' | 'seasonal-naive' | 'reorder-point'
  label: string
  stockoutDays: number
  inventoryCost: number
  serviceLevel: number
  forecastRangeCoverage: number
}
export interface BacktestResults {
  source: 'sample-simulation'
  startDate: string
  endDate: string
  itemCount: number
  dayCount: number
  results: BacktestResult[]
  definitions: { stockoutDays: string; inventoryCost: string; serviceLevel: string; forecastRangeCoverage: string }
  note: string
}
export interface DataSourceStatus {
  source: 'sample'
  status: 'ready'
  label: string
  asOf: string
  itemCount: number
  readOnly: true
}
export interface ConnectionTestResult { success: boolean; message: string; simulated: true }
