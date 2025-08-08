// achievement-system.js - Système d'accomplissements complet
// Ce système crée de la motivation à long terme et de la rejouabilité

class AchievementSystem {
    constructor() {
        this.achievements = ACHIEVEMENT_DEFINITIONS;
        this.playerAchievements = {};
        this.categories = ['economic', 'military', 'construction', 'exploration', 'special', 'prestige'];
        this.pendingNotifications = [];
        this.totalAchievementPoints = 0;
        
        this.initializePlayerAchievements();
    }

    initializePlayerAchievements() {
        // Charger les accomplissements depuis la sauvegarde
        const saved = localStorage.getItem('imperium_achievements');
        if (saved) {
            this.playerAchievements = JSON.parse(saved);
        }
        
        // Calculer les points totaux
        this.calculateTotalPoints();
    }

    calculateTotalPoints() {
        this.totalAchievementPoints = 0;
        Object.keys(this.playerAchievements).forEach(achievementId => {
            if (this.playerAchievements[achievementId].unlocked) {
                const achievement = this.achievements[achievementId];
                if (achievement) {
                    this.totalAchievementPoints += achievement.points || 10;
                }
            }
        });
    }

    checkAchievements(gameState) {
        Object.keys(this.achievements).forEach(achievementId => {
            const achievement = this.achievements[achievementId];
            
            // Ne pas vérifier les accomplissements déjà débloqués
            if (this.isUnlocked(achievementId)) return;
            
            // Vérifier les conditions
            if (achievement.condition(gameState)) {
                this.unlockAchievement(achievementId, gameState);
            }
        });
    }

    unlockAchievement(achievementId, gameState) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return;

        // Enregistrer l'accomplissement
        this.playerAchievements[achievementId] = {
            unlocked: true,
            unlockedAt: Date.now(),
            gameState: {
                level: gameState.player.level,
                gold: gameState.resources.gold,
                population: gameState.city.stats.population
            }
        };

        // Appliquer les récompenses
        if (achievement.rewards) {
            achievement.rewards.forEach(reward => {
                this.applyReward(reward, gameState);
            });
        }

        // Créer notification
        this.pendingNotifications.push({
            type: 'achievement',
            title: 'Accomplissement débloqué !',
            message: `🏆 ${achievement.name}`,
            description: achievement.description,
            points: achievement.points || 10,
            timestamp: Date.now()
        });

        // Sauvegarder
        this.save();
        
        // Recalculer points
        this.calculateTotalPoints();

        console.log(`Achievement unlocked: ${achievement.name}`);
    }

    applyReward(reward, gameState) {
        switch (reward.type) {
            case 'resource':
                gameState.resources[reward.resource] += reward.amount;
                break;
            case 'xp':
                addXp(reward.amount);
                break;
            case 'unlock':
                gameState.unlocks = gameState.unlocks || {};
                gameState.unlocks[reward.feature] = true;
                break;
            case 'modifier':
                gameState.modifiers = gameState.modifiers || {};
                gameState.modifiers[reward.modifier] = (gameState.modifiers[reward.modifier] || 0) + reward.value;
                break;
        }
    }

    isUnlocked(achievementId) {
        return this.playerAchievements[achievementId]?.unlocked || false;
    }

    getCompletionRate() {
        const total = Object.keys(this.achievements).length;
        const unlocked = Object.keys(this.playerAchievements).filter(id => this.playerAchievements[id].unlocked).length;
        return { unlocked, total, percentage: Math.round((unlocked / total) * 100) };
    }

    getAchievementsByCategory(category) {
        return Object.keys(this.achievements)
            .filter(id => this.achievements[id].category === category)
            .map(id => ({
                id,
                ...this.achievements[id],
                unlocked: this.isUnlocked(id),
                unlockedAt: this.playerAchievements[id]?.unlockedAt
            }));
    }

    getPendingNotifications() {
        const notifications = [...this.pendingNotifications];
        this.pendingNotifications = [];
        return notifications;
    }

    save() {
        localStorage.setItem('imperium_achievements', JSON.stringify(this.playerAchievements));
    }

    // Méthode pour debug et tests
    forceUnlock(achievementId) {
        if (this.achievements[achievementId]) {
            this.unlockAchievement(achievementId, gameState);
        }
    }

    reset() {
        this.playerAchievements = {};
        this.totalAchievementPoints = 0;
        localStorage.removeItem('imperium_achievements');
    }
}

