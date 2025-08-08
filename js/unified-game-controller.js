// ===============================================================
// IMPERIUM V20 - UNIFIED GAME CONTROLLER
// ===============================================================
// Contrôleur principal pour l'interface unifiée
// ===============================================================

class UnifiedGameController {
    constructor() {
        this.isInitialized = false;
        this.updateInterval = null;
        this.saveInterval = null;
    }

    async initialize() {
        if (this.isInitialized) return;

        console.log('🏛️ IMPERIUM V20 UNIFIED - Initializing Game Controller...');

        // Vérifier que tous les systèmes sont chargés
        if (!this.checkSystemsReady()) {
            console.log('⏳ Waiting for systems to load...');
            setTimeout(() => this.initialize(), 500);
            return;
        }

        try {
            // Initialiser l'état du jeu
            await this.initializeGameState();

            // Configurer l'interface
            this.setupUnifiedInterface();

            // Démarrer les systèmes
            this.startGameSystems();

            // Marquer comme initialisé
            this.isInitialized = true;

            console.log('✅ Game Controller initialized successfully');
            
            // Afficher message de bienvenue
            this.showInitialWelcome();

        } catch (error) {
            console.error('❌ Failed to initialize game controller:', error);
            this.showErrorMessage('Erreur d\'initialisation du jeu');
        }
    }

    checkSystemsReady() {
        const requiredSystems = [
            'gameState',
            'BUILDING_DEFINITIONS',
            'UNITS_CONFIG',
            'popupSystem',
            'showToast'
        ];

        return requiredSystems.every(system => {
            const exists = window[system] !== undefined;
            if (!exists) console.log(`⚠️ Missing system: ${system}`);
            return exists;
        });
    }

    async initializeGameState() {
        // Charger ou créer l'état du jeu
        if (!gameState || !gameState.city) {
            console.log('🔄 Creating new game state...');
            this.createNewGameState();
        } else {
            console.log('📂 Using existing game state...');
        }

        // Vérifier l'intégrité de l'état
        this.validateGameState();

        // Calculer les stats initiales
        if (typeof recalculateCityStats === 'function') {
            recalculateCityStats();
        }
    }

    createNewGameState() {
        // Créer un état de jeu minimal si aucun n'existe
        if (!window.gameState) {
            window.gameState = {
                player: {
                    name: 'Consul',
                    level: 1,
                    xp: 0,
                    titles: []
                },
                resources: {
                    gold: 1000,
                    food: 500,
                    marble: 200,
                    wood: 300
                },
                storage: {
                    gold: 5000,
                    food: 3000,
                    marble: 2000,
                    wood: 2000
                },
                city: {
                    buildings: this.generateInitialBuildings(),
                    stats: {
                        population: 100,
                        populationCapacity: 500,
                        happiness: 75,
                        level: 1
                    },
                    production: {
                        gold: 0,
                        food: 0,
                        marble: 0,
                        wood: 0,
                        happiness: 0
                    },
                    constructionQueue: [],
                    trainingQueue: [],
                    researchQueue: []
                },
                army: {},
                fleet: {},
                technologies: {},
                quests: [],
                pendingEvents: [],
                gameStartTime: Date.now(),
                lastSave: Date.now()
            };
        }
    }

    generateInitialBuildings() {
        const buildings = [];
        for (let i = 0; i < 20; i++) {
            buildings.push({
                slotId: `slot_${i}`,
                type: i === 0 ? 'forum' : null, // Commencer avec un forum
                level: i === 0 ? 1 : 0,
                constructedAt: i === 0 ? Date.now() : null
            });
        }
        return buildings;
    }

    validateGameState() {
        // Vérifier et corriger les propriétés manquantes
        if (!gameState.resources) gameState.resources = {};
        if (!gameState.storage) gameState.storage = {};
        if (!gameState.city) gameState.city = {};
        if (!gameState.city.buildings) gameState.city.buildings = this.generateInitialBuildings();
        if (!gameState.city.stats) gameState.city.stats = {};
        if (!gameState.city.production) gameState.city.production = {};
        if (!gameState.army) gameState.army = {};
        if (!gameState.fleet) gameState.fleet = {};
    }

