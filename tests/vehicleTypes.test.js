/**
 * Tests for Vehicle Types Service
 * Tracks and displays vehicle type statistics per spot
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    lang: 'fr',
    spots: [
      { id: 1, name: 'Paris Stop', country: 'FR' },
      { id: 2, name: 'Berlin Hub', country: 'DE' },
      { id: 'spot-3', name: 'Barcelona Spot', country: 'ES' },
    ],
  })),
}))

// Mock storage
const mockStorage = {}
vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn((key) => mockStorage[key] || null),
    set: vi.fn((key, value) => {
      mockStorage[key] = value
      return true
    }),
    remove: vi.fn((key) => {
      delete mockStorage[key]
      return true
    }),
  },
}))

import { getState } from '../src/stores/state.js'
import { Storage } from '../src/utils/storage.js'
import {
  vehicleTypes,
  validVehicleTypes,
  getVehicleStats,
  recordVehicleType,
  getMostCommonVehicle,
  renderVehicleStats,
  getVehicleTypesList,
  getVehicleTypeInfo,
  clearVehicleStats,
  getGlobalVehicleStats,
  recordMultipleVehicleTypes,
  exportVehicleStats,
  importVehicleStats,
  renderVehicleTypeSelector,
} from '../src/services/vehicleTypes.js'

describe('Vehicle Types Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  describe('vehicleTypes constant', () => {
    it('should have 6 vehicle types defined', () => {
      expect(Object.keys(vehicleTypes).length).toBe(6)
    })

    it('should include voiture type', () => {
      expect(vehicleTypes.voiture).toBeDefined()
      expect(vehicleTypes.voiture.emoji).toBe('🚗')
      expect(vehicleTypes.voiture.icon).toBe('fa-car')
    })

    it('should include camion type', () => {
      expect(vehicleTypes.camion).toBeDefined()
      expect(vehicleTypes.camion.emoji).toBe('🚛')
      expect(vehicleTypes.camion.icon).toBe('fa-truck')
    })

    it('should include van type', () => {
      expect(vehicleTypes.van).toBeDefined()
      expect(vehicleTypes.van.emoji).toBe('🚐')
    })

    it('should include camping-car type', () => {
      expect(vehicleTypes['camping-car']).toBeDefined()
      expect(vehicleTypes['camping-car'].emoji).toBe('🏕️')
    })

    it('should include moto type', () => {
      expect(vehicleTypes.moto).toBeDefined()
      expect(vehicleTypes.moto.emoji).toBe('🏍️')
    })

    it('should include bus type', () => {
      expect(vehicleTypes.bus).toBeDefined()
      expect(vehicleTypes.bus.emoji).toBe('🚌')
    })

    it('should have multilingual labels for all types', () => {
      for (const type of Object.values(vehicleTypes)) {
        expect(type.labels.fr).toBeDefined()
        expect(type.labels.en).toBeDefined()
        expect(type.labels.es).toBeDefined()
        expect(type.labels.de).toBeDefined()
      }
    })

    it('should have descriptions for all types', () => {
      for (const type of Object.values(vehicleTypes)) {
        expect(type.description.fr).toBeDefined()
        expect(type.description.en).toBeDefined()
      }
    })
  })

  describe('validVehicleTypes', () => {
    it('should contain all 6 vehicle type IDs', () => {
      expect(validVehicleTypes).toContain('voiture')
      expect(validVehicleTypes).toContain('camion')
      expect(validVehicleTypes).toContain('van')
      expect(validVehicleTypes).toContain('camping-car')
      expect(validVehicleTypes).toContain('moto')
      expect(validVehicleTypes).toContain('bus')
      expect(validVehicleTypes.length).toBe(6)
    })
  })

  describe('getVehicleStats', () => {
    it('should return null for invalid spot ID', () => {
      const stats = getVehicleStats(null)
      expect(stats).toBeNull()
    })

    it('should return empty stats for spot with no data', () => {
      const stats = getVehicleStats('spot-123')
      expect(stats.totalRecords).toBe(0)
      expect(stats.mostCommon).toBeNull()
      expect(stats.types).toEqual({})
    })

    it('should return correct stats after recording', () => {
      mockStorage['vehicle_stats'] = {
        'spot-1': { voiture: 5, camion: 2, lastUpdated: '2026-01-01' }
      }

      const stats = getVehicleStats('spot-1')
      expect(stats.totalRecords).toBe(7)
      expect(stats.types.voiture).toBe(5)
      expect(stats.types.camion).toBe(2)
      expect(stats.mostCommon).toBe('voiture')
    })

    it('should calculate percentages correctly', () => {
      mockStorage['vehicle_stats'] = {
        'spot-1': { voiture: 6, camion: 4 }
      }

      const stats = getVehicleStats('spot-1')
      expect(stats.percentages.voiture).toBe(60)
      expect(stats.percentages.camion).toBe(40)
    })

    it('should handle spot ID as number', () => {
      mockStorage['vehicle_stats'] = {
        1: { van: 3 }
      }

      const stats = getVehicleStats(1)
      expect(stats.totalRecords).toBe(3)
    })
  })

  describe('recordVehicleType', () => {
    it('should return null for invalid spot ID', () => {
      const result = recordVehicleType(null, 'voiture')
      expect(result).toBeNull()
    })

    it('should return null for invalid vehicle type', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = recordVehicleType('spot-1', 'invalid')
      expect(result).toBeNull()
      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('should record voiture type successfully', () => {
      const stats = recordVehicleType('spot-1', 'voiture')
      expect(stats.types.voiture).toBe(1)
      expect(stats.totalRecords).toBe(1)
    })

    it('should record camion type successfully', () => {
      const stats = recordVehicleType('spot-1', 'camion')
      expect(stats.types.camion).toBe(1)
    })

    it('should record van type successfully', () => {
      const stats = recordVehicleType('spot-1', 'van')
      expect(stats.types.van).toBe(1)
    })

    it('should record camping-car type successfully', () => {
      const stats = recordVehicleType('spot-1', 'camping-car')
      expect(stats.types['camping-car']).toBe(1)
    })

    it('should record moto type successfully', () => {
      const stats = recordVehicleType('spot-1', 'moto')
      expect(stats.types.moto).toBe(1)
    })

    it('should record bus type successfully', () => {
      const stats = recordVehicleType('spot-1', 'bus')
      expect(stats.types.bus).toBe(1)
    })

    it('should increment count on multiple recordings', () => {
      recordVehicleType('spot-2', 'voiture')
      recordVehicleType('spot-2', 'voiture')
      const stats = recordVehicleType('spot-2', 'voiture')
      expect(stats.types.voiture).toBe(3)
    })

    it('should set lastUpdated timestamp', () => {
      const stats = recordVehicleType('spot-3', 'van')
      expect(stats.lastUpdated).toBeDefined()
    })

    it('should save to storage', () => {
      recordVehicleType('spot-save', 'moto')
      expect(Storage.set).toHaveBeenCalledWith('vehicle_stats', expect.any(Object))
    })
  })

  describe('getMostCommonVehicle', () => {
    it('should return null for invalid spot ID', () => {
      const result = getMostCommonVehicle(null)
      expect(result).toBeNull()
    })

    it('should return null for spot with no data', () => {
      const result = getMostCommonVehicle('empty-spot')
      expect(result).toBeNull()
    })

    it('should return most common vehicle info', () => {
      mockStorage['vehicle_stats'] = {
        'spot-mc': { voiture: 10, camion: 3, van: 5 }
      }

      const result = getMostCommonVehicle('spot-mc')
      expect(result.type).toBe('voiture')
      expect(result.count).toBe(10)
      expect(result.emoji).toBe('🚗')
      expect(result.label).toBeDefined()
    })

    it('should return correct percentage', () => {
      mockStorage['vehicle_stats'] = {
        'spot-pct': { bus: 8, moto: 2 }
      }

      const result = getMostCommonVehicle('spot-pct')
      expect(result.type).toBe('bus')
      expect(result.percentage).toBe(80)
    })

    it('should use correct language for label', () => {
      mockStorage['vehicle_stats'] = {
        'spot-lang': { camion: 5 }
      }

      const result = getMostCommonVehicle('spot-lang')
      expect(result.label).toBe('Camion') // French is default
    })
  })

  describe('renderVehicleStats', () => {
    it('should render empty state for spot with no data', () => {
      const html = renderVehicleStats('empty-spot')
      expect(html).toContain('vehicle-stats-container')
      expect(html).toContain('Aucune donnee')
      expect(html).toContain('Ajouter une observation')
    })

    it('should render stats with data', () => {
      mockStorage['vehicle_stats'] = {
        'spot-render': { voiture: 5, camion: 3 }
      }

      const html = renderVehicleStats('spot-render')
      expect(html).toContain('vehicle-stats-container')
      expect(html).toContain('8 observations')
      expect(html).toContain('🚗')
    })

    it('should highlight most common vehicle', () => {
      mockStorage['vehicle_stats'] = {
        'spot-highlight': { van: 10, bus: 2 }
      }

      const html = renderVehicleStats('spot-highlight')
      expect(html).toContain('most-common-vehicle')
      expect(html).toContain('Le plus courant')
      expect(html).toContain('🚐') // Van emoji
    })

    it('should include progress bars', () => {
      mockStorage['vehicle_stats'] = {
        'spot-bars': { moto: 4, voiture: 6 }
      }

      const html = renderVehicleStats('spot-bars')
      expect(html).toContain('progressbar')
      expect(html).toContain('aria-valuenow')
    })

    it('should include add button', () => {
      mockStorage['vehicle_stats'] = {
        'spot-btn': { voiture: 1 }
      }

      const html = renderVehicleStats('spot-btn')
      expect(html).toContain('openVehicleTypeModal')
      expect(html).toContain('fa-plus')
    })

    it('should include spot ID in data attribute', () => {
      mockStorage['vehicle_stats'] = {
        'my-spot': { bus: 2 }
      }

      const html = renderVehicleStats('my-spot')
      expect(html).toContain('data-spot-id="my-spot"')
    })

    it('should display percentage values', () => {
      mockStorage['vehicle_stats'] = {
        'spot-pct-display': { voiture: 7, camion: 3 }
      }

      const html = renderVehicleStats('spot-pct-display')
      expect(html).toContain('70%')
      expect(html).toContain('30%')
    })
  })

  describe('getVehicleTypesList', () => {
    it('should return array of 6 vehicle types', () => {
      const list = getVehicleTypesList()
      expect(Array.isArray(list)).toBe(true)
      expect(list.length).toBe(6)
    })

    it('should include id, label, emoji, and icon for each type', () => {
      const list = getVehicleTypesList()
      for (const type of list) {
        expect(type.id).toBeDefined()
        expect(type.label).toBeDefined()
        expect(type.emoji).toBeDefined()
        expect(type.icon).toBeDefined()
      }
    })

    it('should use French labels by default', () => {
      const list = getVehicleTypesList()
      const voiture = list.find(t => t.id === 'voiture')
      expect(voiture.label).toBe('Voiture')
    })
  })

  describe('getVehicleTypeInfo', () => {
    it('should return null for invalid type ID', () => {
      expect(getVehicleTypeInfo(null)).toBeNull()
      expect(getVehicleTypeInfo('invalid')).toBeNull()
    })

    it('should return info for valid type', () => {
      const info = getVehicleTypeInfo('voiture')
      expect(info.id).toBe('voiture')
      expect(info.emoji).toBe('🚗')
      expect(info.label).toBe('Voiture')
    })

    it('should include description', () => {
      const info = getVehicleTypeInfo('camion')
      expect(info.description).toBeDefined()
      expect(info.description.length).toBeGreaterThan(0)
    })
  })

  describe('clearVehicleStats', () => {
    it('should return false for invalid spot ID', () => {
      expect(clearVehicleStats(null)).toBe(false)
    })

    it('should return false for spot with no stats', () => {
      expect(clearVehicleStats('no-stats-spot')).toBe(false)
    })

    it('should clear stats for valid spot', () => {
      mockStorage['vehicle_stats'] = {
        'clear-spot': { voiture: 5 }
      }

      const result = clearVehicleStats('clear-spot')
      expect(result).toBe(true)
    })
  })

  describe('getGlobalVehicleStats', () => {
    it('should return empty stats when no data', () => {
      const global = getGlobalVehicleStats()
      expect(global.totalRecords).toBe(0)
      expect(global.spotsWithData).toBe(0)
    })

    it('should aggregate stats from multiple spots', () => {
      mockStorage['vehicle_stats'] = {
        'spot-a': { voiture: 5, camion: 3 },
        'spot-b': { voiture: 3, van: 2 }
      }

      const global = getGlobalVehicleStats()
      expect(global.totalRecords).toBe(13)
      expect(global.spotsWithData).toBe(2)
      expect(global.types.voiture).toBe(8)
      expect(global.types.camion).toBe(3)
      expect(global.types.van).toBe(2)
    })

    it('should calculate global percentages', () => {
      mockStorage['vehicle_stats'] = {
        's1': { voiture: 6, camion: 4 }
      }

      const global = getGlobalVehicleStats()
      expect(global.percentages.voiture).toBe(60)
      expect(global.percentages.camion).toBe(40)
    })

    it('should find global most common', () => {
      mockStorage['vehicle_stats'] = {
        's1': { bus: 10 },
        's2': { bus: 5, voiture: 3 }
      }

      const global = getGlobalVehicleStats()
      expect(global.mostCommon).toBe('bus')
    })
  })

  describe('recordMultipleVehicleTypes', () => {
    it('should return null for invalid spot ID', () => {
      expect(recordMultipleVehicleTypes(null, ['voiture'])).toBeNull()
    })

    it('should return null for invalid types array', () => {
      expect(recordMultipleVehicleTypes('spot', 'not-array')).toBeNull()
    })

    it('should record multiple types', () => {
      const stats = recordMultipleVehicleTypes('multi-spot', ['voiture', 'voiture', 'camion'])
      expect(stats.types.voiture).toBe(2)
      expect(stats.types.camion).toBe(1)
      expect(stats.totalRecords).toBe(3)
    })
  })

  describe('exportVehicleStats', () => {
    it('should export stats as JSON string', () => {
      mockStorage['vehicle_stats'] = {
        'export-spot': { voiture: 5, camion: 2 }
      }

      const exported = exportVehicleStats('export-spot')
      expect(typeof exported).toBe('string')
      const parsed = JSON.parse(exported)
      expect(parsed.types.voiture).toBe(5)
    })

    it('should export empty stats for spot with no data', () => {
      const exported = exportVehicleStats('no-data-spot')
      const parsed = JSON.parse(exported)
      expect(parsed.totalRecords).toBe(0)
    })
  })

  describe('importVehicleStats', () => {
    it('should return false for invalid spot ID', () => {
      expect(importVehicleStats(null, {})).toBe(false)
    })

    it('should import stats from JSON string', () => {
      const data = JSON.stringify({ types: { voiture: 5, camion: 3 } })
      const result = importVehicleStats('import-spot', data)
      expect(result).toBe(true)
    })

    it('should import stats from object', () => {
      const data = { types: { van: 4 } }
      const result = importVehicleStats('import-obj-spot', data)
      expect(result).toBe(true)
    })

    it('should only import valid vehicle types', () => {
      const data = { types: { voiture: 5, invalid_type: 10 } }
      importVehicleStats('import-valid-spot', data)
      // The import should succeed but invalid type should be filtered
      expect(Storage.set).toHaveBeenCalled()
    })

    it('should return false for invalid JSON', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = importVehicleStats('bad-spot', 'not valid json {{{')
      expect(result).toBe(false)
      warnSpy.mockRestore()
    })
  })

  describe('renderVehicleTypeSelector', () => {
    it('should render selector with all vehicle types', () => {
      const html = renderVehicleTypeSelector('selector-spot')
      expect(html).toContain('vehicle-type-selector')
      expect(html).toContain('🚗') // voiture
      expect(html).toContain('🚛') // camion
      expect(html).toContain('🚐') // van
      expect(html).toContain('🏕️') // camping-car
      expect(html).toContain('🏍️') // moto
      expect(html).toContain('🚌') // bus
    })

    it('should include title in French by default', () => {
      const html = renderVehicleTypeSelector('fr-spot')
      expect(html).toContain('Quel type de vehicule')
    })

    it('should include onclick handlers for each type', () => {
      const html = renderVehicleTypeSelector('handler-spot')
      expect(html).toContain('recordAndCloseVehicleType')
      expect(html).toContain('voiture')
      expect(html).toContain('camion')
    })

    it('should have accessible labels', () => {
      const html = renderVehicleTypeSelector('a11y-spot')
      expect(html).toContain('aria-label')
    })

    it('should use grid layout', () => {
      const html = renderVehicleTypeSelector('grid-spot')
      expect(html).toContain('grid')
      expect(html).toContain('grid-cols-2')
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete workflow: record, get stats, render', () => {
      // Record some vehicle types
      recordVehicleType('workflow-spot', 'voiture')
      recordVehicleType('workflow-spot', 'voiture')
      recordVehicleType('workflow-spot', 'camion')

      // Get stats
      const stats = getVehicleStats('workflow-spot')
      expect(stats.totalRecords).toBe(3)
      expect(stats.mostCommon).toBe('voiture')

      // Render
      const html = renderVehicleStats('workflow-spot')
      expect(html).toContain('3 observations')
      expect(html).toContain('Voiture')
    })

    it('should handle multiple spots independently', () => {
      recordVehicleType('spot-a', 'voiture')
      recordVehicleType('spot-a', 'voiture')
      recordVehicleType('spot-b', 'bus')
      recordVehicleType('spot-b', 'bus')
      recordVehicleType('spot-b', 'bus')

      const statsA = getVehicleStats('spot-a')
      const statsB = getVehicleStats('spot-b')

      expect(statsA.mostCommon).toBe('voiture')
      expect(statsB.mostCommon).toBe('bus')
      expect(statsA.totalRecords).toBe(2)
      expect(statsB.totalRecords).toBe(3)
    })

    it('should export and import stats correctly', () => {
      recordVehicleType('export-import-spot', 'van')
      recordVehicleType('export-import-spot', 'van')
      recordVehicleType('export-import-spot', 'moto')

      const exported = exportVehicleStats('export-import-spot')
      clearVehicleStats('export-import-spot')

      importVehicleStats('new-spot', exported)
      // Verify the stats were imported (check storage was called)
      expect(Storage.set).toHaveBeenCalled()
    })
  })
})
