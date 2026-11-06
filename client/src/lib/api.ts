// Small helper for talking to our own /api routes: sends JSON, returns JSON,
// and turns a server error message into a normal Error the page can show.
export async function apiRequest<T>(url: string, method: string, body?: unknown): Promise<T> {
  const options: RequestInit = { method, headers: {} }

  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)

  if (response.status === 204) {
    return undefined as T
  }

  let data: { error?: string }
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(data.error || 'Request failed (' + response.status + ')')
  }

  return data as T
}
