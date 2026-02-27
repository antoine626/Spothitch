/**
 * Landing Page — 6-slide Onboarding Carousel
 * Shown once for first-time visitors, dismissed forever via localStorage.
 * Slides: Problème → Solution → Sécurité → Guides → Cookies → CTA
 * Geolocation is handled automatically by init() — not in onboarding.
 */

import { t, languageConfig } from '../i18n/index.js'
import { renderToggle } from '../utils/toggle.js'
import { getState } from '../stores/state.js'

export function renderLanding() {
  const currentLang = getState().lang || 'fr'
  const langButtons = Object.values(languageConfig).map(l =>
    `<button onclick="changeLandingLanguage('${l.code}')" class="w-10 h-10 rounded-full ${l.code === currentLang ? 'bg-primary-500/30 border-2 border-primary-400 scale-110' : 'bg-white/10 border border-white/10'} flex items-center justify-center text-lg transition-colors hover:bg-white/20" aria-label="${l.nativeName}">${l.flag}</button>`
  ).join('')

  return `
    <div id="landing-page" class="fixed inset-0 z-[100] bg-dark-primary overflow-hidden">

      <!-- Language selector (floating top-right) -->
      <div class="absolute top-4 right-4 z-20 flex gap-1.5">
        ${langButtons}
      </div>

      <!-- Carousel Track -->
      <div id="landing-track" class="flex h-full transition-transform duration-300 ease-out" style="width:600%">

        <!-- Slide 1: Problème -->
        <div class="w-[16.667%] h-full flex-shrink-0 flex flex-col items-center justify-center px-7 text-center relative" style="background:linear-gradient(180deg,#1a0a0a,#0f1520)">
          <span class="text-5xl mb-5" aria-hidden="true">😰</span>
          <h2 class="text-[26px] font-bold text-white leading-tight mb-6">
            ${t('onboardingProblemTitle')}
          </h2>
          <div class="w-full max-w-sm flex flex-col gap-2.5">
            <div class="bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 flex items-center gap-3">
              <span class="inline-block px-2 py-0.5 rounded-md text-[13px] font-semibold bg-red-500/20 text-red-300">😵</span>
              <span class="text-[17px] text-red-300">${t('onboardingProblemWrongSpot')}</span>
            </div>
            <div class="bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 flex items-center gap-3">
              <span class="inline-block px-2 py-0.5 rounded-md text-[13px] font-semibold bg-red-500/20 text-red-300">😱</span>
              <span class="text-[17px] text-red-300">${t('onboardingProblemNoone')}</span>
            </div>
            <div class="bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 flex items-center gap-3">
              <span class="inline-block px-2 py-0.5 rounded-md text-[13px] font-semibold bg-red-500/20 text-red-300">🤷</span>
              <span class="text-[17px] text-red-300">${t('onboardingProblemNoInfo')}</span>
            </div>
            <div class="bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 flex items-center gap-3">
              <span class="inline-block px-2 py-0.5 rounded-md text-[13px] font-semibold bg-red-500/20 text-red-300">🌧️</span>
              <span class="text-[17px] text-red-300">${t('onboardingProblemNoPlanB')}</span>
            </div>
          </div>
        </div>

        <!-- Slide 2: Solution -->
        <div class="w-[16.667%] h-full flex-shrink-0 flex flex-col items-center justify-center px-7 text-center relative" style="background:linear-gradient(180deg,#0a1a10,#0f1520)">
          <span class="text-5xl mb-4" aria-hidden="true">✨</span>
          <h2 class="text-[26px] font-bold text-white leading-tight mb-5">
            ${t('onboardingSolutionTitle')}
          </h2>
          <div class="w-full max-w-sm flex flex-col gap-2 mb-6">
            <div class="bg-white/5 border border-white/[0.08] rounded-xl px-4 py-2.5 flex items-center gap-3">
              <span class="inline-block px-2 py-0.5 rounded-md text-[13px] font-semibold bg-emerald-500/20 text-emerald-300">📍</span>
              <span class="text-[17px] text-emerald-300">${t('onboardingSolutionBestSpot')}</span>
            </div>
            <div class="bg-white/5 border border-white/[0.08] rounded-xl px-4 py-2.5 flex items-center gap-3">
              <span class="inline-block px-2 py-0.5 rounded-md text-[13px] font-semibold bg-emerald-500/20 text-emerald-300">⏱️</span>
              <span class="text-[17px] text-emerald-300">${t('onboardingSolutionAvgWait')}</span>
            </div>
            <div class="bg-white/5 border border-white/[0.08] rounded-xl px-4 py-2.5 flex items-center gap-3">
              <span class="inline-block px-2 py-0.5 rounded-md text-[13px] font-semibold bg-emerald-500/20 text-emerald-300">📸</span>
              <span class="text-[17px] text-emerald-300">${t('onboardingSolutionPhotos')}</span>
            </div>
            <div class="bg-white/5 border border-white/[0.08] rounded-xl px-4 py-2.5 flex items-center gap-3">
              <span class="inline-block px-2 py-0.5 rounded-md text-[13px] font-semibold bg-emerald-500/20 text-emerald-300">🛡️</span>
              <span class="text-[17px] text-emerald-300">${t('onboardingSolutionSafety')}</span>
            </div>
          </div>
          <div class="flex gap-6 justify-center">
            <div class="text-center"><div class="text-2xl font-bold text-primary-400">14.6k</div><div class="text-[13px] text-slate-500">spots</div></div>
            <div class="text-center"><div class="text-2xl font-bold text-primary-400">137</div><div class="text-[13px] text-slate-500">${t('countries')}</div></div>
            <div class="text-center"><div class="text-2xl font-bold text-primary-400">100%</div><div class="text-[13px] text-slate-500">${t('onboardingFree')}</div></div>
          </div>
        </div>

        <!-- Slide 3: Sécurité -->
        <div class="w-[16.667%] h-full flex-shrink-0 flex flex-col items-center justify-center px-7 text-center relative" style="background:linear-gradient(180deg,#0a1a14,#0f1520)">
          <div class="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center text-5xl mb-6">🛡️</div>
          <h2 class="text-[26px] font-bold text-white leading-tight mb-5">
            ${t('onboardingSecurityTitle')}
          </h2>
          <div class="w-full max-w-sm flex flex-col gap-2.5 text-left">
            <div class="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
              <span class="text-lg">📍</span>
              <span class="text-[17px] text-slate-200">${t('onboardingSecurityShare')}</span>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
              <span class="text-lg">🆘</span>
              <span class="text-[17px] text-slate-200">${t('onboardingSecuritySOS')}</span>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
              <span class="text-lg">✅</span>
              <span class="text-[17px] text-slate-200">${t('onboardingSecurityCheckin')}</span>
            </div>
          </div>
        </div>

        <!-- Slide 4: Guides pays (passeport) -->
        <div class="w-[16.667%] h-full flex-shrink-0 flex flex-col items-center justify-center px-7 text-center relative" style="background:#0f1520">
          <span class="text-5xl mb-4" aria-hidden="true">🛂</span>
          <h2 class="text-[26px] font-bold text-white leading-tight mb-2">
            ${t('onboardingGuidesTitle')}
          </h2>
          <p class="text-[17px] text-slate-400 mb-5">${t('onboardingGuidesDesc')}</p>
          <div class="w-full max-w-sm flex flex-col gap-2">
            <div class="bg-white/5 border border-white/[0.08] rounded-xl px-4 py-2.5 flex items-center gap-3" style="border-left:3px solid #22c55e">
              <span class="text-2xl">🇫🇷</span>
              <div class="flex-1 text-left">
                <div class="text-[17px] font-bold text-white">France</div>
                <div class="text-[13px] text-slate-500">1891 spots • ${t('onboardingGuideHighways')}</div>
              </div>
              <span class="text-[13px] text-slate-500">${t('onboardingGuideStamped')}</span>
            </div>
            <div class="bg-white/5 border border-white/[0.08] rounded-xl px-4 py-2.5 flex items-center gap-3" style="border-left:3px solid #22c55e">
              <span class="text-2xl">🇭🇷</span>
              <div class="flex-1 text-left">
                <div class="text-[17px] font-bold text-white">Croatie</div>
                <div class="text-[13px] text-slate-500">124 spots • ${t('onboardingGuideCoastEasy')}</div>
              </div>
              <span class="text-[13px] text-slate-500">${t('onboardingGuideStamped')}</span>
            </div>
            <div class="bg-white/5 border border-white/[0.08] rounded-xl px-4 py-2.5 flex items-center gap-3 opacity-60" style="border-left:3px solid #64748b">
              <span class="text-2xl">🇬🇪</span>
              <div class="flex-1 text-left">
                <div class="text-[17px] font-bold text-white">${t('onboardingGuideGeorgia')}</div>
                <div class="text-[13px] text-slate-500">45 spots • ${t('onboardingGuideWelcoming')}</div>
              </div>
              <span class="text-[13px] text-slate-500">${t('onboardingGuideDiscover')}</span>
            </div>
            <div class="bg-white/5 border border-white/[0.08] rounded-xl px-4 py-2.5 flex items-center gap-3 opacity-60" style="border-left:3px solid #64748b">
              <span class="text-2xl">🇳🇿</span>
              <div class="flex-1 text-left">
                <div class="text-[17px] font-bold text-white">${t('onboardingGuideNZ')}</div>
                <div class="text-[13px] text-slate-500">67 spots • ${t('onboardingGuideDream')}</div>
              </div>
              <span class="text-[13px] text-slate-500">${t('onboardingGuideDiscover')}</span>
            </div>
          </div>
        </div>

        <!-- Slide 5: Cookies (Aire de repos) -->
        <div class="w-[16.667%] h-full flex-shrink-0 flex flex-col items-center justify-center px-7 text-center relative" style="background:#0f1520">
          <span class="text-5xl mb-4" aria-hidden="true">⛽</span>
          <h2 class="text-[26px] font-bold text-white leading-tight mb-2">
            ${t('onboardingCookiesTitle')}
          </h2>
          <p class="text-[17px] text-primary-400 italic mb-5">"${t('onboardingCookiesQuote')}"</p>
          <div class="w-full max-w-sm">
            <!-- Necessary (always on) -->
            <div class="flex items-center justify-between py-3 border-b border-white/5">
              <div class="text-left">
                <div class="text-[17px] text-slate-200">⛽ ${t('onboardingCookiesFuel')}</div>
                <div class="text-[14px] text-slate-500">${t('onboardingCookiesFuelDesc')}</div>
              </div>
              ${renderToggle(true, "", t('required') || 'Required')}
            </div>
            <!-- Analytics (toggleable) -->
            <div class="flex items-center justify-between py-3 border-b border-white/5">
              <div class="text-left">
                <div class="text-[17px] text-slate-200">☕ ${t('onboardingCookiesCoffee')}</div>
                <div class="text-[14px] text-slate-500">${t('onboardingCookiesCoffeeDesc')}</div>
              </div>
              <input type="checkbox" id="landing-cookie-analytics" class="hidden" checked>
              ${renderToggle(true, "toggleFormToggle('landing-cookie-analytics')", t('onboardingCookiesCoffee') || 'Analytics cookies')}
            </div>
            <!-- Bug tracking (toggleable) -->
            <div class="flex items-center justify-between py-3">
              <div class="text-left">
                <div class="text-[17px] text-slate-200">🔧 ${t('onboardingCookiesMechanic')}</div>
                <div class="text-[14px] text-slate-500">${t('onboardingCookiesMechanicDesc')}</div>
              </div>
              <input type="checkbox" id="landing-cookie-bugs" class="hidden" checked>
              ${renderToggle(true, "toggleFormToggle('landing-cookie-bugs')", t('onboardingCookiesMechanic') || 'Bug tracking cookies')}
            </div>
          </div>
          <p class="text-[14px] text-slate-600 mt-4">${t('onboardingCookiesNoPub')}</p>
        </div>

        <!-- Slide 6: CTA (Premier pas) -->
        <div class="w-[16.667%] h-full flex-shrink-0 flex flex-col items-center justify-center px-7 text-center relative" style="background:linear-gradient(180deg,#0f1520,#1a0f0a)">
          <div class="absolute -top-10 -right-16 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true"></div>
          <h2 class="text-[26px] font-bold text-white leading-tight mb-6 relative z-10">
            ${t('onboardingCTATitle')}
          </h2>
          <div class="w-full max-w-sm relative z-10">
            <div class="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
              <span class="text-4xl block mb-2">📍</span>
              <div class="text-[17px] font-bold text-white">${t('onboardingCTAAddSpot')}</div>
              <div class="text-[14px] text-slate-400 mt-1">${t('onboardingCTAAddSpotDesc')}</div>
            </div>
            <p class="text-[14px] text-slate-600 my-2">${t('onboardingCTAOr')}</p>
            <div class="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
              <span class="text-4xl block mb-2">🧭</span>
              <div class="text-[17px] font-bold text-white">${t('onboardingCTARoute')}</div>
              <div class="text-[14px] text-slate-400 mt-1">${t('onboardingCTARouteDesc')}</div>
            </div>
          </div>
          <button
            onclick="dismissLanding()"
            class="w-full max-w-sm py-4 rounded-2xl text-dark-primary font-bold text-lg shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] transition-colors duration-300 mt-6 relative z-10"
            style="background:linear-gradient(135deg,#f59e0b,#d97706)"
          >
            ${t('onboardingCTAGo')} →
          </button>
        </div>

      </div>

      <!-- Controls: dots + next -->
      <div class="absolute bottom-0 left-0 right-0 flex items-center justify-between px-7 pb-10 pt-4 z-10" style="background:linear-gradient(transparent,#0f1520)">
        <div id="landing-dots" class="flex gap-2">
          <div class="landing-dot w-6 h-2 rounded-full bg-primary-400 transition-colors duration-200" data-i="0"></div>
          <div class="landing-dot w-2 h-2 rounded-full bg-white/20 transition-colors duration-200" data-i="1"></div>
          <div class="landing-dot w-2 h-2 rounded-full bg-white/20 transition-colors duration-200" data-i="2"></div>
          <div class="landing-dot w-2 h-2 rounded-full bg-white/20 transition-colors duration-200" data-i="3"></div>
          <div class="landing-dot w-2 h-2 rounded-full bg-white/20 transition-colors duration-200" data-i="4"></div>
          <div class="landing-dot w-2 h-2 rounded-full bg-white/20 transition-colors duration-200" data-i="5"></div>
        </div>
        <button id="landing-next" onclick="landingNext()" class="text-primary-400 text-sm font-semibold">
          ${t('onboardingNext')} →
        </button>
      </div>

    </div>
  `
}

