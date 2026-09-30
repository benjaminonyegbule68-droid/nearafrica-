/**
 * NearAfrica - Map Module
 * =======================
 * Leaflet + OpenStreetMap
 *
 * No API key is required for the MVP.
 *
 * This module handles:
 * - Business maps
 * - Business markers
 * - User location marker
 * - Business detail maps
 * - Map resizing
 *
 * Utilities such as escapeHtml() and formatDistance()
 * come from utils.js.
 */


/* =========================================================
   MODULE STATE
   ========================================================= */

let mapInstance = null;
let markersLayer = null;
let userMarker = null;


/* =========================================================
   INTERNAL HELPERS
   ========================================================= */

/**
 * Check whether Leaflet is available.
 */
function isLeafletAvailable() {

  if (
    typeof window === "undefined" ||
    typeof L === "undefined"
  ) {

    console.warn(
      "NearAfrica: Leaflet is not loaded."
    );

    return false;
  }

  return true;
}


/**
 * Safely convert a coordinate to a number.
 */
function mapNumber(value) {

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


/**
 * Check whether coordinates are valid.
 */
function validCoordinates(
  lat,
  lng
) {

  lat = mapNumber(lat);
  lng = mapNumber(lng);

  return (
    lat !== null &&
    lng !== null &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}


/**
 * Safely escape HTML using the shared utility.
 */
function mapEscapeHtml(value) {

  if (
    window.NearAfricaUtils &&
    typeof window.NearAfricaUtils.escapeHtml ===
      "function"
  ) {

    return window.NearAfricaUtils.escapeHtml(
      value
    );
  }

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/**
 * Format distance using the shared utility.
 */
function mapFormatDistance(value) {

  if (
    window.NearAfricaUtils &&
    typeof window.NearAfricaUtils.formatDistance ===
      "function"
  ) {

    return window.NearAfricaUtils.formatDistance(
      value
    );
  }

  const distance =
    mapNumber(value);

  if (distance === null) {
    return "";
  }

  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }

  return `${distance.toFixed(1)} km`;
}


/**
 * Normalize a business for map display.
 */
function normalizeMapBusiness(business = {}) {

  if (
    window.NearAfricaUtils &&
    typeof window.NearAfricaUtils.normalizeBusiness ===
      "function"
  ) {

    return window.NearAfricaUtils.normalizeBusiness(
      business
    );
  }

  return {
    ...business,

    id:
      business.id ??
      business.business_id ??
      null,

    name:
      business.name ??
      business.business_name ??
      "Business",

    category:
      business.category ?? "",

    latitude:
      mapNumber(business.latitude),

    longitude:
      mapNumber(business.longitude)
  };
}


/* =========================================================
   BUSINESS DETAIL PATH
   ========================================================= */

/**
 * Build a business-detail URL that works from:
 *
 * /index.html
 * /explore.html
 * /pages/...
 */
function getBusinessDetailPath(
  businessId
) {

  const id =
    encodeURIComponent(
      String(businessId ?? "")
    );

  const pathname =
    window.location.pathname || "";

  if (
    pathname.includes("/pages/")
  ) {

    return `business.html?id=${id}`;
  }

  return `pages/business.html?id=${id}`;
}


/* =========================================================
   INITIALIZE MAP
   ========================================================= */

/**
 * Initialize the main map.
 */
function initMap(
  elementId,
  center = {
    lat: 6.5,
    lng: 3.4
  },
  zoom = 6
) {

  if (!isLeafletAvailable()) {
    return null;
  }

  const element =
    document.getElementById(
      elementId
    );

  if (!element) {
    return null;
  }


  /*
   * Remove an existing map instance.
   */
  if (mapInstance) {

    try {
      mapInstance.remove();
    } catch (error) {
      console.warn(
        "NearAfrica: Could not remove previous map.",
        error
      );
    }

    mapInstance = null;
  }


  /*
   * Clear previous user marker state.
   */
  userMarker = null;


  /*
   * Validate centre coordinates.
   */
  const safeLat =
    validCoordinates(
      center.lat,
      center.lng
    )
      ? Number(center.lat)
      : 6.5;

  const safeLng =
    validCoordinates(
      center.lat,
      center.lng
    )
      ? Number(center.lng)
      : 3.4;


  /*
   * Create Leaflet map.
   */
  mapInstance =
    L.map(elementId, {
      zoomControl: true,
      attributionControl: true
    }).setView(
      [
        safeLat,
        safeLng
      ],
      zoom
    );


  /*
   * OpenStreetMap tiles.
   */
  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,

      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
    }
  ).addTo(
    mapInstance
  );


  /*
   * Marker layer.
   */
  markersLayer =
    L.layerGroup().addTo(
      mapInstance
    );


  /*
   * Leaflet sometimes needs a size refresh
   * after the page layout has finished.
   */
  setTimeout(() => {

    if (mapInstance) {

      try {
        mapInstance.invalidateSize();
      } catch (error) {
        console.warn(
          "NearAfrica: Map resize failed.",
          error
        );
      }
    }

  }, 200);


  return mapInstance;
}


