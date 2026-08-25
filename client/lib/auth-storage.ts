import { APP_CONFIG } from "./constants"

export const REMEMBER_ME_KEY = "grochain_remember_me"
export const REMEMBER_EMAIL_KEY = "grochain_remember_email"
export const AUTH_STORE_KEY = "grochain-auth"

export function isRememberMeEnabled(): boolean {
  if (typeof window === "undefined") return true
  return localStorage.getItem(REMEMBER_ME_KEY) !== "false"
}

export function setRememberMePreference(remember: boolean): void {
  if (typeof window === "undefined") return
  localStorage.setItem(REMEMBER_ME_KEY, remember ? "true" : "false")
}

function getActiveStorage(rememberMe?: boolean): Storage {
  const persist = rememberMe ?? isRememberMeEnabled()
  return persist ? localStorage : sessionStorage
}

export function getTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null
  return (
    sessionStorage.getItem(APP_CONFIG.auth.tokenKey) ??
    localStorage.getItem(APP_CONFIG.auth.tokenKey)
  )
}

export function getRefreshTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null
  return (
    sessionStorage.getItem(APP_CONFIG.auth.refreshTokenKey) ??
    localStorage.getItem(APP_CONFIG.auth.refreshTokenKey)
  )
}

export function setTokensInStorage(
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean,
): void {
  if (typeof window === "undefined") return

  setRememberMePreference(rememberMe)
  clearAuthTokens()

  const storage = getActiveStorage(rememberMe)
  storage.setItem(APP_CONFIG.auth.tokenKey, accessToken)
  storage.setItem(APP_CONFIG.auth.refreshTokenKey, refreshToken)
}

export function setTokenInStorage(token: string): void {
  if (typeof window === "undefined") return
  getActiveStorage().setItem(APP_CONFIG.auth.tokenKey, token)
}

export function setRefreshTokenInStorage(refreshToken: string): void {
  if (typeof window === "undefined") return
  getActiveStorage().setItem(APP_CONFIG.auth.refreshTokenKey, refreshToken)
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return

  for (const key of [
    APP_CONFIG.auth.tokenKey,
    APP_CONFIG.auth.refreshTokenKey,
    AUTH_STORE_KEY,
  ]) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  }
}

export function saveRememberEmail(email: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(REMEMBER_EMAIL_KEY, email)
}

export function clearRememberEmail(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(REMEMBER_EMAIL_KEY)
}

export function getRememberEmail(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REMEMBER_EMAIL_KEY)
}

export function getAuthDataFromStorage(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(AUTH_STORE_KEY) ?? localStorage.getItem(AUTH_STORE_KEY)
}

export const authPersistStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null
    return sessionStorage.getItem(name) ?? localStorage.getItem(name)
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
    getActiveStorage().setItem(name, value)
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}
