# 🏛️ IMPERIUM V20 UNIFIED - Interface Unifiée

## 🚀 Nouveau Système Complet

**IMPERIUM V20 UNIFIED** transforme complètement l'expérience de jeu avec une interface entièrement intégrée où **toutes les actions se font via des popups dynamiques flottants**.

## ✨ Fonctionnalités Principales

### 🎮 Interface Unifiée
- **Une seule page principale** : `imperium-unified.html`
- **Popups dynamiques** pour toutes les interactions
- **Boutons flottants** pour un accès rapide
- **Système de notifications** en temps réel
- **Raccourcis clavier** pour une expérience fluide

### 🏗️ Ma Cité - Interface Complète
- **Grille de bâtiments interactive** avec construction en temps réel
- **Système de construction** entièrement intégré dans des popups
- **Amélioration de bâtiments** avec prévisualisation des bénéfices
- **Interactions spécialisées** pour chaque type de bâtiment
- **Gestion des ressources** dynamique

### 🗺️ Monde Antique Intégré
- **Carte du monde** dans une popup plein écran
- **Régions interactives** avec actions contextuelles
- **Exploration, commerce, diplomatie** directement depuis la carte
- **Système de conquête** intégré

### ⚔️ Simulateurs de Combat Intégrés
- **Combat terrestre** et **combat naval** dans des popups
- **Interface simplifiée** avec sélection d'unités
- **Résultats visuels** avec animations
- **Intégration complète** avec l'économie du jeu

## 🎯 Démarrage Rapide

1. **Lancez le jeu** : Ouvrez `imperium-unified.html`
2. **Explorez l'interface** : Cliquez sur les terrains libres pour construire
3. **Utilisez les boutons flottants** : Menu de navigation à droite
4. **Actions rapides** : Panneau en bas de l'écran
5. **Raccourcis clavier** : Alt + touches pour accès rapide

## ⌨️ Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Alt + 1` | 💰 Gestion des Ressources |
| `Alt + 2` | 🗺️ Monde Antique |
| `Alt + 3` | ⚔️ Simulateur Combat Terrestre |
| `Alt + 4` | ⚓ Simulateur Combat Naval |
| `Alt + Q` | 🔨 Construction Rapide |
| `Alt + W` | 👨‍⚔️ Recrutement Rapide |
| `Alt + E` | 🚛 Commerce Rapide |
| `Alt + R` | 🔍 Explorer le Monde |
| `Escape`  | Fermer Popup Active |

## 🏗️ Système de Construction

### Construction de Bâtiments
1. **Cliquez sur un terrain libre** → Popup de sélection
2. **Choisissez un bâtiment** → Vérification des ressources
3. **Confirmation** → Construction instantanée

### Amélioration de Bâtiments
1. **Cliquez sur un bâtiment existant** → Menu d'actions
2. **Bouton "Améliorer"** → Popup avec coûts et bénéfices
3. **Confirmation** → Amélioration appliquée

### Interactions Spéciales
- **🏛️ Forum** : Décrets, procès, festivals, sénat
- **🏪 Marché** : Échanges de ressources en temps réel
- **⚔️ Caserne** : Recrutement d'unités terrestres
- **⚓ Chantier Naval** : Construction de navires
- **🏛️✨ Panthéon** : Bénédictions divines

## ⚔️ Combat Intégré

### Simulateur Terrestre
- **Unités disponibles** : Légionnaires, Archers, Cavaliers, Prétoriens, Machines de siège
- **Formation d'armée** : Interface intuitive par popup
- **Simulation en temps réel** avec résultats visuels

### Simulateur Naval
- **Flotte variée** : Trirèmes, Quinquérèmes, Liburnes, Navires spécialisés
- **Conditions marines** : Météo et formations navales
- **Combat maritime** avec butin et expérience

## 🗺️ Monde Antique

### Carte Interactive
- **Régions colorées** selon le statut (contrôlée, neutre, ennemie, alliée)
- **Actions contextuelles** pour chaque région
- **Exploration et expansion** en temps réel

### Actions Disponibles
- **🏗️ Développer** : Améliorer les régions contrôlées
- **🤝 Négocier** : Diplomatie avec régions neutres
- **⚔️ Conquérir** : Expansion militaire
- **🚛 Commercer** : Routes commerciales

## 📊 Système de Ressources

### Ressources Principales
- **💰 Or** : Monnaie principale
- **🌾 Nourriture** : Population et armées
- **🏛️ Marbre** : Constructions nobles
- **🪵 Bois** : Navires et structures

### Gestion Dynamique
- **Production automatique** basée sur les bâtiments
- **Stockage limité** nécessitant des entrepôts
- **Échanges commerciaux** via le marché
- **Affichage en temps réel** dans l'overlay

## 🎯 Système de Notifications

- **Événements aléatoires** : Commerce, récoltes, festivals
- **Constructions terminées** : Notifications automatiques
- **Quêtes accomplies** : Suivi des objectifs
- **Erreurs et confirmations** : Feedback immédiat

## 🛠️ Architecture Technique

### Fichiers Principaux
- **`imperium-unified.html`** : Page principale unifiée
- **`js/unified-popup-system.js`** : Système de popups
- **`js/unified-game-controller.js`** : Contrôleur principal
- **`js/game.js`** : Données et logique de jeu

### Système de Popups
- **Création dynamique** : Popups générés à la demande
- **Drag & drop** : Repositionnement libre
- **Redimensionnement** : Minimiser, maximiser
- **Empilage** : Gestion du z-index automatique

### Gestion d'État
- **gameState global** : État centralisé du jeu
- **Sauvegarde automatique** : Toutes les 30 secondes
- **Validation d'intégrité** : Vérifications au démarrage

## 🎮 Expérience de Jeu

### Interface Fluide
- **Animations CSS** : Transitions douces
- **Feedback visuel** : Hover et états actifs
- **Responsive design** : Adaptable à tout écran

### Interactions Intuitives
- **Clic droit contextuel** : Actions rapides
- **Double-clic** : Actions par défaut
- **Tooltips informatifs** : Aide contextuelle

### Performance
- **Optimisations** : Rendu uniquement si nécessaire
- **Gestion mémoire** : Nettoyage des popups fermées
- **Chargement progressif** : Scripts defer

## 🚀 Lancement

Ouvrez simplement **`imperium-unified.html`** dans votre navigateur pour démarrer l'expérience IMPERIUM V20 unifiée !

---

## 📝 Notes Techniques

- **Compatibilité** : Navigateurs modernes (Chrome, Firefox, Safari)
- **Stockage** : localStorage pour la sauvegarde
- **Performance** : 60 FPS sur machines moyennes
- **Extensibilité** : Architecture modulaire pour ajouts futurs

---

**🏛️ Ave Caesar! Votre Empire Unifié vous attend!**