/* =========================================================
   BUSINESS MARKERS
   ========================================================= */

/**
 * Add business markers to the current map.
 */
function addBusinessMarkers(
  businesses = [],
  onMarkerClick
) {

  if (
    !mapInstance ||
    !markersLayer ||
    !isLeafletAvailable()
  ) {
    return;
  }


  /*
   * Remove old markers.
   */
  markersLayer.clearLayers();


  const bounds = [];


  if (!Array.isArray(businesses)) {
    return;
  }


  businesses.forEach(
    (rawBusiness) => {

      const business =
        normalizeMapBusiness(
          rawBusiness
        );


      const lat =
        mapNumber(
          business.latitude
        );

      const lng =
        mapNumber(
          business.longitude
        );


      /*
       * Businesses without coordinates
       * cannot be displayed on the map.
       */
      if (
        !validCoordinates(
          lat,
          lng
        )
      ) {
        return;
      }


      const marker =
        L.marker([
          lat,
          lng
        ]);


      /*
       * Business detail link.
       */
      const detailPath =
        getBusinessDetailPath(
          business.id
        );


      /*
       * Rating.
       */
      const rating =
        mapNumber(
          business.rating
        );


      const ratingHtml =
        rating !== null
          ? `★ ${rating.toFixed(1)}`
          : "";


      /*
       * Distance.
       */
      const distanceHtml =
        business.distance != null
          ? ` · ${mapEscapeHtml(
              mapFormatDistance(
                business.distance
              )
            )}`
          : "";


      /*
       * Popup content.
       */
      const popupContent = `
        <div
          style="
            min-width:180px;
            line-height:1.45;
          "
        >

          <strong>
            ${mapEscapeHtml(
              business.name ||
              business.business_name ||
              "Business"
            )}
          </strong>

          ${
            business.category
              ? `
                <br>
                <span
                  style="
                    color:#777;
                    font-size:0.85em;
                  "
                >
                  ${mapEscapeHtml(
                    business.category
                  )}
                </span>
              `
              : ""
          }

          ${
            ratingHtml
              ? `
                <br>
                <span>
                  ${ratingHtml}
                  ${distanceHtml}
                </span>
              `
              : distanceHtml
                ? `
                  <br>
                  <span>
                    ${distanceHtml.replace(
                      " · ",
                      ""
                    )}
                  </span>
                `
                : ""
          }

          <br>

          <a
            href="${detailPath}"
            style="
              color:#b8860b;
              text-decoration:none;
              font-weight:600;
            "
          >
            View details
          </a>

        </div>
      `;


      marker.bindPopup(
        popupContent
      );


      /*
       * Optional marker click callback.
       */
      if (
        typeof onMarkerClick ===
        "function"
      ) {

        marker.on(
          "click",
          () => {
            onMarkerClick(
              business
            );
          }
        );
      }


      markersLayer.addLayer(
        marker
      );


      bounds.push([
        lat,
        lng
      ]);
    }
  );


  /*
   * Fit the map around all visible businesses.
   */
  if (bounds.length === 1) {

    mapInstance.setView(
      bounds[0],
      14
    );

  } else if (bounds.length > 1) {

    mapInstance.fitBounds(
      bounds,
      {
        padding: [
          40,
          40
        ],

        maxZoom: 14
      }
    );
  }
}


/* =========================================================
   MAP VIEW
   ========================================================= */

/**
 * Set the map centre and zoom.
 */
