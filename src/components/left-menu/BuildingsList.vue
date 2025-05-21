<script setup lang="ts">
import {BaseBuilding, BuildingID} from "../../game/city/buildings/Building.ts";
import type {PropType} from "vue";

const {buildings} = defineProps({
  buildings: Object as PropType<Map<BuildingID, BaseBuilding>>,
  activeBuildingId: Number as PropType<BuildingID|null>,
});

const emit = defineEmits<{
  buildingClicked: [id: BuildingID],
}>();

</script>

<template>
<div class="">
  <div class="pt-3 border-y border-gray-700 divide-y divide-gray-500">
    <h3 class="pl-2 pb-3 text-lg">Buildings</h3>
    <div class="flex flex-col divide-y divide-neutral-600">
      <div
          v-for="[id, building] in buildings.entries()" :key="id"
          class="p-2 pl-4 cursor-pointer hover:bg-gray-700"
          :class="{'bg-gray-600': activeBuildingId === id}"
          @click="emit('buildingClicked', id)"
      >
        {{ building.constructor.name }}
      </div>
    </div>
  </div>
</div>
</template>