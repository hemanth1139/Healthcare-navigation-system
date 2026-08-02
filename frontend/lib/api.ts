import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, setAccessToken, getRefreshToken, clearAuthSession, saveAuthTokens } from "./auth";
import { AuthResponse, User } from "@/types/auth";

/**
 * MOCK MODE TOGGLE
 * Set USE_MOCK_API to true to simulate backend responses without a running backend server.
 * Set to false when connecting to a real API at process.env.NEXT_PUBLIC_API_URL or '/api/v1'.
 */
export const USE_MOCK_API = true;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.healthcarenavigator.internal/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
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

// Helper function to simulate network delay for mock endpoints
const delay = (ms: number = 600) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock user database in memory
const MOCK_USER: User = {
  id: "usr_9981247",
  email: "sarah.jenkins@example.com",
  fullName: "Dr. Sarah Jenkins",
  phone: "+1 (555) 234-5678",
  createdAt: new Date().toISOString(),
};

/**
 * Authentication API Service Abstraction
 * Handles both Mock Mode and Real Backend Requests
 */
export const authApi = {
  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    if (USE_MOCK_API) {
      await delay(800);
      // Demo error case trigger
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
          ...MOCK_USER,
          email: payload.email,
          fullName: payload.email.split("@")[0].replace(".", " "),
        },
        tokens: {
          accessToken: `mock_jwt_access_${Date.now()}`,
          refreshToken: `mock_jwt_refresh_${Date.now()}`,
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
      await delay(900);
      if (payload.email === "existing@example.com") {
        throw {
          response: {
            status: 409,
            data: { message: "An account with this email address already exists." },
          },
        };
      }

      const mockResponse: AuthResponse = {
        user: {
          id: `usr_${Math.floor(Math.random() * 1000000)}`,
          email: payload.email,
          fullName: payload.fullName,
          phone: payload.phone,
          createdAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: `mock_jwt_access_${Date.now()}`,
          refreshToken: `mock_jwt_refresh_${Date.now()}`,
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
      await delay(700);
      return {
        message: `Password reset instructions have been sent to ${payload.email}`,
      };
    }

    const { data } = await api.post<{ message: string }>("/auth/forgot-password", payload);
    return data;
  },

  resetPassword: async (payload: { token: string; newPassword: string }): Promise<{ message: string }> => {
    if (USE_MOCK_API) {
      await delay(800);
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
      await delay(0); // Instant session restore — no delay needed for mock
      const mockResponse: AuthResponse = {
        user: MOCK_USER,
        tokens: {
          accessToken: `mock_jwt_access_refreshed_${Date.now()}`,
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
    if (USE_MOCK_API) {
      await delay(300);
      return MOCK_USER;
    }

    const { data } = await api.get<User>("/auth/me");
    return data;
  },
};
