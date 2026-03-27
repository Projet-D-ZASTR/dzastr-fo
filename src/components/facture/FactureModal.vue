<script setup>
import { computed, reactive, watch } from 'vue'
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
  services: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'generate-pdf'])

const quantities = reactive({})

watch(
  () => props.services,
  (list) => {
    for (const service of list) {
      if (!quantities[service.id]) {
        quantities[service.id] = 0
      }
    }
  },
  { immediate: true },
)

const lines = computed(() =>
  props.services
    .filter((service) => quantities[service.id] > 0)
    .map((service) => ({
      serviceId: service.id,
      title: service.title,
      hours: Number(quantities[service.id] || 0),
      hourlyRate: service.hourlyRate,
      total: Number(quantities[service.id] || 0) * service.hourlyRate,
    })),
)

const totalAmount = computed(() => lines.value.reduce((sum, line) => sum + line.total, 0))

function submitInvoice() {
  if (!props.client || !lines.value.length) {
    return
  }

  emit('generate-pdf', {
    client: props.client,
    lines: lines.value,
    total: totalAmount.value,
  })
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="`Invoice builder${client ? ` - ${client.name}` : ''}`"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <div v-if="!services.length" class="alert">
        <span>Create at least one service before generating an invoice.</span>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="service in services"
          :key="service.id"
          class="flex items-center justify-between gap-3 rounded-box bg-base-200 p-3"
        >
          <div>
            <p class="font-medium">{{ service.title }}</p>
            <p class="text-sm text-base-content/70">{{ service.hourlyRate }} / hour</p>
          </div>
          <input
            v-model.number="quantities[service.id]"
            type="number"
            min="0"
            class="input input-bordered input-sm w-24"
          />
        </div>
      </div>

      <div class="rounded-box bg-base-200 p-3 text-sm">
        <p class="font-semibold">Invoice lines: {{ lines.length }}</p>
        <p class="mt-1">Total: {{ totalAmount }}</p>
      </div>

      <div class="modal-action">
        <button type="button" class="btn" @click="$emit('update:modelValue', false)">Cancel</button>
        <button type="button" class="btn btn-primary" :disabled="!lines.length" @click="submitInvoice">
          Prepare PDF
        </button>
      </div>
    </div>
  </BaseModal>
</template>
