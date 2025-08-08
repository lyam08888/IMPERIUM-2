// ===============================================================
// IMPERIUM V19 - WORLD-VIEW.JS
// ===============================================================
// Ce fichier contient la logique spécifique à la vue du monde (MondeAntique.html)
// ===============================================================

document.addEventListener('DOMContentLoaded', function() {
    if (typeof gameState === 'undefined' || !gameState) {
        console.error("GameState not found. Make sure game.js is loaded first.");
        return;
    }

    initializeWorldUI();
});

const statusTexts = { 'capital': 'Capitale', 'controlled': 'Contrôlé', 'ally': 'Allié', 'neutral': 'Neutre', 'enemy': 'Ennemi' };

function initializeWorldUI() {
    console.log("Initializing World View UI...");
    const worldMap = document.getElementById('world-map');
    const mapContent = document.getElementById('map-content');

    if(worldMap && mapContent) {
        MapManager.init(worldMap, mapContent);
    }

    setupEventListeners();
    rerenderWorldView();
}

function rerenderWorldView() {
    renderMap();
    renderCommandGrid();
    updatePreview('command');
}

function renderMap() {
    const mapContent = document.getElementById('map-content');
    if(!mapContent) return;

    mapContent.innerHTML = '';
    gameState.world.territories.forEach(territory => {
        const marker = document.createElement('div');
        marker.className = `world-marker ${territory.status}`;
        marker.innerHTML = territory.flag;
        if (territory.status === 'controlled' || territory.status === 'capital') {
            const loyaltyIcon = document.createElement('div');
            loyaltyIcon.className = 'marker-icon';
            loyaltyIcon.style.backgroundColor = territory.loyalty > 60 ? 'var(--success-green)' : territory.loyalty > 30 ? 'var(--gold-primary)' : 'var(--error-red)';
            marker.appendChild(loyaltyIcon);
        }
        marker.style.left = `${territory.x}%`;
        marker.style.top = `${territory.y}%`;
        marker.addEventListener('click', () => showTerritoryModal(territory));
        mapContent.appendChild(marker);
    });

    gameState.legions.forEach(legion => {
        const territory = gameState.world.territories.find(t => t.id === legion.locationId);
        const marker = document.createElement('div');
        marker.className = 'legion-marker';
        marker.innerHTML = 'I';
        marker.style.left = `calc(${territory.x}% + 5px)`;
        marker.style.top = `calc(${territory.y}% + 5px)`;

        // Visual feedback for moving legions
        if (legion.action === 'moving') {
            marker.style.opacity = '0.6';
            marker.innerHTML = '➤';
        }

        // Change color if out of supply
        if (legion.supply <= 25) {
            marker.style.background = 'var(--roman-red)';
        }

        marker.addEventListener('click', (e) => { e.stopPropagation(); showLegionModal(legion); });
        mapContent.appendChild(marker);
    });
}

function renderCommandGrid() {
    const commandGrid = document.getElementById('command-grid');
    if(!commandGrid) return;
    commandGrid.innerHTML = `
        <div class="action-tile active" data-action="command"><div class="tile-icon">🏛️</div><div class="tile-title">Commandement</div></div>
        <div class="action-tile" data-action="missions"><div class="tile-icon">🎯</div><div class="tile-title">Missions</div></div>
        <div class="action-tile" data-action="spying"><div class="tile-icon">👁️</div><div class="tile-title">Espionnage</div></div>
        <div class="action-tile" data-action="resources"><div class="tile-icon">💰</div><div class="tile-title">Ressources</div></div>
        <div class="action-tile" data-action="end-turn"><div class="tile-icon">✅</div><div class="tile-title">Fin du Tour</div></div>
    `;
}

function updatePreview(action) {
    const previewText = document.getElementById('command-preview-text');
    if(!previewText) return;

    let text = '';
    document.querySelectorAll('.action-tile').forEach(t => t.classList.remove('active'));
    const activeTile = document.querySelector(`.action-tile[data-action="${action}"]`);
    if(activeTile) activeTile.classList.add('active');

    switch(action) {
        case 'command': text = 'Gérez les aspects internes et externes de votre empire.'; break;
        case 'missions': text = 'Consultez vos objectifs actuels.'; break;
        case 'spying': text = `Utilisez vos espions pour découvrir les secrets de vos rivaux. Espions disponibles : ${gameState.resources.spies}`; break;
        case 'resources': text = `Or: ${Math.floor(gameState.resources.gold).toLocaleString()}`; break;
        case 'end-turn': text = `Passez au tour suivant (Tour ${gameState.world.turn}).`; break;
    }
    previewText.textContent = text;
}

