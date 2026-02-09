// Event types constants
export const EVENT_TYPES = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_PROFILE_UPDATED: 'user_profile_updated',
  USER_FOLLOW: 'user_follow',
  USER_UNFOLLOW: 'user_unfollow',
  USER_BLOCKED: 'user_blocked',
  USER_UNBLOCKED: 'user_unblocked',
  SPOT_CREATED: 'spot_created',
  SPOT_UPDATED: 'spot_updated',
  SPOT_DELETED: 'spot_deleted',
  SPOT_VIEWED: 'spot_viewed',
  SPOT_VERIFIED: 'spot_verified',
  SPOT_MERGED: 'spot_merged',
  SPOT_CORRECTION_SUGGESTED: 'spot_correction_suggested',
  CHECKIN: 'checkin',
  CHECKIN_COMPLETED: 'checkin_completed',
  CHECKIN_SHARED: 'checkin_shared',
  LEVEL_UP: 'level_up',
  BADGE_EARNED: 'badge_earned',
  STREAK_UPDATED: 'streak_updated',
  POINTS_EARNED: 'points_earned',
  SEASONAL_REWARD: 'seasonal_reward',
  FRIEND_ADDED: 'friend_added',
  FRIEND_REMOVED: 'friend_removed',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_REACTION_ADDED: 'message_reaction_added',
  CALL_INCOMING: 'call_incoming',
  TRAVEL_MODE_ENABLED: 'travel_mode_enabled',
  TRAVEL_MODE_DISABLED: 'travel_mode_disabled',
  TRAVEL_DESTINATION_SET: 'travel_destination_set',
  TRAVEL_PROGRESS_UPDATED: 'travel_progress_updated',
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_CLICKED: 'notification_clicked',
  NOTIFICATION_DISMISSED: 'notification_dismissed',
  TAB_CHANGED: 'tab_changed',
  MODAL_OPENED: 'modal_opened',
  MODAL_CLOSED: 'modal_closed',
  THEME_CHANGED: 'theme_changed',
  LANGUAGE_CHANGED: 'language_changed',
  SYNC_STARTED: 'sync_started',
  SYNC_COMPLETED: 'sync_completed',
  SYNC_FAILED: 'sync_failed',
  OFFLINE: 'offline',
  ONLINE: 'online',
  ERROR: 'error',
  WARNING: 'warning',
  FEATURE_USED: 'feature_used',
  SEARCH_PERFORMED: 'search_performed',
  DEVICE_ROTATION: 'device_rotation',
  LOW_BATTERY: 'low_battery',
  LOCATION_CHANGED: 'location_changed'
}

class EventBus {
  constructor() {
    this.listeners = new Map()
    this.history = new Map()
    this.namespaces = new Map()
    this.debugMode = false
    this.asyncQueue = []
    this.historyLimit = 50
  }

