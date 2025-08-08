// ===============================================================
// MOTEUR DE SIMULATION DE COMBAT V18
// ===============================================================
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

const WEATHER_CONFIG = {
    clear: { name: "Temps Clair", icon: "☀️", modifiers: { all: 1 } },
    rain: { name: "Pluie", icon: "🌧️", modifiers: { ranged: 0.7, siege: 0.8, all: 1 } },
    fog: { name: "Brouillard", icon: "🌫️", modifiers: { all: 0.9 } }
};

const ARTEFACTS_CONFIG = {
    none: { name: "Aucun" },
    aegis: { name: "Égide de Minerve", bonus: { type: 'defense', value: 0.2 } },
    blade: { name: "Lame de Mars", bonus: { type: 'attack', value: 0.2 } }
};
const DECREES_CONFIG = {
    none: { name: "Aucun" },
    double_rations: { name: "Double Rations", effect: { type: 'morale_boost', value: 20 } },
    forced_conscription: { name: "Conscription Forcée", effect: { type: 'add_units', unit: 'legionnaire', count: 100 } }
};

let playerState = {};
let battleState = {};
let isSkipped = false;
let combatHistory = [];
let currentOpponent = null;

function initializePlayerState() {
    const savedState = localStorage.getItem('imperiumPlayerStateV18');
    if (savedState) {
        playerState = JSON.parse(savedState);
    } else {
        playerState = {
            resources: { gold: 20000, food: 5000 },
            units: {
                legionnaire: { count: 100, xp: 0 },
                archer: { count: 80, xp: 0 },
                cavalier: { count: 50, xp: 0 },
                praetorian: { count: 10, xp: 0 },
                battering_ram: { count: 5, xp: 0 },
                ballista: { count: 5, xp: 0 }
            },
            generals: {
                cesar: { loyalty: 80, xp: 0, level: 1 },
                scipio: { loyalty: 95, xp: 0, level: 1 },
                hannibal: { loyalty: 60, xp: 0, level: 1 }
            }
        };
    }
}

function savePlayerState() {
    localStorage.setItem('imperiumPlayerStateV18', JSON.stringify(playerState));
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

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('view-simulator')) {
        initializePlayerState();
        populateSelects();
        generateUnitSelectors();

        document.getElementById('simulate-battle').addEventListener('click', () => {
            const armies = getArmiesFromUI();
            simulateBattle(armies.attacker, armies.defender);
        });
        document.getElementById('reset-btn').addEventListener('click', resetSimulator);
        document.getElementById('scout-btn').addEventListener('click', scoutEnemy);
        document.getElementById('random-config-btn').addEventListener('click', () => {
            Object.keys(playerState.units).forEach(unit => {
                const unitInput = document.querySelector(`[data-side="attacker"][data-unit="${unit}"]`);
                if(unitInput) unitInput.value = Math.floor(Math.random() * (playerState.units[unit].count + 1));
            });
            scoutEnemy();
            calculateArmyStats();
        });
        document.querySelector('#view-simulator').addEventListener('input', (e) => {
            if (e.target.id === 'attacker-hero') {
                setupHeroAbilityButton();
            }
            calculateArmyStats();
        });
        document.getElementById('attacker-hero-ability').addEventListener('click', useHeroAbility);
        document.getElementById('skip-battle-btn').addEventListener('click', () => { isSkipped = true; });

        resetSimulator();
    }
});

function setupHeroAbilityButton() {
    const heroKey = document.getElementById('attacker-hero').value;
    const hero = HEROES_CONFIG[heroKey];
    const btn = document.getElementById('attacker-hero-ability');
    if (hero && hero.ability) {
        btn.style.display = 'block';
        btn.disabled = hero.ability.used;
        btn.textContent = hero.ability.used ? "Compétence utilisée" : "Utiliser Compétence";
    } else {
        btn.style.display = 'none';
    }
}

async function useHeroAbility() {
    if (!battleState.attacker) return;
    const heroKey = document.getElementById('attacker-hero').value;
    const hero = HEROES_CONFIG[heroKey];
    const btn = document.getElementById('attacker-hero-ability');
    const addLog = async (message, isSpecial = false) => {
        const reportEl = document.getElementById('battle-report');
        const entry = document.createElement('div');
        entry.className = 'log-entry' + (isSpecial ? ' special' : '');
        entry.textContent = message;
        reportEl.appendChild(entry);
        reportEl.scrollTop = reportEl.scrollHeight;
        await new Promise(resolve => setTimeout(resolve, 100));
    };

    if (hero && hero.ability && !hero.ability.used) {
        if (hero.ability.type === 'morale_boost') {
            battleState.attacker.morale = Math.min(100, battleState.attacker.morale + hero.ability.value);
            updateStatBar('attacker-morale-bar', battleState.attacker.morale, 100);
            await addLog("César inspire ses troupes ! Le moral remonte !", true);
        }
        hero.ability.used = true;
        btn.disabled = true;
        btn.textContent = "Compétence utilisée";
    }
}

