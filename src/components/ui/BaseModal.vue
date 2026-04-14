<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': props.modelValue }">
    <div
      class="modal-box w-11/12 max-w-xl rounded-box border border-base-300 bg-base-100 p-5 shadow-xl sm:p-6"
    >
      <div class="mb-5 flex items-start justify-between gap-4 border-b border-base-200 pb-3">
        <h3 class="text-lg font-bold tracking-tight text-base-content sm:text-xl">
          {{ props.title }}
        </h3>
        <button type="button" class="btn btn-sm btn-circle btn-ghost" @click="close">✕</button>
      </div>
      <slot />
    </div>
    <form method="dialog" class="modal-backdrop" @click.prevent="close">
      <button>close</button>
    </form>
  </dialog>
</template>
