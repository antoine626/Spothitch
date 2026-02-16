/**
 * Landing Page Component
 * Full-screen landing page for first-time visitors.
 * Shown once, then dismissed forever via localStorage flag.
 */

import { t } from '../i18n/index.js'
import { icon } from '../utils/icons.js'

export function renderLanding() {
  return `
    <div id="landing-page" class="fixed inset-0 z-[100] bg-dark-primary overflow-y-auto overflow-x-hidden scroll-smooth">

      <!-- Hero Section -->
      <section class="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden">
        <!-- Animated background gradient orbs -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div class="absolute -top-40 -left-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl animate-pulse" style="animation-delay:1s"></div>
          <div class="absolute top-1/3 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay:2s"></div>
        </div>

        <!-- Content -->
        <div class="relative z-10 max-w-2xl mx-auto">
          <!-- Logo -->
          <div class="mb-8 flex items-center justify-center gap-3">
            <span class="text-5xl">&#129305;</span>
            <h1 class="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              SpotHitch
            </h1>
          </div>

          <!-- Title -->
          <h2 class="text-2xl md:text-5xl font-bold text-white mb-6 leading-tight">
            ${t('landingHeroTitle')}
          </h2>

          <!-- Subtitle -->
          <p class="text-lg md:text-xl text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed">
            ${t('landingHeroSubtitle')}
          </p>

          <!-- CTA Button -->
          <button
            onclick="dismissLanding()"
            class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105 transition-all duration-300"
            style="background:linear-gradient(135deg,#f59e0b,#d97706)"
          >
            ${icon('rocket', 'w-5 h-5')}
            ${t('landingGetStarted')}
          </button>

          <!-- Scroll hint -->
          <div class="mt-16 text-slate-400 animate-bounce">
            ${icon('chevron-down', 'w-7 h-7')}
          </div>
        </div>

        <!-- Map illustration (CSS only) -->
        <div class="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" aria-hidden="true"
             style="background:linear-gradient(to top,#0f1520,transparent)"></div>
      </section>

      <!-- Features Section -->
      <section class="px-6 py-20 max-w-5xl mx-auto">
        <h3 class="text-2xl md:text-3xl font-bold text-center text-white mb-4">
          ${t('landingFeaturesTitle')}
        </h3>
        <p class="text-slate-400 text-center mb-12 max-w-xl mx-auto">
          ${t('landingFeaturesSubtitle')}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${renderFeatureCard(
            'fa-map-marked-alt',
            'primary',
            t('landingFeatureMapTitle'),
            t('landingFeatureMapDesc')
          )}
          ${renderFeatureCard(
            'fa-route',
            'emerald',
            t('landingFeatureRouteTitle'),
            t('landingFeatureRouteDesc')
          )}
          ${renderFeatureCard(
            'fa-users',
            'violet',
            t('landingFeatureCommunityTitle'),
            t('landingFeatureCommunityDesc')
          )}
          ${renderFeatureCard(
            'fa-trophy',
            'amber',
            t('landingFeatureGamificationTitle'),
            t('landingFeatureGamificationDesc')
          )}
        </div>
      </section>

      <!-- Stats Section -->
      <section class="px-6 py-20 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-primary-900/30 via-primary-800/20 to-primary-900/30 pointer-events-none" aria-hidden="true"></div>
        <div class="relative z-10 max-w-4xl mx-auto">
          <h3 class="text-2xl md:text-3xl font-bold text-center text-white mb-12">
            ${t('landingStatsTitle')}
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            ${renderStatCard('37,000+', t('landingStatsSpots'), 'fa-map-pin', 'primary')}
            ${renderStatCard('170', t('landingStatsCountries'), 'fa-globe-americas', 'emerald')}
            ${renderStatCard('71,000+', t('landingStatsReviews'), 'fa-star', 'amber')}
            ${renderStatCard('4', t('landingStatsLanguages'), 'fa-language', 'violet')}
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="px-6 py-20 max-w-4xl mx-auto">
        <h3 class="text-2xl md:text-3xl font-bold text-center text-white mb-4">
          ${t('landingHowTitle')}
        </h3>
        <p class="text-slate-400 text-center mb-12 max-w-xl mx-auto">
          ${t('landingHowSubtitle')}
        </p>

        <div class="flex flex-col md:flex-row gap-8 items-stretch">
          ${renderStepCard('1', t('landingStep1Title'), t('landingStep1Desc'), 'fa-search-location')}
          ${renderStepCard('2', t('landingStep2Title'), t('landingStep2Desc'), 'fa-clipboard-check')}
          ${renderStepCard('3', t('landingStep3Title'), t('landingStep3Desc'), 'fa-share-alt')}
        </div>
      </section>

      <!-- Final CTA Section -->
      <section class="px-6 py-24 text-center relative overflow-hidden">
        <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        </div>

        <div class="relative z-10 max-w-xl mx-auto">
          <h3 class="text-3xl md:text-4xl font-bold text-white mb-6">
            ${t('landingCtaTitle')}
          </h3>
          <p class="text-lg text-slate-300 mb-10">
            ${t('landingCtaSubtitle')}
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onclick="dismissLanding()"
              class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105 transition-all duration-300"
              style="background:linear-gradient(135deg,#f59e0b,#d97706)"
            >
              ${icon('compass', 'w-5 h-5')}
              ${t('landingStartExploring')}
            </button>

            <button
              onclick="installPWAFromLanding()"
              id="landing-install-btn"
              class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-primary-400 font-bold text-lg border-2 border-primary-500/30 hover:border-primary-500/60 hover:bg-primary-500/10 hover:scale-105 transition-all duration-300"
            >
              ${icon('mobile-alt', 'w-5 h-5')}
              ${t('landingInstallApp')}
            </button>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="px-6 py-8 border-t border-white/5 text-center">
        <p class="text-slate-400 text-sm">
          ${t('landingFooter')}
        </p>
      </footer>

    </div>
  `
}

function renderFeatureCard(iconName, color, title, desc) {
  const colorMap = {
    primary: { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  }
  const c = colorMap[color] || colorMap.primary

  return `
    <div class="p-6 rounded-2xl bg-white/[0.03] border ${c.border} hover:bg-white/[0.06] transition-all duration-300 group">
      <div class="w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        ${icon(iconName, `w-6 h-6 ${c.text}`)}
      </div>
      <h4 class="text-lg font-bold text-white mb-2">${title}</h4>
      <p class="text-slate-400 text-sm leading-relaxed">${desc}</p>
    </div>
  `
}

function renderStatCard(number, label, iconName, color) {
  const colorMap = {
    primary: 'text-primary-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    violet: 'text-violet-400',
  }
  const textColor = colorMap[color] || colorMap.primary

  return `
    <div class="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/5">
      ${icon(iconName, `w-7 h-7 ${textColor} mb-3`)}
      <div class="text-3xl md:text-4xl font-bold text-white mb-1">${number}</div>
      <div class="text-slate-400 text-sm">${label}</div>
    </div>
  `
}

function renderStepCard(number, title, desc, iconName) {
  return `
    <div class="flex-1 text-center p-6 rounded-2xl bg-white/[0.03] border border-white/5 relative">
      <div class="w-12 h-12 rounded-full bg-primary-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
        ${number}
      </div>
      ${icon(iconName, 'w-7 h-7 text-slate-400 mb-3')}
      <h4 class="text-lg font-bold text-white mb-2">${title}</h4>
      <p class="text-slate-400 text-sm leading-relaxed">${desc}</p>
    </div>
  `
}

export default { renderLanding }
