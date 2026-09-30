/**
 * NearAfrica - Utility Functions
 * ==============================
 * Shared frontend utilities for:
 * - Business normalization
 * - Distance calculation
 * - Location handling
 * - Search/filtering
 * - Opening hours
 * - URL/query handling
 * - Safe HTML output
 * - Contact/directions links
 */


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function toRad(deg) {
  return Number(deg) * (Math.PI / 180);
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function cleanText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}


/* =========================================================
   BUSINESS NORMALIZATION
   ========================================================= */

/**
 * Normalizes businesses coming from:
 *
 * - NearAfrica Worker
 * - older frontend data
 * - static demo data
 *
 * The Worker uses `business_name`.
 * Older frontend code often uses `name`.
 *
 * This function gives the frontend one consistent structure.
 */
function normalizeBusiness(business = {}) {

  const normalized = {
    ...business,

    id:
      business.id ??
      business.business_id ??
      business.slug ??
      null,

    name:
      cleanText(
        business.name ??
        business.business_name ??
        business.businessName
      ),

    business_name:
      cleanText(
        business.business_name ??
        business.name ??
        business.businessName
      ),

    category: cleanText(business.category),

    subcategory: cleanText(business.subcategory),

    country: cleanText(business.country),

    state: cleanText(
      business.state ??
      business.region
    ),

    city: cleanText(business.city),

    address: cleanText(business.address),

    description: cleanText(business.description),

    phone: cleanText(business.phone),

    whatsapp: cleanText(
      business.whatsapp ??
      business.whatsapp_number
    ),

    email: cleanText(
      business.email ??
      business.contact_email
    ),

    website: cleanText(
      business.website ??
      business.website_url
    ),

    latitude: toNumber(business.latitude),

    longitude: toNumber(business.longitude),

    rating: toNumber(business.rating),

    views: toNumber(business.views) || 0,

    featured:
      business.featured === true ||
      business.featured === 1 ||
      business.featured === "1",

    verified:
      business.verified === true ||
      business.verified === 1 ||
      business.verified === "1",

    claimed:
      business.claimed === true ||
      business.claimed === 1 ||
      business.claimed === "1",

    status: cleanText(business.status),

    openingHours:
      business.openingHours ??
      business.opening_hours ??
      null,

    image_url: cleanText(
      business.image_url ??
      business.imageUrl
    ),

    logo_url: cleanText(
      business.logo_url ??
      business.logoUrl
    ),

    slug: cleanText(business.slug)
  };

  return normalized;
}


/**
 * Normalize an entire business array safely.
 */
function normalizeBusinesses(businesses) {

  if (!Array.isArray(businesses)) {
    return [];
  }

  return businesses
    .filter(Boolean)
    .map(normalizeBusiness);
}


/* =========================================================
   DISTANCE
   ========================================================= */

/**
 * Haversine formula:
 * distance in kilometres between two latitude/longitude points.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {

  lat1 = toNumber(lat1);
  lon1 = toNumber(lon1);
  lat2 = toNumber(lat2);
  lon2 = toNumber(lon2);

  if (
    lat1 === null ||
    lon1 === null ||
    lat2 === null ||
    lon2 === null
  ) {
    return null;
  }

  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const safeA = Math.min(1, Math.max(0, a));

  const c =
    2 *
    Math.atan2(
      Math.sqrt(safeA),
      Math.sqrt(1 - safeA)
    );

  return R * c;
}


/**
 * Format distance for display.
 */
function formatDistance(km) {

  const distance = toNumber(km);

  if (distance === null) {
    return "";
  }

  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }

  return `${distance.toFixed(1)} km`;
}


/* =========================================================
   OPENING HOURS
   ========================================================= */

/**
 * Check whether a business is currently open.
 *
 * Supports:
 * - "09:00 - 19:00"
 * - "09:00-19:00"
 * - "24 hours"
 * - "Closed"
 * - "By appointment"
 * - overnight schedules such as "22:00 - 02:00"
 */
