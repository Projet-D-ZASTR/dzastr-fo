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

// ── Init logs ────────────────────────────────────────────────────────────────
console.group('[api] Initialisation')
console.log('RAW VITE_MO_API_URL    :', RAW_API_BASE_URL)
console.log('API_BASE_URL (normalisé):', API_BASE_URL)
console.log('SERVICE_TOKEN présent  :', Boolean(SERVICE_TOKEN))
console.log('SERVICE_TOKEN (4 chars):', SERVICE_TOKEN ? SERVICE_TOKEN.slice(0, 4) + '…' : '(vide)')
console.log('Mode                   :', import.meta.env.MODE)
console.log('DEV                    :', import.meta.env.DEV)
console.log('PROD                   :', import.meta.env.PROD)
console.groupEnd()

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
  const headers = buildHeaders()
  const t0 = performance.now()

  console.group(`[api] ${method} ${url}`)
  console.log('Headers:', {
    'Content-Type': headers['Content-Type'],
    'x-service-token': headers['x-service-token']
      ? headers['x-service-token'].slice(0, 4) + '…'
      : '(absent)',
    Authorization: headers['Authorization']
      ? 'Bearer …' + headers['Authorization'].slice(-6)
      : '(absent)',
  })
  if (body !== undefined) console.log('Body envoyé:', body)

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    console.error('Network error (fetch a échoué):', err?.message)
    console.error('→ dzastr-mo injoignable ou CORS bloqué')
    console.groupEnd()
    throw new Error(
      'Connexion au serveur impossible. Vérifiez que dzastr-mo tourne et que VITE_MO_API_URL est correct.'
    )
  }

  const elapsed = Math.round(performance.now() - t0)
  console.log(`Status: ${response.status} ${response.statusText} (${elapsed}ms)`)
  console.log('Response headers:', {
    'content-type': response.headers.get('content-type'),
    'x-request-id': response.headers.get('x-request-id'),
  })

  if (response.status === 204) {
    console.log('→ 204 No Content')
    console.groupEnd()
    return null
  }

  const data = await response.json().catch((e) => {
    console.warn('→ Impossible de parser le JSON de la réponse:', e?.message)
    return {}
  })

  if (!response.ok) {
    console.error(`→ Erreur ${response.status}:`, data)
    console.groupEnd()
    throw new Error(mapHttpError(response, data))
  }

  console.log('→ Réponse OK:', Array.isArray(data) ? `[${data.length} items]` : data)
  console.groupEnd()
  return data
}

export const api = {
  get: (path) => apiRequest('GET', path),
  post: (path, body) => apiRequest('POST', path, body),
  put: (path, body) => apiRequest('PUT', path, body),
  delete: (path) => apiRequest('DELETE', path),
}
