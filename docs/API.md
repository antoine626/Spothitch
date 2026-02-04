# SpotHitch API Documentation

Technical documentation for SpotHitch services and state management.

---

## Table of Contents

- [State Management](#state-management)
- [Services](#services)
  - [Firebase Service](#firebase-service)
  - [OSRM Routing Service](#osrm-routing-service)
  - [Gamification Service](#gamification-service)
  - [Map Service](#map-service)
  - [Notifications Service](#notifications-service)
  - [Trip Planner Service](#trip-planner-service)
  - [Offline Service](#offline-service)
  - [Sentry Service](#sentry-service)
- [Utilities](#utilities)
  - [Storage](#storage)
  - [Internationalization (i18n)](#internationalization-i18n)

---

## State Management

**File:** `src/stores/state.js`

Reactive state store with localStorage persistence.

### Functions

#### `getState()`

Returns a read-only snapshot of current state.

```javascript
import { getState } from './stores/state.js'

const state = getState()
console.log(state.points) // User's points
```

#### `setState(updates)`

Updates state with partial updates. Automatically persists to localStorage.

| Parameter | Type | Description |
|-----------|------|-------------|
| `updates` | `Object` | Partial state updates |

```javascript
import { setState } from './stores/state.js'

setState({ points: 100, level: 2 })
```

#### `subscribe(callback)`

Subscribe to state changes.

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | `Function` | Called when state changes with new state |

Returns an unsubscribe function.

```javascript
import { subscribe } from './stores/state.js'

const unsubscribe = subscribe(state => {
  console.log('State changed:', state)
})

// Later: unsubscribe()
```

#### `resetState()`

Resets state to initial values and clears localStorage.

### Actions

Pre-defined actions for common state updates:

```javascript
import { actions } from './stores/state.js'

actions.changeTab('map')        // Navigate to tab
actions.toggleTheme()           // Toggle dark/light mode
actions.setLanguage('en')       // Change language
actions.setSpots(spots)         // Set spots list
actions.selectSpot(spot)        // Select a spot
actions.setUser(user)           // Set authenticated user
actions.addPoints(50)           // Add points
actions.incrementCheckins()     // Record a check-in
actions.incrementSpotsCreated() // Record spot creation
actions.addBadge('explorer')    // Award a badge
actions.setUserLocation(loc)    // Set GPS location
```

### State Shape

Key state properties:

| Property | Type | Description |
|----------|------|-------------|
| `user` | `Object\|null` | Firebase user object |
| `isLoggedIn` | `boolean` | Authentication status |
| `activeTab` | `string` | Current navigation tab |
| `spots` | `Array` | List of hitchhiking spots |
| `selectedSpot` | `Object\|null` | Currently selected spot |
| `points` | `number` | User's total points |
| `level` | `number` | User's level |
| `badges` | `Array` | Earned badge IDs |
| `theme` | `string` | 'dark' or 'light' |
| `lang` | `string` | 'fr', 'en', or 'es' |
| `userLocation` | `Object\|null` | GPS coordinates `{lat, lng}` |

---

## Services

### Firebase Service

**File:** `src/services/firebase.js`

Handles authentication, Firestore database, and storage.

#### Initialization

```javascript
import { initializeFirebase } from './services/firebase.js'

initializeFirebase() // Returns true on success
```

#### Authentication

##### `signUp(email, password, displayName)`

Create a new user account.

| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | `string` | User's email |
| `password` | `string` | User's password |
| `displayName` | `string` | Display name |

Returns: `Promise<{ success: boolean, user?: Object, error?: string }>`

##### `signIn(email, password)`

Sign in with email and password.

Returns: `Promise<{ success: boolean, user?: Object, error?: string }>`

##### `signInWithGoogle()`

Sign in with Google popup.

Returns: `Promise<{ success: boolean, user?: Object, error?: string }>`

##### `logOut()`

Sign out the current user.

Returns: `Promise<{ success: boolean, error?: string }>`

##### `resetPassword(email)`

Send password reset email.

Returns: `Promise<{ success: boolean, error?: string }>`

##### `onAuthChange(callback)`

Listen to authentication state changes.

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | `Function` | Called with user object or null |

Returns: Unsubscribe function

##### `getCurrentUser()`

Returns the current Firebase user or null.

#### Spots

##### `getSpots()`

Fetch all spots from Firestore.

Returns: `Promise<Array>` - Array of spot objects

##### `addSpot(spotData)`

Add a new spot.

| Parameter | Type | Description |
|-----------|------|-------------|
| `spotData` | `Object` | Spot data (from, to, coordinates, description, etc.) |

Returns: `Promise<{ success: boolean, id?: string, error?: Error }>`

##### `updateSpot(spotId, updates)`

Update an existing spot.

Returns: `Promise<{ success: boolean, error?: Error }>`

##### `addReview(spotId, reviewData)`

Add a review to a spot.

| Parameter | Type | Description |
|-----------|------|-------------|
| `spotId` | `string` | Spot ID |
| `reviewData` | `Object` | Review data (rating, comment, etc.) |

Returns: `Promise<{ success: boolean, error?: Error }>`

##### `getReviews(spotId)`

Get reviews for a spot.

Returns: `Promise<Array>` - Array of review objects

#### Chat

##### `subscribeToChatRoom(room, callback)`

Subscribe to real-time chat messages.

| Parameter | Type | Description |
|-----------|------|-------------|
| `room` | `string` | Room name ('general', 'help', etc.) |
| `callback` | `Function` | Called with messages array |

Returns: Unsubscribe function

##### `sendChatMessage(room, text)`

Send a message to a chat room.

Returns: `Promise<{ success: boolean, error?: Error }>`

#### Storage

##### `uploadImage(base64Data, path)`

Upload image to Firebase Storage.

| Parameter | Type | Description |
|-----------|------|-------------|
| `base64Data` | `string` | Base64 data URL |
| `path` | `string` | Storage path |

Returns: `Promise<{ success: boolean, url?: string, error?: Error }>`

---

### OSRM Routing Service

**File:** `src/services/osrm.js`

Route calculation with debouncing and caching.

#### `getRoute(waypoints)`

Calculate route between waypoints.

| Parameter | Type | Description |
|-----------|------|-------------|
| `waypoints` | `Array<{lat, lng}>` | Array of coordinates (min 2) |

Returns: `Promise<Object>` with:
- `distance` (meters)
- `duration` (seconds)
- `geometry` (GeoJSON coordinates)
- `steps` (navigation steps)

```javascript
import { getRoute } from './services/osrm.js'

const route = await getRoute([
  { lat: 48.8566, lng: 2.3522 },  // Paris
  { lat: 52.5200, lng: 13.4050 }  // Berlin
])
console.log(route.distance) // Distance in meters
```

#### `getRouteDebounced(waypoints, delay = 500)`

Same as `getRoute` but with debouncing and caching.

| Parameter | Type | Description |
|-----------|------|-------------|
| `waypoints` | `Array<{lat, lng}>` | Array of coordinates |
| `delay` | `number` | Debounce delay in ms (default: 500) |

#### `formatDistance(meters)`

Format distance for display.

```javascript
formatDistance(1500)  // "1.5 km"
formatDistance(500)   // "500 m"
```

#### `formatDuration(seconds)`

Format duration for display.

```javascript
formatDuration(7200)  // "2h 0min"
formatDuration(1800)  // "30 min"
```

#### `searchLocation(query)`

Search for a location using Nominatim geocoding.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | `string` | Search query (min 3 chars) |

Returns: `Promise<Array<{name, lat, lng, type}>>`

#### `reverseGeocode(lat, lng)`

Get address from coordinates.

Returns: `Promise<{name, city, country, countryCode}>`

#### `clearCache()`

Clear the route cache.

---

### Gamification Service

**File:** `src/services/gamification.js`

Points, leagues, badges, and VIP levels.

#### `addPoints(pts, reason = '')`

Add points to user's total with VIP multiplier.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pts` | `number` | Base points to add |
| `reason` | `string` | Reason for logging |

Returns: `number` - Actual points added (after multiplier)

```javascript
import { addPoints } from './services/gamification.js'

addPoints(10, 'checkin')  // Adds 10 * VIP multiplier
```

#### `addSeasonPoints(pts)`

Add seasonal points for league ranking.

#### `checkBadges()`

Check and award new badges based on user stats.

Returns: `Array` - Array of newly earned badge IDs

#### `recordCheckin()`

Record a spot check-in. Awards 5 points + 2 season points.

#### `recordSpotCreated()`

Record spot creation. Awards 20 points + 10 season points.

#### `recordReview()`

Record a review. Awards 10 points + 5 season points.

#### `updateStreak()`

Update daily activity streak. Awards bonus at milestones.

#### `recordCountryVisit(countryCode)`

Record visiting a new country. Awards 15 points.

#### `getUserVipLevel()`

Get user's current VIP level object.

Returns: `{ id, name, icon, minPoints, maxPoints, xpMultiplier, perks }`

#### `getVipProgressInfo()`

Get VIP level progress information.

Returns: `{ current, next, progress, pointsNeeded, pointsInLevel }`

#### `getGamificationSummary()`

Get full gamification summary for profile.

Returns: `{ points, level, vipLevel, league, streak, checkins, ... }`

---

### Map Service

**File:** `src/services/map.js`

Leaflet map initialization and utilities.

#### `initMap(containerId = 'map')`

Initialize the main spots map.

| Parameter | Type | Description |
|-----------|------|-------------|
| `containerId` | `string` | Map container element ID |

Returns: `Promise<L.Map>` - Leaflet map instance

#### `initPlannerMap()`

Initialize the trip planner map.

#### `initSavedTripMap(tripId)`

Initialize map for a saved trip detail view.

#### `drawRoute(map, L, routeCoords)`

Draw a route polyline on a map.

| Parameter | Type | Description |
|-----------|------|-------------|
| `map` | `L.Map` | Leaflet map instance |
| `L` | `Object` | Leaflet library |
| `routeCoords` | `Array` | Array of [lng, lat] coordinates |

#### `centerOnUser()`

Center main map on user's GPS location.

#### `centerOnSpot(spot)`

Center main map on a specific spot.

#### `updateMapTheme(theme)`

Update map tile layer for theme change.

| Parameter | Type | Description |
|-----------|------|-------------|
| `theme` | `string` | 'light' or 'dark' |

#### `destroyMaps()`

Cleanup all map instances (for memory management).

---

### Notifications Service

**File:** `src/services/notifications.js`

Push notifications and in-app toasts.

#### `initNotifications()`

Initialize notifications (creates toast container, requests push permission).

#### `showToast(message, type = 'info', duration = 4000)`

Show a toast notification.

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | `string` | Message to display |
| `type` | `string` | 'success', 'error', 'info', 'warning' |
| `duration` | `number` | Duration in ms |

```javascript
import { showToast } from './services/notifications.js'

showToast('Spot added!', 'success')
showToast('Connection failed', 'error', 6000)
```

#### Convenience Functions

```javascript
showSuccess(message, duration)
showError(message, duration)
showInfo(message, duration)
showWarning(message, duration)
```

#### `announce(message, priority = 'polite')`

Announce message to screen readers.

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | `string` | Message to announce |
| `priority` | `string` | 'polite' or 'assertive' |

#### `sendLocalNotification(title, body, data = {})`

Send a browser notification (requires permission).

#### `scheduleNotification(title, body, triggerTime, data = {})`

Schedule a notification for a future time.

Returns: `number` - Timeout ID for cancellation

---

### Trip Planner Service

**File:** `src/services/planner.js`

Route planning and spot suggestions.

#### `getSpotsForRoute(from, to, maxDistanceKm = 15)`

Get spots along a route between two points.

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | `{lat, lng}` | Starting point |
| `to` | `{lat, lng}` | Ending point |
| `maxDistanceKm` | `number` | Max distance from route |

Returns: `Promise<{ route, spots, distance, duration }>`

#### `createTrip(steps)`

Create a new trip plan with multiple stops.

| Parameter | Type | Description |
|-----------|------|-------------|
| `steps` | `Array<{name, lat, lng}>` | Trip waypoints (min 2) |

Returns: `Promise<Object>` - Trip object with route and spots

#### `saveTrip(trip)`

Save a trip to user's saved trips.

#### `deleteTrip(tripId)`

Delete a saved trip.

#### `getSavedTrips()`

Get all saved trips.

Returns: `Array` - Array of trip objects

#### `addTripStep(step)`

Add a step to current trip planning.

#### `removeTripStep(index)`

Remove a step from current trip planning.

#### `clearTripSteps()`

Clear current trip planning state.

#### `getSuggestedStartingSpots(location, limit = 5)`

Get nearest spots to a location.

Returns: `Array` - Sorted by distance

---

### Offline Service

**File:** `src/services/offline.js`

Offline detection, UI feedback, and data syncing.

#### `initOfflineHandler()`

Initialize offline handling (creates indicator, sets up listeners).

#### `isCurrentlyOffline()`

Check if currently offline.

Returns: `boolean`

#### `queueOfflineAction(action)`

Queue an action for when online.

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | `Object` | Action object `{ type, data }` |

Types: 'ADD_SPOT', 'ADD_RATING', 'SEND_MESSAGE'

#### `cacheSpots(spots)`

Cache spots data for offline use.

#### `getCachedSpots()`

Get cached spots (if cache is less than 24 hours old).

Returns: `Array|null`

#### `isCacheFresh(key, maxAge = 3600000)`

Check if cached data is still fresh.

---

### Sentry Service

**File:** `src/services/sentry.js`

Error monitoring and performance tracking.

#### `initSentry()`

Initialize Sentry (dynamically imports to reduce bundle).

Returns: `Promise<boolean>` - Success status

#### `captureException(error, context = {})`

Capture and report an exception.

```javascript
import { captureException } from './services/sentry.js'

try {
  // risky operation
} catch (error) {
  captureException(error, { userId: '123', action: 'addSpot' })
}
```

#### `captureMessage(message, level = 'info', context = {})`

Capture a message.

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | `string` | Message to log |
| `level` | `string` | 'info', 'warning', 'error' |

#### `setUser(user)`

Set user context for error tracking.

#### `addBreadcrumb(message, category, level, data)`

Add breadcrumb for debugging context.

#### `setupGlobalErrorHandlers()`

Set up global error and unhandled rejection handlers.

---

## Utilities

### Storage

**File:** `src/utils/storage.js`

#### `Storage` Object

localStorage wrapper with JSON serialization and error handling.

```javascript
import { Storage } from './utils/storage.js'

Storage.set('key', { foo: 'bar' })  // Returns boolean
Storage.get('key')                   // Returns parsed value or null
Storage.remove('key')                // Returns boolean
Storage.clear()                      // Clears all SpotHitch data
```

All keys are prefixed with `spothitch_v4_`.

#### `SpotHitchDB` Object

IndexedDB wrapper for larger data.

```javascript
import { SpotHitchDB } from './utils/storage.js'

await SpotHitchDB.init()           // Initialize
await SpotHitchDB.saveSpots(spots) // Save spots
await SpotHitchDB.getSpots()       // Get cached spots
await SpotHitchDB.addPendingSync(op) // Queue sync operation
await SpotHitchDB.getPendingSync()   // Get pending operations
await SpotHitchDB.clearPendingSync() // Clear pending
```

---

### Internationalization (i18n)

**File:** `src/i18n/index.js`

#### `t(key, params = {})`

Get translation by key.

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | Translation key |
| `params` | `Object` | Interpolation parameters |

```javascript
import { t } from './i18n/index.js'

t('welcome')           // "Bienvenue !" (in French)
t('level')             // "Level" (in English)
```

#### `setLanguage(lang)`

Set the current language.

| Parameter | Type | Description |
|-----------|------|-------------|
| `lang` | `string` | 'fr', 'en', or 'es' |

Returns: `boolean` - Success status

#### `detectLanguage()`

Detect browser language.

Returns: `string` - Language code

#### `getAvailableLanguages()`

Get list of available languages.

Returns: `Array<{code, name, flag}>`

---

## Data Types

### Spot Object

```typescript
{
  id: number | string,
  from: string,           // Origin city/location
  to: string,             // Destination direction
  coordinates: { lat: number, lng: number },
  description: string,
  globalRating: number,   // 0-5
  avgWaitTime: number,    // Minutes
  country: string,        // Country code (e.g., 'FR')
  createdAt: Timestamp,
  creatorId: string,
  creatorName: string,
  verified: boolean,
  checkins: number,
  totalReviews: number,
  photoUrl?: string
}
```

### User State

```typescript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string
}
```

### Trip Object

```typescript
{
  id: string,
  createdAt: string,      // ISO date
  steps: Array<{ name, lat, lng }>,
  route: { distance, duration, geometry },
  spotsByLeg: Array<{ from, to, spots }>,
  totalDistance: number,  // Meters
  totalDuration: number,  // Seconds
  estimatedDays: number
}
```