function isOpenNow(openingHours) {

  if (!openingHours) {
    return null;
  }

  if (
    typeof openingHours !== "object" ||
    Array.isArray(openingHours)
  ) {
    return null;
  }

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ];

  const now = new Date();

  const day = days[now.getDay()];

  const hoursValue =
    openingHours[day] ??
    openingHours[day.toLowerCase()];

  if (!hoursValue) {
    return null;
  }

  const hours = String(hoursValue).trim();

  const lower = hours.toLowerCase();

  if (
    lower === "closed" ||
    lower === "close"
  ) {
    return false;
  }

  if (
    lower === "by appointment" ||
    lower === "appointment"
  ) {
    return false;
  }

  if (
    lower.includes("24 hours") ||
    lower === "24/7" ||
    lower === "open 24 hours"
  ) {
    return true;
  }

  const match = hours.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
  );

  if (!match) {
    return null;
  }

  let openH = Number(match[1]);
  let openM = Number(match[2] || 0);

  let closeH = Number(match[4]);
  let closeM = Number(match[5] || 0);

  const openPeriod = match[3]
    ? match[3].toLowerCase()
    : null;

  const closePeriod = match[6]
    ? match[6].toLowerCase()
    : null;

  if (openPeriod) {
    if (openPeriod === "pm" && openH < 12) {
      openH += 12;
    }

    if (openPeriod === "am" && openH === 12) {
      openH = 0;
    }
  }

  if (closePeriod) {
    if (closePeriod === "pm" && closeH < 12) {
      closeH += 12;
    }

    if (closePeriod === "am" && closeH === 12) {
      closeH = 0;
    }
  }

  if (
    openH > 23 ||
    closeH > 24 ||
    openM > 59 ||
    closeM > 59
  ) {
    return null;
  }

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  const openMinutes =
    openH * 60 +
    openM;

  let closeMinutes =
    closeH * 60 +
    closeM;

  /*
   * Same-day midnight close:
   * 11:00 - 00:00
   */
  if (
    closeH === 0 &&
    closeM === 0 &&
    openMinutes > 0
  ) {
    closeMinutes = 24 * 60;
  }

  /*
   * Overnight schedule:
   * 22:00 - 02:00
   */
  if (closeMinutes <= openMinutes) {
    return (
      currentMinutes >= openMinutes ||
      currentMinutes < closeMinutes
    );
  }

  return (
    currentMinutes >= openMinutes &&
    currentMinutes < closeMinutes
  );
}


/* =========================================================
   CITY COORDINATES
   ========================================================= */

/**
 * Approximate city coordinates.
 *
 * These are fallback coordinates only.
 * Business GPS coordinates from the API should take priority.
 */
