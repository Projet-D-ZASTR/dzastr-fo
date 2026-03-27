<script setup>
import { reactive } from 'vue'

const emit = defineEmits(['success', 'switch-to-register'])

const form = reactive({
  email: '',
  password: '',
})

function submitLogin() {
  if (!form.email || !form.password) {
    return
  }

  emit('success')
}
</script>

<template>
  <form class="mt-6 space-y-4" @submit.prevent="submitLogin">
    <label class="form-control w-full">
      <span class="label-text mb-1">Email</span>
      <input
        v-model="form.email"
        type="email"
        required
        class="input input-bordered w-full"
        placeholder="you@company.com"
      />
    </label>

    <label class="form-control w-full">
      <span class="label-text mb-1">Password</span>
      <input
        v-model="form.password"
        type="password"
        required
        class="input input-bordered w-full"
        placeholder="********"
      />
    </label>

    <button type="submit" class="btn btn-primary w-full">Login</button>

    <button
      type="button"
      class="btn btn-ghost btn-sm w-full"
      @click="$emit('switch-to-register')"
    >
      Create an account
    </button>
  </form>
</template>
