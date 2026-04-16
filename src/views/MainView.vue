<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { jsPDF } from 'jspdf'
import { buildClientInvoiceMeta, getInvoiceStatusLabel } from '../utils/invoice'
import {
  clearAuthSession,
  findAuthUserIdByEmail,
  getAuthUser,
  updateAuthUserProfile,
  updateAuthUserSession,
  verifyAuthSession,
} from '../services/auth.service'
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient as apiDeleteClient,
  exportClientsCsv,
} from '../services/client.service'
import { fetchServices, createService } from '../services/service.service'
import {
  fetchInvoices,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
} from '../services/invoice.service'
import { getLogo } from '../services/logo.service'
import { sendInvoiceEmail } from '../services/email.service'
import AppNavbar from '../components/navbar/AppNavbar.vue'
import AppFooter from '../components/footer/AppFooter.vue'
import ClientTable from '../components/client/ClientTable.vue'
import ClientModal from '../components/client/ClientModal.vue'
import PrestationModal from '../components/prestation/PrestationModal.vue'
import FacturePanel from '../components/facture/FacturePanel.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import ProfileModal from '../components/profile/ProfileModal.vue'
import EmailModal from '../components/facture/EmailModal.vue'

const router = useRouter()
const route = useRoute()

// ── UI state ─────────────────────────────────────────────────────────────────
const loading = ref(true)
const globalError = ref('')
const toastMessage = ref('')
const toastType = ref('info')
let toastTimer = null

const showClientModal = ref(false)
const showServiceModal = ref(false)
const showDeleteClientModal = ref(false)
const showProfileModal = ref(false)
const profileSubmitting = ref(false)
const profileError = ref('')

const selectedClientId = ref(null)
const selectedInvoiceId = ref(null)
const editingClient = ref(null)
const pendingDeleteClientId = ref(null)

const userLogoDataUrl = ref(null)

const showEmailModal = ref(false)
const emailSubmitting = ref(false)
const emailError = ref('')
const emailClientId = ref(null)

// ── Données ──────────────────────────────────────────────────────────────────
const currentUser = ref(null)
const clients = ref([])
const services = ref([])
const invoices = ref([])

const INVOICE_TEMPLATE = Object.freeze({
  id: '',
  number: 'FAC-YYYY-XXXXXX',
  date: '',
  status: 'brouillon',
  clientId: '',
  lines: [],
  ht: 0,
  tva: 0,
  ttc: 0,
  total: 0,
  isAutoEntrepreneur: false,
})

// ── Computed ──────────────────────────────────────────────────────────────────
const invoicesByClient = computed(() => {
  const map = {}
  for (const inv of invoices.value) {
    if (!map[inv.clientId]) map[inv.clientId] = []
    map[inv.clientId].push(inv)
  }
  return map
})

const clientsWithInvoiceMeta = computed(() =>
  clients.value.map((client) => ({
    ...client,
    ...buildClientInvoiceMeta(invoicesByClient.value[client.id] ?? []),
  }))
)

const selectedClient = computed(
  () => clients.value.find((c) => c.id === selectedClientId.value) ?? null
)

const selectedClientInvoices = computed(() =>
  selectedClientId.value != null ? (invoicesByClient.value[selectedClientId.value] ?? []) : []
)

const selectedInvoice = computed(
  () => selectedClientInvoices.value.find((inv) => inv.id === selectedInvoiceId.value) ?? null
)

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  toastMessage.value = message
  toastType.value = type
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 4500)
}

function getQueryValue(value) {
  if (Array.isArray(value)) return value[0]
  return value
}

function applyInvoiceSelectionFromQuery() {
  const clientQuery = getQueryValue(route.query.client)
  if (!clientQuery) return

  const targetClient = clients.value.find((client) => String(client.id) === String(clientQuery))
  if (!targetClient) return

  const clientInvs = invoicesByClient.value[targetClient.id] ?? []
  if (!clientInvs.length) return

  const invoiceQuery = getQueryValue(route.query.invoice)
  const targetInvoice = invoiceQuery
    ? clientInvs.find((invoice) => String(invoice.id) === String(invoiceQuery))
    : null

  selectedClientId.value = targetClient.id
  selectedInvoiceId.value = targetInvoice?.id ?? clientInvs[clientInvs.length - 1].id
}

