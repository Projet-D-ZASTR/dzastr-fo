import { getAuthToken } from './auth.service'

// En production (Docker), les requêtes passent par le proxy nginx /mo-api/ → dzaster-mo:8080
// En développement local, VITE_MO_API_URL pointe directement vers le backend
const DEFAULT_API_BASE_URL = '/mo-api'
const RAW_API_BASE_URL = import.meta.env.VITE_MO_API_URL ?? DEFAULT_API_BASE_URL
const SERVICE_TOKEN = import.meta.env.VITE_MO_SERVICE_TOKEN ?? ''

function normalizeApiBaseUrl(rawUrl) {
  let base = (rawUrl || '').trim()
  if (!base) return DEFAULT_API_BASE_URL
  if (base.startsWith('/')) return base.replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`
  return base.replace(/\/+$/, '')
}

export const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL)

// ── Init logs ─────────────────────────────────────────────────────────────────
console.group('%c[api] Initialisation', 'color:#6366f1;font-weight:bold')
console.log('window.location.origin  :', window.location.origin)
console.log('window.location.href    :', window.location.href)
console.log('RAW VITE_MO_API_URL     :', RAW_API_BASE_URL)
console.log('API_BASE_URL (normalisé):', API_BASE_URL)
console.log('Via nginx proxy         :', API_BASE_URL.startsWith('/'))
console.log('SERVICE_TOKEN présent   :', Boolean(SERVICE_TOKEN))
console.log('SERVICE_TOKEN (4 chars) :', SERVICE_TOKEN ? SERVICE_TOKEN.slice(0, 4) + '…' : '(vide)')
console.log('Mode Vite               :', import.meta.env.MODE)
console.log('DEV                     :', import.meta.env.DEV)
console.log('PROD                    :', import.meta.env.PROD)
console.log('User-Agent              :', navigator.userAgent)
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
  const fullUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url
  const headers = buildHeaders()
  const t0 = performance.now()

  console.group(`%c[api] ${method} ${url}`, 'color:#0ea5e9')
  console.log('URL complète            :', fullUrl)
  console.log('Via proxy nginx         :', url.startsWith('/'))
  console.log('Headers envoyés :', {
    'Content-Type': headers['Content-Type'],
    'x-service-token': headers['x-service-token']
      ? headers['x-service-token'].slice(0, 4) + '…'
      : '(ABSENT ⚠)',
    Authorization: headers['Authorization']
      ? 'Bearer …' + headers['Authorization'].slice(-8)
      : '(ABSENT ⚠)',
  })
  if (body !== undefined) console.log('Body envoyé             :', body)

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    console.error('❌ Network error — fetch a échoué complètement')
    console.error('Message:', err?.message)
    console.error('Type   :', err?.name)
    console.error('→ Causes possibles: dzastr-mo injoignable, CORS bloqué, nginx mal configuré')
    console.error('→ URL tentée:', fullUrl)
    console.groupEnd()
    throw new Error(
      'Connexion au serveur impossible. Vérifiez que dzastr-mo tourne et que VITE_MO_API_URL est correct.'
    )
  }

  const elapsed = Math.round(performance.now() - t0)
  const statusOk = response.status < 400
  console.log(
    `%cStatus: ${response.status} ${response.statusText} (${elapsed}ms)`,
    statusOk ? 'color:green' : 'color:red;font-weight:bold'
  )
  console.log('Response headers :', {
    'content-type': response.headers.get('content-type'),
    'x-request-id': response.headers.get('x-request-id'),
    server: response.headers.get('server'),
    'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
  })

  if (response.status === 204) {
    console.log('→ 204 No Content')
    console.groupEnd()
    return null
  }

  const rawText = await response.text().catch(() => '')
  console.log('Response body (brut)    :', rawText.slice(0, 500))

  let data = {}
  try {
    data = JSON.parse(rawText)
  } catch (e) {
    console.warn('⚠ Impossible de parser le JSON:', e?.message)
    console.warn("→ Le serveur a retourné du non-JSON (HTML d'erreur nginx ?)")
  }

  if (!response.ok) {
    console.error(`❌ Erreur ${response.status}:`, data)
    console.groupEnd()
    throw new Error(mapHttpError(response, data))
  }

  console.log('✅ Réponse OK:', Array.isArray(data) ? `[${data.length} items]` : data)
  console.groupEnd()
  return data
}

export const api = {
  get: (path) => apiRequest('GET', path),
  post: (path, body) => apiRequest('POST', path, body),
  put: (path, body) => apiRequest('PUT', path, body),
  delete: (path) => apiRequest('DELETE', path),
}
