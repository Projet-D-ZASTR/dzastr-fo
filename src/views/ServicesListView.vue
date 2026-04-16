<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavbar from '../components/navbar/AppNavbar.vue'
import AppFooter from '../components/footer/AppFooter.vue'
import PrestationModal from '../components/prestation/PrestationModal.vue'
import ProfileModal from '../components/profile/ProfileModal.vue'
import {
  clearAuthSession,
  getAuthUser,
  updateAuthUserProfile,
  updateAuthUserSession,
} from '../services/auth.service'
import { createService, fetchServices } from '../services/service.service'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const globalError = ref('')
const services = ref([])
const currentUser = ref(null)
const showServiceModal = ref(false)
const showProfileModal = ref(false)
const profileSubmitting = ref(false)
const profileError = ref('')
const toastMessage = ref('')
const toastType = ref('info')
let toastTimer = null

function showToast(message, type = 'info') {
  toastMessage.value = message
  toastType.value = type
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 4500)
}

function formatAmount(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    Number(value) || 0
  )
}

async function loadServicesPage() {
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
    services.value = await fetchServices(user.User_Id)
    if (route.query.create === '1') {
      showServiceModal.value = true
    }
  } catch (err) {
    globalError.value = err.message
  } finally {
    loading.value = false
  }
}

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

function logout() {
  clearAuthSession()
  router.push('/auth')
}

onMounted(loadServicesPage)
</script>

<template>
  <main class="flex min-h-screen min-h-[100dvh] flex-col bg-base-100">
    <AppNavbar
      @open-service-modal="showServiceModal = true"
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
      <button class="btn btn-outline btn-sm" @click="loadServicesPage">Réessayer</button>
    </section>

    <section v-else class="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4 sm:px-6 sm:pb-8">
      <div class="">
        <h1 class="text-xl font-bold text-base-content">Services créés</h1>
        <p class="text-sm text-base-content/70">{{ services.length }} service(s) disponibles</p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="service in services"
          :key="service.id"
          class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm"
        >
          <p class="text-xs uppercase tracking-wide text-base-content/60">
            Service #{{ service.id }}
          </p>
          <h2 class="mt-1 text-lg font-bold text-base-content">{{ service.title }}</h2>
          <p class="mt-3 text-sm text-base-content/70">Tarif horaire</p>
          <p class="text-xl font-extrabold text-secondary">
            {{ formatAmount(service.hourlyRate) }} / h
          </p>
        </article>
      </div>

      <p
        v-if="!services.length"
        class="rounded-box border border-base-300 bg-base-100 px-4 py-8 text-center text-sm text-base-content/60 shadow-sm"
      >
        Aucun service créé pour le moment.
      </p>
    </section>

    <AppFooter />

    <PrestationModal v-model="showServiceModal" @save="addService" />
    <ProfileModal
      v-model="showProfileModal"
      :user="currentUser"
      :submitting="profileSubmitting"
      :error-message="profileError"
      @save="saveProfile"
    />

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
