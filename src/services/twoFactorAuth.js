/**
 * Two-Factor Authentication (2FA) Service
 * Handles SMS/email verification codes for sensitive actions
 *
 * Requirements:
 * - Mandatory at first signup (email verification)
 * - Optional for users who want extra security
 * - Mandatory for sensitive actions (delete account, change email)
 */

import { getState, setState } from '../stores/state.js'
import { showToast } from '../services/notifications.js'

// Storage keys
const STORAGE_KEY_2FA_ENABLED = 'spothitch_2fa_enabled'
const STORAGE_KEY_2FA_METHOD = 'spothitch_2fa_method'
const STORAGE_KEY_PENDING_CODE = 'spothitch_pending_2fa_code'
const STORAGE_KEY_CODE_EXPIRY = 'spothitch_2fa_code_expiry'
const STORAGE_KEY_VERIFIED_PHONE = 'spothitch_verified_phone'

// Constants
export const CODE_LENGTH = 6
export const CODE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
export const MAX_VERIFICATION_ATTEMPTS = 5
export const RESEND_COOLDOWN_MS = 60 * 1000 // 60 seconds

// 2FA Methods
export const TwoFactorMethod = {
  EMAIL: 'email',
  SMS: 'sms',
  NONE: 'none'
}

// Sensitive actions that require 2FA
export const SensitiveAction = {
  DELETE_ACCOUNT: 'delete_account',
  CHANGE_EMAIL: 'change_email',
  CHANGE_PASSWORD: 'change_password',
  CHANGE_PHONE: 'change_phone',
  DISABLE_2FA: 'disable_2fa',
  EXPORT_DATA: 'export_data'
}

// State for current verification session
let verificationState = {
  pendingCode: null,
  codeExpiry: null,
  attempts: 0,
  lastResendTime: null,
  pendingAction: null,
  targetEmail: null,
  targetPhone: null,
  verificationMethod: null
}

/**
 * Generate a random 6-digit code
 * @returns {string} 6-digit code
 */
export function generateVerificationCode() {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  return code
}

/**
 * Check if 2FA is enabled for the current user
 * @returns {boolean}
 */
export function is2FAEnabled() {
  try {
    const enabled = localStorage.getItem(STORAGE_KEY_2FA_ENABLED)
    return enabled === 'true'
  } catch (e) {
    console.warn('[2FA] Error reading 2FA status:', e)
    return false
  }
}

/**
 * Get the 2FA method for the current user
 * @returns {string} TwoFactorMethod value
 */
export function get2FAMethod() {
  try {
    const method = localStorage.getItem(STORAGE_KEY_2FA_METHOD)
    return method || TwoFactorMethod.NONE
  } catch (e) {
    console.warn('[2FA] Error reading 2FA method:', e)
    return TwoFactorMethod.NONE
  }
}

/**
 * Check if an action requires 2FA verification
 * @param {string} action - SensitiveAction value
 * @returns {boolean}
 */
export function requiresTwoFactor(action) {
  // These actions always require 2FA if user is logged in
  const alwaysRequire2FA = [
    SensitiveAction.DELETE_ACCOUNT,
    SensitiveAction.CHANGE_EMAIL,
    SensitiveAction.DISABLE_2FA
  ]

  if (alwaysRequire2FA.includes(action)) {
    return true
  }

  // For other actions, only require 2FA if user has enabled it
  if (is2FAEnabled()) {
    return [
      SensitiveAction.CHANGE_PASSWORD,
      SensitiveAction.CHANGE_PHONE,
      SensitiveAction.EXPORT_DATA
    ].includes(action)
  }

  return false
}

/**
 * Enable 2FA for the current user
 * @param {string} method - TwoFactorMethod value (email or sms)
 * @param {string} target - Email or phone number to verify
 * @returns {Object} { success, message, error }
 */
