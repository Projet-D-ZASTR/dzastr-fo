import { apiGetBlob, apiFetch } from './api.service'

export async function uploadLogo(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch('POST', '/logos/', formData)
}

export async function getLogo() {
  const blob = await apiGetBlob('/logos/me')
  if (!blob) return null
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function deleteLogo() {
  return apiFetch('DELETE', '/logos/me', null)
}
