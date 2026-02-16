/**
 * Firebase Cloud Messaging Service Worker
 * Handles push notifications in the background
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyAQ7-VOm2mgqINlp8HOcOt7TWpioy06E5c',
  authDomain: 'spothitch.firebaseapp.com',
  projectId: 'spothitch',
  storageBucket: 'spothitch.firebasestorage.app',
  messagingSenderId: '314974309234',
  appId: '1:314974309234:web:88a3bf8a027e353c3b6beb',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {}
  const data = payload.data || {}

  const title = notification.title || 'SpotHitch'
  const options = {
    body: notification.body || '',
    icon: notification.icon || '/icon-192.png',
    badge: '/icon-96.png',
    tag: data.tag || 'spothitch-notification',
    data: { url: data.url || '/', ...data },
    vibrate: data.type === 'companion_overdue'
      ? [500, 200, 500, 200, 500, 200, 500]
      : [100, 50, 100],
    requireInteraction: data.type === 'companion_overdue',
  }

  // Add action buttons for companion overdue alerts
  if (data.type === 'companion_overdue') {
    options.actions = [
      { action: 'checkin', title: "I'm safe" },
      { action: 'alert', title: 'Send alert' },
    ]
  }

  self.registration.showNotification(title, options)
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const action = event.action

  // Handle companion mode actions
  if (action === 'checkin') {
    // Open app with check-in action
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        const appClient = clients.find((c) => c.url.includes(self.location.origin))
        if (appClient) {
          appClient.focus()
          appClient.postMessage({ type: 'COMPANION_CHECKIN' })
        } else {
          self.clients.openWindow('/?companion=checkin')
        }
      })
    )
    return
  }

  if (action === 'alert') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        const appClient = clients.find((c) => c.url.includes(self.location.origin))
        if (appClient) {
          appClient.focus()
          appClient.postMessage({ type: 'COMPANION_ALERT' })
        } else {
          self.clients.openWindow('/?companion=alert')
        }
      })
    )
    return
  }

  // Default: open the URL from data
  const urlToOpen = data.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const appClient = clients.find((c) => c.url.includes(self.location.origin))
      if (appClient) {
        appClient.focus()
        if (urlToOpen !== '/') {
          appClient.navigate(urlToOpen)
        }
      } else {
        self.clients.openWindow(urlToOpen)
      }
    })
  )
})
