<script setup lang="ts">
import { PALETTE } from "./town-layout.ts";

/**
 * Iron mine: a faceted rocky mound with a dark tunnel portal, a timber-framed
 * entrance, an A-frame headframe and ore/rock heaps. Pure presentation; sized
 * by the group `scale`.
 */
withDefaults(
  defineProps<{
    position: [number, number, number];
    rotationY?: number;
    scale?: number;
  }>(),
  { rotationY: 0, scale: 1 },
);

const TIMBER = "#6b4a2b";
const ORE = "#8a4a32";
// A-frame beams lean toward each other over the entrance.
const A_LEFT: [number, number, number] = [0, 0, 0.32];
const A_RIGHT: [number, number, number] = [0, 0, -0.32];
</script>

<template>
  <TresGroup :position="position" :rotation="[0, rotationY, 0]" :scale="[scale, scale, scale]">
    <!-- rocky mound the mine tunnels into (faceted, flat-shaded) -->
    <TresMesh :position="[-0.4, 0.5, -1.0]" :scale="[1.4, 0.8, 1.2]" cast-shadow receive-shadow>
      <TresIcosahedronGeometry :args="[2.2, 0]" />
      <TresMeshStandardMaterial :color="PALETTE.rock" :flat-shading="true" />
    </TresMesh>
    <TresMesh :position="[1.7, 0.3, -1.7]" :scale="[1, 0.7, 1]" cast-shadow receive-shadow>
      <TresIcosahedronGeometry :args="[1.0, 0]" />
      <TresMeshStandardMaterial :color="PALETTE.rock" :flat-shading="true" />
    </TresMesh>

    <!-- dark tunnel portal -->
    <TresMesh :position="[0, 0.6, 0.5]" cast-shadow>
      <TresBoxGeometry :args="[1.1, 1.2, 0.7]" />
      <TresMeshStandardMaterial color="#15171a" />
    </TresMesh>

    <!-- timber portal frame -->
    <TresMesh :position="[-0.62, 0.65, 0.9]" cast-shadow>
      <TresBoxGeometry :args="[0.18, 1.3, 0.18]" />
      <TresMeshStandardMaterial :color="TIMBER" />
    </TresMesh>
    <TresMesh :position="[0.62, 0.65, 0.9]" cast-shadow>
      <TresBoxGeometry :args="[0.18, 1.3, 0.18]" />
      <TresMeshStandardMaterial :color="TIMBER" />
    </TresMesh>
    <TresMesh :position="[0, 1.3, 0.9]" cast-shadow>
      <TresBoxGeometry :args="[1.5, 0.2, 0.2]" />
      <TresMeshStandardMaterial :color="TIMBER" />
    </TresMesh>

    <!-- A-frame headframe over the entrance -->
    <TresMesh :position="[-0.55, 1.1, 1.25]" :rotation="A_LEFT" cast-shadow>
      <TresBoxGeometry :args="[0.16, 2.3, 0.16]" />
      <TresMeshStandardMaterial :color="TIMBER" />
    </TresMesh>
    <TresMesh :position="[0.55, 1.1, 1.25]" :rotation="A_RIGHT" cast-shadow>
      <TresBoxGeometry :args="[0.16, 2.3, 0.16]" />
      <TresMeshStandardMaterial :color="TIMBER" />
    </TresMesh>
    <TresMesh :position="[0, 1.55, 1.25]" cast-shadow>
      <TresBoxGeometry :args="[1.25, 0.16, 0.16]" />
      <TresMeshStandardMaterial :color="TIMBER" />
    </TresMesh>

    <!-- ore / rock heaps -->
    <TresMesh :position="[1.8, 0.25, 0.9]" cast-shadow>
      <TresConeGeometry :args="[0.5, 0.5, 7]" />
      <TresMeshStandardMaterial :color="PALETTE.rock" />
    </TresMesh>
    <TresMesh :position="[-1.9, 0.2, 0.6]" cast-shadow>
      <TresConeGeometry :args="[0.45, 0.45, 7]" />
      <TresMeshStandardMaterial :color="PALETTE.rock" />
    </TresMesh>
    <TresMesh :position="[1.4, 0.2, 1.7]" cast-shadow>
      <TresConeGeometry :args="[0.4, 0.4, 7]" />
      <TresMeshStandardMaterial :color="ORE" />
    </TresMesh>
  </TresGroup>
</template>
