import { api, apiDownload } from './api.service'
import { withCache, cacheInvalidate, cacheInvalidatePrefix } from './cache.service'

const TTL = 5 * 60 * 1000

function toFrontend(c) {
  return {
    id: c.Client_Id,
    name: c.Client_Name,
    email: c.Client_Email,
    company: c.Client_Entreprise,
    adresse: c.Client_Address,
  }
}

export async function fetchClients(userId) {
  return withCache(
    `clients:${userId}`,
    async () => {
      const data = await api.get('/clients/')
      if (!Array.isArray(data)) {
        throw new Error('Format API invalide pour les clients (tableau attendu).')
      }
      return data.filter((c) => c.User_Id === userId).map(toFrontend)
    },
    TTL
  )
}

export async function createClient(userId, { name, email, company, adresse }) {
  const data = await api.post('/clients/', {
    user_id: userId,
    name,
    entreprise: company,
    email,
    adresse,
  })
  cacheInvalidate(`clients:${userId}`)
  return toFrontend(data)
}

export async function updateClient(clientId, { name, email, company, adresse }) {
  const data = await api.put(`/clients/${clientId}`, {
    name,
    entreprise: company,
    email,
    adresse,
  })
  cacheInvalidatePrefix('clients:')
  return toFrontend(data)
}

export async function deleteClient(clientId) {
  await api.delete(`/clients/${clientId}?confirme=true`)
  cacheInvalidatePrefix('clients:')
}

export async function exportClientsCsv() {
  await apiDownload('/clients/export/csv', 'clients.csv')
}
