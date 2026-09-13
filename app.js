/**
 * NearAfrica - Main Application Logic
 * ===================================
 */

const App = {
  userLocation: null, // { lat, lng }
  currentResults: [],
  mapVisible: false
};

/**
 * Render a business card HTML
 */
function renderBusinessCard(biz) {
  const utils = window.NearAfricaUtils;
  const openStatus = utils.isOpenNow(biz.openingHours);
  const openBadge =
    openStatus === true
      ? '<span class="badge badge-open">Open now</span>'
      : openStatus === false
      ? '<span class="badge badge-closed">Closed</span>'
      : "";

  const verifiedBadge = biz.verified
    ? '<span class="badge badge-verified">✓ Verified</span>'
    : "";
  const featuredBadge = biz.featured
    ? '<span class="badge badge-featured">Featured</span>'
    : "";

  const img =
    biz.images && biz.images[0]
      ? biz.images[0]
      : "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80";

  const distanceStr =
    biz.distance != null ? utils.formatDistance(biz.distance) : "";

  const whatsappBtn = biz.whatsapp
    ? `<a href="${utils.whatsappLink(biz.whatsapp, "Hello, I found you on NearAfrica")}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm">WhatsApp</a>`
    : "";

  const directionsBtn =
    biz.latitude != null
      ? `<a href="${utils.directionsLink(biz.latitude, biz.longitude, biz.address)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Directions</a>`
      : "";

  // Relative path depends on whether we are already under /pages/
  const inPages = window.location.pathname.includes("/pages/");
  const detailHref = inPages
    ? `business.html?id=${encodeURIComponent(biz.id)}`
    : `pages/business.html?id=${encodeURIComponent(biz.id)}`;

  return `
    <article class="card business-card" data-id="${utils.escapeHtml(biz.id)}">
      <div class="business-card-image">
        <img src="${utils.escapeHtml(img)}" alt="${utils.escapeHtml(biz.name)}" loading="lazy" width="400" height="250">
        <div class="card-badges">
          ${featuredBadge}
          ${verifiedBadge}
          ${openBadge}
        </div>
      </div>
      <div class="business-card-body">
        <h3 class="business-card-name">${utils.escapeHtml(biz.name)}</h3>
        <div class="business-card-meta">
          <span>${utils.escapeHtml(biz.category)}</span>
          <span class="rating">★ ${utils.formatRating(biz.rating)}</span>
          ${distanceStr ? `<span>${distanceStr}</span>` : ""}
        </div>
        <p class="business-card-address">${utils.escapeHtml(biz.address)}</p>
        <p class="business-card-desc">${utils.escapeHtml(biz.description || "")}</p>
        <div class="business-card-actions">
          <a href="${detailHref}" class="btn btn-primary btn-sm">View Details</a>
          ${directionsBtn}
          ${whatsappBtn}
        </div>
      </div>
    </article>
  `;
}

/**
 * Render category cards on home page
 */
function renderCategories() {
  const container = document.getElementById("categories-grid");
  if (!container || !window.NearAfricaData) return;

  const icons = {
    spa: "💆",
    utensils: "🍽️",
    scissors: "✂️",
    hair: "💇",
    hotel: "🏨",
    shirt: "👗",
    dumbbell: "🏋️",
    hospital: "🏥",
    wrench: "🔧",
    building: "🏢",
    graduation: "🎓",
    cart: "🛒",
    camera: "📷",
    calendar: "📅",
    store: "🏪"
  };

  container.innerHTML = window.NearAfricaData.categories
    .map((cat) => {
      const icon = icons[cat.icon] || "📍";
      return `
        <button type="button" class="category-card" data-category="${utilsEscape(cat.name)}" aria-label="Search ${utilsEscape(cat.name)}">
          <div class="category-icon">${icon}</div>
          <div class="category-name">${utilsEscape(cat.name)}</div>
        </button>
      `;
    })
    .join("");

  container.querySelectorAll(".category-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.category;
      const locInput = document.getElementById("location-input");
      const queryInput = document.getElementById("query-input");
      if (queryInput) queryInput.value = cat;
      performSearch({ query: cat, location: locInput ? locInput.value : "" });
    });
  });
}

