export const INVOICE_STATUS_LABELS = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyee',
  payee: 'Payee',
  annulee: 'Annulee',
}

export function getInvoiceStatusLabel(status) {
  return INVOICE_STATUS_LABELS[status] ?? status ?? 'Inconnu'
}

export function computeInvoiceTotals(lines = [], isAutoEntrepreneur = false) {
  const ht = lines.reduce((sum, line) => sum + Number(line.total ?? 0), 0)
  const tva = isAutoEntrepreneur ? 0 : Number((ht * 0.2).toFixed(2))
  const ttc = Number((ht + tva).toFixed(2))
  return { ht, tva, ttc, total: ttc }
}

export function buildClientInvoiceMeta(invoices = []) {
  const latest = invoices[invoices.length - 1] ?? null
  return {
    invoiceStatus: latest?.status ?? null,
    invoiceCount: invoices.length,
    invoiceItems: invoices.map((invoice) => ({ id: invoice.id, status: invoice.status })),
  }
}
