<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppNavbar from '../components/navbar/AppNavbar.vue'
import ClientTable from '../components/client/ClientTable.vue'
import ClientModal from '../components/client/ClientModal.vue'
import PrestationModal from '../components/prestation/PrestationModal.vue'
import FactureModal from '../components/facture/FactureModal.vue'

const router = useRouter()

const showClientModal = ref(false)
const showServiceModal = ref(false)
const showInvoiceModal = ref(false)

const selectedClient = ref(null)
const editingClient = ref(null)

const clients = ref([
  { id: 'c1', name: 'Alice Martin', email: 'alice@acme.fr', company: 'Acme' },
  { id: 'c2', name: 'Paul Durant', email: 'paul@globex.fr', company: 'Globex' },
])

const services = ref([
  { id: 's1', title: 'UX Audit', hourlyRate: 90 },
  { id: 's2', title: 'Frontend Dev', hourlyRate: 120 },
])

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
  clients.value = clients.value.filter((item) => item.id !== clientId)
}

function openInvoice(client) {
  selectedClient.value = client
  showInvoiceModal.value = true
}

function addService(service) {
  services.value.push(service)
}

function generatePdf(invoice) {
  // Backend integration point for PDF generation.
  console.log('Invoice payload sent to backend:', invoice)
}

function logout() {
  router.push('/auth')
}
</script>

<template>
  <main class="min-h-screen bg-base-200 p-4 sm:p-6">
    <section class="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <AppNavbar
        :service-count="services.length"
        @open-service-modal="showServiceModal = true"
        @logout="logout"
      />

      <ClientTable
        :clients="clients"
        @add-client="openCreateClient"
        @edit-client="openEditClient"
        @delete-client="deleteClient"
        @create-invoice="openInvoice"
      />
    </section>

    <ClientModal v-model="showClientModal" :client="editingClient" @save="saveClient" />
    <PrestationModal v-model="showServiceModal" @save="addService" />
    <FactureModal
      v-model="showInvoiceModal"
      :client="selectedClient"
      :services="services"
      @generate-pdf="generatePdf"
    />
  </main>
</template>
