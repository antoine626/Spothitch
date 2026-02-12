/**
 * Skeleton Loading Components
 * Provides animated placeholder UI during content loading
 */

/**
 * Basic skeleton line element
 * @param {string} width - Width class (e.g., 'w-full', 'w-3/4')
 * @param {string} height - Height class (e.g., 'h-4', 'h-6')
 */
export function renderSkeletonLine(width = 'w-full', height = 'h-4') {
  return `
    <div class="skeleton ${width} ${height} rounded"></div>
  `;
}

/**
 * Skeleton circle (for avatars)
 * @param {string} size - Size class (e.g., 'w-10 h-10', 'w-12 h-12')
 */
export function renderSkeletonCircle(size = 'w-10 h-10') {
  return `
    <div class="skeleton ${size} rounded-full"></div>
  `;
}

/**
 * Skeleton spot card
 */
export function renderSkeletonSpotCard() {
  return `
    <div class="card p-4 animate-pulse">
      <div class="flex gap-4">
        <!-- Image placeholder -->
        <div class="skeleton w-24 h-24 rounded-xl shrink-0"></div>

        <div class="flex-1 space-y-3">
          <!-- Title -->
          <div class="skeleton h-5 w-3/4 rounded"></div>

          <!-- Subtitle -->
          <div class="skeleton h-4 w-1/2 rounded"></div>

          <!-- Rating & stats row -->
          <div class="flex gap-4">
            <div class="skeleton h-4 w-16 rounded"></div>
            <div class="skeleton h-4 w-16 rounded"></div>
            <div class="skeleton h-4 w-16 rounded"></div>
          </div>

          <!-- Tags -->
          <div class="flex gap-2">
            <div class="skeleton h-6 w-16 rounded-full"></div>
            <div class="skeleton h-6 w-20 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Skeleton spot list
 * @param {number} count - Number of skeleton cards to show
 */
export function renderSkeletonSpotList(count = 3) {
  return `
    <div class="space-y-4">
      ${Array(count).fill(0).map(() => renderSkeletonSpotCard()).join('')}
    </div>
  `;
}

/**
 * Skeleton badge card
 */
export function renderSkeletonBadgeCard() {
  return `
    <div class="card p-4 text-center animate-pulse">
      <div class="skeleton w-16 h-16 rounded-full mx-auto mb-3"></div>
      <div class="skeleton h-4 w-20 rounded mx-auto mb-2"></div>
      <div class="skeleton h-3 w-24 rounded mx-auto"></div>
    </div>
  `;
}

/**
 * Skeleton badge grid
 * @param {number} count - Number of skeleton badges
 */
export function renderSkeletonBadgeGrid(count = 6) {
  return `
    <div class="grid grid-cols-3 gap-4">
      ${Array(count).fill(0).map(() => renderSkeletonBadgeCard()).join('')}
    </div>
  `;
}

/**
 * Skeleton challenge card
 */
export function renderSkeletonChallengeCard() {
  return `
    <div class="card p-4 animate-pulse">
      <div class="flex items-center gap-4">
        <div class="skeleton w-12 h-12 rounded-xl shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="skeleton h-5 w-3/4 rounded"></div>
          <div class="skeleton h-3 w-full rounded"></div>
          <div class="skeleton h-2 w-full rounded-full"></div>
        </div>
        <div class="skeleton h-8 w-16 rounded-lg"></div>
      </div>
    </div>
  `;
}

/**
 * Skeleton chat message
 * @param {boolean} isOwn - Whether this is own message (right aligned)
 */
export function renderSkeletonChatMessage(isOwn = false) {
  return `
    <div class="flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} animate-pulse">
      <div class="skeleton w-10 h-10 rounded-full shrink-0"></div>
      <div class="space-y-2 ${isOwn ? 'items-end' : 'items-start'}">
        <div class="skeleton h-4 w-20 rounded"></div>
        <div class="skeleton h-16 w-48 rounded-2xl"></div>
        <div class="skeleton h-3 w-12 rounded"></div>
      </div>
    </div>
  `;
}

/**
 * Skeleton chat list
 * @param {number} count - Number of messages
 */
export function renderSkeletonChatList(count = 5) {
  return `
    <div class="space-y-4 p-4">
      ${Array(count).fill(0).map((_, i) => renderSkeletonChatMessage(i % 3 === 0)).join('')}
    </div>
  `;
}

/**
 * Skeleton leaderboard row
 */
export function renderSkeletonLeaderboardRow() {
  return `
    <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl animate-pulse">
      <div class="skeleton w-8 h-6 rounded"></div>
      <div class="skeleton w-10 h-10 rounded-full"></div>
      <div class="flex-1 space-y-2">
        <div class="skeleton h-4 w-24 rounded"></div>
        <div class="skeleton h-3 w-16 rounded"></div>
      </div>
      <div class="skeleton h-6 w-16 rounded"></div>
    </div>
  `;
}

/**
 * Skeleton leaderboard list
 * @param {number} count - Number of rows
 */
export function renderSkeletonLeaderboardList(count = 10) {
  return `
    <div class="space-y-2">
      ${Array(count).fill(0).map(() => renderSkeletonLeaderboardRow()).join('')}
    </div>
  `;
}

/**
 * Skeleton profile stats
 */
export function renderSkeletonProfileStats() {
  return `
    <div class="grid grid-cols-3 gap-4 animate-pulse">
      ${Array(3).fill(0).map(() => `
        <div class="card p-4 text-center">
          <div class="skeleton h-8 w-16 rounded mx-auto mb-2"></div>
          <div class="skeleton h-3 w-12 rounded mx-auto"></div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Skeleton friend card
 */
export function renderSkeletonFriendCard() {
  return `
    <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl animate-pulse">
      <div class="skeleton w-12 h-12 rounded-full"></div>
      <div class="flex-1 space-y-2">
        <div class="skeleton h-4 w-24 rounded"></div>
        <div class="skeleton h-3 w-32 rounded"></div>
      </div>
      <div class="skeleton h-8 w-8 rounded-full"></div>
    </div>
  `;
}

/**
 * Skeleton trip step
 */
export function renderSkeletonTripStep() {
  return `
    <div class="flex items-center gap-3 p-3 animate-pulse">
      <div class="skeleton w-8 h-8 rounded-full"></div>
      <div class="flex-1 space-y-2">
        <div class="skeleton h-4 w-32 rounded"></div>
        <div class="skeleton h-3 w-48 rounded"></div>
      </div>
      <div class="skeleton h-6 w-6 rounded"></div>
    </div>
  `;
}

/**
 * Skeleton map markers loading indicator
 */
export function renderSkeletonMapLoading() {
  return `
    <div class="absolute inset-0 flex items-center justify-center bg-black/50 z-10 animate-pulse">
      <div class="text-center">
        <div class="skeleton w-16 h-16 rounded-full mx-auto mb-4"></div>
        <div class="skeleton h-4 w-32 rounded mx-auto"></div>
      </div>
    </div>
  `;
}

/**
 * Skeleton guide card
 */
export function renderSkeletonGuideCard() {
  return `
    <div class="card p-4 animate-pulse">
      <div class="flex gap-4">
        <div class="skeleton w-16 h-12 rounded-lg shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="skeleton h-5 w-24 rounded"></div>
          <div class="skeleton h-4 w-full rounded"></div>
          <div class="skeleton h-4 w-3/4 rounded"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Skeleton reward card (shop item)
 */
export function renderSkeletonRewardCard() {
  return `
    <div class="card p-4 text-center animate-pulse">
      <div class="skeleton w-16 h-16 rounded-xl mx-auto mb-3"></div>
      <div class="skeleton h-4 w-20 rounded mx-auto mb-2"></div>
      <div class="skeleton h-3 w-24 rounded mx-auto mb-3"></div>
      <div class="skeleton h-8 w-full rounded-lg"></div>
    </div>
  `;
}

/**
 * Full page loading skeleton
 */
export function renderFullPageSkeleton() {
  return `
    <div class="p-4 space-y-4 animate-pulse">
      <!-- Header skeleton -->
      <div class="flex justify-between items-center mb-6">
        <div class="skeleton h-8 w-32 rounded"></div>
        <div class="skeleton w-10 h-10 rounded-full"></div>
      </div>

      <!-- Stats row -->
      ${renderSkeletonProfileStats()}

      <!-- Content sections -->
      <div class="space-y-4 mt-6">
        ${renderSkeletonSpotCard()}
        ${renderSkeletonSpotCard()}
        ${renderSkeletonSpotCard()}
      </div>
    </div>
  `;
}

export default {
  renderSkeletonLine,
  renderSkeletonCircle,
  renderSkeletonSpotCard,
  renderSkeletonSpotList,
  renderSkeletonBadgeCard,
  renderSkeletonBadgeGrid,
  renderSkeletonChallengeCard,
  renderSkeletonChatMessage,
  renderSkeletonChatList,
  renderSkeletonLeaderboardRow,
  renderSkeletonLeaderboardList,
  renderSkeletonProfileStats,
  renderSkeletonFriendCard,
  renderSkeletonTripStep,
  renderSkeletonMapLoading,
  renderSkeletonGuideCard,
  renderSkeletonRewardCard,
  renderFullPageSkeleton,
};
