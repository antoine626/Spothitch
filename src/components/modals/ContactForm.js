/**
 * Contact Form Modal Component
 * Sends messages via Formspree (free tier: 50 submissions/month)
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mjgegaka'

export function renderContactFormModal() {
  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeContactForm()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-form-title"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative bg-dark-primary border border-primary-500/30 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Close -->
        <button
          onclick="closeContactForm()"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          aria-label="${t('close') || 'Fermer'}"
          type="button"
        >
          ${icon('x', 'w-5 h-5')}
        </button>

        <!-- Header -->
        <div class="p-8 text-center bg-gradient-to-b from-primary-500/20 to-transparent border-b border-white/10">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
            ${icon('mail', 'w-8 h-8 text-primary-400')}
          </div>
          <h2 id="contact-form-title" class="text-2xl font-bold">${t('contactFormTitle')}</h2>
          <p class="text-slate-400 text-sm mt-2">${t('contactFormSubtitle')}</p>
        </div>

        <!-- Form -->
        <form id="contact-form" class="p-6 space-y-5" onsubmit="submitContactForm(event)">
          <!-- Name -->
          <div>
            <label for="contact-name" class="block text-sm font-medium text-slate-300 mb-1">
              ${t('contactFormName')} *
            </label>
            <input
              type="text"
              id="contact-name"
              name="name"
              required
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-hidden transition-all"
              placeholder="${t('contactFormName')}"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="contact-email" class="block text-sm font-medium text-slate-300 mb-1">
              ${t('contactFormEmail')} *
            </label>
            <input
              type="email"
              id="contact-email"
              name="email"
              required
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-hidden transition-all"
              placeholder="${t('contactFormEmail')}"
            />
          </div>

          <!-- Subject -->
          <div>
            <label for="contact-subject" class="block text-sm font-medium text-slate-300 mb-1">
              ${t('contactFormSubject')}
            </label>
            <select
              id="contact-subject"
              name="subject"
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-hidden transition-all"
            >
              <option value="general">${t('contactFormSubjectGeneral')}</option>
              <option value="bug">${t('contactFormSubjectBug')}</option>
              <option value="feature">${t('contactFormSubjectFeature')}</option>
              <option value="partnership">${t('contactFormSubjectPartnership')}</option>
              <option value="other">${t('contactFormSubjectOther')}</option>
            </select>
          </div>

          <!-- Message -->
          <div>
            <label for="contact-message" class="block text-sm font-medium text-slate-300 mb-1">
              ${t('contactFormMessage')} *
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows="5"
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-hidden transition-all resize-none"
              placeholder="${t('contactFormMessage')}"
            ></textarea>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            id="contact-submit-btn"
            class="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            ${icon('send', 'w-5 h-5')}
            ${t('contactFormSend')}
          </button>
        </form>
      </div>
    </div>
  `
}

/**
 * Submit the contact form to Formspree
 * POST name, email, subject, message
 * @param {Event} event
 */
export async function handleContactFormSubmit(event) {
  event.preventDefault()

  const form = document.getElementById('contact-form')
  const btn = document.getElementById('contact-submit-btn')
  if (!form || !btn) return

  const name = document.getElementById('contact-name')?.value?.trim()
  const email = document.getElementById('contact-email')?.value?.trim()
  const subject = document.getElementById('contact-subject')?.value || 'general'
  const message = document.getElementById('contact-message')?.value?.trim()

  // Validation
  if (!name) return
  if (!email) return
  if (!message) return

  // Disable button during submission
  btn.disabled = true
  btn.innerHTML = `${icon('loader-circle', 'w-5 h-5 animate-spin')} ${t('contactFormSending')}`

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ name, email, subject, message }),
    })

    if (response.ok) {
      // Success — show confirmation and close
      form.innerHTML = `
        <div class="text-center py-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            ${icon('check', 'w-8 h-8 text-emerald-400')}
          </div>
          <p class="text-lg font-semibold text-emerald-400 mb-2">${t('contactFormSuccess')}</p>
        </div>
      `
      // Auto-close after 3 seconds
      setTimeout(() => {
        if (window.closeContactForm) window.closeContactForm()
      }, 3000)
    } else {
      throw new Error('Formspree response not OK')
    }
  } catch (e) {
    // Re-enable button on error
    btn.disabled = false
    btn.innerHTML = `${icon('send', 'w-5 h-5')} ${t('contactFormSend')}`

    // Show error below button
    const existingError = form.querySelector('.contact-error')
    if (existingError) existingError.remove()

    const errorDiv = document.createElement('div')
    errorDiv.className = 'contact-error text-red-400 text-sm text-center mt-2'
    errorDiv.textContent = t('contactFormError')
    form.appendChild(errorDiv)
  }
}

export default { renderContactFormModal, handleContactFormSubmit }
