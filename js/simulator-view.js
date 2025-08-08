// ===============================================================
// IMPERIUM V19 - SIMULATOR-VIEW.JS
// ===============================================================
// Ce fichier contient la logique spécifique au simulateur de combat.
// Il utilise le gameState global défini dans game.js pour assurer
// la cohérence des données.
// ===============================================================

document.addEventListener('DOMContentLoaded', function() {
    if (typeof gameState === 'undefined' || !gameState) {
        console.error("GameState non trouvé. Assurez-vous que game.js est chargé avant simulator-view.js.");
        // Affichez une erreur à l'utilisateur
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = '<div style="color: red; padding: 2rem; text-align: center;">Erreur critique: Impossible de charger les données du jeu. Veuillez recharger la page.</div>';
        }
        return;
    }
    // Initialise l'interface utilisateur du simulateur
    initializeSimulatorUI();
});

// État local du simulateur
let battleState = {};
let isSkipped = false;

/**
 * Initialise l'interface utilisateur et les écouteurs d'événements pour le simulateur.
 */
function initializeSimulatorUI() {
    console.log("Initialisation de l'interface du simulateur...");
    populateSelects();
    generateUnitSelectors();

    // Ajout des écouteurs d'événements
    const simulateBtn = document.getElementById('simulate-battle');
    const resetBtn = document.getElementById('reset-btn');
    const scoutBtn = document.getElementById('scout-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const skipBattleBtn = document.getElementById('skip-battle-btn');
    const attackerHeroAbilityBtn = document.getElementById('attacker-hero-ability');

    if (simulateBtn) simulateBtn.addEventListener('click', () => simulateBattle());
    if (resetBtn) resetBtn.addEventListener('click', resetSimulator);
    if (scoutBtn) scoutBtn.addEventListener('click', scoutEnemy);
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideBattleModal);
    if (skipBattleBtn) skipBattleBtn.addEventListener('click', () => { isSkipped = true; });
    if (attackerHeroAbilityBtn) attackerHeroAbilityBtn.addEventListener('click', useHeroAbility);

    // Écouteur global pour les changements dans les inputs
    const layout = document.querySelector('.simulator-layout');
    if (layout) {
        layout.addEventListener('input', (e) => {
            if (e.target.classList.contains('unit-input') || e.target.classList.contains('setting-select')) {
                if (e.target.id === 'attacker-hero') setupHeroAbilityButton();
                calculateArmyStats();
            }
        });
    }

    resetSimulator(); // Réinitialise l'UI à l'état initial
}

/**
 * Remplit les listes déroulantes (selects) avec les données de configuration du jeu.
 */
function populateSelects() {
    // S'assure que les configurations globales sont disponibles
    if (typeof HEROES_CONFIG === 'undefined' || typeof TERRAINS_CONFIG === 'undefined' || typeof FORMATIONS_CONFIG === 'undefined') {
        console.error("Les configurations de jeu (HEROES, TERRAINS, FORMATIONS) ne sont pas chargées.");
        return;
    }

    const selects = {
        'attacker-hero': HEROES_CONFIG,
        'defender-hero': HEROES_CONFIG,
        'terrain': TERRAINS_CONFIG,
        'attacker-formation': FORMATIONS_CONFIG,
        'defender-formation': FORMATIONS_CONFIG,
    };

    for (const [selectId, config] of Object.entries(selects)) {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = Object.entries(config)
                .map(([key, value]) => `<option value="${key}">${value.name}</option>`)
                .join('');
        }
    }
}

/**
 * Crée un sélecteur d'unité (HTML) pour un type d'unité donné.
 * @param {string} unitType - La clé de l'unité (ex: 'legionnaire').
 * @param {string} side - 'attacker' ou 'defender'.
 * @returns {HTMLElement} L'élément du sélecteur d'unité.
 */
