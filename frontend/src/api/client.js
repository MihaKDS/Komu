const API_URL = "http://localhost:3000";

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  // Some endpoints (DELETE, etc.) may not return a body
  if (response.status === 204) {
    return null;
  }

  return response.json();
}