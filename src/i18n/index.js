/**
 * Internationalization (i18n) Module
 * Handles translations and language detection
 */

import { getState, setState } from '../stores/state.js';

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
    welcomeDesc: 'Rejoins la communauté des autostoppeurs',
    yourUsername: 'Ton pseudo',
    chooseAvatar: 'Choisis ton avatar',
    letsGo: "C'est parti !",
    
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
    welcomeDesc: 'Únete a la comunidad de autoestopistas',
    yourUsername: 'Tu nombre',
    chooseAvatar: 'Elige avatar',
    letsGo: '¡Vamos!',
    searchSpot: 'Buscar spot...',
    addSpot: 'Añadir spot',
    from: 'Origen',
    to: 'Destino',
    description: 'Descripción',
    takePhoto: 'Tomar foto',
    photoRequired: '📸 Foto requerida',
    create: 'Compartir',
    reviews: 'opiniones',
    verified: 'Verificado',
    login: 'Iniciar sesión',
    register: 'Registrarse',
    logout: 'Cerrar sesión',
  },
};

/**
 * Detect browser language
 */
export function detectLanguage() {
  const browserLang = navigator.language?.substring(0, 2);
  const supported = ['fr', 'en', 'es'];
  return supported.includes(browserLang) ? browserLang : 'fr';
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
 * Get available languages
 */
export function getAvailableLanguages() {
  return [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];
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

export { translations };
export default { t, setLanguage, detectLanguage, getAvailableLanguages };
