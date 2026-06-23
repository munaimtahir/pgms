"use client";

function resolveApiBaseUrl(): string {
  const sameOriginApi = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (sameOriginApi) {
    return sameOriginApi.replace(/\/$/, "");
  }

  return "/api";
}

const API_BASE_URL = resolveApiBaseUrl();

export interface User {
  id: number;
  username: string;
  email: string | null;
  full_name: string;
  phone: string;
  user_category: "RESIDENT" | "SUPERVISOR" | "SUPPORT_STAFF" | "UTRMC_ADMIN";
  is_active: boolean;
  is_profile_complete: boolean;
  must_change_password: boolean;
  extra_data: Record<string, any>;
  allowed_next_route: string;
}

export interface ResidentProfile {
  id: number;
  user: User;
  father_name: string;
  cnic_or_passport: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  date_of_birth: string | null;
  primary_phone: string;
  primary_phone_normalized: string;
  whatsapp_number: string;
  whatsapp_number_normalized: string;
  alternate_email: string | null;
  address: string;
  program_name: string;
  specialty_name: string;
  training_level: string;
  training_year: string;
  session_year: string;
  date_of_joining: string | null;
  expected_completion_date: string | null;
  institution_name: string;
  department_name: string;
  current_status: "ACTIVE" | "ON_LEAVE" | "TRANSFERRED" | "COMPLETED" | "DROPPED" | "SUSPENDED" | "UNKNOWN";
  pmdc_number: string | null;
  university_registration_number: string;
  employee_or_training_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  notes: string;
  extra_data: Record<string, any>;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: number | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
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
