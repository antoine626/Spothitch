/**
 * Tests for Guilds/Clans Service
 * Feature #162
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  GuildRole,
  MembershipStatus,
  createGuild,
  joinGuild,
  requestJoinGuild,
  acceptJoinRequest,
  rejectJoinRequest,
  leaveGuild,
  disbandGuild,
  promoteToOfficer,
  demoteToMember,
  transferLeadership,
  kickMember,
  updateGuildSettings,
  getMyGuild,
  getGuildMembers,
  getGuildStats,
  getGuildLeaderboard,
  getAllGuilds,
  getGuildById,
  searchGuilds,
  getMyRole,
  contributeXp,
  contributeSpot,
  contributeDistance,
  renderGuildCard,
  renderGuildList,
  renderMemberList,
} from '../src/services/guilds.js';
import { getState, setState, resetState } from '../src/stores/state.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: (key, params) => {
    if (params) {
      let text = key;
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
      return text;
    }
    return key;
  },
}));

// Mock sanitize
vi.mock('../src/utils/sanitize.js', () => ({
  escapeHTML: (str) => str,
}));

describe('Guilds Service', () => {
  beforeEach(() => {
    resetState();
    setState({
      user: { uid: 'test-user-id' },
      username: 'TestUser',
      avatar: '🤙',
      level: 5,
      guilds: [],
      myGuildId: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== GuildRole Enum ====================
  describe('GuildRole enum', () => {
    it('should have LEADER role', () => {
      expect(GuildRole.LEADER).toBe('leader');
    });

    it('should have OFFICER role', () => {
      expect(GuildRole.OFFICER).toBe('officer');
    });

    it('should have MEMBER role', () => {
      expect(GuildRole.MEMBER).toBe('member');
    });
  });

  // ==================== MembershipStatus Enum ====================
  describe('MembershipStatus enum', () => {
    it('should have PENDING status', () => {
      expect(MembershipStatus.PENDING).toBe('pending');
    });

    it('should have ACTIVE status', () => {
      expect(MembershipStatus.ACTIVE).toBe('active');
    });

    it('should have REJECTED status', () => {
      expect(MembershipStatus.REJECTED).toBe('rejected');
    });

    it('should have LEFT status', () => {
      expect(MembershipStatus.LEFT).toBe('left');
    });

    it('should have KICKED status', () => {
      expect(MembershipStatus.KICKED).toBe('kicked');
    });
  });

  // ==================== createGuild ====================
  describe('createGuild', () => {
    it('should create a guild with valid name', () => {
      const guild = createGuild('Test Guild', 'A test guild description', true);

      expect(guild).not.toBeNull();
      expect(guild.name).toBe('Test Guild');
      expect(guild.description).toBe('A test guild description');
      expect(guild.isPublic).toBe(true);
      expect(guild.leaderId).toBe('test-user-id');
      expect(guild.members).toHaveLength(1);
      expect(guild.members[0].role).toBe(GuildRole.LEADER);
    });

    it('should create a private guild', () => {
      const guild = createGuild('Private Guild', 'Private description', false);

      expect(guild.isPublic).toBe(false);
      expect(guild.settings.requireApproval).toBe(true);
    });

    it('should reject empty name', () => {
      const guild = createGuild('', 'Description');
      expect(guild).toBeNull();
    });

    it('should reject name shorter than 3 characters', () => {
      const guild = createGuild('AB', 'Description');
      expect(guild).toBeNull();
    });

    it('should reject name longer than 30 characters', () => {
      const longName = 'A'.repeat(31);
      const guild = createGuild(longName, 'Description');
      expect(guild).toBeNull();
    });

    it('should trim name and description', () => {
      const guild = createGuild('  Test Guild  ', '  Description  ');
      expect(guild.name).toBe('Test Guild');
      expect(guild.description).toBe('Description');
    });

    it('should truncate description to 200 characters', () => {
      const longDesc = 'A'.repeat(250);
      const guild = createGuild('Test Guild', longDesc);
      expect(guild.description).toHaveLength(200);
    });

    it('should reject if user already in a guild', () => {
      createGuild('First Guild', 'First');
      const second = createGuild('Second Guild', 'Second');
      expect(second).toBeNull();
    });

    it('should reject duplicate guild names (case insensitive)', () => {
      createGuild('Test Guild', 'First');

      // Create a new user to try creating duplicate name
      setState({
        user: { uid: 'other-user' },
        username: 'OtherUser',
        myGuildId: null,
      });

      const duplicate = createGuild('test guild', 'Duplicate');
      expect(duplicate).toBeNull();
    });

    it('should set myGuildId in state', () => {
      const guild = createGuild('My Guild', 'Description');
      const state = getState();
      expect(state.myGuildId).toBe(guild.id);
    });

    it('should initialize member stats to 0', () => {
      const guild = createGuild('Test Guild', 'Description');
      const member = guild.members[0];
      expect(member.xpContributed).toBe(0);
      expect(member.spotsContributed).toBe(0);
      expect(member.distanceContributed).toBe(0);
    });
  });

  // ==================== joinGuild ====================
  describe('joinGuild', () => {
    let publicGuild;

    beforeEach(() => {
      publicGuild = createGuild('Public Guild', 'Join us!', true);

      // Switch to a different user
      setState({
        user: { uid: 'new-user' },
        username: 'NewUser',
        level: 3,
        myGuildId: null,
      });
    });

    it('should join a public guild', () => {
      const result = joinGuild(publicGuild.id);
      expect(result).toBe(true);

      const state = getState();
      expect(state.myGuildId).toBe(publicGuild.id);
    });

    it('should add user as MEMBER role', () => {
      joinGuild(publicGuild.id);
      const members = getGuildMembers(publicGuild.id);
      const newMember = members.find(m => m.id === 'new-user');
      expect(newMember.role).toBe(GuildRole.MEMBER);
    });

    it('should reject if guild not found', () => {
      const result = joinGuild('non-existent');
      expect(result).toBe(false);
    });

    it('should reject if guild is private', () => {
      // Create private guild with original user
      setState({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
        myGuildId: null,
        guilds: [],
      });
      const privateGuild = createGuild('Private', 'Private guild', false);

      // Switch user
      setState({
        user: { uid: 'new-user' },
        username: 'NewUser',
        myGuildId: null,
      });

      const result = joinGuild(privateGuild.id);
      expect(result).toBe(false);
    });

    it('should reject if already in a guild', () => {
      joinGuild(publicGuild.id);

      // Try to join another guild - create one first with a different user
      setState({
        user: { uid: 'creator-user' },
        username: 'CreatorUser',
        myGuildId: null,
        guilds: getState().guilds,
      });
      const anotherGuild = createGuild('Another Guild', 'Another');

      // Switch back to user who already joined a guild
      setState({
        user: { uid: 'new-user' },
        username: 'NewUser',
      });

      const result = joinGuild(anotherGuild.id);
      expect(result).toBe(false);
    });

    it('should reject if already a member', () => {
      joinGuild(publicGuild.id);
      const result = joinGuild(publicGuild.id);
      expect(result).toBe(false);
    });

    it('should reject if guild is full (50 members)', () => {
      // Add 49 more members to reach 50
      const state = getState();
      const guild = state.guilds.find(g => g.id === publicGuild.id);
      const extraMembers = [];
      for (let i = 0; i < 49; i++) {
        extraMembers.push({
          id: `member-${i}`,
          name: `Member ${i}`,
          role: GuildRole.MEMBER,
          status: MembershipStatus.ACTIVE,
        });
      }
      guild.members = [...guild.members, ...extraMembers];
      setState({ guilds: [...state.guilds] });

      const result = joinGuild(publicGuild.id);
      expect(result).toBe(false);
    });

    it('should reject if user level is below minimum', () => {
      // Set min level requirement
      const state = getState();
      const guild = state.guilds.find(g => g.id === publicGuild.id);
      guild.settings.minLevel = 10;
      setState({ guilds: [...state.guilds] });

      const result = joinGuild(publicGuild.id);
      expect(result).toBe(false);
    });

    it('should update member count in stats', () => {
      joinGuild(publicGuild.id);
      const stats = getGuildStats(publicGuild.id);
      expect(stats.totalMembers).toBe(2);
    });
  });

  // ==================== requestJoinGuild ====================
  describe('requestJoinGuild', () => {
    let privateGuild;

    beforeEach(() => {
      privateGuild = createGuild('Private Guild', 'Request to join', false);

      // Switch user
      setState({
        user: { uid: 'requester' },
        username: 'Requester',
        level: 5,
        myGuildId: null,
      });
    });

    it('should send a join request for private guild', () => {
      const result = requestJoinGuild(privateGuild.id);
      expect(result).toBe(true);
    });

    it('should add request to pendingRequests', () => {
      requestJoinGuild(privateGuild.id);

      const guild = getGuildById(privateGuild.id);
      expect(guild.pendingRequests).toHaveLength(1);
      expect(guild.pendingRequests[0].id).toBe('requester');
    });

    it('should reject if already requested', () => {
      requestJoinGuild(privateGuild.id);
      const result = requestJoinGuild(privateGuild.id);
      expect(result).toBe(false);
    });

    it('should reject if already in a guild', () => {
      // Create public guild and join it - with a different creator
      setState({
        user: { uid: 'public-creator' },
        username: 'PublicCreator',
        myGuildId: null,
        guilds: getState().guilds,
      });
      const publicGuild = createGuild('Public', 'Public', true);

      setState({
        user: { uid: 'requester' },
        username: 'Requester',
        level: 5,
        myGuildId: null,
      });
      joinGuild(publicGuild.id);

      const result = requestJoinGuild(privateGuild.id);
      expect(result).toBe(false);
    });

    it('should reject if guild not found', () => {
      const result = requestJoinGuild('non-existent');
      expect(result).toBe(false);
    });
  });

  // ==================== acceptJoinRequest ====================
  describe('acceptJoinRequest', () => {
    let privateGuild;

    beforeEach(() => {
      privateGuild = createGuild('Private Guild', 'Private', false);

      // Create request
      setState({
        user: { uid: 'requester' },
        username: 'Requester',
        level: 5,
        myGuildId: null,
      });
      requestJoinGuild(privateGuild.id);

      // Switch back to leader
      setState({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
      });
    });

    it('should accept a pending request', () => {
      const result = acceptJoinRequest(privateGuild.id, 'requester');
      expect(result).toBe(true);

      const members = getGuildMembers(privateGuild.id);
      expect(members).toHaveLength(2);
    });

    it('should remove request from pendingRequests', () => {
      acceptJoinRequest(privateGuild.id, 'requester');

      const guild = getGuildById(privateGuild.id);
      expect(guild.pendingRequests).toHaveLength(0);
    });

    it('should add user as MEMBER', () => {
      acceptJoinRequest(privateGuild.id, 'requester');

      const members = getGuildMembers(privateGuild.id);
      const newMember = members.find(m => m.id === 'requester');
      expect(newMember.role).toBe(GuildRole.MEMBER);
    });

    it('should reject if not leader or officer', () => {
      // Switch to regular member
      setState({
        user: { uid: 'random-user' },
        username: 'Random',
      });

      const result = acceptJoinRequest(privateGuild.id, 'requester');
      expect(result).toBe(false);
    });

    it('should reject if request not found', () => {
      const result = acceptJoinRequest(privateGuild.id, 'non-existent');
      expect(result).toBe(false);
    });
  });

  // ==================== rejectJoinRequest ====================
  describe('rejectJoinRequest', () => {
    let privateGuild;

    beforeEach(() => {
      privateGuild = createGuild('Private Guild', 'Private', false);

      setState({
        user: { uid: 'requester' },
        username: 'Requester',
        level: 5,
        myGuildId: null,
      });
      requestJoinGuild(privateGuild.id);

      setState({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
      });
    });

    it('should reject a pending request', () => {
      const result = rejectJoinRequest(privateGuild.id, 'requester');
      expect(result).toBe(true);

      const guild = getGuildById(privateGuild.id);
      expect(guild.pendingRequests).toHaveLength(0);
    });

    it('should not add user to members', () => {
      rejectJoinRequest(privateGuild.id, 'requester');

      const members = getGuildMembers(privateGuild.id);
      expect(members).toHaveLength(1);
    });

    it('should reject if not leader or officer', () => {
      setState({
        user: { uid: 'random' },
        username: 'Random',
      });

      const result = rejectJoinRequest(privateGuild.id, 'requester');
      expect(result).toBe(false);
    });
  });

  // ==================== leaveGuild ====================
  describe('leaveGuild', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);

      // Add a member
      setState({
        user: { uid: 'member-user' },
        username: 'Member',
        level: 3,
        myGuildId: null,
      });
      joinGuild(guild.id);
    });

    it('should leave guild as member', () => {
      const result = leaveGuild(guild.id);
      expect(result).toBe(true);

      const state = getState();
      expect(state.myGuildId).toBeNull();
    });

    it('should update member status to LEFT', () => {
      leaveGuild(guild.id);

      const members = getGuildMembers(guild.id, false);
      const leftMember = members.find(m => m.id === 'member-user');
      expect(leftMember.status).toBe(MembershipStatus.LEFT);
    });

    it('should not allow leader to leave with other members', () => {
      // Switch to leader
      setState({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
      });

      const result = leaveGuild(guild.id);
      expect(result).toBe(false);
    });

    it('should disband guild if leader is only member', () => {
      // Remove other member
      leaveGuild(guild.id);

      // Switch to leader
      setState({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
        myGuildId: guild.id,
      });

      const result = leaveGuild(guild.id);
      expect(result).toBe(true);

      const foundGuild = getGuildById(guild.id);
      expect(foundGuild).toBeNull();
    });

    it('should reject if not a member', () => {
      setState({
        user: { uid: 'outsider' },
        username: 'Outsider',
        myGuildId: null,
      });

      const result = leaveGuild(guild.id);
      expect(result).toBe(false);
    });

    it('should reject if guild not found', () => {
      const result = leaveGuild('non-existent');
      expect(result).toBe(false);
    });
  });

  // ==================== disbandGuild ====================
  describe('disbandGuild', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);
    });

    it('should disband guild as leader', () => {
      const result = disbandGuild(guild.id);
      expect(result).toBe(true);

      const foundGuild = getGuildById(guild.id);
      expect(foundGuild).toBeNull();
    });

    it('should clear myGuildId', () => {
      disbandGuild(guild.id);

      const state = getState();
      expect(state.myGuildId).toBeNull();
    });

    it('should reject if not leader', () => {
      setState({
        user: { uid: 'other-user' },
        username: 'Other',
      });

      const result = disbandGuild(guild.id);
      expect(result).toBe(false);
    });

    it('should reject if guild not found', () => {
      const result = disbandGuild('non-existent');
      expect(result).toBe(false);
    });
  });

  // ==================== promoteToOfficer ====================
  describe('promoteToOfficer', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);

      // Add a member
      setState({
        user: { uid: 'member-user' },
        username: 'Member',
        level: 3,
        myGuildId: null,
      });
      joinGuild(guild.id);

      // Switch back to leader
      setState({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
      });
    });

    it('should promote member to officer', () => {
      const result = promoteToOfficer(guild.id, 'member-user');
      expect(result).toBe(true);

      const members = getGuildMembers(guild.id);
      const promoted = members.find(m => m.id === 'member-user');
      expect(promoted.role).toBe(GuildRole.OFFICER);
    });

    it('should reject if not leader', () => {
      setState({
        user: { uid: 'member-user' },
        username: 'Member',
      });

      const result = promoteToOfficer(guild.id, 'test-user-id');
      expect(result).toBe(false);
    });

    it('should reject if trying to promote self', () => {
      const result = promoteToOfficer(guild.id, 'test-user-id');
      expect(result).toBe(false);
    });

    it('should reject if member not found', () => {
      const result = promoteToOfficer(guild.id, 'non-existent');
      expect(result).toBe(false);
    });

    it('should reject if already officer', () => {
      promoteToOfficer(guild.id, 'member-user');
      const result = promoteToOfficer(guild.id, 'member-user');
      expect(result).toBe(false);
    });

    it('should reject if guild not found', () => {
      const result = promoteToOfficer('non-existent', 'member-user');
      expect(result).toBe(false);
    });
  });

  // ==================== demoteToMember ====================
  describe('demoteToMember', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);

      setState({
        user: { uid: 'officer-user' },
        username: 'Officer',
        level: 3,
        myGuildId: null,
      });
      joinGuild(guild.id);

      setState({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
      });
      promoteToOfficer(guild.id, 'officer-user');
    });

    it('should demote officer to member', () => {
      const result = demoteToMember(guild.id, 'officer-user');
      expect(result).toBe(true);

      const members = getGuildMembers(guild.id);
      const demoted = members.find(m => m.id === 'officer-user');
      expect(demoted.role).toBe(GuildRole.MEMBER);
    });

    it('should reject if not leader', () => {
      setState({
        user: { uid: 'officer-user' },
        username: 'Officer',
      });

      const result = demoteToMember(guild.id, 'test-user-id');
      expect(result).toBe(false);
    });

    it('should reject if target is not officer', () => {
      // Add regular member
      setState({
        user: { uid: 'regular-user' },
        username: 'Regular',
        level: 3,
        myGuildId: null,
      });
      joinGuild(guild.id);

      setState({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
      });

      const result = demoteToMember(guild.id, 'regular-user');
      expect(result).toBe(false);
    });
  });

  // ==================== transferLeadership ====================
  describe('transferLeadership', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);

      setState({
        user: { uid: 'member-user' },
        username: 'Member',
        level: 3,
        myGuildId: null,
      });
      joinGuild(guild.id);

      setState({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
      });
    });

    it('should transfer leadership', () => {
      const result = transferLeadership(guild.id, 'member-user');
      expect(result).toBe(true);

      const updatedGuild = getGuildById(guild.id);
      expect(updatedGuild.leaderId).toBe('member-user');
    });

    it('should make old leader an officer', () => {
      transferLeadership(guild.id, 'member-user');

      const members = getGuildMembers(guild.id);
      const oldLeader = members.find(m => m.id === 'test-user-id');
      expect(oldLeader.role).toBe(GuildRole.OFFICER);
    });

    it('should make new leader a leader', () => {
      transferLeadership(guild.id, 'member-user');

      const members = getGuildMembers(guild.id);
      const newLeader = members.find(m => m.id === 'member-user');
      expect(newLeader.role).toBe(GuildRole.LEADER);
    });

    it('should reject if not leader', () => {
      setState({
        user: { uid: 'member-user' },
        username: 'Member',
      });

      const result = transferLeadership(guild.id, 'test-user-id');
      expect(result).toBe(false);
    });

    it('should reject if trying to transfer to self', () => {
      const result = transferLeadership(guild.id, 'test-user-id');
      expect(result).toBe(false);
    });

    it('should reject if target not found', () => {
      const result = transferLeadership(guild.id, 'non-existent');
      expect(result).toBe(false);
    });
  });

  // ==================== kickMember ====================
  describe('kickMember', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);

      setState({
        user: { uid: 'member-user' },
        username: 'Member',
        level: 3,
        myGuildId: null,
      });
      joinGuild(guild.id);

      setState({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
      });
    });

    it('should kick a member as leader', () => {
      const result = kickMember(guild.id, 'member-user');
      expect(result).toBe(true);
    });

    it('should update member status to KICKED', () => {
      kickMember(guild.id, 'member-user');

      const members = getGuildMembers(guild.id, false);
      const kicked = members.find(m => m.id === 'member-user');
      expect(kicked.status).toBe(MembershipStatus.KICKED);
    });

    it('should reduce active member count', () => {
      kickMember(guild.id, 'member-user');
      const stats = getGuildStats(guild.id);
      expect(stats.totalMembers).toBe(1);
    });

    it('should allow officer to kick member', () => {
      // Promote member to officer
      promoteToOfficer(guild.id, 'member-user');

      // Add another member
      setState({
        user: { uid: 'regular-user' },
        username: 'Regular',
        level: 3,
        myGuildId: null,
      });
      joinGuild(guild.id);

      // Switch to officer
      setState({
        user: { uid: 'member-user' },
        username: 'Member',
      });

      const result = kickMember(guild.id, 'regular-user');
      expect(result).toBe(true);
    });

    it('should not allow officer to kick another officer', () => {
      promoteToOfficer(guild.id, 'member-user');

      setState({
        user: { uid: 'officer2' },
        username: 'Officer2',
        level: 3,
        myGuildId: null,
      });
      joinGuild(guild.id);

      setState({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
      });
      promoteToOfficer(guild.id, 'officer2');

      setState({
        user: { uid: 'member-user' },
        username: 'Member',
      });

      const result = kickMember(guild.id, 'officer2');
      expect(result).toBe(false);
    });

    it('should reject kicking self', () => {
      const result = kickMember(guild.id, 'test-user-id');
      expect(result).toBe(false);
    });

    it('should reject kicking leader', () => {
      promoteToOfficer(guild.id, 'member-user');

      setState({
        user: { uid: 'member-user' },
        username: 'Member',
      });

      const result = kickMember(guild.id, 'test-user-id');
      expect(result).toBe(false);
    });

    it('should reject if not leader or officer', () => {
      setState({
        user: { uid: 'random-user' },
        username: 'Random',
      });

      const result = kickMember(guild.id, 'member-user');
      expect(result).toBe(false);
    });

    it('should reject if guild not found', () => {
      const result = kickMember('non-existent', 'member-user');
      expect(result).toBe(false);
    });

    it('should reject if member not found', () => {
      const result = kickMember(guild.id, 'non-existent');
      expect(result).toBe(false);
    });
  });

  // ==================== updateGuildSettings ====================
  describe('updateGuildSettings', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);
    });

    it('should update guild name', () => {
      const result = updateGuildSettings(guild.id, { name: 'New Name' });
      expect(result).toBe(true);

      const updated = getGuildById(guild.id);
      expect(updated.name).toBe('New Name');
    });

    it('should update guild description', () => {
      updateGuildSettings(guild.id, { description: 'New description' });

      const updated = getGuildById(guild.id);
      expect(updated.description).toBe('New description');
    });

    it('should update isPublic', () => {
      updateGuildSettings(guild.id, { isPublic: false });

      const updated = getGuildById(guild.id);
      expect(updated.isPublic).toBe(false);
    });

    it('should update minLevel', () => {
      updateGuildSettings(guild.id, { minLevel: 10 });

      const updated = getGuildById(guild.id);
      expect(updated.settings.minLevel).toBe(10);
    });

    it('should update allowChat', () => {
      updateGuildSettings(guild.id, { allowChat: false });

      const updated = getGuildById(guild.id);
      expect(updated.settings.allowChat).toBe(false);
    });

    it('should update icon (emoji)', () => {
      updateGuildSettings(guild.id, { icon: '🎯' });

      const updated = getGuildById(guild.id);
      expect(updated.settings.icon).toBe('🎯');
    });

    it('should update color (hex)', () => {
      updateGuildSettings(guild.id, { color: '#FF0000' });

      const updated = getGuildById(guild.id);
      expect(updated.settings.color).toBe('#FF0000');
    });

    it('should reject invalid color format', () => {
      updateGuildSettings(guild.id, { color: 'red' });

      const updated = getGuildById(guild.id);
      expect(updated.settings.color).not.toBe('red');
    });

    it('should reject if not leader', () => {
      setState({
        user: { uid: 'other-user' },
        username: 'Other',
      });

      const result = updateGuildSettings(guild.id, { name: 'New Name' });
      expect(result).toBe(false);
    });

    it('should reject if guild not found', () => {
      const result = updateGuildSettings('non-existent', { name: 'New Name' });
      expect(result).toBe(false);
    });

    it('should validate name length', () => {
      updateGuildSettings(guild.id, { name: 'AB' });

      const updated = getGuildById(guild.id);
      expect(updated.name).toBe('Test Guild'); // Unchanged
    });
  });

  // ==================== getMyGuild ====================
  describe('getMyGuild', () => {
    it('should return current user guild', () => {
      const guild = createGuild('My Guild', 'Test');

      const myGuild = getMyGuild();
      expect(myGuild).not.toBeNull();
      expect(myGuild.id).toBe(guild.id);
    });

    it('should return null if not in a guild', () => {
      const myGuild = getMyGuild();
      expect(myGuild).toBeNull();
    });

    it('should use myGuildId for faster lookup', () => {
      const guild = createGuild('My Guild', 'Test');

      const myGuild = getMyGuild();
      expect(myGuild.id).toBe(guild.id);
    });
  });

  // ==================== getGuildMembers ====================
  describe('getGuildMembers', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);

      setState({
        user: { uid: 'member-user' },
        username: 'Member',
        level: 3,
        myGuildId: null,
      });
      joinGuild(guild.id);
    });

    it('should return active members by default', () => {
      const members = getGuildMembers(guild.id);
      expect(members).toHaveLength(2);
      expect(members.every(m => m.status === MembershipStatus.ACTIVE)).toBe(true);
    });

    it('should include inactive members when activeOnly is false', () => {
      setState({
        user: { uid: 'member-user' },
        username: 'Member',
      });
      leaveGuild(guild.id);

      const members = getGuildMembers(guild.id, false);
      expect(members).toHaveLength(2);
    });

    it('should return empty array if guild not found', () => {
      const members = getGuildMembers('non-existent');
      expect(members).toEqual([]);
    });
  });

  // ==================== getGuildStats ====================
  describe('getGuildStats', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);
    });

    it('should return guild statistics', () => {
      const stats = getGuildStats(guild.id);

      expect(stats).toHaveProperty('totalXp');
      expect(stats).toHaveProperty('totalSpots');
      expect(stats).toHaveProperty('totalDistance');
      expect(stats).toHaveProperty('totalMembers');
      expect(stats).toHaveProperty('avgXpPerMember');
      expect(stats).toHaveProperty('rank');
    });

    it('should calculate totalMembers correctly', () => {
      setState({
        user: { uid: 'member-user' },
        username: 'Member',
        level: 3,
        myGuildId: null,
      });
      joinGuild(guild.id);

      const stats = getGuildStats(guild.id);
      expect(stats.totalMembers).toBe(2);
    });

    it('should return default stats for non-existent guild', () => {
      const stats = getGuildStats('non-existent');
      expect(stats.totalXp).toBe(0);
      expect(stats.totalMembers).toBe(0);
    });

    it('should calculate rank correctly', () => {
      const stats = getGuildStats(guild.id);
      expect(stats.rank).toBe(1);
    });
  });

  // ==================== getGuildLeaderboard ====================
  describe('getGuildLeaderboard', () => {
    beforeEach(() => {
      createGuild('Guild 1', 'First guild', true);

      setState({
        user: { uid: 'user2' },
        username: 'User2',
        level: 5,
        myGuildId: null,
        guilds: getState().guilds,
      });
      createGuild('Guild 2', 'Second guild', true);

      setState({
        user: { uid: 'user3' },
        username: 'User3',
        level: 5,
        myGuildId: null,
        guilds: getState().guilds,
      });
      createGuild('Guild 3', 'Third guild', true);
    });

    it('should return sorted guilds by XP', () => {
      const leaderboard = getGuildLeaderboard();
      expect(leaderboard).toHaveLength(3);
    });

    it('should limit results', () => {
      const leaderboard = getGuildLeaderboard(2);
      expect(leaderboard).toHaveLength(2);
    });

    it('should include rank in results', () => {
      const leaderboard = getGuildLeaderboard();
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[2].rank).toBe(3);
    });

    it('should include guild info', () => {
      const leaderboard = getGuildLeaderboard();
      const first = leaderboard[0];

      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('totalXp');
      expect(first).toHaveProperty('totalMembers');
    });
  });

  // ==================== getAllGuilds ====================
  describe('getAllGuilds', () => {
    beforeEach(() => {
      createGuild('Public Guild', 'Public', true);

      setState({
        user: { uid: 'user2' },
        username: 'User2',
        myGuildId: null,
        guilds: getState().guilds,
      });
      createGuild('Private Guild', 'Private', false);
    });

    it('should return all guilds', () => {
      const guilds = getAllGuilds();
      expect(guilds).toHaveLength(2);
    });

    it('should return only public guilds when publicOnly is true', () => {
      const guilds = getAllGuilds(true);
      expect(guilds).toHaveLength(1);
      expect(guilds[0].isPublic).toBe(true);
    });
  });

  // ==================== getGuildById ====================
  describe('getGuildById', () => {
    it('should return guild by ID', () => {
      const created = createGuild('Test Guild', 'Test');
      const found = getGuildById(created.id);

      expect(found).not.toBeNull();
      expect(found.id).toBe(created.id);
    });

    it('should return null for non-existent ID', () => {
      const found = getGuildById('non-existent');
      expect(found).toBeNull();
    });
  });

  // ==================== searchGuilds ====================
  describe('searchGuilds', () => {
    beforeEach(() => {
      createGuild('Alpha Travelers', 'Traveling around Europe', true);

      setState({
        user: { uid: 'user2' },
        username: 'User2',
        myGuildId: null,
        guilds: getState().guilds,
      });
      createGuild('Beta Hitchhikers', 'Hitchhiking community', true);

      setState({
        user: { uid: 'user3' },
        username: 'User3',
        myGuildId: null,
        guilds: getState().guilds,
      });
      createGuild('Private Secret', 'Secret guild', false);
    });

    it('should search by name', () => {
      const results = searchGuilds('alpha');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alpha Travelers');
    });

    it('should search by description', () => {
      const results = searchGuilds('hitchhiking');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Beta Hitchhikers');
    });

    it('should be case insensitive', () => {
      const results = searchGuilds('TRAVELERS');
      expect(results).toHaveLength(1);
    });

    it('should return only public guilds', () => {
      const results = searchGuilds('secret');
      expect(results).toHaveLength(0);
    });

    it('should return all public guilds with empty query', () => {
      const results = searchGuilds('');
      expect(results).toHaveLength(2);
    });
  });

  // ==================== getMyRole ====================
  describe('getMyRole', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);
    });

    it('should return LEADER for guild creator', () => {
      const role = getMyRole(guild.id);
      expect(role).toBe(GuildRole.LEADER);
    });

    it('should return MEMBER for regular member', () => {
      setState({
        user: { uid: 'member-user' },
        username: 'Member',
        level: 3,
        myGuildId: null,
      });
      joinGuild(guild.id);

      const role = getMyRole(guild.id);
      expect(role).toBe(GuildRole.MEMBER);
    });

    it('should return null if not a member', () => {
      setState({
        user: { uid: 'outsider' },
        username: 'Outsider',
        myGuildId: null,
      });

      const role = getMyRole(guild.id);
      expect(role).toBeNull();
    });

    it('should return null for non-existent guild', () => {
      const role = getMyRole('non-existent');
      expect(role).toBeNull();
    });
  });

  // ==================== Contributions ====================
  describe('contributeXp', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);
    });

    it('should add XP to member contribution', () => {
      contributeXp(100);

      const members = getGuildMembers(guild.id);
      const me = members.find(m => m.id === 'test-user-id');
      expect(me.xpContributed).toBe(100);
    });

    it('should add XP to guild total', () => {
      contributeXp(100);

      const stats = getGuildStats(guild.id);
      expect(stats.totalXp).toBe(100);
    });

    it('should do nothing if not in guild', () => {
      setState({
        user: { uid: 'outsider' },
        username: 'Outsider',
        myGuildId: null,
      });

      contributeXp(100);

      const stats = getGuildStats(guild.id);
      expect(stats.totalXp).toBe(0);
    });
  });

  describe('contributeSpot', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);
    });

    it('should add spot to member contribution', () => {
      contributeSpot();

      const members = getGuildMembers(guild.id);
      const me = members.find(m => m.id === 'test-user-id');
      expect(me.spotsContributed).toBe(1);
    });

    it('should add spot to guild total', () => {
      contributeSpot();

      const stats = getGuildStats(guild.id);
      expect(stats.totalSpots).toBe(1);
    });
  });

  describe('contributeDistance', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);
    });

    it('should add distance to member contribution', () => {
      contributeDistance(100);

      const members = getGuildMembers(guild.id);
      const me = members.find(m => m.id === 'test-user-id');
      expect(me.distanceContributed).toBe(100);
    });

    it('should add distance to guild total', () => {
      contributeDistance(100);

      const stats = getGuildStats(guild.id);
      expect(stats.totalDistance).toBe(100);
    });
  });

  // ==================== Rendering ====================
  describe('renderGuildCard', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test description', true);
    });

    it('should render guild name', () => {
      const html = renderGuildCard(guild);
      expect(html).toContain('Test Guild');
    });

    it('should render guild description', () => {
      const html = renderGuildCard(guild);
      expect(html).toContain('Test description');
    });

    it('should render leader name', () => {
      const html = renderGuildCard(guild);
      expect(html).toContain('TestUser');
    });

    it('should render join button for non-members on public guilds', () => {
      setState({
        user: { uid: 'outsider' },
        username: 'Outsider',
        myGuildId: null,
      });

      const html = renderGuildCard(guild);
      expect(html).toContain('joinGuild');
    });

    it('should render request button for non-members on private guilds', () => {
      guild.isPublic = false;

      setState({
        user: { uid: 'outsider' },
        username: 'Outsider',
        myGuildId: null,
      });

      const html = renderGuildCard(guild);
      expect(html).toContain('requestJoinGuild');
    });

    it('should render view button for members', () => {
      const html = renderGuildCard(guild);
      expect(html).toContain('viewGuild');
    });

    it('should include data-guild-id attribute', () => {
      const html = renderGuildCard(guild);
      expect(html).toContain(`data-guild-id="${guild.id}"`);
    });
  });

  describe('renderGuildList', () => {
    it('should render empty state when no guilds', () => {
      const html = renderGuildList([]);
      expect(html).toContain('noGuildsFound');
      expect(html).toContain('showCreateGuild');
    });

    it('should render all guilds', () => {
      const guild1 = createGuild('Guild 1', 'First', true);

      setState({
        user: { uid: 'user2' },
        username: 'User2',
        myGuildId: null,
        guilds: getState().guilds,
      });
      const guild2 = createGuild('Guild 2', 'Second', true);

      const guilds = getAllGuilds();
      const html = renderGuildList(guilds);

      expect(html).toContain('Guild 1');
      expect(html).toContain('Guild 2');
    });

    it('should render as grid', () => {
      const guild = createGuild('Test Guild', 'Test', true);
      const html = renderGuildList([guild]);
      expect(html).toContain('grid gap-4');
    });
  });

  describe('renderMemberList', () => {
    let guild;

    beforeEach(() => {
      guild = createGuild('Test Guild', 'Test', true);

      setState({
        user: { uid: 'member-user' },
        username: 'MemberName',
        level: 3,
        avatar: '😎',
        myGuildId: null,
      });
      joinGuild(guild.id);

      setState({
        user: { uid: 'test-user-id' },
        username: 'TestUser',
      });
    });

    it('should render member names', () => {
      const members = getGuildMembers(guild.id);
      const html = renderMemberList(members, guild.id);

      expect(html).toContain('MemberName');
      expect(html).toContain('TestUser');
    });

    it('should render member avatars', () => {
      const members = getGuildMembers(guild.id);
      const html = renderMemberList(members, guild.id);

      expect(html).toContain('😎');
    });

    it('should render XP contributions', () => {
      const members = getGuildMembers(guild.id);
      const html = renderMemberList(members, guild.id);

      expect(html).toContain('XP');
    });

    it('should render action buttons for leader on members', () => {
      const members = getGuildMembers(guild.id);
      const html = renderMemberList(members, guild.id);

      expect(html).toContain('promoteToOfficer');
      expect(html).toContain('kickMember');
    });
  });

  // ==================== Default Export ====================
  describe('default export', () => {
    it('should export all functions', async () => {
      const guildsModule = await import('../src/services/guilds.js');
      const defaultExport = guildsModule.default;

      expect(defaultExport.createGuild).toBeDefined();
      expect(defaultExport.joinGuild).toBeDefined();
      expect(defaultExport.requestJoinGuild).toBeDefined();
      expect(defaultExport.leaveGuild).toBeDefined();
      expect(defaultExport.getMyGuild).toBeDefined();
      expect(defaultExport.getGuildMembers).toBeDefined();
      expect(defaultExport.getGuildStats).toBeDefined();
      expect(defaultExport.getGuildLeaderboard).toBeDefined();
      expect(defaultExport.promoteToOfficer).toBeDefined();
      expect(defaultExport.kickMember).toBeDefined();
      expect(defaultExport.updateGuildSettings).toBeDefined();
      expect(defaultExport.renderGuildCard).toBeDefined();
      expect(defaultExport.renderGuildList).toBeDefined();
      expect(defaultExport.GuildRole).toBeDefined();
      expect(defaultExport.MembershipStatus).toBeDefined();
    });
  });
});
