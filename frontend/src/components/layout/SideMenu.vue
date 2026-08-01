<template>
    <aside
        class="side-menu"
        :class="{ open: isOpen }"
    >
        <nav class="nav">
            <RouterLink to="/" @click="$emit('close-menu')">Home</RouterLink>

            <RouterLink class="nav" :to="{ path: '/search', query: { category: 'MOVIE' } }" @click="$emit('close-menu')">Film</RouterLink>
                        <RouterLink class="nav" :to="{ path: '/search', query: { category: 'BOOK' } }" @click="$emit('close-menu')">Books</RouterLink>
                        <RouterLink class="nav" :to="{ path: '/search', query: { category: 'MANGA' } }" @click="$emit('close-menu')">Manga</RouterLink>

            <div v-if="user">
                <RouterLink class="nav" to="/collection" @click="$emit('close-menu')">Collection</RouterLink>
                <RouterLink class="nav" to="/sharing" @click="$emit('close-menu')">Sharing</RouterLink>
                <RouterLink class="nav" to="/lists" @click="$emit('close-menu')">Lists</RouterLink>
                <RouterLink class="nav" to="/profile" @click="$emit('close-menu')">Profile</RouterLink>
            </div>
            <div v-else>
                <RouterLink class="nav" to="/login" @click="$emit('close-menu')">Login</RouterLink>
            </div>
        </nav>
    </aside>
</template>

<script setup>
import { useAuth } from '../../composables/useAuth'

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
    left: -250px;

    width: 250px;
    height: 100vh;

    background: #333;

    transition: left .3s ease;
}

.side-menu.open {
    left: 0;
}
nav{
    margin-top: 79px;
}
.nav {
    display: flex;
    flex-direction: column;

}

a {
    padding: 1rem;

    color: white;
    text-decoration: none;
}

a:hover {
    background: #444;
}

.router-link-active {
    background: #555;
}

</style>