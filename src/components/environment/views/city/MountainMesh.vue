<script setup lang="ts">
import { computed } from "vue";
import { PALETTE } from "./town-layout.ts";

/**
 * A low-poly, flat-shaded mountain: a grey rock cone with a snow cap. Pure
 * presentation — a background feature out to the north-west.
 */
const props = defineProps<{
  /** (x, y, z) — y is ground level (0). */
  position: [number, number, number];
  radius: number;
  height: number;
}>();

const bodyY = computed(() => props.height / 2);
const capH = computed(() => props.height * 0.32);
const capR = computed(() => props.radius * 0.42);
const capY = computed(() => props.height - capH.value / 2);
</script>

<template>
  <TresGroup :position="position">
    <TresMesh :position="[0, bodyY, 0]" cast-shadow receive-shadow>
      <TresConeGeometry :args="[radius, height, 7]" />
      <TresMeshStandardMaterial :color="PALETTE.rock" :flat-shading="true" />
    </TresMesh>
    <TresMesh :position="[0, capY, 0]" cast-shadow>
      <TresConeGeometry :args="[capR, capH, 7]" />
      <TresMeshStandardMaterial color="#eef2f6" :flat-shading="true" />
    </TresMesh>
  </TresGroup>
</template>
