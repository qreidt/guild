<script setup lang="ts">
import { useAdventurerRoster } from "../environment/useEnvironmentView.ts";

/**
 * The roster — every adventurer, and what they are doing right now.
 *
 * Read-only, like the building interiors: an adventurer chooses their own work,
 * and a control here would let the player do it for them. It is not registered
 * in `environment-registry.ts` because that registry is keyed by `BuildingID`
 * and adventurers belong to no building — which is the whole point of them.
 *
 * The task and progress bar are deliberately the same treatment a worker gets in
 * `BuildingInterior2D`: progress is judged the same way whoever is doing the work.
 */
const adventurers = useAdventurerRoster();
</script>

<template>
  <div class="p-4 flex flex-col gap-4">
    <div class="flex items-baseline justify-between">
      <h2 class="text-xl font-bold">Adventurers</h2>
      <span class="text-xs text-gray-400">read-only — they choose their own work</span>
    </div>

    <div v-if="adventurers.length === 0" class="text-gray-500 italic text-sm">
      Nobody has come to town yet.
    </div>

    <div v-else class="flex flex-col gap-3">
      <div
        v-for="adventurer in adventurers"
        :key="adventurer.id"
        class="rounded-lg border border-gray-700 bg-gray-800 p-3 flex flex-col gap-2"
      >
        <!-- Name, class/rank, purse -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-baseline gap-2">
            <span class="font-bold text-lg">{{ adventurer.name }}</span>
            <span class="text-xs text-gray-400">{{ adventurer.rank }} {{ adventurer.class }}</span>
          </div>
          <div class="rounded border px-2 py-0.5 text-sm font-semibold bg-amber-900/40 border-amber-700 text-amber-300">
            {{ adventurer.funds }} g
          </div>
        </div>

        <!-- Where, and what -->
        <div class="flex items-center justify-between gap-2 text-sm">
          <span class="text-gray-400">
            at the <span class="text-gray-200">{{ adventurer.location }}</span>
          </span>
          <span
            class="rounded border px-2 py-0.5 text-xs font-semibold"
            :class="adventurer.status === 'working'
              ? 'bg-sky-900/40 border-sky-700 text-sky-300'
              : 'bg-gray-700/40 border-gray-600 text-gray-400'"
          >
            {{ adventurer.task ?? 'Idle' }}
          </span>
        </div>

        <!-- Progress on the current action -->
        <div class="h-1.5 w-full rounded bg-gray-700 overflow-hidden">
          <div
            class="h-full bg-sky-500 transition-all duration-300"
            :style="{ width: `${Math.round(adventurer.progress * 100)}%` }"
          />
        </div>

        <!-- The quest they hold -->
        <div class="text-xs text-gray-400">
          <template v-if="adventurer.questObjective">
            on <span class="text-gray-300">{{ adventurer.questObjective }}</span>
            <span class="text-gray-500"> ({{ adventurer.questId }})</span>
          </template>
          <template v-else>no quest claimed</template>
        </div>

        <!-- What they are carrying -->
        <div>
          <div class="text-xs uppercase tracking-wide text-gray-500 mb-1">Carrying</div>
          <div v-if="adventurer.carrying.length === 0" class="text-gray-500 italic text-sm">
            nothing
          </div>
          <div v-else class="flex flex-wrap gap-1.5">
            <span
              v-for="row in adventurer.carrying"
              :key="row.itemId"
              class="rounded border border-gray-600 bg-gray-900 px-2 py-0.5 text-xs"
            >
              {{ row.name }} <span class="text-gray-400 tabular-nums">×{{ row.count }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
