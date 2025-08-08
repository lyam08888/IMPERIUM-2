// ===============================================================
// IMPERIUM V20 PREMIUM - ADVANCED QUEST & EVENTS SYSTEM
// ===============================================================

class PremiumQuestSystem {
    constructor() {
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.questHistory = [];
        this.dynamicEvents = new Map();
        this.storyArcs = new Map();
        this.playerChoices = [];
        
        this.questDifficulty = 'normal';
        this.seasonalEvents = [];
        this.emergencyEvents = [];
        
        this.initializeQuestSystem();
        this.loadQuestData();
        this.startDynamicEventSystem();
    }

    initializeQuestSystem() {
        console.log('📜 Initializing Premium Quest System...');
        
        // Définir les types de quêtes disponibles
        this.questTypes = {
            main: { name: 'Quête Principale', color: '#d97706', priority: 10 },
            side: { name: 'Quête Secondaire', color: '#3b82f6', priority: 5 },
            daily: { name: 'Défi Quotidien', color: '#22c55e', priority: 3 },
            weekly: { name: 'Défi Hebdomadaire', color: '#7c3aed', priority: 7 },
            seasonal: { name: 'Événement Saisonnier', color: '#f59e0b', priority: 9 },
            emergency: { name: 'Événement d\'Urgence', color: '#ef4444', priority: 15 }
        };

        this.questRewardTypes = {
            resources: ['gold', 'food', 'marble', 'wood'],
            units: ['legionnaire', 'archer', 'cavalier'],
            buildings: ['forum', 'market', 'farm'],
            special: ['xp_boost', 'production_boost', 'construction_boost'],
            cosmetic: ['banner', 'title', 'decoration'],
            battle_pass: ['xp', 'tier_skip']
        };

        this.generateInitialQuests();
        this.createStoryArcs();
    }

    generateInitialQuests() {
        // Quête d'introduction
        this.createQuest({
            id: 'welcome_to_rome',
            type: 'main',
            title: '🏛️ Bienvenue à Rome !',
            description: 'Établissez les fondations de votre empire en construisant vos premiers bâtiments.',
            objectives: [
                { type: 'build', target: 'farm', amount: 1, current: 0, description: 'Construire une ferme' },
                { type: 'build', target: 'market', amount: 1, current: 0, description: 'Construire un marché' },
                { type: 'reach_population', target: 100, current: 0, description: 'Atteindre 100 habitants' }
            ],
            rewards: [
                { type: 'resources', resource: 'gold', amount: 500 },
                { type: 'resources', resource: 'food', amount: 300 },
                { type: 'special', item: 'construction_boost', duration: 3600 }
            ],
            timeLimit: null,
            prerequisites: [],
            consequences: {
                completion: ['unlock_advanced_buildings', 'start_economic_arc']
            }
        });

        // Quêtes quotidiennes dynamiques
        this.generateDailyQuests();
    }

    createQuest(questData) {
        const quest = {
            id: questData.id,
            type: questData.type,
            title: questData.title,
            description: questData.description,
            objectives: questData.objectives.map(obj => ({ ...obj })),
            rewards: questData.rewards,
            timeLimit: questData.timeLimit,
            prerequisites: questData.prerequisites || [],
            consequences: questData.consequences || {},
            status: 'active',
            createdAt: Date.now(),
            progress: 0
        };

        this.activeQuests.set(quest.id, quest);
        this.updateQuestDisplay();
        this.showQuestNotification('new', quest);
        
        return quest;
    }

    generateDailyQuests() {
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('imperium_last_daily_reset');
        
        if (savedDate !== today) {
            this.clearDailyQuests();
            
            const dailyQuestTemplates = [
                {
                    id: `daily_production_${Date.now()}`,
                    type: 'daily',
                    title: '⚡ Producteur du Jour',
                    description: 'Collectez des ressources pour faire prospérer votre empire.',
                    generator: () => this.createProductionQuest()
                },
                {
                    id: `daily_military_${Date.now()}`,
                    type: 'daily',
                    title: '⚔️ Entraînement Militaire',
                    description: 'Renforcez vos légions pour les batailles à venir.',
                    generator: () => this.createMilitaryQuest()
                },
                {
                    id: `daily_exploration_${Date.now()}`,
                    type: 'daily',
                    title: '🗺️ Exploration Territoriale',
                    description: 'Explorez de nouveaux territoires et découvrez leurs secrets.',
                    generator: () => this.createExplorationQuest()
                }
            ];

            // Générer 2-3 quêtes quotidiennes aléatoires
            const selectedQuests = this.shuffleArray(dailyQuestTemplates).slice(0, Math.floor(Math.random() * 2) + 2);
            selectedQuests.forEach(template => {
                const quest = template.generator();
                this.createQuest(quest);
            });

            localStorage.setItem('imperium_last_daily_reset', today);
        }
    }

