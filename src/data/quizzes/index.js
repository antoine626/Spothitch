/**
 * Country Quizzes Index
 * Central export for all country-specific quiz data
 */

import { franceQuiz } from './france.js'
import { germanyQuiz } from './germany.js'
import { spainQuiz } from './spain.js'
import { ukQuiz } from './uk.js'
import { netherlandsQuiz } from './netherlands.js'

/**
 * All available country quizzes indexed by country code
 */
const countryQuizzes = {
  FR: franceQuiz,
  DE: germanyQuiz,
  ES: spainQuiz,
  GB: ukQuiz,
  NL: netherlandsQuiz,
}

/**
 * Get list of available country codes that have quizzes
 */
export function getAvailableQuizCountries() {
  return Object.keys(countryQuizzes)
}

/**
 * Get quiz data for a specific country code
 * @param {string} countryCode - ISO 2-letter country code (e.g. 'FR', 'DE')
 * @returns {object|null} Quiz data or null if not found
 */
export function getCountryQuizData(countryCode) {
  return countryQuizzes[countryCode?.toUpperCase()] || null
}

/**
 * Country flags lookup
 */
export const countryFlags = {
  FR: '\uD83C\uDDEB\uD83C\uDDF7',
  DE: '\uD83C\uDDE9\uD83C\uDDEA',
  ES: '\uD83C\uDDEA\uD83C\uDDF8',
  GB: '\uD83C\uDDEC\uD83C\uDDE7',
  NL: '\uD83C\uDDF3\uD83C\uDDF1',
}

/**
 * Country names in all 4 languages
 */
export const countryNames = {
  FR: { fr: 'France', en: 'France', es: 'Francia', de: 'Frankreich' },
  DE: { fr: 'Allemagne', en: 'Germany', es: 'Alemania', de: 'Deutschland' },
  ES: { fr: 'Espagne', en: 'Spain', es: 'Espana', de: 'Spanien' },
  GB: { fr: 'Royaume-Uni', en: 'United Kingdom', es: 'Reino Unido', de: 'Vereinigtes Koenigreich' },
  NL: { fr: 'Pays-Bas', en: 'Netherlands', es: 'Paises Bajos', de: 'Niederlande' },
}
