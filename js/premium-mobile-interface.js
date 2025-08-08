// ===============================================================
// IMPERIUM V20 PREMIUM - ADVANCED MOBILE INTERFACE
// ===============================================================

class PremiumMobileInterface {
    constructor() {
        this.isMobile = this.detectMobileDevice();
        this.touchStartTime = 0;
        this.touchStartPosition = { x: 0, y: 0 };
        this.gestureThresholds = {
            tap: 150,           // ms
            longPress: 800,     // ms
            swipeDistance: 50,  // pixels
            pinchSensitivity: 0.1
        };
        
        this.activeGestures = new Set();
        this.hapticFeedbackEnabled = 'vibrate' in navigator;
        
        if (this.isMobile) {
            this.initializeMobileOptimizations();
            this.setupAdvancedGestures();
            this.enableSmartNotifications();
        }
    }

    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 768;
    }

    initializeMobileOptimizations() {
        console.log('📱 Initializing Premium Mobile Interface...');
        
        // Optimisations CSS dynamiques
        this.addMobileOptimizationCSS();
        
        // Prévenir le zoom accidentel
        this.preventAccidentalZoom();
        
        // Optimiser les performances tactiles
        this.optimizeTouchPerformance();
        
        // Interface adaptative
        this.enableResponsiveInterface();
    }

    addMobileOptimizationCSS() {
        const css = `
        /* Interface mobile premium */
        .mobile-optimized {
            touch-action: manipulation;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }

        /* Zones de touch étendues */
        .touch-target {
            position: relative;
        }

        .touch-target::before {
            content: '';
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            z-index: -1;
        }

        /* Feedback tactile visuel */
        .touch-feedback {
            position: relative;
            overflow: hidden;
        }

        .touch-feedback::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: radial-gradient(circle, rgba(217, 119, 6, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.3s ease, height 0.3s ease;
            pointer-events: none;
        }

        .touch-feedback.active::after {
            width: 200px;
            height: 200px;
        }

        /* Amélioration des boutons mobiles */
        .mobile-action-btn {
            min-height: 48px;
            min-width: 48px;
            padding: 12px 16px;
            font-size: 16px;
            border-radius: 12px;
            position: relative;
            transform-origin: center;
            transition: transform 0.1s ease;
        }

        .mobile-action-btn:active {
            transform: scale(0.95);
        }

        /* Interface de construction améliorée */
        .mobile-building-slot {
            min-height: 80px;
            min-width: 80px;
            border-radius: 16px;
            position: relative;
        }

        .mobile-building-slot.constructing {
            animation: pulse-construct 2s infinite;
        }

        @keyframes pulse-construct {
            0%, 100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.4); }
            50% { box-shadow: 0 0 0 10px rgba(217, 119, 6, 0); }
        }

        /* Notifications mobiles optimisées */
        .mobile-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            border: 2px solid var(--gold-primary);
            border-radius: 16px;
            padding: 16px 20px;
            z-index: 9999;
            max-width: 90vw;
            animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }

        /* Menu contextuel mobile */
        .mobile-context-menu {
            background: rgba(15, 23, 42, 0.98);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        /* Swipe indicators */
        .swipe-indicator {
            position: absolute;
            top: 50%;
            width: 30px;
            height: 4px;
            background: var(--gold-primary);
            border-radius: 2px;
            opacity: 0.5;
            animation: swipe-hint 2s infinite;
        }

        .swipe-indicator.left { left: 10px; }
        .swipe-indicator.right { right: 10px; }

        @keyframes swipe-hint {
            0%, 100% { opacity: 0.3; transform: translateY(-50%) scale(1); }
            50% { opacity: 0.7; transform: translateY(-50%) scale(1.2); }
        }
        `;

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    setupAdvancedGestures() {
        // Gestionnaire de gestes unifiés
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Gestes multi-touch
        document.addEventListener('touchstart', this.handleMultiTouch.bind(this), { passive: false });
    }

    handleTouchStart(event) {
        const touch = event.touches[0];
        this.touchStartTime = Date.now();
        this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
        
        // Détecter les éléments interactifs
        const target = event.target.closest('.mobile-building-slot, .mobile-action-btn, .nav-floating-btn');
        if (target) {
            target.classList.add('touch-feedback', 'active');
            this.provideTactileFeedback('light');
        }
    }

    handleTouchMove(event) {
        // Prévenir le scroll sur les éléments interactifs
        const target = event.target.closest('.mobile-building-slot, .mobile-action-btn');
        if (target) {
            event.preventDefault();
        }
    }

    handleTouchEnd(event) {
        const touch = event.changedTouches[0];
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - this.touchStartTime;
        
        const deltaX = touch.clientX - this.touchStartPosition.x;
        const deltaY = touch.clientY - this.touchStartPosition.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Nettoyer les effets visuels
        document.querySelectorAll('.touch-feedback.active').forEach(el => {
            el.classList.remove('active');
            setTimeout(() => el.classList.remove('touch-feedback'), 300);
        });

        // Détecter le type de geste
        if (distance < 10) { // Tap/Long press
            if (touchDuration < this.gestureThresholds.tap) {
                this.handleTap(event);
            } else if (touchDuration > this.gestureThresholds.longPress) {
                this.handleLongPress(event);
            }
        } else if (distance > this.gestureThresholds.swipeDistance) {
            this.handleSwipe(event, deltaX, deltaY);
        }
    }

    handleTap(event) {
        const target = event.target.closest('.mobile-building-slot');
        if (target) {
            this.provideTactileFeedback('medium');
            
            // Action rapide sur tap simple
            const slotId = target.dataset.slotId;
            if (slotId) {
                this.showQuickActionMenu(target, slotId);
            }
        }
    }

    handleLongPress(event) {
        const target = event.target.closest('.mobile-building-slot');
        if (target) {
            this.provideTactileFeedback('heavy');
            
            // Menu contextuel complet sur long press
            const slotId = target.dataset.slotId;
            if (slotId) {
                this.showDetailedBuildingMenu(target, slotId);
            }
        }
    }

    handleSwipe(event, deltaX, deltaY) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        if (absX > absY) {
            // Swipe horizontal
            if (deltaX > 0) {
                this.handleSwipeRight(event);
            } else {
                this.handleSwipeLeft(event);
            }
        } else {
            // Swipe vertical
            if (deltaY > 0) {
                this.handleSwipeDown(event);
            } else {
                this.handleSwipeUp(event);
            }
        }
    }

    handleSwipeRight(event) {
        // Navigation vers la page précédente ou menu
        if (typeof popupSystem !== 'undefined' && popupSystem.showResourceManagement) {
            popupSystem.showResourceManagement();
            this.provideTactileFeedback('light');
        }
    }

    handleSwipeLeft(event) {
        // Navigation vers la page suivante ou fermer
        const activeModal = document.querySelector('.modal-container.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            this.provideTactileFeedback('light');
        }
    }

    handleSwipeUp(event) {
        // Accès rapide aux statistiques
        const target = event.target.closest('.mobile-building-slot');
        if (target && target.classList.contains('occupied')) {
            this.showBuildingStats(target);
            this.provideTactileFeedback('medium');
        }
    }

    handleSwipeDown(event) {
        // Actualiser ou fermer
        if (event.target.closest('#statsOverlay')) {
            if (typeof recalculateCityStats === 'function') {
                recalculateCityStats();
                this.showRefreshFeedback();
                this.provideTactileFeedback('medium');
            }
        }
    }

    showQuickActionMenu(target, slotId) {
        // Menu d'actions rapides
        const rect = target.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'mobile-quick-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${rect.top - 60}px;
            left: ${rect.left + rect.width/2}px;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            border: 2px solid var(--gold-primary);
            border-radius: 16px;
            padding: 12px;
            display: flex;
            gap: 8px;
            z-index: 10000;
            animation: quickMenuIn 0.2s ease;
        `;

        // Actions disponibles
        const actions = this.getAvailableActions(slotId);
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'mobile-action-btn';
            btn.innerHTML = `<span style="font-size: 1.2em;">${action.icon}</span>`;
            btn.title = action.name;
            btn.onclick = () => {
                action.callback();
                menu.remove();
            };
            menu.appendChild(btn);
        });

        document.body.appendChild(menu);

        // Auto-suppression
        setTimeout(() => {
            if (menu.parentNode) menu.remove();
        }, 3000);
    }

    getAvailableActions(slotId) {
        const actions = [];
        
        if (typeof gameState !== 'undefined' && gameState.city.buildings[slotId]) {
            const building = gameState.city.buildings[slotId];
            
            if (building.type) {
                actions.push({
                    icon: '⬆️',
                    name: 'Améliorer',
                    callback: () => this.upgradeBuildingMobile(slotId)
                });
                
                actions.push({
                    icon: '🔍',
                    name: 'Détails',
                    callback: () => this.showBuildingDetails(slotId)
                });
            } else {
                actions.push({
                    icon: '🔨',
                    name: 'Construire',
                    callback: () => this.showBuildingOptions(slotId)
                });
            }
        }
        
        return actions;
    }

    provideTactileFeedback(intensity = 'light') {
        if (!this.hapticFeedbackEnabled) return;
        
        const patterns = {
            light: 10,
            medium: 50,
            heavy: 100
        };
        
        try {
            navigator.vibrate(patterns[intensity] || 10);
        } catch (e) {
            // Fallback silencieux
        }
    }

    showRefreshFeedback() {
        const feedback = document.createElement('div');
        feedback.innerHTML = '🔄';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3em;
            color: var(--gold-primary);
            z-index: 10000;
            animation: refreshSpin 1s ease;
            pointer-events: none;
        `;

        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1000);
    }

    enableSmartNotifications() {
        // Notifications adaptatives selon le contexte mobile
        if (typeof showToast === 'function') {
            const originalShowToast = window.showToast;
            window.showToast = (message, type = 'info') => {
                if (this.isMobile) {
                    this.showMobileNotification(message, type);
                } else {
                    originalShowToast(message, type);
                }
            };
        }
    }

    showMobileNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `mobile-notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 1.2em;">${this.getNotificationIcon(type)}</span>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            levelup: '🎉'
        };
        return icons[type] || 'ℹ️';
    }
}

// Initialiser automatiquement sur mobile
window.premiumMobileInterface = new PremiumMobileInterface();

// CSS animations additionnelles
const additionalCSS = `
@keyframes quickMenuIn {
    from { opacity: 0; transform: translateX(-50%) scale(0.8) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
}

@keyframes refreshSpin {
    from { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 1; }
    to { transform: translate(-50%, -50%) rotate(360deg) scale(1.2); opacity: 0; }
}

@keyframes slideUp {
    to { transform: translateX(-50%) translateY(-120%); opacity: 0; }
}
`;

const additionalStyle = document.createElement('style');
additionalStyle.textContent = additionalCSS;
document.head.appendChild(additionalStyle);

console.log('📱 Premium Mobile Interface initialized');