// ── Chargement initial ────────────────────────────────────────────────────────
async function loadAll() {
  loading.value = true
  globalError.value = ''
  try {
    const user = getAuthUser()
    if (!user?.User_Id) {
      clearAuthSession()
      router.replace('/auth')
      return
    }
    currentUser.value = user

    const [clientsData, servicesData] = await Promise.all([
      fetchClients(user.User_Id),
      fetchServices(user.User_Id),
    ])
    const invoicesData = await fetchInvoices(user.User_Id, servicesData)

    clients.value = clientsData
    services.value = servicesData
    invoices.value = invoicesData
    applyInvoiceSelectionFromQuery()
    getLogo()
      .then((url) => {
        userLogoDataUrl.value = url
      })
      .catch(() => {})
  } catch (err) {
    globalError.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)

// ── Clients ───────────────────────────────────────────────────────────────────
function openCreateClient() {
  editingClient.value = null
  showClientModal.value = true
}

function openEditClient(client) {
  editingClient.value = client
  showClientModal.value = true
}

async function saveClient(payload) {
  try {
    if (payload.id) {
      const updated = await updateClient(payload.id, payload)
      clients.value = clients.value.map((c) => (c.id === payload.id ? updated : c))
      showToast('Client mis à jour.', 'success')
    } else {
      const verified = await verifyAuthSession().catch(() => null)
      const emailForLookup = currentUser.value?.User_Email ?? verified?.User_Email
      const fallbackUserId = await findAuthUserIdByEmail(emailForLookup).catch(() => null)

      const resolvedUserId = Number(
        fallbackUserId ?? verified?.User_Id ?? currentUser.value?.User_Id
      )
      if (!Number.isInteger(resolvedUserId) || resolvedUserId <= 0) {
        throw new Error("Impossible de déterminer l'utilisateur connecté.")
      }

      currentUser.value = {
        ...currentUser.value,
        ...(verified ?? {}),
        User_Id: resolvedUserId,
      }
      updateAuthUserSession(currentUser.value)

      const created = await createClient(resolvedUserId, payload)
      clients.value.push(created)
      showToast('Client créé.', 'success')
    }
  } catch (err) {
    const message = String(err?.message || '')
    if (message.includes('(500)')) {
      showToast(
        `Création client impossible (500). User_Id utilisé: ${currentUser.value?.User_Id ?? 'N/A'}.`,
        'error'
      )
      return
    }
    showToast(message, 'error')
  }
}

function deleteClient(clientId) {
  pendingDeleteClientId.value = clientId
  showDeleteClientModal.value = true
}

async function confirmDeleteClient() {
  if (!pendingDeleteClientId.value) return
  const clientId = pendingDeleteClientId.value
  try {
    await apiDeleteClient(clientId)
    if (selectedClientId.value === clientId) {
      selectedClientId.value = null
      selectedInvoiceId.value = null
    }
    invoices.value = invoices.value.filter((inv) => inv.clientId !== clientId)
    clients.value = clients.value.filter((c) => c.id !== clientId)
    showToast('Client supprimé.', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  } finally {
    pendingDeleteClientId.value = null
    showDeleteClientModal.value = false
  }
}

function cancelDeleteClient() {
  pendingDeleteClientId.value = null
  showDeleteClientModal.value = false
}

// ── Services ──────────────────────────────────────────────────────────────────
async function addService({ title, hourlyRate }) {
  try {
    const created = await createService(currentUser.value?.User_Id, { title, hourlyRate })
    services.value.push(created)
    showToast('Service créé.', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function saveProfile(payload) {
  const userId = currentUser.value?.User_Id
  if (!userId) return
  profileSubmitting.value = true
  profileError.value = ''
  try {
    const updated = await updateAuthUserProfile(userId, {
      ...payload,
      User_Role: currentUser.value?.User_Role ?? 'user',
    })
    currentUser.value = updated
    updateAuthUserSession(updated)
    showProfileModal.value = false
    showToast('Profil mis à jour.', 'success')
  } catch (err) {
    profileError.value = err.message
  } finally {
    profileSubmitting.value = false
  }
}

// ── Factures ──────────────────────────────────────────────────────────────────
function openInvoice(client) {
  selectedClientId.value = client.id
  const draftId = `draft-${crypto.randomUUID()}`
  const now = new Date()
  const draft = {
    ...INVOICE_TEMPLATE,
    id: draftId,
    number: `FAC-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`,
    date: now.toISOString(),
    clientId: client.id,
    isDraft: true,
    _isNew: true,
  }
  invoices.value.push(draft)
  selectedInvoiceId.value = draftId
}

function viewInvoices(client, invoiceId = null) {
  const clientInvs = invoicesByClient.value[client.id] ?? []
  if (!clientInvs.length) return
  selectedClientId.value = client.id
  selectedInvoiceId.value = invoiceId ?? clientInvs[clientInvs.length - 1].id
}

function closeInvoicePanel() {
  invoices.value = invoices.value.filter((inv) => !inv._isNew)
  selectedClientId.value = null
  selectedInvoiceId.value = null
}

async function saveInvoice({
  clientId,
  invoiceId,
  status,
  lines,
  ht,
  tva,
  ttc,
  isAutoEntrepreneur,
}) {
  try {
    const userId = currentUser.value?.User_Id
    if (!userId) return
    const existingInv = invoices.value.find((i) => i.id === invoiceId)

    if (existingInv?._isNew) {
      const saved = await createInvoice({
        userId,
        clientId,
        lines,
        ht,
        tva,
        ttc,
        isAutoEntrepreneur,
        status,
        services: services.value,
      })
      invoices.value = invoices.value.filter((i) => i.id !== invoiceId)
      invoices.value.push(saved)
      selectedInvoiceId.value = saved.id
    } else {
      const saved = await updateInvoice({
        invoiceId,
        lines,
        ht,
        tva,
        ttc,
        isAutoEntrepreneur,
        status,
        number: existingInv?.number,
        existingItemIds: existingInv?.itemIds ?? [],
        services: services.value,
      })
      invoices.value = invoices.value.map((i) => (i.id === invoiceId ? saved : i))
    }
    showToast('Facture enregistrée.', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function handleUpdateStatus({ clientId, invoiceId, status }) {
  try {
    const inv = invoices.value.find((i) => i.id === invoiceId)
    if (inv?._isNew) {
      invoices.value = invoices.value.map((i) => (i.id === invoiceId ? { ...i, status } : i))
      return
    }
    const updated = await updateInvoiceStatus(invoiceId, status, services.value)
    invoices.value = invoices.value.map((i) => (i.id === invoiceId ? { ...i, ...updated } : i))
    showToast('Statut mis à jour.', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// ── PDF ───────────────────────────────────────────────────────────────────────
function buildInvoicePdfDoc(clientId) {
  const client = clients.value.find((c) => c.id === clientId)
  const invoiceList = invoicesByClient.value[clientId] ?? []
  const invoice =
    invoiceList.find((i) => i.id === selectedInvoiceId.value) ?? invoiceList[invoiceList.length - 1]
  if (!client || !invoice) return

  const user = currentUser.value
  const freelancerName = user?.User_Username ?? user?.User_Email ?? 'Prestataire'
  const freelancerEmail = user?.User_Email ?? ''
  const freelancerCompany = user?.User_Entreprise ?? 'D-ZASTR'

  const formatDate = (value) => new Date(value).toLocaleDateString('fr-FR')
  const formatAmount = (value) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
      Number(value) || 0
    )

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const rightX = pageWidth - 20
  let y = 18

  if (userLogoDataUrl.value) {
    try {
      const img = new Image()
      img.src = userLogoDataUrl.value
      const maxW = 50
      const maxH = 22
      const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 2
      let logoW = maxW
      let logoH = logoW / ratio
      if (logoH > maxH) {
        logoH = maxH
        logoW = logoH * ratio
      }
      doc.addImage(userLogoDataUrl.value, 14, y - 4, logoW, logoH)
      y += logoH + 4
    } catch {
      // logo ignoré si format non supporté
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('FACTURE', 14, y)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`No ${invoice.number}`, rightX, y, { align: 'right' })
  y += 6
  doc.text(`Date : ${formatDate(invoice.date)}`, rightX, y, { align: 'right' })
  y += 10

  doc.setDrawColor(220, 220, 220)
  doc.line(14, y, rightX, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.text('Client', 14, y)
  doc.text('Prestataire', 110, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.text(client.name, 14, y)
  doc.text(freelancerName, 110, y)
  y += 5
  doc.text(client.email, 14, y)
  doc.text(freelancerEmail, 110, y)
  y += 5
  if (client.company) doc.text(client.company, 14, y)
  doc.text(freelancerCompany, 110, y)
  y += 5
  if (client.adresse) {
    doc.text(client.adresse, 14, y)
    y += 5
  }
  y += 5

  doc.setFont('helvetica', 'bold')
  doc.text(`État : ${getInvoiceStatusLabel(invoice.status)}`, 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(
    invoice.isAutoEntrepreneur ? 'Régime : Auto-entrepreneur (TVA 0%)' : 'Régime : TVA 20%',
    110,
    y
  )
  y += 8

  doc.setFillColor(245, 245, 245)
  doc.rect(14, y, rightX - 14, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Service', 16, y + 5.3)
  doc.text('Heures', 108, y + 5.3)
  doc.text('Tarif/h', 135, y + 5.3)
  doc.text('Total', rightX - 2, y + 5.3, { align: 'right' })
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const lines = invoice.lines ?? []
  if (lines.length) {
    for (const line of lines) {
      const lineTotal = Number(line.total ?? Number(line.hours) * Number(line.hourlyRate))
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      doc.text(String(line.title ?? '-'), 16, y)
      doc.text(String(line.hours ?? 0), 108, y)
      doc.text(formatAmount(line.hourlyRate ?? 0), 135, y)
      doc.text(formatAmount(lineTotal), rightX - 2, y, { align: 'right' })
      y += 6
    }
  } else {
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text('Détail des lignes non disponible (non persisté côté serveur).', 16, y)
    doc.setTextColor(0)
    doc.setFontSize(9)
    y += 6
  }

  y += 4
  doc.line(110, y, rightX, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('HT', 130, y)
  doc.text(formatAmount(invoice.ht ?? invoice.total), rightX, y, { align: 'right' })
  y += 6
  doc.text('TVA', 130, y)
  doc.text(formatAmount(invoice.tva ?? 0), rightX, y, { align: 'right' })
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text('TTC', 130, y)
  doc.text(formatAmount(invoice.ttc ?? invoice.total), rightX, y, { align: 'right' })

  return { doc, invoice }
}

function downloadInvoicePdf(clientId) {
  const result = buildInvoicePdfDoc(clientId)
  if (!result) return
  const { doc, invoice } = result
  doc.save(`facture-${invoice.number}.pdf`)
}

// ── Email ─────────────────────────────────────────────────────────────────────
function openEmailModal(clientId) {
  emailClientId.value = clientId
  emailError.value = ''
  showEmailModal.value = true
}

async function handleSendEmail({ to, cc, subject, message }) {
  const result = buildInvoicePdfDoc(emailClientId.value)
  if (!result) return
  const { doc, invoice } = result
  emailSubmitting.value = true
  emailError.value = ''
  try {
    const pdfBlob = doc.output('blob')
    await sendInvoiceEmail({
      to,
      cc,
      subject,
      message,
      pdfBlob,
      filename: `facture-${invoice.number}.pdf`,
    })
    showEmailModal.value = false
    showToast('Email envoyé avec succès.', 'success')
  } catch (err) {
    emailError.value = err.message
  } finally {
    emailSubmitting.value = false
  }
}

// ── Export CSV ────────────────────────────────────────────────────────────────
async function handleExportCsv() {
  try {
    await exportClientsCsv()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function logout() {
  clearAuthSession()
  router.push('/auth')
}
</script>

<template>
  <main class="flex min-h-screen min-h-[100dvh] flex-col bg-base-100">
    <AppNavbar
      @open-service-modal="showServiceModal = true"
      @open-profile="showProfileModal = true"
      @logout="logout"
    />

    <div v-if="loading" class="flex flex-1 items-center justify-center">
      <span class="loading loading-spinner loading-lg text-secondary" />
    </div>

    <div
      v-else-if="globalError"
      class="flex flex-1 flex-col items-center justify-center gap-4 px-4"
    >
      <div role="alert" class="alert alert-error max-w-lg shadow">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span class="text-sm">{{ globalError }}</span>
      </div>
      <button class="btn btn-outline btn-sm" @click="loadAll">Réessayer</button>
    </div>

    <div v-else class="flex min-h-0 flex-1 flex-col px-4 pb-6 pt-3 sm:px-6 sm:pb-8 sm:pt-4">
      <div
        class="flex min-h-0 w-full flex-1 flex-col gap-4 sm:gap-5 xl:flex-row xl:items-stretch xl:gap-6"
      >
        <ClientTable
          class="min-w-0 flex-1"
          :clients="clientsWithInvoiceMeta"
          @add-client="openCreateClient"
          @edit-client="openEditClient"
          @delete-client="deleteClient"
          @create-invoice="openInvoice"
          @view-invoices="viewInvoices"
          @export-csv="handleExportCsv"
        />

        <aside v-if="selectedClient" class="w-full shrink-0 xl:h-full xl:w-[min(30rem,100%)]">
          <FacturePanel
            :client="selectedClient"
            :services="services"
            :invoice-data="selectedInvoice"
            :invoice-template="INVOICE_TEMPLATE"
            @close="closeInvoicePanel"
            @save-invoice="saveInvoice"
            @update-status="handleUpdateStatus"
            @download-pdf="downloadInvoicePdf"
            @send-email="openEmailModal"
          />
        </aside>
      </div>
    </div>

    <AppFooter />

    <ClientModal v-model="showClientModal" :client="editingClient" @save="saveClient" />
    <PrestationModal v-model="showServiceModal" @save="addService" />
    <ProfileModal
      v-model="showProfileModal"
      :user="currentUser"
      :submitting="profileSubmitting"
      :error-message="profileError"
      @save="saveProfile"
      @logo-changed="
        getLogo()
          .then((url) => {
            userLogoDataUrl.value = url
          })
          .catch(() => {})
      "
    />
    <EmailModal
      v-model="showEmailModal"
      :client-email="clients.find((c) => c.id === emailClientId)?.email ?? ''"
      :invoice-number="
        (invoicesByClient[emailClientId] ?? []).find((i) => i.id === selectedInvoiceId)?.number ??
        ''
      "
      :submitting="emailSubmitting"
      :error-message="emailError"
      @send="handleSendEmail"
    />
    <BaseModal v-model="showDeleteClientModal" title="Confirmer la suppression">
      <div class="space-y-4">
        <p class="text-sm text-base-content/80">
          Cette action est irréversible. Voulez-vous vraiment supprimer ce client ?
        </p>
        <div class="modal-action mt-1 flex items-center justify-end gap-2">
          <button type="button" class="btn btn-ghost btn-sm" @click="cancelDeleteClient">
            Annuler
          </button>
          <button type="button" class="btn btn-error btn-sm" @click="confirmDeleteClient">
            Supprimer
          </button>
        </div>
      </div>
    </BaseModal>

    <div v-if="toastMessage" class="toast toast-end toast-bottom z-50">
      <div
        class="alert shadow-md"
        :class="{
          'alert-success': toastType === 'success',
          'alert-error': toastType === 'error',
          'alert-info': toastType === 'info',
        }"
      >
        <span class="text-sm">{{ toastMessage }}</span>
      </div>
    </div>
  </main>
</template>
