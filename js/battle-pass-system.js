// Battle Pass System - Inspiré de Fortnite
// 100 niveaux de progression avec récompenses

class BattlePassSystem {
    constructor() {
        this.currentLevel = 1;
        this.currentXP = 0;
        this.xpPerLevel = 1000;
        this.maxLevel = 100;
        this.battlePassActive = true;
        this.unlockedRewards = [];
        this.purchasedTiers = [];
        
        this.initializeBattlePass();
        this.loadBattlePassData();
    }

    initializeBattlePass() {
        this.battlePassTiers = this.generateBattlePassTiers();
    }

    generateBattlePassTiers() {
        const tiers = [];
        const rewards = {
            // Types de récompenses
            gold: [500, 750, 1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000],
            food: [300, 450, 600, 750, 900, 1200, 1500, 1800, 2400, 3000],
            marble: [200, 300, 400, 500, 600, 800, 1000, 1200, 1600, 2000],
            skins: ['Légionnaire Elite', 'Centurion Doré', 'Général Impérial', 'César Victorieux'],
            units: [10, 15, 20, 25, 30, 40, 50, 75, 100, 150],
            buildings: ['Temple Premium', 'Caserne Elite', 'Forum Doré', 'Colisée Legendaire'],
            cosmetics: ['Bannière Rouge', 'Bannière Dorée', 'Bannière Impériale', 'Bannière Légendaire'],
            special: ['Boost XP x2', 'Production x2', 'Construction Rapide', 'Ressources Premium']
        };

        const rarityColors = {
            common: '#808080',    // Gris
            rare: '#0070ff',      // Bleu
            epic: '#8f48db',      // Violet
            legendary: '#ffa500', // Orange
            mythic: '#ff6b35'     // Rouge
        };

        for (let level = 1; level <= this.maxLevel; level++) {
            const tier = {
                level: level,
                xpRequired: this.xpPerLevel * level,
                freeReward: null,
                premiumReward: null,
                rarity: this.determineRarity(level),
                isSpecial: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].includes(level)
            };

            // Récompense gratuite
            if (level % 5 === 0) {
                tier.freeReward = this.generateReward(level, 'free');
            }

            // Récompense premium (toujours présente)
            tier.premiumReward = this.generateReward(level, 'premium');

            // Récompenses spéciales aux niveaux clés
            if (tier.isSpecial) {
                tier.specialReward = this.generateSpecialReward(level);
            }

            tier.color = rarityColors[tier.rarity];
            tiers.push(tier);
        }

