<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppNavbar from '../components/navbar/AppNavbar.vue'
import AppFooter from '../components/footer/AppFooter.vue'
import ProfileModal from '../components/profile/ProfileModal.vue'
import {
  clearAuthSession,
  getAuthUser,
  updateAuthUserProfile,
  updateAuthUserSession,
} from '../services/auth.service'
import { fetchClients } from '../services/client.service'
import { fetchInvoices } from '../services/invoice.service'
import { fetchServices } from '../services/service.service'
import { getInvoiceStatusLabel } from '../utils/invoice'

const router = useRouter()

const loading = ref(true)
const globalError = ref('')
const currentUser = ref(null)
const clients = ref([])
const invoices = ref([])
const showProfileModal = ref(false)
const profileSubmitting = ref(false)
const profileError = ref('')

const clientsById = computed(() => {
  const map = {}
  for (const client of clients.value) {
    map[client.id] = client
  }
  return map
})

function formatDate(value) {
  return new Date(value).toLocaleDateString('fr-FR')
}

function formatAmount(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    Number(value) || 0
  )
}

function goToCreateService() {
  router.push({
    path: '/services',
    query: { create: '1' },
  })
}

function openInvoice(invoice) {
  router.push({
    path: '/clients',
    query: {
      client: String(invoice.clientId),
      invoice: String(invoice.id),
    },
  })
}

async function loadInvoicesPage() {
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
      fetchServices(),
    ])
    const invoicesData = await fetchInvoices(user.User_Id, servicesData)

    clients.value = clientsData
    invoices.value = invoicesData
  } catch (err) {
    globalError.value = err.message
  } finally {
    loading.value = false
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
  } catch (err) {
    profileError.value = err.message
  } finally {
    profileSubmitting.value = false
  }
}

function logout() {
  clearAuthSession()
  router.push('/auth')
}

onMounted(loadInvoicesPage)
</script>

<template>
  <main class="flex min-h-screen min-h-[100dvh] flex-col bg-base-100">
    <AppNavbar
      @open-service-modal="goToCreateService"
      @open-profile="showProfileModal = true"
      @logout="logout"
    />

    <section v-if="loading" class="flex flex-1 items-center justify-center">
      <span class="loading loading-spinner loading-lg text-secondary" />
    </section>

    <section
      v-else-if="globalError"
      class="flex flex-1 flex-col items-center justify-center gap-4 px-4"
    >
      <div role="alert" class="alert alert-error max-w-lg shadow">
        <span class="text-sm">{{ globalError }}</span>
      </div>
      <button class="btn btn-outline btn-sm" @click="loadInvoicesPage">Réessayer</button>
    </section>

    <section v-else class="flex flex-1 flex-col px-4 pb-6 pt-4 sm:px-6 sm:pb-8">
      <div class="rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div class="border-b border-base-200 px-4 py-3 sm:px-6">
          <h1 class="text-xl font-bold text-base-content">Factures créées</h1>
          <p class="text-sm text-base-content/70">{{ invoices.length }} facture(s) trouvée(s)</p>
        </div>

        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Date</th>
                <th>Client</th>
                <th>État</th>
                <th>Lignes</th>
                <th class="text-right">HT</th>
                <th class="text-right">TVA</th>
                <th class="text-right">TTC</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!invoices.length">
                <td colspan="9" class="py-8 text-center text-base-content/60">
                  Aucune facture créée pour le moment.
                </td>
              </tr>
              <tr v-for="invoice in invoices" :key="invoice.id">
                <td class="font-semibold">{{ invoice.number }}</td>
                <td>{{ formatDate(invoice.date) }}</td>
                <td>{{ clientsById[invoice.clientId]?.name ?? `Client #${invoice.clientId}` }}</td>
                <td>{{ getInvoiceStatusLabel(invoice.status) }}</td>
                <td>{{ invoice.lines?.length ?? 0 }}</td>
                <td class="text-right">{{ formatAmount(invoice.ht) }}</td>
                <td class="text-right">{{ formatAmount(invoice.tva) }}</td>
                <td class="text-right font-bold">{{ formatAmount(invoice.ttc) }}</td>
                <td class="text-right">
                  <button
                    type="button"
                    class="btn btn-outline btn-xs"
                    @click="openInvoice(invoice)"
                  >
                    Voir facture
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <AppFooter />

    <ProfileModal
      v-model="showProfileModal"
      :user="currentUser"
      :submitting="profileSubmitting"
      :error-message="profileError"
      @save="saveProfile"
    />
  </main>
</template>
