// ===============================================================
// IMPERIUM V20 PREMIUM - ADVANCED DIPLOMACY SYSTEM
// ===============================================================

class PremiumDiplomacySystem {
    constructor() {
        this.nations = new Map();
        this.treaties = new Map();
        this.diplomaticActions = [];
        this.tradingRoutes = new Map();
        this.espionageMissions = new Map();
        this.culturalInfluence = new Map();
        
        this.playerReputation = {
            global: 50,
            military: 0,
            economic: 0,
            cultural: 0,
            religious: 0
        };

        this.initializeDiplomacy();
        this.createNations();
        this.startDiplomaticEvents();
    }

    initializeDiplomacy() {
        console.log('🤝 Initializing Premium Diplomacy System...');
        
        this.relationshipTypes = {
            war: { name: 'Guerre', value: -100, color: '#ef4444' },
            hostile: { name: 'Hostile', value: -50, color: '#f97316' },
            neutral: { name: 'Neutre', value: 0, color: '#6b7280' },
            friendly: { name: 'Amical', value: 50, color: '#22c55e' },
            allied: { name: 'Allié', value: 100, color: '#3b82f6' }
        };

        this.treatyTypes = {
            trade: { 
                name: 'Accord Commercial',
                benefits: { goldIncome: 0.15, tradeRoutes: 2 },
                costs: { influence: 10 },
                duration: 10 * 24 * 60 * 60 * 1000 // 10 jours
            },
            military: {
                name: 'Alliance Militaire',
                benefits: { defenseBonus: 0.25, sharedIntel: true },
                costs: { militaryCommitment: 20 },
                duration: 30 * 24 * 60 * 60 * 1000 // 30 jours
            },
            cultural: {
                name: 'Échange Culturel',
                benefits: { happinessBonus: 10, researchBonus: 0.1 },
                costs: { culturalInfluence: 15 },
                duration: 15 * 24 * 60 * 60 * 1000 // 15 jours
            },
            non_aggression: {
                name: 'Pacte de Non-Agression',
                benefits: { peace: true, tradeBonus: 0.05 },
                costs: { reputation: 5 },
                duration: 20 * 24 * 60 * 60 * 1000 // 20 jours
            }
        };
    }

    createNations() {
        const nationsData = [
            {
                id: 'carthage',
                name: 'Carthage',
                flag: '🏺',
                personality: 'merchant',
                strengths: ['naval', 'trade'],
                weaknesses: ['land_military'],
                initialRelation: -20,
                ai_behavior: {
                    aggressive: 0.3,
                    trading: 0.8,
                    expansionist: 0.5
                },
                resources: { gold: 5000, ships: 50 },
                territories: ['north_africa', 'sicily']
            },
            {
                id: 'gaul',
                name: 'Gaule',
                flag: '🛡️',
                personality: 'warrior',
                strengths: ['infantry', 'resistance'],
                weaknesses: ['naval', 'diplomacy'],
                initialRelation: -10,
                ai_behavior: {
                    aggressive: 0.7,
                    trading: 0.2,
                    expansionist: 0.6
                },
                resources: { warriors: 80, gold: 2000 },
                territories: ['gaul', 'northern_italy']
            },
            {
                id: 'egypt',
                name: 'Égypte',
                flag: '🐍',
                personality: 'scholar',
                strengths: ['naval', 'culture', 'wealth'],
                weaknesses: ['infantry'],
                initialRelation: 30,
                ai_behavior: {
                    aggressive: 0.2,
                    trading: 0.9,
                    expansionist: 0.3
                },
                resources: { gold: 8000, culture: 100 },
                territories: ['egypt', 'eastern_mediterranean']
            },
            {
                id: 'greece',
                name: 'Grèce',
                flag: '⚡',
                personality: 'cultured',
                strengths: ['culture', 'naval', 'philosophy'],
                weaknesses: ['unity', 'resources'],
                initialRelation: 40,
                ai_behavior: {
                    aggressive: 0.4,
                    trading: 0.6,
                    expansionist: 0.2
                },
                resources: { culture: 150, gold: 3000 },
                territories: ['greece', 'aegean_islands']
            },
            {
                id: 'germania',
                name: 'Germanie',
                flag: '🐺',
                personality: 'barbarian',
                strengths: ['infantry', 'raids', 'mobility'],
                weaknesses: ['organization', 'naval'],
                initialRelation: -30,
                ai_behavior: {
                    aggressive: 0.8,
                    trading: 0.1,
                    expansionist: 0.7
                },
                resources: { warriors: 120, raids: 5 },
                territories: ['germania', 'rhine']
            }
        ];

        nationsData.forEach(nationData => {
            const nation = {
                ...nationData,
                currentRelation: nationData.initialRelation,
                relationHistory: [],
                activeTreaties: new Set(),
                tradeBalance: 0,
                militaryActions: [],
                culturalProjects: [],
                lastDiplomaticAction: 0,
                emergingThreats: []
            };

            this.nations.set(nation.id, nation);
        });
    }

