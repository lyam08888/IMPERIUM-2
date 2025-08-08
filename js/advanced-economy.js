// advanced-economy.js - Système économique avancé avec marchés dynamiques
// Crée une économie vivante avec des fluctuations de prix et des opportunités de trading

class AdvancedEconomySystem {
    constructor() {
        this.markets = MARKET_DEFINITIONS;
        this.tradeRoutes = [];
        this.marketPrices = {};
        this.priceHistory = {};
        this.marketNews = [];
        this.lastMarketUpdate = 0;
        this.tradingSkill = 0;
        this.reputation = {
            merchants: 50,
            nobles: 50,
            plebs: 50
        };
        
        this.loadEconomyData();
        this.initializePrices();
    }

    loadEconomyData() {
        const saved = localStorage.getItem('imperium_economy');
        if (saved) {
            const data = JSON.parse(saved);
            this.marketPrices = data.marketPrices || {};
            this.priceHistory = data.priceHistory || {};
            this.lastMarketUpdate = data.lastMarketUpdate || 0;
            this.tradingSkill = data.tradingSkill || 0;
            this.reputation = data.reputation || { merchants: 50, nobles: 50, plebs: 50 };
            this.tradeRoutes = data.tradeRoutes || [];
        }
    }

    initializePrices() {
        // Initialiser les prix si pas déjà fait
        Object.keys(this.markets).forEach(marketId => {
            if (!this.marketPrices[marketId]) {
                this.marketPrices[marketId] = {};
                this.priceHistory[marketId] = {};
                
                Object.keys(this.markets[marketId].resources).forEach(resource => {
                    const basePrice = this.markets[marketId].resources[resource].basePrice;
                    this.marketPrices[marketId][resource] = this.generateInitialPrice(basePrice);
                    this.priceHistory[marketId][resource] = [this.marketPrices[marketId][resource]];
                });
            }
        });
    }

    generateInitialPrice(basePrice) {
        // Prix initial avec un peu de variation aléatoire
        return Math.round(basePrice * (0.8 + Math.random() * 0.4));
    }

    updateMarketPrices() {
        const now = Date.now();
        const hoursSinceUpdate = (now - this.lastMarketUpdate) / (1000 * 60 * 60);
        
        if (hoursSinceUpdate < 1 && this.lastMarketUpdate > 0) return; // Mettre à jour toutes les heures seulement
        
        Object.keys(this.markets).forEach(marketId => {
            Object.keys(this.markets[marketId].resources).forEach(resource => {
                const newPrice = this.calculateNewPrice(marketId, resource);
                this.marketPrices[marketId][resource] = newPrice;
                
                // Ajouter à l'historique
                if (!this.priceHistory[marketId][resource]) {
                    this.priceHistory[marketId][resource] = [];
                }
                this.priceHistory[marketId][resource].push(newPrice);
                
                // Garder seulement les 24 dernières heures
                if (this.priceHistory[marketId][resource].length > 24) {
                    this.priceHistory[marketId][resource].shift();
                }
            });
        });
        
        // Générer des nouvelles du marché
        this.generateMarketNews();
        
        this.lastMarketUpdate = now;
        this.save();
    }

