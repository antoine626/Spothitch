/**
 * Partner Rewards - Discounts with travel partners
 * Currency: Pouces (Thumbs) 👍
 */

export const shopRewards = [
  // HÉBERGEMENT
  {
    id: 'hostelworld-10',
    name: '-10% Hostelworld',
    nameEn: '-10% Hostelworld',
    description: '10% de réduction sur ta prochaine réservation',
    descriptionEn: '10% off your next booking',
    partner: 'Hostelworld',
    partnerLogo: '🏨',
    category: 'hebergement',
    discount: '10%',
    cost: 500,
    code: 'SPOTHITCH10',
    url: 'https://www.hostelworld.com',
    conditions: 'Valable 30 jours, min. 2 nuits',
  },
  {
    id: 'hostelworld-20',
    name: '-20% Hostelworld',
    nameEn: '-20% Hostelworld',
    description: '20% de réduction sur ta prochaine réservation',
    descriptionEn: '20% off your next booking',
    partner: 'Hostelworld',
    partnerLogo: '🏨',
    category: 'hebergement',
    discount: '20%',
    cost: 1000,
    code: 'SPOTHITCH20',
    url: 'https://www.hostelworld.com',
    conditions: 'Valable 30 jours, min. 3 nuits',
  },
  {
    id: 'booking-10',
    name: '-10% Booking.com',
    nameEn: '-10% Booking.com',
    description: '10% sur les hébergements Genius',
    descriptionEn: '10% on Genius accommodations',
    partner: 'Booking.com',
    partnerLogo: '🛏️',
    category: 'hebergement',
    discount: '10%',
    cost: 600,
    code: 'HITCHBOOK10',
    url: 'https://www.booking.com',
    conditions: 'Établissements participants uniquement',
  },
  {
    id: 'airbnb-15',
    name: '-15€ Airbnb',
    nameEn: '-15€ Airbnb',
    description: '15€ de crédit sur ta première réservation',
    descriptionEn: '15€ credit on your first booking',
    partner: 'Airbnb',
    partnerLogo: '🏠',
    category: 'hebergement',
    discount: '15€',
    cost: 750,
    code: 'SPOTHITCH15',
    url: 'https://www.airbnb.com',
    conditions: 'Nouveaux utilisateurs, min. 75€',
  },

  // ÉQUIPEMENT
  {
    id: 'decathlon-10',
    name: '-10% Decathlon',
    nameEn: '-10% Decathlon',
    description: '10% sur le rayon randonnée & camping',
    descriptionEn: '10% on hiking & camping gear',
    partner: 'Decathlon',
    partnerLogo: '🎒',
    category: 'equipement',
    discount: '10%',
    cost: 400,
    code: 'HITCH10',
    url: 'https://www.decathlon.fr',
    conditions: 'Rayon randonnée/camping uniquement',
  },
  {
    id: 'decathlon-20',
    name: '-20% Decathlon',
    nameEn: '-20% Decathlon',
    description: '20% sur tout le magasin',
    descriptionEn: '20% storewide',
    partner: 'Decathlon',
    partnerLogo: '🎒',
    category: 'equipement',
    discount: '20%',
    cost: 900,
    code: 'HITCH20PRO',
    url: 'https://www.decathlon.fr',
    conditions: 'Hors promotions en cours',
  },
  {
    id: 'asadventure-15',
    name: '-15% A.S.Adventure',
    nameEn: '-15% A.S.Adventure',
    description: '15% sur les sacs à dos et accessoires',
    descriptionEn: '15% on backpacks and accessories',
    partner: 'A.S.Adventure',
    partnerLogo: '🧗',
    category: 'equipement',
    discount: '15%',
    cost: 700,
    code: 'SPOTADV15',
    url: 'https://www.asadventure.com',
    conditions: 'Hors articles soldés',
  },
  {
    id: 'amazon-outdoor',
    name: '-10€ Amazon Outdoor',
    nameEn: '-10€ Amazon Outdoor',
    description: '10€ sur le rayon Sports & Outdoor',
    descriptionEn: '10€ on Sports & Outdoor',
    partner: 'Amazon',
    partnerLogo: '📦',
    category: 'equipement',
    discount: '10€',
    cost: 500,
    code: 'HITCHOUT10',
    url: 'https://www.amazon.fr',
    conditions: 'Min. 50€ d\'achat, rayon Outdoor',
  },

  // TRANSPORT
  {
    id: 'flixbus-20',
    name: '-20% FlixBus',
    nameEn: '-20% FlixBus',
    description: 'Pour quand le pouce ne marche pas 😅',
    descriptionEn: 'For when the thumb doesn\'t work 😅',
    partner: 'FlixBus',
    partnerLogo: '🚌',
    category: 'transport',
    discount: '20%',
    cost: 300,
    code: 'HITCHFLIX20',
    url: 'https://www.flixbus.fr',
    conditions: 'Trajets sélectionnés',
  },
  {
    id: 'blablacar-10',
    name: '-10% BlaBlaCar',
    nameEn: '-10% BlaBlaCar',
    description: 'Covoiturage pour les longs trajets',
    descriptionEn: 'Carpooling for long trips',
    partner: 'BlaBlaCar',
    partnerLogo: '🚗',
    category: 'transport',
    discount: '10%',
    cost: 250,
    code: 'HITCHBLA10',
    url: 'https://www.blablacar.fr',
    conditions: 'Trajets > 100km',
  },
  {
    id: 'trainline-15',
    name: '-15% Trainline',
    nameEn: '-15% Trainline',
    description: '15% sur ta prochaine réservation train',
    descriptionEn: '15% on your next train booking',
    partner: 'Trainline',
    partnerLogo: '🚂',
    category: 'transport',
    discount: '15%',
    cost: 600,
    code: 'HITCHTRAIN15',
    url: 'https://www.trainline.fr',
    conditions: 'Europe uniquement',
  },

  // EXPÉRIENCES
  {
    id: 'getyourguide-10',
    name: '-10% GetYourGuide',
    nameEn: '-10% GetYourGuide',
    description: 'Activités et visites guidées',
    descriptionEn: 'Activities and guided tours',
    partner: 'GetYourGuide',
    partnerLogo: '🎫',
    category: 'experiences',
    discount: '10%',
    cost: 400,
    code: 'HITCHGUIDE10',
    url: 'https://www.getyourguide.com',
    conditions: 'Première réservation',
  },
  {
    id: 'civitatis-15',
    name: '-15% Civitatis',
    nameEn: '-15% Civitatis',
    description: 'Tours gratuits et activités',
    descriptionEn: 'Free tours and activities',
    partner: 'Civitatis',
    partnerLogo: '🗺️',
    category: 'experiences',
    discount: '15%',
    cost: 500,
    code: 'HITCHCIV15',
    url: 'https://www.civitatis.com',
    conditions: 'Hors free tours',
  },

  // ASSURANCE
  {
    id: 'chapka-15',
    name: '-15% Chapka',
    nameEn: '-15% Chapka',
    description: 'Assurance voyage pour routards',
    descriptionEn: 'Travel insurance for backpackers',
    partner: 'Chapka Assurances',
    partnerLogo: '🛡️',
    category: 'assurance',
    discount: '15%',
    cost: 800,
    code: 'HITCHSAFE15',
    url: 'https://www.chapkadirect.fr',
    conditions: 'Formule Cap Aventure',
  },
  {
    id: 'worldnomads-10',
    name: '-10% World Nomads',
    nameEn: '-10% World Nomads',
    description: 'Assurance voyageurs aventuriers',
    descriptionEn: 'Adventure traveler insurance',
    partner: 'World Nomads',
    partnerLogo: '🌍',
    category: 'assurance',
    discount: '10%',
    cost: 600,
    code: 'HITCHNOMAD10',
    url: 'https://www.worldnomads.com',
    conditions: 'Nouveaux clients',
  },

  // NOURRITURE
  {
    id: 'toogoodtogo-free',
    name: 'Panier gratuit TooGoodToGo',
    nameEn: 'Free TooGoodToGo bag',
    description: 'Un panier anti-gaspi offert',
    descriptionEn: 'One free anti-waste bag',
    partner: 'Too Good To Go',
    partnerLogo: '🥗',
    category: 'food',
    discount: 'Gratuit',
    cost: 200,
    code: 'HITCHFOOD',
    url: 'https://www.toogoodtogo.com',
    conditions: 'Nouveau utilisateur',
  },
];

