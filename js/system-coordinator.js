// ===============================================================
// IMPERIUM V20 - SYSTEM COORDINATOR
// ===============================================================
// Ce fichier coordonne l'initialisation de tous les systèmes
// pour éviter les conflits et garantir une initialisation ordonnée
// ===============================================================

class SystemCoordinator {
    constructor() {
        this.systems = new Map();
        this.initializationOrder = [
            'gameCore',
            'resources', 
            'buildings',
            'units',
            'battle',
            'interface',
            'premium',
            'mobile'
        ];
        this.initialized = false;
        this.errors = [];
    }

    // Enregistrer un système
    registerSystem(name, system, priority = 5) {
        this.systems.set(name, {
            instance: system,
            priority: priority,
            initialized: false,
            dependencies: system.dependencies || [],
            errors: []
        });
        console.log(`📝 Système enregistré: ${name} (priorité: ${priority})`);
    }

    // Initialiser tous les systèmes dans l'ordre
    async initializeAllSystems() {
        if (this.initialized) {
            console.log('⚠️ Systèmes déjà initialisés');
            return;
        }

        console.log('🚀 IMPERIUM V20 - Initialisation coordonnée des systèmes...');
        
        try {
            // Phase 1: Vérification des prérequis
            await this.checkPrerequisites();
            
            // Phase 2: Initialisation du coeur du jeu
            await this.initializeGameCore();
            
            // Phase 3: Initialisation des systèmes par ordre de priorité
            await this.initializeSystemsByPriority();
            
            // Phase 4: Vérification post-initialisation
            await this.postInitializationCheck();
            
            // Phase 5: Démarrage des systèmes actifs
            await this.startActiveSystems();
            
            this.initialized = true;
            console.log('✅ Tous les systèmes ont été initialisés avec succès');
            
            // Afficher le rapport d'initialisation
            this.displayInitializationReport();
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation des systèmes:', error);
            this.handleInitializationError(error);
        }
    }

    // Vérifier les prérequis
    async checkPrerequisites() {
        console.log('🔍 Vérification des prérequis...');
        
        const requiredGlobals = [
            'BUILDING_DEFINITIONS',
            'UNITS_CONFIG', 
            'HEROES_CONFIG',
            'TERRAINS_CONFIG'
        ];

        let missingGlobals = [];
        requiredGlobals.forEach(global => {
            if (typeof window[global] === 'undefined') {
                missingGlobals.push(global);
            }
        });

        if (missingGlobals.length > 0) {
            throw new Error(`Prérequis manquants: ${missingGlobals.join(', ')}`);
        }

        console.log('✅ Tous les prérequis sont présents');
    }

    // Initialiser le coeur du jeu
    async initializeGameCore() {
        console.log('🏛️ Initialisation du coeur du jeu...');
        
        try {
            // Initialiser gameState si nécessaire
            if (typeof window.gameState === 'undefined') {
                if (typeof initializeGameState === 'function') {
                    initializeGameState();
                    console.log('✅ gameState initialisé');
                } else {
                    throw new Error('Fonction initializeGameState non trouvée');
                }
            }

            // Valider gameState
            this.validateGameState();
            
            // Initialiser le stockage
            this.initializeStorage();
            
        } catch (error) {
            console.error('❌ Erreur initialisation coeur:', error);
            throw error;
        }
    }

    // Valider l'état du jeu
    validateGameState() {
        const required = ['resources', 'buildings', 'army', 'level', 'xp'];
        let missing = [];
        
        required.forEach(prop => {
            if (!gameState.hasOwnProperty(prop)) {
                missing.push(prop);
            }
        });

        if (missing.length > 0) {
            console.warn(`⚠️ Propriétés gameState manquantes: ${missing.join(', ')}`);
            
            // Créer les propriétés manquantes avec des valeurs par défaut
            missing.forEach(prop => {
                switch(prop) {
                    case 'resources':
                        gameState.resources = { gold: 1000, food: 500, marble: 100, wood: 200 };
                        break;
                    case 'buildings':
                        gameState.buildings = {};
                        break;
                    case 'army':
                        gameState.army = { land: {}, sea: {} };
                        break;
                    case 'level':
                        gameState.level = 1;
                        break;
                    case 'xp':
                        gameState.xp = 0;
                        break;
                }
            });
            
            console.log('✅ Propriétés gameState complétées');
        }
    }

