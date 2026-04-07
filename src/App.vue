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

    <MarketPanel
        v-if="activeBuilding instanceof Market"
        :market="activeBuilding"
        :market-service="marketServiceReactive"
    />
    <pre v-else>{{ activeBuilding }}</pre>

    <!-- [TEST] Temporary adventurer market test controls -->
    <div class="mt-4 p-2 border border-dashed border-yellow-600 text-yellow-400 text-sm">
      <div class="font-bold mb-1">[TEST] Adventurer #{{ testAdventurer.id }} — money: {{ testAdventurer.money }}g — IronOre: {{ testAdventurer.inventory.getCount(ItemID.IronOre) }}</div>
      <button class="px-2 py-1 bg-yellow-700 text-white rounded" @click="testAdventurerBuy">Test Buy 1 IronOre</button>
    </div>

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
import {Adventurer} from "./game/adventurer/Adventurer.ts";
import {ItemID} from "./modules/items/id.ts";

const c = reactive(GameControllerSingleton) as GameController;
const inventory = reactive(inventoryRepository) as InventoryRepository;
const marketServiceReactive = reactive(marketServiceSingleton);
const city = c.city;
const buildings = city.buildings;

// [TEST] Temporary adventurer for manual market verification
const testAdventurer = reactive(new Adventurer());
function testAdventurerBuy() {
  try {
    testAdventurer.buyFromMarket(new Map([[ItemID.IronOre, 1]]));
  } catch (e) {
    console.warn('[TestAdventurer] Buy failed:', e);
  }
}

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