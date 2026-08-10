<template>
<header class="header">

    <button
        class="menu-button"
        type="button"
        aria-label="Open navigation menu"
        @click="$emit('toggle-menu')"
    >
        ☰
    </button>

    <RouterLink
        to="/"
        class="logo"
    >
        Komu
    </RouterLink>

    <div class="header-user">

        <span v-if="loading" class="loading">
            Loading...
        </span>

        <template v-else-if="user">

            <span class="username">
                {{ user.username }}
            </span>

            <RouterLink
                to="/"
                class="login-link"
                @click="logout"
            >
                Logout
            </RouterLink>

        </template>

        <RouterLink
            v-else
            to="/login"
            class="login-link"
        >
            Login
        </RouterLink>

    </div>

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
    position: relative;
    z-index: 1000;

    width: 100%;
    height: 64px;

    display: flex;
    align-items: center;

    padding: 0 16px;

    background: var(--bg-secondary);

    border-bottom: 1px solid var(--border);
}


/* Menu button */

.menu-button {
    width: 42px;
    height: 42px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0;

    color: var(--text-h);
    background: transparent;

    border: 1px solid transparent;
    border-radius: var(--radius-small);

    font-size: 24px;
    line-height: 1;

    box-shadow: none;
}

.menu-button:hover {
    background: var(--bg-hover);
    border-color: var(--border);
    box-shadow: none;
}


/* Logo */

.logo {
    margin-left: 12px;

    color: var(--text-h);

    font-size: 24px;
    font-weight: 700;

    letter-spacing: -0.5px;

    text-decoration: none;
}

.logo:hover {
    color: var(--accent-hover);
}


/* User area */

.header-user {
    margin-left: auto;

    display: flex;
    align-items: center;

    gap: 12px;

    color: var(--text-secondary);
}

.username {
    color: var(--text-h);
    font-weight: 500;
}


/* Login / Logout */

.login-link {
    display: inline-flex;
    align-items: center;

    padding: 7px 11px;

    color: var(--text-h);
    background: var(--bg-card);

    border: 1px solid var(--border);
    border-radius: var(--radius-small);

    text-decoration: none;

    transition:
        background-color 0.15s ease,
        border-color 0.15s ease;
}

.login-link:hover {
    color: var(--text-h);
    background: var(--bg-hover);
    border-color: var(--border-light);
}


/* Loading */

.loading {
    color: var(--text-muted);
}


/* Mobile */

@media (max-width: 600px) {

    .header {
        height: 58px;
        padding: 0 10px;
    }

    .logo {
        margin-left: 8px;
        font-size: 21px;
    }

    .username {
        max-width: 100px;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .header-user {
        gap: 7px;
    }

    .login-link {
        padding: 6px 9px;
    }
}

</style>