    // Initialiser le stockage
    initializeStorage() {
        try {
            if (typeof Storage !== 'undefined') {
                // Vérifier si une sauvegarde existe
                const savedGame = localStorage.getItem('imperium_savegame');
                if (savedGame) {
                    console.log('💾 Sauvegarde trouvée');
                }
                console.log('✅ Système de stockage opérationnel');
            } else {
                console.warn('⚠️ localStorage non disponible');
            }
        } catch (error) {
            console.error('❌ Erreur stockage:', error);
        }
    }

    // Initialiser les systèmes par ordre de priorité
    async initializeSystemsByPriority() {
        console.log('⚙️ Initialisation des systèmes...');
        
        // Trier les systèmes par priorité
        const sortedSystems = Array.from(this.systems.entries())
            .sort((a, b) => a[1].priority - b[1].priority);

        for (const [name, systemData] of sortedSystems) {
            try {
                await this.initializeSystem(name, systemData);
            } catch (error) {
                console.error(`❌ Erreur initialisation ${name}:`, error);
                systemData.errors.push(error.message);
                this.errors.push(`${name}: ${error.message}`);
            }
        }
    }

    // Initialiser un système spécifique
    async initializeSystem(name, systemData) {
        if (systemData.initialized) return;

        console.log(`🔧 Initialisation ${name}...`);
        
        // Vérifier les dépendances
        for (const dep of systemData.dependencies) {
            const depSystem = this.systems.get(dep);
            if (!depSystem || !depSystem.initialized) {
                throw new Error(`Dépendance non satisfaite: ${dep}`);
            }
        }

        // Initialiser le système
        if (typeof systemData.instance.initialize === 'function') {
            await systemData.instance.initialize();
        } else if (typeof systemData.instance.init === 'function') {
            await systemData.instance.init();
        }

        systemData.initialized = true;
        console.log(`✅ ${name} initialisé`);
    }

    // Vérification post-initialisation
    async postInitializationCheck() {
        console.log('🔍 Vérification post-initialisation...');
        
        // Vérifier que les fonctions essentielles existent
        const essentialFunctions = [
            'updateResources',
            'canAfford',
            'buildBuilding',
            'trainUnit',
            'saveGame',
            'loadGame'
        ];

        let missingFunctions = [];
        essentialFunctions.forEach(func => {
            if (typeof window[func] !== 'function') {
                missingFunctions.push(func);
            }
        });

        if (missingFunctions.length > 0) {
            console.warn(`⚠️ Fonctions manquantes: ${missingFunctions.join(', ')}`);
            this.errors.push(`Fonctions manquantes: ${missingFunctions.join(', ')}`);
        } else {
            console.log('✅ Toutes les fonctions essentielles sont présentes');
        }
    }

    // Démarrer les systèmes actifs
    async startActiveSystems() {
        console.log('▶️ Démarrage des systèmes actifs...');
        
        // Démarrer les timers de production
        if (typeof startGameLoop === 'function') {
            startGameLoop();
            console.log('✅ Boucle de jeu démarrée');
        }

        // Démarrer la sauvegarde automatique
        this.startAutoSave();
        
        // Initialiser l'interface utilisateur
        this.initializeUI();
    }

    // Démarrer la sauvegarde automatique
    startAutoSave() {
        setInterval(() => {
            try {
                if (typeof saveGame === 'function') {
                    saveGame();
                    console.log('💾 Sauvegarde automatique effectuée');
                }
            } catch (error) {
                console.error('❌ Erreur sauvegarde auto:', error);
            }
        }, 60000); // Toutes les minutes
    }

    // Initialiser l'interface utilisateur
    initializeUI() {
        console.log('🎨 Initialisation de l\'interface utilisateur...');
        
        try {
            // Mettre à jour l'affichage des ressources
            if (typeof updateResourcesDisplay === 'function') {
                updateResourcesDisplay();
            }

            // Mettre à jour l'affichage des bâtiments
            if (typeof updateBuildingsDisplay === 'function') {
                updateBuildingsDisplay();
            }

            // Configurer les gestionnaires d'événements
            this.setupEventHandlers();
            
            console.log('✅ Interface utilisateur initialisée');
        } catch (error) {
            console.error('❌ Erreur initialisation UI:', error);
        }
    }

