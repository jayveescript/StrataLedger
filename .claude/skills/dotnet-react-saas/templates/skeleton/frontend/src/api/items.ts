import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from './http'
import { qk } from './queryKeys'
import type { Item, ItemInput, ItemStatus, Paged } from './types'

// Reference API module: typed endpoint calls wrapped in TanStack Query hooks. Copy per domain module.

export interface ItemQuery { search?: string; status?: ItemStatus; page?: number; pageSize?: number }

export const useItems = (query: ItemQuery) =>
  useQuery({
    queryKey: qk.items(query),
    queryFn: ({ signal }) => http.get<Paged<Item>>('/items', { ...query }, signal),
    placeholderData: keepPreviousData,
  })

export const useItem = (id: string) => useQuery({ queryKey: qk.item(id), queryFn: () => http.get<Item>(`/items/${id}`) })

function useItemMutation<TVars, TResult = unknown>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }) })
}

export const useCreateItem = () => useItemMutation((body: ItemInput) => http.post<{ id: string }>('/items', { ...body }))
export const useUpdateItem = () =>
  useItemMutation(({ id, ...body }: ItemInput & { id: string; status: ItemStatus }) => http.put<void>(`/items/${id}`, { ...body }))
export const useDeleteItem = () => useItemMutation((id: string) => http.delete<void>(`/items/${id}`))
