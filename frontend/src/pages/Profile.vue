<template>
    <div class="profile-page">
        <BreadCrumbs />
        <h1>Profile</h1>

        <section class="profile-card">

            <div class="profile-row">
                <span class="label">Username</span>
                <span class="value">{{ user?.username || "-" }}</span>
            </div>

            <div class="profile-row">
                <span class="label">Email</span>
                <span class="value">{{ user?.email || "-" }}</span>
            </div>

            <div class="profile-row">
                <span class="label">City</span>
                <span class="value">{{ user?.city || "-" }}</span>
            </div>

        </section>


        <button
            type="button"
            class="logout-button"
            @click="handleLogout"
        >
            Logout
        </button>

    </div>
</template>


<script setup>
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

import BreadCrumbs from "../components/layout/Breadcrumbs.vue";

const router = useRouter();

const {
    user,
    logout,
} = useAuth();

async function handleLogout() {
    await logout();
    router.push("/");
}
</script>


<style scoped>

.profile-page {
    width: 100%;
    max-width: 600px;

    margin: 0 auto;
    padding: 30px 20px 60px;
}

h1 {
    margin-bottom: 25px;
}


/* Profile */

.profile-card {
    background: var(--bg-card);

    border: 1px solid var(--border);
    border-radius: var(--radius);

    overflow: hidden;
}

.profile-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    gap: 20px;

    padding: 15px 18px;

    border-bottom: 1px solid var(--border);
}

.profile-row:last-child {
    border-bottom: none;
}

.label {
    color: var(--text-muted);
    font-size: 14px;
}

.value {
    color: var(--text-h);
    font-size: 15px;

    text-align: right;
}


/* Logout */

.logout-button {
    margin-top: 25px;

    padding: 10px 20px;

    color: var(--text-h);
    background: var(--bg-card);

    border: 1px solid var(--border);
    border-radius: var(--radius);

    cursor: pointer;

    font-size: 14px;

    transition:
        background-color 0.15s ease,
        border-color 0.15s ease;
}

.logout-button:hover {
    background: var(--bg-hover);
    border-color: var(--accent-border);
}


/* Mobile */

@media (max-width: 600px) {

    .profile-page {
        padding: 20px 12px 40px;
    }

    .profile-row {
        align-items: flex-start;
        flex-direction: column;
        gap: 5px;
    }

    .value {
        text-align: left;
    }
}

</style>