/**
 * NearAfrica - Utility Functions
 * ==============================
 */

/**
 * Haversine formula: distance in km between two lat/lng points
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
function formatDistance(km) {
  if (km < 1) {
    return Math.round(km * 1000) + " m";
  }
  return km.toFixed(1) + " km";
}

/**
 * Check if a business is open now (simple version using local time)
 * openingHours format: { monday: "09:00 - 19:00", sunday: "Closed" }
 */
function isOpenNow(openingHours) {
  if (!openingHours) return null;
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const now = new Date();
  const day = days[now.getDay()];
  const hours = openingHours[day];
  if (!hours || hours.toLowerCase() === "closed" || hours.toLowerCase() === "by appointment") {
    return false;
  }
  if (hours.toLowerCase().includes("24 hours")) return true;

  const match = hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;

  let openH = parseInt(match[1], 10);
  const openM = parseInt(match[2], 10);
  let closeH = parseInt(match[3], 10);
  const closeM = parseInt(match[4], 10);

  // Handle overnight (e.g. 11:00 - 00:00)
  if (closeH === 0 && closeM === 0) closeH = 24;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Simple geocoding mock for demo cities
 * Returns approximate lat/lng for known African cities
 * Replace with real geocoding API (Nominatim, Google Geocoding, etc.) later
 */
const CITY_COORDS = {
  "aba": { lat: 5.1066, lng: 7.3667, country: "Nigeria" },
  "lagos": { lat: 6.5244, lng: 3.3792, country: "Nigeria" },
  "abuja": { lat: 9.0765, lng: 7.3986, country: "Nigeria" },
  "accra": { lat: 5.6037, lng: -0.1870, country: "Ghana" },
  "nairobi": { lat: -1.2921, lng: 36.8219, country: "Kenya" },
  "cape town": { lat: -33.9249, lng: 18.4241, country: "South Africa" },
  "johannesburg": { lat: -26.2041, lng: 28.0473, country: "South Africa" },
  "kampala": { lat: 0.3476, lng: 32.5825, country: "Uganda" },
  "dar es salaam": { lat: -6.7924, lng: 39.2083, country: "Tanzania" },
  "kigali": { lat: -1.9441, lng: 30.0619, country: "Rwanda" },
  "douala": { lat: 4.0511, lng: 9.7679, country: "Cameroon" },
  "cairo": { lat: 30.0444, lng: 31.2357, country: "Egypt" },
  "casablanca": { lat: 33.5731, lng: -7.5898, country: "Morocco" },
  "dakar": { lat: 14.7167, lng: -17.4677, country: "Senegal" },
  "addis ababa": { lat: 9.0320, lng: 38.7469, country: "Ethiopia" },
  "lusaka": { lat: -15.3875, lng: 28.3228, country: "Zambia" },
  "harare": { lat: -17.8252, lng: 31.0335, country: "Zimbabwe" },
  "gaborone": { lat: -24.6282, lng: 25.9231, country: "Botswana" },
  "windhoek": { lat: -22.5609, lng: 17.0658, country: "Namibia" },
  "abidjan": { lat: 5.3600, lng: -4.0083, country: "Côte d'Ivoire" },
  "cotonou": { lat: 6.3703, lng: 2.3912, country: "Benin" },
  "lome": { lat: 6.1725, lng: 1.2314, country: "Togo" }
};

/**
 * Resolve location string to coordinates (demo geocoding)
 */
function resolveLocation(locationStr) {
  if (!locationStr || !locationStr.trim()) return null;
  const key = locationStr.trim().toLowerCase().split(",")[0].trim();
  if (CITY_COORDS[key]) {
    return { ...CITY_COORDS[key], label: locationStr.trim() };
  }
  // Fallback: try partial match
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(city) || city.includes(key)) {
      return { ...coords, label: locationStr.trim() };
    }
  }
  return null;
}

/**
 * Get user's browser geolocation
 * Returns Promise<{lat, lng}> or rejects
 */
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        let message = "Location access was unavailable. Enter your city or location manually.";
        if (err.code === 1) {
          message = "Location access was denied. Enter your city or location manually.";
        } else if (err.code === 2) {
          message = "Location could not be determined. Enter your city or location manually.";
        } else if (err.code === 3) {
          message = "Location request timed out. Enter your city or location manually.";
        }
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/**
 * Search & filter businesses
 * Options: { query, category, lat, lng, radiusKm, sortBy, openNow }
 */
function searchBusinesses(businesses, options = {}) {
  const {
    query = "",
    category = "",
    lat = null,
    lng = null,
    radiusKm = 50,
    sortBy = "distance",
    openNow = false
  } = options;

  let results = businesses.map((b) => {
    let distance = null;
    if (lat != null && lng != null && b.latitude != null && b.longitude != null) {
      distance = calculateDistance(lat, lng, b.latitude, b.longitude);
    }
    return { ...b, distance };
  });

  // Category filter
  if (category) {
    const catLower = category.toLowerCase();
    results = results.filter((b) =>
      b.category.toLowerCase().includes(catLower) ||
      catLower.includes(b.category.toLowerCase())
    );
  }

  // Keyword filter (name, description, category, city)
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    results = results.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        b.category.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.country.toLowerCase().includes(q)
    );
  }

  // Radius filter
  if (lat != null && lng != null && radiusKm) {
    results = results.filter((b) => b.distance == null || b.distance <= radiusKm);
  }

  // Open now
  if (openNow) {
    results = results.filter((b) => isOpenNow(b.openingHours) === true);
  }

  // Sort
  if (sortBy === "distance") {
    results.sort((a, b) => {
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
  } else if (sortBy === "rating") {
    results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortBy === "name") {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Featured first (optional boost)
  results.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });

  return results;
}

/**
 * Get business by ID
 */
function getBusinessById(id) {
  if (!window.NearAfricaData) return null;
  return window.NearAfricaData.businesses.find((b) => b.id === id) || null;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format rating stars (text version for simplicity)
 */
function formatRating(rating) {
  if (rating == null) return "—";
  return rating.toFixed(1);
}

/**
 * WhatsApp link helper
 */
function whatsappLink(number, message) {
  if (!number) return null;
  const clean = number.replace(/\D/g, "");
  const text = message ? encodeURIComponent(message) : "";
  return `https://wa.me/${clean}${text ? "?text=" + text : ""}`;
}

/**
 * Directions link (Google Maps)
 */
function directionsLink(lat, lng, address) {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  }
  return null;
}

/**
 * Query string helpers
 */
function getQueryParams() {
  const params = {};
  const search = window.location.search.slice(1);
  if (!search) return params;
  search.split("&").forEach((pair) => {
    const [key, value] = pair.split("=");
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || "");
  });
  return params;
}

function buildQueryString(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

// Expose utils
if (typeof window !== "undefined") {
  window.NearAfricaUtils = {
    calculateDistance,
    formatDistance,
    isOpenNow,
    resolveLocation,
    getUserLocation,
    searchBusinesses,
    getBusinessById,
    escapeHtml,
    formatRating,
    whatsappLink,
    directionsLink,
    getQueryParams,
    buildQueryString,
    CITY_COORDS
  };
}
