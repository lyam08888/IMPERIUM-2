// ===============================================================
// IMPERIUM V19 - SHARED-UTILS.JS
// ===============================================================
// Ce fichier contient des fonctions utilitaires partagées
// à travers les différentes vues de l'application.
// ===============================================================

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
