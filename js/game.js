// ===============================================================
// IMPERIUM V19 - GAME.JS
// ===============================================================
// Ce fichier est le cerveau du jeu. Il contient :
// 1. Les définitions de toutes les entités du jeu (bâtiments, unités, etc.).
// 2. La gestion de l'état global du jeu (gameState).
// 3. Les fonctions pour sauvegarder et charger l'état du jeu.
// 4. La logique de jeu principale (production, mises à jour, etc.).
// ===============================================================

// ---------------------------------------------------------------
// DÉFINITIONS GLOBALES DU JEU
// ---------------------------------------------------------------

const BUILDING_DEFINITIONS = {
    'forum': { name: 'Forum Romain', icon: '🏛️', description: 'Le coeur politique et social de votre cité.',
        baseCost: [{ res: 'gold', amount: 100 }, { res: 'marble', amount: 50 }], upgradeCostMultiplier: 1.8,
        production: { happiness: 2 }, baseBuildTime: 30, xpGain: 50, isInteractive: true },
    'market': { name: 'Marché', icon: '🏪', description: 'Permet d\'échanger des ressources. Améliorez-le pour de meilleures offres.',
        baseCost: [{ res: 'gold', amount: 80 }, { res: 'food', amount: 20 }], upgradeCostMultiplier: 1.6,
        production: { gold: 20 }, baseBuildTime: 20, xpGain: 30, isInteractive: true },
    'farm': { name: 'Ferme', icon: '🧑‍🌾', description: 'Produit la nourriture pour votre peuple.',
        baseCost: [{ res: 'gold', amount: 60 }], upgradeCostMultiplier: 1.5,
        production: { food: 25 }, baseBuildTime: 15, xpGain: 25 },
    'quarry': { name: 'Carrière', icon: '⛏️', description: 'Extrait le marbre nécessaire aux grandes constructions.',
        baseCost: [{ res: 'gold', amount: 120 }, { res: 'food', amount: 50 }], upgradeCostMultiplier: 1.6,
        production: { marble: 15 }, baseBuildTime: 45, xpGain: 60 },
    'warehouse': { name: 'Entrepôt', icon: '📦', description: 'Augmente le stockage d\'or et de marbre.',
        baseCost: [{ res: 'food', amount: 100 }], upgradeCostMultiplier: 2.0,
        storage: { gold: 1000, marble: 500 }, baseBuildTime: 40, xpGain: 40 },
    'granary': { name: 'Grenier', icon: '🌾', description: 'Augmente le stockage de nourriture.',
        baseCost: [{ res: 'gold', amount: 80 }], upgradeCostMultiplier: 1.8,
        storage: { food: 1500 }, baseBuildTime: 35, xpGain: 35 },
    'insula': { name: 'Insula', icon: '🏘️', description: 'Fournit des logements pour votre population.',
        baseCost: [{ res: 'food', amount: 50 }, { res: 'marble', amount: 20 }], upgradeCostMultiplier: 1.7,
        housing: 50, baseBuildTime: 25, xpGain: 20 },
    'pantheon': { name: 'Panthéon', icon: '🏛️✨', description: 'Honorez les dieux et recevez leurs bénédictions.',
        baseCost: [{ res: 'gold', amount: 1000 }, { res: 'marble', amount: 500 }], upgradeCostMultiplier: 3.0,
        baseBuildTime: 600, xpGain: 500, requires: { type: 'forum', level: 5 }, isInteractive: true },
};

const UNITS_CONFIG = {
    legionnaire: { name: 'Légionnaire', icon: '🛡️', attack: 50, defense: 70, hp: 100, type: 'infantry', priority: 'cavalry', ability: 'testudo' },
    archer: { name: 'Archer', icon: '🏹', attack: 60, defense: 40, hp: 80, type: 'ranged', priority: 'infantry', ability: 'volley' },
    cavalier: { name: 'Cavalier', icon: '🐎', attack: 80, defense: 60, hp: 120, type: 'cavalry', priority: 'ranged', ability: 'charge' },
    praetorian: { name: 'Prétorien', icon: '🦅', attack: 90, defense: 90, hp: 150, type: 'infantry', priority: 'infantry', ability: 'elite' },
    battering_ram: { name: 'Bélier', icon: '💣', attack: 200, defense: 100, hp: 300, type: 'siege', priority: 'wall', ability: 'ram' },
    ballista: { name: 'Baliste', icon: '🎯', attack: 150, defense: 30, hp: 120, type: 'siege', priority: 'infantry', ability: 'pierce' }
};

