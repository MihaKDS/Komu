<template>

    <Header
        @toggle-menu="toggleMenu"
    />

    <SideMenu
        :isOpen="isMenuOpen"
        @close-menu="closeMenu"
    />
    <div
        v-if="isMenuOpen"
        class="overlay"
        @click="closeMenu"
    />
    <main>
        <router-view />
    </main>

</template>

<script setup>

import { ref, onMounted } from "vue";
import { useAuth } from './composables/useAuth'

import Header from "./components/layout/Header.vue";
import SideMenu from "./components/layout/SideMenu.vue";

const auth = useAuth()

onMounted(async () => {
  await auth.loadUser()
})

const isMenuOpen = ref(false);

function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
}
function closeMenu() {
    isMenuOpen.value = false;
}

</script>

<style scoped>
main {
    padding: 1rem;
}
.header {
    z-index: 1000;
}

.side-menu {
    z-index: 900;
}
.overlay {
    position: fixed;
    inset: 0;
    z-index: 800;
    background: rgba(0, 0, 0, 0.4);
}

</style>