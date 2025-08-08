// ===============================================================
// IMPERIUM V19 - SHARED-UTILS.JS
// ===============================================================
// Ce fichier contient des fonctions utilitaires partagées
// entre différents modules du jeu.
// ===============================================================

/**
 * Calcule le coût d'une construction ou d'une amélioration en fonction d'un niveau.
 * @param {Array} baseCosts - Le tableau des coûts de base.
 * @param {number} multiplier - Le multiplicateur de coût par niveau.
 * @param {number} level - Le niveau pour lequel calculer le coût.
 * @returns {Array} - Un tableau d'objets représentant les coûts calculés.
 */
function getCost(baseCosts, multiplier, level) {
    return baseCosts.map(cost => ({
        res: cost.res,
        amount: Math.floor(cost.amount * Math.pow(multiplier, level))
    }));
}

/**
 * Affiche une fenêtre modale avec un titre, un corps et un pied de page.
 * @param {string} title - Le titre de la modale.
 * @param {string} body - Le contenu HTML du corps de la modale.
 * @param {string} footer - Le contenu HTML du pied de page de la modale.
 * @param {string} [customClass=''] - Une classe CSS personnalisée à ajouter à la modale.
 */
function showModal(title, body, footer, customClass = '') {
    const container = document.getElementById('modal-container');
    if (!container) {
        console.error('Modal container not found!');
        return;
    }
    const customClassStr = customClass ? ` ${customClass}` : '';
    container.innerHTML = `
        <div class="modal-backdrop" onclick="closeModal()"></div>
        <div class="modal-content${customClassStr}">
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close-btn" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">${body}</div>
            <div class="modal-footer">${footer}</div>
        </div>`;
    setTimeout(() => container.classList.add('active'), 10);
}

/**
 * Ferme la fenêtre modale actuellement active.
 */
function closeModal() {
    const container = document.getElementById('modal-container');
    if (container) {
        container.classList.remove('active');
        // Attendre la fin de la transition pour nettoyer le contenu
        setTimeout(() => container.innerHTML = '', 300);
    }
}

/**
 * Affiche une notification toast.
 * @param {string} message - Le message à afficher.
 * @param {string} [type='info'] - Le type de toast (e.g., 'info', 'success', 'error').
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
}

/**
 * Formate une durée en millisecondes en une chaîne de caractères HH:MM:SS.
 * @param {number} ms - La durée en millisecondes.
 * @returns {string} - La durée formatée.
 */
function formatTime(ms) {
    if (ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Charge le contenu d'un fichier HTML dans un élément spécifié.
 * @param {string} url - L'URL du fichier HTML à charger.
 * @param {string|HTMLElement} target - Le sélecteur CSS ou l'élément HTML où injecter le contenu.
 * @returns {Promise<void>}
 */
async function loadHTML(url, target) {
    const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
    if (!targetElement) {
        console.error(`Target element "${target}" not found.`);
        return;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const html = await response.text();
        targetElement.innerHTML = html;
    } catch (error) {
        console.error(`Error loading HTML from ${url}:`, error);
        targetElement.innerHTML = `<p style="color: var(--error-red);">Error loading content. Please try again.</p>`;
    }
}