function populateSelects() {
    const selects = {
        'attacker-hero': HEROES_CONFIG, 'defender-hero': HEROES_CONFIG,
        'terrain': TERRAINS_CONFIG,
        'attacker-formation': FORMATIONS_CONFIG, 'defender-formation': FORMATIONS_CONFIG,
        'attacker-artefact': ARTEFACTS_CONFIG,
        'decree': DECREES_CONFIG
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
    const available = side === 'attacker' ? (playerState.units[unitType]?.count || 0) : 0;
    const xp = side === 'attacker' ? (playerState.units[unitType]?.xp || 0) : 0;
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

function getRank(xp) {
    if (xp >= 1000) return { name: 'Élite', bonus: 0.2, percent: 100 };
    if (xp >= 300) return { name: 'Vétéran', bonus: 0.1, percent: (xp - 300) / 7 };
    return { name: 'Recrue', bonus: 0, percent: xp / 3 };
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
    document.querySelectorAll('#defender-units .unit-selector').forEach(el => {
        el.style.display = 'none';
    });
}

function calculateArmyStats() {
    let attackerUnits = 0;
    let defenderUnits = 0;
    document.querySelectorAll('.unit-input[data-unit]').forEach(input => {
        const { side } = input.dataset;
        const count = parseInt(input.value) || 0;
        if (side === 'attacker') {
            attackerUnits += count;
        } else {
            defenderUnits += count;
        }
    });
    const canSimulate = attackerUnits > 0 && defenderUnits > 0;
    document.getElementById('simulate-battle').disabled = !canSimulate;
    document.getElementById('simulation-status').textContent = !canSimulate ? "Ajoutez des troupes et espionnez l'ennemi" : "";
}

async function scoutEnemy() {
    const statusEl = document.getElementById('simulation-status');
    statusEl.textContent = "Espionnage en cours...";
    await new Promise(resolve => setTimeout(resolve, 1000));
    statusEl.textContent = "Rapport d'espionnage reçu !";
    document.querySelectorAll('#defender-units .unit-selector').forEach(el => {
        el.style.display = 'block';
        el.querySelector('input').value = Math.floor(Math.random() * 50);
    });
    calculateArmyStats();
}

function getArmiesFromUI() {
    const attacker = { army: {}, formation: FORMATIONS_CONFIG[document.getElementById('attacker-formation').value], hero: HEROES_CONFIG[document.getElementById('attacker-hero').value], morale: 100 };
    const defender = { army: {}, formation: FORMATIONS_CONFIG[document.getElementById('defender-formation').value], hero: HEROES_CONFIG[document.getElementById('defender-hero').value], morale: 100 };

    Object.keys(UNITS_CONFIG).forEach(unitKey => {
        const attackerCount = parseInt(document.querySelector(`[data-side="attacker"][data-unit="${unitKey}"]`).value) || 0;
        if (attackerCount > 0) {
            const rank = getRank(playerState.units[unitKey].xp);
            const veteranBonus = 1 + rank.bonus;
            attacker.army[unitKey] = { ...JSON.parse(JSON.stringify(UNITS_CONFIG[unitKey])), count: attackerCount, hasCharged: false, xp: playerState.units[unitKey].xp };
            attacker.army[unitKey].attack = Math.round(attacker.army[unitKey].attack * veteranBonus);
            attacker.army[unitKey].defense = Math.round(attacker.army[unitKey].defense * veteranBonus);
        }

        const defenderCount = parseInt(document.querySelector(`[data-side="defender"][data-unit="${unitKey}"]`).value) || 0;
        if (defenderCount > 0) defender.army[unitKey] = { ...JSON.parse(JSON.stringify(UNITS_CONFIG[unitKey])), count: defenderCount, hasCharged: false, xp: Math.random() * 500 };
    });

    return { attacker, defender };
}

function simulateBattle(attacker, defender) {
    return new Promise(async (resolve) => {
        isSkipped = false;
        document.getElementById('battle-modal-overlay').style.display = 'flex';
        document.getElementById('battle-result').style.display = 'none';
        document.getElementById('skip-battle-btn').style.display = 'inline-block';
        document.getElementById('close-modal-btn').style.display = 'none';
        document.getElementById('battle-report').innerHTML = '';

        battleState = { attacker, defender };

        const initialAttackerState = JSON.parse(JSON.stringify(attacker.army));
        const initialDefenderState = JSON.parse(JSON.stringify(defender.army));

        let weather = 'clear';

        const addLog = async (message, isSpecial = false) => {
            const reportEl = document.getElementById('battle-report');
            const entry = document.createElement('div');
            entry.className = 'log-entry' + (isSpecial ? ' special' : '');
            entry.textContent = message;
            reportEl.appendChild(entry);
            reportEl.scrollTop = reportEl.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, isSkipped ? 0 : 200));
        };

        await addLog("La bataille commence !", true);

        for (let round = 1; round <= 30; round++) {
            if (Object.keys(attacker.army).length === 0 || Object.keys(defender.army).length === 0) break;

            await addLog(`--- Tour ${round} ---`);

            await executeTurn(attacker, defender, initialDefenderState, 'Attaquant', addLog, weather);
            if (Object.keys(defender.army).length === 0) break;

            await executeTurn(defender, attacker, initialAttackerState, 'Défenseur', addLog, weather);
            if (Object.keys(attacker.army).length === 0) break;

            updateStatBar('attacker-morale-bar', attacker.morale, 100);
            updateStatBar('defender-morale-bar', defender.morale, 100);
        }

        const victory = Object.keys(defender.army).length === 0 && Object.keys(attacker.army).length > 0;
        displayBattleResult(victory, initialAttackerState, attacker.army, initialDefenderState, defender.army);

        document.getElementById('skip-battle-btn').style.display = 'none';
        document.getElementById('close-modal-btn').style.display = 'inline-block';

        document.getElementById('close-modal-btn').onclick = () => {
            document.getElementById('battle-modal-overlay').style.display = 'none';
            resolve({
                victory,
                finalAttacker: attacker.army,
                finalDefender: defender.army
            });
        };
    });
}

