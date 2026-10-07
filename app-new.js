/*
 * ============================================================
 * NearAfrica — app-new.js
 * Clean frontend controller for Home + Explore pages.
 *
 * Version:
 * - Preserves existing NearAfrica frontend functionality.
 * - Nearby mode is GPS-distance based.
 * - Nearby never uses State/City as hidden hard filters.
 * - Search and Category remain usable in Nearby mode.
 * - Location restoration is handled safely.
 * ============================================================
 */

(function () {
  "use strict";

  const API_FALLBACK =
    "https://nearafrica-api.nearafrica-onyxtech.workers.dev";

  const STORAGE_LOCATION_KEY =
    "nearafrica_user_location";

  const STORAGE_SAVED_KEY =
    "nearafrica_saved_businesses";

  const STORAGE_NEARBY_KEY =
    "nearafrica_nearby_mode";


  const App = {
    initialized: false,

    allBusinesses: [],

    filteredBusinesses: [],

    userLocation: null,

    locationInfo: null,

    nearbyMode: false,

    radiusKm: 25,

    currentPage: 1,

    pageSize: 12,

    totalPages: 1,

    apiLoading: false,

    locationLoading: false,

    lastError: null,

    homepageInitialized: false,

    currentQuery: "",

    currentCategory: "",

    currentState: "",

    currentCity: ""
  };


  /* ============================================================
     CONFIG
  ============================================================ */

  function getConfig() {
    return window.NearAfricaConfig || {};
  }


  function clean(
    value,
    fallback = ""
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return fallback;
    }

    const text =
      String(value).trim();

    return text || fallback;
  }


  function toNumber(
    value,
    fallback = null
  ) {
    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  }


  function getApiBaseUrl() {
    const config =
      getConfig();

    const base =
      config.api &&
      config.api.baseUrl
        ? config.api.baseUrl
        : API_FALLBACK;

    return String(base)
      .replace(/\/+$/, "");
  }


  function getEndpoint(
    name,
    fallback
  ) {
    const config =
      getConfig();

    const endpoint =
      config.api &&
      config.api.endpoints &&
      config.api.endpoints[name]
        ? config.api.endpoints[name]
        : fallback;

    return String(
      endpoint || ""
    ).replace(
      /^\/+/,
      ""
    );
  }


  function buildApiUrl(path) {
    if (
      typeof path === "string" &&
      /^https?:\/\//i.test(path)
    ) {
      return path;
    }

    return (
      getApiBaseUrl() +
      "/" +
      String(
        path || ""
      ).replace(
        /^\/+/,
        ""
      )
    );
  }


  function pagePath() {
    const config =
      getConfig();

    return clean(
      config.profilePage ||
      (
        config.pages &&
        config.pages.businessProfile
      ),
      "business-profile-fixed.html"
    );
  }


  /* ============================================================
     HTML HELPERS
  ============================================================ */

  function escapeHtml(value) {
    return String(
      value === null ||
      value === undefined
        ? ""
        : value
    )
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


  function escapeAttribute(value) {
    return escapeHtml(value);
  }


  function firstElement(selectors) {
    for (
      const selector of selectors
    ) {
      const element =
        document.querySelector(
          selector
        );

      if (element) {
        return element;
      }
    }

    return null;
  }


  function allElements(selectors) {
    const found = [];

    const seen =
      new Set();

    selectors.forEach(
      function (selector) {
        document
          .querySelectorAll(
            selector
          )
          .forEach(
            function (element) {
              if (
                !seen.has(
                  element
                )
              ) {
                seen.add(
                  element
                );

                found.push(
                  element
                );
              }
            }
          );
      }
    );

    return found;
  }


  /* ============================================================
     DOM LOOKUPS
  ============================================================ */

  function getSearchInput() {
    return firstElement([
      "#searchInput",
      "#search",
      "#searchQuery",
      "input[name='q']",
      "input[data-search]"
    ]);
  }


  function getCategoryFilter() {
    return firstElement([
      "#categoryFilter",
      "#category",
      "select[name='category']",
      "select[data-filter='category']"
    ]);
  }


  function getStateFilter() {
    return firstElement([
      "#stateFilter",
      "#state",
      "select[name='state']",
      "select[data-filter='state']"
    ]);
  }


  function getCityFilter() {
    return firstElement([
      "#cityFilter",
      "#city",
      "select[name='city']",
      "select[data-filter='city']"
    ]);
  }


  function getRadiusFilter() {
    return firstElement([
      "#radiusFilter",
      "#radius",
      "select[name='radius']",
      "input[name='radius']",
      "select[data-filter='radius']"
    ]);
  }


  function getResultsContainer() {
    return firstElement([
      "#businessGrid",
      "#businessesGrid",
      "#resultsGrid",
      "#businessResults",
      "#results",
      "[data-business-results]"
    ]);
  }


  function getResultsCount() {
    return firstElement([
      "#resultsStatus",
      "#resultsCount",
      "#businessCount",
      "#resultCount",
      "[data-results-count]"
    ]);
  }


  function getLocationStatus() {
    return firstElement([
      "#locationStatus",
      "#nearbyStatus",
      "#locationMessage",
      "#statusMessage",
      "[data-location-status]"
    ]);
  }


  function getEmptyState() {
    return firstElement([
      "#emptyState",
      "#noResults",
      "#emptyResults",
      "[data-empty-state]"
    ]);
  }


  function getPaginationContainer() {
    return firstElement([
      "#pagination",
      "#paginationControls",
      "[data-pagination]"
    ]);
  }


  /* ============================================================
     PAGE DETECTION
  ============================================================ */

  function isExplorePage() {
    const path =
      window.location.pathname.toLowerCase();

    return (
      /search|explore/.test(path) ||
      !!getResultsContainer()
    );
  }


  function isHomePage() {
    const path =
      window.location.pathname.toLowerCase();

    return (
      /index\.html$/.test(path) ||
      path === "/" ||
      !!firstElement([
        "#useMyLocation",
        "#useLocation",
        "[data-use-location]"
      ])
    );
  }


  /* ============================================================
     API HELPERS
  ============================================================ */

  function extractApiMessage(
    payload,
    fallback
  ) {
    if (!payload) {
      return fallback;
    }

    return clean(
      payload.message ||
      payload.error ||
      payload.details ||
      (
        payload.errors &&
        payload.errors[0]
      ),
      fallback
    );
  }


  async function fetchJson(
    url,
    options = {}
  ) {
    const response =
      await fetch(
        url,
        {
          ...options,

          headers: {
            Accept:
              "application/json",

            ...(options.headers || {})
          },

          cache:
            options.cache ||
            "no-store"
        }
      );

    let payload =
      null;

    const text =
      await response.text();

    if (text) {
      try {
        payload =
          JSON.parse(text);

      } catch (error) {
        payload =
          null;
      }
    }

    if (!response.ok) {
      throw new Error(
        extractApiMessage(
          payload,
          `Request failed (HTTP ${response.status}).`
        )
      );
    }

    return payload;
  }


  /* ============================================================
     BUSINESS NORMALIZATION
  ============================================================ */

  function normalizeBusiness(raw) {
    const business =
      raw || {};

    const id =
      clean(
        business.id ||
        business.business_id ||
        business.businessId ||
        business.slug
      );

    const name =
      clean(
        business.business_name ||
        business.name ||
        business.title,
        "Unnamed Business"
      );

    const category =
      clean(
        business.category
      );

    const address =
      clean(
        business.address ||
        business.location ||
        business.address_line
      );

    const city =
      clean(
        business.city ||
        business.town
      );

    const state =
      clean(
        business.state ||
        business.region
      );

    const country =
      clean(
        business.country,
        "Nigeria"
      );

    const latitude =
      toNumber(
        business.latitude ??
        business.lat ??
        business.location_latitude
      );

    const longitude =
      toNumber(
        business.longitude ??
        business.lng ??
        business.lon ??
        business.location_longitude
      );

    const rating =
      toNumber(
        business.average_rating ??
        business.rating ??
        business.avg_rating,
        0
      );

    const reviewCount =
      toNumber(
        business.review_count ??
        business.reviews_count ??
        business.total_reviews,
        0
      );

    const image =
      clean(
        business.image_url ||
        business.image ||
        business.logo_url ||
        business.logo ||
        (
          Array.isArray(
            business.images
          ) &&
          business.images[0]
            ? (
                business.images[0]
                  .image_url ||
                business.images[0]
                  .url
              )
            : ""
        )
      );

    const website =
      clean(
        business.website ||
        business.site ||
        business.website_url
      );

    const phone =
      clean(
        business.phone ||
        business.phone_number ||
        business.contact_phone
      );

    const verified =
      Number(
        business.verified ||
        business.is_verified ||
        0
      ) === 1 ||
      business.verified === true ||
      business.is_verified === true;

    const claimed =
      Number(
        business.claimed ||
        business.is_claimed ||
        0
      ) === 1 ||
      business.claimed === true ||
      business.is_claimed === true;

    return {
      ...business,

      id,

      name,

      business_name:
        name,

      category,

      address,

      city,

      state,

      country,

      latitude,

      longitude,

      rating,

      reviewCount,

      image,

      website,

      phone,

      verified,

      claimed
    };
  }


  function normalizeBusinessResponse(
    payload
  ) {
    if (
      Array.isArray(payload)
    ) {
      return payload.map(
        normalizeBusiness
      );
    }

    const candidates = [
      payload &&
      payload.businesses,

      payload &&
      payload.results,

      payload &&
      payload.data,

      payload &&
      payload.items
    ];

    for (
      const candidate of candidates
    ) {
      if (
        Array.isArray(candidate)
      ) {
        return candidate.map(
          normalizeBusiness
        );
      }
    }

    if (
      payload &&
      payload.business
    ) {
      return [
        normalizeBusiness(
          payload.business
        )
      ];
    }

    return [];
  }


  function uniqueBusinesses(
    list
  ) {
    const output = [];

    const seen =
      new Set();

    list.forEach(
      function (business) {
        const key =
          clean(
            business.id
          ) ||
          (
            `${business.name}|${business.city}|${business.state}`
          ).toLowerCase();

        if (
          !seen.has(key)
        ) {
          seen.add(key);

          output.push(
            business
          );
        }
      }
    );

    return output;
  }


  /* ============================================================
     LOAD BUSINESSES
  ============================================================ */

  async function loadBusinesses() {
    App.apiLoading =
      true;

    App.lastError =
      null;

    setLoading(
      true
    );

    setStatus(
      "Loading businesses…",
      "info"
    );

    try {
      const url =
        new URL(
          buildApiUrl(
            getEndpoint(
              "businesses",
              "businesses"
            )
          )
        );

      url.searchParams.set(
        "limit",
        "100"
      );

      url.searchParams.set(
        "page",
        "1"
      );

      url.searchParams.set(
        "country",
        "Nigeria"
      );

      const payload =
        await fetchJson(
          url.toString()
        );

      App.allBusinesses =
        uniqueBusinesses(
          normalizeBusinessResponse(
            payload
          )
        );

      setLoading(
        false
      );

      setStatus(
        App.allBusinesses.length
          ? ""
          : "No businesses are currently available."
      );

      return App.allBusinesses;

    } catch (error) {
      App.lastError =
        error;

      App.allBusinesses =
        [];

      setLoading(
        false
      );

      setStatus(
        `Unable to load businesses. ${error.message}`,
        "error"
      );

      renderResults();

      return [];

    } finally {
      App.apiLoading =
        false;
    }
  }


  /* ============================================================
     LOAD CATEGORIES
  ============================================================ */

  async function loadCategories() {
    const filter =
      getCategoryFilter();

    if (!filter) {
      return;
    }

    try {
      const url =
        buildApiUrl(
          getEndpoint(
            "categories",
            "categories"
          )
        );

      const payload =
        await fetchJson(
          url
        );

      const categories =
        Array.isArray(payload)
          ? payload
          : Array.isArray(
              payload &&
              payload.categories
            )
              ? payload.categories
              : Array.isArray(
                  payload &&
                  payload.data
                )
                ? payload.data
                : [];

      const existing =
        filter.value;

      if (!categories.length) {
        return;
      }

      const current =
        Array.from(
          filter.options
        ).map(
          function (option) {
            return option.value;
          }
        );

      categories.forEach(
        function (category) {
          const value =
            clean(
              typeof category === "string"
                ? category
                : category.name
            );

          if (
            !value ||
            current.includes(
              value
            )
          ) {
            return;
          }

          filter.add(
            new Option(
              value,
              value
            )
          );

          current.push(
            value
          );
        }
      );

      if (existing) {
        filter.value =
          existing;
      }

    } catch (error) {
      console.warn(
        "NearAfrica category loading failed:",
        error
      );
    }
  }


  /* ============================================================
     LOCATION
  ============================================================ */

  function normalizeLocationInfo(
    raw
  ) {
    if (!raw) {
      return null;
    }

    const latitude =
      toNumber(
        raw.latitude
      );

    const longitude =
      toNumber(
        raw.longitude
      );

    return {
      latitude,

      longitude,

      country:
        clean(
          raw.country,
          "Nigeria"
        ),

      country_code:
        clean(
          raw.country_code
        ),

      state:
        clean(
          raw.state
        ),

      city:
        clean(
          raw.city
        ),

      area:
        clean(
          raw.area
        ),

      display_name:
        clean(
          raw.display_name
        )
    };
  }


  function formatLocationLabel(
    info
  ) {
    if (!info) {
      return "";
    }

    if (
      info.display_name
    ) {
      return info.display_name;
    }

    return [
      info.area,
      info.city,
      info.state,
      info.country
    ]
      .filter(Boolean)
      .filter(
        function (
          value,
          index,
          array
        ) {
          return (
            array.indexOf(
              value
            ) === index
          );
        }
      )
      .join(", ");
  }


  function getBrowserLocation() {
    return new Promise(
      function (
        resolve,
        reject
      ) {
        if (
          !window.isSecureContext
        ) {
          reject(
            new Error(
              "Location access requires a secure HTTPS connection."
            )
          );

          return;
        }

        if (
          !navigator.geolocation
        ) {
          reject(
            new Error(
              "Location services are not supported by this browser."
            )
          );

          return;
        }

        navigator.geolocation.getCurrentPosition(
          function (
            position
          ) {
            if (
              !position ||
              !position.coords
            ) {
              reject(
                new Error(
                  "Your location could not be determined."
                )
              );

              return;
            }

            const latitude =
              Number(
                position.coords
                  .latitude
              );

            const longitude =
              Number(
                position.coords
                  .longitude
              );

            const accuracy =
              Number(
                position.coords
                  .accuracy
              );

            if (
              !Number.isFinite(
                latitude
              ) ||
              !Number.isFinite(
                longitude
              ) ||
              latitude < -90 ||
              latitude > 90 ||
              longitude < -180 ||
              longitude > 180
            ) {
              reject(
                new Error(
                  "Your location could not be determined."
                )
              );

              return;
            }

            resolve({
              latitude,

              longitude,

              accuracy:
                Number.isFinite(
                  accuracy
                )
                  ? accuracy
                  : null
            });
          },

          function (
            error
          ) {
            let message =
              "Unable to get your location.";

            if (
              error &&
              error.code === 1
            ) {
              message =
                "Location permission was denied. Allow location access for NearAfrica and try again.";

            } else if (
              error &&
              error.code === 2
            ) {
              message =
                "Your device could not determine your location. Check that location services are enabled.";

            } else if (
              error &&
              error.code === 3
            ) {
              message =
                "Location request timed out. Please try again.";
            }

            reject(
              new Error(
                message
              )
            );
          },

          {
            enableHighAccuracy:
              false,

            timeout:
              20000,

            maximumAge:
              60000
          }
        );
      }
    );
  }


  async function reverseGeocodeLocation(
    location
  ) {
    if (!location) {
      throw new Error(
        "A location is required."
      );
    }

    const endpoint =
      getEndpoint(
        "location",
        "location"
      );

    const url =
      new URL(
        buildApiUrl(
          endpoint
        )
      );

    url.searchParams.set(
      "latitude",
      String(
        location.latitude
      )
    );

    url.searchParams.set(
      "longitude",
      String(
        location.longitude
      )
    );

    const payload =
      await fetchJson(
        url.toString(),
        {
          method: "GET"
        }
      );

    if (
      !payload ||
      payload.status === "error" ||
      !payload.location
    ) {
      throw new Error(
        extractApiMessage(
          payload,
          "The Worker could not identify your area."
        )
      );
    }

    return normalizeLocationInfo(
      payload.location
    );
  }


  /* ============================================================
     LOCATION STORAGE
  ============================================================ */

  function saveStoredLocation(
    location,
    info
  ) {
    if (!location) {
      return;
    }

    try {
      sessionStorage.setItem(
        STORAGE_LOCATION_KEY,
        JSON.stringify({
          latitude:
            Number(
              location.latitude
            ),

          longitude:
            Number(
              location.longitude
            ),

          accuracy:
            location.accuracy === null ||
            location.accuracy === undefined
              ? null
              : Number(
                  location.accuracy
                ),

          locationInfo:
            info ||
            App.locationInfo ||
            null
        })
      );

    } catch (error) {
      console.warn(
        "NearAfrica location storage failed:",
        error
      );
    }
  }


  function readStoredLocation() {
    try {
      const raw =
        sessionStorage.getItem(
          STORAGE_LOCATION_KEY
        );

      if (!raw) {
        return null;
      }

      const parsed =
        JSON.parse(
          raw
        );

      if (!parsed) {
        return null;
      }

      const latitude =
        Number(
          parsed.latitude
        );

      const longitude =
        Number(
          parsed.longitude
        );

      if (
        !Number.isFinite(
          latitude
        ) ||
        !Number.isFinite(
          longitude
        )
      ) {
        return null;
      }

      return {
        latitude,

        longitude,

        accuracy:
          toNumber(
            parsed.accuracy
          ),

        locationInfo:
          normalizeLocationInfo(
            parsed.locationInfo
          )
      };

    } catch (error) {
      return null;
    }
  }


  function clearStoredLocation() {
    try {
      sessionStorage.removeItem(
        STORAGE_LOCATION_KEY
      );

      sessionStorage.removeItem(
        STORAGE_NEARBY_KEY
      );

    } catch (error) {
      /* Ignore storage errors. */
    }
  }


  function restoreStoredLocation() {
    const stored =
      readStoredLocation();

    if (!stored) {
      return false;
    }

    App.userLocation = {
      latitude:
        stored.latitude,

      longitude:
        stored.longitude,

      accuracy:
        stored.accuracy
    };

    App.locationInfo =
      stored.locationInfo ||
      null;

    return true;
  }


  /* ============================================================
     DISTANCE
  ============================================================ */

  function distanceKm(
    lat1,
    lon1,
    lat2,
    lon2
  ) {
    const values = [
      lat1,
      lon1,
      lat2,
      lon2
    ].map(Number);

    if (
      values.some(
        function (value) {
          return !Number.isFinite(
            value
          );
        }
      )
    ) {
      return null;
    }

    const toRadians =
      function (
        degrees
      ) {
        return (
          degrees *
          Math.PI /
          180
        );
      };

    const earthRadiusKm =
      6371;

    const dLat =
      toRadians(
        lat2 - lat1
      );

    const dLon =
      toRadians(
        lon2 - lon1
      );

    const a =
      Math.sin(
        dLat / 2
      ) ** 2 +
      Math.cos(
        toRadians(
          lat1
        )
      ) *
        Math.cos(
          toRadians(
            lat2
          )
        ) *
        Math.sin(
          dLon / 2
        ) ** 2;

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(
          1 - a
        )
      );

    return (
      earthRadiusKm *
      c
    );
  }


  function getRadiusKm() {
    const radiusFilter =
      getRadiusFilter();

    if (!radiusFilter) {
      return App.radiusKm;
    }

    const value =
      Number(
        radiusFilter.value
      );

    if (
      Number.isFinite(
        value
      ) &&
      value > 0
    ) {
      App.radiusKm =
        value;
    }

    return App.radiusKm;
  }


  /* ============================================================
     LOCATION → FILTERS
     IMPORTANT:
     Reverse-geocoded State/City are informational.
     They do not automatically become hard filters.
  ============================================================ */

  function applyLocationToFilters(
    info,
    options = {}
  ) {
    if (!info) {
      return;
    }

    const applyState =
      options.applyState === true;

    const applyCity =
      options.applyCity === true;

    const stateFilter =
      getStateFilter();

    const cityFilter =
      getCityFilter();

    if (
      applyState &&
      stateFilter &&
      info.state
    ) {
      const option =
        Array.from(
          stateFilter.options
        ).find(
          function (item) {
            return (
              item.value
                .toLowerCase() ===
                info.state
                  .toLowerCase() ||
              item.textContent
                .trim()
                .toLowerCase() ===
                info.state
                  .toLowerCase()
            );
          }
        );

      if (option) {
        stateFilter.value =
          option.value;

        App.currentState =
          option.value;

        updateCityOptions(
          option.value
        );
      }
    }

    if (
      applyCity &&
      cityFilter &&
      info.city
    ) {
      const option =
        Array.from(
          cityFilter.options
        ).find(
          function (item) {
            return (
              item.value
                .toLowerCase() ===
                info.city
                  .toLowerCase() ||
              item.textContent
                .trim()
                .toLowerCase() ===
                info.city
                  .toLowerCase()
            );
          }
        );

      if (option) {
        cityFilter.value =
          option.value;

        App.currentCity =
          option.value;
      }
    }
  }


  function clearStateCityFilters() {
    const stateFilter =
      getStateFilter();

    const cityFilter =
      getCityFilter();

    if (stateFilter) {
      stateFilter.value =
        "";
    }

    if (cityFilter) {
      cityFilter.innerHTML =
        '<option value="">All cities</option>';

      cityFilter.value =
        "";
    }

    App.currentState =
      "";

    App.currentCity =
      "";
  }


  function updateCityOptions(
    stateValue
  ) {
    const cityFilter =
      getCityFilter();

    if (!cityFilter) {
      return;
    }

    const cities =
      uniqueBusinesses(
        App.allBusinesses
      )
        .filter(
          function (
            business
          ) {
            return (
              !stateValue ||
              clean(
                business.state
              ).toLowerCase() ===
                clean(
                  stateValue
                ).toLowerCase()
            );
          }
        )
        .map(
          function (
            business
          ) {
            return clean(
              business.city
            );
          }
        )
        .filter(Boolean)
        .filter(
          function (
            value,
            index,
            array
          ) {
            return (
              array.indexOf(
                value
              ) === index
            );
          }
        )
        .sort(
          function (
            a,
            b
          ) {
            return a.localeCompare(
              b
            );
          }
        );

    const existing =
      cityFilter.value;

    cityFilter.innerHTML =
      '<option value="">All cities</option>';

    cities.forEach(
      function (
        city
      ) {
        cityFilter.add(
          new Option(
            city,
            city
          )
        );
      }
    );

    if (
      cities.includes(
        existing
      )
    ) {
      cityFilter.value =
        existing;

    } else {
      cityFilter.value =
        "";
    }
  }


  /* ============================================================
     URL STATE
  ============================================================ */

  function applyUrlParameters() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const searchInput =
      getSearchInput();

    const categoryFilter =
      getCategoryFilter();

    const stateFilter =
      getStateFilter();

    const cityFilter =
      getCityFilter();

    const radiusFilter =
      getRadiusFilter();

    const query =
      clean(
        params.get("q")
      );

    const category =
      clean(
        params.get("category")
      );

    const state =
      clean(
        params.get("state")
      );

    const city =
      clean(
        params.get("city")
      );

    const radius =
      Number(
        params.get("radius")
      );

    const nearby =
      params.get("nearby") === "1" ||
      params.get("nearby") === "true";


    if (
      searchInput &&
      query
    ) {
      searchInput.value =
        query;
    }


    if (
      categoryFilter &&
      category
    ) {
      categoryFilter.value =
        category;
    }


    if (
      stateFilter &&
      state
    ) {
      stateFilter.value =
        state;
    }


    if (
      state
    ) {
      updateCityOptions(
        state
      );
    }


    if (
      cityFilter &&
      city
    ) {
      cityFilter.value =
        city;
    }


    /*
     * Apply URL radius to App.radiusKm
     * even when there is no radius control.
     */
    if (
      Number.isFinite(radius) &&
      radius > 0
    ) {
      App.radiusKm =
        radius;

      if (radiusFilter) {
        radiusFilter.value =
          String(radius);
      }
    }


    App.currentQuery =
      query;

    App.currentCategory =
      category;

    App.currentState =
      state;

    App.currentCity =
      city;


    if (
      nearby
    ) {
      /*
       * Nearby takes control over geographic filtering.
       *
       * State and City from the URL must not survive
       * into the Nearby search.
       */
      App.nearbyMode =
        true;

      clearStateCityFilters();

      getRadiusKm();

      return true;
    }

    return false;
  }


  function syncUrl() {
    if (!isExplorePage()) {
      return;
    }

    try {
      const url =
        new URL(
          window.location.href
        );

      /*
       * Nearby must never write State/City into the URL.
       */
      const entries = [
        [
          "q",
          App.currentQuery
        ],
        [
          "category",
          App.currentCategory
        ],
        [
          "state",
          App.nearbyMode
            ? ""
            : App.currentState
        ],
        [
          "city",
          App.nearbyMode
            ? ""
            : App.currentCity
        ]
      ];

      entries.forEach(
        function (
          [
            key,
            value
          ]
        ) {
          if (clean(value)) {
            url.searchParams.set(
              key,
              value
            );
          } else {
            url.searchParams.delete(
              key
            );
          }
        }
      );

      if (
        App.nearbyMode
      ) {
        url.searchParams.set(
          "nearby",
          "1"
        );

        url.searchParams.set(
          "radius",
          String(
            App.radiusKm
          )
        );
      } else {
        url.searchParams.delete(
          "nearby"
        );

        url.searchParams.delete(
          "radius"
        );
      }

      window.history.replaceState(
        {},
        "",
        url.toString()
      );

    } catch (error) {
      console.warn(
        "NearAfrica URL sync failed:",
        error
      );
    }
  }


  /* ============================================================
     FILTERING
  ============================================================ */

  function filterBusinesses() {
    const searchInput =
      getSearchInput();

    const categoryFilter =
      getCategoryFilter();

    const stateFilter =
      getStateFilter();

    const cityFilter =
      getCityFilter();


    /*
     * Nearby mode owns geographic filtering.
     *
     * Even if a user changes State/City while Nearby
     * is active, immediately clear those values.
     */
    if (
      App.nearbyMode
    ) {
      clearStateCityFilters();
    }


    App.currentQuery =
      clean(
        searchInput
          ? searchInput.value
          : App.currentQuery
      );


    App.currentCategory =
      clean(
        categoryFilter
          ? categoryFilter.value
          : App.currentCategory
      );


    App.currentState =
      App.nearbyMode
        ? ""
        : clean(
            stateFilter
              ? stateFilter.value
              : App.currentState
          );


    App.currentCity =
      App.nearbyMode
        ? ""
        : clean(
            cityFilter
              ? cityFilter.value
              : App.currentCity
          );


    /*
     * Only update City options for normal
     * manual State filtering.
     */
    if (
      !App.nearbyMode &&
      stateFilter &&
      App.currentState
    ) {
      updateCityOptions(
        App.currentState
      );

      if (
        cityFilter &&
        App.currentCity
      ) {
        cityFilter.value =
          App.currentCity;
      }
    }


    const query =
      App.currentQuery
        .toLowerCase();

    const category =
      App.currentCategory
        .toLowerCase();

    const state =
      App.currentState
        .toLowerCase();

    const city =
      App.currentCity
        .toLowerCase();

    const radius =
      getRadiusKm();


    const results =
      App.allBusinesses
        .map(
          function (
            business
          ) {
            const searchable =
              [
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


            let distance =
              null;


            /*
             * Calculate real GPS distance only when
             * the user has a valid location and the
             * business has real coordinates.
             */
            if (
              App.userLocation &&
              business.latitude !== null &&
              business.longitude !== null
            ) {
              distance =
                distanceKm(
                  App.userLocation.latitude,
                  App.userLocation.longitude,
                  business.latitude,
                  business.longitude
                );
            }


            return {
              business,

              searchable,

              distance
            };
          }
        )
        .filter(
          function (
            entry
          ) {
            const business =
              entry.business;


            /*
             * SEARCH
             */
            if (
              query &&
              !entry.searchable.includes(
                query
              )
            ) {
              return false;
            }


            /*
             * CATEGORY
             */
            if (
              category &&
              clean(
                business.category
              ).toLowerCase() !==
                category
            ) {
              return false;
            }


            /*
             * STATE / CITY
             *
             * These are normal manual filters.
             * They are intentionally ignored while
             * Nearby mode is active.
             */
            if (
              !App.nearbyMode &&
              state &&
              clean(
                business.state
              ).toLowerCase() !==
                state
            ) {
              return false;
            }


            if (
              !App.nearbyMode &&
              city &&
              clean(
                business.city
              ).toLowerCase() !==
                city
            ) {
              return false;
            }


            /*
             * NEARBY
             *
             * Nearby is purely GPS-distance based.
             */
            if (
              App.nearbyMode
            ) {
              if (
                entry.distance === null
              ) {
                return false;
              }

              if (
                entry.distance >
                radius
              ) {
                return false;
              }
            }


            return true;
          }
        )
        .sort(
          function (
            a,
            b
          ) {
            /*
             * Nearby:
             * nearest business first.
             */
            if (
              App.nearbyMode
            ) {
              return (
                (
                  a.distance ??
                  Infinity
                ) -
                (
                  b.distance ??
                  Infinity
                )
              );
            }


            /*
             * Normal Explore:
             * Featured first, then alphabetical.
             */
            const featuredA =
              Number(
                a.business.featured ||
                0
              );

            const featuredB =
              Number(
                b.business.featured ||
                0
              );


            if (
              featuredA !==
              featuredB
            ) {
              return (
                featuredB -
                featuredA
              );
            }


            return a.business.name
              .localeCompare(
                b.business.name
              );
          }
        )
        .map(
          function (
            entry
          ) {
            return {
              ...entry.business,

              distanceKm:
                entry.distance
            };
          }
        );


    App.filteredBusinesses =
      results;


    App.currentPage =
      1;


    App.totalPages =
      Math.max(
        1,
        Math.ceil(
          results.length /
          App.pageSize
        )
      );


    syncUrl();

    renderResults();
  }


  /* ============================================================
     DISPLAY HELPERS
  ============================================================ */

  function formatNumber(
    value
  ) {
    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number.toLocaleString()
      : "0";
  }


  function stars(
    rating
  ) {
    const score =
      Math.max(
        0,
        Math.min(
          5,
          Number(
            rating
          ) || 0
        )
      );

    const rounded =
      Math.round(
        score
      );

    return "★★★★★"
      .split("")
      .map(
        function (
          star,
          index
        ) {
          return index <
            rounded
            ? "★"
            : "☆";
        }
      )
      .join("");
  }


  function formatDistance(
    value
  ) {
    const distance =
      Number(value);

    if (
      !Number.isFinite(
        distance
      )
    ) {
      return "";
    }

    if (
      distance < 1
    ) {
      return (
        Math.round(
          distance * 1000
        ) +
        " m away"
      );
    }

    return (
      distance.toFixed(
        distance < 10
          ? 1
          : 0
      ) +
      " km away"
    );
  }


  /* ============================================================
     SAVED BUSINESSES
  ============================================================ */

  function getSavedIds() {
    try {
      const raw =
        localStorage.getItem(
          STORAGE_SAVED_KEY
        );

      const parsed =
        raw
          ? JSON.parse(
              raw
            )
          : [];

      return new Set(
        Array.isArray(
          parsed
        )
          ? parsed.map(
              String
            )
          : []
      );

    } catch (error) {
      return new Set();
    }
  }


  function saveSavedIds(
    ids
  ) {
    try {
      localStorage.setItem(
        STORAGE_SAVED_KEY,
        JSON.stringify(
          Array.from(
            ids
          )
        )
      );

    } catch (error) {
      console.warn(
        "NearAfrica saved business storage failed:",
        error
      );
    }
  }


  function isSaved(
    id
  ) {
    if (!id) {
      return false;
    }

    return getSavedIds().has(
      String(id)
    );
  }


  function toggleSaved(
    id
  ) {
    if (!id) {
      return false;
    }

    const ids =
      getSavedIds();

    const key =
      String(id);


    if (
      ids.has(key)
    ) {
      ids.delete(
        key
      );

    } else {
      ids.add(
        key
      );
    }


    saveSavedIds(
      ids
    );

    renderResults();


    setStatus(
      ids.has(key)
        ? "★ Saved"
        : "Saved item removed.",
      "success"
    );


    return ids.has(
      key
    );
  }


  /* ============================================================
     BUSINESS URL
  ============================================================ */

  function businessUrl(
    business
  ) {
    const path =
      pagePath();

    const id =
      clean(
        business &&
        business.id
      );

    const slug =
      clean(
        business &&
        business.slug
      );

    const url =
      new URL(
        path,
        window.location.href
      );


    if (id) {
      url.searchParams.set(
        "id",
        id
      );

    } else if (slug) {
      url.searchParams.set(
        "slug",
        slug
      );
    }


    return url.toString();
  }


  /* ============================================================
     BUSINESS VIEWS
  ============================================================ */

  function recordBusinessView(
    businessId
  ) {
    if (!businessId) {
      return;
    }

    const url =
      buildApiUrl(
        `businesses/${encodeURIComponent(
          businessId
        )}/view`
      );


    fetch(
      url,
      {
        method: "POST",

        headers: {
          Accept:
            "application/json"
        },

        keepalive: true
      }
    ).catch(
      function () {}
    );
  }


  /* ============================================================
     BUSINESS CARDS
  ============================================================ */

  function renderBusinessCard(
    business
  ) {
    const saved =
      isSaved(
        business.id
      );


    const location =
      [
        business.address,
        business.city,
        business.state
      ]
        .filter(Boolean)
        .filter(
          function (
            value,
            index,
            array
          ) {
            return (
              array.indexOf(
                value
              ) === index
            );
          }
        )
        .join(", ");


    const image =
      business.image
        ? `
          <img
            src="${escapeAttribute(
              business.image
            )}"
            alt="${escapeAttribute(
              business.name
            )}"
            loading="lazy"
            onerror="
              this.parentElement.classList.add(
                'image-fallback'
              );
              this.remove();
            "
          >
        `
        : `
          <div
            class="card-image-placeholder"
            aria-hidden="true"
          >
            NA
          </div>
        `;


    const distance =
      formatDistance(
        business.distanceKm
      );


    return `
      <article
        class="business-card"
        data-business-id="${escapeAttribute(
          business.id
        )}"
      >

        <a
          class="business-card-image"
          href="${escapeAttribute(
            businessUrl(
              business
            )
          )}"
          aria-label="View ${escapeAttribute(
            business.name
          )}"
        >
          ${image}
        </a>


        <div
          class="business-card-body"
        >

          <div
            class="business-card-topline"
          >

            <span
              class="business-category"
            >
              ${escapeHtml(
                business.category ||
                "Business"
              )}
            </span>


            ${
              business.verified
                ? `
                  <span
                    class="business-verified"
                    title="Verified"
                  >
                    ✓ Verified
                  </span>
                `
                : ""
            }

          </div>


          <h3
            class="business-card-title"
          >

            <a
              href="${escapeAttribute(
                businessUrl(
                  business
                )
              )}"
            >
              ${escapeHtml(
                business.name
              )}
            </a>

          </h3>


          <div
            class="business-card-location"
          >
            ${escapeHtml(
              location ||
              "Location unavailable"
            )}
          </div>


          <div
            class="business-card-rating"
          >

            <span
              aria-label="${escapeAttribute(
                business.rating
              )} out of 5"
            >
              ${stars(
                business.rating
              )}
            </span>


            <span>
              ${
                business.rating > 0
                  ? Number(
                      business.rating
                    ).toFixed(1)
                  : "No rating"
              }
            </span>


            <span>
              (
              ${formatNumber(
                business.reviewCount
              )}
              )
            </span>

          </div>


          ${
            distance
              ? `
                <div
                  class="business-card-distance"
                >
                  ${escapeHtml(
                    distance
                  )}
                </div>
              `
              : ""
          }


          <div
            class="business-card-actions"
          >

            <a
              class="btn btn-primary"
              href="${escapeAttribute(
                businessUrl(
                  business
                )
              )}"
              data-view-business="${escapeAttribute(
                business.id
              )}"
            >
              View Business
            </a>


            <button
              type="button"
              class="btn btn-save ${
                saved
                  ? "saved"
                  : ""
              }"
              data-save-business="${escapeAttribute(
                business.id
              )}"
              aria-pressed="${
                saved
                  ? "true"
                  : "false"
              }"
            >
              ${
                saved
                  ? "★ Saved"
                  : "☆ Save"
              }
            </button>

          </div>

        </div>

      </article>
    `;
  }


  /* ============================================================
     RESULTS
  ============================================================ */

  function renderResults() {
    const container =
      getResultsContainer();

    const emptyState =
      getEmptyState();


    if (!container) {
      updateResultsCount();

      renderPagination();

      return;
    }


    const total =
      App.filteredBusinesses.length;


    App.totalPages =
      Math.max(
        1,
        Math.ceil(
          total /
          App.pageSize
        )
      );


    if (
      App.currentPage >
      App.totalPages
    ) {
      App.currentPage =
        App.totalPages;
    }


    const start =
      (
        App.currentPage - 1
      ) *
      App.pageSize;


    const pageItems =
      App.filteredBusinesses.slice(
        start,
        start +
          App.pageSize
      );


    if (
      !pageItems.length
    ) {
      container.innerHTML =
        "";


      if (emptyState) {
        emptyState.hidden =
          false;

        emptyState.style.display =
          "";

        emptyState.innerHTML = `
          <h2>
            No businesses found
          </h2>

          <p>
            ${
              App.nearbyMode
                ? "No businesses with usable coordinates were found within your selected radius. Try increasing the radius."
                : "Try a different search or filter."
            }
          </p>
        `;
      }

    } else {
      if (emptyState) {
        emptyState.hidden =
          true;

        emptyState.style.display =
          "none";
      }


      container.innerHTML =
        pageItems
          .map(
            renderBusinessCard
          )
          .join("");
    }


    updateResultsCount();

    renderPagination();
  }


  function updateResultsCount() {
    const element =
      getResultsCount();

    if (!element) {
      return;
    }

    const total =
      App.filteredBusinesses.length;


    element.textContent =
      total === 1
        ? "1 business found"
        : `${formatNumber(
            total
          )} businesses found`;
  }


  function renderPagination() {
    const container =
      getPaginationContainer();

    if (!container) {
      return;
    }

    const total =
      App.filteredBusinesses.length;


    if (
      !total ||
      App.totalPages <= 1
    ) {
      container.innerHTML =
        "";

      return;
    }


    container.innerHTML = `
      <div
        class="nearafrica-pagination"
      >

        <button
          type="button"
          class="btn"
          data-page-action="prev"
          ${
            App.currentPage <= 1
              ? "disabled"
              : ""
          }
        >
          Previous
        </button>


        <span>
          Page
          ${App.currentPage}
          of
          ${App.totalPages}
        </span>


        <button
          type="button"
          class="btn"
          data-page-action="next"
          ${
            App.currentPage >=
            App.totalPages
              ? "disabled"
              : ""
          }
        >
          Next
        </button>

      </div>
    `;
  }


  function goToPage(
    page
  ) {
    const target =
      Math.max(
        1,
        Math.min(
          Number(page) || 1,
          App.totalPages
        )
      );


    if (
      target ===
      App.currentPage
    ) {
      return;
    }


    App.currentPage =
      target;

    renderResults();


    const container =
      getResultsContainer();


    if (
      container &&
      typeof container.scrollIntoView ===
        "function"
    ) {
      container.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start"
      });
    }
  }


  /* ============================================================
     UI STATUS
  ============================================================ */

  function setLoading(
    isLoading
  ) {
    const loading =
      firstElement([
        "#loadingState",
        "#loading",
        "[data-loading]"
      ]);


    if (!loading) {
      return;
    }


    loading.hidden =
      !isLoading;


    loading.style.display =
      isLoading
        ? ""
        : "none";
  }


  function setStatus(
    message,
    type = "info"
  ) {
    const element =
      getLocationStatus();


    if (!element) {
      return;
    }


    const value =
      clean(
        message
      );


    element.textContent =
      value;


    element.dataset.statusType =
      type;


    element.hidden =
      !value;


    element.style.display =
      value
        ? ""
        : "none";
  }


  function updateLocationUi() {
    const label =
      formatLocationLabel(
        App.locationInfo
      );


    const buttons =
      allElements([
        "#useMyLocation",
        "#useLocation",
        "[data-use-location]"
      ]);


    buttons.forEach(
      function (
        button
      ) {
        button.disabled =
          App.locationLoading;


        button.setAttribute(
          "aria-busy",
          String(
            App.locationLoading
          )
        );


        button.textContent =
          App.locationLoading
            ? "Finding your location…"
            : "Use My Location";
      }
    );


    const nearbyButtons =
      allElements([
        "#clearLocation",
        "#clearNearby",
        "[data-clear-location]"
      ]);


    nearbyButtons.forEach(
      function (
        button
      ) {
        button.hidden =
          !App.nearbyMode;


        button.style.display =
          App.nearbyMode
            ? ""
            : "none";
      }
    );


    if (
      App.nearbyMode
    ) {
      setStatus(
        label
          ? `Using your current location: ${label}`
          : "Using your current location.",
        "success"
      );
    }
  }


  function dispatchLocationChange() {
    try {
      window.dispatchEvent(
        new CustomEvent(
          "nearafrica:locationchange",
          {
            detail: {
              location:
                App.userLocation,

              locationInfo:
                App.locationInfo,

              nearbyMode:
                App.nearbyMode,

              radiusKm:
                App.radiusKm
            }
          }
        )
      );

    } catch (error) {
      /* Ignore event errors. */
    }
  }


  /* ============================================================
     USE MY LOCATION
  ============================================================ */

  async function enableNearbyLocation() {
    if (
      App.locationLoading
    ) {
      return false;
    }


    App.locationLoading =
      true;


    updateLocationUi();


    setStatus(
      "Finding your current location…",
      "info"
    );


    try {
      const location =
        await getBrowserLocation();


      App.userLocation =
        location;


      App.locationInfo =
        null;


      try {
        App.locationInfo =
          await reverseGeocodeLocation(
            location
          );

      } catch (error) {
        console.warn(
          "NearAfrica reverse location lookup failed:",
          error
        );
      }


      /*
       * Nearby mode is strictly GPS-based.
       */
      App.nearbyMode =
        true;


      getRadiusKm();


      /*
       * Store the actual GPS coordinates.
       */
      saveStoredLocation(
        location,
        App.locationInfo
      );


      try {
        sessionStorage.setItem(
          STORAGE_NEARBY_KEY,
          "1"
        );

      } catch (error) {
        /* Ignore storage errors. */
      }


      /*
       * Remove any normal geographic filters.
       *
       * Search and Category remain available.
       */
      clearStateCityFilters();


      App.currentPage =
        1;


      syncUrl();


      /*
       * Filter immediately if businesses are already loaded.
       */
      if (
        App.allBusinesses.length
      ) {
        filterBusinesses();
      }


      dispatchLocationChange();


      const label =
        formatLocationLabel(
          App.locationInfo
        );


      setStatus(
        label
          ? `Using your current location: ${label}`
          : "Using your current location.",
        "success"
      );


      return true;

    } catch (error) {
      App.lastError =
        error;


      setStatus(
        error.message,
        "error"
      );


      return false;

    } finally {
      App.locationLoading =
        false;


      updateLocationUi();
    }
  }


  function clearNearbyLocation() {
    App.userLocation =
      null;

    App.locationInfo =
      null;

    App.nearbyMode =
      false;

    App.currentPage =
      1;


    clearStoredLocation();


    /*
     * Remove nearby URL state.
     *
     * Keep normal Search/State/City/Category values
     * unless the user already changed them manually.
     */
    try {
      const url =
        new URL(
          window.location.href
        );

      url.searchParams.delete(
        "nearby"
      );

      url.searchParams.delete(
        "radius"
      );

      window.history.replaceState(
        {},
        "",
        url.toString()
      );

    } catch (error) {
      /* Ignore URL errors. */
    }


    /*
     * Rebuild normal State/City values from the UI.
     */
    const stateFilter =
      getStateFilter();

    const cityFilter =
      getCityFilter();


    if (stateFilter) {
      App.currentState =
        clean(
          stateFilter.value
        );
    } else {
      App.currentState =
        "";
    }


    if (cityFilter) {
      App.currentCity =
        clean(
          cityFilter.value
        );
    } else {
      App.currentCity =
        "";
    }


    filterBusinesses();

    dispatchLocationChange();


    setStatus(
      "Location cleared.",
      "info"
    );


    updateLocationUi();
  }


  /* ============================================================
     HOME LOCATION
     IMPORTANT:
     Home redirects to Explore with Nearby mode only.
     It does not pass State/City filters.
  ============================================================ */

  async function handleHomeLocation() {
    const okay =
      await enableNearbyLocation();


    if (!okay) {
      return;
    }


    const url =
      new URL(
        "explore.html",
        window.location.href
      );


    url.searchParams.set(
      "nearby",
      "1"
    );


    url.searchParams.set(
      "radius",
      String(
        getRadiusKm()
      )
    );


    /*
     * Search/Category are not carried from the home
     * location button.
     *
     * State/City are deliberately not passed.
     */
    window.location.href =
      url.toString();
  }


  /* ============================================================
     LOCATION BUTTONS
  ============================================================ */

  function setupLocationButtons() {
    allElements([
      "#useMyLocation",
      "#useLocation",
      "[data-use-location]"
    ]).forEach(
      function (
        button
      ) {
        if (
          button.dataset
            .nearafricaLocationBound ===
          "1"
        ) {
          return;
        }


        button.dataset
          .nearafricaLocationBound =
          "1";


        button.addEventListener(
          "click",
          function () {
            if (
              isHomePage() &&
              !isExplorePage()
            ) {
              handleHomeLocation();

            } else {
              enableNearbyLocation();
            }
          }
        );
      }
    );


    allElements([
      "#clearLocation",
      "#clearNearby",
      "[data-clear-location]"
    ]).forEach(
      function (
        button
      ) {
        if (
          button.dataset
            .nearafricaClearBound ===
          "1"
        ) {
          return;
        }


        button.dataset
          .nearafricaClearBound =
          "1";


        button.addEventListener(
          "click",
          clearNearbyLocation
        );
      }
    );
  }


  /* ============================================================
     FILTER EVENTS
  ============================================================ */

  function setupFilters() {
    const elements =
      [
        getSearchInput(),
        getCategoryFilter(),
        getStateFilter(),
        getCityFilter(),
        getRadiusFilter()
      ].filter(Boolean);


    elements.forEach(
      function (
        element
      ) {
        if (
          element.dataset
            .nearafricaFilterBound ===
          "1"
        ) {
          return;
        }


        element.dataset
          .nearafricaFilterBound =
          "1";


        const eventName =
          element.tagName ===
            "INPUT" &&
          (
            element.type ===
              "search" ||
            element.type ===
              "text"
          )
            ? "input"
            : "change";


        element.addEventListener(
          eventName,
          function () {
            filterBusinesses();
          }
        );


        if (
          eventName ===
          "input"
        ) {
          element.addEventListener(
            "search",
            filterBusinesses
          );
        }
      }
    );


    const searchForm =
      firstElement([
        "#searchForm",
        "form[data-search-form]"
      ]);


    if (
      searchForm &&
      searchForm.dataset
        .nearafricaBound !==
        "1"
    ) {
      searchForm.dataset
        .nearafricaBound =
        "1";


      searchForm.addEventListener(
        "submit",
        function (
          event
        ) {
          event.preventDefault();

          filterBusinesses();
        }
      );
    }


    const stateFilter =
      getStateFilter();


    if (
      stateFilter &&
      stateFilter.dataset
        .nearafricaCityBound !==
      "1"
    ) {
      stateFilter.dataset
        .nearafricaCityBound =
        "1";


      stateFilter.addEventListener(
        "change",
        function () {
          /*
           * If Nearby is active, filterBusinesses()
           * will immediately clear the State/City value.
           */
          if (
            !App.nearbyMode
          ) {
            updateCityOptions(
              stateFilter.value
            );
          }

          filterBusinesses();
        }
      );
    }
  }


  /* ============================================================
     RESULT EVENTS
  ============================================================ */

  function setupResultsEvents() {
    const container =
      getResultsContainer();


    if (
      container &&
      container.dataset
        .nearafricaResultsBound !==
      "1"
    ) {
      container.dataset
        .nearafricaResultsBound =
        "1";


      container.addEventListener(
        "click",
        function (
          event
        ) {
          const saveButton =
            event.target.closest(
              "[data-save-business]"
            );


          if (saveButton) {
            event.preventDefault();

            event.stopPropagation();


            toggleSaved(
              saveButton.dataset
                .saveBusiness
            );


            return;
          }


          const viewLink =
            event.target.closest(
              "[data-view-business]"
            );


          if (viewLink) {
            recordBusinessView(
              viewLink.dataset
                .viewBusiness
            );
          }
        }
      );
    }


    const pagination =
      getPaginationContainer();


    if (
      pagination &&
      pagination.dataset
        .nearafricaBound !==
      "1"
    ) {
      pagination.dataset
        .nearafricaBound =
        "1";


      pagination.addEventListener(
        "click",
        function (
          event
        ) {
          const button =
            event.target.closest(
              "[data-page-action]"
            );


          if (
            !button ||
            button.disabled
          ) {
            return;
          }


          if (
            button.dataset
              .pageAction ===
            "prev"
          ) {
            goToPage(
              App.currentPage -
              1
            );

          } else if (
            button.dataset
              .pageAction ===
            "next"
          ) {
            goToPage(
              App.currentPage +
              1
            );
          }
        }
      );
    }
  }


  /* ============================================================
     MOBILE MENU
  ============================================================ */

  function setupMobileMenu() {
    const toggle =
      firstElement([
        "#mobileMenuToggle",
        "#mobileMenuButton",
        ".mobile-menu",
        "[data-mobile-menu-toggle]"
      ]);


    const nav =
      firstElement([
        "#mobileNav",
        "#mainNav",
        ".mobile-nav",
        ".nav"
      ]);


    if (
      !toggle ||
      !nav ||
      toggle.dataset
        .nearafricaMenuBound ===
      "1"
    ) {
      return;
    }


    toggle.dataset
      .nearafricaMenuBound =
      "1";


    toggle.setAttribute(
      "aria-expanded",
      "false"
    );


    toggle.addEventListener(
      "click",
      function () {
        const open =
          nav.classList.toggle(
            "open"
          );


        toggle.setAttribute(
          "aria-expanded",
          String(
            open
          )
        );


        toggle.setAttribute(
          "aria-label",
          open
            ? "Close menu"
            : "Open menu"
        );


        if (
          toggle.tagName ===
          "BUTTON"
        ) {
          toggle.textContent =
            open
              ? "✕"
              : "☰";
        }
      }
    );


    nav.querySelectorAll("a")
      .forEach(
        function (
          link
        ) {
          link.addEventListener(
            "click",
            function () {
              nav.classList.remove(
                "open"
              );


              toggle.setAttribute(
                "aria-expanded",
                "false"
              );


              toggle.setAttribute(
                "aria-label",
                "Open menu"
              );


              if (
                toggle.tagName ===
                "BUTTON"
              ) {
                toggle.textContent =
                  "☰";
              }
            }
          );
        }
      );
  }


  /* ============================================================
     KEYBOARD SEARCH
  ============================================================ */

  function setupKeyboardSearch() {
    if (
      document.documentElement
        .dataset
        .nearafricaKeyboardBound ===
      "1"
    ) {
      return;
    }


    document.documentElement
      .dataset
      .nearafricaKeyboardBound =
      "1";


    document.addEventListener(
      "keydown",
      function (
        event
      ) {
        if (
          event.key !== "/" ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey
        ) {
          return;
        }


        const target =
          event.target;


        const tag =
          target &&
          target.tagName
            ? target.tagName.toLowerCase()
            : "";


        if (
          [
            "input",
            "textarea",
            "select"
          ].includes(
            tag
          )
        ) {
          return;
        }


        const searchInput =
          getSearchInput();


        if (searchInput) {
          event.preventDefault();

          searchInput.focus();
        }
      }
    );
  }


  /* ============================================================
     RESTORE LOCATION
  ============================================================ */

  function applyRestoredLocationIfAvailable() {
    const restored =
      restoreStoredLocation();


    if (!restored) {
      return false;
    }


    const params =
      new URLSearchParams(
        window.location.search
      );


    let nearbyFromStorage =
      false;


    if (
      params.get("nearby") ===
      "1" ||
      params.get("nearby") ===
      "true"
    ) {
      nearbyFromStorage =
        true;

    } else {
      try {
        nearbyFromStorage =
          sessionStorage.getItem(
            STORAGE_NEARBY_KEY
          ) === "1";

      } catch (error) {
        nearbyFromStorage =
          false;
      }
    }


    if (
      nearbyFromStorage
    ) {
      App.nearbyMode =
        true;


      /*
       * Nearby restoration must not restore
       * State/City as geographic hard filters.
       */
      clearStateCityFilters();


      updateLocationUi();


      return true;
    }


    return false;
  }


  /* ============================================================
     EXPLORE INITIALIZATION
  ============================================================ */

  async function initializeExplorePage() {
    setupLocationButtons();

    setupFilters();

    setupResultsEvents();

    setupMobileMenu();


    const nearbyFromUrl =
      applyUrlParameters();


    const restoredNearby =
      applyRestoredLocationIfAvailable();


    await loadCategories();


    /*
     * Businesses must load BEFORE filtering.
     */
    await loadBusinesses();


    /*
     * Rebuild normal City options.
     *
     * When Nearby is active, App.currentState is ""
     * so this becomes an unrestricted city list.
     */
    updateCityOptions(
      App.nearbyMode
        ? ""
        : App.currentState
    );


    /*
     * Reverse-geocoded location is informational only.
     */
    if (
      App.locationInfo
    ) {
      updateLocationUi();
    }


    if (
      nearbyFromUrl ||
      restoredNearby
    ) {
      App.nearbyMode =
        true;

      clearStateCityFilters();

      updateLocationUi();
    }


    filterBusinesses();


    App.initialized =
      true;


    dispatchLocationChange();
  }


  /* ============================================================
     HOME INITIALIZATION
  ============================================================ */

  function initializeHomePage() {
    if (
      App.homepageInitialized
    ) {
      return;
    }


    App.homepageInitialized =
      true;


    setupLocationButtons();

    setupMobileMenu();

    setupKeyboardSearch();


    restoreStoredLocation();


    updateLocationUi();


    const searchForms =
      allElements([
        "#homeSearchForm",
        "#searchForm",
        "form[data-search-form]"
      ]);


    searchForms.forEach(
      function (
        form
      ) {
        if (
          form.dataset
            .nearafricaHomeBound ===
          "1"
        ) {
          return;
        }


        form.dataset
          .nearafricaHomeBound =
          "1";


        form.addEventListener(
          "submit",
          function (
            event
          ) {
            event.preventDefault();


            const input =
              form.querySelector(
                "input[name='q'], #searchInput, input[type='search']"
              ) ||
              getSearchInput();


            const query =
              clean(
                input &&
                input.value
              );


            const target =
              new URL(
                "explore.html",
                window.location.href
              );


            if (query) {
              target.searchParams.set(
                "q",
                query
              );
            }


            window.location.href =
              target.toString();
          }
        );
      }
    );
  }


  /* ============================================================
     MAIN INITIALIZE
  ============================================================ */

  function initialize() {
    if (
      document.readyState ===
      "loading"
    ) {
      document.addEventListener(
        "DOMContentLoaded",
        initialize,
        {
          once: true
        }
      );

      return;
    }


    setupKeyboardSearch();


    if (
      isExplorePage()
    ) {
      initializeExplorePage()
        .catch(
          function (
            error
          ) {
            console.error(
              "NearAfrica explore initialization failed:",
              error
            );


            setStatus(
              `NearAfrica could not initialize correctly. ${error.message}`,
              "error"
            );
          }
        );

    } else if (
      isHomePage()
    ) {
      initializeHomePage();

      App.initialized =
        true;

    } else {
      setupLocationButtons();

      setupMobileMenu();

      App.initialized =
        true;
    }


    window.NearAfricaApp = {
      state:
        App,

      refresh:
        loadBusinesses,

      search:
        filterBusinesses,

      useLocation:
        enableNearbyLocation,

      clearLocation:
        clearNearbyLocation,

      filter:
        filterBusinesses,

      getBusinessUrl:
        businessUrl,

      getBrowserLocation,

      reverseGeocodeLocation,

      getLocationInfo:
        function () {
          return App.locationInfo;
        }
    };
  }


  initialize();

})();
