// =========================================================
// NearAfrica App
// Connected to real NearAfrica API
// =========================================================

const App = {
  userLocation: null,
  currentResults: [],
  mapVisible: true,
  apiBaseUrl: "",

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
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
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
  // Convert API data into the format the frontend understands
  // ---------------------------------------------------------

  normalizeBusiness(business) {
    return {
      id: business.id,

      name: business.business_name,

      category: business.category,

      country: business.country,

      state: business.state,

      city: business.city,

      address: business.address,

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

      verified: Boolean(business.verified),

      featured: Boolean(business.featured),

      // These do NOT exist in D1 yet.
      // We intentionally do not invent them.
      rating: null,

      reviewCount: 0,

      images: [],

      openingHours: null,

      services: []
    };
  },

  // ---------------------------------------------------------
  // HTML helpers
  // ---------------------------------------------------------

  escapeHtml(value) {
    if (window.NearAfricaUtils?.escapeHtml) {
      return window.NearAfricaUtils.escapeHtml(value || "");
    }

    const div = document.createElement("div");
    div.textContent = value || "";
    return div.innerHTML;
  },

  // ---------------------------------------------------------
  // Business Card
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
      ? `<a href="tel:${this.escapeHtml(biz.phone)}">Call</a>`
      : "";

    const whatsappHtml = biz.whatsapp
      ? `<a href="https://wa.me/${biz.whatsapp.replace(
          /[^0-9]/g,
          ""
        )}" target="_blank" rel="noopener">WhatsApp</a>`
      : "";

    const websiteHtml = biz.website
      ? `<a href="${this.escapeHtml(
          biz.website
        )}" target="_blank" rel="noopener">Website</a>`
      : "";

    return `
      <article class="business-card" data-business-id="${this.escapeHtml(
        biz.id
      )}">

        <div class="business-card-content">

          <div class="business-card-header">

            <div>
              <h3>${this.escapeHtml(biz.name)}</h3>

              <p class="business-category">
                ${this.escapeHtml(biz.category)}
              </p>
            </div>

            <div class="business-badges">
              ${featuredBadge}
              ${verifiedBadge}
            </div>

          </div>

          ${
            biz.description
              ? `<p class="business-description">
                  ${this.escapeHtml(biz.description)}
                </p>`
              : ""
          }

          <div class="business-meta">

            <span>
              📍 ${this.escapeHtml(biz.address)}
            </span>

            ${
              biz.city
                ? `<span>
                    ${this.escapeHtml(biz.city)}, 
                    ${this.escapeHtml(biz.state)}
                  </span>`
                : ""
            }

            ${ratingHtml}

          </div>

          <div class="business-actions">

            <a href="business.html?id=${encodeURIComponent(
              biz.id
            )}">
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
      document.getElementById("category-filter");

    if (!categoryFilter) return;

    const categories =
      window.NearAfricaData?.categories || [];

    categoryFilter.innerHTML =
      `<option value="">All Categories</option>` +
      categories
        .map(
          (category) =>
            `<option value="${this.escapeHtml(category)}">
              ${this.escapeHtml(category)}
            </option>`
        )
        .join("");
  },

  // ---------------------------------------------------------
  // Search
  // ---------------------------------------------------------

  async performSearch(event) {
    if (event) event.preventDefault();

    await this.runSearchPage();
  },

  async runSearchPage() {
    const queryInput =
      document.getElementById("query-input");

    const locationInput =
      document.getElementById("location-input");

    const categoryFilter =
      document.getElementById("category-filter");

    const sortSelect =
      document.getElementById("sort-select");

    const openNowCheck =
      document.getElementById("open-now-check");

    const query = queryInput
      ? queryInput.value.trim()
      : "";

    const location = locationInput
      ? locationInput.value.trim()
      : "";

    const category = categoryFilter
      ? categoryFilter.value
      : "";

    const sortBy = sortSelect
      ? sortSelect.value
      : "name";

    const openNow = openNowCheck
      ? openNowCheck.checked
      : false;

    const loadingState =
      document.getElementById("loading-state");

    const emptyState =
      document.getElementById("empty-state");

    const businessList =
      document.getElementById("business-list");

    const resultsCount =
      document.getElementById("results-count");

    const resultsTitle =
      document.getElementById("results-title");
