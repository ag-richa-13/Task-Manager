// src/context/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@/lib/api";
import {
  apiLogin,
  apiLogout,
  apiRegister,
  apiRefresh,
  apiGetUserProfile,
  setAccessToken,
} from "@/lib/api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: try to refresh token and fetch user profile
  useEffect(() => {
    (async () => {
      try {
        const token = await apiRefresh();
        if (token) {
          // Fetch user profile to get user data
          try {
            const profile = await apiGetUserProfile();
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
            });
          } catch (error) {
            console.error("Failed to fetch user profile:", error);
            // If profile fetch fails, user will be null but token is still valid
            // This allows the app to work even if profile endpoint has issues
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      setAccessToken(data.accessToken);
      if (data.user) setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiRegister(name, email, password);
      setAccessToken(data.accessToken);
      if (data.user) setUser(data.user);
      // Also fetch full profile after registration
      try {
        const profile = await apiGetUserProfile();
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
        });
      } catch (error) {
        console.error(
          "Failed to fetch user profile after registration:",
          error
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiLogout();
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
