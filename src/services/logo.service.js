import { apiGetBlob, apiFetch } from './api.service'
import { cacheInvalidate, withCache } from './cache.service'

const TTL = 10 * 60 * 1000
const LOGO_CACHE_KEY = 'logo:me'

export async function uploadLogo(file) {
  const formData = new FormData()
  formData.append('file', file)
  const data = await apiFetch('POST', '/logos/', formData)
  cacheInvalidate(LOGO_CACHE_KEY)
  return data
}

export async function getLogo() {
  return withCache(
    LOGO_CACHE_KEY,
    async () => {
      const blob = await apiGetBlob('/logos/me')
      if (!blob) return null
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    },
    TTL
  )
}

export async function deleteLogo() {
  const data = await apiFetch('DELETE', '/logos/me', null)
  cacheInvalidate(LOGO_CACHE_KEY)
  return data
}
