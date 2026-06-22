<script setup lang="ts">
import { computed } from "vue";
import HouseMesh from "./HouseMesh.vue";
import { PALETTE } from "./town-layout.ts";

/**
 * A dense "5 or more" housing block filling a 2×2 (6×6) plot — the mesh a 2×2
 * cluster of single houses merges into. Packs several small `HouseMesh`
 * dwellings (varied size/colour) tightly so it reads as a town quarter, clearly
 * denser than a lone house and distinct from the hero buildings. Pure
 * presentation; deterministic from `seed`.
 */
const props = withDefaults(
  defineProps<{
    /** (x, y, z) — block centre at ground level. */
    position: [number, number, number];
    rotationY?: number;
    seed?: number;
  }>(),
  { rotationY: 0, seed: 1 },
);

// Eight tightly-packed dwelling slots within the 6×6 footprint (local x, z).
const SLOTS: { x: number; z: number }[] = [
  { x: -1.5, z: -1.5 },
  { x: 1.5, z: -1.5 },
  { x: -1.5, z: 1.5 },
  { x: 1.5, z: 1.5 },
  { x: 0, z: 0 },
  { x: -1.6, z: 0 },
  { x: 1.6, z: 0.2 },
  { x: 0.1, z: -1.7 },
];

function rng(n: number): () => number {
  let s = (props.seed + n * 2654435761) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dwellings = computed(() =>
  SLOTS.map((slot, i) => {
    const r = rng(i);
    const size = 1.05 + r() * 0.45; // 1.05 .. 1.5 — small, packed
    return {
      key: i,
      position: [slot.x, 0, slot.z] as [number, number, number],
      rotationY: Math.round(r() * 3) * (Math.PI / 2),
      width: size,
      depth: size,
      baseHeight: 1.1 + r() * 1.0, // varied heights → a packed quarter
      roofHeight: 0.7 + r() * 0.5,
      wallColor: PALETTE.walls[i % PALETTE.walls.length],
      roofColor: PALETTE.roofs[i % PALETTE.roofs.length],
    };
  }),
);
</script>

<template>
  <TresGroup :position="position" :rotation="[0, rotationY, 0]">
    <HouseMesh
      v-for="d in dwellings"
      :key="d.key"
      :position="d.position"
      :rotation-y="d.rotationY"
      :width="d.width"
      :depth="d.depth"
      :base-height="d.baseHeight"
      :roof-height="d.roofHeight"
      :wall-color="d.wallColor"
      :roof-color="d.roofColor"
    />
  </TresGroup>
</template>
