<template>
  <Layout>
    <template #header>
      <div class="flex h-full items-center">
        <div
            class="flex text-2xl cursor-pointer select-none transition-colors hover:text-amber-300"
            :class="{ 'text-amber-300': active_building_id === null && !show_roster }"
            title="Show the city view"
            @click="showCity"
        >City</div>
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

          <!-- People, not property. Its own section because an adventurer
               belongs to no building — listing them under Buildings would say
               the opposite. -->
          <div class="pt-3 border-b border-gray-700 divide-y divide-gray-500">
            <h3 class="pl-2 pb-3 text-lg">People</h3>
            <div class="flex flex-col divide-y divide-neutral-600">
              <div
                  class="p-2 pl-4 cursor-pointer hover:bg-gray-700"
                  :class="{'bg-gray-600': show_roster}"
                  @click="showRoster"
              >
                Adventurers
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <AdventurerRoster v-if="show_roster" />
    <MarketPanel
        v-else-if="activeBuilding instanceof Market"
        :market="activeBuilding"
        :market-service="marketServiceReactive"
    />
    <EnvironmentView v-else :building-id="active_building_id" />

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
import inventoryRepository, {InventoryRepository} from "./modules/inventory/inventory.repository.ts";
import BuildingsList from "./components/left-menu/BuildingsList.vue";
import {BaseBuilding, BuildingID} from "./game/city/buildings/common/Building.ts";
import {Market} from "./game/city/buildings/Market.ts";
import marketServiceSingleton from "./modules/market/market.service.ts";
import MarketPanel from "./components/buildings/MarketPanel.vue";
import EnvironmentView from "./components/environment/EnvironmentView.vue";
import AdventurerRoster from "./components/adventurers/AdventurerRoster.vue";

const c = reactive(GameControllerSingleton) as GameController;
const inventory = reactive(inventoryRepository) as InventoryRepository;
// marketServiceSingleton is already a reactive singleton at its source, so the
// engine and UI share the exact same proxy — engine writes (money, recentTrades,
// inventory) now invalidate the MarketPanel bindings each tick.
const marketServiceReactive = marketServiceSingleton;
const city = c.city;
const buildings = city.buildings;

const active_building_id = ref<(BuildingID)|null>(null);

// The roster is not a building, so it cannot be a `BuildingID`. A second flag
// rather than a wider union: there is exactly one non-building screen, and the
// union earns its keep on the third.
const show_roster = ref(false);

function changeActiveBuilding(id: BuildingID): void {
  show_roster.value = false;
  active_building_id.value = id;
}

// Clicking the "City" header deselects any building → the 3D city view.
function showCity(): void {
  show_roster.value = false;
  active_building_id.value = null;
}

// Clears the building too, or the sidebar shows two selected rows at once —
// the roster is a screen of its own, not an overlay on a building.
function showRoster(): void {
  active_building_id.value = null;
  show_roster.value = true;
}

const activeBuilding = computed<BaseBuilding|null>(() => {
  if (! active_building_id.value) {
    return null;
  }

  return buildings.get(active_building_id.value)!
});
</script>