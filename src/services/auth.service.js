const DEFAULT_API_BASE_URL = 'http://localhost:8081/api'
const RAW_API_BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? DEFAULT_API_BASE_URL
const SERVICE_TOKEN = import.meta.env.VITE_AUTH_SERVICE_TOKEN ?? ''

const AUTH_TOKEN_KEY = 'dzastr_auth_token'
const AUTH_USER_KEY = 'dzastr_auth_user'

function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  }
  if (SERVICE_TOKEN) {
    headers['x-service-token'] = SERVICE_TOKEN
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

async function request(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || 'Erreur serveur')
  }
  return data
}

export async function loginUser({ email, password }) {
  const data = await request('/secure/login', {
    User_Email: email,
    User_Password: password,
  })
  return {
    accessToken: data?.accessToken ?? '',
    user: data?.user ?? null,
  }
}

export async function registerUser({ fullName, email, password }) {
  const data = await request('/secure/register', {
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
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user ?? null))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function isAuthenticated() {
  return Boolean(getAuthToken())
}
