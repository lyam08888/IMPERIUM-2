// Service Worker pour IMPERIUM Mobile
// Version 2.0.0

const CACHE_NAME = 'imperium-mobile-v2.0.0';
const STATIC_CACHE_NAME = 'imperium-static-v2.0.0';
const DYNAMIC_CACHE_NAME = 'imperium-dynamic-v2.0.0';

// Ressources à mettre en cache pour le fonctionnement hors ligne
const STATIC_ASSETS = [
    './',
    './imperium-mobile.html',
    './manifest.json',
    './css/style.css',
    './css/imperium_popup.css',
    './css/loader.css',
    './css/simulator.css',
    './js/game.js',
    './js/shared-utils.js',
    './js/unified-popup-system.js',
    './js/unified-game-controller.js',
    './js/scenario.js',
    './js/city-view.js',
    './js/world-view.js',
    './js/BattleManager.js',
    './js/simulator-view.js',
    './js/maritime-simulator-view.js',
    './js/imperium_popup.js'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((error) => {
                console.error('[SW] Failed to cache static assets:', error);
            })
    );
    
    // Force l'activation immédiate
    self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Supprimer les anciens caches
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Ignorer les requêtes non-HTTP
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    // Stratégie Cache First pour les ressources statiques
    if (STATIC_ASSETS.some(asset => event.request.url.includes(asset.replace('./', '')))) {
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    return fetch(event.request)
                        .then((networkResponse) => {
                            return caches.open(STATIC_CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                        });
                })
                .catch(() => {
                    // Fallback en cas d'erreur
                    if (event.request.destination === 'document') {
                        return caches.match('./imperium-mobile.html');
                    }
                })
        );
        return;
    }
    
    // Stratégie Network First pour les autres ressources
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Mettre en cache les réponses valides
                if (networkResponse.status === 200) {
                    return caches.open(DYNAMIC_CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                }
                return networkResponse;
            })
            .catch(() => {
                // Fallback vers le cache en cas d'erreur réseau
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // Fallback ultime pour les documents
                        if (event.request.destination === 'document') {
                            return caches.match('./imperium-mobile.html');
                        }
                        
                        // Réponse d'erreur générique
                        return new Response(
                            JSON.stringify({
                                error: 'Ressource non disponible hors ligne',
                                offline: true
                            }),
                            {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            }
                        );
                    });
            })
    );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
    const { action, data } = event.data;
    
    switch (action) {
        case 'SAVE_GAME_STATE':
            // Sauvegarder l'état du jeu dans le cache
            caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                    const response = new Response(JSON.stringify(data), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                    return cache.put('/game-state.json', response);
                })
                .then(() => {
                    event.ports[0].postMessage({ success: true });
                })
                .catch((error) => {
                    event.ports[0].postMessage({ success: false, error: error.message });
                });
            break;
            
        case 'LOAD_GAME_STATE':
            // Charger l'état du jeu depuis le cache
            caches.match('/game-state.json')
                .then((response) => {
                    if (response) {
                        return response.json();
                    }
                    return null;
                })
                .then((gameState) => {
                    event.ports[0].postMessage({ success: true, gameState });
                })
                .catch((error) => {
                    event.ports[0].postMessage({ success: false, error: error.message });
                });
            break;
            
        case 'CLEAR_CACHE':
            // Vider le cache dynamique
            caches.delete(DYNAMIC_CACHE_NAME)
                .then(() => {
                    event.ports[0].postMessage({ success: true });
                })
                .catch((error) => {
                    event.ports[0].postMessage({ success: false, error: error.message });
                });
            break;
            
        case 'GET_CACHE_SIZE':
            // Obtenir la taille du cache
            Promise.all([
                caches.open(STATIC_CACHE_NAME),
                caches.open(DYNAMIC_CACHE_NAME)
            ])
            .then(([staticCache, dynamicCache]) => {
                return Promise.all([
                    staticCache.keys(),
                    dynamicCache.keys()
                ]);
            })
            .then(([staticKeys, dynamicKeys]) => {
                event.ports[0].postMessage({
                    success: true,
                    staticCount: staticKeys.length,
                    dynamicCount: dynamicKeys.length,
                    totalCount: staticKeys.length + dynamicKeys.length
                });
            })
            .catch((error) => {
                event.ports[0].postMessage({ success: false, error: error.message });
            });
            break;
            
        default:
            event.ports[0].postMessage({ success: false, error: 'Unknown action' });
    }
});

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync event:', event.tag);
    
    if (event.tag === 'game-save') {
        event.waitUntil(
            // Synchroniser les sauvegardes en attente
            syncGameSave()
        );
    }
});

