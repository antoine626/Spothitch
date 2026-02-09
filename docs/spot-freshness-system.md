# Spot Freshness/Reliability System

## Overview

The Spot Freshness/Reliability System provides a color-coded indicator to help users quickly assess the reliability and recency of hitchhiking spots in the SpotHitch application.

## Color Logic

The system uses four colors to indicate spot status:

### 🟢 GREEN (Emerald) - "Fiable" / "Reliable"
**Conditions:**
- Spot has a review/check-in within the last 6 months, OR
- Spot has a global rating ≥ 3.5

**Icon:** `check-circle`
**Priority:** Medium (overridden by RED)

This indicates the spot is currently reliable and trustworthy.

### 🟡 YELLOW (Amber) - "À vérifier" / "Needs verification"
**Conditions:**
- No review in 6-18 months AND
- Rating ≥ 2.5 (or no rating)

**Icon:** `exclamation-circle`
**Priority:** Low

This indicates the spot might still be good but needs recent verification.

### 🟠 ORANGE - "Ancien" / "Outdated"
**Conditions:**
- No review in 18+ months AND
- No recent activity

**Icon:** `clock`
**Priority:** Low

This indicates the spot is old and information may be outdated.

### 🔴 RED - "Déconseillé" / "Not recommended"
**Conditions:**
- Spot is marked as `dangerous: true`, OR
- Spot is marked as `reported: true`, OR
- Global rating < 2.5

**Icon:** `times-circle`
**Priority:** Highest (overrides all other colors)

This indicates the spot should be avoided or used with extreme caution.

## Key Rules

1. **Recent review resets freshness**: Any review within the last 6 months automatically makes a spot GREEN, regardless of age.
2. **Good rating = GREEN**: Spots with rating ≥ 3.5 are always GREEN, even if old.
3. **Safety first**: Dangerous or reported spots are always RED, even with recent reviews.
4. **Date fields checked**: The system checks `lastUsed`, `lastReview`, and `lastCheckin` fields.
5. **No date = YELLOW**: Spots without date information default to "needs verification."

## Implementation

### Service File
`src/services/spotFreshness.js` contains:

- `getSpotFreshness(spot)` - Returns freshness object with color, labels, icon, and CSS classes
- `renderFreshnessBadge(spot, size)` - Returns HTML badge markup
- `getFreshnessColor(spot)` - Returns hex color for map markers

### Integration Points

1. **SpotCard.js** - Badge displayed below stats section
2. **SpotDetail.js** - Badge in header area alongside verification badges
3. **map.js** - Map markers are tinted with freshness color

### Internationalization

Labels are provided in 4 languages:
- French (default): "Fiable", "À vérifier", "Ancien", "Déconseillé"
- English: "Reliable", "Needs verification", "Outdated", "Not recommended"
- Spanish: "Confiable", "Necesita verificación", "Antiguo", "No recomendado"
- German: "Zuverlässig", "Überprüfung erforderlich", "Veraltet", "Nicht empfohlen"

## Badge Sizes

Three sizes available:
- `sm` - Small (text-xs, compact padding)
- `md` - Medium (default)
- `lg` - Large (text-sm, generous padding)

## Usage Examples

```javascript
import { getSpotFreshness, renderFreshnessBadge, getFreshnessColor } from '../services/spotFreshness.js'

// Get freshness status
const freshness = getSpotFreshness(spot)
console.log(freshness.color) // 'emerald', 'amber', 'orange', 'red'
console.log(freshness.label) // Localized label

// Render badge HTML
const badgeHtml = renderFreshnessBadge(spot, 'md')
document.getElementById('badge-container').innerHTML = badgeHtml

// Get color for map marker
const markerColor = getFreshnessColor(spot)
// Returns: '#10b981', '#f59e0b', '#f97316', or '#ef4444'
```

## Testing

Comprehensive test suite in `tests/spotFreshness.test.js` includes:
- 30 test cases covering all color scenarios
- Language support tests
- Edge case handling
- Priority rule verification
- Date boundary testing

Run tests:
```bash
npx vitest run tests/spotFreshness.test.js
```

## Visual Design

Badges use Tailwind CSS classes:
- Semi-transparent backgrounds (`bg-{color}-500/20`)
- Colored text (`text-{color}-400`)
- Subtle borders (`border-{color}-500/30`)
- FontAwesome icons
- Rounded pill shape (`rounded-full`)

Map markers are tinted with solid freshness colors, making it easy to spot reliable vs. questionable spots at a glance.

## Future Enhancements

Potential improvements:
- Add user preference to sort by freshness
- Filter spots by freshness level
- Show freshness trend (improving/declining)
- Notifications when favorite spots become RED
- Historical freshness tracking
