<script setup lang="ts">
import { PALETTE } from "./town-layout.ts";

/**
 * A medieval harbour. A small stone-and-timber quay hut sits on the land side
 * (local −x), a planked dock on posts reaches out over the water (local +x, the
 * sea), with a timber treadwheel-style loading crane, a moored single-mast boat,
 * and barrels/crates on the deck. Pure presentation; sized by the group `scale`.
 *
 * Local +x faces the sea (the structure is placed un-rotated so +x = world +x =
 * south). Footprint is the 6×6 plot; the dock + boat extend beyond it into the
 * water by design.
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

const STONE = PALETTE.towerStone;
const TIMBER = PALETTE.wood;
const PLANK = PALETTE.plank;
const DECK_Y = 0.34;

// Dock support posts (local x, z) reaching down to the water.
const POSTS: [number, number][] = [
  [0.4, -1.7], [0.4, 1.7],
  [2.4, -1.7], [2.4, 1.7],
  [4.3, -1.7], [4.3, 1.7],
];
// Cargo on the deck.
const BARRELS: [number, number][] = [[1.4, -1.0], [1.9, -0.5], [3.4, 0.9]];
const CRATES: [number, number, number][] = [
  [1.2, 0.8, 0.55], // x, z, size
  [1.75, 1.0, 0.5],
  [3.6, -0.9, 0.5],
];
</script>

<template>
  <TresGroup :position="position" :rotation="[0, rotationY, 0]" :scale="[scale, scale, scale]">
    <!-- ── land side: stone quay hut (harbour master) ── -->
    <TresMesh :position="[-2.0, 0.9, 0.4]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[2.0, 1.8, 2.4]" />
      <TresMeshStandardMaterial :color="STONE" />
    </TresMesh>
    <!-- timber gable roof -->
    <TresMesh :position="[-2.0, 2.1, 0.4]" :rotation="[0, Math.PI / 4, 0]" cast-shadow>
      <TresConeGeometry :args="[1.9, 1.0, 4]" />
      <TresMeshStandardMaterial :color="PALETTE.roofs[5]" />
    </TresMesh>
    <!-- a low stone quay wall edging the water -->
    <TresMesh :position="[-0.4, 0.3, 0.4]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[0.7, 0.6, 5.2]" />
      <TresMeshStandardMaterial :color="STONE" />
    </TresMesh>

    <!-- ── planked dock deck over the water ── -->
    <TresMesh :position="[2.4, DECK_Y, 0]" receive-shadow cast-shadow>
      <TresBoxGeometry :args="[5.4, 0.16, 3.6]" />
      <TresMeshStandardMaterial :color="PLANK" />
    </TresMesh>
    <!-- support posts -->
    <TresMesh v-for="(p, i) in POSTS" :key="'post' + i" :position="[p[0], -0.1, p[1]]" cast-shadow>
      <TresCylinderGeometry :args="[0.13, 0.13, 1.0, 6]" />
      <TresMeshStandardMaterial :color="TIMBER" />
    </TresMesh>

    <!-- ── timber loading crane ── -->
    <TresMesh :position="[1.0, 1.4, 1.3]" cast-shadow>
      <TresBoxGeometry :args="[0.28, 2.2, 0.28]" />
      <TresMeshStandardMaterial :color="TIMBER" />
    </TresMesh>
    <!-- slanted jib reaching out over the water -->
    <TresMesh :position="[2.0, 2.3, 1.3]" :rotation="[0, 0, -0.7]" cast-shadow>
      <TresBoxGeometry :args="[2.4, 0.2, 0.2]" />
      <TresMeshStandardMaterial :color="TIMBER" />
    </TresMesh>
    <!-- hanging rope + crate -->
    <TresMesh :position="[3.0, 1.7, 1.3]" cast-shadow>
      <TresCylinderGeometry :args="[0.02, 0.02, 1.0, 4]" />
      <TresMeshStandardMaterial color="#5b4636" />
    </TresMesh>
    <TresMesh :position="[3.0, 1.05, 1.3]" cast-shadow>
      <TresBoxGeometry :args="[0.5, 0.5, 0.5]" />
      <TresMeshStandardMaterial :color="PLANK" />
    </TresMesh>

    <!-- ── moored single-mast boat (east side of the dock) ── -->
    <TresGroup :position="[3.2, 0.18, -2.4]">
      <!-- hull -->
      <TresMesh :position="[0, 0, 0]" cast-shadow receive-shadow>
        <TresBoxGeometry :args="[2.6, 0.5, 0.9]" />
        <TresMeshStandardMaterial :color="TIMBER" />
      </TresMesh>
      <!-- raised prow -->
      <TresMesh :position="[1.4, 0.12, 0]" :rotation="[0, 0, 0.5]" cast-shadow>
        <TresBoxGeometry :args="[0.6, 0.5, 0.85]" />
        <TresMeshStandardMaterial :color="TIMBER" />
      </TresMesh>
      <!-- mast -->
      <TresMesh :position="[0, 1.1, 0]" cast-shadow>
        <TresCylinderGeometry :args="[0.07, 0.07, 2.0, 6]" />
        <TresMeshStandardMaterial :color="TIMBER" />
      </TresMesh>
      <!-- furled/square sail -->
      <TresMesh :position="[0, 1.35, 0]" cast-shadow>
        <TresBoxGeometry :args="[0.06, 1.0, 1.3]" />
        <TresMeshStandardMaterial :color="PALETTE.cloth[0]" />
      </TresMesh>
    </TresGroup>

    <!-- ── deck cargo ── -->
    <TresMesh v-for="(b, i) in BARRELS" :key="'bar' + i" :position="[b[0], DECK_Y + 0.33, b[1]]" cast-shadow>
      <TresCylinderGeometry :args="[0.22, 0.22, 0.56, 8]" />
      <TresMeshStandardMaterial :color="TIMBER" />
    </TresMesh>
    <TresMesh v-for="(c, i) in CRATES" :key="'crate' + i" :position="[c[0], DECK_Y + c[2] / 2, c[1]]" cast-shadow>
      <TresBoxGeometry :args="[c[2], c[2], c[2]]" />
      <TresMeshStandardMaterial :color="PLANK" />
    </TresMesh>
  </TresGroup>
</template>