const CITY_COORDS = {

  "aba": {
    lat: 5.1066,
    lng: 7.3667,
    country: "Nigeria"
  },

  "lagos": {
    lat: 6.5244,
    lng: 3.3792,
    country: "Nigeria"
  },

  "abuja": {
    lat: 9.0765,
    lng: 7.3986,
    country: "Nigeria"
  },

  "accra": {
    lat: 5.6037,
    lng: -0.1870,
    country: "Ghana"
  },

  "nairobi": {
    lat: -1.2921,
    lng: 36.8219,
    country: "Kenya"
  },

  "cape town": {
    lat: -33.9249,
    lng: 18.4241,
    country: "South Africa"
  },

  "johannesburg": {
    lat: -26.2041,
    lng: 28.0473,
    country: "South Africa"
  },

  "kampala": {
    lat: 0.3476,
    lng: 32.5825,
    country: "Uganda"
  },

  "dar es salaam": {
    lat: -6.7924,
    lng: 39.2083,
    country: "Tanzania"
  },

  "kigali": {
    lat: -1.9441,
    lng: 30.0619,
    country: "Rwanda"
  },

  "douala": {
    lat: 4.0511,
    lng: 9.7679,
    country: "Cameroon"
  },

  "cairo": {
    lat: 30.0444,
    lng: 31.2357,
    country: "Egypt"
  },

  "casablanca": {
    lat: 33.5731,
    lng: -7.5898,
    country: "Morocco"
  },

  "dakar": {
    lat: 14.7167,
    lng: -17.4677,
    country: "Senegal"
  },

  "addis ababa": {
    lat: 9.0320,
    lng: 38.7469,
    country: "Ethiopia"
  },

  "lusaka": {
    lat: -15.3875,
    lng: 28.3228,
    country: "Zambia"
  },

  "harare": {
    lat: -17.8252,
    lng: 31.0335,
    country: "Zimbabwe"
  },

  "gaborone": {
    lat: -24.6282,
    lng: 25.9231,
    country: "Botswana"
  },

  "windhoek": {
    lat: -22.5609,
    lng: 17.0658,
    country: "Namibia"
  },

  "abidjan": {
    lat: 5.3600,
    lng: -4.0083,
    country: "Côte d'Ivoire"
  },

  "cotonou": {
    lat: 6.3703,
    lng: 2.3912,
    country: "Benin"
  },

  "lome": {
    lat: 6.1725,
    lng: 1.2314,
    country: "Togo"
  }
};


/* =========================================================
   LOCATION RESOLUTION
   ========================================================= */

/**
 * Resolve a known city/location into approximate coordinates.
 *
 * This is a fallback for manually entered locations.
 * Browser GPS is more precise and should take priority.
 */
function resolveLocation(locationStr) {

  const input = cleanText(locationStr);

  if (!input) {
    return null;
  }

  const key = input
    .toLowerCase()
    .split(",")[0]
    .trim();

  if (CITY_COORDS[key]) {
    return {
      ...CITY_COORDS[key],
      label: input
    };
  }

  for (const [city, coords] of Object.entries(CITY_COORDS)) {

    if (
      key.includes(city) ||
      city.includes(key)
    ) {
      return {
        ...coords,
        label: input
      };
    }
  }

  return null;
}


/* =========================================================
   USER LOCATION
   ========================================================= */

/**
 * Get the visitor's browser location.
 *
 * Returns:
 * {
 *   lat,
 *   lng
 * }
 */