function setMapView(
  lat,
  lng,
  zoom = 12
) {

  if (!mapInstance) {
    return;
  }

  if (
    !validCoordinates(
      lat,
      lng
    )
  ) {
    return;
  }

  mapInstance.setView(
    [
      Number(lat),
      Number(lng)
    ],
    zoom
  );
}


/* =========================================================
   USER LOCATION MARKER
   ========================================================= */

/**
 * Add or move the user's location marker.
 */
function addUserMarker(
  lat,
  lng
) {

  if (
    !mapInstance ||
    !isLeafletAvailable()
  ) {
    return null;
  }


  if (
    !validCoordinates(
      lat,
      lng
    )
  ) {
    return null;
  }


  /*
   * Remove previous user marker.
   */
  if (userMarker) {

    try {
      mapInstance.removeLayer(
        userMarker
      );
    } catch (error) {
      console.warn(
        "NearAfrica: Could not remove previous user marker.",
        error
      );
    }

    userMarker = null;
  }


  /*
   * Custom location icon.
   */
  const userIcon =
    L.divIcon({

      className:
        "user-location-marker",

      html: `
        <div
          style="
            width:14px;
            height:14px;
            background:#d4af37;
            border:2px solid #fff;
            border-radius:50%;
            box-shadow:0 0 8px rgba(0,0,0,0.5);
          "
          aria-label="Your location"
        ></div>
      `,

      iconSize: [
        18,
        18
      ],

      iconAnchor: [
        9,
        9
      ]
    });


  userMarker =
    L.marker(
      [
        Number(lat),
        Number(lng)
      ],
      {
        icon: userIcon,
        zIndexOffset: 1000
      }
    )
      .addTo(
        mapInstance
      )
      .bindPopup(
        "Your location"
      );


  return userMarker;
}


/* =========================================================
   CLEAR USER MARKER
   ========================================================= */

/**
 * Remove the current user-location marker.
 */
function clearUserMarker() {

  if (
    !mapInstance ||
    !userMarker
  ) {
    return;
  }

  try {

    mapInstance.removeLayer(
      userMarker
    );

  } catch (error) {

    console.warn(
      "NearAfrica: Could not clear user marker.",
      error
    );
  }

  userMarker = null;
}


/* =========================================================
   DETAIL MAP
   ========================================================= */

/**
 * Render a small non-interactive map
 * on a business detail page.
 */
function initDetailMap(
  elementId,
  lat,
  lng
) {

  if (
    !isLeafletAvailable()
  ) {
    return null;
  }

  if (
    !validCoordinates(
      lat,
      lng
    )
  ) {
    return null;
  }


  const element =
    document.getElementById(
      elementId
    );

  if (!element) {
    return null;
  }


  /*
   * Prevent Leaflet's
   * "Map container is already initialized"
   * error if this function is accidentally
   * called more than once.
   */
  if (
    element._leaflet_id
  ) {

    try {
      element._leaflet_id = null;
    } catch (error) {
      console.warn(
        "NearAfrica: Existing detail map detected.",
        error
      );
    }
  }


  const map =
    L.map(
      elementId,
      {
        zoomControl: false,

        dragging: false,

        scrollWheelZoom: false,

        doubleClickZoom: false,

        boxZoom: false,

        keyboard: false,

        touchZoom: false,

        attributionControl: true
      }
    ).setView(
      [
        Number(lat),
        Number(lng)
      ],
      15
    );


  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,

      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
    }
  ).addTo(
    map
  );


  L.marker([
    Number(lat),
    Number(lng)
  ])
    .addTo(map);


  setTimeout(
    () => {

      try {
        map.invalidateSize();
      } catch (error) {
        console.warn(
          "NearAfrica: Detail map resize failed.",
          error
        );
      }

    },
    200
  );


  return map;
}


/* =========================================================
   GET CURRENT MAP
   ========================================================= */

function getMapInstance() {
  return mapInstance;
}


/* =========================================================
   EXPORT
   ========================================================= */

if (
  typeof window !== "undefined"
) {

  window.NearAfricaMap = {

    initMap,

    addBusinessMarkers,

    setMapView,

    addUserMarker,

    clearUserMarker,

    initDetailMap,

    getMapInstance

  };
             }