function createUnitSelector(unitType, side) {
    const config = UNITS_CONFIG[unitType];
    // Utilise le gameState global pour obtenir les unités disponibles pour l'attaquant
    const available = side === 'attacker' ? (gameState.unitPool[unitType] || 0) : 'N/A';
    const xp = side === 'attacker' ? (gameState.units[unitType]?.xp || 0) : 0;
    const rank = getRank(xp);

    const selector = document.createElement('div');
    selector.className = 'unit-selector';
    selector.innerHTML = `
        <div class="unit-icon">${config.icon}</div>
        <div class="unit-name">${config.name}</div>
        <div class="rank-indicator">${rank.name}</div>
        <div class="xp-bar"><div class="xp-bar-inner" style="width:${rank.percent}%"></div></div>
        <input type="number" class="unit-input" data-side="${side}" data-unit="${unitType}" value="0" min="0" ${side === 'attacker' ? `max="${available}"` : ''}>
        ${side === 'attacker' ? `<div class="unit-available">Dispo: ${available}</div>` : ''}
    `;
    return selector;
}

/**
 * Génère les sélecteurs d'unités pour les deux armées et les insère dans le DOM.
 */
function generateUnitSelectors() {
    const attackerContainer = document.getElementById('attacker-units');
    const defenderContainer = document.getElementById('defender-units');

    if (!attackerContainer || !defenderContainer) return;

    attackerContainer.innerHTML = '';
    defenderContainer.innerHTML = '';

    Object.keys(UNITS_CONFIG).forEach(unitType => {
        attackerContainer.appendChild(createUnitSelector(unitType, 'attacker'));
        defenderContainer.appendChild(createUnitSelector(unitType, 'defender'));
    });

    // Cache les unités ennemies par défaut jusqu'à l'espionnage
    document.querySelectorAll('#defender-units .unit-selector').forEach(el => {
        el.style.display = 'none';
    });
}

/**
 * Calcule la force des armées et met à jour l'état du bouton de simulation.
 */
function calculateArmyStats() {
    let attackerUnits = 0;
    let defenderUnits = 0;

    document.querySelectorAll('.unit-input[data-unit]').forEach(input => {
        const { side, unit } = input.dataset;
        // Valide l'input par rapport au maximum disponible dans le gameState
        const max = side === 'attacker' ? (gameState.unitPool[unit] || 0) : Infinity;
        let count = parseInt(input.value) || 0;
        if (count > max) {
            count = max;
            input.value = max;
        }

        if (side === 'attacker') {
            attackerUnits += count;
        } else {
            defenderUnits += count;
        }
    });

    const canSimulate = attackerUnits > 0 && defenderUnits > 0;
    const simulateBtn = document.getElementById('simulate-battle');
    const statusEl = document.getElementById('simulation-status');

    if (simulateBtn) simulateBtn.disabled = !canSimulate;
    if (statusEl) statusEl.textContent = !canSimulate ? "Ajoutez des troupes et espionnez l'ennemi." : "Prêt à lancer l'assaut !";
}

/**
 * Simule une action d'espionnage et révèle les unités du défenseur.
 */
async function scoutEnemy() {
    const statusEl = document.getElementById('simulation-status');
    if (statusEl) statusEl.textContent = "Espionnage en cours...";
    await new Promise(resolve => setTimeout(resolve, 800)); // Simule un délai
    if (statusEl) statusEl.textContent = "Rapport d'espionnage reçu !";

    document.querySelectorAll('#defender-units .unit-selector').forEach(el => {
        el.style.display = 'block';
        const input = el.querySelector('input');
        if (input) input.value = Math.floor(Math.random() * 150) + 20; // Révèle des unités aléatoires
    });
    calculateArmyStats();
}

/**
 * Réinitialise l'interface du simulateur à son état par défaut.
 */
function resetSimulator() {
    document.querySelectorAll('.unit-input').forEach(input => input.value = 0);
    document.getElementById('wall-level').value = 5;
    document.getElementById('attacker-hero').value = 'none';
    document.getElementById('defender-hero').value = 'none';
    document.getElementById('terrain').value = 'plains';
    document.getElementById('attacker-formation').value = 'balanced';
    document.getElementById('defender-formation').value = 'balanced';

    // Cache les résultats de la bataille précédente
    const battleResultEl = document.getElementById('battle-result');
    if (battleResultEl) battleResultEl.className = 'battle-result';

    // Cache les unités ennemies
    document.querySelectorAll('#defender-units .unit-selector').forEach(el => {
        el.style.display = 'none';
        const input = el.querySelector('input');
        if(input) input.value = 0;
    });

    // Met à jour les barres de stats et les boutons
    updateStatBar('attacker-morale-bar', 100, 100);
    updateStatBar('defender-morale-bar', 100, 100);
    calculateArmyStats();
    setupHeroAbilityButton();
}

