/**
 * Email Verification Modal Component
 * Mandatory email verification after registration
 * Allows user to verify email and resend verification email with cooldown
 */

import { t } from '../../i18n/index.js';

// State for email verification modal
window.emailVerificationState = {
  email: null,
  isVerified: false,
  resendCooldown: 0,
  checkingEmail: false,
  cooldownInterval: null
};

/**
 * Render email verification modal
 * @param {string} email - User's email address
 * @returns {string} HTML for email verification modal
 */
export function renderEmailVerification(email) {
  if (!email) return '';

  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      id="email-verification-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-verification-title"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative modal-panel rounded-3xl w-full max-w-md overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Close Button -->
        <button
          onclick="closeEmailVerification()"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="${t('close') || 'Close'}"
          type="button"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>

        <!-- Header -->
        <div class="p-8 text-center border-b border-white/10">
          <div class="text-5xl mb-4 animate-bounce-slow" aria-hidden="true">📧</div>
          <h2 id="email-verification-title" class="text-2xl font-bold gradient-text mb-2">
            ${t('emailVerificationTitle')}
          </h2>
          <p class="text-slate-400 text-sm">
            ${t('emailVerificationSubtitle')}
          </p>
        </div>

        <!-- Content -->
        <div class="p-8 space-y-6">
          <!-- Email Display -->
          <div class="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p class="text-slate-400 text-sm mb-2">${t('emailVerificationMessage')}</p>
            <p class="text-white font-mono text-lg break-all">${email}</p>
          </div>

          <!-- Status Message -->
          <div
            id="verification-status"
            class="text-center text-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            <p class="text-slate-400">
              ${t('emailVerificationPending')}
            </p>
          </div>

          <!-- Buttons -->
          <div class="space-y-3">
            <!-- Verify Button -->
            <button
              type="button"
              onclick="checkEmailVerified()"
              class="btn btn-primary w-full"
              id="verify-btn"
              aria-label="${t('verifyEmail') || 'Check email verification'}"
            >
              <span id="verify-btn-text">${t('verifyEmail')}</span>
            </button>

            <!-- Resend Button -->
            <button
              type="button"
              onclick="resendVerificationEmail()"
              class="btn btn-ghost w-full"
              id="resend-btn"
              aria-label="${t('resendEmail') || 'Resend verification email'}"
            >
              <span id="resend-btn-text">${t('resendEmail')}</span>
            </button>
          </div>

          <!-- Help Text -->
          <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center text-sm text-slate-300">
            <p class="mb-2">💡 ${t('emailVerificationMessage')} <strong>${email}</strong></p>
            <p>${t('emailVerificationSubtitle')}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize email verification modal
 * @param {string} email - User's email address
 */
window.initEmailVerification = (email) => {
  if (!email) return;

  window.emailVerificationState.email = email;
  window.emailVerificationState.isVerified = false;
  window.emailVerificationState.resendCooldown = 60;

  // Start cooldown
  startResendCooldown();

  // Show modal by adding to DOM if not already present
  const modalContainer = document.getElementById('modal-container');
  if (modalContainer && !document.getElementById('email-verification-modal')) {
    modalContainer.innerHTML = renderEmailVerification(email);
  }
};

/**
 * Check if email has been verified
 */
window.checkEmailVerified = async () => {
  const verifyBtn = document.getElementById('verify-btn');
  const verifyBtnText = document.getElementById('verify-btn-text');
  const statusEl = document.getElementById('verification-status');

  if (!verifyBtn || window.emailVerificationState.checkingEmail) return;

  try {
    window.emailVerificationState.checkingEmail = true;
    verifyBtn.disabled = true;
    if (verifyBtnText) verifyBtnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const { getCurrentUser } = await import('../../services/firebase.js');
    const { showSuccess, showError } = await import('../../services/notifications.js');

    const user = getCurrentUser();

    if (!user) {
      showError(t('emailVerificationError'));
      return;
    }

    // Reload user to get latest email verification status
    await user.reload();

    if (user.emailVerified) {
      window.emailVerificationState.isVerified = true;

      if (statusEl) {
        statusEl.innerHTML = `
          <div class="text-green-400 flex items-center justify-center gap-2">
            <i class="fas fa-check-circle" aria-hidden="true"></i>
            <span>${t('emailVerified')}</span>
          </div>
        `;
      }

      showSuccess(t('emailVerified'));

      // Close modal after success
      setTimeout(() => {
        window.closeEmailVerification();
      }, 2000);
    } else {
      if (statusEl) {
        statusEl.innerHTML = `
          <p class="text-yellow-400">
            <i class="fas fa-info-circle" aria-hidden="true"></i>
            ${t('emailVerificationPending')}
          </p>
        `;
      }
      showError(t('emailNotVerified'));
    }
  } catch (error) {
    console.error('Email verification check error:', error);
    const { showError } = await import('../../services/notifications.js');
    showError(t('emailVerificationError'));
  } finally {
    window.emailVerificationState.checkingEmail = false;
    verifyBtn.disabled = false;
    if (verifyBtnText) verifyBtnText.textContent = t('verifyEmail');
  }
};

/**
 * Resend verification email
 */
window.resendVerificationEmail = async () => {
  const resendBtn = document.getElementById('resend-btn');
  const resendBtnText = document.getElementById('resend-btn-text');

  if (!resendBtn || window.emailVerificationState.resendCooldown > 0) return;

  try {
    resendBtn.disabled = true;
    if (resendBtnText) resendBtnText.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const { getCurrentUser } = await import('../../services/firebase.js');
    const { showSuccess, showError } = await import('../../services/notifications.js');

    const user = getCurrentUser();

    if (!user) {
      showError(t('emailVerificationError'));
      return;
    }

    // Import sendEmailVerification from Firebase
    const { sendEmailVerification } = await import('firebase/auth');

    // Send verification email
    await sendEmailVerification(user);

    showSuccess(t('verificationEmailSent'));

    // Start cooldown timer
    window.emailVerificationState.resendCooldown = 60;
    startResendCooldown();
  } catch (error) {
    console.error('Resend verification email error:', error);
    const { showError } = await import('../../services/notifications.js');

    const errorMessages = {
      'auth/too-many-requests': t('authTooManyRequests') || 'Trop de tentatives. Réessaie plus tard.',
      'auth/user-not-found': t('emailVerificationError'),
      'auth/invalid-user': t('emailVerificationError'),
    };

    showError(errorMessages[error.code] || t('verificationEmailNotSent'));
  } finally {
    resendBtn.disabled = false;
    if (resendBtnText) resendBtnText.textContent = t('resendEmail');
  }
};

/**
 * Start resend cooldown timer (60 seconds)
 */
function startResendCooldown() {
  const resendBtn = document.getElementById('resend-btn');
  const resendBtnText = document.getElementById('resend-btn-text');

  if (!resendBtn) return;

  // Clear existing interval
  if (window.emailVerificationState.cooldownInterval) {
    clearInterval(window.emailVerificationState.cooldownInterval);
  }

  resendBtn.disabled = true;
  resendBtn.classList.add('opacity-50', 'cursor-not-allowed');

  const updateCountdown = () => {
    if (window.emailVerificationState.resendCooldown > 0) {
      if (resendBtnText) {
        resendBtnText.textContent = t('resendCountdown')
          .replace('{seconds}', window.emailVerificationState.resendCooldown);
      }
      window.emailVerificationState.resendCooldown--;
    } else {
      // Cooldown finished
      if (window.emailVerificationState.cooldownInterval) {
        clearInterval(window.emailVerificationState.cooldownInterval);
      }
      resendBtn.disabled = false;
      resendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      if (resendBtnText) resendBtnText.textContent = t('resendEmail');
    }
  };

  // Update immediately
  updateCountdown();

  // Then update every second
  window.emailVerificationState.cooldownInterval = setInterval(updateCountdown, 1000);
}

/**
 * Close email verification modal
 */
window.closeEmailVerification = () => {
  const modal = document.getElementById('email-verification-modal');
  if (modal) {
    modal.classList.add('fade-out');
    setTimeout(() => {
      modal.remove();
      // Clear cooldown interval
      if (window.emailVerificationState.cooldownInterval) {
        clearInterval(window.emailVerificationState.cooldownInterval);
      }
    }, 300);
  }
};

export default {
  renderEmailVerification,
  initEmailVerification: window.initEmailVerification,
  checkEmailVerified: window.checkEmailVerified,
  resendVerificationEmail: window.resendVerificationEmail,
  closeEmailVerification: window.closeEmailVerification,
};
