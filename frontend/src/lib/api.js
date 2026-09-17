import { getToken, clearSession } from './auth'

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function apiFetch(input, init) {
  const token = getToken()
  const headers = new Headers(init?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(input, { ...init, headers })
  if (response.status === 401) {
    clearSession()
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login')
    }
  }
  return response
}
