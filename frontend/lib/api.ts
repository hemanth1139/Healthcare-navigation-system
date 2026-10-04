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
  timeout: 30000, // Reduced to 30 seconds for better UX
});

// Separate API client for long-running RAG/scheme queries
export const slowApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 90000, // 90 seconds for RAG processing
});

// Request Interceptor: Attach Bearer Authorization token
const attachToken = (config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachToken, (error) => Promise.reject(error));
slowApi.interceptors.request.use(attachToken, (error) => Promise.reject(error));

// In-flight refresh token state & queue to prevent concurrent duplicate refresh requests
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
let inFlightRefreshPromise: Promise<AuthResponse> | null = null;

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const onRefreshFailed = () => {
  refreshSubscribers = [];
};

// Response Interceptor: Handle 401 Token Refresh automatically with concurrency protection
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh");

    // If 401 Unauthorized on non-auth endpoint and request hasn't been retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearAuthSession();
        return Promise.reject(error);
      }

      // If another refresh request is already in-flight, queue this request until the new token arrives
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // Attempt token refresh call
        const refreshRes = await authApi.refreshToken(refreshToken);
        saveAuthTokens(refreshRes.tokens);
        onRefreshed(refreshRes.tokens.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${refreshRes.tokens.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        // Refresh failed: session expired or invalid
        onRefreshFailed();
        clearAuthSession();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Add same interceptor to slowApi
slowApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearAuthSession();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(slowApi(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await authApi.refreshToken(refreshToken);
        saveAuthTokens(refreshRes.tokens);
        onRefreshed(refreshRes.tokens.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${refreshRes.tokens.accessToken}`;
        }
        return slowApi(originalRequest);
      } catch (refreshErr) {
        onRefreshFailed();
        clearAuthSession();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
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

  loginWithGoogle: async (credential: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/google", { credential });
    saveAuthTokens(data.tokens);
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore network error on logout
    } finally {
      clearAuthSession();
    }
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

    if (!refreshToken || !refreshToken.trim()) {
      throw new Error("No refresh token provided.");
    }

    // Reuse in-flight refresh promise if one is already pending
    if (inFlightRefreshPromise) {
      return inFlightRefreshPromise;
    }

    inFlightRefreshPromise = (async () => {
      try {
        // Use direct axios instance to prevent attaching an expired Authorization Bearer header
        const { data } = await axios.post<AuthResponse>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );
        saveAuthTokens(data.tokens);
        return data;
      } finally {
        inFlightRefreshPromise = null;
      }
    })();

    return inFlightRefreshPromise;
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },
};
