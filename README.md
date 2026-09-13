# NearAfrica – Business Discovery Platform for Africa

A professional, mobile-first web application to discover local businesses across Africa.

**DEMO MODE:** All business listings are fictional sample data for testing the interface only. Do not treat them as real businesses.

---

## How to run locally

1. Open the project folder in a code editor (VS Code, etc.).
2. Serve the files with a simple local server (required for geolocation and some browsers):

   **Option A – VS Code Live Server**  
   Install the “Live Server” extension → right-click `index.html` → “Open with Live Server”.

   **Option B – Python**  
   ```bash
   cd nearafrica
   python3 -m http.server 8080
   ```
   Then open http://localhost:8080

   **Option C – Node (npx)**  
   ```bash
   npx serve .
   ```

3. Open the site in your browser. Use Chrome/Firefox for best geolocation support.

---

## Project structure

```
nearafrica/
├── index.html              # Landing / home page
├── 404.html                # Custom 404 page
├── css/
│   └── styles.css          # All styles (dark + gold theme)
├── js/
│   ├── config.js           # App config & future API key placeholders
│   ├── utils.js            # Distance, geolocation, search, helpers
│   ├── map.js              # Leaflet / OpenStreetMap map logic
│   └── app.js              # UI rendering & page logic
├── data/
│   └── businesses.js       # DEMO business data (replace with API later)
├── pages/
│   ├── search.html         # Search results + map
│   ├── business.html       # Business profile
│   ├── list-business.html  # Owner submission form
│   └── admin.html          # Admin dashboard UI
├── images/
│   └── favicon.svg         # Custom favicon
└── README.md               # This file
```

---

## What each file does

| File | Purpose |
|------|---------|
| `index.html` | Strong landing page with search, categories, and CTA |
| `pages/search.html` | List + map results, filters, sort |
| `pages/business.html` | Full business profile |
| `pages/list-business.html` | “List Your Business” form with validation |
| `pages/admin.html` | Admin table UI (actions disabled until backend) |
| `404.html` | Friendly not-found page |
| `css/styles.css` | Mobile-first dark charcoal + gold design |
| `js/config.js` | App name, radius, map provider, future API keys |
| `js/utils.js` | Haversine distance, open-now check, search/filter, geolocation |
| `js/map.js` | Leaflet map init, markers, detail map |
| `js/app.js` | Cards, forms, page boot logic |
| `data/businesses.js` | Mock businesses + categories + countries |

---

## How the search works

1. User enters a keyword/category and optional location (or uses “Use My Location”).
2. On submit, the app builds a query string and goes to `search.html`.
3. `searchBusinesses()` in `utils.js`:
   - Filters by category and keyword
   - Calculates distance (Haversine) if coordinates are available
   - Filters by radius
   - Optionally keeps only “open now”
   - Sorts by distance, rating, or name
   - Boosts featured listings to the top
4. Results are rendered as cards; the map shows matching markers.

Location resolution for city names uses a small demo dictionary in `utils.js` (`CITY_COORDS`). Replace this with a real geocoding API later.

---

## How location detection works

- “Use My Location” calls the browser Geolocation API (`navigator.geolocation`).
- If permission is granted → latitude/longitude are stored and used for distance sorting.
- If denied or unavailable → a clear message is shown:  
  *“Location access was unavailable. Enter your city or location manually.”*
- Manual city names are mapped to approximate coordinates via the demo city list.

---

## Where the business data comes from

Currently from **`data/businesses.js`** (array `DEMO_BUSINESSES`).

Every listing is clearly fictional. The banner on every page states DEMO MODE.

The object shape matches a future database:

```
id, name, category, description, country, city, address,
latitude, longitude, phone, whatsapp, website, openingHours,
images, rating, reviewCount, services, verified, featured, createdAt
```

---

## Where to connect a real maps / business API

1. **Maps**  
   - MVP uses Leaflet + OpenStreetMap (no key).  
   - For Mapbox/Google: put the key in `js/config.js` (or better, a backend proxy) and adapt `js/map.js`.

2. **Business / Places data**  
   - Replace the `DEMO_BUSINESSES` array with `fetch('/api/businesses')` or a Places API.  
   - Keep the same object shape so the UI keeps working.  
   - Do not scrape Google Maps or violate any provider’s terms.

3. **Geocoding**  
   - Replace `resolveLocation()` / `CITY_COORDS` with Nominatim, Google Geocoding, or Mapbox Geocoding.

---

## How to connect a database later

Suggested approach:

1. Build a small backend (Node/Express, Python/Flask, etc.).
2. Create a `businesses` table matching the schema above.
3. Expose REST endpoints, e.g.:
   - `GET /api/businesses?q=&lat=&lng=&category=`
   - `GET /api/businesses/:id`
   - `POST /api/businesses` (owner submission)
   - Admin routes protected by auth
4. In the frontend, replace `NearAfricaData.businesses` with the API response.
5. Add authentication for admin and optional owner accounts.

---

## How to deploy

Simple static hosting works for the current MVP:

- **Netlify / Vercel / GitHub Pages / Cloudflare Pages**  
  Upload the `nearafrica` folder (or connect a Git repo).  
  Point the 404 page to `404.html` in the host settings.

When you add a backend and database, deploy the API separately (or as serverless functions) and point the frontend to that API URL.

---

## What is currently DEMO functionality

- All business listings and ratings (no real reviews shown)
- Form “success” on List Your Business (nothing is saved)
- Admin Edit/Remove buttons (disabled)
- City geocoding (limited static list)
- “Featured” and “Verified” badges (set manually in the mock data)
- Map tiles from OpenStreetMap (fine for development; check usage policy for heavy production traffic)

---

## What to change before launching publicly

1. Replace mock data with a real, licensed data source or user-submitted listings.
2. Add a backend + database and authentication.
3. Implement real review collection (no fake reviews).
4. Secure any map API keys on the server side.
5. Add privacy policy, terms of service, and cookie notice if needed.
6. Set a real domain and update Open Graph / meta URLs in HTML and `config.js`.
7. Test geolocation and forms on real mobile devices.
8. Ensure compliance with local business listing and data-protection rules.
9. Turn off or gate the public Admin link; require login.
10. Remove or hide the DEMO MODE banners once live data is in place.

---

## Design notes

- Black / dark charcoal background, white text, gold (`#d4af37`) accents
- Rounded cards, subtle shadows, mobile-first layout
- Desktop: results left, map right
- Mobile: list first, “Show Map” toggle
- Verified and Featured badges (Featured = future paid placement)

---

## Monetization hooks (future)

- Featured badge / sponsored placement in results  
- Business subscriptions / premium profiles  
- Advertising slots  
- Lead generation tools  
- Website design services for listed businesses  

The `featured` field on each business is ready for a paid upgrade path.

---

Built for beginners to learn from: plain HTML, CSS, and JavaScript, modular files, and clear comments.
