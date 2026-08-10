<template>
    <div :class="{ 'menu-open': isMenuOpen }">
        <Header @toggle-menu="toggleMenu" />

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
    </div>
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
    width: 100%;
    padding: 1rem;
}
.menu-open {
    overflow: hidden;
}
.header {
    position: relative;
    z-index: 1000;
}

.side-menu {
    position: fixed;
    z-index: 900;
}

.overlay {
    position: fixed;
    inset: 0;

    z-index: 800;

    background: rgba(0, 0, 0, 0.6);

    /* Prevent clicking/scrolling through the overlay */
    touch-action: none;
}

@media (max-width: 768px) {
    main {
        padding: 0.75rem;
    }
}

</style>