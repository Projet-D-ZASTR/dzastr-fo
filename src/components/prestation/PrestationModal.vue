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
  hourlyRate: 0,
})

function submitService() {
  if (!form.title || !form.hourlyRate) {
    return
  }

  emit('save', {
    id: crypto.randomUUID(),
    title: form.title,
    hourlyRate: Number(form.hourlyRate),
  })

  form.title = ''
  form.hourlyRate = 0
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Create service"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <form class="space-y-3" @submit.prevent="submitService">
      <label class="form-control">
        <span class="label-text mb-1">Title</span>
        <input v-model="form.title" type="text" class="input input-bordered w-full" required />
      </label>
      <label class="form-control">
        <span class="label-text mb-1">Hourly rate</span>
        <input
          v-model.number="form.hourlyRate"
          type="number"
          min="1"
          class="input input-bordered w-full"
          required
        />
      </label>
      <div class="modal-action">
        <button type="button" class="btn" @click="$emit('update:modelValue', false)">Cancel</button>
        <button type="submit" class="btn btn-primary">Add</button>
      </div>
    </form>
  </BaseModal>
</template>