        return tiers;
    }

    determineRarity(level) {
        if (level === 100) return 'mythic';
        if (level >= 90) return 'legendary';
        if (level >= 70) return 'epic';
        if (level >= 40) return 'rare';
        return 'common';
    }

    generateReward(level, type) {
        const baseMultiplier = type === 'premium' ? 1.5 : 1;
        const levelMultiplier = Math.floor(level / 10) + 1;
        
        const rewardTypes = [
            {
                type: 'gold',
                icon: '💰',
                amount: Math.floor(500 * levelMultiplier * baseMultiplier)
            },
            {
                type: 'food',
                icon: '🌾',
                amount: Math.floor(300 * levelMultiplier * baseMultiplier)
            },
            {
                type: 'marble',
                icon: '🏛️',
                amount: Math.floor(200 * levelMultiplier * baseMultiplier)
            },
            {
                type: 'units',
                icon: '⚔️',
                amount: Math.floor(10 * levelMultiplier * baseMultiplier)
            }
        ];

        if (level % 10 === 0 && type === 'premium') {
            return {
                type: 'cosmetic',
                icon: '🎨',
                name: `Skin Niveau ${level}`,
                rarity: this.determineRarity(level)
            };
        }

        const randomReward = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
        return randomReward;
    }

    generateSpecialReward(level) {
        const specialRewards = {
            10: { type: 'boost', icon: '⚡', name: 'Boost XP x2 (1h)', duration: 3600 },
            20: { type: 'skin', icon: '👑', name: 'Couronne de Fer', rarity: 'rare' },
            30: { type: 'building', icon: '🏰', name: 'Temple d\'Elite', rarity: 'epic' },
            40: { type: 'boost', icon: '🚀', name: 'Production x3 (2h)', duration: 7200 },
            50: { type: 'skin', icon: '🦅', name: 'Aigle Légionnaire', rarity: 'epic' },
            60: { type: 'units', icon: '⚔️', name: '100 Légionnaires Elite', amount: 100 },
            70: { type: 'boost', icon: '💎', name: 'Construction Instantanée x5', uses: 5 },
            80: { type: 'skin', icon: '🛡️', name: 'Armure Impériale', rarity: 'legendary' },
            90: { type: 'building', icon: '🏟️', name: 'Colisée Légendaire', rarity: 'legendary' },
            100: { type: 'title', icon: '👑', name: 'EMPEREUR ÉTERNEL', rarity: 'mythic' }
        };

        return specialRewards[level] || null;
    }

    addXP(amount) {
        this.currentXP += amount;
        let leveledUp = false;

        while (this.currentXP >= this.getXPForLevel(this.currentLevel + 1) && this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            leveledUp = true;
            this.showLevelUpNotification();
        }

        if (leveledUp) {
            this.checkForRewards();
        }

        this.saveBattlePassData();
        return leveledUp;
    }

    getXPForLevel(level) {
        return this.xpPerLevel * level;
    }

    getCurrentProgress() {
        const currentLevelXP = this.getXPForLevel(this.currentLevel);
        const nextLevelXP = this.getXPForLevel(this.currentLevel + 1);
        const progress = ((this.currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        
        return {
            currentLevel: this.currentLevel,
            currentXP: this.currentXP,
            xpForNextLevel: nextLevelXP - this.currentXP,
            progressPercent: Math.max(0, Math.min(100, progress)),
            maxLevel: this.maxLevel
        };
    }

    checkForRewards() {
        const tier = this.battlePassTiers[this.currentLevel - 1];
        if (!tier) return;

        // Récompense gratuite
        if (tier.freeReward && !this.unlockedRewards.includes(`free_${this.currentLevel}`)) {
            this.claimReward(tier.freeReward, 'free');
            this.unlockedRewards.push(`free_${this.currentLevel}`);
        }

        // Récompense premium (si activé)
        if (tier.premiumReward && this.battlePassActive && !this.unlockedRewards.includes(`premium_${this.currentLevel}`)) {
            this.claimReward(tier.premiumReward, 'premium');
            this.unlockedRewards.push(`premium_${this.currentLevel}`);
        }

        // Récompense spéciale
        if (tier.specialReward && this.battlePassActive && !this.unlockedRewards.includes(`special_${this.currentLevel}`)) {
            this.claimReward(tier.specialReward, 'special');
            this.unlockedRewards.push(`special_${this.currentLevel}`);
        }
    }

    claimReward(reward, type) {
        if (!reward) return;

        // Appliquer la récompense selon son type
        switch (reward.type) {
            case 'gold':
            case 'food':
            case 'marble':
                if (window.gameState && window.gameState.resources) {
                    window.gameState.resources[reward.type] += reward.amount;
                }
                break;
            case 'units':
                if (window.gameState && window.gameState.city) {
                    window.gameState.city.population += reward.amount;
                }
                break;
            case 'boost':
                this.applyBoost(reward);
                break;
            case 'skin':
            case 'cosmetic':
            case 'building':
            case 'title':
                // Stocker dans l'inventaire
                this.addToInventory(reward);
                break;
        }

        this.showRewardNotification(reward, type);
    }

    applyBoost(boost) {
        // Système de boost temporaire
        const boostKey = `boost_${boost.name.replace(/\s+/g, '_')}`;
        const endTime = Date.now() + (boost.duration * 1000 || 3600000);
        
        localStorage.setItem(boostKey, JSON.stringify({
            active: true,
            endTime: endTime,
            multiplier: boost.multiplier || 2
        }));
    }

    addToInventory(item) {
        const inventory = JSON.parse(localStorage.getItem('imperium_inventory') || '[]');
        inventory.push({
            ...item,
            acquiredAt: Date.now(),
            battlePassLevel: this.currentLevel
        });
        localStorage.setItem('imperium_inventory', JSON.stringify(inventory));
    }

    showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.className = 'battle-pass-levelup';
        notification.innerHTML = `
            <div class="levelup-content">
                <div class="levelup-icon">🎖️</div>
                <div class="levelup-text">
                    <h3>NIVEAU SUPÉRIEUR!</h3>
                    <p>Pass de Combat Niveau ${this.currentLevel}</p>
                </div>
                <div class="levelup-effect">✨</div>
            </div>
        `;

        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);

        // Effet sonore si disponible
        this.playSound('levelup');
    }

    showRewardNotification(reward, type) {
        const notification = document.createElement('div');
        notification.className = `battle-pass-reward ${type}`;
        notification.innerHTML = `
            <div class="reward-content">
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-text">
                    <h4>Récompense ${type === 'premium' ? 'Premium' : 'Gratuite'}!</h4>
                    <p>${reward.name || `${reward.amount} ${reward.type}`}</p>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    playSound(type) {
        // Placeholder pour les effets sonores
        console.log(`🔊 Playing ${type} sound`);
    }

    showBattlePassUI() {
        const modal = document.createElement('div');
        modal.className = 'battle-pass-modal';
        modal.innerHTML = this.generateBattlePassHTML();

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.battle-pass-close').onclick = () => modal.remove();
        
        // Scroll to current level
        setTimeout(() => {
            const currentTier = modal.querySelector(`.tier[data-level="${this.currentLevel}"]`);
            if (currentTier) {
                currentTier.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }

    generateBattlePassHTML() {
        const progress = this.getCurrentProgress();
        
        return `
            <div class="battle-pass-container">
                <div class="battle-pass-header">
                    <h2>⚔️ PASS DE COMBAT IMPÉRIAL</h2>
                    <button class="battle-pass-close">❌</button>
                </div>
                
                <div class="battle-pass-progress">
                    <div class="progress-info">
                        <span>Niveau ${progress.currentLevel}/${progress.maxLevel}</span>
                        <span>${progress.xpForNextLevel} XP pour le niveau suivant</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.progressPercent}%"></div>
                    </div>
                </div>

                <div class="battle-pass-tiers">
                    ${this.battlePassTiers.map(tier => this.generateTierHTML(tier)).join('')}
                </div>
            </div>
        `;
    }

    generateTierHTML(tier) {
        const isUnlocked = tier.level <= this.currentLevel;
        const freeRewardClaimed = this.unlockedRewards.includes(`free_${tier.level}`);
        const premiumRewardClaimed = this.unlockedRewards.includes(`premium_${tier.level}`);

        return `
            <div class="tier ${isUnlocked ? 'unlocked' : 'locked'} ${tier.isSpecial ? 'special' : ''}" data-level="${tier.level}">
                <div class="tier-level">${tier.level}</div>
                
                ${tier.freeReward ? `
                    <div class="tier-reward free ${freeRewardClaimed ? 'claimed' : ''}">
                        <div class="reward-icon">${tier.freeReward.icon}</div>
                        <div class="reward-info">
                            <span class="reward-amount">${tier.freeReward.amount || ''}</span>
                            <span class="reward-type">${tier.freeReward.name || tier.freeReward.type}</span>
                        </div>
                    </div>
                ` : '<div class="tier-reward empty"></div>'}
                
                <div class="tier-reward premium ${premiumRewardClaimed ? 'claimed' : ''} ${!this.battlePassActive ? 'locked' : ''}">
                    <div class="reward-icon">${tier.premiumReward.icon}</div>
                    <div class="reward-info">
                        <span class="reward-amount">${tier.premiumReward.amount || ''}</span>
                        <span class="reward-type">${tier.premiumReward.name || tier.premiumReward.type}</span>
                    </div>
                </div>
                
                ${tier.specialReward ? `
                    <div class="tier-reward special ${this.unlockedRewards.includes(`special_${tier.level}`) ? 'claimed' : ''}">
                        <div class="reward-icon">${tier.specialReward.icon}</div>
                        <div class="reward-info">
                            <span class="reward-name">${tier.specialReward.name}</span>
                            <span class="reward-rarity ${tier.specialReward.rarity}">${tier.specialReward.rarity.toUpperCase()}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Actions liées au combat qui donnent de l'XP
    onCombatVictory(enemyLevel = 1) {
        const baseXP = 100;
        const xpGained = baseXP * enemyLevel;
        this.addXP(xpGained);
        return xpGained;
    }

    onBuildingConstructed(buildingCost) {
        const xpGained = Math.floor(buildingCost / 10);
        this.addXP(xpGained);
        return xpGained;
    }

    onQuestCompleted(questDifficulty = 1) {
        const baseXP = 250;
        const xpGained = baseXP * questDifficulty;
        this.addXP(xpGained);
        return xpGained;
    }

    onResourcesGathered(amount) {
        const xpGained = Math.floor(amount / 100);
        this.addXP(xpGained);
        return xpGained;
    }

    saveBattlePassData() {
        const data = {
            currentLevel: this.currentLevel,
            currentXP: this.currentXP,
            battlePassActive: this.battlePassActive,
            unlockedRewards: this.unlockedRewards,
            purchasedTiers: this.purchasedTiers,
            version: '1.0'
        };
        
        localStorage.setItem('imperium_battle_pass', JSON.stringify(data));
    }

    loadBattlePassData() {
        const data = localStorage.getItem('imperium_battle_pass');
        if (data) {
            const parsed = JSON.parse(data);
            this.currentLevel = parsed.currentLevel || 1;
            this.currentXP = parsed.currentXP || 0;
            this.battlePassActive = parsed.battlePassActive !== false;
            this.unlockedRewards = parsed.unlockedRewards || [];
            this.purchasedTiers = parsed.purchasedTiers || [];
        }
    }

    // Interface avec le système de jeu principal
    integratWithGame() {
        // Hook dans les événements du jeu
        if (window.gameState) {
            // Sauvegarder l'instance dans le gameState
            window.gameState.battlePass = this;
        }

        // Observer les changements pour donner de l'XP
        this.setupGameEventListeners();
    }

    setupGameEventListeners() {
        // Écouter les événements du jeu pour donner de l'XP automatiquement
        document.addEventListener('imperiumCombatVictory', (e) => {
            this.onCombatVictory(e.detail.enemyLevel);
        });

        document.addEventListener('imperiumBuildingConstructed', (e) => {
            this.onBuildingConstructed(e.detail.cost);
        });

        document.addEventListener('imperiumQuestCompleted', (e) => {
            this.onQuestCompleted(e.detail.difficulty);
        });
    }
}

// Styles CSS pour le Battle Pass
const battlePassStyles = `
<style>
.battle-pass-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.9);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
}

