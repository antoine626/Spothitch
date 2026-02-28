/**
 * Auth Modal Component
 * Login and registration with social providers + progressive auth gate
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'

export function renderAuth(state) {
  const reason = state.showAuthReason || null
  const isSignUp = state.authMode === 'register'

  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeAuth()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
     tabindex="0">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative modal-panel rounded-3xl w-full max-w-md overflow-hidden slide-up max-h-[90vh] overflow-y-auto"
        onclick="event.stopPropagation()"
      >
        <!-- Close -->
        <button
          onclick="closeAuth()"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="${t('close') || 'Close'}"
          type="button"
        >
          ${icon('x', 'w-5 h-5')}
        </button>

        <!-- Header -->
        <div class="p-6 pb-4 text-center">
          <div class="text-4xl mb-3" aria-hidden="true">🤙</div>
          <h2 id="auth-modal-title" class="text-2xl font-bold gradient-text">
            ${isSignUp ? t('signUpTitle') : t('signInTitle')}
          </h2>
          ${reason ? `
            <p class="mt-2 text-sm text-amber-400/90 bg-amber-500/10 rounded-xl px-4 py-2 inline-block">
              ${reason}
            </p>
          ` : ''}
        </div>

        <!-- Social Login Buttons -->
        <div class="px-6 space-y-3">
          <!-- Google -->
          <button
            onclick="handleGoogleSignIn()"
            class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white font-medium"
            type="button"
            id="auth-google-btn"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            ${t('continueWithGoogle')}
          </button>

          <!-- Facebook (requires Facebook Developer App — hidden until configured) -->
          <!-- <button onclick="handleFacebookSignIn()" id="auth-facebook-btn">Facebook</button> -->
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-4 px-6 my-5">
          <div class="flex-1 h-px bg-white/10"></div>
          <span class="text-slate-400 text-sm">${t('orContinueWithEmail')}</span>
          <div class="flex-1 h-px bg-white/10"></div>
        </div>

        <!-- Tabs -->
        <div class="flex mx-6 mb-4 rounded-xl bg-white/5 p-1" role="tablist" aria-label="${t('authMode') || 'Authentication mode'}">
          <button
            onclick="setAuthMode('login')"
            class="flex-1 py-2 text-center text-sm rounded-lg transition-colors ${!isSignUp ? 'bg-primary-500/20 text-primary-400 font-medium' : 'text-slate-400 hover:text-white'}"
            data-mode="login"
            id="auth-tab-login"
            role="tab"
            aria-selected="${!isSignUp}"
            aria-controls="auth-form"
            type="button"
          >
            ${t('signInButton')}
          </button>
          <button
            onclick="setAuthMode('register')"
            class="flex-1 py-2 text-center text-sm rounded-lg transition-colors ${isSignUp ? 'bg-primary-500/20 text-primary-400 font-medium' : 'text-slate-400 hover:text-white'}"
            data-mode="register"
            id="auth-tab-register"
            role="tab"
            aria-selected="${isSignUp}"
            aria-controls="auth-form"
            type="button"
          >
            ${t('signUpButton')}
          </button>
        </div>

        <!-- Form -->
        <div class="px-6 pb-4" role="tabpanel" id="auth-form-panel">
          <form id="auth-form" onsubmit="handleAuth(event)" class="space-y-4" aria-label="${t('loginForm') || 'Login form'}">
            <!-- Display Name (Register only) -->
            ${isSignUp ? `
              <div>
                <label for="auth-username" class="text-sm text-slate-400 block mb-1.5">${t('displayNamePlaceholder')}</label>
                <input
                  type="text"
                  id="auth-username"
                  name="username"
                  class="input-modern"
                  placeholder="${t('displayNamePlaceholder')}"
                  maxlength="30"
                  autocomplete="username"
                />
              </div>
            ` : ''}

            <!-- Email -->
            <div>
              <label for="auth-email" class="text-sm text-slate-400 block mb-1.5">${t('emailPlaceholder')}</label>
              <input
                type="email"
                id="auth-email"
                name="email"
                class="input-modern"
                placeholder="${t('emailPlaceholder')}"
                required
                autocomplete="email"
                aria-required="true"
              />
            </div>

            <!-- Password -->
            <div>
              <label for="auth-password" class="text-sm text-slate-400 block mb-1.5">${t('passwordPlaceholder')}</label>
              <input
                type="password"
                id="auth-password"
                name="password"
                class="input-modern"
                placeholder="${t('passwordPlaceholder')}"
                required
                minlength="6"
                autocomplete="${isSignUp ? 'new-password' : 'current-password'}"
                aria-required="true"
                aria-describedby="password-hint"
              />
              <span id="password-hint" class="sr-only">${t('weakPassword')}</span>
            </div>

            <!-- Confirm Password (Register only) -->
            ${isSignUp ? `
              <div>
                <label for="auth-password-confirm" class="text-sm text-slate-400 block mb-1.5">${t('confirmPassword')}</label>
                <input
                  type="password"
                  id="auth-password-confirm"
                  name="password-confirm"
                  class="input-modern"
                  placeholder="${t('confirmPassword')}"
                  minlength="6"
                  autocomplete="new-password"
                  required
                />
              </div>
            ` : ''}

            <!-- Forgot Password (Login only) -->
            ${!isSignUp ? `
              <div class="text-right">
                <button
                  type="button"
                  onclick="handleForgotPassword()"
                  class="text-primary-400 text-sm hover:underline"
                >
                  ${t('forgotPassword')}
                </button>
              </div>
            ` : ''}

            <!-- Error message area -->
            <div id="auth-error-msg" class="hidden text-red-400 text-sm text-center py-2 px-3 bg-red-500/10 rounded-xl"></div>

            <!-- Submit -->
            <button
              type="submit"
              class="btn btn-primary w-full"
              id="auth-submit-btn"
            >
              <span id="auth-submit-text">${isSignUp ? t('signUpButton') : t('signInButton')}</span>
            </button>
          </form>

          <!-- Switch mode text -->
          <p class="text-center text-sm text-slate-400 mt-4">
            ${isSignUp ? t('switchToSignIn') : t('switchToSignUp')}
            <button
              type="button"
              onclick="setAuthMode('${isSignUp ? 'login' : 'register'}')"
              class="text-primary-400 hover:underline ml-1 font-medium"
            >
              ${isSignUp ? t('signInButton') : t('signUpButton')}
            </button>
          </p>

          <!-- Skip / Continue without account -->
          <div class="text-center mt-4 pb-2">
            <button
              type="button"
              onclick="closeAuth()"
              class="text-slate-500 text-sm hover:text-slate-300 transition-colors"
            >
              ${t('continueWithoutAccount')}
            </button>
          </div>
        </div>

        <!-- Admin auto-detected by email, no demo button needed -->
      </div>
    </div>
  `
}

// Auth mode state (kept for backward compat with inline handlers in other modals)
window.authMode = 'login'

window.setAuthMode = (mode) => {
  import('../../stores/state.js').then(({ setState }) => {
    setState({ authMode: mode })
  })
}

window.handleAuth = async (event) => {
  event.preventDefault()

  const email = document.getElementById('auth-email')?.value.trim()
  const password = document.getElementById('auth-password')?.value
  const submitBtn = document.getElementById('auth-submit-btn')
  const errorDiv = document.getElementById('auth-error-msg')
  const { icon: iconFn } = await import('../../utils/icons.js')

  if (!email || !password) return

  // Hide previous errors
  if (errorDiv) {
    errorDiv.classList.add('hidden')
    errorDiv.textContent = ''
  }

  // Show loading
  if (submitBtn) {
    submitBtn.disabled = true
    submitBtn.innerHTML = iconFn('loader-circle', 'w-5 h-5 animate-spin')
  }

  try {
    const fb = await import('../../services/firebase.js')
    const { showSuccess, showError } = await import('../../services/notifications.js')
    const { setState, getState } = await import('../../stores/state.js')

    fb.initializeFirebase()

    let result
    const { authMode } = getState()

    if (authMode === 'register') {
      const confirmPassword = document.getElementById('auth-password-confirm')?.value
      const username = document.getElementById('auth-username')?.value.trim() || 'Hitchhiker'

      if (password !== confirmPassword) {
        if (errorDiv) {
          errorDiv.textContent = t('passwordMismatch')
          errorDiv.classList.remove('hidden')
        }
        return
      }

      result = await fb.signUp(email, password, username)
    } else {
      result = await fb.signIn(email, password)
    }

    if (result.success) {
      const user = result.user
      // Create/update Firestore profile
      await fb.createOrUpdateUserProfile(user)
      // Hydrate localStorage with Firestore profile data
      fb.hydrateLocalProfileFromFirestore(user.uid).catch(() => {})

      // Set full user state directly (onAuthStateChanged listener in main.js
      // will also fire, but we set state here for immediate UI feedback)
      const ADMIN_EMAILS = ['antoine.v.ville@gmail.com']
      const { actions: stateActions } = await import('../../stores/state.js')
      stateActions.setUser(user)

      showSuccess(authMode === 'register' ? (t('accountCreated') || 'Account created!') : (t('loginSuccess') || 'Login successful!'))

      // Execute pending action if any
      const { authPendingAction } = getState()
      setState({
        showAuth: false,
        authPendingAction: null,
        showAuthReason: null,
        currentUser: user,
        isAdmin: ADMIN_EMAILS.includes(user.email?.toLowerCase()),
        userProfile: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
      })
      if (authPendingAction) {
        executePendingAction(authPendingAction)
      }
    } else {
      const msg = getAuthErrorMessage(result.error)
      if (errorDiv) {
        errorDiv.textContent = msg
        errorDiv.classList.remove('hidden')
      }
      showError(msg)
    }
  } catch (error) {
    console.error('Auth error:', error)
    const { showError } = await import('../../services/notifications.js')
    showError(t('authError'))
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false
      const { getState } = await import('../../stores/state.js')
      const { authMode } = getState()
      submitBtn.innerHTML = `<span id="auth-submit-text">${authMode === 'register' ? t('signUpButton') : t('signInButton')}</span>`
    }
  }
}

window.handleGoogleSignIn = async () => {
  // Google Sign-In via POPUP — instant, no page reload
  const btn = document.getElementById('auth-google-btn')
  try {
    const fb = await import('../../services/firebase.js')
    const { getState, setState } = await import('../../stores/state.js')

    fb.initializeFirebase()

    // Show loading state
    if (btn) {
      btn.disabled = true
      btn.style.opacity = '0.6'
      btn.textContent = t('loading') || 'Connexion...'
    }

    const result = await fb.signInWithGoogle()

    if (result?.success && result.user) {
      const user = result.user
      await fb.createOrUpdateUserProfile(user).catch(() => {})
      fb.hydrateLocalProfileFromFirestore(user.uid).catch(() => {})
      const ADMIN_EMAILS = ['antoine.v.ville@gmail.com']
      setState({
        showAuth: false,
        authPendingAction: null,
        showAuthReason: null,
        currentUser: user,
        isAdmin: ADMIN_EMAILS.includes(user.email?.toLowerCase()),
        userProfile: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
      })
      const { showToast } = await import('../../services/notifications.js')
      showToast(t('googleLoginSuccess') || 'Connexion réussie !', 'success')

      // Execute pending action
      const { authPendingAction } = getState()
      if (authPendingAction === 'addSpot') setTimeout(() => window.openAddSpot?.(), 300)
      else if (authPendingAction === 'sos') setTimeout(() => window.openSOS?.(), 300)
      else if (authPendingAction === 'companion') setTimeout(() => window.showCompanionModal?.(), 300)
      else if (authPendingAction === 'social') setTimeout(() => setState({ activeTab: 'social' }), 300)
      else if (authPendingAction === 'tripPlanner') setTimeout(() => window.openTripPlanner?.(), 300)
    } else if (result?.error === 'auth/popup-closed-by-user') {
      // User cancelled — restore button silently
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Continuer avec Google' }
    } else if (result?.error) {
      // Show error
      if (btn) { btn.disabled = false; btn.style.opacity = '1' }
      const { showError } = await import('../../services/notifications.js')
      showError(t('authError') || 'Erreur de connexion: ' + result.error)
    }
  } catch (error) {
    console.error('Google sign in error:', error)
    if (btn) { btn.disabled = false; btn.style.opacity = '1' }
    const { showError } = await import('../../services/notifications.js')
    showError(t('authError') || 'Erreur de connexion')
  }
}

// Apple Sign-In removed (requires $99/yr Apple Developer account)
// Facebook Sign-In hidden (requires Facebook Developer App setup)
// To re-enable: create Facebook App at developers.facebook.com, add App ID/Secret in Firebase Console

window.handleAppleSignIn = async () => {
  const { showError } = await import('../../services/notifications.js')
  showError(t('featureComingSoon') || 'Coming soon')
}

window.handleFacebookSignIn = async () => {
  const { showError } = await import('../../services/notifications.js')
  showError(t('featureComingSoon') || 'Coming soon')
}

window.handleForgotPassword = async () => {
  const email = document.getElementById('auth-email')?.value.trim()

  if (!email) {
    const { showError } = await import('../../services/notifications.js')
    showError(t('enterEmailFirst') || 'Enter your email first')
    return
  }

  try {
    const fb = await import('../../services/firebase.js')
    const { showSuccess, showError } = await import('../../services/notifications.js')

    fb.initializeFirebase()
    const result = await fb.resetPassword(email)

    if (result.success) {
      showSuccess(t('passwordResetSent'))
    } else {
      showError(getAuthErrorMessage(result.error))
    }
  } catch (error) {
    console.error('Password reset error:', error)
  }
}

/**
 * Login as admin without Firebase (demo mode)
 */
