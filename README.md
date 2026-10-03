# Salle de jeux

Tous les jeux de [dchirez.fr](https://dchirez.fr) au même endroit : **https://dchirez.fr/games/**

Une page autonome (HTML/CSS/JS, sans dépendance ni build) qui réunit les jeux jouables dans le navigateur et ajoute ce qu'un jeu seul n'a pas :

- **Ludothèque** : une carte par jeu avec une capture du jeu en cours de partie (`apercus/`), des filtres (solo, à deux, en ligne, réflexion…) et une recherche.
- **Jouer sans quitter la salle** : le jeu s'ouvre dans un cadre plein écran (`#jouer=<jeu>`, bouton retour, plein écran, ouverture dans un onglet).
- **Reprendre** : les parties interrompues (Sudoku, Queens, Échecs) et les derniers jeux ouverts.
- **Défi du jour** : un Sudoku et un Queens identiques pour tout le monde, tirés de la date, avec une série de jours d'affilée et un résultat à partager façon Wordle.
- **En ligne** : création d'une partie d'échecs ou d'une table de poker avec lien d'invitation et QR code, et un formulaire pour rejoindre avec un code. Risk garde son propre serveur de parties.
- **Statistiques, activité récente et 29 succès**, calculés à partir de ce que racontent les jeux.
- **Profil** : pseudo et avatar généré, repris par le poker.
- **Réglages** : thème (système, clair, sombre) et son coupé au lancement, appliqués aux jeux. Les jeux s'ouvrent dans la salle ou dans la page.
- **Hors ligne** : la salle s'installe comme une application (PWA). Sudoku, Queens, Bomberman, Échecs et le Jeu de la Vie restent jouables sans connexion.
- **Clavier et manette** : navigation spatiale aux flèches ou à la croix directionnelle. A pour jouer, B pour revenir, Y pour un jeu au hasard.

## Comment les jeux parlent à la salle

Toutes les pages de `dchirez.fr` partagent le même `localStorage`. Chaque jeu charge [`pont-hub.js`](pont-hub.js) :

```html
<script src="/games/pont-hub.js"></script>
```

puis, **s'il le trouve** (`window.HubJeux`), y consigne ses parties. Sans lui (page ouverte en `file://`), le jeu tourne exactement comme avant.

| Appel | Rôle |
| --- | --- |
| `HubJeux.partie(jeu, { issue, detail, records, faits })` | fin de partie : alimente statistiques, records, activité et succès |
| `HubJeux.fait(jeu, fait, [record, valeur])` | exploit hors fin de partie (générations du Jeu de la Vie) |
| `HubJeux.enCours(jeu, { libelle, suffixe } \| null)` | partie à reprendre |
| `HubJeux.defi(jeu, resultat)` / `resultatDefi(jeu)` | défi du jour |
| `HubJeux.alea(graine)` | générateur déterministe (mulberry32) pour les grilles du jour |
| `HubJeux.profil()`, `theme()`, `sonCoupe()` | préférences choisies dans la salle |

La visite d'un jeu est comptée automatiquement à partir du chemin de la page. Toutes les clés sont préfixées par `dchirez-hub:`. La salle écoute l'événement `storage` et se met à jour pendant qu'on joue.

## Développement

Servir le **dossier parent** de tous les dépôts de jeux, pour retrouver les chemins `/<jeu>/` de la production :

```bash
python -m http.server 5190 --directory ..
```

puis ouvrir http://localhost:5190/games/.

Chaque jeu solo a son propre `sw.js`, copie de celui de la salle où seule la liste `ESSENTIEL` change.
