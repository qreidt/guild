<script setup lang="ts">
import type { EnvironmentView } from "../../modules/environment-view/types.ts";

/**
 * Shared 2D building-interior shell: header (name + funds), a decorative themed
 * banner (slot), vertical worker progress rows, and the inventory shelf.
 *
 * The layout was validated on the Blacksmith and is reused verbatim by every 2D
 * interior; only the banner art and the accent theme differ. Strictly read-only —
 * renders from the `view` prop alone, never touches the engine.
 */

type ThemeName = 'amber' | 'emerald' | 'sky';

interface Theme {
  /** Funds chip: background + border + text. */
  funds: string;
  /** Task label of a working row. */
  task: string;
  /** Progress-bar fill of a working row. */
  bar: string;
  /** Inventory count emphasis. */
  count: string;
}

// Full literal class strings — Tailwind only sees classes it can find in source.
const THEMES: Record<ThemeName, Theme> = {
  amber: {
    funds: 'bg-amber-900/40 border-amber-700 text-amber-300',
    task: 'text-amber-300 font-medium',
    bar: 'bg-amber-500',
    count: 'text-amber-300',
  },
  emerald: {
    funds: 'bg-emerald-900/40 border-emerald-700 text-emerald-300',
    task: 'text-emerald-300 font-medium',
    bar: 'bg-emerald-500',
    count: 'text-emerald-300',
  },
  sky: {
    funds: 'bg-sky-900/40 border-sky-700 text-sky-300',
    task: 'text-sky-300 font-medium',
    bar: 'bg-sky-500',
    count: 'text-sky-300',
  },
};

const props = withDefaults(
  defineProps<{
    view: EnvironmentView | null;
    theme?: ThemeName;
    /** Glyph shown beside the funds figure. */
    fundsIcon?: string;
    /** Shown when there is no view data for this building. */
    emptyMessage?: string;
  }>(),
  {
    theme: 'amber',
    fundsIcon: '⚒',
    emptyMessage: 'No building data.',
  },
);

const t = (): Theme => THEMES[props.theme];

function pct(progress: number): string {
  return `${Math.round(progress * 100)}%`;
}
</script>

<template>
  <div v-if="view" class="p-4 flex flex-col gap-4">
    <!-- Title + funds -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold">{{ view.name }}</h2>
      <div class="rounded border px-3 py-1 font-semibold" :class="t().funds">
        {{ fundsIcon }} {{ view.funds }} g
      </div>
    </div>

    <!-- Decorative banner (encodes no worker state) -->
    <div v-if="$slots.banner" class="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
      <slot name="banner" />
    </div>

    <!-- Worker rows (vertical, one per worker) -->
    <div>
      <h3 class="text-lg font-semibold mb-2">Workers</h3>
      <div v-if="view.workers.length === 0" class="text-gray-500 italic text-sm">No workers</div>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="worker in view.workers"
          :key="worker.label"
          class="flex flex-col gap-1"
          :class="{ 'opacity-60': worker.status === 'idle' }"
        >
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium">{{ worker.label }}</span>
            <div class="flex items-center gap-2">
              <!--
                Idle is status-driven, not `task ?? 'idle'`: the view-model emits a
                non-null task for a *done* action, which would show a stale label.
              -->
              <span :class="worker.status === 'working' ? t().task : 'text-gray-500 italic'">
                {{ worker.status === 'working' ? (worker.task ?? 'idle') : 'idle' }}
              </span>
              <span class="text-xs text-gray-400 tabular-nums w-9 text-right">{{ pct(worker.progress) }}</span>
            </div>
          </div>
          <div class="h-2 w-full rounded bg-gray-700 overflow-hidden">
            <div
              class="h-full rounded transition-all duration-300"
              :class="worker.status === 'working' ? t().bar : 'bg-gray-600'"
              :style="{ width: pct(worker.progress) }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Inventory shelf -->
    <div>
      <h3 class="text-lg font-semibold mb-2">Inventory</h3>
      <div v-if="view.inventory.length === 0" class="text-gray-500 italic text-sm">Empty</div>
      <div v-else class="flex flex-wrap gap-2">
        <div
          v-for="row in view.inventory"
          :key="row.itemId"
          class="flex items-center gap-2 rounded border border-gray-700 bg-gray-800 px-3 py-1.5"
          :title="`${row.name} — ${row.unitValue} g each`"
        >
          <span class="text-sm">{{ row.name }}</span>
          <span class="text-sm font-bold tabular-nums" :class="t().count">×{{ row.count }}</span>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="p-4 text-gray-500 italic">{{ emptyMessage }}</div>
</template>