    // Configurer les gestionnaires d'événements
    setupEventHandlers() {
        // Gestionnaire de fermeture de page pour sauvegarde
        window.addEventListener('beforeunload', (e) => {
            try {
                if (typeof saveGame === 'function') {
                    saveGame();
                }
            } catch (error) {
                console.error('❌ Erreur sauvegarde fermeture:', error);
            }
        });

        // Gestionnaire de changement de visibilité pour pause/reprise
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('⏸️ Jeu en arrière-plan');
            } else {
                console.log('▶️ Jeu au premier plan');
                // Mettre à jour l'affichage
                if (typeof updateAllDisplays === 'function') {
                    updateAllDisplays();
                }
            }
        });
    }

    // Afficher le rapport d'initialisation
    displayInitializationReport() {
        console.log('\n🏛️ RAPPORT D\'INITIALISATION IMPERIUM V20');
        console.log('══════════════════════════════════════════');
        
        const totalSystems = this.systems.size;
        const initializedSystems = Array.from(this.systems.values()).filter(s => s.initialized).length;
        const errorSystems = Array.from(this.systems.values()).filter(s => s.errors.length > 0).length;
        
        console.log(`📊 Systèmes total: ${totalSystems}`);
        console.log(`✅ Systèmes initialisés: ${initializedSystems}`);
        console.log(`❌ Systèmes avec erreurs: ${errorSystems}`);
        
        if (this.errors.length > 0) {
            console.log('\n⚠️ ERREURS DÉTECTÉES:');
            this.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        const successRate = Math.round((initializedSystems / totalSystems) * 100);
        console.log(`\n🎯 Taux de réussite: ${successRate}%`);
        
        if (successRate >= 95) {
            console.log('🏆 EXCELLENT! Tous les systèmes sont opérationnels.');
        } else if (successRate >= 80) {
            console.log('✅ BON! Le jeu fonctionne avec quelques problèmes mineurs.');
        } else if (successRate >= 60) {
            console.log('⚠️ MOYEN! Des corrections sont nécessaires.');
        } else {
            console.log('❌ CRITIQUE! Des corrections majeures sont requises.');
        }
        
        console.log('══════════════════════════════════════════\n');
    }

    // Gérer les erreurs d'initialisation
    handleInitializationError(error) {
        console.error('🚨 ERREUR CRITIQUE D\'INITIALISATION');
        console.error('Cette erreur empêche le bon fonctionnement du jeu.');
        console.error('Détails:', error);
        
        // Afficher une notification à l'utilisateur
        if (typeof showNotification === 'function') {
            showNotification('Erreur d\'initialisation du jeu. Veuillez recharger la page.', 'error', 10000);
        } else {
            alert('Erreur d\'initialisation du jeu. Veuillez recharger la page.');
        }
    }

    // Obtenir le statut d'un système
    getSystemStatus(name) {
        const system = this.systems.get(name);
        if (!system) return 'not_found';
        if (system.errors.length > 0) return 'error';
        if (system.initialized) return 'initialized';
        return 'pending';
    }

    // Réinitialiser un système
    async reinitializeSystem(name) {
        const systemData = this.systems.get(name);
        if (!systemData) {
            throw new Error(`Système ${name} non trouvé`);
        }

        systemData.initialized = false;
        systemData.errors = [];
        
        await this.initializeSystem(name, systemData);
    }
}

// Instance globale du coordinateur
window.SystemCoordinator = new SystemCoordinator();

// Enregistrement automatique des systèmes connus
document.addEventListener('DOMContentLoaded', () => {
    const coordinator = window.SystemCoordinator;
    
    // Enregistrer les systèmes disponibles
    if (typeof window.UnifiedGameController === 'function') {
        coordinator.registerSystem('gameController', new UnifiedGameController(), 1);
    }
    
    if (typeof window.BattlePassSystem === 'object') {
        coordinator.registerSystem('battlePass', window.BattlePassSystem, 7);
    }
    
    if (typeof window.AchievementSystem === 'object') {
        coordinator.registerSystem('achievements', window.AchievementSystem, 6);
    }
    
    if (typeof window.UnifiedPopupSystem === 'object') {
        coordinator.registerSystem('popups', window.UnifiedPopupSystem, 4);
    }
    
    // Démarrer l'initialisation coordonnée
    setTimeout(() => {
        coordinator.initializeAllSystems();
    }, 1000); // Délai pour laisser tous les scripts se charger
    
    console.log('🎮 SystemCoordinator prêt - Initialisation dans 1 seconde...');
});

// Export pour usage externe
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SystemCoordinator;
}