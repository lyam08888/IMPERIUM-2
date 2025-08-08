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
    'barracks': { name: 'Caserne', icon: '⚔️', description: 'Entraînez des unités pour vos légions. Améliorez pour débloquer des unités plus fortes.',
        baseCost: [{ res: 'gold', amount: 200 }, { res: 'food', amount: 150 }], upgradeCostMultiplier: 1.8,
        baseBuildTime: 120, xpGain: 80, isInteractive: true },
    'shipyard': { name: 'Chantier Naval', icon: '⚓', description: 'Construisez et entretenez votre flotte de guerre.',
        baseCost: [{ res: 'gold', amount: 300 }, { res: 'wood', amount: 250 }], upgradeCostMultiplier: 1.9,
        baseBuildTime: 180, xpGain: 100, isInteractive: true, requires: { type: 'market', level: 3 } },
};

const UNITS_CONFIG = {
    // --- Unités Terrestres ---
    legionnaire: { name: 'Légionnaire', icon: '🛡️', attack: 50, defense: 70, hp: 100, type: 'infantry', priority: 'cavalry', ability: 'testudo', domain: 'land',
        cost: [{ res: 'gold', amount: 50 }, { res: 'food', amount: 20 }], trainTime: 60, requires: { building: 'barracks', level: 1 } },
    archer: { name: 'Archer', icon: '🏹', attack: 60, defense: 40, hp: 80, type: 'ranged', priority: 'infantry', ability: 'volley', domain: 'land',
        cost: [{ res: 'gold', amount: 80 }, { res: 'food', amount: 10 }], trainTime: 90, requires: { building: 'barracks', level: 1 } },
    cavalier: { name: 'Cavalier', icon: '🐎', attack: 80, defense: 60, hp: 120, type: 'cavalry', priority: 'ranged', ability: 'charge', domain: 'land',
        cost: [{ res: 'gold', amount: 120 }, { res: 'food', amount: 40 }], trainTime: 180, requires: { building: 'barracks', level: 2 } },
    praetorian: { name: 'Prétorien', icon: '🦅', attack: 90, defense: 90, hp: 150, type: 'infantry', priority: 'infantry', ability: 'elite', domain: 'land',
        cost: [{ res: 'gold', amount: 200 }, { res: 'marble', amount: 50 }], trainTime: 300, requires: { building: 'barracks', level: 3 } },
    battering_ram: { name: 'Bélier', icon: '💣', attack: 200, defense: 100, hp: 300, type: 'siege', priority: 'wall', ability: 'ram', domain: 'land',
        cost: [{ res: 'gold', amount: 300 }, { res: 'marble', amount: 100 }], trainTime: 600, requires: { building: 'barracks', level: 5 } },
    ballista: { name: 'Baliste', icon: '🎯', attack: 150, defense: 30, hp: 120, type: 'siege', priority: 'infantry', ability: 'pierce', domain: 'land',
        cost: [{ res: 'gold', amount: 250 }, { res: 'marble', amount: 150 }], trainTime: 450, requires: { building: 'barracks', level: 5 } },

    // --- Unités Maritimes ---
    trireme: { name: 'Trirème', icon: '🛶', attack: 60, defense: 60, hp: 150, type: 'standard', priority: 'ballista_ship', ability: 'ram', domain: 'sea',
        cost: [{ res: 'gold', amount: 100 }, { res: 'wood', amount: 80 }], trainTime: 120, requires: { building: 'shipyard', level: 1 } },
    quinquereme: { name: 'Quinquérème', icon: '⛵', attack: 90, defense: 90, hp: 250, type: 'heavy', priority: 'trireme', ability: 'heavy_ram', domain: 'sea',
        cost: [{ res: 'gold', amount: 200 }, { res: 'wood', amount: 150 }], trainTime: 240, requires: { building: 'shipyard', level: 2 } },
    liburnian: { name: 'Liburne', icon: '🚤', attack: 40, defense: 30, hp: 100, type: 'light', priority: 'quinquereme', ability: 'flank', domain: 'sea',
        cost: [{ res: 'gold', amount: 70 }, { res: 'wood', amount: 50 }], trainTime: 80, requires: { building: 'shipyard', level: 1 } },
    corvus_ship: { name: 'Navire à Corvus', icon: '🦅', attack: 50, defense: 70, hp: 180, type: 'boarding', priority: 'standard', ability: 'board', domain: 'sea',
        cost: [{ res: 'gold', amount: 150 }, { res: 'wood', amount: 100 }], trainTime: 180, requires: { building: 'shipyard', level: 3 } },
    ballista_ship: { name: 'Navire à Baliste', icon: '🎯', attack: 120, defense: 20, hp: 100, type: 'ranged', priority: 'heavy', ability: 'long_shot', domain: 'sea',
        cost: [{ res: 'gold', amount: 220 }, { res: 'wood', amount: 180 }], trainTime: 300, requires: { building: 'shipyard', level: 4 } },
    fire_ship: { name: 'Brûlot', icon: '🔥', attack: 150, defense: 10, hp: 50, type: 'special', priority: 'heavy', ability: 'ignite', domain: 'sea',
        cost: [{ res: 'gold', amount: 180 }, { res: 'wood', amount: 40 }], trainTime: 150, requires: { building: 'shipyard', level: 2 } }
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

const TECHNOLOGY_DEFINITIONS = {
    civic: {
        name: 'Civique',
        technologies: {
            'agriculture': { name: 'Agriculture', description: 'Améliore la production des fermes de 10%.', cost: [{res: 'gold', amount: 500}], researchTime: 300,
                effects: [{ type: 'building_production_modifier', building: 'farm', value: 0.10 }], requirements: [] },
            'coinage': { name: 'Monnaie', description: 'Augmente la production d\'or des marchés de 15%.', cost: [{res: 'gold', amount: 1000}], researchTime: 600,
                effects: [{ type: 'building_production_modifier', building: 'market', value: 0.15 }], requirements: ['agriculture'] },
            'urbanism': { name: 'Urbanisme', description: 'Augmente la capacité des Insulae de 20%.', cost: [{res: 'marble', amount: 800}], researchTime: 900,
                effects: [{ type: 'building_housing_modifier', building: 'insula', value: 0.20 }], requirements: ['coinage'] },
        }
    },
    military: {
        name: 'Militaire',
        technologies: {
            'professional_army': { name: 'Armée Professionnelle', description: 'Légionnaires +10% attaque & défense.', cost: [{res: 'gold', amount: 800}, {res: 'food', amount: 1000}], researchTime: 1200,
                effects: [
                    { type: 'unit_attribute_modifier', unit: 'legionnaire', attribute: 'attack', value: 0.10 },
                    { type: 'unit_attribute_modifier', unit: 'legionnaire', attribute: 'defense', value: 0.10 }
                ], requirements: [] },
            'siege_engineering': { name: 'Génie de Siège', description: 'Unités de siège +25% d\'efficacité.', cost: [{res: 'gold', amount: 1500}, {res: 'marble', amount: 500}], researchTime: 1800,
                effects: [
                    { type: 'unit_attribute_modifier', unit: 'battering_ram', attribute: 'attack', value: 0.25 },
                    { type: 'unit_attribute_modifier', unit: 'ballista', attribute: 'attack', value: 0.25 }
                ], requirements: ['professional_army'] },
        }
    }
};

const GAME_CONFIG = {
    SUPPLY_CONSUMPTION_PER_1000_TROOPS: 20, // Food per turn
    BASE_SUPPLY_RANGE: 15, // Using percentage of map for distance
};

const EVENTS = [
    {
        title: "Bonne Récolte",
        description: "Les dieux ont souri à vos agriculteurs. La production de nourriture est augmentée de 50% pour ce tour.",
        effect: (gs) => {
            const foodBonus = gs.city.production.food * 0.5;
            gs.resources.food += foodBonus;
            return `Nourriture gagnée : +${Math.floor(foodBonus)}`;
        }
    },
    {
        title: "Découverte de Marbre",
        description: "Une nouvelle veine de marbre de haute qualité a été découverte dans vos carrières.",
        effect: (gs) => {
            gs.resources.marble += 250;
            return `Marbre gagné : +250`;
        }
    },
    {
        title: "Agitation Populaire",
        description: "Le peuple est mécontent des impôts. La loyauté dans tous vos territoires contrôlés baisse de 10.",
        effect: (gs) => {
            gs.world.territories.forEach(t => {
                if (t.status === 'controlled' || t.status === 'capital') {
                    t.loyalty = Math.max(0, t.loyalty - 10);
                }
            });
            return `La loyauté a diminué.`;
        }
    },
    {
        title: "Inspiration Divine",
        description: "Vos prêtres ont reçu une vision. Vous gagnez 20 Faveur Divine.",
        effect: (gs) => {
            gs.resources.divineFavor = Math.min(gs.storage.divineFavor, gs.resources.divineFavor + 20);
            return `Faveur Divine gagnée : +20`;
        }
    }
];

const TIPS = [
    "Construisez plus de fermes pour augmenter votre production de nourriture et nourrir une plus grande population.",
    "Le bonheur de votre peuple est crucial ! Un peuple heureux est plus productif.",
    "N'oubliez pas d'améliorer vos bâtiments pour augmenter leur efficacité.",
    "Les entrepôts et les greniers augmentent votre capacité de stockage. Indispensable pour les grands projets !",
    "Chaque bâtiment que vous construisez ou améliorez vous rapporte de l'expérience (XP) pour monter de niveau.",
    "Consultez l'arbre technologique pour débloquer de puissantes améliorations pour votre cité.",
    "Les quêtes sont un excellent moyen de gagner des ressources supplémentaires et de l'XP.",
    "Une population plus importante consomme plus de nourriture. Gardez un œil sur votre production !",
    "Le Forum est le cœur de votre cité, il augmente le bonheur de vos citoyens.",
    "La construction d'une caserne vous permettra de former des troupes pour défendre votre cité et conquérir de nouveaux territoires."
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
        units: { // This tracks XP and other persistent stats for all unit types
            legionnaire: { xp: 0 },
            archer: { xp: 0 },
            cavalier: { xp: 0 },
            praetorian: { xp: 0 },
            battering_ram: { xp: 0 },
            ballista: { xp: 0 },
            trireme: { xp: 0 },
            quinquereme: { xp: 0 },
            liburnian: { xp: 0 },
            corvus_ship: { xp: 0 },
            ballista_ship: { xp: 0 },
            fire_ship: { xp: 0 }
        },
        unitPool: { // Units available for legions
            legionnaire: 0, archer: 0, cavalier: 0, praetorian: 0, battering_ram: 0, ballista: 0
        },
        navalUnitPool: { // Units available for fleets

            trireme: 10,
            quinquereme: 2,
            liburnian: 5,
            corvus_ship: 2,
            ballista_ship: 3,
            fire_ship: 1

        },
        legions: [], // from world
        fleets: [], // from world

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
            researchQueue: [],
            trainingQueue: [],
        },

        // --- Scenario ---
        scenario: {
            currentChapterIndex: 0,
            currentQuestIndex: 0,
            completedQuests: [],
        },

        // --- Tech ---
        researchedTechs: [],

        // --- World View ---
        world: {
            turn: 1,
            territories: [
                { id: 'roma', name: 'Rome', x: 45, y: 40, status: 'capital', flag: '🏛️', income: {'gold': 200, 'food': 5, 'spies': 1}, garrison: { legionnaire: 100 }, loyalty: 100, governorId: null, supplyRange: GAME_CONFIG.BASE_SUPPLY_RANGE, neighbors: ['syracuse', 'athens'] },
                { id: 'carthage', name: 'Carthage', x: 35, y: 75, status: 'enemy', flag: '🐘', units: { cavalier: 60, legionnaire: 50, archer: 10 }, personality: 'aggressive', neighbors: ['syracuse'] },
                { id: 'egypt', name: 'Égypte', x: 75, y: 80, status: 'neutral', flag: '🐪', relations: 10, trait: { name: 'Grenier du monde', effect: {'food': 2} }, neighbors: ['byzantium', 'syracuse'] },
                { id: 'syracuse', name: 'Syracuse', x: 55, y: 65, status: 'neutral', flag: '🏝️', relations: 0, neighbors: ['roma', 'carthage', 'athens', 'egypt'] },
                { id: 'athens', name: 'Athènes', x: 65, y: 50, status: 'neutral', flag: '🏺', relations: 20, neighbors: ['roma', 'syracuse', 'byzantium'] },
                { id: 'byzantium', name: 'Byzance', x: 75, y: 40, status: 'neutral', flag: '🌊', relations: 0, neighbors: ['athens', 'egypt'] },
            ],
             missions: [
                { id: 'raise_legion', title: 'Levez une Légion', description: 'Recruter votre première légion à Rome.', isComplete: (gs) => gs.legions.length > 0, reward: {'gold': 1000} },
            ],
        },

        // --- Meta Data ---
        lastUpdate: Date.now(),
        lastEventTimestamp: 0,

        // --- System ---
        pendingEvents: [],
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
// GESTION DU SCÉNARIO
// ---------------------------------------------------------------

function getCurrentQuest() {
    if (!SCENARIO || !SCENARIO.chapters) return null;
    const chapter = SCENARIO.chapters[gameState.scenario.currentChapterIndex];
    if (!chapter || !chapter.quests) return null;
    const quest = chapter.quests[gameState.scenario.currentQuestIndex];
    return quest || null;
}

function advanceScenario() {
    const currentQuest = getCurrentQuest();
    if (!currentQuest) return;

    // Grant rewards
    if (currentQuest.reward) {
        if (currentQuest.reward.xp) addXp(currentQuest.reward.xp);
        if (currentQuest.reward.resources) {
            currentQuest.reward.resources.forEach(r => {
                gameState.resources[r.res] = (gameState.resources[r.res] || 0) + r.amount;
            });
        }
    }
     gameState.scenario.completedQuests.push(currentQuest.id);

    // Advance to next quest
    const chapter = SCENARIO.chapters[gameState.scenario.currentChapterIndex];
    if (gameState.scenario.currentQuestIndex < chapter.quests.length - 1) {
        gameState.scenario.currentQuestIndex++;
    } else {
        // Advance to next chapter
        if (gameState.scenario.currentChapterIndex < SCENARIO.chapters.length - 1) {
            gameState.scenario.currentChapterIndex++;
            gameState.scenario.currentQuestIndex = 0;
        } else {
            // End of scenario
            console.log("Félicitations ! Vous avez terminé le scénario principal !");
            // You could set a flag here, e.g., gameState.scenario.isComplete = true;
        }
    }
}

function checkQuestCompletion() {
    const quest = getCurrentQuest();
    if (!quest) return;

    if (quest.isComplete(gameState)) {
        advanceScenario();
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
    const housingModifiers = {}; // e.g., { 'insula': 1.0 }

    // Apply technology effects to modifiers first
    gameState.researchedTechs.forEach(techId => {
        const techDef = findTechnology(techId);
        if (!techDef) return;
        techDef.effects.forEach(effect => {
            if (effect.type === 'building_housing_modifier') {
                housingModifiers[effect.building] = (housingModifiers[effect.building] || 1.0) + effect.value;
            }
        });
    });

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
                const modifier = housingModifiers[building.type] || 1.0;
                populationCapacity += def.housing * building.level * modifier;
            }
        }
    });

    baseProduction.food -= Math.floor(gameState.city.stats.population / 10);

    // Apply production technology effects
    gameState.researchedTechs.forEach(techId => {
        const techDef = findTechnology(techId);
        if (!techDef) return;
        techDef.effects.forEach(effect => {
            if (effect.type === 'building_production_modifier') {
                // This is a simplified model. It boosts the base production from all buildings of a type.
                let baseBuildingProduction = 0;
                gameState.city.buildings.forEach(b => {
                    if (b.type === effect.building) {
                        baseBuildingProduction += (BUILDING_DEFINITIONS[b.type].production[Object.keys(BUILDING_DEFINITIONS[b.type].production)[0]] || 0) * b.level;
                    }
                });
                const resourceToBoost = Object.keys(BUILDING_DEFINITIONS[effect.building].production)[0];
                if(baseProduction[resourceToBoost]) {
                    baseProduction[resourceToBoost] += baseBuildingProduction * effect.value;
                }
            }
        });
    });

    gameState.city.production = baseProduction;
    gameState.storage = { ...gameState.storage, ...baseStorage };
    gameState.city.stats.populationCapacity = Math.floor(populationCapacity);

    if (gameState.city.stats.happiness > 90) {
        gameState.city.stats.happinessModifier = 1.1;
    } else if (gameState.city.stats.happiness < 30) {
        gameState.city.stats.happinessModifier = 0.75;
    } else {
        gameState.city.stats.happinessModifier = 1.0;
    }
}