    createProductionQuest() {
        const resources = ['gold', 'food', 'marble'];
        const selectedResource = resources[Math.floor(Math.random() * resources.length)];
        const targetAmount = Math.floor(Math.random() * 1000) + 500;

        return {
            id: `prod_${selectedResource}_${Date.now()}`,
            type: 'daily',
            title: `💰 Production de ${selectedResource}`,
            description: `Produisez ${targetAmount} unités de ${selectedResource} aujourd'hui.`,
            objectives: [
                {
                    type: 'produce',
                    target: selectedResource,
                    amount: targetAmount,
                    current: 0,
                    description: `Produire ${targetAmount} ${selectedResource}`
                }
            ],
            rewards: [
                { type: 'resources', resource: 'gold', amount: 200 },
                { type: 'battle_pass', item: 'xp', amount: 100 }
            ],
            timeLimit: Date.now() + 24 * 60 * 60 * 1000, // 24h
            prerequisites: []
        };
    }

    createMilitaryQuest() {
        const unitTypes = ['legionnaire', 'archer', 'cavalier'];
        const selectedUnit = unitTypes[Math.floor(Math.random() * unitTypes.length)];
        const targetAmount = Math.floor(Math.random() * 10) + 5;

        return {
            id: `military_${selectedUnit}_${Date.now()}`,
            type: 'daily',
            title: `🛡️ Entraînement de ${selectedUnit}s`,
            description: `Entraînez ${targetAmount} ${selectedUnit}s pour renforcer votre armée.`,
            objectives: [
                {
                    type: 'train',
                    target: selectedUnit,
                    amount: targetAmount,
                    current: 0,
                    description: `Entraîner ${targetAmount} ${selectedUnit}s`
                }
            ],
            rewards: [
                { type: 'resources', resource: 'gold', amount: 300 },
                { type: 'units', unit: selectedUnit, amount: 2 },
                { type: 'battle_pass', item: 'xp', amount: 150 }
            ],
            timeLimit: Date.now() + 24 * 60 * 60 * 1000,
            prerequisites: []
        };
    }

    createStoryArcs() {
        // Arc narratif : L'Ascension de Rome
        this.storyArcs.set('roman_ascension', {
            title: 'L\'Ascension de Rome',
            description: 'Guidez Rome depuis ses humbles débuts jusqu\'à devenir le maître du monde méditerranéen.',
            chapters: [
                {
                    id: 'founding_rome',
                    title: 'La Fondation',
                    quests: ['welcome_to_rome', 'first_citizens', 'early_trade']
                },
                {
                    id: 'expanding_influence',
                    title: 'Extension de l\'Influence',
                    quests: ['diplomatic_relations', 'military_might', 'cultural_development']
                },
                {
                    id: 'mediterranean_dominion',
                    title: 'Domination Méditerranéenne',
                    quests: ['naval_supremacy', 'economic_empire', 'roman_legacy']
                }
            ],
            rewards: {
                chapter: { type: 'special', item: 'chapter_title' },
                completion: { type: 'cosmetic', item: 'imperial_crown' }
            }
        });
    }

    startDynamicEventSystem() {
        // Événements aléatoires toutes les 10-30 minutes
        const triggerRandomEvent = () => {
            if (Math.random() < 0.3) { // 30% de chance
                this.triggerRandomEvent();
            }
            
            // Programmer le prochain événement
            const nextEventDelay = Math.random() * 20 * 60 * 1000 + 10 * 60 * 1000; // 10-30 min
            setTimeout(triggerRandomEvent, nextEventDelay);
        };

        // Démarrer après 5 minutes de jeu
        setTimeout(triggerRandomEvent, 5 * 60 * 1000);
    }

    triggerRandomEvent() {
        const eventTypes = [
            'merchant_caravan',
            'barbarian_raid',
            'natural_disaster',
            'diplomatic_opportunity',
            'resource_discovery',
            'plague_outbreak',
            'festival_celebration',
            'political_intrigue'
        ];

        const selectedEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const event = this.createDynamicEvent(selectedEvent);
        
        if (event) {
            this.showEventModal(event);
        }
    }

