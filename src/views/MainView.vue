<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { jsPDF } from 'jspdf'
import { buildClientInvoiceMeta, getInvoiceStatusLabel } from '../utils/invoice'
import { clearAuthSession } from '../services/auth.service'
import AppNavbar from '../components/navbar/AppNavbar.vue'
import AppFooter from '../components/footer/AppFooter.vue'
import ClientTable from '../components/client/ClientTable.vue'
import ClientModal from '../components/client/ClientModal.vue'
import PrestationModal from '../components/prestation/PrestationModal.vue'
import FacturePanel from '../components/facture/FacturePanel.vue'
import BaseModal from '../components/ui/BaseModal.vue'

const router = useRouter()

const showClientModal = ref(false)
const showServiceModal = ref(false)
const showDeleteClientModal = ref(false)

const selectedClientId = ref(null)
const selectedInvoiceId = ref(null)
const editingClient = ref(null)
const pendingDeleteClientId = ref(null)
const INVOICE_TEMPLATE = Object.freeze({
  id: '',
  number: 'FAC-YYYY-XXXXXX',
  date: '',
  status: 'brouillon',
  clientId: '',
  lines: [
    {
      title: 'Nom service',
      hours: 1,
      hourlyRate: 100,
      total: 100,
    },
  ],
  ht: 100,
  tva: 20,
  ttc: 120,
  total: 120,
  isAutoEntrepreneur: false,
})

const invoicesByClient = ref({
  c1: [
    {
      id: 'inv-c1-1',
      number: 'FAC-2026-100001',
      date: '2026-03-10T09:30:00.000Z',
      status: 'payee',
      clientId: 'c1',
      lines: [{ title: 'UX Audit', hours: 4, hourlyRate: 90, total: 360 }],
      ht: 360,
      tva: 72,
      ttc: 432,
      total: 432,
      isAutoEntrepreneur: false,
      isDraft: false,
    },
  ],
  c2: [
    {
      id: 'inv-c2-1',
      number: 'FAC-2026-100002',
      date: '2026-03-14T15:20:00.000Z',
      status: 'envoyee',
      clientId: 'c2',
      lines: [{ title: 'Frontend Dev', hours: 6.5, hourlyRate: 120, total: 780 }],
      ht: 780,
      tva: 156,
      ttc: 936,
      total: 936,
      isAutoEntrepreneur: false,
      isDraft: false,
    },
  ],
  c3: [
    {
      id: 'inv-c3-1',
      number: 'FAC-2026-100003',
      date: '2026-03-18T11:00:00.000Z',
      status: 'brouillon',
      clientId: 'c3',
      lines: [{ title: 'Maquette UI', hours: 3, hourlyRate: 95, total: 285 }],
      ht: 285,
      tva: 57,
      ttc: 342,
      total: 342,
      isAutoEntrepreneur: false,
      isDraft: false,
    },
  ],
})
const currentUser = ref({
  name: 'Utilisateur D-ZASTR',
  email: 'contact@dzastr.app',
})

