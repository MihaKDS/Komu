<template>
    <aside
        class="side-menu"
        :class="{ open: isOpen }"
    >
        <nav class="nav">
            <RouterLink
                :to="{ path: '/' }"
                @click="$emit('close-menu')"
                class="nav"
            >
                Home
            </RouterLink>  
            <p>Search:</p>
            <RouterLink
                :to="{ path: '/search', query: { category: 'MOVIE' } }"
                @click="$emit('close-menu')"
                class="nav"
                :class="{ active: isSearchCategory('MOVIE') }"
            >
                🎬Movies
            </RouterLink>            
            <RouterLink
                :to="{ path: '/search', query: { category: 'TV_SHOW' } }"
                @click="$emit('close-menu')"
                class="nav"
                :class="{ active: isSearchCategory('TV_SHOW') }"
            >
                📺TV Shows
            </RouterLink>            
            <RouterLink
                :to="{ path: '/search', query: { category: 'BOOK' } }"
                @click="$emit('close-menu')"
                class="nav"
                :class="{ active: isSearchCategory('BOOK') }"
            >
                📚Books
            </RouterLink>            
            <RouterLink
                :to="{ path: '/search', query: { category: 'COMIC' } }"
                @click="$emit('close-menu')"
                class="nav"
                :class="{ active: isSearchCategory('COMIC') }"
            >
                📖Comics
            </RouterLink>            
            <div v-if="user">
                <hr>
                <RouterLink
                    :to="{ path: '/collection' }"
                    @click="$emit('close-menu')"
                    class="nav"
                >
                    📦Collection
                </RouterLink>             
                <RouterLink
                    :to="{ path: '/trades' }"
                    @click="$emit('close-menu')"
                    class="nav"
                >
                    🤝Trades
                </RouterLink>
                <RouterLink
                    :to="{ path: '/add-media' }"
                    @click="$emit('close-menu')"
                    class="nav"
                >
                    ➕Add Media
                </RouterLink>
            </div>
            <div v-else>
                <hr>
                <RouterLink
                    :to="{ path: '/login' }"
                    @click="$emit('close-menu')"
                    class="nav"
                >
                    Login
                </RouterLink>
            </div>
        </nav>
    </aside>
</template>

<script setup>
import { useAuth } from '../../composables/useAuth'

import { useRoute } from "vue-router";

const route = useRoute();
function isSearchCategory(category) {
    return (
        route.path === "/search" &&
        route.query.category === category
    );
}

const {
  user,
} = useAuth()

defineEmits([
    "close-menu"
]);
defineProps({
    isOpen: Boolean
});
</script>

<style scoped>
.side-menu {
    position: fixed;
    top: 0;
    left: max(0px, calc((100vw - 1126px) / 2 - 1px));

    width: 250px;
    height: 100vh;

    background-color: #1a1a1a;
    border-right: 1px solid var(--border);

    z-index: 900;

    transform: translateX(-100%);
    opacity: 0;
    pointer-events: none;

    overflow-y: auto;
    overflow-x: hidden;

    transition:
        transform 0.3s ease,
        opacity 0.2s ease;

    /* Better scrolling on touch devices */
    -webkit-overflow-scrolling: touch;
}

.side-menu.open {
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
}

nav {
    margin-top: 79px;
}

.nav {
    display: flex;
    flex-direction: column;
}

.nav a {
    padding: 1rem;

    color: var(--text-h);
    text-decoration: none;

    transition: background-color 0.15s ease;
}

.nav a:hover {
    background-color: #585858;
    border-radius: 8px;
    width: 96%;
    margin-left: 2%;
}

.nav .active {
    background: #3a3a3a;
    border-radius: 8px;
    width: 96%;
    margin-left: 2%;
}

</style>