    createDynamicEvent(eventType) {
        const events = {
            merchant_caravan: {
                title: '🐪 Caravane Marchande',
                description: 'Une riche caravane marchande s\'arrête dans votre cité. Que souhaitez-vous faire ?',
                image: '🏪',
                choices: [
                    {
                        text: 'Commercer avec eux',
                        consequences: { resources: { gold: -100, marble: 50 }, happiness: 10 },
                        probability: 0.8
                    },
                    {
                        text: 'Leur offrir l\'hospitalité',
                        consequences: { resources: { food: -50, gold: 200 }, reputation: 15 },
                        probability: 0.9
                    },
                    {
                        text: 'Les ignorer',
                        consequences: { reputation: -5 },
                        probability: 1.0
                    }
                ]
            },
            barbarian_raid: {
                title: '⚔️ Raid Barbare',
                description: 'Des barbares menacent votre cité ! Comment réagissez-vous ?',
                image: '🔥',
                choices: [
                    {
                        text: 'Mobiliser la garde',
                        consequences: { resources: { gold: -150 }, military_xp: 100 },
                        requirements: { military: 50 },
                        probability: 0.7
                    },
                    {
                        text: 'Négocier un tribut',
                        consequences: { resources: { gold: -300 }, reputation: -10 },
                        probability: 0.9
                    },
                    {
                        text: 'Fuir vers les collines',
                        consequences: { resources: { food: -100 }, happiness: -20 },
                        probability: 1.0
                    }
                ]
            },
            resource_discovery: {
                title: '💎 Découverte de Ressources',
                description: 'Vos explorateurs ont découvert un gisement précieux !',
                image: '⛏️',
                choices: [
                    {
                        text: 'Exploiter immédiatement',
                        consequences: { resources: { marble: 500, gold: -200 } },
                        probability: 1.0
                    },
                    {
                        text: 'Étudier d\'abord le site',
                        consequences: { resources: { marble: 800, gold: -100 }, delay: 3600 },
                        probability: 0.8
                    }
                ]
            }
        };

        return events[eventType] || null;
    }