// Categories for filtering
export const rewardCategories = [
  { id: 'all', name: 'Tout', icon: '🎁' },
  { id: 'hebergement', name: 'Hébergement', icon: '🏨' },
  { id: 'equipement', name: 'Équipement', icon: '🎒' },
  { id: 'transport', name: 'Transport', icon: '🚌' },
  { id: 'experiences', name: 'Expériences', icon: '🎫' },
  { id: 'assurance', name: 'Assurance', icon: '🛡️' },
  { id: 'food', name: 'Nourriture', icon: '🥗' },
];

/**
 * Get reward by ID
 */
export function getRewardById(id) {
  return shopRewards.find(r => r.id === id);
}

/**
 * Check if user can afford reward
 */
export function canAfford(rewardId, userThumbs) {
  const reward = getRewardById(rewardId);
  return reward && userThumbs >= reward.cost;
}

/**
 * Get rewards by category
 */
export function getRewardsByCategory(category) {
  if (category === 'all') return shopRewards;
  return shopRewards.filter(r => r.category === category);
}

/**
 * Get featured rewards (cheapest in each category)
 */
export function getFeaturedRewards() {
  const categories = [...new Set(shopRewards.map(r => r.category))];
  return categories.map(cat => {
    const catRewards = shopRewards.filter(r => r.category === cat);
    return catRewards.sort((a, b) => a.cost - b.cost)[0];
  }).filter(Boolean);
}

/**
 * Get all categories
 */
export function getCategories() {
  return rewardCategories;
}

export default {
  shopRewards,
  rewardCategories,
  getRewardById,
  canAfford,
  getRewardsByCategory,
  getFeaturedRewards,
  getCategories,
};
