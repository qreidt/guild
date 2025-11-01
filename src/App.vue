<template>
  <Layout>
    <template #header>
      <div class="flex h-full items-center">
        <div class="flex text-2xl">City</div>
        <div class="flex flex-1 justify-center gap-x-16">
          <div class="">$ {{ city.money }}</div>
          <div class="">Citizens: {{ city.citizens_count }}</div>
        </div>
      </div>
    </template>

    <template #left-menu>
      <div class="">
        <div class="-my-4 -mx-4">
          <BuildingsList
              :buildings="buildings"
              :active-building-id="active_building_id"
              @buildingClicked="changeActiveBuilding"
          />
        </div>
      </div>
    </template>

    <pre>{{ activeBuilding }}</pre>

    <template #footer>
      <div class="flex h-full items-center justify-between">
        <div class="flex gap-x-16">
          <div class="flex">tick: {{ c.tick }}</div>

        </div>
        <div class="flex gap-x-8">
          <Button @click="c.running ? c.pause() : c.resume()">
            {{ c.running ? 'Pause' : 'Resume' }}
          </Button>
          <Button @click="c.nextTick(true)">
            Next Tick
          </Button>
        </div>

      </div>
    </template>
  </Layout>
</template>

<script setup lang="ts">
import Layout from "./Layout.vue";
import Button from "./components/Button.vue";
import {computed, reactive, ref} from "vue";
import GameControllerSingleton, {GameController} from "./game/controllers/GameController.ts";
import BuildingsList from "./components/left-menu/BuildingsList.vue";
import {BaseBuilding, BuildingID} from "./game/city/buildings/common/Building.ts";

const c = reactive(GameControllerSingleton) as GameController;
const city = c.city;
const buildings = city.buildings;

const active_building_id = ref<(BuildingID)|null>(null);

function changeActiveBuilding(id: BuildingID): void {
  active_building_id.value = id;
}

const activeBuilding = computed<BaseBuilding|null>(() => {
  if (! active_building_id.value) {
    return null;
  }

  return buildings.get(active_building_id.value)!
});
</script>