<script setup lang="ts">
import { QuestStatus } from "../../../modules/quests/common.ts";
import type { EnvironmentView } from "../../../modules/environment-view/types.ts";
import { useQuestBoard } from "../useEnvironmentView.ts";

/**
 * The quest board interior — **read-only, with no claim control**.
 *
 * That is the point, not an omission: claiming is an adventurer's decision, and
 * a button here would let the player do the adventurers' job for them. It also
 * keeps this panel inside the read-only-interfaces model (the Market keeps its
 * own `MarketPanel` precisely because it has controls).
 *
 * It does not reuse `BuildingInterior2D`: the guild has no workers and no
 * inventory, and the board replaces both. The visual language is deliberately
 * the same so it still reads as one family.
 *
 * Quests come from `questService` via `useQuestBoard()`, not from the building —
 * the guild owns neither the quests nor the adventurers, it is only where they
 * meet (ADR 0002).
 */
defineProps<{
  view: EnvironmentView | null;
}>();

const quests = useQuestBoard();

const STATUS_CLASS: Record<QuestStatus, string> = {
  [QuestStatus.Open]: 'bg-amber-900/40 border-amber-700 text-amber-300',
  [QuestStatus.Claimed]: 'bg-sky-900/40 border-sky-700 text-sky-300',
  [QuestStatus.Fulfilled]: 'bg-gray-700/40 border-gray-600 text-gray-400',
};
</script>

