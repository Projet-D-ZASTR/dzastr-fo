<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LoginForm from '../components/auth/LoginForm.vue'
import RegisterForm from '../components/auth/RegisterForm.vue'

const router = useRouter()
const isRegister = ref(false)

function onAuthSuccess() {
  router.push('/')
}
</script>

<template>
  <main class="min-h-screen bg-base-200 p-4 sm:p-6">
    <section class="mx-auto flex min-h-[90vh] max-w-md items-center">
      <div class="card w-full bg-base-100 shadow-xl">
        <div class="card-body">
          <h1 class="card-title text-2xl">D-ZASTR</h1>
          <p class="text-sm text-base-content/70">
            Connectez-vous pour acceder au dashboard principal.
          </p>

          <LoginForm
            v-if="!isRegister"
            @switch-to-register="isRegister = true"
            @success="onAuthSuccess"
          />
          <RegisterForm
            v-else
            @switch-to-login="isRegister = false"
            @success="onAuthSuccess"
          />
        </div>
      </div>
    </section>
  </main>
</template>
