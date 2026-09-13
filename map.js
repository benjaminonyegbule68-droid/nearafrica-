/**
 * NearAfrica - Map Module (Leaflet + OpenStreetMap)
 * =================================================
 * Uses free OpenStreetMap tiles via Leaflet for the MVP.
 * No API key required.
 *
 * To switch to Mapbox or Google Maps later:
 * 1. Add your API key in config.js (or preferably via backend proxy)
 * 2. Replace initMap / addMarkers with the provider's SDK
 */

let mapInstance = null;
let markersLayer = null;

/**
 * Initialize the map on a given element id
 */
function initMap(elementId, center = { lat: 6.5, lng: 3.4 }, zoom = 6) {
  if (typeof L === "undefined") {
    console.warn("Leaflet not loaded. Map will not render.");
    return null;
  }

  const el = document.getElementById(elementId);
  if (!el) return null;

  // Clear previous instance if any
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  mapInstance = L.map(elementId, {
    zoomControl: true,
    attributionControl: true
  }).setView([center.lat, center.lng], zoom);

  // OpenStreetMap tiles (free, attribution required)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapInstance);

  markersLayer = L.layerGroup().addTo(mapInstance);

  // Invalidate size after a short delay (helps with layout)
  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize();
  }, 200);

  return mapInstance;
}

/**
 * Add business markers to the map
 */
function addBusinessMarkers(businesses, onMarkerClick) {
  if (!mapInstance || !markersLayer) return;

  markersLayer.clearLayers();

  const bounds = [];

  businesses.forEach((biz) => {
    if (biz.latitude == null || biz.longitude == null) return;

    const marker = L.marker([biz.latitude, biz.longitude]);

    const detailPath = window.location.pathname.includes("/pages/")
      ? `business.html?id=${encodeURIComponent(biz.id)}`
      : `pages/business.html?id=${encodeURIComponent(biz.id)}`;
    const popupContent = `
      <div style="min-width:160px">
        <strong>${escapeHtml(biz.name)}</strong><br>
        <span style="color:#b0b0b0;font-size:0.85em">${escapeHtml(biz.category)}</span><br>
        ${biz.rating ? `★ ${biz.rating.toFixed(1)}` : ""}
        ${biz.distance != null ? ` · ${formatDistance(biz.distance)}` : ""}
        <br>
        <a href="${detailPath}" style="color:#d4af37">View details</a>
      </div>
    `;

    marker.bindPopup(popupContent);

    if (typeof onMarkerClick === "function") {
      marker.on("click", () => onMarkerClick(biz));
    }

    markersLayer.addLayer(marker);
    bounds.push([biz.latitude, biz.longitude]);
  });

  if (bounds.length > 0) {
    mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }
}

/**
 * Set map centre and zoom
 */
function setMapView(lat, lng, zoom = 12) {
  if (mapInstance) {
    mapInstance.setView([lat, lng], zoom);
  }
}

/**
 * Add a single user-location marker
 */
function addUserMarker(lat, lng) {
  if (!mapInstance) return;
  const userIcon = L.divIcon({
    className: "user-location-marker",
    html: '<div style="width:14px;height:14px;background:#d4af37;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.5)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
  L.marker([lat, lng], { icon: userIcon }).addTo(mapInstance).bindPopup("Your location");
}

/**
 * Render a small static map for business detail page
 */
function initDetailMap(elementId, lat, lng) {
  if (typeof L === "undefined" || lat == null || lng == null) return null;
  const el = document.getElementById(elementId);
  if (!el) return null;

  const map = L.map(elementId, {
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    attributionControl: true
  }).setView([lat, lng], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  L.marker([lat, lng]).addTo(map);
  setTimeout(() => map.invalidateSize(), 200);
  return map;
}

// Helpers that depend on utils (available globally when scripts load in order)
function escapeHtml(str) {
  if (window.NearAfricaUtils) return window.NearAfricaUtils.escapeHtml(str);
  return str || "";
}

function formatDistance(km) {
  if (window.NearAfricaUtils) return window.NearAfricaUtils.formatDistance(km);
  return km != null ? km.toFixed(1) + " km" : "";
}

if (typeof window !== "undefined") {
  window.NearAfricaMap = {
    initMap,
    addBusinessMarkers,
    setMapView,
    addUserMarker,
    initDetailMap
  };
}
