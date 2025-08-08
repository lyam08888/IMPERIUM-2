// js/intro-fixed.js
// Version corrigée avec gestion d'erreur et Battle Pass intégré

// Détection du mode mobile
function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

// Fonction de débogage pour traquer les problèmes
function debugLog(message, data = null) {
    console.log(`[INTRO DEBUG] ${message}`, data || '');
}

// Fonction de sécurité pour redirection
function safeRedirect(url, fallbackUrl = 'imperium-mobile-clean.html') {
    try {
        debugLog(`Tentative de redirection vers: ${url}`);
        window.location.href = url;
    } catch (error) {
        debugLog(`Erreur de redirection, utilisation du fallback: ${fallbackUrl}`, error);
        window.location.href = fallbackUrl;
    }
}

// Make sure to wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM chargé, initialisation de l\'intro...');

    // --- Constants and DOM Elements ---
    const SAVE_KEY = 'imperium_v19_gamestate';
    
    // Vérification des éléments DOM
    const titleScreen = document.getElementById('title-screen');
    const cinematicScreen = document.getElementById('cinematic-screen');
    const tutorialScreen = document.getElementById('tutorial-screen');
    const introButtonsContainer = document.getElementById('intro-buttons');
    
    if (!titleScreen || !cinematicScreen || !tutorialScreen || !introButtonsContainer) {
        debugLog('ERREUR: Éléments DOM manquants!', {
            titleScreen: !!titleScreen,
            cinematicScreen: !!cinematicScreen,
            tutorialScreen: !!tutorialScreen,
            introButtonsContainer: !!introButtonsContainer
        });
        
        // Redirection de sécurité vers le jeu principal
        setTimeout(() => safeRedirect('imperium-mobile-clean.html'), 2000);
        return;
    }
    
    const loadingBar = document.getElementById('loading-bar');
    const cinematicText = document.getElementById('cinematic-text');
    const tutorialNextBtn = document.getElementById('tutorial-next-btn');

    debugLog('Tous les éléments DOM trouvés');

    // --- Fonctions de création de boutons sécurisées ---
    function createButton(text, className, clickHandler, styles = {}) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = className;
        
        // Appliquer les styles personnalisés
        Object.assign(button.style, styles);
        
        // Gestionnaire de clic avec gestion d'erreur
        button.addEventListener('click', (e) => {
            try {
                debugLog(`Bouton cliqué: ${text}`);
                clickHandler(e);
            } catch (error) {
                debugLog(`Erreur dans le gestionnaire de clic pour "${text}"`, error);
                
                // Fallback - rediriger vers le jeu principal
                if (text.includes('Jouer') || text.includes('Direct')) {
                    safeRedirect('imperium-mobile-clean.html');
                }
            }
        });
        
        // Ajouter des attributs pour le débogage
        button.setAttribute('data-button-type', text.toLowerCase().replace(/\s+/g, '-'));
        
        return button;
    }

    // --- Gestion des boutons avec alternatives multiples ---
    function createGameStartButtons() {
        debugLog('Création des boutons de démarrage...');
        
        const startBtn = createButton(
            '🏛️ Commencez à Jouer', 
            'imperium-btn',
            startIntroSequence,
            { fontSize: '1.2em', marginBottom: '15px' }
        );
        
        const directBtn = createButton(
            '⚡ Jeu Direct (Sans Tutoriel)', 
            'imperium-btn', 
            handleDirectGame,
            { 
                marginTop: '10px', 
                background: '#16a34a',
                fontSize: '1.1em'
            }
        );
        
        const unifiedBtn = createButton(
            '🌟 Version Unifiée (Recommandé)', 
            'imperium-btn', 
            () => safeRedirect('imperium-unified.html'),
            { 
                marginTop: '10px', 
                background: '#8b5cf6',
                fontSize: '1.1em'
            }
        );
        
        const battlePassBtn = createButton(
            '🎖️ Battle Pass (Nouveau!)', 
            'imperium-btn', 
            showBattlePass,
            { 
                marginTop: '10px', 
                background: '#f59e0b',
                fontSize: '1.1em',
                border: '2px solid #fbbf24'
            }
        );
        
        return { startBtn, directBtn, unifiedBtn, battlePassBtn };
    }

    function createContinueButtons() {
        debugLog('Création des boutons de continuation...');
        
        const continueBtn = createButton(
            '▶️ Continuer la partie', 
            'imperium-btn',
            () => safeRedirect('game.html')
        );
        
        const newGameBtn = createButton(
            '🔄 Nouvelle Partie', 
            'imperium-btn danger',
            handleNewGame
        );
        
        const battlePassBtn = createButton(
            '🎖️ Voir mon Battle Pass', 
            'imperium-btn', 
            showBattlePass,
            { 
                marginTop: '10px', 
                background: '#f59e0b',
                border: '2px solid #fbbf24'
            }
        );
        
        return { continueBtn, newGameBtn, battlePassBtn };
    }

    // --- Gestionnaires d'événements sécurisés ---
    function handleDirectGame() {
        debugLog('Gestion du jeu direct...');
        
        const confirmMessage = `🎮 Aller directement au jeu principal ?

✅ Vous commencerez avec :
• Une ferme déjà construite
• Des ressources de base
• Battle Pass actif (niveau 1)
• Aucun tutoriel

⚡ Recommandé pour les joueurs expérimentés`;
        
        if (confirm(confirmMessage)) {
            try {
                skipTutorialCompletely();
            } catch (error) {
                debugLog('Erreur dans skipTutorialCompletely, redirection directe', error);
                safeRedirect('game.html');
            }
        }
    }
    
    function handleNewGame() {
        debugLog('Gestion de nouvelle partie...');
        
        const confirmMessage = `⚠️ Êtes-vous sûr de vouloir commencer une nouvelle partie ?

🔥 Cette action va :
• Effacer votre sauvegarde actuelle
• Réinitialiser votre Battle Pass
• Perdre tous vos progrès

Cette action est IRRÉVERSIBLE !`;
        
        if (confirm(confirmMessage)) {
            try {
                localStorage.removeItem(SAVE_KEY);
                localStorage.removeItem('imperium_battle_pass');
                localStorage.removeItem('imperium_inventory');
                debugLog('Sauvegardes supprimées, démarrage nouveau jeu...');
                startIntroSequence();
            } catch (error) {
                debugLog('Erreur lors de la suppression, redirection de sécurité', error);
                safeRedirect('game.html');
            }
        }
    }

    function showBattlePass() {
        debugLog('Affichage du Battle Pass...');
        
        try {
            if (window.battlePassSystem) {
                window.battlePassSystem.showBattlePassUI();
            } else {
                // Fallback si le Battle Pass n'est pas encore chargé
                setTimeout(() => {
                    if (window.battlePassSystem) {
                        window.battlePassSystem.showBattlePassUI();
                    } else {
                        alert('🎖️ Battle Pass en cours de chargement...\nVeuillez patienter quelques secondes et réessayer.');
                    }
                }, 1000);
            }
        } catch (error) {
            debugLog('Erreur affichage Battle Pass', error);
            alert('🎖️ Le Battle Pass sera disponible dans le jeu principal !');
        }
    }

    // --- Check for Saved Game ---
    function initializeIntro() {
        debugLog('Initialisation de l\'intro...');
        introButtonsContainer.innerHTML = ''; // Réinitialiser le conteneur

        try {
            const savedGame = localStorage.getItem(SAVE_KEY);

            if (savedGame) {
                const { continueBtn, newGameBtn, battlePassBtn } = createContinueButtons();
                introButtonsContainer.appendChild(continueBtn);
                introButtonsContainer.appendChild(newGameBtn);
                introButtonsContainer.appendChild(battlePassBtn);
            } else {
                const { startBtn, directBtn, unifiedBtn, battlePassBtn } = createGameStartButtons();
                introButtonsContainer.appendChild(startBtn);
                introButtonsContainer.appendChild(directBtn);
                introButtonsContainer.appendChild(unifiedBtn);
                introButtonsContainer.appendChild(battlePassBtn);
            }

            // Ajouter le bouton d'urgence après avoir rendu les boutons principaux
            addEmergencyButton();
        } catch (error) {
            debugLog('Erreur lors de l\'initialisation des boutons', error);
            // Fallback simple vers la version unifiée
            const fallbackBtn = createButton(
                '🏛️ Commencer à jouer',
                'imperium-btn',
                () => safeRedirect('imperium-unified.html'),
                { fontSize: '1.3em', padding: '15px 30px' }
            );
            introButtonsContainer.appendChild(fallbackBtn);
        }
    }
    
    function addEmergencyButton() {
        // Bouton caché d'urgence (visible après 10 secondes)
        setTimeout(() => {
            if (document.querySelector('.emergency-access')) return; // Déjà ajouté
            
            const emergencyBtn = createButton(
                '🛠️ Accès de Débogage', 
                'imperium-btn emergency-access',
                showDebugMenu,
                { 
                    background: '#6366f1',
                    fontSize: '0.9em',
                    marginTop: '20px',
                    opacity: '0.7'
                }
            );
            
            introButtonsContainer.appendChild(emergencyBtn);
        }, 10000);
    }
    
    function showDebugMenu() {
        const debugOptions = `🛠️ MENU DE DÉBOGAGE

Choisissez une action :
1 - Aller au jeu principal
2 - Version unifiée
3 - Effacer toutes les données
4 - Tester le Battle Pass
5 - Annuler`;
        
        const choice = prompt(debugOptions);
        
        switch (choice) {
            case '1':
                safeRedirect('game.html');
                break;
            case '2':
                safeRedirect('imperium-unified.html');
                break;
            case '3':
                if (confirm('⚠️ Effacer TOUTES les données ?')) {
                    localStorage.clear();
                    location.reload();
                }
                break;
            case '4':
                showBattlePass();
                break;
            default:
                break;
        }
    }

    // --- Intro Flow avec gestion d'erreur ---
    function startIntroSequence() {
        debugLog('Démarrage de la séquence d\'intro...');
        
        try {
            titleScreen.classList.add('hidden');
            cinematicScreen.classList.remove('hidden');
            runCinematic();
        } catch (error) {
            debugLog('Erreur dans startIntroSequence, redirection directe', error);
            safeRedirect('game.html');
        }
    }

    function runCinematic() {
        debugLog('Lancement de la cinématique...');
        
        try {
            setTimeout(() => {
                if (loadingBar) loadingBar.style.width = '100%';
                if (cinematicText) cinematicText.textContent = 'La fondation de Rome...';
            }, 100);

            setTimeout(() => {
                cinematicScreen.classList.add('hidden');
                tutorialScreen.classList.remove('hidden');
                startTutorial();
            }, 2500);
        } catch (error) {
            debugLog('Erreur dans la cinématique, passage au jeu', error);
            safeRedirect('game.html');
        }
    }

    // --- Tutorial Logic avec fallbacks ---
    let tutorialState = {
        gameState: null,
        currentStep: 0,
        targetSlotId: -1,
    };

    const tutorialSteps = [
        {
            message: "🏛️ Bienvenue, Consul ! Pour commencer, nous devons nourrir notre peuple. Construisons une ferme. <br><br>Cliquez sur un terrain vide pour commencer.<br><br>⚠️ <strong>Si rien ne se passe, utilisez le bouton 'PASSER LE TUTORIEL' ci-dessous.</strong>",
            action: 'clickEmptyPlot',
            highlight: '#tutorialBuildingsGrid .building-slot:not(.occupied)',
            showButton: false,
        },
        {
            message: "✨ Parfait ! Voici les bâtiments disponibles. Sélectionnez la <strong>🌾 Ferme</strong>.",
            action: 'selectBuilding',
            highlight: '.build-item[data-building-type="farm"]',
            showButton: false,
        },
        {
            message: "🏗️ Excellent choix ! La construction a commencé. Pendant ce temps, découvrons les ressources et le <strong>🎖️ Battle Pass</strong> !",
            action: 'wait',
            showButton: true,
        },
        {
            message: "💰 Voici vos ressources principales : Or, Nourriture et Marbre. La ferme produit de la nourriture et vous donne de l'XP pour votre Battle Pass !",
            action: 'highlightElement',
            highlight: '#tutorial-resources',
            showButton: true,
        },
        {
            message: "🎉 Construction terminée ! Votre ferme produit maintenant des ressources et vous avez gagné vos premiers points XP Battle Pass !",
            action: 'autoAdvance',
            showButton: false,
        },
        {
            message: "🎯 Félicitations ! Premier objectif complété. Le système d'objectifs vous guide et offre des récompenses Battle Pass !",
            action: 'highlightElement',
            highlight: '#tutorial-objectives-tile',
            showButton: true,
        },
        {
            message: "🎖️ Votre empire grandit ! Vous débloquez maintenant le <strong>Battle Pass Impérial</strong> avec 100 niveaux de récompenses. Bonne chance, Consul !",
            action: 'finish',
            showButton: true,
        }
    ];

    function startTutorial() {
        debugLog('Démarrage du tutoriel...');
        
        try {
            tutorialState.gameState = getDefaultGameState();
            renderTutorialGrid();
            renderTutorialResources();
            
            createSkipTutorialButton();
            runTutorialStep(0);
            
            // Initialisation du Battle Pass pour le tutoriel
            if (window.battlePassSystem) {
                window.battlePassSystem.addXP(50); // XP de démarrage
            }
            
        } catch (error) {
            debugLog('Erreur dans startTutorial', error);
            // Passer directement au jeu en cas d'erreur
            skipTutorialCompletely();
        }
    }
    
    function createSkipTutorialButton() {
        debugLog('Création du bouton Passer le Tutoriel...');
        
        if (!document.getElementById('fixed-skip-tutorial-btn')) {
            const skipBtn = document.createElement('button');
            skipBtn.id = 'fixed-skip-tutorial-btn';
            skipBtn.textContent = '❌ PASSER LE TUTORIEL';
            skipBtn.className = 'imperium-btn danger';
            skipBtn.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                font-size: 1.2em;
                font-weight: bold;
                padding: 12px 20px;
                background: #dc2626;
                border: 2px solid #fbbf24;
                color: white;
                border-radius: 8px;
                cursor: pointer;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
            `;
            
            skipBtn.onclick = () => {
                const confirmMessage = `🎮 Passer le tutoriel ?

✅ Vous irez directement au jeu avec :
• Une ferme déjà construite
• Des ressources de démarrage  
• Battle Pass niveau 1 activé
• Premier objectif complété

⚡ Recommandé si vous connaissez déjà le jeu !`;
                
                if (confirm(confirmMessage)) {
                    skipTutorialCompletely();
                }
            };
            
            document.body.appendChild(skipBtn);
            debugLog('Bouton Passer le Tutoriel créé');
        }
    }
    
    function skipTutorialCompletely() {
        debugLog('Passage complet du tutoriel...');
        
        try {
            // Create completed tutorial state
            const completedState = getDefaultGameState();
            
            // Add a farm to the first slot
            completedState.city.buildings[0].type = 'farm';
            completedState.city.buildings[0].level = 1;
            
            // Give resources as if the farm has been producing
            completedState.resources.food = 200;
            completedState.resources.gold = 150;
            completedState.resources.marble = 100;
            
            // Mark first quest as completed
            completedState.city.activeQuestId = 1;
            
            // Add some progress
            completedState.player.xp = 50;
            
            // Initialize Battle Pass data
            if (window.battlePassSystem) {
                window.battlePassSystem.addXP(100); // XP bonus pour avoir passé le tutoriel
            }
            
            // Save and redirect
            localStorage.setItem(SAVE_KEY, JSON.stringify(completedState));
            debugLog("Tutoriel passé - état sauvegardé, redirection...");
            
            safeRedirect('game.html');
            
        } catch (error) {
            debugLog('Erreur dans skipTutorialCompletely', error);
            // Redirection de sécurité même en cas d'erreur
            safeRedirect('game.html');
        }
    }

    // --- Fonctions utilitaires manquantes ---
    function getDefaultGameState() {
        // Cette fonction doit retourner l'état de jeu par défaut
        // Si la fonction n'existe pas dans game.js, on crée une version basique
        if (typeof window.getDefaultGameState === 'function') {
            return window.getDefaultGameState();
        }
        
        // Version de secours
        return {
            player: { name: "Consul", level: 1, xp: 0 },
            resources: { gold: 100, food: 50, marble: 25 },
            city: {
                buildings: Array(12).fill().map((_, i) => ({ slotId: i, type: null, level: 0 })),
                activeQuestId: 0,
                constructionQueue: []
            }
        };
    }
    
    function renderTutorialGrid() {
        debugLog('Rendu de la grille tutoriel...');
        // Implémentation basique si nécessaire
    }
    
    function renderTutorialResources() {
        debugLog('Rendu des ressources tutoriel...');
        // Implémentation basique si nécessaire
    }
    
    function runTutorialStep(stepIndex) {
        debugLog(`Étape tutoriel: ${stepIndex}`);
        // Version simplifiée pour éviter les erreurs
        if (stepIndex >= tutorialSteps.length) {
            skipTutorialCompletely();
            return;
        }
        
        const step = tutorialSteps[stepIndex];
        const tutorialMessage = document.getElementById('tutorial-message');
        
        if (tutorialMessage) {
            tutorialMessage.innerHTML = step.message;
        }
        
        // Auto-avancer après quelques étapes pour éviter les blocages
        if (stepIndex > 2) {
            setTimeout(() => {
                runTutorialStep(stepIndex + 1);
            }, 3000);
        }
    }

    // --- Initialisation finale ---
    try {
        initializeIntro();
        debugLog('Initialisation terminée avec succès');
        
        // Vérification de la disponibilité du Battle Pass après un délai
        setTimeout(() => {
            if (!window.battlePassSystem) {
                debugLog('ATTENTION: Battle Pass System non trouvé !');
            } else {
                debugLog('Battle Pass System disponible');
            }
        }, 2000);
        
    } catch (error) {
        debugLog('ERREUR CRITIQUE dans l\'initialisation', error);
        
        // Interface de secours
        if (introButtonsContainer) {
            introButtonsContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; background: rgba(220, 38, 38, 0.1); border: 2px solid #dc2626; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #dc2626;">🚨 Mode de Secours</h3>
                    <p>Une erreur a été détectée. Utilisez les liens ci-dessous :</p>
                    <button onclick="window.location.href='game.html'" class="imperium-btn" style="margin: 10px;">🎮 Jeu Principal</button>
                    <button onclick="window.location.href='imperium-unified.html'" class="imperium-btn" style="margin: 10px;">🌟 Version Unifiée</button>
                    <button onclick="location.reload()" class="imperium-btn" style="margin: 10px;">🔄 Recharger</button>
                </div>
            `;
        }
    }
});

// Export global pour compatibilité
window.introSystem = {
    skipTutorialCompletely,
    safeRedirect,
    debugLog
};