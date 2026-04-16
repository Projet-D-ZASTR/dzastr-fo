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

const router = useRouter()

const loading = ref(true)
const globalError = ref('')
const currentUser = ref(null)
const clients = ref([])
const invoices = ref([])

const showProfileModal = ref(false)
const profileSubmitting = ref(false)
const profileError = ref('')

const STATUS_ORDER = ['envoyee', 'payee', 'brouillon', 'annulee']
const STATUS_META = {
  envoyee: { label: 'Envoyées', tone: 'text-info', progress: 'progress-info' },
  payee: { label: 'Payées', tone: 'text-success', progress: 'progress-success' },
  brouillon: { label: 'Brouillons', tone: 'text-warning', progress: 'progress-warning' },
  annulee: { label: 'Annulées', tone: 'text-error', progress: 'progress-error' },
}

const persistedInvoices = computed(() =>
  invoices.value.filter((invoice) => Number.isInteger(Number(invoice.id)) && !invoice._isNew)
)

const revenueInvoices = computed(() =>
  persistedInvoices.value.filter((invoice) => invoice.status !== 'annulee')
)

const dashboardTotalRevenue = computed(() =>
  revenueInvoices.value.reduce((sum, invoice) => sum + Number(invoice.ttc ?? invoice.total ?? 0), 0)
)

const totalAmountAllStatuses = computed(() =>
  persistedInvoices.value.reduce(
    (sum, invoice) => sum + Number(invoice.ttc ?? invoice.total ?? 0),
    0
  )
)

const totalCount = computed(() => persistedInvoices.value.length)

