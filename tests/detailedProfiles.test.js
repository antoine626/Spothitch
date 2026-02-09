/**
 * Detailed Profiles Service Tests
 * Tests for comprehensive user profile management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  AVAILABLE_LANGUAGES,
  EUROPEAN_COUNTRIES,
  TRAVEL_STYLES,
  PREFERRED_VEHICLES,
  AVAILABILITY_OPTIONS,
  SOCIAL_LINK_TYPES,
  createDefaultProfile,
  getDetailedProfile,
  updateDetailedProfile,
  validateProfileData,
  getProfileCompleteness,
  addLanguage,
  removeLanguage,
  addCountryVisited,
  removeCountryVisited,
  updateBio,
  setTravelStyle,
  setPreferredVehicle,
  setAvailability,
  updateSocialLink,
  getSocialLinkUrl,
  renderDetailedProfile,
  renderProfileEditForm,
  deleteDetailedProfile,
  exportProfileData,
  searchProfiles,
} from '../src/services/detailedProfiles.js'

// Mock dependencies
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    user: { uid: 'test-user-123' },
    username: 'TestUser',
    avatar: '🤙',
    lang: 'fr',
  })),
  setState: vi.fn(),
}))

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}))

import { getState, setState } from '../src/stores/state.js'
import { showToast } from '../src/services/notifications.js'

describe('Detailed Profiles Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('AVAILABLE_LANGUAGES', () => {
    it('should have at least 15 languages', () => {
      expect(Object.keys(AVAILABLE_LANGUAGES).length).toBeGreaterThanOrEqual(15)
    })

    it('should have French, English, Spanish, German as main languages', () => {
      expect(AVAILABLE_LANGUAGES.fr).toBeDefined()
      expect(AVAILABLE_LANGUAGES.en).toBeDefined()
      expect(AVAILABLE_LANGUAGES.es).toBeDefined()
      expect(AVAILABLE_LANGUAGES.de).toBeDefined()
    })

    it('should have flag emoji for each language', () => {
      Object.values(AVAILABLE_LANGUAGES).forEach(lang => {
        expect(lang.flag).toBeDefined()
        expect(lang.flag.length).toBeGreaterThan(0)
      })
    })

    it('should have code, name, and nativeName for each language', () => {
      Object.values(AVAILABLE_LANGUAGES).forEach(lang => {
        expect(lang.code).toBeDefined()
        expect(lang.name).toBeDefined()
        expect(lang.nativeName).toBeDefined()
      })
    })
  })

  describe('EUROPEAN_COUNTRIES', () => {
    it('should have at least 30 countries', () => {
      expect(Object.keys(EUROPEAN_COUNTRIES).length).toBeGreaterThanOrEqual(30)
    })

    it('should have major European countries', () => {
      expect(EUROPEAN_COUNTRIES.FR).toBeDefined()
      expect(EUROPEAN_COUNTRIES.DE).toBeDefined()
      expect(EUROPEAN_COUNTRIES.ES).toBeDefined()
      expect(EUROPEAN_COUNTRIES.IT).toBeDefined()
      expect(EUROPEAN_COUNTRIES.GB).toBeDefined()
    })

    it('should have flag emoji for each country', () => {
      Object.values(EUROPEAN_COUNTRIES).forEach(country => {
        expect(country.flag).toBeDefined()
        expect(country.flag.length).toBeGreaterThan(0)
      })
    })

    it('should have code and name for each country', () => {
      Object.values(EUROPEAN_COUNTRIES).forEach(country => {
        expect(country.code).toBeDefined()
        expect(country.name).toBeDefined()
      })
    })
  })

  describe('TRAVEL_STYLES', () => {
    it('should have 4 travel styles', () => {
      expect(Object.keys(TRAVEL_STYLES).length).toBe(4)
    })

    it('should have solo, duo, group, and flexible styles', () => {
      expect(TRAVEL_STYLES.solo).toBeDefined()
      expect(TRAVEL_STYLES.duo).toBeDefined()
      expect(TRAVEL_STYLES.group).toBeDefined()
      expect(TRAVEL_STYLES.flexible).toBeDefined()
    })

    it('should have icon, name, and description for each style', () => {
      Object.values(TRAVEL_STYLES).forEach(style => {
        expect(style.id).toBeDefined()
        expect(style.name).toBeDefined()
        expect(style.nameEn).toBeDefined()
        expect(style.icon).toBeDefined()
        expect(style.description).toBeDefined()
      })
    })
  })

  describe('PREFERRED_VEHICLES', () => {
    it('should have 5 vehicle types', () => {
      expect(Object.keys(PREFERRED_VEHICLES).length).toBe(5)
    })

    it('should have car, truck, van, motorcycle, and any', () => {
      expect(PREFERRED_VEHICLES.car).toBeDefined()
      expect(PREFERRED_VEHICLES.truck).toBeDefined()
      expect(PREFERRED_VEHICLES.van).toBeDefined()
      expect(PREFERRED_VEHICLES.motorcycle).toBeDefined()
      expect(PREFERRED_VEHICLES.any).toBeDefined()
    })

    it('should have icon for each vehicle type', () => {
      Object.values(PREFERRED_VEHICLES).forEach(vehicle => {
        expect(vehicle.icon).toBeDefined()
      })
    })
  })

  describe('AVAILABILITY_OPTIONS', () => {
    it('should have 4 availability options', () => {
      expect(Object.keys(AVAILABILITY_OPTIONS).length).toBe(4)
    })

    it('should have available, planning, busy, and seasonal', () => {
      expect(AVAILABILITY_OPTIONS.available).toBeDefined()
      expect(AVAILABILITY_OPTIONS.planning).toBeDefined()
      expect(AVAILABILITY_OPTIONS.busy).toBeDefined()
      expect(AVAILABILITY_OPTIONS.seasonal).toBeDefined()
    })

    it('should have color for each option', () => {
      Object.values(AVAILABILITY_OPTIONS).forEach(option => {
        expect(option.color).toBeDefined()
        expect(option.color).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })
  })

  describe('SOCIAL_LINK_TYPES', () => {
    it('should have at least 7 social platforms', () => {
      expect(Object.keys(SOCIAL_LINK_TYPES).length).toBeGreaterThanOrEqual(7)
    })

    it('should have Instagram, Facebook, Couchsurfing', () => {
      expect(SOCIAL_LINK_TYPES.instagram).toBeDefined()
      expect(SOCIAL_LINK_TYPES.facebook).toBeDefined()
      expect(SOCIAL_LINK_TYPES.couchsurfing).toBeDefined()
    })

    it('should have baseUrl and icon for each platform', () => {
      Object.values(SOCIAL_LINK_TYPES).forEach(platform => {
        expect(platform.icon).toBeDefined()
        expect(platform.baseUrl).toBeDefined()
      })
    })
  })

  describe('createDefaultProfile', () => {
    it('should return a profile object with all required fields', () => {
      const profile = createDefaultProfile()
      expect(profile).toHaveProperty('bio')
      expect(profile).toHaveProperty('languages')
      expect(profile).toHaveProperty('countriesVisited')
      expect(profile).toHaveProperty('travelStyle')
      expect(profile).toHaveProperty('preferredVehicle')
      expect(profile).toHaveProperty('availability')
      expect(profile).toHaveProperty('socialLinks')
    })

    it('should have empty arrays for languages and countries', () => {
      const profile = createDefaultProfile()
      expect(profile.languages).toEqual([])
      expect(profile.countriesVisited).toEqual([])
    })

    it('should have null for optional fields', () => {
      const profile = createDefaultProfile()
      expect(profile.travelStyle).toBeNull()
      expect(profile.preferredVehicle).toBeNull()
      expect(profile.availability).toBeNull()
    })

    it('should have empty string for bio', () => {
      const profile = createDefaultProfile()
      expect(profile.bio).toBe('')
    })
  })

  describe('getDetailedProfile', () => {
    it('should return default profile for new user', () => {
      const profile = getDetailedProfile()
      expect(profile).toBeDefined()
      expect(profile.userId).toBe('test-user-123')
    })

    it('should return stored profile if exists', () => {
      const storedProfile = {
        bio: 'Test bio',
        languages: ['fr', 'en'],
        countriesVisited: ['FR', 'DE'],
      }
      localStorage.setItem('spothitch_detailed_profiles', JSON.stringify({
        'test-user-123': storedProfile,
      }))

      const profile = getDetailedProfile()
      expect(profile.bio).toBe('Test bio')
      expect(profile.languages).toEqual(['fr', 'en'])
    })

    it('should return profile for specific userId', () => {
      const otherProfile = {
        bio: 'Other user bio',
        languages: ['es'],
      }
      localStorage.setItem('spothitch_detailed_profiles', JSON.stringify({
        'other-user': otherProfile,
      }))

      const profile = getDetailedProfile('other-user')
      expect(profile.bio).toBe('Other user bio')
    })

    it('should merge stored profile with default fields', () => {
      localStorage.setItem('spothitch_detailed_profiles', JSON.stringify({
        'test-user-123': { bio: 'Partial profile' },
      }))

      const profile = getDetailedProfile()
      expect(profile.bio).toBe('Partial profile')
      expect(profile.languages).toEqual([])
      expect(profile.socialLinks).toEqual({})
    })
  })

  describe('updateDetailedProfile', () => {
    it('should update profile with valid data', () => {
      const result = updateDetailedProfile({ bio: 'New bio' })
      expect(result.success).toBe(true)
      expect(result.profile.bio).toBe('New bio')
    })

    it('should show success toast on update', () => {
      updateDetailedProfile({ bio: 'Updated' })
      expect(showToast).toHaveBeenCalledWith('Profil mis a jour !', 'success')
    })

    it('should persist profile to localStorage', () => {
      updateDetailedProfile({ bio: 'Persisted bio' })
      const stored = JSON.parse(localStorage.getItem('spothitch_detailed_profiles'))
      expect(stored['test-user-123'].bio).toBe('Persisted bio')
    })

    it('should set updatedAt timestamp', () => {
      const result = updateDetailedProfile({ bio: 'Timestamped' })
      expect(result.profile.updatedAt).toBeDefined()
    })

    it('should reject invalid data', () => {
      const result = updateDetailedProfile({ bio: 'x'.repeat(600) })
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should update state for current user', () => {
      updateDetailedProfile({ bio: 'State update' })
      expect(setState).toHaveBeenCalled()
    })
  })

  describe('validateProfileData', () => {
    it('should accept valid bio', () => {
      const result = validateProfileData({ bio: 'Valid bio' })
      expect(result.valid).toBe(true)
    })

    it('should reject bio over 500 characters', () => {
      const result = validateProfileData({ bio: 'x'.repeat(501) })
      expect(result.valid).toBe(false)
      expect(result.errors[0].field).toBe('bio')
    })

    it('should accept valid languages array', () => {
      const result = validateProfileData({ languages: ['fr', 'en'] })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid language codes', () => {
      const result = validateProfileData({ languages: ['xyz'] })
      expect(result.valid).toBe(false)
    })

    it('should accept valid countries array', () => {
      const result = validateProfileData({ countriesVisited: ['FR', 'DE'] })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid country codes', () => {
      const result = validateProfileData({ countriesVisited: ['XX'] })
      expect(result.valid).toBe(false)
    })

    it('should accept valid travel style', () => {
      const result = validateProfileData({ travelStyle: 'solo' })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid travel style', () => {
      const result = validateProfileData({ travelStyle: 'invalid' })
      expect(result.valid).toBe(false)
    })

    it('should accept valid preferred vehicle', () => {
      const result = validateProfileData({ preferredVehicle: 'car' })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid preferred vehicle', () => {
      const result = validateProfileData({ preferredVehicle: 'spaceship' })
      expect(result.valid).toBe(false)
    })

    it('should accept valid availability', () => {
      const result = validateProfileData({ availability: 'available' })
      expect(result.valid).toBe(true)
    })

    it('should accept valid social links object', () => {
      const result = validateProfileData({ socialLinks: { instagram: 'username' } })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid social platform', () => {
      const result = validateProfileData({ socialLinks: { fakebook: 'user' } })
      expect(result.valid).toBe(false)
    })

    it('should accept valid travel experience', () => {
      const result = validateProfileData({ travelExperience: 5 })
      expect(result.valid).toBe(true)
    })

    it('should reject travel experience over 50', () => {
      const result = validateProfileData({ travelExperience: 100 })
      expect(result.valid).toBe(false)
    })
  })

  describe('getProfileCompleteness', () => {
    it('should return 0% for empty profile', () => {
      const completeness = getProfileCompleteness(createDefaultProfile())
      expect(completeness.percentage).toBe(0)
    })

    it('should return percentage based on filled fields', () => {
      const profile = {
        ...createDefaultProfile(),
        bio: 'This is a test bio with at least 20 characters',
        languages: ['fr'],
      }
      const completeness = getProfileCompleteness(profile)
      expect(completeness.percentage).toBeGreaterThan(0)
      expect(completeness.percentage).toBeLessThan(100)
    })

    it('should return 100% for complete profile', () => {
      const profile = {
        bio: 'This is a complete bio with more than twenty characters',
        languages: ['fr', 'en'],
        countriesVisited: ['FR', 'DE'],
        travelStyle: 'solo',
        preferredVehicle: 'car',
        availability: 'available',
        socialLinks: { instagram: 'test' },
        profilePhoto: 'https://example.com/photo.jpg',
      }
      const completeness = getProfileCompleteness(profile)
      expect(completeness.percentage).toBe(100)
      expect(completeness.isComplete).toBe(true)
    })

    it('should list missing fields', () => {
      const profile = createDefaultProfile()
      const completeness = getProfileCompleteness(profile)
      expect(completeness.missing.length).toBeGreaterThan(0)
    })

    it('should list completed fields', () => {
      const profile = {
        ...createDefaultProfile(),
        bio: 'A bio longer than twenty characters',
      }
      const completeness = getProfileCompleteness(profile)
      expect(completeness.completed).toContain('bio')
    })

    it('should provide nextStep suggestion', () => {
      const profile = createDefaultProfile()
      const completeness = getProfileCompleteness(profile)
      expect(completeness.nextStep).toBeDefined()
      expect(completeness.nextStep.label).toBeDefined()
    })
  })

  describe('addLanguage', () => {
    it('should add valid language to profile', () => {
      const result = addLanguage('fr')
      expect(result.success).toBe(true)
    })

    it('should reject invalid language code', () => {
      const result = addLanguage('invalid')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject duplicate language', () => {
      localStorage.setItem('spothitch_detailed_profiles', JSON.stringify({
        'test-user-123': { languages: ['fr'] },
      }))
      const result = addLanguage('fr')
      expect(result.success).toBe(false)
    })
  })

  describe('removeLanguage', () => {
    it('should remove language from profile', () => {
      localStorage.setItem('spothitch_detailed_profiles', JSON.stringify({
        'test-user-123': { languages: ['fr', 'en'] },
      }))
      const result = removeLanguage('fr')
      expect(result.success).toBe(true)
    })
  })

  describe('addCountryVisited', () => {
    it('should add valid country to profile', () => {
      const result = addCountryVisited('FR')
      expect(result.success).toBe(true)
    })

    it('should reject invalid country code', () => {
      const result = addCountryVisited('XX')
      expect(result.success).toBe(false)
    })

    it('should reject duplicate country', () => {
      localStorage.setItem('spothitch_detailed_profiles', JSON.stringify({
        'test-user-123': { countriesVisited: ['FR'] },
      }))
      const result = addCountryVisited('FR')
      expect(result.success).toBe(false)
    })
  })

  describe('removeCountryVisited', () => {
    it('should remove country from profile', () => {
      localStorage.setItem('spothitch_detailed_profiles', JSON.stringify({
        'test-user-123': { countriesVisited: ['FR', 'DE'] },
      }))
      const result = removeCountryVisited('FR')
      expect(result.success).toBe(true)
    })
  })

  describe('updateBio', () => {
    it('should update bio', () => {
      const result = updateBio('New bio content')
      expect(result.success).toBe(true)
    })
  })

  describe('setTravelStyle', () => {
    it('should set valid travel style', () => {
      const result = setTravelStyle('duo')
      expect(result.success).toBe(true)
    })

    it('should reject invalid travel style', () => {
      const result = setTravelStyle('invalid')
      expect(result.success).toBe(false)
    })
  })

  describe('setPreferredVehicle', () => {
    it('should set valid vehicle preference', () => {
      const result = setPreferredVehicle('truck')
      expect(result.success).toBe(true)
    })

    it('should reject invalid vehicle type', () => {
      const result = setPreferredVehicle('helicopter')
      expect(result.success).toBe(false)
    })
  })

  describe('setAvailability', () => {
    it('should set valid availability', () => {
      const result = setAvailability('available')
      expect(result.success).toBe(true)
    })

    it('should set availability with details', () => {
      const result = setAvailability('planning', 'Trip next month')
      expect(result.success).toBe(true)
    })

    it('should reject invalid availability', () => {
      const result = setAvailability('maybe')
      expect(result.success).toBe(false)
    })
  })

  describe('updateSocialLink', () => {
    it('should update valid social link', () => {
      const result = updateSocialLink('instagram', 'myusername')
      expect(result.success).toBe(true)
    })

    it('should reject invalid platform', () => {
      const result = updateSocialLink('myspace', 'user')
      expect(result.success).toBe(false)
    })

    it('should remove link when value is empty', () => {
      localStorage.setItem('spothitch_detailed_profiles', JSON.stringify({
        'test-user-123': { socialLinks: { instagram: 'old' } },
      }))
      const result = updateSocialLink('instagram', '')
      expect(result.success).toBe(true)
    })
  })

  describe('getSocialLinkUrl', () => {
    it('should construct Instagram URL', () => {
      const url = getSocialLinkUrl('instagram', 'username')
      expect(url).toBe('https://instagram.com/username')
    })

    it('should handle @ prefix', () => {
      const url = getSocialLinkUrl('instagram', '@username')
      expect(url).toBe('https://instagram.com/username')
    })

    it('should return URL as-is if already a URL', () => {
      const url = getSocialLinkUrl('website', 'https://mysite.com')
      expect(url).toBe('https://mysite.com')
    })

    it('should return empty string for invalid platform', () => {
      const url = getSocialLinkUrl('invalid', 'user')
      expect(url).toBe('')
    })

    it('should return empty string for empty value', () => {
      const url = getSocialLinkUrl('instagram', '')
      expect(url).toBe('')
    })
  })

  describe('renderDetailedProfile', () => {
    it('should return HTML string', () => {
      const profile = createDefaultProfile()
      const html = renderDetailedProfile(profile)
      expect(typeof html).toBe('string')
      expect(html).toContain('detailed-profile')
    })

    it('should include bio section', () => {
      const profile = { ...createDefaultProfile(), bio: 'Test bio' }
      const html = renderDetailedProfile(profile)
      expect(html).toContain('Bio')
      expect(html).toContain('Test bio')
    })

    it('should include languages section', () => {
      const profile = { ...createDefaultProfile(), languages: ['fr', 'en'] }
      const html = renderDetailedProfile(profile)
      expect(html).toContain('Langues parlees')
    })

    it('should include countries section', () => {
      const profile = { ...createDefaultProfile(), countriesVisited: ['FR'] }
      const html = renderDetailedProfile(profile)
      expect(html).toContain('Pays visites')
    })

    it('should include travel preferences section', () => {
      const profile = { ...createDefaultProfile(), travelStyle: 'solo' }
      const html = renderDetailedProfile(profile)
      expect(html).toContain('Preferences de voyage')
    })

    it('should include social links section', () => {
      const profile = { ...createDefaultProfile(), socialLinks: { instagram: 'test' } }
      const html = renderDetailedProfile(profile)
      expect(html).toContain('Liens sociaux')
    })

    it('should show completeness bar by default', () => {
      const profile = createDefaultProfile()
      const html = renderDetailedProfile(profile)
      expect(html).toContain('Profil complete')
    })

    it('should hide completeness bar when profile is complete', () => {
      const profile = {
        bio: 'Complete bio with more than twenty characters',
        languages: ['fr'],
        countriesVisited: ['FR'],
        travelStyle: 'solo',
        preferredVehicle: 'car',
        availability: 'available',
        socialLinks: { instagram: 'test' },
        profilePhoto: 'photo.jpg',
      }
      const html = renderDetailedProfile(profile, { showCompleteness: true })
      expect(html).not.toContain('Profil complete a')
    })

    it('should escape HTML in bio', () => {
      const profile = { ...createDefaultProfile(), bio: '<script>alert("xss")</script>' }
      const html = renderDetailedProfile(profile)
      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })

    it('should show edit buttons when option is enabled', () => {
      const profile = createDefaultProfile()
      const html = renderDetailedProfile(profile, { showEditButtons: true })
      expect(html).toContain('Modifier')
    })

    it('should have aria-labelledby attributes for accessibility', () => {
      const profile = createDefaultProfile()
      const html = renderDetailedProfile(profile)
      expect(html).toContain('aria-labelledby')
    })
  })

  describe('renderProfileEditForm', () => {
    it('should return HTML form string', () => {
      const profile = createDefaultProfile()
      const html = renderProfileEditForm(profile)
      expect(html).toContain('<form')
      expect(html).toContain('profile-edit-form')
    })

    it('should include bio textarea', () => {
      const profile = createDefaultProfile()
      const html = renderProfileEditForm(profile)
      expect(html).toContain('textarea')
      expect(html).toContain('profile-bio')
    })

    it('should include travel style options', () => {
      const profile = createDefaultProfile()
      const html = renderProfileEditForm(profile)
      expect(html).toContain('travelStyle')
      expect(html).toContain('Solo')
    })

    it('should include vehicle type options', () => {
      const profile = createDefaultProfile()
      const html = renderProfileEditForm(profile)
      expect(html).toContain('preferredVehicle')
      expect(html).toContain('Voiture')
    })

    it('should include submit button', () => {
      const profile = createDefaultProfile()
      const html = renderProfileEditForm(profile)
      expect(html).toContain('type="submit"')
      expect(html).toContain('Enregistrer')
    })
  })

  describe('deleteDetailedProfile', () => {
    it('should delete profile from storage', () => {
      localStorage.setItem('spothitch_detailed_profiles', JSON.stringify({
        'test-user-123': { bio: 'To be deleted' },
      }))
      const result = deleteDetailedProfile()
      expect(result.success).toBe(true)
      const stored = JSON.parse(localStorage.getItem('spothitch_detailed_profiles'))
      expect(stored['test-user-123']).toBeUndefined()
    })

    it('should return error for non-existent profile', () => {
      const result = deleteDetailedProfile('non-existent')
      expect(result.success).toBe(false)
    })
  })

  describe('exportProfileData', () => {
    it('should export profile data with timestamp', () => {
      localStorage.setItem('spothitch_detailed_profiles', JSON.stringify({
        'test-user-123': { bio: 'Export test' },
      }))
      const exported = exportProfileData()
      expect(exported.exportedAt).toBeDefined()
      expect(exported.profile).toBeDefined()
      expect(exported.profile.bio).toBe('Export test')
    })
  })

  describe('searchProfiles', () => {
    beforeEach(() => {
      localStorage.setItem('spothitch_detailed_profiles', JSON.stringify({
        'user1': { languages: ['fr', 'en'], travelStyle: 'solo', availability: 'available' },
        'user2': { languages: ['de'], travelStyle: 'group', availability: 'busy' },
        'user3': { languages: ['fr'], travelStyle: 'solo', availability: 'available', travelExperience: 5 },
      }))
    })

    it('should find profiles by language', () => {
      const results = searchProfiles({ language: 'fr' })
      expect(results.length).toBe(2)
    })

    it('should find profiles by travel style', () => {
      const results = searchProfiles({ travelStyle: 'solo' })
      expect(results.length).toBe(2)
    })

    it('should find profiles by availability', () => {
      const results = searchProfiles({ availability: 'available' })
      expect(results.length).toBe(2)
    })

    it('should find profiles by minimum experience', () => {
      const results = searchProfiles({ minExperience: 3 })
      expect(results.length).toBe(1)
    })

    it('should combine multiple criteria', () => {
      const results = searchProfiles({ language: 'fr', travelStyle: 'solo', availability: 'available' })
      expect(results.length).toBe(2) // Both user1 and user3 match
    })

    it('should return empty array when no matches', () => {
      const results = searchProfiles({ language: 'zh' })
      expect(results).toEqual([])
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete profile update workflow', () => {
      // Start with empty profile
      let profile = getDetailedProfile()
      expect(profile.bio).toBe('')

      // Update bio
      updateBio('I love hitchhiking across Europe')

      // Add languages
      addLanguage('fr')
      addLanguage('en')

      // Add countries
      addCountryVisited('FR')
      addCountryVisited('DE')

      // Set preferences
      setTravelStyle('solo')
      setPreferredVehicle('car')
      setAvailability('available', 'Ready to go!')

      // Add social link
      updateSocialLink('instagram', 'myhitchhiker')

      // Verify final profile
      profile = getDetailedProfile()
      expect(profile.bio).toBe('I love hitchhiking across Europe')
      expect(profile.languages).toContain('fr')
      expect(profile.countriesVisited).toContain('DE')
      expect(profile.travelStyle).toBe('solo')
    })

    it('should persist data across sessions', () => {
      // Update profile
      updateDetailedProfile({
        bio: 'Persistent bio',
        languages: ['fr'],
        travelStyle: 'duo',
      })

      // Simulate new session by clearing mock state
      vi.clearAllMocks()

      // Retrieve profile
      const profile = getDetailedProfile()
      expect(profile.bio).toBe('Persistent bio')
      expect(profile.languages).toEqual(['fr'])
    })

    it('should render profile with all data', () => {
      const profile = {
        bio: 'Experienced hitchhiker',
        languages: ['fr', 'en', 'de'],
        countriesVisited: ['FR', 'DE', 'ES', 'IT'],
        travelStyle: 'solo',
        preferredVehicle: 'any',
        availability: 'available',
        travelExperience: 10,
        tips: 'Always smile!',
        socialLinks: {
          instagram: 'hitchhiker',
          couchsurfing: 'traveler',
        },
      }

      const html = renderDetailedProfile(profile)

      // Verify all sections are present
      expect(html).toContain('Experienced hitchhiker')
      expect(html).toContain('Francais')
      expect(html).toContain('🇫🇷')
      expect(html).toContain('Solo')
      expect(html).toContain('10 ans')
      expect(html).toContain('Always smile!')
      expect(html).toContain('Instagram')
    })
  })
})
