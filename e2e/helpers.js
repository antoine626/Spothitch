/**
 * E2E Test Helpers
 */

/**
 * Skip onboarding and tutorial for returning user experience
 * @param {import('@playwright/test').Page} page
 */
export async function skipOnboarding(page) {
  await page.goto('/');

  // Set localStorage to skip welcome screen and tutorial - uses spothitch_v4_state key
  await page.evaluate(() => {
    const state = {
      showWelcome: false,
      showTutorial: false,
      tutorialStep: 0,
      username: 'TestUser',
      avatar: '🤙',
      activeTab: 'map',
      theme: 'dark',
      lang: 'fr',
      points: 100,
      level: 2,
      badges: ['first_spot'],
      rewards: [],
      savedTrips: [],
      emergencyContacts: []
    };
    localStorage.setItem('spothitch_v4_state', JSON.stringify(state));
  });

  // Reload to apply
  await page.reload();
  await page.waitForSelector('#app.loaded', { timeout: 15000 });
}

/**
 * Navigate to a specific tab
 * @param {import('@playwright/test').Page} page
 * @param {string} tabId - Tab ID: map, travel, challenges, social, profile
 */
export async function navigateToTab(page, tabId) {
  await page.click(`[data-tab="${tabId}"]`);
  await page.waitForTimeout(500);
}
