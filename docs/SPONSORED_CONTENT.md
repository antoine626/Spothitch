# Sponsored Content Service Documentation

## Overview

The **Sponsored Content Service** (`src/services/sponsoredContent.js`) handles non-intrusive local sponsor partnerships for SpotHitch. It integrates relevant local sponsors into spot descriptions based on category, location, and user language.

### Key Features

- **Category-based Filtering**: Restaurant, Hotel, Transport, Shop
- **Location-aware**: Filter sponsors by country code (ISO 3166-1 alpha-2)
- **Multi-language Support**: French, English, Spanish, German
- **Non-intrusive Design**: Discrete banners with subtle styling
- **Analytics Integration**: Track sponsor clicks with Plausible/Mixpanel
- **Backward Compatible**: Legacy functions for existing code

## Usage Guide

### Get Sponsored Content for a Spot

```javascript
import { getSponsoredContent, renderSponsoredBanner } from '../services/sponsoredContent.js'

// Get restaurant sponsor for spot ID 1 (France)
const content = getSponsoredContent(1, 'restaurant')
if (content) {
  const html = renderSponsoredBanner(content)
  document.getElementById('sponsor-container').innerHTML += html
}
```

### Available Categories

| Category | Emoji | Examples |
|----------|-------|----------|
| `restaurant` | 🍽️ | McDonald's, Burger King |
| `hotel` | 🛏️ | Formule 1, Budget hotels |
| `transport` | ⛽ | TotalEnergies, Shell |
| `shop` | 🛒 | Carrefour Express |

### Get Sponsors by Country

```javascript
import { getSponsorsByCountry } from '../services/sponsoredContent.js'

// Get all sponsors available in France
const frSponsors = getSponsorsByCountry('FR')

// Get restaurant sponsors in Germany
const deRestaurants = getSponsorsByCountry('DE', 'restaurant')
```

### Get Sponsors by Category

```javascript
import { getSponsorsByCategory } from '../services/sponsoredContent.js'

// Get all hotel sponsors
const hotels = getSponsorsByCategory('hotel')
hotels.forEach(hotel => {
  console.log(hotel.name) // Formule 1
})
```

### Track Sponsor Clicks

Clicks are tracked automatically when users click the sponsor banner. To manually track:

```javascript
import { trackSponsorClick } from '../services/sponsoredContent.js'

trackSponsorClick('mcdo-highway')
// Sends event: 'sponsor_click' with properties:
// { sponsor_id, sponsor_name, sponsor_category, sponsor_type, timestamp }
```

## API Reference

### Core Functions

#### `getSponsoredContent(spotId, category)`
Get sponsored content for a specific spot and category.

**Parameters:**
- `spotId` (string|number): The spot ID or name
- `category` (string): One of 'restaurant', 'hotel', 'transport', 'shop'

**Returns:** Object with properties:
```javascript
{
  id: 'mcdo-highway',
  name: 'McDonald\'s',
  category: 'restaurant',
  type: 'fast_food',
  description: 'McDonald\'s à 150m - wifi gratuit et toilettes',
  benefits: ['wifi', 'toilets', 'food'],
  distance: 150,
  logo: '/sponsors/mcdonalds.png',
  trackingUrl: 'https://tracking.spothitch.com/sponsor/mcdo',
  isSponsored: true
}
```

Returns `null` if no relevant sponsor found.

#### `renderSponsoredBanner(content)`
Generate HTML for sponsored content banner.

**Parameters:**
- `content` (Object): Output from `getSponsoredContent()` or `getSponsoredContentForSpot()`

**Returns:** HTML string

**Example:**
```html
<div class="sponsored-banner rounded-lg p-4 mt-4 border border-accent-500/30 ...">
  <div class="flex items-start gap-3">
    <span class="inline-flex items-center justify-center h-10 w-10 rounded-lg ...">
      <i class="fas fa-handshake"></i>
    </span>
    <div>
      <div class="flex items-baseline gap-2">
        <p class="text-sm font-semibold">McDonald's</p>
        <span class="text-xs text-accent-400">🍽️ Restaurant</span>
      </div>
      <p class="text-sm text-gray-300 mt-1">McDonald's à 150m - wifi gratuit et toilettes</p>
      <div class="flex items-center gap-2 mt-2">
        <i class="fas fa-wifi"></i>
        <span class="ml-auto">150m</span>
      </div>
    </div>
  </div>
  <div class="mt-3 pt-3 border-t">
    <span>🤝 Partenaire vérifié</span>
    <span>Tap pour en savoir plus</span>
  </div>
</div>
```

