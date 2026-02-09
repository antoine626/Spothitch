/**
 * Temporary Events Service Tests
 * Feature #164 - Evenements temporaires
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EventType,
  sampleEvents,
  getAllEvents,
  getActiveEvents,
  getUpcomingEvents,
  getPastEvents,
  getEventDetails,
  getEventStatus,
  joinEvent,
  leaveEvent,
  hasJoinedEvent,
  getEventProgress,
  updateEventProgress,
  claimEventReward,
  getEventLeaderboard,
  getEventTimeRemaining,
  getActiveXPMultiplier,
  renderEventCard,
  renderEventBanner,
} from '../src/services/temporaryEvents.js';
import { getState, setState, resetState } from '../src/stores/state.js';

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}));

// Mock gamification
vi.mock('../src/services/gamification.js', () => ({
  addPoints: vi.fn(),
}));

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key, params) => {
    const translations = {
      eventNotFound: 'Event not found',
      eventEnded: 'Event ended',
      eventNotStarted: 'Event not started',
      eventAlreadyJoined: 'Already joined',
      eventJoined: `Joined "${params?.name || ''}"`,
      eventNotJoined: 'Not joined',
      eventLeft: `Left "${params?.name || ''}"`,
      eventCompleted: `Completed "${params?.name || ''}"`,
      eventNotCompleted: 'Not completed',
      eventRewardsAlreadyClaimed: 'Already claimed',
      eventRewardsClaimed: 'Rewards claimed',
    };
    return translations[key] || key;
  }),
}));

describe('Temporary Events Service', () => {
  beforeEach(() => {
    resetState();
    setState({
      user: { uid: 'user1' },
      username: 'TestUser',
      avatar: '🤙',
      lang: 'fr',
      badges: [],
      temporaryEvents: [...sampleEvents],
      eventParticipation: {},
    });
  });

  describe('EventType enum', () => {
    it('should have all event types defined', () => {
      expect(EventType.DOUBLE_XP).toBe('double_xp');
      expect(EventType.COUNTRY_FOCUS).toBe('country_focus');
      expect(EventType.COMMUNITY_CHALLENGE).toBe('community_challenge');
      expect(EventType.SEASONAL).toBe('seasonal');
    });

    it('should have exactly 4 event types', () => {
      expect(Object.keys(EventType).length).toBe(4);
    });
  });

  describe('sampleEvents', () => {
    it('should have sample events defined', () => {
      expect(sampleEvents).toBeDefined();
      expect(sampleEvents.length).toBeGreaterThan(0);
    });

    it('should have all required fields in each event', () => {
      sampleEvents.forEach(event => {
        expect(event.id).toBeDefined();
        expect(event.type).toBeDefined();
        expect(event.name).toBeDefined();
        expect(event.description).toBeDefined();
        expect(event.startDate).toBeDefined();
        expect(event.endDate).toBeDefined();
        expect(event.rewards).toBeDefined();
      });
    });

    it('should have events of different types', () => {
      const types = sampleEvents.map(e => e.type);
      expect(types).toContain(EventType.DOUBLE_XP);
      expect(types).toContain(EventType.COUNTRY_FOCUS);
      expect(types).toContain(EventType.COMMUNITY_CHALLENGE);
      expect(types).toContain(EventType.SEASONAL);
    });
  });

  describe('getAllEvents', () => {
    it('should return all events', () => {
      const events = getAllEvents();
      expect(events.length).toBe(sampleEvents.length);
    });

    it('should initialize state if not present', () => {
      setState({ temporaryEvents: undefined });
      const events = getAllEvents();
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('getActiveEvents', () => {
    it('should return events currently running', () => {
      // Create an event that is currently active
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(), // 1 hour from now
      };
      setState({
        temporaryEvents: [activeEvent],
      });

      const active = getActiveEvents();
      expect(active.length).toBe(1);
      expect(active[0].id).toBe('active_test');
    });

    it('should not return events that have not started', () => {
      const now = new Date();
      const futureEvent = {
        ...sampleEvents[0],
        id: 'future_test',
        startDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60 * 2).toISOString(),
      };
      setState({
        temporaryEvents: [futureEvent],
      });

      const active = getActiveEvents();
      expect(active.length).toBe(0);
    });

    it('should not return events that have ended', () => {
      const now = new Date();
      const pastEvent = {
        ...sampleEvents[0],
        id: 'past_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        endDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      };
      setState({
        temporaryEvents: [pastEvent],
      });

      const active = getActiveEvents();
      expect(active.length).toBe(0);
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return events that have not started yet', () => {
      const now = new Date();
      const futureEvent = {
        ...sampleEvents[0],
        id: 'future_test',
        startDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60 * 2).toISOString(),
      };
      setState({
        temporaryEvents: [futureEvent],
      });

      const upcoming = getUpcomingEvents();
      expect(upcoming.length).toBe(1);
      expect(upcoming[0].id).toBe('future_test');
    });

    it('should sort upcoming events by start date', () => {
      const now = new Date();
      const events = [
        {
          ...sampleEvents[0],
          id: 'future_2',
          startDate: new Date(now.getTime() + 1000 * 60 * 60 * 3).toISOString(),
          endDate: new Date(now.getTime() + 1000 * 60 * 60 * 4).toISOString(),
        },
        {
          ...sampleEvents[0],
          id: 'future_1',
          startDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
          endDate: new Date(now.getTime() + 1000 * 60 * 60 * 2).toISOString(),
        },
      ];
      setState({ temporaryEvents: events });

      const upcoming = getUpcomingEvents();
      expect(upcoming[0].id).toBe('future_1');
      expect(upcoming[1].id).toBe('future_2');
    });
  });

  describe('getPastEvents', () => {
    it('should return events that have ended', () => {
      const now = new Date();
      const pastEvent = {
        ...sampleEvents[0],
        id: 'past_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        endDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      };
      setState({
        temporaryEvents: [pastEvent],
      });

      const past = getPastEvents();
      expect(past.length).toBe(1);
      expect(past[0].id).toBe('past_test');
    });

    it('should sort past events by end date (most recent first)', () => {
      const now = new Date();
      const events = [
        {
          ...sampleEvents[0],
          id: 'past_old',
          startDate: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
          endDate: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(),
        },
        {
          ...sampleEvents[0],
          id: 'past_recent',
          startDate: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
          endDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        },
      ];
      setState({ temporaryEvents: events });

      const past = getPastEvents();
      expect(past[0].id).toBe('past_recent');
      expect(past[1].id).toBe('past_old');
    });
  });

  describe('getEventDetails', () => {
    it('should return event by ID', () => {
      const event = getEventDetails(sampleEvents[0].id);
      expect(event).toBeDefined();
      expect(event.id).toBe(sampleEvents[0].id);
    });

    it('should return null for non-existent event', () => {
      const event = getEventDetails('non_existent');
      expect(event).toBeNull();
    });
  });

  describe('getEventStatus', () => {
    it('should return "active" for running events', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
      };
      setState({ temporaryEvents: [activeEvent] });

      const status = getEventStatus('active_test');
      expect(status).toBe('active');
    });

    it('should return "upcoming" for future events', () => {
      const now = new Date();
      const futureEvent = {
        ...sampleEvents[0],
        id: 'future_test',
        startDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60 * 2).toISOString(),
      };
      setState({ temporaryEvents: [futureEvent] });

      const status = getEventStatus('future_test');
      expect(status).toBe('upcoming');
    });

    it('should return "ended" for past events', () => {
      const now = new Date();
      const pastEvent = {
        ...sampleEvents[0],
        id: 'past_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        endDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      };
      setState({ temporaryEvents: [pastEvent] });

      const status = getEventStatus('past_test');
      expect(status).toBe('ended');
    });

    it('should return "unknown" for non-existent events', () => {
      const status = getEventStatus('non_existent');
      expect(status).toBe('unknown');
    });
  });

  describe('joinEvent', () => {
    it('should allow joining an active event', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
      };
      setState({ temporaryEvents: [activeEvent], eventParticipation: {} });

      const result = joinEvent('active_test');
      expect(result).toBe(true);
      expect(hasJoinedEvent('active_test')).toBe(true);
    });

    it('should not allow joining an ended event', () => {
      const now = new Date();
      const pastEvent = {
        ...sampleEvents[0],
        id: 'past_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        endDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      };
      setState({ temporaryEvents: [pastEvent] });

      const result = joinEvent('past_test');
      expect(result).toBe(false);
    });

    it('should not allow joining an upcoming event', () => {
      const now = new Date();
      const futureEvent = {
        ...sampleEvents[0],
        id: 'future_test',
        startDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60 * 2).toISOString(),
      };
      setState({ temporaryEvents: [futureEvent] });

      const result = joinEvent('future_test');
      expect(result).toBe(false);
    });

    it('should not allow joining twice', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
      };
      setState({ temporaryEvents: [activeEvent], eventParticipation: {} });

      joinEvent('active_test');
      const result = joinEvent('active_test');
      expect(result).toBe(false);
    });

    it('should return false for non-existent event', () => {
      const result = joinEvent('non_existent');
      expect(result).toBe(false);
    });
  });

  describe('leaveEvent', () => {
    it('should allow leaving an event', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
      };
      setState({ temporaryEvents: [activeEvent], eventParticipation: {} });

      joinEvent('active_test');
      const result = leaveEvent('active_test');
      expect(result).toBe(true);
      expect(hasJoinedEvent('active_test')).toBe(false);
    });

    it('should not allow leaving if not joined', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
      };
      setState({ temporaryEvents: [activeEvent], eventParticipation: {} });

      const result = leaveEvent('active_test');
      expect(result).toBe(false);
    });

    it('should return false for non-existent event', () => {
      const result = leaveEvent('non_existent');
      expect(result).toBe(false);
    });
  });

  describe('hasJoinedEvent', () => {
    it('should return true if joined', () => {
      setState({
        eventParticipation: {
          'test_event': { joinedAt: new Date().toISOString() },
        },
      });

      expect(hasJoinedEvent('test_event')).toBe(true);
    });

    it('should return false if not joined', () => {
      setState({ eventParticipation: {} });
      expect(hasJoinedEvent('test_event')).toBe(false);
    });
  });

  describe('getEventProgress', () => {
    it('should return default values when not joined', () => {
      const progress = getEventProgress('test_event');
      expect(progress.joined).toBe(false);
      expect(progress.progress).toBe(0);
      expect(progress.percentage).toBe(0);
      expect(progress.completed).toBe(false);
    });

    it('should return progress when joined', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        requirements: { minCheckins: 10 },
      };
      setState({
        temporaryEvents: [activeEvent],
        eventParticipation: {
          'active_test': { joinedAt: new Date().toISOString(), progress: 5 },
        },
      });

      const progress = getEventProgress('active_test');
      expect(progress.joined).toBe(true);
      expect(progress.progress).toBe(5);
      expect(progress.target).toBe(10);
      expect(progress.percentage).toBe(50);
      expect(progress.completed).toBe(false);
    });

    it('should mark as completed when target reached', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        requirements: { minCheckins: 10 },
      };
      setState({
        temporaryEvents: [activeEvent],
        eventParticipation: {
          'active_test': { joinedAt: new Date().toISOString(), progress: 10 },
        },
      });

      const progress = getEventProgress('active_test');
      expect(progress.completed).toBe(true);
      expect(progress.percentage).toBe(100);
    });
  });

  describe('updateEventProgress', () => {
    it('should update progress for joined event', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        requirements: { minCheckins: 10 },
      };
      setState({
        temporaryEvents: [activeEvent],
        eventParticipation: {
          'active_test': { joinedAt: new Date().toISOString(), progress: 0 },
        },
      });

      const result = updateEventProgress('active_test', 5);
      expect(result).toBe(true);

      const progress = getEventProgress('active_test');
      expect(progress.progress).toBe(5);
    });

    it('should not update if not joined', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
      };
      setState({
        temporaryEvents: [activeEvent],
        eventParticipation: {},
      });

      const result = updateEventProgress('active_test', 5);
      expect(result).toBe(false);
    });

    it('should not update if event is not active', () => {
      const now = new Date();
      const pastEvent = {
        ...sampleEvents[0],
        id: 'past_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        endDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      };
      setState({
        temporaryEvents: [pastEvent],
        eventParticipation: {
          'past_test': { joinedAt: new Date().toISOString(), progress: 0 },
        },
      });

      const result = updateEventProgress('past_test', 5);
      expect(result).toBe(false);
    });
  });

  describe('claimEventReward', () => {
    it('should allow claiming rewards when completed', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        requirements: { minCheckins: 5 },
        rewards: [
          { type: 'points', amount: 100, condition: 'completion' },
        ],
      };
      setState({
        temporaryEvents: [activeEvent],
        eventParticipation: {
          'active_test': { joinedAt: new Date().toISOString(), progress: 5, completed: true },
        },
        badges: [],
      });

      const rewards = claimEventReward('active_test');
      expect(rewards).not.toBeNull();
      expect(rewards.length).toBe(1);
    });

    it('should not allow claiming if not completed', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        requirements: { minCheckins: 10 },
      };
      setState({
        temporaryEvents: [activeEvent],
        eventParticipation: {
          'active_test': { joinedAt: new Date().toISOString(), progress: 3 },
        },
      });

      const rewards = claimEventReward('active_test');
      expect(rewards).toBeNull();
    });

    it('should not allow claiming twice', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        requirements: { minCheckins: 5 },
        rewards: [{ type: 'points', amount: 100, condition: 'completion' }],
      };
      setState({
        temporaryEvents: [activeEvent],
        eventParticipation: {
          'active_test': {
            joinedAt: new Date().toISOString(),
            progress: 5,
            completed: true,
            rewardsClaimed: true,
          },
        },
      });

      const rewards = claimEventReward('active_test');
      expect(rewards).toBeNull();
    });

    it('should return null for non-existent event', () => {
      const rewards = claimEventReward('non_existent');
      expect(rewards).toBeNull();
    });

    it('should return null if not joined', () => {
      setState({ eventParticipation: {} });
      const rewards = claimEventReward(sampleEvents[0].id);
      expect(rewards).toBeNull();
    });
  });

  describe('getEventLeaderboard', () => {
    it('should return leaderboard for event', () => {
      const leaderboard = getEventLeaderboard(sampleEvents[0].id);
      expect(leaderboard).toBeDefined();
      expect(leaderboard.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent event', () => {
      const leaderboard = getEventLeaderboard('non_existent');
      expect(leaderboard).toEqual([]);
    });

    it('should include current user when participating', () => {
      setState({
        eventParticipation: {
          [sampleEvents[0].id]: { joinedAt: new Date().toISOString(), progress: 25 },
        },
      });

      const leaderboard = getEventLeaderboard(sampleEvents[0].id);
      const userEntry = leaderboard.find(e => e.isCurrentUser);
      expect(userEntry).toBeDefined();
      expect(userEntry.progress).toBe(25);
    });

    it('should rank entries correctly', () => {
      const leaderboard = getEventLeaderboard(sampleEvents[0].id);
      for (let i = 1; i < leaderboard.length; i++) {
        expect(leaderboard[i].progress).toBeLessThanOrEqual(leaderboard[i - 1].progress);
      }
    });
  });

  describe('getEventTimeRemaining', () => {
    it('should return time remaining for active event', () => {
      const now = new Date();
      const activeEvent = {
        ...sampleEvents[0],
        id: 'active_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        endDate: new Date(now.getTime() + 1000 * 60 * 60 * 25).toISOString(), // 25 hours
      };
      setState({ temporaryEvents: [activeEvent] });

      const time = getEventTimeRemaining('active_test');
      expect(time.expired).toBe(false);
      expect(time.days).toBe(1);
      expect(time.hours).toBeGreaterThanOrEqual(0);
    });

    it('should return expired for past event', () => {
      const now = new Date();
      const pastEvent = {
        ...sampleEvents[0],
        id: 'past_test',
        startDate: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        endDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      };
      setState({ temporaryEvents: [pastEvent] });

      const time = getEventTimeRemaining('past_test');
      expect(time.expired).toBe(true);
      expect(time.days).toBe(0);
      expect(time.hours).toBe(0);
      expect(time.minutes).toBe(0);
    });

    it('should return expired for non-existent event', () => {
      const time = getEventTimeRemaining('non_existent');
      expect(time.expired).toBe(true);
    });
  });

  describe('getActiveXPMultiplier', () => {
    it('should return 1.0 when no active events', () => {
      setState({ temporaryEvents: [] });
      const multiplier = getActiveXPMultiplier();
      expect(multiplier).toBe(1.0);
    });

    it('should return highest multiplier from active events', () => {
      const now = new Date();
      const events = [
        {
          ...sampleEvents[0],
          id: 'event1',
          bonusMultiplier: 1.5,
          startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
          endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        },
        {
          ...sampleEvents[0],
          id: 'event2',
          bonusMultiplier: 2.0,
          startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
          endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        },
      ];
      setState({ temporaryEvents: events });

      const multiplier = getActiveXPMultiplier();
      expect(multiplier).toBe(2.0);
    });

    it('should ignore events without bonus multiplier', () => {
      const now = new Date();
      const events = [
        {
          ...sampleEvents[0],
          id: 'event1',
          bonusMultiplier: undefined,
          startDate: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
          endDate: new Date(now.getTime() + 1000 * 60 * 60).toISOString(),
        },
      ];
      setState({ temporaryEvents: events });

      const multiplier = getActiveXPMultiplier();
      expect(multiplier).toBe(1.0);
    });
  });

  describe('renderEventCard', () => {
    it('should return HTML string', () => {
      const html = renderEventCard(sampleEvents[0]);
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should include event name', () => {
      const html = renderEventCard(sampleEvents[0]);
      expect(html).toContain(sampleEvents[0].name);
    });

    it('should include event icon', () => {
      const html = renderEventCard(sampleEvents[0]);
      expect(html).toContain(sampleEvents[0].icon);
    });

    it('should include rewards section', () => {
      const eventWithRewards = sampleEvents.find(e => e.rewards && e.rewards.length > 0);
      if (eventWithRewards) {
        const html = renderEventCard(eventWithRewards);
        expect(html).toContain('pts');
      }
    });

    it('should handle community challenge type', () => {
      const communityEvent = sampleEvents.find(e => e.type === EventType.COMMUNITY_CHALLENGE);
      if (communityEvent) {
        const html = renderEventCard(communityEvent);
        // Should contain community progress section (French text "Progres communautaire")
        expect(html).toContain('communautaire');
      }
    });
  });

  describe('renderEventBanner', () => {
    it('should return HTML string', () => {
      const html = renderEventBanner(sampleEvents[0]);
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should include event name', () => {
      const html = renderEventBanner(sampleEvents[0]);
      expect(html).toContain(sampleEvents[0].name);
    });

    it('should include event icon', () => {
      const html = renderEventBanner(sampleEvents[0]);
      expect(html).toContain(sampleEvents[0].icon);
    });

    it('should include view button', () => {
      const html = renderEventBanner(sampleEvents[0]);
      expect(html).toContain('viewEventDetails');
    });
  });

  describe('default export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/temporaryEvents.js');
      const defaultExport = module.default;

      expect(defaultExport.EventType).toBeDefined();
      expect(defaultExport.getAllEvents).toBeDefined();
      expect(defaultExport.getActiveEvents).toBeDefined();
      expect(defaultExport.getUpcomingEvents).toBeDefined();
      expect(defaultExport.getPastEvents).toBeDefined();
      expect(defaultExport.getEventDetails).toBeDefined();
      expect(defaultExport.getEventStatus).toBeDefined();
      expect(defaultExport.joinEvent).toBeDefined();
      expect(defaultExport.leaveEvent).toBeDefined();
      expect(defaultExport.hasJoinedEvent).toBeDefined();
      expect(defaultExport.getEventProgress).toBeDefined();
      expect(defaultExport.updateEventProgress).toBeDefined();
      expect(defaultExport.claimEventReward).toBeDefined();
      expect(defaultExport.getEventLeaderboard).toBeDefined();
      expect(defaultExport.getEventTimeRemaining).toBeDefined();
      expect(defaultExport.getActiveXPMultiplier).toBeDefined();
      expect(defaultExport.renderEventCard).toBeDefined();
      expect(defaultExport.renderEventBanner).toBeDefined();
    });
  });
});
