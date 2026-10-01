/**
 * NearAfrica - Utility Functions
 * ==============================
 * Shared frontend utilities for:
 *
 * - Business normalization
 * - Distance calculation
 * - Location handling
 * - Search/filtering
 * - Opening hours
 * - URL/query handling
 * - Safe HTML output
 * - Contact/directions links
 * - API URL handling
 */


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function toRad(deg) {
  return Number(deg) * (Math.PI / 180);
}


function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function cleanText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}


/**
 * Convert a value into a reliable boolean.
 */
function toBoolean(value) {

  if (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "TRUE" ||
    value === "yes" ||
    value === "YES" ||
    value === "on" ||
    value === "ON"
  ) {
    return true;
  }

  return false;
}


/**
 * Normalize a string for comparisons.
 */
function normalizeText(value) {

  return cleanText(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}


/* =========================================================
   URL HELPERS
   ========================================================= */


/**
 * Normalize an external website URL.
 */
function normalizeWebsite(url) {

  const value = cleanText(url);

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return `https://${value}`;
}


/**
 * Safely check whether a URL is usable.
 */
function isValidExternalUrl(url) {

  const value = cleanText(url);

  if (!value) {
    return false;
  }

  try {

    const parsed =
      new URL(
        value.startsWith("http")
          ? value
          : `https://${value}`
      );

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );

  } catch {

    return false;
  }
}


/* =========================================================
   BUSINESS NORMALIZATION
   ========================================================= */


/**
 * Extract the first useful image from an API business object.
 *
 * Supports:
 *
 * image_url
 * imageUrl
 * logo_url
 * logoUrl
 * image
 * images[]
 */
function getBusinessImage(business = {}) {

  const directImage =
    business.image_url ??
    business.imageUrl ??
    business.image ??
    business.photo_url ??
    business.photoUrl;

  if (cleanText(directImage)) {
    return cleanText(directImage);
  }


  const logo =
    business.logo_url ??
    business.logoUrl ??
    business.logo;

  if (cleanText(logo)) {
    return cleanText(logo);
  }


  if (Array.isArray(business.images)) {

    for (const image of business.images) {

      if (typeof image === "string") {

        if (cleanText(image)) {
          return cleanText(image);
        }

      } else if (
        image &&
        typeof image === "object"
      ) {

        const imageUrl =
          image.url ??
          image.image_url ??
          image.imageUrl ??
          image.public_url ??
          image.publicUrl;

        if (cleanText(imageUrl)) {
          return cleanText(imageUrl);
        }
      }
    }
  }


  return "";
}


/**
 * Extract business ID safely.
 */