<template>
  <div v-if="view" class="p-4 flex flex-col gap-4">
    <!-- Title + funds -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold">{{ view.name }}</h2>
      <div class="rounded border px-3 py-1 font-semibold bg-amber-900/40 border-amber-700 text-amber-300">
        ⚑ {{ view.funds }} g
      </div>
    </div>

    <!-- Interior banner (decorative only — encodes no board state) -->
    <div class="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
      <svg
        viewBox="0 0 640 140"
        preserveAspectRatio="xMidYMid meet"
        class="w-full h-auto block"
        role="img"
        aria-label="Inside the Adventurers' Guild: a notice board hung with quest parchments, flanked by banners"
      >
        <defs>
          <linearGradient id="ag-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3a3327" />
            <stop offset="100%" stop-color="#1c1913" />
          </linearGradient>
          <linearGradient id="ag-banner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d8b76a" />
            <stop offset="100%" stop-color="#9a7a33" />
          </linearGradient>
          <radialGradient id="ag-hearth" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stop-color="#ffb347" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#ffb347" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- wall, beams and floor -->
        <rect x="0" y="0" width="640" height="140" fill="url(#ag-wall)" />
        <g opacity="0.3" fill="#231e16">
          <rect x="96" y="0" width="10" height="122" />
          <rect x="316" y="0" width="10" height="122" />
          <rect x="536" y="0" width="10" height="122" />
          <rect x="0" y="26" width="640" height="8" />
        </g>
        <rect x="0" y="122" width="640" height="18" fill="#4a3a22" />
        <rect x="0" y="122" width="640" height="4" fill="#33280f" />

        <!-- banners on the back wall -->
        <g>
          <rect x="150" y="34" width="46" height="62" fill="url(#ag-banner)" />
          <path d="M150 96 L173 110 L196 96 Z" fill="#9a7a33" />
          <path d="M173 50 L182 66 L173 82 L164 66 Z" fill="#2f2717" opacity="0.8" />

          <rect x="444" y="34" width="46" height="62" fill="url(#ag-banner)" />
          <path d="M444 96 L467 110 L490 96 Z" fill="#9a7a33" />
          <path d="M467 50 L476 66 L467 82 L458 66 Z" fill="#2f2717" opacity="0.8" />
        </g>

        <!-- the notice board itself -->
        <g>
          <rect x="238" y="30" width="164" height="92" rx="3" fill="#8a6038" />
          <rect x="244" y="36" width="152" height="80" rx="2" fill="#6b4a2a" />
          <!-- pinned parchments, slightly askew -->
          <g fill="#efe4c8">
            <rect x="254" y="44" width="38" height="30" rx="1" transform="rotate(-4 273 59)" />
            <rect x="302" y="42" width="42" height="32" rx="1" transform="rotate(3 323 58)" />
            <rect x="352" y="46" width="36" height="28" rx="1" transform="rotate(-2 370 60)" />
            <rect x="262" y="82" width="44" height="28" rx="1" transform="rotate(2 284 96)" />
            <rect x="322" y="80" width="38" height="30" rx="1" transform="rotate(-3 341 95)" />
          </g>
          <!-- ink lines on the parchments -->
          <g stroke="#8c7a55" stroke-width="1.5" opacity="0.7">
            <line x1="259" y1="53" x2="286" y2="51" />
            <line x1="259" y1="59" x2="282" y2="57" />
            <line x1="307" y1="52" x2="338" y2="54" />
            <line x1="307" y1="59" x2="332" y2="60" />
            <line x1="357" y1="55" x2="383" y2="54" />
            <line x1="267" y1="91" x2="300" y2="93" />
            <line x1="327" y1="89" x2="356" y2="87" />
          </g>
          <!-- pins -->
          <g fill="#b5524a">
            <circle cx="273" cy="46" r="2.6" />
            <circle cx="323" cy="45" r="2.6" />
            <circle cx="370" cy="48" r="2.6" />
            <circle cx="284" cy="84" r="2.6" />
            <circle cx="341" cy="83" r="2.6" />
          </g>
        </g>

        <!-- hearth at the far right, where adventurers will wait -->
        <g transform="translate(576, 122)">
          <ellipse cx="0" cy="-26" rx="46" ry="34" fill="url(#ag-hearth)" />
          <rect x="-30" y="-46" width="60" height="46" fill="#57534e" />
          <rect x="-22" y="-30" width="44" height="30" fill="#241f19" />
          <g class="ag-flame">
            <path d="M0 -28 C -11 -17, -9 -5, 0 -3 C 9 -5, 11 -17, 0 -28 Z" fill="#fb923c" />
            <path d="M0 -21 C -6 -14, -5 -6, 0 -4 C 5 -6, 6 -14, 0 -21 Z" fill="#fde68a" />
          </g>
        </g>

        <!-- a bench and a pair of tankards on the left -->
        <g transform="translate(52, 122)">
          <rect x="-30" y="-16" width="76" height="7" rx="2" fill="#7c5a30" />
          <rect x="-24" y="-9" width="7" height="9" fill="#5c4222" />
          <rect x="33" y="-9" width="7" height="9" fill="#5c4222" />
          <rect x="-8" y="-26" width="11" height="10" rx="2" fill="#9ca3af" />
          <rect x="12" y="-24" width="11" height="8" rx="2" fill="#9ca3af" />
        </g>
      </svg>
    </div>

    <!-- Quest board -->
    <div>
      <div class="flex items-baseline justify-between mb-2">
        <h3 class="text-lg font-semibold">Quest Board</h3>
        <span class="text-xs text-gray-400">read-only — adventurers claim their own work</span>
      </div>

      <div v-if="quests.length === 0" class="text-gray-500 italic text-sm">
        Nobody is hiring.
      </div>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="quest in quests"
          :key="quest.id"
          class="rounded border border-gray-700 bg-gray-800 px-3 py-2 flex flex-col gap-1"
          :class="{ 'opacity-60': quest.status === QuestStatus.Fulfilled }"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-medium">{{ quest.objective }}</span>
            <span class="text-sm font-bold tabular-nums text-amber-300">{{ quest.reward }} g</span>
          </div>
          <div class="flex items-center justify-between gap-2 text-xs text-gray-400">
            <span>
              <span class="text-gray-300">{{ quest.location }}</span>
              · posted by {{ quest.posterName }}
              <template v-if="quest.claimantName"> · claimed by
                <span class="text-sky-300">{{ quest.claimantName }}</span>
              </template>
            </span>
            <span class="rounded border px-2 py-0.5 font-semibold" :class="STATUS_CLASS[quest.status]">
              {{ quest.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="p-4 text-gray-500 italic">No data for the Adventurers' Guild.</div>
</template>

<style scoped>
/* Hearth flicker (decorative — the panel itself has no motion). */
.ag-flame {
  transform-box: fill-box;
  transform-origin: bottom center;
  animation: ag-flicker 1.7s ease-in-out infinite alternate;
}
@keyframes ag-flicker {
  from { transform: scaleY(0.9) scaleX(1.05); opacity: 0.85; }
  to { transform: scaleY(1.08) scaleX(0.95); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .ag-flame { animation: none; }
}
</style>
