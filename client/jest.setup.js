// jest.setup.js
require('@testing-library/jest-dom/extend-expect')

// Mock global browser APIs
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
})

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
})

// Mock Intersection Observer
class IntersectionObserver {
  constructor(callback, options = {}) {
    this.callback = callback
    this.options = options
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver
})

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 0
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this.onerror = null
  }

  send() {}
  close() {}
}

Object.defineProperty(window, 'WebSocket', {
  writable: true,
  configurable: true,
  value: MockWebSocket
})

// Silence console warnings during tests
console.warn = jest.fn()
console.error = jest.fn()