const clients = ref([
  { id: 'c1', name: 'Alice Martin', email: 'alice@acme.fr', company: 'Acme', invoiceStatus: 'payee' },
  { id: 'c2', name: 'Paul Durant', email: 'paul@globex.fr', company: 'Globex', invoiceStatus: 'envoyee' },
  { id: 'c3', name: 'Sophie Bernard', email: 'sophie@initech.fr', company: 'Initech', invoiceStatus: 'brouillon' },
  { id: 'c4', name: 'Lucas Moreau', email: 'lucas@hooli.fr', company: 'Hooli', invoiceStatus: null },
  { id: 'c5', name: 'Camille Petit', email: 'camille@stark.fr', company: 'Stark Industries', invoiceStatus: 'annulee' },
  { id: 'c6', name: 'Nora Garcia', email: 'nora@wayne.fr', company: 'Wayne Enterprises', invoiceStatus: null },
  { id: 'c7', name: 'Hugo Laurent', email: 'hugo@umbrella.fr', company: 'Umbrella', invoiceStatus: null },
  { id: 'c8', name: 'Emma Robert', email: 'emma@wonka.fr', company: 'Wonka', invoiceStatus: 'envoyee' },
  { id: 'c9', name: 'Yanis Lefevre', email: 'yanis@cyberdyne.fr', company: 'Cyberdyne', invoiceStatus: null },
  { id: 'c10', name: 'Lea Fontaine', email: 'lea@soylent.fr', company: 'Soylent', invoiceStatus: null },
  { id: 'c11', name: 'Tom Renaud', email: 'tom@vehement.fr', company: 'Vehement Capital', invoiceStatus: 'payee' },
  { id: 'c12', name: 'Ines Dupuis', email: 'ines@bluth.fr', company: 'Bluth Company', invoiceStatus: null },
  { id: 'c13', name: 'Noah Marchand', email: 'noah@massive.fr', company: 'Massive Dynamic', invoiceStatus: null },
  { id: 'c14', name: 'Mila Caron', email: 'mila@oscorp.fr', company: 'Oscorp', invoiceStatus: 'envoyee' },
  { id: 'c15', name: 'Louis Perrin', email: 'louis@vought.fr', company: 'Vought', invoiceStatus: null },
  { id: 'c16', name: 'Jade Mercier', email: 'jade@aptive.fr', company: 'Aptive', invoiceStatus: 'brouillon' },
  { id: 'c17', name: 'Ethan Colin', email: 'ethan@nakatomi.fr', company: 'Nakatomi Trading', invoiceStatus: null },
  { id: 'c18', name: 'Manon Giraud', email: 'manon@momcorp.fr', company: 'MomCorp', invoiceStatus: 'payee' },
  { id: 'c19', name: 'Adam Roux', email: 'adam@octan.fr', company: 'Octan Corp', invoiceStatus: null },
  { id: 'c20', name: 'Sarah Lambert', email: 'sarah@lexcorp.fr', company: 'LexCorp', invoiceStatus: 'annulee' },
  { id: 'c21', name: 'Leo Schmitt', email: 'leo@blackmesa.fr', company: 'Black Mesa', invoiceStatus: null },
  { id: 'c22', name: 'Chloe Leclerc', email: 'chloe@capsule.fr', company: 'Capsule Corp', invoiceStatus: null },
  { id: 'c23', name: 'Mathis Faure', email: 'mathis@planet.fr', company: 'Planet Express', invoiceStatus: 'envoyee' },
  { id: 'c24', name: 'Zoé Vidal', email: 'zoe@monarch.fr', company: 'Monarch Solutions', invoiceStatus: null },
])

const services = ref([
  { id: 's1', title: 'UX Audit', hourlyRate: 90 },
  { id: 's2', title: 'Frontend Dev', hourlyRate: 120 },
])

const selectedClient = computed(() =>
  clients.value.find((client) => client.id === selectedClientId.value) ?? null,
)

const selectedClientInvoices = computed(() => {
  if (!selectedClientId.value) return []
  return invoicesByClient.value[selectedClientId.value] ?? []
})

const selectedInvoice = computed(() =>
  selectedClientInvoices.value.find((invoice) => invoice.id === selectedInvoiceId.value) ?? null,
)

const clientsWithInvoiceMeta = computed(() =>
  clients.value.map((client) => {
    const invoices = invoicesByClient.value[client.id] ?? []
    return {
      ...client,
      ...buildClientInvoiceMeta(invoices),
    }
  }),
)

function openCreateClient() {
  editingClient.value = null
  showClientModal.value = true
}

function openEditClient(client) {
  editingClient.value = client
  showClientModal.value = true
}

function saveClient(payload) {
  if (payload.id) {
    clients.value = clients.value.map((item) => (item.id === payload.id ? { ...item, ...payload } : item))
    return
  }

  clients.value.push({ ...payload, id: crypto.randomUUID() })
}

function deleteClient(clientId) {
  pendingDeleteClientId.value = clientId
  showDeleteClientModal.value = true
}

function confirmDeleteClient() {
  if (!pendingDeleteClientId.value) return
  const clientId = pendingDeleteClientId.value
  clients.value = clients.value.filter((item) => item.id !== clientId)
  pendingDeleteClientId.value = null
  showDeleteClientModal.value = false
}

function cancelDeleteClient() {
  pendingDeleteClientId.value = null
  showDeleteClientModal.value = false
}

function openInvoice(client) {
  selectedClientId.value = client.id
  const invoiceId = crypto.randomUUID()
  const now = new Date()
  const draftInvoice = {
    ...INVOICE_TEMPLATE,
    id: invoiceId,
    number: `FAC-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`,
    date: now.toISOString(),
    status: 'brouillon',
    clientId: client.id,
    lines: [],
    ht: 0,
    tva: 0,
    ttc: 0,
    total: 0,
    isDraft: true,
  }
  const existing = invoicesByClient.value[client.id] ?? []
  invoicesByClient.value = {
    ...invoicesByClient.value,
    [client.id]: [...existing, draftInvoice],
  }
  selectedInvoiceId.value = invoiceId
}

