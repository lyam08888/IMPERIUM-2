// ===============================================================
// IMPERIUM V20 - MOBILE GAME COORDINATOR
// ===============================================================
// Coordinateur spécifique pour l'expérience mobile optimisée
// ===============================================================

class MobileGameCoordinator {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTouch = 'ontouchstart' in window;
        this.initialized = false;
        this.gameMode = 'mobile'; // 'mobile', 'desktop', 'hybrid'
        this.activeView = 'city'; // 'city', 'world', 'battle', 'simulator'
        this.touchGestures = new Map();
        this.uiElements = new Map();
    }

    // Détecter si on est sur mobile
    detectMobile() {
        const ua = navigator.userAgent;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const isSmallScreen = window.innerWidth <= 768;
        const hasTouch = 'ontouchstart' in window;
        
        return isMobileUA || (isSmallScreen && hasTouch);
    }

    // Initialiser le coordinateur mobile
    async initialize() {
        if (this.initialized) return;

        console.log('📱 Initialisation du coordinateur mobile...');
        
        try {
            // Configuration de base
            await this.setupMobileEnvironment();
            
            // Interface utilisateur mobile
            await this.initializeMobileUI();
            
            // Contrôles tactiles
            await this.setupTouchControls();
            
            // Optimisations performances
            await this.applyMobileOptimizations();
            
            // Intégration avec les systèmes du jeu
            await this.integrateGameSystems();
            
            this.initialized = true;
            console.log('✅ Coordinateur mobile initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation mobile:', error);
            throw error;
        }
    }

    // Configurer l'environnement mobile
    async setupMobileEnvironment() {
        console.log('🔧 Configuration environnement mobile...');
        
        // Viewport et métadonnées
        this.setupViewport();
        
        // Prévenir le zoom
        this.preventZoom();
        
        // Optimiser les performances
        this.optimizePerformance();
        
        // Configuration PWA
        this.setupPWA();
        
        console.log('✅ Environnement mobile configuré');
    }

    // Configurer le viewport
    setupViewport() {
        const meta = document.querySelector('meta[name="viewport"]');
        if (meta) {
            meta.setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
        }
        
        // Support des safe areas
        if (CSS.supports('padding: env(safe-area-inset-top)')) {
            document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
            document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
        }
    }

    // Prévenir le zoom accidentel
    preventZoom() {
        // Empêcher le zoom sur double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Empêcher le zoom pinch
        document.addEventListener('touchmove', (event) => {
            if (event.scale !== 1) {
                event.preventDefault();
            }
        }, { passive: false });
    }

    // Optimiser les performances mobiles
    optimizePerformance() {
        // Réduire les animations sur les appareils lents
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            document.documentElement.style.setProperty('--animation-duration', '0.1s');
        }
        
        // Optimiser le défilement
        document.documentElement.style.setProperty('-webkit-overflow-scrolling', 'touch');
        
        // Réduire les repaints
        document.documentElement.style.setProperty('transform', 'translate3d(0,0,0)');
    }

    // Configurer PWA
    setupPWA() {
        // Enregistrer le service worker si disponible
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('✅ Service Worker enregistré');
            }).catch(error => {
                console.log('⚠️ Service Worker non disponible');
            });
        }
    }

    // Initialiser l'interface mobile
    async initializeMobileUI() {
        console.log('🎨 Initialisation interface mobile...');
        
        // Créer la structure mobile si nécessaire
        this.createMobileLayout();
        
        // Configurer les boutons tactiles
        this.setupMobileButtons();
        
        // Initialiser les vues mobiles
        this.initializeMobileViews();
        
        // Configurer la navigation mobile
        this.setupMobileNavigation();
        
        console.log('✅ Interface mobile initialisée');
    }

    // Créer la structure mobile
    createMobileLayout() {
        const body = document.body;
        
        // Vérifier si la structure mobile existe déjà
        if (document.querySelector('.mobile-game-container')) {
            return;
        }
        
        // Créer la structure mobile
        const mobileContainer = document.createElement('div');
        mobileContainer.className = 'mobile-game-container';
        mobileContainer.innerHTML = `
            <div class="mobile-header">
                <div class="mobile-logo">IMPERIUM</div>
                <div class="mobile-resources" id="mobile-resources">
                    <div class="resource-item">
                        <span>🏛️</span>
                        <span id="mobile-gold">0</span>
                    </div>
                    <div class="resource-item">
                        <span>🌾</span>
                        <span id="mobile-food">0</span>
                    </div>
                </div>
            </div>
            
            <div class="mobile-game-area" id="mobile-game-area">
                <div class="mobile-buildings-grid" id="mobile-buildings-grid">
                    <!-- Les bâtiments seront générés ici -->
                </div>
            </div>
            
            <div class="mobile-action-bar" id="mobile-action-bar">
                <button class="mobile-action-btn" data-action="city">
                    <div class="icon">🏛️</div>
                    <div>Cité</div>
                </button>
                <button class="mobile-action-btn" data-action="world">
                    <div class="icon">🌍</div>
                    <div>Monde</div>
                </button>
                <button class="mobile-action-btn" data-action="army">
                    <div class="icon">⚔️</div>
                    <div>Armée</div>
                </button>
                <button class="mobile-action-btn" data-action="trade">
                    <div class="icon">🏪</div>
                    <div>Commerce</div>
                </button>
                <button class="mobile-action-btn" data-action="menu">
                    <div class="icon">⚙️</div>
                    <div>Menu</div>
                </button>
            </div>
        `;
        
        // Remplacer ou ajouter la structure
        if (body.children.length > 0) {
            body.insertBefore(mobileContainer, body.firstChild);
        } else {
            body.appendChild(mobileContainer);
        }
        
        this.uiElements.set('container', mobileContainer);
    }

    // Configurer les boutons mobiles
    setupMobileButtons() {
        const actionBar = document.getElementById('mobile-action-bar');
        if (!actionBar) return;
        
        actionBar.addEventListener('click', (e) => {
            const button = e.target.closest('.mobile-action-btn');
            if (!button) return;
            
            const action = button.getAttribute('data-action');
            this.handleMobileAction(action);
            
            // Feedback tactile
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
            
            // Feedback visuel
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        });
    }

    // Gérer les actions mobiles
    handleMobileAction(action) {
        console.log(`📱 Action mobile: ${action}`);
        
        switch (action) {
            case 'city':
                this.switchToView('city');
                break;
            case 'world':
                this.switchToView('world');
                break;
            case 'army':
                this.switchToView('army');
                break;
            case 'trade':
                this.showTradeInterface();
                break;
            case 'menu':
                this.showMobileMenu();
                break;
        }
    }

    // Changer de vue
    switchToView(viewName) {
        console.log(`🔄 Changement de vue: ${viewName}`);
        this.activeView = viewName;
        
        // Mettre à jour l'interface
        this.updateMobileDisplay();
        
        // Intégration avec les systèmes existants
        this.integrateViewChange(viewName);
    }

    // Mettre à jour l'affichage mobile
    updateMobileDisplay() {
        // Mettre à jour les ressources
        this.updateMobileResources();
        
        // Mettre à jour la vue active
        this.updateActiveView();
        
        // Mettre à jour les boutons
        this.updateActionButtons();
    }

    // Mettre à jour les ressources mobiles
    updateMobileResources() {
        if (typeof gameState !== 'undefined' && gameState.resources) {
            const goldEl = document.getElementById('mobile-gold');
            const foodEl = document.getElementById('mobile-food');
            
            if (goldEl) goldEl.textContent = this.formatNumber(gameState.resources.gold || 0);
            if (foodEl) foodEl.textContent = this.formatNumber(gameState.resources.food || 0);
        }
    }

    // Formater les nombres pour mobile
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    // Configurer les contrôles tactiles
    async setupTouchControls() {
        console.log('👆 Configuration contrôles tactiles...');
        
        // Gestes de base
        this.setupSwipeGestures();
        this.setupLongPress();
        this.setupDoubleTap();
        
        // Zone de jeu tactile
        this.setupGameAreaTouch();
        
        console.log('✅ Contrôles tactiles configurés');
    }

    // Configurer les gestes de glissement
    setupSwipeGestures() {
        let startX, startY, endX, endY;
        
        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const touch = e.changedTouches[0];
            endX = touch.clientX;
            endY = touch.clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            const absX = Math.abs(diffX);
            const absY = Math.abs(diffY);
            
            // Seuil minimum pour considérer un swipe
            if (Math.max(absX, absY) < 50) return;
            
            if (absX > absY) {
                // Swipe horizontal
                if (diffX > 0) {
                    this.handleSwipe('left');
                } else {
                    this.handleSwipe('right');
                }
            } else {
                // Swipe vertical
                if (diffY > 0) {
                    this.handleSwipe('up');
                } else {
                    this.handleSwipe('down');
                }
            }
            
            startX = startY = null;
        });
    }

    // Gérer les gestes de glissement
    handleSwipe(direction) {
        console.log(`👆 Swipe ${direction}`);
        
        switch (direction) {
            case 'left':
                this.nextView();
                break;
            case 'right':
                this.previousView();
                break;
            case 'up':
                this.showQuickActions();
                break;
            case 'down':
                this.hideQuickActions();
                break;
        }
    }

    // Configurer l'appui long
    setupLongPress() {
        let pressTimer;
        
        document.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                this.handleLongPress(e);
            }, 500);
        });
        
        document.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
        
        document.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        });
    }

    // Gérer l'appui long
    handleLongPress(e) {
        const target = e.target.closest('.mobile-building-slot');
        if (target) {
            this.showBuildingOptions(target);
        }
    }

    // Intégrer avec les systèmes de jeu
    async integrateGameSystems() {
        console.log('🔗 Intégration systèmes de jeu...');
        
        // Intégration avec gameState
        this.integrateGameState();
        
        // Intégration avec le système de construction
        this.integrateBuildingSystem();
        
        // Intégration avec le système de combat
        this.integrateBattleSystem();
        
        // Intégration avec les popups
        this.integratePopupSystem();
        
        console.log('✅ Systèmes intégrés');
    }

    // Intégrer avec gameState
    integrateGameState() {
        if (typeof gameState !== 'undefined') {
            // Observer les changements de gameState
            if (typeof window.Proxy !== 'undefined') {
                const originalGameState = gameState;
                window.gameState = new Proxy(originalGameState, {
                    set: (target, property, value) => {
                        target[property] = value;
                        this.onGameStateChange(property, value);
                        return true;
                    }
                });
            }
            
            // Mise à jour initiale
            this.updateMobileDisplay();
        }
    }

    // Gérer les changements d'état
    onGameStateChange(property, value) {
        if (property === 'resources') {
            this.updateMobileResources();
        }
        
        // Autres mises à jour selon la propriété changée
        this.updateMobileDisplay();
    }

    // Boucle de mise à jour mobile
    startMobileUpdateLoop() {
        setInterval(() => {
            if (this.initialized && !document.hidden) {
                this.updateMobileDisplay();
            }
        }, 1000); // Mise à jour chaque seconde
    }

    // Afficher le menu mobile
    showMobileMenu() {
        const menu = document.createElement('div');
        menu.className = 'mobile-context-menu';
        menu.innerHTML = `
            <div class="context-menu-header">
                <div class="context-menu-title">Menu</div>
                <button class="context-menu-close">×</button>
            </div>
            <div class="context-menu-options">
                <div class="context-menu-option" data-action="save">
                    <div class="icon">💾</div>
                    <div class="content">
                        <div class="title">Sauvegarder</div>
                        <div class="description">Sauvegarder votre progression</div>
                    </div>
                </div>
                <div class="context-menu-option" data-action="load">
                    <div class="icon">📁</div>
                    <div class="content">
                        <div class="title">Charger</div>
                        <div class="description">Charger une sauvegarde</div>
                    </div>
                </div>
                <div class="context-menu-option" data-action="settings">
                    <div class="icon">⚙️</div>
                    <div class="content">
                        <div class="title">Paramètres</div>
                        <div class="description">Configurer le jeu</div>
                    </div>
                </div>
                <div class="context-menu-option" data-action="help">
                    <div class="icon">❓</div>
                    <div class="content">
                        <div class="title">Aide</div>
                        <div class="description">Guide et tutoriel</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Gestionnaire de fermeture
        menu.addEventListener('click', (e) => {
            if (e.target.classList.contains('context-menu-close') || 
                e.target.classList.contains('mobile-context-menu')) {
                menu.remove();
            }
            
            const option = e.target.closest('.context-menu-option');
            if (option) {
                const action = option.getAttribute('data-action');
                this.handleMenuAction(action);
                menu.remove();
            }
        });
    }

    // Gérer les actions du menu
    handleMenuAction(action) {
        switch (action) {
            case 'save':
                if (typeof saveGame === 'function') {
                    saveGame();
                    this.showMobileNotification('Jeu sauvegardé !', 'success');
                }
                break;
            case 'load':
                if (typeof loadGame === 'function') {
                    loadGame();
                    this.showMobileNotification('Jeu chargé !', 'success');
                }
                break;
            case 'settings':
                this.showMobileSettings();
                break;
            case 'help':
                this.showMobileHelp();
                break;
        }
    }

    // Afficher une notification mobile
    showMobileNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `mobile-notification mobile-notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: calc(env(safe-area-inset-top, 20px) + 20px);
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            opacity: 0;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animation d'apparition
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
        
        // Suppression automatique
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    // Démarrer le coordinateur
    start() {
        console.log('🚀 Démarrage coordinateur mobile...');
        this.initialize();
        this.startMobileUpdateLoop();
    }
}

// Instance globale
window.MobileGameCoordinator = new MobileGameCoordinator();

// Auto-initialisation sur mobile
document.addEventListener('DOMContentLoaded', () => {
    const coordinator = window.MobileGameCoordinator;
    
    if (coordinator.isMobile) {
        console.log('📱 Appareil mobile détecté - Lancement du coordinateur mobile');
        coordinator.start();
    } else {
        console.log('💻 Appareil desktop détecté - Mode hybride activé');
        coordinator.gameMode = 'hybrid';
        coordinator.initialize();
    }
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileGameCoordinator;
}