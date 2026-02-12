/**
 * Age Verification Modal Component
 * RGPD/GDPR compliance - ensures users are at least 16 years old
 * Displays during registration process
 */

import { t } from '../../i18n/index.js';
import { recordAgeVerification } from '../../services/consentHistory.js';

// Configuration
const MINIMUM_AGE = 16;
const MAX_AGE = 120;

/**
 * Calculate age from birth date
 * @param {Date|string} birthDate - The user's birth date
 * @returns {number} Age in years
 */
export function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Validate birth date
 * @param {string} birthDate - Birth date string (YYYY-MM-DD)
 * @returns {Object} Validation result { isValid, age, message }
 */
export function validateBirthDate(birthDate) {
  if (!birthDate) {
    return { isValid: false, age: null, message: t('ageRequiredMessage') };
  }

  const birth = new Date(birthDate);

  // Check if date is valid
  if (isNaN(birth.getTime())) {
    return { isValid: false, age: null, message: t('ageInvalidFormat') };
  }

  // Check if date is in the future
  const today = new Date();
  if (birth > today) {
    return { isValid: false, age: null, message: t('ageFutureDate') };
  }

  // Check if age is within reasonable bounds
  const age = calculateAge(birth);
  if (age < 0 || age > MAX_AGE) {
    return { isValid: false, age: null, message: t('ageUnreasonable') };
  }

  // Check if user meets minimum age requirement
  if (age < MINIMUM_AGE) {
    return {
      isValid: false,
      age,
      message: t('ageTooYoung'),
      tooYoung: true,
    };
  }

  return { isValid: true, age, message: null };
}

/**
 * Render the age verification modal
 * @param {Object} state - Application state
 * @returns {string} HTML string
 */
