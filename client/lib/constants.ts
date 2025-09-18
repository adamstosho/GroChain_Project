export const APP_CONFIG = {
  name: "GroChain",
  description: "Building Trust in Nigeria's Food Chain",
  version: "1.0.0",
  api: {
    // Force the correct API base URL to fix the 404 issue
    baseUrl: "http://localhost:5000",
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000",
  },
  auth: {
    tokenKey: "grochain_auth_token", // Use hardcoded secure default instead of env var
    refreshTokenKey: "grochain_refresh_token", // Use hardcoded secure default instead of env var
    redirectUrl: process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL || "/dashboard",
  },
  features: {
    pwa: process.env.NEXT_PUBLIC_ENABLE_PWA === "true",
    offlineMode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE === "true",
    pushNotifications: process.env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === "true",
    websocket: process.env.NEXT_PUBLIC_WEBSOCKET_ENABLED === "true",
  },
} as const

export const USER_ROLES = {
  FARMER: "farmer",
  BUYER: "buyer",
  PARTNER: "partner",
  ADMIN: "admin",
} as const

export const HARVEST_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  APPROVED: "approved",
} as const

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const

export const QUALITY_GRADES = {
  EXCELLENT: "excellent",
  GOOD: "good",
  FAIR: "fair",
  POOR: "poor",
} as const

export const CROP_CATEGORIES = ["Grains", "Tubers", "Vegetables", "Fruits", "Legumes", "Spices", "Cash Crops"] as const

export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const
