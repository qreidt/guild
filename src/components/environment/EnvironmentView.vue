<script setup lang="ts">
import { computed, defineAsyncComponent, toRef } from "vue";
import type { BuildingID } from "../../game/city/buildings/common/Building.ts";
import { environmentArtRegistry } from "./environment-registry.ts";
import { useCityView, useEnvironmentView } from "./useEnvironmentView.ts";
import GenericEnvironmentView from "./GenericEnvironmentView.vue";

// Lazy-loaded so `three` / `@tresjs/core` stay out of the 2D / initial bundle.
const CityGlobalView3D = defineAsyncComponent(() => import("./views/CityGlobalView3D.vue"));

const props = defineProps<{
  buildingId: BuildingID | null;
}>();

// Single reactive view-model, shared by whichever renderer the container picks.
const view = useEnvironmentView(toRef(props, "buildingId"));
const cityView = useCityView();

// Registry lookup is the only dispatch logic — no per-building if/else.
const artComponent = computed(() =>
  props.buildingId ? environmentArtRegistry[props.buildingId] ?? null : null,
);
</script>

<template>
  <!-- No active tab: city-global 3D background scene (lazy-loaded). -->
  <CityGlobalView3D v-if="buildingId === null" :view="cityView" />

  <!-- Building with a registered art view. -->
  <component :is="artComponent" v-else-if="artComponent" :view="view" />

  <!-- Fallback: generic read-only view, driven by the same view-model. -->
  <GenericEnvironmentView v-else :view="view" />
</template>
