<script setup lang="ts">
import { computed, onMounted, shallowRef } from "vue";
import { TresCanvas } from "@tresjs/core";
import type { DirectionalLight } from "three";
import type { BuildingID } from "../../../game/city/buildings/common/Building.ts";
import type { CityView } from "../../../modules/environment-view/types.ts";
import HouseMesh from "./city/HouseMesh.vue";
import TreeMesh from "./city/TreeMesh.vue";
import {
  DECORATIVE_HOUSES,
  GROUND_PATCHES,
  GROUND_SIZE,
  HERO_PLOTS,
  PALETTE,
  TREES,
  WALL_BOXES,
  type HeroPlot,
} from "./city/town-layout.ts";

/**
 * Kingdoms & Castles–style 45° village backdrop for the no-active-tab state.
 *
 * The town is authored, static geometry (see `town-layout.ts`) built once from
 * `three` primitives — fixed camera, grass terrain, walls + towers, water,
 * fields, decorative houses and a forest. The 4 real buildings render as larger,
 * flagged "hero" structures driven by the shared `CityView`; only the
 * money/citizens overlay is reactive (the town never rebuilds on a tick).
 *
 * Reads exclusively from the `CityView` prop — no engine access (R4.2).
 * `three` / `@tresjs/core` are imported only here; the container lazy-loads this
 * component so they stay out of the 2D / initial bundle.
 */
const props = defineProps<{
  view: CityView;
}>();

const GROUND_ROT: [number, number, number] = [-Math.PI / 2, 0, 0];

// Real buildings placed at their fixed plots. Keyed by id so per-tick
// re-renders patch the existing nodes rather than recreating them.
const heroBuildings = computed(() => {
  const out: { id: BuildingID; name: string; plot: HeroPlot }[] = [];
  for (const b of props.view.buildings) {
    const plot = HERO_PLOTS[b.id];
    if (plot) out.push({ id: b.id, name: b.name, plot });
  }
  return out;
});

// Configure the sun's shadow camera imperatively — pierced props alone don't
// re-run updateProjectionMatrix(), so the frustum wouldn't take effect.
const sun = shallowRef<DirectionalLight | null>(null);
onMounted(() => {
  const light = sun.value;
  if (!light || !light.shadow) return;
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  const cam = light.shadow.camera;
  cam.left = -36;
  cam.right = 36;
  cam.top = 36;
  cam.bottom = -36;
  cam.near = 1;
  cam.far = 100;
  cam.updateProjectionMatrix();
});
</script>

<template>
  <div class="relative w-full h-[72vh] min-h-[380px] rounded-lg overflow-hidden border border-gray-700">
    <TresCanvas :clear-color="PALETTE.sky" shadows>
      <TresPerspectiveCamera :position="[22, 29, 22]" :look-at="[-5, 1, 0]" :fov="45" />
      <TresAmbientLight :intensity="0.75" />
      <TresDirectionalLight ref="sun" :position="[26, 34, 14]" :intensity="1.45" color="#fff2dd" />
      <TresFog :args="[PALETTE.sky, 52, 120]" />

      <!-- grass ground -->
      <TresMesh :rotation="GROUND_ROT" receive-shadow>
        <TresPlaneGeometry :args="[GROUND_SIZE, GROUND_SIZE]" />
        <TresMeshStandardMaterial :color="PALETTE.grass" />
      </TresMesh>

      <!-- water / fields / paths: flat plates just above the grass -->
      <TresMesh
        v-for="p in GROUND_PATCHES"
        :key="p.id"
        :position="p.position"
        :rotation="GROUND_ROT"
        receive-shadow
      >
        <TresPlaneGeometry :args="[p.size[0], p.size[1]]" />
        <TresMeshStandardMaterial :color="p.color" />
      </TresMesh>

      <!-- perimeter walls + corner towers -->
      <TresMesh
        v-for="w in WALL_BOXES"
        :key="w.id"
        :position="w.position"
        :rotation="[0, w.rotationY ?? 0, 0]"
        cast-shadow
        receive-shadow
      >
        <TresBoxGeometry :args="w.size" />
        <TresMeshStandardMaterial :color="w.color" />
      </TresMesh>

      <!-- hero buildings (real game data) -->
      <HouseMesh
        v-for="h in heroBuildings"
        :key="h.id"
        :position="[h.plot.position[0], 0, h.plot.position[1]]"
        :width="2.2 * h.plot.scale"
        :depth="2.2 * h.plot.scale"
        :base-height="2.0 * h.plot.scale"
        :roof-height="1.6 * h.plot.scale"
        :wall-color="h.plot.wallColor"
        :roof-color="h.plot.roofColor"
        flag
        :flag-color="PALETTE.flag"
      />

      <!-- decorative houses -->
      <HouseMesh
        v-for="d in DECORATIVE_HOUSES"
        :key="d.id"
        :position="[d.position[0], 0, d.position[1]]"
        :rotation-y="d.rotationY"
        :width="d.width"
        :depth="d.depth"
        :base-height="d.baseHeight"
        :roof-height="d.roofHeight"
        :wall-color="d.wallColor"
        :roof-color="d.roofColor"
      />

      <!-- trees -->
      <TreeMesh
        v-for="t in TREES"
        :key="t.id"
        :position="[t.position[0], 0, t.position[1]]"
        :scale="t.scale"
        :foliage-color="PALETTE.foliage[0]"
      />
    </TresCanvas>

    <!-- City info overlay (plain HTML over the canvas) -->
    <div class="absolute top-0 left-0 p-4 flex flex-col gap-1 pointer-events-none">
      <h2 class="text-xl font-bold drop-shadow-lg">City</h2>
      <div class="drop-shadow-lg">Money: <span class="text-amber-300 font-semibold">{{ view.money }} g</span></div>
      <div class="drop-shadow-lg">Citizens: <span class="text-sky-300 font-semibold">{{ view.citizens }}</span></div>
    </div>

    <!-- Hero building legend -->
    <div class="absolute bottom-0 right-0 p-3 flex flex-wrap gap-2 justify-end pointer-events-none">
      <span
        v-for="h in heroBuildings"
        :key="h.id"
        class="text-xs px-2 py-1 rounded bg-black/50 backdrop-blur-sm"
      >
        <span :style="{ color: h.plot.roofColor }">■</span> {{ h.name }}
      </span>
    </div>
  </div>
</template>
