// Battle Pass Integration - Intégration avec le système de jeu principal
// Ce fichier connecte le Battle Pass aux événements du jeu

// Fonction globale pour afficher le Battle Pass depuis le dashboard
function showBattlePassModal() {
    console.log('🎖️ Ouverture du Battle Pass...');
    
    if (window.battlePassSystem) {
        window.battlePassSystem.showBattlePassUI();
    } else {
        // Si le Battle Pass n'est pas encore chargé, on attend
        setTimeout(() => {
            if (window.battlePassSystem) {
                window.battlePassSystem.showBattlePassUI();
            } else {
                showToast('🎖️ Battle Pass en cours de chargement...', 'warning');
            }
        }, 1000);
    }
}

// Mise à jour du preview du Battle Pass dans le dashboard
function updateBattlePassPreview() {
    const previewElement = document.getElementById('battle-pass-tile-preview');
    if (!previewElement || !window.battlePassSystem) return;
    
    const progress = window.battlePassSystem.getCurrentProgress();
    previewElement.innerHTML = `
        Niveau ${progress.currentLevel}/${progress.maxLevel} 
        <span style="color: #d4651f;">(${Math.round(progress.progressPercent)}%)</span>
    `;
}

// Hook dans les événements du jeu pour donner automatiquement de l'XP
class BattlePassGameIntegration {
    constructor() {
        this.initialized = false;
        this.init();
    }
    
    init() {
        // Attendre que le Battle Pass soit prêt
        const checkBattlePass = () => {
            if (window.battlePassSystem && !this.initialized) {
                this.setupIntegration();
                this.initialized = true;
                console.log('🎖️ Battle Pass intégré au jeu principal !');
            } else if (!this.initialized) {
                setTimeout(checkBattlePass, 500);
            }
        };
        
        checkBattlePass();
    }
    
    setupIntegration() {
        // Intégration avec le système de construction
        this.hookBuildingSystem();
        
        // Intégration avec le système de combat
        this.hookCombatSystem();
        
        // Intégration avec le système de quêtes
        this.hookQuestSystem();
        
        // Intégration avec la production de ressources
        this.hookResourceSystem();
        
        // Mise à jour périodique de l'interface
        this.startPeriodicUpdates();
    }
    
    hookBuildingSystem() {
        // Override la fonction de construction pour donner de l'XP
        const originalBuildingFunction = window.completeBuildingConstruction;
        if (originalBuildingFunction) {
            window.completeBuildingConstruction = (buildingData) => {
                const result = originalBuildingFunction(buildingData);
                
                // Calculer l'XP basé sur le coût du bâtiment
                const buildingDef = window.BUILDING_DEFINITIONS?.[buildingData.type];
                if (buildingDef) {
                    const cost = buildingDef.cost?.gold || 100;
                    const xpGained = window.battlePassSystem.onBuildingConstructed(cost);
                    
                    this.showXPGainedNotification(xpGained, '🏗️ Construction terminée !');
                }
                
                return result;
            };
        }
        
        // Observer les mutations DOM pour les constructions
        this.observeBuildingChanges();
    }
    
    hookCombatSystem() {
        // Hook pour les victoires de combat
        document.addEventListener('imperiumCombatVictory', (event) => {
            const enemyLevel = event.detail?.enemyLevel || 1;
            const xpGained = window.battlePassSystem.onCombatVictory(enemyLevel);
            this.showXPGainedNotification(xpGained, '⚔️ Victoire au combat !');
        });
        
        // Observer les simulateurs de combat
        this.observeCombatResults();
    }
    
    hookQuestSystem() {
        // Observer les changements de quêtes
        const originalCompleteQuest = window.completeCurrentQuest;
        if (originalCompleteQuest) {
            window.completeCurrentQuest = () => {
                const result = originalCompleteQuest();
                
                const xpGained = window.battlePassSystem.onQuestCompleted();
                this.showXPGainedNotification(xpGained, '🎯 Objectif accompli !');
                
                return result;
            };
        }
    }
    
    hookResourceSystem() {
        // Donner de l'XP périodiquement pour la production de ressources
        let lastResourceCheck = Date.now();
        
        setInterval(() => {
            if (!window.gameState?.resources) return;
            
            const currentTime = Date.now();
            const timeDiff = currentTime - lastResourceCheck;
            
            // XP basé sur la production (environ toutes les 30 secondes)
            if (timeDiff > 30000) {
                const totalProduction = this.calculateTotalProduction();
                if (totalProduction > 0) {
                    const xpGained = window.battlePassSystem.onResourcesGathered(totalProduction);
                    
                    if (Math.random() < 0.1) { // 10% de chance d'afficher la notification
                        this.showXPGainedNotification(xpGained, '💰 Production de ressources !', 'small');
                    }
                }
                lastResourceCheck = currentTime;
            }
        }, 30000);
    }
    
