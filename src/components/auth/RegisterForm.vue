<script setup>
import { reactive, ref } from 'vue'
import AuthFormMark from './AuthFormMark.vue'

const emit = defineEmits(['success', 'switch-to-login'])

const form = reactive({
  fullName: '',
  email: '',
  password: '',
})

const showPassword = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

async function submitRegister() {
  if (!form.fullName || !form.email || !form.password) {
    return
  }
  if (isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await emit('success', {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
    })
  } catch (error) {
    errorMessage.value = error?.message || "Inscription impossible"
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="w-full text-left">
    <AuthFormMark />

    <h1 class="text-2xl font-semibold tracking-tight text-base-content sm:text-3xl">Create an account</h1>
    <p class="mt-2 max-w-md text-sm leading-relaxed text-base-content/65">
      Access your tasks, notes, and projects anytime, anywhere — and keep everything flowing in one place.
    </p>

    <form class="mt-8 space-y-5" @submit.prevent="submitRegister">
      <div class="form-control w-full">
        <label class="label py-0 pb-1.5" for="register-name">
          <span class="label-text text-sm font-medium text-base-content">Full name</span>
        </label>
        <input
          id="register-name"
          v-model="form.fullName"
          type="text"
          required
          autocomplete="name"
          placeholder="Jane Doe"
          class="input input-bordered input-md w-full text-base"
        />
      </div>

      <div class="form-control w-full">
        <label class="label py-0 pb-1.5" for="register-email">
          <span class="label-text text-sm font-medium text-base-content">Your email</span>
        </label>
        <input
          id="register-email"
          v-model="form.email"
          type="email"
          required
          autocomplete="email"
          placeholder="you@example.com"
          class="input input-bordered input-md w-full text-base"
        />
      </div>

      <div class="form-control w-full">
        <label class="label py-0 pb-1.5" for="register-password">
          <span class="label-text text-sm font-medium text-base-content">Password</span>
        </label>
        <div class="relative">
          <input
            id="register-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            required
            autocomplete="new-password"
            placeholder="••••••••"
            class="input input-bordered input-md w-full pr-12 text-base"
          />
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square absolute right-1 top-1/2 h-10 min-h-10 w-10 -translate-y-1/2 p-0 text-base-content/50 hover:text-base-content"
            :aria-pressed="showPassword"
            aria-label="Show or hide password"
            @click="showPassword = !showPassword"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path
                v-if="!showPassword"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                v-if="!showPassword"
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <template v-else>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.182 4.182L12 12"
                />
              </template>
            </svg>
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="rounded-box border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        class="btn btn-secondary btn-md mt-2 w-full px-6 py-3 text-base"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Creation...' : 'Get started' }}
      </button>

      <button
        type="button"
        class="btn btn-link btn-sm h-auto min-h-0 justify-start px-0 font-normal text-base-content/60 no-underline hover:text-primary hover:underline"
        @click="$emit('switch-to-login')"
      >
        Already have an account? Sign in
      </button>
    </form>
  </div>
</template>
