import { api } from './api.service'

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
  const data = await api.get('/clients/')
  return data.filter((c) => c.User_Id === userId).map(toFrontend)
}

export async function createClient(userId, { name, email, company, adresse }) {
  const data = await api.post('/clients/', {
    user_id: userId,
    name,
    entreprise: company,
    email,
    adresse,
  })
  return toFrontend(data)
}

export async function updateClient(clientId, { name, email, company, adresse }) {
  const data = await api.put(`/clients/${clientId}`, {
    name,
    entreprise: company,
    email,
    adresse,
  })
  return toFrontend(data)
}

export async function deleteClient(clientId) {
  await api.delete(`/clients/${clientId}?confirme=true`)
}