function setupEventListeners() {
    const modal = document.getElementById('customModal');
    const closeButton = modal.querySelector('.close-button');
    const modalButtons = document.getElementById('modalButtons');
    const commandGrid = document.getElementById('command-grid');

    if(closeButton) closeButton.onclick = () => hideModal();
    if(modal) modal.onclick = (e) => { if (e.target === modal) hideModal(); };

    if(modalButtons) modalButtons.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || btn.classList.contains('cancel')) {
            hideModal();
            return;
        }
        const action = btn.dataset.action;
        if (action === 'recruit_legion') {
            recruitLegion(btn.dataset.id);
            hideModal();
        }
    });

    if(commandGrid) {
        commandGrid.addEventListener('mouseover', (e) => {
            const tile = e.target.closest('.action-tile');
            if (tile) updatePreview(tile.dataset.action);
        });
        commandGrid.addEventListener('click', (e) => {
            const tile = e.target.closest('.action-tile');
            if (!tile) return;
            const action = tile.dataset.action;
            if (action === 'end-turn') endTurn();
            if (action === 'resources') showResourcesModal();
            if (action === 'spying') showSpyActionModal();
        });
    }
}

function showSpyActionModal() {
    if (gameState.resources.spies < 1) {
        showNotification("Vous n'avez pas d'espions disponibles.", "error");
        return;
    }

    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalButtons = document.getElementById('modalButtons');

    modalTitle.innerHTML = "Action d'Espionnage";
    let body = `<p>Sélectionnez une cible pour votre mission d'espionnage (coût : 1 espion).</p><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">`;

    gameState.world.territories.forEach(territory => {
        if (territory.status !== 'capital' && territory.status !== 'controlled') {
            body += `<button class="imperium-btn" style="padding: 1rem;" onclick="performSpyMission('${territory.id}')">${territory.flag} ${territory.name}</button>`;
        }
    });
    body += `</div>`;

    modalBody.innerHTML = body;
    modalButtons.innerHTML = `<button class="modal-btn cancel" style="margin-top: 1rem;">Annuler</button>`;
    showModal();
}

function performSpyMission(territoryId) {
    const cost = 1;
    if (gameState.resources.spies < cost) {
        showNotification("Pas assez d'espions.", "error");
        return;
    }

    gameState.resources.spies -= cost;
    const targetTerritory = gameState.world.territories.find(t => t.id === territoryId);

    // Simple success chance
    const successChance = 0.7; // 70%
    if (Math.random() < successChance) {
        let report = `Rapport d'espionnage de ${targetTerritory.name}: `;
        if (targetTerritory.units && Object.keys(targetTerritory.units).length > 0) {
            const units = Object.entries(targetTerritory.units).map(([id, count]) => `${UNITS_CONFIG[id].icon} ${count}`).join(', ');
            report += `Forces détectées : ${units}.`;
        } else {
            report += "Aucune force militaire significative détectée.";
        }
        showNotification(report, 'success');
    } else {
        showNotification(`Votre espion a été capturé en essayant d'infiltrer ${targetTerritory.name} !`, 'error');
    }

    hideModal();
    rerenderWorldView(); // To update spy count in preview
    saveGameState();
}

function showTerritoryModal(territory) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalButtons = document.getElementById('modalButtons');

    modalTitle.innerHTML = `${territory.flag} ${territory.name}`;
    let body = `<p>Statut : <strong>${statusTexts[territory.status]}</strong></p>`;
    let buttons = '';

    switch (territory.status) {
        case 'capital':
        case 'controlled':
            body += `<p>Loyauté : ${territory.loyalty}%</p>`;
            if (territory.status === 'capital') {
                buttons += `<button class="modal-btn" data-action="recruit_legion" data-id="${territory.id}">Levez une Légion (1000 Or)</button>`;
            }
            break;
        case 'neutral':
            body += `<p>Relations : ${territory.relations}</p>`;
            buttons += `<button class="modal-btn" onclick="improveRelations('${territory.id}')">Améliorer les relations (500 Or)</button>`;
            buttons += `<button class="modal-btn" onclick="declareWar('${territory.id}')">Déclarer la guerre</button>`;
            break;
        case 'enemy':
            const units = Object.entries(territory.units || {}).map(([id, count]) => `${UNITS_CONFIG[id].icon} ${count}`).join(' ');
            body += `<p>Forces en présence : ${units}</p>`;
            break;
    }

    buttons += `<button class="modal-btn cancel">Fermer</button>`;

    modalBody.innerHTML = body;
    modalButtons.innerHTML = `<div style="display: flex; flex-direction: column; gap: 0.5rem;">${buttons}</div>`;
    showModal();
}

