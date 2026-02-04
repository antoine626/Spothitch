/**
 * Internationalization (i18n) Module
 * Handles translations, language detection, and pluralization
 */

import { getState, setState } from '../stores/state.js';

// Language configurations with flags
export const languageConfig = {
  fr: { code: 'fr', name: 'Francais', flag: '\uD83C\uDDEB\uD83C\uDDF7', nativeName: 'Francais' },
  en: { code: 'en', name: 'English', flag: '\uD83C\uDDEC\uD83C\uDDE7', nativeName: 'English' },
  es: { code: 'es', name: 'Espanol', flag: '\uD83C\uDDEA\uD83C\uDDF8', nativeName: 'Espanol' },
  de: { code: 'de', name: 'German', flag: '\uD83C\uDDE9\uD83C\uDDEA', nativeName: 'Deutsch' },
};

/**
 * Pluralization rules per language
 * Each language has specific rules for singular/plural forms
 */
const pluralRules = {
  // French: 0-1 = singular, 2+ = plural
  fr: (count) => (count <= 1 ? 'one' : 'other'),
  // English: 1 = singular, others = plural
  en: (count) => (count === 1 ? 'one' : 'other'),
  // Spanish: 1 = singular, others = plural
  es: (count) => (count === 1 ? 'one' : 'other'),
  // German: 1 = singular, others = plural
  de: (count) => (count === 1 ? 'one' : 'other'),
};

/**
 * Plural forms for common words
 * Format: { key: { one: singular, other: plural } }
 */
const pluralForms = {
  fr: {
    spot: { one: 'spot', other: 'spots' },
    review: { one: 'avis', other: 'avis' },
    checkin: { one: 'check-in', other: 'check-ins' },
    point: { one: 'point', other: 'points' },
    friend: { one: 'ami', other: 'amis' },
    badge: { one: 'badge', other: 'badges' },
    trip: { one: 'voyage', other: 'voyages' },
    day: { one: 'jour', other: 'jours' },
    hour: { one: 'heure', other: 'heures' },
    minute: { one: 'minute', other: 'minutes' },
    kilometer: { one: 'kilometre', other: 'kilometres' },
    user: { one: 'utilisateur', other: 'utilisateurs' },
    message: { one: 'message', other: 'messages' },
    photo: { one: 'photo', other: 'photos' },
    result: { one: 'resultat', other: 'resultats' },
    entry: { one: 'entree', other: 'entrees' },
    notification: { one: 'notification', other: 'notifications' },
  },
  en: {
    spot: { one: 'spot', other: 'spots' },
    review: { one: 'review', other: 'reviews' },
    checkin: { one: 'check-in', other: 'check-ins' },
    point: { one: 'point', other: 'points' },
    friend: { one: 'friend', other: 'friends' },
    badge: { one: 'badge', other: 'badges' },
    trip: { one: 'trip', other: 'trips' },
    day: { one: 'day', other: 'days' },
    hour: { one: 'hour', other: 'hours' },
    minute: { one: 'minute', other: 'minutes' },
    kilometer: { one: 'kilometer', other: 'kilometers' },
    user: { one: 'user', other: 'users' },
    message: { one: 'message', other: 'messages' },
    photo: { one: 'photo', other: 'photos' },
    result: { one: 'result', other: 'results' },
    entry: { one: 'entry', other: 'entries' },
    notification: { one: 'notification', other: 'notifications' },
  },
  es: {
    spot: { one: 'spot', other: 'spots' },
    review: { one: 'opinion', other: 'opiniones' },
    checkin: { one: 'check-in', other: 'check-ins' },
    point: { one: 'punto', other: 'puntos' },
    friend: { one: 'amigo', other: 'amigos' },
    badge: { one: 'insignia', other: 'insignias' },
    trip: { one: 'viaje', other: 'viajes' },
    day: { one: 'dia', other: 'dias' },
    hour: { one: 'hora', other: 'horas' },
    minute: { one: 'minuto', other: 'minutos' },
    kilometer: { one: 'kilometro', other: 'kilometros' },
    user: { one: 'usuario', other: 'usuarios' },
    message: { one: 'mensaje', other: 'mensajes' },
    photo: { one: 'foto', other: 'fotos' },
    result: { one: 'resultado', other: 'resultados' },
    entry: { one: 'entrada', other: 'entradas' },
    notification: { one: 'notificacion', other: 'notificaciones' },
  },
  de: {
    spot: { one: 'Spot', other: 'Spots' },
    review: { one: 'Bewertung', other: 'Bewertungen' },
    checkin: { one: 'Check-in', other: 'Check-ins' },
    point: { one: 'Punkt', other: 'Punkte' },
    friend: { one: 'Freund', other: 'Freunde' },
    badge: { one: 'Abzeichen', other: 'Abzeichen' },
    trip: { one: 'Reise', other: 'Reisen' },
    day: { one: 'Tag', other: 'Tage' },
    hour: { one: 'Stunde', other: 'Stunden' },
    minute: { one: 'Minute', other: 'Minuten' },
    kilometer: { one: 'Kilometer', other: 'Kilometer' },
    user: { one: 'Benutzer', other: 'Benutzer' },
    message: { one: 'Nachricht', other: 'Nachrichten' },
    photo: { one: 'Foto', other: 'Fotos' },
    result: { one: 'Ergebnis', other: 'Ergebnisse' },
    entry: { one: 'Eintrag', other: 'Eintrage' },
    notification: { one: 'Benachrichtigung', other: 'Benachrichtigungen' },
  },
};

