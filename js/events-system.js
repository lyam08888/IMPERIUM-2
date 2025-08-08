// events-system.js - Système d'événements quotidiens et récurrents
// Crée du contenu frais et maintient l'engagement des joueurs

class EventsSystem {
    constructor() {
        this.events = EVENT_DEFINITIONS;
        this.activeEvents = [];
        this.eventHistory = [];
        this.lastDailyReset = 0;
        this.dailyEventsCompleted = 0;
        this.weeklyEventsCompleted = 0;
        this.lastWeeklyReset = 0;
        
        this.loadEventData();
        this.checkDailyReset();
        this.checkWeeklyReset();
    }

    loadEventData() {
        const saved = localStorage.getItem('imperium_events');
        if (saved) {
            const data = JSON.parse(saved);
            this.eventHistory = data.eventHistory || [];
            this.lastDailyReset = data.lastDailyReset || 0;
            this.lastWeeklyReset = data.lastWeeklyReset || 0;
            this.dailyEventsCompleted = data.dailyEventsCompleted || 0;
            this.weeklyEventsCompleted = data.weeklyEventsCompleted || 0;
        }
    }

    checkDailyReset() {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        if (now - this.lastDailyReset > oneDayMs) {
            this.performDailyReset();
        }
    }

    checkWeeklyReset() {
        const now = Date.now();
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
        
        if (now - this.lastWeeklyReset > oneWeekMs) {
            this.performWeeklyReset();
        }
    }

    performDailyReset() {
        this.lastDailyReset = Date.now();
        this.dailyEventsCompleted = 0;
        
        // Générer les événements quotidiens
        this.generateDailyEvents();
        
        // Notification de nouveaux défis
        if (gameController) {
            gameController.queueNotification({
                icon: '🌅',
                title: 'Nouveaux Défis Quotidiens!',
                message: 'De nouveaux événements sont disponibles.',
                duration: 5000
            });
        }
        
        this.save();
    }

    performWeeklyReset() {
        this.lastWeeklyReset = Date.now();
        this.weeklyEventsCompleted = 0;
        
        // Générer événement hebdomadaire spécial
        this.generateWeeklyEvent();
        
        this.save();
    }

    generateDailyEvents() {
        // Générer 3 événements quotidiens aléatoirement
        const dailyEvents = this.getRandomEvents('daily', 3);
        
        dailyEvents.forEach(eventTemplate => {
            this.createActiveEvent(eventTemplate, 'daily');
        });
    }

    generateWeeklyEvent() {
        // Générer 1 événement hebdomadaire
        const weeklyEvents = this.getRandomEvents('weekly', 1);
        
        weeklyEvents.forEach(eventTemplate => {
            this.createActiveEvent(eventTemplate, 'weekly');
        });
    }

