// js/intro.js

// Make sure to wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // --- Constants and DOM Elements ---
    const SAVE_KEY = 'imperium_v19_gamestate'; // Must match game.js

    const titleScreen = document.getElementById('title-screen');
    const cinematicScreen = document.getElementById('cinematic-screen');
    const tutorialScreen = document.getElementById('tutorial-screen');
    const introButtonsContainer = document.getElementById('intro-buttons');
    const loadingBar = document.getElementById('loading-bar');
    const cinematicText = document.getElementById('cinematic-text');

    // --- Check for Saved Game ---
    function initializeIntro() {
        const savedGame = localStorage.getItem(SAVE_KEY);
        introButtonsContainer.innerHTML = ''; // Clear any existing buttons

        if (savedGame) {
            // Player has a saved game
            const continueBtn = document.createElement('button');
            continueBtn.textContent = 'Continuer la partie';
            continueBtn.className = 'imperium-btn';
            continueBtn.onclick = () => {
                window.location.href = 'game.html';
            };

            const newGameBtn = document.createElement('button');
            newGameBtn.textContent = 'Nouvelle Partie';
            newGameBtn.className = 'imperium-btn danger';
            newGameBtn.onclick = () => {
                if (confirm("Voulez-vous vraiment écraser votre sauvegarde et commencer une nouvelle partie ?")) {
                    localStorage.removeItem(SAVE_KEY);
                    startIntroSequence();
                }
            };

            introButtonsContainer.appendChild(continueBtn);
            introButtonsContainer.appendChild(newGameBtn);

        } else {
            // New player
            const startGameBtn = document.createElement('button');
            startGameBtn.textContent = 'Commencez à Jouer';
            startGameBtn.className = 'imperium-btn';
            startGameBtn.onclick = startIntroSequence;
            introButtonsContainer.appendChild(startGameBtn);
        }
    }

    // --- Intro Flow ---
    function startIntroSequence() {
        titleScreen.classList.add('hidden');
        cinematicScreen.classList.remove('hidden');
        runCinematic();
    }

    function runCinematic() {
        // Animate loading bar
        setTimeout(() => {
            loadingBar.style.width = '100%';
            cinematicText.textContent = 'La fondation de Rome...';
        }, 100); // Small delay to ensure transition works

        // After cinematic, start tutorial
        setTimeout(() => {
            cinematicScreen.classList.add('hidden');
            tutorialScreen.classList.remove('hidden');
            // This function will be expanded in the next plan step
            startTutorial();
        }, 2500); // 2s for bar animation + 0.5s buffer
    }

    // --- Tutorial Logic ---
    let tutorialState = {
        gameState: null,
        currentStep: 0,
        targetSlotId: -1,
    };

    const tutorialNextBtn = document.getElementById('tutorial-next-btn');

    const tutorialSteps = [
        {
            message: "Bienvenue, Consul ! Pour commencer, nous devons nourrir notre peuple. Construisons une ferme. <br><br>Veuillez cliquer sur un terrain vide pour commencer.",
            action: 'clickEmptyPlot',
            showButton: false,
        },
        {
            message: "Parfait. Voici les bâtiments que vous pouvez construire. Sélectionnez la <strong>Ferme</strong>.",
            action: 'selectBuilding',
            showButton: false,
        },
        {
            message: "Excellent choix ! La construction de votre première ferme a commencé. Cela prendra un peu de temps.",
            action: 'wait',
            showButton: false,
        },
        {
            message: "Votre cité est sur la bonne voie. Vous êtes maintenant prêt à la diriger seul. Bonne chance, Consul !",
            action: 'finish',
            showButton: true,
        }
    ];

    function startTutorial() {
        // 1. Initialize a fresh gameState for the tutorial
        tutorialState.gameState = getDefaultGameState();

        // 2. Render the initial (empty) city grid for the tutorial
        renderTutorialGrid();

        // 3. Start the first step
        runTutorialStep(0);
    }

    function runTutorialStep(stepIndex) {
        tutorialState.currentStep = stepIndex;
        const step = tutorialSteps[stepIndex];
        if (!step) return;

        // Update modal message and button visibility
        const tutorialMessage = document.getElementById('tutorial-message');
        tutorialMessage.innerHTML = step.message;
        tutorialNextBtn.style.display = step.showButton ? 'inline-block' : 'none';

        // Setup UI and listeners for the step
        setupStepAction(step.action);
    }

    function setupStepAction(action) {
        // Remove previous highlights and listeners to avoid conflicts
        clearHighlights();
        clearSlotListeners();

        const grid = document.getElementById('tutorialBuildingsGrid');
        if (action === 'clickEmptyPlot') {
            const slots = grid.querySelectorAll('.building-slot:not(.occupied)');
            slots.forEach(slot => {
                slot.classList.add('tutorial-highlight');
                slot.addEventListener('click', handlePlotClick);
            });
        } else if (action === 'selectBuilding') {
            // This assumes the modal is open. The highlight logic is in handlePlotClick
        } else if (action === 'finish') {
            tutorialNextBtn.textContent = "Aller à ma Cité";
            tutorialNextBtn.onclick = () => {
                // Overwrite global state, save it, and redirect
                gameState = tutorialState.gameState;
                saveGameState();
                window.location.href = 'game.html';
            };
        }
    }

    function handlePlotClick(event) {
        // The user clicked on an empty plot, as instructed.
        clearSlotListeners();
        clearHighlights();

        const slotId = parseInt(event.currentTarget.dataset.slotId);
        tutorialState.targetSlotId = slotId;

        // Reuse the logic from city-view to show the build modal, but simplified for the tutorial
        const buildOptions = Object.entries(BUILDING_DEFINITIONS).map(([type, def]) => {
            const costs = getCost(def.baseCost, def.upgradeCostMultiplier, 0);
            const costsHtml = costs.map(c => `<span>${c.amount.toLocaleString()} ${c.res}</span>`).join(', ');

            return `<div class="build-item" data-building-type="${type}" style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-gold); border-radius: 0.75rem; padding: 0.75rem; text-align: center; cursor: pointer;">
                        <div style="font-size: 1.8rem;">${def.icon}</div>
                        <div style="font-weight: bold; color: var(--gold-light); font-size: 0.9rem;">${def.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${costsHtml}</div>
                    </div>`;
        }).join('');
        const body = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem;">${buildOptions}</div>`;
        showModal('Construire un bâtiment', body, '');

        // Now that the modal is open, proceed to the next tutorial step
        runTutorialStep(1);

        // Highlight the farm and add a listener
        setTimeout(() => { // Timeout to ensure modal is rendered
            const farmButton = document.querySelector('.build-item[data-building-type="farm"]');
            if (farmButton) {
                farmButton.classList.add('tutorial-highlight');
                farmButton.addEventListener('click', handleFarmSelect);
            }
        }, 100);
    }

    function handleFarmSelect() {
        // User selected the farm.
        closeModal();

        // Use the game's logic to start building
        const type = 'farm';
        const slotId = tutorialState.targetSlotId;
        const def = BUILDING_DEFINITIONS[type];
        const costs = getCost(def.baseCost, def.upgradeCostMultiplier, 0);
        costs.forEach(c => tutorialState.gameState.resources[c.res] -= c.amount);
        const buildTime = 100; // Use a short time for the tutorial
        tutorialState.gameState.city.constructionQueue.push({ slotId, type, level: 1, endTime: Date.now() + buildTime, xpGain: def.xpGain });

        // Update the grid to show construction
        renderTutorialGrid();

        // Proceed to the next step
        runTutorialStep(2);

        // Automatically proceed to the final step after a delay
        setTimeout(() => {
            // "Complete" the construction for the user
            const item = tutorialState.gameState.city.constructionQueue.shift();
            const building = tutorialState.gameState.city.buildings.find(b => b.slotId === item.slotId);
            if (building) {
                building.type = item.type;
                building.level = item.level;
            }
            renderTutorialGrid();
            runTutorialStep(3);
        }, 1500);
    }

    function renderTutorialGrid() {
        const grid = document.getElementById('tutorialBuildingsGrid');
        if (!grid) return;
        grid.innerHTML = '';
        tutorialState.gameState.city.buildings.forEach(building => {
            const slot = document.createElement('div');
            slot.className = 'building-slot';
            slot.dataset.slotId = building.slotId;

            const isConstructing = tutorialState.gameState.city.constructionQueue.some(item => item.slotId === building.slotId);

            if (building.type) {
                const def = BUILDING_DEFINITIONS[building.type];
                slot.classList.add('occupied');
                slot.innerHTML = `<div class="building-icon">${def.icon}</div><div class="building-name">${def.name}</div><div class="building-level">Niv. ${building.level}</div>`;
            } else if (isConstructing) {
                slot.classList.add('constructing');
                slot.innerHTML = `<div class="building-icon">🔨</div><div class="building-name">Construction...</div>`;
            } else {
                slot.innerHTML = `<div class="building-icon" style="font-size: 2.5rem; color: var(--gold-light);">+</div>`;
            }
            grid.appendChild(slot);
        });
    }

    function clearHighlights() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    }

    function clearSlotListeners() {
        const slots = document.querySelectorAll('#tutorialBuildingsGrid .building-slot');
        slots.forEach(slot => {
            const newSlot = slot.cloneNode(true);
            slot.parentNode.replaceChild(newSlot, slot);
        });
    }

    // --- Initialisation ---
    initializeIntro();
});
