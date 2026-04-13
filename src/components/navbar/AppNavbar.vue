<script setup>
const emit = defineEmits(['open-service-modal', 'logout'])
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

    <div class="navbar-end flex flex-none items-center gap-3">
      <button
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