  on(eventName, callback, options = {}) {
    if (typeof eventName !== 'string' || typeof callback !== 'function') {
      console.error('on: Invalid arguments', { eventName, callback })
      return () => {}
    }

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, [])
    }

    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
      id: Symbol('listener')
    }

    const listenerArray = this.listeners.get(eventName)
    listenerArray.push(listener)
    listenerArray.sort((a, b) => b.priority - a.priority)

    if (this.debugMode) {
      console.log(`[EventBus] Listener added: ${eventName}`, {
        listenerCount: listenerArray.length,
        priority: listener.priority
      })
    }

    return () => this.off(eventName, callback)
  }

  off(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      return
    }

    const listenerArray = this.listeners.get(eventName)
    const initialLength = listenerArray.length
    const filtered = listenerArray.filter(listener => listener.callback !== callback)
    this.listeners.set(eventName, filtered)

    if (filtered.length < initialLength && this.debugMode) {
      console.log(`[EventBus] Listener removed: ${eventName}`, {
        listenerCount: filtered.length
      })
    }

    if (filtered.length === 0) {
      this.listeners.delete(eventName)
    }
  }

  once(eventName, callback, options = {}) {
    return this.on(eventName, callback, { ...options, once: true })
  }

  emit(eventName, data) {
    if (typeof eventName !== 'string') {
      console.error('emit: Invalid event name', eventName)
      return 0
    }

    if (this.debugMode) {
      console.log(`[EventBus] Event emitted: ${eventName}`, data)
    }

    this._addToHistory(eventName, data)

    let callCount = 0

    // Get exact matches
    const exactListeners = this.listeners.get(eventName) || []
    const listenersToCall = []

    // Add exact matches with their event source
    for (const listener of exactListeners) {
      listenersToCall.push({ listener, fromWildcard: false })
    }

    // Get wildcard matches
    for (const [pattern, listeners] of this.listeners.entries()) {
      if (this._matchesWildcard(eventName, pattern) && pattern !== eventName) {
        for (const listener of listeners) {
          listenersToCall.push({ listener, fromWildcard: true })
        }
      }
    }

    // Sort by priority
    listenersToCall.sort((a, b) => b.listener.priority - a.listener.priority)

    // Execute listeners (allow duplicates from different sources - exact vs wildcard)
    for (const { listener } of listenersToCall) {
      try {
        listener.callback(data)
      } catch (error) {
        console.error(`Error in listener for ${eventName}:`, error)
        this.emit(EVENT_TYPES.ERROR, { event: eventName, error })
      }

      // Count after execution (whether successful or not)
      callCount++

      // Remove once-only listeners
      if (listener.once) {
        this.off(eventName, listener.callback)
      }
    }

    return callCount
  }

  async emitAsync(eventName, data) {
    return new Promise((resolve) => {
      setImmediate(() => {
        const count = this.emit(eventName, data)
        resolve(count)
      })
    })
  }

  onMultiple(eventNames, callback, options = {}) {
    if (!Array.isArray(eventNames) || typeof callback !== 'function') {
      console.error('onMultiple: Invalid arguments')
      return () => {}
    }

    const unsubscribers = eventNames.map(eventName => this.on(eventName, callback, options))

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  removeAllListeners(eventName) {
    if (eventName) {
      this.listeners.delete(eventName)
      if (this.debugMode) {
        console.log(`[EventBus] All listeners removed for: ${eventName}`)
      }
    } else {
      this.listeners.clear()
      if (this.debugMode) {
        console.log('[EventBus] All listeners removed')
      }
    }
  }

  offAll() {
    this.removeAllListeners()
  }

  getListenerCount(eventName) {
    return (this.listeners.get(eventName) || []).length
  }

  hasListeners(eventName) {
    return this.getListenerCount(eventName) > 0
  }

  getRegisteredEvents() {
    return Array.from(this.listeners.keys())
  }

  createNamespace(name) {
    if (!name || typeof name !== 'string') {
      console.error('createNamespace: Invalid namespace name')
      return null
    }

    const namespace = {
      on: (eventName, callback, options) => {
        const fullName = `${name}:${eventName}`
        return this.on(fullName, callback, options)
      },
      off: (eventName, callback) => {
        const fullName = `${name}:${eventName}`
        return this.off(fullName, callback)
      },
      once: (eventName, callback, options) => {
        const fullName = `${name}:${eventName}`
        return this.once(fullName, callback, options)
      },
      emit: (eventName, data) => {
        const fullName = `${name}:${eventName}`
        return this.emit(fullName, data)
      },
      emitAsync: (eventName, data) => {
        const fullName = `${name}:${eventName}`
        return this.emitAsync(fullName, data)
      },
      removeAllListeners: (eventName) => {
        if (eventName) {
          const fullName = `${name}:${eventName}`
          this.removeAllListeners(fullName)
        } else {
          const prefix = `${name}:`
          for (const eventName of this.getRegisteredEvents()) {
            if (eventName.startsWith(prefix)) {
              this.removeAllListeners(eventName)
            }
          }
        }
      },
      getListenerCount: (eventName) => {
        const fullName = `${name}:${eventName}`
        return this.getListenerCount(fullName)
      }
    }

    this.namespaces.set(name, namespace)
    return namespace
  }

  getEventHistory(eventName, limit = this.historyLimit) {
    if (eventName) {
      return (this.history.get(eventName) || []).slice(-limit)
    }

    const allEvents = []
    for (const events of this.history.values()) {
      allEvents.push(...events)
    }

    return allEvents.sort((a, b) => a.timestamp - b.timestamp).slice(-limit)
  }

  clearHistory(eventName) {
    if (eventName) {
      this.history.delete(eventName)
    } else {
      this.history.clear()
    }
  }

  enableDebugMode() {
    this.debugMode = true
    console.log('[EventBus] Debug mode enabled')
  }

  disableDebugMode() {
    this.debugMode = false
    console.log('[EventBus] Debug mode disabled')
  }

  isDebugEnabled() {
    return this.debugMode
  }

  getListenerInfo() {
    const info = {}
    for (const [eventName, listeners] of this.listeners.entries()) {
      info[eventName] = listeners.map(listener => ({
        priority: listener.priority,
        once: listener.once,
        isWildcard: eventName.includes('*')
      }))
    }
    return info
  }

  _addToHistory(eventName, data) {
    if (!this.history.has(eventName)) {
      this.history.set(eventName, [])
    }

    const events = this.history.get(eventName)
    events.push({
      eventName,
      data,
      timestamp: Date.now()
    })

    if (events.length > this.historyLimit) {
      events.shift()
    }
  }

  _matchesWildcard(eventName, pattern) {
    if (!pattern.includes('*')) {
      return eventName === pattern
    }

    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
    return regex.test(eventName)
  }
}

const eventBus = new EventBus()

export default eventBus

export {
  EventBus
}
