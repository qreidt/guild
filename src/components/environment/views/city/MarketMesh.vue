<script setup lang="ts">
import { PALETTE } from "./town-layout.ts";

/**
 * Manor Lords–style marketplace: a loose cluster of open stalls (wooden counter
 * + corner poles + a slanted cloth canopy + wares) around a central market
 * cross, on a cobbled pad. Pure presentation; sized by the group `scale`.
 */
withDefaults(
  defineProps<{
    /** (x, y, z) — y is ground level (0). */
    position: [number, number, number];
    rotationY?: number;
    scale?: number;
  }>(),
  { rotationY: 0, scale: 1 },
);

// Stall placements (local x, z) — a rough ring leaving the centre for the cross.
const STALLS: { x: number; z: number; rotY: number }[] = [
  { x: -1.8, z: -1.6, rotY: 0 },
  { x: 1.8, z: -1.6, rotY: 0 },
  { x: -1.8, z: 1.6, rotY: Math.PI / 2 },
  { x: 1.8, z: 1.6, rotY: Math.PI / 2 },
  { x: 0, z: 2.7, rotY: 0 },
];
const POLE_OFFSETS: [number, number][] = [
  [-0.6, -0.34],
  [0.6, -0.34],
  [-0.6, 0.34],
  [0.6, 0.34],
];
// Single-pitch lean-to tilt for the canopies.
const CANOPY_ROT: [number, number, number] = [0.34, 0, 0];
</script>

<template>
  <TresGroup :position="position" :rotation="[0, rotationY, 0]" :scale="[scale, scale, scale]">
    <!-- cobbled market pad -->
    <TresMesh :position="[0, 0.03, 0]" receive-shadow>
      <TresBoxGeometry :args="[6, 0.06, 6]" />
      <TresMeshStandardMaterial :color="PALETTE.path" />
    </TresMesh>

    <!-- central market cross -->
    <TresMesh :position="[0, 0.1, 0]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[1.0, 0.2, 1.0]" />
      <TresMeshStandardMaterial :color="PALETTE.stone" />
    </TresMesh>
    <TresMesh :position="[0, 0.3, 0]" cast-shadow>
      <TresBoxGeometry :args="[0.6, 0.2, 0.6]" />
      <TresMeshStandardMaterial :color="PALETTE.stone" />
    </TresMesh>
    <TresMesh :position="[0, 1.4, 0]" cast-shadow>
      <TresBoxGeometry :args="[0.24, 2.0, 0.24]" />
      <TresMeshStandardMaterial :color="PALETTE.stone" />
    </TresMesh>
    <TresMesh :position="[0, 2.35, 0]" cast-shadow>
      <TresBoxGeometry :args="[0.6, 0.18, 0.18]" />
      <TresMeshStandardMaterial :color="PALETTE.stone" />
    </TresMesh>

    <!-- stalls -->
    <TresGroup v-for="(s, i) in STALLS" :key="i" :position="[s.x, 0, s.z]" :rotation="[0, s.rotY, 0]">
      <!-- counter -->
      <TresMesh :position="[0, 0.35, 0]" cast-shadow receive-shadow>
        <TresBoxGeometry :args="[1.3, 0.7, 0.8]" />
        <TresMeshStandardMaterial :color="PALETTE.wood" />
      </TresMesh>
      <!-- corner poles -->
      <TresMesh v-for="(p, j) in POLE_OFFSETS" :key="j" :position="[p[0], 0.75, p[1]]" cast-shadow>
        <TresBoxGeometry :args="[0.08, 1.5, 0.08]" />
        <TresMeshStandardMaterial :color="PALETTE.wood" />
      </TresMesh>
      <!-- slanted cloth canopy -->
      <TresMesh :position="[0, 1.55, 0]" :rotation="CANOPY_ROT" cast-shadow>
        <TresBoxGeometry :args="[1.7, 0.08, 1.1]" />
        <TresMeshStandardMaterial :color="PALETTE.cloth[i % PALETTE.cloth.length]" />
      </TresMesh>
      <!-- wares: crate + barrel on the counter -->
      <TresMesh :position="[-0.3, 0.92, 0]" cast-shadow>
        <TresBoxGeometry :args="[0.42, 0.42, 0.42]" />
        <TresMeshStandardMaterial :color="PALETTE.plank" />
      </TresMesh>
      <TresMesh :position="[0.45, 0.95, 0.1]" cast-shadow>
        <TresCylinderGeometry :args="[0.2, 0.2, 0.5, 8]" />
        <TresMeshStandardMaterial :color="PALETTE.wood" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>
