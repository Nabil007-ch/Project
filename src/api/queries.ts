import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './index'
import type { ItemFilters, RecommendationFilters, ServiceLevel } from './types'

export const queryKeys = {
  items: (filters: ItemFilters = {}) => ['items', filters] as const,
  suppliers: ['suppliers'] as const,
  recommendations: (filters: RecommendationFilters = {}) => ['recommendations', filters] as const,
  detail: (id: string) => ['item', id] as const,
  evaluation: ['evaluation'] as const,
  source: ['data-source'] as const,
}
export const useItems = (filters?: ItemFilters) => useQuery({ queryKey: queryKeys.items(filters), queryFn: () => api.getItems(filters) })
export const useSuppliers = () => useQuery({ queryKey: queryKeys.suppliers, queryFn: () => api.getSuppliers() })
export const useRecommendations = (filters?: RecommendationFilters) => useQuery({ queryKey: queryKeys.recommendations(filters), queryFn: () => api.getRecommendations(filters) })
export const useItemDetail = (id: string) => useQuery({ queryKey: queryKeys.detail(id), queryFn: () => api.getItemDetail(id), enabled: Boolean(id) })
export const useBacktestResults = () => useQuery({ queryKey: queryKeys.evaluation, queryFn: () => api.getBacktestResults() })
export const useDataSourceStatus = () => useQuery({ queryKey: queryKeys.source, queryFn: () => api.getDataSourceStatus() })
export function useUpdateServiceLevel() {
  const cache = useQueryClient()
  return useMutation({
    mutationFn: ({ id, serviceLevel }: { id: string; serviceLevel: ServiceLevel }) => api.updateServiceLevel(id, serviceLevel),
    onSuccess: async detail => {
      cache.setQueryData(queryKeys.detail(detail.item.id), detail)
      await Promise.all([cache.invalidateQueries({ queryKey: ['items'] }), cache.invalidateQueries({ queryKey: ['recommendations'] })])
    },
  })
}