export async function enable2FA(method, target) {
  if (!method || method === TwoFactorMethod.NONE) {
    return { success: false, error: 'invalid_method', message: 'Methode 2FA invalide' }
  }

  if (!target) {
    return { success: false, error: 'invalid_target', message: method === TwoFactorMethod.EMAIL ? 'Email invalide' : 'Numero de telephone invalide' }
  }

  // Validate email format
  if (method === TwoFactorMethod.EMAIL) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(target)) {
      return { success: false, error: 'invalid_email', message: 'Format email invalide' }
    }
  }

  // Validate phone format (basic validation)
  if (method === TwoFactorMethod.SMS) {
    const phoneRegex = /^\+?[0-9]{8,15}$/
    if (!phoneRegex.test(target.replace(/[\s-]/g, ''))) {
      return { success: false, error: 'invalid_phone', message: 'Format telephone invalide' }
    }
  }

  // Start verification process
  const result = await startVerification(method, target, 'enable_2fa')

  if (result.success) {
    return {
      success: true,
      message: method === TwoFactorMethod.EMAIL
        ? 'Code de verification envoye par email'
        : 'Code de verification envoye par SMS'
    }
  }

  return result
}

/**
 * Disable 2FA for the current user (requires verification first)
 * @returns {Object} { success, message, error }
 */
export async function disable2FA() {
  if (!is2FAEnabled()) {
    return { success: false, error: 'not_enabled', message: '2FA n\'est pas active' }
  }

  // This will be called after verification is complete
  try {
    localStorage.removeItem(STORAGE_KEY_2FA_ENABLED)
    localStorage.removeItem(STORAGE_KEY_2FA_METHOD)

    showToast && showToast('2FA desactive avec succes', 'success')

    return { success: true, message: '2FA desactive avec succes' }
  } catch (e) {
    console.error('[2FA] Error disabling 2FA:', e)
    return { success: false, error: 'storage_error', message: 'Erreur lors de la desactivation' }
  }
}

/**
 * Start a verification process
 * @param {string} method - TwoFactorMethod value
 * @param {string} target - Email or phone
 * @param {string} action - Action requiring verification
 * @returns {Object} { success, code (only in dev), expiresAt }
 */
export async function startVerification(method, target, action) {
  // Check cooldown
  if (verificationState.lastResendTime) {
    const timeSinceLastSend = Date.now() - verificationState.lastResendTime
    if (timeSinceLastSend < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastSend) / 1000)
      return {
        success: false,
        error: 'cooldown',
        message: `Attendez ${remainingSeconds} secondes avant de renvoyer`,
        remainingSeconds
      }
    }
  }

  // Generate code
  const code = generateVerificationCode()
  const expiresAt = Date.now() + CODE_EXPIRY_MS

  // Store verification state
  verificationState = {
    pendingCode: code,
    codeExpiry: expiresAt,
    attempts: 0,
    lastResendTime: Date.now(),
    pendingAction: action,
    targetEmail: method === TwoFactorMethod.EMAIL ? target : null,
    targetPhone: method === TwoFactorMethod.SMS ? target : null,
    verificationMethod: method
  }

  // Persist to localStorage for recovery
  try {
    localStorage.setItem(STORAGE_KEY_PENDING_CODE, code)
    localStorage.setItem(STORAGE_KEY_CODE_EXPIRY, expiresAt.toString())
  } catch (e) {
    console.warn('[2FA] Error persisting code:', e)
  }

  // In production, this would send via Firebase/Twilio/etc.
  // For now, we'll simulate sending and log the code (dev only)
  console.log(`[2FA] Verification code for ${method}: ${code} (expires in 10 minutes)`)

  // Simulate sending (would be async API call in production)
  if (method === TwoFactorMethod.EMAIL) {
    // await sendEmailVerification(target, code)
    console.log(`[2FA] Email sent to ${target}`)
  } else if (method === TwoFactorMethod.SMS) {
    // await sendSMSVerification(target, code)
    console.log(`[2FA] SMS sent to ${target}`)
  }

  return {
    success: true,
    expiresAt,
    // Only include code in development mode for testing
    ...(import.meta.env?.DEV && { code })
  }
}

/**
 * Verify a code submitted by the user
 * @param {string} code - The 6-digit code
 * @returns {Object} { success, message, error }
 */
