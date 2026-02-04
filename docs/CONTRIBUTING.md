# Contributing to SpotHitch

Thank you for your interest in contributing to SpotHitch! This guide covers everything you need to get started.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Code Conventions](#code-conventions)
- [Running Tests](#running-tests)
- [Adding New Features](#adding-new-features)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Project Structure](#project-structure)

---

## Development Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/antoine626/Spothitch.git
cd Spothitch

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env.local
```

### Environment Variables

Edit `.env.local` with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Optional
VITE_SENTRY_DSN=your-sentry-dsn
```

Get Firebase credentials from the [Firebase Console](https://console.firebase.google.com/).

### Running the Dev Server

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Check code with ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format with Prettier |

---

## Code Conventions

### JavaScript

- **ES Modules** - Use `import`/`export`
- **No semicolons** - Prettier removes them
- **2 spaces** - For indentation
- **camelCase** - For variables and functions
- **PascalCase** - For component files

```javascript
// Good
export function calculateDistance(from, to) {
  const dx = to.lng - from.lng
  const dy = to.lat - from.lat
  return Math.sqrt(dx * dx + dy * dy)
}

// Bad
export function CalculateDistance(from, to) {
    var dx = to.lng - from.lng;
    return Math.sqrt(dx*dx + dy*dy)
}
```

### HTML/Components

- Use **Tailwind CSS** classes for styling
- Always add **aria-labels** to interactive elements
- Use **semantic HTML5** elements

```javascript
// Good
return `
  <button
    class="px-4 py-2 bg-sky-500 rounded-lg"
    aria-label="Add new spot"
    onclick="openAddSpot()"
  >
    Add Spot
  </button>
`

// Bad
return `
  <div onclick="openAddSpot()">Add Spot</div>
`
```

### Security

- **Always sanitize** user input with `escapeHTML()`
- **Never use** `eval()` or raw `innerHTML` with user data

```javascript
import { escapeHTML } from './utils/sanitize.js'

// Good
element.innerHTML = `<p>${escapeHTML(userInput)}</p>`

// Bad - XSS vulnerability!
element.innerHTML = `<p>${userInput}</p>`
```

### File Organization

```
src/
  components/           # UI components
    views/              # Page views
    modals/             # Modal dialogs
  services/             # External services (Firebase, APIs)
  stores/               # State management
  utils/                # Utility functions
  i18n/                 # Translations
  data/                 # Static data
```

---

## Running Tests

### Unit Tests (Vitest)

```bash
# Watch mode (recommended during development)
npm test

# Single run
npm run test:run

# With coverage report
npm run test:coverage
```

Test files are located in `/tests/` with naming convention `*.test.js`.

Example test:

```javascript
import { describe, it, expect } from 'vitest'
import { addPoints } from '../src/services/gamification.js'

describe('Gamification', () => {
  it('should add points correctly', () => {
    const result = addPoints(10, 'test')
    expect(result).toBeGreaterThanOrEqual(10)
  })
})
```

### E2E Tests (Playwright)

```bash
# Headless
npm run test:e2e

# With UI
npm run test:e2e:ui

# See browser
npm run test:e2e:headed
```

E2E tests are in `/e2e/` with naming convention `*.spec.js`.

### Test Coverage Goals

- Services: ~90%
- Utilities: ~85%
- State management: ~85%

---

## Adding New Features

### 1. Create a Branch

```bash
git checkout -b feature/my-feature
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring

### 2. Add Service (if needed)

Create a new service in `src/services/`:

```javascript
// src/services/myFeature.js

/**
 * My Feature Service
 * Description of what this service does
 */

import { getState, setState } from '../stores/state.js'

/**
 * Main function description
 * @param {string} param - Parameter description
 * @returns {Promise<Object>} Return description
 */
export async function myFunction(param) {
  // Implementation
}

export default {
  myFunction,
}
```

### 3. Add Component (if needed)

Create in `src/components/views/` or `src/components/modals/`:

```javascript
// src/components/views/MyView.js

import { t } from '../../i18n/index.js'
import { getState } from '../../stores/state.js'

export function MyView() {
  const state = getState()

  return `
    <div class="p-4">
      <h1 class="text-xl font-bold">${t('myViewTitle')}</h1>
      <!-- Content -->
    </div>
  `
}
```

### 4. Add Translations

Update `src/i18n/index.js`:

```javascript
const translations = {
  fr: {
    // existing...
    myViewTitle: 'Mon titre',
  },
  en: {
    // existing...
    myViewTitle: 'My Title',
  },
  es: {
    // existing...
    myViewTitle: 'Mi Titulo',
  },
}
```

### 5. Add Tests

Create `tests/myFeature.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { myFunction } from '../src/services/myFeature.js'

describe('MyFeature', () => {
  beforeEach(() => {
    // Setup
  })

  it('should do something', async () => {
    const result = await myFunction('test')
    expect(result).toBeDefined()
  })
})
```

### 6. Update State (if needed)

Add to `src/stores/state.js`:

```javascript
const initialState = {
  // existing...
  myFeatureData: null,
  showMyFeature: false,
}
```

### 7. Run Tests

```bash
npm run test:run
npm run build
```

**Important:** All tests must pass before committing.

---

## Pull Request Guidelines

### Before Submitting

1. **Run all checks:**
   ```bash
   npm run lint
   npm run test:run
   npm run build
   ```

2. **Write tests** for new functionality

3. **Update documentation** if needed

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding tests
- `chore` - Maintenance

Examples:
```
feat(spots): add filter by wait time
fix(map): correct marker clustering on mobile
docs(api): document gamification service
test(planner): add trip creation tests
```

### PR Template

```markdown
## Summary
Brief description of changes.

## Changes
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing done

## Screenshots
(If UI changes)

## Related Issues
Fixes #123
```

### Review Process

1. **Open PR** against `main` branch
2. **Wait for CI** - All checks must pass
3. **Address feedback** from reviewers
4. **Squash and merge** when approved

---

## Project Structure

```
Spothitch/
  src/
    components/
      views/              # Page components
        Home.js
        Map.js
        Spots.js
        Chat.js
        Profile.js
        ...
      modals/             # Modal dialogs
        Auth.js
        AddSpot.js
        SpotDetail.js
        ...
      App.js              # Root component
      Navigation.js       # Nav bar
      Header.js           # Header
    services/             # External integrations
      firebase.js         # Auth, Firestore, Storage
      osrm.js             # Routing API
      gamification.js     # Points, badges, levels
      map.js              # Leaflet map
      notifications.js    # Toasts, push notifications
      planner.js          # Trip planning
      offline.js          # Offline support
      sentry.js           # Error monitoring
    stores/
      state.js            # Global state management
    utils/
      storage.js          # localStorage/IndexedDB
      sanitize.js         # XSS protection
      a11y.js             # Accessibility helpers
      seo.js              # SEO utilities
    i18n/
      index.js            # Translations (FR, EN, ES)
    data/
      spots.js            # Sample spots data
      badges.js           # Badge definitions
      challenges.js       # Challenge definitions
      vip-levels.js       # VIP level definitions
    main.js               # App entry point
  tests/                  # Unit tests (Vitest)
  e2e/                    # E2E tests (Playwright)
  public/                 # Static assets
  docs/                   # Documentation
```

---

## Getting Help

- **Issues:** Open a GitHub issue for bugs or feature requests
- **Discussions:** Use GitHub Discussions for questions
- **Code Review:** Request review from maintainers

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
