<script setup lang="ts">
import { computed } from "vue";
import { TresCanvas } from "@tresjs/core";
import type { CityView } from "../../../modules/environment-view/types.ts";

/**
 * Ambient 3D backdrop for the no-active-tab state: one simple block per city
 * building (the city "in the background"), with a money + citizens HTML overlay.
 *
 * Reads exclusively from the shared `CityView` prop — no engine access (R4.2).
 * `three` / `@tresjs/core` are imported only here; the container lazy-loads this
 * component so they stay out of the 2D / initial bundle.
 */
const props = defineProps<{
  view: CityView;
}>();

const GROUND_ROT: [number, number, number] = [-Math.PI / 2, 0, 0];
const PALETTE = ["#f59e0b", "#38bdf8", "#a3e635", "#f472b6", "#c084fc"];

// Lay the buildings out in a row of boxes; height nudges up with worker count.
const blocks = computed(() => {
  const buildings = props.view.buildings;
  const count = buildings.length;
  const spacing = 2.6;
  return buildings.map((b, i) => {
    const height = 1 + b.workerCount * 0.9;
    return {
      id: b.id,
      name: b.name,
      color: PALETTE[i % PALETTE.length],
      height,
      position: [(i - (count - 1) / 2) * spacing, height / 2, 0] as [number, number, number],
    };
  });
});
</script>

<template>
  <div class="relative w-full h-[70vh] min-h-[360px] rounded-lg overflow-hidden border border-gray-700">
    <TresCanvas clear-color="#0b1020">
      <TresPerspectiveCamera :position="[0, 4.5, 12]" :look-at="[0, 0.5, 0]" />
      <TresAmbientLight :intensity="0.55" />
      <TresDirectionalLight :position="[6, 9, 7]" :intensity="1.15" />

      <!-- ground plane -->
      <TresMesh :position="[0, 0, 0]" :rotation="GROUND_ROT">
        <TresPlaneGeometry :args="[48, 28]" />
        <TresMeshStandardMaterial color="#161b33" />
      </TresMesh>

      <!-- one block per building -->
      <TresMesh v-for="b in blocks" :key="b.id" :position="b.position">
        <TresBoxGeometry :args="[1.7, b.height, 1.7]" />
        <TresMeshStandardMaterial :color="b.color" />
      </TresMesh>
    </TresCanvas>

    <!-- City info overlay (plain HTML over the canvas) -->
    <div class="absolute top-0 left-0 p-4 flex flex-col gap-1 pointer-events-none">
      <h2 class="text-xl font-bold drop-shadow-lg">City</h2>
      <div class="drop-shadow-lg">Money: <span class="text-amber-300 font-semibold">{{ view.money }} g</span></div>
      <div class="drop-shadow-lg">Citizens: <span class="text-sky-300 font-semibold">{{ view.citizens }}</span></div>
    </div>

    <!-- Building legend -->
    <div class="absolute bottom-0 right-0 p-3 flex flex-wrap gap-2 justify-end pointer-events-none">
      <span
        v-for="b in blocks"
        :key="b.id"
        class="text-xs px-2 py-1 rounded bg-black/50 backdrop-blur-sm"
      >
        <span :style="{ color: b.color }">■</span> {{ b.name }}
      </span>
    </div>
  </div>
</template>
