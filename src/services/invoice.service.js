import { api, apiDownload } from './api.service'
import { withCache, cacheInvalidatePrefix } from './cache.service'
import {
  buildInvoiceItemIds,
  buildInvoiceLinesFromItemIds,
  inferInvoiceTotals,
} from '../utils/invoice-items'

const TTL = 2 * 60 * 1000

const BACKEND_TO_FRONT = {
  draft: 'brouillon',
  sent: 'envoyee',
  paid: 'payee',
  cancelled: 'annulee',
}

const FRONT_TO_BACKEND = {
  brouillon: 'draft',
  envoyee: 'sent',
  payee: 'paid',
  annulee: 'cancelled',
}

const LINES_CACHE_KEY = 'dzastr_invoice_lines'

function normalizeItemIds(itemIds = []) {
  return itemIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
}

function haveSameItemCounts(left = [], right = []) {
  const leftNormalized = normalizeItemIds(left)
  const rightNormalized = normalizeItemIds(right)
  if (leftNormalized.length !== rightNormalized.length) return false

  const counts = new Map()
  for (const id of leftNormalized) counts.set(id, (counts.get(id) ?? 0) + 1)
  for (const id of rightNormalized) {
    const count = counts.get(id)
    if (!count) return false
    if (count === 1) counts.delete(id)
    else counts.set(id, count - 1)
  }
  return counts.size === 0
}

function getLinesCache() {
  try {
    return JSON.parse(sessionStorage.getItem(LINES_CACHE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function setLinesCache(cache) {
  sessionStorage.setItem(LINES_CACHE_KEY, JSON.stringify(cache))
}

export function saveInvoiceLines(invoiceId, { lines, number, isAutoEntrepreneur, services = [] }) {
  const cache = getLinesCache()
  cache[invoiceId] = {
    lines,
    number,
    isAutoEntrepreneur,
    itemIds: buildInvoiceItemIds(lines, services),
  }
  setLinesCache(cache)
}

export function getInvoiceLines(invoiceId) {
  return getLinesCache()[invoiceId] ?? null
}

function buildFrontendInvoice(raw, services = []) {
  const cached = getInvoiceLines(raw.Facture_Id)
  const rawItemIds = normalizeItemIds(raw.item_ids ?? [])
  const cachedItemIds = normalizeItemIds(
    cached?.itemIds ?? buildInvoiceItemIds(cached?.lines ?? [], services)
  )

  const shouldUseRawItemIds =
    rawItemIds.length > 0 && !haveSameItemCounts(cachedItemIds, rawItemIds)
  const itemIds = shouldUseRawItemIds
    ? rawItemIds
    : cachedItemIds.length
      ? cachedItemIds
      : rawItemIds

  const lines = shouldUseRawItemIds
    ? buildInvoiceLinesFromItemIds(rawItemIds, services)
    : (cached?.lines ?? buildInvoiceLinesFromItemIds(itemIds, services))
  const number =
    cached?.number ?? `FAC-${new Date().getFullYear()}-${String(raw.Facture_Id).padStart(6, '0')}`

  const totals = inferInvoiceTotals(raw.Facture_Prix, lines, cached?.isAutoEntrepreneur ?? null)

  return {
    id: raw.Facture_Id,
    number,
    date: raw.Facture_Date + 'T00:00:00.000Z',
    status: BACKEND_TO_FRONT[raw.Facture_State] ?? 'brouillon',
    clientId: raw.Client_Id,
    itemIds,
    lines,
    ht: totals.ht,
    tva: totals.tva,
    ttc: totals.ttc,
    total: totals.total,
    isAutoEntrepreneur: totals.isAutoEntrepreneur,
    isDraft: false,
  }
}

export async function fetchInvoices(userId, services = []) {
  return withCache(
    `invoices:${userId}`,
    async () => {
      const data = await api.get(`/invoices/?User_Id=${userId}`)
      if (!Array.isArray(data)) {
        throw new Error('Format API invalide pour les factures (tableau attendu).')
      }
      return data.map((invoice) => buildFrontendInvoice(invoice, services))
    },
    TTL
  )
}

export async function createInvoice({
  userId,
  clientId,
  lines,
  ttc,
  isAutoEntrepreneur,
  status,
  services = [],
}) {
  const today = new Date().toISOString().split('T')[0]
  const itemIds = buildInvoiceItemIds(lines, services)

  const raw = await api.post('/invoices/', {
    User_Id: userId,
    Client_Id: clientId,
    Facture_Prix: ttc,
    Facture_Date: today,
    item_ids: itemIds,
  })

  const backendStatus = FRONT_TO_BACKEND[status] ?? 'draft'
  let finalRaw = raw
  if (backendStatus !== 'draft') {
    finalRaw = await api.put(`/invoices/${raw.Facture_Id}`, {
      Facture_State: backendStatus,
    })
  }

  const number = `FAC-${new Date().getFullYear()}-${String(finalRaw.Facture_Id).padStart(6, '0')}`
  saveInvoiceLines(finalRaw.Facture_Id, { lines, number, isAutoEntrepreneur, services })
  cacheInvalidatePrefix('invoices:')

  return buildFrontendInvoice(finalRaw, services)
}

export async function updateInvoice({
  invoiceId,
  lines,
  ttc,
  isAutoEntrepreneur,
  status,
  number,
  existingItemIds = [],
  services = [],
}) {
  const backendStatus = FRONT_TO_BACKEND[status] ?? 'draft'
  const today = new Date().toISOString().split('T')[0]
  const itemIds = buildInvoiceItemIds(lines, services)

  const raw = await api.put(`/invoices/${invoiceId}`, {
    Facture_Prix: ttc,
    Facture_Date: today,
    Facture_State: backendStatus,
    item_ids: itemIds.length ? itemIds : existingItemIds,
  })

  saveInvoiceLines(invoiceId, { lines, number, isAutoEntrepreneur, services })
  cacheInvalidatePrefix('invoices:')

  return buildFrontendInvoice(raw, services)
}

export async function updateInvoiceStatus(invoiceId, frontendStatus, services = []) {
  const raw = await api.put(`/invoices/${invoiceId}`, {
    Facture_State: FRONT_TO_BACKEND[frontendStatus] ?? frontendStatus,
  })
  cacheInvalidatePrefix('invoices:')
  return buildFrontendInvoice(raw, services)
}

export async function deleteInvoice(invoiceId) {
  await api.delete(`/invoices/${invoiceId}`)
  cacheInvalidatePrefix('invoices:')
}

export async function exportInvoicesCsv() {
  await apiDownload('/invoices/export/csv', 'factures.csv')
}
