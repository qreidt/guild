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
    theme="violet"
    funds-icon="⚗"
    empty-message="No apothecary data."
  >
    <!-- Apothecary workshop banner (decorative only — encodes no worker state) -->
    <template #banner>
      <svg
        viewBox="0 0 640 140"
        preserveAspectRatio="xMidYMid meet"
        class="w-full h-auto block"
        role="img"
        aria-label="Apothecary workshop with shelved bottles, a mortar and pestle, and a bubbling still"
      >
        <defs>
          <linearGradient id="ap-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3d3557" />
            <stop offset="100%" stop-color="#1d1a2b" />
          </linearGradient>
          <radialGradient id="ap-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#c4b5fd" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#c4b5fd" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="ap-brew" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#c4b5fd" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.9" />
          </linearGradient>
        </defs>

        <!-- Wall & workbench -->
        <rect x="0" y="0" width="640" height="140" fill="url(#ap-wall)" />
        <g opacity="0.22" stroke="#0f0d18" stroke-width="2">
          <line x1="150" y1="0" x2="150" y2="120" />
          <line x1="420" y1="0" x2="420" y2="120" />
        </g>
        <rect x="0" y="120" width="640" height="20" fill="#4a3a22" />
        <rect x="0" y="120" width="640" height="4" fill="#33280f" />

        <!-- Shelves of bottles -->
        <g>
          <!-- upper shelf plank -->
          <rect x="22" y="46" width="236" height="7" rx="2" fill="#7c5a30" />
          <rect x="22" y="53" width="236" height="3" fill="#5c4222" />
          <!-- upper shelf bottles (bottoms rest at y = 46) -->
          <g>
            <rect x="34" y="22" width="16" height="24" rx="3" fill="#4ade80" opacity="0.85" />
            <rect x="39" y="16" width="6" height="7" fill="#86efac" opacity="0.8" />
            <rect x="37" y="13" width="10" height="4" rx="1" fill="#b58b52" />

            <rect x="60" y="28" width="13" height="18" rx="3" fill="#fbbf24" opacity="0.85" />
            <rect x="64" y="22" width="5" height="7" fill="#fde68a" opacity="0.8" />
            <rect x="62" y="19" width="9" height="4" rx="1" fill="#b58b52" />

            <rect x="84" y="20" width="18" height="26" rx="3" fill="#a78bfa" opacity="0.9" />
            <rect x="90" y="13" width="6" height="8" fill="#ddd6fe" opacity="0.8" />
            <rect x="88" y="10" width="10" height="4" rx="1" fill="#b58b52" />

            <rect x="112" y="26" width="14" height="20" rx="3" fill="#38bdf8" opacity="0.82" />
            <rect x="116" y="20" width="6" height="7" fill="#bae6fd" opacity="0.8" />
            <rect x="114" y="17" width="10" height="4" rx="1" fill="#b58b52" />

            <rect x="136" y="23" width="16" height="23" rx="3" fill="#f472b6" opacity="0.82" />
            <rect x="141" y="17" width="6" height="7" fill="#fbcfe8" opacity="0.8" />
            <rect x="139" y="14" width="10" height="4" rx="1" fill="#b58b52" />

            <rect x="162" y="29" width="13" height="17" rx="3" fill="#34d399" opacity="0.85" />
            <rect x="166" y="23" width="5" height="7" fill="#a7f3d0" opacity="0.8" />
            <rect x="164" y="20" width="9" height="4" rx="1" fill="#b58b52" />

            <rect x="186" y="21" width="17" height="25" rx="3" fill="#f87171" opacity="0.82" />
            <rect x="191" y="14" width="6" height="8" fill="#fecaca" opacity="0.8" />
            <rect x="189" y="11" width="10" height="4" rx="1" fill="#b58b52" />

            <rect x="214" y="27" width="14" height="19" rx="3" fill="#c4b5fd" opacity="0.85" />
            <rect x="218" y="21" width="6" height="7" fill="#ede9fe" opacity="0.8" />
            <rect x="216" y="18" width="10" height="4" rx="1" fill="#b58b52" />

            <rect x="238" y="24" width="15" height="22" rx="3" fill="#fb923c" opacity="0.82" />
            <rect x="243" y="18" width="5" height="7" fill="#fed7aa" opacity="0.8" />
            <rect x="241" y="15" width="9" height="4" rx="1" fill="#b58b52" />
          </g>

          <!-- lower shelf plank -->
          <rect x="22" y="98" width="236" height="7" rx="2" fill="#7c5a30" />
          <rect x="22" y="105" width="236" height="3" fill="#5c4222" />
          <!-- lower shelf jars (bottoms rest at y = 98) -->
          <g>
            <rect x="34" y="76" width="26" height="22" rx="3" fill="#6b7280" opacity="0.75" />
            <rect x="34" y="82" width="26" height="9" fill="#9ca3af" opacity="0.55" />
            <rect x="36" y="72" width="22" height="5" rx="2" fill="#b58b52" />

            <rect x="72" y="72" width="24" height="26" rx="3" fill="#4ade80" opacity="0.7" />
            <rect x="72" y="80" width="24" height="9" fill="#dcfce7" opacity="0.45" />
            <rect x="74" y="68" width="20" height="5" rx="2" fill="#b58b52" />

            <rect x="110" y="78" width="28" height="20" rx="3" fill="#fbbf24" opacity="0.7" />
            <rect x="110" y="84" width="28" height="8" fill="#fef3c7" opacity="0.45" />
            <rect x="112" y="74" width="24" height="5" rx="2" fill="#b58b52" />

            <rect x="152" y="74" width="24" height="24" rx="3" fill="#a78bfa" opacity="0.75" />
            <rect x="152" y="81" width="24" height="9" fill="#ede9fe" opacity="0.45" />
            <rect x="154" y="70" width="20" height="5" rx="2" fill="#b58b52" />

            <rect x="190" y="79" width="26" height="19" rx="3" fill="#f87171" opacity="0.7" />
            <rect x="190" y="85" width="26" height="8" fill="#fee2e2" opacity="0.45" />
            <rect x="192" y="75" width="22" height="5" rx="2" fill="#b58b52" />

            <rect x="230" y="75" width="24" height="23" rx="3" fill="#38bdf8" opacity="0.7" />
            <rect x="230" y="82" width="24" height="9" fill="#e0f2fe" opacity="0.45" />
            <rect x="232" y="71" width="20" height="5" rx="2" fill="#b58b52" />
          </g>
        </g>

        <!-- Dried herb bundles hanging from the ceiling -->
        <g stroke="#8b6f47" stroke-width="2" fill="none">
          <line x1="292" y1="0" x2="292" y2="18" />
          <line x1="324" y1="0" x2="324" y2="10" />
        </g>
        <g>
          <path d="M292 18 L280 52 M292 18 L292 56 M292 18 L304 50 M292 18 L286 54 M292 18 L299 53"
                stroke="#3f6f3a" stroke-width="3" stroke-linecap="round" fill="none" />
          <circle cx="280" cy="52" r="3" fill="#4d8446" />
          <circle cx="292" cy="56" r="3" fill="#4d8446" />
          <circle cx="304" cy="50" r="3" fill="#4d8446" />
          <rect x="286" y="16" width="12" height="6" rx="2" fill="#8b6f47" />

          <path d="M324 10 L314 40 M324 10 L324 44 M324 10 L334 38 M324 10 L330 42"
                stroke="#6b7f3a" stroke-width="3" stroke-linecap="round" fill="none" />
          <circle cx="314" cy="40" r="2.6" fill="#8aa04a" />
          <circle cx="324" cy="44" r="2.6" fill="#8aa04a" />
          <circle cx="334" cy="38" r="2.6" fill="#8aa04a" />
          <rect x="318" y="8" width="12" height="6" rx="2" fill="#8b6f47" />
        </g>

        <!-- Mortar and pestle on the bench -->
        <g transform="translate(318, 120)">
          <ellipse cx="24" cy="0" rx="30" ry="5" fill="#0f0d18" opacity="0.35" />
          <path d="M2 -2 L8 -30 H40 L46 -2 Z" fill="#8a8f94" />
          <path d="M2 -2 L8 -30 H20 L14 -2 Z" fill="#a1a6ab" />
          <ellipse cx="24" cy="-30" rx="16" ry="5" fill="#6f7479" />
          <ellipse cx="24" cy="-30" rx="12" ry="3.4" fill="#4b5155" />
          <!-- crushed herb in the bowl -->
          <ellipse cx="24" cy="-30" rx="9" ry="2.4" fill="#4d8446" />
          <!-- pestle, leaning -->
          <g transform="rotate(-24 24 -30)">
            <rect x="20" y="-64" width="8" height="30" rx="4" fill="#b9bec3" />
            <ellipse cx="24" cy="-34" rx="7" ry="6" fill="#8a8f94" />
          </g>
          <!-- loose sprigs beside it -->
          <path d="M62 -2 L74 -14 M68 -2 L82 -10" stroke="#3f6f3a" stroke-width="3" stroke-linecap="round" />
          <circle cx="74" cy="-14" r="3" fill="#4d8446" />
          <circle cx="82" cy="-10" r="3" fill="#4d8446" />
        </g>

        <!-- Bubbling still -->
        <g transform="translate(516, 120)">
          <ellipse class="ap-glow" cx="0" cy="-40" rx="52" ry="42" fill="url(#ap-glow)" />

          <!-- brazier + flame -->
          <rect x="-22" y="-8" width="44" height="8" rx="2" fill="#57534e" />
          <rect x="-16" y="-2" width="6" height="2" fill="#3f3c39" />
          <rect x="10" y="-2" width="6" height="2" fill="#3f3c39" />
          <g class="ap-flame">
            <path d="M0 -30 C -9 -20, -8 -10, 0 -9 C 8 -10, 9 -20, 0 -30 Z" fill="#fb923c" />
            <path d="M0 -24 C -5 -17, -4 -11, 0 -10 C 4 -11, 5 -17, 0 -24 Z" fill="#fde68a" />
          </g>

          <!-- round-bottom flask -->
          <path d="M-8 -84 H8 V-70 A26 26 0 1 1 -8 -70 Z" fill="url(#ap-brew)" stroke="#ddd6fe" stroke-width="2" stroke-opacity="0.55" />
          <path d="M-24 -48 A26 26 0 0 0 24 -48 Z" fill="#7c3aed" opacity="0.75" />
          <ellipse cx="-10" cy="-56" rx="4" ry="8" fill="#ede9fe" opacity="0.28" transform="rotate(-24 -10 -56)" />
          <rect x="-11" y="-90" width="22" height="7" rx="3" fill="#b58b52" />

          <!-- bubbles rising in the brew -->
          <g>
            <circle class="ap-bubble b1" cx="-8" cy="-46" r="3" fill="#ede9fe" />
            <circle class="ap-bubble b2" cx="3" cy="-46" r="2.2" fill="#ddd6fe" />
            <circle class="ap-bubble b3" cx="11" cy="-46" r="2.6" fill="#f5f3ff" />
          </g>

          <!-- condenser arm into a collection vial -->
          <path d="M22 -80 C 52 -78, 60 -60, 60 -40" stroke="#c4b5fd" stroke-width="4" fill="none" stroke-opacity="0.7" stroke-linecap="round" />
          <rect x="50" y="-40" width="20" height="34" rx="4" fill="#a78bfa" opacity="0.55" stroke="#ddd6fe" stroke-width="1.5" stroke-opacity="0.5" />
          <rect x="50" y="-22" width="20" height="16" rx="2" fill="#7c3aed" opacity="0.8" />
        </g>
      </svg>
    </template>
  </BuildingInterior2D>
