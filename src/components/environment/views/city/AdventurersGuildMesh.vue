<script setup lang="ts">
import HouseMesh from "./HouseMesh.vue";
import { PALETTE } from "./town-layout.ts";

/**
 * Adventurers' Guild: a broad timber-and-plaster hall with a stone porch, a
 * banner pole flying the guild colours, and the quest board itself standing
 * outside the door — the one detail that says what this building is for.
 * Pure presentation; sized by the group `scale`.
 */
withDefaults(
  defineProps<{
    position: [number, number, number];
    rotationY?: number;
    scale?: number;
  }>(),
  { rotationY: 0, scale: 1 },
);

const PLASTER = "#e3d2b0";
const HALL_ROOF = "#6b4f3a";
/** Guild colours — the same warm gold as the plot's legend tone. */
const BANNER = "#c2a15a";

/** Notices pinned to the board (local x, y offsets on its face). */
const NOTICES: [number, number][] = [
  [-0.28, 1.16],
  [0.06, 1.22],
  [0.3, 1.04],
  [-0.12, 0.94],
];
</script>

<template>
  <TresGroup :position="position" :rotation="[0, rotationY, 0]" :scale="[scale, scale, scale]">
    <!-- hall shell -->
    <HouseMesh
      :position="[0, 0, 0]"
      :width="3.6"
      :depth="2.8"
      :base-height="2.4"
      :roof-height="1.6"
      :wall-color="PLASTER"
      :roof-color="HALL_ROOF"
    />

    <!-- stone porch step at the entrance -->
    <TresMesh :position="[0, 0.09, 1.7]" receive-shadow>
      <TresBoxGeometry :args="[1.8, 0.18, 0.9]" />
      <TresMeshStandardMaterial :color="PALETTE.stone" />
    </TresMesh>

    <!-- porch posts + lintel -->
    <TresMesh v-for="x in [-0.75, 0.75]" :key="x" :position="[x, 0.95, 1.95]" cast-shadow>
      <TresBoxGeometry :args="[0.16, 1.7, 0.16]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>
    <TresMesh :position="[0, 1.88, 1.95]" cast-shadow>
      <TresBoxGeometry :args="[1.9, 0.18, 0.24]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>

    <!-- door -->
    <TresMesh :position="[0, 0.75, 1.42]">
      <TresBoxGeometry :args="[0.9, 1.5, 0.1]" />
      <TresMeshStandardMaterial :color="PALETTE.trunk" />
    </TresMesh>

    <!-- the quest board, standing beside the porch -->
    <TresGroup :position="[-1.55, 0, 1.6]" :rotation="[0, 0.5, 0]">
      <TresMesh v-for="x in [-0.42, 0.42]" :key="x" :position="[x, 0.55, 0]" cast-shadow>
        <TresBoxGeometry :args="[0.12, 1.1, 0.12]" />
        <TresMeshStandardMaterial :color="PALETTE.wood" />
      </TresMesh>
      <TresMesh :position="[0, 1.15, 0]" cast-shadow receive-shadow>
        <TresBoxGeometry :args="[1.1, 0.85, 0.1]" />
        <TresMeshStandardMaterial :color="PALETTE.plank" />
      </TresMesh>
      <!-- pinned notices -->
      <TresMesh v-for="(n, i) in NOTICES" :key="i" :position="[n[0], n[1], 0.06]">
        <TresBoxGeometry :args="[0.22, 0.26, 0.02]" />
        <TresMeshStandardMaterial color="#f5efdd" />
      </TresMesh>
    </TresGroup>

    <!-- banner pole + hanging guild banner -->
    <TresMesh :position="[1.7, 1.8, 1.5]" cast-shadow>
      <TresCylinderGeometry :args="[0.07, 0.07, 3.6, 8]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>
    <TresMesh :position="[1.7, 2.75, 1.72]" cast-shadow>
      <TresBoxGeometry :args="[0.06, 1.3, 0.5]" />
      <TresMeshStandardMaterial :color="BANNER" />
    </TresMesh>
    <TresMesh :position="[1.7, 3.62, 1.5]" cast-shadow>
      <TresBoxGeometry :args="[0.18, 0.18, 0.18]" />
      <TresMeshStandardMaterial :color="PALETTE.flag" />
    </TresMesh>
  </TresGroup>
</template>
