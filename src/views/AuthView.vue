<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LoginForm from '../components/auth/LoginForm.vue'
import RegisterForm from '../components/auth/RegisterForm.vue'
import { loginUser, registerUser, saveAuthSession } from '../services/auth.service'

const router = useRouter()
const isRegister = ref(false)
const loginError = ref('')
const registerError = ref('')
const loginSubmitting = ref(false)
const registerSubmitting = ref(false)

function mapAuthError(error) {
  const message = String(error?.message || '')
  if (message.includes('Failed to fetch') || message.includes('Load failed')) {
    return 'Connexion au serveur impossible. Verifie VITE_AUTH_API_URL et que le backend tourne.'
  }
  if (message.includes('Forbidden')) {
    return 'Token de service invalide ou manquant (x-service-token).'
  }
  return message || 'Une erreur est survenue.'
}

async function onLogin(payload) {
  loginError.value = ''
  loginSubmitting.value = true
  try {
    const { accessToken, user } = await loginUser(payload)
    if (!accessToken) {
      throw new Error('Token manquant')
    }
    saveAuthSession(accessToken, user)
    router.push('/')
  } catch (error) {
    loginError.value = mapAuthError(error)
  } finally {
    loginSubmitting.value = false
  }
}

async function onRegister(payload) {
  registerError.value = ''
  registerSubmitting.value = true
  try {
    const { accessToken, user } = await registerUser(payload)
    if (!accessToken) {
      throw new Error('Token manquant')
    }
    saveAuthSession(accessToken, user)
    router.push('/')
  } catch (error) {
    registerError.value = mapAuthError(error)
  } finally {
    registerSubmitting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen  p-4">
    <section class="h-[calc(100vh-2rem)] w-full">
      <div
        class="grid h-full w-full overflow-hidden"
        style="grid-template-columns: 45% 55%;"
      >
        <aside class="flex h-full min-h-0 flex-col p-4 text-primary-content">
          <div class="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-box border border-base-300/20 p-6">
            <div class="auth-liquid-base absolute inset-0" aria-hidden="true"></div>
            <div class="auth-liquid-shift absolute inset-0 opacity-90 mix-blend-soft-light" aria-hidden="true"></div>

            <div
              class="auth-blob auth-blob-a pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-[45%] bg-secondary/55 blur-[64px]"
              aria-hidden="true"
            ></div>
            <div
              class="auth-blob auth-blob-b pointer-events-none absolute -right-12 top-1/4 h-80 w-80 rounded-[40%] bg-primary/50 blur-[72px]"
              aria-hidden="true"
            ></div>
            <div
              class="auth-blob auth-blob-c pointer-events-none absolute bottom-[-4rem] left-1/3 h-72 w-72 -translate-x-1/2 rounded-[50%] bg-base-100/40 blur-[68px]"
              aria-hidden="true"
            ></div>
            <div
              class="auth-blob auth-blob-d pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-[55%] bg-secondary/35 blur-[80px]"
              aria-hidden="true"
            ></div>
            <div class="auth-dot-overlay pointer-events-none absolute inset-0 z-[1]" aria-hidden="true"></div>

            <img
              src="/img/D-Zastre.svg"
              alt="D-ZASTR"
              class="relative z-[2] h-14 w-14 shrink-0 self-start object-contain [filter:brightness(0)_invert(1)]"
            />
            <div class="relative z-[2] mt-auto space-y-3 pt-8 pb-8 sm:pb-10">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">D-ZASTR Front Office</p>
              <p class="text-3xl font-bold leading-tight text-white/82 sm:text-4xl">
                Centralisez vos prestations et facturez en quelques clics.
              </p>
              <p class="max-w-md text-sm font-medium leading-relaxed text-white/70">
                Un espace simple pour gerer vos clients, vos services et preparer vos factures rapidement.
              </p>
            </div>
          </div>
        </aside>

        <div class="flex h-full min-h-0 items-center bg-white p-8 sm:p-10 lg:p-12">
          <div class="mx-auto w-full max-w-md">
            <LoginForm
              v-if="!isRegister"
              :server-error="loginError"
              :submitting="loginSubmitting"
              @switch-to-register="isRegister = true"
              @success="onLogin"
            />
            <RegisterForm
              v-else
              :server-error="registerError"
              :submitting="registerSubmitting"
              @switch-to-login="isRegister = false"
              @success="onRegister"
            />
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth-liquid-base {
  background:
    radial-gradient(120% 90% at 15% 10%, color-mix(in oklch, var(--color-primary) 85%, transparent) 0%, transparent 55%),
    radial-gradient(100% 80% at 85% 20%, color-mix(in oklch, var(--color-secondary) 70%, transparent) 0%, transparent 50%),
    radial-gradient(90% 70% at 50% 95%, color-mix(in oklch, var(--color-secondary) 65%, transparent) 0%, transparent 55%),
    linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 52%, color-mix(in oklch, var(--color-secondary) 92%, var(--color-primary)) 100%);
  background-size: 260% 260%;
  animation: auth-liquid-flow 10s ease-in-out infinite;
}

.auth-liquid-shift {
  background: linear-gradient(
    120deg,
    color-mix(in oklch, var(--color-primary) 55%, transparent),
    color-mix(in oklch, var(--color-secondary) 45%, transparent),
    color-mix(in oklch, var(--color-base-100) 35%, transparent)
  );
  background-size: 300% 300%;
  animation: auth-liquid-flow 8s ease-in-out infinite reverse;
}

.auth-blob {
  animation: auth-blob-drift 12s ease-in-out infinite;
  will-change: transform;
}

.auth-blob-b {
  animation-duration: 14s;
  animation-delay: -6s;
}

.auth-blob-c {
  animation-duration: 11s;
  animation-delay: -10s;
}

.auth-blob-d {
  animation-duration: 16s;
  animation-delay: -14s;
}

@keyframes auth-liquid-flow {
  0%,
  100% {
    background-position: 0% 30%;
  }
  50% {
    background-position: 100% 70%;
  }
}

@keyframes auth-blob-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
  }
  33% {
    transform: translate3d(36px, -40px, 0) scale(1.14) rotate(10deg);
  }
  66% {
    transform: translate3d(-30px, 28px, 0) scale(0.9) rotate(-9deg);
  }
}

.auth-dot-overlay {
  background-color: transparent;
  background-image:
    radial-gradient(#fff 0.5px, transparent 0.5px),
    radial-gradient(#fff 0.5px, transparent 0.5px);
  background-size: 20px 20px;
  background-position:
    0 0,
    10px 10px;
}
</style>
