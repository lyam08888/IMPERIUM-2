// advanced-features-ui.js - Interface utilisateur pour les fonctionnalités avancées

class AdvancedFeaturesUI {
    constructor() {
        this.currentTab = 'achievements';
        this.currentCategory = 'all';
        this.currentLeaderboard = 'empire_power';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadInitialData();
        
        // Rafraîchir l'interface toutes les 30 secondes
        setInterval(() => {
            this.refreshCurrentTab();
        }, 30000);
    }
    
    setupEventListeners() {
        // Navigation des onglets
        document.querySelectorAll('.feature-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Catégories d'accomplissements
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterAchievements(category);
            });
        });
        
        // Onglets de classements
        document.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const boardId = e.target.dataset.board;
                this.showLeaderboard(boardId);
            });
        });
    }
    
    loadInitialData() {
        this.loadAchievements();
        this.loadEvents();
        this.loadMarkets();
        this.loadCompetition();
        this.loadPrestige();
        this.loadAnalytics();
    }
    
    switchTab(tabName) {
        // Mettre à jour navigation
        document.querySelectorAll('.feature-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Mettre à jour contenu
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        this.currentTab = tabName;
        this.refreshCurrentTab();
    }
    
    refreshCurrentTab() {
        switch (this.currentTab) {
            case 'achievements':
                this.loadAchievements();
                break;
            case 'events':
                this.loadEvents();
                break;
            case 'markets':
                this.loadMarkets();
                break;
            case 'competition':
                this.loadCompetition();
                break;
            case 'prestige':
                this.loadPrestige();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }
    
    // ACCOMPLISSEMENTS
    loadAchievements() {
        if (!achievementSystem) return;
        
        const completion = achievementSystem.getCompletionRate();
        const totalPoints = achievementSystem.totalAchievementPoints;
        
        // Mettre à jour les statistiques
        document.getElementById('achievements-unlocked').textContent = completion.unlocked;
        document.getElementById('achievements-total').textContent = completion.total;
        document.getElementById('achievement-points').textContent = totalPoints;
        
        // Mettre à jour la barre de progression
        const progressBar = document.getElementById('achievement-progress-bar');
        const progressText = document.getElementById('achievement-progress-text');
        progressBar.style.width = `${completion.percentage}%`;
        progressText.textContent = `${completion.percentage}%`;
        
        // Charger les accomplissements
        this.filterAchievements(this.currentCategory);
    }
    
    filterAchievements(category) {
        this.currentCategory = category;
        
        // Mettre à jour les boutons de catégorie
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        if (!achievementSystem) return;
        
        // Obtenir les accomplissements
        let achievements;
        if (category === 'all') {
            achievements = Object.keys(ACHIEVEMENT_DEFINITIONS).map(id => ({
                id,
                ...ACHIEVEMENT_DEFINITIONS[id],
                unlocked: achievementSystem.isUnlocked(id),
                unlockedAt: achievementSystem.playerAchievements[id]?.unlockedAt
            }));
        } else {
            achievements = achievementSystem.getAchievementsByCategory(category);
        }
        
        // Rendre les accomplissements
        const container = document.getElementById('achievements-list');
        container.innerHTML = achievements.map(achievement => `
            <div class="achievement-card ${achievement.unlocked ? 'unlocked' : ''}">
                <div class="achievement-header">
                    <span class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</span>
                    <span class="achievement-name">${achievement.name}</span>
                    <span class="achievement-points">${achievement.points || 10} pts</span>
                </div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-status">
                    ${achievement.unlocked ? 
                        `Débloqué le ${new Date(achievement.unlockedAt).toLocaleDateString()}` : 
                        'Non débloqué'
                    }
                </div>
            </div>
        `).join('');
    }
    
    // ÉVÉNEMENTS
    loadEvents() {
        if (!eventsSystem) return;
        
        const activeEvents = eventsSystem.getActiveEvents();
        const completedEvents = eventsSystem.getCompletedEvents();
        const dailyProgress = eventsSystem.getDailyProgress();
        const weeklyProgress = eventsSystem.getWeeklyProgress();
        
        // Mettre à jour les compteurs
        document.getElementById('daily-progress').textContent = `${dailyProgress.completed}/${dailyProgress.total}`;
        document.getElementById('weekly-progress').textContent = `${weeklyProgress.completed}/${weeklyProgress.total}`;
        
        // Événements actifs
        document.getElementById('active-events').innerHTML = activeEvents.length > 0 ? 
            activeEvents.map(event => this.renderEventCard(event)).join('') :
            '<p style="color: var(--text-muted); text-align: center;">Aucun événement actif</p>';
        
        // Événements complétés
        document.getElementById('completed-events').innerHTML = completedEvents.length > 0 ?
            completedEvents.slice(0, 5).map(event => this.renderEventCard(event)).join('') :
            '<p style="color: var(--text-muted); text-align: center;">Aucun événement complété récemment</p>';
    }
    
    renderEventCard(event) {
        const timeLeft = event.expiresAt - Date.now();
        const isExpired = timeLeft <= 0;
        
        return `
            <div class="event-card ${event.completed ? 'completed' : ''}">
                <div class="event-name">${event.name}</div>
                <div class="event-description">${event.description}</div>
                <div class="event-objectives">
                    ${event.objectives.map((obj, index) => `
                        <div class="objective-item">
                            <span class="objective-description">${obj.description}</span>
                            <span class="objective-progress">${event.progress[index]}/${obj.target}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="event-rewards">
                    Récompenses: ${event.rewards.map(r => `${r.amount} ${r.resource || 'XP'}`).join(', ')}
                </div>
                <div class="event-timer">
                    ${event.completed ? 'Complété' : 
                      isExpired ? 'Expiré' : 
                      `Temps restant: ${this.formatTime(timeLeft)}`}
                </div>
            </div>
        `;
    }
    
    // MARCHÉS
    loadMarkets() {
        if (!economySystem) return;
        
        const markets = economySystem.getAllMarkets();
        const tradingStats = economySystem.getTradingStats();
        const marketNews = economySystem.getMarketNews();
        
        // Mettre à jour les statistiques de trading
        document.getElementById('trading-skill').textContent = tradingStats.skill;
        document.getElementById('total-trades').textContent = tradingStats.totalTrades;
        document.getElementById('total-profit').textContent = tradingStats.totalProfit.toLocaleString();
        
        // Rendre les marchés
        document.getElementById('markets-list').innerHTML = markets.map(market => `
            <div class="market-card">
                <div class="market-header">
                    <div>
                        <div class="market-name">${market.name}</div>
                        <div class="market-location">${market.location}</div>
                    </div>
                </div>
                <div class="market-resources">
                    ${Object.entries(market.resources).map(([resource, data]) => `
                        <div class="resource-row">
                            <span class="resource-name">${resource.charAt(0).toUpperCase() + resource.slice(1)}</span>
                            <span class="resource-price">${data.currentPrice} 💰</span>
                            <span class="resource-change ${parseFloat(data.change) >= 0 ? 'positive' : 'negative'}">
                                ${parseFloat(data.change) >= 0 ? '+' : ''}${data.change}%
                            </span>
                        </div>
                    `).join('')}
                </div>
                <div class="market-actions">
                    <button class="trade-btn" onclick="openTradeModal('${market.id}')">📈 Trader</button>
                    <button class="trade-btn" onclick="viewPriceHistory('${market.id}')">📊 Historique</button>
                </div>
            </div>
        `).join('');
        
        // Nouvelles du marché
        document.getElementById('market-news-list').innerHTML = marketNews.length > 0 ?
            marketNews.slice(0, 5).map(news => `
                <div class="news-item">
                    <div class="news-headline">${news.headline}</div>
                    <div class="news-description">${news.description}</div>
                </div>
            `).join('') :
            '<p style="color: var(--text-muted);">Aucune nouvelle récente</p>';
    }
    
    // COMPÉTITION
    loadCompetition() {
        if (!competitionSystem) return;
        
        const status = competitionSystem.getCompetitionStatus();
        const rankings = competitionSystem.getPlayerRankings();
        
        // Mettre à jour les informations du joueur
        document.getElementById('player-name').textContent = status.playerName;
        document.getElementById('player-tier').textContent = status.stats.tier;
        document.getElementById('player-rank').textContent = `#${status.stats.rank}`;
        document.getElementById('current-season').textContent = status.currentSeason;
        document.getElementById('season-time-left').textContent = this.formatTime(status.seasonTimeLeft);
        
        // Charger le classement actuel
        this.showLeaderboard(this.currentLeaderboard);
        
        // Défis actifs
        const challenges = status.activeChallenges || [];
        document.getElementById('active-challenges').innerHTML = challenges.length > 0 ?
            challenges.map(challenge => `
                <div class="challenge-card">
                    <div class="challenge-name">${challenge.name}</div>
                    <div class="challenge-description">${challenge.description}</div>
                    <div class="challenge-progress">
                        <span class="challenge-progress-text">
                            Progrès: ${challenge.progress}/${challenge.target?.amount || 'N/A'}
                        </span>
                        <span class="challenge-timer">
                            ${this.formatTime(challenge.endTime - Date.now())}
                        </span>
                    </div>
                </div>
            `).join('') :
            '<p style="color: var(--text-muted);">Aucun défi actif</p>';
    }
    
    showLeaderboard(boardId) {
        this.currentLeaderboard = boardId;
        
        // Mettre à jour les onglets
        document.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-board="${boardId}"]`).classList.add('active');
        
        if (!competitionSystem) return;
        
        const leaderboard = competitionSystem.getLeaderboard(boardId, 20);
        if (!leaderboard) return;
        
        document.getElementById('leaderboard-display').innerHTML = `
            <h4>${leaderboard.name}</h4>
            <p style="color: var(--text-muted); margin-bottom: 1rem;">${leaderboard.description}</p>
            <div class="leaderboard-entries">
                ${leaderboard.entries.map(entry => `
                    <div class="leaderboard-entry ${entry.playerName === competitionSystem.playerName ? 'player' : ''}">
                        <span class="entry-rank">#${entry.rank}</span>
                        <span class="entry-name">${entry.playerName}</span>
                        <span class="entry-score">${entry.score.toLocaleString()}</span>
                        <span class="entry-tier">${entry.tier}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // PRESTIGE
    loadPrestige() {
        if (!prestigeSystem) return;
        
        const stats = prestigeSystem.getPrestigeStats();
        const bonuses = prestigeSystem.getAvailableBonuses();
        const canPrestige = prestigeSystem.canPrestige(gameState);
        const requirements = prestigeSystem.getPrestigeRequirements();
        
        // Mettre à jour les informations de prestige
        document.getElementById('prestige-level').textContent = stats.level;
        document.getElementById('prestige-points').textContent = stats.points;
        
        // Bouton de prestige
        const prestigeBtn = document.getElementById('prestige-button');
        prestigeBtn.disabled = !canPrestige;
        prestigeBtn.textContent = canPrestige ? '✨ Prestige' : '🔒 Indisponible';
        
        // Bonus disponibles
        document.getElementById('prestige-bonuses').innerHTML = bonuses.map(bonus => `
            <div class="bonus-card ${bonus.unlocked ? 'unlocked' : ''}">
                <div class="bonus-header">
                    <span class="bonus-name">${bonus.name}</span>
                    <span class="bonus-cost">${bonus.cost} pts</span>
                </div>
                <div class="bonus-description">${bonus.description}</div>
                ${bonus.unlocked ? 
                    '<span style="color: var(--success-color); font-weight: bold;">✅ Débloqué</span>' :
                    `<button class="unlock-btn" ${!bonus.canAfford ? 'disabled' : ''} 
                        onclick="unlockPrestigeBonus('${bonus.id}')">
                        ${bonus.canAfford ? 'Débloquer' : 'Points insuffisants'}
                    </button>`
                }
            </div>
        `).join('');
        
        // Statistiques à vie
        document.getElementById('lifetime-stats').innerHTML = Object.entries(stats.lifetimeStats).map(([key, value]) => `
            <div class="lifetime-stat">
                <span class="lifetime-stat-label">${this.formatStatName(key)}</span>
                <span class="lifetime-stat-value">${this.formatStatValue(key, value)}</span>
            </div>
        `).join('');
    }
    
    // ANALYTICS
    loadAnalytics() {
        if (!analyticsSystem) return;
        
        const profile = analyticsSystem.getPlayerProfile();
        const insights = analyticsSystem.getGameplayInsights();
        const retention = analyticsSystem.getRetentionMetrics();
        
        // Profil du joueur
        document.getElementById('player-profile').innerHTML = `
            <div class="profile-grid">
                ${Object.entries(profile).map(([key, value]) => `
                    <div class="profile-stat">
                        <span class="profile-stat-label">${this.formatStatName(key)}</span>
                        <span class="profile-stat-value">${value}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Conseils personnalisés
        document.getElementById('insights-list').innerHTML = insights.length > 0 ?
            insights.map(insight => `
                <div class="insight-card ${insight.type}">
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-message">${insight.message}</div>
                    <div class="insight-suggestion">${insight.suggestion}</div>
                </div>
            `).join('') :
            '<p style="color: var(--text-muted);">Aucun conseil disponible</p>';
        
        // Métriques de rétention
        document.getElementById('retention-display').innerHTML = `
            <div class="profile-grid">
                ${Object.entries(retention).map(([key, value]) => `
                    <div class="profile-stat">
                        <span class="profile-stat-label">${this.formatStatName(key)}</span>
                        <span class="profile-stat-value">${this.formatRetentionValue(key, value)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // UTILITAIRES
    formatTime(ms) {
        if (ms <= 0) return '0m';
        
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        
        if (days > 0) return `${days}j ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }
    
    formatStatName(key) {
        const names = {
            level: 'Niveau',
            totalPlayTime: 'Temps de Jeu',
            sessionsCount: 'Sessions',
            averageSessionLength: 'Durée Moyenne',
            daysSinceFirstPlay: 'Jours de Jeu',
            consecutiveDays: 'Jours Consécutifs',
            buildingsBuilt: 'Bâtiments Construits',
            unitsTrained: 'Unités Entraînées',
            questsCompleted: 'Quêtes Complétées',
            achievementsUnlocked: 'Accomplissements',
            prestigeCount: 'Prestiges',
            peakGold: 'Max Or Détenu',
            totalGoldEarned: 'Or Total Gagné',
            totalBuildingsBuilt: 'Total Bâtiments',
            totalUnitsTrained: 'Total Unités',
            totalPlayTime: 'Temps Total',
            highestLevel: 'Niveau Max',
            highestPopulation: 'Pop. Maximum',
            totalSessions: 'Sessions Totales',
            retentionRate: 'Taux Rétention'
        };
        return names[key] || key;
    }
    
    formatStatValue(key, value) {
        if (key.includes('PlayTime') || key.includes('Time')) {
            return this.formatTime(value);
        }
        if (key.includes('Gold') || key.includes('gold')) {
            return value.toLocaleString();
        }
        return value.toLocaleString();
    }
    
    formatRetentionValue(key, value) {
        if (key === 'averageSessionLength') {
            return this.formatTime(value);
        }
        if (key === 'retentionRate') {
            return `${value}%`;
        }
        return value.toLocaleString();
    }
}

// Fonctions globales
function refreshEvents() {
    if (eventsSystem) {
        eventsSystem.forceGenerateEvent('daily');
        advancedFeaturesUI.loadEvents();
    }
}

function attemptPrestige() {
    if (!prestigeSystem || !gameState) return;
    
    if (confirm('Êtes-vous sûr de vouloir effectuer un Prestige ? Cela réinitialisera votre progression mais vous donnera des bonus permanents.')) {
        const result = prestigeSystem.performPrestige(gameState);
        
        if (result.success) {
            alert(`Prestige réussi ! Vous avez gagné ${result.pointsGained} points de prestige.`);
            // Recharger le jeu avec le nouvel état
            gameState = result.newGameState;
            saveGameState();
            location.reload();
        } else {
            alert(result.message);
        }
    }
}

function showPrestigeRequirements() {
    if (!prestigeSystem) return;
    
    const requirements = prestigeSystem.getPrestigeRequirements();
    const requirementsList = requirements.map(req => `• ${req.description}`).join('\n');
    
    alert(`Conditions pour le Prestige :\n\n${requirementsList}`);
}

function unlockPrestigeBonus(bonusId) {
    if (!prestigeSystem) return;
    
    const result = prestigeSystem.unlockBonus(bonusId);
    
    if (result.success) {
        alert('Bonus débloqué avec succès !');
        advancedFeaturesUI.loadPrestige();
    } else {
        alert(result.message);
    }
}

function openTradeModal(marketId) {
    alert('Fonctionnalité de trading en cours de développement');
    // TODO: Implémenter l'interface de trading
}

function viewPriceHistory(marketId) {
    alert('Historique des prix en cours de développement');
    // TODO: Implémenter l'affichage de l'historique
}

// Initialisation
let advancedFeaturesUI;

document.addEventListener('DOMContentLoaded', () => {
    advancedFeaturesUI = new AdvancedFeaturesUI();
});