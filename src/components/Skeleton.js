/**
 * Skeleton Loading Components
 * Placeholder UI while content loads
 */

/**
 * Render skeleton spot card
 */
export function renderSkeletonSpotCard() {
  return `
    <article class="card overflow-hidden animate-pulse">
      <!-- Photo skeleton -->
      <div class="h-40 bg-white/10"></div>

      <!-- Content skeleton -->
      <div class="p-4">
        <div class="h-6 bg-white/10 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-white/10 rounded w-full mb-2"></div>
        <div class="h-4 bg-white/10 rounded w-2/3 mb-3"></div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-5 bg-white/10 rounded w-12"></div>
            <div class="h-5 bg-white/10 rounded w-16"></div>
          </div>
          <div class="h-5 bg-white/10 rounded w-16"></div>
        </div>
      </div>
    </article>
  `;
}

/**
 * Render skeleton list of spot cards
 * @param {number} count - Number of skeleton cards
 */
export function renderSkeletonList(count = 3) {
  return Array(count).fill(null).map(() => renderSkeletonSpotCard()).join('');
}

/**
 * Render skeleton compact card
 */
export function renderSkeletonCompactCard() {
  return `
    <article class="card p-3 flex gap-3 animate-pulse">
      <div class="w-16 h-16 rounded-xl bg-white/10 shrink-0"></div>
      <div class="flex-1">
        <div class="h-5 bg-white/10 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-white/10 rounded w-1/2"></div>
      </div>
    </article>
  `;
}

/**
 * Render skeleton map placeholder
 */
export function renderSkeletonMap() {
  return `
    <div class="h-full w-full bg-dark-secondary flex items-center justify-center animate-pulse">
      <div class="text-center">
        <div class="w-16 h-16 rounded-full bg-white/10 mx-auto mb-4 flex items-center justify-center">
          <i class="fas fa-map-marked-alt text-2xl text-white/20"></i>
        </div>
        <div class="h-4 bg-white/10 rounded w-32 mx-auto mb-2"></div>
        <div class="h-3 bg-white/10 rounded w-24 mx-auto"></div>
      </div>
    </div>
  `;
}

/**
 * Render skeleton chat messages
 * @param {number} count - Number of skeleton messages
 */
export function renderSkeletonMessages(count = 5) {
  return Array(count).fill(null).map((_, i) => {
    const isOwn = i % 3 === 0;
    return `
      <div class="flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} animate-pulse">
        <div class="w-8 h-8 rounded-full bg-white/10 shrink-0"></div>
        <div class="${isOwn ? 'items-end' : 'items-start'} flex flex-col">
          <div class="h-3 bg-white/10 rounded w-16 mb-1"></div>
          <div class="p-3 rounded-xl bg-white/10 ${isOwn ? 'rounded-tr-none' : 'rounded-tl-none'}">
            <div class="h-4 bg-white/20 rounded w-32 mb-1"></div>
            ${i % 2 === 0 ? '<div class="h-4 bg-white/20 rounded w-20"></div>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render skeleton badge grid
 * @param {number} count - Number of skeleton badges
 */
export function renderSkeletonBadges(count = 6) {
  return `
    <div class="grid grid-cols-3 gap-3">
      ${Array(count).fill(null).map(() => `
        <div class="card p-4 text-center animate-pulse">
          <div class="w-12 h-12 rounded-full bg-white/10 mx-auto mb-2"></div>
          <div class="h-4 bg-white/10 rounded w-3/4 mx-auto mb-1"></div>
          <div class="h-3 bg-white/10 rounded w-1/2 mx-auto"></div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render skeleton profile section
 */
export function renderSkeletonProfile() {
  return `
    <div class="animate-pulse">
      <!-- Avatar -->
      <div class="text-center mb-6">
        <div class="w-24 h-24 rounded-full bg-white/10 mx-auto mb-3"></div>
        <div class="h-6 bg-white/10 rounded w-32 mx-auto mb-2"></div>
        <div class="h-4 bg-white/10 rounded w-24 mx-auto"></div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        ${Array(3).fill(null).map(() => `
          <div class="card p-3 text-center">
            <div class="h-8 bg-white/10 rounded w-12 mx-auto mb-1"></div>
            <div class="h-3 bg-white/10 rounded w-16 mx-auto"></div>
          </div>
        `).join('')}
      </div>

      <!-- Menu items -->
      <div class="space-y-2">
        ${Array(4).fill(null).map(() => `
          <div class="card p-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-white/10"></div>
            <div class="flex-1">
              <div class="h-5 bg-white/10 rounded w-1/3 mb-1"></div>
              <div class="h-3 bg-white/10 rounded w-2/3"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render skeleton reward card
 */
export function renderSkeletonReward() {
  return `
    <div class="card p-4 animate-pulse">
      <div class="flex gap-4">
        <div class="w-16 h-16 rounded-xl bg-white/10 shrink-0"></div>
        <div class="flex-1">
          <div class="h-5 bg-white/10 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-white/10 rounded w-1/2 mb-2"></div>
          <div class="h-4 bg-white/10 rounded w-full mb-2"></div>
          <div class="flex items-center justify-between">
            <div class="h-5 bg-white/10 rounded w-20"></div>
            <div class="h-8 bg-white/10 rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generic loading spinner
 */
export function renderLoadingSpinner(size = 'md', text = '') {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return `
    <div class="flex flex-col items-center justify-center py-8">
      <div class="${sizeClasses[size] || sizeClasses.md} border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      ${text ? `<p class="mt-3 text-slate-400 text-sm">${text}</p>` : ''}
    </div>
  `;
}

export default {
  renderSkeletonSpotCard,
  renderSkeletonList,
  renderSkeletonCompactCard,
  renderSkeletonMap,
  renderSkeletonMessages,
  renderSkeletonBadges,
  renderSkeletonProfile,
  renderSkeletonReward,
  renderLoadingSpinner,
};
