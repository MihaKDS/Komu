<template>
    <aside
        class="side-menu"
        :class="{ open: isOpen }"
    >
        <nav class="nav">          
           <!-- <RouterLink
                :to="{ path: '/search', query: { category: 'COMIC' } }"
                @click="$emit('close-menu')"
                class="nav"
                :class="{ active: isSearchCategory('COMIC') }"
            >
                📖Comics
            </RouterLink>-->            
            <RouterLink
                :to="{ path: '/' }"
                @click="$emit('close-menu')"
                class="nav"
            >
                🔍Search
            </RouterLink>                        
            <div v-if="user">
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
                <RouterLink
                    v-if="user && ['admin', 'miha'].includes(user.username)"
                    :to="{ path: '/edit-media' }"
                    @click="$emit('close-menu')"
                    class="nav"
                >
                    ✏️Edit Media
                </RouterLink>
                <hr>
                    <div class="header-user">

                        <span v-if="loading" class="loading">
                            Loading...
                        </span>

                        <template v-else-if="user">

                            <RouterLink
                                :to="{ path: '/profile' }"
                                @click="$emit('close-menu')"
                                class="nav"
                            >
                                👤Profile
                            </RouterLink>

                        </template>

                        <RouterLink
                            v-else
                            to="/login"
                            class="nav"
                        >
                            Login
                        </RouterLink>

                    </div>
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
  loading,
  logout,
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

    background-color: var(--border);
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
.logoutBtn {
    display: inline-flex;
    align-items: center;

    color: var(--text-h);
    background: var(--danger-bg);

    border: 1px solid var(--social-bg);
    border-radius: 8px;

    text-decoration: none;

}

.logoutBtn:hover {
    color: var(--text-h);
    background: var(--bg-hover);
    border-color: var(--border-light);
}
</style>