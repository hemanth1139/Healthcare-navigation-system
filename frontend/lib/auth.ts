/**
 * Authentication Storage & Token Management Helper
 * 
 * NOTE FOR BACKEND INTEGRATION:
 * In a full production setup with a real backend, refresh tokens should be stored in secure,
 * SameSite=Strict HttpOnly cookies set by the backend server to protect against XSS token extraction.
 * Access tokens are kept in-memory (AuthContext). For this frontend phase and mock demo,
 * we store the refresh token in localStorage and access token in an in-memory variable as a simulation.
 */

import { AuthTokens } from "@/types/auth";

let inMemoryAccessToken: string | null = null;

const REFRESH_TOKEN_KEY = "hn_refresh_token";

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const removeRefreshToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const saveAuthTokens = (tokens: AuthTokens): void => {
  setAccessToken(tokens.accessToken);
  setRefreshToken(tokens.refreshToken);
};

export const clearAuthSession = (): void => {
  inMemoryAccessToken = null;
  removeRefreshToken();
};