function findTechnology(techId) {
    for (const category of Object.values(TECHNOLOGY_DEFINITIONS)) {
        if (category.technologies[techId]) {
            return category.technologies[techId];
        }
    }
    return null;
}

function startResearch(techId) {
    if (gameState.city.researchQueue.length > 0) {
        return { success: false, message: "La file de recherche est déjà occupée." };
    }
    if (gameState.researchedTechs.includes(techId) || gameState.city.researchQueue.some(item => item.techId === techId)) {
        return { success: false, message: "Recherche déjà effectuée ou en cours." };
    }

    const tech = findTechnology(techId);
    if (!tech) return { success: false, message: "Technologie inconnue." };

    for (const req of tech.requirements) {
        if (!gameState.researchedTechs.includes(req)) {
            return { success: false, message: "Prérequis non remplis." };
        }
    }

    for (const cost of tech.cost) {
        if (gameState.resources[cost.res] < cost.amount) {
            return { success: false, message: "Ressources insuffisantes." };
        }
    }

    tech.cost.forEach(c => gameState.resources[c.res] -= c.amount);

    gameState.city.researchQueue.push({
        techId: techId,
        endTime: Date.now() + tech.researchTime * 1000,
    });

    return { success: true };
}

function completeResearch(researchItem) {
    gameState.researchedTechs.push(researchItem.techId);
    const tech = findTechnology(researchItem.techId);
    // Apply immediate effects if any
    recalculateCityStats();
    return tech;
}

