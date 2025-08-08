# 🧪 GUIDE DE TEST - IMPERIUM V20 UNIFIED

## 🚀 Tests à Effectuer

### 1. Lancement Initial
- [ ] Ouvrir `START-UNIFIED.html` - Page de lancement s'affiche
- [ ] Cliquer "LANCER IMPERIUM UNIFIÉ" - Redirection vers l'interface
- [ ] Vérifier le chargement - Loader puis interface unifiée

### 2. Interface Principale
- [ ] **Grille de bâtiments** : 20 emplacements visibles
- [ ] **Boutons flottants** : 7 boutons à droite de l'écran
- [ ] **Actions rapides** : 4 boutons en bas
- [ ] **Overlay statistiques** : Ressources et stats à gauche
- [ ] **Notifications** : Zone en haut à gauche

### 3. Construction de Bâtiments
- [ ] Cliquer sur un **terrain libre** → Popup de sélection
- [ ] Vérifier **coûts colorés** (vert = possible, rouge = impossible)
- [ ] Construire un **Marché** (coût : 80 or, 20 nourriture)
- [ ] Vérifier **déduction des ressources**
- [ ] Bâtiment **apparaît dans la grille**

### 4. Amélioration de Bâtiments
- [ ] Cliquer sur le **Forum existant**
- [ ] Bouton "Améliorer" → Popup avec coûts
- [ ] Vérifier les **bénéfices prévisionnels**
- [ ] Effectuer une amélioration si possible
- [ ] **Niveau affiché** sur le bâtiment

### 5. Interactions de Bâtiments
- [ ] **Marché** → Popup d'échanges avec 4 options
- [ ] **Forum** → 4 actions civiques disponibles
- [ ] Tester un **échange** (ex: 100 nourriture → 50 or)
- [ ] Vérifier **mise à jour des ressources**

### 6. Simulateurs de Combat
- [ ] Bouton ⚔️ → **Simulateur terrestre**
- [ ] Ajouter des unités dans les deux camps
- [ ] Cliquer "LANCER L'ASSAUT"
- [ ] Vérifier **résultats du combat**
- [ ] Bouton ⚓ → **Simulateur naval**
- [ ] Même processus pour le combat maritime

### 7. Monde Antique
- [ ] Bouton 🗺️ → **Popup plein écran**
- [ ] 4 régions visibles avec couleurs différentes
- [ ] Cliquer sur une région → **Actions contextuelles**
- [ ] Tester une action (ex: "Commerce" avec un allié)

### 8. Système de Popups
- [ ] **Drag & Drop** : Déplacer une popup
- [ ] **Redimensionnement** : Boutons minimiser/maximiser
- [ ] **Empilement** : Ouvrir plusieurs popups
- [ ] **Fermeture** : Bouton X ou Échap
- [ ] **Focus automatique** : Cliquer sur une popup en arrière-plan

### 9. Actions Rapides
- [ ] 🔨 **Construction** → Même que clic terrain libre
- [ ] 👨‍⚔️ **Recruter** → Popup caserne (si construite)
- [ ] 🚛 **Commerce** → Popup marché (si construit)
- [ ] 🔍 **Explorer** → Carte du monde

### 10. Raccourcis Clavier
- [ ] `Alt + 1` → **Gestion ressources**
- [ ] `Alt + 2` → **Monde antique**
- [ ] `Alt + 3` → **Combat terrestre**
- [ ] `Alt + 4` → **Combat naval**
- [ ] `Alt + Q` → **Construction rapide**
- [ ] `Alt + W` → **Recrutement rapide**
- [ ] `Alt + E` → **Commerce rapide**
- [ ] `Alt + R` → **Explorer**
- [ ] `Échap` → **Fermer popup active**

### 11. Notifications et Événements
- [ ] **Notifications automatiques** : Constructions, échanges
- [ ] **Événements aléatoires** : Attendre 5 minutes
- [ ] **Messages d'erreur** : Tenter action impossible
- [ ] **Confirmations** : Messages de succès

### 12. Système de Ressources
- [ ] **Production automatique** : Observer ressources augmenter
- [ ] **Limites de stockage** : Ressources plafonnées
- [ ] **Affichage temps réel** : Mise à jour chaque seconde
- [ ] **Déduction automatique** : Coûts calculés correctement

### 13. Sauvegarde
- [ ] **Sauvegarde automatique** : Toutes les 30 secondes
- [ ] **Persistance** : Recharger la page, état conservé
- [ ] **Nouveau jeu** : Effacer localStorage pour test

## 🐛 Problèmes Courants

### JavaScript non chargé
**Symptômes** : Boutons ne répondent pas, console avec erreurs
**Solution** : Vérifier que tous les fichiers JS sont présents

### Popups ne s'affichent pas
**Symptômes** : Clics sans effet
**Solution** : Vérifier la console, recharger la page

### Ressources incorrectes
**Symptômes** : Valeurs négatives ou NaN
**Solution** : Réinitialiser gameState dans localStorage

### Interface non responsive
**Symptômes** : Éléments mal positionnés
**Solution** : Redimensionner la fenêtre, vérifier CSS

## 🏁 Checklist de Validation

### ✅ Fonctionnalités Essentielles
- [ ] Construction et amélioration des bâtiments
- [ ] Système de ressources et production
- [ ] Combat terrestre et naval
- [ ] Exploration du monde
- [ ] Interface de popups complète

### ✅ Expérience Utilisateur
- [ ] Interface fluide et responsive
- [ ] Feedback visuel approprié
- [ ] Raccourcis clavier fonctionnels
- [ ] Notifications informatives
- [ ] Sauvegarde fiable

### ✅ Performance
- [ ] Pas de lag notable
- [ ] Popups s'ouvrent rapidement
- [ ] Animations fluides
- [ ] Consommation CPU raisonnable

## 🔧 Dépannage Rapide

### Reset Complet
```javascript
// Dans la console du navigateur
localStorage.clear();
location.reload();
```

### Debug Mode
```javascript
// Activer les logs détaillés
window.debugMode = true;
```

### État Manuel
```javascript
// Ajouter des ressources pour test
gameState.resources.gold = 10000;
gameState.resources.food = 5000;
```

## 📋 Rapport de Test

**Date** : ___________
**Navigateur** : ___________
**Version** : ___________

**Fonctionnalités testées** : ___/13
**Problèmes rencontrés** : ___________
**Notes** : ___________

---

**🎯 L'interface unifiée transforme complètement l'expérience IMPERIUM !**