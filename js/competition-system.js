// competition-system.js - Système de compétition et classements
// Crée un aspect social compétitif avec des tournois et des classements

class CompetitionSystem {
    constructor() {
        this.playerName = 'Imperator_' + Math.random().toString(36).substr(2, 6);
        this.leaderboards = LEADERBOARD_DEFINITIONS;
        this.tournaments = [];
        this.activeChallenges = [];
        this.playerStats = {
            rank: 999999,
            score: 0,
            tier: 'Bronze',
            wins: 0,
            losses: 0,
            tournaments_won: 0,
            challenges_completed: 0
        };
        this.rewards = [];
        this.seasonData = {
            currentSeason: 1,
            seasonStartDate: Date.now(),
            seasonEndDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 jours
            seasonRewards: []
        };
        
        this.loadCompetitionData();
        this.generateMockLeaderboards(); // Pour simuler d'autres joueurs
        this.checkSeasonReset();
    }

    loadCompetitionData() {
        const saved = localStorage.getItem('imperium_competition');
        if (saved) {
            const data = JSON.parse(saved);
            this.playerName = data.playerName || this.playerName;
            this.playerStats = { ...this.playerStats, ...(data.playerStats || {}) };
            this.rewards = data.rewards || [];
            this.seasonData = { ...this.seasonData, ...(data.seasonData || {}) };
        }
    }

    generateMockLeaderboards() {
        // Simuler d'autres joueurs pour créer un environnement compétitif
        const mockPlayerNames = [
            'Caesar_Magnus', 'Spartacus_Rex', 'Cleopatra_VII', 'Augustus_Prime',
            'Marcus_Victorious', 'Livia_Domina', 'Brutus_Liberator', 'Cicero_Orator',
            'Pompey_Magnus', 'Antony_Triumvir', 'Hadrian_Builder', 'Trajan_Optimus',
            'Nero_Emperor', 'Vespasian_Flavius', 'Titus_Conqueror', 'Domitian_Ruler'
        ];

        Object.keys(this.leaderboards).forEach(boardId => {
            if (!this.leaderboards[boardId].entries) {
                this.leaderboards[boardId].entries = [];
                
                // Générer des scores réalistes
                for (let i = 0; i < 50; i++) {
                    const playerName = mockPlayerNames[i % mockPlayerNames.length] + '_' + (Math.floor(i/16) + 1);
                    const score = this.generateMockScore(boardId, i);
                    
                    this.leaderboards[boardId].entries.push({
                        rank: i + 1,
                        playerName: playerName,
                        score: score,
                        tier: this.calculateTier(score),
                        lastUpdated: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 // Dernière semaine
                    });
                }
            }
        });
    }

    generateMockScore(boardType, rank) {
        const baseScores = {
            empire_power: 50000 - (rank * 1000) + Math.random() * 5000,
            gold_accumulated: 1000000 - (rank * 20000) + Math.random() * 50000,
            population_growth: 10000 - (rank * 200) + Math.random() * 1000,
            military_might: 5000 - (rank * 100) + Math.random() * 500,
            construction_mastery: 100 - (rank * 2) + Math.random() * 10,
            trade_empire: 2000 - (rank * 40) + Math.random() * 200
        };
        
        return Math.max(100, Math.floor(baseScores[boardType] || 1000));
    }

    updatePlayerScore(gameState) {
        // Calculer les scores pour chaque classement
        Object.keys(this.leaderboards).forEach(boardId => {
            const newScore = this.calculateScore(boardId, gameState);
            this.updateLeaderboard(boardId, newScore);
        });
        
        // Mettre à jour le tier du joueur
        this.updatePlayerTier();
    }

    calculateScore(boardType, gameState) {
        switch (boardType) {
            case 'empire_power':
                return this.calculateEmpirePowerScore(gameState);
            case 'gold_accumulated':
                return gameState.resources.gold + (analyticsSystem?.metrics.economy.totalGoldEarned || 0);
            case 'population_growth':
                return gameState.city.stats.population;
            case 'military_might':
                return Object.values(gameState.unitPool || {}).reduce((sum, count) => sum + count, 0);
            case 'construction_mastery':
                return gameState.city.buildings.filter(b => b.type !== null).length +
                       Object.values(gameState.city.buildings.filter(b => b.type !== null))
                             .reduce((sum, b) => sum + b.level, 0);
            case 'trade_empire':
                return (analyticsSystem?.metrics.gameplay.tradesExecuted || 0) * 10 +
                       (economySystem?.getTradingStats().skill || 0);
            default:
                return 0;
        }
    }

