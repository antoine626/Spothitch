/**
 * Country Guides
 * Hitchhiking guides by country
 */

export const countryGuides = [
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    legality: 'legal',
    legalityText: 'Légal partout sauf autoroutes (péages OK)',
    legalityTextEn: 'Legal everywhere except highways (toll areas OK)',
    difficulty: 2,
    difficultyText: 'Facile',
    difficultyTextEn: 'Easy',
    avgWaitTime: 25,
    bestMonths: [5, 6, 7, 8, 9],
    tips: [
      'Les aires de repos sont excellentes',
      'Les stations-service aux péages fonctionnent bien',
      'Parlez français, même quelques mots aident',
      'Évitez le sud en août (vacanciers pressés)',
    ],
    tipsEn: [
      'Rest areas are excellent',
      'Gas stations at toll areas work well',
      'Speak French, even a few words help',
      'Avoid the south in August (rushed vacationers)',
    ],
    emergencyNumbers: {
      police: '17',
      ambulance: '15',
      fire: '18',
      european: '112',
    },
    bestSpots: ['Paris Porte de la Chapelle', 'Lyon Confluences', 'Péage La Gravelle'],
  },
  {
    code: 'DE',
    name: 'Allemagne',
    nameEn: 'Germany',
    flag: '🇩🇪',
    legality: 'legal',
    legalityText: 'Légal sauf sur les Autobahns',
    legalityTextEn: 'Legal except on Autobahns',
    difficulty: 2,
    difficultyText: 'Facile',
    difficultyTextEn: 'Easy',
    avgWaitTime: 20,
    bestMonths: [4, 5, 6, 7, 8, 9, 10],
    tips: [
      'Les Rasthöfe (aires) sont parfaites',
      'Les Allemands sont ponctuels et fiables',
      'Pancarte avec destination recommandée',
      'L\'anglais est bien parlé',
    ],
    tipsEn: [
      'Rasthöfe (rest areas) are perfect',
      'Germans are punctual and reliable',
      'Sign with destination recommended',
      'English is widely spoken',
    ],
    emergencyNumbers: {
      police: '110',
      ambulance: '112',
      fire: '112',
      european: '112',
    },
    bestSpots: ['Berlin Tankstelle Sud', 'Munich Rasthof Ost'],
  },
  {
    code: 'ES',
    name: 'Espagne',
    nameEn: 'Spain',
    flag: '🇪🇸',
    legality: 'legal',
    legalityText: 'Légal, pas sur autoroutes',
    legalityTextEn: 'Legal, not on highways',
    difficulty: 3,
    difficultyText: 'Moyen',
    difficultyTextEn: 'Medium',
    avgWaitTime: 40,
    bestMonths: [3, 4, 5, 6, 9, 10, 11],
    tips: [
      'Évitez les heures chaudes (14h-17h)',
      'Les stations Repsol et Cepsa sont bonnes',
      'Quelques mots d\'espagnol aident beaucoup',
      'Les routiers sont très sympas',
    ],
    tipsEn: [
      'Avoid hot hours (2pm-5pm)',
      'Repsol and Cepsa stations are good',
      'A few Spanish words help a lot',
      'Truck drivers are very nice',
    ],
    emergencyNumbers: {
      police: '091',
      ambulance: '061',
      fire: '080',
      european: '112',
    },
    bestSpots: ['Barcelona AP-7 Sud'],
  },
  {
    code: 'IT',
    name: 'Italie',
    nameEn: 'Italy',
    flag: '🇮🇹',
    legality: 'legal',
    legalityText: 'Légal, Autostrade interdites',
    legalityTextEn: 'Legal, Autostrade prohibited',
    difficulty: 3,
    difficultyText: 'Moyen',
    difficultyTextEn: 'Medium',
    avgWaitTime: 35,
    bestMonths: [4, 5, 6, 9, 10],
    tips: [
      'Les Autogrill sont excellents',
      'Les Italiens sont chaleureux',
      'Attention au soleil en été',
      'Nord plus facile que le sud',
    ],
    tipsEn: [
      'Autogrill stations are excellent',
      'Italians are warm people',
      'Watch out for summer sun',
      'North easier than south',
    ],
    emergencyNumbers: {
      police: '113',
      ambulance: '118',
      fire: '115',
      european: '112',
    },
    bestSpots: ['Milan Autogrill Sud'],
  },
  {
    code: 'NL',
    name: 'Pays-Bas',
    nameEn: 'Netherlands',
    flag: '🇳🇱',
    legality: 'legal',
    legalityText: 'Très facile et légal partout',
    legalityTextEn: 'Very easy and legal everywhere',
    difficulty: 1,
    difficultyText: 'Très facile',
    difficultyTextEn: 'Very Easy',
    avgWaitTime: 15,
    bestMonths: [4, 5, 6, 7, 8, 9],
    tips: [
      'Un des meilleurs pays pour le stop',
      'Tout le monde parle anglais',
      'Les distances sont courtes',
      'Très sûr',
    ],
    tipsEn: [
      'One of the best countries for hitching',
      'Everyone speaks English',
      'Distances are short',
      'Very safe',
    ],
    emergencyNumbers: {
      police: '112',
      ambulance: '112',
      fire: '112',
      european: '112',
    },
    bestSpots: ['Amsterdam A2 Utrecht'],
  },
  {
    code: 'BE',
    name: 'Belgique',
    nameEn: 'Belgium',
    flag: '🇧🇪',
    legality: 'legal',
    legalityText: 'Légal, stations-service recommandées',
    legalityTextEn: 'Legal, gas stations recommended',
    difficulty: 2,
    difficultyText: 'Facile',
    difficultyTextEn: 'Easy',
    avgWaitTime: 20,
    bestMonths: [4, 5, 6, 7, 8, 9],
    tips: [
      'Bon trafic international',
      'Parlez français ou néerlandais selon la région',
      'Stations Q8 et Total très fréquentées',
      'Petit pays, trajets rapides',
    ],
    tipsEn: [
      'Good international traffic',
      'Speak French or Dutch depending on region',
      'Q8 and Total stations busy',
      'Small country, quick journeys',
    ],
    emergencyNumbers: {
      police: '101',
      ambulance: '112',
      fire: '112',
      european: '112',
    },
    bestSpots: ['Brussels E19 Nord'],
  },
  {
    code: 'PL',
    name: 'Pologne',
    nameEn: 'Poland',
    flag: '🇵🇱',
    legality: 'legal',
    legalityText: 'Légal et tradition populaire',
    legalityTextEn: 'Legal and popular tradition',
    difficulty: 2,
    difficultyText: 'Facile',
    difficultyTextEn: 'Easy',
    avgWaitTime: 25,
    bestMonths: [5, 6, 7, 8, 9],
    tips: [
      'Culture de l\'autostop très présente',
      'Stations Orlen excellentes',
      'Les routiers sont généreux',
      'Quelques mots de polonais appréciés',
    ],
    tipsEn: [
      'Strong hitchhiking culture',
      'Orlen stations excellent',
      'Truck drivers are generous',
      'A few Polish words appreciated',
    ],
    emergencyNumbers: {
      police: '997',
      ambulance: '999',
      fire: '998',
      european: '112',
    },
    bestSpots: ['Warsaw Orlen Sud'],
  },
  {
    code: 'CZ',
    name: 'République Tchèque',
    nameEn: 'Czech Republic',
    flag: '🇨🇿',
    legality: 'legal',
    legalityText: 'Légal, très pratiqué',
    legalityTextEn: 'Legal, very common',
    difficulty: 2,
    difficultyText: 'Facile',
    difficultyTextEn: 'Easy',
    avgWaitTime: 22,
    bestMonths: [4, 5, 6, 7, 8, 9, 10],
    tips: [
      'Bonne tradition de l\'autostop',
      'Prague difficile, sortir de la ville',
      'Stations modernes sur autoroutes',
      'Anglais courant chez les jeunes',
    ],
    tipsEn: [
      'Good hitchhiking tradition',
      'Prague difficult, get out of city',
      'Modern stations on highways',
      'English common among youth',
    ],
    emergencyNumbers: {
      police: '158',
      ambulance: '155',
      fire: '150',
      european: '112',
    },
    bestSpots: ['Prague D8 Nord'],
  },
  {
    code: 'AT',
    name: 'Autriche',
    nameEn: 'Austria',
    flag: '🇦🇹',
    legality: 'legal',
    legalityText: 'Légal, sauf autoroutes',
    legalityTextEn: 'Legal, except highways',
    difficulty: 2,
    difficultyText: 'Facile',
    difficultyTextEn: 'Easy',
    avgWaitTime: 20,
    bestMonths: [5, 6, 7, 8, 9],
    tips: [
      'Raststation modernes et propres',
      'Beaucoup de trafic international',
      'Les Autrichiens sont polis',
      'Allemand préféré, anglais OK',
    ],
    tipsEn: [
      'Modern and clean Raststations',
      'Lots of international traffic',
      'Austrians are polite',
      'German preferred, English OK',
    ],
    emergencyNumbers: {
      police: '133',
      ambulance: '144',
      fire: '122',
      european: '112',
    },
    bestSpots: ['Vienna A1 Ouest'],
  },
  {
    code: 'CH',
    name: 'Suisse',
    nameEn: 'Switzerland',
    flag: '🇨🇭',
    legality: 'legal',
    legalityText: 'Légal mais peu pratiqué',
    legalityTextEn: 'Legal but not common',
    difficulty: 3,
    difficultyText: 'Moyen',
    difficultyTextEn: 'Medium',
    avgWaitTime: 30,
    bestMonths: [5, 6, 7, 8, 9],
    tips: [
      'Moins de culture autostop',
      'Trajets courts',
      'Très sûr mais coûteux',
      'Parlez la langue locale',
    ],
    tipsEn: [
      'Less hitchhiking culture',
      'Short journeys',
      'Very safe but expensive',
      'Speak the local language',
    ],
    emergencyNumbers: {
      police: '117',
      ambulance: '144',
      fire: '118',
      european: '112',
    },
    bestSpots: ['Geneva A1 Lausanne'],
  },
  {
    code: 'PT',
    name: 'Portugal',
    nameEn: 'Portugal',
    flag: '🇵🇹',
    legality: 'legal',
    legalityText: 'Légal, stations-service OK',
    legalityTextEn: 'Legal, gas stations OK',
    difficulty: 2,
    difficultyText: 'Facile',
    difficultyTextEn: 'Easy',
    avgWaitTime: 25,
    bestMonths: [3, 4, 5, 6, 9, 10, 11],
    tips: [
      'Portugais très accueillants',
      'Stations Galp recommandées',
      'Évitez le sud en été (touristes)',
      'Quelques mots de portugais aident',
    ],
    tipsEn: [
      'Portuguese very welcoming',
      'Galp stations recommended',
      'Avoid south in summer (tourists)',
      'A few Portuguese words help',
    ],
    emergencyNumbers: {
      police: '112',
      ambulance: '112',
      fire: '112',
      european: '112',
    },
    bestSpots: ['Lisbon A1 Nord'],
  },
  {
    code: 'IE',
    name: 'Irlande',
    nameEn: 'Ireland',
    flag: '🇮🇪',
    legality: 'legal',
    legalityText: 'Excellent pays pour le stop',
    legalityTextEn: 'Excellent country for hitching',
    difficulty: 1,
    difficultyText: 'Très facile',
    difficultyTextEn: 'Very Easy',
    avgWaitTime: 15,
    bestMonths: [5, 6, 7, 8, 9],
    tips: [
      'Irlandais très sympas',
      'Culture forte de l\'autostop',
      'Routes de campagne excellentes',
      'Attendez-vous à des conversations !',
    ],
    tipsEn: [
      'Irish very friendly',
      'Strong hitchhiking culture',
      'Country roads excellent',
      'Expect conversations!',
    ],
    emergencyNumbers: {
      police: '999',
      ambulance: '999',
      fire: '999',
      european: '112',
    },
    bestSpots: ['Dublin M7 Sud'],
  },
]