/**
 * Pluralize a word based on count and current language
 * @param {string} key - The word key (e.g., 'spot', 'review', 'friend')
 * @param {number} count - The count to determine plural form
 * @param {boolean} includeCount - Whether to include the count in the result (default: true)
 * @returns {string} The pluralized word with or without count
 *
 * @example
 * pluralize('spot', 1) // "1 spot"
 * pluralize('spot', 5) // "5 spots"
 * pluralize('spot', 0) // "0 spots" (in English) or "0 spot" (in French)
 * pluralize('spot', 2, false) // "spots" (without count)
 */
export function pluralize(key, count, includeCount = true) {
  const { lang } = getState();
  const langForms = pluralForms[lang] || pluralForms.en;
  const langRule = pluralRules[lang] || pluralRules.en;

  // Get the word forms for this key
  const forms = langForms[key];
  if (!forms) {
    // Fallback: return key with count if no forms defined
    return includeCount ? `${count} ${key}` : key;
  }

  // Determine which form to use based on count
  const form = langRule(count);
  const word = forms[form] || forms.other;

  return includeCount ? `${count} ${word}` : word;
}

/**
 * Format a count with the appropriate plural form
 * Convenience function that always includes the count
 * @param {number} count - The count
 * @param {string} key - The word key
 * @returns {string} Formatted string like "5 spots"
 */
export function formatCount(count, key) {
  return pluralize(key, count, true);
}

/**
 * Get just the plural word without the count
 * @param {string} key - The word key
 * @param {number} count - The count to determine form
 * @returns {string} Just the word in correct form
 */
export function getPluralWord(key, count) {
  return pluralize(key, count, false);
}