function utilsEscape(str) {
  return window.NearAfricaUtils ? window.NearAfricaUtils.escapeHtml(str) : str;
}

/**
 * Perform search and navigate or update results page
 */
function performSearch(opts = {}) {
  const query = opts.query || (document.getElementById("query-input") || {}).value || "";
  const location = opts.location || (document.getElementById("location-input") || {}).value || "";

  const params = {
    q: query,
    loc: location
  };

  if (App.userLocation) {
    params.lat = App.userLocation.lat;
    params.lng = App.userLocation.lng;
  }

  // Resolve location text to coords if no user location
  if (!App.userLocation && location) {
    const resolved = window.NearAfricaUtils.resolveLocation(location);
    if (resolved) {
      params.lat = resolved.lat;
      params.lng = resolved.lng;
    }
  }

  const qs = window.NearAfricaUtils.buildQueryString(params);
  // Determine if we are on home or search page
  const isHome = !window.location.pathname.includes("search.html") &&
                 !window.location.pathname.includes("pages/");

  if (isHome) {
    window.location.href = `pages/search.html?${qs}`;
  } else {
    // Already on search page – update URL and re-run
    window.history.replaceState({}, "", `?${qs}`);
    runSearchPage();
  }
}

/**
 * Use My Location button handler
 */
async function handleUseMyLocation() {
  const btn = document.getElementById("use-location-btn");
  const msg = document.getElementById("location-message");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Getting location…";
  }
  if (msg) {
    msg.textContent = "";
    msg.className = "text-muted mt-1";
  }

  try {
    const pos = await window.NearAfricaUtils.getUserLocation();
    App.userLocation = pos;
    if (msg) {
      msg.textContent = "Location detected. You can now search nearby.";
      msg.style.color = "var(--success)";
    }
    // Optionally reverse-geocode later; for now leave location input empty or set approximate
    const locInput = document.getElementById("location-input");
    if (locInput && !locInput.value) {
      locInput.placeholder = "Using your current location";
    }
  } catch (err) {
    if (msg) {
      msg.textContent = err.message;
      msg.style.color = "var(--danger)";
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "📍 Use My Location";
    }
  }
}

/**
 * Run the search results page logic
 */
function runSearchPage() {
  const params = window.NearAfricaUtils.getQueryParams();
  const query = params.q || "";
  const locationLabel = params.loc || "";
  let lat = params.lat ? parseFloat(params.lat) : null;
  let lng = params.lng ? parseFloat(params.lng) : null;

  // Fallback resolve location
  if ((lat == null || lng == null) && locationLabel) {
    const resolved = window.NearAfricaUtils.resolveLocation(locationLabel);
    if (resolved) {
      lat = resolved.lat;
      lng = resolved.lng;
    }
  }

  // Store user location if provided
  if (lat != null && lng != null) {
    App.userLocation = { lat, lng };
  }

  // Update header text
  const titleEl = document.getElementById("results-title");
  if (titleEl) {
    const what = query || "Businesses";
    const where = locationLabel ? ` near ${locationLabel}` : (lat != null ? " near you" : "");
    titleEl.textContent = `${what}${where}`;
  }

  // Fill search inputs if present
  const qInput = document.getElementById("query-input");
  const locInput = document.getElementById("location-input");
  if (qInput) qInput.value = query;
  if (locInput) locInput.value = locationLabel;

  const listEl = document.getElementById("business-list");
  const countEl = document.getElementById("results-count");
  const loadingEl = document.getElementById("loading-state");
  const emptyEl = document.getElementById("empty-state");

  if (loadingEl) loadingEl.classList.remove("hidden");
  if (listEl) listEl.innerHTML = "";
  if (emptyEl) emptyEl.classList.add("hidden");

  // Simulate short loading for UX
  setTimeout(() => {
    const sortBy = (document.getElementById("sort-select") || {}).value || "distance";
    const openNow = (document.getElementById("open-now-check") || {}).checked || false;
    const categoryFilter = (document.getElementById("category-filter") || {}).value || "";

    const results = window.NearAfricaUtils.searchBusinesses(
      window.NearAfricaData.businesses,
      {
        query,
        category: categoryFilter || query,
        lat,
        lng,
        radiusKm: window.NearAfricaConfig.defaultRadiusKm,
        sortBy,
        openNow
      }
    );

    // If category filter is set and query was a category, avoid double-filtering issues
    // The search function already handles category + keyword

    App.currentResults = results;

    if (loadingEl) loadingEl.classList.add("hidden");

    if (countEl) {
      countEl.textContent = `${results.length} result${results.length !== 1 ? "s" : ""}`;
    }

    if (results.length === 0) {
      if (emptyEl) emptyEl.classList.remove("hidden");
      if (listEl) listEl.innerHTML = "";
    } else {
      if (listEl) {
        listEl.innerHTML = results.map(renderBusinessCard).join("");
      }
    }

    // Map
    initSearchMap(results, lat, lng);
  }, 300);
}