function getBusinessId(business = {}) {

  return cleanText(
    business.id ??
    business.business_id ??
    business.businessId ??
    business.slug ??
    ""
  );
}


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

  const image =
    getBusinessImage(business);


  const normalized = {

    ...business,


    /* -----------------------------------------------------
       ID
       ----------------------------------------------------- */

    id:
      getBusinessId(business),


    business_id:
      cleanText(
        business.business_id ??
        business.id
      ),


    /* -----------------------------------------------------
       NAME
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       CATEGORY
       ----------------------------------------------------- */

    category:
      cleanText(
        business.category
      ),


    subcategory:
      cleanText(
        business.subcategory
      ),


    /* -----------------------------------------------------
       LOCATION
       ----------------------------------------------------- */

    country:
      cleanText(
        business.country
      ),


    state:
      cleanText(
        business.state ??
        business.region
      ),


    city:
      cleanText(
        business.city
      ),


    address:
      cleanText(
        business.address
      ),


    /* -----------------------------------------------------
       DESCRIPTION
       ----------------------------------------------------- */

    description:
      cleanText(
        business.description
      ),


    /* -----------------------------------------------------
       CONTACT
       ----------------------------------------------------- */

    phone:
      cleanText(
        business.phone ??
        business.phone_number
      ),


    whatsapp:
      cleanText(
        business.whatsapp ??
        business.whatsapp_number ??
        business.whatsappNumber
      ),


    email:
      cleanText(
        business.email ??
        business.contact_email ??
        business.contactEmail
      ),


    website:
      cleanText(
        business.website ??
        business.website_url ??
        business.websiteUrl
      ),


    instagram:
      cleanText(
        business.instagram ??
        business.instagram_url
      ),


    facebook:
      cleanText(
        business.facebook ??
        business.facebook_url
      ),


    tiktok:
      cleanText(
        business.tiktok ??
        business.tiktok_url
      ),


    /* -----------------------------------------------------
       COORDINATES
       ----------------------------------------------------- */

    latitude:
      toNumber(
        business.latitude ??
        business.lat
      ),


    longitude:
      toNumber(
        business.longitude ??
        business.lng ??
        business.lon
      ),


    /* -----------------------------------------------------
       RATINGS / VIEWS
       ----------------------------------------------------- */

    rating:
      toNumber(
        business.rating ??
        business.average_rating
      ),


    review_count:
      toNumber(
        business.review_count ??
        business.reviewCount ??
        business.reviews_count
      ) || 0,


    views:
      toNumber(
        business.views ??
        business.view_count
      ) || 0,


    /* -----------------------------------------------------
       STATUS FLAGS
       ----------------------------------------------------- */

    featured:
      toBoolean(
        business.featured
      ),


    verified:
      toBoolean(
        business.verified
      ),


    claimed:
      toBoolean(
        business.claimed
      ),


    status:
      cleanText(
        business.status
      ),


    /* -----------------------------------------------------
       HOURS
       ----------------------------------------------------- */

    openingHours:
      business.openingHours ??
      business.opening_hours ??
      null,


    /* -----------------------------------------------------
       IMAGES
       ----------------------------------------------------- */

    image_url:
      image,


    imageUrl:
      image,


    logo_url:
      cleanText(
        business.logo_url ??
        business.logoUrl
      ),


    /* -----------------------------------------------------
       SLUG
       ----------------------------------------------------- */

    slug:
      cleanText(
        business.slug
      )

  };


  /*
   * If there is no explicit logo but an image exists,
   * let the frontend use the image as the visual fallback.
   */
  if (
    !normalized.logo_url &&
    normalized.image_url
  ) {
    normalized.logo_url =
      normalized.image_url;
  }


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
function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {

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


  const dLat =
    toRad(lat2 - lat1);

  const dLon =
    toRad(lon2 - lon1);


  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);


  const safeA =
    Math.min(
      1,
      Math.max(0, a)
    );


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

  const distance =
    toNumber(km);


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
 *
 * - "09:00 - 19:00"
 * - "09:00-19:00"
 * - "9 AM - 7 PM"
 * - "24 hours"
 * - "Closed"
 * - "By appointment"
 * - overnight schedules
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


  const now =
    new Date();


  const day =
    days[now.getDay()];


  const hoursValue =
    openingHours[day] ??
    openingHours[day.toLowerCase()];


  if (!hoursValue) {
    return null;
  }


  const hours =
    String(hoursValue).trim();


  const lower =
    hours.toLowerCase();


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


  const match =
    hours.match(
      /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
    );


  if (!match) {
    return null;
  }


  let openH =
    Number(match[1]);

  let openM =
    Number(match[2] || 0);


  let closeH =
    Number(match[4]);

  let closeM =
    Number(match[5] || 0);


  const openPeriod =
    match[3]
      ? match[3].toLowerCase()
      : null;


  const closePeriod =
    match[6]
      ? match[6].toLowerCase()
      : null;


  if (openPeriod) {

    if (
      openPeriod === "pm" &&
      openH < 12
    ) {
      openH += 12;
    }


    if (
      openPeriod === "am" &&
      openH === 12
    ) {
      openH = 0;
    }
  }


  if (closePeriod) {

    if (
      closePeriod === "pm" &&
      closeH < 12
    ) {
      closeH += 12;
    }


    if (
      closePeriod === "am" &&
      closeH === 12
    ) {
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
    closeMinutes =
      24 * 60;
  }


  /*
   * Overnight schedule:
   * 22:00 - 02:00
   */
  if (
    closeMinutes <= openMinutes
  ) {

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
 * Fallback only.
 * Business GPS coordinates from the API
 * should always take priority.
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
 * Browser GPS is more precise and takes priority.
 */
function resolveLocation(locationStr) {

  const input =
    cleanText(locationStr);


  if (!input) {
    return null;
  }


  const normalized =
    normalizeText(input);


  const key =
    normalized
      .split(",")[0]
      .trim();


  if (CITY_COORDS[key]) {

    return {
      ...CITY_COORDS[key],
      label: input
    };
  }


  for (
    const [city, coords]
    of Object.entries(CITY_COORDS)
  ) {

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
 *
 * {
 *   lat,
 *   lng,
 *   accuracy
 * }
 */
function getUserLocation() {

  return new Promise(
    (resolve, reject) => {

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
            toNumber(
              position.coords.latitude
            );


          const lng =
            toNumber(
              position.coords.longitude
            );


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
              toNumber(
                position.coords.accuracy
              )

          });
        },


        (error) => {

          let message =
            "Location access was unavailable. Enter your city or location manually.";


          if (
            error &&
            error.code === 1
          ) {

            message =
              "Location access was denied. Enter your city or location manually.";

          } else if (
            error &&
            error.code === 2
          ) {

            message =
              "Location could not be determined. Enter your city or location manually.";

          } else if (
            error &&
            error.code === 3
          ) {

            message =
              "Location request timed out. Enter your city or location manually.";
          }


          reject(
            new Error(message)
          );
        },


        {
          enableHighAccuracy: true,

          timeout: 10000,

          maximumAge: 60000
        }
      );
    }
  );
}