    showEventModal(event) {
        const modal = document.createElement('div');
        modal.className = 'event-modal-overlay';
        modal.innerHTML = `
            <div class="event-modal">
                <div class="event-header">
                    <div class="event-icon">${event.image}</div>
                    <h2 class="event-title">${event.title}</h2>
                </div>
                <div class="event-content">
                    <p class="event-description">${event.description}</p>
                    <div class="event-choices">
                        ${event.choices.map((choice, index) => `
                            <button class="event-choice-btn" data-choice="${index}">
                                <span class="choice-text">${choice.text}</span>
                                ${choice.requirements ? `<span class="choice-requirements">${this.formatRequirements(choice.requirements)}</span>` : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Style CSS pour les événements
        const eventCSS = `
        .event-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }

        .event-modal {
            background: linear-gradient(135deg, var(--dark-stone), var(--dark-bg));
            border: 3px solid var(--gold-primary);
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            padding: 0;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }

        .event-header {
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-secondary));
            padding: 20px;
            text-align: center;
            color: white;
        }

        .event-icon {
            font-size: 3em;
            margin-bottom: 10px;
        }

        .event-title {
            margin: 0;
            font-size: 1.5em;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }

        .event-content {
            padding: 20px;
        }

        .event-description {
            margin-bottom: 20px;
            line-height: 1.6;
            color: var(--text-light);
        }

        .event-choices {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .event-choice-btn {
            background: linear-gradient(135deg, var(--dark-marble), var(--dark-stone));
            border: 2px solid var(--border-gold);
            border-radius: 10px;
            padding: 15px;
            color: var(--text-light);
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
        }

        .event-choice-btn:hover {
            border-color: var(--gold-primary);
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-secondary));
            transform: translateX(5px);
        }

        .choice-text {
            font-weight: bold;
        }

        .choice-requirements {
            display: block;
            font-size: 0.8em;
            color: var(--text-muted);
            margin-top: 5px;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        `;

        if (!document.getElementById('event-styles')) {
            const style = document.createElement('style');
            style.id = 'event-styles';
            style.textContent = eventCSS;
            document.head.appendChild(style);
        }

        // Gestionnaire des choix
        modal.addEventListener('click', (e) => {
            const choiceBtn = e.target.closest('.event-choice-btn');
            if (choiceBtn) {
                const choiceIndex = parseInt(choiceBtn.dataset.choice);
                this.executeEventChoice(event, event.choices[choiceIndex]);
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    executeEventChoice(event, choice) {
        // Vérifier les prérequis
        if (choice.requirements && !this.checkRequirements(choice.requirements)) {
            showToast('❌ Conditions non remplies', 'error');
            return;
        }

        // Test de probabilité
        if (Math.random() > choice.probability) {
            showToast('❌ L\'action a échoué !', 'error');
            return;
        }

        // Appliquer les conséquences
        this.applyConsequences(choice.consequences);
        
        // Feedback utilisateur
        showToast(`✅ ${choice.text} - Conséquences appliquées`, 'success');
        
        // Sauvegarder le choix pour les statistiques
        this.playerChoices.push({
            event: event.title,
            choice: choice.text,
            timestamp: Date.now(),
            consequences: choice.consequences
        });
    }

    applyConsequences(consequences) {
        if (consequences.resources && typeof gameState !== 'undefined') {
            Object.entries(consequences.resources).forEach(([resource, amount]) => {
                if (gameState.resources[resource] !== undefined) {
                    gameState.resources[resource] = Math.max(0, gameState.resources[resource] + amount);
                }
            });
        }

        if (consequences.happiness && gameState.city) {
            gameState.city.happiness = Math.min(100, Math.max(0, 
                gameState.city.happiness + consequences.happiness
            ));
        }

        // Déclencher la mise à jour de l'interface
        if (typeof recalculateCityStats === 'function') {
            recalculateCityStats();
        }
    }

    updateQuestProgress(type, target, amount = 1) {
        let progressMade = false;
        
        this.activeQuests.forEach((quest, questId) => {
            quest.objectives.forEach(objective => {
                if (objective.type === type && objective.target === target) {
                    objective.current = Math.min(objective.amount, objective.current + amount);
                    progressMade = true;
                    
                    if (objective.current >= objective.amount) {
                        this.checkQuestCompletion(quest);
                    }
                }
            });
        });

        if (progressMade) {
            this.updateQuestDisplay();
        }
    }

    checkQuestCompletion(quest) {
        const allObjectivesComplete = quest.objectives.every(obj => obj.current >= obj.amount);
        
        if (allObjectivesComplete) {
            this.completeQuest(quest.id);
        }
    }

    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return;

        // Donner les récompenses
        this.giveQuestRewards(quest.rewards);
        
        // Marquer comme terminée
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);
        
        // Ajouter à l'historique
        this.questHistory.push({
            ...quest,
            completedAt: Date.now(),
            status: 'completed'
        });

        // Notification
        this.showQuestNotification('completed', quest);
        
        // Conséquences de la complétion
        if (quest.consequences.completion) {
            quest.consequences.completion.forEach(consequence => {
                this.handleQuestConsequence(consequence);
            });
        }

        // Sauvegarder
        this.saveQuestData();
    }

    showQuestNotification(type, quest) {
        const notifications = {
            new: { icon: '📜', message: `Nouvelle quête : ${quest.title}` },
            completed: { icon: '✅', message: `Quête terminée : ${quest.title}` },
            updated: { icon: '📈', message: `Quête mise à jour : ${quest.title}` }
        };

        const notification = notifications[type];
        if (notification && typeof showToast === 'function') {
            showToast(`${notification.icon} ${notification.message}`, type === 'completed' ? 'success' : 'info');
        }
    }

    updateQuestDisplay() {
        // Mettre à jour l'affichage des quêtes dans l'interface
        const questContainer = document.getElementById('quest-display');
        if (!questContainer) return;

        const activeQuestsArray = Array.from(this.activeQuests.values())
            .sort((a, b) => this.questTypes[b.type].priority - this.questTypes[a.type].priority);

        questContainer.innerHTML = activeQuestsArray.map(quest => {
            const progress = quest.objectives.reduce((sum, obj) => sum + (obj.current / obj.amount), 0) / quest.objectives.length * 100;
            
            return `
                <div class="quest-item ${quest.type}" onclick="premiumQuestSystem.showQuestDetails('${quest.id}')">
                    <div class="quest-header">
                        <span class="quest-type-badge" style="background: ${this.questTypes[quest.type].color}">
                            ${this.questTypes[quest.type].name}
                        </span>
                        ${quest.timeLimit ? `<span class="quest-timer">${this.formatTimeRemaining(quest.timeLimit)}</span>` : ''}
                    </div>
                    <h4 class="quest-title">${quest.title}</h4>
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="quest-objectives">
                        ${quest.objectives.map(obj => `
                            <div class="quest-objective ${obj.current >= obj.amount ? 'completed' : ''}">
                                ${obj.current >= obj.amount ? '✅' : '⏳'} ${obj.description} (${obj.current}/${obj.amount})
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    loadQuestData() {
        try {
            const saved = localStorage.getItem('imperium_premium_quests');
            if (saved) {
                const data = JSON.parse(saved);
                // Restaurer les données sauvegardées
                if (data.completedQuests) {
                    this.completedQuests = new Set(data.completedQuests);
                }
                if (data.questHistory) {
                    this.questHistory = data.questHistory;
                }
            }
        } catch (error) {
            console.error('Error loading quest data:', error);
        }
    }

    saveQuestData() {
        try {
            const dataToSave = {
                completedQuests: Array.from(this.completedQuests),
                questHistory: this.questHistory,
                playerChoices: this.playerChoices,
                lastSaved: Date.now()
            };
            localStorage.setItem('imperium_premium_quests', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Error saving quest data:', error);
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Initialisation automatique
window.premiumQuestSystem = new PremiumQuestSystem();

console.log('📜 Premium Quest System initialized');