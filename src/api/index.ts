import { createHttpClient } from './http'
import { createMockClient } from './mock/client'

// A single setting switches implementations; screens import only `api` or query hooks.
const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const configuredRate = Number(import.meta.env.VITE_MOCK_ERROR_RATE ?? '0.02')
export const api = baseUrl
  ? createHttpClient(baseUrl)
  : createMockClient({
      errorRate: Number.isFinite(configuredRate) ? Math.max(0, Math.min(1, configuredRate)) : 0.02,
    })
export type { ApiClient } from './client'
export type * from './types'