export function renderAgeVerification(state) {
  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-verification-title"
      aria-describedby="age-verification-desc"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative modal-panel rounded-3xl w-full max-w-md overflow-hidden scale-in"
        onclick="event.stopPropagation()"
      >
        <!-- Header -->
        <div class="p-6 text-center border-b border-white/10">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <i class="fas fa-birthday-cake text-3xl text-white" aria-hidden="true"></i>
          </div>
          <h2 id="age-verification-title" class="text-2xl font-bold text-white">
            ${t('ageVerificationTitle')}
          </h2>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <p id="age-verification-desc" class="text-slate-400 text-center">
            ${t('ageVerificationDesc')}
          </p>

          <!-- Important note -->
          <div class="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <i class="fas fa-info-circle text-blue-400 mt-1 flex-shrink-0" aria-hidden="true"></i>
            <p class="text-blue-300 text-sm">
              ${t('ageVerificationNote')}
            </p>
          </div>

          <!-- Form -->
          <form id="age-verification-form" onsubmit="handleAgeVerification(event)" class="space-y-4" aria-label="${t('ageVerificationForm') || 'Age verification form'}">
            <div>
              <label for="birth-date" class="text-sm text-slate-400 block mb-2">
                ${t('birthDate')}
              </label>
              <input
                type="date"
                id="birth-date"
                name="birthDate"
                class="input-modern w-full"
                required
                aria-required="true"
                aria-describedby="birth-date-hint"
                max=""
              />
              <span id="birth-date-hint" class="sr-only">Format: JJ/MM/AAAA</span>
            </div>

            <!-- Error message (hidden by default) -->
            <div
              id="age-error-message"
              class="hidden flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              role="alert"
            >
              <i class="fas fa-exclamation-circle text-red-400 mt-1 flex-shrink-0" aria-hidden="true"></i>
              <div>
                <p id="age-error-text" class="text-red-300 text-sm"></p>
              </div>
            </div>

            <!-- Age display (hidden by default) -->
            <div id="age-display" class="hidden text-center p-4 bg-white/5 rounded-xl">
              <p class="text-slate-400 text-sm">${t('yourAge')}:</p>
              <p id="age-value" class="text-3xl font-bold gradient-text"></p>
            </div>

            <!-- Submit button -->
            <button
              type="submit"
              class="btn btn-primary w-full"
              id="age-submit-btn"
            >
              <i class="fas fa-check mr-2" aria-hidden="true"></i>
              ${t('ageVerify')}
            </button>
          </form>

          <!-- Too young message (hidden by default) -->
          <div id="too-young-message" class="hidden space-y-4">
            <div class="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <i class="fas fa-heart text-orange-400 mt-1 flex-shrink-0" aria-hidden="true"></i>
              <div>
                <p class="text-orange-300 text-sm font-medium">${t('ageTooYoungTitle')}</p>
                <p class="text-orange-200 text-xs mt-1">${t('ageTooYoungMessage')}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer with GDPR note -->
        <div class="p-4 bg-white/5 border-t border-white/10 text-center">
          <p class="text-xs text-slate-500">
            ${t('ageGDPRNote')}
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Handle age verification form submission
 */
window.handleAgeVerification = async (event) => {
  event.preventDefault();

  const birthDateInput = document.getElementById('birth-date');
  const errorMessage = document.getElementById('age-error-message');
  const errorText = document.getElementById('age-error-text');
  const ageDisplay = document.getElementById('age-display');
  const ageValue = document.getElementById('age-value');
  const submitBtn = document.getElementById('age-submit-btn');
  const tooYoungMessage = document.getElementById('too-young-message');
  const form = document.getElementById('age-verification-form');

  if (!birthDateInput || !birthDateInput.value) {
    showAgeError(t('ageRequiredMessage'));
    return;
  }

  // Validate birth date
  const validation = validateBirthDate(birthDateInput.value);

  if (!validation.isValid) {
    // Hide age display and form if validation fails
    ageDisplay.classList.add('hidden');

    if (validation.tooYoung) {
      // User is too young - show special message
      form.classList.add('hidden');
      tooYoungMessage.classList.remove('hidden');
      errorMessage.classList.add('hidden');
    } else {
      // Show error message
      showAgeError(validation.message);
      form.classList.remove('hidden');
      tooYoungMessage.classList.add('hidden');
    }
    return;
  }

  // Age is valid - show age display and prepare to proceed
  form.classList.remove('hidden');
  tooYoungMessage.classList.add('hidden');
  errorMessage.classList.add('hidden');
  ageDisplay.classList.remove('hidden');
  ageValue.textContent = validation.age;

  // Disable submit button during processing
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + t('ageVerifying');
  }

  try {
    const { setState } = await import('../../stores/state.js');
    const { showSuccess, showError } = await import('../../services/notifications.js');

    // Record age verification in consent history
    const success = recordAgeVerification({
      birthDate: birthDateInput.value,
      age: validation.age,
      isValid: true,
      country: 'EU', // Could be extended for different regions
    });

    if (success) {
      showSuccess(t('ageVerificationSuccess'));

      // Hide modal and update state
      setState({
        showAgeVerification: false,
        ageVerified: true,
        userAge: validation.age,
      });
    } else {
      showError(t('ageVerificationError'));
    }
  } catch (error) {
    console.error('Age verification error:', error);
    const { showError } = await import('../../services/notifications.js');
    showError(t('ageVerificationError'));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-check mr-2" aria-hidden="true"></i>' + t('ageVerify');
    }
  }
};

/**
 * Show age verification error
 * @param {string} message - Error message
 */
function showAgeError(message) {
  const errorMessage = document.getElementById('age-error-message');
  const errorText = document.getElementById('age-error-text');
  const ageDisplay = document.getElementById('age-display');

  if (errorMessage && errorText) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    ageDisplay.classList.add('hidden');
  }
}

/**
 * Initialize age verification modal
 * Set max date to today
 */
export function initAgeVerification() {
  const birthDateInput = document.getElementById('birth-date');
  if (birthDateInput) {
    // Set max date to today
    const today = new Date().toISOString().split('T')[0];
    birthDateInput.max = today;

    // Set reasonable default max date (18 years ago)
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    birthDateInput.value = eighteenYearsAgo.toISOString().split('T')[0];
  }

  // Handle real-time validation on input change
  birthDateInput?.addEventListener('change', () => {
    const validation = validateBirthDate(birthDateInput.value);

    if (!validation.isValid) {
      showAgeError(validation.message);
      document.getElementById('age-display').classList.add('hidden');
    } else {
      document.getElementById('age-error-message').classList.add('hidden');
      document.getElementById('age-display').classList.remove('hidden');
      document.getElementById('age-value').textContent = validation.age;
    }
  });
}

// Export functions for testing and external use
export { MINIMUM_AGE };
export default {
  renderAgeVerification,
  validateBirthDate,
  calculateAge,
  initAgeVerification,
  MINIMUM_AGE,
};
