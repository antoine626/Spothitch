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
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <!-- Modal -->
      <div 
        class="relative bg-dark-primary border border-white/10 rounded-3xl w-full max-w-md overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Close -->
        <button 
          onclick="closeAuth()"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="Fermer"
        >
          <i class="fas fa-times"></i>
        </button>
        
        <!-- Header -->
        <div class="p-6 text-center border-b border-white/10">
          <div class="text-4xl mb-2">🤙</div>
          <h2 class="text-2xl font-bold gradient-text">${t('appName')}</h2>
        </div>
        
        <!-- Tabs -->
        <div class="flex border-b border-white/10">
          <button 
            onclick="setAuthMode('login')"
            class="flex-1 py-3 text-center transition-colors auth-tab"
            data-mode="login"
            id="auth-tab-login"
          >
            ${t('login')}
          </button>
          <button 
            onclick="setAuthMode('register')"
            class="flex-1 py-3 text-center transition-colors auth-tab"
            data-mode="register"
            id="auth-tab-register"
          >
            ${t('register')}
          </button>
        </div>
        
        <!-- Form -->
        <div class="p-6">
          <form id="auth-form" onsubmit="handleAuth(event)" class="space-y-4">
            <!-- Email -->
            <div>
              <label class="text-sm text-slate-400 block mb-2">${t('email')}</label>
              <input 
                type="email"
                id="auth-email"
                class="input-modern"
                placeholder="email@exemple.com"
                required
              />
            </div>
            
            <!-- Password -->
            <div>
              <label class="text-sm text-slate-400 block mb-2">${t('password')}</label>
              <input 
                type="password"
                id="auth-password"
                class="input-modern"
                placeholder="••••••••"
                required
                minlength="6"
              />
            </div>
            
            <!-- Confirm Password (Register only) -->
            <div id="confirm-password-field" class="hidden">
              <label class="text-sm text-slate-400 block mb-2">${t('confirmPassword')}</label>
              <input 
                type="password"
                id="auth-password-confirm"
                class="input-modern"
                placeholder="••••••••"
                minlength="6"
              />
            </div>
            
            <!-- Username (Register only) -->
            <div id="username-field" class="hidden">
              <label class="text-sm text-slate-400 block mb-2">${t('yourUsername')}</label>
              <input 
                type="text"
                id="auth-username"
                class="input-modern"
                placeholder="MonPseudo"
                maxlength="20"
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
            <span class="text-slate-500 text-sm">ou</span>
            <div class="flex-1 h-px bg-white/10"></div>
          </div>
          
          <!-- Google Sign In -->
          <button 
            onclick="handleGoogleSignIn()"
            class="btn btn-ghost w-full"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="w-5 h-5" />
            ${t('continueWithGoogle')}
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
      showSuccess(window.authMode === 'register' ? 'Compte créé !' : 'Connecté !');
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
      showSuccess('Connecté avec Google !');
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
    showError('Entre ton email d\'abord');
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

export default { renderAuth };