/**
 * Récupère les configurations des armées depuis l'interface utilisateur.
 * @returns {{attacker: object, defender: object}} Les objets représentant les deux armées.
 */
function getArmiesFromUI() {
    const getArmy = (side) => {
        const army = { army: {}, morale: 100 };
        army.hero = HEROES_CONFIG[document.getElementById(`${side}-hero`).value];
        army.formation = FORMATIONS_CONFIG[document.getElementById(`${side}-formation`).value];

        document.querySelectorAll(`.unit-input[data-side="${side}"]`).forEach(input => {
            const count = parseInt(input.value) || 0;
            if (count > 0) {
                const unitKey = input.dataset.unit;
                const rank = (side === 'attacker') ? getRank(gameState.units[unitKey]?.xp || 0) : { bonus: 0 };
                const veteranBonus = 1 + rank.bonus;

                army.army[unitKey] = {
                    ...JSON.parse(JSON.stringify(UNITS_CONFIG[unitKey])),
                    count: count,
                    initialCount: count,
                    hasCharged: false,
                    attack: Math.round(UNITS_CONFIG[unitKey].attack * veteranBonus),
                    defense: Math.round(UNITS_CONFIG[unitKey].defense * veteranBonus)
                };
            }
        });
        return army;
    };

    return { attacker: getArmy('attacker'), defender: getArmy('defender') };
}


/**
 * Fonction principale qui lance la simulation de bataille.
 */
async function simulateBattle() {
    isSkipped = false;
    showBattleModal();

    // Prépare la modale de bataille
    document.getElementById('battle-report').innerHTML = '';
    document.getElementById('skip-battle-btn').style.display = 'inline-block';
    document.getElementById('close-modal-btn').style.display = 'none';

    battleState = getArmiesFromUI();
    const { attacker, defender } = battleState;

    const initialAttackerState = JSON.parse(JSON.stringify(attacker.army));
    const initialDefenderState = JSON.parse(JSON.stringify(defender.army));

    const addLog = async (message, isSpecial = false) => {
        const reportEl = document.getElementById('battle-report');
        const entry = document.createElement('div');
        entry.className = 'log-entry' + (isSpecial ? ' special' : '');
        entry.textContent = message;
        reportEl.appendChild(entry);
        reportEl.scrollTop = reportEl.scrollHeight;
        await new Promise(resolve => setTimeout(resolve, isSkipped ? 0 : 150));
    };

    await addLog("La bataille commence !", true);

    // Boucle de combat (30 tours max)
    for (let round = 1; round <= 30; round++) {
        if (Object.keys(attacker.army).length === 0 || Object.keys(defender.army).length === 0) break;
        await addLog(`--- Tour ${round} ---`);
        await executeTurn(attacker, defender, 'Attaquant', addLog);
        if (Object.keys(defender.army).length === 0) break;
        await executeTurn(defender, attacker, 'Défenseur', addLog);
    }

    // Détermine le vainqueur et affiche les résultats
    const victory = Object.keys(defender.army).length === 0 && Object.keys(attacker.army).length > 0;
    displayBattleResult(victory, initialAttackerState, attacker.army, initialDefenderState, defender.army);

    // Met à jour l'UI post-bataille
    document.getElementById('skip-battle-btn').style.display = 'none';
    document.getElementById('close-modal-btn').style.display = 'inline-block';
}

/**
 * Exécute un tour de combat pour une armée.
 * @param {object} currentAttacker - L'armée qui attaque ce tour.
 * @param {object} currentDefender - L'armée qui défend ce tour.
 * @param {string} attackerSideName - Le nom du côté attaquant (ex: "Attaquant").
 * @param {function} addLog - La fonction pour ajouter un message au rapport de bataille.
 */
