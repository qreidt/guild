<script setup lang="ts">
import type { EnvironmentView } from "../../../modules/environment-view/types.ts";

defineProps<{
  view: EnvironmentView | null;
}>();

function pct(progress: number): string {
  return `${Math.round(progress * 100)}%`;
}
</script>

<template>
  <div v-if="view" class="p-4 flex flex-col gap-4">
    <!-- Title + funds -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold">{{ view.name }}</h2>
      <div class="rounded bg-amber-900/40 border border-amber-700 px-3 py-1 text-amber-300 font-semibold">
        ⚒ {{ view.funds }} g
      </div>
    </div>

    <!-- Furnace backdrop banner (decorative only — encodes no worker state) -->
    <div class="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
      <svg
        viewBox="0 0 640 140"
        preserveAspectRatio="xMidYMid meet"
        class="w-full h-auto block"
        role="img"
        aria-label="Blacksmith forge"
      >
        <defs>
          <linearGradient id="bs-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3f3f46" />
            <stop offset="100%" stop-color="#27272a" />
          </linearGradient>
          <linearGradient id="bs-fire" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#7c2d12" />
            <stop offset="45%" stop-color="#ea580c" />
            <stop offset="80%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#fde68a" />
          </linearGradient>
          <radialGradient id="bs-glow" cx="50%" cy="60%" r="60%">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- Back wall & floor -->
        <rect x="0" y="0" width="640" height="140" fill="url(#bs-wall)" />
        <rect x="0" y="124" width="640" height="16" fill="#292524" />
        <rect x="0" y="124" width="640" height="4" fill="#1c1917" />

        <!-- Forge -->
        <g>
          <rect x="62" y="26" width="100" height="30" rx="6" fill="#44403c" />
          <rect x="48" y="54" width="128" height="72" rx="6" fill="#57534e" />
          <ellipse cx="112" cy="98" rx="70" ry="46" fill="url(#bs-glow)" />
          <rect x="78" y="72" width="68" height="52" rx="6" fill="#1c1917" />
          <!-- Outer group positions/scales the authored flame; inner group flickers -->
          <g transform="translate(50, -14) scale(0.56)">
            <g class="bs-fire">
              <path d="M111 246 C 86 214 100 196 96 178 C 116 196 120 196 111 168 C 132 188 142 214 132 238 Z" fill="url(#bs-fire)" />
              <path d="M111 246 C 99 222 108 208 106 192 C 118 206 120 208 114 188 C 126 204 130 222 124 240 Z" fill="#fde68a" opacity="0.9" />
            </g>
          </g>
          <rect x="52" y="54" width="120" height="7" fill="#78716c" />
        </g>

        <!-- Anvil + ambient sparks (decorative only) -->
        <g transform="translate(470, 124)">
          <rect x="-24" y="-16" width="48" height="16" fill="#1e293b" />
          <rect x="-10" y="-30" width="20" height="14" fill="#1e293b" />
          <path d="M-30 -44 H24 L34 -38 L24 -30 H-26 L-30 -36 Z" fill="#334155" />
          <rect x="-30" y="-44" width="60" height="5" fill="#475569" />
        </g>
        <g class="bs-sparks" transform="translate(470, 80)">
          <circle class="bs-spark s1" cx="-5" cy="0" r="2" fill="#fde68a" />
          <circle class="bs-spark s2" cx="2" cy="0" r="1.6" fill="#f59e0b" />
          <circle class="bs-spark s3" cx="8" cy="0" r="1.8" fill="#fbbf24" />
        </g>
      </svg>
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
              <span :class="worker.status === 'working' ? 'text-amber-300 font-medium' : 'text-gray-500 italic'">
                {{ worker.status === 'working' ? (worker.task ?? 'idle') : 'idle' }}
              </span>
              <span class="text-xs text-gray-400 tabular-nums w-9 text-right">{{ pct(worker.progress) }}</span>
            </div>
          </div>
          <div class="h-2 w-full rounded bg-gray-700 overflow-hidden">
            <div
              class="h-full rounded transition-all duration-300"
              :class="worker.status === 'working' ? 'bg-amber-500' : 'bg-gray-600'"
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
          <span class="text-sm font-bold text-amber-300 tabular-nums">×{{ row.count }}</span>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="p-4 text-gray-500 italic">No blacksmith data.</div>
</template>

<style scoped>
/* Forge flame flicker (ambient — the only motion besides progress fills). */
.bs-fire {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: bs-flicker 1.1s ease-in-out infinite alternate;
}
@keyframes bs-flicker {
  from { transform: scaleY(0.92) scaleX(1.03); opacity: 0.9; }
  to { transform: scaleY(1.06) scaleX(0.97); opacity: 1; }
}

/* Ambient anvil sparks — decorative, rise and fade. */
.bs-spark {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: bs-rise 1.6s ease-out infinite;
}
.bs-spark.s2 { animation-delay: 0.55s; animation-duration: 1.9s; }
.bs-spark.s3 { animation-delay: 1.05s; animation-duration: 1.7s; }
@keyframes bs-rise {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translateY(-30px) scale(0.3); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .bs-fire, .bs-spark { animation: none; }
}
</style>