export function verifyCode(code) {
  // Check if there's a pending verification
  if (!verificationState.pendingCode) {
    return { success: false, error: 'no_pending', message: 'Aucune verification en cours' }
  }

  // Check if code has expired
  if (Date.now() > verificationState.codeExpiry) {
    clearVerificationState()
    return { success: false, error: 'expired', message: 'Code expire. Veuillez en demander un nouveau.' }
  }

  // Check max attempts
  if (verificationState.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    clearVerificationState()
    return { success: false, error: 'max_attempts', message: 'Trop de tentatives. Veuillez en demander un nouveau code.' }
  }

  // Increment attempts
  verificationState.attempts += 1

  // Validate code format
  if (!code || code.length !== CODE_LENGTH || !/^\d+$/.test(code)) {
    return {
      success: false,
      error: 'invalid_format',
      message: 'Code invalide. Le code doit contenir 6 chiffres.',
      attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - verificationState.attempts
    }
  }

  // Check code
  if (code !== verificationState.pendingCode) {
    return {
      success: false,
      error: 'invalid_code',
      message: 'Code incorrect',
      attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - verificationState.attempts
    }
  }

  // Code is valid!
  const action = verificationState.pendingAction
  const method = verificationState.verificationMethod

  // If this was for enabling 2FA, save the settings
  if (action === 'enable_2fa') {
    try {
      localStorage.setItem(STORAGE_KEY_2FA_ENABLED, 'true')
      localStorage.setItem(STORAGE_KEY_2FA_METHOD, method)

      if (method === TwoFactorMethod.SMS && verificationState.targetPhone) {
        localStorage.setItem(STORAGE_KEY_VERIFIED_PHONE, verificationState.targetPhone)
      }
    } catch (e) {
      console.error('[2FA] Error saving 2FA settings:', e)
    }
  }

  clearVerificationState()

  return {
    success: true,
    message: 'Code verifie avec succes',
    action
  }
}

/**
 * Resend the verification code
 * @returns {Object} { success, message, error }
 */
export async function resendVerificationCode() {
  if (!verificationState.pendingAction) {
    return { success: false, error: 'no_pending', message: 'Aucune verification en cours' }
  }

  const method = verificationState.verificationMethod
  const target = method === TwoFactorMethod.EMAIL
    ? verificationState.targetEmail
    : verificationState.targetPhone

  if (!target) {
    return { success: false, error: 'no_target', message: 'Destination de verification manquante' }
  }

  return startVerification(method, target, verificationState.pendingAction)
}

/**
 * Clear the current verification state
 */
export function clearVerificationState() {
  verificationState = {
    pendingCode: null,
    codeExpiry: null,
    attempts: 0,
    lastResendTime: null,
    pendingAction: null,
    targetEmail: null,
    targetPhone: null,
    verificationMethod: null
  }

  try {
    localStorage.removeItem(STORAGE_KEY_PENDING_CODE)
    localStorage.removeItem(STORAGE_KEY_CODE_EXPIRY)
  } catch (e) {
    // Ignore
  }
}

/**
 * Get the current verification state (for UI)
 * @returns {Object} Verification state info
 */
export function getVerificationState() {
  const hasActivePending = !!(verificationState.pendingCode &&
    Date.now() < verificationState.codeExpiry)

  let remainingTime = 0
  if (hasActivePending) {
    remainingTime = Math.max(0, Math.ceil((verificationState.codeExpiry - Date.now()) / 1000))
  }

  let resendCooldown = 0
  if (verificationState.lastResendTime) {
    const timeSince = Date.now() - verificationState.lastResendTime
    if (timeSince < RESEND_COOLDOWN_MS) {
      resendCooldown = Math.ceil((RESEND_COOLDOWN_MS - timeSince) / 1000)
    }
  }

  return {
    hasPendingVerification: hasActivePending,
    pendingAction: hasActivePending ? verificationState.pendingAction : null,
    method: hasActivePending ? verificationState.verificationMethod : null,
    remainingTimeSeconds: remainingTime,
    attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - verificationState.attempts,
    resendCooldownSeconds: resendCooldown,
    targetMasked: hasActivePending ? maskTarget(
      verificationState.verificationMethod,
      verificationState.targetEmail || verificationState.targetPhone
    ) : null
  }
}

/**
 * Mask email or phone for display
 * @param {string} method - TwoFactorMethod
 * @param {string} target - Email or phone
 * @returns {string} Masked string
 */
