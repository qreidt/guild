<script setup lang="ts">
import { computed } from "vue";

/**
 * One reusable stylised house: a box base + a pitched (4-sided pyramid) roof,
 * with an optional flag to mark "hero" buildings. Pure presentation — every
 * dimension/colour comes from props; no engine access.
 */
const props = withDefaults(
  defineProps<{
    /** (x, y, z) — y is ground level (0). */
    position: [number, number, number];
    rotationY?: number;
    width: number;
    depth: number;
    baseHeight: number;
    roofHeight: number;
    wallColor: string;
    roofColor: string;
    flag?: boolean;
    flagColor?: string;
  }>(),
  {
    rotationY: 0,
    flag: false,
    flagColor: "#d23b3b",
  },
);

// Pyramid roof, rotated 45° so its 4 faces sit over the 4 walls. Radius is
// sized so the square base circumscribes the footprint, with a slight overhang.
const ROOF_ROT: [number, number, number] = [0, Math.PI / 4, 0];
const roofRadius = computed(() => (Math.max(props.width, props.depth) / 2) * Math.SQRT2 * 1.04);
const baseCenterY = computed(() => props.baseHeight / 2);
const roofCenterY = computed(() => props.baseHeight + props.roofHeight / 2);
const apexY = computed(() => props.baseHeight + props.roofHeight);
</script>

<template>
  <TresGroup :position="position" :rotation="[0, rotationY, 0]">
    <!-- walls -->
    <TresMesh :position="[0, baseCenterY, 0]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[width, baseHeight, depth]" />
      <TresMeshStandardMaterial :color="wallColor" />
    </TresMesh>

    <!-- pitched pyramid roof -->
    <TresMesh :position="[0, roofCenterY, 0]" :rotation="ROOF_ROT" cast-shadow>
      <TresConeGeometry :args="[roofRadius, roofHeight, 4]" />
      <TresMeshStandardMaterial :color="roofColor" />
    </TresMesh>

    <!-- optional flag (hero buildings) -->
    <template v-if="flag">
      <TresMesh :position="[0, apexY + 0.6, 0]" cast-shadow>
        <TresCylinderGeometry :args="[0.05, 0.05, 1.2, 6]" />
        <TresMeshStandardMaterial color="#5b4636" />
      </TresMesh>
      <TresMesh :position="[0.28, apexY + 0.95, 0]" cast-shadow>
        <TresBoxGeometry :args="[0.5, 0.32, 0.04]" />
        <TresMeshStandardMaterial :color="flagColor" />
      </TresMesh>
    </template>
  </TresGroup>
</template>
