import { ApiError, validateServiceLevel, type ApiClient } from './client'

export function createHttpClient(baseUrl: string): ApiClient {
  const base = baseUrl.replace(/\/+$/, '')
  const query = (filters: object = {}) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params.set(key, String(value))
    return params.size ? `?${params}` : ''
  }
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${base}${path}`, { ...init, headers: { Accept: 'application/json', ...init?.headers }, signal: AbortSignal.timeout(15_000) })
    } catch {
      throw new ApiError('Unable to reach the data service. Check your connection and retry.', 0, 'NETWORK_ERROR')
    }
    // Do not display arbitrary backend response text or credentials in errors.
    if (!response.ok) throw new ApiError(response.status === 404 ? 'This record could not be found.' : 'The data service could not complete your request. Please retry.', response.status, 'HTTP_ERROR')
    try { return await response.json() as T } catch { throw new ApiError('The data service returned an unreadable response.', response.status, 'INVALID_RESPONSE') }
  }
  return {
    getItems: filters => request(`/items${query(filters)}`),
    getSuppliers: () => request('/suppliers'),
    getRecommendations: filters => request(`/recommendations${query(filters)}`),
    getItemDetail: id => request(`/items/${encodeURIComponent(id)}`),
    getBacktestResults: () => request('/evaluation'),
    getDataSourceStatus: () => request('/data-source'),
    updateServiceLevel: async (id, serviceLevel) => {
      validateServiceLevel(serviceLevel)
      return request(`/items/${encodeURIComponent(id)}/service-level`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceLevel }) })
    },
    testConnection: () => request('/data-source/test', { method: 'POST' }),
  }
}