function showLegionModal(legion) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalButtons = document.getElementById('modalButtons');

    if (!legion) return;

    const territory = gameState.world.territories.find(t => t.id === legion.locationId);

    modalTitle.innerHTML = legion.name;
    let unitsHtml = '<ul style="list-style-position: inside;">';
    for (const unitId in legion.units) {
        unitsHtml += `<li>${UNITS_CONFIG[unitId].icon} ${UNITS_CONFIG[unitId].name}: ${legion.units[unitId]}</li>`;
    }
    unitsHtml += '</ul>';

    let body = `<p>Général: ${legion.general}</p>
                <div style="margin-top: 0.5rem;"><strong>Unités:</strong>${unitsHtml}</div>
                <p style="margin-top: 0.5rem;">Ravitaillement: <span style="color: ${legion.supply > 25 ? 'var(--text-light)' : 'var(--error-red)'}">${legion.supply}%</span></p>
                <p>Position: ${territory.name}</p>`;
    modalBody.innerHTML = body;

    let buttons = '';
    if (legion.action === 'moving') {
        const targetName = gameState.world.territories.find(t => t.id === legion.targetId)?.name || 'Inconnue';
        buttons += `<div style="text-align: center; width: 100%; padding: 0.5rem 0;">En mouvement vers ${targetName}...</div>`;
    } else {
        if (territory.status === 'capital' || territory.status === 'controlled') {
            buttons += `<button class="modal-btn" onclick="showManageLegionModal('${legion.id}')">Gérer</button>`;
        }
        buttons += `<button class="modal-btn" onclick="showMoveLegionModal('${legion.id}')">Déplacer</button>`;
        if (territory && territory.status === 'enemy') {
            buttons += `<button class="modal-btn" onclick="attackTerritory('${legion.id}', '${territory.id}')">Attaquer ${territory.name}</button>`;
        }
    }
    buttons += `<button class="modal-btn cancel">Fermer</button>`;
    modalButtons.innerHTML = `<div style="display: flex; flex-direction: column; gap: 0.5rem;">${buttons}</div>`;

    showModal();
}

function showMoveLegionModal(legionId) {
    const legion = gameState.legions.find(l => l.id === legionId);
    if (!legion) return;

    const currentTerritory = gameState.world.territories.find(t => t.id === legion.locationId);
    if (!currentTerritory || !currentTerritory.neighbors) {
        hideModal();
        showNotification("Impossible de se déplacer depuis ce territoire.", "error");
        return;
    }

    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalButtons = document.getElementById('modalButtons');

    modalTitle.innerHTML = `Déplacer ${legion.name}`;
    let body = `<p>Sélectionnez une destination :</p><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">`;
    currentTerritory.neighbors.forEach(neighborId => {
        const neighbor = gameState.world.territories.find(t => t.id === neighborId);
        if (neighbor) {
            body += `<button class="imperium-btn" style="padding: 1rem;" onclick="orderLegionMove('${legion.id}', '${neighborId}')">${neighbor.flag} ${neighbor.name}</button>`;
        }
    });
    body += `</div>`;

    modalBody.innerHTML = body;
    modalButtons.innerHTML = `<button class="modal-btn cancel" style="margin-top: 1rem;">Annuler</button>`;
    showModal();
}

function orderLegionMove(legionId, targetTerritoryId) {
    const legion = gameState.legions.find(l => l.id === legionId);
    const targetTerritory = gameState.world.territories.find(t => t.id === targetTerritoryId);
    if (legion && targetTerritory) {
        legion.action = 'moving';
        legion.targetId = targetTerritoryId;
        hideModal();
        rerenderWorldView();
        showNotification(`${legion.name} se déplace vers ${targetTerritory.name}. Arrivée au prochain tour.`, 'success');
        saveGameState();
    }
}