function startTraining(unitId, amount) {
    const unitDef = UNITS_CONFIG[unitId];
    if (!unitDef) return { success: false, message: "Unité inconnue." };

    // Check requirements
    if (unitDef.requires) {
        const reqBuilding = gameState.city.buildings.find(b => b.type === unitDef.requires.building);
        if (!reqBuilding || reqBuilding.level < unitDef.requires.level) {
            return { success: false, message: `Requiert ${BUILDING_DEFINITIONS[unitDef.requires.building].name} niveau ${unitDef.requires.level}.` };
        }
    }

    const totalCost = unitDef.cost.map(c => ({ res: c.res, amount: c.amount * amount }));
    for (const cost of totalCost) {
        if (gameState.resources[cost.res] < cost.amount) {
            return { success: false, message: "Ressources insuffisantes." };
        }
    }

    totalCost.forEach(c => gameState.resources[c.res] -= c.amount);

    gameState.city.trainingQueue.push({
        unitId: unitId,
        amount: amount,
        endTime: Date.now() + (unitDef.trainTime * amount) * 1000,
    });

    return { success: true };
}

function completeTraining(trainingItem) {
    gameState.unitPool[trainingItem.unitId] = (gameState.unitPool[trainingItem.unitId] || 0) + trainingItem.amount;
    return trainingItem;
}

