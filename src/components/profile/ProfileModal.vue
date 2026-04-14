<script setup>
import { reactive, watch } from 'vue'
import BaseModal from '../ui/BaseModal.vue'

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

const emit = defineEmits(['update:modelValue', 'save'])

const form = reactive({
  User_Username: '',
  User_Email: '',
  User_Entreprise: '',
  User_Address: '',
  User_IsEntrepreneur: false,
  User_Password: '',
})

watch(
  () => [props.user, props.modelValue],
  () => {
    form.User_Username = props.user?.User_Username ?? ''
    form.User_Email = props.user?.User_Email ?? ''
    form.User_Entreprise = props.user?.User_Entreprise ?? ''
    form.User_Address = props.user?.User_Address ?? ''
    form.User_IsEntrepreneur = Boolean(props.user?.User_IsEntrepreneur)
    form.User_Password = ''
  },
  { immediate: true }
)

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
