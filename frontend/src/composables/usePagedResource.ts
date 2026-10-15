import { computed, readonly, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { isApiError } from '../api/errors'
import type { ListQueryParams, PagedList, SortOrder } from '../api/types'

const DEFAULT_LIMIT = 10

export function usePagedResource<TItem, TSort extends string>(options: {
  load: (query: ListQueryParams, signal: AbortSignal) => Promise<PagedList<TItem>>
  parentId?: MaybeRefOrGetter<string>
  defaultSortBy: TSort
  defaultOrder?: SortOrder
  includeStatus?: boolean
  extraQuery?: MaybeRefOrGetter<Partial<ListQueryParams>>
  errorMessage: string
}) {
  const items = ref<TItem[]>([])
  const totalCount = shallowRef(0)
  const totalDurationMinutes = shallowRef(0)
  const loading = shallowRef(false)
  const error = shallowRef<string | null>(null)
  const limit = shallowRef(DEFAULT_LIMIT)
  const offset = shallowRef(0)
  const sortBy = shallowRef<TSort>(options.defaultSortBy)
  const order = shallowRef<SortOrder>(options.defaultOrder ?? 'asc')
  const searchQuery = shallowRef('')
  const statusFilter = shallowRef('all')
  const retryAfterMs = shallowRef<number | undefined>(undefined)

  const hasPrevious = computed(() => offset.value > 0)
  const hasNext = computed(() => offset.value + limit.value < totalCount.value)
  const page = computed(() => Math.floor(offset.value / limit.value) + 1)
  const pageCount = computed(() => Math.max(1, Math.ceil(totalCount.value / limit.value)))
  const rangeStart = computed(() => (items.value.length === 0 ? 0 : offset.value + 1))
  const rangeEnd = computed(() => offset.value + items.value.length)

  let controller: AbortController | null = null

  async function fetchPage() {
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    error.value = null
    retryAfterMs.value = undefined

    const parentId = options.parentId ? toValue(options.parentId) : undefined
    if (options.parentId && !parentId) {
      items.value = []
      totalCount.value = 0
      totalDurationMinutes.value = 0
      loading.value = false
      return
    }

    try {
      const extra = options.extraQuery ? toValue(options.extraQuery) : {}
      const result = await options.load(
        {
          limit: limit.value,
          offset: offset.value,
          sortBy: sortBy.value,
          order: order.value,
          q: searchQuery.value,
          status: options.includeStatus ? statusFilter.value : undefined,
          ...extra,
        },
        controller.signal,
      )
      items.value = result.items
      totalCount.value = result.total
      totalDurationMinutes.value = result.totalDurationMinutes
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      if (isApiError(caught)) {
        error.value = caught.message
        retryAfterMs.value = caught.retryAfterMs
      } else {
        error.value = options.errorMessage
      }
      items.value = []
      totalCount.value = 0
      totalDurationMinutes.value = 0
    } finally {
      loading.value = false
    }
  }

  function goToPreviousPage() {
    if (!hasPrevious.value) return
    offset.value = Math.max(0, offset.value - limit.value)
  }

  function goToNextPage() {
    if (!hasNext.value) return
    offset.value += limit.value
  }

  function setLimit(next: number) {
    limit.value = next
    offset.value = 0
  }

  function toggleSort(field: TSort) {
    if (sortBy.value === field) {
      order.value = order.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      order.value = 'asc'
    }
    offset.value = 0
  }

  watch([searchQuery, statusFilter, limit], () => {
    offset.value = 0
  })

  watch(
    [
      searchQuery,
      statusFilter,
      limit,
      offset,
      sortBy,
      order,
      () => (options.parentId ? toValue(options.parentId) : ''),
      () => (options.extraQuery ? JSON.stringify(toValue(options.extraQuery)) : ''),
    ],
    () => {
      void fetchPage()
    },
    { immediate: true, flush: 'post' },
  )

  return {
    items,
    totalCount: readonly(totalCount),
    totalDurationMinutes: readonly(totalDurationMinutes),
    loading: readonly(loading),
    error: readonly(error),
    retryAfterMs: readonly(retryAfterMs),
    limit: readonly(limit),
    offset: readonly(offset),
    sortBy: readonly(sortBy),
    order: readonly(order),
    searchQuery,
    statusFilter,
    hasNext,
    hasPrevious,
    page,
    pageCount,
    rangeStart,
    rangeEnd,
    fetchPage,
    goToPreviousPage,
    goToNextPage,
    setLimit,
    toggleSort,
  }
}