// Embedded translations for instant loading
const translations = {
  fr: {
    // App
    appName: 'SpotHitch',
    tagline: 'La communauté des autostoppeurs',
    loading: 'Chargement...',

    // Navigation
    home: 'Accueil',
    spots: 'Spots',
    map: 'Carte',
    planner: 'Voyage',
    chat: 'Chat',
    profile: 'Profil',

    // Welcome
    welcome: 'Bienvenue !',
    welcomeDesc: 'Rejoins la communaute des autostoppeurs',
    yourUsername: 'Ton pseudo',
    chooseAvatar: 'Choisis ton avatar',
    letsGo: "C'est parti !",
    chooseLanguage: 'Choisis ta langue',
    continueWithoutAccount: 'Continuer sans compte',

    // Spots
    searchSpot: 'Rechercher un spot...',
    addSpot: 'Ajouter un spot',
    from: 'Départ',
    to: 'Destination',
    description: 'Description du spot',
    takePhoto: 'Prendre une photo',
    photoRequired: '📸 Photo obligatoire',
    create: 'Partager',
    reviews: 'avis',
    verified: 'Vérifié',
    topSpot: 'Top',
    goodSpot: 'Bon',
    newSpot: 'Nouveau',
    oldSpot: 'Ancien',
    estimatedWait: 'Attente',
    lastUsed: 'Dernière utilisation',
    checkin: 'Check-in',
    checkinSuccess: 'Check-in enregistré !',

    // Ratings
    rate: 'Évaluer',
    rateSpot: 'Évalue ce spot',
    waitTime: "Temps d'attente",
    accessibility: 'Accessibilité',
    safetyRating: 'Sécurité',
    visibility: 'Visibilité',
    traffic: 'Trafic',
    comment: 'Commentaire',
    submit: 'Publier',

    // Trip Planner
    planTrip: 'Planifier un voyage',
    addStep: 'Ajouter une étape',
    startCity: 'Ville de départ',
    endCity: 'Destination',
    bestSpots: 'Top 3 spots',
    saveTrip: 'Sauvegarder',
    myTrips: 'Mes voyages',
    noTrips: 'Aucun voyage',

    // Profile
    level: 'Niveau',
    points: 'points',
    spotsShared: 'Spots',
    checkinsCount: 'Check-ins',
    reviewsGiven: 'Avis',
    streak: 'Série',
    settings: 'Paramètres',
    theme: 'Thème',
    darkMode: 'Mode sombre',
    lightMode: 'Mode clair',
    language: 'Langue',
    logout: 'Déconnexion',

    // Filters
    filterAll: 'Tous',
    filterTop: 'Top',
    filterRecent: 'Récents',
    filterNearby: 'Proches',
    filters: 'Filtres',
    minRating: 'Note minimum',
    maxWait: 'Attente max',
    applyFilters: 'Appliquer',
    resetFilters: 'Réinitialiser',

    // SOS
    sosTitle: 'Mode Urgence',
    sosDesc: 'Partage ta position avec tes contacts',
    shareLocation: 'Partager ma position',
    emergencyContacts: "Contacts d'urgence",
    addContact: 'Ajouter',
    iAmSafe: 'Je suis en sécurité',

    // Tutorial
    tutoSkip: 'Passer',
    tutoNext: 'Suivant',
    tutoPrev: 'Précédent',
    tutoFinish: 'Terminer',

    // Auth
    login: 'Connexion',
    register: 'Inscription',
    email: 'Email',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer',
    forgotPassword: 'Mot de passe oublié ?',
    noAccount: 'Pas de compte ?',
    alreadyAccount: 'Déjà un compte ?',
    createAccount: 'Créer un compte',
    continueWithGoogle: 'Continuer avec Google',

    // Email Verification
    emailVerificationTitle: 'Vérification de l\'email',
    emailVerificationMessage: 'Un email de vérification a été envoyé à',
    emailVerificationSubtitle: 'Clique sur le lien dans l\'email pour confirmer ton adresse',
    resendEmail: 'Renvoyer l\'email',
    verifyEmail: 'J\'ai vérifié',
    emailVerified: 'Email confirmé !',
    emailVerificationPending: 'En attente de vérification...',
    resendCountdown: 'Renvoyer dans {seconds}s',
    emailNotVerified: 'Email non vérifié',
    verificationCheckingEmail: 'Vérification de l\'email...',
    verificationEmailSent: 'Email de vérification envoyé !',
    verificationEmailNotSent: 'Impossible de renvoyer l\'email',
    emailAlreadyVerified: 'Cet email est déjà vérifié',
    emailVerificationError: 'Erreur lors de la vérification',

    // Errors
    networkError: 'Erreur de connexion',
    authError: "Erreur d'authentification",
    saveSuccess: 'Sauvegardé !',
    saveFailed: 'Erreur lors de la sauvegarde',

    // Empty states
    noSpots: 'Aucun spot trouvé',
    noResults: 'Pas de résultats',
    beFirst: 'Sois le premier !',

    // Chat
    general: 'Général',
    help: 'Aide',
    typeMessage: 'Écris ton message...',
    send: 'Envoyer',

    // Cookie Banner (RGPD)
    cookieTitle: 'Respect de votre vie privée',
    cookieDescription: 'Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. Les cookies nécessaires sont toujours actifs pour le bon fonctionnement du site.',
    cookieAccept: 'Accepter',
    cookieRefuse: 'Refuser',
    cookieCustomize: 'Personnaliser',
    cookiePreferences: 'Préférences des cookies',
    cookieNecessary: 'Cookies nécessaires',
    cookieNecessaryDesc: 'Ces cookies sont essentiels au fonctionnement du site (authentification, sécurité, préférences de base).',
    cookieAnalytics: 'Cookies analytiques',
    cookieAnalyticsDesc: 'Nous aident à comprendre comment vous utilisez le site pour l\'améliorer (pages visitées, temps passé, etc.).',
    cookieMarketing: 'Cookies marketing',
    cookieMarketingDesc: 'Permettent d\'afficher des contenus personnalisés et de mesurer l\'efficacité de nos campagnes.',
    cookiePersonalization: 'Cookies de personnalisation',
    cookiePersonalizationDesc: 'Mémorisent vos préférences pour personnaliser votre expérience (langue, thème, recommandations).',
    savePreferences: 'Enregistrer mes choix',
    acceptAll: 'Tout accepter',
    required: 'Obligatoire',
    cookieLegalText: 'En continuant, vous acceptez notre',
    privacyPolicy: 'Politique de confidentialite',
    termsOfService: 'CGU',
    and: 'et',
    close: 'Fermer',

    // My Data (GDPR)
    myData: 'Mes donnees',
    gdprCompliance: 'Conformite RGPD',
    personalInfo: 'Informations personnelles',
    username: 'Nom d\'utilisateur',
    registrationDate: 'Date d\'inscription',
    lastLogin: 'Derniere connexion',
    activity: 'Activite',
    spotsCreatedLabel: 'Spots crees',
    reviewsGivenLabel: 'Avis donnes',
    friendsCount: 'Amis',
    savedTrips: 'Voyages sauvegardes',
    badgesEarned: 'Badges obtenus',
    rewardsLabel: 'Recompenses',
    progression: 'Progression',
    totalPoints: 'Points totaux',
    currentLevel: 'Niveau actuel',
    seasonPoints: 'Points de saison',
    currentStreak: 'Serie actuelle',
    skillPoints: 'Points de competence',
    unlockedSkills: 'Competences debloquees',
    locationData: 'Donnees de localisation',
    lastKnownPosition: 'Derniere position connue',
    gpsEnabled: 'GPS active',
    locationHistory: 'Historique des positions',
    consents: 'Consentements',
    cookies: 'Cookies',
    geolocation: 'Geolocalisation',
    notifications: 'Notifications',
    manageConsents: 'Gerer mes consentements',
    actions: 'Actions',
    downloadMyData: 'Telecharger mes donnees',
    deleteAccount: 'Supprimer mon compte',
    irreversibleAction: 'Action irreversible',
    gdprFooter: 'Conformement au RGPD, vous avez le droit d\'acceder, de rectifier et de supprimer vos donnees personnelles.',
    viewPrivacyPolicy: 'Consulter notre politique de confidentialite',
    accepted: 'Accepte',
    refused: 'Refuse',
    notDefined: 'Non defini',
    notAvailable: 'Non disponible',
    notAuthorized: 'Non autorisee',
    entries: 'entrees',
    days: 'jours',
    yes: 'Oui',
    no: 'Non',

    // Location Permission
    locationPermissionTitle: 'Pourquoi on a besoin de ta position ?',
    locationPermissionDesc: 'Pour te proposer la meilleure experience autostop',
    locationReason1Title: 'Trouver les spots proches',
    locationReason1Desc: 'On affiche les meilleurs spots autour de toi',
    locationReason2Title: 'Te montrer sur la carte',
    locationReason2Desc: 'Vois ta position par rapport aux spots',
    locationReason3Title: 'Calculer les distances',
    locationReason3Desc: 'Sache a combien tu es de chaque spot',
    locationPrivacyAssurance: 'Ta position n\'est JAMAIS partagee sans ton accord',
    locationAllow: 'Autoriser',
    locationDecline: 'Non merci',
    locationGranted: 'Position activee !',
    locationDeclinedMessage: 'Pas de souci ! Tu peux activer la localisation plus tard.',
    locationNotSupported: 'La geolocalisation n\'est pas supportee',
    locationPermissionDenied: 'Permission de localisation refusee',
    locationUnavailable: 'Position non disponible',
    locationTimeout: 'Delai de localisation depasse',
    locationError: 'Erreur de localisation',
    locationBrowserDenied: 'La localisation est bloquee dans ton navigateur',
    locationDeclined: 'Localisation desactivee',

    // Age Verification (RGPD - Minimum age 16)
    ageVerificationTitle: 'Verifions ton age',
    ageVerificationDesc: 'Pour respecter la loi, on doit s\'assurer que tu as au moins 16 ans. Pas d\'inquietude, cette info n\'est pas stockee !',
    ageVerificationNote: 'La verification d\'age est obligatoire en Europe pour les services en ligne (RGPD).',
    birthDate: 'Date de naissance',
    ageRequiredMessage: 'Entre ta date de naissance pour continuer',
    ageInvalidFormat: 'Format de date invalide',
    ageFutureDate: 'Tu ne peux pas etre ne(e) dans le futur !',
    ageUnreasonable: 'La date de naissance semble incorrecte',
    ageTooYoung: 'Tu dois avoir au moins 16 ans pour t\'inscrire',
    ageVerify: 'Verifier mon age',
    ageVerifying: 'Verification en cours...',
    yourAge: 'Ton age',
    ageVerificationSuccess: 'Age verifie ! Bienvenue !',
    ageVerificationError: 'Erreur lors de la verification. Reedssaye plus tard.',
    ageTooYoungTitle: 'Tu es trop jeune pour l\'instant',
    ageTooYoungMessage: 'On comprend que tu sois enthousiaste pour rejoindre SpotHitch ! Reviens quand tu auras 16 ans. L\'aventure t\'attendra !',
    ageGDPRNote: 'Conformement au RGPD, cette information n\'est pas conservee une fois la verification effectuee.',
  },

  en: {
    // App
    appName: 'SpotHitch',
    tagline: 'The hitchhiking community',
    loading: 'Loading...',

    // Navigation
    home: 'Home',
    spots: 'Spots',
    map: 'Map',
    planner: 'Trips',
    chat: 'Chat',
    profile: 'Profile',

    // Welcome
    welcome: 'Welcome!',
    welcomeDesc: 'Join the hitchhiking community',
    yourUsername: 'Username',
    chooseAvatar: 'Choose avatar',
    letsGo: "Let's go!",
    chooseLanguage: 'Choose your language',
    continueWithoutAccount: 'Continue without account',

    // Spots
    searchSpot: 'Search spot...',
    addSpot: 'Add spot',
    from: 'From',
    to: 'To',
    description: 'Spot description',
    takePhoto: 'Take photo',
    photoRequired: '📸 Photo required',
    create: 'Share',
    reviews: 'reviews',
    verified: 'Verified',
    topSpot: 'Top',
    goodSpot: 'Good',
    newSpot: 'New',
    oldSpot: 'Old',
    estimatedWait: 'Wait',
    lastUsed: 'Last used',
    checkin: 'Check-in',
    checkinSuccess: 'Check-in recorded!',

    // Ratings
    rate: 'Rate',
    rateSpot: 'Rate this spot',
    waitTime: 'Wait time',
    accessibility: 'Accessibility',
    safetyRating: 'Safety',
    visibility: 'Visibility',
    traffic: 'Traffic',
    comment: 'Comment',
    submit: 'Submit',

    // Trip Planner
    planTrip: 'Plan a trip',
    addStep: 'Add stop',
    startCity: 'Starting city',
    endCity: 'Destination',
    bestSpots: 'Top 3 spots',
    saveTrip: 'Save',
    myTrips: 'My trips',
    noTrips: 'No trips',

    // Profile
    level: 'Level',
    points: 'points',
    spotsShared: 'Spots',
    checkinsCount: 'Check-ins',
    reviewsGiven: 'Reviews',
    streak: 'Streak',
    settings: 'Settings',
    theme: 'Theme',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    language: 'Language',
    logout: 'Logout',

    // Filters
    filterAll: 'All',
    filterTop: 'Top',
    filterRecent: 'Recent',
    filterNearby: 'Nearby',
    filters: 'Filters',
    minRating: 'Min rating',
    maxWait: 'Max wait',
    applyFilters: 'Apply',
    resetFilters: 'Reset',

    // SOS
    sosTitle: 'Emergency Mode',
    sosDesc: 'Share your location with contacts',
    shareLocation: 'Share location',
    emergencyContacts: 'Emergency contacts',
    addContact: 'Add',
    iAmSafe: 'I am safe',

    // Tutorial
    tutoSkip: 'Skip',
    tutoNext: 'Next',
    tutoPrev: 'Previous',
    tutoFinish: 'Finish',

    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm',
    forgotPassword: 'Forgot password?',
    noAccount: 'No account?',
    alreadyAccount: 'Already have an account?',
    createAccount: 'Create account',
    continueWithGoogle: 'Continue with Google',

    // Email Verification
    emailVerificationTitle: 'Email verification',
    emailVerificationMessage: 'A verification email has been sent to',
    emailVerificationSubtitle: 'Click the link in your email to confirm your address',
    resendEmail: 'Resend email',
    verifyEmail: 'I verified it',
    emailVerified: 'Email verified!',
    emailVerificationPending: 'Verification pending...',
    resendCountdown: 'Resend in {seconds}s',
    emailNotVerified: 'Email not verified',
    verificationCheckingEmail: 'Checking email...',
    verificationEmailSent: 'Verification email sent!',
    verificationEmailNotSent: 'Unable to resend email',
    emailAlreadyVerified: 'This email is already verified',
    emailVerificationError: 'Error verifying email',

    // Errors
    networkError: 'Connection error',
    authError: 'Authentication error',
    saveSuccess: 'Saved!',
    saveFailed: 'Save failed',

    // Empty states
    noSpots: 'No spots found',
    noResults: 'No results',
    beFirst: 'Be the first!',

    // Chat
    general: 'General',
    help: 'Help',
    typeMessage: 'Type message...',
    send: 'Send',

    // Cookie Banner (GDPR)
    cookieTitle: 'Your Privacy Matters',
    cookieDescription: 'We use cookies to improve your experience, analyze traffic, and personalize content. Necessary cookies are always active for the proper functioning of the site.',
    cookieAccept: 'Accept',
    cookieRefuse: 'Decline',
    cookieCustomize: 'Customize',
    cookiePreferences: 'Cookie Preferences',
    cookieNecessary: 'Necessary Cookies',
    cookieNecessaryDesc: 'These cookies are essential for the site to function properly (authentication, security, basic preferences).',
    cookieAnalytics: 'Analytics Cookies',
    cookieAnalyticsDesc: 'Help us understand how you use the site to improve it (pages visited, time spent, etc.).',
    cookieMarketing: 'Marketing Cookies',
    cookieMarketingDesc: 'Allow us to display personalized content and measure the effectiveness of our campaigns.',
    cookiePersonalization: 'Personalization Cookies',
    cookiePersonalizationDesc: 'Remember your preferences to personalize your experience (language, theme, recommendations).',
    savePreferences: 'Save my choices',
    acceptAll: 'Accept all',
    required: 'Required',
    cookieLegalText: 'By continuing, you agree to our',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    and: 'and',
    close: 'Close',

    // My Data (GDPR)
    myData: 'My Data',
    gdprCompliance: 'GDPR Compliance',
    personalInfo: 'Personal Information',
    username: 'Username',
    registrationDate: 'Registration Date',
    lastLogin: 'Last Login',
    activity: 'Activity',
    spotsCreatedLabel: 'Spots Created',
    reviewsGivenLabel: 'Reviews Given',
    friendsCount: 'Friends',
    savedTrips: 'Saved Trips',
    badgesEarned: 'Badges Earned',
    rewardsLabel: 'Rewards',
    progression: 'Progression',
    totalPoints: 'Total Points',
    currentLevel: 'Current Level',
    seasonPoints: 'Season Points',
    currentStreak: 'Current Streak',
    skillPoints: 'Skill Points',
    unlockedSkills: 'Unlocked Skills',
    locationData: 'Location Data',
    lastKnownPosition: 'Last Known Position',
    gpsEnabled: 'GPS Enabled',
    locationHistory: 'Location History',
    consents: 'Consents',
    cookies: 'Cookies',
    geolocation: 'Geolocation',
    notifications: 'Notifications',
    manageConsents: 'Manage My Consents',
    actions: 'Actions',
    downloadMyData: 'Download My Data',
    deleteAccount: 'Delete My Account',
    irreversibleAction: 'Irreversible action',
    gdprFooter: 'In accordance with GDPR, you have the right to access, rectify, and delete your personal data.',
    viewPrivacyPolicy: 'View our Privacy Policy',
    accepted: 'Accepted',
    refused: 'Refused',
    notDefined: 'Not defined',
    notAvailable: 'Not available',
    notAuthorized: 'Not authorized',
    entries: 'entries',
    days: 'days',
    yes: 'Yes',
    no: 'No',

    // Age Verification (GDPR - Minimum age 16)
    ageVerificationTitle: 'Verify your age',
    ageVerificationDesc: 'To comply with the law, we need to confirm you\'re at least 16 years old. Don\'t worry, this info won\'t be stored!',
    ageVerificationNote: 'Age verification is mandatory in Europe for online services (GDPR).',
    birthDate: 'Date of birth',
    ageRequiredMessage: 'Enter your date of birth to continue',
    ageInvalidFormat: 'Invalid date format',
    ageFutureDate: 'You can\'t be born in the future!',
    ageUnreasonable: 'The date of birth seems incorrect',
    ageTooYoung: 'You must be at least 16 years old to register',
    ageVerify: 'Verify my age',
    ageVerifying: 'Verifying...',
    yourAge: 'Your age',
    ageVerificationSuccess: 'Age verified! Welcome!',
    ageVerificationError: 'Error during verification. Please try again later.',
    ageTooYoungTitle: 'You\'re too young for now',
    ageTooYoungMessage: 'We understand your enthusiasm to join SpotHitch! Come back when you\'re 16. Adventure awaits!',
    ageGDPRNote: 'In accordance with GDPR, this information is not retained after verification.',
  },

  es: {
    appName: 'SpotHitch',
    tagline: 'La comunidad de autoestopistas',
    loading: 'Cargando...',
    home: 'Inicio',
    spots: 'Spots',
    map: 'Mapa',
    planner: 'Viaje',
    chat: 'Chat',
    profile: 'Perfil',
    welcome: '¡Bienvenido!',
    welcomeDesc: 'Unete a la comunidad de autoestopistas',
    yourUsername: 'Tu nombre',
    chooseAvatar: 'Elige avatar',
    letsGo: '¡Vamos!',
    searchSpot: 'Buscar spot...',
    addSpot: 'Anadir spot',
    from: 'Origen',
    to: 'Destino',
    description: 'Descripcion',
    takePhoto: 'Tomar foto',
    photoRequired: 'Foto requerida',
    create: 'Compartir',
    reviews: 'opiniones',
    verified: 'Verificado',
    login: 'Iniciar sesion',
    register: 'Registrarse',
    logout: 'Cerrar sesion',
    chooseLanguage: 'Elige tu idioma',
    continueWithoutAccount: 'Continuar sin cuenta',
    settings: 'Ajustes',
    theme: 'Tema',
    darkMode: 'Modo oscuro',
    lightMode: 'Modo claro',
    language: 'Idioma',
    level: 'Nivel',
    points: 'puntos',
    email: 'Correo electronico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar',
    forgotPassword: '¿Olvidaste tu contraseña?',
    noAccount: '¿Sin cuenta?',
    alreadyAccount: '¿Ya tienes cuenta?',
    createAccount: 'Crear cuenta',
    continueWithGoogle: 'Continuar con Google',

    // Email Verification
    emailVerificationTitle: 'Verificacion de correo',
    emailVerificationMessage: 'Se ha enviado un correo de verificacion a',
    emailVerificationSubtitle: 'Haz clic en el enlace en tu correo para confirmar tu direccion',
    resendEmail: 'Reenviar correo',
    verifyEmail: 'Lo he verificado',
    emailVerified: '¡Correo verificado!',
    emailVerificationPending: 'Verificacion pendiente...',
    resendCountdown: 'Reenviar en {seconds}s',
    emailNotVerified: 'Correo no verificado',
    verificationCheckingEmail: 'Verificando correo...',
    verificationEmailSent: '¡Correo de verificacion enviado!',
    verificationEmailNotSent: 'No se pudo reenviar el correo',
    emailAlreadyVerified: 'Este correo ya esta verificado',
    emailVerificationError: 'Error al verificar el correo',

    // Cookie Banner (RGPD)
    cookieTitle: 'Respeto a tu privacidad',
    cookieDescription: 'Usamos cookies para mejorar tu experiencia, analizar el trafico y personalizar el contenido. Las cookies necesarias siempre estan activas.',
    cookieAccept: 'Aceptar',
    cookieRefuse: 'Rechazar',
    cookieCustomize: 'Personalizar',
    cookiePreferences: 'Preferencias de cookies',
    cookieNecessary: 'Cookies necesarias',
    cookieNecessaryDesc: 'Esenciales para el funcionamiento del sitio (autenticacion, seguridad).',
    cookieAnalytics: 'Cookies analiticas',
    cookieAnalyticsDesc: 'Nos ayudan a entender como usas el sitio para mejorarlo.',
    cookieMarketing: 'Cookies de marketing',
    cookieMarketingDesc: 'Permiten mostrar contenido personalizado.',
    cookiePersonalization: 'Cookies de personalizacion',
    cookiePersonalizationDesc: 'Recuerdan tus preferencias (idioma, tema).',
    savePreferences: 'Guardar mis preferencias',
    acceptAll: 'Aceptar todo',
    required: 'Obligatorio',
    cookieLegalText: 'Al continuar, aceptas nuestra',
    privacyPolicy: 'Politica de privacidad',
    termsOfService: 'Terminos de servicio',
    and: 'y',
    close: 'Cerrar',
  },

  de: {
    // App
    appName: 'SpotHitch',
    tagline: 'Die Tramper-Community',
    loading: 'Laden...',

    // Navigation
    home: 'Start',
    spots: 'Spots',
    map: 'Karte',
    planner: 'Reisen',
    chat: 'Chat',
    profile: 'Profil',

    // Welcome
    welcome: 'Willkommen!',
    welcomeDesc: 'Tritt der Tramper-Community bei',
    yourUsername: 'Dein Benutzername',
    chooseAvatar: 'Avatar wahlen',
    letsGo: 'Los gehts!',
    chooseLanguage: 'Wahle deine Sprache',
    continueWithoutAccount: 'Ohne Konto fortfahren',

    // Spots
    searchSpot: 'Spot suchen...',
    addSpot: 'Spot hinzufugen',
    from: 'Von',
    to: 'Nach',
    description: 'Beschreibung',
    takePhoto: 'Foto aufnehmen',
    photoRequired: 'Foto erforderlich',
    create: 'Teilen',
    reviews: 'Bewertungen',
    verified: 'Verifiziert',
    topSpot: 'Top',
    goodSpot: 'Gut',
    newSpot: 'Neu',
    oldSpot: 'Alt',
    estimatedWait: 'Wartezeit',
    lastUsed: 'Zuletzt benutzt',
    checkin: 'Check-in',
    checkinSuccess: 'Check-in gespeichert!',

    // Ratings
    rate: 'Bewerten',
    rateSpot: 'Diesen Spot bewerten',
    waitTime: 'Wartezeit',
    accessibility: 'Erreichbarkeit',
    safetyRating: 'Sicherheit',
    visibility: 'Sichtbarkeit',
    traffic: 'Verkehr',
    comment: 'Kommentar',
    submit: 'Absenden',

    // Trip Planner
    planTrip: 'Reise planen',
    addStep: 'Stopp hinzufugen',
    startCity: 'Startstadt',
    endCity: 'Zielort',
    bestSpots: 'Top 3 Spots',
    saveTrip: 'Speichern',
    myTrips: 'Meine Reisen',
    noTrips: 'Keine Reisen',

    // Profile
    level: 'Level',
    points: 'Punkte',
    spotsShared: 'Spots',
    checkinsCount: 'Check-ins',
    reviewsGiven: 'Bewertungen',
    streak: 'Serie',
    settings: 'Einstellungen',
    theme: 'Thema',
    darkMode: 'Dunkelmodus',
    lightMode: 'Hellmodus',
    language: 'Sprache',
    logout: 'Abmelden',

    // Filters
    filterAll: 'Alle',
    filterTop: 'Top',
    filterRecent: 'Neueste',
    filterNearby: 'In der Nahe',
    filters: 'Filter',
    minRating: 'Mindestbewertung',
    maxWait: 'Max. Wartezeit',
    applyFilters: 'Anwenden',
    resetFilters: 'Zurucksetzen',

    // SOS
    sosTitle: 'Notfallmodus',
    sosDesc: 'Teile deinen Standort mit Kontakten',
    shareLocation: 'Standort teilen',
    emergencyContacts: 'Notfallkontakte',
    addContact: 'Hinzufugen',
    iAmSafe: 'Ich bin sicher',

    // Tutorial
    tutoSkip: 'Uberspringen',
    tutoNext: 'Weiter',
    tutoPrev: 'Zuruck',
    tutoFinish: 'Fertig',

    // Auth
    login: 'Anmelden',
    register: 'Registrieren',
    email: 'E-Mail',
    password: 'Passwort',
    confirmPassword: 'Bestatigen',
    forgotPassword: 'Passwort vergessen?',
    noAccount: 'Kein Konto?',
    alreadyAccount: 'Bereits ein Konto?',
    createAccount: 'Konto erstellen',
    continueWithGoogle: 'Mit Google fortfahren',

    // Email Verification
    emailVerificationTitle: 'E-Mail-Verifizierung',
    emailVerificationMessage: 'Eine Bestätigungsmail wurde gesendet an',
    emailVerificationSubtitle: 'Klicken Sie auf den Link in Ihrer E-Mail um Ihre Adresse zu bestätigen',
    resendEmail: 'E-Mail erneut senden',
    verifyEmail: 'Ich habe verifiziert',
    emailVerified: 'E-Mail bestätigt!',
    emailVerificationPending: 'Verifizierung läuft...',
    resendCountdown: 'Erneut senden in {seconds}s',
    emailNotVerified: 'E-Mail nicht bestätigt',
    verificationCheckingEmail: 'E-Mail wird überprüft...',
    verificationEmailSent: 'Bestätigungsmail gesendet!',
    verificationEmailNotSent: 'E-Mail konnte nicht gesendet werden',
    emailAlreadyVerified: 'Diese E-Mail ist bereits bestätigt',
    emailVerificationError: 'Fehler bei der E-Mail-Verifizierung',

    // Errors
    networkError: 'Verbindungsfehler',
    authError: 'Authentifizierungsfehler',
    saveSuccess: 'Gespeichert!',
    saveFailed: 'Speichern fehlgeschlagen',

    // Empty states
    noSpots: 'Keine Spots gefunden',
    noResults: 'Keine Ergebnisse',
    beFirst: 'Sei der Erste!',

    // Chat
    general: 'Allgemein',
    help: 'Hilfe',
    typeMessage: 'Nachricht eingeben...',
    send: 'Senden',

    // Cookie Banner (DSGVO)
    cookieTitle: 'Datenschutz',
    cookieDescription: 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern, den Datenverkehr zu analysieren und Inhalte zu personalisieren. Notwendige Cookies sind immer aktiv.',
    cookieAccept: 'Akzeptieren',
    cookieRefuse: 'Ablehnen',
    cookieCustomize: 'Anpassen',
    cookiePreferences: 'Cookie-Einstellungen',
    cookieNecessary: 'Notwendige Cookies',
    cookieNecessaryDesc: 'Diese Cookies sind fur die Funktion der Website unerlasslich (Authentifizierung, Sicherheit).',
    cookieAnalytics: 'Analyse-Cookies',
    cookieAnalyticsDesc: 'Helfen uns zu verstehen, wie Sie die Website nutzen, um sie zu verbessern.',
    cookieMarketing: 'Marketing-Cookies',
    cookieMarketingDesc: 'Ermoglichen personalisierte Inhalte.',
    cookiePersonalization: 'Personalisierungs-Cookies',
    cookiePersonalizationDesc: 'Speichern Ihre Einstellungen (Sprache, Design).',
    savePreferences: 'Auswahl speichern',
    acceptAll: 'Alle akzeptieren',
    required: 'Erforderlich',
    cookieLegalText: 'Mit der Nutzung akzeptieren Sie unsere',
    privacyPolicy: 'Datenschutzerklarung',
    termsOfService: 'Nutzungsbedingungen',
    and: 'und',
    close: 'Schliessen',

    // Age Verification (DSGVO - Minimum age 16)
    ageVerificationTitle: 'Bestatige dein Alter',
    ageVerificationDesc: 'Um das Gesetz einzuhalten, mussen wir bestatigen, dass du mindestens 16 Jahre alt bist. Keine Sorge, diese Information wird nicht gespeichert!',
    ageVerificationNote: 'Altersverifizierung ist in Europa fur Online-Dienste vorgeschrieben (DSGVO).',
    birthDate: 'Geburtsdatum',
    ageRequiredMessage: 'Geben Sie Ihr Geburtsdatum ein, um fortzufahren',
    ageInvalidFormat: 'Ungultiges Datumsformat',
    ageFutureDate: 'Du kannst nicht in der Zukunft geboren sein!',
    ageUnreasonable: 'Das Geburtsdatum scheint falsch zu sein',
    ageTooYoung: 'Du musst mindestens 16 Jahre alt sein, um dich zu registrieren',
    ageVerify: 'Mein Alter prufen',
    ageVerifying: 'Wird uberpruft...',
    yourAge: 'Dein Alter',
    ageVerificationSuccess: 'Alter bestatigt! Willkommen!',
    ageVerificationError: 'Fehler bei der Verifizierung. Bitte versuchen Sie es spater erneut.',
    ageTooYoungTitle: 'Du bist vorerst zu jung',
    ageTooYoungMessage: 'Wir verstehen deine Begeisterung, SpotHitch beizutreten! Komm zuruck, wenn du 16 bist. Das Abenteuer wartet!',
    ageGDPRNote: 'Gema DSGVO werden diese Informationen nach der Verifizierung nicht gespeichert.',
  },
};