async function executeTurn(currentAttacker, currentDefender, attackerSideName, addLog) {
    for (const unitName in currentAttacker.army) {
        if (Object.keys(currentDefender.army).length === 0) break;

        const unit = currentAttacker.army[unitName];
        if (!unit || unit.count <= 0) continue;

        // Logique de moral
        if (currentAttacker.morale < 30 && Math.random() > currentAttacker.morale / 100) {
            await addLog(`${attackerSideName} : ${unit.name} x${unit.count} sont démoralisés et fuient !`, true);
            delete currentAttacker.army[unitName];
            continue;
        }
        const moraleModifier = currentAttacker.morale < 50 ? 0.8 : 1;
        let damage = unit.count * unit.attack * moraleModifier;

        // Logique des capacités spéciales
        if (unit.ability === 'charge' && !unit.hasCharged) {
            damage *= 1.5;
            unit.hasCharged = true;
            await addLog(`${attackerSideName} : ${unit.name} chargent avec fureur !`, true);
        }

        // Sélection de la cible
        let targetKey = unit.priority;
        if (!currentDefender.army[targetKey] || currentDefender.army[targetKey].count <= 0) {
            targetKey = Object.keys(currentDefender.army)[0];
        }
        if (!targetKey) continue;
        const target = currentDefender.army[targetKey];

        // Calcul des pertes
        const unitsLost = Math.min(target.count, Math.floor(damage / target.hp));
        if (unitsLost > 0) {
            target.count -= unitsLost;
            await addLog(`${attackerSideName} : ${unit.name} x${Math.round(unit.count)} tuent ${unitsLost} ${target.name}.`);
            if (target.count <= 0) {
                delete currentDefender.army[targetKey];
                await addLog(`${target.name} ont été anéantis !`, true);
            }
        }
    }
    // Mise à jour du moral
    updateMorale(currentAttacker, currentDefender);
}

/**
 * Met à jour le moral des armées en fonction des pertes.
 */
function updateMorale(attacker, defender) {
    const calculateLossPercent = (army) => {
        const initial = Object.values(army).reduce((sum, unit) => sum + unit.initialCount, 0);
        const current = Object.values(army).reduce((sum, unit) => sum + unit.count, 0);
        return initial > 0 ? (initial - current) / initial : 0;
    };
    attacker.morale = Math.max(0, 100 - (calculateLossPercent(attacker.army) * 100));
    defender.morale = Math.max(0, 100 - (calculateLossPercent(defender.army) * 100));
    updateStatBar('attacker-morale-bar', attacker.morale, 100);
    updateStatBar('defender-morale-bar', defender.morale, 100);
}


/**
 * Affiche les résultats de la bataille et met à jour le gameState.
 */
function displayBattleResult(victory, initialAttacker, finalAttacker, initialDefender, finalDefender) {
    const resultContainer = document.getElementById('battle-result');
    const resultTitle = document.getElementById('result-title');
    const lootList = document.getElementById('battle-loot');
    const lootSection = document.getElementById('loot-section');

    // Affiche le titre de la victoire/défaite
    resultContainer.className = `battle-result show ${victory ? 'victory' : 'defeat'}`;
    resultTitle.textContent = victory ? 'VICTOIRE !' : 'DÉFAITE !';

    // Calcule et affiche les pertes
    const attackerLosses = calculateLosses(initialAttacker, finalAttacker);
    const defenderLosses = calculateLosses(initialDefender, finalDefender);
    document.getElementById('attacker-losses').innerHTML = formatLosses(attackerLosses, UNITS_CONFIG);
    document.getElementById('defender-losses').innerHTML = formatLosses(defenderLosses, UNITS_CONFIG);

    // Met à jour le gameState avec les pertes de l'attaquant
    Object.keys(attackerLosses).forEach(unitKey => {
        if (gameState.unitPool[unitKey]) {
            gameState.unitPool[unitKey] = Math.max(0, gameState.unitPool[unitKey] - attackerLosses[unitKey]);
        }
    });

    // Ajoute le butin et l'XP en cas de victoire
    lootList.innerHTML = '';
    if (victory) {
        const goldLoot = Math.floor(Math.random() * 2500) + 500;
        const xpGain = 120;
        gameState.resources.gold += goldLoot;
        addXp(xpGain); // Fonction globale de game.js

        lootList.innerHTML = `<div class="loot-item"><span>💰 Or</span><span class="loot-amount">+${goldLoot.toLocaleString()}</span></div>`;
        lootList.innerHTML += `<div class="loot-item"><span>✨ XP</span><span class="loot-amount">+${xpGain}</span></div>`;
        if (lootSection) lootSection.style.display = 'block';

    } else {
        const xpGain = 30; // Moins d'XP pour une défaite
        addXp(xpGain);
        lootList.innerHTML = `<div class="loot-item"><span>✨ XP</span><span class="loot-amount">+${xpGain}</span></div>`;
        if (lootSection) lootSection.style.display = 'block';
    }

    // Sauvegarde l'état du jeu après la bataille
    saveGameState();

    // Met à jour l'UI pour refléter le nouvel état
    generateUnitSelectors();
    calculateArmyStats();
}