    calculateEmpirePowerScore(gameState) {
        // Score composite basé sur plusieurs facteurs
        let score = 0;
        
        // Population (30%)
        score += gameState.city.stats.population * 3;
        
        // Richesse (25%)
        score += Math.sqrt(gameState.resources.gold) * 2;
        
        // Bâtiments (25%)
        const buildingScore = gameState.city.buildings
            .filter(b => b.type !== null)
            .reduce((sum, b) => sum + (b.level * 100), 0);
        score += buildingScore;
        
        // Militaire (15%)
        const militaryScore = Object.values(gameState.unitPool || {})
            .reduce((sum, count) => sum + count, 0) * 5;
        score += militaryScore;
        
        // Level du joueur (5%)
        score += gameState.player.level * 100;
        
        return Math.floor(score);
    }

    updateLeaderboard(boardId, playerScore) {
        const leaderboard = this.leaderboards[boardId];
        if (!leaderboard) return;
        
        // Trouver l'entrée du joueur ou la créer
        let playerEntry = leaderboard.entries.find(entry => entry.playerName === this.playerName);
        
        if (!playerEntry) {
            playerEntry = {
                playerName: this.playerName,
                score: playerScore,
                tier: this.calculateTier(playerScore),
                lastUpdated: Date.now()
            };
            leaderboard.entries.push(playerEntry);
        } else {
            playerEntry.score = Math.max(playerEntry.score, playerScore); // Garder le meilleur score
            playerEntry.lastUpdated = Date.now();
        }
        
        // Trier et réattribuer les rangs
        leaderboard.entries.sort((a, b) => b.score - a.score);
        leaderboard.entries.forEach((entry, index) => {
            entry.rank = index + 1;
        });
        
        // Mettre à jour les stats du joueur
        const playerRank = leaderboard.entries.findIndex(entry => entry.playerName === this.playerName) + 1;
        if (boardId === 'empire_power') {
            this.playerStats.rank = playerRank;
            this.playerStats.score = playerScore;
        }
    }

    calculateTier(score) {
        if (score >= 100000) return 'Legendary';
        if (score >= 50000) return 'Diamond';
        if (score >= 25000) return 'Platinum';
        if (score >= 10000) return 'Gold';
        if (score >= 5000) return 'Silver';
        return 'Bronze';
    }

    updatePlayerTier() {
        const powerScore = this.playerStats.score;
        const newTier = this.calculateTier(powerScore);
        const oldTier = this.playerStats.tier;
        
        if (newTier !== oldTier) {
            this.playerStats.tier = newTier;
            
            // Récompense pour progression de tier
            this.grantTierReward(newTier);
            
            if (gameController) {
                gameController.queueNotification({
                    icon: '🏆',
                    title: 'Tier Promotion!',
                    message: `Vous êtes maintenant ${newTier}!`,
                    duration: 6000
                });
            }
            
            if (analyticsSystem) {
                analyticsSystem.trackEvent('tier_promotion', {
                    oldTier: oldTier,
                    newTier: newTier,
                    score: powerScore
                });
            }
        }
    }

    grantTierReward(tier) {
        const tierRewards = {
            'Silver': [{ type: 'resource', resource: 'gold', amount: 5000 }],
            'Gold': [{ type: 'resource', resource: 'gold', amount: 15000 }, { type: 'xp', amount: 500 }],
            'Platinum': [{ type: 'resource', resource: 'gold', amount: 35000 }, { type: 'resource', resource: 'marble', amount: 2000 }],
            'Diamond': [{ type: 'resource', resource: 'gold', amount: 75000 }, { type: 'prestige_points', amount: 5 }],
            'Legendary': [{ type: 'resource', resource: 'gold', amount: 150000 }, { type: 'prestige_points', amount: 15 }, { type: 'unlock', feature: 'legendary_buildings' }]
        };
        
        const rewards = tierRewards[tier];
        if (rewards) {
            rewards.forEach(reward => {
                this.addReward(reward, `Récompense de tier ${tier}`);
            });
        }
    }

