export class ApiError extends Error {
  readonly status: number
  readonly retryAfterMs?: number

  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function parseErrorBody(body: string, status: number): string {
  const trimmed = body.trim()
  if (!trimmed) {
    return statusText(status)
  }

  try {
    const parsed = JSON.parse(trimmed) as { error?: string; message?: string }
    if (parsed.error) return parsed.error
    if (parsed.message) return parsed.message
  } catch {
    // Non-JSON bodies such as 401 "Unauthorized"
  }

  return trimmed
}

function statusText(status: number): string {
  if (status === 401) return 'Unauthorized. Check the API key in your environment.'
  if (status === 404) return 'The requested resource was not found.'
  if (status === 429) return 'Too many requests. Please wait and try again.'
  if (status >= 500) return 'The server encountered an error. Please try again.'
  return `Request failed with status ${status}.`
}
