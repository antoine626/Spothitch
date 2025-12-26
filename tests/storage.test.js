/**
 * Storage Utility Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Storage } from '../src/utils/storage.js';

describe('Storage', () => {
  beforeEach(() => {
    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();
    localStorage.removeItem.mockClear();
    localStorage.clear.mockClear();
  });
  
  describe('get', () => {
    it('should return parsed JSON from localStorage', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify({ test: 'value' }));
      
      const result = Storage.get('key');
      
      expect(localStorage.getItem).toHaveBeenCalledWith('spothitch_v4_key');
      expect(result).toEqual({ test: 'value' });
    });
    
    it('should return null if key does not exist', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const result = Storage.get('nonexistent');
      
      expect(result).toBeNull();
    });
    
    it('should return null on parse error', () => {
      localStorage.getItem.mockReturnValue('invalid json');
      
      const result = Storage.get('key');
      
      expect(result).toBeNull();
    });
    
    it('should handle primitive values', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify(42));
      expect(Storage.get('number')).toBe(42);
      
      localStorage.getItem.mockReturnValue(JSON.stringify('string'));
      expect(Storage.get('string')).toBe('string');
      
      localStorage.getItem.mockReturnValue(JSON.stringify(true));
      expect(Storage.get('boolean')).toBe(true);
    });
  });
  
  describe('set', () => {
    it('should store JSON in localStorage', () => {
      const result = Storage.set('key', { test: 'value' });
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'spothitch_v4_key',
        JSON.stringify({ test: 'value' })
      );
      expect(result).toBe(true);
    });
    
    it('should handle arrays', () => {
      Storage.set('array', [1, 2, 3]);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'spothitch_v4_array',
        JSON.stringify([1, 2, 3])
      );
    });
    
    it('should return false on error', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      const result = Storage.set('key', 'value');
      
      expect(result).toBe(false);
    });
  });
  
  describe('remove', () => {
    it('should remove item from localStorage', () => {
      const result = Storage.remove('key');
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('spothitch_v4_key');
      expect(result).toBe(true);
    });
    
    it('should return false on error', () => {
      localStorage.removeItem.mockImplementation(() => {
        throw new Error('Error');
      });
      
      const result = Storage.remove('key');
      
      expect(result).toBe(false);
    });
  });
  
  describe('clear', () => {
    it('should clear only SpotHitch keys', () => {
      // Mock Object.keys to return mixed keys
      const mockStorage = {
        'spothitch_v4_key1': 'value1',
        'spothitch_v4_key2': 'value2',
        'other_key': 'value3',
      };
      
      Object.keys = vi.fn().mockReturnValue(Object.keys(mockStorage));
      localStorage.removeItem = vi.fn();
      
      Storage.clear();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('spothitch_v4_key1');
      expect(localStorage.removeItem).toHaveBeenCalledWith('spothitch_v4_key2');
    });
  });
});
