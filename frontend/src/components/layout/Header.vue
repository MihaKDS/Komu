<template>
    <header class="header">

        <button
            class="menu-button"
            @click="$emit('toggle-menu')"
        >
            ☰
        </button>

        <h1 class="logo">
            Komu
        </h1>

        <div v-if="loading">
            Loading...
        </div>

        <div v-else-if="user">
           {{ user.username }}
                
            <RouterLink
            @click="logout "
            to="/"
            class="login-link"
            >
                Logout
            </RouterLink>
        </div>


        <RouterLink
        v-else
        to="/login"
        class="login-link"
        >
            Login
        </RouterLink>

    </header>
</template>

<script setup>
import { useAuth } from '../../composables/useAuth'
import { useRouter } from 'vue-router'

const {
  user,
  loading,
  logout,
} = useAuth()
defineEmits([
    "toggle-menu"
]);
</script>

<style scoped>

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;

    padding: 1rem;

    background: #222;
    color: white;
}

.menu-button {
    font-size: 1.5rem;

    background: none;
    border: none;

    color: white;
    cursor: pointer;
}

.logo {
    margin: 0;
}

@media (max-width: 768px) {
    .header {
        flex-wrap: wrap;
    }

    .logo {
        font-size: 1.5rem;
    }
}

</style>