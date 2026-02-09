# Spot Freshness System - Quick Reference

## 🎯 Quick Decision Tree

```
┌─────────────────────────────────────────────┐
│  Is spot dangerous/reported or rating < 2.5? │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        YES               NO
         │                │
    🔴 RED           ┌────┴─────────────────────────────────┐
                    │  Recent review (< 6mo) OR rating ≥ 3.5? │
                    └───────────┬──────────────────────────┘
                                │
                       ┌────────┴────────┐
                       YES               NO
                        │                │
                   🟢 GREEN         ┌────┴──────────────────┐
                                    │  Last review > 18mo ago? │
                                    └────────┬───────────────┘
                                             │
                                    ┌────────┴────────┐
                                    YES               NO
                                     │                │
                                🟠 ORANGE       🟡 YELLOW
```

## 🎨 Color Meanings (One-Liner)

| Color | Meaning | When |
|-------|---------|------|
| 🟢 GREEN | Safe to use | Recent activity OR good rating |
| 🟡 YELLOW | Check first | 6-18 months old, no guarantees |
| 🟠 ORANGE | Probably outdated | 18+ months, info may be wrong |
| 🔴 RED | Avoid | Dangerous, reported, or terrible rating |

## 📅 Time Thresholds

- **< 6 months** = Recent (GREEN if not RED)
- **6-18 months** = Needs verification (YELLOW)
- **> 18 months** = Outdated (ORANGE)

## ⚠️ Safety Overrides

These ALWAYS produce RED:
- `spot.dangerous === true`
- `spot.reported === true`
- `spot.globalRating < 2.5`

## ✅ Quality Overrides

These ALWAYS produce GREEN (unless RED):
- Recent review (< 6 months)
- Good rating (≥ 3.5)

## 💻 Code Examples

### Get spot status
```javascript
import { getSpotFreshness } from './services/spotFreshness.js'

const status = getSpotFreshness(spot)
console.log(status.color)  // 'emerald', 'amber', 'orange', 'red'
console.log(status.label)  // Localized label
console.log(status.icon)   // FontAwesome icon name
```

### Render badge
```javascript
import { renderFreshnessBadge } from './services/spotFreshness.js'

const html = renderFreshnessBadge(spot, 'md')
element.innerHTML = html
```

### Get marker color
```javascript
import { getFreshnessColor } from './services/spotFreshness.js'

const color = getFreshnessColor(spot)  // Returns hex like '#10b981'
```

## 🗺️ Map Integration

Markers are automatically tinted:
- Green markers = Reliable spots
- Yellow markers = Need checking
- Orange markers = Old info
- Red markers = Avoid

## 🌍 Translations

```javascript
// French (default)
{ label: 'Fiable' }

// English
{ labelEn: 'Reliable' }

// Spanish
{ labelEs: 'Confiable' }

// German
{ labelDe: 'Zuverlässig' }
```

## 🧪 Testing

Run tests:
```bash
npx vitest run tests/spotFreshness.test.js
```

Expected: 30/30 tests passing ✓

## 📍 Where It Appears

1. **Spot Cards** - Below rating/reviews
2. **Spot Detail Modal** - In header with other badges
3. **Map Markers** - Color-tinted pins

## 🔧 Customization

Badge sizes:
- `'sm'` - Small, compact
- `'md'` - Medium (default)
- `'lg'` - Large, prominent

## ⚡ Performance

- Pure function (no side effects)
- No external API calls
- Instant calculation
- Minimal memory footprint

## 🐛 Edge Cases Handled

- ✓ Null/undefined spot
- ✓ Missing date fields
- ✓ Invalid date formats
- ✓ Both dangerous AND reported
- ✓ Boundary dates (exactly 6/18 months)
- ✓ Missing language
- ✓ No rating

## 📊 Priority Order

1. **RED** (highest) - Safety issues
2. **GREEN** - Quality/recency
3. **ORANGE** - Age-based
4. **YELLOW** (default) - Unknown/needs checking

## 🎯 Design Principles

- **Safety First** - Dangerous spots always RED
- **Transparency** - Clear, honest indicators
- **User-Friendly** - Easy to understand at a glance
- **International** - Works in 4 languages
- **Accessible** - Proper ARIA labels

## 📚 Documentation

Full docs: `/docs/spot-freshness-system.md`
Visual examples: `/docs/freshness-examples.html`
Test cases: `/test-freshness-manual.html`

---

**Last Updated:** 2026-02-09
**Status:** ✅ Production Ready
**Tests:** 30/30 Passing