function attackTerritory(legionId, territoryId) {
    const attackerLegion = gameState.legions.find(l => l.id === legionId);
    const defenderTerritory = gameState.world.territories.find(t => t.id === territoryId);
    if (!attackerLegion || !defenderTerritory || !defenderTerritory.units) return;

    // --- Setup Combat ---
    const createArmy = (units, supply) => {
        let army = {};
        for (const unitId in units) {
            army[unitId] = { ...UNITS_CONFIG[unitId], count: units[unitId] };
            // Apply supply modifier to stats
            if (supply) {
                const supplyModifier = Math.max(0.2, supply / 100);
                army[unitId].attack *= supplyModifier;
                army[unitId].defense *= supplyModifier;
            }
        }
        return army;
    };

    let attackerArmy = createArmy(attackerLegion.units, attackerLegion.supply);
    let defenderArmy = createArmy(defenderTerritory.units);

    const initialAttackerCount = Object.values(attackerArmy).reduce((s, u) => s + u.count, 0);
    const initialDefenderCount = Object.values(defenderArmy).reduce((s, u) => s + u.count, 0);

    // --- Combat Loop ---
    const MAX_ROUNDS = 20;
    for (let i = 0; i < MAX_ROUNDS; i++) {
        const attackerUnitTypes = Object.keys(attackerArmy).filter(id => attackerArmy[id].count > 0);
        const defenderUnitTypes = Object.keys(defenderArmy).filter(id => defenderArmy[id].count > 0);

        if (attackerUnitTypes.length === 0 || defenderUnitTypes.length === 0) break;

        const roundDamage = { attacker: {}, defender: {} };

        // Calculate damage from attacker
        attackerUnitTypes.forEach(atkId => {
            const unitGroup = attackerArmy[atkId];
            const targetType = unitGroup.priority;
            const targetId = defenderUnitTypes.includes(targetType) ? targetType : defenderUnitTypes[Math.floor(Math.random() * defenderUnitTypes.length)];
            const totalDamage = unitGroup.attack * unitGroup.count;
            roundDamage.defender[targetId] = (roundDamage.defender[targetId] || 0) + totalDamage;
        });

        // Calculate damage from defender
        defenderUnitTypes.forEach(atkId => {
            const unitGroup = defenderArmy[atkId];
            const targetType = unitGroup.priority;
            const targetId = attackerUnitTypes.includes(targetType) ? targetType : attackerUnitTypes[Math.floor(Math.random() * attackerUnitTypes.length)];
            const totalDamage = unitGroup.attack * unitGroup.count;
            roundDamage.attacker[targetId] = (roundDamage.attacker[targetId] || 0) + totalDamage;
        });

        // Apply damage and calculate losses
        Object.entries(roundDamage.defender).forEach(([defId, totalDamage]) => {
            const targetGroup = defenderArmy[defId];
            const losses = Math.floor(totalDamage / (targetGroup.defense + targetGroup.hp));
            targetGroup.count = Math.max(0, targetGroup.count - losses);
        });
        Object.entries(roundDamage.attacker).forEach(([defId, totalDamage]) => {
            const targetGroup = attackerArmy[defId];
            const losses = Math.floor(totalDamage / (targetGroup.defense + targetGroup.hp));
            targetGroup.count = Math.max(0, targetGroup.count - losses);
        });
    }

    // --- Outcome ---
    const finalAttackerCount = Object.values(attackerArmy).reduce((s, u) => s + u.count, 0);
    const finalDefenderCount = Object.values(defenderArmy).reduce((s, u) => s + u.count, 0);
    const victory = finalAttackerCount > 0 && finalDefenderCount === 0;

    // Update gameState
    for (const unitId in attackerLegion.units) { attackerLegion.units[unitId] = Math.floor(attackerArmy[unitId].count); }
    for (const unitId in defenderTerritory.units) { defenderTerritory.units[unitId] = Math.floor(defenderArmy[unitId].count); }

    const attackerLosses = initialAttackerCount - finalAttackerCount;
    const defenderLosses = initialDefenderCount - finalDefenderCount;

    if (victory) {
        defenderTerritory.status = 'controlled';
        defenderTerritory.loyalty = 50;
        delete defenderTerritory.units; // No more garrison
        showNotification(`Victoire ! ${defenderTerritory.name} a été conquise ! Pertes: ${attackerLosses} (A) vs ${defenderLosses} (D)`, 'success');
        addXp(100);
    } else {
        showNotification(`Défaite... La légion a été repoussée de ${defenderTerritory.name}. Pertes: ${attackerLosses} (A) vs ${defenderLosses} (D)`, 'error');
    }

    // Clean up empty legions
    gameState.legions = gameState.legions.filter(l => Object.values(l.units).reduce((s, u) => s + u, 0) > 0);

    hideModal();
    rerenderWorldView();
    saveGameState();
}

