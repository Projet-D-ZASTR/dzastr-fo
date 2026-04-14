import { describe, expect, it } from 'vitest'
import {
  buildInvoiceItemIds,
  buildInvoiceLinesFromItemIds,
  inferInvoiceTotals,
} from './invoice-items'

describe('invoice item mapping', () => {
  it('expands service ids according to line hours', () => {
    expect(
      buildInvoiceItemIds([
        { serviceId: 3, hours: 2 },
        { serviceId: 8, hours: 1 },
      ]),
    ).toEqual([3, 3, 8])
  })

  it('rebuilds grouped lines from MO item ids and services', () => {
    const services = [
      { id: 3, title: 'Design', hourlyRate: 80 },
      { id: 8, title: 'Dev', hourlyRate: 95 },
    ]

    expect(buildInvoiceLinesFromItemIds([3, 8, 3], services)).toEqual([
      {
        id: 'service-3',
        serviceId: 3,
        title: 'Design',
        hourlyRate: 80,
        hours: 2,
        total: 160,
      },
      {
        id: 'service-8',
        serviceId: 8,
        title: 'Dev',
        hourlyRate: 95,
        hours: 1,
        total: 95,
      },
    ])
  })

  it('infers auto-entrepreneur totals when persisted total equals HT', () => {
    expect(inferInvoiceTotals(200, [{ total: 200 }], null)).toEqual({
      ht: 200,
      tva: 0,
      ttc: 200,
      total: 200,
      isAutoEntrepreneur: true,
    })
  })

  it('keeps standard TVA when persisted total includes VAT', () => {
    expect(inferInvoiceTotals(240, [{ total: 200 }], null)).toEqual({
      ht: 200,
      tva: 40,
      ttc: 240,
      total: 240,
      isAutoEntrepreneur: false,
    })
  })
})
