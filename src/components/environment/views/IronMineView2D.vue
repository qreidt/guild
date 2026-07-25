<script setup lang="ts">
import type { EnvironmentView } from "../../../modules/environment-view/types.ts";
import BuildingInterior2D from "../BuildingInterior2D.vue";

defineProps<{
  view: EnvironmentView | null;
}>();
</script>

<template>
  <BuildingInterior2D
    :view="view"
    theme="sky"
    funds-icon="⛏"
    empty-message="No iron mine data."
  >
    <!-- Mine shaft backdrop banner (decorative only — encodes no worker state) -->
    <template #banner>
      <svg
        viewBox="0 0 640 140"
        preserveAspectRatio="xMidYMid meet"
        class="w-full h-auto block"
        role="img"
        aria-label="Iron mine shaft"
      >
        <defs>
          <linearGradient id="im-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3b4552" />
            <stop offset="100%" stop-color="#1c2431" />
          </linearGradient>
          <radialGradient id="im-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fcd34d" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#fcd34d" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- Rock face & floor -->
        <rect x="0" y="0" width="640" height="140" fill="url(#im-wall)" />
        <g opacity="0.35" stroke="#0f172a" stroke-width="2" fill="none">
          <path d="M210 0 L236 34 L214 62" />
          <path d="M330 8 L306 40 L338 70" />
          <path d="M614 12 L588 44 L620 74" />
        </g>
        <rect x="0" y="124" width="640" height="16" fill="#292524" />
        <rect x="0" y="124" width="640" height="4" fill="#1c1917" />

        <!-- Shaft mouth with timber framing -->
        <g>
          <path d="M56 124 V78 A40 34 0 0 1 136 78 V124 Z" fill="#0c0a09" />
          <ellipse cx="96" cy="116" rx="34" ry="14" fill="url(#im-glow)" />
          <rect x="44" y="70" width="12" height="54" fill="#6b4f2a" />
          <rect x="136" y="70" width="12" height="54" fill="#6b4f2a" />
          <rect x="36" y="60" width="120" height="12" rx="2" fill="#7c5a30" />
        </g>

        <!-- Pit lantern — outer group positions, inner group pulses -->
        <g transform="translate(206, 62)">
          <rect x="-1" y="-46" width="2" height="30" fill="#475569" />
          <g class="im-lamp">
            <circle cx="0" cy="0" r="26" fill="url(#im-glow)" />
          </g>
          <rect x="-8" y="-16" width="16" height="18" rx="2" fill="#334155" />
          <rect x="-5" y="-13" width="10" height="12" fill="#fcd34d" />
          <rect x="-9" y="-18" width="18" height="3" rx="1" fill="#475569" />
        </g>

        <!-- Rails + ore cart -->
        <g transform="translate(470, 124)">
          <g stroke="#4b5563" stroke-width="3">
            <line x1="-96" y1="-2" x2="96" y2="-2" />
            <line x1="-96" y1="-9" x2="96" y2="-9" />
          </g>
          <g fill="#57534e">
            <rect x="-84" y="-8" width="8" height="8" />
            <rect x="-44" y="-8" width="8" height="8" />
            <rect x="-4" y="-8" width="8" height="8" />
            <rect x="36" y="-8" width="8" height="8" />
            <rect x="76" y="-8" width="8" height="8" />
          </g>
          <g transform="translate(0, -10)">
            <circle cx="-20" cy="0" r="7" fill="#1e293b" />
            <circle cx="20" cy="0" r="7" fill="#1e293b" />
            <path d="M-34 -34 H34 L28 -6 H-28 Z" fill="#475569" />
            <path d="M-34 -34 H34 L31 -26 H-31 Z" fill="#64748b" />
            <!-- ore load -->
            <circle cx="-14" cy="-38" r="8" fill="#a8a29e" />
            <circle cx="2" cy="-41" r="9" fill="#78716c" />
            <circle cx="17" cy="-37" r="7" fill="#a8a29e" />
          </g>
        </g>

        <!-- Ambient rock dust drifting out of the shaft (decorative only) -->
        <g transform="translate(96, 104)">
          <circle class="im-dust d1" cx="-6" cy="0" r="1.8" fill="#cbd5e1" />
          <circle class="im-dust d2" cx="3" cy="0" r="1.5" fill="#94a3b8" />
          <circle class="im-dust d3" cx="10" cy="0" r="1.7" fill="#e2e8f0" />
        </g>
      </svg>
    </template>
  </BuildingInterior2D>
</template>

<style scoped>
/* Lantern glow pulse (ambient — the only motion besides progress fills). */
.im-lamp {
  transform-box: fill-box;
  transform-origin: center;
  animation: im-pulse 2.4s ease-in-out infinite alternate;
}
@keyframes im-pulse {
  from { transform: scale(0.9); opacity: 0.75; }
  to { transform: scale(1.08); opacity: 1; }
}

/* Ambient rock dust — decorative, drifts up and fades. */
.im-dust {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: im-drift 3s ease-out infinite;
}
.im-dust.d2 { animation-delay: 1s; animation-duration: 3.4s; }
.im-dust.d3 { animation-delay: 1.9s; animation-duration: 3.2s; }
@keyframes im-drift {
  0% { transform: translate(0, 0) scale(1); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translate(18px, -26px) scale(0.4); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .im-lamp, .im-dust { animation: none; }
}
</style>