    generateDailyChallenges() {
        const challengeTemplates = [
            {
                id: 'daily_gold',
                name: 'Baron de l\'Or',
                description: 'Accumuler 50 000 pièces d\'or',
                type: 'resource_target',
                target: { resource: 'gold', amount: 50000 },
                reward: { type: 'resource', resource: 'gold', amount: 10000 },
                duration: 24 * 60 * 60 * 1000 // 24 heures
            },
            {
                id: 'daily_population',
                name: 'Croissance Démographique',
                description: 'Atteindre 2000 habitants',
                type: 'stat_target',
                target: { stat: 'population', amount: 2000 },
                reward: { type: 'xp', amount: 300 },
                duration: 24 * 60 * 60 * 1000
            },
            {
                id: 'daily_military',
                name: 'Recrutement Massif',
                description: 'Entraîner 100 unités militaires',
                type: 'action_count',
                target: { action: 'train_unit', count: 100 },
                reward: { type: 'resource', resource: 'gold', amount: 15000 },
                duration: 24 * 60 * 60 * 1000
            }
        ];
        
        // Sélectionner 2 défis aléatoirement
        const shuffled = challengeTemplates.sort(() => Math.random() - 0.5);
        const selectedChallenges = shuffled.slice(0, 2);
        
        selectedChallenges.forEach(template => {
            this.activeChallenges.push({
                ...template,
                startTime: Date.now(),
                endTime: Date.now() + template.duration,
                progress: 0,
                completed: false
            });
        });
    }

    checkChallengeProgress(gameState) {
        this.activeChallenges.forEach(challenge => {
            if (challenge.completed) return;
            
            let progress = 0;
            
            switch (challenge.type) {
                case 'resource_target':
                    progress = gameState.resources[challenge.target.resource] || 0;
                    break;
                case 'stat_target':
                    progress = gameState.city.stats[challenge.target.stat] || 0;
                    break;
                case 'action_count':
                    // Ce serait tracké par les événements
                    progress = challenge.progress; // Maintenir la progression actuelle
                    break;
            }
            
            challenge.progress = progress;
            
            if (progress >= challenge.target.amount && !challenge.completed) {
                this.completeChallenge(challenge);
            }
        });
        
        // Nettoyer les défis expirés
        this.activeChallenges = this.activeChallenges.filter(challenge => 
            Date.now() < challenge.endTime || challenge.completed
        );
    }

    completeChallenge(challenge) {
        challenge.completed = true;
        challenge.completedAt = Date.now();
        
        this.playerStats.challenges_completed++;
        
        // Appliquer la récompense
        this.addReward(challenge.reward, challenge.name);
        
        if (gameController) {
            gameController.queueNotification({
                icon: '🎯',
                title: 'Défi Réussi!',
                message: `${challenge.name} terminé!`,
                duration: 5000
            });
        }
        
        if (analyticsSystem) {
            analyticsSystem.trackEvent('challenge_completed', {
                challengeId: challenge.id,
                timeTaken: Date.now() - challenge.startTime
            });
        }
    }

    addReward(reward, source) {
        const rewardEntry = {
            ...reward,
            source: source,
            timestamp: Date.now(),
            claimed: false
        };
        
        this.rewards.push(rewardEntry);
    }

    claimReward(rewardIndex, gameState) {
        const reward = this.rewards[rewardIndex];
        if (!reward || reward.claimed) {
            return { success: false, message: "Récompense non trouvée ou déjà réclamée." };
        }
        
        // Appliquer la récompense
        switch (reward.type) {
            case 'resource':
                gameState.resources[reward.resource] += reward.amount;
                break;
            case 'xp':
                addXp(reward.amount);
                break;
            case 'prestige_points':
                if (prestigeSystem) {
                    prestigeSystem.prestigeData.prestigePoints += reward.amount;
                }
                break;
        }
        
        reward.claimed = true;
        reward.claimedAt = Date.now();
        
        return { 
            success: true, 
            message: `Récompense réclamée: ${reward.amount} ${reward.resource || 'XP'}` 
        };
    }

    checkSeasonReset() {
        if (Date.now() > this.seasonData.seasonEndDate) {
            this.performSeasonReset();
        }
    }

    performSeasonReset() {
        // Calculer les récompenses de fin de saison
        this.calculateSeasonRewards();
        
        // Nouvelle saison
        this.seasonData.currentSeason++;
        this.seasonData.seasonStartDate = Date.now();
        this.seasonData.seasonEndDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
        
        // Reset des classements (garder seulement les 10 premiers)
        Object.keys(this.leaderboards).forEach(boardId => {
            const leaderboard = this.leaderboards[boardId];
            leaderboard.entries = leaderboard.entries.slice(0, 10);
            
            // Réduire les scores de 50% pour nouveau départ
            leaderboard.entries.forEach(entry => {
                entry.score = Math.floor(entry.score * 0.5);
            });
        });
        
        if (gameController) {
            gameController.queueNotification({
                icon: '🌟',
                title: 'Nouvelle Saison!',
                message: `Saison ${this.seasonData.currentSeason} commence!`,
                duration: 8000
            });
        }
    }

