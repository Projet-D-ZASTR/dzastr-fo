import { api } from './api.service'

function toFrontend(s) {
  return {
    id: s.Service_Id,
    title: s.Service_Name,
    hourlyRate: Number(s.Service_PriceHour),
  }
}

export async function fetchServices() {
  const data = await api.get('/services/')
  return data.map(toFrontend)
}

export async function createService({ title, hourlyRate }) {
  const data = await api.post('/services/', {
    nom: title,
    prix_heure: hourlyRate,
  })
  return toFrontend(data)
}

export async function deleteService(serviceId) {
  await api.delete(`/services/${serviceId}?confirme=true`)
}