.battle-pass-container {
    background: linear-gradient(135deg, #2c1810, #1a0f08);
    border: 3px solid #b45309;
    border-radius: 20px;
    width: 90vw;
    height: 80vh;
    overflow: hidden;
    color: #e8dcc6;
}

.battle-pass-header {
    padding: 20px;
    background: linear-gradient(135deg, #b45309, #d4651f);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
}

.battle-pass-header h2 {
    margin: 0;
    font-size: 1.8em;
}

.battle-pass-close {
    background: none;
    border: none;
    font-size: 1.5em;
    color: white;
    cursor: pointer;
}

.battle-pass-progress {
    padding: 20px;
    background: rgba(180, 83, 9, 0.1);
}

.progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-weight: bold;
}

.progress-bar {
    height: 20px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #b45309, #d4651f);
    transition: width 0.5s ease;
}

.battle-pass-tiers {
    padding: 20px;
    overflow-y: auto;
    height: calc(100% - 200px);
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
}

.tier {
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid #8b4513;
    border-radius: 15px;
    padding: 15px;
    text-align: center;
    transition: all 0.3s;
}

.tier.unlocked {
    border-color: #d4651f;
    background: rgba(180, 83, 9, 0.1);
}

.tier.special {
    border-color: #ffa500;
    background: linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(180, 83, 9, 0.1));
    box-shadow: 0 0 20px rgba(255, 165, 0, 0.3);
}

