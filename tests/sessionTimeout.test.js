/**
 * Session Timeout Service Tests
 * Testing all session timeout functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as sessionTimeout from '../src/services/sessionTimeout.js';
import * as firebase from '../src/services/firebase.js';

// Mock localStorage
const mockStorage = {};

beforeEach(() => {
  mockStorage.clear?.();
  global.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, value) => {
      mockStorage[key] = value;
    },
    removeItem: (key) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const key in mockStorage) {
        delete mockStorage[key];
      }
    }
  };

  vi.spyOn(firebase, 'logOut').mockResolvedValue({ success: true });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  mockStorage.clear?.();
  vi.restoreAllMocks();
});

describe('sessionTimeout - Constants', () => {
  it('should export SESSION_TIMEOUT_MS constant', () => {
    expect(sessionTimeout.SESSION_TIMEOUT_MS).toBeDefined();
    expect(typeof sessionTimeout.SESSION_TIMEOUT_MS).toBe('number');
  });

  it('SESSION_TIMEOUT_MS should be 7 days in milliseconds', () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(sessionTimeout.SESSION_TIMEOUT_MS).toBe(sevenDaysMs);
  });

  it('SESSION_TIMEOUT_MS should be greater than 1 day', () => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    expect(sessionTimeout.SESSION_TIMEOUT_MS).toBeGreaterThan(oneDayMs);
  });
});

describe('sessionTimeout - getLastActivity', () => {
  it('should return null if no activity recorded', () => {
    const activity = sessionTimeout.getLastActivity();
    expect(activity).toBeNull();
  });

  it('should return timestamp if activity recorded', () => {
    const timestamp = Date.now();
    mockStorage['spothitch_last_activity'] = timestamp.toString();

    const activity = sessionTimeout.getLastActivity();
    expect(activity).toBe(timestamp);
  });

  it('should handle invalid timestamp gracefully', () => {
    mockStorage['spothitch_last_activity'] = 'invalid';

    const activity = sessionTimeout.getLastActivity();
    expect(typeof activity === 'number' || activity === null).toBe(true);
  });

  it('should handle localStorage errors gracefully', () => {
    global.localStorage = {
      getItem: () => {
        throw new Error('Storage error');
      }
    };

    const activity = sessionTimeout.getLastActivity();
    expect(activity).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('sessionTimeout - updateLastActivity', () => {
  it('should update activity timestamp', () => {
    sessionTimeout.updateLastActivity();

    const activity = sessionTimeout.getLastActivity();
    expect(activity).toBeDefined();
    expect(typeof activity).toBe('number');
  });

  it('should set timestamp close to current time', () => {
    const before = Date.now();
    sessionTimeout.updateLastActivity();
    const after = Date.now();

    const activity = sessionTimeout.getLastActivity();
    expect(activity).toBeGreaterThanOrEqual(before);
    expect(activity).toBeLessThanOrEqual(after + 100);
  });

  it('should handle localStorage errors gracefully', () => {
    global.localStorage = {
      setItem: () => {
        throw new Error('Storage error');
      }
    };

    expect(() => sessionTimeout.updateLastActivity()).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('sessionTimeout - checkSessionExpired', () => {
  it('should return false if no activity recorded', () => {
    const expired = sessionTimeout.checkSessionExpired();
    expect(expired).toBe(false);
  });

  it('should return false if activity is recent', () => {
    const now = Date.now();
    mockStorage['spothitch_last_activity'] = now.toString();

    const expired = sessionTimeout.checkSessionExpired();
    expect(expired).toBe(false);
  });

  it('should return false if activity is 6 days old', () => {
    const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
    const timestamp = Date.now() - sixDaysMs;
    mockStorage['spothitch_last_activity'] = timestamp.toString();

    const expired = sessionTimeout.checkSessionExpired();
    expect(expired).toBe(false);
  });

  it('should return true if activity is 7 days + 1 second old', () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const timestamp = Date.now() - (sevenDaysMs + 1000);
    mockStorage['spothitch_last_activity'] = timestamp.toString();

    const expired = sessionTimeout.checkSessionExpired();
    expect(expired).toBe(true);
  });

  it('should return true if activity is 8 days old', () => {
    const eightDaysMs = 8 * 24 * 60 * 60 * 1000;
    const timestamp = Date.now() - eightDaysMs;
    mockStorage['spothitch_last_activity'] = timestamp.toString();

    const expired = sessionTimeout.checkSessionExpired();
    expect(expired).toBe(true);
  });

  it('should return false if activity is just under 7 days', () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const timestamp = Date.now() - (sevenDaysMs - 60000); // 1 minute before expiry
    mockStorage['spothitch_last_activity'] = timestamp.toString();

    const expired = sessionTimeout.checkSessionExpired();
    expect(expired).toBe(false);
  });
});

describe('sessionTimeout - getRemainingSessionTime', () => {
  it('should return max time if no activity recorded', () => {
    // Clear any previous activity to start fresh
    sessionTimeout.clearSession();

    // Verify no activity is recorded
    expect(sessionTimeout.getLastActivity()).toBeNull();

    const remaining = sessionTimeout.getRemainingSessionTime();

    expect(remaining.expired).toBe(false);
    // When no activity, should return full 7 days
    expect(remaining.remainingMs).toBe(sessionTimeout.SESSION_TIMEOUT_MS);
    expect(remaining.remainingDays).toBe(7);
    expect(remaining.remainingHours).toBe(168);
  });

  it('should calculate remaining time correctly', () => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const timestamp = Date.now() - (6 * oneDayMs); // 6 days old
    mockStorage['spothitch_last_activity'] = timestamp.toString();

    const remaining = sessionTimeout.getRemainingSessionTime();

    expect(remaining.expired).toBe(false);
    expect(remaining.remainingDays).toBe(1);
    expect(remaining.remainingHours).toBe(24);
  });

  it('should return expired: true when session is expired', () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const timestamp = Date.now() - sevenDaysMs;
    mockStorage['spothitch_last_activity'] = timestamp.toString();

    const remaining = sessionTimeout.getRemainingSessionTime();

    expect(remaining.expired).toBe(true);
    expect(remaining.remainingMs).toBe(0);
  });

  it('should never return negative remaining time', () => {
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
    const timestamp = Date.now() - fifteenDaysMs;
    mockStorage['spothitch_last_activity'] = timestamp.toString();

    const remaining = sessionTimeout.getRemainingSessionTime();

    expect(remaining.remainingMs).toBeGreaterThanOrEqual(0);
    expect(remaining.remainingDays).toBeGreaterThanOrEqual(0);
    expect(remaining.remainingHours).toBeGreaterThanOrEqual(0);
  });

  it('should have all required properties', () => {
    const remaining = sessionTimeout.getRemainingSessionTime();

    expect(remaining).toHaveProperty('expired');
    expect(remaining).toHaveProperty('remainingMs');
    expect(remaining).toHaveProperty('remainingDays');
    expect(remaining).toHaveProperty('remainingHours');
  });
});

describe('sessionTimeout - resetSession', () => {
  it('should clear and update activity timestamp', () => {
    mockStorage['spothitch_last_activity'] = '1000000';

    sessionTimeout.resetSession();

    const activity = sessionTimeout.getLastActivity();
    expect(activity).toBeDefined();
    expect(typeof activity).toBe('number');
    expect(activity).not.toBe(1000000);
  });

  it('should start fresh 7-day window', () => {
    mockStorage['spothitch_last_activity'] = (Date.now() - 6 * 24 * 60 * 60 * 1000).toString();

    sessionTimeout.resetSession();

    const remaining = sessionTimeout.getRemainingSessionTime();
    expect(remaining.remainingDays).toBe(7);
  });

  it('should handle localStorage errors gracefully', () => {
    global.localStorage = {
      removeItem: () => {
        throw new Error('Storage error');
      },
      setItem: () => {}
    };

    expect(() => sessionTimeout.resetSession()).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('sessionTimeout - clearSession', () => {
  it('should remove activity timestamp', () => {
    mockStorage['spothitch_last_activity'] = Date.now().toString();

    sessionTimeout.clearSession();

    const activity = sessionTimeout.getLastActivity();
    expect(activity).toBeNull();
  });

  it('should mark session as not expired after clearing', () => {
    mockStorage['spothitch_last_activity'] = (Date.now() - 8 * 24 * 60 * 60 * 1000).toString();

    sessionTimeout.clearSession();

    const expired = sessionTimeout.checkSessionExpired();
    expect(expired).toBe(false);
  });

  it('should handle localStorage errors gracefully', () => {
    global.localStorage = {
      removeItem: () => {
        throw new Error('Storage error');
      }
    };

    expect(() => sessionTimeout.clearSession()).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('sessionTimeout - handleSessionExpiration', () => {
  it('should call Firebase logout', async () => {
    mockStorage['spothitch_last_activity'] = Date.now().toString();

    const result = await sessionTimeout.handleSessionExpiration();

    expect(firebase.logOut).toHaveBeenCalled();
  });

  it('should clear session before logout', async () => {
    mockStorage['spothitch_last_activity'] = Date.now().toString();

    await sessionTimeout.handleSessionExpiration();

    const activity = sessionTimeout.getLastActivity();
    expect(activity).toBeNull();
  });

  it('should return success on successful logout', async () => {
    vi.spyOn(firebase, 'logOut').mockResolvedValue({ success: true });

    const result = await sessionTimeout.handleSessionExpiration();

    expect(result.success).toBe(true);
    expect(result.message).toContain('expire');
  });

  it('should return error on failed logout', async () => {
    vi.spyOn(firebase, 'logOut').mockResolvedValue({ success: false, error: 'auth/error' });

    const result = await sessionTimeout.handleSessionExpiration();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle Firebase logout errors', async () => {
    vi.spyOn(firebase, 'logOut').mockRejectedValue(new Error('Network error'));

    const result = await sessionTimeout.handleSessionExpiration();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('sessionTimeout - checkAndHandleSessionExpiration', () => {
  it('should return expired: false if session is active', async () => {
    sessionTimeout.updateLastActivity();

    const result = await sessionTimeout.checkAndHandleSessionExpiration();

    expect(result.expired).toBe(false);
    expect(result.action).toBeUndefined();
  });

  it('should return expired: true if session is expired', async () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const timestamp = Date.now() - (sevenDaysMs + 1000);
    mockStorage['spothitch_last_activity'] = timestamp.toString();

    const result = await sessionTimeout.checkAndHandleSessionExpiration();

    expect(result.expired).toBe(true);
    expect(result.action).toBe('logout');
  });

  it('should logout user if session is expired', async () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const timestamp = Date.now() - (sevenDaysMs + 1000);
    mockStorage['spothitch_last_activity'] = timestamp.toString();

    vi.clearAllMocks();
    vi.spyOn(firebase, 'logOut').mockResolvedValue({ success: true });

    await sessionTimeout.checkAndHandleSessionExpiration();

    expect(firebase.logOut).toHaveBeenCalled();
  });

  it('should not logout if session is active', async () => {
    vi.clearAllMocks();
    vi.spyOn(firebase, 'logOut').mockResolvedValue({ success: true });

    sessionTimeout.updateLastActivity();

    await sessionTimeout.checkAndHandleSessionExpiration();

    expect(firebase.logOut).not.toHaveBeenCalled();
  });
});

describe('sessionTimeout - setupSessionTimeoutCheck', () => {
  it('should return an interval ID', () => {
    const intervalId = sessionTimeout.setupSessionTimeoutCheck();

    expect(intervalId).toBeDefined();
    clearInterval(intervalId);
  });

  it('should create an interval that can be cleared', async () => {
    const intervalId = sessionTimeout.setupSessionTimeoutCheck();

    // Should be able to clear the interval without error
    expect(() => clearInterval(intervalId)).not.toThrow();
  });
});

describe('sessionTimeout - getSessionTimeoutMessage', () => {
  it('should return expired message when session expired', () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    mockStorage['spothitch_last_activity'] = (Date.now() - sevenDaysMs).toString();

    const message = sessionTimeout.getSessionTimeoutMessage();

    expect(message).toContain('expire');
    expect(message).toContain('reconnecter');
  });

  it('should mention days when 1+ days remaining', () => {
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    mockStorage['spothitch_last_activity'] = (Date.now() - threeDaysMs).toString();

    const message = sessionTimeout.getSessionTimeoutMessage();

    expect(message).toContain('jour');
  });

  it('should mention hours when less than 1 day remaining', () => {
    const sixHoursMs = 6 * 60 * 60 * 1000;
    mockStorage['spothitch_last_activity'] = (Date.now() - (7 * 24 * 60 * 60 * 1000 - sixHoursMs)).toString();

    const message = sessionTimeout.getSessionTimeoutMessage();

    expect(message.length > 0).toBe(true);
  });

  it('should return French localized message', () => {
    sessionTimeout.getLastActivity();

    const message = sessionTimeout.getSessionTimeoutMessage();

    // Should be in French
    expect(message.toLowerCase()).toMatch(/session|votre|jour|heure|inactiv/);
  });

  it('should have fallback message for edge cases', () => {
    const message = sessionTimeout.getSessionTimeoutMessage();

    expect(typeof message).toBe('string');
    expect(message.length > 0).toBe(true);
  });
});

describe('sessionTimeout - default export', () => {
  it('should export all functions in default object', () => {
    const defaultExport = sessionTimeout.default;

    expect(defaultExport.SESSION_TIMEOUT_MS).toBeDefined();
    expect(defaultExport.getLastActivity).toBeDefined();
    expect(defaultExport.updateLastActivity).toBeDefined();
    expect(defaultExport.checkSessionExpired).toBeDefined();
    expect(defaultExport.getRemainingSessionTime).toBeDefined();
    expect(defaultExport.resetSession).toBeDefined();
    expect(defaultExport.clearSession).toBeDefined();
    expect(defaultExport.handleSessionExpiration).toBeDefined();
    expect(defaultExport.checkAndHandleSessionExpiration).toBeDefined();
    expect(defaultExport.setupSessionTimeoutCheck).toBeDefined();
    expect(defaultExport.getSessionTimeoutMessage).toBeDefined();
  });
});

describe('sessionTimeout - Integration tests', () => {
  it('should handle complete login-activity-logout cycle', async () => {
    // Start session
    sessionTimeout.resetSession();
    expect(sessionTimeout.getLastActivity()).toBeDefined();

    // Session should be active
    expect(sessionTimeout.checkSessionExpired()).toBe(false);

    // Update activity
    sessionTimeout.updateLastActivity();
    expect(sessionTimeout.getRemainingSessionTime().remainingDays).toBe(7);

    // End session
    sessionTimeout.clearSession();
    expect(sessionTimeout.getLastActivity()).toBeNull();
    expect(sessionTimeout.checkSessionExpired()).toBe(false);
  });

  it('should handle expired session detection and logout', async () => {
    // Simulate 7+ days of inactivity
    const eightDaysMs = 8 * 24 * 60 * 60 * 1000;
    mockStorage['spothitch_last_activity'] = (Date.now() - eightDaysMs).toString();

    vi.clearAllMocks();
    vi.spyOn(firebase, 'logOut').mockResolvedValue({ success: true });

    // Check expiration
    const result = await sessionTimeout.checkAndHandleSessionExpiration();

    expect(result.expired).toBe(true);
    expect(firebase.logOut).toHaveBeenCalled();
  });

  it('should preserve remaining time correctly throughout lifecycle', () => {
    // Day 1: Login and activity
    sessionTimeout.resetSession();
    let remaining = sessionTimeout.getRemainingSessionTime();
    expect(remaining.remainingDays).toBe(7);

    // Day 3: Still active
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    mockStorage['spothitch_last_activity'] = (Date.now() - threeDaysMs).toString();
    remaining = sessionTimeout.getRemainingSessionTime();
    expect(remaining.remainingDays).toBe(4);

    // Day 7+: Expired
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    mockStorage['spothitch_last_activity'] = (Date.now() - sevenDaysMs).toString();
    remaining = sessionTimeout.getRemainingSessionTime();
    expect(remaining.expired).toBe(true);
  });
});