/**
 * Detect browser/device language automatically
 * Returns the detected language code if supported, otherwise defaults to 'en'
 */
export function detectLanguage() {
  // Try navigator.language first (most reliable)
  const browserLang = navigator.language?.substring(0, 2).toLowerCase();
  const supported = Object.keys(languageConfig);

  if (supported.includes(browserLang)) {
    return browserLang;
  }

  // Try navigator.languages array for additional preferences
  if (navigator.languages && navigator.languages.length > 0) {
    for (const lang of navigator.languages) {
      const langCode = lang.substring(0, 2).toLowerCase();
      if (supported.includes(langCode)) {
        return langCode;
      }
    }
  }

  // Default to English (most universal)
  return 'en';
}

/**
 * Check if this is the first app launch (no language preference saved)
 */
export function isFirstLaunch() {
  return !localStorage.getItem('spothitch_language_selected');
}

/**
 * Mark language as selected (first launch completed)
 */
export function markLanguageSelected() {
  localStorage.setItem('spothitch_language_selected', 'true');
}

/**
 * Get translation by key
 * @param {string} key - Translation key
 * @param {Object} params - Optional parameters for interpolation
 */
export function t(key, params = {}) {
  const { lang } = getState();
  const langTranslations = translations[lang] || translations.fr;
  let text = langTranslations[key] || translations.fr[key] || key;

  // Simple interpolation
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });

  return text;
}

/**
 * Set language
 */
export function setLanguage(lang) {
  if (translations[lang]) {
    setState({ lang });
    document.documentElement.lang = lang;
    return true;
  }
  return false;
}

/**
 * Get available languages with flags
 */
export function getAvailableLanguages() {
  return Object.values(languageConfig);
}

/**
 * Get language info by code
 */
export function getLanguageInfo(code) {
  return languageConfig[code] || languageConfig.en;
}

/**
 * Load external translations (for future expansion)
 */
export async function loadTranslations(lang) {
  try {
    const response = await fetch(`/Spothitch/i18n/${lang}.json`);
    if (response.ok) {
      const data = await response.json();
      translations[lang] = { ...translations[lang], ...data };
      return true;
    }
  } catch (error) {
    console.warn(`Failed to load external translations for ${lang}`);
  }
  return false;
}

export { translations, pluralForms, pluralRules };
export default {
  t,
  setLanguage,
  detectLanguage,
  getAvailableLanguages,
  getLanguageInfo,
  isFirstLaunch,
  markLanguageSelected,
  languageConfig,
  pluralize,
  formatCount,
  getPluralWord,
};
