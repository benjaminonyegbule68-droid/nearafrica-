// =========================================================
// NearAfrica App
// Connected to the real NearAfrica API
// Homepage + Explore + Nigeria-first discovery
// Location-aware search + State/City filtering
// =========================================================

const App = {
  initialized: false,

  userLocation: null,

  allBusinesses: [],

  currentResults: [],

  currentPage: 1,

  pageSize: 12,

  locationStorageKey:
    "nearafrica_user_location",

  // =======================================================
  // NIGERIA LOCATION DATA
  // =======================================================

  NIGERIA_STATES: [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
    "Federal Capital Territory"
  ],

  // =======================================================
  // CONFIG
  // =======================================================

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

  // =======================================================
  // COMMON DOM HELPERS
  // =======================================================

  getElement(...ids) {
    for (const id of ids) {
      const element =
        document.getElementById(id);

      if (element) {
        return element;
      }
    }

    return null;
  },

  getElements(...ids) {
    return ids
      .map((id) =>
        document.getElementById(id)
      )
      .filter(Boolean);
  },

  // =======================================================
  // HTML ESCAPING
  // =======================================================

  escapeHtml(value) {
    if (
      window.NearAfricaUtils &&
      typeof
        window.NearAfricaUtils.escapeHtml ===
        "function"
    ) {
      return window.NearAfricaUtils.escapeHtml(
        value ?? ""
      );
    }

    const div =
      document.createElement("div");

    div.textContent =
      value === null ||
      value === undefined
        ? ""
        : String(value);

    return div.innerHTML;
  },

  // =======================================================
  // API
  // =======================================================

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
     * Supported API response shapes:
     *
     * { businesses: [] }
     * { data: { businesses: [] } }
     * { results: [] }
     * { data: { results: [] } }
     */

    if (
      Array.isArray(
        data?.businesses
      )
    ) {
      return data.businesses;
    }

    if (
      Array.isArray(
        data?.data?.businesses
      )
    ) {
      return data.data.businesses;
    }

    if (
      Array.isArray(
        data?.results
      )
    ) {
      return data.results;
    }

    if (
      Array.isArray(
        data?.data?.results
      )
    ) {
      return data.data.results;
    }

    return [];
  },

  // =======================================================
  // NORMALIZE BUSINESS
  // =======================================================

  normalizeBusiness(
    business = {}
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
      Number(
        business.latitude
      );

    const longitude =
      Number(
        business.longitude
      );

    const rating =
      Number(
        business.rating
      );

    const reviewCount =
      Number(
        business.review_count ??
        business.reviewCount ??
        0
      );

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

      business_name:
        business.business_name ||
        business.name ||
        "Unnamed Business",

      category:
        business.category ||
        "",

      subcategory:
        business.subcategory ||
        "",

      country:
        business.country ||
        "Nigeria",

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

      email:
        business.email ||
        "",

      website:
        business.website ||
        business.website_url ||
        "",

      description:
        business.description ||
        "",

      latitude:
        Number.isFinite(latitude)
          ? latitude
          : null,

      longitude:
        Number.isFinite(longitude)
          ? longitude
          : null,

      verified:
        business.verified === true ||
        business.verified === 1 ||
        business.verified === "1" ||
        business.verified === "true",

      featured:
        business.featured === true ||
        business.featured === 1 ||
        business.featured === "1" ||
        business.featured === "true",

      rating:
        Number.isFinite(rating)
          ? rating
          : null,

      reviewCount:
        Number.isFinite(
          reviewCount
        )
          ? reviewCount
          : 0,

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

  // =======================================================
  // LOCATION STORAGE
  // =======================================================

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

    this.setLocationStatus(
      ""
    );
  },

  // =======================================================
  // GEOLOCATION
  // =======================================================

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

  // =======================================================
  // LOCATION UI
  // =======================================================

  setLocationStatus(
    message,
    type = ""
  ) {
    const elements =
      this.getElements(
        "locationStatus",
        "locationMessage",
        "location-message"
      );

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
    const buttons =
      this.getElements(
        "useLocation",
        "useLocationButton",
        "use-location"
      );

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

    this.setLocationStatus(
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

      this.setLocationStatus(
        "Using your current location.",
        "success"
      );

      /*
       * If we're already on Explore,
       * immediately refresh results.
       */

      if (
        this.isExplorePage()
      ) {
        const params =
          this.getUrlParams();

        params.set(
          "nearby",
          "1"
        );

        this.updateUrl(
          params,
          false
        );

        await this.runExploreSearch();
      }

      return location;
    } catch (error) {
      this.setLocationButtonState(
        false,
        false
      );

      this.setLocationStatus(
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

  // =======================================================
  // DISTANCE
  // =======================================================

  calculateDistanceKm(
    latitude1,
    longitude1,
    latitude2,
    longitude2
  ) {
    if (
      window.NearAfricaUtils &&
      typeof
        window.NearAfricaUtils.calculateDistance ===
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

    const radius =
      6371;

    const radians =
      Math.PI / 180;

    const dLat =
      (lat2 - lat1) *
      radians;

    const dLon =
      (lon2 - lon1) *
      radians;

    const a =
      Math.sin(
        dLat / 2
      ) ** 2 +
      Math.cos(
        lat1 * radians
      ) *
        Math.cos(
          lat2 * radians
        ) *
        Math.sin(
          dLon / 2
        ) ** 2;

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return radius * c;
  },

  formatDistance(
    distanceKm
  ) {
    if (
      window.NearAfricaUtils &&
      typeof
        window.NearAfricaUtils.formatDistance ===
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
    location
  ) {
    if (
      !location ||
      !Number.isFinite(
        Number(
          location.latitude
        )
      ) ||
      !Number.isFinite(
        Number(
          location.longitude
        )
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

  // =======================================================
  // SORTING
  // =======================================================

  sortBusinesses(
    businesses,
    sortValue
  ) {
    const items = [
      ...businesses
    ];

    switch (
      String(
        sortValue || ""
      ).toLowerCase()
    ) {
      case "nearest":
      case "distance":
        return items.sort(
          (a, b) => {
            const aDistance =
              Number(
                a.distanceKm
              );

            const bDistance =
              Number(
                b.distanceKm
              );

            const aValid =
              Number.isFinite(
                aDistance
              );

            const bValid =
              Number.isFinite(
                bDistance
              );

            if (
              aValid &&
              !bValid
            ) {
              return -1;
            }

            if (
              !aValid &&
              bValid
            ) {
              return 1;
            }

            if (
              aValid &&
              bValid
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

      case "rating":
      case "highest-rated":
        return items.sort(
          (a, b) => {
            const ratingA =
              Number(
                a.rating
              ) || 0;

            const ratingB =
              Number(
                b.rating
              ) || 0;

            return (
              ratingB -
              ratingA
            );
          }
        );

      case "newest":
        return items.sort(
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

            return (
              bDate -
              aDate
            );
          }
        );

      case "featured":
        return items.sort(
          (a, b) => {
            if (
              a.featured &&
              !b.featured
            ) {
              return -1;
            }

            if (
              !a.featured &&
              b.featured
            ) {
              return 1;
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

      case "a-z":
      case "alphabetical":
      default:
        return items.sort(
          (a, b) =>
            String(
              a.name || ""
            ).localeCompare(
              String(
                b.name || ""
              )
            )
        );
    }
  },

  // =======================================================
  // CATEGORIES
  // =======================================================

  getCategories() {
    const configured =
      window.NearAfricaConfig &&
      Array.isArray(
        window.NearAfricaConfig
          .categories
      )
        ? window.NearAfricaConfig
            .categories
        : [];

    if (
      configured.length
    ) {
      return configured;
    }

    return [];
  },

  populateCategoryFilters() {
    const categories =
      this.getCategories();

    const filters =
      this.getElements(
        "categoryFilter",
        "category-filter"
      );

    filters.forEach(
      (filter) => {
        const current =
          filter.value;

        /*
         * Preserve the first
         * option already in the
         * HTML where possible.
         */

        filter.innerHTML =
          `<option value="">All Categories</option>` +
          categories
            .map(
              (category) => `
                <option value="${this.escapeHtml(
                  category
                )}">
                  ${this.escapeHtml(
                    category
                  )}
                </option>
              `
            )
            .join("");

        if (
          current &&
          categories.includes(
            current
          )
        ) {
          filter.value =
            current;
        }
      }
    );
  },

  // =======================================================
  // NIGERIA COUNTRY FILTER
  // =======================================================

  populateNigeriaCountryFilters() {
    const filters =
      this.getElements(
        "countryFilter",
        "countryFilterSecondary"
      );

    filters.forEach(
      (filter) => {
        filter.innerHTML =
          `
            <option value="">
              All Countries
            </option>

            <option value="Nigeria">
              Nigeria
            </option>
          `;

        /*
         * If the page is explicitly
         * Nigeria-first, default it
         * to Nigeria when appropriate.
         */

        if (
          filter.dataset.nigeriaOnly ===
          "true"
        ) {
          filter.value =
            "Nigeria";
        }
      }
    );
  },

  // =======================================================
  // STATE FILTER
  // =======================================================

  populateStateFilter(
    selectedState = ""
  ) {
    const stateFilter =
      this.getElement(
        "stateFilter",
        "state-filter"
      );

    if (!stateFilter) {
      return;
    }

    stateFilter.innerHTML =
      `
        <option value="">
          All States / FCT
        </option>
      ` +
      this.NIGERIA_STATES
        .map(
          (state) => `
            <option value="${this.escapeHtml(
              state
            )}">
              ${this.escapeHtml(
                state
              )}
            </option>
          `
        )
        .join("");

    if (
      selectedState &&
      this.NIGERIA_STATES.includes(
        selectedState
      )
    ) {
      stateFilter.value =
        selectedState;
    }
  },

  // =======================================================
  // CITY FILTER
  // =======================================================

  populateCityFilter(
    businesses = [],
    selectedCity = ""
  ) {
    const cityFilter =
      this.getElement(
        "cityFilter",
        "city-filter"
      );

    if (!cityFilter) {
      return;
    }

    const cities =
      new Set();

    businesses.forEach(
      (business) => {
        const city =
          String(
            business.city ||
            ""
          ).trim();

        if (city) {
          cities.add(city);
        }
      }
    );

    const sortedCities =
      [...cities].sort(
        (a, b) =>
          a.localeCompare(b)
      );

    cityFilter.innerHTML =
      `
        <option value="">
          All Cities / Areas
        </option>
      ` +
      sortedCities
        .map(
          (city) => `
            <option value="${this.escapeHtml(
              city
            )}">
              ${this.escapeHtml(
                city
              )}
            </option>
          `
        )
        .join("");

    if (
      selectedCity &&
      sortedCities.includes(
        selectedCity
      )
    ) {
      cityFilter.value =
        selectedCity;
    }
  },

  // =======================================================
  // LOCATION SELECTORS
  // =======================================================

  getSelectedCountry() {
    const filter =
      this.getElement(
        "countryFilter"
      );

    return filter
      ? filter.value.trim()
      : "";
  },

  getSelectedState() {
    const filter =
      this.getElement(
        "stateFilter",
        "state-filter"
      );

    return filter
      ? filter.value.trim()
      : "";
  },

  getSelectedCity() {
    const filter =
      this.getElement(
        "cityFilter",
        "city-filter"
      );

    return filter
      ? filter.value.trim()
      : "";
  },

  syncCountryFilters(
    source
  ) {
    const country =
      source?.value || "";

    this.getElements(
      "countryFilter",
      "countryFilterSecondary"
    ).forEach(
      (filter) => {
        if (
          filter !== source
        ) {
          filter.value =
            country;
        }
      }
    );
  },

  // =======================================================
  // URL HELPERS
  // =======================================================

  getUrlParams() {
    try {
      return new URLSearchParams(
        window.location.search
      );
    } catch (error) {
      return new URLSearchParams();
    }
  },

  updateUrl(
    params,
    replace = true
  ) {
    const query =
      params.toString();

    const url =
      query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;

    if (replace) {
      window.history.replaceState(
        {},
        "",
        url
      );
    } else {
      window.history.pushState(
        {},
        "",
        url
      );
    }
  },

  // =======================================================
  // SEARCH VALUES
  // =======================================================

  getSearchValue() {
    const input =
      this.getElement(
        "searchInput",
        "query-input",
        "search"
      );

    return input
      ? input.value.trim()
      : "";
  },

  getSortValue() {
    const filter =
      this.getElement(
        "sortFilter",
        "sort-filter"
      );

    return filter
      ? filter.value
      : "a-z";
  },

  getNearbyRequested() {
    const params =
      this.getUrlParams();

    return (
      params.get("nearby") ===
        "1" ||
      params.get("nearby") ===
        "true"
    );
  },

  // =======================================================
  // HOMEPAGE SEARCH
  // =======================================================

  handleHomepageSearch(
    event
  ) {
    if (event) {
      event.preventDefault();
    }

    const searchInput =
      this.getElement(
        "search"
      );

    const locationInput =
      this.getElement(
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

  // =======================================================
  // EXPLORE PAGE DETECTION
  // =======================================================

  isExplorePage() {
    return Boolean(
      this.getElement(
        "business-list"
      )
    );
  },

  // =======================================================
  // LOAD BUSINESSES
  // =======================================================

  async loadBusinesses(
    filters = {}
  ) {
    const params = {};

    /*
     * NearAfrica is currently
     * Nigeria-first.
     */

    params.country =
      "Nigeria";

    if (
      filters.search
    ) {
      params.search =
        filters.search;
    }

    if (
      filters.category
    ) {
      params.category =
        filters.category;
    }

    if (
      filters.state
    ) {
      params.state =
        filters.state;
    }

    if (
      filters.city
    ) {
      params.city =
        filters.city;
    }

    if (
      filters.location
    ) {
      params.location =
        filters.location;
    }

    /*
     * Request a useful amount of
     * data. The Worker can enforce
     * its own maximum safely.
     */

    params.limit = 500;

    const raw =
      await this.fetchBusinesses(
        params
      );

    return raw.map(
      (business) =>
        this.normalizeBusiness(
          business
        )
    );
  },

  // =======================================================
  // CLIENT-SIDE FILTERING
  // =======================================================

  filterBusinesses(
    businesses,
    filters
  ) {
    let results = [
      ...businesses
    ];

    const query =
      String(
        filters.search ||
        ""
      )
        .trim()
        .toLowerCase();

    const category =
      String(
        filters.category ||
        ""
      )
        .trim()
        .toLowerCase();

    const state =
      String(
        filters.state ||
        ""
      )
        .trim()
        .toLowerCase();

    const city =
      String(
        filters.city ||
        ""
      )
        .trim()
        .toLowerCase();

    const location =
      String(
        filters.location ||
        ""
      )
        .trim()
        .toLowerCase();

    if (query) {
      results =
        results.filter(
          (business) => {
            const searchable = [
              business.name,
              business.category,
              business.subcategory,
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
              query
            );
          }
        );
    }

    if (category) {
      results =
        results.filter(
          (business) =>
            String(
              business.category ||
              ""
            )
              .trim()
              .toLowerCase() ===
            category
        );
    }

    if (state) {
      results =
        results.filter(
          (business) =>
            String(
              business.state ||
              ""
            )
              .trim()
              .toLowerCase() ===
            state
        );
    }

    if (city) {
      results =
        results.filter(
          (business) =>
            String(
              business.city ||
              ""
            )
              .trim()
              .toLowerCase() ===
            city
        );
    }

    if (location) {
      results =
        results.filter(
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
              location
            );
          }
        );
    }

    return results;
  },

  // =======================================================
  // BUSINESS IMAGE
  // =======================================================

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

  // =======================================================
  // BUSINESS CARD
  // =======================================================

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

      if (websiteUrl) {
        websiteHtml = `
          <a
            href="${this.escapeHtml(
              websiteUrl
            )}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Website
          </a>
        `;
      }
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

  // =======================================================
  // PAGINATION
  // =======================================================

  getPaginationElements() {
    return {
      container:
        this.getElement(
          "pagination"
        ),

      previous:
        this.getElement(
          "prevPage",
          "previousPage"
        ),

      next:
        this.getElement(
          "nextPage"
        ),

      current:
        this.getElement(
          "currentPage"
        )
    };
  },

  renderPagination() {
    const {
      container,
      previous,
      next,
      current
    } =
      this.getPaginationElements();

    if (!container) {
      return;
    }

    const total =
      this.currentResults.length;

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total /
            this.pageSize
        )
      );

    if (
      totalPages <= 1
    ) {
      container.hidden =
        true;

      return;
    }

    container.hidden =
      false;

    if (previous) {
      previous.disabled =
        this.currentPage <= 1;
    }

    if (next) {
      next.disabled =
        this.currentPage >=
        totalPages;
    }

    if (current) {
      current.textContent =
        `${this.currentPage} / ${totalPages}`;
    }
  },

  getCurrentPageResults() {
    const start =
      (this.currentPage -
        1) *
      this.pageSize;

    return this.currentResults.slice(
      start,
      start +
        this.pageSize
    );
  },

  changePage(
    direction
  ) {
    const totalPages =
      Math.max(
        1,
        Math.ceil(
          this.currentResults
            .length /
            this.pageSize
        )
      );

    const nextPage =
      this.currentPage +
      direction;

    if (
      nextPage < 1 ||
      nextPage >
        totalPages
    ) {
      return;
    }

    this.currentPage =
      nextPage;

    this.renderCurrentPage();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  },

  // =======================================================
  // RENDER CURRENT PAGE
  // =======================================================

  renderCurrentPage() {
    const businessList =
      this.getElement(
        "business-list"
      );

    const emptyState =
      this.getElement(
        "emptyState",
        "empty-state"
      );

    const resultCount =
      this.getElement(
        "resultCount",
        "results-count"
      );

    if (!businessList) {
      return;
    }

    if (
      !this.currentResults.length
    ) {
      businessList.innerHTML =
        "";

      if (emptyState) {
        emptyState.hidden =
          false;
      }

      if (resultCount) {
        resultCount.textContent =
          "0";
      }

      this.renderPagination();

      return;
    }

    if (emptyState) {
      emptyState.hidden =
        true;
    }

    const pageResults =
      this.getCurrentPageResults();

    businessList.innerHTML =
      pageResults
        .map(
          (business) =>
            this.renderBusinessCard(
              business
            )
        )
        .join("");

    if (resultCount) {
      resultCount.textContent =
        String(
          this.currentResults
            .length
        );
    }

    this.renderPagination();
  },

  // =======================================================
  // STATUS UI
  // =======================================================

  setSearchStatus(
    message,
    type = ""
  ) {
    const status =
      this.getElement(
        "statusMessage",
        "status"
      );

    if (!status) {
      return;
    }

    status.textContent =
      message || "";

    status.classList.remove(
      "success",
      "error",
      "loading"
    );

    if (type) {
      status.classList.add(
        type
      );
    }
  },

  setNearbyIndicator(
    active
  ) {
    const indicator =
      this.getElement(
        "nearbyIndicator"
      );

    if (!indicator) {
      return;
    }

    indicator.hidden =
      !active;
  },

  // =======================================================
  // EXPLORE SEARCH
  // =======================================================

  async runExploreSearch() {
    const businessList =
      this.getElement(
        "business-list"
      );

    if (!businessList) {
      return;
    }

    const searchInput =
      this.getElement(
        "searchInput",
        "query-input"
      );

    const categoryFilter =
      this.getElement(
        "categoryFilter",
        "category-filter"
      );

    const countryFilter =
      this.getElement(
        "countryFilter"
      );

    const stateFilter =
      this.getElement(
        "stateFilter",
        "state-filter"
      );

    const cityFilter =
      this.getElement(
        "cityFilter",
        "city-filter"
      );

    const locationFilter =
      this.getElement(
        "locationFilter",
        "location-input"
      );

    const sortFilter =
      this.getElement(
        "sortFilter",
        "sort-filter"
      );

    const params =
      this.getUrlParams();

    /*
     * Support both:
     *
     * ?search=hotel
     *
     * and:
     *
     * ?q=hotel
     */

    const urlSearch =
      params.get(
        "search"
      ) ||
      params.get(
        "q"
      ) ||
      "";

    const urlLocation =
      params.get(
        "location"
      ) ||
      "";

    const urlCategory =
      params.get(
        "category"
      ) ||
      "";

    const urlState =
      params.get(
        "state"
      ) ||
      "";

    const urlCity =
      params.get(
        "city"
      ) ||
      "";

    const urlSort =
      params.get(
        "sort"
      ) ||
      "";

    if (
      searchInput &&
      !searchInput.value &&
      urlSearch
    ) {
      searchInput.value =
        urlSearch;
    }

    if (
      categoryFilter &&
      !categoryFilter.value &&
      urlCategory
    ) {
      categoryFilter.value =
        urlCategory;
    }

    if (
      stateFilter &&
      !stateFilter.value &&
      urlState
    ) {
      stateFilter.value =
        urlState;
    }

    if (
      cityFilter &&
      !cityFilter.value &&
      urlCity
    ) {
      cityFilter.value =
        urlCity;
    }

    if (
      locationFilter &&
      !locationFilter.value &&
      urlLocation
    ) {
      locationFilter.value =
        urlLocation;
    }

    if (
      sortFilter &&
      !sortFilter.value &&
      urlSort
    ) {
      sortFilter.value =
        urlSort;
    }

    /*
     * Always keep the current
     * country Nigeria.
     */

    if (countryFilter) {
      countryFilter.value =
        "Nigeria";
    }

    const search =
      searchInput
        ? searchInput.value.trim()
        : urlSearch.trim();

    const category =
      categoryFilter
        ? categoryFilter.value.trim()
        : urlCategory.trim();

    const state =
      stateFilter
        ? stateFilter.value.trim()
        : urlState.trim();

    const city =
      cityFilter
        ? cityFilter.value.trim()
        : urlCity.trim();

    const location =
      locationFilter
        ? locationFilter.value.trim()
        : urlLocation.trim();

    const sort =
      sortFilter
        ? sortFilter.value
        : urlSort ||
          "a-z";

    const nearby =
      this.getNearbyRequested();

    this.setSearchStatus(
      "Loading businesses...",
      "loading"
    );

    this.setNearbyIndicator(
      nearby
    );

    businessList.innerHTML =
      "";

    const emptyState =
      this.getElement(
        "emptyState",
        "empty-state"
      );

    if (emptyState) {
      emptyState.hidden =
        true;
    }

    try {
      /*
       * Ask the API for the
       * selected location first.
       *
       * Client-side filtering below
       * provides a second layer.
       */

      let businesses =
        await this.loadBusinesses({
          search,
          category,
          state,
          city,
          location
        });

      /*
       * Apply client-side filters
       * for compatibility with API
       * versions that may not support
       * every query parameter.
       */

      businesses =
        this.filterBusinesses(
          businesses,
          {
            search,
            category,
            state,
            city,
            location
          }
        );

      /*
       * Update City/Area choices
       * from actual businesses.
       */

      this.populateCityFilter(
        businesses,
        city
      );

      // ---------------------------------------------------
      // PRECISE LOCATION
      // ---------------------------------------------------

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
           * Never show a business as
           * nearby if it has no valid
           * coordinates.
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

          /*
           * Nearest first.
           */

          businesses.sort(
            (a, b) =>
              Number(
                a.distanceKm
              ) -
              Number(
                b.distanceKm
              )
          );

          this.setLocationButtonState(
            true,
            false
          );

          this.setLocationStatus(
            "Using your current location.",
            "success"
          );
        } else {
          /*
           * Nearby was requested
           * but no location exists.
           */

          this.setLocationButtonState(
            false,
            false
          );

          this.setLocationStatus(
            "Use My Location to find businesses near you.",
            "active"
          );
        }
      }

      // ---------------------------------------------------
      // SORTING
      // ---------------------------------------------------

      if (!nearby) {
        businesses =
          this.sortBusinesses(
            businesses,
            sort
          );
      }

      this.currentResults =
        businesses;

      this.currentPage =
        1;

      this.renderCurrentPage();

      /*
       * Status message.
       */

      if (!businesses.length) {
        this.setSearchStatus(
          "No businesses found.",
          ""
        );
      } else if (nearby) {
        this.setSearchStatus(
          `${businesses.length} business${
            businesses.length === 1
              ? ""
              : "es"
          } found near you.`,
          "success"
        );
      } else {
        this.setSearchStatus(
          `${businesses.length} business${
            businesses.length === 1
              ? ""
              : "es"
          } found.`,
          "success"
        );
      }

      /*
       * Update URL without
       * reloading the page.
       */

      const newParams =
        new URLSearchParams();

      if (search) {
        newParams.set(
          "search",
          search
        );
      }

      if (category) {
        newParams.set(
          "category",
          category
        );
      }

      if (state) {
        newParams.set(
          "state",
          state
        );
      }

      if (city) {
        newParams.set(
          "city",
          city
        );
      }

      if (location) {
        newParams.set(
          "location",
          location
        );
      }

      if (sort) {
        newParams.set(
          "sort",
          sort
        );
      }

      if (nearby) {
        newParams.set(
          "nearby",
          "1"
        );
      }

      this.updateUrl(
        newParams,
        true
      );
    } catch (error) {
      console.error(
        "NearAfrica business loading error:",
        error
      );

      this.currentResults =
        [];

      this.currentPage =
        1;

      businessList.innerHTML =
        "";

      if (emptyState) {
        emptyState.hidden =
          true;
      }

      this.setSearchStatus(
        error?.message ||
        "Unable to load businesses.",
        "error"
      );
    }
  },

  // =======================================================
  // FILTER EVENT HANDLERS
  // =======================================================

  handleFilterChange() {
    this.runExploreSearch();
  },

  handleSearchSubmit(
    event
  ) {
    if (event) {
      event.preventDefault();
    }

    this.runExploreSearch();
  },

  // =======================================================
  // EXPLORE EVENTS
  // =======================================================

  initExploreControls() {
    if (
      !this.isExplorePage()
    ) {
      return;
    }

    const searchButton =
      this.getElement(
        "searchButton"
      );

    const searchForm =
      this.getElement(
        "search-form",
        "searchForm"
      );

    const searchInput =
      this.getElement(
        "searchInput",
        "query-input"
      );

    const categoryFilter =
      this.getElement(
        "categoryFilter",
        "category-filter"
      );

    const countryFilter =
      this.getElement(
        "countryFilter"
      );

    const countryFilterSecondary =
      this.getElement(
        "countryFilterSecondary"
      );

    const stateFilter =
      this.getElement(
        "stateFilter",
        "state-filter"
      );

    const cityFilter =
      this.getElement(
        "cityFilter",
        "city-filter"
      );

    const sortFilter =
      this.getElement(
        "sortFilter",
        "sort-filter"
      );

    const locationFilter =
      this.getElement(
        "locationFilter",
        "location-input"
      );

    const useLocationButton =
      this.getElement(
        "useLocationButton",
        "useLocation",
        "use-location"
      );

    const clearLocationButton =
      this.getElement(
        "clearLocationButton"
      );

    const previousPage =
      this.getElement(
        "prevPage",
        "previousPage"
      );

    const nextPage =
      this.getElement(
        "nextPage"
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
          this.handleSearchSubmit(
            event
          )
      );
    }

    if (
      searchButton &&
      !searchButton.dataset.nearAfricaBound
    ) {
      searchButton.dataset.nearAfricaBound =
        "true";

      searchButton.addEventListener(
        "click",
        (event) => {
          event.preventDefault();

          this.runExploreSearch();
        }
      );
    }

    if (
      searchInput &&
      !searchInput.dataset.nearAfricaBound
    ) {
      searchInput.dataset.nearAfricaBound =
        "true";

      searchInput.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key ===
            "Enter"
          ) {
            event.preventDefault();

            this.runExploreSearch();
          }
        }
      );
    }

    [
      categoryFilter,
      stateFilter,
      cityFilter,
      sortFilter,
      locationFilter
    ]
      .filter(Boolean)
      .forEach(
        (element) => {
          if (
            element.dataset
              .nearAfricaBound
          ) {
            return;
          }

          element.dataset.nearAfricaBound =
            "true";

          element.addEventListener(
            "change",
            () =>
              this.runExploreSearch()
          );
        }
      );

    [
      countryFilter,
      countryFilterSecondary
    ]
      .filter(Boolean)
      .forEach(
        (element) => {
          if (
            element.dataset
              .nearAfricaBound
          ) {
            return;
          }

          element.dataset.nearAfricaBound =
            "true";

          element.addEventListener(
            "change",
            () => {
              this.syncCountryFilters(
                element
              );

              /*
               * NearAfrica is currently
               * Nigeria-only.
               */

              if (
                element.value &&
                element.value !==
                  "Nigeria"
              ) {
                element.value =
                  "Nigeria";

                this.syncCountryFilters(
                  element
                );
              }

              this.runExploreSearch();
            }
          );
        }
      );

    if (
      useLocationButton &&
      !useLocationButton.dataset
        .nearAfricaBound
    ) {
      useLocationButton.dataset
        .nearAfricaBound =
        "true";

      useLocationButton.addEventListener(
        "click",
        () =>
          this.handleUseLocation()
      );
    }

    if (
      clearLocationButton &&
      !clearLocationButton.dataset
        .nearAfricaBound
    ) {
      clearLocationButton.dataset
        .nearAfricaBound =
        "true";

      clearLocationButton.addEventListener(
        "click",
        () => {
          this.clearUserLocation();

          const params =
            this.getUrlParams();

          params.delete(
            "nearby"
          );

          this.updateUrl(
            params,
            true
          );

          this.setNearbyIndicator(
            false
          );

          this.runExploreSearch();
        }
      );
    }

    if (
      previousPage &&
      !previousPage.dataset
        .nearAfricaBound
    ) {
      previousPage.dataset
        .nearAfricaBound =
        "true";

      previousPage.addEventListener(
        "click",
        () =>
          this.changePage(-1)
      );
    }

    if (
      nextPage &&
      !nextPage.dataset
        .nearAfricaBound
    ) {
      nextPage.dataset
        .nearAfricaBound =
        "true";

      nextPage.addEventListener(
        "click",
        () =>
          this.changePage(1)
      );
    }
  },

  // =======================================================
  // HOMEPAGE INITIALIZATION
  // =======================================================

  initHomepage() {
    const homepageForm =
      this.getElement(
        "searchForm"
      );

    if (
      !homepageForm ||
      homepageForm.dataset
        .nearAfricaBound
    ) {
      return;
    }

    homepageForm.dataset
      .nearAfricaBound =
      "true";

    homepageForm.addEventListener(
      "submit",
      (event) =>
        this.handleHomepageSearch(
          event
        )
    );
  },

  // =======================================================
  // LOCATION INITIALIZATION
  // =======================================================

  initLocation() {
    const stored =
      this.getStoredUserLocation();

    if (stored) {
      this.userLocation =
        stored;

      this.setLocationButtonState(
        true,
        false
      );

      this.setLocationStatus(
        "Using your current location.",
        "success"
      );
    }

    const buttons =
      this.getElements(
        "useLocation",
        "useLocationButton",
        "use-location"
      );

    /*
     * Explore-specific binding
     * happens in initExploreControls.
     *
     * Homepage buttons need their
     * own binding here.
     */

    buttons.forEach(
      (button) => {
        if (
          button.dataset
            .nearAfricaBound
        ) {
          return;
        }

        /*
         * Don't bind Explore's
         * button twice.
         */

        if (
          this.isExplorePage()
        ) {
          return;
        }

        button.dataset
          .nearAfricaBound =
          "true";

        button.addEventListener(
          "click",
          () =>
            this.handleUseLocation()
        );
      }
    );
  },

  // =======================================================
  // INITIALIZATION
  // =======================================================

  init() {
    if (
      this.initialized
    ) {
      return;
    }

    this.initialized =
      true;

    console.log(
      "NearAfrica App initialized."
    );

    /*
     * Populate Nigeria location
     * controls.
     */

    try {
      this.populateNigeriaCountryFilters();

      this.populateStateFilter();
    } catch (error) {
      console.error(
        "NearAfrica location filter initialization error:",
        error
      );
    }

    /*
     * Categories.
     */

    try {
      this.populateCategoryFilters();
    } catch (error) {
      console.error(
        "NearAfrica category initialization error:",
        error
      );
    }

    /*
     * Stored location.
     */

    try {
      this.initLocation();
    } catch (error) {
      console.error(
        "NearAfrica location initialization error:",
        error
      );
    }

    /*
     * Homepage.
     */

    try {
      this.initHomepage();
    } catch (error) {
      console.error(
        "NearAfrica homepage initialization error:",
        error
      );
    }

    /*
     * Explore.
     */

    try {
      this.initExploreControls();
    } catch (error) {
      console.error(
        "NearAfrica Explore initialization error:",
        error
      );
    }

    /*
     * Only Explore/business-list
     * pages automatically call the
     * real API.
     *
     * Homepage remains lightweight.
     */

    if (
      this.isExplorePage()
    ) {
      this.runExploreSearch();
    }
  }
};

// =========================================================
// GLOBAL EXPORT
// =========================================================

window.NearAfricaApp =
  App;

// =========================================================
// START
// =========================================================

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    () =>
      App.init(),
    {
      once: true
    }
  );
} else {
  App.init();
        }
