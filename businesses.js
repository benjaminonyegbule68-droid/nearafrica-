/**
 * NearAfrica - Real Business Data Layer
 * ======================================
 *
 * No fictional businesses are included here.
 *
 * Business data should be loaded from your real
 * backend/API/database.
 *
 * Business object schema:
 * id, name, category, description, country, city, address,
 * latitude, longitude, phone, whatsapp, website, openingHours,
 * images, rating, reviewCount, services, verified, featured, createdAt
 */

// No fake businesses.
// Real businesses should be supplied by your backend/API.
const BUSINESSES = [];


/**
 * Categories supported by the platform
 */
const CATEGORIES = [
  { id: "spas", name: "Spas", icon: "spa" },
  { id: "restaurants", name: "Restaurants", icon: "utensils" },
  { id: "barbers", name: "Barbers", icon: "scissors" },
  { id: "hair-salons", name: "Hair salons", icon: "hair" },
  { id: "hotels", name: "Hotels", icon: "hotel" },
  { id: "fashion-stores", name: "Fashion stores", icon: "shirt" },
  { id: "gyms", name: "Gyms", icon: "dumbbell" },
  { id: "hospitals-clinics", name: "Hospitals/clinics", icon: "hospital" },
  { id: "mechanics", name: "Mechanics", icon: "wrench" },
  { id: "real-estate", name: "Real estate agencies", icon: "building" },
  { id: "schools", name: "Schools", icon: "graduation" },
  { id: "supermarkets", name: "Supermarkets", icon: "cart" },
  { id: "photographers", name: "Photographers", icon: "camera" },
  { id: "event-planners", name: "Event planners", icon: "calendar" },
  { id: "other", name: "Other local businesses", icon: "store" }
];


/**
 * Supported African countries
 */
const AFRICAN_COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Cameroon",
  "Egypt",
  "Morocco",
  "Senegal",
  "Ethiopia",
  "Zambia",
  "Zimbabwe",
  "Botswana",
  "Namibia",
  "Côte d'Ivoire",
  "Benin",
  "Togo",
  "Algeria",
  "Angola",
  "Burkina Faso",
  "Burundi",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Comoros",
  "Congo",
  "DR Congo",
  "Djibouti",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Gabon",
  "Gambia",
  "Guinea",
  "Guinea-Bissau",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Mozambique",
  "Niger",
  "São Tomé and Príncipe",
  "Seychelles",
  "Sierra Leone",
  "Somalia",
  "South Sudan",
  "Sudan",
  "Tunisia"
];


/**
 * Export data for use by the website
 */
if (typeof window !== "undefined") {
  window.NearAfricaData = {
    businesses: BUSINESSES,
    categories: CATEGORIES,
    countries: AFRICAN_COUNTRIES,

    // There is no demo/fake business data.
    isDemo: false
  };
}
