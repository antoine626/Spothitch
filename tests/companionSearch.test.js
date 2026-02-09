/**
 * Companion Search Service Tests
 * Feature #188 - Tests for companion search functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PlanStatus,
  ResponseStatus,
  COMPATIBILITY_WEIGHTS,
  TravelStyles,
  postTravelPlan,
  updateTravelPlan,
  cancelTravelPlan,
  getTravelPlanById,
  getMyTravelPlans,
  getMyActivePlan,
  searchCompanions,
  calculateCompatibility,
  respondToTravelPlan,
  acceptResponse,
  declineResponse,
  withdrawResponse,
  getMyPlanResponses,
  getMyResponses,
  renderTravelPlanCard,
  renderResponseCard,
  clearAllCompanionData,
} from '../src/services/companionSearch.js';

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

describe('Companion Search Service', () => {
  beforeEach(() => {
    mockState = {
      user: { uid: 'user123' },
      username: 'TestUser',
      avatar: '🎒',
      level: 5,
      verificationLevel: 2,
    };
    mockStorage = {};
    vi.clearAllMocks();
  });

  // ========================================
  // CONSTANTS
  // ========================================

  describe('Constants', () => {
    it('should have PlanStatus defined', () => {
      expect(PlanStatus).toBeDefined();
      expect(PlanStatus.ACTIVE).toBe('active');
      expect(PlanStatus.PAUSED).toBe('paused');
      expect(PlanStatus.COMPLETED).toBe('completed');
      expect(PlanStatus.CANCELLED).toBe('cancelled');
    });

    it('should have ResponseStatus defined', () => {
      expect(ResponseStatus).toBeDefined();
      expect(ResponseStatus.PENDING).toBe('pending');
      expect(ResponseStatus.ACCEPTED).toBe('accepted');
      expect(ResponseStatus.DECLINED).toBe('declined');
      expect(ResponseStatus.WITHDRAWN).toBe('withdrawn');
    });

    it('should have COMPATIBILITY_WEIGHTS defined', () => {
      expect(COMPATIBILITY_WEIGHTS).toBeDefined();
      expect(COMPATIBILITY_WEIGHTS.sameDestination).toBe(30);
      expect(COMPATIBILITY_WEIGHTS.overlappingDates).toBe(25);
      expect(COMPATIBILITY_WEIGHTS.sharedLanguages).toBe(20);
    });

    it('should have TravelStyles defined', () => {
      expect(TravelStyles).toBeDefined();
      expect(TravelStyles.FAST).toBeDefined();
      expect(TravelStyles.RELAXED).toBeDefined();
      expect(TravelStyles.ADVENTUROUS).toBeDefined();
      expect(TravelStyles.BUDGET).toBeDefined();
      expect(TravelStyles.SOCIAL).toBeDefined();
    });

    it('should have all TravelStyles with required properties', () => {
      Object.values(TravelStyles).forEach((style) => {
        expect(style.id).toBeDefined();
        expect(style.label).toBeDefined();
        expect(style.icon).toBeDefined();
        expect(style.description).toBeDefined();
      });
    });
  });

  // ========================================
  // POST TRAVEL PLAN
  // ========================================

  describe('postTravelPlan', () => {
    it('should create a travel plan with valid data', () => {
      const result = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
        endDate: '2025-03-25',
        description: 'Looking for travel buddies!',
      });

      expect(result.success).toBe(true);
      expect(result.plan).toBeDefined();
      expect(result.plan.destination).toBe('Barcelona');
      expect(result.plan.status).toBe(PlanStatus.ACTIVE);
    });

    it('should fail without destination', () => {
      const result = postTravelPlan({
        startDate: '2025-03-15',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('destination_required');
    });

    it('should fail without start date', () => {
      const result = postTravelPlan({
        destination: 'Barcelona',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('start_date_required');
    });

    it('should accept destinationCity as alternative', () => {
      const result = postTravelPlan({
        destinationCity: 'Paris',
        startDate: '2025-04-01',
      });

      expect(result.success).toBe(true);
      expect(result.plan.destination).toBe('Paris');
    });

    it('should fail if user already has active plan', () => {
      postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      const result = postTravelPlan({
        destination: 'Paris',
        startDate: '2025-04-01',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('already_has_active_plan');
    });

    it('should include user information in plan', () => {
      const result = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      expect(result.plan.userId).toBe('user123');
      expect(result.plan.username).toBe('TestUser');
      expect(result.plan.userLevel).toBe(5);
      expect(result.plan.verificationLevel).toBe(2);
    });

    it('should set default values', () => {
      const result = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      expect(result.plan.languages).toEqual(['fr']);
      expect(result.plan.travelStyle).toBe(TravelStyles.RELAXED.id);
      expect(result.plan.maxCompanions).toBe(2);
    });

    it('should accept custom languages', () => {
      const result = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
        languages: ['fr', 'en', 'es'],
      });

      expect(result.plan.languages).toEqual(['fr', 'en', 'es']);
    });

    it('should accept travel style', () => {
      const result = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
        travelStyle: TravelStyles.ADVENTUROUS.id,
      });

      expect(result.plan.travelStyle).toBe('adventurous');
    });

    it('should generate unique plan ID', () => {
      const result1 = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      mockState.user = { uid: 'user456' };
      const result2 = postTravelPlan({
        destination: 'Paris',
        startDate: '2025-04-01',
      });

      expect(result1.plan.id).not.toBe(result2.plan.id);
    });

    it('should set expiration date', () => {
      const result = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
        endDate: '2025-03-25',
      });

      expect(result.plan.expiresAt).toBeDefined();
      const expiresAt = new Date(result.plan.expiresAt);
      const endDate = new Date('2025-03-25');
      expect(expiresAt > endDate).toBe(true);
    });

    it('should fail with null plan', () => {
      const result = postTravelPlan(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_plan');
    });
  });

  // ========================================
  // UPDATE TRAVEL PLAN
  // ========================================

  describe('updateTravelPlan', () => {
    let planId;

    beforeEach(() => {
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });
      planId = created.plan.id;
    });

    it('should update plan description', () => {
      const result = updateTravelPlan(planId, {
        description: 'Updated description',
      });

      expect(result.success).toBe(true);
      expect(result.plan.description).toBe('Updated description');
    });

    it('should update multiple fields', () => {
      const result = updateTravelPlan(planId, {
        description: 'New description',
        maxCompanions: 4,
      });

      expect(result.success).toBe(true);
      expect(result.plan.description).toBe('New description');
      expect(result.plan.maxCompanions).toBe(4);
    });

    it('should fail if not owner', () => {
      mockState.user = { uid: 'other' };
      const result = updateTravelPlan(planId, {
        description: 'Hack attempt',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_owner');
    });

    it('should fail if plan not found', () => {
      const result = updateTravelPlan('nonexistent', {
        description: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('plan_not_found');
    });

    it('should not allow changing plan ID', () => {
      const originalId = planId;
      const result = updateTravelPlan(planId, {
        id: 'new_id',
      });

      expect(result.plan.id).toBe(originalId);
    });

    it('should update timestamp', () => {
      const plan = getTravelPlanById(planId);
      const result = updateTravelPlan(planId, { description: 'New' });

      // Verify updatedAt exists and is a valid ISO date
      expect(result.plan.updatedAt).toBeDefined();
      expect(new Date(result.plan.updatedAt).getTime()).toBeGreaterThan(0);
    });

    it('should fail for invalid plan ID', () => {
      const result = updateTravelPlan(null, { description: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_plan_id');
    });
  });

  // ========================================
  // CANCEL TRAVEL PLAN
  // ========================================

  describe('cancelTravelPlan', () => {
    let planId;

    beforeEach(() => {
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });
      planId = created.plan.id;
    });

    it('should cancel a plan', () => {
      const result = cancelTravelPlan(planId);

      expect(result.success).toBe(true);
      const plan = getTravelPlanById(planId);
      expect(plan.status).toBe(PlanStatus.CANCELLED);
    });

    it('should fail if not owner', () => {
      mockState.user = { uid: 'other' };
      const result = cancelTravelPlan(planId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_owner');
    });

    it('should fail if plan not found', () => {
      const result = cancelTravelPlan('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('plan_not_found');
    });
  });

  // ========================================
  // GET TRAVEL PLAN BY ID
  // ========================================

  describe('getTravelPlanById', () => {
    it('should return a plan by ID', () => {
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      const plan = getTravelPlanById(created.plan.id);

      expect(plan).toBeDefined();
      expect(plan.destination).toBe('Barcelona');
    });

    it('should return null for invalid ID', () => {
      const plan = getTravelPlanById(null);

      expect(plan).toBeNull();
    });

    it('should return null for nonexistent ID', () => {
      const plan = getTravelPlanById('nonexistent');

      expect(plan).toBeNull();
    });
  });

  // ========================================
  // GET MY TRAVEL PLANS
  // ========================================

  describe('getMyTravelPlans', () => {
    it('should return only user plans', () => {
      postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      mockState.user = { uid: 'other' };
      postTravelPlan({
        destination: 'Paris',
        startDate: '2025-04-01',
      });

      mockState.user = { uid: 'user123' };
      const myPlans = getMyTravelPlans();

      expect(myPlans).toHaveLength(1);
      expect(myPlans[0].destination).toBe('Barcelona');
    });

    it('should return empty array if no plans', () => {
      const myPlans = getMyTravelPlans();

      expect(myPlans).toEqual([]);
    });
  });

  // ========================================
  // GET MY ACTIVE PLAN
  // ========================================

  describe('getMyActivePlan', () => {
    it('should return active plan', () => {
      postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      const activePlan = getMyActivePlan();

      expect(activePlan).toBeDefined();
      expect(activePlan.status).toBe(PlanStatus.ACTIVE);
    });

    it('should return null if no active plan', () => {
      postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });
      cancelTravelPlan(getTravelPlanById(getMyActivePlan().id).id);

      const activePlan = getMyActivePlan();

      expect(activePlan).toBeNull();
    });
  });

  // ========================================
  // SEARCH COMPANIONS
  // ========================================

  describe('searchCompanions', () => {
    beforeEach(() => {
      // Create some test plans
      mockState.user = { uid: 'user1', level: 10 };
      mockState.username = 'User1';
      postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
        endDate: '2025-03-25',
        languages: ['fr', 'en'],
      });

      mockState.user = { uid: 'user2', level: 5 };
      mockState.username = 'User2';
      postTravelPlan({
        destination: 'Paris',
        startDate: '2025-04-01',
        languages: ['fr'],
      });

      mockState.user = { uid: 'user3', level: 15 };
      mockState.username = 'User3';
      postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-20',
        languages: ['es', 'en'],
      });

      // Reset to searching user
      mockState.user = { uid: 'searcher', level: 8 };
    });

    it('should return plans from other users', () => {
      const results = searchCompanions();

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.every((p) => p.userId !== 'searcher')).toBe(true);
    });

    it('should filter by destination', () => {
      const results = searchCompanions({ destination: 'Barcelona' });

      expect(results.every((p) => p.destination.includes('Barcelona'))).toBe(true);
    });

    it('should filter by languages', () => {
      const results = searchCompanions({ languages: ['en'] });

      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by overlapping dates', () => {
      const results = searchCompanions({
        startDate: '2025-03-18',
        endDate: '2025-03-22',
      });

      // Should only match plans that overlap with these dates
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should include compatibility scores', () => {
      const results = searchCompanions({ destination: 'Barcelona' });

      results.forEach((plan) => {
        expect(typeof plan.compatibilityScore).toBe('number');
        expect(plan.compatibilityScore).toBeGreaterThanOrEqual(0);
        expect(plan.compatibilityScore).toBeLessThanOrEqual(100);
      });
    });

    it('should sort by compatibility score', () => {
      const results = searchCompanions({ destination: 'Barcelona' });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].compatibilityScore).toBeGreaterThanOrEqual(
          results[i].compatibilityScore
        );
      }
    });

    it('should apply limit', () => {
      const results = searchCompanions({ limit: 2 });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should filter by travel style', () => {
      mockState.user = { uid: 'user4' };
      postTravelPlan({
        destination: 'Rome',
        startDate: '2025-05-01',
        travelStyle: 'adventurous',
      });

      mockState.user = { uid: 'searcher' };
      const results = searchCompanions({ travelStyle: 'adventurous' });

      expect(results.every((p) => p.travelStyle === 'adventurous')).toBe(true);
    });
  });

  // ========================================
  // CALCULATE COMPATIBILITY
  // ========================================

  describe('calculateCompatibility', () => {
    it('should return score between 0 and 100', () => {
      const plan = {
        destination: 'Barcelona',
        startDate: '2025-03-15',
        languages: ['fr', 'en'],
        userLevel: 5,
        verificationLevel: 2,
      };

      const score = calculateCompatibility(plan, { destination: 'Barcelona' }, { level: 5 });

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher score for exact destination match', () => {
      const plan = {
        destination: 'Barcelona',
        startDate: '2025-03-15',
        languages: ['fr'],
        userLevel: 5,
      };

      const exactScore = calculateCompatibility(plan, { destination: 'Barcelona' }, {});
      const partialScore = calculateCompatibility(plan, { destination: 'Barcel' }, {});

      expect(exactScore).toBeGreaterThan(partialScore);
    });

    it('should give higher score for more overlapping dates', () => {
      const plan = {
        destination: 'Paris',
        startDate: '2025-03-15',
        endDate: '2025-03-25',
        languages: ['fr'],
        userLevel: 5,
      };

      const moreOverlap = calculateCompatibility(
        plan,
        { startDate: '2025-03-15', endDate: '2025-03-25' },
        {}
      );
      const lessOverlap = calculateCompatibility(
        plan,
        { startDate: '2025-03-23', endDate: '2025-03-25' },
        {}
      );

      expect(moreOverlap).toBeGreaterThan(lessOverlap);
    });

    it('should give higher score for shared languages', () => {
      const plan = {
        destination: 'Paris',
        startDate: '2025-03-15',
        languages: ['fr', 'en', 'es'],
        userLevel: 5,
      };

      const moreLanguages = calculateCompatibility(
        plan,
        { languages: ['fr', 'en'] },
        {}
      );
      const lessLanguages = calculateCompatibility(
        plan,
        { languages: ['de'] },
        {}
      );

      expect(moreLanguages).toBeGreaterThan(lessLanguages);
    });

    it('should give higher score for similar experience level', () => {
      const plan = {
        destination: 'Paris',
        startDate: '2025-03-15',
        languages: ['fr'],
        userLevel: 10,
      };

      const similarLevel = calculateCompatibility(plan, {}, { level: 9 });
      const differentLevel = calculateCompatibility(plan, {}, { level: 1 });

      expect(similarLevel).toBeGreaterThan(differentLevel);
    });

    it('should give higher score for verified users', () => {
      const verifiedPlan = {
        destination: 'Paris',
        startDate: '2025-03-15',
        languages: ['fr'],
        userLevel: 5,
        verificationLevel: 4,
      };

      const unverifiedPlan = {
        destination: 'Paris',
        startDate: '2025-03-15',
        languages: ['fr'],
        userLevel: 5,
        verificationLevel: 0,
      };

      const verifiedScore = calculateCompatibility(verifiedPlan, {}, {});
      const unverifiedScore = calculateCompatibility(unverifiedPlan, {}, {});

      expect(verifiedScore).toBeGreaterThan(unverifiedScore);
    });
  });

  // ========================================
  // RESPOND TO TRAVEL PLAN
  // ========================================

  describe('respondToTravelPlan', () => {
    let planId;

    beforeEach(() => {
      mockState.user = { uid: 'planOwner' };
      mockState.username = 'PlanOwner';
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });
      planId = created.plan.id;

      mockState.user = { uid: 'responder' };
      mockState.username = 'Responder';
    });

    it('should create a response', () => {
      const result = respondToTravelPlan(planId, 'I would love to join!');

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.response.message).toBe('I would love to join!');
      expect(result.response.status).toBe(ResponseStatus.PENDING);
    });

    it('should fail if message too short', () => {
      const result = respondToTravelPlan(planId, 'Hi');

      expect(result.success).toBe(false);
      expect(result.error).toBe('message_required');
    });

    it('should fail if responding to own plan', () => {
      mockState.user = { uid: 'planOwner' };
      const result = respondToTravelPlan(planId, 'My own response');

      expect(result.success).toBe(false);
      expect(result.error).toBe('cannot_respond_to_own_plan');
    });

    it('should fail if already responded', () => {
      respondToTravelPlan(planId, 'First response');
      const result = respondToTravelPlan(planId, 'Second response');

      expect(result.success).toBe(false);
      expect(result.error).toBe('already_responded');
    });

    it('should fail if plan not found', () => {
      const result = respondToTravelPlan('nonexistent', 'Hello!');

      expect(result.success).toBe(false);
      expect(result.error).toBe('plan_not_found');
    });

    it('should include responder information', () => {
      const result = respondToTravelPlan(planId, 'I want to join!');

      expect(result.response.userId).toBe('responder');
      expect(result.response.username).toBe('Responder');
    });

    it('should fail for invalid plan ID', () => {
      const result = respondToTravelPlan(null, 'Hello!');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_plan_id');
    });
  });

  // ========================================
  // ACCEPT RESPONSE
  // ========================================

  describe('acceptResponse', () => {
    let planId;
    let responseId;

    beforeEach(() => {
      mockState.user = { uid: 'planOwner' };
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
        maxCompanions: 2,
      });
      planId = created.plan.id;

      mockState.user = { uid: 'responder' };
      const response = respondToTravelPlan(planId, 'I want to join!');
      responseId = response.response.id;

      mockState.user = { uid: 'planOwner' };
    });

    it('should accept a response', () => {
      const result = acceptResponse(planId, responseId);

      expect(result.success).toBe(true);
      expect(result.response.status).toBe(ResponseStatus.ACCEPTED);
    });

    it('should increment accepted count', () => {
      acceptResponse(planId, responseId);

      const plan = getTravelPlanById(planId);
      expect(plan.acceptedCount).toBe(1);
    });

    it('should fail if not owner', () => {
      mockState.user = { uid: 'other' };
      const result = acceptResponse(planId, responseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_owner');
    });

    it('should fail if max companions reached', () => {
      // Accept first response
      acceptResponse(planId, responseId);

      // Create and accept second response
      mockState.user = { uid: 'responder2' };
      const response2 = respondToTravelPlan(planId, 'Me too!');

      mockState.user = { uid: 'planOwner' };
      acceptResponse(planId, response2.response.id);

      // Try to accept third (should fail)
      mockState.user = { uid: 'responder3' };
      const response3 = respondToTravelPlan(planId, 'And me!');

      mockState.user = { uid: 'planOwner' };
      const result = acceptResponse(planId, response3.response.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('max_companions_reached');
    });

    it('should fail if response not pending', () => {
      acceptResponse(planId, responseId);
      const result = acceptResponse(planId, responseId);

      expect(result.success).toBe(false);
    });
  });

  // ========================================
  // DECLINE RESPONSE
  // ========================================

  describe('declineResponse', () => {
    let planId;
    let responseId;

    beforeEach(() => {
      mockState.user = { uid: 'planOwner' };
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });
      planId = created.plan.id;

      mockState.user = { uid: 'responder' };
      const response = respondToTravelPlan(planId, 'I want to join!');
      responseId = response.response.id;

      mockState.user = { uid: 'planOwner' };
    });

    it('should decline a response', () => {
      const result = declineResponse(planId, responseId);

      expect(result.success).toBe(true);
    });

    it('should fail if not owner', () => {
      mockState.user = { uid: 'other' };
      const result = declineResponse(planId, responseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_owner');
    });
  });

  // ========================================
  // WITHDRAW RESPONSE
  // ========================================

  describe('withdrawResponse', () => {
    let planId;
    let responseId;

    beforeEach(() => {
      mockState.user = { uid: 'planOwner' };
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });
      planId = created.plan.id;

      mockState.user = { uid: 'responder' };
      const response = respondToTravelPlan(planId, 'I want to join!');
      responseId = response.response.id;
    });

    it('should withdraw own response', () => {
      const result = withdrawResponse(planId, responseId);

      expect(result.success).toBe(true);
    });

    it('should fail if not responder', () => {
      mockState.user = { uid: 'other' };
      const result = withdrawResponse(planId, responseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('response_not_found');
    });

    it('should fail if response not pending', () => {
      mockState.user = { uid: 'planOwner' };
      acceptResponse(planId, responseId);

      mockState.user = { uid: 'responder' };
      const result = withdrawResponse(planId, responseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('cannot_withdraw');
    });
  });

  // ========================================
  // GET MY PLAN RESPONSES
  // ========================================

  describe('getMyPlanResponses', () => {
    it('should return responses to user plans', () => {
      mockState.user = { uid: 'planOwner' };
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      mockState.user = { uid: 'responder1' };
      respondToTravelPlan(created.plan.id, 'Response 1');

      mockState.user = { uid: 'responder2' };
      respondToTravelPlan(created.plan.id, 'Response 2');

      mockState.user = { uid: 'planOwner' };
      const responses = getMyPlanResponses();

      expect(responses).toHaveLength(2);
    });

    it('should return empty array if no responses', () => {
      mockState.user = { uid: 'planOwner' };
      postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      const responses = getMyPlanResponses();

      expect(responses).toEqual([]);
    });
  });

  // ========================================
  // GET MY RESPONSES
  // ========================================

  describe('getMyResponses', () => {
    it('should return user responses to other plans', () => {
      mockState.user = { uid: 'planOwner' };
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      mockState.user = { uid: 'responder' };
      respondToTravelPlan(created.plan.id, 'My response');

      const responses = getMyResponses();

      expect(responses).toHaveLength(1);
      expect(responses[0].message).toBe('My response');
    });

    it('should return empty array if no responses', () => {
      const responses = getMyResponses();

      expect(responses).toEqual([]);
    });
  });

  // ========================================
  // RENDER FUNCTIONS
  // ========================================

  describe('renderTravelPlanCard', () => {
    it('should render HTML for a plan', () => {
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
        description: 'Looking for buddies',
      });

      const html = renderTravelPlanCard(created.plan);

      expect(html).toContain('Barcelona');
      expect(html).toContain('TestUser');
      expect(typeof html).toBe('string');
    });

    it('should return empty string for null plan', () => {
      const html = renderTravelPlanCard(null);

      expect(html).toBe('');
    });

    it('should include compatibility score if present', () => {
      const plan = {
        ...postTravelPlan({
          destination: 'Barcelona',
          startDate: '2025-03-15',
        }).plan,
        compatibilityScore: 85,
      };

      const html = renderTravelPlanCard(plan);

      expect(html).toContain('85%');
    });

    it('should include travel style', () => {
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
        travelStyle: 'adventurous',
      });

      const html = renderTravelPlanCard(created.plan);

      expect(html).toContain('Aventurier');
    });
  });

  describe('renderResponseCard', () => {
    it('should render HTML for a response', () => {
      mockState.user = { uid: 'planOwner' };
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      mockState.user = { uid: 'responder' };
      mockState.username = 'ResponderName';
      const response = respondToTravelPlan(created.plan.id, 'I want to join!');

      const html = renderResponseCard(response.response, true);

      expect(html).toContain('ResponderName');
      expect(html).toContain('I want to join!');
    });

    it('should return empty string for null response', () => {
      const html = renderResponseCard(null);

      expect(html).toBe('');
    });

    it('should show action buttons for owner', () => {
      mockState.user = { uid: 'planOwner' };
      const created = postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      mockState.user = { uid: 'responder' };
      const response = respondToTravelPlan(created.plan.id, 'I want to join!');
      response.response.planId = created.plan.id;

      const html = renderResponseCard(response.response, true);

      expect(html).toContain('acceptPlanResponse');
      expect(html).toContain('declinePlanResponse');
    });
  });

  // ========================================
  // CLEAR ALL DATA
  // ========================================

  describe('clearAllCompanionData', () => {
    it('should clear all data', () => {
      postTravelPlan({
        destination: 'Barcelona',
        startDate: '2025-03-15',
      });

      const result = clearAllCompanionData();

      expect(result.success).toBe(true);
      expect(getMyTravelPlans()).toEqual([]);
    });
  });
});
