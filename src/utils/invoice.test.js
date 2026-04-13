import { describe, expect, it } from 'vitest'
import { buildClientInvoiceMeta, computeInvoiceTotals, getInvoiceStatusLabel } from './invoice'

describe('invoice utils', () => {
  it('compute totals with TVA for standard regime', () => {
    const lines = [{ total: 100 }, { total: 59.5 }]
    expect(computeInvoiceTotals(lines, false)).toEqual({
      ht: 159.5,
      tva: 31.9,
      ttc: 191.4,
      total: 191.4,
    })
  })

  it('compute totals without TVA for auto-entrepreneur', () => {
    const lines = [{ total: 200 }]
    expect(computeInvoiceTotals(lines, true)).toEqual({
      ht: 200,
      tva: 0,
      ttc: 200,
      total: 200,
    })
  })

  it('build client invoice metadata from invoice list', () => {
    const invoices = [
      { id: 'inv-1', status: 'brouillon' },
      { id: 'inv-2', status: 'envoyee' },
      { id: 'inv-3', status: 'payee' },
    ]
    expect(buildClientInvoiceMeta(invoices)).toEqual({
      invoiceStatus: 'payee',
      invoiceCount: 3,
      invoiceItems: [
        { id: 'inv-1', status: 'brouillon' },
        { id: 'inv-2', status: 'envoyee' },
        { id: 'inv-3', status: 'payee' },
      ],
    })
  })

  it('returns fallback status label for unknown status', () => {
    expect(getInvoiceStatusLabel('custom-status')).toBe('custom-status')
    expect(getInvoiceStatusLabel(null)).toBe('Inconnu')
  })
})
