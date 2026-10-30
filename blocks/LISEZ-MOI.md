# TIOKOVA BLOCKS — v1.0.0

Jeu de blocs rapide (parties de 2 à 5 min) pour TIOKOVA STORE.

## Ce que contient le jeu
- Mode **Classique** (sans fin) avec sauvegarde automatique de la partie
- **Défi du jour** : 3 minutes, mêmes pièces pour tous, 3 étoiles à gagner
- **Série de jours** avec cadeau qui grandit sur 7 jours + gel de série
- **3 missions par jour** + bonus si les 3 sont faites
- **36 succès**, niveaux et XP
- **Boutique** : 8 thèmes, 3 bonus (Marteau, Bombe, Mélange), lots
- **Coffre gratuit** toutes les 3 heures
- **Records** (top 10, calendrier des défis, statistiques)
- **Don Orange Money** : 657 15 97 93 (Vanelle Maheva)
- Français / Anglais, sons générés, vibrations, installable (PWA), hors connexion

## Où mettre les fichiers
Dans ton dépôt `tiokova-store`, le dossier `blocks` doit être à côté de ton `index.html` :

```
tiokova-store/
├── index.html        ← ta page du store (déjà existante)
└── blocks/           ← le jeu
    ├── index.html
    ├── manifest.json
    ├── sw.js
    ├── css/style.css
    ├── js/ (12 fichiers)
    └── icons/ (3 images)
```

Adresse du jeu une fois publié :
https://tiokou-bryan.github.io/tiokova-store/blocks/

## Lien à ajouter sur la page du store
```html
<a href="blocks/" class="app-card">
  <img src="blocks/icons/icon-192.png" alt="TIOKOVA BLOCKS" width="72" height="72">
  <div>
    <h3>TIOKOVA BLOCKS</h3>
    <p>Jeu de blocs rapide et addictif. Défi du jour, missions, records.</p>
  </div>
</a>
```

## Mettre à jour le jeu plus tard
1. Modifie les fichiers.
2. Dans `sw.js`, change `tk-blocks-v1.0.0` en `tk-blocks-v1.0.1` (sinon les joueurs gardent l'ancienne version).
3. Dans `js/data.js`, change `TK.VERSION`.

## Rôle de chaque fichier JS
| Fichier | Rôle |
|---|---|
| data.js | Pièces, thèmes, missions, succès (le contenu) |
| i18n.js | Tous les textes FR / EN |
| storage.js | Sauvegarde dans le téléphone |
| audio.js | Sons et vibrations |
| engine.js | Règles du jeu (plateau, lignes, génération des pièces) |
| renderer.js | Dessin sur le canvas, animations |
| input.js | Doigt / souris |
| progress.js | Pièces, niveaux, série, missions, succès, coffre |
| ui.js | Écrans, fenêtres, notifications |
| screens.js | Contenu des écrans (boutique, missions…) |
| game.js | Déroulement d'une partie |
| main.js | Démarrage et boutons |
