```javascript
/**
 * NearAfrica - Translation Dictionary
 * ===================================
 * Interface translations for the NearAfrica platform.
 *
 * Languages:
 * en = English
 * fr = French
 * ar = Arabic
 * pt = Portuguese
 * sw = Swahili
 */

const NearAfricaTranslations = {

  // =========================================================
  // ENGLISH
  // =========================================================

  en: {

    siteName: "NearAfrica",
    tagline: "Find Great Businesses Near You.",
    description:
      "Discover trusted businesses, services, shops and places across Africa.",

    nav: {
      home: "Home",
      explore: "Explore",
      listBusiness: "List Your Business",
      claimBusiness: "Claim Business",
      helpWanted: "Help Wanted",
      about: "About",
      contact: "Contact"
    },

    search: {
      title: "Discover Africa. Start Local.",
      whatLookingFor: "What are you looking for?",
      location: "Location",
      searchPlaceholder: "e.g. barber, hotel, restaurant...",
      locationPlaceholder: "e.g. Aba, Lagos, Abuja...",
      search: "Search",
      useMyLocation: "Use My Location",
      usingYourLocation: "Using your current location",
      locationAccessDenied:
        "Location access was denied. You can search by area instead.",
      locationUnavailable:
        "Your location could not be determined.",
      locationError:
        "Unable to access your location. Please try again.",
      locationNotSupported:
        "Location services are not supported by this browser."
    },

    explore: {
      title: "Explore Businesses",
      subtitle:
        "Discover businesses, services and places near you.",
      businesses: "Businesses",
      businessesFound: "businesses found",
      businessesFoundNearby: "businesses found nearby",
      businessesNearYou: "Businesses Near You",
      allBusinesses: "Businesses",
      noBusinesses: "No businesses found.",
      noBusinessesNearby:
        "No businesses were found within your selected area.",
      distanceUnavailable: "Distance unavailable",
      away: "away",
      clearLocation: "Clear Location",
      filters: "Filters",
      category: "Category",
      state: "State",
      rating: "Rating",
      verifiedOnly: "Verified only",
      allCategories: "All Categories",
      allStates: "All States",
      anyRating: "Any Rating",
      fourPlus: "4+ stars",
      threePlus: "3+ stars",
      twoPlus: "2+ stars",
      verified: "Verified",
      previous: "Previous",
      next: "Next"
    },

    categories: {
      restaurants: "Restaurants & Food",
      hotels: "Hotels & Accommodation",
      beauty: "Beauty & Spa",
      health: "Health & Medical",
      gyms: "Gyms & Fitness",
      shopping: "Shopping & Retail",
      supermarkets: "Supermarkets",
      banks: "Banks & Finance",
      professional: "Professional Services",
      education: "Education",
      realEstate: "Real Estate",
      automotive: "Automotive",
      travel: "Travel & Tourism",
      logistics: "Logistics & Delivery",
      technology: "Technology",
      entertainment: "Entertainment",
      fitness: "Fitness & Sports",
      construction: "Construction & Home Services",
      fashion: "Fashion",
      agriculture: "Agriculture",
      religious: "Religious Organizations",
      government: "Government & Public Services",
      other: "Other"
    },

    business: {
      verified: "Verified",
      unverified: "Unverified",
      claimed: "Claimed",
      unclaimed: "Unclaimed",
      viewBusiness: "View Business",
      call: "Call",
      whatsapp: "WhatsApp",
      website: "Website",
      directions: "Directions",
      reviews: "Reviews",
      review: "Review",
      hours: "Business Hours",
      services: "Services",
      products: "Products",
      about: "About This Business",
      contact: "Contact",
      address: "Address",
      phone: "Phone",
      email: "Email",
      openNow: "Open now",
      closedNow: "Closed",
      openingSoon: "Opening soon",
      closingSoon: "Closing soon"
    },

    owner: {
      listBusiness: "List Your Business",
      claimBusiness: "Claim Your Business",
      ownerDashboard: "Owner Dashboard",
      manageBusiness: "Manage Your Business",
      editBusiness: "Edit Business",
      businessAnalytics: "Business Analytics"
    },

    reviews: {
      title: "Reviews",
      writeReview: "Write a Review",
      rating: "Rating",
      comment: "Comment",
      submit: "Submit Review",
      report: "Report Review",
      noReviews: "No reviews yet.",
      reviewSubmitted: "Your review has been submitted."
    },

    helpWanted: {
      title: "Help Wanted",
      subtitle:
        "Discover job and work opportunities from local businesses.",
      postOpportunity: "Post an Opportunity",
      viewOpportunity: "View Opportunity",
      apply: "Apply",
      location: "Location",
      type: "Type",
      description: "Description"
    },

    account: {
      login: "Login",
      logout: "Logout",
      register: "Create Account",
      profile: "Profile",
      favorites: "Favorites",
      savedSearches: "Saved Searches",
      recentlyViewed: "Recently Viewed",
      notifications: "Notifications"
    },

    payments: {
      free: "Free",
      pro: "NearAfrica Pro",
      premium: "Premium",
      monthly: "Monthly",
      subscribe: "Subscribe",
      manageSubscription: "Manage Subscription",
      paymentSuccessful: "Payment successful.",
      paymentFailed: "Payment failed.",
      subscriptionActive: "Your subscription is active."
    },

    contact: {
      title: "Contact NearAfrica",
      subtitle:
        "Have a question, need support, want to list a business, or need to report an issue? We're here to help.",
      emailTitle: "Email Us",
      emailDescription:
        "For general questions, support, partnerships, listings and corrections.",
      emailAction: "Send Email",
      businessTitle: "Business Support",
      businessDescription:
        "Need help with a business listing, claiming a business, or correcting information?",
      businessAction: "List or Claim a Business",
      supportTitle: "Platform Support",
      supportDescription:
        "Contact us about website issues, reports, suggestions or other NearAfrica matters.",
      supportAction: "Contact Support",
      formTitle: "Send Us a Message",
      name: "Your Name",
      email: "Your Email",
      subject: "Subject",
      message: "Message",
      namePlaceholder: "Enter your name",
      emailPlaceholder: "Enter your email address",
      subjectPlaceholder: "What is your message about?",
      messagePlaceholder: "Write your message here...",
      sendMessage: "Send Message",
      formNote:
        "Your email application will open so you can send your message.",
      success:
        "Your email application should now be open.",
      validation:
        "Please complete all required fields before sending.",
      backHome: "Back to Home"
    },

    actions: {
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      back: "Back",
      continue: "Continue",
      submit: "Submit",
      confirm: "Confirm",
      delete: "Delete",
      edit: "Edit",
      report: "Report",
      viewMore: "View More",
      learnMore: "Learn More",
      loading: "Loading...",
      retry: "Try Again"
    },

    legal: {
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      listingPolicy: "Listing Policy",
      cookiePolicy: "Cookie Policy",
      reviewGuidelines: "Review Guidelines"
    },

    footer: {
      copyright: "© 2026 NearAfrica. All rights reserved.",
      discover: "Discover businesses across Africa.",
      contactUs: "Contact Us"
    },

    errors: {
      somethingWentWrong:
        "Something went wrong. Please try again.",
      unableToLoad:
        "Unable to load businesses.",
      network:
        "Network error. Please check your connection.",
      notFound:
        "The requested business could not be found."
    }
  },


  // =========================================================
  // FRENCH
  // =========================================================

  fr: {

    siteName: "NearAfrica",
    tagline: "Trouvez de bonnes entreprises près de chez vous.",
    description:
      "Découvrez des entreprises, services, commerces et lieux de confiance à travers l'Afrique.",

    nav: {
      home: "Accueil",
      explore: "Explorer",
      listBusiness: "Ajouter votre entreprise",
      claimBusiness: "Revendiquer une entreprise",
      helpWanted: "Emplois",
      about: "À propos",
      contact: "Contact"
    },

    search: {
      title: "Découvrez l'Afrique. Commencez près de chez vous.",
      whatLookingFor: "Que recherchez-vous ?",
      location: "Lieu",
      searchPlaceholder: "ex. coiffeur, hôtel, restaurant...",
      locationPlaceholder: "ex. Abidjan, Dakar, Lagos...",
      search: "Rechercher",
      useMyLocation: "Utiliser ma position",
      usingYourLocation: "Utilisation de votre position",
      locationAccessDenied:
        "L'accès à votre position a été refusé. Vous pouvez rechercher par zone.",
      locationUnavailable:
        "Votre position n'a pas pu être déterminée.",
      locationError:
        "Impossible d'accéder à votre position. Veuillez réessayer.",
      locationNotSupported:
        "Les services de localisation ne sont pas pris en charge par ce navigateur."
    },

    explore: {
      title: "Explorer les entreprises",
      subtitle:
        "Découvrez des entreprises, services et lieux près de chez vous.",
      businesses: "Entreprises",
      businessesFound: "entreprises trouvées",
      businessesFoundNearby: "entreprises trouvées à proximité",
      businessesNearYou: "Entreprises près de chez vous",
      allBusinesses: "Entreprises",
      noBusinesses: "Aucune entreprise trouvée.",
      noBusinessesNearby:
        "Aucune entreprise n'a été trouvée dans votre zone.",
      distanceUnavailable: "Distance indisponible",
      away: "de distance",
      clearLocation: "Effacer la position",
      filters: "Filtres",
      category: "Catégorie",
      state: "État",
      rating: "Note",
      verifiedOnly: "Vérifiées uniquement",
      allCategories: "Toutes les catégories",
      allStates: "Tous les États",
      anyRating: "Toutes les notes",
      fourPlus: "4 étoiles et plus",
      threePlus: "3 étoiles et plus",
      twoPlus: "2 étoiles et plus",
      verified: "Vérifiée",
      previous: "Précédent",
      next: "Suivant"
    },

    categories: {
      restaurants: "Restaurants et alimentation",
      hotels: "Hôtels et hébergement",
      beauty: "Beauté et spa",
      health: "Santé et médical",
      gyms: "Salles de sport et fitness",
      shopping: "Shopping et commerce",
      supermarkets: "Supermarchés",
      banks: "Banques et finance",
      professional: "Services professionnels",
      education: "Éducation",
      realEstate: "Immobilier",
      automotive: "Automobile",
      travel: "Voyages et tourisme",
      logistics: "Logistique et livraison",
      technology: "Technologie",
      entertainment: "Divertissement",
      fitness: "Fitness et sports",
      construction: "Construction et services à domicile",
      fashion: "Mode",
      agriculture: "Agriculture",
      religious: "Organisations religieuses",
      government: "Services gouvernementaux et publics",
      other: "Autre"
    },

    business: {
      verified: "Vérifiée",
      unverified: "Non vérifiée",
      claimed: "Revendiquée",
      unclaimed: "Non revendiquée",
      viewBusiness: "Voir l'entreprise",
      call: "Appeler",
      whatsapp: "WhatsApp",
      website: "Site web",
      directions: "Itinéraire",
      reviews: "Avis",
      review: "Avis",
      hours: "Horaires",
      services: "Services",
      products: "Produits",
      about: "À propos de cette entreprise",
      contact: "Contact",
      address: "Adresse",
      phone: "Téléphone",
      email: "E-mail",
      openNow: "Ouvert maintenant",
      closedNow: "Fermé",
      openingSoon: "Ouverture prochaine",
      closingSoon: "Fermeture prochaine"
    },

    owner: {
      listBusiness: "Ajouter votre entreprise",
      claimBusiness: "Revendiquer votre entreprise",
      ownerDashboard: "Tableau de bord",
      manageBusiness: "Gérer votre entreprise",
      editBusiness: "Modifier l'entreprise",
      businessAnalytics: "Analyses de l'entreprise"
    },

    reviews: {
      title: "Avis",
      writeReview: "Écrire un avis",
      rating: "Note",
      comment: "Commentaire",
      submit: "Publier l'avis",
      report: "Signaler l'avis",
      noReviews: "Aucun avis pour le moment.",
      reviewSubmitted: "Votre avis a été envoyé."
    },

    helpWanted: {
      title: "Emplois",
      subtitle:
        "Découvrez des opportunités de travail proposées par des entreprises locales.",
      postOpportunity: "Publier une opportunité",
      viewOpportunity: "Voir l'opportunité",
      apply: "Postuler",
      location: "Lieu",
      type: "Type",
      description: "Description"
    },

    account: {
      login: "Connexion",
      logout: "Déconnexion",
      register: "Créer un compte",
      profile: "Profil",
      favorites: "Favoris",
      savedSearches: "Recherches enregistrées",
      recentlyViewed: "Consultés récemment",
      notifications: "Notifications"
    },

    payments: {
      free: "Gratuit",
      pro: "NearAfrica Pro",
      premium: "Premium",
      monthly: "Mensuel",
      subscribe: "S'abonner",
      manageSubscription: "Gérer l'abonnement",
      paymentSuccessful: "Paiement réussi.",
      paymentFailed: "Échec du paiement.",
      subscriptionActive: "Votre abonnement est actif."
    },

    contact: {
      title: "Contacter NearAfrica",
      subtitle:
        "Vous avez une question, besoin d'aide, souhaitez ajouter une entreprise ou signaler un problème ? Nous sommes là pour vous aider.",
      emailTitle: "Envoyez-nous un e-mail",
      emailDescription:
        "Pour les questions générales, l'assistance, les partenariats, les annonces et les corrections.",
      emailAction: "Envoyer un e-mail",
      businessTitle: "Assistance aux entreprises",
      businessDescription:
        "Besoin d'aide concernant une fiche d'entreprise, une revendication ou une correction d'informations ?",
      businessAction: "Ajouter ou revendiquer une entreprise",
      supportTitle: "Assistance de la plateforme",
      supportDescription:
        "Contactez-nous concernant les problèmes du site, les signalements, les suggestions ou d'autres questions NearAfrica.",
      supportAction: "Contacter l'assistance",
      formTitle: "Envoyez-nous un message",
      name: "Votre nom",
      email: "Votre e-mail",
      subject: "Objet",
      message: "Message",
      namePlaceholder: "Entrez votre nom",
      emailPlaceholder: "Entrez votre adresse e-mail",
      subjectPlaceholder: "Quel est le sujet de votre message ?",
      messagePlaceholder: "Écrivez votre message ici...",
      sendMessage: "Envoyer le message",
      formNote:
        "Votre application e-mail s'ouvrira afin que vous puissiez envoyer votre message.",
      success:
        "Votre application e-mail devrait maintenant être ouverte.",
      validation:
        "Veuillez remplir tous les champs obligatoires avant l'envoi.",
      backHome: "Retour à l'accueil"
    },

    actions: {
      save: "Enregistrer",
      cancel: "Annuler",
      close: "Fermer",
      back: "Retour",
      continue: "Continuer",
      submit: "Envoyer",
      confirm: "Confirmer",
      delete: "Supprimer",
      edit: "Modifier",
      report: "Signaler",
      viewMore: "Voir plus",
      learnMore: "En savoir plus",
      loading: "Chargement...",
      retry: "Réessayer"
    },

    legal: {
      privacy: "Politique de confidentialité",
      terms: "Conditions d'utilisation",
      listingPolicy: "Politique des annonces",
      cookiePolicy: "Politique relative aux cookies",
      reviewGuidelines: "Règles des avis"
    },

    footer: {
      copyright: "© 2026 NearAfrica. Tous droits réservés.",
      discover: "Découvrez des entreprises à travers l'Afrique.",
      contactUs: "Nous contacter"
    },

    errors: {
      somethingWentWrong:
        "Une erreur s'est produite. Veuillez réessayer.",
      unableToLoad:
        "Impossible de charger les entreprises.",
      network:
        "Erreur réseau. Vérifiez votre connexion.",
      notFound:
        "L'entreprise demandée est introuvable."
    }
  },


  // =========================================================
  // ARABIC
  // =========================================================

  ar: {

    siteName: "NearAfrica",
    tagline: "اكتشف أفضل الأنشطة التجارية القريبة منك.",
    description:
      "اكتشف الشركات والخدمات والمتاجر والأماكن الموثوقة في جميع أنحاء أفريقيا.",

    nav: {
      home: "الرئيسية",
      explore: "استكشف",
      listBusiness: "أضف نشاطك التجاري",
      claimBusiness: "المطالبة بنشاط تجاري",
      helpWanted: "فرص العمل",
      about: "حول",
      contact: "اتصل بنا"
    },

    search: {
      title: "اكتشف أفريقيا. ابدأ من منطقتك.",
      whatLookingFor: "ما الذي تبحث عنه؟",
      location: "الموقع",
      searchPlaceholder: "مثال: حلاق، فندق، مطعم...",
      locationPlaceholder: "مثال: أبوجا، لاغوس، القاهرة...",
      search: "بحث",
      useMyLocation: "استخدم موقعي",
      usingYourLocation: "يتم استخدام موقعك الحالي",
      locationAccessDenied:
        "تم رفض الوصول إلى موقعك. يمكنك البحث حسب المنطقة.",
      locationUnavailable:
        "تعذر تحديد موقعك.",
      locationError:
        "تعذر الوصول إلى موقعك. يرجى المحاولة مرة أخرى.",
      locationNotSupported:
        "خدمات الموقع غير مدعومة في هذا المتصفح."
    },

    explore: {
      title: "استكشف الأنشطة التجارية",
      subtitle:
        "اكتشف الشركات والخدمات والأماكن القريبة منك.",
      businesses: "الأنشطة التجارية",
      businessesFound: "نشاط تجاري تم العثور عليه",
      businessesFoundNearby: "نشاط تجاري قريب تم العثور عليه",
      businessesNearYou: "الأنشطة التجارية القريبة منك",
      allBusinesses: "الأنشطة التجارية",
      noBusinesses: "لم يتم العثور على أنشطة تجارية.",
      noBusinessesNearby:
        "لم يتم العثور على أنشطة تجارية ضمن منطقتك.",
      distanceUnavailable: "المسافة غير متاحة",
      away: "بعيدًا",
      clearLocation: "مسح الموقع",
      filters: "الفلاتر",
      category: "الفئة",
      state: "الولاية",
      rating: "التقييم",
      verifiedOnly: "موثقة فقط",
      allCategories: "جميع الفئات",
      allStates: "جميع الولايات",
      anyRating: "أي تقييم",
      fourPlus: "4 نجوم فأعلى",
      threePlus: "3 نجوم فأعلى",
      twoPlus: "نجمتان فأعلى",
      verified: "موثق",
      previous: "السابق",
      next: "التالي"
    },

    categories: {
      restaurants: "المطاعم والطعام",
      hotels: "الفنادق والإقامة",
      beauty: "التجميل والسبا",
      health: "الصحة والطب",
      gyms: "اللياقة البدنية",
      shopping: "التسوق والتجزئة",
      supermarkets: "محلات السوبر ماركت",
      banks: "البنوك والتمويل",
      professional: "الخدمات المهنية",
      education: "التعليم",
      realEstate: "العقارات",
      automotive: "السيارات",
      travel: "السفر والسياحة",
      logistics: "الخدمات اللوجستية والتوصيل",
      technology: "التكنولوجيا",
      entertainment: "الترفيه",
      fitness: "اللياقة والرياضة",
      construction: "البناء وخدمات المنزل",
      fashion: "الأزياء",
      agriculture: "الزراعة",
      religious: "المنظمات الدينية",
      government: "الخدمات الحكومية والعامة",
      other: "أخرى"
    },

    business: {
      verified: "موثق",
      unverified: "غير موثق",
      claimed: "تمت المطالبة به",
      unclaimed: "غير مطالب به",
      viewBusiness: "عرض النشاط التجاري",
      call: "اتصال",
      whatsapp: "واتساب",
      website: "الموقع الإلكتروني",
      directions: "الاتجاهات",
      reviews: "التقييمات",
      review: "تقييم",
      hours: "ساعات العمل",
      services: "الخدمات",
      products: "المنتجات",
      about: "حول هذا النشاط التجاري",
      contact: "اتصل",
      address: "العنوان",
      phone: "الهاتف",
      email: "البريد الإلكتروني",
      openNow: "مفتوح الآن",
      closedNow: "مغلق",
      openingSoon: "يفتح قريبًا",
      closingSoon: "يغلق قريبًا"
    },

    owner: {
      listBusiness: "أضف نشاطك التجاري",
      claimBusiness: "طالب بملكية نشاطك التجاري",
      ownerDashboard: "لوحة تحكم المالك",
      manageBusiness: "إدارة نشاطك التجاري",
      editBusiness: "تعديل النشاط التجاري",
      businessAnalytics: "تحليلات النشاط التجاري"
    },

    reviews: {
      title: "التقييمات",
      writeReview: "اكتب تقييمًا",
      rating: "التقييم",
      comment: "التعليق",
      submit: "إرسال التقييم",
      report: "الإبلاغ عن التقييم",
      noReviews: "لا توجد تقييمات حتى الآن.",
      reviewSubmitted: "تم إرسال تقييمك."
    },

    helpWanted: {
      title: "فرص العمل",
      subtitle:
        "اكتشف فرص العمل التي تقدمها الشركات المحلية.",
      postOpportunity: "نشر فرصة",
      viewOpportunity: "عرض الفرصة",
      apply: "تقديم طلب",
      location: "الموقع",
      type: "النوع",
      description: "الوصف"
    },

    account: {
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      register: "إنشاء حساب",
      profile: "الملف الشخصي",
      favorites: "المفضلة",
      savedSearches: "عمليات البحث المحفوظة",
      recentlyViewed: "شوهدت مؤخرًا",
      notifications: "الإشعارات"
    },

    payments: {
      free: "مجاني",
      pro: "NearAfrica Pro",
      premium: "Premium",
      monthly: "شهري",
      subscribe: "اشتراك",
      manageSubscription: "إدارة الاشتراك",
      paymentSuccessful: "تم الدفع بنجاح.",
      paymentFailed: "فشل الدفع.",
      subscriptionActive: "اشتراكك نشط."
    },

    contact: {
      title: "اتصل بـ NearAfrica",
      subtitle:
        "هل لديك سؤال أو تحتاج إلى دعم أو تريد إضافة نشاط تجاري أو الإبلاغ عن مشكلة؟ نحن هنا لمساعدتك.",
      emailTitle: "راسلنا عبر البريد الإلكتروني",
      emailDescription:
        "للأسئلة العامة والدعم والشراكات والقوائم وتصحيح المعلومات.",
      emailAction: "إرسال بريد إلكتروني",
      businessTitle: "دعم أصحاب الأعمال",
      businessDescription:
        "هل تحتاج إلى مساعدة بشأن قائمة تجارية أو المطالبة بنشاط تجاري أو تصحيح معلومات؟",
      businessAction: "إضافة أو المطالبة بنشاط تجاري",
      supportTitle: "دعم المنصة",
      supportDescription:
        "تواصل معنا بشأن مشكلات الموقع أو البلاغات أو الاقتراحات أو أي أمور أخرى تخص NearAfrica.",
      supportAction: "التواصل مع الدعم",
      formTitle: "أرسل لنا رسالة",
      name: "اسمك",
      email: "بريدك الإلكتروني",
      subject: "الموضوع",
      message: "الرسالة",
      namePlaceholder: "أدخل اسمك",
      emailPlaceholder: "أدخل عنوان بريدك الإلكتروني",
      subjectPlaceholder: "ما موضوع رسالتك؟",
      messagePlaceholder: "اكتب رسالتك هنا...",
      sendMessage: "إرسال الرسالة",
      formNote:
        "سيتم فتح تطبيق البريد الإلكتروني حتى تتمكن من إرسال رسالتك.",
      success:
        "من المفترض أن يكون تطبيق البريد الإلكتروني قد تم فتحه الآن.",
      validation:
        "يرجى إكمال جميع الحقول المطلوبة قبل الإرسال.",
      backHome: "العودة إلى الرئيسية"
    },

    actions: {
      save: "حفظ",
      cancel: "إلغاء",
      close: "إغلاق",
      back: "رجوع",
      continue: "متابعة",
      submit: "إرسال",
      confirm: "تأكيد",
      delete: "حذف",
      edit: "تعديل",
      report: "إبلاغ",
      viewMore: "عرض المزيد",
      learnMore: "اعرف المزيد",
      loading: "جارٍ التحميل...",
      retry: "حاول مرة أخرى"
    },

    legal: {
      privacy: "سياسة الخصوصية",
      terms: "شروط الخدمة",
      listingPolicy: "سياسة القوائم",
      cookiePolicy: "سياسة ملفات تعريف الارتباط",
      reviewGuidelines: "إرشادات التقييمات"
    },

    footer: {
      copyright: "© 2026 NearAfrica. جميع الحقوق محفوظة.",
      discover: "اكتشف الشركات في جميع أنحاء أفريقيا.",
      contactUs: "اتصل بنا"
    },

    errors: {
      somethingWentWrong:
        "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      unableToLoad:
        "تعذر تحميل الأنشطة التجارية.",
      network:
        "خطأ في الشبكة. يرجى التحقق من اتصالك.",
      notFound:
        "تعذر العثور على النشاط التجاري المطلوب."
    }
  },


  // =========================================================
  // PORTUGUESE
  // =========================================================

  pt: {

    siteName: "NearAfrica",
    tagline: "Encontre ótimos negócios perto de você.",
    description:
      "Descubra empresas, serviços, lojas e lugares confiáveis em toda a África.",

    nav: {
      home: "Início",
      explore: "Explorar",
      listBusiness: "Cadastrar empresa",
      claimBusiness: "Reivindicar empresa",
      helpWanted: "Oportunidades",
      about: "Sobre",
      contact: "Contato"
    },

    search: {
      title: "Descubra a África. Comece perto de você.",
      whatLookingFor: "O que você está procurando?",
      location: "Localização",
      searchPlaceholder: "ex.: barbeiro, hotel, restaurante...",
      locationPlaceholder: "ex.: Luanda, Maputo, Lagos...",
      search: "Pesquisar",
      useMyLocation: "Usar minha localização",
      usingYourLocation: "Usando sua localização atual",
      locationAccessDenied:
        "O acesso à sua localização foi negado. Você pode pesquisar por área.",
      locationUnavailable:
        "Não foi possível determinar sua localização.",
      locationError:
        "Não foi possível acessar sua localização. Tente novamente.",
      locationNotSupported:
        "Os serviços de localização não são compatíveis com este navegador."
    },

    explore: {
      title: "Explorar empresas",
      subtitle:
        "Descubra empresas, serviços e lugares perto de você.",
      businesses: "Empresas",
      businessesFound: "empresas encontradas",
      businessesFoundNearby: "empresas encontradas próximas",
      businessesNearYou: "Empresas perto de você",
      allBusinesses: "Empresas",
      noBusinesses: "Nenhuma empresa encontrada.",
      noBusinessesNearby:
        "Nenhuma empresa foi encontrada na sua área.",
      distanceUnavailable: "Distância indisponível",
      away: "de distância",
      clearLocation: "Limpar localização",
      filters: "Filtros",
      category: "Categoria",
      state: "Estado",
      rating: "Avaliação",
      verifiedOnly: "Somente verificadas",
      allCategories: "Todas as categorias",
      allStates: "Todos os estados",
      anyRating: "Qualquer avaliação",
      fourPlus: "4 estrelas ou mais",
      threePlus: "3 estrelas ou mais",
      twoPlus: "2 estrelas ou mais",
      verified: "Verificada",
      previous: "Anterior",
      next: "Próximo"
    },

    categories: {
      restaurants: "Restaurantes e alimentação",
      hotels: "Hotéis e hospedagem",
      beauty: "Beleza e spa",
      health: "Saúde e medicina",
      gyms: "Academias e fitness",
      shopping: "Compras e varejo",
      supermarkets: "Supermercados",
      banks: "Bancos e finanças",
      professional: "Serviços profissionais",
      education: "Educação",
      realEstate: "Imobiliário",
      automotive: "Automotivo",
      travel: "Viagens e turismo",
      logistics: "Logística e entrega",
      technology: "Tecnologia",
      entertainment: "Entretenimento",
      fitness: "Fitness e esportes",
      construction: "Construção e serviços domésticos",
      fashion: "Moda",
      agriculture: "Agricultura",
      religious: "Organizações religiosas",
      government: "Serviços governamentais e públicos",
      other: "Outro"
    },

    business: {
      verified: "Verificada",
      unverified: "Não verificada",
      claimed: "Reivindicada",
      unclaimed: "Não reivindicada",
      viewBusiness: "Ver empresa",
      call: "Ligar",
      whatsapp: "WhatsApp",
      website: "Site",
      directions: "Direções",
      reviews: "Avaliações",
      review: "Avaliação",
      hours: "Horário de funcionamento",
      services: "Serviços",
      products: "Produtos",
      about: "Sobre esta empresa",
      contact: "Contato",
      address: "Endereço",
      phone: "Telefone",
      email: "E-mail",
      openNow: "Aberto agora",
      closedNow: "Fechado",
      openingSoon: "Abrindo em breve",
      closingSoon: "Fechando em breve"
    },

    owner: {
      listBusiness: "Cadastrar sua empresa",
      claimBusiness: "Reivindicar sua empresa",
      ownerDashboard: "Painel do proprietário",
      manageBusiness: "Gerenciar sua empresa",
      editBusiness: "Editar empresa",
      businessAnalytics: "Análises da empresa"
    },

    reviews: {
      title: "Avaliações",
      writeReview: "Escrever uma avaliação",
      rating: "Avaliação",
      comment: "Comentário",
      submit: "Enviar avaliação",
      report: "Denunciar avaliação",
      noReviews: "Ainda não há avaliações.",
      reviewSubmitted: "Sua avaliação foi enviada."
    },

    helpWanted: {
      title: "Oportunidades",
      subtitle:
        "Descubra oportunidades de trabalho de empresas locais.",
      postOpportunity: "Publicar oportunidade",
      viewOpportunity: "Ver oportunidade",
      apply: "Candidatar-se",
      location: "Localização",
      type: "Tipo",
      description: "Descrição"
    },

    account: {
      login: "Entrar",
      logout: "Sair",
      register: "Criar conta",
      profile: "Perfil",
      favorites: "Favoritos",
      savedSearches: "Pesquisas salvas",
      recentlyViewed: "Vistos recentemente",
      notifications: "Notificações"
    },

    payments: {
      free: "Grátis",
      pro: "NearAfrica Pro",
      premium: "Premium",
      monthly: "Mensal",
      subscribe: "Assinar",
      manageSubscription: "Gerenciar assinatura",
      paymentSuccessful: "Pagamento realizado com sucesso.",
      paymentFailed: "Falha no pagamento.",
      subscriptionActive: "Sua assinatura está ativa."
    },

    contact: {
      title: "Entre em contato com a NearAfrica",
      subtitle:
        "Tem uma pergunta, precisa de suporte, quer cadastrar uma empresa ou deseja relatar um problema? Estamos aqui para ajudar.",
      emailTitle: "Envie um e-mail",
      emailDescription:
        "Para perguntas gerais, suporte, parcerias, anúncios e correções.",
      emailAction: "Enviar e-mail",
      businessTitle: "Suporte para empresas",
      businessDescription:
        "Precisa de ajuda com uma página de empresa, reivindicação ou correção de informações?",
      businessAction: "Cadastrar ou reivindicar uma empresa",
      supportTitle: "Suporte da plataforma",
      supportDescription:
        "Entre em contato sobre problemas no site, denúncias, sugestões ou outras questões relacionadas à NearAfrica.",
      supportAction: "Contatar suporte",
      formTitle: "Envie uma mensagem",
      name: "Seu nome",
      email: "Seu e-mail",
      subject: "Assunto",
      message: "Mensagem",
      namePlaceholder: "Digite seu nome",
      emailPlaceholder: "Digite seu endereço de e-mail",
      subjectPlaceholder: "Sobre o que é sua mensagem?",
      messagePlaceholder: "Escreva sua mensagem aqui...",
      sendMessage: "Enviar mensagem",
      formNote:
        "Seu aplicativo de e-mail será aberto para que você possa enviar sua mensagem.",
      success:
        "Seu aplicativo de e-mail deve estar aberto agora.",
      validation:
        "Preencha todos os campos obrigatórios antes de enviar.",
      backHome: "Voltar ao início"
    },

    actions: {
      save: "Salvar",
      cancel: "Cancelar",
      close: "Fechar",
      back: "Voltar",
      continue: "Continuar",
      submit: "Enviar",
      confirm: "Confirmar",
      delete: "Excluir",
      edit: "Editar",
      report: "Denunciar",
      viewMore: "Ver mais",
      learnMore: "Saiba mais",
      loading: "Carregando...",
      retry: "Tentar novamente"
    },

    legal: {
      privacy: "Política de privacidade",
      terms: "Termos de serviço",
      listingPolicy: "Política de listagens",
      cookiePolicy: "Política de cookies",
      reviewGuidelines: "Diretrizes de avaliações"
    },

    footer: {
      copyright: "© 2026 NearAfrica. Todos os direitos reservados.",
      discover: "Descubra empresas em toda a África.",
      contactUs: "Fale conosco"
    },

    errors: {
      somethingWentWrong:
        "Algo deu errado. Tente novamente.",
      unableToLoad:
        "Não foi possível carregar as empresas.",
      network:
        "Erro de rede. Verifique sua conexão.",
      notFound:
        "A empresa solicitada não foi encontrada."
    }
  },


  // =========================================================
  // SWAHILI
  // =========================================================

  sw: {

    siteName: "NearAfrica",
    tagline: "Pata biashara nzuri karibu nawe.",
    description:
      "Gundua biashara, huduma, maduka na maeneo yanayoaminika kote Afrika.",

    nav: {
      home: "Nyumbani",
      explore: "Chunguza",
      listBusiness: "Orodhesha Biashara Yako",
      claimBusiness: "Dai Biashara",
      helpWanted: "Nafasi za Kazi",
      about: "Kuhusu",
      contact: "Wasiliana Nasi"
    },

    search: {
      title: "Gundua Afrika. Anza Karibu.",
      whatLookingFor: "Unatafuta nini?",
      location: "Mahali",
      searchPlaceholder: "mfano: kinyozi, hoteli, mkahawa...",
      locationPlaceholder: "mfano: Nairobi, Kampala, Dar es Salaam...",
      search: "Tafuta",
      useMyLocation: "Tumia Mahali Nilipo",
      usingYourLocation: "Tunatumia eneo lako la sasa",
      locationAccessDenied:
        "Ufikiaji wa eneo lako umekataliwa. Unaweza kutafuta kwa eneo.",
      locationUnavailable:
        "Haikuwezekana kubaini eneo lako.",
      locationError:
        "Haikuwezekana kufikia eneo lako. Tafadhali jaribu tena.",
      locationNotSupported:
        "Huduma za eneo hazitumiki kwenye kivinjari hiki."
    },

    explore: {
      title: "Chunguza Biashara",
      subtitle:
        "Gundua biashara, huduma na maeneo karibu nawe.",
      businesses: "Biashara",
      businessesFound: "biashara zimepatikana",
      businessesFoundNearby: "biashara zimepatikana karibu",
      businessesNearYou: "Biashara Karibu Nawe",
      allBusinesses: "Biashara",
      noBusinesses: "Hakuna biashara zilizopatikana.",
      noBusinessesNearby:
        "Hakuna biashara zilizopatikana katika eneo lako.",
      distanceUnavailable: "Umbali haupatikani",
      away: "mbali",
      clearLocation: "Futa Mahali",
      filters: "Vichujio",
      category: "Aina",
      state: "Jimbo",
      rating: "Ukadiriaji",
      verifiedOnly: "Zilizothibitishwa pekee",
      allCategories: "Aina Zote",
      allStates: "Majimbo Yote",
      anyRating: "Ukadiriaji Wowote",
      fourPlus: "Nyota 4 au zaidi",
      threePlus: "Nyota 3 au zaidi",
      twoPlus: "Nyota 2 au zaidi",
      verified: "Imethibitishwa",
      previous: "Iliyotangulia",
      next: "Ifuatayo"
    },

    categories: {
      restaurants: "Mikahawa na Chakula",
      hotels: "Hoteli na Malazi",
      beauty: "Urembo na Spa",
      health: "Afya na Tiba",
      gyms: "Mazoezi na Fitness",
      shopping: "Ununuzi na Rejareja",
      supermarkets: "Maduka Makubwa",
      banks: "Benki na Fedha",
      professional: "Huduma za Kitaalamu",
      education: "Elimu",
      realEstate: "Mali Isiyohamishika",
      automotive: "Magari",
      travel: "Usafiri na Utalii",
      logistics: "Usafirishaji na Uwasilishaji",
      technology: "Teknolojia",
      entertainment: "Burudani",
      fitness: "Fitness na Michezo",
      construction: "Ujenzi na Huduma za Nyumbani",
      fashion: "Mitindo",
      agriculture: "Kilimo",
      religious: "Mashirika ya Kidini",
      government: "Huduma za Serikali na Umma",
      other: "Nyingine"
    },

    business: {
      verified: "Imethibitishwa",
      unverified: "Haijathibitishwa",
      claimed: "Imedaiwa",
      unclaimed: "Haijadaiwa",
      viewBusiness: "Tazama Biashara",
      call: "Piga Simu",
      whatsapp: "WhatsApp",
      website: "Tovuti",
      directions: "Maelekezo",
      reviews: "Maoni",
      review: "Maoni",
      hours: "Saa za Biashara",
      services: "Huduma",
      products: "Bidhaa",
      about: "Kuhusu Biashara Hii",
      contact: "Wasiliana",
      address: "Anwani",
      phone: "Simu",
      email: "Barua pepe",
      openNow: "Imefunguliwa sasa",
      closedNow: "Imefungwa",
      openingSoon: "Inafunguliwa hivi karibuni",
      closingSoon: "Inafungwa hivi karibuni"
    },

    owner: {
      listBusiness: "Orodhesha Biashara Yako",
      claimBusiness: "Dai Biashara Yako",
      ownerDashboard: "Dashibodi ya Mmiliki",
      manageBusiness: "Simamia Biashara Yako",
      editBusiness: "Hariri Biashara",
      businessAnalytics: "Takwimu za Biashara"
    },

    reviews: {
      title: "Maoni",
      writeReview: "Andika Maoni",
      rating: "Ukadiriaji",
      comment: "Maoni",
      submit: "Tuma Maoni",
      report: "Ripoti Maoni",
      noReviews: "Hakuna maoni bado.",
      reviewSubmitted: "Maoni yako yametumwa."
    },

    helpWanted: {
      title: "Nafasi za Kazi",
      subtitle:
        "Gundua fursa za kazi kutoka kwa biashara za karibu.",
      postOpportunity: "Chapisha Fursa",
      viewOpportunity: "Tazama Fursa",
      apply: "Omba",
      location: "Mahali",
      type: "Aina",
      description: "Maelezo"
    },

    account: {
      login: "Ingia",
      logout: "Toka",
      register: "Fungua Akaunti",
      profile: "Wasifu",
      favorites: "Vipendwa",
      savedSearches: "Utafutaji Uliotunzwa",
      recentlyViewed: "Zilizotazamwa Hivi Karibuni",
      notifications: "Arifa"
    },

    payments: {
      free: "Bure",
      pro: "NearAfrica Pro",
      premium: "Premium",
      monthly: "Kila Mwezi",
      subscribe: "Jisajili",
      manageSubscription: "Simamia Usajili",
      paymentSuccessful: "Malipo yamefanikiwa.",
      paymentFailed: "Malipo yameshindwa.",
      subscriptionActive: "Usajili wako unatumika."
    },

    contact: {
      title: "Wasiliana na NearAfrica",
      subtitle:
        "Una swali, unahitaji msaada, unataka kuorodhesha biashara au kuripoti tatizo? Tuko hapa kukusaidia.",
      emailTitle: "Tutumie Barua Pepe",
      emailDescription:
        "Kwa maswali ya jumla, msaada, ushirikiano, matangazo na marekebisho.",
      emailAction: "Tuma Barua Pepe",
      businessTitle: "Msaada wa Biashara",
      businessDescription:
        "Unahitaji msaada kuhusu orodha ya biashara, kudai biashara au kurekebisha taarifa?",
      businessAction: "Orodhesha au Dai Biashara",
      supportTitle: "Msaada wa Jukwaa",
      supportDescription:
        "Wasiliana nasi kuhusu matatizo ya tovuti, ripoti, mapendekezo au mambo mengine ya NearAfrica.",
      supportAction: "Wasiliana na Msaada",
      formTitle: "Tutumie Ujumbe",
      name: "Jina Lako",
      email: "Barua Pepe Yako",
      subject: "Mada",
      message: "Ujumbe",
      namePlaceholder: "Ingiza jina lako",
      emailPlaceholder: "Ingiza anwani yako ya barua pepe",
      subjectPlaceholder: "Ujumbe wako unahusu nini?",
      messagePlaceholder: "Andika ujumbe wako hapa...",
      sendMessage: "Tuma Ujumbe",
      formNote:
        "Programu yako ya barua pepe itafunguliwa ili uweze kutuma ujumbe wako.",
      success:
        "Programu yako ya barua pepe inapaswa kuwa imefunguliwa sasa.",
      validation:
        "Tafadhali jaza sehemu zote zinazohitajika kabla ya kutuma.",
      backHome: "Rudi Nyumbani"
    },

    actions: {
      save: "Hifadhi",
      cancel: "Ghairi",
      close: "Funga",
      back: "Rudi",
      continue: "Endelea",
      submit: "Tuma",
      confirm: "Thibitisha",
      delete: "Futa",
      edit: "Hariri",
      report: "Ripoti",
      viewMore: "Tazama Zaidi",
      learnMore: "Jifunze Zaidi",
      loading: "Inapakia...",
      retry: "Jaribu Tena"
    },

    legal: {
      privacy: "Sera ya Faragha",
      terms: "Masharti ya Huduma",
      listingPolicy: "Sera ya Orodha",
      cookiePolicy: "Sera ya Vidakuzi",
      reviewGuidelines: "Mwongozo wa Maoni"
    },

    footer: {
      copyright: "© 2026 NearAfrica. Haki zote zimehifadhiwa.",
      discover: "Gundua biashara kote Afrika.",
      contactUs: "Wasiliana Nasi"
    },

    errors: {
      somethingWentWrong:
        "Kuna tatizo. Tafadhali jaribu tena.",
      unableToLoad:
        "Imeshindikana kupakia biashara.",
      network:
        "Hitilafu ya mtandao. Tafadhali angalia muunganisho wako.",
      notFound:
        "Biashara uliyoomba haikupatikana."
    }
  }

};


// =============================================================
// MAKE TRANSLATIONS AVAILABLE TO THE FRONTEND
// =============================================================

if (typeof window !== "undefined") {
  window.NearAfricaTranslations = NearAfricaTranslations;
}


// =============================================================
// SUPPORT MODULE SYSTEMS
// =============================================================

if (
  typeof module !== "undefined" &&
  module.exports
) {
  module.exports = NearAfricaTranslations;
}
```