    calculateNewPrice(marketId, resource) {
        const market = this.markets[marketId];
        const resourceData = market.resources[resource];
        const currentPrice = this.marketPrices[marketId][resource];
        
        // Facteurs d'influence du prix
        let priceMultiplier = 1.0;
        
        // 1. Tendance naturelle du marché
        const trend = resourceData.trend || 'stable';
        switch (trend) {
            case 'bullish':
                priceMultiplier += 0.02 + Math.random() * 0.03;
                break;
            case 'bearish':
                priceMultiplier -= 0.02 + Math.random() * 0.03;
                break;
            case 'volatile':
                priceMultiplier += (Math.random() - 0.5) * 0.1;
                break;
            default: // stable
                priceMultiplier += (Math.random() - 0.5) * 0.02;
        }
        
        // 2. Événements aléatoires
        if (Math.random() < 0.1) { // 10% de chance d'événement
            const eventMultiplier = 0.8 + Math.random() * 0.4; // Entre 0.8 et 1.2
            priceMultiplier *= eventMultiplier;
        }
        
        // 3. Influence de la réputation
        if (resource === 'gold' && this.reputation.merchants > 70) {
            priceMultiplier *= 0.95; // Meilleurs prix
        }
        
        // 4. Retour vers la moyenne (éviter les prix extrêmes)
        const basePrice = resourceData.basePrice;
        if (currentPrice > basePrice * 2) {
            priceMultiplier *= 0.9; // Correction à la baisse
        } else if (currentPrice < basePrice * 0.5) {
            priceMultiplier *= 1.1; // Correction à la hausse
        }
        
        const newPrice = Math.max(1, Math.round(currentPrice * priceMultiplier));
        
        // Éviter les changements trop drastiques
        const maxChange = currentPrice * 0.2;
        if (Math.abs(newPrice - currentPrice) > maxChange) {
            return currentPrice + (newPrice > currentPrice ? maxChange : -maxChange);
        }
        
        return newPrice;
    }

    generateMarketNews() {
        // Générer des nouvelles basées sur les changements de prix
        this.marketNews = [];
        
        Object.keys(this.markets).forEach(marketId => {
            const marketName = this.markets[marketId].name;
            
            Object.keys(this.markets[marketId].resources).forEach(resource => {
                const history = this.priceHistory[marketId][resource];
                if (history.length < 2) return;
                
                const oldPrice = history[history.length - 2];
                const newPrice = history[history.length - 1];
                const change = ((newPrice - oldPrice) / oldPrice) * 100;
                
                if (Math.abs(change) > 10) { // Changement significatif
                    const newsItem = {
                        market: marketName,
                        resource: resource,
                        change: Math.round(change),
                        price: newPrice,
                        timestamp: Date.now()
                    };
                    
                    if (change > 0) {
                        newsItem.headline = `📈 ${resource.toUpperCase()} en hausse à ${marketName}`;
                        newsItem.description = `Le prix du ${resource} a augmenté de ${newsItem.change}%`;
                    } else {
                        newsItem.headline = `📉 ${resource.toUpperCase()} en baisse à ${marketName}`;
                        newsItem.description = `Le prix du ${resource} a chuté de ${Math.abs(newsItem.change)}%`;
                    }
                    
                    this.marketNews.push(newsItem);
                }
            });
        });
        
        // Garder seulement les 10 dernières nouvelles
        this.marketNews = this.marketNews.slice(-10);
    }

    canTrade(marketId, resource, type, quantity, gameState) {
        const market = this.markets[marketId];
        if (!market || !market.resources[resource]) {
            return { success: false, message: "Marché ou ressource non trouvé." };
        }
        
        const price = this.marketPrices[marketId][resource];
        const totalCost = price * quantity;
        
        if (type === 'buy') {
            if (gameState.resources.gold < totalCost) {
                return { success: false, message: "Or insuffisant." };
            }
            
            const storageLimit = gameState.storage[resource] || Infinity;
            const currentAmount = gameState.resources[resource] || 0;
            
            if (currentAmount + quantity > storageLimit) {
                return { success: false, message: "Capacité de stockage insuffisante." };
            }
        } else { // sell
            const currentAmount = gameState.resources[resource] || 0;
            if (currentAmount < quantity) {
                return { success: false, message: `${resource} insuffisant.` };
            }
        }
        
        return { success: true };
    }

