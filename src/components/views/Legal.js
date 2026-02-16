/**
 * Legal Pages Component
 * CGU, Privacy Policy, Legal Notice
 */

import { getState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';
import { icon } from '../../utils/icons.js'

/**
 * Render legal page container
 */
export function renderLegalPage(page = 'cgu') {
  const content = {
    cgu: renderCGU(),
    privacy: renderPrivacyPolicy(),
    cookies: renderCookiePolicy(),
    legal: renderLegalNotice(),
  };

  const titles = {
    cgu: t('legalTerms'),
    privacy: t('legalPrivacy'),
    cookies: t('legalCookies'),
    legal: t('legalNotice'),
  };

  return `
    <div class="legal-page pb-24 overflow-x-hidden">
      <!-- Header -->
      <div class="sticky top-0 bg-dark-primary/80 backdrop-blur-xl z-10 border-b border-white/10">
        <div class="flex items-center gap-3 p-4">
          <button onclick="changeTab('profile')" class="p-2 hover:bg-dark-secondary rounded-full">
            ${icon('arrow-left', 'w-5 h-5')}
          </button>
          <h1 class="text-lg font-bold text-white">
            ${titles[page] || titles.cgu}
          </h1>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-white/10 overflow-x-auto">
        <button onclick="showLegalPage('cgu')"
                class="flex-1 py-3 text-sm font-medium whitespace-nowrap px-2 ${page === 'cgu' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400'}">
          ${t('legalTabTerms')}
        </button>
        <button onclick="showLegalPage('privacy')"
                class="flex-1 py-3 text-sm font-medium whitespace-nowrap px-2 ${page === 'privacy' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400'}">
          ${t('legalTabPrivacy')}
        </button>
        <button onclick="showLegalPage('cookies')"
                class="flex-1 py-3 text-sm font-medium whitespace-nowrap px-2 ${page === 'cookies' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400'}">
          ${t('legalTabCookies')}
        </button>
        <button onclick="showLegalPage('legal')"
                class="flex-1 py-3 text-sm font-medium whitespace-nowrap px-2 ${page === 'legal' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400'}">
          ${t('legalTabNotice')}
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 prose prose-invert prose-sm max-w-none">
        ${content[page] || content.cgu}
      </div>
    </div>
  `;
}

/**
 * Render CGU (Terms of Service)
 */
export function renderCGU() {
  return `
    <div class="legal-content">
      <h2>${t('legalCguTitle')}</h2>
      <p class="text-slate-400 text-sm">${t('legalLastUpdated')} ${t('legalDateDec2024')}</p>

      <h3>${t('legalCgu1Title')}</h3>
      <p>${t('legalCgu1Text')}</p>

      <h3>${t('legalCgu2Title')}</h3>
      <p>${t('legalCgu2Text')}</p>

      <h3>${t('legalCgu3Title')}</h3>
      <p>${t('legalCgu3Intro')}</p>
      <ul>
        <li>${t('legalCgu3Item1')}</li>
        <li>${t('legalCgu3Item2')}</li>
        <li>${t('legalCgu3Item3')}</li>
        <li>${t('legalCgu3Item4')}</li>
        <li>${t('legalCgu3Item5')}</li>
      </ul>

      <h3>${t('legalCgu4Title')}</h3>
      <p>${t('legalCgu4Text')}</p>

      <h3>${t('legalCgu5Title')}</h3>
      <p>${t('legalCgu5Intro')}</p>
      <ul>
        <li>${t('legalCgu5Item1')}</li>
        <li>${t('legalCgu5Item2')}</li>
        <li>${t('legalCgu5Item3')}</li>
        <li>${t('legalCgu5Item4')}</li>
      </ul>

      <h3>${t('legalCgu6Title')}</h3>
      <p>${t('legalCgu6Text')}</p>

      <h3>${t('legalCgu7Title')}</h3>
      <p>${t('legalCgu7Text')}</p>

      <h3>${t('legalCgu8Title')}</h3>
      <p>${t('legalCgu8Text')}</p>

      <h3>${t('legalCgu9Title')}</h3>
      <p>${t('legalCgu9Text')}</p>

      <h3>${t('legalCgu10Title')}</h3>
      <p>${t('legalCgu10Text')}</p>
    </div>
  `;
}

/**
 * Render Privacy Policy
 */
export function renderPrivacyPolicy() {
  return `
    <div class="legal-content">
      <h2>${t('legalPrivacyTitle')}</h2>
      <p class="text-slate-400 text-sm">${t('legalLastUpdated')} ${t('legalDateDec2024')}</p>

      <h3>${t('legalPrivacy1Title')}</h3>
      <p>${t('legalPrivacy1Intro')}</p>
      <ul>
        <li><strong>${t('legalPrivacy1AccountLabel')}</strong> ${t('legalPrivacy1AccountDesc')}</li>
        <li><strong>${t('legalPrivacy1ContribLabel')}</strong> ${t('legalPrivacy1ContribDesc')}</li>
        <li><strong>${t('legalPrivacy1LocationLabel')}</strong> ${t('legalPrivacy1LocationDesc')}</li>
        <li><strong>${t('legalPrivacy1TechLabel')}</strong> ${t('legalPrivacy1TechDesc')}</li>
      </ul>

      <h3>${t('legalPrivacy2Title')}</h3>
      <p>${t('legalPrivacy2Intro')}</p>
      <ul>
        <li>${t('legalPrivacy2Item1')}</li>
        <li>${t('legalPrivacy2Item2')}</li>
        <li>${t('legalPrivacy2Item3')}</li>
        <li>${t('legalPrivacy2Item4')}</li>
      </ul>

      <h3>${t('legalPrivacy3Title')}</h3>
      <p>${t('legalPrivacy3Text')}</p>

      <h3>${t('legalPrivacy4Title')}</h3>
      <p>${t('legalPrivacy4Intro')}</p>
      <ul>
        <li>${t('legalPrivacy4Item1')}</li>
        <li>${t('legalPrivacy4Item2')}</li>
        <li>${t('legalPrivacy4Item3')}</li>
      </ul>

      <h3>${t('legalPrivacy5Title')}</h3>
      <p>${t('legalPrivacy5Intro')}</p>
      <ul>
        <li>${t('legalPrivacy5Item1')}</li>
        <li>${t('legalPrivacy5Item2')}</li>
        <li>${t('legalPrivacy5Item3')}</li>
        <li>${t('legalPrivacy5Item4')}</li>
        <li>${t('legalPrivacy5Item5')}</li>
      </ul>

      <h3>${t('legalPrivacy6Title')}</h3>
      <p>${t('legalPrivacy6Text')}</p>

      <h3>${t('legalPrivacy7Title')}</h3>
      <p>${t('legalPrivacy7Text')}</p>

      <h3>${t('legalPrivacy8Title')}</h3>
      <p>${t('legalPrivacy8Text')}</p>

      <h3>${t('legalPrivacy9Title')}</h3>
      <p>${t('legalPrivacy9Text')}</p>
    </div>
  `;
}

/**
 * Render Cookie Policy (detailed)
 */
export function renderCookiePolicy() {
  return `
    <div class="legal-content">
      <h2>${t('legalCookieTitle')}</h2>
      <p class="text-slate-400 text-sm">${t('legalLastUpdated')} ${t('legalDateFeb2026')}</p>

      <h3>${t('legalCookie1Title')}</h3>
      <p>${t('legalCookie1Text')}</p>

      <h3>${t('legalCookie2Title')}</h3>

      <h4 class="text-amber-400 mt-4">${t('legalCookieNecessaryTitle')}</h4>
      <p>${t('legalCookieNecessaryDesc')}</p>
      <table class="w-full text-sm mt-2 mb-4">
        <thead>
          <tr class="border-b border-white/10">
            <th class="text-left py-2">${t('legalCookieColName')}</th>
            <th class="text-left py-2">${t('legalCookieColPurpose')}</th>
            <th class="text-left py-2">${t('legalCookieColDuration')}</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_auth</code></td>
            <td class="py-2">${t('legalCookieAuthDesc')}</td>
            <td class="py-2">${t('legalCookieSession')}</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_state</code></td>
            <td class="py-2">${t('legalCookieStateDesc')}</td>
            <td class="py-2">${t('legalCookie1Year')}</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>cookie_consent</code></td>
            <td class="py-2">${t('legalCookieConsentDesc')}</td>
            <td class="py-2">${t('legalCookie1Year')}</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>consent_history</code></td>
            <td class="py-2">${t('legalCookieHistoryDesc')}</td>
            <td class="py-2">${t('legalCookie3Years')}</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_offline</code></td>
            <td class="py-2">${t('legalCookieOfflineDesc')}</td>
            <td class="py-2">${t('legalCookie30Days')}</td>
          </tr>
        </tbody>
      </table>

      <h4 class="text-amber-400 mt-4">${t('legalCookieAnalyticsTitle')}</h4>
      <p>${t('legalCookieAnalyticsDesc')}</p>
      <table class="w-full text-sm mt-2 mb-4">
        <thead>
          <tr class="border-b border-white/10">
            <th class="text-left py-2">${t('legalCookieColName')}</th>
            <th class="text-left py-2">${t('legalCookieColPurpose')}</th>
            <th class="text-left py-2">${t('legalCookieColDuration')}</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>_ga</code></td>
            <td class="py-2">${t('legalCookieGaDesc')}</td>
            <td class="py-2">${t('legalCookie2Years')}</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>mp_*</code></td>
            <td class="py-2">${t('legalCookieMixpanelDesc')}</td>
            <td class="py-2">${t('legalCookie1Year')}</td>
          </tr>
        </tbody>
      </table>

      <h4 class="text-amber-400 mt-4">${t('legalCookieMarketingTitle')}</h4>
      <p>${t('legalCookieMarketingDesc')}</p>
      <table class="w-full text-sm mt-2 mb-4">
        <thead>
          <tr class="border-b border-white/10">
            <th class="text-left py-2">${t('legalCookieColName')}</th>
            <th class="text-left py-2">${t('legalCookieColPurpose')}</th>
            <th class="text-left py-2">${t('legalCookieColDuration')}</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_ads</code></td>
            <td class="py-2">${t('legalCookieAdsDesc')}</td>
            <td class="py-2">${t('legalCookie6Months')}</td>
          </tr>
        </tbody>
      </table>

      <h4 class="text-amber-400 mt-4">${t('legalCookiePersonalizationTitle')}</h4>
      <p>${t('legalCookiePersonalizationDesc')}</p>
      <table class="w-full text-sm mt-2 mb-4">
        <thead>
          <tr class="border-b border-white/10">
            <th class="text-left py-2">${t('legalCookieColName')}</th>
            <th class="text-left py-2">${t('legalCookieColPurpose')}</th>
            <th class="text-left py-2">${t('legalCookieColDuration')}</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_lang</code></td>
            <td class="py-2">${t('legalCookieLangDesc')}</td>
            <td class="py-2">${t('legalCookie1Year')}</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_theme</code></td>
            <td class="py-2">${t('legalCookieThemeDesc')}</td>
            <td class="py-2">${t('legalCookie1Year')}</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_recent</code></td>
            <td class="py-2">${t('legalCookieRecentDesc')}</td>
            <td class="py-2">${t('legalCookie30Days')}</td>
          </tr>
        </tbody>
      </table>

      <h3>${t('legalCookie3Title')}</h3>
      <p>${t('legalCookie3Intro')}</p>
      <ul>
        <li>${t('legalCookie3Item1')}</li>
        <li>${t('legalCookie3Item2')}</li>
        <li>${t('legalCookie3Item3')}</li>
        <li>${t('legalCookie3Item4')}</li>
        <li>${t('legalCookie3Item5')}</li>
      </ul>
      <p class="mt-2">${t('legalCookie3NoThirdParty')}</p>

      <h3>${t('legalCookie4Title')}</h3>

      <h4 class="text-amber-400 mt-4">${t('legalCookie4AppTitle')}</h4>
      <p>${t('legalCookie4AppText')}</p>

      <h4 class="text-amber-400 mt-4">${t('legalCookie4BrowserTitle')}</h4>
      <p>${t('legalCookie4BrowserText')}</p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" class="text-amber-400">Chrome</a></li>
        <li><a href="https://support.mozilla.org/fr/kb/cookies-informations-sites-enregistrent" target="_blank" class="text-amber-400">Firefox</a></li>
        <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" class="text-amber-400">Safari</a></li>
        <li><a href="https://support.microsoft.com/fr-fr/windows/supprimer-et-g%C3%A9rer-les-cookies" target="_blank" class="text-amber-400">Edge</a></li>
      </ul>

      <h3>${t('legalCookie5Title')}</h3>
      <p><strong>${t('legalCookie5NecessaryLabel')}</strong> ${t('legalCookie5NecessaryText')}</p>
      <p><strong>${t('legalCookie5OptionalLabel')}</strong> ${t('legalCookie5OptionalIntro')}</p>
      <ul>
        <li>${t('legalCookie5AnalyticsRefused')}</li>
        <li>${t('legalCookie5MarketingRefused')}</li>
        <li>${t('legalCookie5PersonalizationRefused')}</li>
      </ul>

      <h3>${t('legalCookie6Title')}</h3>
      <p>${t('legalCookie6Text')}</p>

      <h3>${t('legalCookie7Title')}</h3>
      <p>${t('legalCookie7Text')}</p>

      <h3>${t('legalCookie8Title')}</h3>
      <p>
        ${t('legalCookie8Text')} <a href="mailto:privacy@spothitch.app" class="text-amber-400">privacy@spothitch.app</a>
      </p>

      <!-- Bouton pour modifier les preferences -->
      <div class="mt-6 p-4 bg-dark-secondary rounded-lg text-center">
        <p class="text-sm text-slate-400 mb-3">${t('manageCookiePrefs')}</p>
        <button onclick="showCookieCustomize()" class="btn bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg">
          ${icon('settings', 'w-5 h-5 mr-2')}
          ${t('modifyMyChoices')}
        </button>
      </div>
    </div>
  `;
}

/**
 * Render Legal Notice
 */
export function renderLegalNotice() {
  return `
    <div class="legal-content">
      <h2>${t('legalNoticeTitle')}</h2>
      <p class="text-slate-400 text-sm">${t('legalLastUpdated')} ${t('legalDateDec2024')}</p>

      <h3>${t('legalNoticeEditorTitle')}</h3>
      <p>
        ${t('legalNoticeEditorText')}<br>
        ${t('legalNoticeHostingLabel')} GitHub Pages<br>
        ${t('legalNoticeSourceLabel')} <a href="https://github.com/antoine626/Spothitch" class="text-amber-400">GitHub</a>
      </p>

      <h3>${t('legalNoticeHostingTitle')}</h3>
      <p>
        GitHub, Inc.<br>
        88 Colin P Kelly Jr St<br>
        San Francisco, CA 94107<br>
        ${t('legalNoticeUSA')}
      </p>

      <h3>${t('legalNoticeServicesTitle')}</h3>
      <ul>
        <li><strong>Firebase</strong> (Google) - ${t('legalNoticeFirebaseDesc')}</li>
        <li><strong>OpenStreetMap</strong> - ${t('legalNoticeOSMDesc')}</li>
        <li><strong>Hitchwiki/Hitchmap</strong> - ${t('legalNoticeHitchwikiDesc')}</li>
        <li><strong>OSRM</strong> - ${t('legalNoticeOSRMDesc')}</li>
        <li><strong>Nominatim</strong> - ${t('legalNoticeNominatimDesc')}</li>
      </ul>

      <h3>${t('legalNoticeCreditsTitle')}</h3>
      <ul>
        <li>${t('legalNoticeCreditsMap')}</li>
        <li>${t('legalNoticeCreditsSpots')}</li>
        <li>${t('legalNoticeCreditsIcons')}</li>
        <li>${t('legalNoticeCreditsPhotos')}</li>
      </ul>

      <h3>${t('legalNoticeLicenseTitle')}</h3>
      <p>${t('legalNoticeLicenseText')}</p>

      <h3>${t('legalNoticeContactTitle')}</h3>
      <p>
        ${t('legalNoticeContactEmail')} contact@spothitch.app<br>
        GitHub Issues : <a href="https://github.com/antoine626/Spothitch/issues" class="text-amber-400">${t('legalNoticeReportIssue')}</a>
      </p>
    </div>
  `;
}

export default {
  renderLegalPage,
  renderCGU,
  renderPrivacyPolicy,
  renderCookiePolicy,
  renderLegalNotice,
};
