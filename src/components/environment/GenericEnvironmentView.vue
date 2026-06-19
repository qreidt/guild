<script setup lang="ts">
import type { EnvironmentView } from "../../modules/environment-view/types.ts";

defineProps<{
  view: EnvironmentView | null;
}>();

function pct(progress: number): string {
  return `${Math.round(progress * 100)}%`;
}
</script>

<template>
  <div v-if="view" class="p-4 flex flex-col gap-4">
    <div>
      <h2 class="text-xl font-bold mb-1">{{ view.name }}</h2>
      <div>Funds: {{ view.funds }} g</div>
    </div>

    <div>
      <h3 class="text-lg font-semibold mb-1">Workers</h3>
      <div v-if="view.workers.length === 0" class="text-gray-500 italic text-sm">No workers</div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="worker in view.workers" :key="worker.label" class="flex flex-col gap-1">
          <div class="flex justify-between text-sm">
            <span class="font-medium">{{ worker.label }}</span>
            <span :class="worker.status === 'working' ? 'text-green-400' : 'text-gray-500 italic'">
              {{ worker.task ?? 'idle' }}
            </span>
          </div>
          <div class="h-2 w-full rounded bg-gray-700 overflow-hidden">
            <div class="h-full bg-green-500 transition-all duration-300" :style="{ width: pct(worker.progress) }" />
          </div>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-lg font-semibold mb-1">Inventory</h3>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-400">
            <th class="pb-1">Item</th>
            <th class="pb-1 text-right">Qty</th>
            <th class="pb-1 text-right">Unit Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in view.inventory" :key="row.itemId">
            <td>{{ row.name }}</td>
            <td class="text-right">{{ row.count }}</td>
            <td class="text-right">{{ row.unitValue }} g</td>
          </tr>
          <tr v-if="view.inventory.length === 0">
            <td colspan="3" class="text-gray-500 italic">Empty</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="p-4 text-gray-500 italic">No environment selected.</div>
</template>
