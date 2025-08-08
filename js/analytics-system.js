// analytics-system.js - Système d'analytics pour tracker les métriques du jeu
// Permet d'équilibrer le jeu et de comprendre le comportement des joueurs

class AnalyticsSystem {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.gameVersion = '1.0.0';
        
        this.metrics = {
            gameplay: {
                totalPlayTime: 0,
                sessionsCount: 0,
                levelUps: 0,
                buildingsBuilt: 0,
                unitsTrained: 0,
                resourcesGathered: {},
                tradesExecuted: 0,
                questsCompleted: 0,
                prestigeCount: 0,
                achievementsUnlocked: 0
            },
            economy: {
                totalGoldEarned: 0,
                totalGoldSpent: 0,
                peakGoldHeld: 0,
                resourceProductionTotals: {},
                marketTransactions: 0
            },
            progression: {
                currentLevel: 1,
                currentXP: 0,
                buildingLevels: {},
                technologyCount: 0,
                militaryPower: 0
            },
            retention: {
                firstSession: Date.now(),
                lastSession: Date.now(),
                totalSessions: 0,
                averageSessionLength: 0,
                daysSinceFirstPlay: 0,
                consecutiveDays: 0
            }
        };
        
        this.events = [];
        this.milestones = [];
        this.heatmaps = {
            buildingPlacement: {},
            uiClicks: {},
            timeSpentInViews: {}
        };
        
        this.loadAnalytics();
        this.startSession();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    loadAnalytics() {
        const saved = localStorage.getItem('imperium_analytics');
        if (saved) {
            const data = JSON.parse(saved);
            this.metrics = this.mergeMetrics(this.metrics, data.metrics || {});
            this.milestones = data.milestones || [];
            this.heatmaps = data.heatmaps || { buildingPlacement: {}, uiClicks: {}, timeSpentInViews: {} };
        }
    }