/**
 * Initialize map on search page
 */
function initSearchMap(businesses, lat, lng) {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  const center = lat != null && lng != null
    ? { lat, lng }
    : businesses.length > 0 && businesses[0].latitude
    ? { lat: businesses[0].latitude, lng: businesses[0].longitude }
    : { lat: 6.5, lng: 3.4 };

  window.NearAfricaMap.initMap("map", center, lat != null ? 12 : 5);
  window.NearAfricaMap.addBusinessMarkers(businesses);

  if (lat != null && lng != null) {
    window.NearAfricaMap.addUserMarker(lat, lng);
  }
}

/**
 * Toggle map on mobile
 */
function toggleMapView() {
  const panel = document.getElementById("map-panel");
  const listPanel = document.getElementById("results-panel");
  const toggleBtn = document.getElementById("toggle-map-btn");
  if (!panel) return;

  App.mapVisible = !App.mapVisible;
  if (App.mapVisible) {
    panel.classList.add("visible");
    if (toggleBtn) toggleBtn.textContent = "Show List";
    // Force map resize
    setTimeout(() => {
      if (window.NearAfricaMap && document.getElementById("map")) {
        const map = document.getElementById("map");
        // Leaflet needs invalidateSize – call via init or stored instance
      }
    }, 100);
  } else {
    panel.classList.remove("visible");
    if (toggleBtn) toggleBtn.textContent = "Show Map";
  }
}

/**
 * Business detail page
 */
function runBusinessPage() {
  const params = window.NearAfricaUtils.getQueryParams();
  const id = params.id;
  const biz = window.NearAfricaUtils.getBusinessById(id);
  const container = document.getElementById("business-detail");
  const loading = document.getElementById("loading-state");
  const notFound = document.getElementById("not-found");

  if (loading) loading.classList.remove("hidden");

  setTimeout(() => {
    if (loading) loading.classList.add("hidden");

    if (!biz) {
      if (notFound) notFound.classList.remove("hidden");
      if (container) container.classList.add("hidden");
      document.title = "Business Not Found | NearAfrica";
      return;
    }

    if (notFound) notFound.classList.add("hidden");
    if (container) container.classList.remove("hidden");

    document.title = `${biz.name} | NearAfrica`;
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", `${biz.name} – ${biz.category} in ${biz.city}, ${biz.country}. ${biz.description || ""}`.slice(0, 160));
    }

    renderBusinessDetail(biz);
  }, 200);
}

