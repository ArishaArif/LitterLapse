const TOKEN_STORAGE_KEY = 'evd_auth_token'
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const ALLOWED_ROLES = ['admin', 'reviewer']

function base64UrlDecode(segment) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  )
  const binary = atob(padded)
  const decoded = decodeURIComponent(
    Array.from(binary, (char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2)).join(
      '',
    ),
  )
  return decoded
}

function decodeTokenPayload(token) {
  if (typeof token !== 'string') return null
  const segments = token.split('.')
  if (segments.length !== 3) return null
  try {
    const payload = JSON.parse(base64UrlDecode(segments[1]))
    return payload && typeof payload === 'object' ? payload : null
  } catch {
    return null
  }
}

function normalizeRole(role) {
  return typeof role === 'string' && role.trim() ? role.trim().toLowerCase() : null
}

export function storeSession(token) {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY)
}

export function getSession() {
  const token = getToken()
  if (!token) return null
  const payload = decodeTokenPayload(token)
  if (!payload) {
    clearSession()
    return null
  }
  const expiresAt = Number(payload.exp)
  if (Number.isFinite(expiresAt) && expiresAt > 0 && expiresAt * 1000 <= Date.now()) {
    clearSession()
    return null
  }
  return { token, payload }
}

export function getRole() {
  return normalizeRole(getSession()?.payload?.role)
}

export function hasValidRole() {
  return ALLOWED_ROLES.includes(getRole())
}

export function getUserEmail() {
  const payload = getSession()?.payload
  const email = payload?.email ?? payload?.sub
  return typeof email === 'string' ? email : null
}

export async function login(email, password) {
  let response
  try {
    response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (!response.ok) {
    return { ok: false, error: response.status }
  }
  let data
  try {
    data = await response.json()
  } catch {
    return { ok: false, error: 'malformed' }
  }
  const token =
    typeof data?.access_token === 'string' && data.access_token
      ? data.access_token
      : typeof data?.token === 'string' && data.token
        ? data.token
        : null
  if (!token) {
    return { ok: false, error: 'malformed' }
  }
  storeSession(token)
  const session = getSession()
  if (!session || !ALLOWED_ROLES.includes(normalizeRole(session.payload.role))) {
    clearSession()
    return { ok: false, error: 'role' }
  }
  return { ok: true }
}

export function logout() {
  clearSession()
}
