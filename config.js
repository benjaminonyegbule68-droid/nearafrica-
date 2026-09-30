/**
 * NearAfrica - Production Configuration
 * ======================================
 * Central configuration for the NearAfrica frontend.
 *
 * IMPORTANT:
 * This file contains NON-SECRET settings only.
 *
 * NEVER put these here:
 * - Payment secret keys
 * - Database passwords
 * - Admin passwords
 * - JWT/authentication secrets
 * - Private API keys
 */

const NearAfricaConfig = {

  // =========================================================
  // API
  // =========================================================

  api: {
    baseUrl: "https://nearafrica-api.nearafrica-onyxtech.workers.dev",

    endpoints: {
      health: "/health",
      businesses: "/businesses",
      search: "/search",
      categories: "/categories",
      nearby: "/nearby",
      reviews: "/reviews",
      reports: "/reports",
      submissions: "/submissions",
      claims: "/claims",
      favorites: "/favorites",
      analytics: "/analytics",
      helpWanted: "/help_wanted"
    }
  },


  // =========================================================
  // APPLICATION
  // =========================================================

  app: {
    name: "NearAfrica",

    tagline: "Find Great Businesses Near You