function renderBusinessDetail(biz) {
  const utils = window.NearAfricaUtils;
  const openStatus = utils.isOpenNow(biz.openingHours);

  // Hero image
  const heroImg = document.getElementById("detail-hero-img");
  if (heroImg && biz.images && biz.images[0]) {
    heroImg.src = biz.images[0];
    heroImg.alt = biz.name;
  }

  // Title & badges
  const nameEl = document.getElementById("detail-name");
  if (nameEl) nameEl.textContent = biz.name;

  const badgesEl = document.getElementById("detail-badges");
  if (badgesEl) {
    let html = "";
    if (biz.featured) html += '<span class="badge badge-featured">Featured</span> ';
    if (biz.verified) html += '<span class="badge badge-verified">✓ Verified Business</span> ';
    if (openStatus === true) html += '<span class="badge badge-open">Open now</span>';
    else if (openStatus === false) html += '<span class="badge badge-closed">Closed</span>';
    badgesEl.innerHTML = html;
  }

  const metaEl = document.getElementById("detail-meta");
  if (metaEl) {
    metaEl.innerHTML = `
      <span>${utils.escapeHtml(biz.category)}</span>
      <span class="rating">★ ${utils.formatRating(biz.rating)} (${biz.reviewCount || 0} reviews)</span>
      <span>${utils.escapeHtml(biz.city)}, ${utils.escapeHtml(biz.country)}</span>
    `;
  }

  // Actions
  const actionsEl = document.getElementById("detail-actions");
  if (actionsEl) {
    let btns = "";
    if (biz.phone) {
      btns += `<a href="tel:${utils.escapeHtml(biz.phone)}" class="btn btn-primary">Call</a>`;
    }
    if (biz.whatsapp) {
      btns += `<a href="${utils.whatsappLink(biz.whatsapp, "Hello, I found you on NearAfrica")}" target="_blank" rel="noopener" class="btn btn-whatsapp">WhatsApp</a>`;
    }
    const dir = utils.directionsLink(biz.latitude, biz.longitude, biz.address);
    if (dir) {
      btns += `<a href="${dir}" target="_blank" rel="noopener" class="btn btn-secondary">Get Directions</a>`;
    }
    if (biz.website) {
      btns += `<a href="${utils.escapeHtml(biz.website)}" target="_blank" rel="noopener" class="btn btn-outline">Website</a>`;
    }
    actionsEl.innerHTML = btns;
  }

  // About
  const aboutEl = document.getElementById("detail-about");
  if (aboutEl) aboutEl.textContent = biz.description || "No description available.";

  // Address
  const addrEl = document.getElementById("detail-address");
  if (addrEl) addrEl.textContent = biz.address;

  // Hours
  const hoursEl = document.getElementById("detail-hours");
  if (hoursEl && biz.openingHours) {
    hoursEl.innerHTML = Object.entries(biz.openingHours)
      .map(
        ([day, hours]) =>
          `<div class="hours-row"><span>${day}</span><span>${utils.escapeHtml(hours)}</span></div>`
      )
      .join("");
  }

  // Services
  const servicesEl = document.getElementById("detail-services");
  if (servicesEl && biz.services) {
    servicesEl.innerHTML = biz.services
      .map((s) => `<span class="service-tag">${utils.escapeHtml(s)}</span>`)
      .join("");
  }

  // Contact sidebar
  const phoneEl = document.getElementById("detail-phone");
  if (phoneEl) phoneEl.textContent = biz.phone || "—";
  const webEl = document.getElementById("detail-website");
  if (webEl) {
    if (biz.website) {
      webEl.innerHTML = `<a href="${utils.escapeHtml(biz.website)}" target="_blank" rel="noopener">${utils.escapeHtml(biz.website)}</a>`;
    } else {
      webEl.textContent = "—";
    }
  }

  // Map
  if (biz.latitude != null && biz.longitude != null) {
    window.NearAfricaMap.initDetailMap("detail-map", biz.latitude, biz.longitude);
  }

  // Reviews note (no fake reviews)
  const reviewsEl = document.getElementById("detail-reviews");
  if (reviewsEl) {
    reviewsEl.innerHTML = `
      <p class="text-muted">Rating: <strong class="rating">★ ${utils.formatRating(biz.rating)}</strong> based on ${biz.reviewCount || 0} reviews.</p>
      <p class="text-muted mt-1" style="font-size:0.9rem">Individual customer reviews will appear here when connected to a live review system. Demo data does not include fake reviews.</p>
    `;
  }
}

/**
 * List Your Business form handling
 */
