// ===============================================================
// IMPERIUM V19 - BATTLEMANAGER.JS
// ===============================================================
// Ce fichier centralise la logique de simulation de combat
// pour les batailles terrestres et navales.
// ===============================================================

class BattleManager {
    constructor(attacker, defender, domain, options = {}) {
        this.attacker = JSON.parse(JSON.stringify(attacker));
        this.defender = JSON.parse(JSON.stringify(defender));
        this.domain = domain; // 'land' or 'sea'
        this.options = options; // e.g., { terrain: 'plains', wallLevel: 5 } or { seaCondition: 'calm' }
        this.log = [];
        this.isSkipped = false;
    }

    async run() {
        this.addLog(`La bataille (${this.domain}) commence !`, true);

        for (let round = 1; round <= 30; round++) {
            if (this.isArmyDefeated(this.attacker.army) || this.isArmyDefeated(this.defender.army)) {
                break;
            }
            this.addLog(`--- Tour ${round} ---`);
            await this.executeTurn(this.attacker, this.defender, 'Attaquant');
            if (this.isArmyDefeated(this.defender.army)) break;
            await this.executeTurn(this.defender, this.attacker, 'Défenseur');
        }

        const victory = this.isArmyDefeated(this.defender.army) && !this.isArmyDefeated(this.attacker.army);
        this.addLog(victory ? 'VICTOIRE !' : 'DÉFAITE !', true);
        return {
            victory: victory,
            log: this.log,
            finalAttacker: this.attacker,
            finalDefender: this.defender,
        };
    }

    isArmyDefeated(army) {
        return Object.keys(army).length === 0 || Object.values(army).every(unit => unit.count <= 0);
    }

    addLog(message, isSpecial = false) {
        this.log.push({ message, isSpecial });
    }

    async executeTurn(currentAttacker, currentDefender, attackerSideName) {
        for (const unitName in currentAttacker.army) {
            if (this.isArmyDefeated(currentDefender.army)) break;

            const unit = currentAttacker.army[unitName];
            if (!unit || unit.count <= 0) continue;

            let damage = unit.count * unit.attack;

            // Domain-specific modifiers can be added here
            // e.g., if (this.domain === 'land' && this.options.terrain === 'forest' && unit.type === 'archer') ...

            // Simple targeting based on priority
            let targetKey = unit.priority;
            if (!currentDefender.army[targetKey] || currentDefender.army[targetKey].count <= 0) {
                targetKey = Object.keys(currentDefender.army).find(id => currentDefender.army[id].count > 0);
            }
            if (!targetKey) continue;
            const target = currentDefender.army[targetKey];

            const unitsLost = Math.min(target.count, Math.floor(damage / target.hp));
            if (unitsLost > 0) {
                target.count -= unitsLost;
                this.addLog(`${attackerSideName} : ${unit.name} x${Math.round(unit.count)} ${this.domain === 'sea' ? 'coulent' : 'tuent'} ${unitsLost} ${target.name}.`);
                if (target.count <= 0) {
                    delete currentDefender.army[targetKey];
                    this.addLog(`Les ${target.name} ont été anéantis !`, true);
                }
            }
        }
    }
}