function viewInvoices(client, invoiceId = null) {
  const invoices = invoicesByClient.value[client.id] ?? []
  if (!invoices.length) return
  selectedClientId.value = client.id
  selectedInvoiceId.value = invoiceId ?? invoices[invoices.length - 1].id
}

function addService(service) {
  services.value.push(service)
}

function closeInvoicePanel() {
  selectedClientId.value = null
  selectedInvoiceId.value = null
}

function updateInvoiceStatus({ clientId, invoiceId, status }) {
  const invoices = invoicesByClient.value[clientId] ?? []
  invoicesByClient.value = {
    ...invoicesByClient.value,
    [clientId]: invoices.map((invoice) => (invoice.id === invoiceId ? { ...invoice, status } : invoice)),
  }
}

function saveInvoice({ clientId, invoiceId, status, lines, total, ht, tva, ttc, isAutoEntrepreneur }) {
  const invoices = invoicesByClient.value[clientId] ?? []
  invoicesByClient.value = {
    ...invoicesByClient.value,
    [clientId]: invoices.map((invoice) =>
      invoice.id === invoiceId
        ? {
            ...invoice,
            status,
            lines,
            total,
            ht,
            tva,
            ttc,
            isAutoEntrepreneur,
            isDraft: false,
            updatedAt: new Date().toISOString(),
          }
        : invoice,
    ),
  }
  selectedInvoiceId.value = invoiceId
}

function downloadInvoicePdf(clientId) {
  const client = clients.value.find((item) => item.id === clientId)
  const invoices = invoicesByClient.value[clientId] ?? []
  const invoice = invoices.find((item) => item.id === selectedInvoiceId.value) ?? invoices[invoices.length - 1]
  if (!client || !invoice) return

  const formatDate = (value) => new Date(value).toLocaleDateString('fr-FR')
  const formatAmount = (value) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const rightX = pageWidth - 20
  let y = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('FACTURE', 14, y)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`No ${invoice.number}`, rightX, y, { align: 'right' })
  y += 6
  doc.text(`Date: ${formatDate(invoice.date)}`, rightX, y, { align: 'right' })
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
  doc.text(currentUser.value.name, 110, y)
  y += 5
  doc.text(client.email, 14, y)
  doc.text(currentUser.value.email, 110, y)
  y += 5
  doc.text(client.company, 14, y)
  doc.text('D-ZASTR', 110, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.text(`Etat: ${getInvoiceStatusLabel(invoice.status)}`, 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(
    invoice.isAutoEntrepreneur ? 'Regime: Auto-entrepreneur (TVA 0%)' : 'Regime: TVA 20%',
    110,
    y,
  )
  y += 8

  doc.setFillColor(245, 245, 245)
  doc.rect(14, y, rightX - 14, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Service', 16, y + 5.3)
  doc.text('Heures', 108, y + 5.3)
  doc.text('Tarif', 135, y + 5.3)
  doc.text('Total', rightX - 2, y + 5.3, { align: 'right' })
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  ;(invoice.lines ?? []).forEach((line) => {
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
  })

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

  const filename = `facture-${invoice.number}.pdf`
  doc.save(filename)
}

function logout() {
  clearAuthSession()
  router.push('/auth')
}
</script>

<template>
  <main class="flex min-h-screen min-h-[100dvh] flex-col bg-base-100">
    <AppNavbar @open-service-modal="showServiceModal = true" @logout="logout" />

    <div class="flex min-h-0 flex-1 flex-col px-4 pb-6 pt-3 sm:px-6 sm:pb-8 sm:pt-4">
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
        />

        <aside
          v-if="selectedClient"
          class="w-full shrink-0 xl:h-full xl:w-[min(30rem,100%)]"
        >
          <FacturePanel
            :client="selectedClient"
            :services="services"
            :invoice-data="selectedInvoice"
            :invoice-template="INVOICE_TEMPLATE"
            @close="closeInvoicePanel"
            @save-invoice="saveInvoice"
            @update-status="updateInvoiceStatus"
            @download-pdf="downloadInvoicePdf"
          />
        </aside>
      </div>
    </div>

    <AppFooter />

    <ClientModal v-model="showClientModal" :client="editingClient" @save="saveClient" />
    <PrestationModal v-model="showServiceModal" @save="addService" />
    <BaseModal v-model="showDeleteClientModal" title="Confirmer la suppression">
      <div class="space-y-4">
        <p class="text-sm text-base-content/80">
          Cette action est irreversible. Voulez-vous vraiment supprimer ce client ?
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
  </main>
</template>
