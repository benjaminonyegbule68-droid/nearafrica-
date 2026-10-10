
/*
 * NearAfrica — app-new.js
 * Category matching fix + Explore functionality.
 *
 * - Matches category labels, slugs, hyphens and underscores.
 * - Supports all 12 Home-page categories.
 * - Preserves real API data, search, location filters,
 *   Nearby/GPS, pagination, saved businesses and profile links.
 * - Does not create fictional business listings.
 */

(function () {
  "use strict";

  const API_FALLBACK =
    "https://nearafrica-api.nearafrica-onyxtech.workers.dev";

  const LOCATION_KEY = "nearafrica_user_location";
  const NEARBY_KEY = "nearafrica_nearby_mode";
  const SAVED_KEY = "nearafrica_saved_businesses";

  /*
   * Canonical category labels used by the Home page.
   * All category comparisons go through this registry.
   */
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

  /*
   * Equivalent names for categories that may appear
   * differently in the database or categories endpoint.
   */
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

  /*
   * Convert equivalent category formats into one comparison key.
   *
   * Examples:
   * professional-services -> professional services
   * professional_services -> professional services
   * Professional Services -> professional services
   * Restaurants & Food -> restaurants and food
   */
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

  /*
   * Return the preferred display label for a category.
   * Unknown categories are retained rather than discarded.
   */
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

  /*
   * Category equality is centralized here so all filters
   * use the same comparison logic.
   */
  function categoriesMatch(first, second) {
    if (!clean(first) || !clean(second)) return false;

    return categoryKey(categoryLabel(first)) ===
      categoryKey(categoryLabel(second));
  }

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
        '<div class="loading-state">Loading businesses...</div>';
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

  function deduplicate(list) {
    const seen = new Set();

    return list.filter((business) => {
      const key = String(
        business.id ||
        `${business.name}|${business.city}|${business.state}`
      ).toLowerCase();

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

      url.searchParams.set("limit", "100");
      url.searchParams.set("page", "1");
      url.searchParams.set("country", "Nigeria");

      const payload = await fetchJson(url.toString());

      App.allBusinesses = deduplicate(
        extractBusinesses(payload).map(normalizeBusiness)
      );

      if (!App.allBusinesses.length) {
        setStatus(
          "The API responded, but no businesses were returned. Check the API response and country filter.",
          "info"
        );
      } else {
        setStatus("");
      }

      populateStateOptions();
      populateCategoryOptions();
      populateCityOptions();

      return App.allBusinesses;
    } catch (error) {
      console.error("NearAfrica: business loading failed.", error);

      App.allBusinesses = [];

      setStatus(
        "Unable to load businesses: " + error.message,
        "error"
      );

      return [];
    } finally {
      setLoading(false);
    }
  }

  /*
   * Fetch categories when the API supports it.
   * Failure is harmless because Home categories and business
   * categories are also used to build the filter.
   */
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

  /*
   * Select a category by equivalent name, even when the URL
   * uses a different format from the database.
   */
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

  /*
   * Always include all 12 Home categories, even if some currently
   * have zero matching businesses. Also preserve additional API
   * categories that are not in the Home-page list.
   */
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

    /*
     * Keep extra categories supplied by the API endpoint too.
     */
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
          (b) => !state || b.state.toLowerCase() === state
        )
        .map((b) => b.city)
    );

    addOptions(cityFilter(), cities, "All cities");
  }

  /* ----------------------------------------------------------
     DISTANCE AND LOCATION
  ---------------------------------------------------------- */

  function distanceKm(lat1, lon1, lat2, lon2) {
    const values = [lat1, lon1, lat2, lon2].map(Number);

    if (values.some((value) => !Number.isFinite(value))) {
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
        reject(new Error("Location access requires HTTPS."));
        return;
      }

      if (!navigator.geolocation) {
        reject(new Error("This browser does not support location services."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
          ) {
            reject(new Error("Your location could not be determined."));
            return;
          }

          resolve({
            latitude,
            longitude,
            accuracy: number(position.coords.accuracy)
          });
        },
        (error) => {
          const messages = {
            1: "Location permission was denied. Allow location access and try again.",
            2: "Your device could not determine your location. Check location services.",
            3: "The location request timed out. Please try again."
          };

          reject(
            new Error(
              messages[error.code] || "Unable to get your location."
            )
          );
        },
        {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000
        }
      );
    });
  }

  async function reverseGeocode(location) {
    try {
      const url = new URL(
        apiUrl(endpoint("location", "location"))
      );

      url.searchParams.set("latitude", location.latitude);
      url.searchParams.set("longitude", location.longitude);

      const payload = await fetchJson(url.toString());

      if (payload?.location) return payload.location;
    } catch (error) {
      console.warn("NearAfrica: reverse geocoding failed.", error);
    }

    return null;
  }

  function saveLocation() {
    if (!App.userLocation) return;

    try {
      sessionStorage.setItem(
        LOCATION_KEY,
        JSON.stringify({
          ...App.userLocation,
          locationInfo: App.locationInfo
        })
      );

      sessionStorage.setItem(NEARBY_KEY, "1");
    } catch (_) {}
  }

  function restoreLocation() {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(LOCATION_KEY) || "null"
      );

      if (
        saved &&
        Number.isFinite(Number(saved.latitude)) &&
        Number.isFinite(Number(saved.longitude))
      ) {
        App.userLocation = {
          latitude: Number(saved.latitude),
          longitude: Number(saved.longitude),
          accuracy: number(saved.accuracy)
        };

        App.locationInfo = saved.locationInfo || null;

        return true;
      }
    } catch (_) {}

    return false;
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
      button.textContent = "Finding location…";
    }

    setStatus("Finding your current location…");

    try {
      App.userLocation = await getBrowserLocation();
      App.locationInfo = await reverseGeocode(App.userLocation);
      App.nearbyMode = true;

      saveLocation();
      clearGeographicFilters();
      updateNearbyControls();
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
          ? `Nearby is active. Your detected area: ${label}.`
          : "Nearby is active. Businesses are sorted by GPS distance.",
        "success"
      );
    } catch (error) {
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
    setStatus("Nearby mode turned off.");
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
      >Use My Location</button>

      <label for="radiusFilter">Within</label>

      <select
        id="radiusFilter"
        aria-label="Nearby search radius"
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
      >Turn Nearby Off</button>
    `;

    panel.appendChild(wrapper);

    $("#nearbyButton").addEventListener("click", enableNearby);
    $("#clearNearby").addEventListener("click", clearNearby);

    $("#radiusFilter").addEventListener("change", () => {
      radiusValue();

      if (App.nearbyMode) applyFilters();
    });

    updateNearbyControls();
  }

  function updateNearbyControls() {
    const button = $("#nearbyButton");
    const clear = $("#clearNearby");
    const radius = $("#radiusFilter");

    if (button) {
      button.textContent = App.nearbyMode
        ? "Refresh My Location"
        : "Use My Location";
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

      const values = { q: query, category, state, city };

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
      console.warn("NearAfrica: URL update failed.", error);
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

        return { ...business, distanceKm: distance };
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
        ].filter(Boolean).join(" ").toLowerCase();

        if (query && !searchable.includes(query)) {
          return false;
        }

        /*
         * All categories use the same alias-aware comparison.
         */
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
          if (business.distanceKm === null) return false;
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
      Math.ceil(App.filteredBusinesses.length / App.pageSize)
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
        ? "Search and category filters cleared. Nearby remains active."
        : "All filters cleared."
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
        Array.isArray(value) ? value.map(String) : []
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
        "Your browser could not save this business.",
        "error"
      );
      return;
    }

    renderResults();

    setStatus(
      saved.has(key)
        ? "Business saved."
        : "Business removed from saved items.",
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
    ].filter(Boolean).filter(
      (value, index, array) => array.indexOf(value) === index
    ).join(", ");

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

    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

    return `
      <article class="business-card" data-business-id="${escapeHtml(business.id)}">

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

  function renderResults() {
    const container = resultsContainer();
    if (!container) return;

    const total = App.filteredBusinesses.length;

    App.totalPages = Math.max(
      1,
      Math.ceil(total / App.pageSize)
    );

    App.currentPage = Math.min(
      Math.max(1, App.currentPage),
      App.totalPages
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
        ? "Loading businesses..."
        : App.nearbyMode
          ? "No businesses with usable GPS coordinates were found within this radius. Try increasing the radius."
          : "No businesses match your search. Try changing your search or filters.";

      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <h2>${App.loading ? "Loading businesses" : "No businesses found"}</h2>
          <p>${escapeHtml(message)}</p>
        </div>
      `;
    }

    const count = countElement();

    if (count) {
      count.textContent =
        App.loading && !App.allBusinesses.length
          ? "Loading businesses..."
          : total === 1
            ? "1 business found"
            : `${total.toLocaleString()} businesses found`;
    }

    renderPagination();
  }

  function renderPagination() {
    const container = paginationElement();
    if (!container) return;

    const total = App.filteredBusinesses.length;

    if (total <= App.pageSize) {
      container.innerHTML = "";
      return;
    }

    const pages = [];

    for (let page = 1; page <= App.totalPages; page++) {
      pages.push(`
        <button
          type="button"
          data-page="${page}"
          class="${page === App.currentPage ? "active" : ""}"
          aria-current="${page === App.currentPage ? "page" : "false"}"
        >${page}</button>
      `);
    }

    container.innerHTML = `
      <button
        type="button"
        data-page="${App.currentPage - 1}"
        ${App.currentPage <= 1 ? "disabled" : ""}
      >Previous</button>
      ${pages.join("")}
      <button
        type="button"
        data-page="${App.currentPage + 1}"
        ${App.currentPage >= App.totalPages ? "disabled" : ""}
      >Next</button>
    `;
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
      // Profile navigation should work if analytics fail.
    }
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
        const save = event.target.closest("[data-save-business]");

        if (save) {
          event.preventDefault();
          toggleSaved(save.dataset.saveBusiness);
          return;
        }

        const view = event.target.closest("[data-view-business]");

        if (view) {
          recordBusinessView(view.dataset.viewBusiness);
        }
      });
    }

    const pagination = paginationElement();

    if (pagination) {
      pagination.addEventListener("click", (event) => {
        const button = event.target.closest("[data-page]");

        if (!button || button.disabled) return;

        const page = Number(button.dataset.page);

        if (
          Number.isInteger(page) &&
          page >= 1 &&
          page <= App.totalPages
        ) {
          App.currentPage = page;
          renderResults();

          resultsContainer()?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    }

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

        if (query) target.searchParams.set("q", query);

        location.href = target.toString();
      });
    });

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

      if (searchInput()) {
        event.preventDefault();
        searchInput().focus();
      }
    });
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

    /*
     * Restore URL filters AFTER the category options exist.
     * Category aliases allow slugs and display labels to match.
     */
    applyUrlParameters();

    if (App.nearbyMode && !App.userLocation) {
      setStatus(
        "Nearby was requested, but no saved GPS location is available. Select Use My Location.",
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
      button.addEventListener("click", async () => {
        try {
          App.userLocation = await getBrowserLocation();
          App.locationInfo = await reverseGeocode(App.userLocation);
          App.nearbyMode = true;

          saveLocation();

          const target = new URL("explore.html", location.href);

          target.searchParams.set("nearby", "1");
          target.searchParams.set("radius", String(App.radiusKm));

          location.href = target.toString();
        } catch (error) {
          setStatus(error.message, "error");
        }
      });
    });
  }

  function initialize() {
    if (App.initialized) return;

    if (isExplorePage()) {
      initializeExplore().catch((error) => {
        console.error("NearAfrica initialization failed:", error);

        setStatus(
          "NearAfrica could not initialize: " + error.message,
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();