    startDiplomaticEvents() {
        // Événements diplomatiques aléatoires
        setInterval(() => {
            if (Math.random() < 0.2) { // 20% de chance toutes les 5 minutes
                this.triggerDiplomaticEvent();
            }
        }, 5 * 60 * 1000);

        // Évolution naturelle des relations
        setInterval(() => {
            this.evolveRelationships();
        }, 10 * 60 * 1000);
    }

    triggerDiplomaticEvent() {
        const nations = Array.from(this.nations.values());
        const randomNation = nations[Math.floor(Math.random() * nations.length)];
        
        const eventTypes = [
            'trade_proposal',
            'military_threat',
            'cultural_exchange',
            'border_dispute',
            'diplomatic_marriage',
            'technological_exchange',
            'refugee_crisis',
            'economic_embargo'
        ];

        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const event = this.createDiplomaticEvent(eventType, randomNation);
        
        if (event) {
            this.showDiplomaticEventModal(event);
        }
    }

    createDiplomaticEvent(type, nation) {
        const events = {
            trade_proposal: {
                title: `💰 Proposition Commerciale - ${nation.name}`,
                description: `${nation.name} ${nation.flag} propose un accord commercial lucratif. Cet accord pourrait augmenter vos revenus mais vous rendre dépendant de leurs routes commerciales.`,
                nation: nation,
                choices: [
                    {
                        text: 'Accepter l\'accord (Coût: 1000 Or)',
                        consequences: {
                            relation: 20,
                            resources: { gold: -1000 },
                            bonuses: { tradeIncome: 0.15 },
                            duration: 30 * 24 * 60 * 60 * 1000
                        },
                        requirements: { gold: 1000 }
                    },
                    {
                        text: 'Négocier des termes plus favorables',
                        consequences: { relation: 5, negotiation: true },
                        requirements: { reputation: 30 }
                    },
                    {
                        text: 'Décliner poliment',
                        consequences: { relation: -5 }
                    },
                    {
                        text: 'Refuser avec mépris',
                        consequences: { relation: -15, reputation: -5 }
                    }
                ]
            },
            military_threat: {
                title: `⚔️ Menace Militaire - ${nation.name}`,
                description: `Des rapports d\'espions indiquent que ${nation.name} ${nation.flag} masse des troupes près de vos frontières. Leurs intentions sont inconnues mais la situation est tendue.`,
                nation: nation,
                choices: [
                    {
                        text: 'Mobiliser nos légions',
                        consequences: { 
                            relation: -10, 
                            resources: { gold: -500 },
                            military_readiness: 25
                        },
                        requirements: { military: 100 }
                    },
                    {
                        text: 'Envoyer un émissaire',
                        consequences: { relation: 10, intelligence: true },
                        requirements: { reputation: 20 }
                    },
                    {
                        text: 'Renforcer les défenses',
                        consequences: { 
                            resources: { gold: -800, marble: -200 },
                            defense_bonus: 30
                        }
                    },
                    {
                        text: 'Ignorer la menace',
                        consequences: { relation: 0, risk: 'surprise_attack' }
                    }
                ]
            },
            cultural_exchange: {
                title: `🎭 Échange Culturel - ${nation.name}`,
                description: `${nation.name} ${nation.flag} propose un échange d\'érudits et d\'artistes pour enrichir mutuellement nos cultures et nos connaissances.`,
                nation: nation,
                choices: [
                    {
                        text: 'Organiser un grand festival',
                        consequences: {
                            relation: 25,
                            resources: { gold: -300, food: -200 },
                            bonuses: { happiness: 20, culture: 50 }
                        }
                    },
                    {
                        text: 'Accepter l\'échange',
                        consequences: {
                            relation: 15,
                            bonuses: { research: 0.1, happiness: 10 }
                        }
                    },
                    {
                        text: 'Décliner',
                        consequences: { relation: -10 }
                    }
                ]
            },
            border_dispute: {
                title: `🗺️ Conflit Frontalier - ${nation.name}`,
                description: `Un différend territorial éclate avec ${nation.name} ${nation.flag} concernant une région riche en ressources. La tension monte rapidement.`,
                nation: nation,
                choices: [
                    {
                        text: 'Revendiquer la région par la force',
                        consequences: {
                            relation: -50,
                            conflict: 'border_war',
                            potential_gain: { territory: 'disputed_region', resources: 'varies' }
                        },
                        requirements: { military: 200 }
                    },
                    {
                        text: 'Proposer une médiation',
                        consequences: {
                            relation: 5,
                            resources: { gold: -200 },
                            compromise: true
                        },
                        requirements: { reputation: 40 }
                    },
                    {
                        text: 'Céder le territoire',
                        consequences: {
                            relation: 20,
                            territory_loss: 'minor',
                            reputation: -10
                        }
                    }
                ]
            }
        };

        return events[type] || null;
    }

