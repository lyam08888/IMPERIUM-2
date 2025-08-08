// prestige-system.js - Système de prestige/renaissance pour la rejouabilité
// Permet aux joueurs de recommencer avec des bonus permanents

class PrestigeSystem {
    constructor() {
        this.prestigeData = {
            level: 0,
            totalResets: 0,
            prestigePoints: 0,
            unlockedBonuses: {},
            lifetimeStats: {
                totalGoldEarned: 0,
                totalBuildingsBuilt: 0,
                totalUnitsTrained: 0,
                totalPlayTime: 0,
                highestLevel: 0,
                highestPopulation: 0
            }
        };
        
        this.loadPrestigeData();
        this.prestigeBonuses = PRESTIGE_BONUSES;
        this.requirementsCache = null;
    }

    loadPrestigeData() {
        const saved = localStorage.getItem('imperium_prestige');
        if (saved) {
            const data = JSON.parse(saved);
            this.prestigeData = { ...this.prestigeData, ...data };
        }
    }

    canPrestige(gameState) {
        // Conditions pour pouvoir faire un prestige
        const requirements = this.getPrestigeRequirements();
        
        return requirements.every(req => {
            switch (req.type) {
                case 'level':
                    return gameState.player.level >= req.value;
                case 'population':
                    return gameState.city.stats.population >= req.value;
                case 'buildings':
                    return gameState.city.buildings.filter(b => b.type !== null).length >= req.value;
                case 'achievement_points':
                    return getTotalAchievementPoints() >= req.value;
                case 'playtime':
                    const playTime = Date.now() - (gameState.gameStartTime || Date.now());
                    return playTime >= req.value;
                default:
                    return false;
            }
        });
    }

    getPrestigeRequirements() {
        if (this.requirementsCache) return this.requirementsCache;
        
        // Les exigences augmentent avec chaque prestige
        const baseRequirements = [
            { type: 'level', value: 25, description: 'Atteindre le niveau 25' },
            { type: 'population', value: 5000, description: 'Avoir 5 000 habitants' },
            { type: 'buildings', value: 30, description: 'Construire 30 bâtiments' },
            { type: 'achievement_points', value: 100, description: 'Obtenir 100 points d\'accomplissement' }
        ];

        // Augmenter la difficulté selon le niveau de prestige actuel
        const multiplier = Math.pow(1.5, this.prestigeData.level);
        
        this.requirementsCache = baseRequirements.map(req => ({
            ...req,
            value: Math.floor(req.value * multiplier)
        }));
        
        return this.requirementsCache;
    }

    calculatePrestigeReward(gameState) {
        // Calculer combien de points de prestige le joueur gagnera
        let points = 0;
        
        // Points basés sur le niveau
        points += Math.floor(gameState.player.level * 2);
        
        // Points basés sur la population
        points += Math.floor(gameState.city.stats.population / 1000);
        
        // Points basés sur les accomplissements
        points += Math.floor(getTotalAchievementPoints() / 10);
        
        // Points basés sur les bâtiments
        points += gameState.city.buildings.filter(b => b.type !== null).length;
        
        // Bonus pour les prestiges multiples
        points = Math.floor(points * (1 + this.prestigeData.level * 0.1));
        
        return Math.max(10, points); // Minimum 10 points
    }

    performPrestige(gameState) {
        if (!this.canPrestige(gameState)) {
            return { success: false, message: "Conditions de prestige non remplies." };
        }

        // Calculer les récompenses
        const pointsGained = this.calculatePrestigeReward(gameState);
        
        // Sauvegarder les statistiques à vie
        this.updateLifetimeStats(gameState);
        
        // Augmenter le niveau de prestige
        this.prestigeData.level++;
        this.prestigeData.totalResets++;
        this.prestigeData.prestigePoints += pointsGained;
        
        // Créer un nouvel état de jeu avec des bonus
        const newGameState = this.createPrestigedGameState(gameState);
        
        // Sauvegarder
        this.save();
        
        // Notification
        if (gameController) {
            gameController.queueNotification({
                icon: '✨',
                title: 'PRESTIGE ACCOMPLI!',
                message: `Niveau de prestige ${this.prestigeData.level}! +${pointsGained} points`,
                duration: 8000
            });
        }

        return { 
            success: true, 
            newGameState,
            pointsGained,
            prestigeLevel: this.prestigeData.level
        };
    }

