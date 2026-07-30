<script setup lang="ts">
/**
 * One reusable stylised tree: a trunk + two stacked conical canopies. Pure
 * presentation; uniform `scale` keeps it cheap. No engine access.
 */
withDefaults(
  defineProps<{
    /** (x, y, z) — y is ground level (0). */
    position: [number, number, number];
    scale?: number;
    trunkColor?: string;
    foliageColor?: string;
  }>(),
  {
    scale: 1,
    trunkColor: "#7a5234",
    foliageColor: "#4e9a45",
  },
);
</script>

<template>
  <TresGroup :position="position" :scale="[scale, scale, scale]">
    <TresMesh :position="[0, 0.5, 0]" cast-shadow>
      <TresCylinderGeometry :args="[0.16, 0.22, 1, 6]" />
      <TresMeshStandardMaterial :color="trunkColor" />
    </TresMesh>
    <TresMesh :position="[0, 1.7, 0]" cast-shadow>
      <TresConeGeometry :args="[0.95, 1.7, 8]" />
      <TresMeshStandardMaterial :color="foliageColor" />
    </TresMesh>
    <TresMesh :position="[0, 2.6, 0]" cast-shadow>
      <TresConeGeometry :args="[0.7, 1.3, 8]" />
      <TresMeshStandardMaterial :color="foliageColor" />
    </TresMesh>
  </TresGroup>
</template>
