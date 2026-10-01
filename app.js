/*
 * ============================================================
 * NearAfrica — app.js
 * Nigeria-first Explore/Search application
 * ============================================================
 *
 * Responsibilities:
 * - Load real businesses from the NearAfrica API
 * - Homepage search compatibility
 * - Explore page search
 * - Nigeria country/state/city filtering
 * - Category filtering
 * - Nearby location search
 * - Distance calculation
 * - Sorting
 * - Pagination
 * - Business cards
 * - Location permission handling
 * - URL parameter compatibility
 * - Mobile-safe initialization
 *
 * No fake business data is generated here.
 * ============================================================
 */

(function () {
  "use strict";

  /* ==========================================================
     CONFIGURATION
  ========================================================== */

  const App = {

    initialized: false,

    allBusinesses: [],

    filteredBusinesses: [],

    userLocation: null,

    nearbyMode: false,

    currentPage: 1,

    pageSize: 12,

    totalPages: 1,

    apiLoading: false,

    locationLoading: false,

    lastError: null

  };


  /* ==========================================================
     DOM HELPERS
  ========================================================== */

  function $(id) {
    return document.getElementById(id);
  }


  function getElement() {
    for (let i = 0; i < arguments.length; i++) {

      const element = $(arguments[i]);

      if (element) {
        return element;
      }

    }

    return null;
  }


  /* ==========================================================
     CONFIG HELPERS
  ========================================================== */

  function getConfig() {

    return window.NearAfricaConfig || {};

  }


  function getApiBaseUrl() {

    const config = getConfig();

    const base =
      config.api &&
      config.api.baseUrl
        ? config.api.baseUrl
        : "https://nearafrica-api.nearafrica-onyxtech.workers.dev";

    return String(base).replace(/\/+$/, "");

  }


  function getEndpoint(name, fallback) {

    const config = getConfig();

    if (
      config.api &&
      config.api.endpoints &&
      config.api.endpoints[name]
    ) {

      return String(
        config.api.endpoints[name]
      ).replace(/^\/+/, "");

    }

    return fallback.replace(/^\/+/, "");

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
      String(path || "").replace(/^\/+/, "")
    );

  }


  /* ==========================================================
     TEXT / DATA HELPERS
  ========================================================== */

  function cleanText(value, fallback) {

    if (
      value === null ||
      value === undefined
    ) {

      return fallback || "";

    }

    const text =
      String(value).trim();

    return text ||
      (fallback || "");

  }


  function toNumber(value) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {

      return null;

    }

    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : null;

  }


  function normalizeBoolean(value) {

    if (
      value === true ||
      value === 1 ||
      value === "1" ||
      value === "true"
    ) {

      return true;

    }

    return false;

  }


  function normalizeBusiness(raw) {

    if (!raw || typeof raw !== "object") {
      return null;
    }

    const business = {
      ...raw
    };

    business.id =
      cleanText(
        raw.id ||
        raw.business_id ||
        raw.businessId
      );

    business.business_name =
      cleanText(
        raw.business_name ||
        raw.name ||
        raw.businessName,
        "Unnamed business"
      );

    business.name =
      business.business_name;

    business.category =
      cleanText(
        raw.category,
        "Other"
      );

    business.subcategory =
      cleanText(
        raw.subcategory
      );

    business.country =
      cleanText(
        raw.country,
        "Nigeria"
      );

    business.state =
      cleanText(
        raw.state ||
        raw.region ||
        raw.state_region
      );

    business.city =
      cleanText(
        raw.city ||
        raw.town ||
        raw.area
      );

    business.address =
      cleanText(
        raw.address
      );

    business.description =
      cleanText(
        raw.description
      );

    business.website =
      cleanText(
        raw.website ||
        raw.website_url
      );

    business.phone =
      cleanText(
        raw.phone ||
        raw.contact_phone
      );

    business.whatsapp =
      cleanText(
        raw.whatsapp ||
        raw.whatsapp_number
      );

    business.email =
      cleanText(
        raw.email ||
        raw.contact_email
      );

    business.latitude =
      toNumber(
        raw.latitude ||
        raw.lat
      );

    business.longitude =
      toNumber(
        raw.longitude ||
        raw.lng ||
        raw.lon
      );

    business.image_url =
      cleanText(
        raw.image_url ||
        raw.imageUrl ||
        raw.logo_url ||
        raw.logo
      );

    business.logo_url =
      cleanText(
        raw.logo_url ||
        raw.logo
      );

    business.slug =
      cleanText(
        raw.slug
      );

    business.verified =
      normalizeBoolean(
        raw.verified
      );

    business.claimed =
      normalizeBoolean(
        raw.claimed
      );

    business.featured =
      normalizeBoolean(
        raw.featured
      );

    business.views =
      toNumber(
        raw.views
      ) || 0;

    return business;

  }


  function normalizeBusinesses(items) {

    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map(normalizeBusiness)
      .filter(Boolean);

  }


  /* ==========================================================
     API RESPONSE HELPERS
  ========================================================== */

  function extractBusinesses(payload) {

    if (!payload) {
      return [];
    }

    if (Array.isArray(payload)) {
      return payload;
    }

    if (
      payload.businesses &&
      Array.isArray(payload.businesses)
    ) {

      return payload.businesses;

    }

    if (
      payload.data &&
      Array.isArray(payload.data)
    ) {

      return payload.data;

    }

    if (
      payload.data &&
      Array.isArray(payload.data.businesses)
    ) {

      return payload.data.businesses;

    }

    if (
      payload.data &&
      payload.data.data &&
      Array.isArray(payload.data.data.businesses)
    ) {

      return payload.data.data.businesses;

    }

    if (
      payload.results &&
      Array.isArray(payload.results)
    ) {

      return payload.results;

    }

    if (
      payload.data &&
      Array.isArray(payload.data.results)
    ) {

      return payload.data.results;

    }

    return [];

  }


  /* ==========================================================
     API LOAD
  ========================================================== */

  async function fetchBusinesses() {

    if (App.apiLoading) {
      return App.allBusinesses;
    }

    App.apiLoading = true;

    setStatus(
      "loading",
      "Loading businesses..."
    );

    try {

      const endpoint =
        getEndpoint(
          "businesses",
          "businesses"
        );

      const url =
        buildApiUrl(endpoint);

      const response =
        await fetch(
          url,
          {
            method: "GET",
            headers: {
              Accept: "application/json"
            },
            cache: "no-store"
          }
        );

      let payload = null;

      try {
        payload =
          await response.json();
      } catch (jsonError) {
        payload = null;
      }

      if (!response.ok) {

        const message =
          payload &&
          (
            payload.message ||
            payload.error
          )
            ? (
                payload.message ||
                payload.error
              )
            : "Unable to load businesses.";

        throw new Error(
          message +
          " (" +
          response.status +
          ")"
        );

      }

      const businesses =
        normalizeBusinesses(
          extractBusinesses(payload)
        );

      App.allBusinesses =
        businesses;

      App.lastError =
        null;

      return businesses;

    } catch (error) {

      console.error(
        "NearAfrica business loading error:",
        error
      );

      App.lastError =
        error;

      App.allBusinesses = [];

      throw error;

    } finally {

      App.apiLoading = false;

    }

  }


  /* ==========================================================
     SEARCH / FILTER VALUE HELPERS
  ========================================================== */

  function getSearchValue() {

    const input =
      $("searchInput");

    return input
      ? cleanText(input.value)
      : "";

  }


  function getCategoryValue() {

    const select =
      $("categoryFilter");

    return select
      ? cleanText(select.value)
      : "";

  }


  function getCountryValue() {

    const select =
      $("countryFilter");

    return select
      ? cleanText(select.value, "Nigeria")
      : "Nigeria";

  }


  function getStateValue() {

    const select =
      $("stateFilter");

    return select
      ? cleanText(select.value)
      : "";

  }


  function getCityValue() {

    const select =
      $("cityFilter");

    return select
      ? cleanText(select.value)
      : "";

  }


  function getSortValue() {

    const select =
      $("sortFilter");

    return select
      ? cleanText(select.value, "default")
      : "default";

  }


  function getRadiusValue() {

    const select =
      $("radiusFilter");

    const value =
      select
        ? Number(select.value)
        : 25;

    return Number.isFinite(value)
      ? value
      : 25;

  }


  /* ==========================================================
     STRING MATCHING
  ========================================================== */

  function normalizeSearchText(value) {

    return cleanText(value)
      .toLowerCase()
      .replace(/\s+/g, " ");

  }


  function businessMatchesSearch(
    business,
    search
  ) {

    if (!search) {
      return true;
    }

    const query =
      normalizeSearchText(search);

    const fields = [
      business.business_name,
      business.category,
      business.subcategory,
      business.country,
      business.state,
      business.city,
      business.address,
      business.description
    ];

    return fields.some(function (field) {

      return normalizeSearchText(field)
        .includes(query);

    });

  }


  function valuesMatch(
    businessValue,
    selectedValue
  ) {

    if (!selectedValue) {
      return true;
    }

    return (
      normalizeSearchText(
        businessValue
      ) ===
      normalizeSearchText(
        selectedValue
      )
    );

  }


  /* ==========================================================
     DISTANCE
  ========================================================== */

  function calculateDistanceKm(
    latitude1,
    longitude1,
    latitude2,
    longitude2
  ) {

    const lat1 =
      Number(latitude1);

    const lon1 =
      Number(longitude1);

    const lat2 =
      Number(latitude2);

    const lon2 =
      Number(longitude2);

    if (
      !Number.isFinite(lat1) ||
      !Number.isFinite(lon1) ||
      !Number.isFinite(lat2) ||
      !Number.isFinite(lon2)
    ) {

      return null;

    }

    const earthRadiusKm =
      6371;

    const degreesToRadians =
      Math.PI / 180;

    const deltaLat =
      (lat2 - lat1) *
      degreesToRadians;

    const deltaLon =
      (lon2 - lon1) *
      degreesToRadians;

    const a =
      Math.sin(deltaLat / 2) *
        Math.sin(deltaLat / 2) +
      Math.cos(
        lat1 *
        degreesToRadians
      ) *
        Math.cos(
          lat2 *
          degreesToRadians
        ) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return earthRadiusKm * c;

  }


  function addDistances(
    businesses
  ) {

    if (!App.userLocation) {

      return businesses.map(
        function (business) {

          return {
            ...business,
            distance: null
          };

        }
      );

    }

    return businesses.map(
      function (business) {

        const distance =
          calculateDistanceKm(
            App.userLocation.latitude,
            App.userLocation.longitude,
            business.latitude,
            business.longitude
          );

        return {
          ...business,
          distance
        };

      }
    );

  }


  function formatDistance(distance) {

    if (
      distance === null ||
      distance === undefined ||
      !Number.isFinite(
        Number(distance)
      )
    ) {

      return "";

    }

    const value =
      Number(distance);

    if (value < 1) {

      return Math.round(
        value * 1000
      ) + " m away";

    }

    if (value < 10) {

      return value.toFixed(1) +
        " km away";

    }

    return Math.round(value) +
      " km away";

  }


  /* ==========================================================
     FILTERING
  ========================================================== */

  function filterBusinesses() {

    const search =
      getSearchValue();

    const category =
      getCategoryValue();

    const country =
      getCountryValue();

    const state =
      getStateValue();

    const city =
      getCityValue();

    let businesses =
      App.allBusinesses.slice();

    /*
     * Country
     */

    businesses =
      businesses.filter(
        function (business) {

          return valuesMatch(
            business.country,
            country
          );

        }
      );


    /*
     * Search
     */

    businesses =
      businesses.filter(
        function (business) {

          return businessMatchesSearch(
            business,
            search
          );

        }
      );


    /*
     * Category
     */

    businesses =
      businesses.filter(
        function (business) {

          return valuesMatch(
            business.category,
            category
          );

        }
      );


    /*
     * State
     */

    businesses =
      businesses.filter(
        function (business) {

          return valuesMatch(
            business.state,
            state
          );

        }
      );


    /*
     * City
     */

    businesses =
      businesses.filter(
        function (business) {

          return valuesMatch(
            business.city,
            city
          );

        }
      );


    /*
     * Add user distance.
     */

    businesses =
      addDistances(
        businesses
      );


    /*
     * Nearby mode.
     *
     * Businesses without coordinates are excluded
     * when the user explicitly searches nearby.
     */

    if (App.nearbyMode) {

      const radiusKm =
        getRadiusValue();

      businesses =
        businesses.filter(
          function (business) {

            return (
              business.distance !== null &&
              business.distance <= radiusKm
            );

          }
        );

    }


    /*
     * Sorting
     */

    const sort =
      getSortValue();

    if (
      sort === "nearest" ||
      App.nearbyMode
    ) {

      businesses.sort(
        function (a, b) {

          const distanceA =
            a.distance === null
              ? Number.POSITIVE_INFINITY
              : a.distance;

          const distanceB =
            b.distance === null
              ? Number.POSITIVE_INFINITY
              : b.distance;

          if (
            distanceA !==
            distanceB
          ) {

            return (
              distanceA -
              distanceB
            );

          }

          return (
            a.business_name.localeCompare(
              b.business_name
            )
          );

        }
      );

    } else if (
      sort === "name"
    ) {

      businesses.sort(
        function (a, b) {

          return a.business_name.localeCompare(
            b.business_name
          );

        }
      );

    } else {

      /*
       * Recommended:
       * Featured first, then verified,
       * then name.
       */

      businesses.sort(
        function (a, b) {

          if (
            a.featured !==
            b.featured
          ) {

            return a.featured
              ? -1
              : 1;

          }

          if (
            a.verified !==
            b.verified
          ) {

            return a.verified
              ? -1
              : 1;

          }

          return a.business_name.localeCompare(
            b.business_name
          );

        }
      );

    }

    App.filteredBusinesses =
      businesses;

    App.totalPages =
      Math.max(
        1,
        Math.ceil(
          businesses.length /
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

    renderResults();

  }


  /* ==========================================================
     RESULTS RENDERING
  ========================================================== */

  function renderResults() {

    const list =
      $("business-list");

    if (!list) {
      return;
    }

    const count =
      $("resultCount");

    const emptyState =
      getElement(
        "emptyState",
        "empty-state"
      );

    const businesses =
      App.filteredBusinesses;

    const start =
      (
        App.currentPage -
        1
      ) *
      App.pageSize;

    const pageItems =
      businesses.slice(
        start,
        start +
        App.pageSize
      );

    list.innerHTML = "";

    if (count) {

      count.textContent =
        businesses.length +
        (
          businesses.length === 1
            ? " business found"
            : " businesses found"
        );

    }


    updateNearbyIndicator();


    if (!businesses.length) {

      if (emptyState) {

        emptyState.classList.add(
          "visible"
        );

      }

      hideStatus();

      renderPagination();

      return;

    }


    if (emptyState) {

      emptyState.classList.remove(
        "visible"
      );

    }


    hideStatus();


    pageItems.forEach(
      function (business) {

        list.appendChild(
          createBusinessCard(
            business
          )
        );

      }
    );


    renderPagination();

  }


  /* ==========================================================
     BUSINESS CARD
  ========================================================== */

  function createBusinessCard(
    business
  ) {

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "business-card";


    const detailUrl =
      buildBusinessUrl(
        business
      );


    const image =
      business.image_url ||
      business.logo_url;


    const imageHtml =
      image
        ? `
          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(
              business.business_name
            )}"
            loading="lazy"
            onerror="this.style.display='none';"
          >
        `
        : `
          <span aria-hidden="true">
            ${escapeHtml(
              getBusinessInitial(
                business.business_name
              )
            )}
          </span>
        `;


    const verifiedBadge =
      business.verified
        ? `
          <span class="badge verified">
            ✓ Verified
          </span>
        `
        : "";


    const claimedBadge =
      business.claimed
        ? `
          <span class="badge claimed">
            ✓ Claimed
          </span>
        `
        : "";


    const distanceBadge =
      business.distance !== null &&
      business.distance !== undefined
        ? `
          <span class="badge distance-badge">
            📍 ${escapeHtml(
              formatDistance(
                business.distance
              )
            )}
          </span>
        `
        : "";


    const locationParts =
      [
        business.city,
        business.state
      ].filter(Boolean);


    const location =
      locationParts.length
        ? locationParts.join(", ")
        : business.country;


    const description =
      business.description ||
      "Discover this business on NearAfrica.";


    card.innerHTML = `

      <div class="business-image">
        ${imageHtml}
      </div>

      <div class="business-content">

        <span class="business-category">
          ${escapeHtml(
            business.category
          )}
        </span>

        <h3 class="business-name">
          ${escapeHtml(
            business.business_name
          )}
        </h3>

        <div class="business-location">
          📍 ${escapeHtml(
            location
          )}
        </div>

        <div class="business-description">
          ${escapeHtml(
            description
          )}
        </div>

        <div class="business-meta">
          ${verifiedBadge}
          ${claimedBadge}
          ${distanceBadge}
        </div>

        <div class="business-actions">

          <a
            href="${escapeHtml(detailUrl)}"
            class="business-action primary"
          >
            View Business
          </a>

          ${
            business.phone
              ? `
                <a
                  href="tel:${escapeHtml(
                    business.phone
                  )}"
                  class="business-action"
                >
                  Call
                </a>
              `
              : ""
          }

        </div>

      </div>

    `;

    return card;

  }


  function getBusinessInitial(name) {

    const text =
      cleanText(
        name,
        "N"
      );

    return text
      .charAt(0)
      .toUpperCase();

  }


  function buildBusinessUrl(
    business
  ) {

    if (business.slug) {

      return (
        "business.html?slug=" +
        encodeURIComponent(
          business.slug
        )
      );

    }

    if (business.id) {

      return (
        "business.html?id=" +
        encodeURIComponent(
          business.id
        )
      );

    }

    return "explore.html";

  }


  /* ==========================================================
     HTML ESCAPING
  ========================================================== */

  function escapeHtml(value) {

    const text =
      cleanText(value);

    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  /* ==========================================================
     PAGINATION
  ========================================================== */

  function renderPagination() {

    const pagination =
      $("pagination");

    if (!pagination) {
      return;
    }

    pagination.innerHTML = "";

    if (
      App.totalPages <= 1
    ) {

      return;

    }


    const previous =
      document.createElement(
        "button"
      );

    previous.type =
      "button";

    previous.textContent =
      "←";

    previous.disabled =
      App.currentPage <= 1;

    previous.addEventListener(
      "click",
      function () {

        if (
          App.currentPage > 1
        ) {

          App.currentPage--;

          renderResults();

          scrollToResults();

        }

      }
    );

    pagination.appendChild(
      previous
    );


    const maxButtons = 7;

    let startPage =
      Math.max(
        1,
        App.currentPage -
        Math.floor(
          maxButtons / 2
        )
      );

    let endPage =
      Math.min(
        App.totalPages,
        startPage +
        maxButtons -
        1
      );


    if (
      endPage -
      startPage +
      1 <
      maxButtons
    ) {

      startPage =
        Math.max(
          1,
          endPage -
          maxButtons +
          1
        );

    }


    for (
      let page = startPage;
      page <= endPage;
      page++
    ) {

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.textContent =
        String(page);

      if (
        page ===
        App.currentPage
      ) {

        button.classList.add(
          "active"
        );

      }

      button.addEventListener(
        "click",
        function () {

          App.currentPage =
            page;

          renderResults();

          scrollToResults();

        }
      );

      pagination.appendChild(
        button
      );

    }


    const next =
      document.createElement(
        "button"
      );

    next.type =
      "button";

    next.textContent =
      "→";

    next.disabled =
      App.currentPage >=
      App.totalPages;

    next.addEventListener(
      "click",
      function () {

        if (
          App.currentPage <
          App.totalPages
        ) {

          App.currentPage++;

          renderResults();

          scrollToResults();

        }

      }
    );

    pagination.appendChild(
      next
    );

  }


  function scrollToResults() {

    const section =
      $("business-results");

    if (!section) {
      return;
    }

    window.scrollTo({
      top:
        Math.max(
          0,
          section.getBoundingClientRect().top +
          window.scrollY -
          90
        ),
      behavior: "smooth"
    });

  }


  /* ==========================================================
     STATUS
  ========================================================== */

  function setStatus(
    type,
    message
  ) {

    const status =
      getElement(
        "statusMessage",
        "status"
      );

    const legacy =
      $("status");

    if (!status) {
      return;
    }

    status.className =
      "status " +
      cleanText(type);

    status.textContent =
      cleanText(message);

    if (
      legacy &&
      legacy !== status
    ) {

      legacy.className =
        status.className;

      legacy.textContent =
        status.textContent;

    }

  }


  function hideStatus() {

    const status =
      $("statusMessage");

    const legacy =
      $("status");

    if (status) {

      status.className =
        "status";

      status.textContent =
        "";

    }

    if (
      legacy &&
      legacy !== status
    ) {

      legacy.className =
        "status";

      legacy.textContent =
        "";

    }

  }


  /* ==========================================================
     EMPTY STATE
  ========================================================== */

  function showEmptyState(
    message
  ) {

    const empty =
      $("emptyState");

    if (!empty) {
      return;
    }

    const paragraph =
      empty.querySelector(
        "p"
      );

    if (paragraph) {

      paragraph.textContent =
        message ||
        "Try a different search, category, state, city, or location.";

    }

    empty.classList.add(
      "visible"
    );

  }


  /* ==========================================================
     NEARBY INDICATOR
  ========================================================== */

  function updateNearbyIndicator() {

    const indicator =
      $("nearbyIndicator");

    if (!indicator) {
      return;
    }

    if (
      App.nearbyMode &&
      App.userLocation
    ) {

      indicator.classList.add(
        "visible"
      );

      indicator.textContent =
        "📍 Nearby businesses";

    } else {

      indicator.classList.remove(
        "visible"
      );

    }

  }


  /* ==========================================================
     LOCATION UI
  ========================================================== */

  function updateLocationStatus(
    message,
    type
  ) {

    const element =
      $("locationStatus");

    if (!element) {
      return;
    }

    element.textContent =
      message || "";

    element.className =
      "explore-location-status";

    if (type) {

      element.classList.add(
        type
      );

    }

  }


  function updateLocationButtons() {

    const useButton =
      $("useLocationButton");

    const clearButton =
      $("clearLocationButton");

    if (useButton) {

      useButton.disabled =
        App.locationLoading;

      if (
        App.locationLoading
      ) {

        useButton.textContent =
          "📍 Finding you...";

      }

    }

    if (clearButton) {

      clearButton.hidden =
        !App.userLocation;

    }

  }


  /* ==========================================================
     BROWSER LOCATION
  ========================================================== */

  function getBrowserLocation() {

    return new Promise(
      function (resolve, reject) {

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
          function (position) {

            const latitude =
              Number(
                position.coords.latitude
              );

            const longitude =
              Number(
                position.coords.longitude
              );

            if (
              !Number.isFinite(latitude) ||
              !Number.isFinite(longitude)
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
                Number(
                  position.coords.accuracy
                ) || null
            });

          },
          function (error) {

            let message =
              "Unable to get your location.";

            if (
              error &&
              error.code === 1
            ) {

              message =
                "Location permission was denied.";

            } else if (
              error &&
              error.code === 2
            ) {

              message =
                "Your location could not be determined.";

            } else if (
              error &&
              error.code === 3
            ) {

              message =
                "Location request timed out.";

            }

            reject(
              new Error(message)
            );

          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000
          }
        );

      }
    );

  }


  async function enableNearbyLocation() {

    if (
      App.locationLoading
    ) {

      return;

    }

    App.locationLoading =
      true;

    App.nearbyMode =
      true;

    updateLocationButtons();

    updateLocationStatus(
      "Requesting your location...",
      ""
    );

    try {

      const location =
        await getBrowserLocation();

      App.userLocation =
        location;

      /*
       * Store only in sessionStorage.
       * This disappears when the browsing session ends.
       */

      try {

        sessionStorage.setItem(
          "nearafrica_user_location",
          JSON.stringify({
            latitude:
              location.latitude,
            longitude:
              location.longitude
          })
        );

      } catch (storageError) {
        /* Storage is optional. */
      }


      updateLocationStatus(
        "Using your current location.",
        "success"
      );

      updateLocationButtons();

      App.currentPage =
        1;

      filterBusinesses();

    } catch (error) {

      console.error(
        "NearAfrica location error:",
        error
      );

      App.userLocation =
        null;

      App.nearbyMode =
        false;

      updateLocationStatus(
        error.message ||
        "Unable to use your location.",
        "error"
      );

      updateLocationButtons();

      filterBusinesses();

    } finally {

      App.locationLoading =
        false;

      updateLocationButtons();

      const useButton =
        $("useLocationButton");

      if (
        useButton &&
        !App.locationLoading
      ) {

        useButton.textContent =
          "📍 Use My Location";

      }

    }

  }


  function clearNearbyLocation() {

    App.userLocation =
      null;

    App.nearbyMode =
      false;

    try {

      sessionStorage.removeItem(
        "nearafrica_user_location"
      );

    } catch (error) {
      /* Ignore storage errors. */
    }

    updateLocationStatus(
      "Search by area or use your current location.",
      ""
    );

    updateLocationButtons();

    filterBusinesses();

  }


  function restoreStoredLocation() {

    try {

      const raw =
        sessionStorage.getItem(
          "nearafrica_user_location"
        );

      if (!raw) {
        return false;
      }

      const parsed =
        JSON.parse(raw);

      const latitude =
        Number(
          parsed.latitude
        );

      const longitude =
        Number(
          parsed.longitude
        );

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {

        return false;

      }

      App.userLocation = {
        latitude,
        longitude
      };

      return true;

    } catch (error) {

      return false;

    }

  }


  /* ==========================================================
     URL PARAMETERS
  ========================================================== */

  function readUrlParameters() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    return {

      search:
        cleanText(
          params.get("q") ||
          params.get("search")
        ),

      category:
        cleanText(
          params.get("category")
        ),

      country:
        cleanText(
          params.get("country"),
          "Nigeria"
        ),

      state:
        cleanText(
          params.get("state")
        ),

      city:
        cleanText(
          params.get("city")
        ),

      nearby:
        params.get("nearby") === "1" ||
        params.get("nearby") === "true",

      radius:
        Number(
          params.get("radius")
        ) || null

    };

  }


  function syncUrlFromFilters() {

    const url =
      new URL(
        window.location.href
      );

    const search =
      getSearchValue();

    const category =
      getCategoryValue();

    const country =
      getCountryValue();

    const state =
      getStateValue();

    const city =
      getCityValue();

    if (search) {

      url.searchParams.set(
        "search",
        search
      );

    } else {

      url.searchParams.delete(
        "search"
      );

    }

    if (category) {

      url.searchParams.set(
        "category",
        category
      );

    } else {

      url.searchParams.delete(
        "category"
      );

    }

    if (country) {

      url.searchParams.set(
        "country",
        country
      );

    } else {

      url.searchParams.delete(
        "country"
      );

    }

    if (state) {

      url.searchParams.set(
        "state",
        state
      );

    } else {

      url.searchParams.delete(
        "state"
      );

    }

    if (city) {

      url.searchParams.set(
        "city",
        city
      );

    } else {

      url.searchParams.delete(
        "city"
      );

    }

    if (App.nearbyMode) {

      url.searchParams.set(
        "nearby",
        "1"
      );

      url.searchParams.set(
        "radius",
        String(
          getRadiusValue()
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

  }


  /* ==========================================================
     APPLY URL PARAMETERS TO UI
  ========================================================== */

  function applyUrlParameters() {

    const params =
      readUrlParameters();


    const searchInput =
      $("searchInput");

    if (
      searchInput &&
      params.search
    ) {

      searchInput.value =
        params.search;

    }


    const categoryFilter =
      $("categoryFilter");

    if (
      categoryFilter &&
      params.category
    ) {

      /*
       * Only set the option if it exists.
       */

      const optionExists =
        Array.from(
          categoryFilter.options
        ).some(
          function (option) {

            return (
              option.value ===
              params.category
            );

          }
        );

      if (optionExists) {

        categoryFilter.value =
          params.category;

      }

    }


    const countryFilter =
      $("countryFilter");

    const countryFilterSecondary =
      $("countryFilterSecondary");

    if (countryFilter) {

      countryFilter.value =
        "Nigeria";

    }

    if (countryFilterSecondary) {

      countryFilterSecondary.value =
        "Nigeria";

    }


    const stateFilter =
      $("stateFilter");

    const cityFilter =
      $("cityFilter");


    if (
      stateFilter &&
      params.state
    ) {

      const stateExists =
        Array.from(
          stateFilter.options
        ).some(
          function (option) {

            return (
              option.value ===
              params.state
            );

          }
        );

      if (stateExists) {

        stateFilter.value =
          params.state;

        populateCitiesForState(
          params.state
        );

      }

    }


    if (
      cityFilter &&
      params.city
    ) {

      const cityExists =
        Array.from(
          cityFilter.options
        ).some(
          function (option) {

            return (
              option.value ===
              params.city
            );

          }
        );

      if (cityExists) {

        cityFilter.value =
          params.city;

      }

    }


    const radiusFilter =
      $("radiusFilter");

    if (
      radiusFilter &&
      params.radius
    ) {

      const radiusExists =
        Array.from(
          radiusFilter.options
        ).some(
          function (option) {

            return (
              Number(option.value) ===
              Number(params.radius)
            );

          }
        );

      if (radiusExists) {

        radiusFilter.value =
          String(
            params.radius
          );

      }

    }


    if (params.nearby) {

      App.nearbyMode =
        true;

      restoreStoredLocation();

      if (App.userLocation) {

        updateLocationStatus(
          "Using your current location.",
          "success"
        );

      }

    }

  }


  /* ==========================================================
     NIGERIA STATE / CITY SUPPORT
  ========================================================== */

  function populateStates() {

    const stateFilter =
      $("stateFilter");

    if (!stateFilter) {
      return;
    }

    const locations =
      window.NearAfricaNigeriaLocations ||
      {};

    /*
     * Preserve the first "All states / FCT" option.
     */

    stateFilter.innerHTML = "";

    const all =
      document.createElement(
        "option"
      );

    all.value =
      "";

    all.textContent =
      "All states / FCT";

    stateFilter.appendChild(
      all
    );


    Object.keys(
      locations
    ).forEach(
      function (state) {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          state;

        option.textContent =
          state;

        stateFilter.appendChild(
          option
        );

      }
    );

  }


  function populateCitiesForState(
    state
  ) {

    const cityFilter =
      $("cityFilter");

    if (!cityFilter) {
      return;
    }

    cityFilter.innerHTML = "";


    if (!state) {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        "";

      option.textContent =
        "Select a state first";

      cityFilter.appendChild(
        option
      );

      cityFilter.disabled =
        true;

      return;

    }


    const locations =
      window.NearAfricaNigeriaLocations ||
      {};

    const cities =
      Array.isArray(
        locations[state]
      )
        ? locations[state]
        : [];


    const all =
      document.createElement(
        "option"
      );

    all.value =
      "";

    all.textContent =
      "All cities / areas";

    cityFilter.appendChild(
      all
    );


    cities.forEach(
      function (city) {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          city;

        option.textContent =
          city;

        cityFilter.appendChild(
          option
        );

      }
    );


    /*
     * Also add cities found in the real API
     * for this state, without duplicates.
     *
     * This allows the location list to grow as
     * NearAfrica's real database grows.
     */

    const existing =
      new Set(
        cities.map(
          function (city) {

            return normalizeSearchText(
              city
            );

          }
        )
      );


    App.allBusinesses
      .filter(
        function (business) {

          return valuesMatch(
            business.state,
            state
          );

        }
      )
      .map(
        function (business) {

          return cleanText(
            business.city
          );

        }
      )
      .filter(Boolean)
      .forEach(
        function (city) {

          const key =
            normalizeSearchText(
              city
            );

          if (
            !existing.has(key)
          ) {

            existing.add(key);

            const option =
              document.createElement(
                "option"
              );

            option.value =
              city;

            option.textContent =
              city;

            cityFilter.appendChild(
              option
            );

          }

        }
      );


    cityFilter.disabled =
      false;

  }


  /* ==========================================================
     EVENT HANDLERS
  ========================================================== */

  function setupSearch() {

    const searchButton =
      $("searchButton");

    const searchInput =
      $("searchInput");


    if (searchButton) {

      searchButton.addEventListener(
        "click",
        function () {

          App.currentPage =
            1;

          syncUrlFromFilters();

          filterBusinesses();

          scrollToResults();

        }
      );

    }


    if (searchInput) {

      searchInput.addEventListener(
        "keydown",
        function (event) {

          if (
            event.key ===
            "Enter"
          ) {

            event.preventDefault();

            App.currentPage =
              1;

            syncUrlFromFilters();

            filterBusinesses();

            scrollToResults();

          }

        }
      );

      /*
       * Live filtering while typing,
       * with a small debounce.
       */

      let timer = null;

      searchInput.addEventListener(
        "input",
        function () {

          clearTimeout(timer);

          timer =
            setTimeout(
              function () {

                App.currentPage =
                  1;

                syncUrlFromFilters();

                filterBusinesses();

              },
              250
            );

        }
      );

    }

  }


  function setupFilters() {

    const categoryFilter =
      $("categoryFilter");

    const countryFilter =
      $("countryFilter");

    const countryFilterSecondary =
      $("countryFilterSecondary");

    const stateFilter =
      $("stateFilter");

    const cityFilter =
      $("cityFilter");

    const sortFilter =
      $("sortFilter");

    const radiusFilter =
      $("radiusFilter");


    if (categoryFilter) {

      categoryFilter.addEventListener(
        "change",
        function () {

          App.currentPage =
            1;

          syncUrlFromFilters();

          filterBusinesses();

        }
      );

    }


    if (countryFilter) {

      countryFilter.addEventListener(
        "change",
        function () {

          /*
           * NearAfrica is Nigeria-first for now.
           */

          countryFilter.value =
            "Nigeria";

          if (
            countryFilterSecondary
          ) {

            countryFilterSecondary.value =
              "Nigeria";

          }

          App.currentPage =
            1;

          syncUrlFromFilters();

          filterBusinesses();

        }
      );

    }


    if (
      countryFilterSecondary
    ) {

      countryFilterSecondary.addEventListener(
        "change",
        function () {

          countryFilterSecondary.value =
            "Nigeria";

          if (
            countryFilter
          ) {

            countryFilter.value =
              "Nigeria";

          }

          App.currentPage =
            1;

          syncUrlFromFilters();

          filterBusinesses();

        }
      );

    }


    if (stateFilter) {

      stateFilter.addEventListener(
        "change",
        function () {

          populateCitiesForState(
            stateFilter.value
          );

          /*
           * Reset city whenever state changes.
           */

          if (cityFilter) {

            cityFilter.value =
              "";

          }

          App.currentPage =
            1;

          syncUrlFromFilters();

          filterBusinesses();

        }
      );

    }


    if (cityFilter) {

      cityFilter.addEventListener(
        "change",
        function () {

          App.currentPage =
            1;

          syncUrlFromFilters();

          filterBusinesses();

        }
      );

    }


    if (sortFilter) {

      sortFilter.addEventListener(
        "change",
        function () {

          App.currentPage =
            1;

          filterBusinesses();

        }
      );

    }


    if (radiusFilter) {

      radiusFilter.addEventListener(
        "change",
        function () {

          if (
            App.nearbyMode
          ) {

            App.currentPage =
              1;

            syncUrlFromFilters();

            filterBusinesses();

          }

        }
      );

    }

  }


  function setupLocationButtons() {

    const useButton =
      $("useLocationButton");

    const clearButton =
      $("clearLocationButton");


    if (useButton) {

      useButton.addEventListener(
        "click",
        function () {

          enableNearbyLocation();

        }
      );

    }


    if (clearButton) {

      clearButton.addEventListener(
        "click",
        function () {

          clearNearbyLocation();

        }
      );

    }

  }


  /* ==========================================================
     LOCATION CHANGE EVENT
  ========================================================== */

  function setupLocationChangeEvent() {

    window.addEventListener(
      "nearafrica:locationchange",
      function (event) {

        const detail =
          event &&
          event.detail
            ? event.detail
            : {};


        const stateFilter =
          $("stateFilter");

        const cityFilter =
          $("cityFilter");


        if (
          stateFilter &&
          detail.state !== undefined
        ) {

          stateFilter.value =
            detail.state || "";

          populateCitiesForState(
            detail.state || ""
          );

        }


        if (
          cityFilter &&
          detail.city !== undefined
        ) {

          const city =
            detail.city || "";

          const exists =
            Array.from(
              cityFilter.options
            ).some(
              function (option) {

                return (
                  option.value ===
                  city
                );

              }
            );

          if (exists) {

            cityFilter.value =
              city;

          }

        }


        App.currentPage =
          1;

        syncUrlFromFilters();

        filterBusinesses();

      }
    );

  }


  /* ==========================================================
     MOBILE NAV
  ========================================================== */

  function setupMobileNavigation() {

    const button =
      $("mobileMenuButton");

    const nav =
      $("mobileNav");

    if (
      !button ||
      !nav
    ) {

      return;

    }


    /*
     * Avoid duplicate listeners if the HTML
     * already initialized this element.
     */

    if (
      button.dataset.naMobileReady ===
      "1"
    ) {

      return;

    }

    button.dataset.naMobileReady =
      "1";


    button.addEventListener(
      "click",
      function () {

        const open =
          nav.classList.toggle(
            "open"
          );

        button.setAttribute(
          "aria-expanded",
          String(open)
        );

      }
    );


    nav
      .querySelectorAll("a")
      .forEach(
        function (link) {

          link.addEventListener(
            "click",
            function () {

              nav.classList.remove(
                "open"
              );

              button.setAttribute(
                "aria-expanded",
                "false"
              );

            }
          );

        }
      );

  }


  /* ==========================================================
     LOAD / INITIALIZE
  ========================================================== */

  async function initializeExplorePage() {

    /*
     * Only initialize business discovery when
     * the Explore results container exists.
     *
     * This prevents app.js from unnecessarily
     * loading the API on the homepage.
     */

    const businessList =
      $("business-list");

    if (!businessList) {

      return;

    }


    if (App.initialized) {

      return;

    }

    App.initialized =
      true;


    try {

      /*
       * Build the Nigeria state list first.
       */

      populateStates();


      /*
       * Apply URL values after states exist.
       */

      applyUrlParameters();


      /*
       * Restore location if the URL requests nearby.
       */

      if (
        App.nearbyMode &&
        !App.userLocation
      ) {

        restoreStoredLocation();

      }


      setupSearch();

      setupFilters();

      setupLocationButtons();

      setupLocationChangeEvent();

      setupMobileNavigation();


      /*
       * Load real businesses.
       */

      await fetchBusinesses();


      /*
       * Rebuild city options using actual API
       * locations in addition to the base dataset.
       */

      const state =
        getStateValue();

      if (state) {

        const selectedCity =
          getCityValue();

        populateCitiesForState(
          state
        );

        const cityFilter =
          $("cityFilter");

        if (
          cityFilter &&
          selectedCity
        ) {

          const exists =
            Array.from(
              cityFilter.options
            ).some(
              function (option) {

                return (
                  option.value ===
                  selectedCity
                );

              }
            );

          if (exists) {

            cityFilter.value =
              selectedCity;

          }

        }

      }


      /*
       * If nearby was requested but we do not
       * have a saved location, don't silently
       * pretend it is active.
       */

      if (
        App.nearbyMode &&
        !App.userLocation
      ) {

        App.nearbyMode =
          false;

        updateLocationStatus(
          "Use My Location to find businesses near you.",
          ""
        );

      }


      updateLocationButtons();

      filterBusinesses();


    } catch (error) {

      console.error(
        "NearAfrica Explore initialization failed:",
        error
      );

      setStatus(
        "error",
        error.message ||
        "Unable to load businesses."
      );

      showEmptyState(
        "Unable to load businesses right now. Please try again."
      );

      updateLocationButtons();

    }

  }


  /* ==========================================================
     PUBLIC API
  ========================================================== */

  window.NearAfricaApp = {

    getState:
      function () {

        return {
          allBusinesses:
            App.allBusinesses.slice(),

          filteredBusinesses:
            App.filteredBusinesses.slice(),

          userLocation:
            App.userLocation,

          nearbyMode:
            App.nearbyMode,

          currentPage:
            App.currentPage,

          totalPages:
            App.totalPages
        };

      },

    refresh:
      async function () {

        await fetchBusinesses();

        filterBusinesses();

      },

    search:
      function () {

        App.currentPage =
          1;

        syncUrlFromFilters();

        filterBusinesses();

      },

    useLocation:
      enableNearbyLocation,

    clearLocation:
      clearNearbyLocation,

    filter:
      filterBusinesses

  };


  /* ==========================================================
     DOM READY
  ========================================================== */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initializeExplorePage
    );

  } else {

    initializeExplorePage();

  }

})();
