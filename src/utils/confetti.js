/**
 * Confetti Animation System
 * Creates celebratory confetti effects for achievements
 */

// Confetti configuration
const CONFETTI_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899'];
const CONFETTI_SHAPES = ['square', 'circle', 'triangle'];

/**
 * Create a single confetti particle
 */
function createConfettiParticle(container, x, y) {
  const particle = document.createElement('div');
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const shape = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)];
  const size = Math.random() * 10 + 5;
  const velocity = Math.random() * 3 + 2;
  const spin = (Math.random() - 0.5) * 10;

  particle.className = 'confetti-particle';
  particle.style.cssText = `
    position: fixed;
    width: ${size}px;
    height: ${size}px;
    background: ${color};
    left: ${x}px;
    top: ${y}px;
    pointer-events: none;
    z-index: 9999;
    ${shape === 'circle' ? 'border-radius: 50%;' : ''}
    ${shape === 'triangle' ? `
      width: 0;
      height: 0;
      background: transparent;
      border-left: ${size/2}px solid transparent;
      border-right: ${size/2}px solid transparent;
      border-bottom: ${size}px solid ${color};
    ` : ''}
  `;

  container.appendChild(particle);

  // Animate the particle
  let posX = x;
  let posY = y;
  let rotation = 0;
  let velocityY = -velocity * 3;
  const velocityX = (Math.random() - 0.5) * velocity * 2;
  const gravity = 0.1;

  function animate() {
    velocityY += gravity;
    posX += velocityX;
    posY += velocityY;
    rotation += spin;

    particle.style.left = `${posX}px`;
    particle.style.top = `${posY}px`;
    particle.style.transform = `rotate(${rotation}deg)`;
    particle.style.opacity = Math.max(0, 1 - posY / window.innerHeight);

    if (posY < window.innerHeight && particle.style.opacity > 0) {
      requestAnimationFrame(animate);
    } else {
      particle.remove();
    }
  }

  requestAnimationFrame(animate);
}

/**
 * Launch confetti from a point
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} count - Number of particles
 */
export function launchConfetti(x, y, count = 50) {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  container.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 9999;';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      createConfettiParticle(container, x + (Math.random() - 0.5) * 20, y);
    }, i * 10);
  }

  // Cleanup container after animation
  setTimeout(() => container.remove(), 5000);
}

/**
 * Launch confetti from center of screen
 * @param {number} count - Number of particles
 */
function launchCenterConfetti(count = 100) {
  const x = window.innerWidth / 2;
  const y = window.innerHeight / 2;
  launchConfetti(x, y, count);
}

/**
 * Launch confetti burst (multiple points)
 */
export function launchConfettiBurst() {
  const points = [
    { x: window.innerWidth * 0.2, y: window.innerHeight * 0.8 },
    { x: window.innerWidth * 0.5, y: window.innerHeight * 0.6 },
    { x: window.innerWidth * 0.8, y: window.innerHeight * 0.8 },
  ];

  points.forEach((point, i) => {
    setTimeout(() => launchConfetti(point.x, point.y, 30), i * 100);
  });
}

/**
 * Create floating emoji animation
 * @param {string} emoji - Emoji to animate
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function floatingEmoji(emoji, x, y) {
  const element = document.createElement('div');
  element.textContent = emoji;
  element.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    font-size: 2rem;
    pointer-events: none;
    z-index: 9999;
    animation: floatUp 1.5s ease-out forwards;
  `;
  document.body.appendChild(element);

  setTimeout(() => element.remove(), 1500);
}

/**
 * Create multiple floating emojis
 * @param {string} emoji - Emoji to animate
 * @param {number} count - Number of emojis
 */
export function floatingEmojisBurst(emoji, count = 5) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const x = centerX + (Math.random() - 0.5) * 100;
      const y = centerY + (Math.random() - 0.5) * 50;
      floatingEmoji(emoji, x, y);
    }, i * 100);
  }
}

// Add required CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes floatUp {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-100px) scale(1.5);
    }
  }
`;
document.head.appendChild(style);

export default {
  launchConfetti,
  launchCenterConfetti,
  launchConfettiBurst,
  floatingEmoji,
  floatingEmojisBurst,
};