#### `trackSponsorClick(sponsorId)`
Track a sponsor click in analytics.

**Parameters:**
- `sponsorId` (string): Sponsor ID (e.g., 'mcdo-highway')

**Side effects:**
- Logs to analytics with `trackEvent('sponsor_click', ...)`
- Sends tracking beacon to sponsor's tracking URL (if available)

### Query Functions

#### `getSponsorCategories()`
Get all available sponsor categories.

**Returns:** `['restaurant', 'hotel', 'transport', 'shop']`

#### `getSponsorsByCountry(countryCode, category = null)`
Get sponsors available in a specific country.

**Parameters:**
- `countryCode` (string): ISO country code (e.g., 'FR', 'DE', 'ES')
- `category` (string, optional): Filter by category

**Returns:** Array of sponsor objects

#### `getSponsorsByCategory(category)`
Get all sponsors in a category.

**Parameters:**
- `category` (string): One of 'restaurant', 'hotel', 'transport', 'shop'

**Returns:** Array of sponsor objects

#### `getSponsorTypes()`
Get all available sponsor types.

**Returns:** `['fast_food', 'gas_station', 'supermarket', 'budget_hotel']`

#### `isSponsorAvailable(sponsorId, countryCode)`
Check if a sponsor is available in a country.

**Parameters:**
- `sponsorId` (string): Sponsor ID
- `countryCode` (string): ISO country code

**Returns:** Boolean

### Admin Functions

#### `registerSponsoredSpot(spotId, sponsorship)`
Register a sponsor for a specific spot (admin function).

**Parameters:**
- `spotId` (string): The spot ID
- `sponsorship` (Object): Sponsorship data with structure:
  ```javascript
  {
    partner: { /* partner object */ },
    distance: 150,
    category: 'restaurant'
  }
  ```

#### `calculateImpressionValue(sponsorId)`
Calculate the estimated value of a sponsor impression.

**Parameters:**
- `sponsorId` (string): Sponsor ID

**Returns:** Numeric value in cents (default: 0.75)

### Legacy Functions

#### `getSponsoredContentForSpot(spot)`
Get sponsored content for a spot object (backward compatible).

**Parameters:**
- `spot` (Object): Spot object with `id`, `country` properties

**Returns:** Sponsored content object or null

#### `renderSponsoredContent(spot)`
Render sponsored content for a spot (backward compatible).

**Parameters:**
- `spot` (Object): Spot object

**Returns:** HTML string (delegates to `renderSponsoredBanner`)

## Design & Styling

### Non-intrusive Design

The sponsored banners are designed to be helpful rather than intrusive:

- **Discrete styling**: Subtle gradient background with accent-colored border
- **Context-relevant**: Only shows sponsors relevant to the location
- **Helpful information**: Displays actual benefits (wifi, toilets, food, etc.)
- **Transparent labeling**: Clear "Partenaire vérifié" badge
- **Optional engagement**: Users can click to learn more or ignore

### CSS Classes Used

- `.sponsored-banner` - Main container
- `.rounded-lg` - Border radius
- `.p-4` - Padding
- `.border-accent-500/30` - Accent border
- `.bg-gradient-to-r` - Gradient background
- `hover:border-accent-500/50` - Hover effect
- `transition-colors` - Smooth color transition

### Benefit Icons

| Icon | Benefit | Usage |
|------|---------|-------|
| `fas fa-wifi` | WiFi | Restaurants, hotels, gas stations |
| `fas fa-utensils` | Food | Restaurants, shops |
| `fas fa-restroom` | Toilets | Restaurants, gas stations |
| `fas fa-shower` | Showers | Gas stations |
| `fas fa-couch` | Rest area | Gas stations |
| `fas fa-plug` | Charging | Restaurants |
| `fas fa-shopping-basket` | Supplies | Shops |
| `fas fa-bed` | Accommodation | Hotels |
| `fas fa-parking` | Parking | Hotels |

## Analytics Integration

### Event Tracking

When a sponsor is clicked, the following event is tracked:

```javascript
trackEvent('sponsor_click', {
  sponsor_id: 'mcdo-highway',
  sponsor_name: 'McDonald\'s',
  sponsor_category: 'restaurant',
  sponsor_type: 'fast_food',
  timestamp: '2026-02-04T17:08:30.000Z'
})
```

