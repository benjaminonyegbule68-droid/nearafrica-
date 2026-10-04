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
 * - Browser geolocation
 * - Location persistence
 * - Distance calculation
 * - Sorting
 * - Pagination
 * - Business cards
 * - Location permission handling
 * - URL parameter compatibility
 * - Mobile-safe initialization
 *
 * IMPORTANT:
 * - No fake businesses are generated.
 * - The API remains the source of truth.
 * - Homepage search redirects to Explore.
 * - Explore only initializes its business engine when
 *   the Explore results container exists.
 * - Browser location is used only for nearby calculations.
 * - Raw coordinates are never displayed in the UI.
 * ============================================================
 */

(function () {
  "use strict";


  /* ==========================================================
     APPLICATION STATE
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

    lastError: null,

    homepageInitialized: false
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
     CONFIGURATION
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

    return String(fallback || "")
      .replace(/^\/+/, "");
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
     TEXT / VALUE HELPERS
  ========================================================== */

  function cleanText(value, fallback) {
    if (
      value === null ||
      value === undefined
    ) {
      return fallback || "";
    }

    const text = String(value).trim();

    return text || (fallback || "");
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


  function normalizeBoolean(value) {
    if (
      value === true ||
      value === 1 ||
      value === "1" ||
      value === "true" ||
      value === "TRUE"
    ) {
      return true;
    }

    return false;
  }


  function normalizeSearchText(value) {
    return cleanText(value)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }


  /* ==========================================================
     BUSINESS NORMALIZATION
  ========================================================== */

  function normalizeBusiness(raw) {
    if (
      !raw ||
      typeof raw !== "object"
    ) {
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
        raw.businessName ||
        raw.name,
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
        raw.latitude ??
        raw.lat
      );

    business.longitude =
      toNumber(
        raw.longitude ??
        raw.lng ??
        raw.lon
      );

    business.logo_url =
      cleanText(
        raw.logo_url ||
        raw.logo ||
        raw.logoUrl
      );

    business.image_url =
      cleanText(
        raw.image_url ||
        raw.imageUrl ||
        raw.image ||
        business.logo_url
      );

    if (
      !business.image_url &&
      Array.isArray(raw.images) &&
      raw.images.length
    ) {
      const firstImage =
        raw.images[0];

      if (
        typeof firstImage === "string"
      ) {
        business.image_url =
          firstImage;

      } else if (
        firstImage &&
        typeof firstImage === "object"
      ) {
        business.image_url =
          cleanText(
            firstImage.image_url ||
            firstImage.imageUrl ||
            firstImage.url
          );
      }
    }

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

    business.rating =
      toNumber(
        raw.rating ||
        raw.average_rating ||
        raw.averageRating
      );

    business.review_count =
      toNumber(
        raw.review_count ||
        raw.reviewCount ||
        raw.reviews_count
      ) || 0;

    business.distance =
      null;

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
     API RESPONSE EXTRACTION
  ========================================================== */

  function extractBusinesses(payload) {
    if (!payload) {
      return [];
    }

    if (Array.isArray(payload)) {
      return payload;
    }

    if (
      Array.isArray(payload.businesses)
    ) {
      return payload.businesses;
    }

    if (
      Array.isArray(payload.results)
    ) {
      return payload.results;
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
      Array.isArray(payload.data.results)
    ) {
      return payload.data.results;
    }

    if (
      payload.data &&
      payload.data.data &&
      Array.isArray(
        payload.data.data.businesses
      )
    ) {
      return payload.data.data.businesses;
    }

    if (
      payload.data &&
      payload.data.data &&
      Array.isArray(
        payload.data.data.results
      )
    ) {
      return payload.data.data.results;
    }

    return [];
  }


  function extractApiMessage(payload) {
    if (!payload) {
      return "";
    }

    return cleanText(
      payload.message ||
      payload.error ||
      (
        payload.data &&
        payload.data.message
      ) ||
      (
        payload.data &&
        payload.data.error
      )
    );
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
              Accept:
                "application/json"
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
        const apiMessage =
          extractApiMessage(
            payload
          );

        throw new Error(
          apiMessage ||
          (
            "Unable to load businesses " +
            "(HTTP " +
            response.status +
            ")."
          )
        );
      }

      if (
        payload &&
        payload.status === "error"
      ) {
        throw new Error(
          extractApiMessage(
            payload
          ) ||
          "The NearAfrica API returned an error."
        );
      }

      const businesses =
        normalizeBusinesses(
          extractBusinesses(
            payload
          )
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

      App.allBusinesses =
        [];

      throw error;

    } finally {
      App.apiLoading =
        false;
    }
  }


  /* ==========================================================
     SEARCH / FILTER VALUES
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
      ? cleanText(
          select.value,
          "Nigeria"
        )
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
      ? cleanText(
          select.value,
          "default"
        )
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
     SEARCH MATCHING
  ========================================================== */

  function businessMatchesSearch(
    business,
    search
  ) {
    if (!search) {
      return true;
    }

    const query =
      normalizeSearchText(
        search
      );

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

    return fields.some(
      function (field) {
        return normalizeSearchText(
          field
        ).includes(query);
      }
    );
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

    const radians =
      Math.PI / 180;

    const deltaLat =
      (lat2 - lat1) *
      radians;

    const deltaLon =
      (lon2 - lon1) *
      radians;

    const a =
      Math.sin(deltaLat / 2) *
      Math.sin(deltaLat / 2) +
      Math.cos(
        lat1 * radians
      ) *
      Math.cos(
        lat2 * radians
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


  function formatDistance(
    distance
  ) {
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
      return (
        Math.round(
          value * 1000
        ) +
        " m away"
      );
    }

    if (value < 10) {
      return (
        value.toFixed(1) +
        " km away"
      );
    }

    return (
      Math.round(value) +
      " km away"
    );
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


    businesses =
      businesses.filter(
        function (business) {
          return valuesMatch(
            business.country,
            country
          );
        }
      );


    businesses =
      businesses.filter(
        function (business) {
          return businessMatchesSearch(
            business,
            search
          );
        }
      );


    businesses =
      businesses.filter(
        function (business) {
          return valuesMatch(
            business.category,
            category
          );
        }
      );


    businesses =
      businesses.filter(
        function (business) {
          return valuesMatch(
            business.state,
            state
          );
        }
      );


    businesses =
      businesses.filter(
        function (business) {
          return valuesMatch(
            business.city,
            city
          );
        }
      );


    businesses =
      addDistances(
        businesses
      );


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
              ? Infinity
              : a.distance;

          const distanceB =
            b.distance === null
              ? Infinity
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

          return a.business_name.localeCompare(
            b.business_name
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

    } else if (
      sort === "rating"
    ) {
      businesses.sort(
        function (a, b) {
          const ratingA =
            a.rating === null
              ? -1
              : a.rating;

          const ratingB =
            b.rating === null
              ? -1
              : b.rating;

          if (
            ratingA !==
            ratingB
          ) {
            return (
              ratingB -
              ratingA
            );
          }

          return a.business_name.localeCompare(
            b.business_name
          );
        }
      );

    } else {
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

          if (
            a.claimed !==
            b.claimed
          ) {
            return a.claimed
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
     RESULTS
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
      cleanText(
        business.logo_url ||
        business.image_url
      );


    let imageHtml = "";

    if (image) {
      imageHtml = `
        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(
            business.business_name
          )}"
          loading="lazy"
          onerror="
            this.style.display='none';
            if(this.nextElementSibling){
              this.nextElementSibling.style.display='flex';
            }
          "
        >
        <span
          class="business-image-fallback"
          aria-hidden="true"
          style="display:none;"
        >
          ${escapeHtml(
            getBusinessInitial(
              business.business_name
            )
          )}
        </span>
      `;
    } else {
      imageHtml = `
        <span
          class="business-image-fallback"
          aria-hidden="true"
        >
          ${escapeHtml(
            getBusinessInitial(
              business.business_name
            )
          )}
        </span>
      `;
    }


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


    const ratingBadge =
      business.rating !== null &&
      business.rating !== undefined
        ? `
          <span class="badge rating-badge">
            ★ ${escapeHtml(
              Number(
                business.rating
              ).toFixed(1)
            )}
          </span>
        `
        : "";


    const locationParts = [
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
          ${ratingBadge}
          ${distanceBadge}
        </div>

        <div class="business-actions">

          <a
            href="${escapeHtml(
              detailUrl
            )}"
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


  function getBusinessInitial(
    name
  ) {
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
    return cleanText(value)
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

    previous.setAttribute(
      "aria-label",
      "Previous page"
    );

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

      button.setAttribute(
        "aria-label",
        "Page " +
        page
      );

      if (
        page ===
        App.currentPage
      ) {
        button.classList.add(
          "active"
        );

        button.setAttribute(
          "aria-current",
          "page"
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

    next.setAttribute(
      "aria-label",
      "Next page"
    );

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
    const primary =
      $("statusMessage");

    const legacy =
      $("status");

    const text =
      cleanText(message);

    if (primary) {
      primary.className =
        "status " +
        cleanText(type);

      primary.textContent =
        text;
    }

    if (
      legacy &&
      legacy !== primary
    ) {
      legacy.className =
        "status " +
        cleanText(type);

      legacy.textContent =
        text;
    }
  }


  function hideStatus() {
    const primary =
      $("statusMessage");

    const legacy =
      $("status");

    if (primary) {
      primary.className =
        "status";

      primary.textContent =
        "";
    }

    if (
      legacy &&
      legacy !== primary
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
    const emptyStates = [
      $("emptyState"),
      $("empty-state")
    ].filter(Boolean);

    emptyStates.forEach(
      function (empty) {
        const paragraph =
          empty.querySelector("p");

        if (paragraph) {
          paragraph.textContent =
            message ||
            "Try a different search, category, state, city, or location.";
        }

        empty.classList.add(
          "visible"
        );
      }
    );
  }


  function hideEmptyState() {
    const emptyStates = [
      $("emptyState"),
      $("empty-state")
    ].filter(Boolean);

    emptyStates.forEach(
      function (empty) {
        empty.classList.remove(
          "visible"
        );
      }
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

      indicator.textContent =
        "";
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

      useButton.textContent =
        App.locationLoading
          ? "📍 Finding you..."
          : "📍 Use My Location";
    }


    if (clearButton) {
      clearButton.hidden =
        !App.userLocation;
    }
  }


  /* ==========================================================
     LOCATION VALIDATION
  ========================================================== */

  function isValidCoordinates(
    latitude,
    longitude
  ) {
    return (
      Number.isFinite(
        latitude
      ) &&
      Number.isFinite(
        longitude
      ) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }


  /* ==========================================================
     BROWSER LOCATION
  ========================================================== */

  function getBrowserLocation() {
    return new Promise(
      function (resolve, reject) {

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

          function (position) {

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
                position.coords.latitude
              );

            const longitude =
              Number(
                position.coords.longitude
              );

            const accuracy =
              Number(
                position.coords.accuracy
              );


            if (
              !isValidCoordinates(
                latitude,
                longitude
              )
            ) {
              reject(
                new Error(
                  "Your location could not be determined."
                )
              );

              return;
            }


            resolve({
              latitude:
                latitude,

              longitude:
                longitude,

              accuracy:
                Number.isFinite(
                  accuracy
                )
                  ? accuracy
                  : null
            });
          },


          function (error) {

            let message =
              "Unable to get your location.";


            if (
              error &&
              error.code ===
              1
            ) {
              message =
                "Location permission was denied. Allow location access for NearAfrica and try again.";

            } else if (
              error &&
              error.code ===
              2
            ) {
              message =
                "Your device could not determine your location. Check that location services are enabled.";

            } else if (
              error &&
              error.code ===
              3
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


  /* ==========================================================
     LOCATION STORAGE
  ========================================================== */

  function saveStoredLocation(
    location
  ) {
    if (
      !location ||
      !isValidCoordinates(
        Number(location.latitude),
        Number(location.longitude)
      )
    ) {
      return;
    }

    try {
      sessionStorage.setItem(
        "nearafrica_user_location",
        JSON.stringify({
          latitude:
            Number(
              location.latitude
            ),

          longitude:
            Number(
              location.longitude
            )
        })
      );
    } catch (error) {
      /*
       * Storage is optional.
       */
    }
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
        !isValidCoordinates(
          latitude,
          longitude
        )
      ) {
        sessionStorage.removeItem(
          "nearafrica_user_location"
        );

        return false;
      }


      App.userLocation = {
        latitude:
          latitude,

        longitude:
          longitude
      };


      return true;

    } catch (error) {
      return false;
    }
  }


  function clearStoredLocation() {
    try {
      sessionStorage.removeItem(
        "nearafrica_user_location"
      );
    } catch (error) {
      /*
       * Ignore storage errors.
       */
    }
  }


  /* ==========================================================
     NEARBY LOCATION
  ========================================================== */

  async function enableNearbyLocation() {

    if (
      App.locationLoading
    ) {
      return;
    }


    App.locationLoading =
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


      App.nearbyMode =
        true;


      saveStoredLocation(
        location
      );


      updateLocationStatus(
        "Using your current location.",
        "success"
      );


      updateLocationButtons();


      App.currentPage =
        1;


      syncUrlFromFilters();


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


      clearStoredLocation();


      updateLocationStatus(
        error &&
        error.message
          ? error.message
          : "Unable to use your location.",
        "error"
      );


      updateLocationButtons();


      filterBusinesses();

    } finally {

      App.locationLoading =
        false;


      updateLocationButtons();
    }
  }


  function clearNearbyLocation() {

    App.userLocation =
      null;


    App.nearbyMode =
      false;


    clearStoredLocation();


    updateLocationStatus(
      "Search by area or use your current location.",
      ""
    );


    updateLocationButtons();


    App.currentPage =
      1;


    syncUrlFromFilters();


    filterBusinesses();
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

    if (
      !window.history ||
      !window.history.replaceState
    ) {
      return;
    }


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


    if (
      App.nearbyMode &&
      App.userLocation
    ) {
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
     APPLY URL PARAMETERS
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

      const optionExists =
        Array.from(
          categoryFilter.options
        ).some(
          function (option) {
            return (
              normalizeSearchText(
                option.value
              ) ===
              normalizeSearchText(
                params.category
              )
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


    if (
      countryFilterSecondary
    ) {
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
              normalizeSearchText(
                option.value
              ) ===
              normalizeSearchText(
                params.state
              )
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
              normalizeSearchText(
                option.value
              ) ===
              normalizeSearchText(
                params.city
              )
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


      const restored =
        restoreStoredLocation();


      if (restored) {

        updateLocationStatus(
          "Using your current location.",
          "success"
        );

      } else {

        updateLocationStatus(
          "Use My Location to find businesses near you.",
          ""
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


    stateFilter.innerHTML =
      "";


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
    )
      .sort(
        function (a, b) {
          return a.localeCompare(
            b
          );
        }
      )
      .forEach(
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


    cityFilter.innerHTML =
      "";


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


    const existing =
      new Set();


    cities.forEach(
      function (city) {

        const value =
          cleanText(city);


        if (!value) {
          return;
        }


        const key =
          normalizeSearchText(
            value
          );


        if (
          existing.has(key)
        ) {
          return;
        }


        existing.add(key);


        const option =
          document.createElement(
            "option"
          );


        option.value =
          value;


        option.textContent =
          value;


        cityFilter.appendChild(
          option
        );
      }
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
            existing.has(key)
          ) {
            return;
          }


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
      );


    cityFilter.disabled =
      false;
  }


  /* ==========================================================
     EXPLORE SEARCH
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


      let timer =
        null;


      searchInput.addEventListener(
        "input",
        function () {

          clearTimeout(
            timer
          );


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


  /* ==========================================================
     FILTER EVENTS
  ========================================================== */

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


          if (countryFilter) {
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


          syncUrlFromFilters();


          filterBusinesses();
        }
      );
    }


    if (radiusFilter) {

      radiusFilter.addEventListener(
        "change",
        function () {

          if (
            App.nearbyMode &&
            App.userLocation
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


  /* ==========================================================
     LOCATION BUTTONS
  ========================================================== */

  function setupLocationButtons() {

    const useButton =
      $("useLocationButton");


    const clearButton =
      $("clearLocationButton");


    if (useButton) {

      if (
        useButton.dataset.naLocationReady !==
        "1"
      ) {

        useButton.dataset.naLocationReady =
          "1";


        useButton.addEventListener(
          "click",
          function (event) {

            event.preventDefault();


            enableNearbyLocation();
          }
        );
      }
    }


    if (clearButton) {

      if (
        clearButton.dataset.naClearLocationReady !==
        "1"
      ) {

        clearButton.dataset.naClearLocationReady =
          "1";


        clearButton.addEventListener(
          "click",
          function (event) {

            event.preventDefault();


            clearNearbyLocation();
          }
        );
      }
    }


    updateLocationButtons();
  }


  /* ==========================================================
     LOCATION CHANGE EVENT
  ========================================================== */

  function setupLocationChangeEvent() {

    if (
      window.__nearAfricaLocationListener
    ) {
      return;
    }


    window.__nearAfricaLocationListener =
      true;


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
                  normalizeSearchText(
                    option.value
                  ) ===
                  normalizeSearchText(
                    city
                  )
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
     MOBILE NAVIGATION
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
     HOMEPAGE SEARCH
  ========================================================== */

  function setupHomepageSearch() {

    if (
      App.homepageInitialized
    ) {
      return;
    }


    const form =
      $("searchForm");


    const searchInput =
      $("search");


    const locationInput =
      $("location");


    const useLocationButton =
      $("useLocation");


    const message =
      $("locationMessage");


    if (
      !form &&
      !searchInput &&
      !locationInput
    ) {
      return;
    }


    App.homepageInitialized =
      true;


    function redirectToExplore() {

      const params =
        new URLSearchParams();


      const search =
        searchInput
          ? cleanText(
              searchInput.value
            )
          : "";


      const location =
        locationInput
          ? cleanText(
              locationInput.value
            )
          : "";


      if (search) {
        params.set(
          "search",
          search
        );
      }


      if (location) {
        params.set(
          "city",
          location
        );
      }


      const query =
        params.toString();


      window.location.href =
        "explore.html" +
        (
          query
            ? "?" + query
            : ""
        );
    }


    if (form) {

      form.addEventListener(
        "submit",
        function (event) {

          event.preventDefault();


          redirectToExplore();
        }
      );
    }


    if (
      searchInput &&
      !form
    ) {

      searchInput.addEventListener(
        "keydown",
        function (event) {

          if (
            event.key ===
            "Enter"
          ) {

            event.preventDefault();


            redirectToExplore();
          }
        }
      );
    }


    if (useLocationButton) {

      if (
        useLocationButton.dataset.naHomeLocationReady !==
        "1"
      ) {

        useLocationButton.dataset.naHomeLocationReady =
          "1";


        useLocationButton.addEventListener(
          "click",
          async function (event) {

            event.preventDefault();


            if (message) {
              message.textContent =
                "Requesting your location...";
            }


            try {

              const location =
                await getBrowserLocation();


              saveStoredLocation(
                location
              );


              if (message) {
                message.textContent =
                  "Location detected. Finding nearby businesses...";
              }


              const exploreUrl =
                new URL(
                  "explore.html",
                  window.location.href
                );


              exploreUrl.searchParams.set(
                "nearby",
                "1"
              );


              exploreUrl.searchParams.set(
                "radius",
                "25"
              );


              window.location.href =
                exploreUrl.toString();


            } catch (error) {

              console.error(
                "NearAfrica homepage location error:",
                error
              );


              if (message) {

                message.textContent =
                  error &&
                  error.message
                    ? error.message
                    : "Unable to use your location.";
              }
            }
          }
        );
      }
    }
  }


  /* ==========================================================
     EXPLORE INITIALIZATION
  ========================================================== */

  async function initializeExplorePage() {

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

      populateStates();


      applyUrlParameters();


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


      await fetchBusinesses();


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
                  normalizeSearchText(
                    option.value
                  ) ===
                  normalizeSearchText(
                    selectedCity
                  )
                );
              }
            );


          if (exists) {
            cityFilter.value =
              selectedCity;
          }
        }
      }


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
        "Unable to load businesses right now."
      );


      showEmptyState(
        "Businesses could not be loaded right now. Please try again later."
      );


      const count =
        $("resultCount");


      if (count) {
        count.textContent =
          "Businesses unavailable";
      }


      updateLocationButtons();
    }
  }


  /* ==========================================================
     PUBLIC NEARAFRICA API
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
            App.totalPages,

          apiLoading:
            App.apiLoading,

          lastError:
            App.lastError
        };
      },


    refresh:
      async function () {

        await fetchBusinesses();


        App.currentPage =
          1;


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
      filterBusinesses,


    getBusinessUrl:
      buildBusinessUrl
  };


  /* ==========================================================
     DOM READY
  ========================================================== */

  function initialize() {

    setupHomepageSearch();


    initializeExplorePage();
  }


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

  } else {

    initialize();
  }

})();
