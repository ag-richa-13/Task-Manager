// src/lib/api.ts
// Centralized API client with automatic refresh handling (Vite env)
export type User = { id: string; email: string; name: string };

const API_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:4000";

let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

async function callRefresh(): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setAccessToken(null);
        return null;
      }
      const data = await res.json();
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        return data.accessToken;
      }
      return null;
    } catch (err) {
      setAccessToken(null);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function authFetch(
  input: RequestInfo,
  init: RequestInit = {},
  retry = true
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (inMemoryAccessToken)
    headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  const res = await fetch(
    typeof input === "string" ? input : input.toString(),
    {
      ...init,
      headers,
      credentials: "include",
    }
  );

  // If access token expired or invalid, try refresh once
  if (res.status === 401 && retry) {
    const newToken = await callRefresh();
    if (newToken) {
      return authFetch(input, init, false);
    }
  }

  return res;
}

/* ----------------- Auth endpoints ----------------- */
export async function apiRegister(
  name: string,
  email: string,
  password: string
) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  if (data?.accessToken) setAccessToken(data.accessToken);
  return data as { accessToken: string; user: User };
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  if (data?.accessToken) setAccessToken(data.accessToken);
  return data as { accessToken: string; user: User };
}

export async function apiLogout() {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  setAccessToken(null);
}

// Attempt to refresh; returns accessToken string or null
export async function apiRefresh(): Promise<string | null> {
  return callRefresh();
}

// Optional: fetch profile if backend exposes /auth/me
export async function apiGetProfile(): Promise<User> {
  const res = await authFetch(`${API_URL}/auth/me`, { method: "GET" }, true);
  if (!res.ok) throw await res.json();
  return res.json();
}

/* ----------------- User endpoints ----------------- */

export async function apiGetUserProfile() {
  const res = await authFetch(`${API_URL}/user/profile`, { method: "GET" });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function apiUpdateUserProfile(data: { name?: string; email?: string }) {
  const res = await authFetch(`${API_URL}/user/profile`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function apiChangePassword(data: { currentPassword: string; newPassword: string }) {
  const res = await authFetch(`${API_URL}/user/change-password`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function apiGetUserStatistics() {
  const res = await authFetch(`${API_URL}/user/statistics`, { method: "GET" });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function apiDeleteAccount(password: string) {
  const res = await authFetch(`${API_URL}/user/account`, {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

/* ----------------- Task endpoints ----------------- */

export async function apiGetTasks(
  page = 1,
  limit = 10,
  status?: string,
  q?: string
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  const res = await authFetch(`${API_URL}/tasks?${params.toString()}`, {
    method: "GET",
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function apiCreateTask(payload: {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  status?: "pending" | "completed";
  dueDate?: string | null;
}) {
  const res = await authFetch(`${API_URL}/tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function apiGetTask(id: string) {
  const res = await authFetch(`${API_URL}/tasks/${id}`, { method: "GET" });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function apiUpdateTask(id: string, data: any) {
  const res = await authFetch(`${API_URL}/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function apiDeleteTask(id: string) {
  const res = await authFetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw await res.json();
  return true;
}

export async function apiToggleTask(id: string) {
  const res = await authFetch(`${API_URL}/tasks/${id}/toggle`, {
    method: "POST",
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
