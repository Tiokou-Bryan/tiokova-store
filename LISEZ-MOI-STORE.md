# TIOKOVA STORE — mise à jour du 30/10/2026

Contenu de ce dossier (à mettre à la racine du dépôt tiokova-store) :
- index.html, style.css : la nouvelle page du store
- app.js : la liste des applis (APPS), la recherche, les filtres, la langue FR/EN, le partage
- manifest.json, sw.js : le store devient installable et s'ouvre hors connexion
- assets/ : icônes, captures d'écran, image d'aperçu WhatsApp
- blocks/ : le jeu TIOKOVA BLOCKS

- convertisseur/ : TIOKOVA Devises, avec l'écran « installe l'appli » (installation.js)

## Écran « Installe l'appli pour l'utiliser »
- TIOKOVA BLOCKS : intégré au jeu (blocks/js/main.js).
- Toutes les autres applis : fichier réutilisable convertisseur/installation.js.
  Pour un nouveau jeu : copie installation.js dans son dossier, puis suis
  les 3 étapes écrites en haut du fichier.
- Sur ton PC (Live Server), l'écran ne s'affiche pas, pour que tu puisses tester.
  Pour le voir quand même, ajoute ?gate=1 à la fin de l'adresse.

## Ajouter une appli plus tard
Ouvre app.js, copie un bloc { ... } dans la liste APPS, change les infos. C'est tout.

## Après une modification du store
Dans sw.js, change 'tiokova-store-v2' en 'tiokova-store-v3' (puis v4, v5...).