// Fonction pour synchroniser les sauvegardes
async function syncGameSave() {
    try {
        // Récupérer les sauvegardes en attente depuis IndexedDB
        const pendingSaves = await getPendingSaves();
        
        for (const save of pendingSaves) {
            try {
                // Envoyer vers le serveur (si disponible)
                await syncToServer(save);
                // Marquer comme synchronisé
                await markAsSynced(save.id);
            } catch (error) {
                console.warn('[SW] Failed to sync save:', error);
            }
        }
    } catch (error) {
        console.error('[SW] Background sync failed:', error);
    }
}

// Fonctions utilitaires pour IndexedDB
async function getPendingSaves() {
    // Simulation - à implémenter avec IndexedDB
    return [];
}

async function syncToServer(save) {
    // Simulation - à implémenter pour la synchronisation serveur
    return Promise.resolve();
}

async function markAsSynced(saveId) {
    // Simulation - à implémenter avec IndexedDB
    return Promise.resolve();
}

// Gestion des notifications push (pour les fonctionnalités futures)
self.addEventListener('push', (event) => {
    console.log('[SW] Push message received');
    
    if (event.data) {
        const data = event.data.json();
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'IMPERIUM', {
                body: data.body || 'Votre empire a besoin de vous !',
                icon: './manifest.json',
                badge: './manifest.json',
                tag: data.tag || 'imperium-notification',
                requireInteraction: false,
                silent: false,
                vibrate: [200, 100, 200],
                data: data.data || {}
            })
        );
    }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');
    
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((clientList) => {
                // Si une fenêtre est déjà ouverte, la focuser
                for (const client of clientList) {
                    if (client.url.includes('imperium-mobile.html') && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Sinon, ouvrir une nouvelle fenêtre
                if (clients.openWindow) {
                    return clients.openWindow('./imperium-mobile.html');
                }
            })
    );
});

// Performance monitoring
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'performance-metrics') {
        event.waitUntil(
            collectPerformanceMetrics()
        );
    }
});

async function collectPerformanceMetrics() {
    try {
        // Collecter les métriques de performance
        const cacheStats = await getCacheStats();
        
        // Envoyer les métriques (si un endpoint est disponible)
        // await sendMetrics(cacheStats);
        
        console.log('[SW] Performance metrics collected:', cacheStats);
    } catch (error) {
        console.error('[SW] Failed to collect performance metrics:', error);
    }
}

async function getCacheStats() {
    const cacheNames = await caches.keys();
    const stats = {};
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        stats[cacheName] = keys.length;
    }
    
    return stats;
}

// Nettoyage périodique des caches
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(
            cleanupOldCaches()
        );
    }
});

async function cleanupOldCaches() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const keys = await cache.keys();
        
        // Supprimer les entrées de plus de 7 jours
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const dateHeader = response.headers.get('date');
                if (dateHeader) {
                    const responseDate = new Date(dateHeader).getTime();
                    if (responseDate < oneWeekAgo) {
                        await cache.delete(request);
                        console.log('[SW] Cleaned up old cache entry:', request.url);
                    }
                }
            }
        }
    } catch (error) {
        console.error('[SW] Cache cleanup failed:', error);
    }
}

console.log('[SW] Service Worker script loaded successfully');