/**
 * Moderator Roles Service Tests
 * Feature #216 - Tests pour le service de gestion des roles de moderation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock state
let mockState = {
  user: null,
  moderatorRoles: {},
};

// Mock storage
let mockStorage = {};

// Mock modules BEFORE imports
vi.mock('../src/stores/state.js', () => ({
  getState: () => mockState,
  setState: (newState) => {
    mockState = { ...mockState, ...newState };
  },
}));

vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: (key) => mockStorage[key] || null,
    set: (key, value) => {
      mockStorage[key] = value;
    },
    remove: (key) => {
      delete mockStorage[key];
    },
  },
}));

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

vi.mock('../src/i18n/index.js', () => ({
  t: (key) => key,
}));

// Mock document for escapeHTML
global.document = {
  createElement: () => ({
    textContent: '',
    get innerHTML() {
      return this.textContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
  }),
};

// Mock window
global.window = {};

// Import AFTER mocks are set up
import {
  RoleLevel,
  Roles,
  Permissions,
  getRoleById,
  getAllRoles,
  getAssignableRoles,
  assignRole,
  removeRole,
  getUserRole,
  getUserRoleInfo,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  isModerator,
  isAdmin,
  canPerformAction,
  getModeratorsList,
  getModeratorCounts,
  getModerationHistory,
  renderRoleBadge,
  renderModeratorPanel,
  renderRoleSelect,
  initializeWithAdmin,
} from '../src/services/moderatorRoles.js';

describe('Moderator Roles Service', () => {
  beforeEach(() => {
    // Reset mock state
    mockState = {
      user: null,
      moderatorRoles: {},
    };
    // Reset mock storage
    mockStorage = {};
    vi.clearAllMocks();
  });

  // ============================================
  // ROLE LEVEL TESTS
  // ============================================

  describe('RoleLevel', () => {
    it('should define correct hierarchy levels', () => {
      expect(RoleLevel.USER).toBe(0);
      expect(RoleLevel.HELPER).toBe(1);
      expect(RoleLevel.MODERATOR).toBe(2);
      expect(RoleLevel.SENIOR_MODERATOR).toBe(3);
      expect(RoleLevel.ADMIN).toBe(4);
    });

    it('should have USER as lowest level', () => {
      expect(RoleLevel.USER).toBeLessThan(RoleLevel.HELPER);
      expect(RoleLevel.USER).toBeLessThan(RoleLevel.MODERATOR);
      expect(RoleLevel.USER).toBeLessThan(RoleLevel.ADMIN);
    });

    it('should have ADMIN as highest level', () => {
      expect(RoleLevel.ADMIN).toBeGreaterThan(RoleLevel.USER);
      expect(RoleLevel.ADMIN).toBeGreaterThan(RoleLevel.HELPER);
      expect(RoleLevel.ADMIN).toBeGreaterThan(RoleLevel.MODERATOR);
      expect(RoleLevel.ADMIN).toBeGreaterThan(RoleLevel.SENIOR_MODERATOR);
    });
  });

  // ============================================
  // ROLES DEFINITION TESTS
  // ============================================

  describe('Roles', () => {
    it('should define 5 roles', () => {
      expect(Object.keys(Roles)).toHaveLength(5);
    });

    it('should have all required properties for each role', () => {
      Object.values(Roles).forEach(role => {
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('level');
        expect(role).toHaveProperty('label');
        expect(role).toHaveProperty('labelEn');
        expect(role).toHaveProperty('color');
        expect(role).toHaveProperty('icon');
        expect(role).toHaveProperty('description');
        expect(role).toHaveProperty('permissions');
        expect(Array.isArray(role.permissions)).toBe(true);
      });
    });

    it('should have USER role with no permissions', () => {
      expect(Roles.USER.id).toBe('user');
      expect(Roles.USER.permissions).toHaveLength(0);
    });

    it('should have HELPER role with limited permissions', () => {
      expect(Roles.HELPER.id).toBe('helper');
      expect(Roles.HELPER.permissions).toContain('flag_content');
      expect(Roles.HELPER.permissions).toContain('view_reports');
      expect(Roles.HELPER.permissions).not.toContain('ban_perm');
    });

    it('should have MODERATOR role with moderation permissions', () => {
      expect(Roles.MODERATOR.id).toBe('moderator');
      expect(Roles.MODERATOR.permissions).toContain('warn_user');
      expect(Roles.MODERATOR.permissions).toContain('mute_user');
      expect(Roles.MODERATOR.permissions).toContain('delete_content');
      expect(Roles.MODERATOR.permissions).not.toContain('ban_perm');
    });

    it('should have SENIOR_MODERATOR role with extended permissions', () => {
      expect(Roles.SENIOR_MODERATOR.id).toBe('senior_moderator');
      expect(Roles.SENIOR_MODERATOR.permissions).toContain('ban_temp');
      expect(Roles.SENIOR_MODERATOR.permissions).toContain('manage_helpers');
      expect(Roles.SENIOR_MODERATOR.permissions).not.toContain('ban_perm');
    });

    it('should have ADMIN role with all permissions', () => {
      expect(Roles.ADMIN.id).toBe('admin');
      expect(Roles.ADMIN.permissions).toContain('ban_perm');
      expect(Roles.ADMIN.permissions).toContain('manage_moderators');
      expect(Roles.ADMIN.permissions).toContain('configure_system');
    });
  });

  // ============================================
  // PERMISSIONS DEFINITION TESTS
  // ============================================

  describe('Permissions', () => {
    it('should define all permissions with required properties', () => {
      Object.values(Permissions).forEach(perm => {
        expect(perm).toHaveProperty('id');
        expect(perm).toHaveProperty('label');
        expect(perm).toHaveProperty('description');
        expect(perm).toHaveProperty('minRole');
      });
    });

    it('should have at least 10 permissions defined', () => {
      expect(Object.keys(Permissions).length).toBeGreaterThanOrEqual(10);
    });

    it('should define ban_perm permission requiring admin', () => {
      expect(Permissions.BAN_PERM.minRole).toBe('admin');
    });

    it('should define ban_temp permission requiring senior_moderator', () => {
      expect(Permissions.BAN_TEMP.minRole).toBe('senior_moderator');
    });

    it('should define warn_user permission requiring moderator', () => {
      expect(Permissions.WARN_USER.minRole).toBe('moderator');
    });
  });

  // ============================================
  // getRoleById TESTS
  // ============================================

  describe('getRoleById', () => {
    it('should return null for null input', () => {
      expect(getRoleById(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getRoleById(undefined)).toBeNull();
    });

    it('should return null for invalid role', () => {
      expect(getRoleById('invalid_role')).toBeNull();
    });

    it('should return role for valid lowercase id', () => {
      const role = getRoleById('admin');
      expect(role).not.toBeNull();
      expect(role.id).toBe('admin');
    });

    it('should return role for valid uppercase id', () => {
      const role = getRoleById('MODERATOR');
      expect(role).not.toBeNull();
      expect(role.id).toBe('moderator');
    });

    it('should return role for mixed case id', () => {
      const role = getRoleById('Helper');
      expect(role).not.toBeNull();
      expect(role.id).toBe('helper');
    });
  });

  // ============================================
  // getAllRoles TESTS
  // ============================================

  describe('getAllRoles', () => {
    it('should return array of all roles', () => {
      const roles = getAllRoles();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBe(5);
    });

    it('should include user role', () => {
      const roles = getAllRoles();
      const userRole = roles.find(r => r.id === 'user');
      expect(userRole).toBeDefined();
    });

    it('should include admin role', () => {
      const roles = getAllRoles();
      const adminRole = roles.find(r => r.id === 'admin');
      expect(adminRole).toBeDefined();
    });
  });

  // ============================================
  // getAssignableRoles TESTS
  // ============================================

  describe('getAssignableRoles', () => {
    it('should return empty array for invalid role', () => {
      const assignable = getAssignableRoles('invalid');
      expect(assignable).toEqual([]);
    });

    it('should return empty array for user role', () => {
      const assignable = getAssignableRoles('user');
      expect(assignable).toEqual([]);
    });

    it('should return empty array for helper role', () => {
      const assignable = getAssignableRoles('helper');
      expect(assignable).toEqual([]);
    });

    it('should return helper for senior_moderator', () => {
      const assignable = getAssignableRoles('senior_moderator');
      expect(assignable.some(r => r.id === 'helper')).toBe(true);
      expect(assignable.some(r => r.id === 'moderator')).toBe(false);
    });

    it('should return multiple roles for admin', () => {
      const assignable = getAssignableRoles('admin');
      expect(assignable.length).toBeGreaterThan(0);
      expect(assignable.some(r => r.id === 'helper')).toBe(true);
      expect(assignable.some(r => r.id === 'moderator')).toBe(true);
      expect(assignable.some(r => r.id === 'senior_moderator')).toBe(true);
      expect(assignable.some(r => r.id === 'admin')).toBe(false);
    });
  });

  // ============================================
  // assignRole TESTS
  // ============================================

  describe('assignRole', () => {
    it('should fail without user ID', () => {
      const result = assignRole(null, 'moderator');
      expect(result.success).toBe(false);
      expect(result.error).toBe('user_id_required');
    });

    it('should fail without role', () => {
      const result = assignRole('user123', null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('role_required');
    });

    it('should fail for invalid role', () => {
      const result = assignRole('user123', 'invalid_role');
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_role');
    });

    it('should succeed with skipPermissionCheck', () => {
      const result = assignRole('user123', 'moderator', { skipPermissionCheck: true });
      expect(result.success).toBe(true);
      expect(result.assignment).toBeDefined();
      expect(result.assignment.role).toBe('moderator');
    });

    it('should store assignment in storage', () => {
      assignRole('user123', 'helper', { skipPermissionCheck: true });
      expect(mockStorage['spothitch_role_assignments']).toBeDefined();
    });

    it('should fail when assigning to self without selfAssign flag', () => {
      mockState.user = { uid: 'user123' };
      const result = assignRole('user123', 'moderator', { skipPermissionCheck: true });
      expect(result.success).toBe(false);
      expect(result.error).toBe('cannot_assign_self');
    });

    it('should succeed when assigning to self with selfAssign flag', () => {
      mockState.user = { uid: 'user123' };
      const result = assignRole('user123', 'moderator', {
        skipPermissionCheck: true,
        selfAssign: true
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // removeRole TESTS
  // ============================================

  describe('removeRole', () => {
    beforeEach(() => {
      // Setup a moderator
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
    });

    it('should fail without user ID', () => {
      const result = removeRole(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('user_id_required');
    });

    it('should fail for user already at user role', () => {
      const result = removeRole('regular_user', { skipPermissionCheck: true });
      expect(result.success).toBe(false);
      expect(result.error).toBe('already_user');
    });

    it('should succeed with skipPermissionCheck', () => {
      const result = removeRole('mod123', { skipPermissionCheck: true });
      expect(result.success).toBe(true);
      expect(result.oldRole).toBe('moderator');
    });

    it('should revert user to user role', () => {
      removeRole('mod123', { skipPermissionCheck: true });
      const role = getUserRole('mod123');
      expect(role).toBe('user');
    });
  });

  // ============================================
  // getUserRole TESTS
  // ============================================

  describe('getUserRole', () => {
    it('should return user for null input', () => {
      expect(getUserRole(null)).toBe('user');
    });

    it('should return user for undefined input', () => {
      expect(getUserRole(undefined)).toBe('user');
    });

    it('should return user for unknown user', () => {
      expect(getUserRole('unknown_user')).toBe('user');
    });

    it('should return assigned role', () => {
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      expect(getUserRole('mod123')).toBe('moderator');
    });

    it('should return admin role when assigned', () => {
      assignRole('admin123', 'admin', { skipPermissionCheck: true, selfAssign: true });
      expect(getUserRole('admin123')).toBe('admin');
    });
  });

  // ============================================
  // getUserRoleInfo TESTS
  // ============================================

  describe('getUserRoleInfo', () => {
    it('should return USER role for null input', () => {
      const info = getUserRoleInfo(null);
      expect(info.role.id).toBe('user');
      expect(info.assignment).toBeNull();
    });

    it('should return assignment details for assigned user', () => {
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      const info = getUserRoleInfo('mod123');
      expect(info.role.id).toBe('moderator');
      expect(info.assignment).not.toBeNull();
      expect(info.assignment.role).toBe('moderator');
    });

    it('should include assignedAt timestamp', () => {
      assignRole('mod123', 'helper', { skipPermissionCheck: true });
      const info = getUserRoleInfo('mod123');
      expect(info.assignment.assignedAt).toBeDefined();
    });
  });

  // ============================================
  // hasPermission TESTS
  // ============================================

  describe('hasPermission', () => {
    it('should return false for null user', () => {
      expect(hasPermission(null, 'warn_user')).toBe(false);
    });

    it('should return false for null permission', () => {
      expect(hasPermission('user123', null)).toBe(false);
    });

    it('should return false for regular user', () => {
      expect(hasPermission('regular_user', 'warn_user')).toBe(false);
    });

    it('should return true for moderator with warn_user', () => {
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      expect(hasPermission('mod123', 'warn_user')).toBe(true);
    });

    it('should return false for moderator with ban_perm', () => {
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      expect(hasPermission('mod123', 'ban_perm')).toBe(false);
    });

    it('should return true for admin with ban_perm', () => {
      assignRole('admin123', 'admin', { skipPermissionCheck: true, selfAssign: true });
      expect(hasPermission('admin123', 'ban_perm')).toBe(true);
    });
  });

  // ============================================
  // hasAnyPermission TESTS
  // ============================================

  describe('hasAnyPermission', () => {
    it('should return false for non-array input', () => {
      expect(hasAnyPermission('user123', 'warn_user')).toBe(false);
    });

    it('should return false when user has none of the permissions', () => {
      expect(hasAnyPermission('regular_user', ['ban_perm', 'ban_temp'])).toBe(false);
    });

    it('should return true when user has one of the permissions', () => {
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      expect(hasAnyPermission('mod123', ['ban_perm', 'warn_user'])).toBe(true);
    });
  });

  // ============================================
  // hasAllPermissions TESTS
  // ============================================

  describe('hasAllPermissions', () => {
    it('should return false for non-array input', () => {
      expect(hasAllPermissions('user123', 'warn_user')).toBe(false);
    });

    it('should return false when user is missing one permission', () => {
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      expect(hasAllPermissions('mod123', ['warn_user', 'ban_perm'])).toBe(false);
    });

    it('should return true when user has all permissions', () => {
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      expect(hasAllPermissions('mod123', ['warn_user', 'mute_user'])).toBe(true);
    });
  });

  // ============================================
  // getUserPermissions TESTS
  // ============================================

  describe('getUserPermissions', () => {
    it('should return empty array for regular user', () => {
      const perms = getUserPermissions('regular_user');
      expect(perms).toEqual([]);
    });

    it('should return permissions array for moderator', () => {
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      const perms = getUserPermissions('mod123');
      expect(Array.isArray(perms)).toBe(true);
      expect(perms.length).toBeGreaterThan(0);
    });

    it('should include all admin permissions', () => {
      assignRole('admin123', 'admin', { skipPermissionCheck: true, selfAssign: true });
      const perms = getUserPermissions('admin123');
      expect(perms).toContain('ban_perm');
      expect(perms).toContain('configure_system');
    });
  });

  // ============================================
  // isModerator TESTS
  // ============================================

  describe('isModerator', () => {
    it('should return false for regular user', () => {
      expect(isModerator('regular_user')).toBe(false);
    });

    it('should return false for helper', () => {
      assignRole('helper123', 'helper', { skipPermissionCheck: true });
      expect(isModerator('helper123')).toBe(false);
    });

    it('should return true for moderator', () => {
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      expect(isModerator('mod123')).toBe(true);
    });

    it('should return true for senior_moderator', () => {
      assignRole('senior123', 'senior_moderator', { skipPermissionCheck: true });
      expect(isModerator('senior123')).toBe(true);
    });

    it('should return true for admin', () => {
      assignRole('admin123', 'admin', { skipPermissionCheck: true, selfAssign: true });
      expect(isModerator('admin123')).toBe(true);
    });
  });

  // ============================================
  // isAdmin TESTS
  // ============================================

  describe('isAdmin', () => {
    it('should return false for regular user', () => {
      expect(isAdmin('regular_user')).toBe(false);
    });

    it('should return false for moderator', () => {
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      expect(isAdmin('mod123')).toBe(false);
    });

    it('should return false for senior_moderator', () => {
      assignRole('senior123', 'senior_moderator', { skipPermissionCheck: true });
      expect(isAdmin('senior123')).toBe(false);
    });

    it('should return true for admin', () => {
      assignRole('admin123', 'admin', { skipPermissionCheck: true, selfAssign: true });
      expect(isAdmin('admin123')).toBe(true);
    });
  });

  // ============================================
  // canPerformAction TESTS
  // ============================================

  describe('canPerformAction', () => {
    it('should return false when not logged in', () => {
      mockState.user = null;
      const result = canPerformAction('target123', 'warn_user');
      expect(result.canPerform).toBe(false);
      expect(result.reason).toBe('not_logged_in');
    });

    it('should return false without target', () => {
      mockState.user = { uid: 'user123' };
      const result = canPerformAction(null, 'warn_user');
      expect(result.canPerform).toBe(false);
      expect(result.reason).toBe('no_target');
    });

    it('should return false when targeting self for warn_user', () => {
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      mockState.user = { uid: 'mod123' };
      const result = canPerformAction('mod123', 'warn_user');
      expect(result.canPerform).toBe(false);
      expect(result.reason).toBe('cannot_target_self');
    });

    it('should return false without permission', () => {
      mockState.user = { uid: 'user123' };
      const result = canPerformAction('target123', 'warn_user');
      expect(result.canPerform).toBe(false);
      expect(result.reason).toBe('no_permission');
    });

    it('should return false when target has higher role', () => {
      // First assign roles (this stores them)
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      assignRole('admin123', 'admin', { skipPermissionCheck: true, selfAssign: true });
      // Then set the current user
      mockState.user = { uid: 'mod123' };
      const result = canPerformAction('admin123', 'warn_user');
      expect(result.canPerform).toBe(false);
      expect(result.reason).toBe('target_higher_role');
    });

    it('should return true when action is allowed', () => {
      // First assign the role (this stores it)
      assignRole('mod123', 'moderator', { skipPermissionCheck: true });
      // Then set the current user
      mockState.user = { uid: 'mod123' };
      const result = canPerformAction('regular_user', 'warn_user');
      expect(result.canPerform).toBe(true);
      expect(result.reason).toBeNull();
    });
  });

  // ============================================
  // getModeratorsList TESTS
  // ============================================

  describe('getModeratorsList', () => {
    beforeEach(() => {
      assignRole('helper1', 'helper', { skipPermissionCheck: true });
      assignRole('mod1', 'moderator', { skipPermissionCheck: true });
      assignRole('admin1', 'admin', { skipPermissionCheck: true, selfAssign: true });
    });

    it('should return all moderators', () => {
      const list = getModeratorsList();
      expect(list.length).toBe(3);
    });

    it('should filter by minRole', () => {
      const list = getModeratorsList({ minRole: 'moderator' });
      expect(list.length).toBe(2);
      expect(list.some(m => m.role === 'helper')).toBe(false);
    });

    it('should filter by maxRole', () => {
      const list = getModeratorsList({ maxRole: 'moderator' });
      expect(list.length).toBe(2);
      expect(list.some(m => m.role === 'admin')).toBe(false);
    });

    it('should sort by role level (highest first)', () => {
      const list = getModeratorsList();
      expect(list[0].role).toBe('admin');
    });

    it('should include details by default', () => {
      const list = getModeratorsList();
      expect(list[0]).toHaveProperty('assignedBy');
      expect(list[0]).toHaveProperty('assignedAt');
    });

    it('should exclude details when includeDetails is false', () => {
      const list = getModeratorsList({ includeDetails: false });
      expect(list[0]).not.toHaveProperty('assignedBy');
    });
  });

  // ============================================
  // getModeratorCounts TESTS
  // ============================================

  describe('getModeratorCounts', () => {
    it('should return zero counts when no moderators', () => {
      const counts = getModeratorCounts();
      expect(counts.helper).toBe(0);
      expect(counts.moderator).toBe(0);
      expect(counts.admin).toBe(0);
      expect(counts.total).toBe(0);
    });

    it('should count moderators correctly', () => {
      assignRole('helper1', 'helper', { skipPermissionCheck: true });
      assignRole('helper2', 'helper', { skipPermissionCheck: true });
      assignRole('mod1', 'moderator', { skipPermissionCheck: true });
      assignRole('admin1', 'admin', { skipPermissionCheck: true, selfAssign: true });

      const counts = getModeratorCounts();
      expect(counts.helper).toBe(2);
      expect(counts.moderator).toBe(1);
      expect(counts.admin).toBe(1);
      expect(counts.total).toBe(4);
    });
  });

  // ============================================
  // getModerationHistory TESTS
  // ============================================

  describe('getModerationHistory', () => {
    it('should return empty entries when no history', () => {
      const history = getModerationHistory();
      expect(history.entries).toEqual([]);
      expect(history.total).toBe(0);
    });

    it('should record role assignments in history', () => {
      assignRole('mod1', 'moderator', { skipPermissionCheck: true });
      const history = getModerationHistory();
      expect(history.total).toBeGreaterThan(0);
      expect(history.entries[0].type).toBe('role_assigned');
    });

    it('should record role removals in history', () => {
      assignRole('mod1', 'moderator', { skipPermissionCheck: true });
      removeRole('mod1', { skipPermissionCheck: true });
      const history = getModerationHistory();
      expect(history.entries.some(e => e.type === 'role_removed')).toBe(true);
    });

    it('should filter by userId', () => {
      assignRole('mod1', 'moderator', { skipPermissionCheck: true });
      assignRole('mod2', 'helper', { skipPermissionCheck: true });
      const history = getModerationHistory({ userId: 'mod1' });
      expect(history.entries.every(e => e.targetUserId === 'mod1')).toBe(true);
    });

    it('should respect limit option', () => {
      assignRole('mod1', 'moderator', { skipPermissionCheck: true });
      assignRole('mod2', 'helper', { skipPermissionCheck: true });
      assignRole('mod3', 'admin', { skipPermissionCheck: true, selfAssign: true });
      const history = getModerationHistory({ limit: 2 });
      expect(history.entries.length).toBeLessThanOrEqual(2);
    });
  });

  // ============================================
  // renderRoleBadge TESTS
  // ============================================

  describe('renderRoleBadge', () => {
    it('should return empty string for user role', () => {
      const html = renderRoleBadge('user');
      expect(html).toBe('');
    });

    it('should return HTML for moderator role', () => {
      const html = renderRoleBadge('moderator');
      expect(html).toContain('Moderateur');
      expect(html).toContain('fa-shield-alt');
    });

    it('should include role color', () => {
      const html = renderRoleBadge('admin');
      expect(html).toContain('red');
    });

    it('should respect size option', () => {
      const html = renderRoleBadge('helper', { size: 'sm' });
      expect(html).toContain('text-xs');
    });

    it('should hide label when showLabel is false', () => {
      const html = renderRoleBadge('moderator', { showLabel: false });
      expect(html).not.toContain('Moderateur');
      expect(html).toContain('fa-shield-alt');
    });
  });

  // ============================================
  // renderModeratorPanel TESTS
  // ============================================

  describe('renderModeratorPanel', () => {
    it('should show login required when not logged in', () => {
      mockState.user = null;
      const html = renderModeratorPanel();
      expect(html).toContain('loginRequired');
    });

    it('should show not moderator message for regular user', () => {
      mockState.user = { uid: 'regular_user' };
      const html = renderModeratorPanel();
      expect(html).toContain('notModerator');
    });

    it('should render panel for helper', () => {
      // Assign role first, then set user
      assignRole('helper1', 'helper', { skipPermissionCheck: true });
      mockState.user = { uid: 'helper1' };
      const html = renderModeratorPanel();
      expect(html).toContain('moderatorPanel');
      expect(html).toContain('quickActions');
    });

    it('should show more actions for admin', () => {
      // Assign role first, then set user
      assignRole('admin1', 'admin', { skipPermissionCheck: true, selfAssign: true });
      mockState.user = { uid: 'admin1' };
      const html = renderModeratorPanel();
      expect(html).toContain('permBan');
      expect(html).toContain('dashboard');
    });

    it('should display team members section', () => {
      // Assign role first, then set user
      assignRole('admin1', 'admin', { skipPermissionCheck: true, selfAssign: true });
      mockState.user = { uid: 'admin1' };
      const html = renderModeratorPanel();
      expect(html).toContain('moderationTeam');
    });
  });

  // ============================================
  // renderRoleSelect TESTS
  // ============================================

  describe('renderRoleSelect', () => {
    it('should include user option as default', () => {
      const html = renderRoleSelect('user', 'admin');
      expect(html).toContain('Utilisateur');
      expect(html).toContain('default');
    });

    it('should include assignable roles for admin', () => {
      const html = renderRoleSelect('user', 'admin');
      expect(html).toContain('Moderateur');
      expect(html).toContain('Aide');
    });

    it('should mark current role as selected', () => {
      const html = renderRoleSelect('moderator', 'admin');
      expect(html).toContain('value="moderator"');
      expect(html).toContain('selected');
    });
  });

  // ============================================
  // initializeWithAdmin TESTS
  // ============================================

  describe('initializeWithAdmin', () => {
    it('should not initialize without user ID', () => {
      initializeWithAdmin(null);
      const counts = getModeratorCounts();
      expect(counts.admin).toBe(0);
    });

    it('should set user as admin', () => {
      initializeWithAdmin('first_admin');
      expect(getUserRole('first_admin')).toBe('admin');
    });

    it('should not override existing admin', () => {
      initializeWithAdmin('first_admin');
      initializeWithAdmin('second_admin');
      expect(getUserRole('first_admin')).toBe('admin');
      expect(getUserRole('second_admin')).toBe('user');
    });
  });

  // ============================================
  // INTEGRATION TESTS
  // ============================================

  describe('Integration', () => {
    it('should support complete role assignment workflow', () => {
      // Initialize admin
      initializeWithAdmin('admin1');
      expect(isAdmin('admin1')).toBe(true);

      // Admin assigns moderator
      mockState.user = { uid: 'admin1' };
      const result = assignRole('user1', 'moderator');
      expect(result.success).toBe(true);

      // Moderator can warn users
      expect(hasPermission('user1', 'warn_user')).toBe(true);

      // Moderator cannot ban permanently
      expect(hasPermission('user1', 'ban_perm')).toBe(false);
    });

    it('should enforce role hierarchy', () => {
      initializeWithAdmin('admin1');
      assignRole('mod1', 'moderator', { skipPermissionCheck: true });
      assignRole('senior1', 'senior_moderator', { skipPermissionCheck: true });

      // Moderator cannot demote senior moderator
      mockState.user = { uid: 'mod1' };
      const result = removeRole('senior1');
      expect(result.success).toBe(false);
    });

    it('should track all changes in history', () => {
      initializeWithAdmin('admin1');
      assignRole('user1', 'helper', { skipPermissionCheck: true });
      assignRole('user1', 'moderator', { skipPermissionCheck: true });
      removeRole('user1', { skipPermissionCheck: true });

      const history = getModerationHistory({ userId: 'user1' });
      expect(history.total).toBeGreaterThanOrEqual(3);
    });
  });
});