    executeTrade(marketId, resource, type, quantity, gameState) {
        const canTradeResult = this.canTrade(marketId, resource, type, quantity, gameState);
        if (!canTradeResult.success) {
            return canTradeResult;
        }
        
        const price = this.marketPrices[marketId][resource];
        const totalValue = price * quantity;
        
        // Ajuster les prix en fonction du trading skill
        const skillModifier = 1 + (this.tradingSkill * 0.001); // 0.1% par niveau de skill
        const adjustedValue = type === 'sell' ? 
            Math.round(totalValue * skillModifier) : 
            Math.round(totalValue / skillModifier);
        
        if (type === 'buy') {
            gameState.resources.gold -= adjustedValue;
            gameState.resources[resource] = (gameState.resources[resource] || 0) + quantity;
        } else {
            gameState.resources[resource] -= quantity;
            gameState.resources.gold = (gameState.resources.gold || 0) + adjustedValue;
        }
        
        // Augmenter skill de trading
        this.tradingSkill += Math.max(1, Math.floor(quantity / 10));
        
        // Ajuster réputation
        this.adjustReputation('merchants', 1);
        
        // Influence mineure sur le prix (gros trades affectent le marché)
        if (quantity > 1000) {
            const influence = type === 'buy' ? 1.01 : 0.99;
            this.marketPrices[marketId][resource] = Math.round(this.marketPrices[marketId][resource] * influence);
        }
        
        this.save();
        
        return {
            success: true,
            message: `${type === 'buy' ? 'Acheté' : 'Vendu'} ${quantity} ${resource} pour ${adjustedValue} or.`,
            totalValue: adjustedValue,
            newPrice: this.marketPrices[marketId][resource]
        };
    }

    createTradeRoute(fromMarket, toMarket, resource, gameState) {
        // Créer une route commerciale automatique
        const buyPrice = this.marketPrices[fromMarket][resource];
        const sellPrice = this.marketPrices[toMarket][resource];
        
        if (sellPrice <= buyPrice) {
            return { success: false, message: "Route commerciale non profitable." };
        }
        
        const profit = sellPrice - buyPrice;
        const profitMargin = (profit / buyPrice) * 100;
        
        if (profitMargin < 10) {
            return { success: false, message: "Marge bénéficiaire trop faible (minimum 10%)." };
        }
        
        // Coût de création de la route
        const setupCost = 5000 + (this.tradeRoutes.length * 2000);
        
        if (gameState.resources.gold < setupCost) {
            return { success: false, message: "Or insuffisant pour créer la route." };
        }
        
        gameState.resources.gold -= setupCost;
        
        const tradeRoute = {
            id: `route_${Date.now()}`,
            fromMarket,
            toMarket,
            resource,
            createdAt: Date.now(),
            isActive: true,
            totalProfit: 0,
            tradesExecuted: 0
        };
        
        this.tradeRoutes.push(tradeRoute);
        this.save();
        
        return { success: true, message: "Route commerciale créée!", tradeRoute };
    }

    processTradeRoutes(gameState) {
        // Exécuter automatiquement les routes commerciales
        this.tradeRoutes.forEach(route => {
            if (!route.isActive) return;
            
            const buyPrice = this.marketPrices[route.fromMarket][route.resource];
            const sellPrice = this.marketPrices[route.toMarket][route.resource];
            
            if (sellPrice > buyPrice * 1.1) { // Minimum 10% de profit
                const quantity = Math.min(100, Math.floor(gameState.resources.gold / buyPrice));
                
                if (quantity > 0) {
                    const buyResult = this.executeTrade(route.fromMarket, route.resource, 'buy', quantity, gameState);
                    if (buyResult.success) {
                        const sellResult = this.executeTrade(route.toMarket, route.resource, 'sell', quantity, gameState);
                        if (sellResult.success) {
                            const profit = sellResult.totalValue - buyResult.totalValue;
                            route.totalProfit += profit;
                            route.tradesExecuted++;
                        }
                    }
                }
            }
        });
    }

    adjustReputation(faction, amount) {
        this.reputation[faction] = Math.max(0, Math.min(100, this.reputation[faction] + amount));
    }

    getMarketData(marketId) {
        const market = this.markets[marketId];
        if (!market) return null;
        
        const data = {
            name: market.name,
            location: market.location,
            resources: {}
        };
        
        Object.keys(market.resources).forEach(resource => {
            const price = this.marketPrices[marketId][resource];
            const basePrice = market.resources[resource].basePrice;
            const history = this.priceHistory[marketId][resource] || [];
            
            data.resources[resource] = {
                currentPrice: price,
                basePrice: basePrice,
                change: history.length > 1 ? 
                    ((price - history[history.length - 2]) / history[history.length - 2] * 100).toFixed(1) : 0,
                trend: this.calculateTrend(history),
                history: history.slice(-24) // Dernières 24 heures
            };
        });
        
        return data;
    }

