/*
 * NearAfrica — app-new.js
 * Category matching, Explore functionality and pagination fixes.
 *
 * Preserves:
 * - API business data; no fictional listings
 * - Search and category/state/city filters
 * - Nearby/GPS location search
 * - Pagination
 * - Saved businesses
 * - Business profile links and view tracking
 * - URL filters and language-change refreshes
 * - The existing NearAfrica API and configuration
 */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     TRANSLATION
  ---------------------------------------------------------- */

  function t(key, fallback) {
    try {
      if (
        typeof window !== "undefined" &&
        window.NearAfricaI18n &&
        typeof window.NearAfricaI18n.translate === "function"
      ) {
        const value = window.NearAfricaI18n.translate(key, fallback);

        if (value !== undefined && value !== null && value !== "") {
          return value;
        }
      }
    } catch (_) {}

    return fallback != null ? fallback : key || "";
  }

  const API_FALLBACK =
    "https://nearafrica-api.nearafrica-onyxtech.workers.dev";

  const LOCATION_KEY = "nearafrica_user_location";
  const NEARBY_KEY = "nearafrica_nearby_mode";
  const SAVED_KEY = "nearafrica_saved_businesses";

  const MAX_LOCATION_ACCURACY_METERS = 25000;

  const HOME_CATEGORIES = [
    "Restaurants & Food",
    "Hotels & Accommodation",
    "Beauty & Spa",
    "Health & Medical",
    "Shopping & Retail",
    "Supermarkets",
    "Professional Services",
    "Education",
    "Real Estate",
    "Automotive",
    "Travel & Tourism",
    "Technology"
  ];

  const CATEGORY_ALIASES = {
    "restaurants and food": "Restaurants & Food",
    "restaurant and food": "Restaurants & Food",
    "restaurant food": "Restaurants & Food",
    "restaurants food": "Restaurants & Food",
    "food and drink": "Restaurants & Food",
    "food drink": "Restaurants & Food",
    "restaurant": "Restaurants & Food",
    "restaurants": "Restaurants & Food",

    "hotel and accommodation": "Hotels & Accommodation",
    "hotels and accommodation": "Hotels & Accommodation",
    "hotel accommodation": "Hotels & Accommodation",
    "hotels accommodation": "Hotels & Accommodation",
    "hotel": "Hotels & Accommodation",
    "hotels": "Hotels & Accommodation",
    "accommodation": "Hotels & Accommodation",

    "beauty and spa": "Beauty & Spa",
    "beauty spa": "Beauty & Spa",
    "beauty salon": "Beauty & Spa",
    "beauty salons": "Beauty & Spa",
    "salon and spa": "Beauty & Spa",
    "salons and spa": "Beauty & Spa",
    "spa": "Beauty & Spa",
    "salon": "Beauty & Spa",

    "health and medical": "Health & Medical",
    "health medical": "Health & Medical",
    "healthcare": "Health & Medical",
    "health care": "Health & Medical",
    "medical": "Health & Medical",
    "health": "Health & Medical",

    "shopping and retail": "Shopping & Retail",
    "shopping retail": "Shopping & Retail",
    "retail": "Shopping & Retail",
    "shopping": "Shopping & Retail",

    "supermarket": "Supermarkets",
    "supermarkets": "Supermarkets",

    "professional service": "Professional Services",
    "professional services": "Professional Services",
    "professional service providers": "Professional Services",

    "education": "Education",
    "educational services": "Education",
    "schools": "Education",
    "school": "Education",

    "real estate": "Real Estate",
    "property": "Real Estate",
    "property services": "Real Estate",
    "properties": "Real Estate",

    "automotive": "Automotive",
    "automotive services": "Automotive",
    "auto services": "Automotive",
    "car services": "Automotive",
    "cars": "Automotive",

    "travel and tourism": "Travel & Tourism",
    "travel tourism": "Travel & Tourism",
    "tourism": "Travel & Tourism",
    "travel": "Travel & Tourism",

    "technology": "Technology",
    "technologies": "Technology",
    "tech": "Technology",
    "information technology": "Technology"
  };

  const App = {
    allBusinesses: [],
    filteredBusinesses: [],
    userLocation: null,
    locationInfo: null,
    nearbyMode: false,
    radiusKm: 25,
    currentPage: 1,
    pageSize: 12,
    totalPages: 1,
    loading: false,
    locationLoading: false,
    initialized: false
  };

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  function clean(value, fallback = "") {
    if (value === null || value === undefined) {
      return fallback;
    }

    return String(value).trim() || fallback;
  }

  function number(value, fallback = null) {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    const result = Number(value);

    return Number.isFinite(result) ? result : fallback;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ----------------------------------------------------------
     CATEGORY NORMALIZATION
  ---------------------------------------------------------- */

  function categoryKey(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[-_]+/g, " ")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function categoryLabel(value) {
    const key = categoryKey(value);

    if (!key) return "";

    if (CATEGORY_ALIASES[key]) {
      return CATEGORY_ALIASES[key];
    }

    const homeMatch = HOME_CATEGORIES.find(
      (item) => categoryKey(item) === key
    );

    if (homeMatch) return homeMatch;

    return String(value)
      .trim()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ");
  }

  function categoriesMatch(first, second) {
    if (!clean(first) || !clean(second)) return false;

    return (
      categoryKey(categoryLabel(first)) ===
      categoryKey(categoryLabel(second))
    );
  }

  /* ----------------------------------------------------------
     CONFIGURATION AND API
  ---------------------------------------------------------- */

  function config() {
    return window.NearAfricaConfig || {};
  }

  function apiBase() {
    const cfg = config();

    return clean(
      cfg.api && cfg.api.baseUrl,
      API_FALLBACK
    ).replace(/\/+$/, "");
  }

  function endpoint(name, fallback) {
    const cfg = config();

    return clean(
      cfg.api &&
      cfg.api.endpoints &&
      cfg.api.endpoints[name],
      fallback
    ).replace(/^\/+/, "");
  }

  function apiUrl(path) {
    if (/^https?:\/\//i.test(String(path || ""))) {
      return String(path);
    }

    return apiBase() + "/" + String(path || "").replace(/^\/+/, "");
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      },
      cache: options.cache || "no-store"
    });

    const body = await response.text();
    let payload = null;

    if (body) {
      try {
        payload = JSON.parse(body);
      } catch (_) {
        throw new Error(
          "The server returned an invalid response. Check the API endpoint."
        );
      }
    }

    if (!response.ok) {
      const message =
        payload &&
        (payload.message || payload.error || payload.details);

      throw new Error(
        clean(message, `Request failed (HTTP ${response.status}).`)
      );
    }

    return payload;
  }

  /* ----------------------------------------------------------
     DOM ELEMENTS
  ---------------------------------------------------------- */

  const searchInput = () =>
    $("#searchInput") ||
    $("#search") ||
    $("input[name='q']");

  const categoryFilter = () =>
    $("#categoryFilter") ||
    $("#category") ||
    $("select[name='category']");

  const stateFilter = () =>
    $("#stateFilter") ||
    $("#state") ||
    $("select[name='state']");

  const cityFilter = () =>
    $("#cityFilter") ||
    $("#city") ||
    $("select[name='city']");

  const resultsContainer = () =>
    $("#businessGrid") ||
    $("#businessesGrid") ||
    $("#resultsGrid") ||
    $("#businessResults") ||
    $("[data-business-results]");

  const countElement = () =>
    $("#resultCount") ||
    $("#resultsCount") ||
    $("#resultsStatus") ||
    $("#businessCount") ||
    $("[data-results-count]");

  const paginationElement = () =>
    $("#pagination") ||
    $("#paginationControls") ||
    $("[data-pagination]");

  function statusElement() {
    let element =
      $("#locationStatus") ||
      $("#nearbyStatus") ||
      $("#locationMessage") ||
      $("#statusMessage") ||
      $("[data-location-status]");

    if (!element) {
      element = document.createElement("p");
      element.id = "locationStatus";
      element.setAttribute("role", "status");
      element.style.cssText =
        "max-width:1200px;margin:12px auto;padding:0 20px;";

      const controls = $(".explore-controls");

      if (controls) {
        controls.insertAdjacentElement("afterend", element);
      } else {
        document.body.prepend(element);
      }
    }

    return element;
  }

  function setStatus(message, type = "info") {
    const element = statusElement();

    element.textContent = clean(message);
    element.dataset.statusType = type;
    element.hidden = !message;
    element.style.display = message ? "" : "none";
  }

  function setLoading(loading) {
    App.loading = loading;

    const container = resultsContainer();

    if (!container) return;

    if (loading && !App.allBusinesses.length) {
      container.innerHTML =
        '<div class="loading-state">' +
        escapeHtml(t("actions.loading", "Loading businesses...")) +
        "</div>";
    }
  }

  function isExplorePage() {
    return Boolean(
      resultsContainer() ||
      /explore|search/i.test(location.pathname)
    );
  }

  function isHomePage() {
    return (
      location.pathname === "/" ||
      /index\.html$/i.test(location.pathname) ||
      Boolean($("#homeSearchForm"))
    );
  }

  /* ----------------------------------------------------------
     BUSINESS NORMALIZATION
  ---------------------------------------------------------- */

  function normalizeBusiness(raw) {
    const b = raw || {};

    const id = clean(
      b.id || b.business_id || b.businessId || b.slug
    );

    const images = Array.isArray(b.images) ? b.images : [];

    const firstImage = images.length
      ? (
          typeof images[0] === "string"
            ? images[0]
            : images[0].image_url || images[0].url
        )
      : "";

    const verified =
      b.verified === true ||
      b.is_verified === true ||
      Number(b.verified || b.is_verified || 0) === 1;

    const claimed =
      b.claimed === true ||
      b.is_claimed === true ||
      Number(b.claimed || b.is_claimed || 0) === 1;

    const rawCategory =
      typeof b.category === "object"
        ? b.category?.name
        : b.category;

    return {
      ...b,
      id,
      slug: clean(b.slug),
      name: clean(
        b.business_name || b.name || b.title,
        "Unnamed Business"
      ),
      category: categoryLabel(rawCategory),
      address: clean(
        b.address || b.address_line || b.location
      ),
      city: clean(b.city || b.town),
      state: clean(b.state || b.region),
      country: clean(b.country, "Nigeria"),
      description: clean(b.description),
      phone: clean(
        b.phone || b.phone_number || b.contact_phone
      ),
      website: clean(
        b.website || b.website_url || b.site
      ),
      image: clean(
        b.image_url || b.image || b.logo_url || b.logo || firstImage
      ),
      latitude: number(
        b.latitude ?? b.lat ?? b.location_latitude
      ),
      longitude: number(
        b.longitude ?? b.lng ?? b.lon ?? b.location_longitude
      ),
      rating: number(
        b.average_rating ?? b.rating ?? b.avg_rating,
        0
      ),
      reviewCount: number(
        b.review_count ?? b.reviews_count ?? b.total_reviews,
        0
      ),
      verified,
      claimed,
      featured: number(b.featured, 0)
    };
  }

  function extractBusinesses(payload) {
    if (Array.isArray(payload)) return payload;

    if (!payload || typeof payload !== "object") return [];

    for (const key of ["businesses", "results", "items"]) {
      if (Array.isArray(payload[key])) return payload[key];
    }

    if (Array.isArray(payload.data)) return payload.data;

    if (
      payload.data &&
      Array.isArray(payload.data.businesses)
    ) {
      return payload.data.businesses;
    }

    if (payload.business) return [payload.business];

    return [];
  }

  /*
   * Corrected duplicate detection:
   * - Prefer a real business ID or slug.
   * - When no ID is available, use the business name and location.
   * - Do not group all businesses in the same state as one record.
   */
  function deduplicate(list) {
    const seen = new Set();

    return list.filter((business) => {
      const id = clean(
        business.id || business.business_id || business.slug
      ).toLowerCase();

      const fallbackKey = [
        business.name,
        business.address,
        business.city,
        business.state,
        business.country
      ]
        .map((value) => clean(value).toLowerCase())
        .join("|");

      const key = id
        ? "id:" + id
        : "location:" + fallbackKey;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  }

  /* ----------------------------------------------------------
     LOAD BUSINESSES AND FILTER OPTIONS
  ---------------------------------------------------------- */

   async function loadBusinesses() {
    setLoading(true);

    try {
      const url = new URL(
        apiUrl(endpoint("businesses", "businesses"))
      );

      url.searchParams.set("limit", "48");
      url.searchParams.set("page", String(App.currentPage || 1));

      const category = clean(categoryFilter()?.value);
      const query = clean(searchInput()?.value);

      if (category) {
        url.searchParams.set("category", category);
      }

      /*
       * Nearby: ask the API for businesses near the user.
       * Do not force country when doing radius search — coords define the area.
       */
      if (
        App.nearbyMode &&
        App.userLocation &&
        Number.isFinite(App.userLocation.latitude) &&
        Number.isFinite(App.userLocation.longitude)
      ) {
        url.searchParams.set(
          "latitude",
          String(App.userLocation.latitude)
        );
        url.searchParams.set(
          "longitude",
          String(App.userLocation.longitude)
        );
        url.searchParams.set(
          "radius",
          String(radiusValue())
        );
      } else {
        url.searchParams.set("country", "Nigeria");

        const state = clean(stateFilter()?.value);
        const city = clean(cityFilter()?.value);

        if (state) url.searchParams.set("state", state);
        if (city) url.searchParams.set("city", city);
      }

      // Text search still uses client filter below if API has no q on this path.
      // Optional: if you later wire /search, use it when query is set.

      const payload = await fetchJson(url.toString());

      App.allBusinesses = deduplicate(
        extractBusinesses(payload).map(normalizeBusiness)
      );

      // Prefer API distance when present.
      App.allBusinesses = App.allBusinesses.map((business) => {
        const apiDistance = number(
          business.distance_km ?? business.distanceKm,
          null
        );

        if (apiDistance !== null) {
          return { ...business, distanceKm: apiDistance };
        }

        return business;
      });

      if (!App.allBusinesses.length) {
        setStatus(
          App.nearbyMode
            ? t(
                "explore.noBusinessesNearby",
                "No businesses with usable GPS coordinates were found within this radius."
              )
            : "The API responded, but no businesses were returned.",
          "info"
        );
      } else {
        setStatus("");
      }

      if (!App.nearbyMode) {
        populateStateOptions();
        populateCategoryOptions();
        populateCityOptions();
      }

      return App.allBusinesses;
    } catch (error) {
      console.error("NearAfrica: business loading failed.", error);

      App.allBusinesses = [];

      setStatus(
        t("errors.unableToLoad", "Unable to load businesses") +
        ": " +
        error.message,
        "error"
      );

      return [];
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    const filter = categoryFilter();

    if (!filter) return;

    try {
      const payload = await fetchJson(
        apiUrl(endpoint("categories", "categories"))
      );

      let items = [];

      if (Array.isArray(payload)) {
        items = payload;
      } else if (Array.isArray(payload?.categories)) {
        items = payload.categories;
      } else if (Array.isArray(payload?.data)) {
        items = payload.data;
      }

      const previous = filter.value;

      items.forEach((item) => {
        const rawValue = clean(
          typeof item === "string" ? item : item.name
        );

        if (!rawValue) return;

        const value = categoryLabel(rawValue);

        const exists = Array.from(filter.options).some(
          (option) => categoriesMatch(option.value, value)
        );

        if (!exists) {
          filter.add(new Option(value, value));
        }
      });

      if (previous) selectCategoryOption(previous);
    } catch (error) {
      console.warn(
        "NearAfrica: category endpoint unavailable.",
        error
      );
    }
  }

  function addOptions(select, values, placeholder) {
    if (!select) return;

    const previous = select.value;

    select.replaceChildren(new Option(placeholder, ""));

    values.forEach((value) => {
      select.add(new Option(value, value));
    });

    if (values.includes(previous)) {
      select.value = previous;
    }
  }

  function uniqueSorted(values) {
    return [...new Set(values.map(clean).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }

  function populateStateOptions() {
    addOptions(
      stateFilter(),
      uniqueSorted(App.allBusinesses.map((b) => b.state)),
      "All states"
    );
  }

  function selectCategoryOption(requestedValue) {
    const filter = categoryFilter();

    if (!filter) return false;

    const requested = clean(requestedValue);

    if (!requested) {
      filter.value = "";
      return true;
    }

    const matchingOption = Array.from(filter.options).find(
      (option) =>
        option.value &&
        categoriesMatch(option.value, requested)
    );

    if (matchingOption) {
      filter.value = matchingOption.value;
      return true;
    }

    return false;
  }

  function populateCategoryOptions() {
    const filter = categoryFilter();

    if (!filter) return;

    const previous = clean(filter.value);
    const options = new Map();

    HOME_CATEGORIES.forEach((category) => {
      options.set(categoryKey(category), category);
    });

    App.allBusinesses.forEach((business) => {
      const category = clean(business.category);

      if (!category) return;

      const label = categoryLabel(category);
      const key = categoryKey(label);

      if (!options.has(key)) {
        options.set(key, label);
      }
    });

    Array.from(filter.options).forEach((option) => {
      if (!option.value) return;

      const label = categoryLabel(option.value);
      const key = categoryKey(label);

      if (!options.has(key)) {
        options.set(key, label);
      }
    });

    filter.replaceChildren(new Option("All categories", ""));

    [...options.values()]
      .sort((a, b) => {
        const aHome = HOME_CATEGORIES.includes(a);
        const bHome = HOME_CATEGORIES.includes(b);

        if (aHome && !bHome) return -1;
        if (!aHome && bHome) return 1;

        return a.localeCompare(b);
      })
      .forEach((category) => {
        filter.add(new Option(category, category));
      });

    if (previous) {
      selectCategoryOption(previous);
    }
  }

  function populateCityOptions() {
    const state = clean(stateFilter()?.value).toLowerCase();

    const cities = uniqueSorted(
      App.allBusinesses
        .filter(
          (business) =>
            !state || business.state.toLowerCase() === state
        )
        .map((business) => business.city)
    );

    addOptions(cityFilter(), cities, "All cities");
  }

  /* ----------------------------------------------------------
     DISTANCE AND LOCATION
  ---------------------------------------------------------- */

  function distanceKm(lat1, lon1, lat2, lon2) {
    const values = [lat1, lon1, lat2, lon2].map(Number);

    if (
      values.some((value) => !Number.isFinite(value))
    ) {
      return null;
    }

    const radians = (value) => value * Math.PI / 180;
    const dLat = radians(lat2 - lat1);
    const dLon = radians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(radians(lat1)) *
      Math.cos(radians(lat2)) *
      Math.sin(dLon / 2) ** 2;

    return 6371 * 2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(Math.max(0, 1 - a))
    );
  }

  function getBrowserLocation() {
    return new Promise((resolve, reject) => {
      if (!window.isSecureContext) {
        reject(
          new Error(
            t("search.locationError", "Location access requires HTTPS.")
          )
        );
        return;
      }

      if (!navigator.geolocation) {
        reject(
          new Error(
            t(
              "search.locationNotSupported",
              "This browser does not support location services."
            )
          )
        );
        return;
      }

      let watchId = null;
      let timerId = null;
      let finished = false;
      let bestAccuracy = null;
      let bestPosition = null;

      function finish(error, position) {
        if (finished) return;

        finished = true;

        if (timerId !== null) {
          clearTimeout(timerId);
        }

        if (watchId !== null) {
          try {
            navigator.geolocation.clearWatch(watchId);
          } catch (_) {}
        }

        if (error) {
          reject(error);
        } else {
          resolve(position);
        }
      }

      timerId = setTimeout(() => {
        if (
          bestPosition &&
          bestPosition.accuracy <= MAX_LOCATION_ACCURACY_METERS
        ) {
          finish(null, bestPosition);
          return;
        }

        const message = bestAccuracy !== null
          ? `Your browser could not obtain a usable location. Its best reported accuracy was ${Math.round(bestAccuracy)} metres. Try again outdoors or check your device's location settings.`
          : t(
              "search.locationUnavailable",
              "Your device could not determine your location. Check location services and try again."
            );

        finish(new Error(message));
           }, 15000);

      try {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const latitude = number(position.coords.latitude);
            const longitude = number(position.coords.longitude);
            const accuracy = number(position.coords.accuracy);

            if (
              latitude === null ||
              longitude === null ||
              latitude < -90 ||
              latitude > 90 ||
              longitude < -180 ||
              longitude > 180 ||
              accuracy === null ||
              accuracy < 0
            ) {
              return;
            }

            if (
              bestAccuracy === null ||
              accuracy < bestAccuracy
            ) {
              bestAccuracy = accuracy;
              bestPosition = {
                latitude,
                longitude,
                accuracy
              };
            }

            if (accuracy <= MAX_LOCATION_ACCURACY_METERS) {
              finish(null, bestPosition);
            }
          },
                  (error) => {
            if (error.code === 1) {
              finish(
                new Error(
                  t(
                    "search.locationAccessDenied",
                    "Location permission was denied. Allow location access and try again."
                  )
                )
              );
              return;
            }

            if (error.code === 2) {
              finish(
                new Error(
                  t(
                    "search.locationUnavailable",
                    "Your device could not determine your location. Check location services and try again."
                  )
                )
              );
              return;
            }

            // code 3 (timeout) or unknown: keep watching until outer timer;
            // outer timer may still resolve with bestPosition if any.
          },
            enableHighAccuracy: true,
            timeout: 60000,
            maximumAge: 0
          }
        );
      } catch (error) {
        finish(
          new Error(
            error.message ||
            t("search.locationError", "Unable to start location detection.")
          )
        );
      }
    });
  }

  async function reverseGeocode(location) {
    try {
      const url = new URL(
        apiUrl(endpoint("location", "location/reverse"))
      );

      url.searchParams.set("latitude", location.latitude);
      url.searchParams.set("longitude", location.longitude);

      const payload = await fetchJson(url.toString());

      if (payload?.location) {
        return payload.location;
      }
    } catch (error) {
      console.warn(
        "NearAfrica: reverse geocoding failed.",
        error
      );
    }

    return null;
  }

  function saveLocation() {
    if (!App.userLocation) return;

    const latitude = number(App.userLocation.latitude);
    const longitude = number(App.userLocation.longitude);
    const accuracy = number(App.userLocation.accuracy);

    const valid =
      latitude !== null &&
      longitude !== null &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      accuracy !== null &&
      accuracy <= MAX_LOCATION_ACCURACY_METERS;

    if (!valid) {
      try {
        sessionStorage.removeItem(LOCATION_KEY);
        sessionStorage.removeItem(NEARBY_KEY);
      } catch (_) {}

      throw new Error(
        t(
          "search.locationError",
          "Your location is too approximate for Nearby search. Please try again."
        )
      );
    }

    try {
      sessionStorage.setItem(
        LOCATION_KEY,
        JSON.stringify({
          latitude,
          longitude,
          accuracy,
          locationInfo: App.locationInfo,
          savedAt: Date.now()
        })
      );

      sessionStorage.setItem(NEARBY_KEY, "1");
    } catch (error) {
      console.warn(
        "NearAfrica: could not save location.",
        error
      );

      throw new Error(
        t(
          "errors.somethingWentWrong",
          "Your browser could not save your location. Please check browser storage settings and try again."
        )
      );
    }
  }

  function restoreLocation() {
    let saved = null;

    try {
      saved = JSON.parse(
        sessionStorage.getItem(LOCATION_KEY) || "null"
      );
    } catch (_) {
      saved = null;
    }

    const latitude = number(saved?.latitude);
    const longitude = number(saved?.longitude);
    const accuracy = number(saved?.accuracy);

    const valid =
      saved &&
      latitude !== null &&
      longitude !== null &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      accuracy !== null &&
      accuracy <= MAX_LOCATION_ACCURACY_METERS;

    if (!valid) {
      try {
        sessionStorage.removeItem(LOCATION_KEY);
        sessionStorage.removeItem(NEARBY_KEY);
      } catch (_) {}

      App.userLocation = null;
      App.locationInfo = null;

      return false;
    }

    App.userLocation = {
      latitude,
      longitude,
      accuracy
    };

    App.locationInfo = saved.locationInfo || null;

    return true;
  }

  function radiusValue() {
    const control = $("#radiusFilter");

    if (control && Number(control.value) > 0) {
      App.radiusKm = Number(control.value);
    }

    return App.radiusKm;
  }

  async function enableNearby() {
    if (App.locationLoading) return;

    App.locationLoading = true;

    const button = $("#nearbyButton");

    if (button) {
      button.disabled = true;
      button.textContent = t(
        "search.usingYourLocation",
        "Finding location…"
      );
    }

    setStatus(
      t("search.usingYourLocation", "Finding your current location…")
    );

          App.userLocation = await getBrowserLocation();
      App.locationInfo = await reverseGeocode(App.userLocation);
      App.nearbyMode = true;

      saveLocation();
      clearGeographicFilters();
      updateNearbyControls();
      App.currentPage = 1;
      await loadBusinesses();
      applyFilters();

      const info = App.locationInfo || {};

      const label = [
        info.area,
        info.city,
        info.state,
        info.country
      ].filter(Boolean).join(", ");

      setStatus(
        label
          ? `${t("explore.businessesNearYou", "Nearby is active")}. ${label}`
          : t(
              "explore.businessesNearYou",
              "Nearby is active. Businesses are sorted by GPS distance."
            ),
        "success"
      );
    } catch (error) {
      console.error(
        "NearAfrica: unable to activate Nearby.",
        error
      );

      setStatus(error.message, "error");
    } finally {
      App.locationLoading = false;

      if (button) button.disabled = false;

      updateNearbyControls();
    }
  }

  function clearGeographicFilters() {
    const state = stateFilter();
    const city = cityFilter();

    if (state) state.value = "";
    if (city) city.value = "";

    App.currentState = "";
    App.currentCity = "";
  }

  function clearNearby() {
    App.nearbyMode = false;
    App.userLocation = null;
    App.locationInfo = null;

    try {
      sessionStorage.removeItem(LOCATION_KEY);
      sessionStorage.removeItem(NEARBY_KEY);
    } catch (_) {}

    updateNearbyControls();
    applyFilters();

    setStatus(
      t("explore.clearLocation", "Nearby mode turned off.")
    );
  }

  /* ----------------------------------------------------------
     DYNAMIC NEARBY CONTROLS
  ---------------------------------------------------------- */

  function installNearbyControls() {
    if ($("#nearafricaNearbyControls")) return;

    const panel = $(".filter-panel");

    if (!panel) return;

    const wrapper = document.createElement("div");

    wrapper.id = "nearafricaNearbyControls";
    wrapper.className = "filter-group";

    wrapper.style.cssText =
      "grid-column:1/-1;display:flex;flex-direction:row;gap:10px;align-items:center;flex-wrap:wrap;";

    wrapper.innerHTML = `
      <button
        type="button"
        id="nearbyButton"
        class="filter-button"
      >${escapeHtml(t("search.useMyLocation", "Use My Location"))}</button>

      <label for="radiusFilter">${escapeHtml(t("explore.away", "Within"))}</label>

      <select
        id="radiusFilter"
        aria-label="${escapeHtml(t("explore.businessesNearYou", "Nearby search radius"))}"
        style="min-height:44px;padding:8px;border-radius:10px;"
      >
        <option value="5">5 km</option>
        <option value="10">10 km</option>
        <option value="25" selected>25 km</option>
        <option value="50">50 km</option>
        <option value="100">100 km</option>
      </select>

      <button
        type="button"
        id="clearNearby"
        class="filter-button"
      >${escapeHtml(t("explore.clearLocation", "Turn Nearby Off"))}</button>
    `;

    panel.appendChild(wrapper);

    $("#nearbyButton").addEventListener("click", enableNearby);
    $("#clearNearby").addEventListener("click", clearNearby);

       $("#radiusFilter").addEventListener("change", async () => {
      radiusValue();

      if (App.nearbyMode) {
        App.currentPage = 1;
        await loadBusinesses();
        applyFilters();
      }
    });
    updateNearbyControls();
  }

  function updateNearbyControls() {
    const button = $("#nearbyButton");
    const clear = $("#clearNearby");
    const radius = $("#radiusFilter");

    if (button) {
      button.textContent = App.nearbyMode
        ? t("search.useMyLocation", "Refresh My Location")
        : t("search.useMyLocation", "Use My Location");
    }

    if (clear) {
      clear.hidden = !App.nearbyMode;
      clear.style.display = App.nearbyMode ? "" : "none";
    }

    if (radius) {
      radius.value = String(App.radiusKm);
    }
  }

  /* ----------------------------------------------------------
     FILTERS AND URL STATE
  ---------------------------------------------------------- */

  function applyUrlParameters() {
    const params = new URLSearchParams(location.search);

    if (searchInput()) {
      searchInput().value = params.get("q") || "";
    }

    if (categoryFilter()) {
      selectCategoryOption(params.get("category") || "");
    }

    if (stateFilter()) {
      stateFilter().value = params.get("state") || "";
    }

    populateCityOptions();

    if (cityFilter()) {
      cityFilter().value = params.get("city") || "";
    }

    const radius = number(params.get("radius"));

    if (radius && radius > 0) {
      App.radiusKm = radius;
    }

    App.nearbyMode =
      params.get("nearby") === "1" ||
      params.get("nearby") === "true";
  }

  function syncUrl() {
    if (!isExplorePage()) return;

    try {
      const url = new URL(location.href);

      const query = clean(searchInput()?.value);
      const category = clean(categoryFilter()?.value);

      const state = App.nearbyMode
        ? ""
        : clean(stateFilter()?.value);

      const city = App.nearbyMode
        ? ""
        : clean(cityFilter()?.value);

      const values = {
        q: query,
        category,
        state,
        city
      };

      Object.entries(values).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, value);
        } else {
          url.searchParams.delete(key);
        }
      });

      if (App.nearbyMode) {
        url.searchParams.set("nearby", "1");
        url.searchParams.set("radius", String(App.radiusKm));
      } else {
        url.searchParams.delete("nearby");
        url.searchParams.delete("radius");
      }

      history.replaceState({}, "", url.toString());
    } catch (error) {
      console.warn(
        "NearAfrica: URL update failed.",
        error
      );
    }
  }

  function applyFilters() {
    const query = clean(searchInput()?.value).toLowerCase();
    const category = clean(categoryFilter()?.value);

    const state = App.nearbyMode
      ? ""
      : clean(stateFilter()?.value).toLowerCase();

    const city = App.nearbyMode
      ? ""
      : clean(cityFilter()?.value).toLowerCase();

    const radius = radiusValue();

    if (App.nearbyMode) {
      clearGeographicFilters();
    }

    App.filteredBusinesses = App.allBusinesses
      .map((business) => {
        const distance = App.userLocation
          ? distanceKm(
              App.userLocation.latitude,
              App.userLocation.longitude,
              business.latitude,
              business.longitude
            )
          : null;

        return {
          ...business,
          distanceKm: distance
        };
      })
      .filter((business) => {
        const searchable = [
          business.name,
          business.category,
          business.address,
          business.city,
          business.state,
          business.country,
          business.description,
          business.phone,
          business.website
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (query && !searchable.includes(query)) {
          return false;
        }

        if (
          category &&
          !categoriesMatch(business.category, category)
        ) {
          return false;
        }

        if (
          !App.nearbyMode &&
          state &&
          business.state.toLowerCase() !== state
        ) {
          return false;
        }

        if (
          !App.nearbyMode &&
          city &&
          business.city.toLowerCase() !== city
        ) {
          return false;
        }

                if (App.nearbyMode) {
          // API already applied radius when loadBusinesses used lat/lng.
          // Client distance is a safety net when API distance is missing.
          if (
            business.distanceKm == null &&
            App.userLocation &&
            business.latitude != null &&
            business.longitude != null
          ) {
            const d = distanceKm(
              App.userLocation.latitude,
              App.userLocation.longitude,
              business.latitude,
              business.longitude
            );
            business.distanceKm = d;
          }

          if (business.distanceKm == null) return false;
          if (business.distanceKm > radius) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (App.nearbyMode) {
          return a.distanceKm - b.distanceKm;
        }

        if (a.featured !== b.featured) {
          return b.featured - a.featured;
        }

        return a.name.localeCompare(b.name);
      });

    App.currentPage = 1;

    App.totalPages = Math.max(
      1,
      Math.ceil(
        App.filteredBusinesses.length / App.pageSize
      )
    );

    syncUrl();
    renderResults();
  }

  function clearFilters() {
    if (searchInput()) searchInput().value = "";
    if (categoryFilter()) categoryFilter().value = "";
    if (stateFilter()) stateFilter().value = "";

    populateCityOptions();

    if (cityFilter()) cityFilter().value = "";

    App.currentPage = 1;

    applyFilters();

    setStatus(
      App.nearbyMode
        ? t(
            "explore.filters",
            "Search and category filters cleared. Nearby remains active."
          )
        : t("explore.filters", "All filters cleared.")
    );
  }

  /* ----------------------------------------------------------
     SAVED BUSINESSES
  ---------------------------------------------------------- */

  function getSavedIds() {
    try {
      const value = JSON.parse(
        localStorage.getItem(SAVED_KEY) || "[]"
      );

      return new Set(
        Array.isArray(value)
          ? value.map(String)
          : []
      );
    } catch (_) {
      return new Set();
    }
  }

  function toggleSaved(id) {
    if (!id) return;

    const saved = getSavedIds();
    const key = String(id);

    if (saved.has(key)) {
      saved.delete(key);
    } else {
      saved.add(key);
    }

    try {
      localStorage.setItem(
        SAVED_KEY,
        JSON.stringify([...saved])
      );
    } catch (_) {
      setStatus(
        t(
          "errors.somethingWentWrong",
          "Your browser could not save this business."
        ),
        "error"
      );

      return;
    }

    renderResults();

    setStatus(
      saved.has(key)
        ? t("actions.save", "Business saved.")
        : t("actions.delete", "Business removed from saved items."),
      "success"
    );
  }

  /* ----------------------------------------------------------
     BUSINESS LINKS AND CARDS
  ---------------------------------------------------------- */

  function businessUrl(business) {
    const cfg = config();

    const profilePage = clean(
      cfg.profilePage ||
      (cfg.pages && cfg.pages.businessProfile),
      "business-profile-fixed.html"
    );

    const url = new URL(profilePage, location.href);

    if (business.id) {
      url.searchParams.set("id", business.id);
    } else if (business.slug) {
      url.searchParams.set("slug", business.slug);
    }

    return url.toString();
  }

  function formatDistance(distance) {
    if (!Number.isFinite(distance)) return "";

    return distance < 1
      ? `${Math.round(distance * 1000)} m away`
      : `${distance.toFixed(distance < 10 ? 1 : 0)} km away`;
  }

  function renderCard(business) {
    const saved = getSavedIds().has(String(business.id));
    const url = businessUrl(business);

    const locationText = [
      business.address,
      business.city,
      business.state
    ]
      .filter(Boolean)
      .filter(
        (value, index, array) =>
          array.indexOf(value) === index
      )
      .join(", ");

    const image = business.image
      ? `<img
           src="${escapeHtml(business.image)}"
           alt="${escapeHtml(business.name)}"
           loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.hidden=false;"
         >
         <div class="card-image-placeholder" hidden>NA</div>`
      : `<div class="card-image-placeholder">NA</div>`;

    const rating = Math.max(
      0,
      Math.min(5, Math.round(business.rating || 0))
    );

    const stars =
      "★".repeat(rating) +
      "☆".repeat(5 - rating);

    return `
      <article
        class="business-card"
        data-business-id="${escapeHtml(business.id)}"
      >
        <a
          class="business-card-image"
          href="${escapeHtml(url)}"
          aria-label="View ${escapeHtml(business.name)}"
        >${image}</a>

        <div class="business-card-content">
          <span class="business-card-category">
            ${escapeHtml(business.category || "Business")}
          </span>

          ${business.verified
            ? '<span class="business-verified">✓ Verified</span>'
            : ""}

          <h3 class="business-card-title">
            <a href="${escapeHtml(url)}">
              ${escapeHtml(business.name)}
            </a>
          </h3>

          <p class="business-card-location">
            ${escapeHtml(locationText || "Location unavailable")}
          </p>

          ${business.description
            ? `<p class="business-card-description">
                 ${escapeHtml(business.description)}
               </p>`
            : ""}

          <div class="business-card-rating" aria-label="Rating">
            <span>${stars}</span>
            <span>${business.rating > 0
              ? Number(business.rating).toFixed(1)
              : "No rating"}</span>
            <span>(${Number(business.reviewCount || 0).toLocaleString()})</span>
          </div>

          ${App.nearbyMode
            ? `<p class="business-card-distance">
                 ${escapeHtml(formatDistance(business.distanceKm))}
               </p>`
            : ""}

          <div class="business-card-actions">
            <a
              class="btn btn-primary"
              href="${escapeHtml(url)}"
              data-view-business="${escapeHtml(business.id)}"
            >View Business</a>

            <button
              type="button"
              class="btn btn-save ${saved ? "saved" : ""}"
              data-save-business="${escapeHtml(business.id)}"
              aria-pressed="${saved}"
            >${saved ? "★ Saved" : "☆ Save"}</button>
          </div>
        </div>
      </article>
    `;
  }

  /* ----------------------------------------------------------
     PAGINATION
  ---------------------------------------------------------- */

  function renderPagination() {
    const container = paginationElement();

    if (!container) {
      return;
    }

    const total = App.filteredBusinesses.length;

    App.totalPages = Math.max(
      1,
      Math.ceil(total / App.pageSize)
    );

    App.currentPage = Math.max(
      1,
      Math.min(App.currentPage, App.totalPages)
    );

    if (total <= App.pageSize) {
      container.replaceChildren();
      container.hidden = true;
      return;
    }

    container.hidden = false;

    const pages = [];

    for (let page = 1; page <= App.totalPages; page++) {
      pages.push(`
        <button
          type="button"
          data-page="${page}"
          class="${page === App.currentPage ? "active" : ""}"
          aria-current="${page === App.currentPage ? "page" : "false"}"
          aria-label="${page === App.currentPage
            ? "Page " + page + ", current page"
            : "Go to page " + page}"
          ${page === App.currentPage ? 'disabled aria-disabled="true"' : ""}
        >${page}</button>
      `);
    }

    container.innerHTML = `
      <button
        type="button"
        data-page="${App.currentPage - 1}"
        aria-label="Previous page"
        ${App.currentPage <= 1 ? "disabled" : ""}
      >Previous</button>

      ${pages.join("")}

      <button
        type="button"
        data-page="${App.currentPage + 1}"
        aria-label="Next page"
        ${App.currentPage >= App.totalPages ? "disabled" : ""}
      >Next</button>
    `;

    container.style.pointerEvents = "auto";
  }

  /*
   * Render only the current page of results.
   *
   * If the pagination element happens to be inside the results
   * container, preserve it while replacing the business cards.
   */
  function renderResults() {
    const container = resultsContainer();

    if (!container) return;

    const pagination = paginationElement();

    const paginationInsideResults =
      pagination &&
      pagination !== container &&
      container.contains(pagination);

    if (paginationInsideResults) {
      pagination.remove();
    }

    const total = App.filteredBusinesses.length;

    App.totalPages = Math.max(
      1,
      Math.ceil(total / App.pageSize)
    );

    App.currentPage = Math.max(
      1,
      Math.min(App.currentPage, App.totalPages)
    );

    const start = (App.currentPage - 1) * App.pageSize;

    const items = App.filteredBusinesses.slice(
      start,
      start + App.pageSize
    );

    if (items.length) {
      container.innerHTML = items.map(renderCard).join("");
    } else {
      const message = App.loading
        ? t("actions.loading", "Loading businesses...")
        : App.nearbyMode
          ? t(
              "explore.noBusinessesNearby",
              "No businesses with usable GPS coordinates were found within this radius. Try increasing the radius or reporting a missing business."
            )
          : t(
              "explore.noBusinesses",
              "No businesses match your search. Try changing your search or filters."
            );

      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <h2>${escapeHtml(
            App.loading
              ? t("actions.loading", "Loading businesses")
              : t("explore.noBusinesses", "No businesses found")
          )}</h2>
          <p>${escapeHtml(message)}</p>
        </div>
      `;
    }

    if (paginationInsideResults) {
      container.appendChild(pagination);
    }

    const count = countElement();

    if (count) {
      count.textContent =
        App.loading && !App.allBusinesses.length
          ? t("actions.loading", "Loading businesses...")
          : total === 1
            ? "1 " + t("explore.businesses", "business found")
            : `${total.toLocaleString()} ${t(
                "explore.businessesFound",
                "businesses found"
              )}`;
    }

    renderPagination();
  }

  async function recordBusinessView(id) {
    if (!id) return;

    try {
      await fetch(
        apiUrl(`businesses/${encodeURIComponent(id)}/view`),
        {
          method: "POST",
          headers: { Accept: "application/json" },
          keepalive: true
        }
      );
    } catch (_) {
      // Business profile navigation should still work if analytics fail.
    }
  }

  /* ----------------------------------------------------------
     PAGINATION CLICK HANDLER
  ---------------------------------------------------------- */

  /*
   * Use document-level event delegation rather than attaching the
   * handler to one pagination element during initialisation.
   *
   * This keeps page buttons functional if another script replaces
   * the pagination container or creates it after this file loads.
   */
function bindPaginationEvents() {
  const root = document.documentElement;

  if (
    root.dataset.nearafricaPaginationDelegated === "1"
  ) {
    return;
  }

  root.dataset.nearafricaPaginationDelegated = "1";

  // Capture the click before it reaches i18n.js or other
  // bubbling handlers that may rebuild the pagination.
  document.addEventListener("click", (event) => {
    const target = event.target;

    if (
      !target ||
      typeof target.closest !== "function"
    ) {
      return;
    }

    const button = target.closest("button[data-page]");

    if (!button) return;

    const pagination = button.closest(
      "#pagination, #paginationControls, [data-pagination]"
    );

    if (!pagination) return;

    // Handle pagination here before other scripts process the click.
    event.preventDefault();
    event.stopPropagation();

    if (button.disabled) return;

    const rawPage = button.getAttribute("data-page");

    if (!/^\d+$/.test(String(rawPage || ""))) {
      return;
    }

    const page = Number(rawPage);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > App.totalPages ||
      page === App.currentPage
    ) {
      return;
    }

    App.currentPage = page;

    renderResults();

    const results = resultsContainer();

    if (results) {
      results.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, true);
}
  /* ----------------------------------------------------------
     EVENTS
  ---------------------------------------------------------- */

  function setupEvents() {
    const search = searchInput();
    const category = categoryFilter();
    const state = stateFilter();
    const city = cityFilter();

    if (search) {
      search.addEventListener("input", applyFilters);
      search.addEventListener("search", applyFilters);
    }

    if (category) {
      category.addEventListener("change", applyFilters);
    }

    if (state) {
      state.addEventListener("change", () => {
        populateCityOptions();
        applyFilters();
      });
    }

    if (city) {
      city.addEventListener("change", applyFilters);
    }

    const clear = $("#clearFilters");

    if (clear) {
      clear.addEventListener("click", clearFilters);
    }

    const results = resultsContainer();

    if (results) {
      results.addEventListener("click", (event) => {
        const target = event.target;

        if (!target || typeof target.closest !== "function") {
          return;
        }

        const save = target.closest("[data-save-business]");

        if (save) {
          event.preventDefault();
          toggleSaved(save.dataset.saveBusiness);
          return;
        }

        const view = target.closest("[data-view-business]");

        if (view) {
          recordBusinessView(view.dataset.viewBusiness);
        }
      });
    }

    // Works even if the pagination element is created later.
    bindPaginationEvents();

    const searchForms = [
      $("#homeSearchForm"),
      $("#searchForm"),
      $("form[data-search-form]")
    ].filter(Boolean);

    searchForms.forEach((form) => {
      if (form.dataset.nearafricaBound === "1") return;

      form.dataset.nearafricaBound = "1";

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        const input =
          $("input[name='q']", form) ||
          $("#searchInput", form) ||
          $("input[type='search']", form);

        const query = clean(input?.value);
        const target = new URL("explore.html", location.href);

        if (query) {
          target.searchParams.set("q", query);
        }

        location.href = target.toString();
      });
    });

    if (
      document.documentElement.dataset.nearafricaSearchShortcutBound !== "1"
    ) {
      document.documentElement.dataset.nearafricaSearchShortcutBound = "1";

      document.addEventListener("keydown", (event) => {
        if (
          event.key !== "/" ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey
        ) {
          return;
        }

        const tag = event.target?.tagName?.toLowerCase();

        if (["input", "textarea", "select"].includes(tag)) return;

        const input = searchInput();

        if (input) {
          event.preventDefault();
          input.focus();
        }
      });
    }
  }

  /* ----------------------------------------------------------
     INITIALIZATION
  ---------------------------------------------------------- */

  async function initializeExplore() {
    installNearbyControls();
    setupEvents();

    applyUrlParameters();
    restoreLocation();
    updateNearbyControls();

    await loadCategories();
    await loadBusinesses();

    populateStateOptions();
    populateCategoryOptions();
    populateCityOptions();

    // Restore URL filters after category options exist.
    applyUrlParameters();

    if (App.nearbyMode && !App.userLocation) {
      setStatus(
        t(
          "search.useMyLocation",
          "Nearby needs a fresh location. Select Use My Location to obtain one."
        ),
        "info"
      );

      App.nearbyMode = false;
    }

    updateNearbyControls();
    applyFilters();

    App.initialized = true;
  }

  function initializeHome() {
    setupEvents();

    const buttons = [
      $("#useMyLocation"),
      $("#useLocation"),
      $("[data-use-location]")
    ].filter(Boolean);

    buttons.forEach((button) => {
      if (button.dataset.nearafricaLocationBound === "1") {
        return;
      }

      button.dataset.nearafricaLocationBound = "1";

      button.addEventListener("click", async () => {
        if (App.locationLoading) return;

        App.locationLoading = true;
        button.disabled = true;

        const originalText = button.textContent;

        button.textContent = t(
          "search.usingYourLocation",
          "Finding location…"
        );

        setStatus(
          t("search.usingYourLocation", "Finding your current location…")
        );

        try {
          App.userLocation = await getBrowserLocation();

          App.locationInfo = await reverseGeocode(
            App.userLocation
          );

          App.nearbyMode = true;

          saveLocation();

          const target = new URL(
            "explore.html",
            location.href
          );

          target.searchParams.set("nearby", "1");
          target.searchParams.set(
            "radius",
            String(App.radiusKm)
          );

          location.href = target.toString();
        } catch (error) {
          console.error(
            "NearAfrica: home location request failed.",
            error
          );

          setStatus(error.message, "error");
          button.textContent = originalText;
        } finally {
          App.locationLoading = false;
          button.disabled = false;
        }
      });
    });
  }

  function initialize() {
    if (App.initialized) return;

    if (isExplorePage()) {
      initializeExplore().catch((error) => {
        console.error(
          "NearAfrica initialization failed:",
          error
        );

        setStatus(
          t(
            "errors.somethingWentWrong",
            "NearAfrica could not initialize"
          ) + ": " + error.message,
          "error"
        );
      });
    } else if (isHomePage()) {
      initializeHome();
      App.initialized = true;
    }

    window.NearAfricaApp = {
      state: App,
      refresh: loadBusinesses,
      search: applyFilters,
      filter: applyFilters,
      useLocation: enableNearby,
      clearLocation: clearNearby,
      clearFilters,
      getBusinessUrl: businessUrl
    };
  }

  /* ----------------------------------------------------------
     LANGUAGE CHANGE
  ---------------------------------------------------------- */

  window.addEventListener("nearafrica:languagechange", function () {
    try {
      updateNearbyControls();

      if (App.allBusinesses.length || App.filteredBusinesses.length) {
        applyFilters();
      } else {
        renderResults();
      }
    } catch (error) {
      console.warn(
        "NearAfrica: language change refresh failed.",
        error
      );
    }
  });

  /* ----------------------------------------------------------
     START
  ---------------------------------------------------------- */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();
