// ===============================================================
// IMPERIUM V19 - POPUP.JS
// ===============================================================
// Ce fichier gère l'injection et l'interactivité des popups
// d'information du joueur (Profil, Ressources, Actions).
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Injecter le CSS de la popup
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/imperium_popup.css';
    document.head.appendChild(link);

    // 2. Injecter le HTML des popups
    fetch('imperium_popup.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            // Une fois le HTML chargé, on initialise les fonctionnalités
            initializePopups();
        })
        .catch(err => console.error('Failed to load imperium_popup.html:', err));
});

function initializePopups() {
    // 3. Initialiser chaque popup individuellement
    setupPopup('profile');
    setupPopup('resources');
    setupPopup('actions');

    // 4. Déplacer les tuiles d'actions
    moveDashboardTiles();

    // 5. Mettre à jour les données des popups périodiquement
    setInterval(() => {
        updateActivePopups();
    }, 1000); // M-à-j toutes les secondes
}

function setupPopup(name) {
    const popup = document.getElementById(`${name}-popup`);
    const openBtn = document.getElementById(`${name}-popup-button`);
    const closeBtn = document.getElementById(`${name}-popup-close-btn`);

    if (!popup || !openBtn || !closeBtn) {
        console.error(`Elements for popup "${name}" not found!`);
        return;
    }

    // Gérer l'ouverture
    openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = popup.classList.toggle('active');
        // Optionnel: fermer les autres popups quand on en ouvre une
        closeOtherPopups(name);
        if (isActive) {
            updatePopupByName(name);
        }
    });

    // Gérer la fermeture
    closeBtn.addEventListener('click', () => {
        popup.classList.remove('active');
    });

    // Fermer si on clique en dehors de la popup
    document.addEventListener('click', (e) => {
        if (!popup.contains(e.target) && !openBtn.contains(e.target)) {
            popup.classList.remove('active');
        }
    });
}

function closeOtherPopups(currentPopupName) {
    const popupNames = ['profile', 'resources', 'actions'];
    popupNames.forEach(name => {
        if (name !== currentPopupName) {
            const popup = document.getElementById(`${name}-popup`);
            if (popup) {
                popup.classList.remove('active');
            }
        }
    });
}

function updateActivePopups() {
    const popupNames = ['profile', 'resources', 'actions'];
    popupNames.forEach(name => {
        const popup = document.getElementById(`${name}-popup`);
        if (popup && popup.classList.contains('active')) {
            updatePopupByName(name);
        }
    });
}

function updatePopupByName(name) {
    if (name === 'profile') {
        updateProfilePopup();
    } else if (name === 'resources') {
        updateResourcesPopup();
    }
    // 'actions' popup does not need dynamic updates
}

function updateProfilePopup() {
    if (typeof gameState === 'undefined') return;
    document.getElementById('popup-player-name').textContent = gameState.player.name;
    document.getElementById('popup-player-level').textContent = gameState.player.level;
}

function updateResourcesPopup() {
    if (typeof gameState === 'undefined') return;

    const resourcesList = document.getElementById('imperium-resources-list');
    resourcesList.innerHTML = ''; // Vider la liste

    const resourceIcons = {
        gold: '💰',
        food: '🌾',
        marble: '🏛️',
        wood: '🌲',
        stone: '🪨',
        spies: '👁️',
        divineFavor: '🙏'
    };

    for (const res in resourceIcons) {
        if (gameState.resources[res] !== undefined) {
            const value = Math.floor(gameState.resources[res]);
            const item = document.createElement('div');
            item.className = 'popup-resource-item';
            item.innerHTML = `<span class="popup-resource-icon">${resourceIcons[res]}</span> <span>${value.toLocaleString()}</span>`;
            resourcesList.appendChild(item);
        }
    }
}

function moveDashboardTiles() {
    const dashboardGrid = document.querySelector('.dashboard-grid');
    const actionsGrid = document.getElementById('imperium-actions-grid');

    if (dashboardGrid && actionsGrid) {
        const tilesToMove = dashboardGrid.querySelectorAll('.movable-tile');
        tilesToMove.forEach(tile => {
            actionsGrid.appendChild(tile);
        });
        actionsGrid.classList.add('dashboard-grid-popup');
    }
}
