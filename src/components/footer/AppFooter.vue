<script setup>
const year = new Date().getFullYear()
</script>

<template>
  <footer
    class="footer mt-auto border-t border-secondary/30 bg-secondary px-4 py-6 text-secondary-content sm:px-6"
  >
    <div
      class="flex w-full flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4"
    >
      <p class="text-left text-sm font-medium">
        <span class="font-semibold text-secondary-content">D-ZASTR</span>
        <span class="mx-1.5 text-secondary-content/55">·</span>
        <span>Gestion clients et facturation</span>
      </p>
      <p class="text-left text-xs font-medium text-secondary-content/80 sm:text-right">
        © {{ year }} — Tableau de bord
      </p>
    </div>
  </footer>
</template>