window.loginAsAdmin = async () => {
  try {
    const { setState, getState } = await import('../../stores/state.js')
    const { showSuccess } = await import('../../services/notifications.js')

    const { authPendingAction } = getState()

    setState({
      isLoggedIn: true,
      user: {
        uid: 'admin-demo-001',
        email: 'admin@spothitch.com',
        displayName: 'Admin SpotHitch',
        photoURL: null,
        isAdmin: true,
      },
      currentUser: {
        uid: 'admin-demo-001',
        email: 'admin@spothitch.com',
        displayName: 'Admin SpotHitch',
        photoURL: null,
      },
      userProfile: {
        uid: 'admin-demo-001',
        email: 'admin@spothitch.com',
        displayName: 'Admin SpotHitch',
        photoURL: null,
        verifiedPhone: null,
        verifiedIdentity: true,
        createdAt: new Date().toISOString(),
      },
      username: 'Admin',
      avatar: '👑',
      level: 99,
      points: 50000,
      seasonPoints: 10000,
      vipLevel: 'legend',
      checkins: 500,
      spotsCreated: 150,
      reviewsGiven: 300,
      totalDistance: 50000000,
      totalRides: 1000,
      visitedCountries: ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'PL', 'CZ', 'AT', 'CH', 'PT', 'IE'],
      badges: [
        'first-checkin', 'explorer-10', 'expert-50', 'master-100',
        'first-spot', 'cartographer-5', 'mapper-20',
        'first-review', 'critic-10', 'influencer-50',
        'night-owl', 'early-bird', 'globetrotter', 'legend'
      ],
      ownedRewards: ['avatar-legend', 'frame-gold', 'title-legend', 'feature-themes'],
      showAuth: false,
      showWelcome: false,
      authPendingAction: null,
      showAuthReason: null,
    })

    showSuccess(t('adminLoginSuccess') || "Logged in as Admin!")

    if (authPendingAction) {
      executePendingAction(authPendingAction)
    }
  } catch (error) {
    console.error('Admin login error:', error)
  }
}

