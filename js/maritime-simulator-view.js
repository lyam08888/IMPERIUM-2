// ===============================================================
// IMPERIUM V19 - MARITIME-SIMULATOR-VIEW.JS
// ===============================================================
// Ce fichier contient la logique d'interface pour le simulateur de combat maritime.
// Il utilise le BattleManager pour exécuter la simulation.
// ===============================================================

let isMaritimeBattleSkipped = false;

function initializeMaritimeSimulatorUI() {
    const navalUnits = Object.fromEntries(Object.entries(UNITS_CONFIG).filter(([_, unit]) => unit.domain === 'sea'));
    console.log("Initializing Maritime Simulator UI...");

    // Assuming HEROES_CONFIG and NAVAL_FORMATIONS_CONFIG are global
    populateMaritimeSelects(HEROES_CONFIG, NAVAL_FORMATIONS_CONFIG);
    generateMaritimeUnitSelectors(navalUnits);

    const simulateBtn = document.getElementById('simulate-battle');
    if (simulateBtn) simulateBtn.addEventListener('click', () => startMaritimeSimulation(navalUnits));

    const resetBtn = document.getElementById('reset-btn');
    if(resetBtn) resetBtn.addEventListener('click', () => resetMaritimeSimulator(navalUnits));

    const scoutBtn = document.getElementById('scout-btn');
    if(scoutBtn) scoutBtn.addEventListener('click', () => scoutEnemyFleet(navalUnits));

    const skipBtn = document.getElementById('skip-battle-btn');
    if(skipBtn) skipBtn.addEventListener('click', () => { isMaritimeBattleSkipped = true; });

    const closeModalBtn = document.getElementById('close-modal-btn');
    if(closeModalBtn) closeModalBtn.addEventListener('click', () => {
        const overlay = document.getElementById('battle-modal-overlay');
        if (overlay) overlay.style.display = 'none';
    });

    const container = document.querySelector('#view-simulator') || document.querySelector('#maritime-combat-simulator-container');
    if (container) {
        container.addEventListener('input', () => calculateMaritimeArmyStats(navalUnits));
    }

    resetMaritimeSimulator(navalUnits);
}

function populateMaritimeSelects(heroes, formations) {
    const selects = {
        'attacker-hero': heroes, 'defender-hero': heroes,
        'attacker-formation': formations, 'defender-formation': formations,
    };
    for (const [selectId, config] of Object.entries(selects)) {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = Object.entries(config).map(([key, value]) => `<option value="${key}">${value.name}</option>`).join('');
        }
    }
}

function generateMaritimeUnitSelectors(navalUnits) {
    const attackerContainer = document.getElementById('attacker-units');
    const defenderContainer = document.getElementById('defender-units');
    if (!attackerContainer || !defenderContainer) return;
    attackerContainer.innerHTML = '';
    defenderContainer.innerHTML = '';
    Object.keys(navalUnits).forEach(unitType => {
        attackerContainer.appendChild(createMaritimeUnitSelector(unitType, 'attacker'));
        defenderContainer.appendChild(createMaritimeUnitSelector(unitType, 'defender'));
    });
    document.querySelectorAll('#defender-units .unit-selector').forEach(el => {
        el.style.display = 'none';
    });
}