    updateLifetimeStats(gameState) {
        this.prestigeData.lifetimeStats.totalGoldEarned += gameState.resources.gold || 0;
        this.prestigeData.lifetimeStats.totalBuildingsBuilt += gameState.city.buildings.filter(b => b.type !== null).length;
        this.prestigeData.lifetimeStats.totalUnitsTrained += Object.values(gameState.unitPool || {}).reduce((a, b) => a + b, 0);
        this.prestigeData.lifetimeStats.totalPlayTime += Date.now() - (gameState.gameStartTime || Date.now());
        this.prestigeData.lifetimeStats.highestLevel = Math.max(this.prestigeData.lifetimeStats.highestLevel, gameState.player.level);
        this.prestigeData.lifetimeStats.highestPopulation = Math.max(this.prestigeData.lifetimeStats.highestPopulation, gameState.city.stats.population);
    }

    createPrestigedGameState(oldState) {
        // Créer un nouvel état de jeu avec les bonus de prestige
        const newState = getDefaultGameState();
        
        // Appliquer les bonus de prestige
        const bonuses = this.getActivePrestigeBonuses();
        
        bonuses.forEach(bonus => {
            this.applyPrestigeBonus(bonus, newState);
        });
        
        // Garder certaines progressions importantes
        newState.prestige = {
            level: this.prestigeData.level,
            points: this.prestigeData.prestigePoints,
            bonuses: bonuses
        };
        
        // Marquer le temps de démarrage
        newState.gameStartTime = Date.now();
        newState.lastUpdate = Date.now();
        
        return newState;
    }

    getActivePrestigeBonuses() {
        return Object.keys(this.prestigeData.unlockedBonuses)
            .filter(id => this.prestigeData.unlockedBonuses[id])
            .map(id => ({ id, ...this.prestigeBonuses[id] }));
    }

    applyPrestigeBonus(bonus, gameState) {
        switch (bonus.type) {
            case 'starting_resource':
                gameState.resources[bonus.resource] += bonus.amount;
                break;
                
            case 'production_multiplier':
                gameState.modifiers = gameState.modifiers || {};
                gameState.modifiers[`${bonus.resource}_production`] = 
                    (gameState.modifiers[`${bonus.resource}_production`] || 0) + bonus.multiplier;
                break;
                
            case 'experience_multiplier':
                gameState.modifiers = gameState.modifiers || {};
                gameState.modifiers.experience_gain = 
                    (gameState.modifiers.experience_gain || 0) + bonus.multiplier;
                break;
                
            case 'construction_speed':
                gameState.modifiers = gameState.modifiers || {};
                gameState.modifiers.construction_speed = 
                    (gameState.modifiers.construction_speed || 0) + bonus.multiplier;
                break;
                
            case 'starting_buildings':
                // Donner des bâtiments de départ
                bonus.buildings.forEach((building, index) => {
                    if (gameState.city.buildings[index]) {
                        gameState.city.buildings[index].type = building.type;
                        gameState.city.buildings[index].level = building.level || 1;
                    }
                });
                break;
        }
    }

    canUnlockBonus(bonusId) {
        const bonus = this.prestigeBonuses[bonusId];
        if (!bonus) return false;
        
        return this.prestigeData.prestigePoints >= bonus.cost &&
               !this.prestigeData.unlockedBonuses[bonusId];
    }

    unlockBonus(bonusId) {
        if (!this.canUnlockBonus(bonusId)) {
            return { success: false, message: "Cannot unlock this bonus." };
        }
        
        const bonus = this.prestigeBonuses[bonusId];
        this.prestigeData.prestigePoints -= bonus.cost;
        this.prestigeData.unlockedBonuses[bonusId] = true;
        
        this.save();
        
        return { success: true, message: `Bonus unlocked: ${bonus.name}` };
    }

