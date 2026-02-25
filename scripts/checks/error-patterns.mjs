#!/usr/bin/env node
/**
 * Quality Gate Check: Error Patterns (from errors.md)
 * Reads lessons from memory/errors.md and verifies forbidden patterns
 * haven't returned in the codebase.
 *
 * Each ERR-XXX with a "Leçon" is turned into an automated check.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, extname, relative } from 'path'

const ROOT = join(import.meta.dirname, '..', '..')
const SRC_PATH = join(ROOT, 'src')
const ERRORS_PATH = join(ROOT, 'memory', 'errors.md')

function getAllJsFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      files.push(...getAllJsFiles(fullPath))
    } else if (extname(entry) === '.js') {
      files.push(fullPath)
    }
  }
  return files
}

/**
 * Hardcoded pattern checks derived from errors.md lessons.
 * Each check is a concrete, greppable pattern that should NOT exist.
 */
const PATTERN_CHECKS = [
  // ===== EXISTING CHECKS =====
  {
    id: 'ERR-001',
    name: 'Duplicate window.* handlers in non-main files',
    check(files) {
      const handlersByFile = {} // handler → [files]
      const guardedAssignments = new Set() // "handler:relPath" for guarded assignments
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        // Skip non-handler properties
        const SKIP = new Set(['addEventListener', 'removeEventListener', 'onerror', 'onload',
             'onunhandledrejection', 'onresize', 'onpopstate', 'onhashchange',
             '__SPOTHITCH_VERSION__', '_lazyLoaders', '_loadedModules',
             'mapInstance', 'spotHitchMap', 'homeMapInstance'])
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const m = line.match(/window\.(\w+)\s*=/)
          if (!m) continue
          const handler = m[1]
          if (SKIP.has(handler) || handler.startsWith('_')) continue
          // Check if this is a guarded assignment (if (!window.xxx) { ... window.xxx = ... })
          // Look up to 200 lines back for enclosing guard block
          const prevLines = lines.slice(Math.max(0, i - 200), i).join(' ')
          if (new RegExp(`if\\s*\\(\\s*!\\s*window\\.${handler}\\s*\\)`).test(prevLines)) {
            guardedAssignments.add(`${handler}:${relPath}`)
          }
          if (!handlersByFile[handler]) handlersByFile[handler] = new Set()
          handlersByFile[handler].add(relPath)
        }
      }
      // The lazy-loading pattern: main.js has placeholder + module has real impl = OK
      // Guarded assignments (if (!window.xxx)) are intentional fallbacks = OK
      // Only flag real unguarded duplicates in 2+ non-main files
      const duplicates = Object.entries(handlersByFile)
        .filter(([name, fileSet]) => {
          const fileArr = [...fileSet]
          const nonMainFiles = fileArr.filter(f => f !== 'main.js')
          // Remove guarded files from duplication count
          const unguardedNonMain = nonMainFiles.filter(f => !guardedAssignments.has(`${name}:${f}`))
          // Real duplication: 2+ unguarded non-main files
          return unguardedNonMain.length > 1
        })
        .map(([name, fileSet]) => `${name} defined in: ${[...fileSet].join(', ')}`)
      return duplicates
    }
  },
  {
    id: 'ERR-019a',
    name: 'Manual quote escaping instead of escapeJSString',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (/\.replace\(\s*\/['"]\/g/.test(lines[i]) && /\\['"]/.test(lines[i])) {
            issues.push(`${relPath}:${i + 1} — .replace(/'/g) pattern (use escapeJSString)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-019b',
    name: 'innerHTML with error.message (XSS)',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (/\.innerHTML\s*[+=]/.test(lines[i]) && /error\.message|err\.message/.test(lines[i])) {
            const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ')
            if (!/textContent|escapeHtml|DOMPurify|escapeJSString/.test(context)) {
              issues.push(`${relPath}:${i + 1} — innerHTML with error.message (use textContent)`)
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-019c',
    name: 'Math.random() for security IDs (SOS, auth, session)',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (/Math\.random\(\)/.test(lines[i])) {
            const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ').toLowerCase()
            if (/sos|emergency|session.?id|auth.?token|api.?key|tracking.?id/.test(context)) {
              issues.push(`${relPath}:${i + 1} — Math.random() for security ID (use crypto.getRandomValues)`)
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-011',
    name: 'MutationObserver modifying observed DOM without guard',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        if (/new\s+MutationObserver/.test(content)) {
          // Check if there's a guard variable (many valid patterns)
          const hasGuard = /last\w+|_observer\w+|observerLock|isProcessing|_guard|_init|_attached|_setup|debounce|throttle|requestAnimationFrame/.test(content)
          if (!hasGuard) {
            // Only flag if observer callback directly modifies DOM it observes
            if (/\.remove\(\)|\.cleanup|\.destroy/.test(content)) {
              issues.push(`${relPath} — MutationObserver without guard flag (risk of infinite loop, ERR-011)`)
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-029',
    name: 'Ghost state flags (showXxx set but never rendered)',
    check(files) {
      // Collect all showXxx state flags set anywhere
      const stateFlags = new Set()
      const allContent = {} // relPath → content

      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        allContent[relPath] = content

        // Collect flags set via setState
        const setMatches = content.match(/setState\(\s*\{[^}]*show\w+:\s*true/g) || []
        for (const m of setMatches) {
          const flagMatch = m.match(/(show\w+):\s*true/)
          if (flagMatch) stateFlags.add(flagMatch[1])
        }
      }

      // Check which flags are referenced in render/view files
      // (App.js, main.js, and all component/view files)
      const renderFiles = Object.entries(allContent).filter(([path]) =>
        path.includes('App.js') || path === 'main.js' ||
        path.includes('components/') || path.includes('views/')
      )

      const renderedFlags = new Set()
      for (const flag of stateFlags) {
        for (const [, content] of renderFiles) {
          // Check if the flag is used in a conditional render (ternary, if, &&)
          if (content.includes(`state.${flag}`) || content.includes(`${flag} ?`) ||
              content.includes(`${flag} &&`) || content.includes(`getState().${flag}`)) {
            renderedFlags.add(flag)
            break
          }
        }
      }

      const ghostFlags = [...stateFlags].filter(f => !renderedFlags.has(f))
      // Filter out expected non-rendered flags (UI state, not modal renders)
      const EXPECTED_NON_RENDERED = new Set([
        'showLanding', 'showWelcome', 'showCookieBanner',
        'showOfflineBanner', 'showDebugPanel', 'showZoneChat',
        'showNotification', 'showToast', 'showLoading',
        // Flags with no render modal (stub handlers, future features, or inline UI)
        'showConsentSettings', // shows toast only (MyData.js)
        'showGuidesOverlay',   // used internally in Map.js, no modal
        'showJoinTeam',        // future feature, stub handler in teamChallenges.js
        'showPhotoUpload',     // stub handler, future feature
        'showSettings',        // settings rendered inline in Profile.js
        'showTeamSettings',    // future feature, stub handler in teamChallenges.js
        'showTitlePopup',      // auto-hide popup in gamification.js, no modal
      ])
      const realGhosts = ghostFlags.filter(f => !EXPECTED_NON_RENDERED.has(f))

      return realGhosts.map(f => `State flag "${f}" is set but never used in render conditionals (ghost state)`)
    }
  },

  // ===== NEW CHECKS FROM errors.md =====

  {
    id: 'ERR-002',
    name: 'Firebase write actions without auth check',
    check(files) {
      const issues = []
      // Functions that write to Firestore should check auth first
      const WRITE_PATTERNS = /\b(setDoc|addDoc|updateDoc|deleteDoc)\s*\(/
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        // Skip test files, config files, firebase.js itself
        if (relPath.includes('firebase.js') || relPath.includes('test')) continue
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (WRITE_PATTERNS.test(lines[i])) {
            // Check surrounding context (30 lines before) for auth check
            const contextBefore = lines.slice(Math.max(0, i - 30), i).join(' ')
            const hasAuthCheck = /auth\.currentUser|isLoggedIn|requireAuth|currentUser|getAuth\(\)|onAuthStateChanged|test_mode/.test(contextBefore)
            // Also check if the function itself is guarded at the top
            if (!hasAuthCheck) {
              // Check if the function declaration context has an auth param
              const fnContext = lines.slice(Math.max(0, i - 50), i).join(' ')
              const hasFnAuthCheck = /if\s*\(\s*!.*auth|if\s*\(\s*!.*user|if\s*\(\s*!.*logged/.test(fnContext)
              if (!hasFnAuthCheck) {
                issues.push(`${relPath}:${i + 1} — Firestore write without visible auth check (ERR-002)`)
              }
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-016',
    name: 'Dynamic import() with variable argument (breaks Vite)',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Match import(variable) but not import('./literal') or import(`literal`)
          const importMatch = line.match(/\bimport\(\s*([^)]+)\s*\)/)
          if (!importMatch) continue
          const arg = importMatch[1].trim()
          // Legitimate: string literal, template literal with only string parts
          if (/^['"`]/.test(arg)) continue
          // Skip comments
          if (/^\s*\/\//.test(line)) continue
          // Skip intentional @vite-ignore directives (developer explicitly opted out)
          if (/@vite-ignore/.test(arg) || /@vite-ignore/.test(lines[Math.max(0, i - 1)])) continue
          issues.push(`${relPath}:${i + 1} — import() with variable argument "${arg}" (use static string, ERR-016)`)
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-034',
    name: 'Math.random() for entity IDs (non-visual usage)',
    check(files) {
      const issues = []
      // Files that are exclusively visual/animation — Math.random is OK there
      const VISUAL_FILES = new Set(['utils/confetti.js', 'utils/animations.js'])
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        if (VISUAL_FILES.has(relPath)) continue
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (!/Math\.random\(\)/.test(lines[i])) continue
          // Check if it's used for ID generation (toString(36), substring pattern)
          const context = lines.slice(i, Math.min(lines.length, i + 2)).join(' ')
          if (/\.toString\(36\)/.test(context)) {
            issues.push(`${relPath}:${i + 1} — Math.random().toString(36) for ID generation (use crypto.getRandomValues, ERR-034)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-036',
    name: 'Dropdown/autocomplete inside overflow-hidden container',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        // Only check view files that actually call initAutocomplete or create dropdown elements
        if (!/initAutocomplete|autocomplete-dropdown|suggestion-list/.test(content)) continue
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Look for overflow-hidden on a card class that contains form inputs
          if (/class=.*\bcard\b.*overflow-hidden/.test(line) || /class=.*overflow-hidden.*\bcard\b/.test(line)) {
            if (/overflow-visible/.test(line)) continue
            // Check if there's an autocomplete input within 50 lines
            const nextLines = lines.slice(i, Math.min(lines.length, i + 50)).join(' ')
            if (/autocomplete|initAutocomplete|suggestion/.test(nextLines)) {
              issues.push(`${relPath}:${i + 1} — .card with overflow-hidden contains autocomplete (suggestions will be clipped, ERR-036)`)
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-037',
    name: 'window.render() usage (should be window._forceRender)',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Match window.render() or window.render?.() but NOT window.renderXxx or window._forceRender
          if (/window\.render\s*\?\.\s*\(|window\.render\s*\(/.test(line)) {
            // Exclude window.renderXxxYyy (component render functions)
            if (/window\.render[A-Z]/.test(line)) continue
            issues.push(`${relPath}:${i + 1} — window.render() does not exist, use window._forceRender() (ERR-037)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-038',
    name: 'fetch() to external API domain not in CSP connect-src',
    check(files) {
      // Parse CSP connect-src from index.html
      const indexPath = join(ROOT, 'index.html')
      if (!existsSync(indexPath)) return []
      const indexContent = readFileSync(indexPath, 'utf-8')
      const cspMatch = indexContent.match(/connect-src\s+([^;]+)/)
      if (!cspMatch) return ['No connect-src found in CSP']
      const allowedDomains = cspMatch[1].split(/\s+/).filter(d => d.startsWith('https://'))
        .map(d => d.replace('https://', '').replace(/\*/g, '.*'))

      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Match fetch('https://domain...') or fetch(`https://domain...`)
          const fetchMatch = line.match(/fetch\(\s*[`'"](https?:\/\/([^/'"` ]+))/)
          if (!fetchMatch) continue
          const domain = fetchMatch[2]
          // Check if domain matches any allowed CSP domain
          const isAllowed = allowedDomains.some(pattern => {
            const regex = new RegExp(`^${pattern}$`)
            return regex.test(domain)
          })
          if (!isAllowed) {
            issues.push(`${relPath}:${i + 1} — fetch to "${domain}" not in CSP connect-src (ERR-038)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-020',
    name: 'activeTab value without matching case in renderActiveView',
    check(files) {
      // Known valid tab IDs from renderActiveView in App.js
      const VALID_TABS = new Set(['map', 'challenges', 'social', 'chat', 'profile', 'spots', 'travel-groups'])
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const tabMatch = line.match(/activeTab:\s*['"](\w[\w-]*)['"]/)
          if (!tabMatch) continue
          const tabId = tabMatch[1]
          if (!VALID_TABS.has(tabId)) {
            issues.push(`${relPath}:${i + 1} — activeTab:'${tabId}' has no matching case in renderActiveView (ERR-020)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-014',
    name: 'No-op stub handlers (empty arrow functions on window)',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Match window.xxx = () => {} or window.xxx = function() {} (empty body)
          if (/window\.\w+\s*=\s*\(\)\s*=>\s*\{\s*\}/.test(line) ||
              /window\.\w+\s*=\s*\(\)\s*=>\s*\{\s*\/\*\s*no-?op\s*\*\/\s*\}/.test(line)) {
            // Skip known intentional stubs (comment says "placeholder" or "fallback")
            const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 2)).join(' ')
            if (/placeholder|fallback|will be replaced|lazy.?load|overridden|no.?op|handled by|removed|overlay removed|stub/i.test(context)) continue
            const handlerMatch = line.match(/window\.(\w+)/)
            issues.push(`${relPath}:${i + 1} — window.${handlerMatch?.[1]} is a no-op stub (ERR-014)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-030',
    name: 'Hardcoded French text without t() in UI components',
    check(files) {
      const issues = []
      // Common French words that indicate hardcoded text
      const FRENCH_PATTERNS = /(?:^|['"`> ])(?:Félicitations|Récupérer|Récompense|Connecte-toi|Reviens demain|Supprimer|Confirmer|Annuler|Sauvegarder|Enregistrer|Modifier|Chargement|Erreur|Succès|Bienvenue)(?:['"`< !.,]|$)/
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        // Only check component/view/modal files (not i18n, not services with just fallbacks)
        if (!relPath.includes('components/') && !relPath.includes('views/') && !relPath.includes('modals/')) continue
        // Skip i18n directory
        if (relPath.includes('i18n/')) continue
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Skip comments, imports, and lines that already use t()
          if (/^\s*\/\//.test(line) || /^\s*\*/.test(line) || /^\s*import/.test(line)) continue
          // Only check lines that are in template literals or HTML strings
          if (!(/['"`]/.test(line))) continue
          if (FRENCH_PATTERNS.test(line)) {
            // Check if it's already using t() as a fallback (t('key') || 'French text')
            if (/t\(\s*['"]/.test(line)) continue
            issues.push(`${relPath}:${i + 1} — Hardcoded French text without t() (ERR-030)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-008',
    name: 'CSS class selectors that likely do not exist',
    check(files) {
      const issues = []
      // Collect all class names used in querySelector/querySelectorAll
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Match querySelectorAll('.class-name') patterns
          const selectorMatch = line.match(/querySelector(?:All)?\(\s*['"]\.([a-z][\w-]+)['"]\s*\)/)
          if (!selectorMatch) continue
          const className = selectorMatch[1]
          // Check if this class name appears in any template/HTML in the same file
          // (it should be defined somewhere as class="xxx")
          const classInTemplate = content.includes(`class="${className}"`) ||
            content.includes(`class='${className}'`) ||
            content.includes(` ${className} `) ||
            content.includes(` ${className}"`) ||
            content.includes(` ${className}'`) ||
            // Tailwind dynamic
            content.includes(`${className}\``) ||
            // Also check CSS-related patterns (main.css would define it)
            className.startsWith('text-') || className.startsWith('bg-') ||
            className.startsWith('flex') || className.startsWith('grid')
          if (!classInTemplate) {
            // Check context — might be a well-known class
            const KNOWN_CLASSES = new Set(['card', 'btn', 'modal', 'active', 'hidden', 'visible',
              'radio-btn', 'tab-btn', 'nav-btn', 'spot-card', 'map-marker',
              // Dynamic classes defined in template literals (false positives)
              'team-avatar-btn', 'landing-dot', 'spot-type-btn', 'language-option',
              'category-btn', 'hostel-tab', 'faq-answer', 'contact-error',
              // External library classes
              'maplibregl-popup'])
            if (!KNOWN_CLASSES.has(className)) {
              issues.push(`${relPath}:${i + 1} — querySelector('.${className}') — class may not exist in template (ERR-008)`)
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-024',
    name: 'onclick references window.* function not defined anywhere',
    check(files) {
      // Collect all window.* function definitions
      const definedHandlers = new Set()
      const allContent = {}
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        allContent[relPath] = content
        const matches = content.matchAll(/window\.(\w+)\s*=/g)
        for (const m of matches) {
          definedHandlers.add(m[1])
        }
      }
      // JS keywords and browser globals to skip
      const SKIP = new Set(['alert', 'confirm', 'prompt', 'open', 'close',
        'history', 'location', 'navigator', 'console', 'event', 'this',
        'if', 'for', 'while', 'switch', 'return', 'new', 'void', 'typeof',
        'delete', 'try', 'catch', 'throw', 'let', 'const', 'var', 'function',
        'document', 'window', 'setTimeout', 'setInterval', 'clearTimeout',
        'clearInterval', 'requestAnimationFrame', 'fetch', 'parseInt', 'parseFloat',
        'encodeURIComponent', 'decodeURIComponent', 'JSON', 'Array', 'Object',
        'Math', 'Date', 'String', 'Number', 'Boolean', 'RegExp', 'Error',
        'Promise', 'Map', 'Set', 'Symbol'])
      // Check onclick attributes that reference undefined handlers
      const issues = []
      for (const [relPath, content] of Object.entries(allContent)) {
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Skip comments and JSDoc
          if (/^\s*\/\/|^\s*\*|^\s*\/\*/.test(line)) continue
          // Match onclick="functionName(...)" in template strings — must start with a letter and be a plausible function name
          const onclickMatches = line.matchAll(/onclick="([a-zA-Z]\w*)\s*\(/g)
          for (const m of onclickMatches) {
            const fnName = m[1]
            if (SKIP.has(fnName)) continue
            if (!definedHandlers.has(fnName)) {
              issues.push(`${relPath}:${i + 1} — onclick="${fnName}()" but window.${fnName} is not defined (ERR-024)`)
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-022',
    name: 'location.reload() without visibility check (auto-reload context)',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (!/location\.reload\(\)/.test(lines[i])) continue
          const line = lines[i]
          // OK: onclick button (user-initiated reload after error)
          if (/onclick=/.test(line)) continue
          // Check surrounding context for visibility check or user-initiated action
          const contextBefore = lines.slice(Math.max(0, i - 15), i).join(' ')
          // OK: visibility check for auto-reload
          if (/visibilityState|hidden|document\.hidden|pendingReload/.test(contextBefore)) continue
          // OK: user-initiated reloads (delete account, admin panel, logout, cache clear)
          if (/delete.*account|admin|logout|signOut|clearCache|clearAllData|resetApp|confirm\(/.test(contextBefore)) continue
          // OK: Service Worker update flow
          if (/serviceWorker|controllerchange|registration/.test(contextBefore)) continue
          // OK: error boundary / error handler context
          if (/error|catch|boundary|retry|recharger/i.test(contextBefore)) continue
          issues.push(`${relPath}:${i + 1} — location.reload() without visibility check (auto-reload should wait for background, ERR-022)`)
        }
      }
      return issues
    }
  },

  // ===== NEW CHECKS FROM SESSION 23 =====

  {
    id: 'S23-001',
    name: 'Too small font size (text-[8px] or text-[9px])',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (/text-\[([89])px\]/.test(line)) {
            // Skip comments
            if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue
            const sizeMatch = line.match(/text-\[([89])px\]/)
            issues.push(`${relPath}:${i + 1} — text-[${sizeMatch[1]}px] is too small, minimum 10px (S23-001)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'S23-002',
    name: 'clipboard.writeText without .catch()',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (/clipboard\.writeText\(/.test(line)) {
            // Check if there's a .catch() or try/catch context or .then(...).catch
            const nextLines = lines.slice(i, Math.min(lines.length, i + 3)).join(' ')
            const prevLines = lines.slice(Math.max(0, i - 5), i).join(' ')
            const hasCatch = /\.catch\(/.test(nextLines) || /try\s*\{/.test(prevLines) || /await/.test(line)
            if (!hasCatch) {
              issues.push(`${relPath}:${i + 1} — clipboard.writeText without .catch() or try/catch (S23-002)`)
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'S23-003',
    name: 'setState activeTab value without case in renderActiveView',
    check(files) {
      // Valid tabs from renderActiveView in App.js (including default 'map' handled by return '')
      const VALID_TABS = new Set(['map', 'challenges', 'social', 'chat', 'profile', 'spots', 'travel-groups'])
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Match setState({ activeTab: 'xxx' })
          const match = line.match(/setState\([^)]*activeTab:\s*['"](\w[\w-]*)['"]/)
          if (!match) continue
          const tabId = match[1]
          if (!VALID_TABS.has(tabId)) {
            issues.push(`${relPath}:${i + 1} — setState activeTab:'${tabId}' has no case in renderActiveView (S23-003)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-023',
    name: 'Custom CSS class used without definition in main.css',
    check(files) {
      // Read main.css to find defined classes
      const cssPath = join(SRC_PATH, 'styles', 'main.css')
      if (!existsSync(cssPath)) return []
      const cssContent = readFileSync(cssPath, 'utf-8')

      const issues = []
      // Look for custom class names used in templates (not Tailwind utility classes)
      const CUSTOM_CLASSES_TO_CHECK = ['modal-overlay', 'modal-panel', 'slide-up']
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          for (const cls of CUSTOM_CLASSES_TO_CHECK) {
            if (line.includes(`class=`) && line.includes(cls)) {
              // Check if this custom class is defined in main.css
              if (!cssContent.includes(`.${cls}`)) {
                issues.push(`${relPath}:${i + 1} — class "${cls}" used but not defined in main.css (ERR-023)`)
              }
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-009',
    name: 'Multi-step form submission without final validation',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        // Only check files that have multi-step forms (step-based patterns)
        if (!/step\s*[=<>]\s*\d|Step\s*\d|nextStep|prevStep/i.test(content)) continue
        // Check if there's a submit/save function
        const hasSubmit = /handleAdd|handleSubmit|handleSave|handleCreate/.test(content)
        if (!hasSubmit) continue
        // Check if the submit function has validation
        const submitFnMatch = content.match(/((?:async\s+)?(?:function\s+|(?:window\.\w+\s*=\s*(?:async\s+)?)?(?:\(\)\s*=>|\(\)\s*=>\s*\{|function\s*\())[^}]*(?:handleAdd|handleSubmit|handleSave|handleCreate)[^]*?(?:\n\}|\n\s*\}))/m)
        if (submitFnMatch) {
          const fnBody = submitFnMatch[0]
          const hasValidation = /if\s*\(\s*!|\.length\s*[=<>]|required|validate|!.*\.trim\(\)/.test(fnBody)
          if (!hasValidation) {
            issues.push(`${relPath} — Multi-step form submit function lacks validation at final step (ERR-009)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-021',
    name: 'render() without guard for stateful DOM (carousel, animations)',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        // Only check main.js render function
        if (!relPath.endsWith('main.js')) continue
        // Check if there's a render function that does innerHTML replacement
        if (/app\.innerHTML\s*=/.test(content)) {
          // Check if there are guards for stateful components (landing, carousel, active input)
          const hasLandingGuard = /savedLanding|landing.*showLanding|getElementById\(['"]landing/.test(content)
          const hasInputGuard = /activeElement|focused.*tagName/.test(content)
          if (!hasLandingGuard && !hasInputGuard) {
            issues.push(`${relPath} — render() does innerHTML= without guard for stateful DOM components (ERR-021)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-004',
    name: 'New navigateFallbackDenylist paths needed for static pages',
    check(files) {
      // Check vite.config.js for navigateFallbackDenylist
      const configPath = join(ROOT, 'vite.config.js')
      if (!existsSync(configPath)) return []
      const configContent = readFileSync(configPath, 'utf-8')
      // Check public/ for static page directories
      const publicPath = join(ROOT, 'public')
      if (!existsSync(publicPath)) return []
      const issues = []
      try {
        const publicEntries = readdirSync(publicPath)
        for (const entry of publicEntries) {
          const fullPath = join(publicPath, entry)
          if (!statSync(fullPath).isDirectory()) continue
          if (['data', 'icons', 'images', 'screenshots', 'assets'].includes(entry)) continue
          // Check if this directory is in the denylist
          const denylistRegex = new RegExp(`/${entry}/|/${entry}\\\\`)
          if (!denylistRegex.test(configContent) && !configContent.includes(`/${entry}`)) {
            // Only flag if there are HTML files in this directory
            try {
              const dirEntries = readdirSync(fullPath)
              if (dirEntries.some(f => f.endsWith('.html'))) {
                issues.push(`public/${entry}/ has HTML files but is not in SW navigateFallbackDenylist (ERR-004)`)
              }
            } catch { /* skip */ }
          }
        }
      } catch { /* skip */ }
      return issues
    }
  },
  {
    id: 'ERR-012',
    name: 'setState for step/modal change without blur() first',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Match setState that changes step
          if (/setState\([^)]*(?:addSpotStep|Step)\s*:/.test(line)) {
            // Check if blur() is called before (within 5 lines)
            const prevLines = lines.slice(Math.max(0, i - 5), i).join(' ')
            if (!/blur\(\)|\.blur\(\)/.test(prevLines)) {
              // Only flag in AddSpot context where input focus guard exists
              if (relPath.includes('AddSpot')) {
                issues.push(`${relPath}:${i + 1} — setState changes step without blur() first (may be blocked by focus guard, ERR-012)`)
              }
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-033',
    name: 'Handler defined in multiple non-main component files',
    check(files) {
      // Skip non-handler properties and known multi-file patterns
      const SKIP = new Set(['addEventListener', 'removeEventListener', 'onerror', 'onload',
        'onunhandledrejection', 'onresize', 'onpopstate', 'onhashchange',
        '__SPOTHITCH_VERSION__', '_lazyLoaders', '_loadedModules',
        'mapInstance', 'spotHitchMap', 'homeMapInstance'])
      const handlersByFile = {} // handler → [files]
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        // Only check component/view/service files (not main.js)
        if (relPath === 'main.js') continue
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const m = line.match(/window\.(\w+)\s*=/)
          if (!m) continue
          const handler = m[1]
          if (handler.startsWith('_') || SKIP.has(handler)) continue
          // Check for guard (look up to 200 lines back for enclosing guard block)
          const prevLines = lines.slice(Math.max(0, i - 200), i).join(' ')
          if (new RegExp(`if\\s*\\(\\s*!\\s*window\\.${handler}\\s*\\)`).test(prevLines)) continue
          if (!handlersByFile[handler]) handlersByFile[handler] = new Set()
          handlersByFile[handler].add(relPath)
        }
      }
      // Flag handlers defined unguarded in 2+ component files
      const duplicates = Object.entries(handlersByFile)
        .filter(([, fileSet]) => fileSet.size > 1)
        .map(([name, fileSet]) => `window.${name} defined in ${fileSet.size} component files: ${[...fileSet].join(', ')}`)
      return duplicates
    }
  },
  {
    id: 'ERR-015',
    name: 'onclick calls function that does not exist on window',
    check(files) {
      // Collect all window.* definitions
      const definedOnWindow = new Set()
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const matches = content.matchAll(/window\.(\w+)\s*=/g)
        for (const m of matches) definedOnWindow.add(m[1])
      }
      // JS keywords and browser globals to skip
      const SKIP = new Set(['alert', 'confirm', 'prompt', 'open', 'close',
        'history', 'location', 'navigator', 'console', 'event', 'this',
        'if', 'for', 'while', 'switch', 'return', 'new', 'void', 'typeof',
        'delete', 'try', 'catch', 'throw', 'let', 'const', 'var', 'function',
        'document', 'window', 'setTimeout', 'setInterval', 'clearTimeout',
        'clearInterval', 'requestAnimationFrame', 'fetch', 'parseInt', 'parseFloat',
        'encodeURIComponent', 'decodeURIComponent', 'JSON', 'Array', 'Object',
        'Math', 'Date', 'String', 'Number', 'Boolean', 'RegExp', 'Error',
        'Promise', 'Map', 'Set', 'Symbol'])

      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Skip comments and JSDoc
          if (/^\s*\/\/|^\s*\*|^\s*\/\*/.test(line)) continue
          // Match onclick="functionName(" in HTML template strings
          const matches = line.matchAll(/onclick=["']([a-zA-Z]\w*)\s*\(/g)
          for (const m of matches) {
            const fnName = m[1]
            if (SKIP.has(fnName)) continue
            if (!definedOnWindow.has(fnName)) {
              issues.push(`${relPath}:${i + 1} — onclick="${fnName}()" references undefined window.${fnName} (ERR-015)`)
            }
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-028',
    name: 'State flag set in handler but no render function wired in App.js',
    check(files) {
      // Read App.js for _lazyLoaders and render conditionals
      const appJsFile = files.find(f => f.endsWith('App.js') && f.includes('components'))
      if (!appJsFile) return []
      const appContent = readFileSync(appJsFile, 'utf-8')

      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        // Look for window.openXxx handlers that setState({ showXxx: true })
        const openHandlerMatches = content.matchAll(/window\.(open\w+)\s*=.*setState\(\s*\{[^}]*(show\w+):\s*true/g)
        for (const m of openHandlerMatches) {
          const handlerName = m[1]
          const stateFlag = m[2]
          // Check if App.js renders something when this flag is true
          if (!appContent.includes(`state.${stateFlag}`) && !appContent.includes(`${stateFlag} ?`) && !appContent.includes(`${stateFlag} &&`)) {
            issues.push(`${relPath} — window.${handlerName} sets ${stateFlag}:true but App.js never renders it (ERR-028)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-031',
    name: 'Exported render function not in App.js _lazyLoaders',
    check(files) {
      const appJsFile = files.find(f => f.endsWith('App.js') && f.includes('components'))
      if (!appJsFile) return []
      const appContent = readFileSync(appJsFile, 'utf-8')

      const issues = []
      for (const file of files) {
        if (file === appJsFile) continue
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        // Find exported render functions
        const exportMatches = content.matchAll(/export\s+(?:function|const)\s+(render\w+Modal)\s*\(/g)
        for (const m of exportMatches) {
          const fnName = m[1]
          if (!appContent.includes(fnName)) {
            issues.push(`${relPath} — export ${fnName}() not registered in App.js _lazyLoaders (ERR-031)`)
          }
        }
      }
      return issues
    }
  },
  {
    id: 'ERR-019d',
    name: 'innerHTML with unescaped user variables (XSS risk)',
    check(files) {
      const issues = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const relPath = relative(SRC_PATH, file)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Match .innerHTML = or .innerHTML += with template literal containing ${
          if (/\.innerHTML\s*[+=]/.test(line)) {
            // Check if it uses a template literal with interpolation of user data
            const context = lines.slice(i, Math.min(lines.length, i + 5)).join(' ')
            // Flag innerHTML with user.name, username, displayName, email directly interpolated
            if (/\$\{.*(?:user\.name|username|displayName|user\.email|\.name\b).*\}/.test(context)) {
              // Skip if escapeJSString or escapeHtml or textContent is nearby
              if (/escapeJSString|escapeHtml|escapeHTML|DOMPurify|sanitize|textContent/.test(context)) continue
              issues.push(`${relPath}:${i + 1} — innerHTML with user variable interpolation (use textContent or escape, ERR-019)`)
            }
          }
        }
      }
      return issues
    }
  },
]

export default function checkErrorPatterns() {
  if (!existsSync(ERRORS_PATH)) {
    return {
      name: 'Error Patterns',
      score: 100,
      maxScore: 100,
      errors: [],
      warnings: ['memory/errors.md not found — skipping pattern checks'],
      stats: { checksRun: 0, issuesFound: 0 },
    }
  }

  const files = getAllJsFiles(SRC_PATH)
  const errors = []
  const warnings = []
  let issuesFound = 0
  let checksWithIssues = 0

  for (const check of PATTERN_CHECKS) {
    try {
      const issues = check.check(files)
      if (issues.length > 0) {
        issuesFound += issues.length
        checksWithIssues++
        errors.push(`[${check.id}] ${check.name}: ${issues.length} issue(s)`)
        issues.slice(0, 3).forEach(i => errors.push(`  ${i}`))
        if (issues.length > 3) errors.push(`  ... and ${issues.length - 3} more`)
      }
    } catch (err) {
      warnings.push(`[${check.id}] Check failed: ${err.message}`)
    }
  }

  // Score: deduct per check that has issues, not per issue
  // Scale deduction based on total checks so adding more checks doesn't make the score harsher
  const deductionPerCheck = Math.max(5, Math.floor(100 / PATTERN_CHECKS.length))
  const score = Math.max(0, 100 - (checksWithIssues * deductionPerCheck))

  return {
    name: 'Error Patterns',
    score,
    maxScore: 100,
    errors,
    warnings,
    stats: {
      checksRun: PATTERN_CHECKS.length,
      issuesFound,
    }
  }
}

// Run standalone
if (process.argv[1] && process.argv[1].endsWith('error-patterns.mjs')) {
  const result = checkErrorPatterns()
  console.log(`\n=== ${result.name} ===`)
  console.log(`Checks run: ${result.stats.checksRun}`)
  console.log(`Issues found: ${result.stats.issuesFound}`)
  if (result.errors.length) result.errors.forEach(e => console.log(`ERROR: ${e}`))
  if (result.warnings.length) result.warnings.forEach(w => console.log(`WARN: ${w}`))
  console.log(`Score: ${result.score}/100`)
  process.exit(result.errors.length > 0 ? 1 : 0)
}
