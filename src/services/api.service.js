import { getAuthToken } from './auth.service'

// En production (Docker), les requêtes passent par le proxy nginx /mo-api/ → dzaster-mo:8080/api/
// En développement local, VITE_MO_API_URL pointe directement vers le backend
const DEFAULT_API_BASE_URL = '/mo-api'
const RAW_API_BASE_URL = import.meta.env.VITE_MO_API_URL ?? DEFAULT_API_BASE_URL
const SERVICE_TOKEN = import.meta.env.VITE_MO_SERVICE_TOKEN ?? ''

function normalizeApiBaseUrl(rawUrl) {
  let base = (rawUrl || '').trim()
  if (!base) return DEFAULT_API_BASE_URL
  // URL relative (ex: /mo-api) — on ne la modifie pas
  if (base.startsWith('/')) return base.replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`
  return base.replace(/\/+$/, '')
}

export const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL)

console.log('[api] BASE_URL:', API_BASE_URL)
console.log('[api] SERVICE_TOKEN present:', Boolean(SERVICE_TOKEN))

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  if (SERVICE_TOKEN) headers['x-service-token'] = SERVICE_TOKEN
  const token = getAuthToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

function mapHttpError(response, data) {
  if (response.status === 401) return 'Session expirée. Veuillez vous reconnecter.'
  if (response.status === 403) return 'Accès refusé. Token de service invalide.'
  if (response.status === 404) return 'Ressource introuvable.'
  if (response.status === 422) {
    const details = data?.detail
    if (Array.isArray(details)) return details.map((d) => d.msg).join(', ')
    return typeof details === 'string' ? details : 'Données invalides.'
  }
  if (response.status === 503) return "Service d'authentification indisponible."
  return data?.detail || data?.message || `Erreur serveur (${response.status}).`
}

export async function apiRequest(method, path, body = undefined) {
  const url = `${API_BASE_URL}${path}`
  console.log(`[api] ${method} ${url}`)

  let response
  try {
    response = await fetch(url, {
      method,
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    console.error(`[api] Network error on ${method} ${url}:`, err?.message)
    throw new Error(
      'Connexion au serveur impossible. Vérifiez que dzastr-mo tourne et que VITE_MO_API_URL est correct.'
    )
  }

  console.log(`[api] ${method} ${url} → ${response.status}`)

  if (response.status === 204) return null

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error(`[api] Error ${response.status} on ${method} ${url}:`, data)
    throw new Error(mapHttpError(response, data))
  }
  return data
}

export const api = {
  get: (path) => apiRequest('GET', path),
  post: (path, body) => apiRequest('POST', path, body),
  put: (path, body) => apiRequest('PUT', path, body),
  delete: (path) => apiRequest('DELETE', path),
}