/**
 * Get guide by country code
 */
export function getGuideByCode(code) {
  return countryGuides.find(g => g.code === code)
}

/**
 * Get all guides sorted by difficulty
 */
export function getGuidesByDifficulty() {
  return [...countryGuides].sort((a, b) => a.difficulty - b.difficulty)
}

/**
 * Get easiest countries
 */
export function getEasiestCountries(limit = 5) {
  return getGuidesByDifficulty().slice(0, limit)
}

/**
 * Get guides by legality
 */
export function getGuidesByLegality(legality) {
  return countryGuides.filter(g => g.legality === legality)
}

/**
 * Search guides
 */
export function searchGuides(query) {
  const lowerQuery = query.toLowerCase()
  return countryGuides.filter(
    g =>
      g.name.toLowerCase().includes(lowerQuery) ||
      (g.nameEn && g.nameEn.toLowerCase().includes(lowerQuery)) ||
      g.code.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get all countries as a simple list
 */
export function getCountryList() {
  return countryGuides.map(g => ({
    code: g.code,
    name: g.name,
    nameEn: g.nameEn || g.name,
    flag: g.flag,
  }))
}

/**
 * Get emergency numbers for a country
 */
export function getEmergencyNumbers(countryCode) {
  const guide = getGuideByCode(countryCode)
  return guide?.emergencyNumbers || { european: '112' }
}

export default {
  countryGuides,
  getGuideByCode,
  getGuidesByDifficulty,
  getEasiestCountries,
  getGuidesByLegality,
  searchGuides,
  getCountryList,
  getEmergencyNumbers,
}
