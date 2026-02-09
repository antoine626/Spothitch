/**
 * Destructive Confirmation Service Tests
 * Feature #53 - Confirmation avant actions destructives
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock storage BEFORE importing anything else
vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn((key) => {
      if (key === 'state') return null;
      return null;
    }),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
}));

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key) => {
    const translations = {
      waitForTimer: 'Veuillez attendre avant de confirmer',
      actionConfirmed: 'Action confirmee',
      actionCancelled: 'Action annulee',
      close: 'Fermer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      safetyTimer: 'Delai de securite',
      timerExplanation: 'Ce delai vous permet de reflechir avant de confirmer.',
      severity: 'Severite',
    };
    return translations[key] || key;
  }),
}));

import {
  DestructiveActions,
  SeverityLevels,
  getActionConfig,
  requiresConfirmation,
  requiresTimer,
  getTimerDuration,
  getSeverityLevel,
  getCurrentConfirmation,
  getRemainingTime,
  isTimerComplete,
  confirmDestructiveAction,
  executeConfirmation,
  cancelConfirmation,
  getConfirmationHistory,
  clearConfirmationHistory,
  renderConfirmationModal,
  renderDestructiveButton,
  getDestructiveActions,
  getActionsBySeverity,
  getDestructiveActionStats,
} from '../src/services/destructiveConfirmation.js';
import { showToast } from '../src/services/notifications.js';
import { resetState } from '../src/stores/state.js';

describe('Destructive Confirmation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    resetState();
    // Cancel any pending confirmation
    cancelConfirmation();
    // Clear localStorage mock
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    cancelConfirmation();
  });

  describe('DestructiveActions', () => {
    it('should have all required destructive actions', () => {
      expect(DestructiveActions).toBeDefined();
      expect(DestructiveActions.DELETE_ACCOUNT).toBeDefined();
      expect(DestructiveActions.DELETE_SPOT).toBeDefined();
      expect(DestructiveActions.LEAVE_GROUP).toBeDefined();
      expect(DestructiveActions.BLOCK_USER).toBeDefined();
    });

    it('should have correct structure for each action', () => {
      Object.values(DestructiveActions).forEach(action => {
        expect(action).toHaveProperty('id');
        expect(action).toHaveProperty('label');
        expect(action).toHaveProperty('icon');
        expect(action).toHaveProperty('severity');
        expect(action).toHaveProperty('requiresTimer');
        expect(action).toHaveProperty('timerDuration');
        expect(action).toHaveProperty('warningMessage');
        expect(typeof action.id).toBe('string');
        expect(typeof action.label).toBe('string');
      });
    });

    it('should have DELETE_ACCOUNT as critical severity', () => {
      expect(DestructiveActions.DELETE_ACCOUNT.severity).toBe('critical');
      expect(DestructiveActions.DELETE_ACCOUNT.requiresTimer).toBe(true);
    });

    it('should have DELETE_SPOT with timer requirement', () => {
      expect(DestructiveActions.DELETE_SPOT.requiresTimer).toBe(true);
      expect(DestructiveActions.DELETE_SPOT.timerDuration).toBeGreaterThan(0);
    });

    it('should have LEAVE_GROUP without timer requirement', () => {
      expect(DestructiveActions.LEAVE_GROUP.requiresTimer).toBe(false);
    });

    it('should have BLOCK_USER without timer requirement', () => {
      expect(DestructiveActions.BLOCK_USER.requiresTimer).toBe(false);
    });
  });

  describe('SeverityLevels', () => {
    it('should have all severity levels defined', () => {
      expect(SeverityLevels.low).toBeDefined();
      expect(SeverityLevels.medium).toBeDefined();
      expect(SeverityLevels.high).toBeDefined();
      expect(SeverityLevels.critical).toBeDefined();
    });

    it('should have color properties for each level', () => {
      Object.values(SeverityLevels).forEach(level => {
        expect(level).toHaveProperty('color');
        expect(level).toHaveProperty('bgClass');
        expect(level).toHaveProperty('textClass');
      });
    });
  });

  describe('getActionConfig', () => {
    it('should return action config for valid action ID', () => {
      const config = getActionConfig('delete_account');

      expect(config).toBeDefined();
      expect(config.id).toBe('delete_account');
      expect(config.label).toBe('Supprimer le compte');
    });

    it('should return null for invalid action ID', () => {
      const config = getActionConfig('invalid_action');

      expect(config).toBeNull();
    });

    it('should return null for empty action ID', () => {
      expect(getActionConfig('')).toBeNull();
    });

    it('should return null for null action ID', () => {
      expect(getActionConfig(null)).toBeNull();
    });

    it('should return null for undefined action ID', () => {
      expect(getActionConfig(undefined)).toBeNull();
    });
  });

  describe('requiresConfirmation', () => {
    it('should return true for DELETE_ACCOUNT', () => {
      expect(requiresConfirmation('delete_account')).toBe(true);
    });

    it('should return true for DELETE_SPOT', () => {
      expect(requiresConfirmation('delete_spot')).toBe(true);
    });

    it('should return true for LEAVE_GROUP', () => {
      expect(requiresConfirmation('leave_group')).toBe(true);
    });

    it('should return true for BLOCK_USER', () => {
      expect(requiresConfirmation('block_user')).toBe(true);
    });

    it('should return false for unknown action', () => {
      expect(requiresConfirmation('unknown_action')).toBe(false);
    });

    it('should return false for empty action', () => {
      expect(requiresConfirmation('')).toBe(false);
    });
  });

  describe('requiresTimer', () => {
    it('should return true for DELETE_ACCOUNT', () => {
      expect(requiresTimer('delete_account')).toBe(true);
    });

    it('should return true for DELETE_SPOT', () => {
      expect(requiresTimer('delete_spot')).toBe(true);
    });

    it('should return false for LEAVE_GROUP', () => {
      expect(requiresTimer('leave_group')).toBe(false);
    });

    it('should return false for BLOCK_USER', () => {
      expect(requiresTimer('block_user')).toBe(false);
    });

    it('should return false for unknown action', () => {
      expect(requiresTimer('unknown_action')).toBe(false);
    });
  });

  describe('getTimerDuration', () => {
    it('should return 5000ms for DELETE_ACCOUNT', () => {
      expect(getTimerDuration('delete_account')).toBe(5000);
    });

    it('should return 5000ms for DELETE_SPOT', () => {
      expect(getTimerDuration('delete_spot')).toBe(5000);
    });

    it('should return 0 for actions without timer', () => {
      expect(getTimerDuration('leave_group')).toBe(0);
    });

    it('should return 0 for unknown action', () => {
      expect(getTimerDuration('unknown_action')).toBe(0);
    });
  });

  describe('getSeverityLevel', () => {
    it('should return critical for DELETE_ACCOUNT', () => {
      expect(getSeverityLevel('delete_account')).toBe('critical');
    });

    it('should return high for DELETE_SPOT', () => {
      expect(getSeverityLevel('delete_spot')).toBe('high');
    });

    it('should return medium for LEAVE_GROUP', () => {
      expect(getSeverityLevel('leave_group')).toBe('medium');
    });

    it('should return low for unknown action', () => {
      expect(getSeverityLevel('unknown_action')).toBe('low');
    });
  });

  describe('confirmDestructiveAction', () => {
    it('should create confirmation for valid action', () => {
      const result = confirmDestructiveAction('delete_account');

      expect(result.success).toBe(true);
      expect(result.confirmation).toBeDefined();
      expect(result.confirmation.actionId).toBe('delete_account');
    });

    it('should fail for invalid action', () => {
      const result = confirmDestructiveAction('invalid_action');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_action');
    });

    it('should set targetId from options', () => {
      const result = confirmDestructiveAction('delete_spot', {
        targetId: 'spot123',
      });

      expect(result.confirmation.targetId).toBe('spot123');
    });

    it('should set targetName from options', () => {
      const result = confirmDestructiveAction('block_user', {
        targetName: 'JohnDoe',
      });

      expect(result.confirmation.targetName).toBe('JohnDoe');
    });

    it('should set onConfirm callback', () => {
      const callback = vi.fn();
      const result = confirmDestructiveAction('leave_group', {
        onConfirm: callback,
      });

      expect(result.confirmation.onConfirm).toBe(callback);
    });

    it('should set onCancel callback', () => {
      const callback = vi.fn();
      const result = confirmDestructiveAction('leave_group', {
        onCancel: callback,
      });

      expect(result.confirmation.onCancel).toBe(callback);
    });

    it('should set metadata from options', () => {
      const result = confirmDestructiveAction('delete_account', {
        metadata: { reason: 'user_request' },
      });

      expect(result.confirmation.metadata.reason).toBe('user_request');
    });

    it('should set createdAt timestamp', () => {
      const result = confirmDestructiveAction('delete_account');

      expect(result.confirmation.createdAt).toBeDefined();
      const date = new Date(result.confirmation.createdAt);
      expect(date).toBeInstanceOf(Date);
    });

    it('should cancel previous confirmation when starting new one', () => {
      confirmDestructiveAction('delete_account');
      const result = confirmDestructiveAction('delete_spot');

      expect(result.success).toBe(true);
      expect(result.confirmation.actionId).toBe('delete_spot');
    });
  });

  describe('getCurrentConfirmation', () => {
    it('should return null when no active confirmation', () => {
      expect(getCurrentConfirmation()).toBeNull();
    });

    it('should return current confirmation when active', () => {
      confirmDestructiveAction('delete_account');

      const current = getCurrentConfirmation();

      expect(current).toBeDefined();
      expect(current.actionId).toBe('delete_account');
    });

    it('should return null after cancellation', () => {
      confirmDestructiveAction('delete_account');
      cancelConfirmation();

      expect(getCurrentConfirmation()).toBeNull();
    });
  });

  describe('getRemainingTime', () => {
    it('should return 0 when no active confirmation', () => {
      expect(getRemainingTime()).toBe(0);
    });

    it('should return timer duration at start', () => {
      confirmDestructiveAction('delete_account');

      const remaining = getRemainingTime();

      expect(remaining).toBeGreaterThan(4900);
      expect(remaining).toBeLessThanOrEqual(5000);
    });

    it('should decrease over time', () => {
      confirmDestructiveAction('delete_account');

      vi.advanceTimersByTime(2000);
      const remaining = getRemainingTime();

      expect(remaining).toBeLessThanOrEqual(3100);
      expect(remaining).toBeGreaterThan(2900);
    });

    it('should return 0 after timer completes', () => {
      confirmDestructiveAction('delete_account');

      vi.advanceTimersByTime(6000);
      const remaining = getRemainingTime();

      expect(remaining).toBe(0);
    });

    it('should return 0 for actions without timer', () => {
      confirmDestructiveAction('leave_group');

      expect(getRemainingTime()).toBe(0);
    });
  });

  describe('isTimerComplete', () => {
    it('should return false when no active confirmation', () => {
      expect(isTimerComplete()).toBe(false);
    });

    it('should return false at start for actions with timer', () => {
      confirmDestructiveAction('delete_account');

      expect(isTimerComplete()).toBe(false);
    });

    it('should return true after timer completes', () => {
      confirmDestructiveAction('delete_account');

      vi.advanceTimersByTime(5100);

      expect(isTimerComplete()).toBe(true);
    });

    it('should return true immediately for actions without timer', () => {
      confirmDestructiveAction('leave_group');

      expect(isTimerComplete()).toBe(true);
    });
  });

  describe('executeConfirmation', () => {
    it('should fail when no active confirmation', () => {
      const result = executeConfirmation();

      expect(result.success).toBe(false);
      expect(result.error).toBe('no_active_confirmation');
    });

    it('should fail when timer not complete', () => {
      confirmDestructiveAction('delete_account');

      const result = executeConfirmation();

      expect(result.success).toBe(false);
      expect(result.error).toBe('timer_not_complete');
      expect(showToast).toHaveBeenCalled();
    });

    it('should succeed after timer completes', () => {
      confirmDestructiveAction('delete_account');
      vi.advanceTimersByTime(5100);

      const result = executeConfirmation();

      expect(result.success).toBe(true);
    });

    it('should succeed immediately for actions without timer', () => {
      confirmDestructiveAction('leave_group');

      const result = executeConfirmation();

      expect(result.success).toBe(true);
    });

    it('should call onConfirm callback', () => {
      const callback = vi.fn();
      confirmDestructiveAction('leave_group', { onConfirm: callback });

      executeConfirmation();

      expect(callback).toHaveBeenCalled();
    });

    it('should set confirmedAt timestamp', () => {
      confirmDestructiveAction('leave_group');

      const result = executeConfirmation();

      expect(result.confirmation.confirmedAt).toBeDefined();
    });

    it('should save to history', () => {
      confirmDestructiveAction('leave_group', { targetId: 'group123' });
      executeConfirmation();

      const history = getConfirmationHistory();

      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].actionId).toBe('leave_group');
    });

    it('should clear current confirmation after execution', () => {
      confirmDestructiveAction('leave_group');
      executeConfirmation();

      expect(getCurrentConfirmation()).toBeNull();
    });

    it('should show success toast', () => {
      confirmDestructiveAction('leave_group');
      executeConfirmation();

      expect(showToast).toHaveBeenCalledWith(expect.any(String), 'success');
    });
  });

  describe('cancelConfirmation', () => {
    it('should return error when no active confirmation', () => {
      const result = cancelConfirmation();

      expect(result.success).toBe(false);
      expect(result.error).toBe('no_active_confirmation');
    });

    it('should successfully cancel active confirmation', () => {
      confirmDestructiveAction('delete_account');

      const result = cancelConfirmation();

      expect(result.success).toBe(true);
    });

    it('should call onCancel callback', () => {
      const callback = vi.fn();
      confirmDestructiveAction('delete_account', { onCancel: callback });

      cancelConfirmation();

      expect(callback).toHaveBeenCalled();
    });

    it('should clear current confirmation', () => {
      confirmDestructiveAction('delete_account');
      cancelConfirmation();

      expect(getCurrentConfirmation()).toBeNull();
    });

    it('should show info toast', () => {
      confirmDestructiveAction('delete_account');
      cancelConfirmation();

      expect(showToast).toHaveBeenCalledWith(expect.any(String), 'info');
    });
  });

  describe('getConfirmationHistory', () => {
    it('should return empty array when no history', () => {
      const history = getConfirmationHistory();

      expect(history).toEqual([]);
    });

    it('should return history after confirmations', () => {
      confirmDestructiveAction('leave_group', { targetId: 'group1' });
      executeConfirmation();

      confirmDestructiveAction('leave_group', { targetId: 'group2' });
      executeConfirmation();

      const history = getConfirmationHistory();

      expect(history.length).toBe(2);
    });

    it('should include correct action data', () => {
      confirmDestructiveAction('block_user', {
        targetId: 'user123',
        targetName: 'TestUser',
      });
      executeConfirmation();

      const history = getConfirmationHistory();

      expect(history[0].actionId).toBe('block_user');
      expect(history[0].targetId).toBe('user123');
      expect(history[0].targetName).toBe('TestUser');
    });
  });

  describe('clearConfirmationHistory', () => {
    it('should clear history successfully', () => {
      confirmDestructiveAction('leave_group');
      executeConfirmation();

      const result = clearConfirmationHistory();

      expect(result.success).toBe(true);
      expect(getConfirmationHistory()).toEqual([]);
    });

    it('should work when history is empty', () => {
      const result = clearConfirmationHistory();

      expect(result.success).toBe(true);
    });
  });

  describe('renderConfirmationModal', () => {
    it('should return empty string when no active confirmation', () => {
      const html = renderConfirmationModal();

      expect(html).toBe('');
    });

    it('should render modal with action label', () => {
      confirmDestructiveAction('delete_account');

      const html = renderConfirmationModal();

      expect(html).toContain('Supprimer le compte');
    });

    it('should render modal with target name', () => {
      confirmDestructiveAction('block_user', { targetName: 'JohnDoe' });

      const html = renderConfirmationModal();

      expect(html).toContain('JohnDoe');
    });

    it('should include warning message', () => {
      confirmDestructiveAction('delete_account');

      const html = renderConfirmationModal();

      expect(html).toContain('irreversible');
    });

    it('should include timer for actions with timer', () => {
      confirmDestructiveAction('delete_account');

      const html = renderConfirmationModal();

      expect(html).toContain('safety-timer-container');
      expect(html).toContain('timer-display');
    });

    it('should not include timer for actions without timer', () => {
      confirmDestructiveAction('leave_group');

      const html = renderConfirmationModal();

      expect(html).not.toContain('safety-timer-container');
    });

    it('should include cancel button', () => {
      confirmDestructiveAction('delete_account');

      const html = renderConfirmationModal();

      expect(html).toContain('cancelDestructiveConfirmation');
      expect(html).toContain('Annuler');
    });

    it('should include confirm button', () => {
      confirmDestructiveAction('delete_account');

      const html = renderConfirmationModal();

      expect(html).toContain('executeDestructiveConfirmation');
      expect(html).toContain('Confirmer');
    });

    it('should disable confirm button when timer not complete', () => {
      confirmDestructiveAction('delete_account');

      const html = renderConfirmationModal();

      expect(html).toContain('disabled');
      expect(html).toContain('cursor-not-allowed');
    });

    it('should have proper accessibility attributes', () => {
      confirmDestructiveAction('delete_account');

      const html = renderConfirmationModal();

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby');
    });

    it('should show severity badge', () => {
      confirmDestructiveAction('delete_account');

      const html = renderConfirmationModal();

      expect(html).toContain('CRITICAL');
    });

    it('should use gradient based on severity', () => {
      confirmDestructiveAction('delete_account');

      const html = renderConfirmationModal();

      expect(html).toContain('from-danger-600');
    });
  });

  describe('renderDestructiveButton', () => {
    it('should render button for valid action', () => {
      const html = renderDestructiveButton('delete_account');

      expect(html).toContain('openDestructiveConfirmation');
      expect(html).toContain('Supprimer le compte');
    });

    it('should return empty string for invalid action', () => {
      const html = renderDestructiveButton('invalid_action');

      expect(html).toBe('');
    });

    it('should include target ID in onclick', () => {
      const html = renderDestructiveButton('delete_spot', 'spot123');

      expect(html).toContain("'spot123'");
    });

    it('should include target name in onclick', () => {
      const html = renderDestructiveButton('block_user', 'user123', 'JohnDoe');

      expect(html).toContain("'JohnDoe'");
    });

    it('should include action icon', () => {
      const html = renderDestructiveButton('delete_account');

      expect(html).toContain('fa-user-slash');
    });

    it('should have data attributes', () => {
      const html = renderDestructiveButton('delete_spot', 'spot123');

      expect(html).toContain('data-action="delete_spot"');
      expect(html).toContain('data-target="spot123"');
    });

    it('should have proper aria-label', () => {
      const html = renderDestructiveButton('block_user', 'user123', 'JohnDoe');

      expect(html).toContain('aria-label');
      expect(html).toContain('JohnDoe');
    });

    it('should apply custom className', () => {
      const html = renderDestructiveButton('leave_group', '', '', {
        className: 'custom-class',
      });

      expect(html).toContain('custom-class');
    });
  });

  describe('getDestructiveActions', () => {
    it('should return array of all actions', () => {
      const actions = getDestructiveActions();

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should include DELETE_ACCOUNT', () => {
      const actions = getDestructiveActions();
      const ids = actions.map(a => a.id);

      expect(ids).toContain('delete_account');
    });

    it('should include all DestructiveActions values', () => {
      const actions = getDestructiveActions();
      const actionIds = actions.map(a => a.id);

      Object.values(DestructiveActions).forEach(da => {
        expect(actionIds).toContain(da.id);
      });
    });
  });

  describe('getActionsBySeverity', () => {
    it('should return actions with critical severity', () => {
      const actions = getActionsBySeverity('critical');

      expect(actions.length).toBeGreaterThan(0);
      actions.forEach(a => {
        expect(a.severity).toBe('critical');
      });
    });

    it('should return actions with medium severity', () => {
      const actions = getActionsBySeverity('medium');

      expect(actions.length).toBeGreaterThan(0);
      actions.forEach(a => {
        expect(a.severity).toBe('medium');
      });
    });

    it('should return empty array for invalid severity', () => {
      const actions = getActionsBySeverity('invalid');

      expect(actions).toEqual([]);
    });

    it('should return empty array for empty severity', () => {
      const actions = getActionsBySeverity('');

      expect(actions).toEqual([]);
    });
  });

  describe('getDestructiveActionStats', () => {
    it('should return stats object', () => {
      const stats = getDestructiveActionStats();

      expect(stats).toHaveProperty('totalConfirmed');
      expect(stats).toHaveProperty('actionBreakdown');
      expect(stats).toHaveProperty('lastConfirmation');
      expect(stats).toHaveProperty('availableActions');
    });

    it('should return zero total when no history', () => {
      const stats = getDestructiveActionStats();

      expect(stats.totalConfirmed).toBe(0);
    });

    it('should count confirmed actions', () => {
      confirmDestructiveAction('leave_group');
      executeConfirmation();
      confirmDestructiveAction('block_user');
      executeConfirmation();

      const stats = getDestructiveActionStats();

      expect(stats.totalConfirmed).toBe(2);
    });

    it('should provide action breakdown', () => {
      confirmDestructiveAction('leave_group');
      executeConfirmation();
      confirmDestructiveAction('leave_group');
      executeConfirmation();
      confirmDestructiveAction('block_user');
      executeConfirmation();

      const stats = getDestructiveActionStats();

      expect(stats.actionBreakdown.leave_group).toBe(2);
      expect(stats.actionBreakdown.block_user).toBe(1);
    });

    it('should return last confirmation', () => {
      confirmDestructiveAction('leave_group', { targetId: 'group1' });
      executeConfirmation();
      confirmDestructiveAction('block_user', { targetId: 'user1' });
      executeConfirmation();

      const stats = getDestructiveActionStats();

      expect(stats.lastConfirmation.actionId).toBe('block_user');
    });

    it('should count available actions', () => {
      const stats = getDestructiveActionStats();

      expect(stats.availableActions).toBe(Object.keys(DestructiveActions).length);
    });
  });

  describe('Global window handlers', () => {
    it('should define openDestructiveConfirmation on window', () => {
      expect(typeof window.openDestructiveConfirmation).toBe('function');
    });

    it('should define cancelDestructiveConfirmation on window', () => {
      expect(typeof window.cancelDestructiveConfirmation).toBe('function');
    });

    it('should define executeDestructiveConfirmation on window', () => {
      expect(typeof window.executeDestructiveConfirmation).toBe('function');
    });

    it('should open confirmation via window handler', () => {
      window.openDestructiveConfirmation('delete_account', 'acc123', 'TestAccount');

      const current = getCurrentConfirmation();

      expect(current).toBeDefined();
      expect(current.actionId).toBe('delete_account');
    });

    it('should cancel via window handler', () => {
      window.openDestructiveConfirmation('leave_group');
      window.cancelDestructiveConfirmation();

      expect(getCurrentConfirmation()).toBeNull();
    });

    it('should execute via window handler', () => {
      window.openDestructiveConfirmation('leave_group');
      window.executeDestructiveConfirmation();

      expect(getCurrentConfirmation()).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle callback errors gracefully', () => {
      const badCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      confirmDestructiveAction('leave_group', { onConfirm: badCallback });

      // Should not throw
      expect(() => executeConfirmation()).not.toThrow();
    });

    it('should handle cancel callback errors gracefully', () => {
      const badCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      confirmDestructiveAction('leave_group', { onCancel: badCallback });

      // Should not throw
      expect(() => cancelConfirmation()).not.toThrow();
    });

    it('should handle multiple rapid confirmations', () => {
      for (let i = 0; i < 5; i++) {
        confirmDestructiveAction('leave_group', { targetId: `group${i}` });
      }

      const current = getCurrentConfirmation();

      expect(current.targetId).toBe('group4');
    });

    it('should handle empty metadata object', () => {
      const result = confirmDestructiveAction('delete_account', {
        metadata: {},
      });

      expect(result.success).toBe(true);
      expect(result.confirmation.metadata).toEqual({});
    });

    it('should handle null options', () => {
      const result = confirmDestructiveAction('delete_account', null);

      expect(result.success).toBe(true);
    });
  });

  describe('Integration tests', () => {
    it('should complete full confirmation cycle with timer', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      // Start confirmation
      const startResult = confirmDestructiveAction('delete_account', {
        targetId: 'acc123',
        targetName: 'Test Account',
        onConfirm,
        onCancel,
      });

      expect(startResult.success).toBe(true);
      expect(getCurrentConfirmation()).toBeDefined();

      // Try to execute before timer (should fail)
      const earlyResult = executeConfirmation();
      expect(earlyResult.success).toBe(false);
      expect(onConfirm).not.toHaveBeenCalled();

      // Recreate confirmation (was cleaned up on early attempt)
      confirmDestructiveAction('delete_account', {
        targetId: 'acc123',
        targetName: 'Test Account',
        onConfirm,
        onCancel,
      });

      // Advance timer
      vi.advanceTimersByTime(5100);

      // Execute after timer (should succeed)
      const lateResult = executeConfirmation();
      expect(lateResult.success).toBe(true);
      expect(onConfirm).toHaveBeenCalled();
      expect(getCurrentConfirmation()).toBeNull();
    });

    it('should complete full confirmation cycle without timer', () => {
      const onConfirm = vi.fn();

      // Start confirmation
      confirmDestructiveAction('leave_group', {
        targetId: 'group123',
        onConfirm,
      });

      // Should be able to execute immediately
      const result = executeConfirmation();

      expect(result.success).toBe(true);
      expect(onConfirm).toHaveBeenCalled();
    });

    it('should properly cancel confirmation', () => {
      const onCancel = vi.fn();

      confirmDestructiveAction('delete_account', { onCancel });
      cancelConfirmation();

      expect(onCancel).toHaveBeenCalled();
      expect(getCurrentConfirmation()).toBeNull();
    });

    it('should render modal correctly during confirmation', () => {
      confirmDestructiveAction('delete_account', {
        targetId: 'acc123',
        targetName: 'My Account',
      });

      const html = renderConfirmationModal();

      expect(html).toContain('Supprimer le compte');
      expect(html).toContain('My Account');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('CRITICAL');
    });
  });
});
