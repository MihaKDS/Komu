const API_URL = "/api";

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
