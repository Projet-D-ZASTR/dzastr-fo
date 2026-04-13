<script setup>
import { reactive, watch } from 'vue'
import BaseModal from '../ui/BaseModal.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  client: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = reactive({
  name: '',
  email: '',
  company: '',
})

watch(
  () => props.client,
  (value) => {
    form.name = value?.name || ''
    form.email = value?.email || ''
    form.company = value?.company || ''
  },
  { immediate: true }
)

function submitClient() {
  if (!form.name || !form.email) {
    return
  }

  emit('save', {
    id: props.client?.id,
    name: form.name,
    email: form.email,
    company: form.company,
  })
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="client ? 'Mettre à jour le client' : 'Ajouter un client'"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="space-y-4" @submit.prevent="submitClient">
      <label class="form-control">
        <span class="label-text mb-1 font-medium text-base-content/80">Nom</span>
        <input
          v-model="form.name"
          type="text"
          class="input input-bordered w-full"
          placeholder="Ex: Alice Martin"
          required
        />
      </label>
      <label class="form-control">
        <span class="label-text mb-1 font-medium text-base-content/80">Email</span>
        <input
          v-model="form.email"
          type="email"
          class="input input-bordered w-full"
          placeholder="alice@entreprise.fr"
          required
        />
      </label>
      <label class="form-control">
        <span class="label-text mb-1 font-medium text-base-content/80">Société</span>
        <input
          v-model="form.company"
          type="text"
          class="input input-bordered w-full"
          placeholder="Ex: Acme"
        />
      </label>

      <div class="modal-action mt-1 flex items-center justify-end gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="$emit('update:modelValue', false)"
        >
          Annuler
        </button>
        <button type="submit" class="btn btn-secondary btn-sm">
          {{ client ? 'Mettre à jour' : 'Enregistrer' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
