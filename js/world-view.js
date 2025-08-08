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
        });
    }
}

function showTerritoryModal(territory) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalButtons = document.getElementById('modalButtons');

    modalTitle.innerHTML = `${territory.flag} ${territory.name}`;
    let body = `<p>Statut : <strong>${statusTexts[territory.status]}</strong></p>`;
    if(territory.status === 'controlled' || territory.status === 'capital') {
        body += `<p>Loyauté : ${territory.loyalty}%</p>`;
    }
    let buttons = '';
    if (territory.status === 'capital') {
         buttons += `<button class="modal-btn" data-action="recruit_legion" data-id="${territory.id}">Levez une Légion (1000 Or)</button>`;
    }
    buttons += `<button class="modal-btn cancel">Fermer</button>`;

    modalBody.innerHTML = body;
    modalButtons.innerHTML = buttons;
    showModal();
}

function showLegionModal(legion) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalButtons = document.getElementById('modalButtons');

    modalTitle.innerHTML = legion.name;
    let body = `<p>Général: ${legion.general}</p><p>Force: ${legion.strength} hommes</p>`;
    modalBody.innerHTML = body;
    modalButtons.innerHTML = `<button class="modal-btn cancel">Fermer</button>`;
    showModal();
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
        strength: 2500,
        locationId: territoryId,

        action: 'idle'

    };
    gameState.legions.push(newLegion);
    showNotification(`${newLegion.name} a été levée !`, 'success');
    saveGameState();
    rerenderWorldView();
}

function endTurn() {
    // Income

    gameState.world.territories.forEach(t => {
        if ((t.status === 'capital' || t.status === 'controlled') && t.income) {
            Object.entries(t.income).forEach(([res, val]) => {
                if(gameState.resources[res] !== undefined) {
                    gameState.resources[res] += val;
                }
            });
        }
    });


    gameState.world.turn++;
    saveGameState();
    rerenderWorldView();
    showNotification(`Tour ${gameState.world.turn} terminé.`, 'success');

}

function showNotification(message, type = 'info') {
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
