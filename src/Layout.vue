<template>
  <div :class="{ dark: isDark }" class="h-screen flex flex-col bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
    <!-- Top Menu -->
    <header class="bg-gray-800 text-white p-4 fixed top-0 left-0 right-0 z-10 border-b border-b-black">
      <slot name="header" />
    </header>

    <!-- Body Layout -->
    <div class="flex flex-1 pt-16 overflow-hidden">
      <!-- Left Sidebar -->
      <aside
          v-if="showLeft"
          class="bg-gray-100 dark:bg-gray-800 w-64 p-4 overflow-y-auto transition-all duration-300 border-r border-black"
      >
        <slot name="left-menu" class="" />
      </aside>

      <!-- Main Content -->
      <main class="flex-1 p-4 overflow-y-auto mb-16">
        <slot />
      </main>

      <!-- Right Sidebar -->
      <aside
          v-if="showRight"
          class="bg-gray-100 dark:bg-gray-800 w-64 p-4 overflow-y-auto transition-all duration-300 border-l border-black"
      >
        <slot name="right-menu" />
      </aside>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white p-4 fixed bottom-0 left-0 right-0 z-10 border-t border-black">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script lang="ts" setup>
import {reactive, ref} from 'vue';
import City from "./game/city/City.ts";
import {Adventurer} from "./game/adventurer/Adventurer.ts";

const showLeft = ref(true);
const showRight = ref(true);
const isDark = ref(false);

const toggleLeft = () => (showLeft.value = !showLeft.value);
const toggleRight = () => (showRight.value = !showRight.value);

</script>
