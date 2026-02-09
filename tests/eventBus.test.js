import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import eventBus, { EventBus, EVENT_TYPES } from '../src/services/eventBus'

describe('EventBus', () => {
  let bus

  beforeEach(() => {
    bus = new EventBus()
  })

  afterEach(() => {
    bus.offAll()
    bus.clearHistory()
  })

  describe('Basic on/off/emit', () => {
    it('should subscribe and emit events', () => {
      const callback = vi.fn()
      bus.on('test_event', callback)
      bus.emit('test_event', { data: 'hello' })

      expect(callback).toHaveBeenCalledWith({ data: 'hello' })
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should unsubscribe from events', () => {
      const callback = vi.fn()
      bus.on('test_event', callback)
      bus.off('test_event', callback)
      bus.emit('test_event', {})

      expect(callback).not.toHaveBeenCalled()
    })

    it('should return unsubscribe function from on()', () => {
      const callback = vi.fn()
      const unsubscribe = bus.on('test_event', callback)
      bus.emit('test_event', {})

      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()
      bus.emit('test_event', {})

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should emit to multiple listeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()

      bus.on('test_event', callback1)
      bus.on('test_event', callback2)
      bus.on('test_event', callback3)

      bus.emit('test_event', { id: 1 })

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
      expect(callback3).toHaveBeenCalled()
    })

    it('should return listener count', () => {
      expect(bus.getListenerCount('test')).toBe(0)

      bus.on('test', () => {})
      expect(bus.getListenerCount('test')).toBe(1)

      bus.on('test', () => {})
      expect(bus.getListenerCount('test')).toBe(2)
    })

    it('should emit returns count of listeners called', () => {
      bus.on('event', () => {})
      bus.on('event', () => {})
      const count = bus.emit('event', {})
      expect(count).toBe(2)
    })
  })

  describe('once() functionality', () => {
    it('should unsubscribe after first emission', () => {
      const callback = vi.fn()
      bus.once('test_event', callback)

      bus.emit('test_event', {})
      bus.emit('test_event', {})
      bus.emit('test_event', {})

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should work with once option in on()', () => {
      const callback = vi.fn()
      bus.on('test_event', callback, { once: true })

      bus.emit('test_event', {})
      bus.emit('test_event', {})

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should still return unsubscribe function for once', () => {
      const callback = vi.fn()
      const unsubscribe = bus.once('test_event', callback)

      unsubscribe()
      bus.emit('test_event', {})

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Priority ordering', () => {
    it('should execute listeners in priority order', () => {
      const order = []

      bus.on('event', () => order.push(1), { priority: 1 })
      bus.on('event', () => order.push(0), { priority: 0 })
      bus.on('event', () => order.push(10), { priority: 10 })
      bus.on('event', () => order.push(5), { priority: 5 })

      bus.emit('event', {})

      expect(order).toEqual([10, 5, 1, 0])
    })

    it('should default priority to 0', () => {
      const order = []

      bus.on('event', () => order.push(1), { priority: 1 })
      bus.on('event', () => order.push(0)) // default priority
      bus.on('event', () => order.push(2), { priority: 2 })

      bus.emit('event', {})

      expect(order).toEqual([2, 1, 0])
    })

    it('should handle negative priorities', () => {
      const order = []

      bus.on('event', () => order.push(1))
      bus.on('event', () => order.push(-1), { priority: -1 })
      bus.on('event', () => order.push(5), { priority: 5 })

      bus.emit('event', {})

      expect(order).toEqual([5, 1, -1])
    })
  })

  describe('Wildcard support', () => {
    it('should listen to wildcard patterns', () => {
      const callback = vi.fn()
      bus.on('user.*', callback)

      bus.emit('user.login', {})
      bus.emit('user.logout', {})
      bus.emit('user.update', {})
      bus.emit('admin.login', {})

      expect(callback).toHaveBeenCalledTimes(3)
    })

    it('should support multiple wildcards', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      bus.on('user.*', callback1)
      bus.on('*.login', callback2)

      const count = bus.emit('user.login', {})

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
      expect(count).toBe(2)
    })

    it('should trigger from both direct and wildcard', () => {
      const callback = vi.fn()

      bus.on('user.*', callback)
      bus.on('user.login', callback) // This creates separate listener

      bus.emit('user.login', {})

      // Called twice: once from exact match, once from wildcard
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('should match complex patterns', () => {
      const callback = vi.fn()
      bus.on('*.*.created', callback)

      bus.emit('spot.place.created', {})
      bus.emit('user.group.created', {})
      bus.emit('spot.created', {})

      // All three match because .* matches any sequence including dots
      expect(callback).toHaveBeenCalledTimes(3)
    })
  })

  describe('onMultiple()', () => {
    it('should listen to multiple events with same callback', () => {
      const callback = vi.fn()
      bus.onMultiple(['event1', 'event2', 'event3'], callback)

      bus.emit('event1', { id: 1 })
      bus.emit('event2', { id: 2 })
      bus.emit('event3', { id: 3 })

      expect(callback).toHaveBeenCalledTimes(3)
      expect(callback).toHaveBeenNthCalledWith(1, { id: 1 })
      expect(callback).toHaveBeenNthCalledWith(2, { id: 2 })
      expect(callback).toHaveBeenNthCalledWith(3, { id: 3 })
    })

    it('should return unsubscribe function for multiple', () => {
      const callback = vi.fn()
      const unsubscribe = bus.onMultiple(['event1', 'event2'], callback)

      bus.emit('event1', {})
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()

      bus.emit('event1', {})
      bus.emit('event2', {})

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should work with options', () => {
      const callback = vi.fn()
      bus.onMultiple(['event1', 'event2'], callback, { priority: 5 })

      bus.emit('event1', {})
      bus.emit('event2', {})

      expect(callback).toHaveBeenCalledTimes(2)
    })
  })

  describe('removeAllListeners()', () => {
    it('should remove all listeners for specific event', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      bus.on('event', callback1)
      bus.on('event', callback2)

      expect(bus.getListenerCount('event')).toBe(2)

      bus.removeAllListeners('event')

      expect(bus.getListenerCount('event')).toBe(0)
      bus.emit('event', {})

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })

    it('should remove all listeners for all events', () => {
      bus.on('event1', () => {})
      bus.on('event2', () => {})
      bus.on('event3', () => {})

      expect(bus.getRegisteredEvents().length).toBe(3)

      bus.removeAllListeners()

      expect(bus.getRegisteredEvents().length).toBe(0)
    })

    it('offAll() should be alias for removeAllListeners()', () => {
      bus.on('event1', () => {})
      bus.on('event2', () => {})

      bus.offAll()

      expect(bus.getRegisteredEvents().length).toBe(0)
    })
  })

  describe('hasListeners()', () => {
    it('should return true if event has listeners', () => {
      expect(bus.hasListeners('event')).toBe(false)

      bus.on('event', () => {})

      expect(bus.hasListeners('event')).toBe(true)
    })

    it('should return false after removing all listeners', () => {
      bus.on('event', () => {})
      expect(bus.hasListeners('event')).toBe(true)

      bus.removeAllListeners('event')

      expect(bus.hasListeners('event')).toBe(false)
    })
  })

  describe('getRegisteredEvents()', () => {
    it('should return array of registered events', () => {
      bus.on('event1', () => {})
      bus.on('event2', () => {})
      bus.on('event3', () => {})

      const events = bus.getRegisteredEvents()

      expect(events).toContain('event1')
      expect(events).toContain('event2')
      expect(events).toContain('event3')
      expect(events.length).toBe(3)
    })

    it('should return empty array if no events', () => {
      expect(bus.getRegisteredEvents()).toEqual([])
    })
  })

  describe('Namespaces', () => {
    it('should create a namespace', () => {
      const ns = bus.createNamespace('module1')

      expect(ns).not.toBeNull()
      expect(typeof ns.on).toBe('function')
      expect(typeof ns.off).toBe('function')
      expect(typeof ns.emit).toBe('function')
    })

    it('should prefix events with namespace', () => {
      const callback = vi.fn()
      const ns = bus.createNamespace('chat')

      ns.on('message', callback)
      ns.emit('message', { text: 'hello' })

      expect(callback).toHaveBeenCalledWith({ text: 'hello' })
    })

    it('should not conflict between namespaces', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const ns1 = bus.createNamespace('module1')
      const ns2 = bus.createNamespace('module2')

      ns1.on('event', callback1)
      ns2.on('event', callback2)

      ns1.emit('event', { id: 1 })

      expect(callback1).toHaveBeenCalledWith({ id: 1 })
      expect(callback2).not.toHaveBeenCalled()
    })

    it('should support namespace removeAllListeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const ns = bus.createNamespace('module')

      ns.on('event1', callback1)
      ns.on('event2', callback2)

      ns.removeAllListeners('event1')

      ns.emit('event1', {})
      ns.emit('event2', {})

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    it('should support namespace getListenerCount', () => {
      const ns = bus.createNamespace('module')

      ns.on('event', () => {})
      ns.on('event', () => {})

      expect(ns.getListenerCount('event')).toBe(2)
    })

    it('should clear all namespace listeners', () => {
      const callback = vi.fn()
      const ns = bus.createNamespace('module')

      ns.on('event1', callback)
      ns.on('event2', callback)

      ns.removeAllListeners()

      ns.emit('event1', {})
      ns.emit('event2', {})

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('emitAsync()', () => {
    it('should emit asynchronously', async () => {
      const callback = vi.fn()
      bus.on('event', callback)

      const promise = bus.emitAsync('event', { async: true })

      expect(callback).not.toHaveBeenCalled()

      const count = await promise

      expect(count).toBe(1)
      expect(callback).toHaveBeenCalled()
    })

    it('should return promise that resolves with listener count', async () => {
      bus.on('event', () => {})
      bus.on('event', () => {})
      bus.on('event', () => {})

      const count = await bus.emitAsync('event', {})

      expect(count).toBe(3)
    })

    it('should maintain order with async emit', async () => {
      const order = []

      bus.on('event', () => order.push(1))
      bus.on('event', () => order.push(2))

      await bus.emitAsync('event', {})

      expect(order).toEqual([1, 2])
    })
  })

  describe('Event history', () => {
    it('should store event history', () => {
      bus.emit('event1', { data: 'a' })
      bus.emit('event1', { data: 'b' })
      bus.emit('event2', { data: 'c' })

      const history = bus.getEventHistory('event1')

      expect(history.length).toBe(2)
      expect(history[0].data).toEqual({ data: 'a' })
      expect(history[1].data).toEqual({ data: 'b' })
    })

    it('should include timestamp in history', () => {
      bus.emit('event', { test: true })

      const history = bus.getEventHistory('event')

      expect(history[0]).toHaveProperty('timestamp')
      expect(typeof history[0].timestamp).toBe('number')
    })

    it('should get history for all events', () => {
      bus.emit('event1', {})
      bus.emit('event2', {})
      bus.emit('event3', {})

      const history = bus.getEventHistory()

      expect(history.length).toBe(3)
    })

    it('should limit history by specified count', () => {
      for (let i = 0; i < 10; i++) {
        bus.emit('event', { num: i })
      }

      const history = bus.getEventHistory('event', 5)

      expect(history.length).toBe(5)
      expect(history[0].data.num).toBe(5)
    })

    it('should respect default history limit (50)', () => {
      for (let i = 0; i < 100; i++) {
        bus.emit('event', { num: i })
      }

      const history = bus.getEventHistory('event')

      expect(history.length).toBe(50)
      expect(history[0].data.num).toBe(50)
    })

    it('should clear history for specific event', () => {
      bus.emit('event1', {})
      bus.emit('event2', {})

      bus.clearHistory('event1')

      expect(bus.getEventHistory('event1').length).toBe(0)
      expect(bus.getEventHistory('event2').length).toBe(1)
    })

    it('should clear all history', () => {
      bus.emit('event1', {})
      bus.emit('event2', {})
      bus.emit('event3', {})

      bus.clearHistory()

      expect(bus.getEventHistory().length).toBe(0)
    })
  })

  describe('Debug mode', () => {
    it('should enable and disable debug mode', () => {
      expect(bus.isDebugEnabled()).toBe(false)

      bus.enableDebugMode()
      expect(bus.isDebugEnabled()).toBe(true)

      bus.disableDebugMode()
      expect(bus.isDebugEnabled()).toBe(false)
    })

    it('should log events when debug mode enabled', () => {
      const spy = vi.spyOn(console, 'log')
      bus.enableDebugMode()

      bus.on('event', () => {})
      bus.emit('event', { test: true })

      expect(spy).toHaveBeenCalledWith(expect.stringContaining('[EventBus]'), expect.anything())

      spy.mockRestore()
      bus.disableDebugMode()
    })

    it('should get listener info', () => {
      bus.on('event1', () => {}, { priority: 5 })
      bus.on('event1', () => {}, { once: true })
      bus.on('event2', () => {})

      const info = bus.getListenerInfo()

      expect(info.event1).toHaveLength(2)
      expect(info.event2).toHaveLength(1)
      expect(info.event1[0].priority).toBe(5)
      expect(info.event1[1].once).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should handle callback errors gracefully', () => {
      const callback1 = vi.fn(() => {
        throw new Error('Test error')
      })
      const callback2 = vi.fn()

      bus.on('event', callback1)
      bus.on('event', callback2)

      const count = bus.emit('event', {})

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
      expect(count).toBe(2)

    })

    it('should emit error event on listener error', () => {
      const errorCallback = vi.fn()
      const failingCallback = () => {
        throw new Error('Test error')
      }

      bus.on(EVENT_TYPES.ERROR, errorCallback)
      bus.on('event', failingCallback)

      bus.emit('event', {})

      expect(errorCallback).toHaveBeenCalled()
      const errorData = errorCallback.mock.calls[0][0]
      expect(errorData.event).toBe('event')
      expect(errorData.error).toBeInstanceOf(Error)
    })

    it('should handle invalid arguments', () => {
      const spy = vi.spyOn(console, 'error')

      bus.on(null, () => {})
      expect(spy).toHaveBeenCalled()

      spy.mockRestore()
    })
  })

  describe('EVENT_TYPES constants', () => {
    it('should have user event types', () => {
      expect(EVENT_TYPES.USER_LOGIN).toBe('user_login')
      expect(EVENT_TYPES.USER_LOGOUT).toBe('user_logout')
      expect(EVENT_TYPES.USER_PROFILE_UPDATED).toBe('user_profile_updated')
    })

    it('should have spot event types', () => {
      expect(EVENT_TYPES.SPOT_CREATED).toBe('spot_created')
      expect(EVENT_TYPES.SPOT_VERIFIED).toBe('spot_verified')
      expect(EVENT_TYPES.SPOT_VIEWED).toBe('spot_viewed')
    })

    it('should have gamification event types', () => {
      expect(EVENT_TYPES.LEVEL_UP).toBe('level_up')
      expect(EVENT_TYPES.BADGE_EARNED).toBe('badge_earned')
      expect(EVENT_TYPES.POINTS_EARNED).toBe('points_earned')
    })

    it('should have social event types', () => {
      expect(EVENT_TYPES.FRIEND_ADDED).toBe('friend_added')
      expect(EVENT_TYPES.MESSAGE_SENT).toBe('message_sent')
      expect(EVENT_TYPES.MESSAGE_RECEIVED).toBe('message_received')
    })

    it('should have travel event types', () => {
      expect(EVENT_TYPES.TRAVEL_MODE_ENABLED).toBe('travel_mode_enabled')
      expect(EVENT_TYPES.TRAVEL_DESTINATION_SET).toBe('travel_destination_set')
    })

    it('should have UI event types', () => {
      expect(EVENT_TYPES.TAB_CHANGED).toBe('tab_changed')
      expect(EVENT_TYPES.MODAL_OPENED).toBe('modal_opened')
      expect(EVENT_TYPES.MODAL_CLOSED).toBe('modal_closed')
    })
  })

  describe('Singleton instance', () => {
    it('should export default as singleton', () => {
      expect(eventBus).toBeInstanceOf(EventBus)
    })

    it('should maintain state across imports', () => {
      eventBus.on('test', () => {})
      expect(eventBus.getListenerCount('test')).toBe(1)
    })
  })

  describe('Memory management', () => {
    it('should remove listeners without memory leaks', () => {
      const callback = vi.fn()

      for (let i = 0; i < 100; i++) {
        bus.on('event', callback)
      }

      expect(bus.getListenerCount('event')).toBe(100)

      bus.removeAllListeners('event')

      expect(bus.getListenerCount('event')).toBe(0)
      expect(bus.getRegisteredEvents().length).toBe(0)
    })

    it('should cleanup after once() listeners', () => {
      for (let i = 0; i < 50; i++) {
        bus.once('event', () => {})
      }

      const count = bus.emit('event', {})

      expect(count).toBe(50)
      expect(bus.getListenerCount('event')).toBe(0)
    })

    it('should not leak history memory', () => {
      for (let i = 0; i < 1000; i++) {
        bus.emit('event', { data: 'x'.repeat(100) })
      }

      const history = bus.getEventHistory('event')
      expect(history.length).toBe(50)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty event name', () => {
      const spy = vi.spyOn(console, 'error')

      bus.emit('')

      expect(spy).not.toHaveBeenCalled()
    })

    it('should handle undefined data', () => {
      const callback = vi.fn()
      bus.on('event', callback)

      bus.emit('event', undefined)

      expect(callback).toHaveBeenCalledWith(undefined)
    })

    it('should handle null data', () => {
      const callback = vi.fn()
      bus.on('event', callback)

      bus.emit('event', null)

      expect(callback).toHaveBeenCalledWith(null)
    })

    it('should handle objects as data', () => {
      const callback = vi.fn()
      const data = { user: 'john', age: 30 }

      bus.on('event', callback)
      bus.emit('event', data)

      expect(callback).toHaveBeenCalledWith(data)
    })

    it('should handle arrays as data', () => {
      const callback = vi.fn()
      const data = [1, 2, 3, 4, 5]

      bus.on('event', callback)
      bus.emit('event', data)

      expect(callback).toHaveBeenCalledWith(data)
    })

    it('should unsubscribe with null callback', () => {
      bus.on('event', () => {})
      bus.off('event', null)

      expect(bus.getListenerCount('event')).toBe(1)
    })

    it('should handle rapid subscribe/unsubscribe', () => {
      const callback = vi.fn()

      const unsub1 = bus.on('event', callback)
      const unsub2 = bus.on('event', callback)

      unsub1()
      unsub2()

      bus.emit('event', {})

      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle same callback multiple times', () => {
      const callback = vi.fn()

      bus.on('event', callback)
      bus.on('event', callback)

      const count = bus.emit('event', {})

      // Same callback registered twice = called twice
      expect(callback).toHaveBeenCalledTimes(2)
      expect(count).toBe(2)
    })
  })

  describe('Compatibility and integration', () => {
    it('should work with async callbacks', async () => {
      const callback = vi.fn(async () => {
        return new Promise(resolve => setTimeout(resolve, 10))
      })

      bus.on('event', callback)
      bus.emit('event', {})

      expect(callback).toHaveBeenCalled()
    })

    it('should work with EventBus class directly', () => {
      const newBus = new EventBus()
      const callback = vi.fn()

      newBus.on('event', callback)
      newBus.emit('event', { id: 1 })

      expect(callback).toHaveBeenCalledWith({ id: 1 })
    })
  })
})