    mergeMetrics(defaultMetrics, savedMetrics) {
        const merged = JSON.parse(JSON.stringify(defaultMetrics));
        
        // Merger récursivement
        const mergeRecursive = (target, source) => {
            for (let key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    mergeRecursive(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        };
        
        mergeRecursive(merged, savedMetrics);
        return merged;
    }

    startSession() {
        this.metrics.retention.totalSessions++;
        this.metrics.retention.lastSession = Date.now();
        
        // Calculer jours consécutifs
        this.calculateConsecutiveDays();
        
        this.trackEvent('session_start', {
            sessionId: this.sessionId,
            playerLevel: this.metrics.progression.currentLevel,
            totalPlayTime: this.metrics.gameplay.totalPlayTime
        });
    }

    endSession() {
        const sessionLength = Date.now() - this.sessionStart;
        this.metrics.gameplay.totalPlayTime += sessionLength;
        this.metrics.gameplay.sessionsCount++;
        
        // Calculer durée moyenne des sessions
        this.metrics.retention.averageSessionLength = 
            this.metrics.gameplay.totalPlayTime / this.metrics.gameplay.sessionsCount;
        
        this.trackEvent('session_end', {
            sessionId: this.sessionId,
            sessionLength: sessionLength,
            endReason: 'manual'
        });
        
        this.save();
    }

    calculateConsecutiveDays() {
        const now = new Date();
        const lastSession = new Date(this.metrics.retention.lastSession);
        
        const daysDiff = Math.floor((now - lastSession) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
            // Jour consécutif
            this.metrics.retention.consecutiveDays++;
        } else if (daysDiff > 1) {
            // Interruption
            this.metrics.retention.consecutiveDays = 1;
        }
        
        // Calculer jours depuis premier jeu
        const firstSession = new Date(this.metrics.retention.firstSession);
        this.metrics.retention.daysSinceFirstPlay = Math.floor((now - firstSession) / (1000 * 60 * 60 * 24));
    }

    trackEvent(eventType, data = {}) {
        const event = {
            type: eventType,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            playerLevel: this.metrics.progression.currentLevel,
            gameTime: this.metrics.gameplay.totalPlayTime,
            data: data
        };
        
        this.events.push(event);
        
        // Garder seulement les 1000 derniers événements
        if (this.events.length > 1000) {
            this.events.shift();
        }
        
        // Traitement spécial selon le type d'événement
        this.processSpecialEvent(eventType, data);
    }

    processSpecialEvent(eventType, data) {
        switch (eventType) {
            case 'level_up':
                this.metrics.gameplay.levelUps++;
                this.metrics.progression.currentLevel = data.newLevel || this.metrics.progression.currentLevel + 1;
                this.checkMilestone('level', this.metrics.progression.currentLevel);
                break;
                
            case 'building_built':
                this.metrics.gameplay.buildingsBuilt++;
                this.trackBuildingPlacement(data.building, data.slotId);
                this.updateBuildingLevels(data.building, data.level);
                break;
                
            case 'unit_trained':
                this.metrics.gameplay.unitsTrained += data.quantity || 1;
                break;
                
            case 'resource_gained':
                if (!this.metrics.gameplay.resourcesGathered[data.resource]) {
                    this.metrics.gameplay.resourcesGathered[data.resource] = 0;
                }
                this.metrics.gameplay.resourcesGathered[data.resource] += data.amount || 1;
                
                if (data.resource === 'gold') {
                    this.metrics.economy.totalGoldEarned += data.amount || 1;
                }
                break;
                
            case 'resource_spent':
                if (data.resource === 'gold') {
                    this.metrics.economy.totalGoldSpent += data.amount || 1;
                }
                break;
                
            case 'trade_executed':
                this.metrics.gameplay.tradesExecuted++;
                this.metrics.economy.marketTransactions++;
                break;
                
            case 'quest_completed':
                this.metrics.gameplay.questsCompleted++;
                break;
                
            case 'prestige':
                this.metrics.gameplay.prestigeCount++;
                break;
                
            case 'achievement_unlocked':
                this.metrics.gameplay.achievementsUnlocked++;
                break;
                
            case 'ui_click':
                this.trackUIClick(data.element, data.view);
                break;
                
            case 'view_entered':
                this.startTrackingViewTime(data.view);
                break;
                
            case 'view_exited':
                this.endTrackingViewTime(data.view);
                break;
        }
    }

    trackBuildingPlacement(building, slotId) {
        const key = `${building}_${slotId}`;
        if (!this.heatmaps.buildingPlacement[key]) {
            this.heatmaps.buildingPlacement[key] = 0;
        }
        this.heatmaps.buildingPlacement[key]++;
    }

    updateBuildingLevels(building, level) {
        if (!this.metrics.progression.buildingLevels[building]) {
            this.metrics.progression.buildingLevels[building] = 0;
        }
        this.metrics.progression.buildingLevels[building] = Math.max(
            this.metrics.progression.buildingLevels[building], 
            level
        );
    }

    trackUIClick(element, view) {
        const key = `${view}_${element}`;
        if (!this.heatmaps.uiClicks[key]) {
            this.heatmaps.uiClicks[key] = 0;
        }
        this.heatmaps.uiClicks[key]++;
    }

    startTrackingViewTime(view) {
        this.currentViewStart = Date.now();
        this.currentView = view;
    }

    endTrackingViewTime(view) {
        if (this.currentViewStart && this.currentView === view) {
            const timeSpent = Date.now() - this.currentViewStart;
            if (!this.heatmaps.timeSpentInViews[view]) {
                this.heatmaps.timeSpentInViews[view] = 0;
            }
            this.heatmaps.timeSpentInViews[view] += timeSpent;
        }
    }

    checkMilestone(type, value) {
        const milestoneDefinitions = {
            level: [5, 10, 20, 30, 50, 100],
            buildings: [10, 25, 50, 100],
            gold: [10000, 50000, 100000, 500000, 1000000],
            playtime: [3600000, 7200000, 18000000, 36000000] // 1h, 2h, 5h, 10h en ms
        };
        
        if (milestoneDefinitions[type]) {
            milestoneDefinitions[type].forEach(threshold => {
                if (value >= threshold && !this.hasMilestone(type, threshold)) {
                    this.addMilestone(type, threshold, value);
                }
            });
        }
    }

    hasMilestone(type, threshold) {
        return this.milestones.some(m => m.type === type && m.threshold === threshold);
    }

    addMilestone(type, threshold, actualValue) {
        const milestone = {
            type: type,
            threshold: threshold,
            actualValue: actualValue,
            achievedAt: Date.now(),
            sessionId: this.sessionId
        };
        
        this.milestones.push(milestone);
        
        this.trackEvent('milestone_reached', {
            milestoneType: type,
            threshold: threshold,
            value: actualValue
        });
    }

    updateGameState(gameState) {
        // Mettre à jour les métriques basées sur l'état du jeu
        this.metrics.progression.currentLevel = gameState.player.level;
        this.metrics.progression.currentXP = gameState.player.xp;
        
        // Peak gold
        if (gameState.resources.gold > this.metrics.economy.peakGoldHeld) {
            this.metrics.economy.peakGoldHeld = gameState.resources.gold;
        }
        
        // Puissance militaire
        this.metrics.progression.militaryPower = Object.values(gameState.unitPool || {})
            .reduce((sum, count) => sum + count, 0);
        
        // Vérifier milestones
        this.checkMilestone('level', gameState.player.level);
        this.checkMilestone('gold', gameState.resources.gold);
        this.checkMilestone('playtime', this.metrics.gameplay.totalPlayTime);
        
        const buildingCount = gameState.city.buildings.filter(b => b.type !== null).length;
        this.checkMilestone('buildings', buildingCount);
    }

    getPlayerProfile() {
        return {
            level: this.metrics.progression.currentLevel,
            totalPlayTime: this.formatDuration(this.metrics.gameplay.totalPlayTime),
            sessionsCount: this.metrics.gameplay.sessionsCount,
            averageSessionLength: this.formatDuration(this.metrics.retention.averageSessionLength),
            daysSinceFirstPlay: this.metrics.retention.daysSinceFirstPlay,
            consecutiveDays: this.metrics.retention.consecutiveDays,
            buildingsBuilt: this.metrics.gameplay.buildingsBuilt,
            unitsTrained: this.metrics.gameplay.unitsTrained,
            questsCompleted: this.metrics.gameplay.questsCompleted,
            achievementsUnlocked: this.metrics.gameplay.achievementsUnlocked,
            prestigeCount: this.metrics.gameplay.prestigeCount,
            peakGold: this.metrics.economy.peakGoldHeld
        };
    }

    getGameplayInsights() {
        const insights = [];
        
        // Analyse du temps de jeu
        if (this.metrics.retention.averageSessionLength < 600000) { // moins de 10 minutes
            insights.push({
                type: 'warning',
                title: 'Sessions Courtes',
                message: 'Vos sessions de jeu sont courtes. Essayez de vous fixer des objectifs plus longs!',
                suggestion: 'Activez les notifications pour vous rappeler de revenir.'
            });
        }
        
        // Analyse de progression
        if (this.metrics.gameplay.levelUps === 0 && this.metrics.gameplay.totalPlayTime > 1800000) { // 30 minutes
            insights.push({
                type: 'tip',
                title: 'Progression Lente',
                message: 'Vous pourriez progresser plus vite en complétant plus de quêtes.',
                suggestion: 'Consultez l\'onglet Objectifs pour voir vos quêtes actives.'
            });
        }
        
        // Analyse économique
        if (this.metrics.economy.totalGoldSpent < this.metrics.economy.totalGoldEarned * 0.5) {
            insights.push({
                type: 'tip',
                title: 'Économe',
                message: 'Vous accumulez beaucoup d\'or! N\'hésitez pas à investir dans des bâtiments.',
                suggestion: 'Construire plus de bâtiments augmentera votre production.'
            });
        }
        
        return insights;
    }

    getMostUsedFeatures() {
        const features = [];
        
        // Analyser les clics UI
        Object.entries(this.heatmaps.uiClicks).forEach(([key, count]) => {
            const [view, element] = key.split('_');
            features.push({ view, element, clicks: count });
        });
        
        return features.sort((a, b) => b.clicks - a.clicks).slice(0, 10);
    }

    getRetentionMetrics() {
        return {
            totalSessions: this.metrics.retention.totalSessions,
            averageSessionLength: this.metrics.retention.averageSessionLength,
            daysSinceFirstPlay: this.metrics.retention.daysSinceFirstPlay,
            consecutiveDays: this.metrics.retention.consecutiveDays,
            retentionRate: this.calculateRetentionRate()
        };
    }

    calculateRetentionRate() {
        // Calcul simplifié du taux de rétention
        const daysSinceFirst = this.metrics.retention.daysSinceFirstPlay;
        const consecutiveDays = this.metrics.retention.consecutiveDays;
        
        if (daysSinceFirst === 0) return 100;
        return Math.round((consecutiveDays / daysSinceFirst) * 100);
    }

    formatDuration(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    exportData() {
        // Export des données pour analyse externe
        return {
            version: this.gameVersion,
            exportDate: Date.now(),
            metrics: this.metrics,
            events: this.events.slice(-100), // Derniers 100 événements
            milestones: this.milestones,
            heatmaps: this.heatmaps
        };
    }

    save() {
        const data = {
            metrics: this.metrics,
            milestones: this.milestones,
            heatmaps: this.heatmaps
        };
        localStorage.setItem('imperium_analytics', JSON.stringify(data));
    }

    reset() {
        this.metrics = {
            gameplay: {
                totalPlayTime: 0,
                sessionsCount: 0,
                levelUps: 0,
                buildingsBuilt: 0,
                unitsTrained: 0,
                resourcesGathered: {},
                tradesExecuted: 0,
                questsCompleted: 0,
                prestigeCount: 0,
                achievementsUnlocked: 0
            },
            economy: {
                totalGoldEarned: 0,
                totalGoldSpent: 0,
                peakGoldHeld: 0,
                resourceProductionTotals: {},
                marketTransactions: 0
            },
            progression: {
                currentLevel: 1,
                currentXP: 0,
                buildingLevels: {},
                technologyCount: 0,
                militaryPower: 0
            },
            retention: {
                firstSession: Date.now(),
                lastSession: Date.now(),
                totalSessions: 0,
                averageSessionLength: 0,
                daysSinceFirstPlay: 0,
                consecutiveDays: 0
            }
        };
        
        this.events = [];
        this.milestones = [];
        this.heatmaps = { buildingPlacement: {}, uiClicks: {}, timeSpentInViews: {} };
        
        localStorage.removeItem('imperium_analytics');
    }
}

// Instance globale
let analyticsSystem;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    analyticsSystem = new AnalyticsSystem();
    
    // Tracker la fermeture de fenêtre
    window.addEventListener('beforeunload', () => {
        if (analyticsSystem) {
            analyticsSystem.endSession();
        }
    });
});

// Fonctions utilitaires
function trackEvent(eventType, data) {
    if (analyticsSystem) {
        analyticsSystem.trackEvent(eventType, data);
    }
}

function updateAnalytics(gameState) {
    if (analyticsSystem) {
        analyticsSystem.updateGameState(gameState);
    }
}

function getPlayerProfile() {
    return analyticsSystem ? analyticsSystem.getPlayerProfile() : null;
}

function getGameplayInsights() {
    return analyticsSystem ? analyticsSystem.getGameplayInsights() : [];
}