const dashboardRevenueByClient = computed(() => {
  const totalsByClient = new Map()

  for (const invoice of revenueInvoices.value) {
    const current = totalsByClient.get(invoice.clientId) ?? 0
    totalsByClient.set(invoice.clientId, current + Number(invoice.ttc ?? invoice.total ?? 0))
  }

  return Array.from(totalsByClient.entries())
    .map(([clientId, revenue]) => {
      const client = clients.value.find((c) => c.id === clientId)
      return {
        clientId,
        clientName: client?.name ?? `Client #${clientId}`,
        revenue,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
})

const dashboardRevenueByMonth = computed(() => {
  const totalsByMonth = new Map()

  for (const invoice of revenueInvoices.value) {
    const date = new Date(invoice.date)
    if (Number.isNaN(date.getTime())) continue
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const current = totalsByMonth.get(monthKey) ?? 0
    totalsByMonth.set(monthKey, current + Number(invoice.ttc ?? invoice.total ?? 0))
  }

  return Array.from(totalsByMonth.entries())
    .map(([monthKey, revenue]) => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      revenue,
    }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
})

const maxClientRevenue = computed(() =>
  dashboardRevenueByClient.value.length
    ? Math.max(...dashboardRevenueByClient.value.map((row) => row.revenue))
    : 0
)

const maxMonthRevenue = computed(() =>
  dashboardRevenueByMonth.value.length
    ? Math.max(...dashboardRevenueByMonth.value.map((row) => row.revenue))
    : 0
)

const rowsByStatus = computed(() =>
  STATUS_ORDER.map((status) => {
    const items = persistedInvoices.value.filter((invoice) => invoice.status === status)
    const amount = items.reduce(
      (sum, invoice) => sum + Number(invoice.ttc ?? invoice.total ?? 0),
      0
    )
    const count = items.length
    return {
      status,
      label: STATUS_META[status].label,
      tone: STATUS_META[status].tone,
      progress: STATUS_META[status].progress,
      count,
      amount,
      countRatio: totalCount.value ? Math.round((count / totalCount.value) * 100) : 0,
      amountRatio: totalAmountAllStatuses.value
        ? Math.round((amount / totalAmountAllStatuses.value) * 100)
        : 0,
    }
  })
)

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    Number(value) || 0
  )
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey
  return new Date(year, month - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

async function loadData() {
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

    const [clientsData, services] = await Promise.all([fetchClients(user.User_Id), fetchServices(user.User_Id)])
    clients.value = clientsData
    invoices.value = await fetchInvoices(user.User_Id, services)
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

function goToCreateService() {
  router.push({
    path: '/services',
    query: { create: '1' },
  })
}

function logout() {
  clearAuthSession()
  router.push('/auth')
}

onMounted(loadData)
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
      <button class="btn btn-outline btn-sm" @click="loadData">Réessayer</button>
    </section>

    <section v-else class="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 sm:px-6 sm:pb-8">
      <div class="grid gap-4 md:grid-cols-3">
        <article>
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">
            Nombre total de factures
          </p>
          <p class="mt-2 text-3xl font-extrabold text-base-content">{{ totalCount }}</p>
        </article>
        <article>
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">
            Chiffre d'affaires total
          </p>
          <p class="mt-2 text-3xl font-extrabold text-secondary">
            {{ formatCurrency(dashboardTotalRevenue) }}
          </p>
          <p class="mt-1 text-xs text-base-content/60">Factures non annulées</p>
        </article>
        <article>
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">
            Montant tous états
          </p>
          <p class="mt-2 text-3xl font-extrabold text-base-content">
            {{ formatCurrency(totalAmountAllStatuses) }}
          </p>
          <p class="mt-1 text-xs text-base-content/60">Inclut les factures annulées</p>
        </article>
      </div>

      <section class="">
        <div class="mb-3 flex items-center justify-between gap-3">
          <h2 class="text-sm font-bold uppercase tracking-wide text-base-content/70">
            Répartition par état des factures
          </h2>
          <span class="text-xs text-base-content/60">{{ rowsByStatus.length }} états</span>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="row in rowsByStatus"
            :key="row.status"
            class="rounded-box border border-base-300 bg-base-100/60 p-4"
          >
            <div class="mb-2 flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                  État
                </p>
                <p class="text-lg font-bold" :class="row.tone">{{ row.label }}</p>
              </div>
              <div class="text-right">
                <p class="text-[11px] text-base-content/60">Factures</p>
                <p class="text-2xl font-black text-base-content">{{ row.count }}</p>
              </div>
            </div>

            <p class="text-[11px] uppercase tracking-wide text-base-content/55">
              Montant lié à l'état
            </p>
            <p class="mt-1 text-3xl font-black leading-none" :class="row.tone">
              {{ formatCurrency(row.amount) }}
            </p>

            <div class="mt-4 space-y-2">
              <div class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-base-content/70">Part du volume</span>
                  <span class="font-semibold">{{ row.countRatio }}%</span>
                </div>
                <progress
                  class="progress h-2 w-full"
                  :class="row.progress"
                  :value="row.countRatio"
                  max="100"
                />
              </div>
              <div class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-base-content/70">Part du montant global</span>
                  <span class="font-semibold">{{ row.amountRatio }}%</span>
                </div>
                <progress
                  class="progress h-2 w-full"
                  :class="row.progress"
                  :value="row.amountRatio"
                  max="100"
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      <div class="grid gap-4 xl:grid-cols-2">
        <article class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="text-sm font-bold uppercase tracking-wide text-base-content/70">
              Chiffre d'affaires par mois
            </h3>
            <span class="text-xs text-base-content/60"
              >{{ dashboardRevenueByMonth.length }} mois</span
            >
          </div>
          <div v-if="dashboardRevenueByMonth.length" class="space-y-2">
            <div v-for="row in dashboardRevenueByMonth" :key="row.monthKey" class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-base-content/80">{{ row.monthLabel }}</span>
                <span class="font-semibold text-base-content">{{
                  formatCurrency(row.revenue)
                }}</span>
              </div>
              <progress
                class="progress progress-secondary h-2 w-full"
                :value="row.revenue"
                :max="maxMonthRevenue || 1"
              />
            </div>
          </div>
          <p v-else class="text-sm text-base-content/60">Aucune donnée mensuelle disponible.</p>
        </article>

        <article class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="text-sm font-bold uppercase tracking-wide text-base-content/70">
              Chiffre d'affaires par client
            </h3>
            <span class="text-xs text-base-content/60"
              >{{ dashboardRevenueByClient.length }} client(s)</span
            >
          </div>
          <div v-if="dashboardRevenueByClient.length" class="space-y-2">
            <div v-for="row in dashboardRevenueByClient" :key="row.clientId" class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-base-content/80">{{ row.clientName }}</span>
                <span class="font-semibold text-base-content">{{
                  formatCurrency(row.revenue)
                }}</span>
              </div>
              <progress
                class="progress progress-secondary h-2 w-full"
                :value="row.revenue"
                :max="maxClientRevenue || 1"
              />
            </div>
          </div>
          <p v-else class="text-sm text-base-content/60">Aucune donnée client disponible.</p>
        </article>
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
