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
  const { title, body, icon } = payload.notification || {}

  self.registration.showNotification(title || 'SpotHitch', {
    body: body || '',
    icon: icon || '/Spothitch/icon-192.png',
    badge: '/Spothitch/icon-96.png',
    tag: 'spothitch-notification',
  })
})