const HEROES_CONFIG = {
    none: { name: 'Aucun Héros', bonus: {} },
    cesar: { name: 'Jules César', bonus: { type: 'attack', unitType: 'infantry', value: 0.15 }, ability: { type: 'morale_boost', value: 30, used: false } },
    vercingetorix: { name: 'Vercingétorix', bonus: { type: 'defense', unitType: 'all', value: 0.10 } },
    hannibal: { name: 'Hannibal Barca', bonus: { type: 'morale_debuff', value: 0.15 } },
    scipio: { name: 'Scipion l\'Africain', bonus: { type: 'scout_and_breach', scout_bonus: 0.25, breach_attack: 0.20 } },
    fabius: { name: 'Fabius Maximus', bonus: { type: 'defensive_stance', value: 0.30 } }
};

const TERRAINS_CONFIG = {
    plains: { name: 'Plaines' },
    forest: { name: 'Forêt' },
    mountains: { name: 'Montagnes' }
};

const FORMATIONS_CONFIG = {
    balanced: { name: 'Équilibrée' },
    offensive: { name: 'Offensive' },
    defensive: { name: 'Défensive' }
};

const QUESTS = [
    { id: 0, description: "Construisez votre première Ferme.", isComplete: (gs) => gs.city.buildings.some(b => b.type === 'farm'), reward: { xp: 50, resources: [{res: 'gold', amount: 100}] } },
    { id: 1, description: "Atteignez le niveau 2.", isComplete: (gs) => gs.player.level >= 2, reward: { xp: 0, resources: [{res: 'marble', amount: 50}] } },
    { id: 2, description: "Construisez une Insula pour votre peuple.", isComplete: (gs) => gs.city.buildings.some(b => b.type === 'insula'), reward: { xp: 100, resources: [{res: 'food', amount: 200}] } },
    { id: 3, description: "Construisez un Marché pour commercer.", isComplete: (gs) => gs.city.buildings.some(b => b.type === 'market'), reward: { xp: 150, resources: [{res: 'gold', amount: 300}] } },
];




// ---------------------------------------------------------------
// ÉTAT GLOBAL DU JEU (GAMESTATE)
// ---------------------------------------------------------------

function getDefaultGameState() {
    return {
        // --- Données du joueur ---
        player: {
            name: 'Marcus Aurelius',
            title: 'Consul',
            level: 1,
            xp: 0,
            avatar: 'M',
        },

        // --- Ressources et Stockage (combinés de city et world) ---
        resources: {
            gold: 500,
            food: 200,
            marble: 100,
            divineFavor: 0,
            wood: 3000,      // from world
            stone: 2500,     // from world
            spies: 10,       // from world
        },
        storage: {
            gold: 1000,
            food: 1500,
            marble: 500,
            divineFavor: 100,
            wood: 10000,
            stone: 10000,
            spies: 50,
        },

        // --- Unités et Armées ---
        units: {
            legionnaire: { count: 100, xp: 0 },
            archer: { count: 80, xp: 0 },
            cavalier: { count: 50, xp: 0 },
            praetorian: { count: 10, xp: 0 },
            battering_ram: { count: 5, xp: 0 },
            ballista: { count: 5, xp: 0 }
        },
        legions: [], // from world

        // --- City View ---
        city: {
            stats: {
                population: 50,
                populationCapacity: 50,
                happiness: 75,
                happinessModifier: 1.0
            },
            production: {
                gold: 5,
                food: 10,
                marble: 2,
                happiness: 0,
                divineFavor: 0
            },
            buildings: Array.from({ length: 15 }, (_, i) => ({ slotId: i, type: null, level: 0 })),
            constructionQueue: [],
            activeQuestId: 0,
        },

        // --- World View ---
        world: {
            turn: 1,
            territories: [

                { id: 'roma', name: 'Rome', x: 45, y: 40, status: 'capital', flag: '🏛️', income: {'gold': 200, 'food': 5, 'spies': 1}, garrison: 2000, loyalty: 100, governorId: null },

                { id: 'carthage', name: 'Carthage', x: 35, y: 75, status: 'enemy', flag: '🐘', strength: 12000, personality: 'aggressive' },
                { id: 'egypt', name: 'Égypte', x: 75, y: 80, status: 'neutral', flag: '🐪', relations: 10, trait: { name: 'Grenier du monde', effect: {'food': 2} } },
                { id: 'syracuse', name: 'Syracuse', x: 55, y: 65, status: 'neutral', flag: '🏝️', relations: 0 },
                { id: 'athens', name: 'Athènes', x: 65, y: 50, status: 'neutral', flag: '🏺', relations: 20 },
                { id: 'byzantium', name: 'Byzance', x: 75, y: 40, status: 'neutral', flag: '🌊', relations: 0 },
            ],
             missions: [
                { id: 'raise_legion', title: 'Levez une Légion', description: 'Recruter votre première légion à Rome.', isComplete: (gs) => gs.legions.length > 0, reward: {'gold': 1000} },
            ],
        },

        // --- Meta Data ---
        lastUpdate: Date.now()
    };
}