async function executeTurn(currentAttacker, currentDefender, initialDefenderState, attackerSide, addLog, weather) {
    const initialDefenderSize = Object.values(initialDefenderState).reduce((sum, unit) => sum + unit.count, 0);
    const weatherMod = WEATHER_CONFIG[weather].modifiers;

    for (const unitName in currentAttacker.army) {
        if (Object.keys(currentDefender.army).length === 0) break;

        const unit = currentAttacker.army[unitName];
        if (!unit || unit.count <= 0) continue;

        if (currentAttacker.morale < 33 && Math.random() > currentAttacker.morale / 100) {
            await addLog(`${attackerSide} : ${unit.name} x${unit.count} sont démoralisés et fuient !`, true);
            delete currentAttacker.army[unitName];
            continue;
        }
        const moraleModifier = currentAttacker.morale < 50 ? 0.75 : 1;
        const weatherModifier = weatherMod[unit.type] || weatherMod.all || 1;

        let damage = unit.count * unit.attack * moraleModifier * weatherModifier;

        if (unit.ability === 'charge' && !unit.hasCharged) {
            damage *= 1.75;
            unit.hasCharged = true;
            await addLog(`${attackerSide} : ${unit.name} chargent avec fureur !`, true);
        }

        let targetKey = unit.priority;
        if (!currentDefender.army[targetKey] || currentDefender.army[targetKey].count <= 0) {
            targetKey = Object.keys(currentDefender.army)[0];
        }
        if (!targetKey) continue;
        const target = currentDefender.army[targetKey];

        let defenseModifier = 1;
        if (target.ability === 'testudo' && unit.type === 'ranged') {
            defenseModifier = 3;
            await addLog(`Défenseur : Les ${target.name} forment la Tortue !`, true);
        }

        const unitsLost = Math.min(target.count, Math.floor(damage / (target.hp * defenseModifier)));
        if (unitsLost > 0) {
            target.count -= unitsLost;
            await addLog(`${attackerSide} : ${unit.name} x${unit.count} tuent ${unitsLost} ${target.name}.`);
            if (target.count <= 0) {
                delete currentDefender.army[targetKey];
                await addLog(`${target.name} ont été anéantis !`, true);
            }
        }
    }

    const finalDefenderSize = Object.values(currentDefender.army).reduce((sum, unit) => sum + unit.count, 0);
    if (initialDefenderSize > 0) {
        const totalLosses = initialDefenderSize - finalDefenderSize;
        const lossesPercent = totalLosses / initialDefenderSize;
        currentDefender.morale -= lossesPercent * 20;
        currentDefender.morale = Math.max(0, currentDefender.morale);
    }
}