    getRandomEvents(type, count) {
        const availableEvents = Object.keys(this.events)
            .filter(id => this.events[id].type === type)
            .filter(id => !this.isEventRecentlyCompleted(id))
            .map(id => ({ id, ...this.events[id] }));
            
        // Mélanger et prendre les premiers
        const shuffled = availableEvents.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    createActiveEvent(eventTemplate, frequency) {
        const event = {
            id: `${eventTemplate.id}_${Date.now()}`,
            templateId: eventTemplate.id,
            name: eventTemplate.name,
            description: eventTemplate.description,
            type: eventTemplate.type,
            frequency: frequency,
            objectives: [...eventTemplate.objectives],
            rewards: [...eventTemplate.rewards],
            createdAt: Date.now(),
            expiresAt: Date.now() + (frequency === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000),
            progress: {},
            completed: false
        };

        // Initialiser le progrès pour chaque objectif
        event.objectives.forEach((obj, index) => {
            event.progress[index] = 0;
        });

        this.activeEvents.push(event);
        this.save();
    }

    checkEventProgress(gameState) {
        this.activeEvents.forEach(event => {
            if (event.completed) return;
            
            let allCompleted = true;
            
            event.objectives.forEach((objective, index) => {
                const currentProgress = this.calculateObjectiveProgress(objective, gameState);
                event.progress[index] = currentProgress;
                
                if (currentProgress < objective.target) {
                    allCompleted = false;
                }
            });
            
            if (allCompleted && !event.completed) {
                this.completeEvent(event, gameState);
            }
        });
        
        // Nettoyer les événements expirés
        this.cleanupExpiredEvents();
    }

    calculateObjectiveProgress(objective, gameState) {
        switch (objective.type) {
            case 'collect':
                return gameState.resources[objective.resource] || 0;
                
            case 'build':
                return gameState.city.buildings
                    .filter(b => b.type === objective.building && b.level >= (objective.level || 1))
                    .length;
                    
            case 'train':
                return gameState.unitPool[objective.unit] || 0;
                
            case 'reach_level':
                return gameState.player.level;
                
            case 'population':
                return gameState.city.stats.population;
                
            case 'happiness':
                return gameState.city.stats.happiness;
                
            case 'production':
                return gameState.city.production[objective.resource] || 0;
                
            default:
                return 0;
        }
    }

    completeEvent(event, gameState) {
        event.completed = true;
        event.completedAt = Date.now();
        
        // Appliquer récompenses
        event.rewards.forEach(reward => {
            this.applyEventReward(reward, gameState);
        });
        
        // Incrémenter compteurs
        if (event.frequency === 'daily') {
            this.dailyEventsCompleted++;
        } else if (event.frequency === 'weekly') {
            this.weeklyEventsCompleted++;
        }
        
        // Ajouter à l'historique
        this.eventHistory.push({
            id: event.id,
            templateId: event.templateId,
            name: event.name,
            completedAt: Date.now(),
            rewards: event.rewards
        });
        
        // Notification de completion
        if (gameController) {
            gameController.queueNotification({
                icon: '🎉',
                title: 'Événement Terminé!',
                message: `${event.name} - Récompenses reçues!`,
                duration: 6000
            });
        }
        
        this.save();
        
        // Vérifier accomplissements liés aux événements
        if (achievementSystem) {
            achievementSystem.checkAchievements(gameState);
        }
    }

    applyEventReward(reward, gameState) {
        switch (reward.type) {
            case 'resource':
                gameState.resources[reward.resource] += reward.amount;
                break;
                
            case 'xp':
                addXp(reward.amount);
                break;
                
            case 'unit':
                gameState.unitPool[reward.unit] += reward.amount;
                break;
                
            case 'building_boost':
                // Boost temporaire pour les bâtiments
                gameState.temporaryBoosts = gameState.temporaryBoosts || [];
                gameState.temporaryBoosts.push({
                    type: 'building_production',
                    building: reward.building,
                    multiplier: reward.multiplier,
                    expiresAt: Date.now() + (reward.duration * 60 * 60 * 1000)
                });
                break;
        }
    }

    cleanupExpiredEvents() {
        const now = Date.now();
        this.activeEvents = this.activeEvents.filter(event => {
            if (now > event.expiresAt && !event.completed) {
                // Événement expiré
                return false;
            }
            return true;
        });
    }

    isEventRecentlyCompleted(templateId) {
        const recentThreshold = Date.now() - (3 * 24 * 60 * 60 * 1000); // 3 jours
        return this.eventHistory.some(event => 
            event.templateId === templateId && 
            event.completedAt > recentThreshold
        );
    }

    getActiveEvents() {
        return this.activeEvents.filter(event => !event.completed);
    }

    getCompletedEvents() {
        return this.activeEvents.filter(event => event.completed);
    }

    getDailyProgress() {
        const maxDaily = 3;
        return {
            completed: this.dailyEventsCompleted,
            total: maxDaily,
            percentage: Math.round((this.dailyEventsCompleted / maxDaily) * 100)
        };
    }

    getWeeklyProgress() {
        const maxWeekly = 7; // 1 par jour
        return {
            completed: this.weeklyEventsCompleted,
            total: maxWeekly,
            percentage: Math.round((this.weeklyEventsCompleted / maxWeekly) * 100)
        };
    }

    save() {
        const data = {
            eventHistory: this.eventHistory,
            lastDailyReset: this.lastDailyReset,
            lastWeeklyReset: this.lastWeeklyReset,
            dailyEventsCompleted: this.dailyEventsCompleted,
            weeklyEventsCompleted: this.weeklyEventsCompleted
        };
        localStorage.setItem('imperium_events', JSON.stringify(data));
        localStorage.setItem('imperium_active_events', JSON.stringify(this.activeEvents));
    }

    // Méthode pour forcer un événement (debug)
    forceGenerateEvent(type = 'daily') {
        if (type === 'daily') {
            this.generateDailyEvents();
        } else {
            this.generateWeeklyEvent();
        }
    }
}

// Définitions des événements
const EVENT_DEFINITIONS = {
    // ÉVÉNEMENTS QUOTIDIENS
    gold_rush: {
        name: "Ruée vers l'Or",
        description: "Les marchands affluent! Collectez de l'or supplémentaire.",
        type: 'daily',
        objectives: [
            { type: 'collect', resource: 'gold', target: 5000, description: "Collecter 5 000 pièces d'or" }
        ],
        rewards: [
            { type: 'resource', resource: 'gold', amount: 2000 },
            { type: 'xp', amount: 100 }
        ]
    },

    construction_frenzy: {
        name: "Frénésie de Construction",
        description: "Vos architectes sont inspirés! Construisez des bâtiments.",
        type: 'daily',
        objectives: [
            { type: 'build', building: 'any', target: 3, description: "Construire 3 bâtiments" }
        ],
        rewards: [
            { type: 'resource', resource: 'marble', amount: 1000 },
            { type: 'building_boost', building: 'all', multiplier: 1.5, duration: 2 }
        ]
    },

    military_drill: {
        name: "Entraînement Militaire",
        description: "Vos instructeurs demandent plus de recrues.",
        type: 'daily',
        objectives: [
            { type: 'train', unit: 'legionnaire', target: 50, description: "Entraîner 50 légionnaires" }
        ],
        rewards: [
            { type: 'unit', unit: 'legionnaire', amount: 25 },
            { type: 'xp', amount: 150 }
        ]
    },

    population_boom: {
        name: "Boom Démographique",
        description: "Attirez de nouveaux citoyens dans votre ville.",
        type: 'daily',
        objectives: [
            { type: 'population', target: 1000, description: "Atteindre 1 000 habitants" }
        ],
        rewards: [
            { type: 'resource', resource: 'gold', amount: 1500 },
            { type: 'resource', resource: 'food', amount: 2000 }
        ]
    },

    happy_citizens: {
        name: "Citoyens Heureux",
        description: "Maintenez le moral de vos citoyens.",
        type: 'daily',
        objectives: [
            { type: 'happiness', target: 90, description: "Maintenir 90% de bonheur" }
        ],
        rewards: [
            { type: 'resource', resource: 'divineFavor', amount: 50 },
            { type: 'xp', amount: 200 }
        ]
    },

    // ÉVÉNEMENTS HEBDOMADAIRES
    grand_festival: {
        name: "Grand Festival",
        description: "Organisez un festival grandiose pour marquer la semaine!",
        type: 'weekly',
        objectives: [
            { type: 'collect', resource: 'gold', target: 50000, description: "Collecter 50 000 pièces d'or" },
            { type: 'population', target: 2000, description: "Atteindre 2 000 habitants" },
            { type: 'happiness', target: 95, description: "Maintenir 95% de bonheur" }
        ],
        rewards: [
            { type: 'resource', resource: 'gold', amount: 20000 },
            { type: 'resource', resource: 'divineFavor', amount: 200 },
            { type: 'xp', amount: 1000 },
            { type: 'building_boost', building: 'all', multiplier: 2.0, duration: 24 }
        ]
    },

    conquest_campaign: {
        name: "Campagne de Conquête",
        description: "Préparez une grande armée pour la conquête!",
        type: 'weekly',
        objectives: [
            { type: 'train', unit: 'legionnaire', target: 500, description: "Entraîner 500 légionnaires" },
            { type: 'train', unit: 'archer', target: 200, description: "Entraîner 200 archers" },
            { type: 'build', building: 'barracks', target: 5, description: "Construire 5 casernes" }
        ],
        rewards: [
            { type: 'unit', unit: 'praetorian', amount: 50 },
            { type: 'resource', resource: 'gold', amount: 15000 },
            { type: 'xp', amount: 1500 }
        ]
    }
};

// Instance globale
let eventsSystem;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    eventsSystem = new EventsSystem();
});

// Fonction utilitaire pour vérifier les événements
function checkEventProgress(gameState) {
    if (eventsSystem) {
        eventsSystem.checkEventProgress(gameState);
    }
}