### Supported Analytics Providers

- **Plausible** (default, privacy-friendly)
- **Mixpanel** (if configured via VITE_ANALYTICS_PROVIDER)

### Privacy

- No personal data is tracked
- Tracking respects Do Not Track (DNT) headers in Mixpanel
- Uses EU endpoints for GDPR compliance
- Clicks are aggregated for reporting

## Multi-language Support

All sponsor descriptions and content support multiple languages:

```javascript
// French
'McDonald\'s à {distance}m - wifi gratuit et toilettes'

// English
'There\'s a McDonald\'s {distance}m away - free wifi and toilets'

// Spanish
'Hay un McDonald\'s a {distance}m - wifi gratis y baños'

// German
'Es gibt ein McDonald\'s {distance}m entfernt - kostenloses WLAN und Toiletten'
```

The current language is determined from `getState().lang`.

## Adding New Sponsors

To add new sponsors to the database:

1. Edit `src/services/sponsoredContent.js`
2. Add to the appropriate category in `sponsoredPartners`
3. Include all required fields:
   - `id`: Unique identifier
   - `name`: Display name
   - `category`: One of the 4 categories
   - `type`: Sponsor type
   - `countries`: Array of ISO country codes
   - `description` or `descriptionTemplate`: Localized descriptions
   - `benefits`: Array of benefit types
   - `trackingUrl`: Sponsor tracking endpoint (optional)
   - `logo`: Logo image path

Example:
```javascript
{
  id: 'starbucks-eu',
  name: 'Starbucks',
  category: 'restaurant',
  type: 'cafe',
  countries: ['FR', 'DE', 'ES', 'IT'],
  logo: '/sponsors/starbucks.png',
  descriptionTemplate: {
    fr: 'Starbucks à {distance}m - café et wifi',
    en: 'Starbucks {distance}m away - coffee and wifi',
    es: 'Starbucks a {distance}m - café y wifi',
    de: 'Starbucks {distance}m entfernt - Kaffee und WLAN',
  },
  benefits: ['wifi', 'food'],
  trackingUrl: 'https://tracking.spothitch.com/sponsor/starbucks',
}
```

4. Add tests in `tests/sponsoredContent.test.js`
5. Run `npm run test:run`

## Testing

The service includes comprehensive tests:

```bash
npm run test:run -- tests/sponsoredContent.test.js
```

Test coverage includes:
- 58 total tests (100% passing)
- Category filtering
- Country-based selection
- HTML rendering
- Analytics tracking
- Multi-language support
- Edge cases and error handling

## Troubleshooting

### No sponsor content appears

1. Check the spot has a valid `country` property
2. Verify the category is one of: 'restaurant', 'hotel', 'transport', 'shop'
3. Check if sponsors exist for that country: `getSponsorsByCountry('FR')`
4. Verify language code is correct: `getState().lang`

### Sponsor click not tracked

1. Check analytics is initialized: `initAnalytics()`
2. Verify sponsorId is correct
3. Check browser console for errors
4. Ensure `window.trackSponsorClick` is exposed globally

### Styling issues

1. Verify Tailwind CSS is loaded
2. Check color variables are defined (e.g., `accent-500`)
3. Ensure FontAwesome icons are available
4. Test in different browsers (Chrome, Firefox, Safari)

## Performance Considerations

- Sponsor data is in-memory (no network calls)
- Random selection is O(n) but n is small (~10 sponsors max)
- Tracking beacons are non-blocking (async Image requests)
- No database queries or API calls
- Minimal DOM manipulation

## Future Improvements

1. **Firebase integration**: Load sponsors from Firestore for real-time updates
2. **Geolocation-aware**: Use exact distance calculation vs. random
3. **A/B testing**: Test different sponsor layouts and frequencies
4. **Admin dashboard**: Manage sponsors and track impressions/clicks
5. **Revenue sharing**: Track earnings by sponsor and generate reports
6. **Customizable rules**: Control frequency and placement of sponsor content
7. **Sponsor ratings**: Let users rate their experience with sponsors
8. **Dynamic pricing**: Adjust impression value based on demand

## Support

For issues or questions:
1. Check this documentation
2. Review test cases in `tests/sponsoredContent.test.js`
3. Check the Git history for changes
4. Ask in project issues or PRs
