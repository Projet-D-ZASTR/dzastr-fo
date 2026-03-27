<script setup>
import { reactive } from 'vue'
import BaseModal from '../ui/BaseModal.vue'

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = reactive({
  title: '',
  hourlyRate: '',
})

function parseDecimal(value) {
  return Number(String(value).replace(',', '.'))
}

function submitService() {
  const hourlyRate = parseDecimal(form.hourlyRate)
  if (!form.title.trim() || !Number.isFinite(hourlyRate) || hourlyRate <= 0) {
    return
  }

  emit('save', {
    id: crypto.randomUUID(),
    title: form.title.trim(),
    hourlyRate,
  })

  form.title = ''
  form.hourlyRate = ''
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Créer un service"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="space-y-4" @submit.prevent="submitService">
      <label class="form-control">
        <span class="label-text mb-1 font-medium text-base-content/80">Nom du service</span>
        <input
          v-model="form.title"
          type="text"
          class="input input-bordered w-full"
          placeholder="Ex: Développement frontend"
          required
        />
      </label>
      <label class="form-control">
        <span class="label-text mb-1 font-medium text-base-content/80">Prix horaire</span>
        <input
          v-model="form.hourlyRate"
          type="text"
          inputmode="decimal"
          class="input input-bordered w-full"
          placeholder="120,50"
          required
        />
      </label>
      <p class="text-xs text-base-content/55">Utilise une virgule ou un point pour les décimales.</p>
      <div class="modal-action mt-1 flex items-center justify-end gap-2">
        <button type="button" class="btn btn-ghost btn-sm" @click="$emit('update:modelValue', false)">
          Annuler
        </button>
        <button type="submit" class="btn btn-secondary btn-sm">Créer</button>
      </div>
    </form>
  </BaseModal>
</template>
