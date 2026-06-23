<script setup lang="ts">
import HouseMesh from "./HouseMesh.vue";
import { PALETTE } from "./town-layout.ts";

/**
 * A medieval storage warehouse / granary: a large timber barn shell (reusing
 * HouseMesh) with big plank doors, flanked by stacked crates, barrels and grain
 * sacks — the kind of depot you'd keep between the farm fields and the port.
 * Pure presentation; sized by the group `scale`.
 */
withDefaults(
  defineProps<{
    /** (x, y, z) — block centre at ground level. */
    position: [number, number, number];
    rotationY?: number;
    scale?: number;
  }>(),
  { rotationY: 0, scale: 1 },
);

const TIMBER = "#b98a55";
const BARN_ROOF = "#6b4f3a";

// Barrels (local x, z) around the barn.
const BARRELS: [number, number][] = [[-2.0, 1.6], [-2.4, 1.0], [2.2, -1.4]];
// Grain sacks (rounded) by the doors.
const SACKS: [number, number][] = [[1.9, 0.0], [2.2, 0.35], [1.7, -0.3]];
</script>

<template>
  <TresGroup :position="position" :rotation="[0, rotationY, 0]" :scale="[scale, scale, scale]">
    <!-- barn shell (a big, low, deep house) -->
    <HouseMesh
      :position="[0, 0, 0]"
      :width="3.6"
      :depth="4.4"
      :base-height="2.1"
      :roof-height="1.7"
      :wall-color="TIMBER"
      :roof-color="BARN_ROOF"
    />

    <!-- big plank doors on the gable end (facing +x) -->
    <TresMesh :position="[1.82, 1.0, 0]" cast-shadow>
      <TresBoxGeometry :args="[0.1, 1.9, 1.8]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>
    <!-- door cross-braces -->
    <TresMesh :position="[1.88, 1.0, 0]" :rotation="[0.6, 0, 0]" cast-shadow>
      <TresBoxGeometry :args="[0.06, 0.14, 2.4]" />
      <TresMeshStandardMaterial :color="BARN_ROOF" />
    </TresMesh>

    <!-- crate stack -->
    <TresMesh :position="[2.3, 0.35, 1.4]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[0.7, 0.7, 0.7]" />
      <TresMeshStandardMaterial :color="PALETTE.plank" />
    </TresMesh>
    <TresMesh :position="[2.4, 0.95, 1.55]" cast-shadow>
      <TresBoxGeometry :args="[0.6, 0.6, 0.6]" />
      <TresMeshStandardMaterial :color="PALETTE.plank" />
    </TresMesh>
    <TresMesh :position="[2.45, 0.3, 0.6]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[0.6, 0.6, 0.6]" />
      <TresMeshStandardMaterial :color="TIMBER" />
    </TresMesh>

    <!-- barrels -->
    <TresMesh v-for="(b, i) in BARRELS" :key="'bar' + i" :position="[b[0], 0.32, b[1]]" cast-shadow>
      <TresCylinderGeometry :args="[0.26, 0.26, 0.64, 8]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>

    <!-- grain sacks (rounded) -->
    <TresMesh v-for="(s, i) in SACKS" :key="'sack' + i" :position="[s[0], 0.22, s[1]]" cast-shadow>
      <TresSphereGeometry :args="[0.28, 8, 6]" />
      <TresMeshStandardMaterial :color="PALETTE.walls[1]" />
    </TresMesh>
  </TresGroup>
</template>
