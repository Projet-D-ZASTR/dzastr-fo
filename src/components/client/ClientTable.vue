<script setup>
defineProps({
  clients: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['add-client', 'edit-client', 'delete-client', 'create-invoice'])
</script>

<template>
  <section class="rounded-box bg-base-100 p-4 shadow-sm">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold">Client management</h2>
      <button class="btn btn-secondary btn-sm" @click="emit('add-client')">Add client</button>
    </div>

    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in clients" :key="client.id">
            <td>{{ client.name }}</td>
            <td>{{ client.email }}</td>
            <td>{{ client.company }}</td>
            <td class="space-x-2 text-right">
              <button class="btn btn-xs" @click="emit('edit-client', client)">Edit</button>
              <button class="btn btn-xs btn-error btn-outline" @click="emit('delete-client', client.id)">
                Delete
              </button>
              <button class="btn btn-xs btn-primary" @click="emit('create-invoice', client)">
                Invoice
              </button>
            </td>
          </tr>
          <tr v-if="!clients.length">
            <td colspan="4" class="text-center text-base-content/70">No client yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