function showManageLegionModal(legionId) {
    const legion = gameState.legions.find(l => l.id === legionId);
    if (!legion) return;

    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalButtons = document.getElementById('modalButtons');

    let body = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">`;

    // Left Panel: Legion's Units
    let legionHtml = '<div><h4>Dans la Légion</h4><div style="display:flex; flex-direction:column; gap:0.5rem;">';
    for (const unitId in UNITS_CONFIG) {
        const count = legion.units[unitId] || 0;
        legionHtml += `<div style="display:flex; justify-content:space-between; align-items:center;">
            <span>${UNITS_CONFIG[unitId].icon} ${count} ${UNITS_CONFIG[unitId].name}</span>
            <button class="imperium-btn" style="padding:0.2rem 0.5rem;" onclick="transferToPool('${legionId}', '${unitId}', 1)" ${count === 0 ? 'disabled' : ''}>-</button>
        </div>`;
    }
    legionHtml += '</div></div>';

    // Right Panel: Unit Pool
    let poolHtml = '<div><h4>En Réserve</h4><div style="display:flex; flex-direction:column; gap:0.5rem;">';
    for (const unitId in gameState.unitPool) {
        const count = gameState.unitPool[unitId] || 0;
        poolHtml += `<div style="display:flex; justify-content:space-between; align-items:center;">
            <button class="imperium-btn" style="padding:0.2rem 0.5rem;" onclick="transferToLegion('${legionId}', '${unitId}', 1)" ${count === 0 ? 'disabled' : ''}>+</button>
            <span>${UNITS_CONFIG[unitId].icon} ${count} ${UNITS_CONFIG[unitId].name}</span>
        </div>`;
    }
    poolHtml += '</div></div>';

    body += legionHtml + poolHtml + `</div>`;

    modalTitle.innerHTML = `Gérer ${legion.name}`;
    modalBody.innerHTML = body;
    modalButtons.innerHTML = `<button class="modal-btn cancel" onclick="saveGameState()">Terminé</button>`;
    showModal();
}

function transferToLegion(legionId, unitId, amount) {
    const legion = gameState.legions.find(l => l.id === legionId);
    if (gameState.unitPool[unitId] >= amount) {
        gameState.unitPool[unitId] -= amount;
        legion.units[unitId] = (legion.units[unitId] || 0) + amount;
        showManageLegionModal(legionId); // Refresh modal
    }
}

function transferToPool(legionId, unitId, amount) {
    const legion = gameState.legions.find(l => l.id === legionId);
    if (legion.units[unitId] >= amount) {
        legion.units[unitId] -= amount;
        gameState.unitPool[unitId] = (gameState.unitPool[unitId] || 0) + amount;
        showManageLegionModal(legionId); // Refresh modal
    }
}


function showResourcesModal() {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalButtons = document.getElementById('modalButtons');
    modalTitle.innerHTML = `Trésorerie de l'Empire (Tour ${gameState.world.turn})`;
    let body = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;"><strong>Ressource</strong><strong>Stock Actuel</strong>`;
    Object.entries(gameState.resources).forEach(([name, value]) => {
        body += `<span>${name.charAt(0).toUpperCase() + name.slice(1)}</span><span>${Math.floor(value).toLocaleString('fr-FR')}</span>`;
    });
    body += `</div>`;
    modalBody.innerHTML = body;
    modalButtons.innerHTML = `<button class="modal-btn cancel">Fermer</button>`;
    showModal();
}

function showModal() {
    const modal = document.getElementById('customModal');
    if(modal) modal.style.display = 'flex';
}

