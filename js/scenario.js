// ===============================================================
// IMPERIUM V19 - SCENARIO.JS
// ===============================================================
// Ce fichier définit le scénario principal du jeu, avec ses
// chapitres, ses quêtes et ses événements.
// ===============================================================

const SCENARIO = {
    chapters: [
        {
            id: 'chapter1',
            title: 'L\'Aube de Rome',
            description: 'Votre mission est de transformer ce petit village en une ville digne de Rome. Commencez par assurer les bases de la survie de votre peuple.',
            quests: [
                {
                    id: 'build_farm',
                    description: "Construisez une Ferme pour nourrir votre population.",
                    isComplete: (gs) => gs.city.buildings.some(b => b.type === 'farm' && b.level > 0),
                    reward: { xp: 50, resources: [{res: 'gold', amount: 100}] }
                },
                {
                    id: 'build_insula',
                    description: "Construisez une Insula pour loger vos citoyens.",
                    isComplete: (gs) => gs.city.buildings.some(b => b.type === 'insula' && b.level > 0),
                    reward: { xp: 100, resources: [{res: 'food', amount: 200}] }
                },
                {
                    id: 'reach_level_2',
                    description: "Atteignez le niveau 2 de Consul.",
                    isComplete: (gs) => gs.player.level >= 2,
                    reward: { xp: 0, resources: [{res: 'marble', amount: 50}] }
                },
                {
                    id: 'build_market',
                    description: "Construisez un Marché pour développer votre économie.",
                    isComplete: (gs) => gs.city.buildings.some(b => b.type === 'market' && b.level > 0),
                    reward: { xp: 150, resources: [{res: 'gold', amount: 300}] }
                }
            ]
        },
        {
            id: 'chapter2',
            title: 'Première Expansion',
            description: 'Rome est prête à étendre son influence. Il est temps de vous tourner vers le monde extérieur.',
            quests: [
                {
                    id: 'build_barracks',
                    description: "Construisez une Caserne pour former une armée.",
                    isComplete: (gs) => gs.city.buildings.some(b => b.type === 'barracks' && b.level > 0),
                    reward: { xp: 200, resources: [{res: 'gold', amount: 500}] }
                },
                {
                    id: 'train_legionnaires',
                    description: "Entraînez 100 Légionnaires.",
                    isComplete: (gs) => (gs.unitPool.legionnaire || 0) >= 100,
                    reward: { xp: 150, resources: [{res: 'food', amount: 300}] }
                },
                {
                    id: 'raise_legion',
                    description: "Levez votre première Légion sur la carte du monde.",
                    isComplete: (gs) => gs.legions.length > 0,
                    reward: { xp: 300, resources: [{res: 'marble', amount: 200}] }
                }
            ]
        }
    ]
};
