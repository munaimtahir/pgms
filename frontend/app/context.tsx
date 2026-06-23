"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, apiRequest } from "../lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
  syncUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Initial token load
    const storedUser = localStorage.getItem("pgms_user");
    const storedToken = localStorage.getItem("pgms_access_token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);
  }, []);

  const syncUser = async (): Promise<User | null> => {
    try {
      const res = await apiRequest("/auth/me/");
      if (res.status === 200) {
        const updatedUser: User = await res.json();
        setUser(updatedUser);
        localStorage.setItem("pgms_user", JSON.stringify(updatedUser));
        return updatedUser;
      }
    } catch (e) {
      console.error("Failed to sync user state", e);
    }
    return null;
  };

  const login = (access: string, refresh: string, userData: User) => {
    localStorage.setItem("pgms_access_token", access);
    localStorage.setItem("pgms_refresh_token", refresh);
    localStorage.setItem("pgms_user", JSON.stringify(userData));
    setUser(userData);

    // Redirect based on backend guidance
    router.push(userData.allowed_next_route);
  };

  const logout = async () => {
    const refresh = localStorage.getItem("pgms_refresh_token");
    if (refresh) {
      try {
        await apiRequest("/auth/logout/", {
          method: "POST",
          body: JSON.stringify({ refresh }),
        });
      } catch (e) {
        console.error("Backend logout failed", e);
      }
    }
    localStorage.removeItem("pgms_access_token");
    localStorage.removeItem("pgms_refresh_token");
    localStorage.removeItem("pgms_user");
    setUser(null);
    router.push("/login");
  };

  // State-enforcing Router Guard
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/login", "/health"];
    const isPublic = publicRoutes.includes(pathname);

    if (!user) {
      if (!isPublic) {
        router.push("/login");
      }
      return;
    }

    // Authenticated user checks
    if (user.must_change_password) {
      if (pathname !== "/change-password") {
        router.push("/change-password");
      }
    } else if (!user.is_profile_complete) {
      if (pathname !== "/complete-profile") {
        router.push("/complete-profile");
      }
    } else {
      // User is fully set up.
      // Do not allow them back to setup screens
      if (pathname === "/login" || pathname === "/change-password" || pathname === "/complete-profile") {
        router.push(user.allowed_next_route);
      }
      
      // Admin guard for /users and /audit
      if (pathname.startsWith("/users") || pathname.startsWith("/audit")) {
        if (user.user_category !== "UTRMC_ADMIN") {
          router.push("/account");
        }
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, syncUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
