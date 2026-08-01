"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, LoginPayload, RegisterPayload } from "@/types/auth";
import { authApi } from "@/lib/api";
import { getRefreshToken, clearAuthSession, getAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Restore session on initial client load
  useEffect(() => {
    const initAuth = async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken || getAccessToken()) {
        try {
          const res = await authApi.refreshToken(refreshToken || "demo_token");
          setUser(res.user);
        } catch (err) {
          clearAuthSession();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(credentials);
      setUser(res.user);
      router.push("/dashboard");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Login failed. Please check your credentials.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.register(data);
      setUser(res.user);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Registration failed. Please try again.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setError(null);
    router.push("/login");
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
