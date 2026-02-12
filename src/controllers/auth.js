/**
 * Authentication Controllers
 * Handles login, registration, and auth state
 */

import { setState, getState } from '../stores/state.js';
import { signIn, signUp, signInWithGoogle, logOut, resetPassword } from '../services/firebase.js';
import { showToast } from '../services/notifications.js';
import { t } from '../i18n/index.js';
import { icon } from '../utils/icons.js'

// Current auth mode
let authMode = 'login';

/**
 * Open auth modal
 */
export function openAuth() {
  setState({ showAuth: true });
}

/**
 * Close auth modal
 */
export function closeAuth() {
  setState({ showAuth: false });
}

/**
 * Set auth mode (login or register)
 */
export function setAuthMode(mode) {
  authMode = mode;
  window.authMode = mode;

  // Update UI
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(tab => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle('text-primary-400', isActive);
    tab.classList.toggle('border-b-2', isActive);
    tab.classList.toggle('border-primary-400', isActive);
    tab.classList.toggle('text-slate-400', !isActive);
    tab.setAttribute('aria-selected', isActive);
  });

  // Show/hide register fields
  const registerFields = document.getElementById('register-fields');
  if (registerFields) {
    registerFields.style.display = mode === 'register' ? 'block' : 'none';
  }

  // Update submit button
  const submitText = document.getElementById('auth-submit-text');
  if (submitText) {
    submitText.textContent = mode === 'register' ? t('createAccount') : t('login');
  }
}

/**
 * Handle auth form submit
 */
export async function handleAuth(event) {
  event.preventDefault();

  const email = document.getElementById('auth-email')?.value.trim();
  const password = document.getElementById('auth-password')?.value;
  const submitBtn = document.getElementById('auth-submit-btn');

  if (!email || !password) return;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = icon('spinner', 'w-5 h-5 animate-spin');
  }

  try {
    let result;

    if (authMode === 'register') {
      const confirmPassword = document.getElementById('auth-password-confirm')?.value;
      const username = document.getElementById('auth-username')?.value.trim() || 'Voyageur';

      if (password !== confirmPassword) {
        showToast(t('passwordMismatch'), 'error');
        return;
      }

      result = await signUp(email, password, username);
    } else {
      result = await signIn(email, password);
    }

    if (result.success) {
      showToast(authMode === 'register' ? (t('accountCreated') || 'Compte créé !') : (t('loggedIn') || 'Connecté !'), 'success');
      setState({ showAuth: false });
    } else {
      showToast(getAuthErrorMessage(result.error), 'error');
    }
  } catch (error) {
    console.error('Auth error:', error);
    showToast(t('authError'), 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span id="auth-submit-text">${authMode === 'register' ? t('createAccount') : t('login')}</span>`;
    }
  }
}

/**
 * Handle Google sign in
 */
export async function handleGoogleSignIn() {
  try {
    const result = await signInWithGoogle();

    if (result.success) {
      showToast(t('loggedInWithGoogle') || 'Connecté avec Google !', 'success');
      setState({ showAuth: false });
    } else {
      showToast(t('authError'), 'error');
    }
  } catch (error) {
    console.error('Google sign in error:', error);
  }
}

/**
 * Handle forgot password
 */
export async function handleForgotPassword() {
  const email = document.getElementById('auth-email')?.value.trim();

  if (!email) {
    showToast(t('enterEmailFirst') || 'Entre ton email d\'abord', 'error');
    return;
  }

  try {
    const result = await resetPassword(email);

    if (result.success) {
      showToast(t('passwordResetSent'), 'success');
    } else {
      showToast(getAuthErrorMessage(result.error), 'error');
    }
  } catch (error) {
    console.error('Password reset error:', error);
  }
}

/**
 * Handle logout
 */
export async function handleLogout() {
  try {
    await logOut();
    showToast(t('loggedOut') || 'Déconnecté', 'success');
    setState({ showSettings: false });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Get user-friendly auth error message
 */
function getAuthErrorMessage(error) {
  const errorMessages = {
    'auth/user-not-found': t('authUserNotFound') || 'Utilisateur non trouvé',
    'auth/wrong-password': t('authWrongPassword') || 'Mot de passe incorrect',
    'auth/email-already-in-use': t('authEmailInUse') || 'Email déjà utilisé',
    'auth/weak-password': t('authWeakPassword') || 'Mot de passe trop faible',
    'auth/invalid-email': t('authInvalidEmail') || 'Email invalide',
    'auth/too-many-requests': t('authTooManyRequests') || 'Trop de tentatives, réessaie plus tard',
  };
  return errorMessages[error?.code] || t('authError');
}

// Register global handlers
export function registerAuthHandlers() {
  window.openAuth = openAuth;
  window.closeAuth = closeAuth;
  window.setAuthMode = setAuthMode;
  window.handleAuth = handleAuth;
  window.handleGoogleSignIn = handleGoogleSignIn;
  window.handleForgotPassword = handleForgotPassword;
  window.handleLogout = handleLogout;
  window.authMode = authMode;
}

export default {
  openAuth,
  closeAuth,
  setAuthMode,
  handleAuth,
  handleGoogleSignIn,
  handleForgotPassword,
  handleLogout,
  registerAuthHandlers,
};
