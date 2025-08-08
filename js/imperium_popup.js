// ===============================================================
// IMPERIUM V19 - POPUP.JS
// ===============================================================
// Ce fichier gère l'injection et l'interactivité de la popup
// "IMPERIUM" qui affiche les informations générales du joueur.
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Injecter le CSS de la popup
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/imperium_popup.css';
    document.head.appendChild(link);

    // 2. Injecter le HTML de la popup
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
            initializePopup();
        })
        .catch(err => console.error('Failed to load imperium_popup.html:', err));
});

function initializePopup() {
    const popup = document.getElementById('imperium-popup');
    const openBtn = document.getElementById('imperium-popup-button');
    const closeBtn = document.getElementById('imperium-popup-close-btn');

    if (!popup || !openBtn || !closeBtn) {
        console.error('Popup elements not found!');
        return;
    }

    // 3. Gérer l'ouverture et la fermeture
    openBtn.addEventListener('click', () => {
        const isActive = popup.classList.toggle('active');
        if (isActive) {
            updateImperiumPopup();
        }
    });

    closeBtn.addEventListener('click', () => {
        popup.classList.remove('active');
    });

    // Fermer si on clique en dehors
    document.addEventListener('click', (e) => {
        if (!popup.contains(e.target) && !openBtn.contains(e.target)) {
            popup.classList.remove('active');
        }
    });

    // 4. Mettre à jour les données de la popup périodiquement
    setInterval(() => {
        if (popup.classList.contains('active')) {
            updateImperiumPopup();
        }
    }, 1000); // M-à-j toutes les secondes
}

function updateImperiumPopup() {
    // S'assurer que gameState est disponible
    if (typeof gameState === 'undefined') {
        console.error('gameState is not available to the popup.');
        return;
    }

    // 5. Mettre à jour les infos du joueur
    document.getElementById('popup-player-name').textContent = gameState.player.name;
    document.getElementById('popup-player-level').textContent = gameState.player.level;

    // 6. Mettre à jour les ressources
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
