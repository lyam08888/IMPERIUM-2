// ===============================================================
// IMPERIUM V19 - CITY-VIEW.JS
// ===============================================================
// Ce fichier contient la logique spécifique à la vue de la cité (index.html)
// ===============================================================

document.addEventListener('DOMContentLoaded', function() {
    if (typeof gameState === 'undefined' || !gameState) {
        console.error("GameState not found. Make sure game.js is loaded first.");
        return;
    }
    initializeCityUI();
    setInterval(cityGameTick, 1000);
    setInterval(saveGameState, 30000);
});

function initializeCityUI() {
    console.log("Initializing City View UI...");
    recalculateCityStats();
    updateAllCityUI();
}

function cityGameTick() {
    const now = Date.now();
    if (gameState.city.constructionQueue.length > 0 && now >= gameState.city.constructionQueue[0].endTime) {
        completeConstruction(gameState.city.constructionQueue[0]);
        gameState.city.constructionQueue.shift();
        recalculateCityStats();
        updateAllCityUI();
        saveGameState();
    }
    for (const res in gameState.city.production) {
        if (gameState.resources[res] !== undefined) {
            const gainPerSecond = (gameState.city.production[res] * gameState.city.stats.happinessModifier) / 3600;
            const currentRes = gameState.resources[res];
            const maxStorage = gameState.storage[res] || Infinity;
            if (currentRes < maxStorage && gainPerSecond > 0) {
                gameState.resources[res] = Math.min(currentRes + gainPerSecond, maxStorage);
            } else if (gainPerSecond < 0) {
                gameState.resources[res] += gainPerSecond;
            }
        }
    }
    if (gameState.city.stats.population < gameState.city.stats.populationCapacity && gameState.city.stats.happiness > 50) {
        const growthRate = (gameState.city.stats.happiness / 100) * 0.01;
        gameState.city.stats.population = Math.min(gameState.city.stats.population + growthRate, gameState.city.stats.populationCapacity);
    } else if (gameState.city.stats.happiness < 20) {
        gameState.city.stats.population = Math.max(0, gameState.city.stats.population - 0.005);
    }
    updateDashboardPreviews();
    renderTimers();
}

function renderCityGrid() {
    const grid = document.getElementById('buildingsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    gameState.city.buildings.forEach(building => {
        const slot = document.createElement('div');
        const isConstructing = gameState.city.constructionQueue.some(item => item.slotId === building.slotId);
        slot.className = `building-slot ${building.type ? 'occupied' : ''} ${isConstructing ? 'constructing' : ''}`;
        slot.dataset.slotId = building.slotId;
        if (isConstructing) {
            slot.innerHTML = `<div class="building-icon">🔨</div><div class="building-name">Construction...</div><div class="construction-timer"></div>`;
        } else if (building.type) {
            const def = BUILDING_DEFINITIONS[building.type];
            slot.innerHTML = `<div class="building-icon">${def.icon}</div><div class="building-name">${def.name}</div><div class="building-level">Niv. ${building.level}</div>`;
            slot.onclick = () => handleBuildingClick(building);
        } else {
            slot.innerHTML = `<div class="building-icon" style="font-size: 2.5rem; color: var(--gold-light);">+</div>`;
            slot.onclick = () => handleBuildingClick(building);
        }
        grid.appendChild(slot);
    });
    renderTimers();
}

