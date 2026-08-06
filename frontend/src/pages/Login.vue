<template>
  <div class="login-container">
    <h1>Login</h1>

    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Email</label>
        <input
          v-model="email"
          type="email"
          required
          placeholder="Email"
        />
      </div>

      <div class="form-group">
        <label>Password</label>
        <input
          v-model="password"
          type="password"
          required
          placeholder="Password"
        />
      </div>

      <p v-if="error" class="error">
        {{ error }}
      </p>

      <button type="submit">
        Login
      </button>

      <RouterLink
            class="login-link"
            to="/register"
        >
            Dont have an account?
        </RouterLink>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { login } from '../services/authService'
import { useAuth } from '../composables/useAuth'

const auth = useAuth()

const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')

async function handleLogin() {
  error.value = ''

  try {
    const result = await login({
      email: email.value,
      password: password.value,
    })

    auth.login(result.token)

    router.push('/')
  } catch (err) {
    error.value = err.message
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 4px;
}

input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 10px;
  cursor: pointer;
}

.error {
  color: red;
  margin-bottom: 12px;
}
</style>