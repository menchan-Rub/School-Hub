import { messageCache, userCache } from './cache-manager'

const CACHE_NAME = 'school-hub-v1'
const OFFLINE_URL = '/offline.html'

const CACHED_URLS = [
  '/',
  '/offline.html',
  '/styles.css',
  '/api/messages',
  '/api/users'
]

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHED_URLS)
    })
  )
})

self.addEventListener('fetch', (event: any) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL)
        })
      })
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone())
          return response
        })
      })
    })
  )
}) 