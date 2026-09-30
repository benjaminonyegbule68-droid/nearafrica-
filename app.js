// =========================================================
// NearAfrica App
// Connected to real NearAfrica API
// Location-aware discovery foundation
// =========================================================

const App = {
  userLocation: null,
  currentResults: [],
  mapVisible: true,

  // ---------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------

  locationStorageKey: "nearafrica_user_location",

  defaultNearbyRadiusKm: 25,

  // ---------------------------------------------------------
  // API
  // ---------------------------------------------------------

  getApiUrl() {
    if (
      window.NearAfricaConfig &&
      window.NearAfricaConfig.api &&
      window.NearAfricaConfig.api.baseUrl
    ) {
      return window.NearAfricaConfig.api.baseUrl.replace(/\/$/, "");
    }

    return "";
  },

  async fetchBusinesses(params = {}) {
    const baseUrl = this.getApiUrl();

    if (!baseUrl) {
      throw new Error(
        "NearAfrica API URL is not configured."
      );
    }

    const url = new URL(
      `${baseUrl}/businesses`
    );

    Object.entries(params).forEach(
      ([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          url.searchParams.set(
            key,
            value
          );
        }
      }
    );

    const response =
      await fetch(
        url.toString()
      );

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      data.status !== "ok" &&
      data.success !== true
    ) {
      throw new Error(
        data.message ||
        "Unable to load businesses."
      );
    }

    return Array.isArray(
      data.businesses
    )
      ? data.businesses
      : [];
  },

  // ---------------------------------------------------------
  // LOCATION STORAGE
  // ---------------------------------------------------------

  getStoredUserLocation() {
    try {
      const stored =
        sessionStorage.getItem(
          this.locationStorageKey
        );

      if (!stored) {
        return null;
      }

      const location =
        JSON.parse(stored);

      if (
        !location ||
        !Number.isFinite(
          Number(location.latitude)
        ) ||
        !Number.isFinite(
          Number(location.longitude)
        )
      ) {
        return null;
      }

      return {
        latitude:
          Number(location.latitude),

        longitude:
          Number(location.longitude),

        timestamp:
          Number(location.timestamp || Date.now())
      };

    } catch (error) {
      console.warn(
        "NearAfrica: Could not read stored location.",
        error
      );

      return null;
    }
  },

  saveUserLocation(
    latitude,
    longitude
  ) {
    const location = {
      latitude:
        Number(latitude),

      longitude:
        Number(longitude),

      timestamp:
        Date.now()
    };

    try {
      sessionStorage.setItem(
        this.locationStorageKey,
        JSON.stringify(location)
      );
    } catch (error) {
      console.warn(
        "NearAfrica: Could not save location.",
        error
      );
    }

    this.userLocation =
      location;

    return location;
  },

  clearUserLocation() {
    this.userLocation = null;

    try {
      sessionStorage.removeItem(
        this.locationStorageKey
      );
    } catch (error) {
      console.warn(
        "NearAfrica: Could not clear location.",
        error
      );
    }
  },

  // ---------------------------------------------------------
  // GEOLOCATION
  // ---------------------------------------------------------

  async requestUserLocation() {
    if (
      !("geolocation" in navigator)
    ) {
      throw new Error(
        "Location services are not supported by this browser."
      );
    }

    return new Promise(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const latitude =
              Number(
                position.coords.latitude
              );

            const longitude =
              Number(
                position.coords.longitude
              );

            if (
              !Number.isFinite(
                latitude
              ) ||
              !Number.isFinite(
                longitude
              )
            ) {
              reject(
                new Error(
                  "Your browser returned an invalid location."
                )
              );

              return;
            }

            const location =
              this.saveUserLocation(
                latitude,
                longitude
              );

            resolve(location);
          },

          (error) => {
            let message =
              "Unable to determine your location.";

            if (
              error.code ===
              error.PERMISSION_DENIED
            ) {
              message =
                "Location access was denied. You can still search by city or area.";
            } else if (
              error.code ===
              error.POSITION_UNAVAILABLE
            ) {
              message =
                "Your location could not be determined. Try again or search by area.";
            } else if (
              error.code ===
              error.TIMEOUT
            ) {
              message =
                "The location request timed out. Try again or search by area.";
            }

            reject(
              new Error(message)
            );
          },

          {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 300000
          }
        );
      }
    );
  },

  // ---------------------------------------------------------
  // LOCATION UI
  // ---------------------------------------------------------

  setLocationMessage(
    message,
    type = ""
  ) {
    const elements = [
      document.getElementById(
        "locationMessage"
      ),

      document.getElementById(
        "location-message"
      )
    ].filter(Boolean);

    elements.forEach(
      (element) => {
        element.textContent =
          message;

        element.classList.remove(
          "success",
          "error",
          "active"
        );

        if (type) {
          element.classList.add(
            type
          );
        }
      }
    );
  },

  setLocationButtonState(
    active = false,
    loading = false
  ) {
    const buttons = [
      document.getElementById(
        "useLocation"
      ),

      document.getElementById(
        "use-location"
      )
    ].filter(Boolean);

    buttons.forEach(
      (button) => {
        if (loading) {
          button.disabled =
            true;

          button.dataset.originalText =
            button.textContent;

          button.textContent =
            "📍 Finding You...";

          return;
        }

        button.disabled =
          false;

        if (active) {
          button.textContent =
            "📍 Using Your Location";
        } else {
          button.textContent =
            button.dataset.originalText ||
            "📍 Use My Location";
        }
      }
    );
  },

  async handleUseLocation() {
    this.setLocationButtonState(
      false,
      true
    );

    this.setLocationMessage(
      "Requesting your location...",
      "active"
    );

    try {
      const location =
        await this.requestUserLocation();

      this.setLocationButtonState(
        true,
        false
      );

      this.setLocationMessage(
        "Using your current location.",
        "success"
      );

      console.log(
        "NearAfrica: User location enabled.",
        {
          latitude:
            location.latitude,
          longitude:
            location.longitude
        }
      );

      return location;

    } catch (error) {
      this.setLocationButtonState(
        false,
        false
      );

      this.setLocationMessage(
        error.message ||
        "Unable to determine your location.",
        "error"
      );

      console.error(
        "NearAfrica location error:",
        error
      );

      return null;
    }
  },

  // ---------------------------------------------------------
  // DISTANCE CALCULATION
  // ---------------------------------------------------------

  calculateDistanceKm(
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

    const deltaLatitude =
      (lat2 - lat1) *
      degreesToRadians;

    const deltaLongitude =
      (lon2 - lon1) *
      degreesToRadians;

    const a =
      Math.sin(
        deltaLatitude / 2
      ) *
        Math.sin(
          deltaLatitude / 2
        ) +
      Math.cos(
        lat1 *
          degreesToRadians
      ) *
        Math.cos(
          lat2 *
            degreesToRadians
        ) *
        Math.sin(
          deltaLongitude / 2
        ) *
        Math.sin(
          deltaLongitude / 2
        );

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return (
      earthRadiusKm * c
    );
  },

  formatDistance(
    distanceKm
  ) {
    if (
      !Number.isFinite(
        Number(distanceKm)
      )
    ) {
      return "";
    }

    const distance =
      Number(distanceKm);

    if (distance < 1) {
      const meters =
        Math.round(
          distance * 1000
        );

      return `${meters} m away`;
    }

    if (distance < 10) {
      return `${distance.toFixed(1)} km away`;
    }

    return `${Math.round(distance)} km away`;
  },

  addDistancesToBusinesses(
    businesses,
    location = this.userLocation
  ) {
    if (
      !location ||
      !Number.isFinite(
        Number(location.latitude)
      ) ||
      !Number.isFinite(
        Number(location.longitude)
      )
    ) {
      return businesses;
    }

    return businesses.map(
      (business) => {
        const distanceKm =
          this.calculateDistanceKm(
            location.latitude,
            location.longitude,
            business.latitude,
            business.longitude
          );

        return {
          ...business,

          distanceKm,

          distanceText:
            distanceKm !== null
              ? this.formatDistance(
                  distanceKm
                )
              : ""
        };
      }
    );
  },

  sortByDistance(
    businesses
  ) {
    return [
      ...businesses
    ].sort(
      (a, b) => {
        const distanceA =
          Number.isFinite(
            Number(a.distanceKm)
          )
            ? Number(
                a.distanceKm
              )
            : Infinity;

        const distanceB =
          Number.isFinite(
            Number(b.distanceKm)
          )
            ? Number(
                b.distanceKm
              )
            : Infinity;

        if (
          distanceA !==
          distanceB
        ) {
          return (
            distanceA -
            distanceB
          );
        }

        return String(
          a.name || ""
        ).localeCompare(
          String(
            b.name || ""
          )
        );
      }
    );
  },

  // ---------------------------------------------------------
  // NORMALIZE API BUSINESS
  // ---------------------------------------------------------

  normalizeBusiness(
    business
  ) {
    const imageFromArray =
      Array.isArray(
        business.images
      ) &&
      business.images.length
        ? (
            business.images[0]
              ?.image_url ||
            business.images[0]
              ?.url ||
            ""
          )
        : "";

    const latitude =
      business.latitude !==
        null &&
      business.latitude !==
        undefined &&
      business.latitude !== ""
        ? Number(
            business.latitude
          )
        : null;

    const longitude =
      business.longitude !==
        null &&
      business.longitude !==
        undefined &&
      business.longitude !== ""
        ? Number(
            business.longitude
          )
        : null;

    return {
      id:
        business.id || "",

      name:
        business.business_name ||
        business.name ||
        "Unnamed Business",

      category:
        business.category || "",

      country:
        business.country || "",

      state:
        business.state || "",

      city:
        business.city || "",

      address:
        business.address || "",

      phone:
        business.phone || "",

      whatsapp:
        business.whatsapp || "",

      website:
        business.website || "",

      description:
        business.description || "",

      email:
        business.email || "",

      latitude,

      longitude,

      verified:
        Boolean(
          business.verified
        ),

      featured:
        Boolean(
          business.featured
        ),

      rating:
        typeof business.rating ===
        "number"
          ? business.rating
          : null,

      reviewCount:
        Number(
          business.review_count ||
          0
        ),

      imageUrl:
        business.image_url ||
        business.imageUrl ||
        imageFromArray,

      images:
        Array.isArray(
          business.images
        )
          ? business.images
          : [],

      openingHours:
        business.opening_hours ||
        null,

      services:
        Array.isArray(
          business.services
        )
          ? business.services
          : [],

      distanceKm:
        Number.isFinite(
          Number(
            business.distanceKm
          )
        )
          ? Number(
              business.distanceKm
            )
          : Number.isFinite(
              Number(
                business.distance_km
              )
            )
            ? Number(
                business.distance_km
              )
            : null,

      distanceText:
        business.distanceText ||
        ""
    };
  },

  // ---------------------------------------------------------
  // HTML HELPERS
  // ---------------------------------------------------------

  escapeHtml(value) {
    if (
      window.NearAfricaUtils &&
      typeof
        window.NearAfricaUtils
          .escapeHtml ===
        "function"
    ) {
      return window.NearAfricaUtils.escapeHtml(
        value || ""
      );
    }

    const div =
      document.createElement(
        "div"
      );

    div.textContent =
      value === null ||
      value === undefined
        ? ""
        : String(value);

    return div.innerHTML;
  },

  // ---------------------------------------------------------
  // BUSINESS IMAGE
  // ---------------------------------------------------------

  renderBusinessImage(
    biz
  ) {
    const businessInitial =
      String(
        biz.name || "B"
      )
        .trim()
        .charAt(0)
        .toUpperCase() ||
      "B";

    const imageUrl =
      String(
        biz.imageUrl || ""
      ).trim();

    if (!imageUrl) {
      return `
        <div
          class="business-card-image"
          aria-label="${this.escapeHtml(
            biz.name
          )}"
        >

          <div
            class="business-card-image-fallback"
            aria-hidden="true"
          >
            ${this.escapeHtml(
              businessInitial
            )}
          </div>

        </div>
      `;
    }

    const safeImageUrl =
      this.escapeHtml(
        imageUrl
      );

    const safeBusinessName =
      this.escapeHtml(
        biz.name
      );

    return `
      <div
        class="business-card-image"
        aria-label="${safeBusinessName}"
      >

        <img
          src="${safeImageUrl}"
          alt="${safeBusinessName}"
          loading="lazy"

          onerror="
            this.style.display='none';

            const fallback =
              this.parentElement.querySelector(
                '.business-card-image-fallback'
              );

            if (fallback) {
              fallback.style.display='flex';
            }
          "
        >

        <div
          class="business-card-image-fallback"
          aria-hidden="true"
          style="display:none;"
        >
          ${this.escapeHtml(
            businessInitial
          )}
        </div>

      </div>
    `;
  },

  // ---------------------------------------------------------
  // BUSINESS CARD
  // ---------------------------------------------------------

  renderBusinessCard(
    biz
  ) {
    const verifiedBadge =
      biz.verified
        ? `
          <span class="verified-badge">
            ✓ Verified
          </span>
        `
        : "";

    const featuredBadge =
      biz.featured
        ? `
          <span class="featured-badge">
            Featured
          </span>
        `
        : "";

    const ratingHtml =
      typeof biz.rating ===
      "number"
        ? `
          <span>
            ★ ${biz.rating.toFixed(1)}
          </span>
        `
        : "";

    const distanceHtml =
      Number.isFinite(
        Number(
          biz.distanceKm
        )
      )
        ? `
          <span class="business-distance">
            📍 ${this.escapeHtml(
              biz.distanceText ||
              this.formatDistance(
                biz.distanceKm
              )
            )}
          </span>
        `
        : "";

    const phoneHtml =
      biz.phone
        ? `
          <a
            href="tel:${this.escapeHtml(
              biz.phone
            )}"
          >
            Call
          </a>
        `
        : "";

    const whatsappNumber =
      String(
        biz.whatsapp || ""
      ).replace(
        /[^0-9]/g,
        ""
      );

    const whatsappHtml =
      biz.whatsapp &&
      whatsappNumber
        ? `
          <a
            href="https://wa.me/${whatsappNumber}"
            target="_blank"
            rel="noopener"
          >
            WhatsApp
          </a>
        `
        : "";

    const websiteHtml =
      biz.website
        ? `
          <a
            href="${this.escapeHtml(
              biz.website
            )}"
            target="_blank"
            rel="noopener"
          >
            Website
          </a>
        `
        : "";

    return `
      <article
        class="business-card"
        data-business-id="${this.escapeHtml(
          biz.id
        )}"
      >

        ${this.renderBusinessImage(
          biz
        )}

        <div class="business-card-content">

          <div class="business-card-header">

            <div>

              <h3>
                ${this.escapeHtml(
                  biz.name
                )}
              </h3>

              ${
                biz.category
                  ? `
                    <p class="business-category">
                      ${this.escapeHtml(
                        biz.category
                      )}
                    </p>
                  `
                  : ""
              }

            </div>

            <div class="business-badges">

              ${featuredBadge}

              ${verifiedBadge}

            </div>

          </div>

          ${
            biz.description
              ? `
                <p class="business-description">
                  ${this.escapeHtml(
                    biz.description
                  )}
                </p>
              `
              : ""
          }

          <div class="business-meta">

            ${
              biz.address
                ? `
                  <span>
                    📍 ${this.escapeHtml(
                      biz.address
                    )}
                  </span>
                `
                : ""
            }

            ${
              biz.city ||
              biz.state
                ? `
                  <span>
                    ${this.escapeHtml(
                      biz.city
                    )}
                    ${
                      biz.city &&
                      biz.state
                        ? ", "
                        : ""
                    }
                    ${this.escapeHtml(
                      biz.state
                    )}
                  </span>
                `
                : ""
            }

            ${distanceHtml}

            ${ratingHtml}

          </div>

          <div class="business-actions">

            <a
              href="business.html?id=${encodeURIComponent(
                biz.id
              )}"
            >
              View Details
            </a>

            ${phoneHtml}

            ${whatsappHtml}

            ${websiteHtml}

          </div>

        </div>

      </article>
    `;
  },

  // ---------------------------------------------------------
  // CATEGORIES
  // ---------------------------------------------------------

  renderCategories() {
    const categoryFilter =
      document.getElementById(
        "category-filter"
      );

    if (!categoryFilter) {
      return;
    }

    const categories =
      window.NearAfricaData &&
      Array.isArray(
        window.NearAfricaData
          .categories
      )
        ? window.NearAfricaData
            .categories
        : [];

    categoryFilter.innerHTML =
      `<option value="">All Categories</option>` +
      categories
        .map(
          (category) => `
            <option
              value="${this.escapeHtml(
                category
              )}"
            >
              ${this.escapeHtml(
                category
              )}
            </option>
          `
        )
        .join("");
  },

  // ---------------------------------------------------------
  // RENDER BUSINESSES
  // ---------------------------------------------------------

  renderBusinesses(
    businesses
  ) {
    const businessList =
      document.getElementById(
        "business-list"
      );

    const emptyState =
      document.getElementById(
        "empty-state"
      );

    const resultsCount =
      document.getElementById(
        "results-count"
      );

    if (!businessList) {
      return;
    }

    if (
      !businesses.length
    ) {
      businessList.innerHTML =
        "";

      if (emptyState) {
        emptyState.hidden =
          false;
      }

      if (resultsCount) {
        resultsCount.textContent =
          "0";
      }

      return;
    }

    if (emptyState) {
      emptyState.hidden =
        true;
    }

    businessList.innerHTML =
      businesses
        .map(
          (business) =>
            this.renderBusinessCard(
              business
            )
        )
        .join("");

    if (resultsCount) {
      resultsCount.textContent =
        String(
          businesses.length
        );
    }
  },

  // ---------------------------------------------------------
  // HOMEPAGE SEARCH
  // ---------------------------------------------------------

  handleHomepageSearch(
    event
  ) {
    if (event) {
      event.preventDefault();
    }

    const searchInput =
      document.getElementById(
        "search"
      );

    const locationInput =
      document.getElementById(
        "location"
      );

    const query =
      searchInput
        ? searchInput.value.trim()
        : "";

    const location =
      locationInput
        ? locationInput.value.trim()
        : "";

    const params =
      new URLSearchParams();

    if (query) {
      params.set(
        "search",
        query
      );
    }

    /*
     * If the user has explicitly
     * enabled precise location,
     * Explore will use it instead
     * of treating "current location"
     * as a text search.
     */

    if (this.userLocation) {
      params.set(
        "nearby",
        "1"
      );
    } else if (location) {
      params.set(
        "location",
        location
      );
    }

    const queryString =
      params.toString();

    window.location.href =
      `explore.html${
        queryString
          ? `?${queryString}`
          : ""
      }`;
  },

  // ---------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------

  async performSearch(
    event
  ) {
    if (event) {
      event.preventDefault();
    }

    /*
     * Homepage uses:
     * #searchForm
     *
     * Explore/search pages may use:
     * #search-form
     */

    const homepageForm =
      document.getElementById(
        "searchForm"
      );

    if (homepageForm) {
      this.handleHomepageSearch(
        event
      );

      return;
    }

    await this.runSearchPage();
  },

  // ---------------------------------------------------------
  // SEARCH PAGE
  // ---------------------------------------------------------

  async runSearchPage() {
    const queryInput =
      document.getElementById(
        "query-input"
      );

    const locationInput =
      document.getElementById(
        "location-input"
      );

    const categoryFilter =
      document.getElementById(
        "category-filter"
      );

    const loadingState =
      document.getElementById(
        "loading-state"
      );

    const emptyState =
      document.getElementById(
        "empty-state"
      );

    const businessList =
      document.getElementById(
        "business-list"
      );

    const resultsCount =
      document.getElementById(
        "results-count"
      );

    const resultsTitle =
      document.getElementById(
        "results-title"
      );

    const query =
      queryInput
        ? queryInput.value.trim()
        : "";

    const location =
      locationInput
        ? locationInput.value.trim()
        : "";

    const category =
      categoryFilter
        ? categoryFilter.value
        : "";

    const errorMessage =
      document.getElementById(
        "error-state"
      );

    try {
      if (loadingState) {
        loadingState.hidden =
          false;
      }

      if (emptyState) {
        emptyState.hidden =
          true;
      }

      if (errorMessage) {
        errorMessage.hidden =
          true;
      }

      if (businessList) {
        businessList.innerHTML =
          "";
      }

      const params = {};

      if (query) {
        params.search =
          query;
      }

      if (location) {
        params.location =
          location;
      }

      if (category) {
        params.category =
          category;
      }

      const rawBusinesses =
        await this.fetchBusinesses(
          params
        );

      let businesses =
        rawBusinesses.map(
          (business) =>
            this.normalizeBusiness(
              business
            )
        );

      // -----------------------------------------------------
      // Client-side search fallback
      // -----------------------------------------------------

      if (query) {
        const searchText =
          query.toLowerCase();

        businesses =
          businesses.filter(
            (business) => {
              const searchable = [
                business.name,
                business.category,
                business.description,
                business.address,
                business.city,
                business.state,
                business.country
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

              return searchable.includes(
                searchText
              );
            }
          );
      }

      // -----------------------------------------------------
      // Location text filter
      // -----------------------------------------------------

      if (location) {
        const locationText =
          location.toLowerCase();

        businesses =
          businesses.filter(
            (business) => {
              const searchable = [
                business.address,
                business.city,
                business.state,
                business.country
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

              return searchable.includes(
                locationText
              );
            }
          );
      }

      // -----------------------------------------------------
      // Category filter
      // -----------------------------------------------------

      if (category) {
        const categoryText =
          category.toLowerCase();

        businesses =
          businesses.filter(
            (business) =>
              String(
                business.category ||
                ""
              ).toLowerCase() ===
              categoryText
          );
      }

      // -----------------------------------------------------
      // Apply precise location
      // -----------------------------------------------------

      const nearby =
        new URLSearchParams(
          window.location.search
        ).get("nearby");

      if (
        nearby === "1"
      ) {
        const storedLocation =
          this.getStoredUserLocation();

        if (storedLocation) {
          this.userLocation =
            storedLocation;

          businesses =
            this.addDistancesToBusinesses(
              businesses,
              storedLocation
            );

          /*
           * Only businesses with
           * usable coordinates can
           * be distance-ranked.
           *
           * Businesses without
           * coordinates remain at
           * the bottom.
           */

          businesses =
            this.sortByDistance(
              businesses
            );

          /*
           * Default nearby radius.
           */

          businesses =
            businesses.filter(
              (business) =>
                business.distanceKm ===
                  null ||
                business.distanceKm <=
                  this.defaultNearbyRadiusKm
            );

          if (resultsTitle) {
            resultsTitle.textContent =
              query
                ? `Nearby results for "${query}"`
                : "Businesses Near You";
          }

        } else if (
          resultsTitle
        ) {
          resultsTitle.textContent =
            query
              ? `Search results for "${query}"`
              : "Businesses";
        }

      } else {
        /*
         * Normal searches are
         * alphabetically sorted.
         */

        businesses.sort(
          (a, b) =>
            String(
              a.name || ""
            ).localeCompare(
              String(
                b.name || ""
              )
            )
        );

        if (resultsTitle) {
          resultsTitle.textContent =
            query
              ? `Search results for "${query}"`
              : "Businesses";
        }
      }

      this.currentResults =
        businesses;

      this.renderBusinesses(
        businesses
      );

    } catch (error) {
      console.error(
        "NearAfrica business loading error:",
        error
      );

      if (businessList) {
        businessList.innerHTML =
          "";
      }

      if (emptyState) {
        emptyState.hidden =
          true;
      }

      if (resultsCount) {
        resultsCount.textContent =
          "0";
      }

      if (resultsTitle) {
        resultsTitle.textContent =
          "Unable to load businesses";
      }

      if (errorMessage) {
        errorMessage.hidden =
          false;
      }

    } finally {
      if (loadingState) {
        loadingState.hidden =
          true;
      }
    }
  },

  // ---------------------------------------------------------
  // LOCATION INITIALIZATION
  // ---------------------------------------------------------

  initLocation() {
    const storedLocation =
      this.getStoredUserLocation();

    if (storedLocation) {
      this.userLocation =
        storedLocation;

      this.setLocationButtonState(
        true,
        false
      );

      this.setLocationMessage(
        "Using your current location.",
        "success"
      );
    }

    const locationButton =
      document.getElementById(
        "useLocation"
      ) ||
      document.getElementById(
        "use-location"
      );

    if (locationButton) {
      locationButton.addEventListener(
        "click",
        () =>
          this.handleUseLocation()
      );
    }
  },

  // ---------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------

  init() {
    console.log(
      "NearAfrica App initialized."
    );

    this.renderCategories();

    this.initLocation();

    /*
     * Homepage search form
     */

    const homepageForm =
      document.getElementById(
        "searchForm"
      );

    if (homepageForm) {
      homepageForm.addEventListener(
        "submit",
        (event) =>
          this.performSearch(
            event
          )
      );
    }

    /*
     * Existing search-page
     * form.
     */

    const searchForm =
      document.getElementById(
        "search-form"
      );

    if (
      searchForm &&
      searchForm !==
        homepageForm
    ) {
      searchForm.addEventListener(
        "submit",
        (event) =>
          this.performSearch(
            event
          )
      );
    }

    /*
     * Only run the existing
     * search-page renderer when
     * its results container exists.
     *
     * This prevents the homepage
     * from making an unnecessary
     * /businesses request.
     */

    if (
      document.getElementById(
        "business-list"
      )
    ) {
      this.runSearchPage();
    }
  }
};

// ---------------------------------------------------------
// Make App globally available
// ---------------------------------------------------------

window.NearAfricaApp =
  App;

// ---------------------------------------------------------
// Start application
// ---------------------------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  () => {
    App.init();
  }
);
