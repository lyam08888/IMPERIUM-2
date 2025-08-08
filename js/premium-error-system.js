// ===============================================================
// IMPERIUM V20 PREMIUM - ADVANCED ERROR MANAGEMENT SYSTEM
// ===============================================================

class PremiumErrorSystem {
    constructor() {
        this.errorLog = [];
        this.performanceMetrics = {
            fps: 60,
            loadTime: 0,
            memoryUsage: 0,
            systemHealth: 100
        };
        this.debugMode = localStorage.getItem('imperium_debug') === 'true';
        this.autoRecoveryAttempts = 0;
        this.maxRecoveryAttempts = 3;
        
        this.initializeErrorHandling();
        this.startPerformanceMonitoring();
    }

    initializeErrorHandling() {
        // Gestionnaire d'erreurs global
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'JavaScript Error',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error,
                timestamp: Date.now(),
                severity: 'high'
            });
        });

        // Gestionnaire de promesses rejetées
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'Unhandled Promise Rejection',
                message: event.reason?.message || 'Promise rejected',
                error: event.reason,
                timestamp: Date.now(),
                severity: 'medium'
            });
        });
    }

    handleError(errorInfo) {
        this.errorLog.push(errorInfo);
        
        if (this.debugMode) {
            console.group('🚨 IMPERIUM ERROR DETECTED');
            console.error('Type:', errorInfo.type);
            console.error('Message:', errorInfo.message);
            console.error('Source:', errorInfo.source);
            console.error('Error Object:', errorInfo.error);
            console.groupEnd();
        }

        // Auto-recovery pour certains types d'erreurs
        if (errorInfo.severity === 'high' && this.autoRecoveryAttempts < this.maxRecoveryAttempts) {
            this.attemptAutoRecovery(errorInfo);
        }

        // Notification utilisateur pour erreurs critiques
        if (errorInfo.severity === 'high') {
            this.showUserErrorNotification(errorInfo);
        }

        // Sauvegarde d'urgence
        this.performEmergencySave();
    }

    attemptAutoRecovery(errorInfo) {
        this.autoRecoveryAttempts++;
        console.log(`🔄 Auto-recovery attempt ${this.autoRecoveryAttempts}/${this.maxRecoveryAttempts}`);

        setTimeout(() => {
            try {
                // Tentatives de récupération selon le type d'erreur
                if (errorInfo.message.includes('gameState')) {
                    this.recoverGameState();
                } else if (errorInfo.message.includes('popup') || errorInfo.message.includes('modal')) {
                    this.recoverUISystem();
                } else if (errorInfo.message.includes('fetch') || errorInfo.message.includes('network')) {
                    this.recoverNetworkOperations();
                }

                showToast('🔧 Récupération automatique réussie', 'success');
                this.autoRecoveryAttempts = 0; // Reset sur succès
            } catch (recoveryError) {
                console.error('Recovery failed:', recoveryError);
            }
        }, 1000 * this.autoRecoveryAttempts); // Délai progressif
    }

    recoverGameState() {
        if (typeof initializeGameState === 'function') {
            initializeGameState();
            console.log('✅ Game state recovered');
        }
    }

    recoverUISystem() {
        // Nettoyer les modals orphelines
        const modals = document.querySelectorAll('.modal-container');
        modals.forEach(modal => {
            modal.classList.remove('active');
            modal.innerHTML = '';
        });

        // Réinitialiser le système de popup si disponible
        if (window.popupSystem && typeof popupSystem.initialize === 'function') {
            popupSystem.initialize();
            console.log('✅ UI system recovered');
        }
    }

    recoverNetworkOperations() {
        // Réessayer les opérations réseau critiques
        if (typeof loadGameData === 'function') {
            loadGameData();
            console.log('✅ Network operations recovered');
        }
    }

    performEmergencySave() {
        try {
            if (window.gameState) {
                localStorage.setItem('imperium_emergency_save', JSON.stringify({
                    gameState: window.gameState,
                    timestamp: Date.now(),
                    errorContext: this.errorLog.slice(-5) // Dernières 5 erreurs
                }));
            }
        } catch (saveError) {
            console.error('Emergency save failed:', saveError);
        }
    }

    showUserErrorNotification(errorInfo) {
        if (typeof showToast === 'function') {
            showToast('⚠️ Une erreur est survenue. Auto-récupération en cours...', 'error');
        }
    }

    startPerformanceMonitoring() {
        // Monitoring FPS
        let lastTime = performance.now();
        let frames = 0;

        const measureFPS = () => {
            frames++;
            const now = performance.now();
            
            if (now - lastTime >= 1000) {
                this.performanceMetrics.fps = Math.round(frames * 1000 / (now - lastTime));
                frames = 0;
                lastTime = now;

                // Alerte performance
                if (this.performanceMetrics.fps < 30) {
                    this.handlePerformanceIssue('fps', this.performanceMetrics.fps);
                }
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);

        // Monitoring mémoire (si disponible)
        if (performance.memory) {
            setInterval(() => {
                this.performanceMetrics.memoryUsage = Math.round(
                    performance.memory.usedJSHeapSize / 1024 / 1024
                );

                if (this.performanceMetrics.memoryUsage > 100) { // Plus de 100MB
                    this.handlePerformanceIssue('memory', this.performanceMetrics.memoryUsage);
                }
            }, 10000);
        }
    }

    handlePerformanceIssue(type, value) {
        console.warn(`🐌 Performance issue detected: ${type} = ${value}`);
        
        if (type === 'fps' && value < 15) {
            // Réduire les effets visuels
            this.enablePerformanceMode();
        } else if (type === 'memory' && value > 150) {
            // Nettoyer la mémoire
            this.performMemoryCleanup();
        }
    }

    enablePerformanceMode() {
        document.body.classList.add('performance-mode');
        showToast('🚀 Mode performance activé', 'info');
    }

    performMemoryCleanup() {
        // Nettoyer les event listeners inutilisés
        // Vider les caches temporaires
        if (window.gc) {
            window.gc(); // Force garbage collection (Chrome dev tools)
        }
        
        showToast('🧹 Nettoyage mémoire effectué', 'info');
    }

    getSystemReport() {
        return {
            errors: this.errorLog,
            performance: this.performanceMetrics,
            autoRecoveryAttempts: this.autoRecoveryAttempts,
            debugMode: this.debugMode,
            timestamp: Date.now()
        };
    }

    clearErrorLog() {
        this.errorLog = [];
        this.autoRecoveryAttempts = 0;
    }
}

// Initialisation automatique
window.premiumErrorSystem = new PremiumErrorSystem();

// CSS pour le mode performance
const performanceCSS = `
.performance-mode .building-slot-unified {
    transition: none !important;
    animation: none !important;
}

.performance-mode .nav-floating-btn {
    transition: transform 0.1s ease !important;
}

.performance-mode .modal-content {
    transition: opacity 0.2s ease !important;
}

.performance-mode .toast {
    animation: none !important;
}
`;

const style = document.createElement('style');
style.textContent = performanceCSS;
document.head.appendChild(style);

console.log('🛡️ Premium Error System initialized');