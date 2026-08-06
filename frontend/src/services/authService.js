import { apiFetch } from "../api/client";

export async function login(credentials, passwordMaybe) {
  const payload = typeof credentials === "object"
    ? credentials
    : {
        email: credentials,
        password: passwordMaybe,
      };

  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function register(userData) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function getCurrentUser(token) {
  return apiFetch("/auth/me", {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
}
