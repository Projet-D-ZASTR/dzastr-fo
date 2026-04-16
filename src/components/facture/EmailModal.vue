<script setup>
import { reactive, watch } from 'vue'
import BaseModal from '../ui/BaseModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  clientEmail: { type: String, default: '' },
  invoiceNumber: { type: String, default: '' },
  submitting: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'send'])

const form = reactive({ to: '', cc: '', subject: '', message: '' })

watch(
  () => [props.modelValue, props.clientEmail, props.invoiceNumber],
  ([open]) => {
    if (!open) return
    form.to = props.clientEmail
    form.cc = ''
    form.subject = `Facture ${props.invoiceNumber}`
    form.message = `Bonjour,\n\nVeuillez trouver en pièce jointe la facture ${props.invoiceNumber}.\n\nCordialement`
  },
  { immediate: true }
)

function submit() {
  if (!form.to.trim()) return
  emit('send', {
    to: form.to
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean),
    cc: form.cc
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean),
    subject: form.subject.trim(),
    message: form.message.trim(),
  })
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Envoyer la facture par email"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="space-y-3" @submit.prevent="submit">
      <label class="form-control w-full">
        <span class="label-text text-sm">Destinataire(s) <span class="text-error">*</span></span>
        <input
          v-model="form.to"
          type="text"
          required
          placeholder="email@exemple.com, autre@exemple.com"
          class="input input-bordered input-sm w-full"
        />
        <span class="label-text-alt mt-1 text-base-content/50">Séparer par des virgules</span>
      </label>

      <label class="form-control w-full">
        <span class="label-text text-sm">CC</span>
        <input
          v-model="form.cc"
          type="text"
          placeholder="cc@exemple.com"
          class="input input-bordered input-sm w-full"
        />
      </label>

      <label class="form-control w-full">
        <span class="label-text text-sm">Objet <span class="text-error">*</span></span>
        <input
          v-model="form.subject"
          type="text"
          required
          class="input input-bordered input-sm w-full"
        />
      </label>

      <label class="form-control w-full">
        <span class="label-text text-sm">Message <span class="text-error">*</span></span>
        <textarea
          v-model="form.message"
          required
          rows="4"
          class="textarea textarea-bordered w-full text-sm"
        />
      </label>

      <p
        v-if="errorMessage"
        class="rounded-box border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
      >
        {{ errorMessage }}
      </p>

      <div class="modal-action mt-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="$emit('update:modelValue', false)"
        >
          Annuler
        </button>
        <button type="submit" class="btn btn-secondary btn-sm" :disabled="submitting">
          {{ submitting ? 'Envoi...' : 'Envoyer' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
