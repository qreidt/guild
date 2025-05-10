<template>
  <Layout>
    <template #header>
      <div class="flex h-full items-center">
        <div class="flex">City</div>
        <div class="flex flex-1 justify-center gap-x-16">
          <div class="">Citizens: {{ city.citizens_count }}</div>
          <div class="">Funds: $ {{ city.money }}</div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex h-full items-center justify-between">
        <div class="flex gap-x-16">
          <div class="flex">tick: {{ controller.tick }}</div>

        </div>
        <Button @click="controller.nextTick()">
          Next Tick
        </Button>
      </div>
    </template>
  </Layout>
</template>

<script setup lang="ts">
import Layout from "./Layout.vue";
import Button from "./components/Button.vue";
import {reactive} from "vue";
import {GameController} from "./game/controllers/GameController.ts";

const controller = reactive(new GameController()) as GameController;
const city = controller.city;
</script>