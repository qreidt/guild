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
    theme="emerald"
    funds-icon="🪵"
    empty-message="No lumber mill data."
  >
    <!-- Sawmill backdrop banner (decorative only — encodes no worker state) -->
    <template #banner>
      <svg
        viewBox="0 0 640 140"
        preserveAspectRatio="xMidYMid meet"
        class="w-full h-auto block"
        role="img"
        aria-label="Lumber mill sawhouse"
      >
        <defs>
          <linearGradient id="lm-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3f3a33" />
            <stop offset="100%" stop-color="#26221d" />
          </linearGradient>
          <radialGradient id="lm-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="#a3e635" stop-opacity="0.18" />
            <stop offset="100%" stop-color="#a3e635" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- Back wall & floor -->
        <rect x="0" y="0" width="640" height="140" fill="url(#lm-wall)" />
        <rect x="0" y="124" width="640" height="16" fill="#2a2118" />
        <rect x="0" y="124" width="640" height="4" fill="#1a140f" />

        <!-- Forest hinted through the back of the mill -->
        <g fill="#14532d" opacity="0.55">
          <path d="M556 124 L574 78 L592 124 Z" />
          <path d="M560 100 L574 66 L588 100 Z" />
          <path d="M596 124 L610 88 L624 124 Z" />
        </g>

        <!-- Daylight pooling over the saw bench -->
        <ellipse cx="112" cy="88" rx="96" ry="62" fill="url(#lm-glow)" />

        <!-- Saw bench + circular blade -->
        <g>
          <rect x="40" y="96" width="150" height="10" rx="3" fill="#6b4f2a" />
          <rect x="52" y="106" width="10" height="20" fill="#57422a" />
          <rect x="168" y="106" width="10" height="20" fill="#57422a" />
          <!-- log on the bench, mid-cut -->
          <rect x="58" y="78" width="124" height="18" rx="9" fill="#8b5e34" />
          <ellipse cx="58" cy="87" rx="6" ry="9" fill="#a97142" />
          <!-- Outer group positions the blade; inner group spins -->
          <g transform="translate(122, 72)">
            <g class="lm-blade">
              <circle r="22" fill="#94a3b8" opacity="0.35" />
              <circle r="30" fill="none" stroke="#e2e8f0" stroke-width="5" stroke-dasharray="7 9" />
              <circle r="5" fill="#64748b" />
            </g>
          </g>
        </g>

        <!-- Timber yard: plank stack + log pile -->
        <g transform="translate(470, 124)">
          <rect x="-56" y="-12" width="112" height="8" rx="2" fill="#b98b56" />
          <rect x="-52" y="-21" width="104" height="8" rx="2" fill="#a97a4a" />
          <rect x="-48" y="-30" width="96" height="8" rx="2" fill="#c19a66" />
          <g>
            <circle cx="-26" cy="-46" r="15" fill="#8b5e34" />
            <circle cx="-26" cy="-46" r="7" fill="#a97142" />
            <circle cx="8" cy="-46" r="15" fill="#8b5e34" />
            <circle cx="8" cy="-46" r="7" fill="#a97142" />
            <circle cx="-9" cy="-72" r="15" fill="#8b5e34" />
            <circle cx="-9" cy="-72" r="7" fill="#a97142" />
          </g>
        </g>

        <!-- Ambient sawdust drifting off the cut (decorative only) -->
        <g transform="translate(150, 92)">
          <circle class="lm-dust d1" cx="-4" cy="0" r="1.8" fill="#e7d3ae" />
          <circle class="lm-dust d2" cx="4" cy="0" r="1.5" fill="#d6bd91" />
          <circle class="lm-dust d3" cx="11" cy="0" r="1.7" fill="#f0e2c4" />
        </g>
      </svg>
    </template>
  </BuildingInterior2D>
</template>

<style scoped>
/* Saw blade rotation (ambient — the only motion besides progress fills). */
.lm-blade {
  transform-box: fill-box;
  transform-origin: center;
  animation: lm-spin 3.2s linear infinite;
}
@keyframes lm-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Ambient sawdust — decorative, drifts down and fades. */
.lm-dust {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: lm-fall 2.2s ease-in infinite;
}
.lm-dust.d2 { animation-delay: 0.7s; animation-duration: 2.6s; }
.lm-dust.d3 { animation-delay: 1.4s; animation-duration: 2.4s; }
@keyframes lm-fall {
  0% { transform: translate(0, 0) scale(1); opacity: 0; }
  20% { opacity: 0.9; }
  100% { transform: translate(14px, 28px) scale(0.4); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .lm-blade, .lm-dust { animation: none; }
}
</style>
