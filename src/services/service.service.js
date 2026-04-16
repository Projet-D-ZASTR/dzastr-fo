import { api } from './api.service'

function toFrontend(s) {
  return {
    id: s.Service_Id,
    title: s.Service_Name,
    hourlyRate: Number(s.Service_PriceHour),
  }
}

export async function fetchServices(userId) {
  const data = await api.get('/services/')
  if (!Array.isArray(data)) {
    throw new Error('Format API invalide pour les services (tableau attendu).')
  }
  if (userId != null) return data.filter((s) => s.Service_UserId === userId).map(toFrontend)
  return data.map(toFrontend)
}

export async function createService(userId, { title, hourlyRate }) {
  const data = await api.post('/services/', {
    Service_UserId: userId,
    Service_Name: title,
    Service_PriceHour: hourlyRate,
  })
  return toFrontend(data)
}

export async function updateService(serviceId, { title, hourlyRate }) {
  const data = await api.put(`/services/${serviceId}`, {
    Service_Name: title,
    Service_PriceHour: hourlyRate,
  })
  return toFrontend(data)
}

export async function deleteService(serviceId) {
  await api.delete(`/services/${serviceId}?confirme=true`)
}
