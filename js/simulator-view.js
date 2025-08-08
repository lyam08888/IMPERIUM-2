// ===============================================================
// IMPERIUM V19 - SIMULATOR-VIEW.JS
// ===============================================================
// Ce fichier contient la logique spécifique au simulateur de combat
// ===============================================================

document.addEventListener('DOMContentLoaded', function() {
    if (typeof gameState === 'undefined' || !gameState) {
        console.error("GameState not found. Make sure game.js is loaded first.");
        return;
    }
    initializeSimulatorUI();
});

let battleState = {};
let isSkipped = false;

function initializeSimulatorUI() {
    console.log("Initializing Simulator View UI...");
    populateSelects();
    generateUnitSelectors();

    document.getElementById('simulate-battle').addEventListener('click', () => simulateBattle());
    document.getElementById('reset-btn').addEventListener('click', resetSimulator);
    document.getElementById('scout-btn').addEventListener('click', scoutEnemy);
    document.getElementById('close-modal-btn').addEventListener('click', hideBattleModal);

    document.querySelector('.simulator-layout').addEventListener('input', (e) => {
        if(e.target.classList.contains('unit-input')) {
            calculateArmyStats();
        }
    });

    resetSimulator();
}

function populateSelects() {
    const selects = {
        'attacker-hero': HEROES_CONFIG, 'defender-hero': HEROES_CONFIG,
        'terrain': TERRAINS_CONFIG,
        'attacker-formation': FORMATIONS_CONFIG, 'defender-formation': FORMATIONS_CONFIG,
    };
    for (const [selectId, config] of Object.entries(selects)) {
        const select = document.getElementById(selectId);
        if(select) {
            select.innerHTML = Object.entries(config).map(([key, value]) => `<option value="${key}">${value.name}</option>`).join('');
        }
    }
}

function createUnitSelector(unitType, side) {
    const config = UNITS_CONFIG[unitType];
    const available = side === 'attacker' ? (gameState.units[unitType]?.count || 0) : 'N/A';

    const selector = document.createElement('div');
    selector.className = 'unit-selector';
    selector.innerHTML = `
            <div class="unit-icon">${config.icon}</div>
            <div class="unit-name">${config.name}</div>
            <input type="number" class="unit-input" data-side="${side}" data-unit="${unitType}" value="0" min="0" ${side === 'attacker' ? `max="${available}"` : ''}>
            ${side === 'attacker' ? `<div class="unit-available">Dispo: ${available}</div>` : ''}
        `;
    return selector;
}

function generateUnitSelectors() {
    const attackerContainer = document.getElementById('attacker-units');
    const defenderContainer = document.getElementById('defender-units');
    if(!attackerContainer || !defenderContainer) return;

    attackerContainer.innerHTML = '';
    defenderContainer.innerHTML = '';

    Object.keys(UNITS_CONFIG).forEach(unitType => {
        attackerContainer.appendChild(createUnitSelector(unitType, 'attacker'));
        defenderContainer.appendChild(createUnitSelector(unitType, 'defender'));
    });
}

function calculateArmyStats() {
    let attackerUnits = 0;
    let defenderUnits = 0;
    document.querySelectorAll('.unit-input[data-unit]').forEach(input => {
        const { side, unit } = input.dataset;
        const max = side === 'attacker' ? (gameState.units[unit]?.count || 0) : Infinity;
        let count = parseInt(input.value) || 0;
        if(count > max) {
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
    document.getElementById('simulate-battle').disabled = !canSimulate;
    document.getElementById('simulation-status').textContent = !canSimulate ? "Ajoutez des troupes des deux côtés." : "Prêt à lancer l'assaut !";
}

function scoutEnemy() {
    document.querySelectorAll('#defender-units .unit-input').forEach(input => {
        input.value = Math.floor(Math.random() * 200) + 50;
    });
    calculateArmyStats();
}

function resetSimulator() {
    document.querySelectorAll('.unit-input').forEach(input => input.value = 0);
    generateUnitSelectors();
    calculateArmyStats();
}

function getArmiesFromUI() {
    const attacker = { army: {}, formation: document.getElementById('attacker-formation').value, hero: document.getElementById('attacker-hero').value, morale: 100 };
    const defender = { army: {}, formation: document.getElementById('defender-formation').value, hero: document.getElementById('defender-hero').value, morale: 100 };

    Object.keys(UNITS_CONFIG).forEach(unitKey => {
        const attackerCount = parseInt(document.querySelector(`[data-side="attacker"][data-unit="${unitKey}"]`).value) || 0;
        if (attackerCount > 0) {
            attacker.army[unitKey] = { ...UNITS_CONFIG[unitKey], count: attackerCount };
        }

        const defenderCount = parseInt(document.querySelector(`[data-side="defender"][data-unit="${unitKey}"]`).value) || 0;
        if (defenderCount > 0) {
            defender.army[unitKey] = { ...UNITS_CONFIG[unitKey], count: defenderCount };
        }
    });
    return { attacker, defender };
}


async function simulateBattle() {
    showBattleModal();
    const { attacker, defender } = getArmiesFromUI();

    const initialAttackerState = JSON.parse(JSON.stringify(attacker.army));
    const initialDefenderState = JSON.parse(JSON.stringify(defender.army));

    // Simplified battle logic
    let attackerPower = Object.values(attacker.army).reduce((sum, unit) => sum + unit.count * (unit.attack + unit.defense), 0);
    let defenderPower = Object.values(defender.army).reduce((sum, unit) => sum + unit.count * (unit.attack + unit.defense), 0);

    const victory = attackerPower > defenderPower;

    displayBattleResult(victory, initialAttackerState, initialDefenderState);
}

function displayBattleResult(victory, initialAttacker, initialDefender) {
    const resultTitle = document.getElementById('result-title');
    resultTitle.textContent = victory ? 'VICTOIRE !' : 'DÉFAITE !';

    const lootList = document.getElementById('battle-loot');
    lootList.innerHTML = '';

    // Calculate losses and update gameState
    Object.keys(initialAttacker).forEach(unitKey => {
        const lostCount = victory ? Math.floor(initialAttacker[unitKey].count * 0.2) : Math.floor(initialAttacker[unitKey].count * 0.5);
        gameState.units[unitKey].count -= lostCount;
        if(gameState.units[unitKey].count < 0) gameState.units[unitKey].count = 0;
    });

    if (victory) {
        const goldLoot = Math.floor(Math.random() * 1000) + 200;
        const xpGain = 50;
        gameState.resources.gold += goldLoot;
        addXp(xpGain);

        lootList.innerHTML = `<div class="loot-item"><span>💰 Or</span><span class="loot-amount">+${goldLoot.toLocaleString()}</span></div>`;
        lootList.innerHTML += `<div class="loot-item"><span>✨ XP</span><span class="loot-amount">+${xpGain}</span></div>`;

    } else {
        const xpGain = 10;
        addXp(xpGain);
        lootList.innerHTML += `<div class="loot-item"><span>✨ XP</span><span class="loot-amount">+${xpGain}</span></div>`;
    }

    saveGameState();

    // Update UI after battle
    generateUnitSelectors();
    calculateArmyStats();
}


function showBattleModal() {
    const overlay = document.getElementById('battle-modal-overlay');
    const result = document.getElementById('battle-result');
    if(overlay) overlay.style.display = 'flex';
    if(result) result.style.display = 'block';
}

function hideBattleModal() {
    const overlay = document.getElementById('battle-modal-overlay');
    if(overlay) overlay.style.display = 'none';
}
