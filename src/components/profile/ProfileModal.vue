<script setup>
import { reactive, ref, watch } from 'vue'
import BaseModal from '../ui/BaseModal.vue'
import { getLogo, uploadLogo, deleteLogo } from '../../services/logo.service'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'logo-changed'])

const form = reactive({
  User_Username: '',
  User_Email: '',
  User_Entreprise: '',
  User_Address: '',
  User_IsEntrepreneur: false,
  User_Password: '',
})

const logoDataUrl = ref(null)
const logoLoading = ref(false)
const logoError = ref('')

watch(
  () => [props.user, props.modelValue],
  async ([, open]) => {
    form.User_Username = props.user?.User_Username ?? ''
    form.User_Email = props.user?.User_Email ?? ''
    form.User_Entreprise = props.user?.User_Entreprise ?? ''
    form.User_Address = props.user?.User_Address ?? ''
    form.User_IsEntrepreneur = Boolean(props.user?.User_IsEntrepreneur)
    form.User_Password = ''
    if (open) {
      logoError.value = ''
      logoLoading.value = true
      try {
        logoDataUrl.value = await getLogo()
      } catch {
        logoDataUrl.value = null
      } finally {
        logoLoading.value = false
      }
    }
  },
  { immediate: true }
)

async function handleLogoUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  logoError.value = ''
  logoLoading.value = true
  try {
    await uploadLogo(file)
    logoDataUrl.value = await getLogo()
    emit('logo-changed')
  } catch (err) {
    logoError.value = err.message
  } finally {
    logoLoading.value = false
    event.target.value = ''
  }
}

async function handleLogoDelete() {
  logoError.value = ''
  logoLoading.value = true
  try {
    await deleteLogo()
    logoDataUrl.value = null
    emit('logo-changed')
  } catch (err) {
    logoError.value = err.message
  } finally {
    logoLoading.value = false
  }
}

function submit() {
  if (!form.User_Username.trim() || !form.User_Email.trim() || !form.User_Password.trim()) return
  emit('save', {
    User_Username: form.User_Username.trim(),
    User_Email: form.User_Email.trim(),
    User_Entreprise: form.User_Entreprise.trim(),
    User_Address: form.User_Address.trim(),
    User_IsEntrepreneur: form.User_IsEntrepreneur,
    User_Password: form.User_Password,
  })
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Mon profil"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <!-- Logo -->
      <div class="rounded-box border border-base-300 p-3">
        <p class="mb-2 text-sm font-semibold text-base-content/70">Logo</p>
        <div class="flex items-center gap-3">
          <div
            class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-box border border-base-300 bg-base-200"
          >
            <span v-if="logoLoading" class="loading loading-spinner loading-sm" />
            <img
              v-else-if="logoDataUrl"
              :src="logoDataUrl"
              alt="Logo"
              class="h-full w-full object-contain"
            />
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-base-content/25"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 6.75h.008v.008H6.75V6.75z"
              />
            </svg>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="btn btn-outline btn-xs cursor-pointer gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              {{ logoDataUrl ? 'Changer' : 'Ajouter' }}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                class="hidden"
                :disabled="logoLoading"
                @change="handleLogoUpload"
              />
            </label>
            <button
              v-if="logoDataUrl"
              type="button"
              class="btn btn-outline btn-error btn-xs gap-1"
              :disabled="logoLoading"
              @click="handleLogoDelete"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14.74 9l-.346 9m-4.008 0L7.58 9m9.566-3.75H4.454m14.592 0l-.001-1.73a1.5 1.5 0 00-1.356-1.499l-1.102-.16M17.046 5.25H6.954m10.092 0l-1.5-2.25H8.454l-1.5 2.25"
                />
              </svg>
              Supprimer
            </button>
            <p class="text-xs text-base-content/50">PNG, JPG, SVG, WebP — max 2 Mo</p>
          </div>
        </div>
        <p v-if="logoError" class="mt-2 text-xs text-error">{{ logoError }}</p>
      </div>

      <label class="form-control w-full">
        <span class="label-text text-sm">Nom</span>
        <input
          v-model="form.User_Username"
          type="text"
          required
          class="input input-bordered w-full"
        />
      </label>

      <label class="form-control w-full">
        <span class="label-text text-sm">Email</span>
        <input
          v-model="form.User_Email"
          type="email"
          required
          class="input input-bordered w-full"
        />
      </label>

      <label class="form-control w-full">
        <span class="label-text text-sm">Entreprise</span>
        <input v-model="form.User_Entreprise" type="text" class="input input-bordered w-full" />
      </label>

      <label class="form-control w-full">
        <span class="label-text text-sm">Adresse</span>
        <input v-model="form.User_Address" type="text" class="input input-bordered w-full" />
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-box border border-base-300 p-3"
      >
        <input
          v-model="form.User_IsEntrepreneur"
          type="checkbox"
          class="checkbox checkbox-secondary"
        />
        <span class="label-text">Auto-entrepreneur</span>
      </label>

      <label class="form-control w-full">
        <span class="label-text text-sm">Mot de passe (obligatoire pour enregistrer)</span>
        <input
          v-model="form.User_Password"
          type="password"
          minlength="6"
          required
          class="input input-bordered w-full"
        />
      </label>

      <p
        v-if="errorMessage"
        class="rounded-box border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
      >
        {{ errorMessage }}
      </p>

      <div class="modal-action mt-2">
        <button type="button" class="btn btn-ghost" @click="$emit('update:modelValue', false)">
          Annuler
        </button>
        <button type="submit" class="btn btn-secondary" :disabled="submitting">
          {{ submitting ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