    calculateTotalProduction() {
        if (!window.gameState?.city?.buildings) return 0;
        
        let total = 0;
        window.gameState.city.buildings.forEach(building => {
            if (building.type) {
                const def = window.BUILDING_DEFINITIONS?.[building.type];
                if (def?.production) {
                    total += Object.values(def.production).reduce((sum, val) => sum + val, 0);
                }
            }
        });
        
        return total;
    }
    
    observeBuildingChanges() {
        // Observer pour détecter les nouveaux bâtiments
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.classList?.contains('building-slot') && node.classList.contains('occupied')) {
                            // Nouveau bâtiment détecté
                            setTimeout(() => {
                                const buildingType = node.dataset?.buildingType;
                                if (buildingType) {
                                    const def = window.BUILDING_DEFINITIONS?.[buildingType];
                                    if (def) {
                                        const xpGained = window.battlePassSystem.onBuildingConstructed(def.cost?.gold || 100);
                                        this.showXPGainedNotification(xpGained, `🏗️ ${def.name} construit !`);
                                    }
                                }
                            }, 1000);
                        }
                    });
                }
            });
        });
        
        const buildingsGrid = document.getElementById('buildingsGrid');
        if (buildingsGrid) {
            observer.observe(buildingsGrid, { childList: true, subtree: true });
        }
    }
    
    observeCombatResults() {
        // Observer les résultats de combat dans les modals
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.querySelector && node.querySelector('.battle-result')) {
                        const isVictory = node.textContent.includes('Victoire') || 
                                        node.textContent.includes('Victory') ||
                                        node.textContent.includes('🎉');
                        
                        if (isVictory) {
                            const xpGained = window.battlePassSystem.onCombatVictory(1);
                            this.showXPGainedNotification(xpGained, '⚔️ Bataille gagnée !');
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    showXPGainedNotification(xp, message, size = 'normal') {
        if (xp <= 0) return;
        
        const notification = document.createElement('div');
        notification.className = `battle-pass-xp-gain ${size}`;
        notification.innerHTML = `
            <div class="xp-content">
                <div class="xp-icon">🎖️</div>
                <div class="xp-text">
                    <span class="xp-message">${message}</span>
                    <span class="xp-amount">+${xp} XP</span>
                </div>
            </div>
        `;
        
        // Style de la notification
        notification.style.cssText = `
            position: fixed;
            bottom: ${size === 'small' ? '100px' : '150px'};
            right: 20px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: ${size === 'small' ? '10px' : '15px'};
            border-radius: 10px;
            z-index: 9999;
            font-size: ${size === 'small' ? '0.8em' : '0.9em'};
            font-weight: bold;
            animation: xpGainSlide 3s ease;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
            border: 2px solid #fbbf24;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    startPeriodicUpdates() {
        // Mettre à jour le preview du Battle Pass régulièrement
        setInterval(() => {
            updateBattlePassPreview();
        }, 5000);
        
        // Première mise à jour immédiate
        setTimeout(() => {
            updateBattlePassPreview();
        }, 1000);
    }
}

// Styles pour les notifications XP
const xpNotificationStyles = `
<style>
@keyframes xpGainSlide {
    0% { 
        transform: translateX(100%);
        opacity: 0;
    }
    20%, 80% { 
        transform: translateX(0);
        opacity: 1;
    }
    100% { 
        transform: translateX(100%);
        opacity: 0;
    }
}

.battle-pass-xp-gain .xp-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.battle-pass-xp-gain .xp-icon {
    font-size: 1.5em;
}

.battle-pass-xp-gain .xp-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.battle-pass-xp-gain .xp-message {
    font-size: 0.9em;
    opacity: 0.9;
}

.battle-pass-xp-gain .xp-amount {
    font-size: 1.1em;
    color: #fbbf24;
    font-weight: bold;
}

/* Styles pour le bouton Battle Pass dans la navigation */
.battle-pass-nav-btn {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border: 2px solid #fbbf24;
    color: white;
    padding: 8px 15px;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 0.9em;
    position: relative;
}

.battle-pass-nav-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.5);
}

.battle-pass-nav-btn .level-indicator {
    background: #1f2937;
    color: #fbbf24;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 0.7em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 5px;
    font-weight: bold;
}
</style>
`;

// Injection des styles
document.head.insertAdjacentHTML('beforeend', xpNotificationStyles);

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que le jeu soit initialisé
    setTimeout(() => {
        window.battlePassIntegration = new BattlePassGameIntegration();
        console.log('🎖️ Battle Pass Integration loaded!');
    }, 2000);
});

// Export global
window.showBattlePassModal = showBattlePassModal;
window.updateBattlePassPreview = updateBattlePassPreview;