function renderTimers() {
    const now = Date.now();
    document.querySelectorAll('.construction-timer').forEach(timerEl => {
        const slotEl = timerEl.closest('.building-slot');
        if (!slotEl) return;
        const slotId = parseInt(slotEl.dataset.slotId);
        const build = gameState.city.constructionQueue.find(item => item.slotId === slotId);
        if (build) {
            const remaining = Math.max(0, build.endTime - now);
            const seconds = Math.floor((remaining / 1000) % 60);
            const minutes = Math.floor((remaining / (1000 * 60)) % 60);
            const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
            timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    });
}

function updateDashboardPreviews() {
    document.getElementById('player-tile-preview').textContent = `Niveau ${gameState.player.level}`;
    document.getElementById('resources-tile-preview').textContent = `Or : ${Math.floor(gameState.resources.gold).toLocaleString()}`;
    document.getElementById('stats-tile-preview').textContent = `Population : ${Math.floor(gameState.city.stats.population).toLocaleString()}`;
    document.getElementById('production-tile-preview').textContent = `Or/h : ${Math.round(gameState.city.production.gold * gameState.city.stats.happinessModifier).toLocaleString()}`;
    const quest = QUESTS[gameState.city.activeQuestId];
    document.getElementById('quest-tile-preview').textContent = quest ? quest.description : "Terminé";
}

function updateAllCityUI() {
    renderCityGrid();
    updateDashboardPreviews();
}

function getCost(baseCosts, multiplier, level) {
    return baseCosts.map(cost => ({ res: cost.res, amount: Math.floor(cost.amount * Math.pow(multiplier, level)) }));
}

function getBuildTime(baseTime, level) {
    return baseTime * Math.pow(1.6, level);
}

function handleBuildingClick(building) {
    if (gameState.city.constructionQueue.some(item => item.slotId === building.slotId)) {
        showToast("Ce bâtiment est en cours de construction.", "error");
        return;
    }
    if (building.type) {
        const def = BUILDING_DEFINITIONS[building.type];
        const upgradeCosts = getCost(def.baseCost, def.upgradeCostMultiplier, building.level);
        const canAfford = upgradeCosts.every(c => gameState.resources[c.res] >= c.amount);
        const costsHtml = upgradeCosts.map(c => `<span style="color: ${gameState.resources[c.res] < c.amount ? 'var(--error-red)' : 'var(--text-light)'}">${c.amount.toLocaleString()} ${c.res}</span>`).join(', ');
        const time = getBuildTime(def.baseBuildTime, building.level);
        let bonusHtml = '';
        if (def.production) bonusHtml += `Production: ${Object.entries(def.production).map(([res, val]) => `+${val * (building.level + 1)} ${res}/h`).join(', ')}`;
        if (def.storage) { if (bonusHtml) bonusHtml += '<br>'; bonusHtml += `Stockage: ${Object.entries(def.storage).map(([res, val]) => `+${val.toLocaleString()} ${res}`).join(', ')}`; }
        if (def.housing) { if (bonusHtml) bonusHtml += '<br>'; bonusHtml += `Logements: +${def.housing.toLocaleString()}`; }
        const body = `<p>${def.description}</p><p>Niveau actuel : <strong>${building.level}</strong></p>
                    <div class="upgrade-info" style="background: rgba(15, 23, 42, 0.7); border-radius: 0.5rem; padding: 1rem; margin-top: 1rem; border: 1px solid var(--border-gold);">
                        <p><strong>Amélioration (Niv. ${building.level + 1}) :</strong></p>
                        <p>Coût : ${costsHtml}</p>
                        <p>Temps : ${Math.floor(time)} secondes</p>
                        <p>Bonus : ${bonusHtml}</p>
                    </div>`;
        const footer = `<button class="imperium-btn danger" onclick="demolishBuilding(${building.slotId})">Détruire</button>
                       <div>
                           <button class="imperium-btn" onclick="closeModal()">Fermer</button>
                           <button class="imperium-btn" onclick="startUpgrade(${building.slotId})" ${!canAfford || gameState.city.constructionQueue.length > 0 ? 'disabled' : ''}>Améliorer</button>
                       </div>`;
        showModal(`Gérer ${def.name}`, body, footer);
    } else {
        const buildOptions = Object.entries(BUILDING_DEFINITIONS).map(([type, def]) => {
            const costs = getCost(def.baseCost, def.upgradeCostMultiplier, 0);
            const canAfford = costs.every(c => gameState.resources[c.res] >= c.amount);
            let prereqMet = true;
            let prereqText = '';
            if (def.requires) {
                const requiredBuilding = gameState.city.buildings.find(b => b.type === def.requires.type);
                if (!requiredBuilding || requiredBuilding.level < def.requires.level) {
                    prereqMet = false;
                    prereqText = `<div style="color: var(--error-red); font-size: 0.7rem; font-style: italic; margin-top: 0.25rem;">Requiert: ${BUILDING_DEFINITIONS[def.requires.type].name} Niv. ${def.requires.level}</div>`;
                }
            }

const costsHtml = costs.map(c => `<span class="cost-item ${gameState.resources[c.res] < c.amount ? 'insufficient' : ''}">${c.amount.toLocaleString()} ${c.res}</span>`).join(', ');
return `<div class="build-item ${!canAfford || !prereqMet ? 'disabled' : ''}" ${canAfford && prereqMet ? `onclick="startBuild('${type}', ${building.slotId})"` : ''}>
    <div class="build-item-icon">${def.icon}</div>
    <div class="build-item-name">${def.name}</div>
    <div class="build-item-costs">${costsHtml}</div>
    ${prereqText}
</div>`;

        }).join('');
        const body = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem;">${buildOptions}</div>`;
        showModal('Construire un bâtiment', body, '');
    }
}

function startBuild(type, slotId) {
    if (gameState.city.constructionQueue.length > 0) { showToast("File de construction occupée.", "error"); return; }
    const def = BUILDING_DEFINITIONS[type];
    const costs = getCost(def.baseCost, def.upgradeCostMultiplier, 0);
    for (const cost of costs) {
        if (gameState.resources[cost.res] < cost.amount) {
            showToast(`Ressources insuffisantes.`, "error");
            return;
        }
    }
    costs.forEach(c => gameState.resources[c.res] -= c.amount);
    const buildTime = getBuildTime(def.baseBuildTime, 0);
    gameState.city.constructionQueue.push({ slotId, type, level: 1, endTime: Date.now() + buildTime * 1000, xpGain: def.xpGain });
    updateAllCityUI();
    saveGameState();
    closeModal();
}

function startUpgrade(slotId) {
    if (gameState.city.constructionQueue.length > 0) { showToast("File de construction occupée.", "error"); return; }
    const building = gameState.city.buildings.find(b => b.slotId === slotId);
    const def = BUILDING_DEFINITIONS[building.type];
    const costs = getCost(def.baseCost, def.upgradeCostMultiplier, building.level);
    for (const cost of costs) {
        if (gameState.resources[cost.res] < cost.amount) {
            showToast(`Ressources insuffisantes.`, "error");
            return;
        }
    }
    costs.forEach(c => gameState.resources[c.res] -= c.amount);
    const buildTime = getBuildTime(def.baseBuildTime, building.level);
    gameState.city.constructionQueue.push({ slotId, type: building.type, level: building.level + 1, endTime: Date.now() + buildTime * 1000, xpGain: def.xpGain * (building.level + 1) });
    updateAllCityUI();
    saveGameState();
    closeModal();
}

function demolishBuilding(slotId) {
    const building = gameState.city.buildings.find(b => b.slotId === slotId);
    if (!building || !building.type) return;
    const def = BUILDING_DEFINITIONS[building.type];
    for (let i = 0; i < building.level; i++) {
        const costs = getCost(def.baseCost, def.upgradeCostMultiplier, i);
        costs.forEach(c => { gameState.resources[c.res] += c.amount * 0.5; });
    }
    building.type = null;
    building.level = 0;
    recalculateCityStats();
    updateAllCityUI();
    saveGameState();
    closeModal();
    showToast("Bâtiment détruit.", "success");
}

function completeConstruction(item) {
    const building = gameState.city.buildings.find(b => b.slotId === item.slotId);
    if (building) {
        building.type = item.type;
        building.level = item.level;
        showToast(`${BUILDING_DEFINITIONS[item.type].name} (Niv. ${item.level}) terminé !`, "success");
        addXp(item.xpGain);
        checkQuestCompletion();
    }
}

function checkQuestCompletion() {
    const quest = QUESTS[gameState.city.activeQuestId];
    if (quest && quest.isComplete(gameState)) {
        showToast(`Objectif atteint : ${quest.description}`, "success");
        gameState.city.activeQuestId++;
        addXp(quest.reward.xp);
        quest.reward.resources.forEach(r => {
            gameState.resources[r.res] = Math.min(gameState.resources[r.res] + r.amount, gameState.storage[r.res] || Infinity);
        });
    }
}

function showModal(title, body, footer) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `<div class="modal-backdrop" onclick="closeModal()"></div><div class="modal-content"><div class="modal-header"><h3 class="modal-title">${title}</h3><button class="modal-close-btn" onclick="closeModal()">&times;</button></div><div class="modal-body">${body}</div><div class="modal-footer">${footer}</div></div>`;
    setTimeout(() => container.classList.add('active'), 10);
}

function closeModal() {
    const container = document.getElementById('modal-container');
    container.classList.remove('active');
    setTimeout(() => container.innerHTML = '', 300);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function showPlayerModal() {
    const xpForNextLevel = getXpForLevel(gameState.player.level);
    const xpPercentage = (gameState.player.xp / xpForNextLevel) * 100;
    const body = `...`;
    showModal("Profil du Consul", body, `<button class="imperium-btn" onclick="closeModal()">Fermer</button>`);
}

function showResourcesModal() {
    let body = '...';
    showModal("Inventaire des Ressources", body, `<button class="imperium-btn" onclick="closeModal()">Fermer</button>`);
}

function showStatsModal() {
    const body = `...`;
    showModal("Statistiques de la Cité", body, `<button class="imperium-btn" onclick="closeModal()">Fermer</button>`);
}

function showProductionModal() {

    let body = '...';

    showModal("Rapport de Production", body, `<button class="imperium-btn" onclick="closeModal()">Fermer</button>`);
}

function showQuestModal() {
    const quest = QUESTS[gameState.city.activeQuestId];
    let body = '...';
    showModal("Objectif Actuel", body, `<button class="imperium-btn" onclick="closeModal()">Fermer</button>`);
}
