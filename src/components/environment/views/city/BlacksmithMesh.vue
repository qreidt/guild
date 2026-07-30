<script setup lang="ts">
import HouseMesh from "./HouseMesh.vue";
import { PALETTE } from "./town-layout.ts";

/**
 * Blacksmith workshop: a timber building shell (reusing HouseMesh) with a tall
 * stone chimney, a glowing forge at the open front, an anvil and a coal pile.
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

const TIMBER = "#cdb79a";
const SOOT_ROOF = "#4a4640";
</script>

<template>
  <TresGroup :position="position" :rotation="[0, rotationY, 0]" :scale="[scale, scale, scale]">
    <!-- workshop shell -->
    <HouseMesh
      :position="[0, 0, 0]"
      :width="3.2"
      :depth="2.6"
      :base-height="2.2"
      :roof-height="1.5"
      :wall-color="TIMBER"
      :roof-color="SOOT_ROOF"
    />

    <!-- stone chimney + cap -->
    <TresMesh :position="[1.1, 2.1, -0.8]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[0.7, 4.2, 0.7]" />
      <TresMeshStandardMaterial :color="PALETTE.stone" />
    </TresMesh>
    <TresMesh :position="[1.1, 4.25, -0.8]" cast-shadow>
      <TresBoxGeometry :args="[0.9, 0.25, 0.9]" />
      <TresMeshStandardMaterial :color="PALETTE.towerStone" />
    </TresMesh>

    <!-- forge hearth + glowing coals at the front -->
    <TresMesh :position="[0.8, 0.4, 1.55]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[1.0, 0.8, 0.8]" />
      <TresMeshStandardMaterial :color="PALETTE.ironDark" />
    </TresMesh>
    <TresMesh :position="[0.8, 0.85, 1.55]">
      <TresBoxGeometry :args="[0.66, 0.3, 0.5]" />
      <TresMeshStandardMaterial :color="PALETTE.ironDark" :emissive="PALETTE.forge" :emissive-intensity="1.4" />
    </TresMesh>

    <!-- anvil -->
    <TresMesh :position="[-0.5, 0.18, 1.6]" cast-shadow>
      <TresBoxGeometry :args="[0.2, 0.36, 0.22]" />
      <TresMeshStandardMaterial :color="PALETTE.ironDark" />
    </TresMesh>
    <TresMesh :position="[-0.5, 0.45, 1.6]" cast-shadow>
      <TresBoxGeometry :args="[0.55, 0.16, 0.24]" />
      <TresMeshStandardMaterial :color="PALETTE.ironDark" />
    </TresMesh>

    <!-- coal pile -->
    <TresMesh :position="[1.7, 0.2, 1.3]" cast-shadow>
      <TresConeGeometry :args="[0.4, 0.4, 8]" />
      <TresMeshStandardMaterial :color="PALETTE.ironDark" />
    </TresMesh>
  </TresGroup>
</template>
