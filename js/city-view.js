// ===============================================================
// IMPERIUM V19 - CITY-VIEW.JS
// ===============================================================
// Ce fichier contient la logique spécifique à la vue de la cité (index.html)
// ===============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Only initialize the full city view if we are on the main game page,
    // not on the intro/tutorial page.
    const mainBuildingsGrid = document.getElementById('buildingsGrid');
    if (!mainBuildingsGrid) {
        console.log("City View: Main buildings grid not found. Assuming this is the intro page. Skipping full UI initialization.");
        return; // Do not initialize game loop on intro page
    }

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

    // Setup periodic tip display
    const TIP_INTERVAL = 90 * 1000; // Every 90 seconds
    setInterval(() => {
        if (typeof TIPS !== 'undefined' && TIPS.length > 0) {
            const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
            showToast(`💡 Astuce : ${randomTip}`, 'info');
        }
    }, TIP_INTERVAL);
}

function cityGameTick() {
    const researchInProgress = gameState.city.researchQueue.length > 0 ? gameState.city.researchQueue[0] : null;
    const trainingInProgress = gameState.city.trainingQueue.length > 0 ? gameState.city.trainingQueue[0] : null;

    if (masterGameTick()) {
        if (researchInProgress && gameState.city.researchQueue.length === 0) {
            const tech = findTechnology(researchInProgress.techId);
            if(tech) showToast(`Recherche terminée : ${tech.name}!`, "success");
        }
        if (trainingInProgress && gameState.city.trainingQueue.length === 0) {
            const unitDef = UNITS_CONFIG[trainingInProgress.unitId];
            if(unitDef) showToast(`${trainingInProgress.amount} ${unitDef.name}(s) ont terminé leur formation !`, "success");
        }
        updateAllCityUI();
    }

    // --- Handle Pending Events ---
    if (gameState.pendingEvents && gameState.pendingEvents.length > 0) {
        // Only show if no modal is currently active
        if (!document.querySelector('#modal-container.active')) {
            const event = gameState.pendingEvents.shift(); // Get the first event and remove it
            const body = `<p>${event.description}</p><div style="margin-top: 1rem; padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: 0.25rem;"><strong>Effet :</strong> ${event.effectMessage}</div>`;
            const footer = `<button class="imperium-btn" onclick="closeModal()">Compris</button>`;
            showModal(`Événement : ${event.title}`, body, footer);
        }
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
            timerEl.textContent = formatTime(remaining);
        }
    });

    // Add research timer update
    const researchTimerEl = document.querySelector('#research-tile-preview .timer, .tech-node.in-progress .research-timer');
    if (researchTimerEl) {
        const research = gameState.city.researchQueue[0];
        if (research) {
            const remaining = Math.max(0, research.endTime - now);
            researchTimerEl.textContent = formatTime(remaining);
        } else {
             researchTimerEl.textContent = '';
        }
    }
}

