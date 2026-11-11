<template>
    <aside class="side-menu" :class="{ open: isOpen }">
        <nav class="nav">
            <RouterLink :to="{ path: '/' }" @click="$emit('close-menu')" class="nav-link">
                🏠Home
            </RouterLink>

            <hr class="section-divider">

            <div class="category-links" aria-label="Featured categories">
                <RouterLink
                    v-for="category in featuredCategories"
                    :key="category.value"
                    :to="{ path: '/search', query: { category: category.value } }"
                    @click="$emit('close-menu')"
                    class="nav-link category-link"
                >
                    {{ category.icon }}{{ category.label }}
                </RouterLink>
            </div>

            <hr class="section-divider">

            <div class="category-links" aria-label="More categories">
                <RouterLink
                    v-for="category in otherCategories"
                    :key="category.value"
                    :to="{ path: '/search', query: { category: category.value } }"
                    @click="$emit('close-menu')"
                    class="nav-link category-link"
                >
                    {{ category.icon }}{{ category.label }}
                </RouterLink>
            </div>

            <hr class="section-divider">

            <div v-if="user">
                <RouterLink :to="{ path: '/collection' }" @click="$emit('close-menu')" class="nav-link">
                    📦Collection
                </RouterLink>
                <RouterLink :to="{ path: '/lists' }" @click="$emit('close-menu')" class="nav-link">
                    📋Lists
                </RouterLink>
                <RouterLink :to="{ path: '/trades' }" @click="$emit('close-menu')" class="nav-link">
                    🔄Trades
                </RouterLink>
                <RouterLink :to="{ path: '/profile' }" @click="$emit('close-menu')" class="nav-link">
                    👤 Profile
                </RouterLink>
            </div>
            <RouterLink v-else :to="{ path: '/login' }" @click="$emit('close-menu')" class="nav-link">
                Login
            </RouterLink>
        </nav>
    </aside>
</template>

<script setup>
import { useAuth } from '../../composables/useAuth'

const featuredCategories = [
    { label: 'Movies', value: 'MOVIE', icon: '🎬' },
    { label: 'TV Shows', value: 'TV_SHOW', icon: '📺' },
]
const otherCategories = [
    { label: 'Books', value: 'BOOK', icon: '📚' },
    { label: 'Comics', value: 'COMIC', icon: '📖' },
    { label: 'Music', value: 'MUSIC', icon: '🎵' },
]

const { user } = useAuth()

defineEmits(['close-menu'])
defineProps({ isOpen: Boolean })
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
    -webkit-overflow-scrolling: touch;
    transition: transform 0.3s ease, opacity 0.2s ease;
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

.nav-link {
    display: block;
    padding: .8rem 1rem;
    color: var(--text-h);
    text-decoration: none;
    transition: background-color 0.15s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
    background-color: #3a3a3a;
    border-radius: 8px;
    width: 96%;
    margin-left: 2%;
}

.category-links {
    display: flex;
    flex-direction: column;
}

.category-link {
    padding-top: .55rem;
    padding-bottom: .55rem;
}

.section-divider {
    width: calc(100% - 2rem);
    margin: .6rem 1rem;
    border: 0;
    border-top: 1px solid var(--border-light, #666);
}
</style>
