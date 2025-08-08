// ===============================================================
// IMPERIUM V19 - UNIFIED POPUP SYSTEM
// ===============================================================
// Système unifié de popups pour toutes les interactions du jeu
// ===============================================================

class UnifiedPopupSystem {
    constructor() {
        this.activePopups = new Map();
        this.popupStack = [];
        this.floatingButtons = new Map();
        this.init();
    }

    init() {
        this.createPopupContainer();
        this.createFloatingButtonsContainer();
        this.setupGlobalStyles();
        this.setupEventListeners();
    }

    createPopupContainer() {
        const container = document.createElement('div');
        container.id = 'unified-popup-container';
        container.className = 'unified-popup-container';
        document.body.appendChild(container);
    }

    createFloatingButtonsContainer() {
        const container = document.createElement('div');
        container.id = 'floating-buttons-container';
        container.className = 'floating-buttons-container';
        document.body.appendChild(container);
    }

    setupGlobalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .unified-popup-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 10000;
            }

            .floating-buttons-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 9999;
            }

            .unified-popup {
                position: absolute;
                background: linear-gradient(135deg, #2c1810, #1a0f08);
                border: 3px solid #b45309;
                border-radius: 15px;
                box-shadow: 0 0 30px rgba(180, 83, 9, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                pointer-events: all;
                transform: scale(0) rotate(180deg);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                max-width: 95vw;
                max-height: 95vh;
                overflow: hidden;
            }

            .unified-popup.active {
                transform: scale(1) rotate(0deg);
                opacity: 1;
            }

            .unified-popup.maximized {
                width: 95vw !important;
                height: 95vh !important;
                top: 2.5vh !important;
                left: 2.5vw !important;
            }

            .popup-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 20px;
                background: linear-gradient(90deg, #b45309, #d4651f);
                border-bottom: 2px solid #8b4513;
                cursor: move;
            }

            .popup-title {
                color: white;
                font-weight: bold;
                font-size: 1.1em;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
                margin: 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .popup-controls {
                display: flex;
                gap: 8px;
            }

            .popup-control-btn {
                width: 30px;
                height: 30px;
                border: none;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                transition: all 0.2s;
            }

            .popup-control-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }

            .popup-body {
                padding: 20px;
                overflow-y: auto;
                color: #e8dcc6;
                max-height: calc(95vh - 100px);
            }

            .floating-button {
                position: absolute;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #b45309, #d4651f);
                border: 3px solid #8b4513;
                color: white;
                font-size: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 15px rgba(180, 83, 9, 0.4);
                transition: all 0.3s;
                pointer-events: all;
                z-index: 9999;
            }

            .floating-button:hover {
                transform: scale(1.1) rotate(10deg);
                box-shadow: 0 6px 20px rgba(180, 83, 9, 0.6);
            }

            .floating-button.pulsing {
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { box-shadow: 0 4px 15px rgba(180, 83, 9, 0.4); }
                50% { box-shadow: 0 4px 25px rgba(180, 83, 9, 0.8); }
            }

            .mini-popup {
                width: 300px;
                height: 200px;
            }

            .medium-popup {
                width: 600px;
                height: 400px;
            }

            .large-popup {
                width: 900px;
                height: 600px;
            }

            .fullscreen-popup {
                width: 95vw;
                height: 95vh;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopPopup();
            }
        });

        // Gestion du drag and drop pour les popups
        this.setupDragAndDrop();
    }

    createPopup(id, title, content, size = 'medium', position = 'center') {
        if (this.activePopups.has(id)) {
            this.focusPopup(id);
            return this.activePopups.get(id);
        }

        const popup = document.createElement('div');
        popup.id = `popup-${id}`;
        popup.className = `unified-popup ${size}-popup`;
        popup.dataset.popupId = id;

        const header = document.createElement('div');
        header.className = 'popup-header';
        header.innerHTML = `
            <h3 class="popup-title">${title}</h3>
            <div class="popup-controls">
                <button class="popup-control-btn" onclick="popupSystem.minimizePopup('${id}')" title="Réduire">−</button>
                <button class="popup-control-btn" onclick="popupSystem.toggleMaximize('${id}')" title="Agrandir">□</button>
                <button class="popup-control-btn" onclick="popupSystem.closePopup('${id}')" title="Fermer">×</button>
            </div>
        `;

        const body = document.createElement('div');
        body.className = 'popup-body';
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.appendChild(content);
        }

        popup.appendChild(header);
        popup.appendChild(body);

        document.getElementById('unified-popup-container').appendChild(popup);

        this.positionPopup(popup, position);
        this.activePopups.set(id, popup);
        this.popupStack.push(id);

        // Animation d'ouverture
        requestAnimationFrame(() => {
            popup.classList.add('active');
        });

        return popup;
    }

    positionPopup(popup, position) {
        const rect = popup.getBoundingClientRect();
        
        switch (position) {
            case 'center':
                popup.style.left = `${(window.innerWidth - rect.width) / 2}px`;
                popup.style.top = `${(window.innerHeight - rect.height) / 2}px`;
                break;
            case 'top-left':
                popup.style.left = '50px';
                popup.style.top = '50px';
                break;
            case 'top-right':
                popup.style.right = '50px';
                popup.style.top = '50px';
                break;
            case 'bottom-right':
                popup.style.right = '50px';
                popup.style.bottom = '50px';
                break;
            default:
                if (typeof position === 'object') {
                    popup.style.left = position.x + 'px';
                    popup.style.top = position.y + 'px';
                }
        }
    }

    closePopup(id) {
        const popup = this.activePopups.get(id);
        if (!popup) return;

        popup.classList.remove('active');
        
        setTimeout(() => {
            popup.remove();
            this.activePopups.delete(id);
            const stackIndex = this.popupStack.indexOf(id);
            if (stackIndex > -1) {
                this.popupStack.splice(stackIndex, 1);
            }
        }, 400);
    }

    closeTopPopup() {
        if (this.popupStack.length > 0) {
            const topId = this.popupStack[this.popupStack.length - 1];
            this.closePopup(topId);
        }
    }

    focusPopup(id) {
        const popup = this.activePopups.get(id);
        if (!popup) return;

        // Réorganiser le z-index
        const stackIndex = this.popupStack.indexOf(id);
        if (stackIndex > -1) {
            this.popupStack.splice(stackIndex, 1);
        }
        this.popupStack.push(id);

        // Appliquer les z-index
        this.popupStack.forEach((popupId, index) => {
            const p = this.activePopups.get(popupId);
            if (p) p.style.zIndex = 10000 + index;
        });
    }

    toggleMaximize(id) {
        const popup = this.activePopups.get(id);
        if (!popup) return;

        popup.classList.toggle('maximized');
    }

    minimizePopup(id) {
        const popup = this.activePopups.get(id);
        if (!popup) return;

        popup.style.transform = 'scale(0.1)';
        popup.style.opacity = '0.3';
        
        // Créer un bouton flottant pour restaurer
        this.createFloatingButton(`restore-${id}`, '📋', () => {
            this.restorePopup(id);
        }, { x: 20, y: 100 + Object.keys(this.floatingButtons).length * 80 });
    }

    restorePopup(id) {
        const popup = this.activePopups.get(id);
        if (!popup) return;

        popup.style.transform = '';
        popup.style.opacity = '';
        this.removeFloatingButton(`restore-${id}`);
    }

    createFloatingButton(id, icon, onClick, position = 'random') {
        if (this.floatingButtons.has(id)) return;

        const button = document.createElement('button');
        button.className = 'floating-button';
        button.innerHTML = icon;
        button.onclick = onClick;

        if (position === 'random') {
            position = {
                x: Math.random() * (window.innerWidth - 100) + 50,
                y: Math.random() * (window.innerHeight - 100) + 50
            };
        }

        button.style.left = position.x + 'px';
        button.style.top = position.y + 'px';

        document.getElementById('floating-buttons-container').appendChild(button);
        this.floatingButtons.set(id, button);

        return button;
    }

    removeFloatingButton(id) {
        const button = this.floatingButtons.get(id);
        if (button) {
            button.remove();
            this.floatingButtons.delete(id);
        }
    }

    setupDragAndDrop() {
        let isDragging = false;
        let currentPopup = null;
        let startX, startY, startLeft, startTop;

        document.addEventListener('mousedown', (e) => {
            const header = e.target.closest('.popup-header');
            if (!header) return;

            const popup = header.closest('.unified-popup');
            if (!popup || popup.classList.contains('maximized')) return;

            isDragging = true;
            currentPopup = popup;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(popup.style.left) || 0;
            startTop = parseInt(popup.style.top) || 0;

            document.body.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !currentPopup) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            currentPopup.style.left = (startLeft + deltaX) + 'px';
            currentPopup.style.top = (startTop + deltaY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                currentPopup = null;
                document.body.style.cursor = '';
            }
        });
    }

    // Méthodes spécialisées pour le jeu
    showCombatSimulator(type = 'land') {
        const title = type === 'land' ? '⚔️ Simulateur de Combat Terrestre' : '⚓ Simulateur Naval';
        const id = `combat-sim-${type}`;
        
        const content = this.createCombatSimulatorContent(type);
        this.createPopup(id, title, content, 'large', 'center');
    }

    showWorldMap() {
        const content = this.createWorldMapContent();
        this.createPopup('world-map', '🗺️ Monde Antique', content, 'fullscreen', 'center');
    }

    showBuildingDetails(buildingType, slotId) {
        const building = BUILDING_DEFINITIONS[buildingType];
        const content = this.createBuildingDetailsContent(building, slotId);
        this.createPopup(`building-${slotId}`, `${building.icon} ${building.name}`, content, 'medium');
    }

    showResourceManagement() {
        const content = this.createResourceManagementContent();
        this.createPopup('resources', '💰 Gestion des Ressources', content, 'medium');
    }

    createCombatSimulatorContent(type) {
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="simulator-integrated">
                <div class="battle-setup" style="display: flex; gap: 20px; margin-bottom: 20px;">
                    <div class="army-setup" style="flex: 1; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
                        <h4>${type === 'land' ? '⚔️ Armée Attaquante' : '⛵ Flotte Attaquante'}</h4>
                        <div id="attacker-units-${type}"></div>
                    </div>
                    <div class="army-setup" style="flex: 1; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
                        <h4>${type === 'land' ? '🛡️ Armée Défenseuse' : '🏰 Flotte Défenseuse'}</h4>
                        <div id="defender-units-${type}"></div>
                    </div>
                </div>
                <div class="battle-controls" style="text-align: center;">
                    <button class="imperium-btn" onclick="popupSystem.startBattle('${type}')">
                        ${type === 'land' ? 'LANCER L\'ASSAUT' : 'LANCER L\'ATTAQUE'}
                    </button>
                </div>
            </div>
        `;

        // Initialiser le simulateur
        setTimeout(() => this.initializeCombatSimulator(type), 100);
        
        return container;
    }

    createWorldMapContent() {
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="world-map-integrated" style="position: relative; height: 100%;">
                <div id="integrated-world-map" style="width: 100%; height: 70%; background: #1a472a; border-radius: 10px; position: relative; overflow: hidden;">
                    <!-- Carte générée dynamiquement -->
                </div>
                <div class="world-controls" style="height: 25%; margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="imperium-btn" onclick="popupSystem.exploreRegion()">🔍 Explorer</button>
                    <button class="imperium-btn" onclick="popupSystem.tradeRoute()">🚛 Commerce</button>
                    <button class="imperium-btn" onclick="popupSystem.diplomacy()">🤝 Diplomatie</button>
                    <button class="imperium-btn" onclick="popupSystem.conquest()">⚔️ Conquête</button>
                </div>
            </div>
        `;

        setTimeout(() => this.initializeWorldMap(), 100);
        return container;
    }

    createBuildingDetailsContent(building, slotId) {
        const gameBuilding = gameState.city.buildings.find(b => b.slotId === slotId);
        const level = gameBuilding ? gameBuilding.level || 1 : 0;
        
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="building-details">
                <div class="building-info" style="margin-bottom: 20px;">
                    <p style="font-size: 1.1em; margin-bottom: 10px;">${building.description}</p>
                    ${level > 0 ? `<p><strong>Niveau actuel:</strong> ${level}</p>` : ''}
                </div>
                
                <div class="building-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    ${level === 0 ? 
                        `<button class="imperium-btn" onclick="popupSystem.constructBuilding('${building}', '${slotId}')">
                            🔨 Construire
                        </button>` :
                        `<button class="imperium-btn" onclick="popupSystem.upgradeBuilding('${slotId}')">
                            ⬆️ Améliorer
                        </button>`
                    }
                    
                    ${building.isInteractive ? 
                        `<button class="imperium-btn" onclick="popupSystem.interactBuilding('${slotId}')">
                            ⚡ Interagir
                        </button>` : ''
                    }
                    
                    ${level > 0 ? 
                        `<button class="imperium-btn destructive" onclick="popupSystem.demolishBuilding('${slotId}')">
                            💥 Démolir
                        </button>` : ''
                    }
                </div>
            </div>
        `;

        return container;
    }

    createResourceManagementContent() {
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="resource-management">
                <div class="resource-overview" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    ${Object.keys(gameState.resources).map(res => `
                        <div class="resource-card" style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
                            <h4>${this.getResourceIcon(res)} ${this.getResourceName(res)}</h4>
                            <div class="resource-bar" style="background: #333; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0;">
                                <div style="background: linear-gradient(90deg, #b45309, #d4651f); height: 100%; width: ${Math.min((gameState.resources[res] / (gameState.storage[res] || 1000)) * 100, 100)}%;"></div>
                            </div>
                            <p>${Math.floor(gameState.resources[res])} / ${gameState.storage[res] || '∞'}</p>
                        </div>
                    `).join('')}
                </div>
                
                <div class="resource-actions" style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                    <button class="imperium-btn" onclick="popupSystem.showMarket()">🏪 Marché</button>
                    <button class="imperium-btn" onclick="popupSystem.showProduction()">📈 Production</button>
                    <button class="imperium-btn" onclick="popupSystem.showStorage()">📦 Stockage</button>
                </div>
            </div>
        `;

        return container;
    }

    getResourceIcon(resource) {
        const icons = {
            gold: '💰',
            food: '🌾',
            marble: '🏛️',
            wood: '🪵',
            happiness: '😊'
        };
        return icons[resource] || '📦';
    }

    getResourceName(resource) {
        const names = {
            gold: 'Or',
            food: 'Nourriture',
            marble: 'Marbre',
            wood: 'Bois',
            happiness: 'Bonheur'
        };
        return names[resource] || resource;
    }

    // Méthodes d'interaction
    initializeCombatSimulator(type) {
        console.log(`Initializing ${type} combat simulator...`);
        
        const attackerContainer = document.getElementById(`attacker-units-${type}`);
        const defenderContainer = document.getElementById(`defender-units-${type}`);
        
        if (!attackerContainer || !defenderContainer) return;
        
        // Générer les unités disponibles selon le type
        const availableUnits = Object.keys(UNITS_CONFIG).filter(unitId => 
            UNITS_CONFIG[unitId].domain === type
        );
        
        this.renderUnitSelection(attackerContainer, availableUnits, 'attacker', type);
        this.renderUnitSelection(defenderContainer, availableUnits, 'defender', type);
    }

    renderUnitSelection(container, units, side, type) {
        container.innerHTML = `
            <div class="unit-selection-integrated">
                ${units.map(unitId => {
                    const unit = UNITS_CONFIG[unitId];
                    return `
                        <div class="unit-card" style="background: rgba(0,0,0,0.2); padding: 10px; margin: 5px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.5em;">${unit.icon}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: bold;">${unit.name}</div>
                                <div style="font-size: 0.8em; opacity: 0.8;">
                                    ⚔️${unit.attack} 🛡️${unit.defense} ❤️${unit.hp}
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <input type="number" min="0" max="1000" value="0" 
                                       id="${side}-${unitId}-${type}" class="unit-input-small"
                                       style="width: 60px; padding: 5px; border: 1px solid #b45309; border-radius: 4px; background: rgba(0,0,0,0.5); color: white; text-align: center;">
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    startBattle(type) {
        const attackerUnits = this.collectUnits('attacker', type);
        const defenderUnits = this.collectUnits('defender', type);
        
        if (Object.keys(attackerUnits).length === 0 && Object.keys(defenderUnits).length === 0) {
            showToast('Ajoutez des unités avant de commencer le combat!', 'warning');
            return;
        }
        
        // Simuler le combat
        const result = this.simulateBattle(attackerUnits, defenderUnits, type);
        this.showBattleResult(result, type);
    }

    collectUnits(side, type) {
        const units = {};
        const inputs = document.querySelectorAll(`input[id^="${side}-"][id$="-${type}"]`);
        
        inputs.forEach(input => {
            const amount = parseInt(input.value) || 0;
            if (amount > 0) {
                const unitId = input.id.split('-')[1];
                units[unitId] = amount;
            }
        });
        
        return units;
    }

    simulateBattle(attackerUnits, defenderUnits, type) {
        // Simulation simplifiée de combat
        let attackerPower = 0;
        let defenderPower = 0;
        
        Object.entries(attackerUnits).forEach(([unitId, count]) => {
            const unit = UNITS_CONFIG[unitId];
            attackerPower += (unit.attack + unit.defense) * count;
        });
        
        Object.entries(defenderUnits).forEach(([unitId, count]) => {
            const unit = UNITS_CONFIG[unitId];
            defenderPower += (unit.attack + unit.defense) * count * 1.2; // Bonus défenseur
        });
        
        const random = Math.random() * 0.4 + 0.8; // 80-120% variation
        const attackerWins = (attackerPower * random) > defenderPower;
        
        return {
            winner: attackerWins ? 'attacker' : 'defender',
            attackerLosses: Math.floor(Object.values(attackerUnits).reduce((a, b) => a + b, 0) * (attackerWins ? 0.2 : 0.8)),
            defenderLosses: Math.floor(Object.values(defenderUnits).reduce((a, b) => a + b, 0) * (attackerWins ? 0.9 : 0.3)),
            loot: attackerWins ? Math.floor(Math.random() * 500) + 200 : 0
        };
    }

    showBattleResult(result, type) {
        const content = `
            <div class="battle-result-integrated" style="text-align: center;">
                <div style="font-size: 3em; margin-bottom: 20px;">
                    ${result.winner === 'attacker' ? '🎉' : '💀'}
                </div>
                <h3 style="color: ${result.winner === 'attacker' ? '#4caf50' : '#f44336'}; margin-bottom: 20px;">
                    ${result.winner === 'attacker' ? 'VICTOIRE!' : 'DÉFAITE!'}
                </h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                    <div style="background: rgba(244, 67, 54, 0.2); padding: 15px; border-radius: 10px;">
                        <h4>💀 Pertes Attaquant</h4>
                        <div style="font-size: 1.5em; color: #f44336;">${result.attackerLosses}</div>
                    </div>
                    <div style="background: rgba(244, 67, 54, 0.2); padding: 15px; border-radius: 10px;">
                        <h4>💀 Pertes Défenseur</h4>
                        <div style="font-size: 1.5em; color: #f44336;">${result.defenderLosses}</div>
                    </div>
                </div>
                
                ${result.loot > 0 ? `
                    <div style="background: rgba(76, 175, 80, 0.2); padding: 15px; border-radius: 10px; margin-top: 20px;">
                        <h4>💰 Butin Capturé</h4>
                        <div style="font-size: 1.5em; color: #4caf50;">${result.loot} Or</div>
                    </div>
                ` : ''}
                
                <div style="margin-top: 30px;">
                    <button class="imperium-btn" onclick="popupSystem.closePopup('battle-result-${type}')">
                        Continuer
                    </button>
                </div>
            </div>
        `;
        
        this.createPopup(`battle-result-${type}`, '⚔️ Résultat du Combat', content, 'medium', 'center');
        
        // Appliquer les effets du combat
        if (result.winner === 'attacker' && result.loot > 0) {
            gameState.resources.gold += result.loot;
            showToast(`Vous avez gagné ${result.loot} or!`, 'success');
        }
    }

    initializeWorldMap() {
        console.log('Initializing world map...');
        const mapContainer = document.getElementById('integrated-world-map');
        if (mapContainer) {
            // Générer la carte du monde
            this.generateWorldRegions(mapContainer);
        }
    }

    generateWorldRegions(container) {
        const regions = [
            { name: 'Roma', x: 50, y: 60, status: 'controlled' },
            { name: 'Gallia', x: 30, y: 30, status: 'neutral' },
            { name: 'Aegyptus', x: 80, y: 80, status: 'enemy' },
            { name: 'Hispania', x: 20, y: 60, status: 'ally' }
        ];

        regions.forEach(region => {
            const regionEl = document.createElement('div');
            regionEl.className = `world-region ${region.status}`;
            regionEl.style.cssText = `
                position: absolute;
                left: ${region.x}%;
                top: ${region.y}%;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: ${this.getRegionColor(region.status)};
                border: 3px solid #b45309;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                transition: all 0.3s;
            `;
            
            regionEl.innerHTML = this.getRegionIcon(region.status);
            regionEl.title = region.name;
            
            regionEl.onclick = () => this.selectWorldRegion(region);
            
            container.appendChild(regionEl);
        });
    }

    getRegionColor(status) {
        const colors = {
            controlled: '#2d7d32',
            neutral: '#ffa000',
            enemy: '#d32f2f',
            ally: '#1976d2'
        };
        return colors[status] || '#666';
    }

    getRegionIcon(status) {
        const icons = {
            controlled: '🏛️',
            neutral: '🏰',
            enemy: '⚔️',
            ally: '🤝'
        };
        return icons[status] || '❓';
    }

    selectWorldRegion(region) {
        console.log('Selected region:', region);
        // Afficher les actions possibles pour cette région
        const actions = this.getRegionActions(region);
        this.showRegionActionPopup(region, actions);
    }

    getRegionActions(region) {
        switch (region.status) {
            case 'controlled':
                return ['Développer', 'Fortifier', 'Recruter'];
            case 'neutral':
                return ['Négocier', 'Commerce', 'Conquérir'];
            case 'enemy':
                return ['Attaquer', 'Espionner', 'Assiéger'];
            case 'ally':
                return ['Commercer', 'Demander aide', 'Coopérer'];
            default:
                return ['Explorer'];
        }
    }

    showRegionActionPopup(region, actions) {
        const content = `
            <div class="region-actions">
                <h4>Actions disponibles pour ${region.name}</h4>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                    ${actions.map(action => 
                        `<button class="imperium-btn" onclick="popupSystem.executeRegionAction('${region.name}', '${action}')">
                            ${this.getActionIcon(action)} ${action}
                        </button>`
                    ).join('')}
                </div>
            </div>
        `;
        
        this.createPopup(`region-${region.name}`, `🗺️ ${region.name}`, content, 'mini');
    }

    getActionIcon(action) {
        const icons = {
            'Développer': '🏗️',
            'Fortifier': '🏰',
            'Recruter': '👨‍⚔️',
            'Négocier': '🤝',
            'Commerce': '💰',
            'Conquérir': '⚔️',
            'Attaquer': '🗡️',
            'Espionner': '🕵️',
            'Assiéger': '🏰',
            'Commercer': '🚛',
            'Demander aide': '🆘',
            'Coopérer': '🤝',
            'Explorer': '🔍'
        };
        return icons[action] || '⚡';
    }

    executeRegionAction(regionName, action) {
        console.log(`Executing ${action} on ${regionName}`);
        // Implémenter les actions selon le type
        this.closePopup(`region-${regionName}`);
        showToast(`${action} lancé sur ${regionName}!`, 'success');
    }

    // === NOUVELLES FONCTIONNALITÉS INTÉGRÉES ===

    showBuildingSelection(slotId) {
        const availableBuildings = Object.entries(BUILDING_DEFINITIONS).filter(([id, building]) => {
            // Vérifier les prérequis
            if (building.requires) {
                const requiredBuilding = gameState.city.buildings.find(b => 
                    b.type === building.requires.type && b.level >= building.requires.level
                );
                return !!requiredBuilding;
            }
            return true;
        });

        const content = `
            <div class="building-selection">
                <p style="margin-bottom: 20px; color: #e8dcc6;">Sélectionnez un bâtiment à construire :</p>
                <div class="buildings-grid-popup" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    ${availableBuildings.map(([buildingId, building]) => {
                        const cost = this.calculateBuildingCost(building, 1);
                        const canAfford = this.canAffordBuilding(cost);
                        
                        return `
                            <div class="building-option ${!canAfford ? 'disabled' : ''}" 
                                 onclick="${canAfford ? `popupSystem.constructBuilding('${buildingId}', '${slotId}')` : ''}"
                                 style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; transition: all 0.3s; ${!canAfford ? 'opacity: 0.5;' : ''}">
                                <div style="text-align: center; font-size: 3em; margin-bottom: 10px;">${building.icon}</div>
                                <h4 style="text-align: center; margin: 0 0 10px 0; color: #d4651f;">${building.name}</h4>
                                <p style="font-size: 0.9em; margin-bottom: 15px; opacity: 0.8;">${building.description}</p>
                                <div class="cost-display" style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;">
                                    ${cost.map(c => `
                                        <span style="background: ${this.canAffordResource(c.res, c.amount) ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}; padding: 3px 8px; border-radius: 12px; font-size: 0.8em;">
                                            ${this.getResourceIcon(c.res)} ${c.amount}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        this.createPopup(`building-selection-${slotId}`, '🏗️ Construire un Bâtiment', content, 'large', 'center');
    }

    calculateBuildingCost(building, level) {
        return building.baseCost.map(cost => ({
            res: cost.res,
            amount: Math.floor(cost.amount * Math.pow(building.upgradeCostMultiplier || 1.5, level - 1))
        }));
    }

    canAffordBuilding(cost) {
        return cost.every(c => this.canAffordResource(c.res, c.amount));
    }

    canAffordResource(resource, amount) {
        return (gameState.resources[resource] || 0) >= amount;
    }

    constructBuilding(buildingId, slotId) {
        const building = BUILDING_DEFINITIONS[buildingId];
        const cost = this.calculateBuildingCost(building, 1);
        
        if (!this.canAffordBuilding(cost)) {
            showToast('Ressources insuffisantes!', 'error');
            return;
        }

        // Déduire les coûts
        cost.forEach(c => {
            gameState.resources[c.res] -= c.amount;
        });

        // Ajouter le bâtiment
        const buildingSlot = gameState.city.buildings.find(b => b.slotId === slotId);
        if (buildingSlot) {
            buildingSlot.type = buildingId;
            buildingSlot.level = 1;
            buildingSlot.constructedAt = Date.now();
        }

        this.closePopup(`building-selection-${slotId}`);
        showToast(`${building.name} construit!`, 'success');
    }

    upgradeBuilding(slotId) {
        const buildingSlot = gameState.city.buildings.find(b => b.slotId === slotId);
        if (!buildingSlot || !buildingSlot.type) return;

        const building = BUILDING_DEFINITIONS[buildingSlot.type];
        const nextLevel = buildingSlot.level + 1;
        const cost = this.calculateBuildingCost(building, nextLevel);

        const content = `
            <div class="building-upgrade">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 4em;">${building.icon}</div>
                    <h3 style="color: #d4651f;">${building.name}</h3>
                    <p>Niveau ${buildingSlot.level} → ${nextLevel}</p>
                </div>
                
                <div class="upgrade-benefits" style="background: rgba(76, 175, 80, 0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <h4>🚀 Améliorations :</h4>
                    ${this.getBuildingUpgradeBenefits(building, nextLevel)}
                </div>
                
                <div class="upgrade-cost" style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <h4>💰 Coût de l'amélioration :</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 10px;">
                        ${cost.map(c => `
                            <span style="background: ${this.canAffordResource(c.res, c.amount) ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}; padding: 8px 12px; border-radius: 15px;">
                                ${this.getResourceIcon(c.res)} ${c.amount}
                            </span>
                        `).join('')}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    ${this.canAffordBuilding(cost) ? 
                        `<button class="imperium-btn" onclick="popupSystem.performUpgrade('${slotId}')">
                            ⬆️ Améliorer
                        </button>` :
                        `<button class="imperium-btn disabled" disabled>
                            💸 Ressources insuffisantes
                        </button>`
                    }
                </div>
            </div>
        `;

        this.createPopup(`upgrade-${slotId}`, '⬆️ Amélioration de Bâtiment', content, 'medium');
    }

    getBuildingUpgradeBenefits(building, level) {
        const benefits = [];
        
        if (building.production) {
            Object.entries(building.production).forEach(([res, amount]) => {
                benefits.push(`${this.getResourceIcon(res)} +${amount * level}/h`);
            });
        }
        
        if (building.storage) {
            Object.entries(building.storage).forEach(([res, amount]) => {
                benefits.push(`📦 +${amount * level} stockage ${res}`);
            });
        }
        
        if (building.housing) {
            benefits.push(`🏠 +${building.housing * level} population`);
        }

        return benefits.length > 0 ? benefits.join('<br>') : 'Fonctionnalités étendues';
    }

    performUpgrade(slotId) {
        const buildingSlot = gameState.city.buildings.find(b => b.slotId === slotId);
        if (!buildingSlot) return;

        const building = BUILDING_DEFINITIONS[buildingSlot.type];
        const cost = this.calculateBuildingCost(building, buildingSlot.level + 1);

        // Déduire les coûts
        cost.forEach(c => {
            gameState.resources[c.res] -= c.amount;
        });

        buildingSlot.level++;
        this.closePopup(`upgrade-${slotId}`);
        showToast(`${building.name} amélioré au niveau ${buildingSlot.level}!`, 'success');
    }

    interactBuilding(slotId) {
        const buildingSlot = gameState.city.buildings.find(b => b.slotId === slotId);
        if (!buildingSlot || !buildingSlot.type) return;

        const building = BUILDING_DEFINITIONS[buildingSlot.type];
        
        switch (buildingSlot.type) {
            case 'forum':
                this.showForumInteraction(slotId);
                break;
            case 'market':
                this.showMarketInteraction(slotId);
                break;
            case 'barracks':
                this.showBarracksInteraction(slotId);
                break;
            case 'shipyard':
                this.showShipyardInteraction(slotId);
                break;
            case 'pantheon':
                this.showPantheonInteraction(slotId);
                break;
            default:
                showToast(`${building.name} ne propose pas d'interactions spéciales.`, 'info');
        }
    }

    showForumInteraction(slotId) {
        const content = `
            <div class="forum-interaction">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 4em;">🏛️</div>
                    <h3 style="color: #d4651f;">Forum Romain</h3>
                </div>
                
                <div class="forum-actions" style="display: grid; gap: 15px;">
                    <button class="imperium-btn" onclick="popupSystem.enactDecree()" style="padding: 15px;">
                        📜 Promulguer un Décret
                    </button>
                    <button class="imperium-btn" onclick="popupSystem.holdTrial()" style="padding: 15px;">
                        ⚖️ Organiser un Procès
                    </button>
                    <button class="imperium-btn" onclick="popupSystem.celebrateFestival()" style="padding: 15px;">
                        🎭 Célébrer un Festival
                    </button>
                    <button class="imperium-btn" onclick="popupSystem.consultSenate()" style="padding: 15px;">
                        🏛️ Consulter le Sénat
                    </button>
                </div>
            </div>
        `;

        this.createPopup(`forum-${slotId}`, '🏛️ Forum Romain', content, 'medium');
    }

    showMarketInteraction(slotId) {
        const content = `
            <div class="market-interaction">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 4em;">🏪</div>
                    <h3 style="color: #d4651f;">Marché</h3>
                </div>
                
                <div class="trade-options" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    ${this.generateTradeOptions()}
                </div>
            </div>
        `;

        this.createPopup(`market-${slotId}`, '🏪 Marché', content, 'large');
    }

    generateTradeOptions() {
        const trades = [
            { give: 'food', giveAmount: 100, get: 'gold', getAmount: 50, icon: '🌾➡️💰' },
            { give: 'gold', giveAmount: 80, get: 'marble', getAmount: 30, icon: '💰➡️🏛️' },
            { give: 'marble', giveAmount: 50, get: 'wood', getAmount: 80, icon: '🏛️➡️🪵' },
            { give: 'wood', giveAmount: 60, get: 'food', getAmount: 90, icon: '🪵➡️🌾' }
        ];

        return trades.map(trade => {
            const canTrade = this.canAffordResource(trade.give, trade.giveAmount);
            return `
                <div class="trade-option ${!canTrade ? 'disabled' : ''}" 
                     onclick="${canTrade ? `popupSystem.executeTrade('${trade.give}', ${trade.giveAmount}, '${trade.get}', ${trade.getAmount})` : ''}"
                     style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; cursor: ${canTrade ? 'pointer' : 'not-allowed'}; transition: all 0.3s; ${!canTrade ? 'opacity: 0.5;' : ''}">
                    <div style="text-align: center; font-size: 2em; margin-bottom: 10px;">${trade.icon}</div>
                    <div style="text-align: center;">
                        <div>${this.getResourceIcon(trade.give)} ${trade.giveAmount}</div>
                        <div style="margin: 5px 0;">↓</div>
                        <div>${this.getResourceIcon(trade.get)} ${trade.getAmount}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    executeTrade(giveRes, giveAmount, getRes, getAmount) {
        if (!this.canAffordResource(giveRes, giveAmount)) {
            showToast('Ressources insuffisantes!', 'error');
            return;
        }

        gameState.resources[giveRes] -= giveAmount;
        gameState.resources[getRes] = (gameState.resources[getRes] || 0) + getAmount;
        
        showToast(`Échange réussi: ${giveAmount} ${giveRes} → ${getAmount} ${getRes}!`, 'success');
    }

    showBarracksInteraction(slotId) {
        const buildingSlot = gameState.city.buildings.find(b => b.slotId === slotId);
        const level = buildingSlot.level;
        
        const availableUnits = Object.entries(UNITS_CONFIG).filter(([id, unit]) => 
            unit.domain === 'land' && 
            unit.requires && 
            unit.requires.building === 'barracks' && 
            unit.requires.level <= level
        );

        const content = `
            <div class="barracks-interaction">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 4em;">⚔️</div>
                    <h3 style="color: #d4651f;">Caserne (Niveau ${level})</h3>
                </div>
                
                <div class="unit-recruitment" style="display: grid; gap: 15px;">
                    ${availableUnits.map(([unitId, unit]) => {
                        const canRecruit = this.canAffordBuilding(unit.cost);
                        return `
                            <div class="recruitment-option" style="display: flex; align-items: center; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
                                <div style="font-size: 2em; margin-right: 15px;">${unit.icon}</div>
                                <div style="flex: 1;">
                                    <h4 style="margin: 0; color: #d4651f;">${unit.name}</h4>
                                    <div style="font-size: 0.9em; opacity: 0.8;">⚔️${unit.attack} 🛡️${unit.defense} ❤️${unit.hp}</div>
                                    <div style="margin-top: 5px;">
                                        ${unit.cost.map(c => `${this.getResourceIcon(c.res)}${c.amount}`).join(' ')}
                                    </div>
                                </div>
                                <button class="imperium-btn ${!canRecruit ? 'disabled' : ''}" 
                                        ${canRecruit ? `onclick="popupSystem.recruitUnit('${unitId}')"` : 'disabled'}>
                                    👨‍⚔️ Recruter
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        this.createPopup(`barracks-${slotId}`, '⚔️ Caserne', content, 'large');
    }

    recruitUnit(unitId) {
        const unit = UNITS_CONFIG[unitId];
        
        if (!this.canAffordBuilding(unit.cost)) {
            showToast('Ressources insuffisantes!', 'error');
            return;
        }

        // Déduire les coûts
        unit.cost.forEach(c => {
            gameState.resources[c.res] -= c.amount;
        });

        // Ajouter l'unité aux troupes
        if (!gameState.army) gameState.army = {};
        gameState.army[unitId] = (gameState.army[unitId] || 0) + 1;

        showToast(`${unit.name} recruté!`, 'success');
    }

    // Actions rapides
    quickBuild() {
        const emptySlot = gameState.city.buildings.find(b => !b.type);
        if (!emptySlot) {
            showToast('Tous les terrains sont occupés!', 'warning');
            return;
        }
        this.showBuildingSelection(emptySlot.slotId);
    }

    quickRecruit() {
        const barracks = gameState.city.buildings.find(b => b.type === 'barracks');
        if (!barracks) {
            showToast('Construisez une Caserne d\'abord!', 'warning');
            return;
        }
        this.showBarracksInteraction(barracks.slotId);
    }

    quickTrade() {
        const market = gameState.city.buildings.find(b => b.type === 'market');
        if (!market) {
            showToast('Construisez un Marché d\'abord!', 'warning');
            return;
        }
        this.showMarketInteraction(market.slotId);
    }

    quickExplore() {
        this.showWorldMap();
    }

    // Autres fonctionnalités
    showTechnology() {
        const content = `
            <div class="technology-tree">
                <h3 style="text-align: center; color: #d4651f; margin-bottom: 20px;">🔬 Arbre Technologique</h3>
                <p style="text-align: center; opacity: 0.8;">Développement en cours...</p>
                <div style="text-align: center; margin-top: 30px;">
                    <button class="imperium-btn" onclick="popupSystem.closePopup('technology')">
                        Fermer
                    </button>
                </div>
            </div>
        `;
        this.createPopup('technology', '🔬 Technologies', content, 'large');
    }

    showDiplomacy() {
        const content = `
            <div class="diplomacy-panel">
                <h3 style="text-align: center; color: #d4651f; margin-bottom: 20px;">🤝 Relations Diplomatiques</h3>
                <p style="text-align: center; opacity: 0.8;">Système diplomatique en développement...</p>
                <div style="text-align: center; margin-top: 30px;">
                    <button class="imperium-btn" onclick="popupSystem.closePopup('diplomacy')">
                        Fermer
                    </button>
                </div>
            </div>
        `;
        this.createPopup('diplomacy', '🤝 Diplomatie', content, 'medium');
    }

    showSettings() {
        const content = `
            <div class="settings-panel">
                <h3 style="text-align: center; color: #d4651f; margin-bottom: 20px;">⚙️ Paramètres</h3>
                <div style="display: grid; gap: 15px;">
                    <label style="display: flex; align-items: center; justify-content: space-between;">
                        <span>Sons:</span>
                        <input type="checkbox" checked style="margin-left: 10px;">
                    </label>
                    <label style="display: flex; align-items: center; justify-content: space-between;">
                        <span>Notifications:</span>
                        <input type="checkbox" checked style="margin-left: 10px;">
                    </label>
                    <label style="display: flex; align-items: center; justify-content: space-between;">
                        <span>Sauvegarde automatique:</span>
                        <input type="checkbox" checked style="margin-left: 10px;">
                    </label>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <button class="imperium-btn" onclick="popupSystem.closePopup('settings')">
                        Fermer
                    </button>
                </div>
            </div>
        `;
        this.createPopup('settings', '⚙️ Paramètres', content, 'medium');
    }
}

// Instance globale
const popupSystem = new UnifiedPopupSystem();

// Fonctions d'aide pour l'intégration
function showCombatSimulator(type = 'land') {
    popupSystem.showCombatSimulator(type);
}

function showWorldMap() {
    popupSystem.showWorldMap();
}

function showBuildingPopup(buildingType, slotId) {
    popupSystem.showBuildingDetails(buildingType, slotId);
}

function showResourcesPopup() {
    popupSystem.showResourceManagement();
}