<script setup lang="ts">
import HouseMesh from "./HouseMesh.vue";
import { PALETTE } from "./town-layout.ts";

/**
 * Lumber mill: a small cabin (reusing HouseMesh) flanked by the signature
 * stacks of horizontal logs, a stack of sawn planks and a sawhorse. Pure
 * presentation; sized by the group `scale`.
 */
withDefaults(
  defineProps<{
    position: [number, number, number];
    rotationY?: number;
    scale?: number;
  }>(),
  { rotationY: 0, scale: 1 },
);

const TIMBER = "#caa877";
const WOOD_ROOF = "#7a4a2a";
// Lay cylinders along X (default axis is Y).
const LOG_ROT: [number, number, number] = [0, 0, Math.PI / 2];
// One 3-2-1 pyramid of parallel logs (local positions), separated in Z.
const LOG_STACK: [number, number, number][] = [
  [0, 0.24, -0.5],
  [0, 0.24, 0],
  [0, 0.24, 0.5],
  [0, 0.66, -0.25],
  [0, 0.66, 0.25],
  [0, 1.06, 0],
];
</script>

<template>
  <TresGroup :position="position" :rotation="[0, rotationY, 0]" :scale="[scale, scale, scale]">
    <!-- cabin shell -->
    <HouseMesh
      :position="[1.2, 0, -0.4]"
      :width="2.6"
      :depth="2.2"
      :base-height="1.9"
      :roof-height="1.3"
      :wall-color="TIMBER"
      :roof-color="WOOD_ROOF"
    />

    <!-- two horizontal log stacks (signature) -->
    <TresGroup :position="[-1.6, 0, 0.8]">
      <TresMesh v-for="(l, i) in LOG_STACK" :key="i" :position="l" :rotation="LOG_ROT" cast-shadow receive-shadow>
        <TresCylinderGeometry :args="[0.24, 0.24, 2.4, 8]" />
        <TresMeshStandardMaterial :color="PALETTE.wood" />
      </TresMesh>
    </TresGroup>
    <TresGroup :position="[-1.6, 0, -1.9]">
      <TresMesh v-for="(l, i) in LOG_STACK" :key="'b' + i" :position="l" :rotation="LOG_ROT" cast-shadow receive-shadow>
        <TresCylinderGeometry :args="[0.22, 0.22, 2.4, 8]" />
        <TresMeshStandardMaterial :color="PALETTE.wood" />
      </TresMesh>
    </TresGroup>

    <!-- plank stack -->
    <TresMesh :position="[1.5, 0.09, 1.7]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[1.8, 0.18, 0.8]" />
      <TresMeshStandardMaterial :color="PALETTE.plank" />
    </TresMesh>
    <TresMesh :position="[1.5, 0.29, 1.7]" :rotation="[0, 0.16, 0]" cast-shadow>
      <TresBoxGeometry :args="[1.8, 0.18, 0.8]" />
      <TresMeshStandardMaterial :color="PALETTE.plank" />
    </TresMesh>

    <!-- sawhorse with a log -->
    <TresMesh :position="[3.1, 0.55, -0.6]" :rotation="LOG_ROT" cast-shadow>
      <TresCylinderGeometry :args="[0.2, 0.2, 1.8, 8]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>
    <TresMesh :position="[2.6, 0.27, -0.6]" cast-shadow>
      <TresBoxGeometry :args="[0.1, 0.55, 0.5]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>
    <TresMesh :position="[3.6, 0.27, -0.6]" cast-shadow>
      <TresBoxGeometry :args="[0.1, 0.55, 0.5]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>
  </TresGroup>
</template>