/* =========================================================
   SEARCH
   ========================================================= */


/**
 * Search and filter businesses.
 *
 * Options:
 *
 * {
 *   query,
 *   location,
 *   category,
 *   country,
 *   state,
 *   city,
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

    location = "",

    category = "",

    country = "",

    state = "",

    city = "",

    lat = null,

    lng = null,

    radiusKm = 25,

    sortBy = "distance",

    openNow = false

  } = options;


  let results =
    normalizeBusinesses(
      businesses
    );


  /* ---------------------------------------------------------
     Calculate distance
     --------------------------------------------------------- */

  results =
    results.map(
      (business) => {

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
      }
    );


  /* ---------------------------------------------------------
     Country
     --------------------------------------------------------- */

  if (cleanText(country)) {

    const wantedCountry =
      normalizeText(country);


    results =
      results.filter(
        (business) =>
          normalizeText(
            business.country
          ).includes(
            wantedCountry
          )
      );
  }


  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */

  if (cleanText(state)) {

    const wantedState =
      normalizeText(state);


    results =
      results.filter(
        (business) =>
          normalizeText(
            business.state
          ).includes(
            wantedState
          )
      );
  }


  /* ---------------------------------------------------------
     City
     --------------------------------------------------------- */

  if (cleanText(city)) {

    const wantedCity =
      normalizeText(city);


    results =
      results.filter(
        (business) =>
          normalizeText(
            business.city
          ).includes(
            wantedCity
          )
      );
  }


  /* ---------------------------------------------------------
     Category
     --------------------------------------------------------- */

  if (cleanText(category)) {

    const catLower =
      normalizeText(category);


    results =
      results.filter(
        (business) => {

          const businessCategory =
            normalizeText(
              business.category
            );


          return (
            businessCategory.includes(
              catLower
            ) ||
            catLower.includes(
              businessCategory
            )
          );
        }
      );
  }


  /* ---------------------------------------------------------
     Location text
     --------------------------------------------------------- */

  if (cleanText(location)) {

    const locationLower =
      normalizeText(location);


    results =
      results.filter(
        (business) => {

          const locationFields = [

            business.city,

            business.state,

            business.country,

            business.address

          ];


          return locationFields.some(
            (value) =>
              normalizeText(
                value
              ).includes(
                locationLower
              )
          );
        }
      );
  }


  /* ---------------------------------------------------------
     Keyword search
     --------------------------------------------------------- */

  const searchQuery =
    normalizeText(query);


  if (searchQuery) {

    results =
      results.filter(
        (business) => {

          const searchableFields = [

            business.name,

            business.business_name,

            business.description,

            business.category,

            business.subcategory,

            business.city,

            business.state,

            business.country,

            business.address,

            business.phone,

            business.email,

            business.website,

            business.instagram,

            business.facebook,

            business.tiktok

          ];


          return searchableFields.some(
            (value) =>
              normalizeText(
                value
              ).includes(
                searchQuery
              )
          );
        }
      );
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

    results.sort(
      (a, b) => {

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


        return (
          a.distance -
          b.distance
        );
      }
    );

  } else if (
    sortBy === "rating"
  ) {

    results.sort(
      (a, b) =>
        (b.rating || 0) -
        (a.rating || 0)
    );

  } else if (
    sortBy === "name"
  ) {

    results.sort(
      (a, b) =>
        cleanText(
          a.name
        ).localeCompare(
          cleanText(
            b.name
          )
        )
    );

  } else if (
    sortBy === "newest"
  ) {

    results.sort(
      (a, b) => {

        const aDate =
          new Date(
            a.created_at ||
            a.createdAt ||
            0
          ).getTime();


        const bDate =
          new Date(
            b.created_at ||
            b.createdAt ||
            0
          ).getTime();


        return bDate - aDate;
      }
    );
  }


  return results;
}


