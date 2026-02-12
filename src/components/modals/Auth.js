/**
 * Auth Modal Component
 * Login and registration
 */

import { t } from '../../i18n/index.js';

export function renderAuth(_state) {
  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeAuth()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative modal-panel rounded-3xl w-full max-w-md overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Close -->
        <button
          onclick="closeAuth()"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="${t('close') || 'Close'}"
          type="button"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
        
        <!-- Header -->
        <div class="p-8 text-center border-b border-white/10">
          <div class="text-4xl mb-3" aria-hidden="true">🤙</div>
          <h2 id="auth-modal-title" class="text-2xl font-bold gradient-text">${t('appName')}</h2>
        </div>
        
        <!-- Tabs -->
        <div class="flex border-b border-white/10" role="tablist" aria-label="${t('authMode') || 'Authentication mode'}">
          <button
            onclick="setAuthMode('login')"
            class="flex-1 py-3 text-center transition-colors auth-tab"
            data-mode="login"
            id="auth-tab-login"
            role="tab"
            aria-selected="true"
            aria-controls="auth-form"
            type="button"
          >
            ${t('login')}
          </button>
          <button
            onclick="setAuthMode('register')"
            class="flex-1 py-3 text-center transition-colors auth-tab"
            data-mode="register"
            id="auth-tab-register"
            role="tab"
            aria-selected="false"
            aria-controls="auth-form"
            type="button"
          >
            ${t('register')}
          </button>
        </div>
        
        <!-- Form -->
        <div class="p-6" role="tabpanel" id="auth-form-panel">
          <form id="auth-form" onsubmit="handleAuth(event)" class="space-y-5" aria-label="${t('loginForm') || 'Login form'}">
            <!-- Email -->
            <div>
              <label for="auth-email" class="text-sm text-slate-400 block mb-2">${t('email')}</label>
              <input
                type="email"
                id="auth-email"
                name="email"
                class="input-modern"
                placeholder="email@exemple.com"
                required
                autocomplete="email"
                aria-required="true"
              />
            </div>

            <!-- Password -->
            <div>
              <label for="auth-password" class="text-sm text-slate-400 block mb-2">${t('password')}</label>
              <input
                type="password"
                id="auth-password"
                name="password"
                class="input-modern"
                placeholder="••••••••"
                required
                minlength="6"
                autocomplete="current-password"
                aria-required="true"
                aria-describedby="password-hint"
              />
              <span id="password-hint" class="sr-only">Minimum 6 caracteres</span>
            </div>

            <!-- Confirm Password (Register only) -->
            <div id="confirm-password-field" class="hidden">
              <label for="auth-password-confirm" class="text-sm text-slate-400 block mb-2">${t('confirmPassword')}</label>
              <input
                type="password"
                id="auth-password-confirm"
                name="password-confirm"
                class="input-modern"
                placeholder="••••••••"
                minlength="6"
                autocomplete="new-password"
              />
            </div>

            <!-- Username (Register only) -->
            <div id="username-field" class="hidden">
              <label for="auth-username" class="text-sm text-slate-400 block mb-2">${t('yourUsername')}</label>
              <input
                type="text"
                id="auth-username"
                name="username"
                class="input-modern"
                placeholder="MonPseudo"
                maxlength="20"
                autocomplete="username"
              />
            </div>
            
            <!-- Forgot Password -->
            <div id="forgot-password-link" class="text-right">
              <button 
                type="button"
                onclick="handleForgotPassword()"
                class="text-primary-400 text-sm hover:underline"
              >
                ${t('forgotPassword')}
              </button>
            </div>
            
            <!-- Submit -->
            <button 
              type="submit"
              class="btn btn-primary w-full"
              id="auth-submit-btn"
            >
              <span id="auth-submit-text">${t('login')}</span>
            </button>
          </form>
          
          <!-- Divider -->
          <div class="flex items-center gap-4 my-6">
            <div class="flex-1 h-px bg-white/10"></div>
            <span class="text-slate-500 text-sm">${t('orDivider') || 'or'}</span>
            <div class="flex-1 h-px bg-white/10"></div>
          </div>

          <!-- Google Sign In -->
          <button
            onclick="handleGoogleSignIn()"
            class="btn btn-ghost w-full"
            type="button"
            aria-label="${t('continueWithGoogle') || 'Sign in with Google'}"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" class="w-5 h-5" aria-hidden="true" />
            ${t('continueWithGoogle')}
          </button>

          <!-- Facebook Sign In -->
          <button
            onclick="handleFacebookSignIn()"
            class="btn btn-ghost w-full mt-3"
            type="button"
            aria-label="${t('continueWithFacebook') || 'Sign in with Facebook'}"
          >
            <i class="fab fa-facebook text-blue-500 text-lg" aria-hidden="true"></i>
            ${t('continueWithFacebook')}
          </button>

          <!-- Apple Sign In (coming soon) -->
          <button
            onclick="handleAppleLogin()"
            class="btn w-full mt-3 bg-black hover:bg-slate-900 text-white border border-white/20"
            type="button"
            aria-label="${t('continueWithApple') || 'Sign in with Apple'}"
          >
            <i class="fab fa-apple text-lg" aria-hidden="true"></i>
            ${t('continueWithApple')}
          </button>

          <!-- Demo Admin Login -->
          <button
            onclick="loginAsAdmin()"
            class="btn w-full mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            type="button"
            aria-label="${t('demoAdminLogin') || 'Demo admin login'}"
          >
            <span class="mr-2" aria-hidden="true">👑</span>
            ${t('demoAdminLogin') || 'Admin Mode (Demo)'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Auth mode state
window.authMode = 'login';

window.setAuthMode = (mode) => {
  window.authMode = mode;

  // Update tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle('text-primary-400', isActive);
    tab.classList.toggle('border-b-2', isActive);
    tab.classList.toggle('border-primary-400', isActive);
    tab.classList.toggle('text-slate-400', !isActive);
  });

  // Show/hide fields
  const confirmField = document.getElementById('confirm-password-field');
  const usernameField = document.getElementById('username-field');
  const forgotLink = document.getElementById('forgot-password-link');
  const submitText = document.getElementById('auth-submit-text');

  if (mode === 'register') {
    confirmField?.classList.remove('hidden');
    usernameField?.classList.remove('hidden');
    forgotLink?.classList.add('hidden');
    if (submitText) submitText.textContent = t('createAccount');
  } else {
    confirmField?.classList.add('hidden');
    usernameField?.classList.add('hidden');
    forgotLink?.classList.remove('hidden');
    if (submitText) submitText.textContent = t('login');
  }
};