/**
 * Execute a pending action after successful authentication
 * @param {string} actionName - Name of the action to execute
 */
function executePendingAction(actionName) {
  setTimeout(() => {
    const actionMap = {
      addSpot: () => window.openAddSpot?.(),
      validateSpot: () => window.openValidateSpot?.(),
      saveFavorite: () => {}, // handled by the calling code
      sos: () => window.openSOS?.(),
      companion: () => window.showCompanionModal?.(),
      social: () => {
        import('../../stores/state.js').then(({ setState }) => {
          setState({ activeTab: 'social' })
        })
      },
      tripPlanner: () => window.openTripPlanner?.(),
      checkin: () => {}, // handled by the calling code
    }
    const fn = actionMap[actionName]
    if (fn) fn()
  }, 300)
}

function getAuthErrorMessage(errorCode) {
  const messages = {
    'auth/email-already-in-use': t('emailInUse'),
    'auth/invalid-email': t('invalidEmail'),
    'auth/user-not-found': t('userNotFound'),
    'auth/wrong-password': t('wrongPassword'),
    'auth/weak-password': t('weakPassword'),
    'auth/invalid-credential': t('authErrorPassword'),
    'auth/too-many-requests': t('authErrorTooMany'),
    'auth/popup-closed-by-user': t('authErrorPopupClosed'),
  }
  return messages[errorCode] || t('authError')
}

/**
 * Progressive Auth Gate
 * If user is logged in, execute action immediately.
 * If not, show auth modal with a contextual reason, then execute after auth.
 * @param {string} actionName - e.g. 'addSpot', 'sos', 'companion'
 * @param {Function} [callback] - optional immediate callback if logged in
 */
export function requireAuth(actionName, callback) {
  import('../../stores/state.js').then(({ getState, setState }) => {
    const { isLoggedIn } = getState()

    if (isLoggedIn) {
      if (callback) callback()
      return
    }

    // Map action names to contextual reason messages
    const reasonMap = {
      addSpot: t('authRequiredAddSpot'),
      validateSpot: t('authRequiredAddSpot'),
      saveFavorite: t('authRequiredFavorite'),
      sos: t('authRequiredSOS'),
      companion: t('authRequiredCompanion'),
      social: t('authRequiredSocial'),
      tripPlanner: t('authRequiredSocial'),
      checkin: t('authRequiredAddSpot'),
    }

    setState({
      showAuth: true,
      authPendingAction: actionName,
      showAuthReason: reasonMap[actionName] || t('loginRequired'),
    })
  })
}

// requireAuth — canonical in main.js (synchronous return value needed by callers)

export default { renderAuth }