function triggerRandomEvent() {
    if (!EVENTS || EVENTS.length === 0) return;

    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const effectMessage = event.effect(gameState);

    gameState.pendingEvents.push({
        title: event.title,
        description: event.description,
        effectMessage: effectMessage,
    });
    console.log(`Event triggered: ${event.title}`);
}

function masterGameTick() {
    const now = Date.now();
    let stateChanged = false;

    // 1. Construction Queue
    if (gameState.city.constructionQueue.length > 0 && now >= gameState.city.constructionQueue[0].endTime) {
        const item = gameState.city.constructionQueue.shift();
        completeConstruction(item); // Assumes completeConstruction is defined in city-view
        stateChanged = true;
    }

    // 2. Research Queue
    if (gameState.city.researchQueue.length > 0 && now >= gameState.city.researchQueue[0].endTime) {
        const item = gameState.city.researchQueue.shift();
        completeResearch(item);
        stateChanged = true;
    }

    // 3. Training Queue
    if (gameState.city.trainingQueue.length > 0 && now >= gameState.city.trainingQueue[0].endTime) {
        const item = gameState.city.trainingQueue.shift();
        completeTraining(item);
        stateChanged = true;
    }


    // 4. Check for scenario quest completion
    checkQuestCompletion();

    if (stateChanged) {
        recalculateCityStats();
        saveGameState();
    }

    return stateChanged;
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
