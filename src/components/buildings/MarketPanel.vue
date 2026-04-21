<script setup lang="ts">
import type { Market } from '../../game/city/buildings/Market.ts';
import type marketServiceType from '../../modules/market/market.service.ts';
import { ItemRegistry } from '../../modules/items/registry.ts';
import { MarketInsufficientStockError } from '../../modules/market/common.ts';

const props = defineProps<{
  market: Market;
  marketService: typeof marketServiceType;
}>();

function onExportAll(): void {
  try {
    props.marketService.exportAll();
  } catch (err) {
    if (err instanceof MarketInsufficientStockError) {
      console.warn(`[MarketPanel] export failed: ${err.message}`);
      return;
    }
    throw err;
  }
}

function tradeSideClass(side: 'buy' | 'sell' | 'export'): string {
  switch (side) {
    case 'sell': return 'text-green-400';
    case 'buy': return 'text-blue-400';
    case 'export': return 'text-amber-400';
  }
}
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
      <h3 class="text-lg font-semibold mb-1">Export</h3>
      <button
        type="button"
        class="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
        :disabled="marketService.getStock().size === 0"
        @click="onExportAll()"
      >
        Export All Stock (+{{ marketService.getExportQuote() }} g)
      </button>
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
          <span :class="tradeSideClass(trade.side)">
            {{ trade.side.toUpperCase() }}
          </span>
          <span>{{ trade.counterpartyId }}</span>
          <span class="ml-auto">{{ trade.total }} g</span>
        </div>
      </div>
    </div>
  </div>
</template>