</template>

<style scoped>
/* Ambient still glow (decorative — the only motion besides progress fills). */
.ap-glow {
  transform-box: fill-box;
  transform-origin: center;
  animation: ap-pulse 3.2s ease-in-out infinite alternate;
}
@keyframes ap-pulse {
  from { transform: scale(0.92); opacity: 0.7; }
  to { transform: scale(1.06); opacity: 1; }
}

/* Burner flame flicker. */
.ap-flame {
  transform-box: fill-box;
  transform-origin: bottom center;
  animation: ap-flicker 1.5s ease-in-out infinite alternate;
}
@keyframes ap-flicker {
  from { transform: scaleY(0.88) scaleX(1.04); opacity: 0.85; }
  to { transform: scaleY(1.08) scaleX(0.96); opacity: 1; }
}

/* Bubbles rising through the brew. */
.ap-bubble {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: ap-rise 2.6s ease-in infinite;
}
.ap-bubble.b2 { animation-delay: 0.9s; animation-duration: 2.2s; }
.ap-bubble.b3 { animation-delay: 1.7s; animation-duration: 3s; }
@keyframes ap-rise {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  25% { opacity: 0.85; }
  100% { transform: translateY(-26px) scale(1); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ap-glow, .ap-flame, .ap-bubble { animation: none; }
}
</style>