    showDiplomaticEventModal(event) {
        const modal = document.createElement('div');
        modal.className = 'diplomatic-event-overlay';
        modal.innerHTML = `
            <div class="diplomatic-event-modal">
                <div class="diplomatic-header">
                    <div class="nation-info">
                        <span class="nation-flag">${event.nation.flag}</span>
                        <div class="nation-details">
                            <h3>${event.nation.name}</h3>
                            <div class="relation-indicator ${this.getRelationClass(event.nation.currentRelation)}">
                                ${this.getRelationName(event.nation.currentRelation)} (${event.nation.currentRelation})
                            </div>
                        </div>
                    </div>
                    <div class="event-type">${event.title}</div>
                </div>
                
                <div class="diplomatic-content">
                    <div class="event-description">${event.description}</div>
                    
                    <div class="diplomatic-choices">
                        ${event.choices.map((choice, index) => `
                            <div class="diplomatic-choice ${this.canAffordChoice(choice) ? '' : 'disabled'}" 
                                 data-choice="${index}">
                                <div class="choice-header">
                                    <span class="choice-text">${choice.text}</span>
                                    ${choice.requirements ? `<span class="choice-cost">${this.formatRequirements(choice.requirements)}</span>` : ''}
                                </div>
                                <div class="choice-consequences">
                                    ${this.formatConsequences(choice.consequences)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Styles CSS pour la diplomatie
        this.addDiplomaticStyles();

        // Gestionnaire d'événements
        modal.addEventListener('click', (e) => {
            const choice = e.target.closest('.diplomatic-choice');
            if (choice && !choice.classList.contains('disabled')) {
                const choiceIndex = parseInt(choice.dataset.choice);
                this.executeDiplomaticChoice(event, event.choices[choiceIndex]);
                modal.remove();
            }
        });

        document.body.appendChild(modal);

        // Auto-suppression après 30 secondes
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
                showToast('⏰ Événement diplomatique expiré', 'warning');
            }
        }, 30000);
    }

    addDiplomaticStyles() {
        if (document.getElementById('diplomatic-styles')) return;

        const css = `
        .diplomatic-event-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.4s ease;
        }

        .diplomatic-event-modal {
            background: linear-gradient(135deg, var(--dark-stone), var(--dark-bg));
            border: 3px solid var(--gold-primary);
            border-radius: 20px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
        }

        .diplomatic-header {
            background: linear-gradient(135deg, var(--roman-red), var(--roman-purple));
            padding: 20px;
            color: white;
        }

        .nation-info {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }

        .nation-flag {
            font-size: 3em;
            filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5));
        }

        .nation-details h3 {
            margin: 0;
            font-size: 1.5em;
        }

        .relation-indicator {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }

        .relation-indicator.hostile { background: #ef4444; }
        .relation-indicator.neutral { background: #6b7280; }
        .relation-indicator.friendly { background: #22c55e; }
        .relation-indicator.allied { background: #3b82f6; }

        .event-type {
            font-size: 1.3em;
            font-weight: bold;
            text-align: center;
            background: rgba(0, 0, 0, 0.2);
            padding: 10px;
            border-radius: 10px;
        }

        .diplomatic-content {
            padding: 25px;
        }

        .event-description {
            margin-bottom: 25px;
            line-height: 1.6;
            font-size: 1.1em;
            color: var(--text-light);
        }

        .diplomatic-choices {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .diplomatic-choice {
            background: linear-gradient(135deg, var(--dark-marble), var(--dark-stone));
            border: 2px solid var(--border-gold);
            border-radius: 12px;
            padding: 18px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }

        .diplomatic-choice:hover:not(.disabled) {
            border-color: var(--gold-primary);
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-secondary));
            transform: translateX(8px);
            box-shadow: -5px 5px 15px rgba(0, 0, 0, 0.3);
        }

        .diplomatic-choice.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .choice-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .choice-text {
            font-weight: bold;
            color: var(--text-light);
        }

        .choice-cost {
            color: var(--roman-red);
            font-size: 0.9em;
            background: rgba(239, 68, 68, 0.2);
            padding: 4px 8px;
            border-radius: 8px;
        }

        .choice-consequences {
            font-size: 0.9em;
            color: var(--text-muted);
            line-height: 1.4;
        }

        .consequence-positive { color: var(--success-green); }
        .consequence-negative { color: var(--roman-red); }
        .consequence-neutral { color: var(--text-muted); }
        `;

        const style = document.createElement('style');
        style.id = 'diplomatic-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    executeDiplomaticChoice(event, choice) {
        const nation = event.nation;

        // Vérifier les prérequis
        if (!this.canAffordChoice(choice)) {
            showToast('❌ Conditions non remplies pour cette action', 'error');
            return;
        }

        // Appliquer les conséquences
        this.applyDiplomaticConsequences(nation, choice.consequences);

        // Enregistrer l'action
        this.diplomaticActions.push({
            event: event.title,
            nation: nation.id,
            choice: choice.text,
            timestamp: Date.now(),
            consequences: choice.consequences
        });

        // Feedback
        showToast(`🤝 Action diplomatique avec ${nation.name}: ${choice.text}`, 'info');

        // Sauvegarder
        this.saveDiplomaticData();
    }

    applyDiplomaticConsequences(nation, consequences) {
        // Modifier les relations
        if (consequences.relation) {
            nation.currentRelation += consequences.relation;
            nation.currentRelation = Math.max(-100, Math.min(100, nation.currentRelation));
            nation.relationHistory.push({
                change: consequences.relation,
                timestamp: Date.now(),
                reason: 'diplomatic_action'
            });
        }

        // Modifier les ressources
        if (consequences.resources && typeof gameState !== 'undefined') {
            Object.entries(consequences.resources).forEach(([resource, amount]) => {
                if (gameState.resources[resource] !== undefined) {
                    gameState.resources[resource] = Math.max(0, gameState.resources[resource] + amount);
                }
            });
        }

        // Appliquer les bonus
        if (consequences.bonuses) {
            this.applyDiplomaticBonuses(consequences.bonuses, consequences.duration);
        }

        // Gérer les conflits
        if (consequences.conflict) {
            this.initiateConflict(nation, consequences.conflict);
        }

        // Mettre à jour l'interface
        if (typeof recalculateCityStats === 'function') {
            recalculateCityStats();
        }
    }

    canAffordChoice(choice) {
        if (!choice.requirements || typeof gameState === 'undefined') return true;

        return Object.entries(choice.requirements).every(([requirement, value]) => {
            switch (requirement) {
                case 'gold':
                    return gameState.resources.gold >= value;
                case 'military':
                    return this.getMilitaryStrength() >= value;
                case 'reputation':
                    return this.playerReputation.global >= value;
                default:
                    return true;
            }
        });
    }

    getMilitaryStrength() {
        if (typeof gameState === 'undefined' || !gameState.army) return 0;
        
        return Object.values(gameState.army).reduce((total, units) => {
            return total + (Array.isArray(units) ? units.length : 0);
        }, 0);
    }

    getRelationName(value) {
        if (value <= -50) return 'Hostile';
        if (value < 0) return 'Méfiant';
        if (value === 0) return 'Neutre';
        if (value < 50) return 'Amical';
        return 'Allié';
    }

    getRelationClass(value) {
        if (value <= -50) return 'hostile';
        if (value < 0) return 'neutral';
        if (value === 0) return 'neutral';
        if (value < 50) return 'friendly';
        return 'allied';
    }

    formatRequirements(requirements) {
        return Object.entries(requirements).map(([key, value]) => {
            const formatMap = {
                gold: `${value} Or`,
                military: `${value} Force militaire`,
                reputation: `${value} Réputation`
            };
            return formatMap[key] || `${key}: ${value}`;
        }).join(', ');
    }

    formatConsequences(consequences) {
        const parts = [];
        
        if (consequences.relation) {
            const sign = consequences.relation > 0 ? '+' : '';
            parts.push(`<span class="consequence-${consequences.relation > 0 ? 'positive' : 'negative'}">
                Relations: ${sign}${consequences.relation}
            </span>`);
        }

        if (consequences.resources) {
            Object.entries(consequences.resources).forEach(([resource, amount]) => {
                const sign = amount > 0 ? '+' : '';
                parts.push(`<span class="consequence-${amount > 0 ? 'positive' : 'negative'}">
                    ${resource}: ${sign}${amount}
                </span>`);
            });
        }

        if (consequences.bonuses) {
            Object.entries(consequences.bonuses).forEach(([bonus, value]) => {
                parts.push(`<span class="consequence-positive">
                    ${bonus}: +${value}${typeof value === 'number' && value < 1 ? '%' : ''}
                </span>`);
            });
        }

        return parts.join('<br>');
    }

    saveDiplomaticData() {
        try {
            const dataToSave = {
                nations: Array.from(this.nations.entries()),
                diplomaticActions: this.diplomaticActions,
                playerReputation: this.playerReputation,
                lastSaved: Date.now()
            };
            localStorage.setItem('imperium_premium_diplomacy', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Error saving diplomatic data:', error);
        }
    }
}

// Initialisation automatique
window.premiumDiplomacySystem = new PremiumDiplomacySystem();

console.log('🤝 Premium Diplomacy System initialized');