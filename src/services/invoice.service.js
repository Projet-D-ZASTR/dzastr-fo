import { api } from './api.service'
import {
  buildInvoiceItemIds,
  buildInvoiceLinesFromItemIds,
  inferInvoiceTotals,
} from '../utils/invoice-items'

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

export function saveInvoiceLines(invoiceId, { lines, number, isAutoEntrepreneur }) {
  const cache = getLinesCache()
  cache[invoiceId] = {
    lines,
    number,
    isAutoEntrepreneur,
    itemIds: buildInvoiceItemIds(lines),
  }
  setLinesCache(cache)
}

export function getInvoiceLines(invoiceId) {
  return getLinesCache()[invoiceId] ?? null
}

function buildFrontendInvoice(raw, services = []) {
  const cached = getInvoiceLines(raw.Facture_Id)
  const itemIds = cached?.itemIds ?? raw.item_ids ?? []
  const lines = cached?.lines ?? buildInvoiceLinesFromItemIds(itemIds, services)
  const number =
    cached?.number ??
    `FAC-${new Date().getFullYear()}-${String(raw.Facture_Id).padStart(6, '0')}`

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
  const data = await api.get(`/invoices/?User_Id=${userId}`)
  return data.map((invoice) => buildFrontendInvoice(invoice, services))
}

export async function createInvoice({ userId, clientId, lines, ttc, isAutoEntrepreneur, status }) {
  const today = new Date().toISOString().split('T')[0]
  const itemIds = buildInvoiceItemIds(lines)

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
  saveInvoiceLines(finalRaw.Facture_Id, { lines, number, isAutoEntrepreneur })

  return buildFrontendInvoice(finalRaw)
}

export async function updateInvoice({
  invoiceId,
  lines,
  ttc,
  isAutoEntrepreneur,
  status,
  number,
  existingItemIds = [],
}) {
  const backendStatus = FRONT_TO_BACKEND[status] ?? 'draft'
  const today = new Date().toISOString().split('T')[0]
  const itemIds = buildInvoiceItemIds(lines)

  const raw = await api.put(`/invoices/${invoiceId}`, {
    Facture_Prix: ttc,
    Facture_Date: today,
    Facture_State: backendStatus,
    item_ids: itemIds.length ? itemIds : existingItemIds,
  })

  saveInvoiceLines(invoiceId, { lines, number, isAutoEntrepreneur })

  return buildFrontendInvoice(raw)
}

export async function updateInvoiceStatus(invoiceId, frontendStatus) {
  const raw = await api.put(`/invoices/${invoiceId}`, {
    Facture_State: FRONT_TO_BACKEND[frontendStatus] ?? frontendStatus,
  })
  return buildFrontendInvoice(raw)
}

export async function deleteInvoice(invoiceId) {
  await api.delete(`/invoices/${invoiceId}`)
}