function hideModal() {
    const modal = document.getElementById('customModal');
    if(modal) modal.style.display = 'none';
}

function recruitLegion(territoryId) {
    const cost = 1000;
    if (gameState.resources.gold < cost) {
        showNotification("Pas assez d'or pour lever une légion.", 'error');
        return;
    }
    gameState.resources.gold -= cost;
    const newLegion = {
        id: `legio_${gameState.legions.length + 1}`,
        name: `Legio ${gameState.legions.length + 1}`,
        general: "Genericus",
        units: { legionnaire: 50 }, // Default starting units
        locationId: territoryId,
        action: 'idle',
        supply: 100
    };
    gameState.legions.push(newLegion);
    showNotification(`${newLegion.name} a été levée !`, 'success');
    saveGameState();
    rerenderWorldView();
}

function getDistance(territoryA, territoryB) {
    const dx = territoryA.x - territoryB.x;
    const dy = territoryA.y - territoryB.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function isLegionInSupply(legion) {
    const legionTerritory = gameState.world.territories.find(t => t.id === legion.locationId);
    const supplySources = gameState.world.territories.filter(t => (t.status === 'capital' || t.status === 'controlled') && t.supplyRange > 0);

    for (const source of supplySources) {
        if (getDistance(legionTerritory, source) <= source.supplyRange) {
            return true;
        }
    }
    return false;
}

function improveRelations(territoryId) {
    const territory = gameState.world.territories.find(t => t.id === territoryId);
    const cost = 500;
    if (!territory || territory.status !== 'neutral') return;
    if (gameState.resources.gold < cost) {
        showNotification("Pas assez d'or pour cette action diplomatique.", "error");
        return;
    }

    gameState.resources.gold -= cost;
    territory.relations = Math.min(100, territory.relations + 10);
    showNotification(`Vos relations avec ${territory.name} se sont améliorées.`, 'success');

    // Rerender modal if open
    hideModal();
    showTerritoryModal(territory);
    saveGameState();
}

function declareWar(territoryId) {
    const territory = gameState.world.territories.find(t => t.id === territoryId);
    if (!territory || territory.status !== 'neutral') return;

    territory.status = 'enemy';
    // Assign a default garrison
    territory.units = { legionnaire: 30, archer: 20 };
    showNotification(`Vous êtes maintenant en guerre avec ${territory.name} !`, 'error');

    hideModal();
    rerenderWorldView();
    saveGameState();
}

function showEventModal(event) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalButtons = document.getElementById('modalButtons');

    modalTitle.innerHTML = `Événement : ${event.title}`;

    const effectResult = event.effect(gameState);

    modalBody.innerHTML = `<p>${event.description}</p><p><em>${effectResult}</em></p>`;
    modalButtons.innerHTML = `<button class="modal-btn" onclick="hideModal()">Continuer</button>`;

    showModal();
}