    getPrestigeStats() {
        return {
            level: this.prestigeData.level,
            points: this.prestigeData.prestigePoints,
            totalResets: this.prestigeData.totalResets,
            lifetimeStats: this.prestigeData.lifetimeStats,
            unlockedBonuses: Object.keys(this.prestigeData.unlockedBonuses).filter(id => this.prestigeData.unlockedBonuses[id]).length,
            totalBonuses: Object.keys(this.prestigeBonuses).length
        };
    }

    getAvailableBonuses() {
        return Object.keys(this.prestigeBonuses).map(id => ({
            id,
            ...this.prestigeBonuses[id],
            unlocked: this.prestigeData.unlockedBonuses[id] || false,
            canAfford: this.prestigeData.prestigePoints >= this.prestigeBonuses[id].cost
        }));
    }

    save() {
        localStorage.setItem('imperium_prestige', JSON.stringify(this.prestigeData));
    }

    reset() {
        this.prestigeData = {
            level: 0,
            totalResets: 0,
            prestigePoints: 0,
            unlockedBonuses: {},
            lifetimeStats: {
                totalGoldEarned: 0,
                totalBuildingsBuilt: 0,
                totalUnitsTrained: 0,
                totalPlayTime: 0,
                highestLevel: 0,
                highestPopulation: 0
            }
        };
        localStorage.removeItem('imperium_prestige');
        this.requirementsCache = null;
    }
}

// Définitions des bonus de prestige
const PRESTIGE_BONUSES = {
    gold_start: {
        name: "Fortune Héritée",
        description: "Commencez avec 5 000 pièces d'or supplémentaires",
        type: 'starting_resource',
        resource: 'gold',
        amount: 5000,
        cost: 10
    },
    
    marble_start: {
        name: "Carrières Ancestrales",
        description: "Commencez avec 2 000 unités de marbre",
        type: 'starting_resource',
        resource: 'marble',
        amount: 2000,
        cost: 15
    },
    
    gold_production: {
        name: "Commerce Florissant",
        description: "Production d'or +25%",
        type: 'production_multiplier',
        resource: 'gold',
        multiplier: 0.25,
        cost: 25
    },
    
    food_production: {
        name: "Terres Fertiles",
        description: "Production de nourriture +20%",
        type: 'production_multiplier',
        resource: 'food',
        multiplier: 0.20,
        cost: 20
    },
    
    experience_boost: {
        name: "Sagesse des Anciens",
        description: "Gain d'expérience +50%",
        type: 'experience_multiplier',
        multiplier: 0.50,
        cost: 30
    },
    
    fast_construction: {
        name: "Maîtres Artisans",
        description: "Vitesse de construction +40%",
        type: 'construction_speed',
        multiplier: 0.40,
        cost: 35
    },
    
    starting_farm: {
        name: "Héritage Agricole",
        description: "Commencez avec une ferme niveau 3",
        type: 'starting_buildings',
        buildings: [
            { type: 'farm', level: 3 }
        ],
        cost: 40
    },
    
    starting_infrastructure: {
        name: "Empire Héréditaire",
        description: "Commencez avec une ferme, une mine et un marché",
        type: 'starting_buildings',
        buildings: [
            { type: 'farm', level: 2 },
            { type: 'mine', level: 2 },
            { type: 'market', level: 1 }
        ],
        cost: 75
    },
    
    mega_boost: {
        name: "Gloire Éternelle",
        description: "Toutes les productions +100% (Bonus Ultime)",
        type: 'production_multiplier',
        resource: 'all',
        multiplier: 1.00,
        cost: 150
    }
};

// Instance globale
let prestigeSystem;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    prestigeSystem = new PrestigeSystem();
});

// Fonctions utilitaires
function canPrestige() {
    return prestigeSystem ? prestigeSystem.canPrestige(gameState) : false;
}

function getPrestigeRequirements() {
    return prestigeSystem ? prestigeSystem.getPrestigeRequirements() : [];
}

function performPrestige() {
    if (!prestigeSystem) return { success: false, message: "Prestige system not initialized." };
    return prestigeSystem.performPrestige(gameState);
}