<script setup>
defineProps({
  clients: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'add-client',
  'edit-client',
  'delete-client',
  'create-invoice',
  'view-invoices',
])

const invoiceStatusMap = {
  brouillon: { label: 'Brouillon' },
  envoyee: { label: 'Envoyée' },
  payee: { label: 'Payée' },
  annulee: { label: 'Annulée' },
}

function getInvoiceStatus(status) {
  return invoiceStatusMap[status] ?? { label: '' }
}

/** Couleur directement sur l’icône PDF (statut) */
function getInvoiceIconClass(status) {
  if (!status) return 'text-base-content/35'
  const map = {
    brouillon: 'text-warning',
    envoyee: 'text-info',
    payee: 'text-success',
    annulee: 'text-error',
  }
  return map[status] ?? 'text-base-content/50'
}
</script>

<template>
  <section class="flex w-full flex-col gap-3 sm:gap-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div class="flex min-w-0 flex-col space-y-1">
        <h2 class="text-xl font-extrabold tracking-tight text-base-content sm:text-2xl">Clients</h2>
        <p class="max-w-xl text-base font-medium leading-snug text-base-content/70 sm:text-lg">
          Gérez vos clients depuis ce tableau : modifiez une fiche, supprimez-la ou ouvrez une
          facture en un clic.
        </p>
      </div>
      <button
        type="button"
        class="btn btn-outline btn-sm w-full shrink-0 gap-2 border-base-300 bg-base-100 text-base-content/80 shadow-none hover:border-base-300 hover:bg-base-200/70 sm:w-auto"
        @click="emit('add-client')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Ajouter un client
      </button>
    </div>

    <div class="card overflow-hidden border border-base-200 bg-base-100 shadow-sm">
      <div
        class="overflow-x-auto overflow-y-auto [scrollbar-gutter:stable] max-h-[min(56vh,calc(100dvh-18rem))]"
      >
        <table
          class="table table-pin-rows text-sm [&_tbody_tr:nth-child(odd)_td]:!bg-base-100 [&_tbody_tr:nth-child(even)_td]:!bg-secondary/18 [&_th]:!py-1.5 [&_td]:!py-1 [&_th]:text-[0.65rem] [&_th]:font-semibold [&_th]:uppercase [&_th]:leading-tight [&_th]:tracking-wide [&_th]:text-base-content/50 [&_tbody_td]:text-xs"
        >
          <caption class="sr-only">
            Liste des clients : nom, email, société et actions
          </caption>
          <thead>
            <tr class="[&_th]:bg-base-200/50">
              <th scope="col">Nom</th>
              <th scope="col">Email</th>
              <th scope="col">Société</th>
              <th scope="col">Facture</th>
              <th scope="col" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="client in clients" :key="client.id">
              <td class="font-medium">{{ client.name }}</td>
              <td class="text-base-content/90">
                {{ client.email }}
              </td>
              <td>{{ client.company }}</td>
              <td>
                <div v-if="client.invoiceItems?.length" class="flex flex-wrap items-center gap-1">
                  <div
                    v-for="invoice in client.invoiceItems"
                    :key="invoice.id"
                    class="group relative"
                  >
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs btn-square h-6 min-h-6 w-6"
                      title="Voir la facture"
                      @click="emit('view-invoices', client, invoice.id)"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="h-4 w-4 shrink-0"
                        :class="getInvoiceIconClass(invoice.status)"
                        aria-hidden="true"
                      >
                        <path
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                    </button>
                    <span
                      class="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-box border border-base-300 bg-base-100 px-2 py-1 text-[11px] font-medium text-base-content opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100"
                    >
                      {{ getInvoiceStatus(invoice.status).label }} · {{ invoice.id }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="text-end">
                <div class="flex flex-wrap items-center justify-end gap-1">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs btn-square h-7 min-h-7 w-7"
                    title="Modifier"
                    aria-label="Modifier"
                    @click="emit('edit-client', client)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-3 w-3 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline btn-error btn-xs btn-square h-7 min-h-7 w-7"
                    title="Supprimer"
                    aria-label="Supprimer"
                    @click="emit('delete-client', client.id)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-3 w-3 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M14.74 9l-.346 9m-4.008 0L7.58 9m12.84 0l-.001-1.73a1.5 1.5 0 00-1.356-1.499l-1.102-.16m12.84 0h-2.5M4.25 7.5h15M10.5 3.75h3a1.5 1.5 0 011.5 1.5v.75m-6 0V5.25a1.5 1.5 0 011.5-1.5z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline btn-xs h-7 min-h-7 gap-0.5 border-base-300 bg-base-100 px-1.5 text-xs font-normal normal-case text-base-content/80 shadow-none hover:border-base-300 hover:bg-base-200/70"
                    title="Créer une facture"
                    @click="emit('create-invoice', client)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-3 w-3 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    Créer facture
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!clients.length">
              <td colspan="5" class="!bg-base-100 py-4 text-center text-xs text-base-content/50">
                Aucun client pour le moment.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