    setupUnifiedInterface() {
        // Configurer les événements de l'interface
        this.setupKeyboardShortcuts();
        this.setupFloatingButtons();
        this.setupNotificationSystem();

        // Initialiser l'affichage
        this.refreshAllDisplays();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey && !e.ctrlKey && !e.shiftKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        popupSystem.showResourceManagement();
                        break;
                    case '2':
                        e.preventDefault();
                        popupSystem.showWorldMap();
                        break;
                    case '3':
                        e.preventDefault();
                        showCombatSimulator('land');
                        break;
                    case '4':
                        e.preventDefault();
                        showCombatSimulator('sea');
                        break;
                    case 'q':
                        e.preventDefault();
                        popupSystem.quickBuild();
                        break;
                    case 'w':
                        e.preventDefault();
                        popupSystem.quickRecruit();
                        break;
                    case 'e':
                        e.preventDefault();
                        popupSystem.quickTrade();
                        break;
                    case 'r':
                        e.preventDefault();
                        popupSystem.quickExplore();
                        break;
                }
            }
        });
    }

    setupFloatingButtons() {
        // Créer des boutons flottants dynamiques selon le contexte
        const contextButtons = this.getContextualButtons();
        contextButtons.forEach(button => {
            popupSystem.createFloatingButton(
                button.id,
                button.icon,
                button.action,
                button.position
            );
        });
    }

    getContextualButtons() {
        const buttons = [];
        
        // Bouton d'aide si nouveau joueur
        if (!gameState.player.hasSeenHelp) {
            buttons.push({
                id: 'help-button',
                icon: '❓',
                action: () => this.showHelpSystem(),
                position: { x: window.innerWidth - 80, y: 150 }
            });
        }

        // Bouton d'événements en attente
        if (gameState.pendingEvents && gameState.pendingEvents.length > 0) {
            buttons.push({
                id: 'events-button',
                icon: '📜',
                action: () => this.showPendingEvents(),
                position: { x: window.innerWidth - 80, y: 220 }
            });
        }

        return buttons;
    }

    setupNotificationSystem() {
        // Configuration du système de notifications
        this.notificationQueue = [];
        this.isShowingNotification = false;

        // Traitement périodique de la queue
        setInterval(() => this.processNotificationQueue(), 500);
    }

    processNotificationQueue() {
        if (this.isShowingNotification || this.notificationQueue.length === 0) return;

        const notification = this.notificationQueue.shift();
        this.displayNotification(notification);
    }

    displayNotification(notification) {
        this.isShowingNotification = true;

        const notificationEl = document.createElement('div');
        notificationEl.className = 'game-notification';
        notificationEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5em;">${notification.icon}</span>
                <div>
                    <h5 style="margin: 0; color: #d4651f;">${notification.title}</h5>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em;">${notification.message}</p>
                </div>
            </div>
            ${notification.actions ? `
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    ${notification.actions.map(action => 
                        `<button class="imperium-btn" onclick="${action.callback}" style="padding: 5px 10px; font-size: 0.8em;">
                            ${action.label}
                        </button>`
                    ).join('')}
                </div>
            ` : ''}
        `;

        const container = document.getElementById('notificationSystem');
        if (container) {
            container.appendChild(notificationEl);

            // Auto-remove après délai
            setTimeout(() => {
                notificationEl.remove();
                this.isShowingNotification = false;
            }, notification.duration || 5000);
        }
    }

    startGameSystems() {
        // Démarrer la boucle de jeu principale
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.updateInterval = setInterval(() => this.gameUpdate(), 1000);

        // Démarrer la sauvegarde automatique
        if (this.saveInterval) clearInterval(this.saveInterval);
        this.saveInterval = setInterval(() => this.autoSave(), 30000);

        // Démarrer les événements aléatoires
        this.startRandomEvents();
    }

    gameUpdate() {
        try {
            // Mettre à jour la production
            this.updateProduction();

            // Mettre à jour les constructions
            this.updateConstruction();

            // Mettre à jour l'entraînement
            this.updateTraining();

            // Mettre à jour les quêtes
            this.updateQuests();

            // Rafraîchir l'affichage
            this.refreshAllDisplays();

        } catch (error) {
            console.error('Error in game update:', error);
        }
    }

    updateProduction() {
        if (!gameState.city.production) return;

        Object.entries(gameState.city.production).forEach(([resource, amount]) => {
            if (amount > 0 && gameState.resources[resource] !== undefined) {
                const gainPerSecond = amount / 3600;
                const currentAmount = gameState.resources[resource];
                const maxStorage = gameState.storage[resource] || Infinity;

                if (currentAmount < maxStorage) {
                    gameState.resources[resource] = Math.min(
                        currentAmount + gainPerSecond,
                        maxStorage
                    );
                }
            }
        });
    }

    updateConstruction() {
        // Logique de construction si implémentée dans d'autres fichiers
        if (typeof updateConstructionQueue === 'function') {
            updateConstructionQueue();
        }
    }

    updateTraining() {
        // Logique d'entraînement si implémentée dans d'autres fichiers
        if (typeof updateTrainingQueue === 'function') {
            updateTrainingQueue();
        }
    }

    updateQuests() {
        // Vérifier les objectifs des quêtes
        if (gameState.quests && gameState.quests.length > 0) {
            gameState.quests.forEach(quest => {
                if (!quest.completed && this.checkQuestCompletion(quest)) {
                    this.completeQuest(quest);
                }
            });
        }
    }

    checkQuestCompletion(quest) {
        // Logique simple de vérification de quête
        if (quest.type === 'build' && quest.building) {
            return gameState.city.buildings.some(b => 
                b.type === quest.building && b.level >= (quest.level || 1)
            );
        }
        
        if (quest.type === 'resource' && quest.resource) {
            return gameState.resources[quest.resource] >= quest.amount;
        }

        return false;
    }

    completeQuest(quest) {
        quest.completed = true;
        quest.completedAt = Date.now();

        // Récompenses
        if (quest.rewards) {
            quest.rewards.forEach(reward => {
                if (reward.type === 'resource') {
                    gameState.resources[reward.resource] = 
                        (gameState.resources[reward.resource] || 0) + reward.amount;
                }
            });
        }

        // Notification
        this.queueNotification({
            icon: '🎯',
            title: 'Quête terminée!',
            message: `${quest.name} - ${quest.description}`,
            duration: 6000
        });
    }

    refreshAllDisplays() {
        // Mettre à jour tous les affichages de l'interface
        if (typeof updateResourcesDisplay === 'function') {
            updateResourcesDisplay();
        }
        
        if (typeof updateCityStatsDisplay === 'function') {
            updateCityStatsDisplay();
        }
        
        if (typeof renderUnifiedBuildingsGrid === 'function') {
            renderUnifiedBuildingsGrid();
        }
    }

    autoSave() {
        try {
            if (typeof saveGameState === 'function') {
                saveGameState();
                console.log('🔄 Auto-save completed');
            }
        } catch (error) {
            console.error('❌ Auto-save failed:', error);
        }
    }

    startRandomEvents() {
        // Événements aléatoires périodiques
        const eventInterval = 5 * 60 * 1000; // Toutes les 5 minutes
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% de chance
                this.triggerRandomEvent();
            }
        }, eventInterval);
    }

    triggerRandomEvent() {
        const events = [
            {
                title: 'Commerce prospère',
                description: 'Vos marchands rapportent des profits exceptionnels!',
                icon: '💰',
                effect: () => {
                    gameState.resources.gold += Math.floor(Math.random() * 200) + 100;
                },
                effectMessage: 'Vous gagnez de l\'or supplémentaire!'
            },
            {
                title: 'Bonne récolte',
                description: 'Les récoltes sont exceptionnelles cette saison.',
                icon: '🌾',
                effect: () => {
                    gameState.resources.food += Math.floor(Math.random() * 300) + 150;
                },
                effectMessage: 'Vos réserves de nourriture augmentent!'
            },
            {
                title: 'Festival populaire',
                description: 'Le peuple célèbre et le bonheur augmente!',
                icon: '🎭',
                effect: () => {
                    gameState.city.stats.happiness = Math.min(100, gameState.city.stats.happiness + 10);
                },
                effectMessage: 'Le bonheur de la population augmente!'
            }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        event.effect();

        this.queueNotification({
            icon: event.icon,
            title: event.title,
            message: `${event.description} ${event.effectMessage}`,
            duration: 8000
        });
    }

    queueNotification(notification) {
        this.notificationQueue.push(notification);
    }

    showInitialWelcome() {
        setTimeout(() => {
            this.queueNotification({
                icon: '🏛️',
                title: 'Bienvenue dans IMPERIUM V20!',
                message: 'Votre empire unifié vous attend. Utilisez Alt+1-4 pour les raccourcis clavier.',
                duration: 10000,
                actions: [
                    {
                        label: 'Aide',
                        callback: 'unifiedController.showHelpSystem()'
                    }
                ]
            });
        }, 2000);
    }

    showHelpSystem() {
        const content = `
            <div class="help-system">
                <h3 style="text-align: center; color: #d4651f; margin-bottom: 20px;">📖 Guide de IMPERIUM V20</h3>
                
                <div class="help-section" style="margin-bottom: 20px;">
                    <h4>🎮 Interface Unifiée</h4>
                    <p>Toutes les fonctionnalités sont accessibles via des popups dynamiques. Cliquez sur les boutons flottants ou utilisez les raccourcis clavier.</p>
                </div>
                
                <div class="help-section" style="margin-bottom: 20px;">
                    <h4>⌨️ Raccourcis Clavier</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-family: monospace;">
                        <span>Alt + 1</span><span>Ressources</span>
                        <span>Alt + 2</span><span>Monde Antique</span>
                        <span>Alt + 3</span><span>Combat Terrestre</span>
                        <span>Alt + 4</span><span>Combat Naval</span>
                        <span>Alt + Q</span><span>Construction rapide</span>
                        <span>Alt + W</span><span>Recrutement rapide</span>
                        <span>Alt + E</span><span>Commerce rapide</span>
                        <span>Alt + R</span><span>Explorer le monde</span>
                    </div>
                </div>
                
                <div class="help-section" style="margin-bottom: 20px;">
                    <h4>🏗️ Construction</h4>
                    <p>Cliquez sur un terrain libre pour construire. Les bâtiments peuvent être améliorés et certains proposent des interactions spéciales.</p>
                </div>
                
                <div class="help-section" style="margin-bottom: 20px;">
                    <h4>⚔️ Combat</h4>
                    <p>Les simulateurs de combat terrestre et naval sont intégrés dans l'interface. Testez vos stratégies sans risque!</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button class="imperium-btn" onclick="popupSystem.closePopup('help-system'); unifiedController.markHelpSeen();">
                        J'ai compris!
                    </button>
                </div>
            </div>
        `;

        popupSystem.createPopup('help-system', '📖 Guide de IMPERIUM', content, 'large', 'center');
    }

    markHelpSeen() {
        gameState.player.hasSeenHelp = true;
        popupSystem.removeFloatingButton('help-button');
    }

    showErrorMessage(message) {
        this.queueNotification({
            icon: '❌',
            title: 'Erreur',
            message: message,
            duration: 8000
        });
    }

    // Méthodes de nettoyage
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }

        this.isInitialized = false;
        console.log('🔴 Game Controller destroyed');
    }
}

// Instance globale
const unifiedController = new UnifiedGameController();

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => unifiedController.initialize(), 1000);
});

// Export pour les autres modules
window.unifiedController = unifiedController;