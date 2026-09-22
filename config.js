/**
 * NearAfrica - Production Configuration
 * ======================================
 * Central configuration for the NearAfrica platform.
 *
 * IMPORTANT:
 * This file must contain NON-SECRET settings only.
 *
 * NEVER put these here:
 * - Paystack secret keys
 * - Flutterwave secret keys
 * - Database passwords
 * - Admin passwords
 * - JWT/authentication secrets
 * - Private API keys
 *
 * Store secrets in server-side environment variables instead.
 */

const NearAfricaConfig = {

  // =========================================================
  // API
  // =========================================================

  api: {
    baseUrl: "https://nearafrica-api.nearafrica-onyxtech.workers.dev"
  },


  // =========================================================
  // APPLICATION
  // =========================================================

  app: {
    name: "NearAfrica",

    tagline: "Find Great Businesses Near You.",

    description:
      "Discover trusted businesses, services, shops and places across Africa.",

    // Current live frontend URL.
    // Change this when a custom domain is purchased and connected.
    baseUrl: "https://nearafrica.pages.dev",

    // Replace this with your real support email when your
    // custom domain/email is ready.
    supportEmail: "support@nearafrica.com",

    environment: "production",

    isDemo: false,

    version: "1.0.0"
  },


  // =========================================================
  // LOCATION & MAPS
  // =========================================================

  maps: {

    enabled: true,

    provider: "leaflet",

    defaultRadiusKm: 50,

    maxRadiusKm: 250,

    radiusOptionsKm: [
      5,
      10,
      25,
      50,
      100,
      250
    ],

    requestUserLocation: true,

    showDirections: true,

    showDistance: true,

    clustering: true
  },


  // =========================================================
  // USERS
  // =========================================================

  users: {

    enabled: true,

    registration: true,

    login: true,

    loginMethods: [
      "email",
      "google",
      "phone"
    ],

    favorites: true,

    recentlyViewed: true,

    savedSearches: true,

    profile: true,

    notifications: true
  },


  // =========================================================
  // BUSINESS LISTINGS
  // =========================================================

  businesses: {

    enabled: true,

    allowSelfSubmission: true,

    allowBusinessClaims: true,

    allowOwnerEditing: true,

    allowOwnershipTransfer: true,

    allowReporting: true,

    allowCommunityEdits: true,

    allowBusinessOffers: true,

    allowBusinessEvents: true,

    newListingsDefaultVerified: false,

    requireVerificationForBadge: true,

    requireRealBusinessInformation: true,

    // NearAfrica must not create fictional businesses.
    allowGeneratedBusinesses: false,

    preventFakeDemoBusinesses: true,

    freePhotoLimit: 5,

    premiumPhotoLimit: 20,

    maxPhotoSizeMB: 5,

    supportedPhotoFormats: [
      "jpg",
      "jpeg",
      "png",
      "webp"
    ]
  },


  // =========================================================
  // BUSINESS SUBMISSIONS
  // =========================================================

  submissions: {

    enabled: true,

    defaultStatus: "pending",

    statuses: [
      "pending",
      "unverified",
      "verified",
      "suspended",
      "rejected"
    ],

    requireAccuracyConfirmation: true,

    duplicateDetection: true,

    fraudDetection: true,

    rateLimitEnabled: true,

    adminReviewRequired: true,

    suspiciousListingsRequireReview: true
  },


  // =========================================================
  // BUSINESS VERIFICATION
  // =========================================================

  verification: {

    enabled: true,

    requireVerificationForBadge: true,

    allowPhoneVerification: true,

    allowEmailVerification: true,

    allowWhatsAppVerification: true,

    allowDocumentVerification: false,

    premiumAutomaticallyVerified: false,

    adminCanVerify: true,

    adminCanSuspend: true
  },


  // =========================================================
  // DUPLICATE DETECTION
  // =========================================================

  duplicates: {

    enabled: true,

    compareBusinessName: true,

    comparePhone: true,

    compareWhatsApp: true,

    compareWebsite: true,

    compareAddress: true,

    compareCoordinates: true,

    similarityThreshold: 85,

    autoFlagDuplicates: true,

    preventExactDuplicates: true
  },


  // =========================================================
  // FRAUD & DATA QUALITY
  // =========================================================

  fraud: {

    enabled: true,

    checkFakePhoneNumbers: true,

    checkSuspiciousAddresses: true,

    checkDuplicateListings: true,

    checkSpamDescriptions: true,

    checkSuspiciousReviews: true,

    automaticallyFlagHighRiskListings: true,

    requireManualReviewForHighRisk: true
  },


  // =========================================================
  // IMAGES
  // =========================================================

  images: {

    enabled: true,

    moderation: true,

    maxSizeMB: 5,

    maxImagesFree: 5,

    maxImagesPremium: 20,

    allowedFormats: [
      "jpg",
      "jpeg",
      "png",
      "webp"
    ],

    rejectUnsupportedFormats: true
  },


  // =========================================================
  // REVIEWS
  // =========================================================

  reviews: {

    enabled: true,

    moderationEnabled: true,

    requireBusinessId: true,

    allowReporting: true,

    allowOwnerReplies: true,

    ownerCanDeleteReviews: false,

    preventDuplicateReviews: true,

    preventSpamReviews: true,

    minimumRating: 1,

    maximumRating: 5
  },


  // =========================================================
  // SEARCH
  // =========================================================

  search: {

    enabled: true,

    autocomplete: true,

    typoCorrection: true,

    popularSearches: true,

    recentSearches: true,

    categorySearch: true,

    locationSearch: true,

    nearbySearch: true,

    searchByBusinessName: true,

    searchByService: true,

    searchByDescription: true,

    searchByCity: true,

    searchByCountry: true,

    searchByAddress: true
  },


  // =========================================================
  // SEARCH FILTERS
  // =========================================================

  filters: {

    enabled: true,

    category: true,

    location: true,

    distance: true,

    rating: true,

    verifiedOnly: true,

    openNow: true,

    premiumOnly: false,

    hasWebsite: true,

    hasWhatsApp: true,

    hasPhone: true
  },


  // =========================================================
  // BUSINESS HOURS
  // =========================================================

  hours: {

    enabled: true,

    showOpenStatus: true,

    showClosingSoon: true,

    showOpeningSoon: true,

    supportMultipleSchedules: true
  },


  // =========================================================
  // RANKING SYSTEM
  // =========================================================

  ranking: {

    enabled: true,

    /**
     * Organic ranking should remain more important
     * than paid promotion.
     *
     * General ranking factors:
     *
     * Relevance
     * Distance
     * Rating
     * Review count
     * Verification
     * Profile completeness
     * Freshness
     * Premium promotion
     */

    weights: {

      relevance: 100,

      distance: 60,

      rating: 30,

      reviewCount: 15,

      verified: 25,

      profileCompleteness: 15,

      freshness: 10
    },

    premiumBoost: 20,

    sponsoredBoost: 10,

    rotationWindowHours: 24,

    enableSponsoredRotation: true,

    maxSponsoredResultsPerPage: 3,

    labelSponsoredResults: true
  },


  // =========================================================
  // PROFILE COMPLETENESS
  // =========================================================

  profileScore: {

    enabled: true,

    showCompletionPercentage: true,

    encourageMissingInformation: true,

    factors: {

      businessName: 10,

      category: 10,

      description: 10,

      phone: 10,

      whatsapp: 10,

      address: 10,

      location: 10,

      openingHours: 10,

      photos: 10,

      website: 5,

      services: 5
    }
  },


  // =========================================================
  // FREE PLAN
  // =========================================================

  freePlan: {

    enabled: true,

    priceNGN: 0,

    priceLabel: "Free",

    features: {

      basicListing: true,

      businessSearch: true,

      mapVisibility: true,

      contactInformation: true,

      reviews: true,

      selfSubmission: true,

      basicPhotos: true,

      claimBusiness: true,

      basicBusinessHours: true,

      basicServices: true
    }
  },


  // =========================================================
  // PREMIUM PLAN
  // =========================================================

  premium: {

    enabled: true,

    name: "NearAfrica Pro",

    priceNGN: 5000,

    priceLabel: "₦5,000/month",

    currency: "NGN",

    billingPeriod: "monthly",

    features: {

      priorityVisibility: true,

      premiumPlacement: true,

      morePhotos: true,

      promotionalOffers: true,

      enhancedBusinessProfile: true,

      analytics: true,

      customBusinessDescription: true,

      premiumBadge: true,

      businessInsights: true
    },

    premiumAutomaticallyVerified: false
  },


  // =========================================================
  // PAYMENTS
  // =========================================================

  payments: {

    enabled: true,

    currency: "NGN",

    provider: "paystack",

    subscriptionEnabled: true,

    oneTimePaymentsEnabled: true,

    automaticRenewal: true,

    // Payment credentials must NEVER be stored here.

    secretKeysInFrontend: false
  },


  // =========================================================
  // ADVERTISING
  // =========================================================

  advertising: {

    enabled: true,

    sponsoredListingsEnabled: true,

    bannerAds: false,

    homepageAds: false,

    requireSponsoredLabel: true,

    maxSponsoredResultsPerPage: 3,

    sponsoredRotationHours: 24
  },


  // =========================================================
  // ANALYTICS
  // =========================================================

  analytics: {

    enabled: true,

    publicDisplay: false,

    premiumBusinessAnalytics: true,

    trackSearches: true,

    trackBusinessViews: true,

    trackContactClicks: true,

    trackPhoneClicks: true,

    trackWhatsAppClicks: true,

    trackWebsiteClicks: true,

    trackDirectionRequests: true,

    trackProfileViews: true,

    trackFavoriteAdds: true
  },


  // =========================================================
  // SEO
  // =========================================================

  seo: {

    enabled: true,

    sitemap: true,

    robotsTxt: true,

    structuredData: true,

    businessSchema: true,

    categoryPages: true,

    cityPages: true,

    countryPages: true,

    businessProfilePages: true,

    canonicalUrls: true,

    dynamicMetaTitles: true,

    dynamicMetaDescriptions: true,

    socialSharingCards: true
  },


  // =========================================================
  // SECURITY
  // =========================================================

  security: {

    enabled: true,

    rateLimits: true,

    captcha: true,

    inputSanitization: true,

    outputEscaping: true,

    preventXSS: true,

    preventSQLInjection: true,

    secureAuthentication: true,

    sessionProtection: true,

    auditLogs: true
  },


  // =========================================================
  // MODERATION
  // =========================================================

  moderation: {

    enabled: true,

    reviewReports: true,

    businessReports: true,

    imageReports: true,

    suspiciousListings: true,

    suspiciousReviews: true,

    communityEdits: true,

    requireAdminForVerification: true,

    requireAdminForSuspension: true,

    keepModerationHistory: true
  },


  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  notifications: {

    enabled: true,

    email: true,

    sms: false,

    push: false,

    events: {

      businessApproved: true,

      businessRejected: true,

      businessClaimed: true,

      newReview: true,

      reviewReported: true,

      premiumActivated: true,

      premiumExpiring: true,

      listingReported: true
    }
  },


  // =========================================================
  // COMMUNITY FEATURES
  // =========================================================

  community: {

    enabled: true,

    suggestBusinessEdit: true,

    reportBusiness: true,

    reportReview: true,

    suggestMissingBusiness: true,

    allowUserCorrections: true,

    requireModerationForChanges: true
  },


  // =========================================================
  // FAVORITES
  // =========================================================

  favorites: {

    enabled: true,

    saveBusinesses: true,

    savedSearches: true,

    recentlyViewed: true
  },


  // =========================================================
  // DEALS & OFFERS
  // =========================================================

  offers: {

    enabled: true,

    freeBusinessesCanCreate: false,

    premiumBusinessesCanCreate: true,

    expiryDates: true,

    startDates: true,

    discountCodes: false
  },


  // =========================================================
  // EVENTS
  // =========================================================

  events: {

    enabled: true,

    businessEvents: true,

    publicEvents: true,

    eventStartDate: true,

    eventEndDate: true,

    eventLocation: true,

    eventDescription: true
  },


  // =========================================================
  // BUSINESS OWNERSHIP
  // =========================================================

  ownership: {

    enabled: true,

    claimBusiness: true,

    ownershipVerification: true,

    ownershipTransfer: true,

    ownerEditing: true,

    ownerReplies: true,

    ownerAnalytics: true
  },


  // =========================================================
  // TRUST SYSTEM
  // =========================================================

  trust: {

    enabled: true,

    verifiedBadge: true,

    trustScore: true,

    profileCompletenessScore: true,

    reviewQualityScore: true,

    businessAgeFactor: true,

    suspiciousActivityDetection: true,

    paymentDoesNotEqualVerification: true
  },


  // =========================================================
  // CATEGORIES
  // =========================================================
  //
  // These match the categories currently used by the
  // NearAfrica Worker and business submission form.
  //

  categories: [

    "Restaurants & Food",

    "Hotels & Accommodation",

    "Beauty & Spa",

    "Health & Medical",

    "Gyms & Fitness",

    "Shopping & Retail",

    "Supermarkets",

    "Banks & Finance",

    "Professional Services",

    "Education",

    "Real Estate",

    "Automotive",

    "Travel & Tourism",

    "Logistics & Delivery",

    "Technology",

    "Entertainment",

    "Fitness & Sports",

    "Construction & Home Services",

    "Fashion",

    "Agriculture",

    "Religious Organizations",

    "Government & Public Services",

    "Other"
  ],


  // =========================================================
  // COUNTRIES
  // =========================================================

  expansion: {

    enabled: true,

    // Nigeria is the current launch country.
    launchCountry: "NG",

    supportedCountries: [
      "NG"
    ],

    futureCountries: [
      "GH",
      "KE",
      "ZA",
      "EG",
      "RW",
      "TZ",
      "UG",
      "SN",
      "CI",
      "MA"
    ]
  },


  // =========================================================
  // LANGUAGES
  // =========================================================

  languages: {

    enabled: true,

    default: "en",

    supported: [
      "en"
    ],

    future: [
      "fr",
      "sw",
      "ar"
    ]
  },


  // =========================================================
  // PERFORMANCE
  // =========================================================

  performance: {

    lazyLoadImages: true,

    compressImages: true,

    caching: true,

    minifyAssets: true,

    enableServiceWorker: false,

    pagination: true,

    businessesPerPage: 20
  },


  // =========================================================
  // ACCESSIBILITY
  // =========================================================

  accessibility: {

    enabled: true,

    keyboardNavigation: true,

    altTextRequired: true,

    readableContrast: true,

    screenReaderSupport: true
  },


  // =========================================================
  // LEGAL / PRIVACY
  // =========================================================

  legal: {

    privacyPolicy: true,

    termsOfService: true,

    cookiePolicy: true,

    businessSubmissionTerms: true,

    reviewGuidelines: true,

    advertisingDisclosure: true,

    dataDeletionRequests: true
  },


  // =========================================================
  // FEATURE FLAGS
  // =========================================================

  features: {

    search: true,

    filters: true,

    categories: true,

    map: true,

    businessProfiles: true,

    reviews: true,

    claimBusiness: true,

    addBusiness: true,

    reportBusiness: true,

    communityEdits: true,

    favorites: true,

    businessAnalytics: true,

    premiumSubscriptions: true,

    sponsoredListings: true,

    offers: true,

    events: true,

    notifications: true,

    multilingual: false,

    darkMode: true
  }

};


// =============================================================
// MAKE CONFIGURATION AVAILABLE TO THE FRONTEND
// =============================================================

if (typeof window !== "undefined") {
  window.NearAfricaConfig = NearAfricaConfig;
}


// =============================================================
// SUPPORT MODULE SYSTEMS
// =============================================================

if (
  typeof module !== "undefined" &&
  module.exports
) {
  module.exports = NearAfricaConfig;
}