    calculateSeasonRewards() {
        const playerRank = this.playerStats.rank;
        let seasonReward = null;
        
        if (playerRank <= 10) {
            seasonReward = { type: 'prestige_points', amount: 50, resource: null };
        } else if (playerRank <= 50) {
            seasonReward = { type: 'prestige_points', amount: 25, resource: null };
        } else if (playerRank <= 100) {
            seasonReward = { type: 'resource', resource: 'gold', amount: 100000 };
        }
        
        if (seasonReward) {
            this.addReward(seasonReward, `Récompense Saison ${this.seasonData.currentSeason}`);
        }
    }

    getLeaderboard(boardId, limit = 10) {
        const leaderboard = this.leaderboards[boardId];
        if (!leaderboard) return null;
        
        return {
            name: leaderboard.name,
            description: leaderboard.description,
            entries: leaderboard.entries.slice(0, limit),
            playerEntry: leaderboard.entries.find(entry => entry.playerName === this.playerName)
        };
    }

    getPlayerRankings() {
        const rankings = {};
        
        Object.keys(this.leaderboards).forEach(boardId => {
            const leaderboard = this.leaderboards[boardId];
            const playerEntry = leaderboard.entries.find(entry => entry.playerName === this.playerName);
            
            if (playerEntry) {
                rankings[boardId] = {
                    rank: playerEntry.rank,
                    score: playerEntry.score,
                    tier: playerEntry.tier
                };
            }
        });
        
        return rankings;
    }

    getUnclaimedRewards() {
        return this.rewards.filter(reward => !reward.claimed);
    }

    getCompetitionStatus() {
        return {
            playerName: this.playerName,
            stats: this.playerStats,
            currentSeason: this.seasonData.currentSeason,
            seasonTimeLeft: this.seasonData.seasonEndDate - Date.now(),
            activeChallenges: this.activeChallenges.filter(c => !c.completed),
            unclaimedRewards: this.getUnclaimedRewards().length
        };
    }

    save() {
        const data = {
            playerName: this.playerName,
            playerStats: this.playerStats,
            rewards: this.rewards,
            seasonData: this.seasonData
        };
        localStorage.setItem('imperium_competition', JSON.stringify(data));
    }
}

// Définitions des classements
const LEADERBOARD_DEFINITIONS = {
    empire_power: {
        name: "Puissance Impériale",
        description: "Classement basé sur la puissance globale de l'empire",
        icon: "👑",
        entries: []
    },
    gold_accumulated: {
        name: "Fortune Accumulée",
        description: "Classement basé sur l'or total accumulé",
        icon: "💰",
        entries: []
    },
    population_growth: {
        name: "Croissance Démographique",
        description: "Classement basé sur la population de la cité",
        icon: "👥",
        entries: []
    },
    military_might: {
        name: "Puissance Militaire",
        description: "Classement basé sur la taille de l'armée",
        icon: "⚔️",
        entries: []
    },
    construction_mastery: {
        name: "Maîtrise Architecturale",
        description: "Classement basé sur les bâtiments construits",
        icon: "🏛️",
        entries: []
    },
    trade_empire: {
        name: "Empire Commercial",
        description: "Classement basé sur les activités commerciales",
        icon: "🚢",
        entries: []
    }
};

// Instance globale
let competitionSystem;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    competitionSystem = new CompetitionSystem();
    
    // Générer des défis quotidiens au démarrage
    if (competitionSystem.activeChallenges.length === 0) {
        competitionSystem.generateDailyChallenges();
    }
});

// Fonctions utilitaires
function updateCompetitionScores(gameState) {
    if (competitionSystem) {
        competitionSystem.updatePlayerScore(gameState);
        competitionSystem.checkChallengeProgress(gameState);
    }
}

function getLeaderboards() {
    return competitionSystem ? Object.keys(LEADERBOARD_DEFINITIONS).map(id => 
        competitionSystem.getLeaderboard(id, 10)
    ) : [];
}

function getCompetitionStatus() {
    return competitionSystem ? competitionSystem.getCompetitionStatus() : null;
}