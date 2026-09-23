import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, setAccessToken, getRefreshToken, clearAuthSession, saveAuthTokens } from "./auth";
import { AuthResponse, User } from "@/types/auth";

/**
 * API Configuration
 * Real backend is used by default. Set NEXT_PUBLIC_USE_MOCK_API=true only for isolated frontend-only demos.
 */
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 4000,
});

// Request Interceptor: Attach Bearer Authorization token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Token Refresh automatically
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 Unauthorized and request hasn't been retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          // Attempt token refresh call
          const refreshRes = await authApi.refreshToken(refreshToken);
          setAccessToken(refreshRes.tokens.accessToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${refreshRes.tokens.accessToken}`;
          }
          return api(originalRequest);
        } catch (refreshErr) {
          // Refresh failed: session expired or invalid
          clearAuthSession();
          if (typeof window !== "undefined") {
            window.location.href = "/login?expired=true";
          }
          return Promise.reject(refreshErr);
        }
      } else {
        clearAuthSession();
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Authentication API Service Abstraction
 * Handles Real Backend Requests (and instant local fallback if mock mode is explicitly turned on)
 */
export const authApi = {
  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    if (USE_MOCK_API) {
      if (payload.email === "fail@example.com" || payload.password === "wrongpassword") {
        throw {
          response: {
            status: 401,
            data: { message: "Incorrect email address or password. Please try again." },
          },
        };
      }

      const mockResponse: AuthResponse = {
        user: {
          id: `usr_${Date.now()}`,
          email: payload.email,
          fullName: payload.email.split("@")[0].replace(".", " "),
          createdAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: `jwt_access_${Date.now()}`,
          refreshToken: `jwt_refresh_${Date.now()}`,
        },
        message: "Login successful",
      };

      saveAuthTokens(mockResponse.tokens);
      return mockResponse;
    }

    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    saveAuthTokens(data.tokens);
    return data;
  },

  register: async (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<AuthResponse> => {
    if (USE_MOCK_API) {
      const mockResponse: AuthResponse = {
        user: {
          id: `usr_${Date.now()}`,
          email: payload.email,
          fullName: payload.fullName,
          phone: payload.phone,
          createdAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: `jwt_access_${Date.now()}`,
          refreshToken: `jwt_refresh_${Date.now()}`,
        },
        message: "Account created successfully.",
      };

      saveAuthTokens(mockResponse.tokens);
      return mockResponse;
    }

    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    saveAuthTokens(data.tokens);
    return data;
  },

  forgotPassword: async (payload: { email: string }): Promise<{ message: string }> => {
    if (USE_MOCK_API) {
      return {
        message: `Password reset instructions have been sent to ${payload.email}`,
      };
    }

    const { data } = await api.post<{ message: string }>("/auth/forgot-password", payload);
    return data;
  },

  resetPassword: async (payload: { token: string; newPassword: string }): Promise<{ message: string }> => {
    if (USE_MOCK_API) {
      if (payload.token === "invalid" || payload.token === "expired") {
        throw {
          response: {
            status: 400,
            data: { message: "The password reset token is invalid or has expired." },
          },
        };
      }
      return {
        message: "Your password has been successfully reset. You can now log in.",
      };
    }

    const { data } = await api.post<{ message: string }>("/auth/reset-password", payload);
    return data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    if (USE_MOCK_API) {
      const mockResponse: AuthResponse = {
        user: {
          id: `usr_${Date.now()}`,
          email: "user@example.com",
          fullName: "Patient",
          createdAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: `jwt_access_refreshed_${Date.now()}`,
          refreshToken: refreshToken,
        },
      };
      setAccessToken(mockResponse.tokens.accessToken);
      return mockResponse;
    }

    const { data } = await api.post<AuthResponse>("/auth/refresh", { refreshToken });
    setAccessToken(data.tokens.accessToken);
    return data;
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },
};