function endTurn() {
    // 0. Event Phase (has a chance to trigger)
    if (Math.random() < 0.25) { // 25% chance of an event
        const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        showEventModal(randomEvent);
        saveGameState();
        rerenderWorldView();
        // The rest of the turn will proceed after the user closes the event modal.
        // For simplicity, we'll process the event and then the turn.
        // A more advanced implementation might pause the turn until the modal is closed.
    }

    // 1. Legion Movement Phase
    gameState.legions.forEach(legion => {
        if (legion.action === 'moving' && legion.targetId) {
            legion.locationId = legion.targetId;
            legion.action = 'idle';
            delete legion.targetId;
            showNotification(`${legion.name} est arrivée à ${gameState.world.territories.find(t => t.id === legion.locationId).name}.`, 'info');
        }
    });

    // 1. Income
    gameState.world.territories.forEach(t => {
        if ((t.status === 'capital' || t.status === 'controlled') && t.income) {
            Object.entries(t.income).forEach(([res, val]) => {
                if(gameState.resources[res] !== undefined) {
                    gameState.resources[res] += val;
                }
            });
        }
    });

    // 2. Supply & Attrition
    let totalConsumption = 0;
    const legionsForRemoval = [];
    gameState.legions.forEach(legion => {
        const totalUnitsInLegion = Object.values(legion.units).reduce((a, b) => a + b, 0);
        if (totalUnitsInLegion === 0) {
            legionsForRemoval.push(legion.id);
            return;
        }

        // Food Consumption
        const consumption = Math.ceil((totalUnitsInLegion / 100) * (GAME_CONFIG.SUPPLY_CONSUMPTION_PER_1000_TROOPS / 10)); // Scaled down
        totalConsumption += consumption;

        // Supply Check & Attrition
        if (isLegionInSupply(legion)) {
            legion.supply = Math.min(100, legion.supply + 20); // Replenish supply
        } else {
            legion.supply -= 25; // Lose supply
            showNotification(`${legion.name} est hors ravitaillement !`, 'error');
            if (legion.supply <= 0) {
                const attritionLosses = Math.ceil(totalUnitsInLegion * 0.1); // 10% attrition
                let lossesToDistribute = attritionLosses;
                // Distribute losses
                while (lossesToDistribute > 0) {
                    const unitTypesInLegion = Object.keys(legion.units).filter(id => legion.units[id] > 0);
                    if (unitTypesInLegion.length === 0) break;
                    const randomUnitType = unitTypesInLegion[Math.floor(Math.random() * unitTypesInLegion.length)];
                    legion.units[randomUnitType]--;
                    lossesToDistribute--;
                }
                showNotification(`${legion.name} subit des pertes de ${attritionLosses} dues à l'attrition !`, 'error');
            }
        }
    });

    // Remove destroyed legions
    gameState.legions = gameState.legions.filter(l => !legionsForRemoval.includes(l.id) && Object.values(l.units).reduce((a,b) => a+b, 0) > 0);

    // Deduct food
    gameState.resources.food -= totalConsumption;
    if (gameState.resources.food < 0) {
        showNotification(`Famine ! Manque de nourriture pour les troupes.`, 'error');
        // Additional penalties for famine could be added here
        gameState.resources.food = 0;
    }

    // 3. Diplomacy Phase
    gameState.world.territories.forEach(t => {
        if (t.status === 'neutral') {
            t.relations = Math.max(-100, t.relations - 1); // Relation decay
            if (t.relations < -50 && Math.random() < 0.1) {
                showNotification(`${t.name} a perdu patience et vous déclare la guerre !`, 'error');
                declareWar(t.id);
            }
            if (t.relations >= 80) {
                t.status = 'ally';
                t.income = { 'gold': 100 }; // Ally bonus
                showNotification(`${t.name} est maintenant votre allié et vous verse un tribut !`, 'success');
            }
        }
    });


    gameState.world.turn++;
    saveGameState();
    rerenderWorldView();

    showNotification(`Tour ${gameState.world.turn} terminé. Nourriture consommée: ${totalConsumption}`, 'success');
}

function showNotification(message, type = 'info') {
    if (!message || message.trim() === '') {
        return; // Do not show empty notifications
    }

    const container = document.getElementById('notifications-container');
    if (!container) return;
    const notif = document.createElement('div');
    notif.className = `notification`;
    notif.style.borderLeftColor = type === 'success' ? 'var(--success-green)' : 'var(--error-red)';
    notif.textContent = message;
    container.appendChild(notif);
    setTimeout(() => notif.remove(), 5000);
}


const MapManager = {
    scale: 1, posX: 0, posY: 0, isPanning: false,
    startX: 0, startY: 0, mapContainer: null, mapContent: null,
    init(container, content) {
        this.mapContainer = container; this.mapContent = content;
        this.mapContainer.addEventListener('wheel', this.handleWheel.bind(this));
        this.mapContainer.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.mapContainer.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.mapContainer.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.mapContainer.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    },
    updateTransform() { this.mapContent.style.transform = `translate(${this.posX}px, ${this.posY}px) scale(${this.scale})`; },
    handleMouseDown(e) { e.preventDefault(); this.isPanning = true; this.startX = e.clientX - this.posX; this.startY = e.clientY - this.posY; },
    handleMouseUp(e) { this.isPanning = false; },
    handleMouseMove(e) { if (!this.isPanning) return; e.preventDefault(); this.posX = e.clientX - this.startX; this.posY = e.clientY - this.startY; this.updateTransform(); },
    handleWheel(e) { e.preventDefault(); const d = e.deltaY < 0 ? 0.1 : -0.1; this.scale = Math.max(0.5, Math.min(3, this.scale + d)); this.updateTransform(); }
};
