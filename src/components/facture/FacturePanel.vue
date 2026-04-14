<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  client: { type: Object, default: null },
  services: { type: Array, default: () => [] },
  invoiceData: { type: Object, default: null },
})

const emit = defineEmits(['close', 'save-invoice', 'download-pdf', 'update-status'])

const selectedServiceId = ref('')
const lineHours = ref(1)
const lines = ref([])
const MAX_VISIBLE_LINES = 3
const isAutoEntrepreneur = ref(false)

const selectedService = computed(() =>
  props.services.find((service) => service.id === selectedServiceId.value)
)
const isEditableMode = computed(
  () => props.invoiceData?.isDraft === true || props.invoiceData?.status === 'brouillon'
)
const showInvoiceMeta = computed(() => props.invoiceData?.isDraft === false)
const totalHt = computed(() => lines.value.reduce((sum, line) => sum + line.total, 0))
const tvaRate = computed(() => (isAutoEntrepreneur.value ? 0 : 0.2))
const tvaAmount = computed(() => Number((totalHt.value * tvaRate.value).toFixed(2)))
const totalTtc = computed(() => Number((totalHt.value + tvaAmount.value).toFixed(2)))
const hasLines = computed(() => lines.value.length > 0)
const linesContainerStyle = computed(() => ({ maxHeight: `${MAX_VISIBLE_LINES * 2.4}rem` }))

function formatAmount(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    Number(value) || 0
  )
}

watch(
  () => props.invoiceData,
  (invoice) => {
    lines.value = invoice?.lines ? [...invoice.lines] : []
    isAutoEntrepreneur.value = Boolean(invoice?.isAutoEntrepreneur)
    selectedServiceId.value = ''
    lineHours.value = 1
  },
  { immediate: true }
)

function addLine() {
  if (!selectedService.value || lineHours.value <= 0) return
  lines.value.push({
    id: crypto.randomUUID(),
    serviceId: selectedService.value.id,
    title: selectedService.value.title,
    hourlyRate: Number(selectedService.value.hourlyRate),
    hours: Number(lineHours.value),
    total: Number(selectedService.value.hourlyRate) * Number(lineHours.value),
  })
  selectedServiceId.value = ''
  lineHours.value = 1
}

function removeLine(lineId) {
  lines.value = lines.value.filter((line) => line.id !== lineId)
}

function save(status) {
  if (!props.client || !props.invoiceData || !hasLines.value) return
  emit('save-invoice', {
    clientId: props.client.id,
    invoiceId: props.invoiceData.id,
    status,
    lines: lines.value,
    ht: totalHt.value,
    tva: tvaAmount.value,
    ttc: totalTtc.value,
    total: totalTtc.value,
    isAutoEntrepreneur: isAutoEntrepreneur.value,
  })
}
</script>

<template>
  <section
    v-if="client && invoiceData"
    class="card h-full min-h-0 overflow-hidden border border-secondary/30 bg-secondary/10 shadow-sm"
  >
    <div class="card-body flex h-full min-h-0 flex-col gap-4 p-4 sm:p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-bold text-base-content">
            {{ isEditableMode ? 'Créer facture' : 'Voir facture' }}
          </h3>
          <p class="text-sm text-base-content/70">{{ client.name }} · {{ client.email }}</p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle"
          title="Fermer"
          @click="emit('close')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            class="h-4 w-4"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="showInvoiceMeta" class="grid gap-3 text-sm sm:grid-cols-2">
        <div class="rounded-box border border-base-300 bg-base-100 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">
            Numéro facture
          </p>
          <p class="mt-1 font-semibold">{{ invoiceData.number }}</p>
        </div>
        <div class="rounded-box border border-base-300 bg-base-100 p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">Date</p>
          <p class="mt-1 font-semibold">
            {{ new Date(invoiceData.date).toLocaleDateString('fr-FR') }}
          </p>
        </div>
      </div>

      <div
        v-if="isEditableMode"
        class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end"
      >
        <label class="form-control min-w-0">
          <span
            class="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >Service</span
          >
          <select v-model="selectedServiceId" class="select select-bordered select-sm">
            <option value="" disabled>Sélectionner un service</option>
            <option v-for="service in services" :key="service.id" :value="service.id">
              {{ service.title }} ({{ formatAmount(service.hourlyRate) }} / h)
            </option>
          </select>
        </label>
        <label class="form-control">
          <span
            class="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >Heures</span
          >
          <input
            v-model.number="lineHours"
            type="number"
            min="1"
            class="input input-bordered input-sm"
          />
        </label>
        <button type="button" class="btn btn-secondary btn-sm" @click="addLine">Ajouter</button>
      </div>

      <div class="flex min-h-0 flex-1 flex-col rounded-box border border-base-300 bg-base-100 p-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-base-content/60">
          Lignes facture
        </p>
        <div
          v-if="lines.length"
          class="mt-2 space-y-1.5 overflow-y-auto pr-1 text-sm"
          :style="linesContainerStyle"
        >
          <div v-for="line in lines" :key="line.id" class="flex items-center justify-between gap-2">
            <span>{{ line.title }} · {{ line.hours }}h x {{ formatAmount(line.hourlyRate) }}</span>
            <button
              v-if="isEditableMode"
              type="button"
              class="btn btn-ghost btn-xs"
              @click="removeLine(line.id)"
            >
              Retirer
            </button>
          </div>
        </div>
        <p v-else class="mt-2 text-sm text-base-content/60">Aucune ligne sur cette facture.</p>
        <div class="divider my-2" />
        <div class="space-y-1 text-right text-sm">
          <p>
            HT : <span class="font-semibold">{{ formatAmount(totalHt) }}</span>
          </p>
          <p>
            TVA ({{ isAutoEntrepreneur ? '0%' : '20%' }}) :
            <span class="font-semibold">{{ formatAmount(tvaAmount) }}</span>
          </p>
          <p>
            TTC : <span class="font-bold">{{ formatAmount(totalTtc) }}</span>
          </p>
        </div>
      </div>

      <div v-if="isEditableMode" class="mt-1 flex flex-wrap justify-end gap-2">
        <label
          class="label cursor-pointer gap-2 rounded-box border border-base-300 bg-base-100 px-3 py-1"
        >
          <input
            v-model="isAutoEntrepreneur"
            type="checkbox"
            class="toggle toggle-secondary toggle-sm"
          />
          <span class="label-text text-xs">Auto-entrepreneur</span>
        </label>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          :disabled="!hasLines"
          @click="save('brouillon')"
        >
          Brouillon
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="!hasLines"
          @click="save('envoyee')"
        >
          Enregistrer
        </button>
      </div>

      <div
        v-else
        class="mt-1 flex items-end justify-between gap-3 rounded-box border border-base-300 bg-base-100 p-3"
      >
        <label class="form-control w-full max-w-xs">
          <span
            class="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60"
          >
            Gestion état facture
          </span>
          <select
            class="select select-bordered select-sm"
            :value="invoiceData.status"
            @change="
              emit('update-status', {
                clientId: client.id,
                invoiceId: invoiceData.id,
                status: $event.target.value,
              })
            "
          >
            <option value="brouillon">Brouillon</option>
            <option value="envoyee">Envoyée</option>
            <option value="payee">Payée</option>
            <option value="annulee">Annulée</option>
          </select>
        </label>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          @click="emit('download-pdf', client.id)"
        >
          PDF
        </button>
      </div>
    </div>
  </section>
</template>
