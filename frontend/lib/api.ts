"use client";

// Dynamic API URL for runtime flexibility, falling back to localhost during local dev
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api`
    : "http://localhost:8000/api";

export interface User {
  id: number;
  username: string;
  email: string | null;
  full_name: string;
  phone: string;
  user_category: "RESIDENT" | "SUPERVISOR" | "SUPPORT_STAFF" | "UTRMC_ADMIN";
  is_profile_complete: boolean;
  must_change_password: boolean;
  extra_data: Record<string, any>;
  allowed_next_route: string;
}

export async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("pgms_access_token") : null;
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Token expired interceptor
  if (res.status === 401 && path !== "/auth/login/" && path !== "/auth/refresh/") {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      const newToken = localStorage.getItem("pgms_access_token");
      headers.set("Authorization", `Bearer ${newToken}`);
      return fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("pgms_access_token");
        localStorage.removeItem("pgms_refresh_token");
        localStorage.removeItem("pgms_user");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }
  }

  return res;
}

async function attemptTokenRefresh(): Promise<boolean> {
  const refresh = typeof window !== "undefined" ? localStorage.getItem("pgms_refresh_token") : null;
  if (!refresh) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (res.status === 200) {
      const data = await res.json();
      localStorage.setItem("pgms_access_token", data.access);
      return true;
    }
  } catch (e) {
    console.error("Token refresh fail", e);
  }
  return false;
}
