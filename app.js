// =========================================================
// NearAfrica App
// Connected to the real NearAfrica API
// Homepage + Explore + Location-aware discovery
// =========================================================

const App = {
  userLocation: null,
  currentResults: [],
  mapVisible: true,
  initialized: false,

  // ---------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------

  locationStorageKey: "nearafrica_user_location",

  getNearbyRadiusKm() {
    const configured =
      window.NearAfricaConfig &&
      window.NearAfricaConfig.maps &&
      Number(
        window.NearAfricaConfig.maps.defaultRadiusKm
      );

    if (
      Number.isFinite(configured) &&
      configured > 0
    ) {
      return configured;
    }

    return 25;
  },

  // ---------------------------------------------------------
  // API
  // ---------------------------------------------------------

  getApiUrl() {
    const configured =
      window.NearAfricaConfig &&
      window.NearAfricaConfig.api &&
      window.NearAfricaConfig.api.baseUrl;

    if (!configured) {
      return "";
    }

    return String(configured)
      .trim()
      .replace(/\/+$/, "");
  },

  async fetchBusinesses(params = {}) {
    const baseUrl =
      this.getApiUrl();

    if (!baseUrl) {
      throw new Error(
        "NearAfrica API URL is not configured."
      );
    }

    const url =
      new URL(
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
            String(value)
          );
        }
      }
    );

    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",
          headers: {
            Accept:
              "application/json"
          }
        }
      );

    let data = null;

    try {
      data =
        await response.json();
    } catch (error) {
      throw new Error(
        `NearAfrica API returned an invalid response (${response.status}).`
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
        data?.error ||
        `API request failed: ${response.status}`
      );
    }

    /*
     * The Worker may return:
     *
     * { businesses: [...] }
     *
     * or:
     *
     * { data: { businesses: [...] } }
     *
     * or:
     *
     * { results: [...] }
     */

    const businesses =
      Array.isArray(
        data?.businesses
      )
        ? data.businesses
        : Array.isArray(
            data?.data?.businesses
          )
          ? data.data.businesses
          : Array.isArray(
              data?.results
            )
            ? data.results
            : Array.isArray(
                data?.data?.results
              )
              ? data.data.results
              : [];

    return businesses;
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

      const latitude =
        Number(
          location?.latitude
        );

      const longitude =
        Number(
          location?.longitude
        );

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        sessionStorage.removeItem(
          this.locationStorageKey
        );

        return null;
      }

      return {
        latitude,
        longitude,
        timestamp:
          Number(
            location?.timestamp ||
            Date.now()
          )
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
    const cleanLatitude =
      Number(latitude);

    const cleanLongitude =
      Number(longitude);

    if (
      !Number.isFinite(
        cleanLatitude
      ) ||
      !Number.isFinite(
        cleanLongitude
      )
    ) {
      return null;
    }

    const location = {
      latitude:
        cleanLatitude,

      longitude:
        cleanLongitude,

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
    this.userLocation =
      null;

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

    this.setLocationButtonState(
      false,
      false
    );

    this.setLocationMessage(
      "",
      ""
    );
  },

  // ---------------------------------------------------------
  // GEOLOCATION
  // ---------------------------------------------------------

  async requestUserLocation() {
    if (
      !navigator.geolocation
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
                position?.coords?.latitude
              );

            const longitude =
              Number(
                position?.coords?.longitude
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

            if (!location) {
              reject(
                new Error(
                  "Your location could not be saved."
                )
              );

              return;
            }

            resolve(location);
          },

          (error) => {
            let message =
              "Unable to determine your location.";

            if (
              error?.code ===
              error.PERMISSION_DENIED
            ) {
              message =
                "Location access was denied. You can still search by city or area.";
            } else if (
              error?.code ===
              error.POSITION_UNAVAILABLE
            ) {
              message =
                "Your location could not be determined. Try again or search by area.";
            } else if (
              error?.code ===
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
            enableHighAccuracy:
              true,

            timeout:
              10000,

            maximumAge:
              300000
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
          message || "";

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
          if (
            !button.dataset.originalText
          ) {
            button.dataset.originalText =
              button.textContent;
          }

          button.disabled =
            true;

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

      return location;

    } catch (error) {
      this.setLocationButtonState(
        false,
        false
      );

      this.setLocationMessage(
        error?.message ||
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
  // DISTANCE
  // ---------------------------------------------------------

  calculateDistanceKm(
    latitude1,
    longitude1,
    latitude2,
    longitude2
  ) {
    if (
      window.NearAfricaUtils &&
      typeof
        window.NearAfricaUtils
          .calculateDistance ===
        "function"
    ) {
      return window.NearAfricaUtils.calculateDistance(
        Number(latitude1),
        Number(longitude1),
        Number(latitude2),
        Number(longitude2)
      );
    }

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

    const deltaLatitude =
      (lat2 - lat1) *
      radians;

    const deltaLongitude =
      (lon2 - lon1) *
      radians;

    const a =
      Math.sin(
        deltaLatitude / 2
      ) ** 2 +
      Math.cos(
        lat1 * radians
      ) *
        Math.cos(
          lat2 * radians
        ) *
        Math.sin(
          deltaLongitude / 2
        ) ** 2;

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
      window.NearAfricaUtils &&
      typeof
        window.NearAfricaUtils
          .formatDistance ===
        "function"
    ) {
      return window.NearAfricaUtils.formatDistance(
        distanceKm
      );
    }

    const distance =
      Number(distanceKm);

    if (
      !Number.isFinite(
        distance
      )
    ) {
      return "";
    }

    if (distance < 1) {
      return `${Math.round(
        distance * 1000
      )} m away`;
    }

    if (distance < 10) {
      return `${distance.toFixed(
        1
      )} km away`;
    }

    return `${Math.round(
      distance
    )} km away`;
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
        const aDistance =
          Number(a.distanceKm);

        const bDistance =
          Number(b.distanceKm);

        const aHasDistance =
          Number.isFinite(
            aDistance
          );

        const bHasDistance =
          Number.isFinite(
            bDistance
          );

        if (
          aHasDistance &&
          !bHasDistance
        ) {
          return -1;
        }

        if (
          !aHasDistance &&
          bHasDistance
        ) {
          return 1;
        }

        if (
          aHasDistance &&
          bHasDistance &&
          aDistance !==
            bDistance
        ) {
          return (
            aDistance -
            bDistance
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
  // NORMALIZE BUSINESS
  // ---------------------------------------------------------

  normalizeBusiness(
    business = {}
  ) {
    const imageFromArray =
      Array.isArray(
        business.images
      ) &&
      business.images.length > 0
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

    const verifiedValue =
      business.verified;

    const featuredValue =
      business.featured;

    return {
      ...business,

      id:
        business.id ||
        business.business_id ||
        "",

      name:
        business.business_name ||
        business.name ||
        "Unnamed Business",

      category:
        business.category ||
        "",

      country:
        business.country ||
        "",

      state:
        business.state ||
        "",

      city:
        business.city ||
        "",

      address:
        business.address ||
        "",

      phone:
        business.phone ||
        "",

      whatsapp:
        business.whatsapp ||
        "",

      website:
        business.website ||
        business.website_url ||
        "",

      description:
        business.description ||
        "",

      email:
        business.email ||
        "",

      latitude:
        Number.isFinite(
          latitude
        )
          ? latitude
          : null,

      longitude:
        Number.isFinite(
          longitude
        )
          ? longitude
          : null,

      verified:
        verifiedValue === true ||
        verifiedValue === 1 ||
        verifiedValue === "1" ||
        verifiedValue === "true",

      featured:
        featuredValue === true ||
        featuredValue === 1 ||
        featuredValue === "1" ||
        featuredValue === "true",

      rating:
        Number.isFinite(
          Number(
            business.rating
          )
        )
          ? Number(
              business.rating
            )
          : null,

      reviewCount:
        Number(
          business.review_count ||
          business.reviewCount ||
          0
        ),

      imageUrl:
        business.image_url ||
        business.imageUrl ||
        imageFromArray ||
        "",

      images:
        Array.isArray(
          business.images
        )
          ? business.images
          : [],

      openingHours:
        business.opening_hours ||
        business.openingHours ||
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
  // HTML ESCAPING
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
        value ?? ""
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
    business
  ) {
    const initial =
      String(
        business.name ||
        "B"
      )
        .trim()
        .charAt(0)
        .toUpperCase() ||
      "B";

    const imageUrl =
      String(
        business.imageUrl ||
        ""
      ).trim();

    const name =
      this.escapeHtml(
        business.name
      );

    if (!imageUrl) {
      return `
        <div
          class="business-card-image"
          aria-label="${name}"
        >
          <div
            class="business-card-image-fallback"
            aria-hidden="true"
          >
            ${this.escapeHtml(
              initial
            )}
          </div>
        </div>
      `;
    }

    return `
      <div
        class="business-card-image"
        aria-label="${name}"
      >
        <img
          src="${this.escapeHtml(
            imageUrl
          )}"
          alt="${name}"
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
            initial
          )}
        </div>
      </div>
    `;
  },

  // ---------------------------------------------------------
  // BUSINESS CARD
  // ---------------------------------------------------------

  renderBusinessCard(
    business
  ) {
    const verifiedBadge =
      business.verified
        ? `
          <span class="verified-badge">
            ✓ Verified
          </span>
        `
        : "";

    const featuredBadge =
      business.featured
        ? `
          <span class="featured-badge">
            Featured
          </span>
        `
        : "";

    const ratingHtml =
      Number.isFinite(
        Number(
          business.rating
        )
      )
        ? `
          <span>
            ★ ${Number(
              business.rating
            ).toFixed(1)}
          </span>
        `
        : "";

    const distanceHtml =
      Number.isFinite(
        Number(
          business.distanceKm
        )
      )
        ? `
          <span class="business-distance">
            📍 ${this.escapeHtml(
              business.distanceText ||
              this.formatDistance(
                business.distanceKm
              )
            )}
          </span>
        `
        : "";

    const phoneHtml =
      business.phone
        ? `
          <a
            href="tel:${this.escapeHtml(
              business.phone
            )}"
          >
            Call
          </a>
        `
        : "";

    const whatsappNumber =
      String(
        business.whatsapp ||
        ""
      ).replace(
        /[^0-9]/g,
        ""
      );

    const whatsappHtml =
      whatsappNumber
        ? `
          <a
            href="https://wa.me/${whatsappNumber}"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        `
        : "";

    let websiteHtml = "";

    if (business.website) {
      let websiteUrl =
        String(
          business.website
        ).trim();

      if (
        websiteUrl &&
        !/^https?:\/\//i.test(
          websiteUrl
        )
      ) {
        websiteUrl =
          `https://${websiteUrl}`;
      }

      websiteHtml =
        websiteUrl
          ? `
            <a
              href="${this.escapeHtml(
                websiteUrl
              )}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Website
            </a>
          `
          : "";
    }

    const locationParts = [
      business.city,
      business.state
    ].filter(Boolean);

    return `
      <article
        class="business-card"
        data-business-id="${this.escapeHtml(
          business.id
        )}"
      >

        ${this.renderBusinessImage(
          business
        )}

        <div class="business-card-content">

          <div class="business-card-header">

            <div>
              <h3>
                ${this.escapeHtml(
                  business.name
                )}
              </h3>

              ${
                business.category
                  ? `
                    <p class="business-category">
                      ${this.escapeHtml(
                        business.category
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
            business.description
              ? `
                <p class="business-description">
                  ${this.escapeHtml(
                    business.description
                  )}
                </p>
              `
              : ""
          }

          <div class="business-meta">

            ${
              business.address
                ? `
                  <span>
                    📍 ${this.escapeHtml(
                      business.address
                    )}
                  </span>
                `
                : ""
            }

            ${
              locationParts.length
                ? `
                  <span>
                    ${this.escapeHtml(
                      locationParts.join(
                        ", "
                      )
                    )}
                  </span>
                `
                : ""
            }

            ${distanceHtml}

            ${ratingHtml}

          </div>

          <div class="business-actions">

            ${
              business.id
                ? `
                  <a
                    href="business.html?id=${encodeURIComponent(
                      business.id
                    )}"
                  >
                    View Details
                  </a>
                `
                : ""
            }

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

  getCategories() {
    const fromConfig =
      window.NearAfricaConfig &&
      Array.isArray(
        window.NearAfricaConfig
          .categories
      )
        ? window.NearAfricaConfig
            .categories
        : [];

    if (
      fromConfig.length
    ) {
      return fromConfig;
    }

    const fromData =
      window.NearAfricaData &&
      Array.isArray(
        window.NearAfricaData
          .categories
      )
        ? window.NearAfricaData
            .categories
        : [];

    return fromData;
  },

  renderCategories() {
    const categoryFilter =
      document.getElementById(
        "category-filter"
      );

    if (!categoryFilter) {
      return;
    }

    const categories =
      this.getCategories();

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
      !Array.isArray(
        businesses
      ) ||
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
  // URL HELPERS
  // ---------------------------------------------------------

  getUrlParams() {
    try {
      return new URLSearchParams(
        window.location.search
      );
    } catch (error) {
      return new URLSearchParams();
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
     * Precise browser location
     * takes priority over typed
     * location when the user has
     * explicitly enabled it.
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
  // SEARCH FORM
  // ---------------------------------------------------------

  async performSearch(
    event
  ) {
    if (event) {
      event.preventDefault();
    }

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

    const errorState =
      document.getElementById(
        "error-state"
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

    if (!businessList) {
      return;
    }

    /*
     * Read URL parameters.
     *
     * This allows homepage searches
     * such as:
     *
     * explore.html?search=hotel
     *
     * and:
     *
     * explore.html?search=hotel&nearby=1
     */

    const urlParams =
      this.getUrlParams();

    const urlSearch =
      urlParams.get(
        "search"
      ) || "";

    const urlLocation =
      urlParams.get(
        "location"
      ) || "";

    const urlCategory =
      urlParams.get(
        "category"
      ) || "";

    if (
      queryInput &&
      !queryInput.value &&
      urlSearch
    ) {
      queryInput.value =
        urlSearch;
    }

    if (
      locationInput &&
      !locationInput.value &&
      urlLocation
    ) {
      locationInput.value =
        urlLocation;
    }

    if (
      categoryFilter &&
      !categoryFilter.value &&
      urlCategory
    ) {
      categoryFilter.value =
        urlCategory;
    }

    const query =
      queryInput
        ? queryInput.value.trim()
        : urlSearch.trim();

    const location =
      locationInput
        ? locationInput.value.trim()
        : urlLocation.trim();

    const category =
      categoryFilter
        ? categoryFilter.value
        : urlCategory;

    const nearby =
      urlParams.get(
        "nearby"
      ) === "1";

    try {
      if (loadingState) {
        loadingState.hidden =
          false;
      }

      if (emptyState) {
        emptyState.hidden =
          true;
      }

      if (errorState) {
        errorState.hidden =
          true;
      }

      if (resultsTitle) {
        resultsTitle.textContent =
          "Loading businesses...";
      }

      if (businessList) {
        businessList.innerHTML =
          "";
      }

      const params = {};

      /*
       * The API gets the normal
       * textual filters.
       *
       * Precise location is handled
       * locally so we don't need to
       * send the user's exact GPS
       * coordinates just to search.
       */

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
      // Client-side text fallback
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
      // Client-side location fallback
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
      // Client-side category fallback
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
              )
                .toLowerCase()
                .trim() ===
              categoryText
                .trim()
        );
      }

      // -----------------------------------------------------
      // PRECISE LOCATION SEARCH
      // -----------------------------------------------------

      if (nearby) {
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
           * IMPORTANT:
           *
           * A business without latitude/
           * longitude cannot honestly be
           * described as being within the
           * nearby radius.
           *
           * Therefore nearby mode only
           * keeps businesses with a valid
           * calculated distance.
           */

          businesses =
            businesses.filter(
              (business) =>
                Number.isFinite(
                  Number(
                    business.distanceKm
                  )
                )
            );

          businesses =
            businesses.filter(
              (business) =>
                Number(
                  business.distanceKm
                ) <=
                this.getNearbyRadiusKm()
            );

          businesses =
            this.sortByDistance(
              businesses
            );

          if (resultsTitle) {
            resultsTitle.textContent =
              query
                ? `Nearby results for "${query}"`
                : "Businesses Near You";
          }

        } else {
          /*
           * If the user reached
           * nearby mode without a
           * stored location, don't
           * pretend we know where
           * they are.
           */

          if (resultsTitle) {
            resultsTitle.textContent =
              query
                ? `Search results for "${query}"`
                : "Businesses";
          }
        }

      } else {
        /*
         * Normal searches use
         * alphabetical order.
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

      /*
       * Keep count correct even
       * when there are zero results.
       */

      if (resultsCount) {
        resultsCount.textContent =
          String(
            businesses.length
          );
      }

    } catch (error) {
      console.error(
        "NearAfrica business loading error:",
        error
      );

      this.currentResults =
        [];

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

      if (errorState) {
        errorState.hidden =
          false;

        /*
         * Don't overwrite an
         * existing designed error
         * message unless necessary.
         */

        if (
          !errorState.textContent.trim()
        ) {
          errorState.textContent =
            error?.message ||
            "Unable to load businesses.";
        }
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

    if (
      locationButton &&
      !locationButton.dataset.nearAfricaBound
    ) {
      locationButton.dataset.nearAfricaBound =
        "true";

      locationButton.addEventListener(
        "click",
        () =>
          this.handleUseLocation()
      );
    }
  },

  // ---------------------------------------------------------
  // SEARCH PAGE INITIALIZATION
  // ---------------------------------------------------------

  initSearchPage() {
    const searchForm =
      document.getElementById(
        "search-form"
      );

    if (
      searchForm &&
      !searchForm.dataset.nearAfricaBound
    ) {
      searchForm.dataset.nearAfricaBound =
        "true";

      searchForm.addEventListener(
        "submit",
        (event) =>
          this.performSearch(
            event
          )
      );
    }

    /*
     * Category/location changes
     * can optionally refresh results
     * when those controls exist.
     */

    const categoryFilter =
      document.getElementById(
        "category-filter"
      );

    const locationInput =
      document.getElementById(
        "location-input"
      );

    if (
      categoryFilter &&
      !categoryFilter.dataset.nearAfricaBound
    ) {
      categoryFilter.dataset.nearAfricaBound =
        "true";

      categoryFilter.addEventListener(
        "change",
        () =>
          this.runSearchPage()
      );
    }

    if (
      locationInput &&
      !locationInput.dataset.nearAfricaBound
    ) {
      locationInput.dataset.nearAfricaBound =
        "true";

      locationInput.addEventListener(
        "change",
        () =>
          this.runSearchPage()
      );
    }
  },

  // ---------------------------------------------------------
  // HOMEPAGE INITIALIZATION
  // ---------------------------------------------------------

  initHomepage() {
    const homepageForm =
      document.getElementById(
        "searchForm"
      );

    if (
      homepageForm &&
      !homepageForm.dataset.nearAfricaBound
    ) {
      homepageForm.dataset.nearAfricaBound =
        "true";

      homepageForm.addEventListener(
        "submit",
        (event) =>
          this.handleHomepageSearch(
            event
          )
      );
    }
  },

  // ---------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------

  init() {
    if (this.initialized) {
      return;
    }

    this.initialized =
      true;

    console.log(
      "NearAfrica App initialized."
    );

    try {
      this.renderCategories();
    } catch (error) {
      console.error(
        "NearAfrica category initialization error:",
        error
      );
    }

    try {
      this.initLocation();
    } catch (error) {
      console.error(
        "NearAfrica location initialization error:",
        error
      );
    }

    try {
      this.initHomepage();
    } catch (error) {
      console.error(
        "NearAfrica homepage initialization error:",
        error
      );
    }

    try {
      this.initSearchPage();
    } catch (error) {
      console.error(
        "NearAfrica search-page initialization error:",
        error
      );
    }

    /*
     * Only the Explore/search page
     * should automatically request
     * businesses.
     *
     * The homepage should remain
     * lightweight and should not
     * make an unnecessary API call.
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
// GLOBAL EXPORT
// ---------------------------------------------------------

window.NearAfricaApp =
  App;

// ---------------------------------------------------------
// START
// ---------------------------------------------------------

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    () => App.init(),
    {
      once: true
    }
  );
} else {
  App.init();
      }