window.handleAuth = async (event) => {
  event.preventDefault();

  const email = document.getElementById('auth-email')?.value.trim();
  const password = document.getElementById('auth-password')?.value;
  const submitBtn = document.getElementById('auth-submit-btn');

  if (!email || !password) return;

  // Disable button
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }

  try {
    const { signIn, signUp } = await import('../../services/firebase.js');
    const { showSuccess, showError } = await import('../../services/notifications.js');
    const { setState } = await import('../../stores/state.js');

    let result;

    if (window.authMode === 'register') {
      const confirmPassword = document.getElementById('auth-password-confirm')?.value;
      const username = document.getElementById('auth-username')?.value.trim() || 'Voyageur';

      if (password !== confirmPassword) {
        showError(t('passwordMismatch'));
        return;
      }

      result = await signUp(email, password, username);
    } else {
      result = await signIn(email, password);
    }

    if (result.success) {
      showSuccess(window.authMode === 'register' ? (t('accountCreated') || 'Compte créé !') : (t('loginSuccess') || 'Connecté !'));
      setState({ showAuth: false });
    } else {
      showError(getAuthErrorMessage(result.error));
    }
  } catch (error) {
    console.error('Auth error:', error);
    const { showError } = await import('../../services/notifications.js');
    showError(t('authError'));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span id="auth-submit-text">${window.authMode === 'register' ? t('createAccount') : t('login')}</span>`;
    }
  }
};

window.handleGoogleSignIn = async () => {
  try {
    const { signInWithGoogle } = await import('../../services/firebase.js');
    const { showSuccess, showError } = await import('../../services/notifications.js');
    const { setState } = await import('../../stores/state.js');

    const result = await signInWithGoogle();

    if (result.success) {
      showSuccess(t('googleLoginSuccess') || 'Connecté avec Google !');
      setState({ showAuth: false });
    } else {
      showError(t('authError'));
    }
  } catch (error) {
    console.error('Google sign in error:', error);
  }
};

window.handleForgotPassword = async () => {
  const email = document.getElementById('auth-email')?.value.trim();

  if (!email) {
    const { showError } = await import('../../services/notifications.js');
    showError(t('enterEmailFirst') || "Entre ton email d'abord");
    return;
  }

  try {
    const { resetPassword } = await import('../../services/firebase.js');
    const { showSuccess, showError } = await import('../../services/notifications.js');

    const result = await resetPassword(email);

    if (result.success) {
      showSuccess(t('passwordResetSent'));
    } else {
      showError(getAuthErrorMessage(result.error));
    }
  } catch (error) {
    console.error('Password reset error:', error);
  }
};

function getAuthErrorMessage(errorCode) {
  const messages = {
    'auth/email-already-in-use': t('emailInUse'),
    'auth/invalid-email': t('invalidEmail'),
    'auth/user-not-found': t('userNotFound'),
    'auth/wrong-password': t('wrongPassword'),
    'auth/weak-password': t('weakPassword'),
  };
  return messages[errorCode] || t('authError');
}

/**
 * Login as admin without Firebase (demo mode)
 */
window.loginAsAdmin = async () => {
  try {
    const { setState } = await import('../../stores/state.js');
    const { showSuccess } = await import('../../services/notifications.js');

    // Set admin user state
    setState({
      isLoggedIn: true,
      user: {
        uid: 'admin-demo-001',
        email: 'admin@spothitch.com',
        displayName: 'Admin SpotHitch',
        photoURL: null,
        isAdmin: true,
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
    });

    showSuccess(t('adminLoginSuccess') || "Connecté en tant qu'Admin !");

  } catch (error) {
    console.error('Admin login error:', error);
  }
};

export default { renderAuth };
