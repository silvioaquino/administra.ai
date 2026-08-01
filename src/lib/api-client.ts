// src/lib/api-client.ts
// Cliente HTTP central para o app (usado pelos hooks de dados).

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let message = `Erro ${response.status}`
    try {
      const body = (await response.json()) as { error?: string; message?: string }
      message = body.error || body.message || message
    } catch {
      // resposta sem corpo JSON
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
