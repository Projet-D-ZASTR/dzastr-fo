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
    <div class="modal-box">
      <div class="mb-4 flex items-start justify-between gap-4">
        <h3 class="text-lg font-semibold">{{ props.title }}</h3>
        <button type="button" class="btn btn-sm btn-circle btn-ghost" @click="close">✕</button>
      </div>
      <slot />
    </div>
    <form method="dialog" class="modal-backdrop" @click.prevent="close">
      <button>close</button>
    </form>
  </dialog>
</template>