const TOTAL_SLIDES = 6
const SLIDE_WIDTH = 100 / TOTAL_SLIDES // 16.667%

export function initLandingCarousel() {
  let current = 0
  const track = document.getElementById('landing-track')
  const dots = document.querySelectorAll('.landing-dot')
  const nextBtn = document.getElementById('landing-next')
  if (!track || !dots.length) return

  function goTo(i) {
    current = Math.max(0, Math.min(i, TOTAL_SLIDES - 1))
    track.style.transform = `translateX(-${current * SLIDE_WIDTH}%)`
    dots.forEach((d, j) => {
      d.className = j === current
        ? 'landing-dot w-6 h-2 rounded-full bg-primary-400 transition-colors duration-200'
        : 'landing-dot w-2 h-2 rounded-full bg-white/20 transition-colors duration-200'
    })
    // Hide next button on last slide (CTA has its own button)
    if (nextBtn) nextBtn.style.display = current === TOTAL_SLIDES - 1 ? 'none' : ''
  }

  // Dot clicks
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.i)))

  // Next button
  window.landingNext = () => goTo(current + 1)

  // Touch swipe
  let tx = 0
  track.addEventListener('touchstart', e => { tx = e.touches[0].clientX }, { passive: true })
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx
    if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1))
  })
}

export default { renderLanding, initLandingCarousel }