function displayBattleResult(victory, initialAttacker, finalAttacker, initialDefender, finalDefender) {
    const resultContainer = document.getElementById('battle-result');
    const resultTitle = document.getElementById('result-title');

    resultContainer.style.display = 'block';
    resultContainer.classList.add('show', victory ? 'victory' : 'defeat');
    resultTitle.textContent = victory ? 'VICTOIRE !' : 'DÉFAITE !';

    const attackerLosses = calculateLosses(initialAttacker, finalAttacker);
    const defenderLosses = calculateLosses(initialDefender, finalDefender);

    document.getElementById('attacker-losses').innerHTML = formatLosses(attackerLosses);
    document.getElementById('defender-losses').innerHTML = formatLosses(defenderLosses);

    Object.keys(finalAttacker).forEach(unitKey => {
        const survived = finalAttacker[unitKey].count;
        if (survived > 0) {
            playerState.units[unitKey].xp += Math.round(Object.keys(defenderLosses).length * 10 / survived);
        }
    });

    Object.keys(attackerLosses).forEach(unitKey => {
        playerState.units[unitKey].count = Math.max(0, (playerState.units[unitKey].count || 0) - attackerLosses[unitKey]);
    });

    if (victory) {
        const goldLoot = Math.floor(Math.random() * 5000) + 1000;
        document.getElementById('loot-section').style.display = 'block';
        document.getElementById('battle-loot').innerHTML = `<div class="loot-item"><span>💰 Or</span><span class="loot-amount">+${goldLoot.toLocaleString()}</span></div>`;
    } else {
        document.getElementById('loot-section').style.display = 'none';
    }

    savePlayerState();
    generateUnitSelectors();
}

function calculateLosses(initial, final) {
    const losses = {};
    Object.keys(initial).forEach(unit => {
        const initialCount = initial[unit].count;
        const finalCount = final[unit] ? final[unit].count : 0;
        const lost = initialCount - finalCount;
        if(lost > 0) losses[unit] = lost;
    });
    return losses;
}

function formatLosses(losses) {
    let html = '';
    Object.keys(losses).forEach(unit => {
        if (losses[unit] > 0) {
            html += `<div class="loss-item"><span>${UNITS_CONFIG[unit].icon} ${UNITS_CONFIG[unit].name}</span><span class="loss-count">-${losses[unit]}</span></div>`;
        }
    });
    return html || '<div class="loss-item">Aucune perte</div>';
}

function resetSimulator() {
    document.querySelectorAll('.unit-input').forEach(input => input.value = 0);
    document.getElementById('wall-level').value = 5;
    document.getElementById('attacker-hero').value = 'none';
    document.getElementById('defender-hero').value = 'none';
    document.getElementById('terrain').value = 'plains';
    document.getElementById('attacker-formation').value = 'balanced';
    document.getElementById('defender-formation').value = 'balanced';
    document.getElementById('attacker-artefact').value = 'none';
    document.getElementById('decree').value = 'none';

    document.getElementById('battle-result').classList.remove('show');

    document.querySelectorAll('#defender-units .unit-selector').forEach(el => {
        el.style.display = 'none';
        el.querySelector('input').value = 0;
    });

    updateStatBar('attacker-morale-bar', 100, 100);
    updateStatBar('defender-morale-bar', 100, 100);
    updateStatBar('attacker-loyalty-bar', 100, 100);
    document.getElementById('weather-indicator').textContent = '☀️ Temps Clair';
    calculateArmyStats();
    setupHeroAbilityButton();
}

function clearCombatHistory() {
    combatHistory = [];
    localStorage.removeItem('imperiumCombatHistory');
    displayCombatHistory();
}

function displayCombatHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;
    container.innerHTML = '';
    if (combatHistory.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucune bataille enregistrée.</p>';
        return;
    }
    combatHistory.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = `history-item ${item.victory ? 'victory' : 'defeat'}`;
        const totalLosses = Object.values(item.losses).reduce((a, b) => a + b, 0);
        itemEl.innerHTML = `
            <span>Bataille #${combatHistory.length - index}</span>
            <span>${item.victory ? 'Victoire' : 'Défaite'}</span>
            <span>Pertes: ${totalLosses}</span>
        `;
        container.appendChild(itemEl);
    });
}
