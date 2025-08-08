/**
 * Service Worker for SiteGrissi
 * Provides caching and offline functionality
 */

const CACHE_NAME = 'sitegrissi-v1.1.0';
const STATIC_CACHE = 'static-v1.1.0';
const DYNAMIC_CACHE = 'dynamic-v1.1.0';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/index.css',
    '/arvore-genealogica.html',
    '/arvore-genealogica-final.html', // kept temporarily for transition
    '/js/photo-matcher.js',
    '/js/photo-popup.js',

    '/images/home/grice2.JPG',
    '/favicon.ico',
    '/assets/favicons/apple-touch-icon.png',
    '/assets/favicons/favicon-32x32.png',
    '/assets/favicons/favicon-16x16.png',
    '/assets/favicons/site.webmanifest'
];

// Resources to cache on first visit
const STATIC_RESOURCES = [
    '/historia.html',
    '/lembrancas.html',
    '/fotos.html',
    '/contato.html',
    '/arvore.css',
    '/audio/funiculi_funicula.mp3'
];

/**
 * Install event - cache critical resources
 */
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 Caching critical resources');
                return cache.addAll(CRITICAL_RESOURCES);
            })
            .then(() => {
                console.log('✅ Critical resources cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Failed to cache critical resources:', error);
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip external resources (except CDN)
    if (!url.origin.includes('sitegrissi.com') && 
        !url.origin.includes('cdnjs.cloudflare.com')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                // Return cached response if available
                if (cachedResponse) {
                    console.log('📦 Serving from cache:', request.url);
                    return cachedResponse;
                }
                
                // Fetch from network
                return fetch(request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        // Cache the response
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => {
                                console.log('💾 Caching new resource:', request.url);
                                cache.put(request, responseToCache);
                            })
                            .catch(error => {
                                console.error('❌ Failed to cache response:', error);
                            });
                        
                        return response;
                    })
                    .catch(error => {
                        console.error('❌ Network request failed:', error);
                        
                        // Return offline page for HTML requests
                        if (request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        
                        // Return a simple offline message for other requests
                        return new Response(
                            'Offline - Resource not available',
                            { status: 503, statusText: 'Service Unavailable' }
                        );
                    });
            })
    );
});

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', event => {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Handle any background sync tasks
            console.log('🔄 Processing background sync')
        );
    }
});

/**
 * Push notification handler
 */
self.addEventListener('push', event => {
    console.log('📱 Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'Nova atualização disponível',
        icon: '/assets/favicons/favicon-32x32.png',
        badge: '/assets/favicons/favicon-16x16.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver site',
                icon: '/assets/favicons/favicon-16x16.png'
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: '/assets/favicons/favicon-16x16.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Família Grizzo . Grice . Gris . Grissi', options)
    );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', event => {
    console.log('👆 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', event => {
    console.log('💬 Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_INFO') {
        event.waitUntil(
            caches.keys()
                .then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(cacheName => 
                            caches.open(cacheName)
                                .then(cache => cache.keys())
                                .then(requests => ({ cacheName, count: requests.length }))
                        )
                    );
                })
                .then(cacheInfo => {
                    event.ports[0].postMessage({ type: 'CACHE_INFO', data: cacheInfo });
                })
        );
    }
}); 