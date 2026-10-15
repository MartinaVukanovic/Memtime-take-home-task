import { ApiError, parseErrorBody } from './errors'
import type { PagedList } from './types'

const DEFAULT_BASE_URL = 'http://localhost:3000/api/v1'

function getConfig() {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
  const apiKey = import.meta.env.VITE_API_KEY

  if (!apiKey) {
    throw new ApiError('Missing VITE_API_KEY. Copy frontend/.env.example to frontend/.env.', 401)
  }

  return { baseUrl, apiKey }
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const { baseUrl } = getConfig()
  const url = new URL(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }

  return url
}

function retryAfterMs(response: Response): number | undefined {
  const retryAfter = response.headers.get('retry-after')
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (!Number.isNaN(seconds)) return seconds * 1000
  }

  const reset = response.headers.get('ratelimit-reset')
  if (reset) {
    const seconds = Number(reset)
    if (!Number.isNaN(seconds)) return seconds * 1000
  }

  return 60_000
}

async function request<T>(
  path: string,
  options: RequestInit & {
    query?: Record<string, string | number | undefined>
    json?: unknown
  } = {},
): Promise<T> {
  const { query, json } = options
  const { apiKey } = getConfig()
  const { headers: initHeaders, ...init } = options
  const url = buildUrl(path, query)
  const headers = new Headers(initHeaders)
  headers.set('Authorization', `Bearer ${apiKey}`)
  headers.set('Accept', 'application/json')

  let body = init.body
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  }

  const response = await fetch(url, {
    ...init,
    headers,
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new ApiError(
      parseErrorBody(text, response.status),
      response.status,
      response.status === 429 ? retryAfterMs(response) : undefined,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

function headerNumber(response: Response, name: string, fallback: number): number {
  const raw = response.headers.get(name)
  if (raw == null || raw === '') return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function requestPaged<T>(
  path: string,
  options: RequestInit & {
    query?: Record<string, string | number | undefined>
  } = {},
): Promise<PagedList<T>> {
  const { query } = options
  const { apiKey } = getConfig()
  const { headers: initHeaders, ...init } = options
  const url = buildUrl(path, query)
  const headers = new Headers(initHeaders)
  headers.set('Authorization', `Bearer ${apiKey}`)
  headers.set('Accept', 'application/json')

  const response = await fetch(url, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new ApiError(
      parseErrorBody(text, response.status),
      response.status,
      response.status === 429 ? retryAfterMs(response) : undefined,
    )
  }

  const items = (await response.json()) as T[]
  const total = headerNumber(response, 'X-Total-Count', items.length)

  return {
    items,
    total,
    totalDurationMinutes: headerNumber(response, 'X-Total-Duration-Minutes', 0),
  }
}

export const http = {
  get<T>(path: string, query?: Record<string, string | number | undefined>, init?: RequestInit) {
    return request<T>(path, { ...init, method: 'GET', query })
  },
  getPaged<T>(path: string, query?: Record<string, string | number | undefined>, init?: RequestInit) {
    return requestPaged<T>(path, { ...init, method: 'GET', query })
  },
  post<T>(path: string, json?: unknown, init?: RequestInit) {
    return request<T>(path, { ...init, method: 'POST', json })
  },
  put<T>(path: string, json?: unknown, init?: RequestInit) {
    return request<T>(path, { ...init, method: 'PUT', json })
  },
  delete<T>(path: string, init?: RequestInit) {
    return request<T>(path, { ...init, method: 'DELETE' })
  },
}
