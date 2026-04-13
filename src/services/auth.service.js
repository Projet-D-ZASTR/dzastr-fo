const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:3000/api'
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
