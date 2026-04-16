import { apiFetch } from './api.service'

export async function sendInvoiceEmail({ to, cc = [], subject, message, pdfBlob, filename }) {
  const formData = new FormData()
  to.forEach((email) => formData.append('to', email))
  cc.forEach((email) => formData.append('cc', email))
  formData.append('subject', subject)
  formData.append('message', message)
  formData.append('pdf', pdfBlob, filename)
  return apiFetch('POST', '/send-email/', formData)
}
