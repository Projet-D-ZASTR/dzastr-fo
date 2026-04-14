const DEFAULT_API_BASE_URL = 'http://localhost:8081/api'
const RAW_API_BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? DEFAULT_API_BASE_URL
const SERVICE_TOKEN = import.meta.env.VITE_AUTH_SERVICE_TOKEN ?? ''

const AUTH_TOKEN_KEY = 'dzastr_auth_token'
const AUTH_USER_KEY = 'dzastr_auth_user'

/**
 * Décode le payload d'un JWT sans vérifier la signature (lecture seule côté client).
 * Le JWT contient User_Id qui n'est pas inclus dans la réponse HTTP login/register.
 */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  }
  if (SERVICE_TOKEN) {
    headers['x-service-token'] = SERVICE_TOKEN
  }
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

function normalizeApiBaseUrl(rawUrl) {
  let base = (rawUrl || '').trim()
  if (!base) {
    return DEFAULT_API_BASE_URL
  }
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`
  }
  base = base.replace(/\/+$/, '')
  if (!base.endsWith('/api')) {
    base = `${base}/api`
  }
  return base
}

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL)

async function request(method, path, payload = undefined) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(),
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || 'Erreur serveur')
  }
  return data
}

export async function loginUser({ email, password }) {
  const data = await request('POST', '/secure/login', {
    User_Email: email,
    User_Password: password,
  })
  return {
    accessToken: data?.accessToken ?? '',
    user: data?.user ?? null,
  }
}

export async function registerUser({ fullName, email, password }) {
  const data = await request('POST', '/secure/register', {
    User_Username: fullName,
    User_Role: 'user',
    User_Email: email,
    User_Password: password,
    User_Entreprise: '',
    User_Address: '',
    User_IsEntrepreneur: false,
  })
  return {
    accessToken: data?.accessToken ?? '',
    user: data?.user ?? null,
  }
}

export function saveAuthSession(accessToken, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken)
  // User_Id est absent de la réponse HTTP — on le récupère depuis le payload JWT
  const payload = decodeJwtPayload(accessToken)
  const enrichedUser = {
    ...(user ?? {}),
    User_Id: payload?.User_Id ?? user?.User_Id ?? null,
  }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(enrichedUser))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getAuthUser() {
  try {
    const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY) ?? 'null')
    // Compat sessions sans User_Id : on le relit depuis le token
    if (user && !user.User_Id) {
      const token = getAuthToken()
      if (token) {
        const payload = decodeJwtPayload(token)
        if (payload?.User_Id) user.User_Id = payload.User_Id
      }
    }
    return user
  } catch {
    return null
  }
}

export function updateAuthUserSession(nextUser) {
  if (!nextUser) return
  const current = getAuthUser() ?? {}
  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify({
      ...current,
      ...nextUser,
      User_Id: nextUser.User_Id ?? current.User_Id ?? null,
    })
  )
}

export async function updateAuthUserProfile(userId, profile) {
  const data = await request('PUT', `/users/${userId}`, profile)
  return {
    User_Id: userId,
    User_Username: data?.User_Username ?? '',
    User_Role: data?.User_Role ?? profile?.User_Role ?? 'user',
    User_Email: data?.User_Email ?? '',
    User_Entreprise: data?.User_Entreprise ?? '',
    User_Address: data?.User_Address ?? '',
    User_IsEntrepreneur: Boolean(data?.User_IsEntrepreneur),
  }
}

export async function verifyAuthSession() {
  const data = await request('GET', '/secure/verify')
  if (!data?.valid || !data?.user?.User_Id) {
    throw new Error('Session invalide')
  }
  return data.user
}

export async function findAuthUserIdByEmail(email) {
  const targetEmail = String(email || '')
    .trim()
    .toLowerCase()
  if (!targetEmail) return null

  const users = await request('GET', '/users')
  const matched = Array.isArray(users)
    ? users.find(
        (user) =>
          String(user?.User_Email || '')
            .trim()
            .toLowerCase() === targetEmail
      )
    : null

  const id = Number(matched?.User_Id)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function isAuthenticated() {
  return Boolean(getAuthToken())
}
