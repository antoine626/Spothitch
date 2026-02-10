/**
 * Error Boundary Utility
 * Catches and handles rendering errors gracefully
 */

import { showToast } from '../services/notifications.js';

// Error log for debugging
const errorLog = [];
const MAX_ERRORS = 50;

/**
 * Wrap a render function with error handling
 * @param {Function} renderFn - Render function to wrap
 * @param {string} componentName - Name of the component for error messages
 * @param {string} fallbackHtml - HTML to show on error
 * @returns {Function} Wrapped render function
 */
export function withErrorBoundary(renderFn, componentName, fallbackHtml = null) {
  return function safeRender(...args) {
    try {
      return renderFn(...args);
    } catch (error) {
      logError(componentName, error);
      console.error(`[${componentName}] Render error:`, error);

      // Return fallback UI
      return fallbackHtml || renderErrorFallback(componentName, error);
    }
  };
}

/**
 * Execute a function with error handling
 * @param {Function} fn - Function to execute
 * @param {string} context - Context for error messages
 * @param {*} fallbackValue - Value to return on error
 * @returns {*} Function result or fallback value
 */
export function safeExecute(fn, context, fallbackValue = null) {
  try {
    return fn();
  } catch (error) {
    logError(context, error);
    console.error(`[${context}] Execution error:`, error);
    return fallbackValue;
  }
}

/**
 * Execute an async function with error handling
 * @param {Function} asyncFn - Async function to execute
 * @param {string} context - Context for error messages
 * @param {*} fallbackValue - Value to return on error
 * @returns {Promise<*>} Function result or fallback value
 */
export async function safeExecuteAsync(asyncFn, context, fallbackValue = null) {
  try {
    return await asyncFn();
  } catch (error) {
    logError(context, error);
    console.error(`[${context}] Async execution error:`, error);
    return fallbackValue;
  }
}

/**
 * Render error fallback UI
 * @param {string} componentName - Name of the failed component
 * @param {Error} error - The error that occurred
 * @returns {string} Error fallback HTML
 */
function renderErrorFallback(componentName, error) {
  const isDev = import.meta.env.DEV;

  return `
    <div class="error-boundary p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl text-center">
      <div class="text-3xl mb-2">⚠️</div>
      <h3 class="font-bold text-danger-400">Une erreur est survenue</h3>
      <p class="text-sm text-slate-400 mt-1">Le composant "${componentName}" n'a pas pu se charger.</p>
      ${isDev ? `
        <details class="mt-3 text-left">
          <summary class="text-xs text-slate-500 cursor-pointer">Détails (dev only)</summary>
          <pre class="mt-2 p-2 bg-black/30 rounded text-xs text-red-400 overflow-auto max-h-32">${escapeForHtml(error.stack || error.message)}</pre>
        </details>
      ` : ''}
      <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm">
        Recharger la page
      </button>
    </div>
  `;
}

/**
 * Log error for later analysis
 * @param {string} context - Error context
 * @param {Error} error - The error
 */
function logError(context, error) {
  const entry = {
    context,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  errorLog.push(entry);

  // Keep only last N errors
  if (errorLog.length > MAX_ERRORS) {
    errorLog.shift();
  }

  // Send to Sentry if available
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      tags: { context },
    });
  }
}

/**
 * Get error log for debugging
 * @returns {Array} Error log entries
 */
export function getErrorLog() {
  return [...errorLog];
}

/**
 * Clear error log
 */
export function clearErrorLog() {
  errorLog.length = 0;
}

/**
 * Escape string for safe HTML display
 */
function escapeForHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers() {
  // Catch unhandled errors — log silently, no toast spam
  window.addEventListener('error', (event) => {
    logError('GlobalError', event.error || new Error(event.message))
  })

  // Catch unhandled promise rejections — log silently
  window.addEventListener('unhandledrejection', (event) => {
    logError('UnhandledRejection', event.reason || new Error('Promise rejected'))
  })
}

export default {
  withErrorBoundary,
  safeExecute,
  safeExecuteAsync,
  getErrorLog,
  clearErrorLog,
  setupGlobalErrorHandlers,
};
