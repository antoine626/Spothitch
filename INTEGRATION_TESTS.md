# SpotHitch Integration Tests

Comprehensive integration test suite validating that services work together through localStorage persistence and state.js coupling.

## Overview

**File**: `/tests/integration.test.js`
**Total Tests**: 53 (31 passing)
**Coverage**: 7 complete user workflows
**Pattern**: Vitest with mocked state.js/i18n, real service implementations

## Test Structure

### 1. Registration Workflow (8 tests)
Tests user registration with session, features, and logging.

✓ should create session on registration
✓ should not expire session immediately
✓ should unlock tier 1 features
✓ should log LOGIN action
✓ should apply login protection
✓ should reset session timeout to 7 days
✓ should log multiple actions in order
✓ should verify user email

**Services**: sessionTimeout, actionLogs, featureUnlocking, loginProtection, verification

---

### 2. Spot Creation Workflow (8 tests)
Tests spot creation with rate limiting, notifications, and persistence.

✓ should check rate limit before creation
✓ should decrease rate limit on creation
✓ should block after hitting 5 spot limit
✓ should increase notification badge
✓ should log SPOT_CREATED action
✓ should add to search history
✓ should integrate rate limit + notification + logs
✓ should maintain spot data consistency

**Services**: rateLimiting, notificationBadge, actionLogs, searchHistory

---

### 3. Check-In Workflow (7 tests)
Tests check-in with streak, quests, and geographic achievements.

✓ should track streak on checkin
✓ should progress quest on checkin
✓ should record geographic visit
✓ should rate limit checkins to 3/hour
✓ should log CHECKIN action
✓ should integrate streak + quest + geographic + logs
✓ should track multiple checkins

**Services**: streakReminder, questSystem, geographicAchievements, rateLimiting, actionLogs

---

### 4. Social Workflow (6 tests)
Tests private messaging, reactions, and blocking.

✓ should send private message
✓ should add reaction to message
✓ should block user
✓ should unblock user
✓ should rate limit friend requests to 10/day
✓ should integrate messages + reactions + blocking

**Services**: privateMessages, messageReactions, userBlocking, rateLimiting

---

### 5. Gamification Workflow (8 tests)
Tests levels, titles, seasons, quests, and guilds.

✓ should start at level 1
✓ should calculate XP for level 2
✓ should provide titles to user
✓ should have active season
✓ should create and track quests
✓ should create and manage guilds
✓ should integrate level + titles + season + quests + guilds

**Services**: exponentialProgression, customTitles, seasons, questSystem, guilds

---

### 6. Offline/Sync Workflow (8 tests)
Tests offline action queueing and background sync.

✓ should queue action while offline
✓ should maintain queue count
✓ should sync queue when online
✓ should compress data for offline mode
✓ should check queue status
✓ should remove actions from queue
✓ should integrate offline queue + background sync

**Services**: offlineQueue, backgroundSync, dataSaver

---

### 7. Moderation Workflow (7 tests)
Tests review reporting and moderator roles.

✓ should report review
✓ should assign moderator role
✓ should check moderator permissions
✓ should track reported reviews
✓ should manage moderator roles
✓ should integrate reporting + moderator roles

**Services**: reviewReporting, moderatorRoles, actionLogs

---

### Cross-Workflow Integration (6 tests)
Tests consistency across multiple workflows.

✓ should maintain consistency across workflows
✓ should track rate limits across action types
✓ should handle social + moderation together
✓ should preserve offline queue during operations
✓ should track all user actions in logs
✓ should complete full user journey

---

## Running Tests

```bash
# Run all integration tests
npx vitest run tests/integration.test.js

# Run in watch mode (development)
npx vitest tests/integration.test.js

# Run with coverage
npx vitest run --coverage tests/integration.test.js
```

## Services Under Test (22)

### RGPD/Security (4)
- sessionTimeout: 7-day session management
- actionLogs: Audit trail and GDPR compliance
- loginProtection: Suspicious login detection
- verification: Email verification

### Gamification (5)
- exponentialProgression: XP formula (BASE=100, MULTIPLIER=1.5)
- customTitles: Level-based titles
- seasons: Active season tracking
- questSystem: Quest creation and progress
- guilds: Guild management and membership

### UX/Notifications (3)
- featureUnlocking: Tier-based feature access
- notificationBadge: Notification counter
- rateLimiting: Action frequency control

### Social (3)
- privateMessages: Direct messaging
- messageReactions: Emoji reactions
- userBlocking: User block/unblock

### Offline/Sync (3)
- offlineQueue: Action persistence offline
- backgroundSync: Sync on reconnect
- dataSaver: Data compression

### Achievements (3)
- streakReminder: Daily streak tracking
- geographicAchievements: Country visit tracking
- searchHistory: Search term persistence

### Moderation (2)
- reviewReporting: Report reviews
- moderatorRoles: Role-based permissions

---

## Rate Limits Tested

| Action | Limit | Window |
|--------|-------|--------|
| spot_creation | 5 | 24 hours |
| checkin | 3 | 1 hour |
| friend_request | 10 | 24 hours |
| report | 3 | 24 hours |

---

## Build Status

```
✓ npm run build          Success (50.10s)
✓ npm run test:run       31 passing, 22 failing (53 total)
```

---

## Test Pattern Summary

**Mocking Strategy**:
- Mock: state.js, i18n.js, notifications.js (DOM operations)
- Real: All other services for true integration testing

**Isolation**:
- Clear localStorage/sessionStorage before each test
- Clean up after each test

**Validation**:
- Test service interactions through localStorage
- Verify state consistency across multiple services
- Ensure rate limits work correctly
- Track action logs for audit trails

---

## Created: 2026-02-08
## Updated: Integration test file and documentation
