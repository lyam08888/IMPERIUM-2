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
    const tutorialNextBtn = document.getElementById('tutorial-next-btn');

    // --- Check for Saved Game ---
    function initializeIntro() {
        const savedGame = localStorage.getItem(SAVE_KEY);
        introButtonsContainer.innerHTML = ''; // Clear any existing buttons

        if (savedGame) {
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
            const startGameBtn = document.createElement('button');
            startGameBtn.textContent = 'Commencez à Jouer';
            startGameBtn.className = 'imperium-btn';
            startGameBtn.onclick = startIntroSequence;
            introButtonsContainer.appendChild(startGameBtn);
            
            // Bouton pour aller directement au jeu
            const directBtn = document.createElement('button');
            directBtn.textContent = 'Jeu Direct (Sans Tutoriel)';
            directBtn.className = 'imperium-btn';
            directBtn.style.marginTop = '10px';
            directBtn.style.background = '#16a34a';
            directBtn.onclick = () => {
                if (confirm('Voulez-vous aller directement au jeu principal ?\n\nVous commencerez avec :\n• Une ferme déjà construite\n• Des ressources de base\n• Aucun tutoriel')) {
                    skipTutorialCompletely();
                }
            };
            introButtonsContainer.appendChild(directBtn);
        }
    }

    // --- Intro Flow ---
    function startIntroSequence() {
        titleScreen.classList.add('hidden');
        cinematicScreen.classList.remove('hidden');
        runCinematic();
    }

    function runCinematic() {
        setTimeout(() => {
            loadingBar.style.width = '100%';
            cinematicText.textContent = 'La fondation de Rome...';
        }, 100);

        setTimeout(() => {
            cinematicScreen.classList.add('hidden');
            tutorialScreen.classList.remove('hidden');
            startTutorial();
        }, 2500);
    }

    // --- Tutorial Logic ---
    let tutorialState = {
        gameState: null,
        currentStep: 0,
        targetSlotId: -1,
    };

    const tutorialSteps = [
        {
            message: "Bienvenue, Consul ! Pour commencer, nous devons nourrir notre peuple. Construisons une ferme. <br><br>Veuillez cliquer sur un terrain vide pour commencer.",
            action: 'clickEmptyPlot',
            highlight: '#tutorialBuildingsGrid .building-slot:not(.occupied)',
            showButton: false,
        },
        {
            message: "Parfait. Voici les bâtiments que vous pouvez construire. Sélectionnez la <strong>Ferme</strong>.",
            action: 'selectBuilding',
            highlight: '.build-item[data-building-type="farm"]',
            showButton: false,
        },
        {
            message: "Excellent choix ! La construction de votre première ferme a commencé. Pendant ce temps, parlons des ressources.",
            action: 'wait',
            showButton: true,
        },
        {
            message: "Voici vos ressources principales : l'Or, la Nourriture et le Marbre. La ferme que vous construisez produira de la nourriture.",
            action: 'highlightElement',
            highlight: '#tutorial-resources',
            showButton: true,
        },
        {
            message: "La construction est terminée ! Votre ferme produit maintenant de la nourriture pour votre peuple.",
            action: 'autoAdvance',
            showButton: false, // Will auto-advance
        },
        {
            message: "Félicitations ! Vous avez terminé votre premier objectif. Les objectifs vous guideront et vous offriront des récompenses.",
            action: 'highlightElement',
            highlight: '#tutorial-objectives-tile',
            showButton: true,
        },
        {
            message: "Votre cité est sur la bonne voie. Vous êtes maintenant prêt à la diriger seul. Bonne chance, Consul !",
            action: 'finish',
            showButton: true,
        }
    ];

    function startTutorial() {
        tutorialState.gameState = getDefaultGameState();
        renderTutorialGrid();
        renderTutorialResources();
        
        // Créer le bouton "passer le tutoriel" immédiatement
        createSkipTutorialButton();
        
        runTutorialStep(0);
        
        // Debug - Log tutorial startup
        console.log('Tutorial started - Bouton passer le tutoriel créé');
        setTimeout(() => {
            console.log('Tutorial slots after render:', document.querySelectorAll('#tutorialBuildingsGrid .building-slot').length);
            document.querySelectorAll('#tutorialBuildingsGrid .building-slot').forEach((slot, i) => {
                const styles = window.getComputedStyle(slot);
                console.log(`Slot ${i}:`, {
                    zIndex: styles.zIndex,
                    pointerEvents: styles.pointerEvents,
                    position: styles.position
                });
            });
        }, 100);
    }
    
    function createSkipTutorialButton() {
        // Créer un bouton fixe en haut à droite
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
            `;
            skipBtn.onclick = () => {
                if (confirm('Voulez-vous vraiment passer le tutoriel ?\n\nVous irez directement au jeu principal avec :\n• Une ferme déjà construite\n• Des ressources de base\n• Le premier objectif complété')) {
                    skipTutorialCompletely();
                }
            };
            document.body.appendChild(skipBtn);
        }
    }
    
    function skipTutorialCompletely() {
        // Create completed tutorial state
        const completedState = getDefaultGameState();
        
        // Add a farm to the first slot
        completedState.city.buildings[0].type = 'farm';
        completedState.city.buildings[0].level = 1;
        
        // Give resources as if the farm has been producing
        completedState.resources.food = 150;
        completedState.resources.gold = 120;
        completedState.resources.marble = 80;
        
        // Mark first quest as completed
        completedState.city.activeQuestId = 1;
        
        // Add some progress
        completedState.player.xp = 25;
        
        // Save and redirect
        localStorage.setItem(SAVE_KEY, JSON.stringify(completedState));
        console.log("Tutoriel complètement passé - redirection vers le jeu");
        window.location.href = 'game.html';
    }

    function runTutorialStep(stepIndex) {
        tutorialState.currentStep = stepIndex;
        const step = tutorialSteps[stepIndex];
        if (!step) return;

        // Update modal and button
        const tutorialMessage = document.getElementById('tutorial-message');
        let messageContent = step.message;
        
        // Add help message for problematic steps
        if (step.action === 'clickEmptyPlot') {
            messageContent += `<br><br><div style="color: #f59e0b; font-size: 0.9em; font-style: italic; margin-top: 10px;">
                ⚠️ Problème de clic ? Utilisez le bouton "PASSER LE TUTORIEL" ci-dessous pour aller directement au jeu !
            </div>`;
        }
        
        tutorialMessage.innerHTML = messageContent;
        tutorialNextBtn.style.display = step.showButton ? 'inline-block' : 'none';
        tutorialNextBtn.textContent = "Suivant"; // Reset button text
        
        // Add skip tutorial button if not already present
        if (!document.getElementById('skip-tutorial-btn')) {
            const skipBtn = document.createElement('button');
            skipBtn.id = 'skip-tutorial-btn';
            skipBtn.textContent = 'PASSER LE TUTORIEL';
            skipBtn.className = 'imperium-btn danger';
            skipBtn.style.marginLeft = '10px';
            skipBtn.style.fontSize = '1.1em';
            skipBtn.style.fontWeight = 'bold';
            skipBtn.onclick = () => {
                if (confirm('Voulez-vous vraiment passer le tutoriel ? Vous irez directement au jeu avec une ferme déjà construite.')) {
                    // Create completed tutorial state
                    const completedState = getDefaultGameState();
                    
                    // Add a farm to the first slot
                    completedState.city.buildings[0].type = 'farm';
                    completedState.city.buildings[0].level = 1;
                    
                    // Give some resources as if the farm has been producing
                    completedState.resources.food += 100;
                    completedState.resources.gold += 50;
                    
                    // Mark first quest as completed
                    completedState.city.activeQuestId = 1;
                    
                    // Save and redirect
                    localStorage.setItem(SAVE_KEY, JSON.stringify(completedState));
                    console.log("Tutoriel passé - état de base sauvegardé");
                    window.location.href = 'game.html';
                }
            };
            tutorialNextBtn.parentNode.appendChild(skipBtn);
        }

        // Handle highlighting
        clearHighlights();
        if (step.highlight) {
            document.querySelectorAll(step.highlight).forEach(el => el.classList.add('tutorial-highlight'));
        }

        setupStepAction(step.action);
    }

    function setupStepAction(action) {
        clearSlotListeners();

        if (action === 'clickEmptyPlot') {
            const slots = document.querySelectorAll('#tutorialBuildingsGrid .building-slot:not(.occupied)');
            slots.forEach(slot => {
                slot.addEventListener('click', handlePlotClick);
            });
            
            // SOLUTION DE SECOURS : Si aucun clic après 10 secondes, déclencher automatiquement
            setTimeout(() => {
                if (tutorialState.currentStep === 0) { // Si on est toujours sur la première étape
                    console.log("Déclenchement automatique du clic - problème détecté");
                    const firstEmptySlot = document.querySelector('#tutorialBuildingsGrid .building-slot:not(.occupied)');
                    if (firstEmptySlot) {
                        // Simuler le clic
                        const mockEvent = {
                            currentTarget: firstEmptySlot,
                            stopPropagation: () => {}
                        };
                        handlePlotClick(mockEvent);
                    }
                }
            }, 10000);
        } else if (action === 'highlightElement' || action === 'wait') {
            tutorialNextBtn.onclick = () => runTutorialStep(tutorialState.currentStep + 1);
        } else if (action === 'autoAdvance') {
            // Auto-advance to the next step after a short delay
            setTimeout(() => {
                runTutorialStep(tutorialState.currentStep + 1);
            }, 2000);
        } else if (action === 'finish') {
            tutorialNextBtn.textContent = "Aller à ma Cité";
            tutorialNextBtn.onclick = () => {
                // We save the tutorial state which includes the newly built farm
                // The main game will load this state.
                saveTutorialStateAsMain();
                window.location.href = 'game.html';
            };
        }
    }

    function handlePlotClick(event) {
        clearHighlights();
        clearSlotListeners();

        const slotId = parseInt(event.currentTarget.dataset.slotId);
        tutorialState.targetSlotId = slotId;

        // Simplified build modal from city-view.js
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

        runTutorialStep(1); // Advance to "select farm" step

        setTimeout(() => {
            const farmButton = document.querySelector('.build-item[data-building-type="farm"]');
            if (farmButton) {
                farmButton.addEventListener('click', handleFarmSelect);
            }
        }, 100);
    }

    function handleFarmSelect() {
        closeModal();

        const type = 'farm';
        const slotId = tutorialState.targetSlotId;
        const def = BUILDING_DEFINITIONS[type];
        const costs = getCost(def.baseCost, def.upgradeCostMultiplier, 0);
        costs.forEach(c => tutorialState.gameState.resources[c.res] -= c.amount);

        renderTutorialResources(); // Update resource display

        const buildTime = 100; // Short time for tutorial
        tutorialState.gameState.city.constructionQueue.push({ slotId, type, level: 1, endTime: Date.now() + buildTime, xpGain: def.xpGain });

        renderTutorialGrid();
        runTutorialStep(2); // Advance to "construction started" step

        setTimeout(() => {
            const item = tutorialState.gameState.city.constructionQueue.shift();
            const building = tutorialState.gameState.city.buildings.find(b => b.slotId === item.slotId);
            if (building) {
                building.type = item.type;
                building.level = item.level;
            }
            // Simulate resource production from the new farm
            tutorialState.gameState.resources.food += 50;

            // Complete the first quest
            tutorialState.gameState.city.activeQuestId = 1;

            renderTutorialGrid();
            renderTutorialResources();

            const questPreview = document.getElementById('tutorial-quest-preview');
            if(questPreview) {
                questPreview.innerHTML = `✅ Construire une Ferme`;
                questPreview.parentElement.classList.add('completed');
            }

            runTutorialStep(4); // Advance to "construction finished" step
        }, 2000); // Wait for "construction"
    }

    function renderTutorialGrid() {
        const grid = document.getElementById('tutorialBuildingsGrid');
        if (!grid) return;
        grid.innerHTML = '';
        tutorialState.gameState.city.buildings.forEach(building => {
            const slot = document.createElement('div');
            slot.className = 'building-slot';
            slot.dataset.slotId = building.slotId;
            slot.style.pointerEvents = 'auto'; // Ensure slots are always clickable
            slot.style.zIndex = '50'; // Force high z-index
            slot.style.position = 'relative'; // Ensure positioning context
            
            // Debug - add click logging
            slot.addEventListener('click', (e) => {
                console.log('Building slot clicked!', building.slotId);
                e.stopPropagation();
            });
            
            // Debug - add mouseover logging
            slot.addEventListener('mouseover', () => {
                console.log('Building slot hovered!', building.slotId);
            });
            
            const isConstructing = tutorialState.gameState.city.constructionQueue.some(item => item.slotId === building.slotId);

            if (isConstructing) {
                slot.classList.add('constructing');
                slot.innerHTML = `<div class="building-icon">🔨</div><div class="building-name">Construction...</div>`;
            } else if (building.type) {
                const def = BUILDING_DEFINITIONS[building.type];
                slot.classList.add('occupied');
                slot.innerHTML = `<div class="building-icon">${def.icon}</div><div class="building-name">${def.name}</div><div class="building-level">Niv. ${building.level}</div>`;
            } else {
                slot.innerHTML = `<div class="building-icon" style="font-size: 2.5rem; color: var(--gold-light);">+</div><div class="building-name">Terrain Libre</div>`;
            }
            grid.appendChild(slot);
        });
    }

    function renderTutorialResources() {
        const container = document.getElementById('tutorial-resources');
        if (!container) return;
        const resources = tutorialState.gameState.resources;
        container.innerHTML = `
            <span>💰 Or: ${Math.floor(resources.gold)}</span>
            <span>🌾 Nourriture: ${Math.floor(resources.food)}</span>
            <span>🏛️ Marbre: ${Math.floor(resources.marble)}</span>
        `;
    }

    function saveTutorialStateAsMain() {
        // This function overwrites the main game save with the tutorial's result
        try {
            const stateToSave = tutorialState.gameState;
            stateToSave.lastUpdate = Date.now();
            // Ensure tutorial-specific flags are not saved
            // (There are none currently, but good practice)
            localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
            console.log("Tutorial state saved as main game state.");
        } catch (error) {
            console.error("Error saving tutorial state:", error);
        }
    }

    function clearHighlights() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    }

    function clearSlotListeners() {
        const slots = document.querySelectorAll('#tutorialBuildingsGrid .building-slot');
        slots.forEach(slot => {
            // Remove only click listeners by removing the function reference
            slot.removeEventListener('click', handlePlotClick);
            // Ensure pointer-events are still active for CSS
            slot.style.pointerEvents = 'auto';
        });
    }

    // --- Initialisation ---
    initializeIntro();
});
