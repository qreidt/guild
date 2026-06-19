<script setup lang="ts">
import { computed } from "vue";
import type { EnvironmentView } from "../../../modules/environment-view/types.ts";

const props = defineProps<{
  view: EnvironmentView | null;
}>();

// Lay smiths out across the scene; expect 2 (Smith 1 / Smith 2).
const smiths = computed(() => {
  const workers = props.view?.workers ?? [];
  const startX = 300;
  const gap = 200;
  return workers.map((w, i) => ({
    label: w.label,
    task: w.task,
    status: w.status,
    progress: Math.min(1, Math.max(0, w.progress)),
    cx: startX + i * gap,
  }));
});

const PROGRESS_W = 150;

function pct(p: number): string {
  return `${Math.round(p * 100)}%`;
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

    <!-- Illustrated forge scene -->
    <div class="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
      <svg
        viewBox="0 0 640 340"
        preserveAspectRatio="xMidYMid meet"
        class="w-full h-auto block"
        role="img"
        :aria-label="`Blacksmith interior with ${smiths.length} workers`"
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

        <!-- Walls & floor -->
        <rect x="0" y="0" width="640" height="270" fill="url(#bs-wall)" />
        <g opacity="0.18" stroke="#18181b" stroke-width="2">
          <line x1="0" y1="60" x2="640" y2="60" />
          <line x1="0" y1="120" x2="640" y2="120" />
          <line x1="0" y1="180" x2="640" y2="180" />
          <line x1="120" y1="0" x2="120" y2="180" />
          <line x1="360" y1="0" x2="360" y2="180" />
          <line x1="520" y1="0" x2="520" y2="180" />
        </g>
        <rect x="0" y="270" width="640" height="70" fill="#292524" />
        <rect x="0" y="270" width="640" height="6" fill="#1c1917" />

        <!-- Forge -->
        <g>
          <rect x="36" y="150" width="150" height="120" rx="6" fill="#57534e" />
          <rect x="52" y="120" width="118" height="44" rx="6" fill="#44403c" />
          <ellipse cx="111" cy="210" rx="78" ry="58" fill="url(#bs-glow)" />
          <rect x="66" y="176" width="90" height="70" rx="6" fill="#1c1917" />
          <g class="bs-fire">
            <path d="M111 246 C 86 214 100 196 96 178 C 116 196 120 196 111 168 C 132 188 142 214 132 238 Z" fill="url(#bs-fire)" />
            <path d="M111 246 C 99 222 108 208 106 192 C 118 206 120 208 114 188 C 126 204 130 222 124 240 Z" fill="#fde68a" opacity="0.9" />
          </g>
          <rect x="40" y="150" width="142" height="8" fill="#78716c" />
        </g>

        <!-- Smith stations -->
        <g v-for="s in smiths" :key="s.label" :class="{ 'bs-idle': s.status === 'idle' }">
          <!-- name + task plaque -->
          <rect :x="s.cx - 90" y="20" width="180" height="46" rx="6" fill="#18181b" stroke="#3f3f46" />
          <text :x="s.cx" y="40" text-anchor="middle" fill="#fafafa" font-size="15" font-weight="700">
            {{ s.label }}
          </text>
          <text
            :x="s.cx" y="58" text-anchor="middle" font-size="13"
            :fill="s.status === 'working' ? '#fcd34d' : '#71717a'"
            :font-style="s.task ? 'normal' : 'italic'"
          >
            {{ s.task ?? 'idle' }}
          </text>

          <!-- progress bar -->
          <rect :x="s.cx - PROGRESS_W / 2" y="78" :width="PROGRESS_W" height="10" rx="5" fill="#374151" />
          <rect
            :x="s.cx - PROGRESS_W / 2" y="78" :width="PROGRESS_W * s.progress" height="10" rx="5"
            :fill="s.status === 'working' ? '#22c55e' : '#6b7280'"
            class="bs-bar"
          />
          <text :x="s.cx" y="103" text-anchor="middle" fill="#a1a1aa" font-size="11">{{ pct(s.progress) }}</text>

          <!-- smith figure -->
          <g :transform="`translate(${s.cx}, 130)`">
            <!-- head -->
            <circle cx="0" cy="18" r="14" fill="#d6a87a" />
            <rect x="-15" y="6" width="30" height="9" rx="3" fill="#3f3f46" />
            <!-- torso / apron -->
            <rect x="-22" y="34" width="44" height="58" rx="10" fill="#52525b" />
            <path d="M-16 36 H16 L12 92 H-12 Z" fill="#7c2d12" />
            <!-- arm + hammer (animates while working) -->
            <g class="bs-arm" transform-origin="-18 46">
              <rect x="-40" y="40" width="26" height="10" rx="5" fill="#d6a87a" />
              <rect x="-46" y="20" width="8" height="26" rx="3" fill="#92400e" />
              <rect x="-54" y="12" width="24" height="12" rx="2" fill="#3f3f46" />
            </g>
          </g>

          <!-- anvil -->
          <g :transform="`translate(${s.cx}, 244)`">
            <rect x="-26" y="24" width="52" height="14" fill="#0f172a" />
            <rect x="-10" y="10" width="20" height="18" fill="#1e293b" />
            <path d="M-30 0 H26 L34 6 L26 14 H-22 L-30 8 Z" fill="#334155" />
            <rect x="-30" y="0" width="60" height="5" fill="#475569" />
          </g>
        </g>
      </svg>
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
/* Forge flame flicker. */
.bs-fire {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: bs-flicker 1.1s ease-in-out infinite alternate;
}
@keyframes bs-flicker {
  from { transform: scaleY(0.92) scaleX(1.03); opacity: 0.9; }
  to { transform: scaleY(1.06) scaleX(0.97); opacity: 1; }
}

/* Hammer strike — only animated for working smiths. */
.bs-arm {
  transform-box: fill-box;
  transform-origin: right center;
}
g:not(.bs-idle) > g .bs-arm {
  animation: bs-strike 0.85s ease-in-out infinite;
}
@keyframes bs-strike {
  0%, 100% { transform: rotate(-32deg); }
  55% { transform: rotate(8deg); }
}

/* Idle smiths read as dimmed. */
.bs-idle {
  opacity: 0.55;
}

.bs-bar {
  transition: width 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .bs-fire, .bs-arm { animation: none; }
}
</style>
