/**
 * NearAfrica - Configuration
 * ==========================
 * Place API keys and environment settings here.
 * NEVER hard-code paid API keys in production frontend code.
 * Use environment variables or a backend proxy when going live.
 */

const NearAfricaConfig = {
  // Map provider: "leaflet" (OpenStreetMap - free for MVP) | future: "mapbox" | "google"
  mapProvider: "leaflet",

  // Future: Mapbox or Google Maps API key (leave empty for MVP)
  // mapApiKey: "", // e.g. process.env.MAPBOX_TOKEN or from backend

  // Default search radius in kilometres
  defaultRadiusKm: 50,

  // Demo mode flag
  isDemo: true,

  // App name & branding
  appName: "NearAfrica",
  tagline: "Find Great Businesses Near You.",
  description: "Discover trusted businesses, services and places across Africa.",

  // Base URL for SEO / sharing (update when deployed)
  baseUrl: "https://nearafrica.example.com"
};

if (typeof window !== "undefined") {
  window.NearAfricaConfig = NearAfricaConfig;
}
