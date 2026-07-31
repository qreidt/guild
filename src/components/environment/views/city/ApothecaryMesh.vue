<script setup lang="ts">
import HouseMesh from "./HouseMesh.vue";
import { PALETTE } from "./town-layout.ts";

/**
 * Apothecary: a timbered shop with a steep herb-green roof, a chimney carrying a
 * small copper still, a hanging shop sign on a bracket, and drying-herb planters
 * out front. Sized for a 2×2 plot (6×6 world units) and readable at the fixed
 * 45° camera distance. Pure presentation; sized by the group `scale`.
 */
withDefaults(
  defineProps<{
    position: [number, number, number];
    rotationY?: number;
    scale?: number;
  }>(),
  // Default yaw is a half-turn, unlike the other hero meshes. The shop front
  // (door, window, sign, planters) is authored at +z, but this plot sits on the
  // WEST side of the j=0 road — so the front has to look back toward -z to face
  // the street rather than turn its back on it.
  { rotationY: Math.PI, scale: 1 },
);

const TIMBER = "#e0d2b4";
const HERB_ROOF = "#4a6b46";
const COPPER = "#b87333";
const GLASS = "#8f7fd4";
// Lay cylinders along X (default axis is Y).
const LOG_ROT: [number, number, number] = [0, 0, Math.PI / 2];
</script>

<template>
  <TresGroup :position="position" :rotation="[0, rotationY, 0]" :scale="[scale, scale, scale]">
    <!-- shop shell: a steep roof reads as "apothecary" at this camera distance -->
    <HouseMesh
      :position="[0, 0, 0]"
      :width="3.0"
      :depth="2.6"
      :base-height="2.0"
      :roof-height="2.2"
      :wall-color="TIMBER"
      :roof-color="HERB_ROOF"
    />

    <!-- timber framing on the front wall -->
    <TresMesh :position="[-0.9, 1.0, 1.32]" cast-shadow>
      <TresBoxGeometry :args="[0.14, 2.0, 0.08]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>
    <TresMesh :position="[0.9, 1.0, 1.32]" cast-shadow>
      <TresBoxGeometry :args="[0.14, 2.0, 0.08]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>
    <TresMesh :position="[0, 1.9, 1.32]" cast-shadow>
      <TresBoxGeometry :args="[3.0, 0.14, 0.08]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>

    <!-- shop window with a lit bottle behind the glass -->
    <TresMesh :position="[-0.55, 1.1, 1.34]" cast-shadow>
      <TresBoxGeometry :args="[0.8, 0.8, 0.06]" />
      <TresMeshStandardMaterial :color="GLASS" :emissive="GLASS" :emissive-intensity="0.5" />
    </TresMesh>

    <!-- door -->
    <TresMesh :position="[0.55, 0.55, 1.34]" cast-shadow>
      <TresBoxGeometry :args="[0.7, 1.1, 0.06]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>

    <!-- chimney with a small copper still on top -->
    <TresMesh :position="[-1.0, 2.3, -0.7]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[0.6, 3.4, 0.6]" />
      <TresMeshStandardMaterial :color="PALETTE.stone" />
    </TresMesh>
    <TresMesh :position="[-1.0, 4.15, -0.7]" cast-shadow>
      <TresSphereGeometry :args="[0.42, 10, 8]" />
      <TresMeshStandardMaterial :color="COPPER" />
    </TresMesh>
    <TresMesh :position="[-1.0, 4.62, -0.7]" cast-shadow>
      <TresCylinderGeometry :args="[0.1, 0.16, 0.55, 8]" />
      <TresMeshStandardMaterial :color="COPPER" />
    </TresMesh>

    <!-- hanging shop sign on a bracket -->
    <TresMesh :position="[1.62, 2.05, 0.9]" :rotation="LOG_ROT" cast-shadow>
      <TresCylinderGeometry :args="[0.05, 0.05, 0.7, 6]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>
    <TresMesh :position="[1.92, 1.72, 0.9]" cast-shadow>
      <TresCylinderGeometry :args="[0.04, 0.04, 0.5, 6]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>
    <TresMesh :position="[1.92, 1.24, 0.9]" cast-shadow>
      <TresBoxGeometry :args="[0.08, 0.7, 0.75]" />
      <TresMeshStandardMaterial :color="HERB_ROOF" />
    </TresMesh>

    <!-- planters of drying herbs out front -->
    <TresMesh :position="[-1.7, 0.2, 1.5]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[0.9, 0.4, 0.5]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>
    <TresMesh :position="[-1.7, 0.55, 1.5]" cast-shadow>
      <TresConeGeometry :args="[0.42, 0.6, 7]" />
      <TresMeshStandardMaterial :color="PALETTE.foliage[1]" />
    </TresMesh>
    <TresMesh :position="[0.1, 0.16, 2.05]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[0.7, 0.32, 0.45]" />
      <TresMeshStandardMaterial :color="PALETTE.wood" />
    </TresMesh>
    <TresMesh :position="[0.1, 0.46, 2.05]" cast-shadow>
      <TresConeGeometry :args="[0.34, 0.5, 7]" />
      <TresMeshStandardMaterial :color="PALETTE.foliage[0]" />
    </TresMesh>

    <!-- crate of gathered herbs beside the door -->
    <TresMesh :position="[1.5, 0.22, 1.9]" :rotation="[0, 0.3, 0]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[0.55, 0.44, 0.55]" />
      <TresMeshStandardMaterial :color="PALETTE.plank" />
    </TresMesh>
    <TresMesh :position="[1.5, 0.5, 1.9]" :rotation="[0, 0.3, 0]" cast-shadow>
      <TresBoxGeometry :args="[0.5, 0.16, 0.5]" />
      <TresMeshStandardMaterial :color="PALETTE.foliage[2]" />
    </TresMesh>
  </TresGroup>
</template>
