/**
 * Mock Mixpanel for testing
 * Comprehensive mock that records all calls for assertions
 */

// Track all calls for testing
const calls = {
  init: [],
  track: [],
  identify: [],
  reset: [],
  people: {
    set: [],
  },
}

// Clear all recorded calls
function clearCalls() {
  calls.init = []
  calls.track = []
  calls.identify = []
  calls.reset = []
  calls.people.set = []
}

// Get all recorded calls
function getCalls() {
  return { ...calls }
}

// Get last call for a method
function getLastCall(method) {
  if (method === 'people.set') {
    return calls.people.set[calls.people.set.length - 1] || null
  }
  return calls[method]?.[calls[method].length - 1] || null
}

// Mock implementation
const mixpanel = {
  init: (...args) => {
    calls.init.push(args)
  },
  track: (eventName, properties) => {
    calls.track.push({ eventName, properties })
  },
  identify: (userId) => {
    calls.identify.push({ userId })
  },
  reset: () => {
    calls.reset.push({ timestamp: Date.now() })
  },
  people: {
    set: (properties) => {
      calls.people.set.push({ properties })
    },
  },
  // Test helpers
  _clearCalls: clearCalls,
  _getCalls: getCalls,
  _getLastCall: getLastCall,
}

export default mixpanel
export { clearCalls, getCalls, getLastCall }