let gameState = getDefaultGameState();

// ---------------------------------------------------------------
// SAUVEGARDE ET CHARGEMENT
// ---------------------------------------------------------------
const SAVE_KEY = 'imperium_v19_gamestate';

function saveGameState() {
    try {
        gameState.lastUpdate = Date.now();
        const stateString = JSON.stringify(gameState);
        localStorage.setItem(SAVE_KEY, stateString);
        console.log("Game state saved.");
    } catch (error) {
        console.error("Error saving game state:", error);
    }
}

function loadGameState() {
    try {
        const savedState = localStorage.getItem(SAVE_KEY);
        if (savedState) {
            const loaded = JSON.parse(savedState);
            // Fusionner l'état chargé avec l'état par défaut pour assurer la compatibilité
            gameState = deepMerge(getDefaultGameState(), loaded);
            console.log("Game state loaded.");
            // Traiter le progrès hors ligne si nécessaire
            processOfflineProgress();
        } else {
            console.log("No saved game found, starting new game.");
            gameState = getDefaultGameState();
        }
    } catch (error) {
        console.error("Error loading game state:", error);
        gameState = getDefaultGameState();
    }
}

// ---------------------------------------------------------------
// LOGIQUE DE JEU CENTRALE
// ---------------------------------------------------------------

function getXpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

function addXp(amount) {
    if (!amount || amount === 0) return;
    gameState.player.xp += amount;
    const xpForNextLevel = getXpForLevel(gameState.player.level);
    if (gameState.player.xp >= xpForNextLevel) {
        gameState.player.xp -= xpForNextLevel;
        gameState.player.level++;
        // La notification sera gérée par l'UI de la page active
    }
}

function processOfflineProgress() {
    const now = Date.now();
    const offlineTime = (now - (gameState.lastUpdate || now)) / 1000;

    if (offlineTime <= 0) return;

    // Logique de la file de construction
    const completedConstructions = [];
    gameState.city.constructionQueue.forEach(item => {
        if (item.endTime <= now) {
            completeConstruction(item); // Assume this function exists and updates state correctly
            completedConstructions.push(item);
        }
    });
    gameState.city.constructionQueue = gameState.city.constructionQueue.filter(item => !completedConstructions.includes(item));

    // Logique de production de ressources
    recalculateCityStats(); // Recalculer les taux de production
    for (const res in gameState.city.production) {
        if (gameState.resources[res] !== undefined) {
            const gain = (gameState.city.production[res] / 3600) * offlineTime;
            gameState.resources[res] = Math.min(gameState.resources[res] + gain, gameState.storage[res] || Infinity);
        }
    }
    console.log(`Processed ${Math.floor(offlineTime)} seconds of offline progress.`);
}


function recalculateCityStats() {
    const baseProduction = { gold: 5, food: 10, marble: 2, happiness: 0, divineFavor: 0 };
    const baseStorage = { gold: 1000, food: 1500, marble: 500, divineFavor: 100, wood: 10000, stone: 10000, spies: 50 };
    let populationCapacity = 0;

    gameState.city.buildings.forEach(building => {
        if (building.type && building.level > 0) {
            const def = BUILDING_DEFINITIONS[building.type];
            if (def.production) {
                for (const res in def.production) { baseProduction[res] += def.production[res] * building.level; }
            }
            if (def.storage) {
                for (const res in def.storage) { baseStorage[res] += def.storage[res] * building.level; }
            }
            if (def.housing) {
                populationCapacity += def.housing * building.level;
            }
        }
    });

    baseProduction.food -= Math.floor(gameState.city.stats.population / 10);

    gameState.city.production = baseProduction;
    gameState.storage = { ...gameState.storage, ...baseStorage };
    gameState.city.stats.populationCapacity = populationCapacity;

    if (gameState.city.stats.happiness > 90) {
        gameState.city.stats.happinessModifier = 1.1;
    } else if (gameState.city.stats.happiness < 30) {
        gameState.city.stats.happinessModifier = 0.75;
    } else {
        gameState.city.stats.happinessModifier = 1.0;
    }
}


// ---------------------------------------------------------------
// UTILITAIRES
// ---------------------------------------------------------------

function deepMerge(target, source) {
    const isObject = (obj) => obj && typeof obj === 'object';

    if (!isObject(target) || !isObject(source)) {
        return source;
    }

    Object.keys(source).forEach(key => {
        const targetValue = target[key];
        const sourceValue = source[key];

        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            // Pour les tableaux, on peut choisir de remplacer ou de fusionner.
            // Remplacer semble plus simple pour l'état du jeu.
            target[key] = sourceValue;
        } else if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = deepMerge(Object.assign({}, targetValue), sourceValue);
        } else {
            target[key] = sourceValue;
        }
    });

    return target;
}

// Initial load when the script is executed
loadGameState();
