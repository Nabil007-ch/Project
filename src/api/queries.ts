import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './index'
import { recommend, stockPosition } from '../lib/recommendation'
import { validateServiceLevel } from './client'
import type { ItemDetail, ItemFilters, RecommendationFilters, ServiceLevel } from './types'

export const queryKeys = {
  items: (filters: ItemFilters = {}) => ['items', filters] as const,
  suppliers: ['suppliers'] as const,
  recommendations: (filters: RecommendationFilters = {}) => ['recommendations', filters] as const,
  detail: (id: string) => ['item', id] as const,
  evaluation: ['evaluation'] as const,
  source: ['data-source'] as const,
}
export const useItems = (filters?: ItemFilters) =>
  useQuery({ queryKey: queryKeys.items(filters), queryFn: () => api.getItems(filters) })
export const useSuppliers = () =>
  useQuery({ queryKey: queryKeys.suppliers, queryFn: () => api.getSuppliers() })
export const useRecommendations = (filters?: RecommendationFilters) =>
  useQuery({
    queryKey: queryKeys.recommendations(filters),
    queryFn: () => api.getRecommendations(filters),
  })
export const useItemDetail = (id: string) =>
  useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => api.getItemDetail(id),
    enabled: Boolean(id),
  })
export const useBacktestResults = () =>
  useQuery({ queryKey: queryKeys.evaluation, queryFn: () => api.getBacktestResults() })
export const useDataSourceStatus = () =>
  useQuery({ queryKey: queryKeys.source, queryFn: () => api.getDataSourceStatus() })
export function useUpdateServiceLevel() {
  const cache = useQueryClient()
  return useMutation({
    mutationFn: ({ id, serviceLevel }: { id: string; serviceLevel: ServiceLevel }) =>
      api.updateServiceLevel(id, serviceLevel),
    onMutate: async ({ id, serviceLevel }) => {
      validateServiceLevel(serviceLevel)
      await cache.cancelQueries({ queryKey: queryKeys.detail(id) })
      const previous = cache.getQueryData<ItemDetail>(queryKeys.detail(id))
      if (previous) {
        const inputs = {
          itemId: id,
          forecast: previous.forecast,
          serviceLevel,
          stock: previous.item.stock,
          packSize: previous.item.packSize,
        }
        cache.setQueryData(queryKeys.detail(id), {
          ...previous,
          item: { ...previous.item, serviceLevel, stock: stockPosition(inputs) },
          recommendation: recommend(inputs),
        })
      }
      return { previous }
    },
    onError: (_error, variables, context) => {
      if (context?.previous) cache.setQueryData(queryKeys.detail(variables.id), context.previous)
    },
    onSuccess: async (detail) => {
      cache.setQueryData(queryKeys.detail(detail.item.id), detail)
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['items'] }),
        cache.invalidateQueries({ queryKey: ['recommendations'] }),
      ])
    },
  })
}
