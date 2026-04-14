<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineProps({
  showCreateService: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['open-service-modal', 'open-profile', 'logout'])
const route = useRoute()

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Clients', to: '/clients' },
  { label: 'Factures', to: '/factures' },
  { label: 'Services', to: '/services' },
]

const isActive = computed(() => route.path)
</script>

<template>
  <header
    class="navbar min-h-[4.25rem] w-full border-b border-base-200 bg-base-100 px-4 py-3 text-base-content sm:min-h-[4.75rem] sm:px-8 sm:py-4"
  >
    <div class="flex flex-1 items-center gap-4">
      <img
        src="/img/D-Zastre.svg"
        alt=""
        class="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12"
        width="48"
        height="48"
      />
      <div class="flex min-w-0 flex-col leading-tight">
        <span class="truncate text-xl font-extrabold tracking-tight text-neutral-500 sm:text-2xl"
          >D-ZASTR</span
        >
        <span class="text-xs font-semibold uppercase tracking-[0.12em] text-base-content/55"
          >Dashboard</span
        >
      </div>
    </div>

    <div class="navbar-end flex flex-none items-center gap-2 sm:gap-3">
      <div class="dropdown dropdown-end lg:hidden">
        <button type="button" tabindex="0" class="btn btn-ghost btn-circle btn-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.75"
              d="M3.75 6.75h16.5m-16.5 5.25h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
        <ul
          tabindex="0"
          class="menu dropdown-content z-[1] mt-2 w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow"
        >
          <li v-for="item in navItems" :key="`mobile-${item.to}`">
            <RouterLink :to="item.to" :class="{ active: isActive === item.to }">
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </div>
      <nav
        class="hidden items-center gap-1 rounded-box border border-base-300 bg-base-100/80 p-1 lg:flex"
      >
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="btn btn-ghost btn-sm"
          :class="{ 'btn-active': isActive === item.to }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <button
        type="button"
        class="btn btn-ghost btn-circle btn-sm min-h-10 w-10"
        aria-label="Profile"
        title="Mon profil"
        @click="emit('open-profile')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.75"
          stroke="currentColor"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      </button>
      <button
        v-if="showCreateService"
        type="button"
        class="btn btn-secondary btn-sm px-4 text-sm shadow-none"
        @click="emit('open-service-modal')"
      >
        Créer service
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-circle btn-sm min-h-10 w-10"
        aria-label="Log out"
        title="Log out"
        @click="emit('logout')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.75"
          stroke="currentColor"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
          />
        </svg>
      </button>
    </div>
  </header>
</template>