function getUserLocation() {

  return new Promise((resolve, reject) => {

    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      reject(
        new Error(
          "Geolocation is not supported by your browser."
        )
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(

      (position) => {

        const lat =
          toNumber(position.coords.latitude);

        const lng =
          toNumber(position.coords.longitude);

        if (
          lat === null ||
          lng === null
        ) {
          reject(
            new Error(
              "Your location could not be determined."
            )
          );

          return;
        }

        resolve({
          lat,
          lng,
          accuracy:
            toNumber(position.coords.accuracy)
        });
      },

      (error) => {

        let message =
          "Location access was unavailable. Enter your city or location manually.";

        if (error && error.code === 1) {

          message =
            "Location access was denied. Enter your city or location manually.";

        } else if (error && error.code === 2) {

          message =
            "Location could not be determined. Enter your city or location manually.";

        } else if (error && error.code === 3) {

          message =
            "Location request timed out. Enter your city or location manually.";
        }

        reject(new Error(message));
      },

      {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 60000
      }
    );
  });
}


/* =========================================================
   SEARCH
   ========================================================= */

/**
 * Search and filter businesses.
 *
 * Options:
 * {
 *   query,
 *   category,
 *   lat,
 *   lng,
 *   radiusKm,
 *   sortBy,
 *   openNow
 * }
 */
function searchBusinesses(
  businesses,
  options = {}
) {

  const {

    query = "",

    category = "",

    lat = null,

    lng = null,

    radiusKm = 25,

    sortBy = "distance",

    openNow = false

  } = options;


  let results =
    normalizeBusinesses(businesses);


  /* ---------------------------------------------------------
     Calculate distance
     --------------------------------------------------------- */

  results = results.map((business) => {

    let distance = null;

    if (
      lat != null &&
      lng != null &&
      business.latitude != null &&
      business.longitude != null
    ) {

      distance =
        calculateDistance(
          lat,
          lng,
          business.latitude,
          business.longitude
        );
    }

    return {
      ...business,
      distance
    };
  });


  /* ---------------------------------------------------------
     Category
     --------------------------------------------------------- */

  if (cleanText(category)) {

    const catLower =
      cleanText(category).toLowerCase();

    results =
      results.filter((business) => {

        const businessCategory =
          cleanText(
            business.category
          ).toLowerCase();

        return (
          businessCategory.includes(catLower) ||
          catLower.includes(businessCategory)
        );
      });
  }


  /* ---------------------------------------------------------
     Keyword search
     --------------------------------------------------------- */

  const searchQuery =
    cleanText(query).toLowerCase();

  if (searchQuery) {

    results =
      results.filter((business) => {

        const searchableFields = [

          business.name,

          business.business_name,

          business.description,

          business.category,

          business.subcategory,

          business.city,

          business.state,

          business.country,

          business.address

        ];

        return searchableFields.some(
          (value) =>
            cleanText(value)
              .toLowerCase()
              .includes(searchQuery)
        );
      });
  }


  /* ---------------------------------------------------------
     Radius
     --------------------------------------------------------- */

  if (
    lat != null &&
    lng != null &&
    radiusKm != null
  ) {

    const radius =
      Number(radiusKm);

    if (
      Number.isFinite(radius) &&
      radius > 0
    ) {

      /*
       * If a user specifically asks for
       * businesses near their location,
       * businesses without coordinates should
       * NOT bypass the radius filter.
       */
      results =
        results.filter(
          (business) =>
            business.distance != null &&
            business.distance <= radius
        );
    }
  }


  /* ---------------------------------------------------------
     Open now
     --------------------------------------------------------- */

  if (openNow) {

    results =
      results.filter(
        (business) =>
          isOpenNow(
            business.openingHours
          ) === true
      );
  }


  /* ---------------------------------------------------------
     Sorting
     --------------------------------------------------------- */

  if (sortBy === "distance") {

    results.sort((a, b) => {

      if (
        a.distance == null &&
        b.distance == null
      ) {
        return 0;
      }

      if (a.distance == null) {
        return 1;
      }

      if (b.distance == null) {
        return -1;
      }

      return a.distance - b.distance;
    });

  } else if (sortBy === "rating") {

    results.sort(
      (a, b) =>
        (b.rating || 0) -
        (a.rating || 0)
    );

  } else if (sortBy === "name") {

    results.sort(
      (a, b) =>
        cleanText(a.name).localeCompare(
          cleanText(b.name)
        )
    );
  }


  /*
   * IMPORTANT:
   * We do NOT perform a second "featured first"
   * sort after distance sorting.
   *
   * That would destroy nearest-first ordering.
   *
   * Featured/premium ranking should ultimately
   * be handled by the Worker ranking system.
   */

  return results;
}


/* =========================================================
   BUSINESS LOOKUP
   ========================================================= */

/**
 * Get a business by ID.
 *
 * First checks the current API-backed frontend
 * collection, then falls back to legacy static data.
 */
function getBusinessById(id, businesses = null) {

  const cleanId =
    cleanText(id);

  if (!cleanId) {
    return null;
  }


  if (Array.isArray(businesses)) {

    const found =
      businesses.find(
        (business) =>
          String(
            business.id ??
            business.business_id
          ) === cleanId
      );

    if (found) {
      return normalizeBusiness(found);
    }
  }


  if (
    typeof window !== "undefined" &&
    window.NearAfricaData &&
    Array.isArray(
      window.NearAfricaData.businesses
    )
  ) {

    const found =
      window.NearAfricaData.businesses.find(
        (business) =>
          String(
            business.id ??
            business.business_id
          ) === cleanId
      );

    if (found) {
      return normalizeBusiness(found);
    }
  }


  return null;
}


/* =========================================================
   HTML SAFETY
   ========================================================= */

/**
 * Escape HTML to prevent accidental HTML injection.
 */
function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const text =
    String(value);

  /*
   * Browser environment.
   */
  if (
    typeof document !== "undefined"
  ) {

    const div =
      document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
  }


  /*
   * Safe fallback for non-browser environments.
   */
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   RATINGS
   ========================================================= */

function formatRating(rating) {

  const value =
    toNumber(rating);

  if (value === null) {
    return "—";
  }

  return value.toFixed(1);
}


/* =========================================================
   CONTACT LINKS
   ========================================================= */

/**
 * Create a WhatsApp URL.
 */
function whatsappLink(
  number,
  message = ""
) {

  const raw =
    cleanText(number);

  if (!raw) {
    return null;
  }

  const clean =
    raw.replace(/\D/g, "");

  if (!clean) {
    return null;
  }

  const encodedMessage =
    cleanText(message)
      ? encodeURIComponent(message)
      : "";

  return (
    `https://wa.me/${clean}` +
    (
      encodedMessage
        ? `?text=${encodedMessage}`
        : ""
    )
  );
}


/**
 * Create a Google Maps directions URL.
 */
function directionsLink(
  lat,
  lng,
  address
) {

  const latitude =
    toNumber(lat);

  const longitude =
    toNumber(lng);

  if (
    latitude !== null &&
    longitude !== null
  ) {

    return (
      "https://www.google.com/maps/dir/?api=1" +
      `&destination=${latitude},${longitude}`
    );
  }

  const cleanAddress =
    cleanText(address);

  if (cleanAddress) {

    return (
      "https://www.google.com/maps/dir/?api=1" +
      `&destination=${encodeURIComponent(cleanAddress)}`
    );
  }

  return null;
}


/* =========================================================
   QUERY STRING
   ========================================================= */

/**
 * Read URL query parameters safely.
 *
 * Uses URLSearchParams instead of manually
 * splitting "=" characters.
 */
function getQueryParams() {

  const params = {};

  if (
    typeof window === "undefined"
  ) {
    return params;
  }

  const searchParams =
    new URLSearchParams(
      window.location.search
    );

  searchParams.forEach(
    (value, key) => {
      params[key] = value;
    }
  );

  return params;
}


/**
 * Build a URL query string.
 */
function buildQueryString(obj = {}) {

  const params =
    new URLSearchParams();

  Object.entries(obj).forEach(
    ([key, value]) => {

      if (
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {

        params.set(
          key,
          String(value)
        );
      }
    }
  );

  return params.toString();
}


/* =========================================================
   API HELPERS
   ========================================================= */

/**
 * Get the configured API base URL.
 */
function getApiBaseUrl() {

  if (
    typeof window !== "undefined" &&
    window.NearAfricaConfig &&
    window.NearAfricaConfig.api &&
    window.NearAfricaConfig.api.baseUrl
  ) {

    return String(
      window.NearAfricaConfig.api.baseUrl
    ).replace(/\/+$/, "");
  }

  return "";
}


/**
 * Build an API URL.
 */
function buildApiUrl(
  path = ""
) {

  const base =
    getApiBaseUrl();

  if (!base) {
    return path;
  }

  if (!path) {
    return base;
  }

  if (path.startsWith("http://") ||
      path.startsWith("https://")) {
    return path;
  }

  return (
    base +
    (
      path.startsWith("/")
        ? path
        : `/${path}`
    )
  );
}


/* =========================================================
   EXPORT
   ========================================================= */

if (
  typeof window !== "undefined"
) {

  window.NearAfricaUtils = {

    toRad,

    toNumber,

    cleanText,

    normalizeBusiness,

    normalizeBusinesses,

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

    getApiBaseUrl,

    buildApiUrl,

    CITY_COORDS
  };
    }