function maskTarget(method, target) {
  if (!target) return ''

  if (method === TwoFactorMethod.EMAIL) {
    const [local, domain] = target.split('@')
    if (!domain) return target
    const maskedLocal = local.length > 2
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : local[0] + '*'
    return `${maskedLocal}@${domain}`
  }

  if (method === TwoFactorMethod.SMS) {
    // Show last 4 digits
    const cleaned = target.replace(/\D/g, '')
    if (cleaned.length < 4) return target
    return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4)
  }

  return target
}

/**
 * Get the verified phone number (if any)
 * @returns {string|null}
 */
export function getVerifiedPhone() {
  try {
    return localStorage.getItem(STORAGE_KEY_VERIFIED_PHONE)
  } catch (e) {
    return null
  }
}

/**
 * Start 2FA verification for a sensitive action
 * @param {string} action - SensitiveAction value
 * @returns {Object} { success, requiresVerification, message }
 */
export async function startSensitiveAction(action) {
  if (!requiresTwoFactor(action)) {
    return { success: true, requiresVerification: false }
  }

  const method = get2FAMethod()
  const state = getState()

  // Determine target based on method and state
  let target
  if (method === TwoFactorMethod.EMAIL) {
    target = state.user?.email
  } else if (method === TwoFactorMethod.SMS) {
    target = getVerifiedPhone()
  }

  // If 2FA is not fully set up but action requires it, use email fallback
  if (!target && state.user?.email) {
    target = state.user.email
    const result = await startVerification(TwoFactorMethod.EMAIL, target, action)
    return { ...result, requiresVerification: true }
  }

  if (!target) {
    return {
      success: false,
      error: 'no_target',
      message: 'Aucune methode de verification disponible'
    }
  }

  const result = await startVerification(method, target, action)
  return { ...result, requiresVerification: true }
}

/**
 * Complete a sensitive action after verification
 * @param {string} code - Verification code
 * @param {Function} actionCallback - Function to execute after verification
 * @returns {Object} { success, message, error }
 */
export async function completeSensitiveAction(code, actionCallback) {
  const verifyResult = verifyCode(code)

  if (!verifyResult.success) {
    return verifyResult
  }

  // Execute the action
  if (typeof actionCallback === 'function') {
    try {
      const result = await actionCallback()
      return { success: true, message: 'Action completee avec succes', actionResult: result }
    } catch (e) {
      console.error('[2FA] Action callback error:', e)
      return { success: false, error: 'action_failed', message: 'Erreur lors de l\'execution de l\'action' }
    }
  }

  return verifyResult
}

/**
 * Render the 2FA verification modal HTML
 * @param {Object} options - { title, description, method }
 * @returns {string} HTML string
 */
export function render2FAModal(options = {}) {
  const verifyState = getVerificationState()
  const {
    title = 'Verification requise',
    description = 'Entrez le code a 6 chiffres envoye',
    showResend = true
  } = options

  const methodText = verifyState.method === TwoFactorMethod.SMS
    ? 'par SMS'
    : 'par email'

  const targetText = verifyState.targetMasked
    ? `a ${verifyState.targetMasked}`
    : ''

  return `
    <div id="2fa-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="2fa-title">
      <div class="bg-dark-primary rounded-2xl max-w-md w-full p-6 shadow-xl">
        <button onclick="window.close2FAModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Fermer">
          <i class="fas fa-times"></i>
        </button>

        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-shield-alt text-3xl text-primary-500"></i>
          </div>
          <h2 id="2fa-title" class="text-xl font-bold text-white">${title}</h2>
          <p class="text-gray-400 mt-2">${description} ${methodText} ${targetText}</p>
        </div>

        <form onsubmit="window.verify2FACode(event)" class="space-y-4">
          <div>
            <label for="2fa-code" class="sr-only">Code de verification</label>
            <input
              type="text"
              id="2fa-code"
              name="code"
              inputmode="numeric"
              autocomplete="one-time-code"
              pattern="[0-9]{6}"
              maxlength="6"
              placeholder="000000"
              class="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 px-4 bg-dark-secondary rounded-xl text-white border border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
              aria-describedby="2fa-help"
              required
            />
            <p id="2fa-help" class="text-sm text-gray-500 mt-2 text-center">
              ${verifyState.attemptsRemaining} tentatives restantes
            </p>
          </div>

          <div id="2fa-error" class="hidden text-red-400 text-sm text-center" role="alert" aria-live="polite"></div>

          <button
            type="submit"
            class="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
          >
            Verifier
          </button>
        </form>

        ${showResend ? `
          <div class="mt-4 text-center">
            <button
              id="2fa-resend-btn"
              onclick="window.resend2FACode()"
              class="text-primary-400 hover:text-primary-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              ${verifyState.resendCooldownSeconds > 0 ? 'disabled' : ''}
            >
              ${verifyState.resendCooldownSeconds > 0
                ? `Renvoyer le code (${verifyState.resendCooldownSeconds}s)`
                : 'Renvoyer le code'}
            </button>
          </div>
        ` : ''}

        <p class="text-xs text-gray-500 text-center mt-4">
          Le code expire dans ${Math.floor(verifyState.remainingTimeSeconds / 60)}:${String(verifyState.remainingTimeSeconds % 60).padStart(2, '0')}
        </p>
      </div>
    </div>
  `
}

