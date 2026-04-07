<script setup lang="ts">
import type { Market } from '../../game/city/buildings/Market.ts';
import type marketServiceType from '../../modules/market/market.service.ts';
import { ItemRegistry } from '../../modules/items/registry.ts';

defineProps<{
  market: Market;
  marketService: typeof marketServiceType;
}>();
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div>
      <h2 class="text-xl font-bold mb-1">Market</h2>
      <div>Treasury: {{ market.money }} g</div>
    </div>

    <div>
      <h3 class="text-lg font-semibold mb-1">Stock</h3>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-400">
            <th class="pb-1">Item</th>
            <th class="pb-1 text-right">Qty</th>
            <th class="pb-1 text-right">Unit Price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[itemId, qty] in marketService.getStock().entries()" :key="itemId">
            <td>{{ ItemRegistry[itemId].name ?? itemId }}</td>
            <td class="text-right">{{ qty }}</td>
            <td class="text-right">{{ marketService.getPrice(itemId) }} g</td>
          </tr>
          <tr v-if="marketService.getStock().size === 0">
            <td colspan="3" class="text-gray-500 italic">No stock</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h3 class="text-lg font-semibold mb-1">Recent Trades</h3>
      <div v-if="marketService.recentTrades.length === 0" class="text-gray-500 italic text-sm">No trades yet</div>
      <div v-else class="flex flex-col gap-1 text-sm">
        <div
          v-for="(trade, i) in [...marketService.recentTrades].reverse()"
          :key="i"
          class="flex gap-2"
        >
          <span class="text-gray-400">[{{ trade.tick }}]</span>
          <span :class="trade.side === 'sell' ? 'text-green-400' : 'text-blue-400'">
            {{ trade.side.toUpperCase() }}
          </span>
          <span>{{ trade.counterpartyId }}</span>
          <span class="ml-auto">{{ trade.total }} g</span>
        </div>
      </div>
    </div>
  </div>
</template>
