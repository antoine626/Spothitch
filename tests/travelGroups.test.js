/**
 * Travel Groups Service Tests
 * Feature #187 - Tests for travel groups functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GROUP_STATUS,
  MEMBER_ROLE,
  INVITATION_STATUS,
  createGroup,
  createTravelGroup,
  joinGroup,
  joinTravelGroup,
  leaveGroup,
  leaveTravelGroup,
  getGroupById,
  getGroupMembers,
  inviteToGroup,
  acceptGroupInvitation,
  declineGroupInvitation,
  getPendingInvitations,
  addItineraryStop,
  removeItineraryStop,
  reorderItinerary,
  getGroupItinerary,
  searchTravelGroups,
  getMyTravelGroups,
  sendGroupMessage,
  updateGroupStatus,
  renderTravelGroupCard,
} from '../src/services/travelGroups.js';

// Mock state
let mockState = {};
vi.mock('../src/stores/state.js', () => ({
  getState: () => mockState,
  setState: (updates) => {
    mockState = { ...mockState, ...updates };
  },
}));

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: (key) => key,
}));

// Mock storage
let mockStorage = {};
vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: (key) => mockStorage[key],
    set: (key, value) => {
      mockStorage[key] = value;
    },
    remove: (key) => {
      delete mockStorage[key];
    },
  },
}));

describe('Travel Groups Service', () => {
  beforeEach(() => {
    mockState = {
      user: { uid: 'user123' },
      username: 'TestUser',
      avatar: '🎒',
      travelGroups: [],
    };
    mockStorage = {};
    vi.clearAllMocks();
  });

  // ========================================
  // CONSTANTS
  // ========================================

  describe('Constants', () => {
    it('should have GROUP_STATUS defined', () => {
      expect(GROUP_STATUS).toBeDefined();
      expect(GROUP_STATUS.PLANNING).toBeDefined();
      expect(GROUP_STATUS.ACTIVE).toBeDefined();
      expect(GROUP_STATUS.COMPLETED).toBeDefined();
      expect(GROUP_STATUS.CANCELLED).toBeDefined();
    });

    it('should have MEMBER_ROLE defined', () => {
      expect(MEMBER_ROLE).toBeDefined();
      expect(MEMBER_ROLE.CREATOR).toBe('creator');
      expect(MEMBER_ROLE.ADMIN).toBe('admin');
      expect(MEMBER_ROLE.MEMBER).toBe('member');
    });

    it('should have INVITATION_STATUS defined', () => {
      expect(INVITATION_STATUS).toBeDefined();
      expect(INVITATION_STATUS.PENDING).toBe('pending');
      expect(INVITATION_STATUS.ACCEPTED).toBe('accepted');
      expect(INVITATION_STATUS.DECLINED).toBe('declined');
      expect(INVITATION_STATUS.EXPIRED).toBe('expired');
    });
  });

  // ========================================
  // CREATE GROUP
  // ========================================

  describe('createGroup', () => {
    it('should create a group with valid data', () => {
      const result = createGroup('Paris to Barcelona', 'Barcelona', {
        startDate: '2025-03-01',
        endDate: '2025-03-10',
      });

      expect(result.success).toBe(true);
      expect(result.group).toBeDefined();
      expect(result.group.name).toBe('Paris to Barcelona');
      expect(result.group.destination.city).toBe('Barcelona');
      expect(result.group.creator).toBe('user123');
      expect(result.group.status).toBe('planning');
    });

    it('should create a group with destination object', () => {
      const result = createGroup('Euro Trip', { city: 'Berlin', country: 'DE' }, {});

      expect(result.success).toBe(true);
      expect(result.group.destination.city).toBe('Berlin');
      expect(result.group.destination.country).toBe('DE');
    });

    it('should fail if name is too short', () => {
      const result = createGroup('A', 'Paris', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_name');
    });

    it('should fail if name is too long', () => {
      const longName = 'A'.repeat(51);
      const result = createGroup(longName, 'Paris', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('name_too_long');
    });

    it('should fail if destination is missing', () => {
      const result = createGroup('Trip', null, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_destination');
    });

    it('should include creator as first member with CREATOR role', () => {
      const result = createGroup('Trip', 'Paris', {});

      expect(result.group.members).toHaveLength(1);
      expect(result.group.members[0].id).toBe('user123');
      expect(result.group.members[0].role).toBe(MEMBER_ROLE.CREATOR);
    });

    it('should set default maxMembers to 4', () => {
      const result = createGroup('Trip', 'Paris', {});

      expect(result.group.maxMembers).toBe(4);
    });

    it('should accept custom maxMembers', () => {
      const result = createGroup('Trip', 'Paris', {}, { maxMembers: 6 });

      expect(result.group.maxMembers).toBe(6);
    });

    it('should generate unique group ID', () => {
      const result1 = createGroup('Trip 1', 'Paris', {});
      const result2 = createGroup('Trip 2', 'Berlin', {});

      expect(result1.group.id).not.toBe(result2.group.id);
    });

    it('should save group to storage', () => {
      createGroup('Trip', 'Paris', {});

      expect(mockStorage.spothitch_travel_groups).toBeDefined();
      expect(mockStorage.spothitch_travel_groups).toHaveLength(1);
    });
  });

  describe('createTravelGroup (alias)', () => {
    it('should create a group using legacy API', () => {
      const result = createTravelGroup({
        name: 'Legacy Trip',
        destination: { city: 'Rome' },
        startDate: '2025-04-01',
      });

      expect(result.success).toBe(true);
      expect(result.group.name).toBe('Legacy Trip');
    });
  });

  // ========================================
  // JOIN GROUP
  // ========================================

  describe('joinGroup / joinTravelGroup', () => {
    let testGroupId;

    beforeEach(() => {
      // Create a group first
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});
      testGroupId = created.group.id;
      mockState.user = { uid: 'user456' };
    });

    it('should allow a user to join a group', () => {
      const result = joinGroup(testGroupId);

      expect(result.success).toBe(true);
      expect(result.member).toBeDefined();
      expect(result.member.id).toBe('user456');
      expect(result.member.role).toBe(MEMBER_ROLE.MEMBER);
    });

    it('should fail if group does not exist', () => {
      const result = joinGroup('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('group_not_found');
    });

    it('should fail if user is already a member', () => {
      joinGroup(testGroupId);
      const result = joinGroup(testGroupId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('already_member');
    });

    it('should fail if group is full', () => {
      // Fill the group
      for (let i = 0; i < 3; i++) {
        mockState.user = { uid: `user${i}` };
        joinGroup(testGroupId);
      }

      mockState.user = { uid: 'user999' };
      const result = joinGroup(testGroupId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('group_full');
    });

    it('should fail if group is not in planning status', () => {
      // Update group status
      mockState.user = { uid: 'creator123' };
      updateGroupStatus(testGroupId, 'active');

      mockState.user = { uid: 'newuser' };
      const result = joinGroup(testGroupId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_accepting_members');
    });

    it('should return error for invalid group ID', () => {
      const result = joinGroup(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_group_id');
    });

    it('should update member count after joining', () => {
      joinGroup(testGroupId);
      const group = getGroupById(testGroupId);

      expect(group.members).toHaveLength(2);
    });
  });

  // ========================================
  // LEAVE GROUP
  // ========================================

  describe('leaveGroup / leaveTravelGroup', () => {
    let testGroupId;

    beforeEach(() => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});
      testGroupId = created.group.id;
    });

    it('should allow a member to leave a group', () => {
      // Add another member first
      mockState.user = { uid: 'member456' };
      joinGroup(testGroupId);

      const result = leaveGroup(testGroupId);

      expect(result.success).toBe(true);
    });

    it('should transfer ownership when creator leaves', () => {
      // Add another member
      mockState.user = { uid: 'member456' };
      joinGroup(testGroupId);

      // Creator leaves
      mockState.user = { uid: 'creator123' };
      leaveGroup(testGroupId);

      const group = getGroupById(testGroupId);
      expect(group.creator).toBe('member456');
    });

    it('should cancel group if last member leaves', () => {
      const result = leaveGroup(testGroupId);

      expect(result.success).toBe(true);
      const group = getGroupById(testGroupId);
      expect(group).toBeNull(); // Group deleted
    });

    it('should fail if not a member', () => {
      mockState.user = { uid: 'stranger' };
      const result = leaveGroup(testGroupId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_a_member');
    });

    it('should fail for invalid group ID', () => {
      const result = leaveGroup(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_group_id');
    });

    it('should fail if group does not exist', () => {
      const result = leaveGroup('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('group_not_found');
    });
  });

  // ========================================
  // GET GROUP MEMBERS
  // ========================================

  describe('getGroupMembers', () => {
    let testGroupId;

    beforeEach(() => {
      mockState.user = { uid: 'creator123' };
      mockState.username = 'Creator';
      const created = createGroup('Test Group', 'Paris', {});
      testGroupId = created.group.id;
    });

    it('should return array of members', () => {
      const members = getGroupMembers(testGroupId);

      expect(Array.isArray(members)).toBe(true);
      expect(members).toHaveLength(1);
    });

    it('should return empty array for invalid group ID', () => {
      const members = getGroupMembers(null);

      expect(members).toEqual([]);
    });

    it('should return empty array for nonexistent group', () => {
      const members = getGroupMembers('nonexistent');

      expect(members).toEqual([]);
    });

    it('should include member details', () => {
      const members = getGroupMembers(testGroupId);

      expect(members[0].id).toBe('creator123');
      expect(members[0].role).toBe(MEMBER_ROLE.CREATOR);
      expect(members[0].username).toBeDefined();
    });
  });

  // ========================================
  // INVITE TO GROUP
  // ========================================

  describe('inviteToGroup', () => {
    let testGroupId;

    beforeEach(() => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});
      testGroupId = created.group.id;
    });

    it('should create an invitation for a user', () => {
      const result = inviteToGroup(testGroupId, 'friend456', 'FriendName');

      expect(result.success).toBe(true);
      expect(result.invitation).toBeDefined();
      expect(result.invitation.userId).toBe('friend456');
      expect(result.invitation.status).toBe(INVITATION_STATUS.PENDING);
    });

    it('should fail if not a member', () => {
      mockState.user = { uid: 'stranger' };
      const result = inviteToGroup(testGroupId, 'friend456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_a_member');
    });

    it('should fail if user is already a member', () => {
      const result = inviteToGroup(testGroupId, 'creator123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('already_member');
    });

    it('should fail if invitation already exists', () => {
      inviteToGroup(testGroupId, 'friend456');
      const result = inviteToGroup(testGroupId, 'friend456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invitation_exists');
    });

    it('should fail if group is full', () => {
      // Fill the group
      for (let i = 0; i < 3; i++) {
        mockState.user = { uid: `user${i}` };
        joinGroup(testGroupId);
      }

      mockState.user = { uid: 'creator123' };
      const result = inviteToGroup(testGroupId, 'friend999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('group_full');
    });

    it('should fail for invalid parameters', () => {
      const result = inviteToGroup(null, 'friend456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_parameters');
    });

    it('should set expiration date 7 days from now', () => {
      const result = inviteToGroup(testGroupId, 'friend456');

      const expiresAt = new Date(result.invitation.expiresAt);
      const now = new Date();
      const diffDays = Math.round((expiresAt - now) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(7);
    });
  });

  // ========================================
  // ACCEPT GROUP INVITATION
  // ========================================

  describe('acceptGroupInvitation', () => {
    let testGroupId;
    let invitationId;

    beforeEach(() => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});
      testGroupId = created.group.id;

      const invitation = inviteToGroup(testGroupId, 'friend456', 'Friend');
      invitationId = invitation.invitation.id;

      mockState.user = { uid: 'friend456' };
    });

    it('should accept invitation and join group', () => {
      const result = acceptGroupInvitation(testGroupId, invitationId);

      expect(result.success).toBe(true);
      expect(result.member).toBeDefined();
      expect(result.group.members).toHaveLength(2);
    });

    it('should fail if group does not exist', () => {
      const result = acceptGroupInvitation('nonexistent', invitationId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('group_not_found');
    });

    it('should fail if invitation does not exist', () => {
      const result = acceptGroupInvitation(testGroupId, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invitation_not_found');
    });

    it('should fail if invitation is not pending', () => {
      acceptGroupInvitation(testGroupId, invitationId);
      const result = acceptGroupInvitation(testGroupId, invitationId);

      expect(result.success).toBe(false);
    });
  });

  // ========================================
  // DECLINE GROUP INVITATION
  // ========================================

  describe('declineGroupInvitation', () => {
    let testGroupId;
    let invitationId;

    beforeEach(() => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});
      testGroupId = created.group.id;

      const invitation = inviteToGroup(testGroupId, 'friend456', 'Friend');
      invitationId = invitation.invitation.id;

      mockState.user = { uid: 'friend456' };
    });

    it('should decline invitation', () => {
      const result = declineGroupInvitation(testGroupId, invitationId);

      expect(result.success).toBe(true);
    });

    it('should not add user to group', () => {
      declineGroupInvitation(testGroupId, invitationId);
      const group = getGroupById(testGroupId);

      expect(group.members).toHaveLength(1);
    });
  });

  // ========================================
  // GET PENDING INVITATIONS
  // ========================================

  describe('getPendingInvitations', () => {
    it('should return pending invitations for current user', () => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});
      inviteToGroup(created.group.id, 'friend456');

      mockState.user = { uid: 'friend456' };
      const pending = getPendingInvitations();

      expect(Array.isArray(pending)).toBe(true);
      expect(pending).toHaveLength(1);
      expect(pending[0].groupName).toBe('Test Group');
    });

    it('should return empty array if no invitations', () => {
      const pending = getPendingInvitations();

      expect(pending).toEqual([]);
    });
  });

  // ========================================
  // ITINERARY FUNCTIONS
  // ========================================

  describe('addItineraryStop', () => {
    let testGroupId;

    beforeEach(() => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});
      testGroupId = created.group.id;
    });

    it('should add a stop to the itinerary', () => {
      const result = addItineraryStop(testGroupId, {
        name: 'Lyon',
        date: '2025-03-05',
      });

      expect(result.success).toBe(true);
      expect(result.stop).toBeDefined();
      expect(result.stop.name).toBe('Lyon');
    });

    it('should fail if not a member', () => {
      mockState.user = { uid: 'stranger' };
      const result = addItineraryStop(testGroupId, { name: 'Lyon' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_a_member');
    });

    it('should fail for invalid parameters', () => {
      const result = addItineraryStop(null, { name: 'Lyon' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_parameters');
    });

    it('should assign order to stops', () => {
      addItineraryStop(testGroupId, { name: 'Stop 1' });
      const result = addItineraryStop(testGroupId, { name: 'Stop 2' });

      expect(result.stop.order).toBe(1);
    });

    it('should include addedBy information', () => {
      const result = addItineraryStop(testGroupId, { name: 'Lyon' });

      expect(result.stop.addedBy).toBe('creator123');
    });
  });

  describe('removeItineraryStop', () => {
    let testGroupId;
    let stopId;

    beforeEach(() => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});
      testGroupId = created.group.id;
      const stopResult = addItineraryStop(testGroupId, { name: 'Lyon' });
      stopId = stopResult.stop.id;
    });

    it('should remove a stop from itinerary', () => {
      const result = removeItineraryStop(testGroupId, stopId);

      expect(result.success).toBe(true);
      const itinerary = getGroupItinerary(testGroupId);
      expect(itinerary).toHaveLength(0);
    });

    it('should fail if not authorized', () => {
      mockState.user = { uid: 'member456' };
      joinGroup(testGroupId);
      const result = removeItineraryStop(testGroupId, stopId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_authorized');
    });

    it('should fail if stop does not exist', () => {
      const result = removeItineraryStop(testGroupId, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('stop_not_found');
    });
  });

  describe('reorderItinerary', () => {
    let testGroupId;
    let stopIds;

    beforeEach(() => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});
      testGroupId = created.group.id;

      stopIds = [];
      for (let i = 1; i <= 3; i++) {
        const result = addItineraryStop(testGroupId, { name: `Stop ${i}` });
        stopIds.push(result.stop.id);
      }
    });

    it('should reorder stops', () => {
      const newOrder = [stopIds[2], stopIds[0], stopIds[1]];
      const result = reorderItinerary(testGroupId, newOrder);

      expect(result.success).toBe(true);
      expect(result.itinerary[0].id).toBe(stopIds[2]);
    });

    it('should fail for invalid parameters', () => {
      const result = reorderItinerary(null, stopIds);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_parameters');
    });
  });

  describe('getGroupItinerary', () => {
    let testGroupId;

    beforeEach(() => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});
      testGroupId = created.group.id;
    });

    it('should return sorted itinerary', () => {
      addItineraryStop(testGroupId, { name: 'Stop 1' });
      addItineraryStop(testGroupId, { name: 'Stop 2' });

      const itinerary = getGroupItinerary(testGroupId);

      expect(itinerary).toHaveLength(2);
      expect(itinerary[0].order).toBe(0);
      expect(itinerary[1].order).toBe(1);
    });

    it('should return empty array for invalid group', () => {
      const itinerary = getGroupItinerary('nonexistent');

      expect(itinerary).toEqual([]);
    });
  });

  // ========================================
  // SEARCH TRAVEL GROUPS
  // ========================================

  describe('searchTravelGroups', () => {
    beforeEach(() => {
      mockState.user = { uid: 'creator1' };
      createGroup('Paris Trip', { city: 'Paris', country: 'FR' }, {
        startDate: '2025-03-01',
      });

      mockState.user = { uid: 'creator2' };
      createGroup('Berlin Trip', { city: 'Berlin', country: 'DE' }, {
        startDate: '2025-04-01',
      });
    });

    it('should return all planning groups by default', () => {
      const groups = searchTravelGroups();

      expect(groups.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by destination country', () => {
      const groups = searchTravelGroups({ destinationCountry: 'FR' });

      expect(groups.every((g) => g.destination.country === 'FR')).toBe(true);
    });

    it('should filter by status', () => {
      const groups = searchTravelGroups({ status: 'planning' });

      expect(groups.every((g) => g.status === 'planning')).toBe(true);
    });

    it('should filter by available spots', () => {
      const groups = searchTravelGroups({ hasAvailableSpots: true });

      expect(groups.every((g) => g.members.length < g.maxMembers)).toBe(true);
    });
  });

  // ========================================
  // GET MY TRAVEL GROUPS
  // ========================================

  describe('getMyTravelGroups', () => {
    it('should return only groups user is a member of', () => {
      mockState.user = { uid: 'user1' };
      createGroup('My Trip', 'Paris', {});

      mockState.user = { uid: 'user2' };
      createGroup('Other Trip', 'Berlin', {});

      mockState.user = { uid: 'user1' };
      const myGroups = getMyTravelGroups();

      // User1 should have at least their own group
      expect(myGroups.length).toBeGreaterThanOrEqual(1);
      const groupNames = myGroups.map(g => g.name);
      expect(groupNames).toContain('My Trip');
    });

    it('should return empty array if no groups', () => {
      mockState.user = { uid: 'newuser' };
      const myGroups = getMyTravelGroups();

      expect(myGroups).toEqual([]);
    });
  });

  // ========================================
  // SEND GROUP MESSAGE
  // ========================================

  describe('sendGroupMessage', () => {
    let testGroupId;

    beforeEach(() => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});
      testGroupId = created.group.id;
    });

    it('should add message to group chat', () => {
      sendGroupMessage(testGroupId, 'Hello everyone!');

      const group = getGroupById(testGroupId);
      expect(group.chat).toHaveLength(1);
      expect(group.chat[0].message).toBe('Hello everyone!');
    });

    it('should not add empty message', () => {
      sendGroupMessage(testGroupId, '   ');

      const group = getGroupById(testGroupId);
      expect(group.chat).toHaveLength(0);
    });

    it('should include sender information', () => {
      sendGroupMessage(testGroupId, 'Test message');

      const group = getGroupById(testGroupId);
      expect(group.chat[0].userId).toBe('creator123');
      expect(group.chat[0].username).toBe('TestUser');
    });
  });

  // ========================================
  // UPDATE GROUP STATUS
  // ========================================

  describe('updateGroupStatus', () => {
    let testGroupId;

    beforeEach(() => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});
      testGroupId = created.group.id;
    });

    it('should update status if creator', () => {
      const result = updateGroupStatus(testGroupId, 'active');

      expect(result).toBe(true);
      const group = getGroupById(testGroupId);
      expect(group.status).toBe('active');
    });

    it('should fail if not creator', () => {
      mockState.user = { uid: 'other' };
      const result = updateGroupStatus(testGroupId, 'active');

      expect(result).toBe(false);
    });
  });

  // ========================================
  // RENDER FUNCTIONS
  // ========================================

  describe('renderTravelGroupCard', () => {
    it('should render HTML for a group', () => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});

      const html = renderTravelGroupCard(created.group);

      expect(html).toContain('Test Group');
      expect(html).toContain('Paris');
      expect(typeof html).toBe('string');
    });

    it('should include status badge', () => {
      mockState.user = { uid: 'creator123' };
      const created = createGroup('Test Group', 'Paris', {});

      const html = renderTravelGroupCard(created.group);

      expect(html).toContain('En préparation');
    });
  });
});
