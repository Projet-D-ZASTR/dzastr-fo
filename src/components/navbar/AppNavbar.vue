<script setup>
defineProps({
  serviceCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['open-service-modal', 'logout'])
</script>

<template>
  <header class="navbar rounded-box bg-base-100 shadow-sm">
    <div class="flex-1">
      <a class="btn btn-ghost text-lg">D-ZASTR</a>
    </div>
    <div class="flex-none gap-2">
      <div class="badge badge-outline">Services: {{ serviceCount }}</div>
      <button class="btn btn-primary btn-sm" @click="emit('open-service-modal')">
        New service
      </button>
      <button class="btn btn-ghost btn-sm" @click="emit('logout')">Logout</button>
    </div>
  </header>
</template>