function initListForm() {
  const form = document.getElementById("list-business-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearFormErrors(form);

    const required = ["name", "category", "country", "city", "address", "phone"];
    let valid = true;

    required.forEach((field) => {
      const input = form.elements[field];
      if (input && !input.value.trim()) {
        showFieldError(input, "This field is required.");
        valid = false;
      }
    });

    // Basic phone check
    const phone = form.elements.phone;
    if (phone && phone.value.trim() && phone.value.replace(/\D/g, "").length < 8) {
      showFieldError(phone, "Please enter a valid phone number.");
      valid = false;
    }

    if (!valid) return;

    // Demo success – no real submission
    const success = document.getElementById("form-success");
    if (success) {
      success.classList.add("show");
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    form.reset();
  });
}

function showFieldError(input, message) {
  const group = input.closest(".form-group");
  if (!group) return;
  group.classList.add("has-error");
  const err = group.querySelector(".form-error");
  if (err) err.textContent = message;
}

function clearFormErrors(form) {
  form.querySelectorAll(".form-group").forEach((g) => g.classList.remove("has-error"));
}

/**
 * Admin dashboard (demo data)
 */
function runAdminPage() {
  const tbody = document.getElementById("admin-business-tbody");
  if (!tbody || !window.NearAfricaData) return;

  tbody.innerHTML = window.NearAfricaData.businesses
    .map((b) => {
      return `
        <tr>
          <td>${utilsEscape(b.name)}</td>
          <td>${utilsEscape(b.category)}</td>
          <td>${utilsEscape(b.city)}, ${utilsEscape(b.country)}</td>
          <td>${b.verified ? "✓ Yes" : "No"}</td>
          <td>${b.featured ? "Yes" : "No"}</td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm" disabled title="Connect backend to enable">Edit</button>
            <button type="button" class="btn btn-ghost btn-sm" disabled title="Connect backend to enable">Remove</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

/**
 * Mobile menu toggle
 */
function initMobileMenu() {
  const btn = document.getElementById("menu-btn");
  const nav = document.getElementById("mobile-nav");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }
}

/**
 * Populate country select
 */
function populateCountries(selectId) {
  const select = document.getElementById(selectId);
  if (!select || !window.NearAfricaData) return;
  select.innerHTML =
    '<option value="">Select country</option>' +
    window.NearAfricaData.countries
      .map((c) => `<option value="${utilsEscape(c)}">${utilsEscape(c)}</option>`)
      .join("");
}

/**
 * Populate category select
 */
function populateCategories(selectId) {
  const select = document.getElementById(selectId);
  if (!select || !window.NearAfricaData) return;
  select.innerHTML =
    '<option value="">All categories</option>' +
    window.NearAfricaData.categories
      .map((c) => `<option value="${utilsEscape(c.name)}">${utilsEscape(c.name)}</option>`)
      .join("");
}

// Boot
document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();

  // Home page
  if (document.getElementById("categories-grid")) {
    renderCategories();
  }

  // Search form submit
  const searchForm = document.getElementById("search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      performSearch();
    });
  }

  // Use location
  const locBtn = document.getElementById("use-location-btn");
  if (locBtn) {
    locBtn.addEventListener("click", handleUseMyLocation);
  }

  // Search page
  if (document.getElementById("business-list")) {
    populateCategories("category-filter");
    runSearchPage();

    const sortSelect = document.getElementById("sort-select");
    const openCheck = document.getElementById("open-now-check");
    const catFilter = document.getElementById("category-filter");
    [sortSelect, openCheck, catFilter].forEach((el) => {
      if (el) el.addEventListener("change", runSearchPage);
    });

    const toggleBtn = document.getElementById("toggle-map-btn");
    if (toggleBtn) toggleBtn.addEventListener("click", toggleMapView);
  }

  // Business detail
  if (document.getElementById("business-detail")) {
    runBusinessPage();
  }

  // List form
  if (document.getElementById("list-business-form")) {
    populateCountries("country");
    populateCategories("category");
    // Fix category select for form (use name values)
    const catSelect = document.getElementById("category");
    if (catSelect && window.NearAfricaData) {
      catSelect.innerHTML =
        '<option value="">Select category</option>' +
        window.NearAfricaData.categories
          .map((c) => `<option value="${utilsEscape(c.name)}">${utilsEscape(c.name)}</option>`)
          .join("");
    }
    initListForm();
  }

  // Admin
  if (document.getElementById("admin-business-tbody")) {
    runAdminPage();
  }
});