/**
 * Render 2FA settings section for profile
 * @returns {string} HTML string
 */
export function render2FASettings() {
  const enabled = is2FAEnabled()
  const method = get2FAMethod()
  const phone = getVerifiedPhone()

  const methodLabel = method === TwoFactorMethod.SMS
    ? 'SMS'
    : method === TwoFactorMethod.EMAIL
      ? 'Email'
      : 'Aucune'

  return `
    <div class="bg-dark-secondary rounded-xl p-4 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
            <i class="fas fa-shield-alt text-primary-500"></i>
          </div>
          <div>
            <h3 class="font-medium text-white">Double authentification</h3>
            <p class="text-sm text-gray-400">
              ${enabled ? `Active via ${methodLabel}` : 'Desactive'}
            </p>
          </div>
        </div>
        <button
          onclick="window.toggle2FA()"
          class="px-4 py-2 rounded-lg text-sm font-medium ${
            enabled
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          } transition-colors"
        >
          ${enabled ? 'Desactiver' : 'Activer'}
        </button>
      </div>

      ${enabled ? `
        <div class="border-t border-gray-700 pt-4 space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-400">Methode actuelle</span>
            <span class="text-white">${methodLabel}</span>
          </div>
          ${phone ? `
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-400">Telephone verifie</span>
              <span class="text-white">${maskTarget(TwoFactorMethod.SMS, phone)}</span>
            </div>
          ` : ''}
          <button
            onclick="window.change2FAMethod()"
            class="w-full py-2 px-4 bg-dark-primary rounded-lg text-gray-400 hover:text-white text-sm transition-colors"
          >
            Changer de methode
          </button>
        </div>
      ` : `
        <p class="text-sm text-gray-500">
          Activez la double authentification pour proteger votre compte lors des actions sensibles
          (suppression de compte, changement d'email, etc.)
        </p>
      `}
    </div>
  `
}

/**
 * Initialize global handlers for 2FA
 */
export function init2FAHandlers() {
  // Verify code handler
  window.verify2FACode = async (event) => {
    event && event.preventDefault()

    const codeInput = document.getElementById('2fa-code')
    const errorDiv = document.getElementById('2fa-error')

    if (!codeInput) return

    const code = codeInput.value.trim()
    const result = verifyCode(code)

    if (result.success) {
      // Close modal and execute pending action
      window.close2FAModal && window.close2FAModal()

      // Trigger action completion event
      const event = new CustomEvent('2fa-verified', {
        detail: { action: result.action }
      })
      document.dispatchEvent(event)
    } else {
      // Show error
      if (errorDiv) {
        errorDiv.textContent = result.message
        errorDiv.classList.remove('hidden')
      }

      // Update attempts remaining
      const helpText = document.getElementById('2fa-help')
      if (helpText && result.attemptsRemaining !== undefined) {
        helpText.textContent = `${result.attemptsRemaining} tentatives restantes`
      }

      // Clear input
      codeInput.value = ''
      codeInput.focus()
    }
  }

  // Resend code handler
  window.resend2FACode = async () => {
    const result = await resendVerificationCode()

    if (result.success) {
      showToast && showToast('Code renvoye !', 'success')
    } else {
      showToast && showToast(result.message, 'error')
    }

    // Update resend button
    updateResendButton()
  }

  // Close modal handler
  window.close2FAModal = () => {
    const modal = document.getElementById('2fa-modal')
    if (modal) {
      modal.remove()
    }
    clearVerificationState()
  }

  // Toggle 2FA handler
  window.toggle2FA = () => {
    if (is2FAEnabled()) {
      // Disable - requires verification first
      startSensitiveAction(SensitiveAction.DISABLE_2FA).then(result => {
        if (result.requiresVerification) {
          show2FAModal({ title: 'Desactiver la 2FA' })

          // Listen for verification
          document.addEventListener('2fa-verified', function handler(e) {
            if (e.detail.action === SensitiveAction.DISABLE_2FA) {
              disable2FA()
              document.removeEventListener('2fa-verified', handler)
            }
          })
        }
      })
    } else {
      // Enable - show method selection
      show2FASetupModal()
    }
  }

  // Change method handler
  window.change2FAMethod = () => {
    show2FASetupModal()
  }
}

/**
 * Show the 2FA modal
 * @param {Object} options - Modal options
 */
export function show2FAModal(options = {}) {
  // Remove existing modal if any
  const existing = document.getElementById('2fa-modal')
  if (existing) existing.remove()

  const html = render2FAModal(options)
  document.body.insertAdjacentHTML('beforeend', html)

  // Focus input
  setTimeout(() => {
    const input = document.getElementById('2fa-code')
    if (input) input.focus()
  }, 100)

  // Start countdown timer
  startCountdownTimer()
}

/**
 * Show 2FA setup modal for enabling
 */
function show2FASetupModal() {
  const state = getState()
  const userEmail = state.user?.email || ''

  const html = `
    <div id="2fa-setup-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div class="bg-dark-primary rounded-2xl max-w-md w-full p-6 shadow-xl">
        <button onclick="document.getElementById('2fa-setup-modal').remove()" class="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Fermer">
          <i class="fas fa-times"></i>
        </button>

        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-shield-alt text-3xl text-primary-500"></i>
          </div>
          <h2 class="text-xl font-bold text-white">Activer la 2FA</h2>
          <p class="text-gray-400 mt-2">Choisissez votre methode de verification</p>
        </div>

        <div class="space-y-3">
          <button
            onclick="window.setup2FAWithEmail('${userEmail}')"
            class="w-full p-4 bg-dark-secondary rounded-xl flex items-center gap-4 hover:bg-gray-700 transition-colors"
          >
            <div class="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <i class="fas fa-envelope text-xl text-blue-400"></i>
            </div>
            <div class="text-left">
              <p class="font-medium text-white">Email</p>
              <p class="text-sm text-gray-400">Recevoir le code par email</p>
            </div>
          </button>

          <button
            onclick="window.setup2FAWithSMS()"
            class="w-full p-4 bg-dark-secondary rounded-xl flex items-center gap-4 hover:bg-gray-700 transition-colors"
          >
            <div class="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <i class="fas fa-mobile-alt text-xl text-green-400"></i>
            </div>
            <div class="text-left">
              <p class="font-medium text-white">SMS</p>
              <p class="text-sm text-gray-400">Recevoir le code par SMS</p>
            </div>
          </button>
        </div>

        <p class="text-xs text-gray-500 text-center mt-4">
          Vous pourrez changer de methode a tout moment
        </p>
      </div>
    </div>
  `

  document.body.insertAdjacentHTML('beforeend', html)

  // Setup handlers
  window.setup2FAWithEmail = async (email) => {
    document.getElementById('2fa-setup-modal')?.remove()

    const result = await enable2FA(TwoFactorMethod.EMAIL, email)
    if (result.success) {
      show2FAModal({ title: 'Verification email' })

      document.addEventListener('2fa-verified', function handler(e) {
        if (e.detail.action === 'enable_2fa') {
          showToast && showToast('2FA active par email !', 'success')
          document.removeEventListener('2fa-verified', handler)
        }
      })
    } else {
      showToast && showToast(result.message, 'error')
    }
  }

  window.setup2FAWithSMS = () => {
    document.getElementById('2fa-setup-modal')?.remove()
    showPhoneInputModal()
  }
}

/**
 * Show phone input modal for SMS 2FA
 */
function showPhoneInputModal() {
  const html = `
    <div id="phone-input-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div class="bg-dark-primary rounded-2xl max-w-md w-full p-6 shadow-xl">
        <button onclick="document.getElementById('phone-input-modal').remove()" class="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Fermer">
          <i class="fas fa-times"></i>
        </button>

        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-mobile-alt text-3xl text-green-400"></i>
          </div>
          <h2 class="text-xl font-bold text-white">Numero de telephone</h2>
          <p class="text-gray-400 mt-2">Entrez votre numero pour recevoir les codes SMS</p>
        </div>

        <form onsubmit="window.submitPhoneFor2FA(event)" class="space-y-4">
          <div>
            <label for="phone-input" class="sr-only">Numero de telephone</label>
            <input
              type="tel"
              id="phone-input"
              name="phone"
              placeholder="+33 6 12 34 56 78"
              class="w-full py-3 px-4 bg-dark-secondary rounded-xl text-white border border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            class="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
          >
            Envoyer le code
          </button>
        </form>
      </div>
    </div>
  `

  document.body.insertAdjacentHTML('beforeend', html)

  window.submitPhoneFor2FA = async (event) => {
    event.preventDefault()

    const phoneInput = document.getElementById('phone-input')
    if (!phoneInput) return

    const phone = phoneInput.value.trim()
    document.getElementById('phone-input-modal')?.remove()

    const result = await enable2FA(TwoFactorMethod.SMS, phone)
    if (result.success) {
      show2FAModal({ title: 'Verification SMS' })

      document.addEventListener('2fa-verified', function handler(e) {
        if (e.detail.action === 'enable_2fa') {
          showToast && showToast('2FA active par SMS !', 'success')
          document.removeEventListener('2fa-verified', handler)
        }
      })
    } else {
      showToast && showToast(result.message, 'error')
    }
  }
}

/**
 * Update resend button state
 */
function updateResendButton() {
  const btn = document.getElementById('2fa-resend-btn')
  if (!btn) return

  const state = getVerificationState()

  if (state.resendCooldownSeconds > 0) {
    btn.disabled = true
    btn.textContent = `Renvoyer le code (${state.resendCooldownSeconds}s)`
  } else {
    btn.disabled = false
    btn.textContent = 'Renvoyer le code'
  }
}

/**
 * Start countdown timer for code expiry
 */
function startCountdownTimer() {
  const interval = setInterval(() => {
    const state = getVerificationState()

    if (!state.hasPendingVerification) {
      clearInterval(interval)
      return
    }

    // Update expiry display
    const expiryText = document.querySelector('#2fa-modal p:last-child')
    if (expiryText) {
      const mins = Math.floor(state.remainingTimeSeconds / 60)
      const secs = state.remainingTimeSeconds % 60
      expiryText.textContent = `Le code expire dans ${mins}:${String(secs).padStart(2, '0')}`
    }

    // Update resend button
    updateResendButton()

    // Check if expired
    if (state.remainingTimeSeconds <= 0) {
      clearInterval(interval)
      showToast && showToast('Code expire. Veuillez en demander un nouveau.', 'warning')
      window.close2FAModal && window.close2FAModal()
    }
  }, 1000)
}

// Export default object
export default {
  // Constants
  TwoFactorMethod,
  SensitiveAction,
  CODE_LENGTH,
  CODE_EXPIRY_MS,
  MAX_VERIFICATION_ATTEMPTS,
  RESEND_COOLDOWN_MS,

  // Core functions
  generateVerificationCode,
  is2FAEnabled,
  get2FAMethod,
  requiresTwoFactor,
  enable2FA,
  disable2FA,
  startVerification,
  verifyCode,
  resendVerificationCode,
  clearVerificationState,
  getVerificationState,
  getVerifiedPhone,

  // Sensitive actions
  startSensitiveAction,
  completeSensitiveAction,

  // UI
  render2FAModal,
  render2FASettings,
  show2FAModal,
  init2FAHandlers
}