// ---------------------------------------------------------------
// FONCTIONS UTILITAIRES
// ---------------------------------------------------------------

function calculateLosses(initial, final) {
    const losses = {};
    Object.keys(initial).forEach(unit => {
        const lost = initial[unit].count - (final[unit] ? final[unit].count : 0);
        if (lost > 0) losses[unit] = lost;
    });
    return losses;
}

function formatLosses(losses, config) {
    if (Object.keys(losses).length === 0) return '<div class="loss-item">Aucune perte</div>';
    return Object.entries(losses)
        .map(([unit, count]) => `<div class="loss-item"><span>${config[unit].icon} ${config[unit].name}</span><span class="loss-count">-${count}</span></div>`)
        .join('');
}

function getRank(xp) {
    if (xp >= 1000) return { name: 'Élite', bonus: 0.2, percent: 100 };
    if (xp >= 300) return { name: 'Vétéran', bonus: 0.1, percent: (xp - 300) / 7 };
    return { name: 'Recrue', bonus: 0, percent: xp / 3 };
}

function updateStatBar(id, value, max) {
    const bar = document.getElementById(id);
    if (!bar) return;
    const percentage = max > 0 ? (value / max) * 100 : 0;
    bar.style.width = `${percentage}%`;

    if (id.includes('morale')) {
        if (percentage > 66) bar.style.backgroundColor = 'var(--morale-high)';
        else if (percentage > 33) bar.style.backgroundColor = 'var(--morale-medium)';
        else bar.style.backgroundColor = 'var(--morale-low)';
    }
}

function setupHeroAbilityButton() {
    const heroKey = document.getElementById('attacker-hero').value;
    const hero = HEROES_CONFIG[heroKey];
    const btn = document.getElementById('attacker-hero-ability');
    if (hero && hero.ability) {
        btn.style.display = 'block';
        btn.disabled = hero.ability.used;
        btn.textContent = hero.ability.used ? "Compétence utilisée" : "Utiliser Compétence";
    } else if (btn) {
        btn.style.display = 'none';
    }
}

async function useHeroAbility() {
    if (!battleState.attacker) return;
    const heroKey = document.getElementById('attacker-hero').value;
    const hero = HEROES_CONFIG[heroKey];
    const btn = document.getElementById('attacker-hero-ability');
    if (hero && hero.ability && !hero.ability.used) {
        if (hero.ability.type === 'morale_boost') {
            battleState.attacker.morale = Math.min(100, battleState.attacker.morale + hero.ability.value);
            updateStatBar('attacker-morale-bar', battleState.attacker.morale, 100);
        }
        hero.ability.used = true;
        btn.disabled = true;
        btn.textContent = "Compétence utilisée";
    }
}

function showBattleModal() {
    const overlay = document.getElementById('battle-modal-overlay');
    const result = document.getElementById('battle-result');
    if (overlay) overlay.style.display = 'flex';
    if (result) result.style.display = 'block';
}

function hideBattleModal() {
    const overlay = document.getElementById('battle-modal-overlay');
    if (overlay) overlay.style.display = 'none';
}