// Définitions des accomplissements
const ACHIEVEMENT_DEFINITIONS = {
    // ÉCONOMIE
    first_coin: {
        name: "Premier Sesterce",
        description: "Gagner votre premier or",
        category: 'economic',
        points: 5,
        condition: (gs) => gs.resources.gold > 0,
        rewards: [{ type: 'resource', resource: 'gold', amount: 100 }]
    },
    
    wealthy_citizen: {
        name: "Citoyen Fortuné",
        description: "Accumuler 10 000 pièces d'or",
        category: 'economic',
        points: 15,
        condition: (gs) => gs.resources.gold >= 10000,
        rewards: [{ type: 'modifier', modifier: 'gold_production', value: 0.05 }]
    },

    economic_powerhouse: {
        name: "Puissance Économique",
        description: "Atteindre 1000 or/heure de production",
        category: 'economic',
        points: 25,
        condition: (gs) => gs.city.production.gold * gs.city.stats.happinessModifier >= 1000,
        rewards: [{ type: 'unlock', feature: 'advanced_markets' }]
    },

    // CONSTRUCTION
    master_builder: {
        name: "Maître Constructeur",
        description: "Construire 50 bâtiments",
        category: 'construction',
        points: 20,
        condition: (gs) => gs.city.buildings.filter(b => b.type !== null).length >= 50,
        rewards: [{ type: 'modifier', modifier: 'construction_speed', value: 0.1 }]
    },

    grand_architect: {
        name: "Grand Architecte",
        description: "Avoir un bâtiment de niveau 10",
        category: 'construction',
        points: 30,
        condition: (gs) => gs.city.buildings.some(b => b.level >= 10),
        rewards: [{ type: 'unlock', feature: 'mega_projects' }]
    },

    // MILITAIRE
    first_legion: {
        name: "Première Légion",
        description: "Former votre première unité militaire",
        category: 'military',
        points: 10,
        condition: (gs) => Object.values(gs.unitPool).some(count => count > 0),
        rewards: [{ type: 'resource', resource: 'gold', amount: 500 }]
    },

    veteran_commander: {
        name: "Commandant Vétéran",
        description: "Avoir 1000 unités militaires",
        category: 'military',
        points: 35,
        condition: (gs) => Object.values(gs.unitPool).reduce((a, b) => a + b, 0) >= 1000,
        rewards: [{ type: 'modifier', modifier: 'unit_training_speed', value: 0.15 }]
    },

    // EXPLORATION
    world_explorer: {
        name: "Explorateur du Monde",
        description: "Découvrir 25 régions",
        category: 'exploration',
        points: 25,
        condition: (gs) => (gs.world?.exploredRegions?.length || 0) >= 25,
        rewards: [{ type: 'unlock', feature: 'advanced_scouting' }]
    },

    // SPÉCIAUX
    speed_demon: {
        name: "Vitesse de l'Éclair",
        description: "Atteindre le niveau 10 en moins de 2 heures de jeu",
        category: 'special',
        points: 50,
        condition: (gs) => {
            const gameTime = Date.now() - (gs.gameStartTime || Date.now());
            return gs.player.level >= 10 && gameTime < 2 * 60 * 60 * 1000;
        },
        rewards: [{ type: 'unlock', feature: 'speed_bonuses' }]
    },

    perfectionist: {
        name: "Perfectionniste",
        description: "Maintenir 100% de bonheur pendant 1 heure",
        category: 'special',
        points: 40,
        condition: (gs) => gs.city.stats.happiness >= 100,
        rewards: [{ type: 'modifier', modifier: 'happiness_stability', value: 0.2 }]
    },

    // PRESTIGE
    first_ascension: {
        name: "Première Ascension",
        description: "Effectuer votre premier Prestige",
        category: 'prestige',
        points: 100,
        condition: (gs) => (gs.prestige?.level || 0) > 0,
        rewards: [{ type: 'modifier', modifier: 'prestige_bonus', value: 0.05 }]
    }
};

// Instance globale
let achievementSystem;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    achievementSystem = new AchievementSystem();
});

// Export des fonctions utiles
function checkAchievements(gameState) {
    if (achievementSystem) {
        achievementSystem.checkAchievements(gameState);
    }
}

function getAchievementNotifications() {
    if (achievementSystem) {
        return achievementSystem.getPendingNotifications();
    }
    return [];
}

function getTotalAchievementPoints() {
    return achievementSystem ? achievementSystem.totalAchievementPoints : 0;
}