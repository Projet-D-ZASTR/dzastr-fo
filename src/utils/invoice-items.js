function roundAmount(value) {
  return Number(Number(value || 0).toFixed(2))
}

export function buildInvoiceItemIds(lines = []) {
  const itemIds = []

  for (const line of lines) {
    const serviceId = Number(line.serviceId)
    const hours = Math.max(0, Math.trunc(Number(line.hours) || 0))

    if (!Number.isInteger(serviceId) || serviceId <= 0 || hours === 0) {
      continue
    }

    for (let index = 0; index < hours; index += 1) {
      itemIds.push(serviceId)
    }
  }

  return itemIds
}

export function buildInvoiceLinesFromItemIds(itemIds = [], services = []) {
  const servicesById = new Map(services.map((service) => [Number(service.id), service]))
  const lines = []
  const linesByServiceId = new Map()

  for (const rawItemId of itemIds) {
    const serviceId = Number(rawItemId)
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      continue
    }

    let line = linesByServiceId.get(serviceId)
    if (!line) {
      const service = servicesById.get(serviceId)
      line = {
        id: `service-${serviceId}`,
        serviceId,
        title: service?.title ?? `Service #${serviceId}`,
        hourlyRate: Number(service?.hourlyRate ?? 0),
        hours: 0,
        total: 0,
      }
      linesByServiceId.set(serviceId, line)
      lines.push(line)
    }

    line.hours += 1
    line.total = roundAmount(line.hourlyRate * line.hours)
  }

  return lines
}

export function inferInvoiceTotals(rawTotal, lines = [], cachedIsAutoEntrepreneur = null) {
  const ht = roundAmount(lines.reduce((sum, line) => sum + Number(line.total ?? 0), 0))
  const ttc = roundAmount(rawTotal)

  if (!lines.length) {
    return {
      ht: ttc,
      tva: 0,
      ttc,
      total: ttc,
      isAutoEntrepreneur: cachedIsAutoEntrepreneur ?? false,
    }
  }

  if (typeof cachedIsAutoEntrepreneur === 'boolean') {
    const tva = cachedIsAutoEntrepreneur ? 0 : roundAmount(ht * 0.2)
    const total = roundAmount(ht + tva)

    return {
      ht,
      tva,
      ttc: total,
      total,
      isAutoEntrepreneur: cachedIsAutoEntrepreneur,
    }
  }

  const tva = Math.max(0, roundAmount(ttc - ht))

  return {
    ht,
    tva,
    ttc,
    total: ttc,
    isAutoEntrepreneur: tva === 0,
  }
}
