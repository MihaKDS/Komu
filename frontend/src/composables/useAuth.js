import { ref } from 'vue'
import { getCurrentUser } from '../services/authService'

const token = ref(localStorage.getItem('token'))
const user = ref(null)

export function useAuth() {

const loading = ref(true)

async function loadUser() {
  loading.value = true

  if (!token.value) {
    user.value = null
    loading.value = false
    return
  }

  try {
    user.value = await getCurrentUser(token.value)
  } catch {
    logout()
  } finally {
    loading.value = false
  }
}

async function login(jwt) {
  token.value = jwt
  localStorage.setItem('token', jwt)

  await loadUser()
}

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    user,
    login,
    logout,
    loadUser,
  }
}