function formatTime(ms) {
    if (ms <= 0) return "00:00:00";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateDashboardPreviews() {
    document.getElementById('player-tile-preview').textContent = `Niveau ${gameState.player.level}`;
    document.getElementById('resources-tile-preview').textContent = `Or : ${Math.floor(gameState.resources.gold).toLocaleString()}`;
    document.getElementById('stats-tile-preview').textContent = `Population : ${Math.floor(gameState.city.stats.population).toLocaleString()}`;
    document.getElementById('production-tile-preview').textContent = `Or/h : ${Math.round(gameState.city.production.gold * gameState.city.stats.happinessModifier).toLocaleString()}`;

    const quest = getCurrentQuest();
    document.getElementById('quest-tile-preview').textContent = quest ? quest.description : "Scénario terminé !";

    // Update Research Tile Preview
    const researchPreview = document.getElementById('research-tile-preview');
    if (researchPreview) {
        const currentResearch = gameState.city.researchQueue[0];
        if (currentResearch) {
            const tech = findTechnology(currentResearch.techId);
            researchPreview.innerHTML = `<div>${tech.name}</div><div class="timer"></div>`;
        } else {
            researchPreview.textContent = "Aucune recherche en cours.";
        }
    }
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

    if (building.type === 'barracks') {
        showBarracksModal(building);
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
          
            const costsHtml = costs.map(c => `<span style="color: ${gameState.resources[c.res] < c.amount ? 'var(--error-red)' : 'var(--text-light)'}">${c.amount.toLocaleString()} ${c.res}</span>`).join(', ');
            return `<div class="build-item ${!canAfford || !prereqMet ? 'disabled' : ''}" ${canAfford && prereqMet ? `onclick="startBuild('${type}', ${building.slotId})"` : ''} style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-gold); border-radius: 0.75rem; padding: 0.75rem; text-align: center; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                        <div style="font-size: 1.8rem;">${def.icon}</div>
                        <div style="font-weight: bold; margin: 0.25rem 0; color: var(--gold-light); font-size: 0.9rem;">${def.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${costsHtml}</div>
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
        // checkQuestCompletion is now called in the master tick
    }
}

function showModal(title, body, footer, customClass = '') {
    const container = document.getElementById('modal-container');
    const customClassStr = customClass ? ` ${customClass}` : '';
    container.innerHTML = `<div class="modal-backdrop" onclick="closeModal()"></div><div class="modal-content${customClassStr}"><div class="modal-header"><h3 class="modal-title">${title}</h3><button class="modal-close-btn" onclick="closeModal()">&times;</button></div><div class="modal-body">${body}</div><div class="modal-footer">${footer}</div></div>`;
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

function showPlayerModal(isEditing = false) {
    const player = gameState.player;
    const xpForNextLevel = getXpForLevel(player.level);
    const xpPercentage = xpForNextLevel > 0 ? (player.xp / xpForNextLevel) * 100 : 0;
    const avatars = ['M', 'F', '🏛️', '🦅', '⚔️', '📜'];

    let body;
    let footer;

    if (isEditing) {
        body = `
            <div class="player-profile-edit">
                <div class="form-group">
                    <label for="playerNameInput">Nom du Consul :</label>
                    <input type="text" id="playerNameInput" class="imperium-input" value="${player.name}">
                </div>
                <div class="form-group">
                    <label>Avatar :</label>
                    <div class="avatar-selection">
                        ${avatars.map(avatar => `
                            <div class="avatar-option ${player.avatar === avatar ? 'selected' : ''}" onclick="selectAvatar(this, '${avatar}')">
                                ${avatar}
                            </div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="playerAvatarInput" value="${player.avatar}">
                </div>
            </div>
        `;
        footer = `
            <button class="imperium-btn" onclick="showPlayerModal(false)">Annuler</button>
            <button class="imperium-btn" onclick="savePlayerProfile()">Sauvegarder</button>
        `;
    } else {
        body = `
            <div class="player-profile-view">
                <div class="profile-main-info">
                    <div class="profile-avatar">${player.avatar}</div>
                    <div class="profile-details">
                        <h4 class="profile-name">${player.name}</h4>
                        <p class="profile-title">${player.title}</p>
                        <p class="profile-level">Niveau ${player.level}</p>
                    </div>
                </div>
                <div class="xp-bar-container">
                    <div class="xp-bar" style="width: ${xpPercentage.toFixed(2)}%;"></div>
                </div>
                <p class="xp-text">${Math.floor(player.xp)} / ${xpForNextLevel} XP</p>
            </div>
        `;
        footer = `
            <button class="imperium-btn" onclick="closeModal()">Fermer</button>
            <button class="imperium-btn" onclick="showPlayerModal(true)">Personnaliser</button>
        `;
    }

    showModal("Profil du Consul", body, footer);
}

function selectAvatar(element, avatar) {
    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('playerAvatarInput').value = avatar;
}

function savePlayerProfile() {
    const newName = document.getElementById('playerNameInput').value;
    const newAvatar = document.getElementById('playerAvatarInput').value;

    if (newName.trim()) {
        gameState.player.name = newName.trim();
    }
    gameState.player.avatar = newAvatar;

    saveGameState();
    showToast("Profil mis à jour !", "success");
    showPlayerModal(false); // Re-render the modal in view mode
}

function showResourcesModal() {

    let body = '<div style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; align-items: center;">';
    const resourceIcons = { gold: '💰', food: '🌾', marble: '🏛️', wood: '🌲', stone: '🪨', spies: '👁️', divineFavor: '🙏' };
    for (const res in resourceIcons) {
        if (gameState.resources[res] !== undefined) {
            const current = Math.floor(gameState.resources[res]);
            const max = gameState.storage[res] || Infinity;
            body += `<span>${resourceIcons[res]} ${res.charAt(0).toUpperCase() + res.slice(1)}</span> <span style="text-align: right; color: ${current >= max ? 'var(--storage-full-red)' : 'var(--text-light)'}">${current.toLocaleString()}/${max.toLocaleString()}</span>`;
        }
    }
    body += '</div>';

    showModal("Inventaire des Ressources", body, `<button class="imperium-btn" onclick="closeModal()">Fermer</button>`);
}

function showStatsModal() {

    const body = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: center;">
            <div>
                <div style="font-size: 1.5rem; color: var(--gold-light);">${Math.floor(gameState.city.stats.population).toLocaleString()}/${gameState.city.stats.populationCapacity.toLocaleString()}</div>
                <div style="font-size: 0.9rem;">👥 Population</div>
            </div>
            <div>
                <div style="font-size: 1.5rem; color: var(--gold-light);">${gameState.city.stats.happiness}%</div>
                <div style="font-size: 0.9rem;">😊 Bonheur</div>
            </div>
        </div>
    `;

    showModal("Statistiques de la Cité", body, `<button class="imperium-btn" onclick="closeModal()">Fermer</button>`);
}

function showProductionModal() {

    let body = '<div class="production-display" style="display: flex; flex-direction: column; gap: 0.5rem;">';

    // Production from buildings
    Object.entries(gameState.city.production).filter(([res]) => ['gold', 'food', 'marble'].includes(res)).forEach(([res, rate]) => {
        const iconMap = { gold: '💰', food: '🌾', marble: '🏛️' };
        const effectiveRate = rate * gameState.city.stats.happinessModifier;
        const rateClass = effectiveRate >= 0 ? 'positive' : 'negative';
        const sign = effectiveRate >= 0 ? '+' : '';
        body += `<div class="production-item" style="display: flex; justify-content: space-between;"><span>${iconMap[res]} Production</span> <span style="color: ${rateClass === 'positive' ? 'var(--success-green)' : 'var(--error-red)'}">${sign}${Math.round(effectiveRate).toLocaleString()}/h</span></div>`;
    });

    // Consumption by armies
    const totalConsumption = gameState.legions.reduce((sum, legion) => {
        return sum + Math.ceil((legion.strength / 1000) * GAME_CONFIG.SUPPLY_CONSUMPTION_PER_1000_TROOPS);
    }, 0);
    // Convert per-turn consumption to per-hour for consistency (assuming a turn is like an hour for now)
    const hourlyConsumption = totalConsumption; // Simplified for now
    if(hourlyConsumption > 0) {
        body += `<div class="production-item" style="display: flex; justify-content: space-between;"><span>🌾 Entretien des armées</span> <span style="color: var(--error-red)">-${hourlyConsumption.toLocaleString()}/h</span></div>`;
    }

    body += '</div>';

    showModal("Rapport de Production", body, `<button class="imperium-btn" onclick="closeModal()">Fermer</button>`);
}

function showQuestModal() {

    const activeQuests = QUESTS.filter(q => !q.isComplete(gameState));
    const completedQuests = QUESTS.filter(q => q.isComplete(gameState));

    let body = `
        <div class="quest-log">
            <div class="quest-tabs">
                <button class="quest-tab-btn active" onclick="switchQuestTab(this, 'active')">En cours</button>
                <button class="quest-tab-btn" onclick="switchQuestTab(this, 'completed')">Terminées</button>
            </div>
            <div id="quest-tab-active" class="quest-tab-content active">
                ${activeQuests.length > 0 ? activeQuests.map(quest => renderQuest(quest, false)).join('') : '<p class="no-quests">Aucune quête active.</p>'}
            </div>
            <div id="quest-tab-completed" class="quest-tab-content">
                ${completedQuests.length > 0 ? completedQuests.map(quest => renderQuest(quest, true)).join('') : '<p class="no-quests">Aucune quête terminée.</p>'}
            </div>
        </div>
    `;

    showModal("Journal des Quêtes", body, `<button class="imperium-btn" onclick="closeModal()">Fermer</button>`);
}

function renderQuest(quest, isComplete) {
    const rewardText = (quest.reward.resources || []).map(r => `${r.amount.toLocaleString()} ${r.res}`).join(', ') + (quest.reward.xp > 0 ? ` & ${quest.reward.xp} XP` : '');
    return `
        <div class="quest-item ${isComplete ? 'completed' : ''}">
            <div class="quest-status-icon">${isComplete ? '✔️' : '🎯'}</div>
            <div class="quest-details">
                <p class="quest-description">${quest.description}</p>
                <p class="quest-reward">Récompense : ${rewardText}</p>
            </div>
        </div>
    `;
}

function switchQuestTab(btn, tabName) {
    document.querySelectorAll('.quest-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.quest-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`quest-tab-${tabName}`).classList.add('active');

}

function showBarracksModal(building) {
    let body = '<div>';

    // Section 1: Unit Pool
    body += '<h4>Unités en réserve</h4><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; margin-bottom: 1.5rem; text-align: center;">';
    for(const unitId in gameState.unitPool) {
        body += `<div style="background: rgba(15, 23, 42, 0.7); padding: 0.5rem; border-radius: 0.5rem;">
            <div>${UNITS_CONFIG[unitId].icon} ${UNITS_CONFIG[unitId].name}</div>
            <div style="font-size: 1.2rem; font-weight: bold;">${gameState.unitPool[unitId].toLocaleString()}</div>
        </div>`;
    }
    body += '</div>';

    // Section 2: Training Queue
    body += '<h4>File d\'entraînement</h4>';
    if (gameState.city.trainingQueue.length > 0) {
        const item = gameState.city.trainingQueue[0];
        const unitDef = UNITS_CONFIG[item.unitId];
        const remaining = Math.max(0, item.endTime - Date.now());
        body += `<div style="border: 1px solid var(--border-gold); padding: 1rem; border-radius: 0.5rem;">
            Entraînement de ${item.amount} ${unitDef.name}(s)... <span class="timer">${formatTime(remaining)}</span>
        </div>`;
    } else {
        body += '<p>Aucune unité en entraînement.</p>';
    }

    // Section 3: Train New Units
    body += '<h4 style="margin-top: 1.5rem;">Entraîner de nouvelles unités</h4><div style="display: flex; flex-direction: column; gap: 0.5rem;">';
    Object.entries(UNITS_CONFIG).forEach(([unitId, unitDef]) => {
        let canTrain = true;
        let requirementText = '';
        if (unitDef.requires) {
            const reqBuilding = gameState.city.buildings.find(b => b.type === unitDef.requires.building);
            if (!reqBuilding || reqBuilding.level < unitDef.requires.level) {
                canTrain = false;
                requirementText = `<div style="font-size: 0.8em; color: var(--error-red);">Requiert Caserne Niv. ${unitDef.requires.level}</div>`;
            }
        }

        const costsHtml = unitDef.cost.map(c => `${c.amount} ${c.res}`).join(', ');

        body += `<div style="border: 1px solid var(--border-gold); padding: 1rem; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center; opacity: ${!canTrain ? 0.5 : 1};">
            <div>
                <div style="font-weight: bold; color: var(--gold-light);">${unitDef.icon} ${unitDef.name}</div>
                <div style="font-size: 0.8em; color: var(--text-muted);">${costsHtml} | ${unitDef.trainTime}s par unité</div>
                ${requirementText}
            </div>
            <div style="display: flex; align-items:center; gap: 0.5rem;">
                <input type="number" id="train-amount-${unitId}" value="1" min="1" max="100" style="width: 60px; padding: 0.5rem; background: var(--dark-bg); border: 1px solid var(--border-gold); color: var(--text-light); border-radius: 0.25rem;">
                <button class="imperium-btn" onclick="handleTrainClick('${unitId}')" ${!canTrain || gameState.city.trainingQueue.length > 0 ? 'disabled' : ''}>Entraîner</button>
            </div>
        </div>`;
    });
    body += '</div>';

    body += '</div>';
    showModal(`Caserne (Niveau ${building.level})`, body, `<button class="imperium-btn" onclick="closeModal()">Fermer</button>`);
}

function handleTrainClick(unitId) {
    const amount = parseInt(document.getElementById(`train-amount-${unitId}`).value);
    if (!amount || amount <= 0) {
        showToast("Quantité invalide.", "error");
        return;
    }
    const result = startTraining(unitId, amount);
    if (result.success) {
        showToast("L'entraînement a commencé !", "success");
        const building = gameState.city.buildings.find(b => b.type === 'barracks');
        showBarracksModal(building); // Refresh modal
    } else {
        showToast(result.message, "error");
    }
}

async function showTerrestrialCombatModal() {
    const modalBody = `
        <div id="terrestrial-combat-simulator-container" style="width: 100%; height: 100%; overflow: auto;">
            <p>Chargement du simulateur de combat...</p>
        </div>
    `;
    // We use the existing modal system from city-view.js
    // We give it a custom class to make it full-screen
    showModal('Simulateur de Combat Terrestre', modalBody, '', 'modal-fullscreen');

    const container = document.getElementById('terrestrial-combat-simulator-container');
    if (!container) {
        console.error("Simulator container not found in modal.");
        return;
    }

    try {
        const response = await fetch('Simulateur.html');
        if (!response.ok) throw new Error('Failed to fetch simulator HTML');
        const htmlText = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // Extract the main view and the battle result modal from the simulator page
        const simulatorView = doc.getElementById('view-simulator');
        const battleModal = doc.getElementById('battle-modal-overlay');

        if (!simulatorView || !battleModal) {
            throw new Error('Could not find required elements in simulator HTML');
        }

        // Inject both parts into our container
        // We also need to append the battle modal overlay to the body so it can be properly displayed full screen
        document.body.appendChild(battleModal);
        container.innerHTML = simulatorView.innerHTML;

        // The close button of the original modal should now close the battle modal overlay as well
        const closeModalBtn = document.querySelector('.modal-fullscreen .modal-close-btn');
        if(closeModalBtn) {
            closeModalBtn.onclick = () => {
                const battleModalEl = document.getElementById('battle-modal-overlay');
                if(battleModalEl) battleModalEl.remove();
                closeModal();
            };
        }


        // Now that the HTML is in the DOM, initialize the simulator's JavaScript
        if (typeof initializeSimulatorUI === 'function') {
            initializeSimulatorUI();
        } else {
            throw new Error('initializeSimulatorUI function not found. Ensure simulator-view.js is loaded.');
        }

    } catch (error) {
        container.innerHTML = `<p style="color: var(--error-red);">Erreur : Impossible de charger le simulateur de combat. ${error.message}</p>`;
        console.error("Failed to load terrestrial combat simulator:", error);
    }
}

function showTechModal() {
    let body = '<div class="tech-tree-container">';

    // Tabs for categories
    body += '<div class="tech-tabs" style="display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-gold); margin-bottom: 1rem;">';
    Object.keys(TECHNOLOGY_DEFINITIONS).forEach((catId, index) => {
        body += `<button class="imperium-btn" style="background: transparent; border: none; border-bottom: 2px solid transparent;" data-tab-btn="${catId}" onclick="switchTechTab(this, '${catId}')">${TECHNOLOGY_DEFINITIONS[catId].name}</button>`;
    });
    body += '</div>';

    // Content for each category
    Object.entries(TECHNOLOGY_DEFINITIONS).forEach(([catId, category]) => {
        body += `<div id="tech-tab-${catId}" class="tech-tab-content" style="display: none; flex-direction: column; gap: 0.5rem;">`;
        Object.entries(category.technologies).forEach(([techId, tech]) => {
            const isResearched = gameState.researchedTechs.includes(techId);
            const isBeingResearched = gameState.city.researchQueue.some(item => item.techId === techId);
            const canAfford = tech.cost.every(c => gameState.resources[c.res] >= c.amount);
            const reqsMet = tech.requirements.every(req => gameState.researchedTechs.includes(req));

            let statusClass = '';
            let statusText = '';
            if (isResearched) { statusClass = 'researched'; statusText = 'Terminé'; }
            else if (isBeingResearched) { statusClass = 'in-progress'; statusText = 'En cours'; }
            else if (!reqsMet) { statusClass = 'locked'; statusText = 'Verrouillé'; }
            else if (!canAfford) { statusClass = 'locked'; statusText = 'Fonds insuffisants'; }

            const costsHtml = tech.cost.map(c => `<span style="color: ${gameState.resources[c.res] < c.amount ? 'var(--error-red)' : 'var(--text-light)'}">${c.amount.toLocaleString()} ${c.res}</span>`).join(', ');

            body += `<div class="tech-node ${statusClass}" style="border: 1px solid var(--border-gold); padding: 1rem; border-radius: 0.5rem; display: flex; justify-content: space-between; align-items: center; opacity: ${statusClass === 'locked' || statusClass === 'researched' ? 0.6 : 1};">
                <div>
                    <div class="tech-name" style="font-weight: bold; color: var(--gold-light);">${tech.name}</div>
                    <div class="tech-desc" style="font-size: 0.9em;">${tech.description}</div>
                    <div class="tech-cost" style="font-size: 0.8em; color: var(--text-muted);">${costsHtml} | ${formatTime(tech.researchTime * 1000)}</div>
                </div>
                <button class="imperium-btn" onclick="handleTechClick('${techId}')" ${statusClass !== '' || gameState.city.researchQueue.length > 0 ? 'disabled' : ''}>
                    ${statusText || 'Rechercher'}
                </button>
            </div>`;
        });
        body += `</div>`;
    });

    body += '</div>';

    showModal("Arbre Technologique", body, `<button class="imperium-btn" onclick="closeModal()">Fermer</button>`);

    // Activate the first tab
    switchTechTab(document.querySelector('.tech-tabs button'), Object.keys(TECHNOLOGY_DEFINITIONS)[0]);
}

function switchTechTab(btn, catId) {
    document.querySelectorAll('[data-tab-btn]').forEach(b => b.style.borderBottomColor = 'transparent');
    btn.style.borderBottomColor = 'var(--gold-primary)';
    document.querySelectorAll('.tech-tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(`tech-tab-${catId}`).style.display = 'flex';
}

function handleTechClick(techId) {
    const isResearched = gameState.researchedTechs.includes(techId);
    const isBeingResearched = gameState.city.researchQueue.some(item => item.techId === techId);
    if (isResearched || isBeingResearched) return;

    const result = startResearch(techId);
    if (result.success) {
        showToast("La recherche a commencé !", "success");
        updateAllCityUI();
        showTechModal(); // Re-render modal
    } else {
        showToast(result.message, "error");
    }
}