/* =========================================================
   BUSINESS LOOKUP
   ========================================================= */


/**
 * Get a business by ID, slug, or business name.
 */
function getBusinessById(
  id,
  businesses = null
) {

  const cleanId =
    cleanText(id);


  if (!cleanId) {
    return null;
  }


  const normalizedId =
    normalizeText(cleanId);


  const collections = [];


  if (Array.isArray(businesses)) {
    collections.push(
      businesses
    );
  }


  if (
    typeof window !== "undefined" &&
    window.NearAfricaData &&
    Array.isArray(
      window.NearAfricaData.businesses
    )
  ) {

    collections.push(
      window.NearAfricaData.businesses
    );
  }


  for (
    const collection
    of collections
  ) {

    const found =
      collection.find(
        (business) => {

          const identifiers = [

            business.id,

            business.business_id,

            business.businessId,

            business.slug,

            business.name,

            business.business_name

          ];


          return identifiers.some(
            (value) =>
              normalizeText(
                value
              ) === normalizedId
          );
        }
      );


    if (found) {
      return normalizeBusiness(
        found
      );
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


  if (
    typeof document !== "undefined"
  ) {

    const div =
      document.createElement(
        "div"
      );


    div.textContent =
      text;


    return div.innerHTML;
  }


  return text
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
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
 *
 * Important:
 * This does not invent a country code.
 * The stored business number is used as supplied.
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
    raw.replace(
      /\D/g,
      ""
    );


  if (!clean) {
    return null;
  }


  const encodedMessage =
    cleanText(message)
      ? encodeURIComponent(
          message
        )
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
      `&destination=${encodeURIComponent(
        cleanAddress
      )}`
    );
  }


  return null;
}


/**
 * Create a telephone link.
 */
function phoneLink(number) {

  const value =
    cleanText(number);


  if (!value) {
    return null;
  }


  return `tel:${value.replace(
    /[^0-9+]/g,
    ""
  )}`;
}


/**
 * Create an email link.
 */
function emailLink(email) {

  const value =
    cleanText(email);


  if (!value) {
    return null;
  }


  return `mailto:${encodeURIComponent(
    value
  )}`;
}


/* =========================================================
   QUERY STRING
   ========================================================= */


/**
 * Read URL query parameters safely.
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

      params[key] =
        value;
    }
  );


  return params;
}


/**
 * Build a URL query string.
 */
function buildQueryString(
  obj = {}
) {

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
   API RESPONSE HELPERS
   ========================================================= */


/**
 * Extract an array from common NearAfrica API
 * response shapes.
 */
function extractBusinessesFromResponse(
  payload
) {

  if (
    Array.isArray(payload)
  ) {
    return payload;
  }


  if (
    payload &&
    Array.isArray(payload.businesses)
  ) {
    return payload.businesses;
  }


  if (
    payload &&
    payload.data &&
    Array.isArray(
      payload.data.businesses
    )
  ) {
    return payload.data.businesses;
  }


  if (
    payload &&
    payload.data &&
    Array.isArray(
      payload.data
    )
  ) {
    return payload.data;
  }


  if (
    payload &&
    Array.isArray(
      payload.results
    )
  ) {
    return payload.results;
  }


  return [];
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
    ).replace(
      /\/+$/,
      ""
    );
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


  if (
    path.startsWith(
      "http://"
    ) ||
    path.startsWith(
      "https://"
    )
  ) {
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

    toBoolean,

    normalizeText,

    normalizeWebsite,

    isValidExternalUrl,

    getBusinessImage,

    getBusinessId,

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

    phoneLink,

    emailLink,

    getQueryParams,

    buildQueryString,

    extractBusinessesFromResponse,

    getApiBaseUrl,

    buildApiUrl,

    CITY_COORDS

  };

     }
