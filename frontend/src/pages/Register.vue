<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const username = ref("");
const email = ref("");
const password = ref("");
const city = ref("");

const loading = ref(false);
const error = ref("");

async function register() {
    error.value = "";
    loading.value = true;

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username.value,
                email: email.value,
                password: password.value,
                city: city.value || null,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        router.push("/login");
    } catch (err) {
        error.value = err.message;
    } finally {
        loading.value = false;
    }
}
</script>

<template>

<div class="register-page">

    <form
        class="register-card"
        @submit.prevent="register"
    >

        <h1>Create Account</h1>

        <p class="subtitle">
            Join Komu and start building your collection.
        </p>

        <label>
            Username
        </label>

        <input
            v-model="username"
            type="text"
            required
        >

        <label>
            Email
        </label>

        <input
            v-model="email"
            type="email"
            required
        >

        <label>
            Password
        </label>

        <input
            v-model="password"
            type="password"
            required
            minlength="6"
        >

        <label>
            City (optional)
        </label>

        <input
            v-model="city"
            type="text"
        >

        <p
            v-if="error"
            class="error"
        >
            {{ error }}
        </p>

        <button
            type="submit"
            :disabled="loading"
        >
            {{ loading ? "Creating account..." : "Register" }}
        </button>

        <RouterLink
            class="login-link"
            to="/login"
        >
            Already have an account?
        </RouterLink>

    </form>

</div>

</template>

<style scoped>

.register-page{

    display:flex;

    justify-content:center;

    align-items:center;

    padding:4rem 1rem;

}

.register-card{

    width:100%;
    max-width:420px;

    display:flex;

    flex-direction:column;

    gap:.75rem;

    padding:2rem;

    background:#1d1d1d;

    border-radius:12px;

    border:1px solid #333;

}

h1{

    margin:0;

}

.subtitle{

    color:#999;

    margin-bottom:1rem;

}

label{

    font-weight:600;

}

input{

    padding:.75rem;

    border-radius:6px;

    border:1px solid #444;

    background:#2b2b2b;

    color:white;

}

button{

    margin-top:1rem;

    padding:.8rem;

    border:none;

    border-radius:6px;

    cursor:pointer;

    font-weight:bold;

}

button:disabled{

    opacity:.6;

    cursor:not-allowed;

}

.error{

    color:#ff6b6b;

}

.login-link{

    text-align:center;

    margin-top:1rem;

}

</style>