.tier-level {
    font-size: 1.5em;
    font-weight: bold;
    color: #d4651f;
    margin-bottom: 10px;
}

.tier-reward {
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    padding: 10px;
    margin: 5px 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.tier-reward.free {
    border-left: 4px solid #4ade80;
}

.tier-reward.premium {
    border-left: 4px solid #fbbf24;
}

.tier-reward.special {
    border-left: 4px solid #f59e0b;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(0, 0, 0, 0.5));
}

.tier-reward.claimed {
    opacity: 0.6;
    position: relative;
}

.tier-reward.claimed::after {
    content: '✅';
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
}

.tier-reward.locked {
    opacity: 0.3;
}

.tier-reward.empty {
    background: transparent;
    border: 2px dashed #4b5563;
}

.reward-icon {
    font-size: 2em;
}

.reward-info {
    flex: 1;
    text-align: left;
}

.reward-amount {
    display: block;
    font-weight: bold;
    color: #d4651f;
}

.reward-type {
    display: block;
    font-size: 0.9em;
    opacity: 0.8;
}

.reward-name {
    display: block;
    font-weight: bold;
}

.reward-rarity {
    display: block;
    font-size: 0.8em;
    text-transform: uppercase;
}

.reward-rarity.common { color: #808080; }
.reward-rarity.rare { color: #0070ff; }
.reward-rarity.epic { color: #8f48db; }
.reward-rarity.legendary { color: #ffa500; }
.reward-rarity.mythic { color: #ff6b35; }

.battle-pass-levelup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #b45309, #d4651f);
    color: white;
    padding: 30px;
    border-radius: 20px;
    z-index: 10001;
    box-shadow: 0 0 50px rgba(180, 83, 9, 0.8);
    animation: levelupAppear 3s ease;
}

@keyframes levelupAppear {
    0% { 
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
    }
    20% { 
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 1;
    }
    80% { 
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }
    100% { 
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
    }
}

.levelup-content {
    display: flex;
    align-items: center;
    gap: 20px;
}

.levelup-icon {
    font-size: 3em;
}

.levelup-text h3 {
    margin: 0;
    font-size: 1.5em;
}

.battle-pass-reward {
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #2c1810, #1a0f08);
    color: #e8dcc6;
    padding: 20px;
    border-radius: 15px;
    border: 2px solid #b45309;
    z-index: 10001;
    animation: slideInReward 4s ease;
    max-width: 300px;
}

@keyframes slideInReward {
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

.battle-pass-reward.premium {
    border-color: #fbbf24;
}

.battle-pass-reward.special {
    border-color: #f59e0b;
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
}

.reward-content {
    display: flex;
    align-items: center;
    gap: 15px;
}

.reward-content .reward-icon {
    font-size: 2.5em;
}
</style>
`;

// Injection des styles
document.head.insertAdjacentHTML('beforeend', battlePassStyles);

// Instance globale
window.battlePassSystem = new BattlePassSystem();

// Auto-start à l'initialisation du jeu
document.addEventListener('DOMContentLoaded', () => {
    if (window.battlePassSystem) {
        window.battlePassSystem.integratWithGame();
        console.log('🎖️ Battle Pass System initialized!');
    }
});