    calculateTrend(history) {
        if (history.length < 3) return 'stable';
        
        const recent = history.slice(-3);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const first = recent[0];
        
        const change = ((avg - first) / first) * 100;
        
        if (change > 5) return 'bullish';
        if (change < -5) return 'bearish';
        return 'stable';
    }

    getAllMarkets() {
        return Object.keys(this.markets).map(id => ({
            id,
            ...this.getMarketData(id)
        }));
    }

    getMarketNews() {
        return this.marketNews.slice(-10);
    }

    getTradingStats() {
        return {
            skill: this.tradingSkill,
            reputation: this.reputation,
            activeRoutes: this.tradeRoutes.filter(r => r.isActive).length,
            totalProfit: this.tradeRoutes.reduce((sum, route) => sum + route.totalProfit, 0),
            totalTrades: this.tradeRoutes.reduce((sum, route) => sum + route.tradesExecuted, 0)
        };
    }

    save() {
        const data = {
            marketPrices: this.marketPrices,
            priceHistory: this.priceHistory,
            lastMarketUpdate: this.lastMarketUpdate,
            tradingSkill: this.tradingSkill,
            reputation: this.reputation,
            tradeRoutes: this.tradeRoutes
        };
        localStorage.setItem('imperium_economy', JSON.stringify(data));
    }
}

// Définitions des marchés
const MARKET_DEFINITIONS = {
    rome_forum: {
        name: "Forum de Rome",
        location: "Rome",
        resources: {
            gold: { basePrice: 1, trend: 'stable' },
            food: { basePrice: 2, trend: 'stable' },
            marble: { basePrice: 10, trend: 'bullish' },
            wood: { basePrice: 5, trend: 'stable' },
            stone: { basePrice: 8, trend: 'bearish' }
        }
    },
    
    alexandria_port: {
        name: "Port d'Alexandrie",
        location: "Égypte",
        resources: {
            gold: { basePrice: 1, trend: 'volatile' },
            food: { basePrice: 1, trend: 'bearish' }, // Abondant en Égypte
            marble: { basePrice: 15, trend: 'bullish' }, // Rare
            wood: { basePrice: 12, trend: 'bullish' }, // Très rare
            spices: { basePrice: 50, trend: 'volatile' }
        }
    },
    
    athens_agora: {
        name: "Agora d'Athènes",
        location: "Grèce",
        resources: {
            gold: { basePrice: 1, trend: 'stable' },
            food: { basePrice: 3, trend: 'volatile' },
            marble: { basePrice: 8, trend: 'stable' }, // Abondant
            wood: { basePrice: 7, trend: 'stable' },
            pottery: { basePrice: 25, trend: 'stable' }
        }
    },
    
    carthage_market: {
        name: "Marché de Carthage",
        location: "Afrique du Nord",
        resources: {
            gold: { basePrice: 1, trend: 'bullish' },
            food: { basePrice: 4, trend: 'bearish' },
            marble: { basePrice: 20, trend: 'volatile' },
            ivory: { basePrice: 100, trend: 'bullish' },
            exotic_goods: { basePrice: 75, trend: 'volatile' }
        }
    }
};

// Instance globale
let economySystem;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    economySystem = new AdvancedEconomySystem();
});

// Fonctions utilitaires
function updateMarketPrices() {
    if (economySystem) {
        economySystem.updateMarketPrices();
    }
}

function executeTrade(marketId, resource, type, quantity) {
    if (economySystem) {
        return economySystem.executeTrade(marketId, resource, type, quantity, gameState);
    }
    return { success: false, message: "Economy system not initialized." };
}

function getAllMarkets() {
    return economySystem ? economySystem.getAllMarkets() : [];
}

function getMarketNews() {
    return economySystem ? economySystem.getMarketNews() : [];
}