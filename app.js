// =========================================================
// NearAfrica App
// Connected to real NearAfrica API
// =========================================================

const App = {
  userLocation: null,
  currentResults: [],
  mapVisible: true,

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
      throw new Error("NearAfrica API URL is not configured.");
    }

    const url = new URL(`${baseUrl}/businesses`);

    Object.entries(params).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status}`
      );
    }

    const data = await response.json();

    if (
      data.status !== "ok" &&
      data.success !== true
    ) {
      throw new Error(
        data.message || "Unable to load businesses."
      );
    }

    return Array.isArray(data.businesses)
      ? data.businesses
      : [];
  },

  // ---------------------------------------------------------
  // Normalize API business
  // ---------------------------------------------------------

  normalizeBusiness(business) {
    const imageFromArray =
      Array.isArray(business.images) &&
      business.images.length
        ? (
            business.images[0]?.image_url ||
            business.images[0]?.url ||
            ""
          )
        : "";

    return {
      id: business.id || "",

      name:
        business.business_name ||
        business.name ||
        "Unnamed Business",

      category: business.category || "",

      country: business.country || "",

      state: business.state || "",

      city: business.city || "",

      address: business.address || "",

      phone: business.phone || "",

      whatsapp: business.whatsapp || "",

      website: business.website || "",

      description: business.description || "",

      email: business.email || "",

      latitude:
        business.latitude !== null &&
        business.latitude !== undefined
          ? Number(business.latitude)
          : null,

      longitude:
        business.longitude !== null &&
        business.longitude !== undefined
          ? Number(business.longitude)
          : null,

      verified:
        Boolean(business.verified),

      featured:
        Boolean(business.featured),

      rating:
        typeof business.rating === "number"
          ? business.rating
          : null,

      reviewCount:
        Number(business.review_count || 0),

      // -----------------------------------------------------
      // Image support
      // -----------------------------------------------------

      imageUrl:
        business.image_url ||
        business.imageUrl ||
        imageFromArray,

      images:
        Array.isArray(business.images)
          ? business.images
          : [],

      openingHours:
        business.opening_hours || null,

      services:
        Array.isArray(business.services)
          ? business.services
          : []
    };
  },

  // ---------------------------------------------------------
  // HTML helpers
  // ---------------------------------------------------------

  escapeHtml(value) {
    if (
      window.NearAfricaUtils &&
      typeof window.NearAfricaUtils.escapeHtml === "function"
    ) {
      return window.NearAfricaUtils.escapeHtml(
        value || ""
      );
    }

    const div = document.createElement("div");

    div.textContent =
      value === null ||
      value === undefined
        ? ""
        : String(value);

    return div.innerHTML;
  },

  // ---------------------------------------------------------
  // Business image
  // ---------------------------------------------------------

  renderBusinessImage(biz) {
    const businessInitial =
      String(biz.name || "B")
        .trim()
        .charAt(0)
        .toUpperCase() || "B";

    const imageUrl =
      String(biz.imageUrl || "").trim();

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
      this.escapeHtml(imageUrl);

    const safeBusinessName =
      this.escapeHtml(biz.name);

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
  // Business card
  // ---------------------------------------------------------

  renderBusinessCard(biz) {
    const verifiedBadge = biz.verified
      ? `<span class="verified-badge">✓ Verified</span>`
      : "";

    const featuredBadge = biz.featured
      ? `<span class="featured-badge">Featured</span>`
      : "";

    const ratingHtml =
      typeof biz.rating === "number"
        ? `<span>★ ${biz.rating.toFixed(1)}</span>`
        : "";

    const phoneHtml = biz.phone
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
      String(biz.whatsapp || "").replace(
        /[^0-9]/g,
        ""
      );

    const whatsappHtml =
      biz.whatsapp && whatsappNumber
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

    const websiteHtml = biz.website
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

        ${this.renderBusinessImage(biz)}

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
              biz.city || biz.state
                ? `
                  <span>
                    ${this.escapeHtml(
                      biz.city
                    )}
                    ${
                      biz.city && biz.state
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
  // Categories
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
        window.NearAfricaData.categories
      )
        ? window.NearAfricaData.categories
        : [];

    categoryFilter.innerHTML =
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
  },

  // ---------------------------------------------------------
  // Render businesses
  // ---------------------------------------------------------

  renderBusinesses(businesses) {
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

    if (!businesses.length) {
      businessList.innerHTML = "";

      if (emptyState) {
        emptyState.hidden = false;
      }

      if (resultsCount) {
        resultsCount.textContent = "0";
      }

      return;
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    businessList.innerHTML =
      businesses
        .map((business) =>
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
  // Search
  // ---------------------------------------------------------

  async performSearch(event) {
    if (event) {
      event.preventDefault();
    }

    await this.runSearchPage();
  },

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
        loadingState.hidden = false;
      }

      if (emptyState) {
        emptyState.hidden = true;
      }

      if (errorMessage) {
        errorMessage.hidden = true;
      }

      if (businessList) {
        businessList.innerHTML = "";
      }

      const params = {};

      if (query) {
        params.search = query;
      }

      if (location) {
        params.location = location;
      }

      if (category) {
        params.category = category;
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

      if (category) {
        const categoryText =
          category.toLowerCase();

        businesses =
          businesses.filter(
            (business) =>
              String(
                business.category || ""
              ).toLowerCase() ===
              categoryText
          );
      }

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

      this.currentResults =
        businesses;

      if (resultsTitle) {
        resultsTitle.textContent =
          query
            ? `Search results for "${query}"`
            : "Businesses";
      }

      this.renderBusinesses(
        businesses
      );

    } catch (error) {
      console.error(
        "NearAfrica business loading error:",
        error
      );

      if (businessList) {
        businessList.innerHTML = "";
      }

      if (emptyState) {
        emptyState.hidden = true;
      }

      if (resultsCount) {
        resultsCount.textContent = "0";
      }

      if (resultsTitle) {
        resultsTitle.textContent =
          "Unable to load businesses";
      }

      if (errorMessage) {
        errorMessage.hidden = false;
      }

    } finally {
      if (loadingState) {
        loadingState.hidden = true;
      }
    }
  },

  // ---------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------

  init() {
    console.log(
      "NearAfrica App initialized."
    );

    this.renderCategories();

    const searchForm =
      document.getElementById(
        "search-form"
      );

    if (searchForm) {
      searchForm.addEventListener(
        "submit",
        (event) =>
          this.performSearch(event)
      );
    }

    this.runSearchPage();
  }
};

// ---------------------------------------------------------
// Make App globally available
// ---------------------------------------------------------

window.NearAfricaApp = App;

// ---------------------------------------------------------
// Start application
// ---------------------------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  () => {
    App.init();
  }
);