function createMaritimeUnitSelector(unitType, side) {
    const config = UNITS_CONFIG[unitType];
    const available = side === 'attacker' ? (gameState.navalUnitPool[unitType] || 0) : 0;
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

function calculateMaritimeArmyStats(navalUnits) {
    let attackerUnits = 0;
    let defenderUnits = 0;
    document.querySelectorAll('.unit-input[data-unit]').forEach(input => {
        const unitKey = input.dataset.unit;
        if (!navalUnits[unitKey]) return;
        const count = parseInt(input.value) || 0;
        if (input.dataset.side === 'attacker') attackerUnits += count;
        else defenderUnits += count;
    });
    const canSimulate = attackerUnits > 0 && defenderUnits > 0;
    document.getElementById('simulate-battle').disabled = !canSimulate;
    document.getElementById('simulation-status').textContent = !canSimulate ? "Ajoutez des navires et espionnez l'ennemi" : "Prêt pour la bataille navale !";
}

async function scoutEnemyFleet(navalUnits) {
    const statusEl = document.getElementById('simulation-status');
    if(statusEl) statusEl.textContent = "Espionnage en cours...";
    await new Promise(resolve => setTimeout(resolve, 800));
    if(statusEl) statusEl.textContent = "Rapport d'espionnage reçu !";
    document.querySelectorAll('#defender-units .unit-selector').forEach(el => {
        const unitKey = el.querySelector('input').dataset.unit;
        if (navalUnits[unitKey]) {
            el.style.display = 'block';
            el.querySelector('input').value = Math.floor(Math.random() * 20) + 5;
        }
    });
    calculateMaritimeArmyStats(navalUnits);
}

function getMaritimeArmiesFromUI(navalUnits) {
    const getArmy = (side) => {
        const army = { army: {}, morale: 100 };
        army.hero = HEROES_CONFIG[document.getElementById(`${side}-hero`).value];
        army.formation = NAVAL_FORMATIONS_CONFIG[document.getElementById(`${side}-formation`).value];
        document.querySelectorAll(`.unit-input[data-side="${side}"]`).forEach(input => {
            const unitKey = input.dataset.unit;
            if (!navalUnits[unitKey]) return;
            const count = parseInt(input.value) || 0;
            if (count > 0) {
                const rank = (side === 'attacker') ? getRank(gameState.units[unitKey]?.xp || 0) : { bonus: 0 };
                const veteranBonus = 1 + rank.bonus;
                army.army[unitKey] = {
                    ...JSON.parse(JSON.stringify(UNITS_CONFIG[unitKey])),
                    count: count,
                    initialCount: count,
                    attack: Math.round(UNITS_CONFIG[unitKey].attack * veteranBonus),
                    defense: Math.round(UNITS_CONFIG[unitKey].defense * veteranBonus)
                };
            }
        });
        return army;
    };
    return { attacker: getArmy('attacker'), defender: getArmy('defender') };
}

async function startMaritimeSimulation(navalUnits) {
    isMaritimeBattleSkipped = false;
    const overlay = document.getElementById('battle-modal-overlay');
    if (overlay) overlay.style.display = 'flex';

    document.getElementById('battle-result').style.display = 'none';
    document.getElementById('skip-battle-btn').style.display = 'inline-block';
    document.getElementById('close-modal-btn').style.display = 'none';
    document.getElementById('battle-report').innerHTML = '';

    const { attacker, defender } = getMaritimeArmiesFromUI(navalUnits);
    const initialAttackerState = JSON.parse(JSON.stringify(attacker.army));

    const battleManager = new BattleManager(attacker, defender, 'sea', {
        seaCondition: document.getElementById('sea-condition').value
    });

    const battleResult = await battleManager.run();

    const reportEl = document.getElementById('battle-report');
    for (const log of battleResult.log) {
        const entry = document.createElement('div');
        entry.className = 'log-entry' + (log.isSpecial ? ' special' : '');
        entry.textContent = log.message;
        reportEl.appendChild(entry);
        if(!isMaritimeBattleSkipped) await new Promise(resolve => setTimeout(resolve, 50));
    }
    reportEl.scrollTop = reportEl.scrollHeight;

    displayMaritimeBattleResult(battleResult.victory, initialAttackerState, battleResult.finalAttacker.army, defender.army, battleResult.finalDefender.army, navalUnits);

    document.getElementById('skip-battle-btn').style.display = 'none';
    document.getElementById('close-modal-btn').style.display = 'inline-block';
}

function displayMaritimeBattleResult(victory, initialAttacker, finalAttacker, initialDefender, finalDefender, navalUnits) {
    const resultContainer = document.getElementById('battle-result');
    resultContainer.style.display = 'block';
    resultContainer.className = `battle-result show ${victory ? 'victory' : 'defeat'}`;
    document.getElementById('result-title').textContent = victory ? 'VICTOIRE NAVALE !' : 'DÉFAITE NAVALE !';

    const attackerLosses = calculateLosses(initialAttacker, finalAttacker);
    const defenderLosses = calculateLosses(initialDefender, finalDefender);

    document.getElementById('attacker-losses').innerHTML = formatLosses(attackerLosses, UNITS_CONFIG);
    document.getElementById('defender-losses').innerHTML = formatLosses(defenderLosses, UNITS_CONFIG);

    Object.keys(attackerLosses).forEach(unitKey => {
        if (gameState.navalUnitPool[unitKey] !== undefined) {
            gameState.navalUnitPool[unitKey] = Math.max(0, gameState.navalUnitPool[unitKey] - attackerLosses[unitKey]);
        }
    });

    Object.keys(finalAttacker).forEach(unitKey => {
        if (gameState.units[unitKey]) {
            gameState.units[unitKey].xp += Math.round(Object.keys(defenderLosses).length * 15 / (finalAttacker[unitKey].count || 1));
        }
    });

    const lootList = document.getElementById('battle-loot');
    const lootSection = document.getElementById('loot-section');
    lootList.innerHTML = '';
    if (victory) {
        const goldLoot = Math.floor(Math.random() * 8000) + 2000;
        const woodLoot = Math.floor(Math.random() * 5000) + 1000;
        gameState.resources.gold += goldLoot;
        gameState.resources.wood += woodLoot;
        addXp(150);
        lootList.innerHTML = `
            <div class="loot-item"><span>💰 Or</span><span class="loot-amount">+${goldLoot.toLocaleString()}</span></div>
            <div class="loot-item"><span>🌲 Bois</span><span class="loot-amount">+${woodLoot.toLocaleString()}</span></div>`;
        if (lootSection) lootSection.style.display = 'block';
    } else {
        addXp(40);
        if (lootSection) lootSection.style.display = 'none';
    }

    saveGameState();
    generateMaritimeUnitSelectors(navalUnits);
    calculateMaritimeArmyStats(navalUnits);
}

function resetMaritimeSimulator(navalUnits) {
    document.querySelectorAll('.unit-input').forEach(input => input.value = 0);
    const coastalFort = document.getElementById('coastal-fortifications');
    if(coastalFort) coastalFort.value = 0;
    document.getElementById('attacker-hero').value = 'none';
    document.getElementById('defender-hero').value = 'none';
    document.getElementById('battle-result').classList.remove('show');
    document.querySelectorAll('#defender-units .unit-selector').forEach(el => {
        el.style.display = 'none';
        el.querySelector('input').value = 0;
    });
    calculateMaritimeArmyStats(navalUnits);
}

function getRank(xp) {
    if (xp >= 1000) return { name: 'Élite', bonus: 0.2, percent: 100 };
    if (xp >= 300) return { name: 'Vétéran', bonus: 0.1, percent: (xp - 300) / 7 };
    return { name: 'Recrue', bonus: 0, percent: xp / 3 };
}

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
