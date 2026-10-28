# Studicam

Site de révision des promos A1 et A2 de l'ICAM Toulouse (BTS ATI) : cours et exercices
interactifs par matière, connexion par adresse ICAM et suivi de la progression.

En ligne : https://studicam.pages.dev

Le site est le Worker `studicam` (dossier racine). `studicam.pages.dev` est un petit projet
Cloudflare Pages (dossier `pages/`) qui lui transmet chaque visite, pour avoir une adresse
sans nom de compte. Ce dossier ne change presque jamais ; s'il change, Aidan le republie avec
`npx wrangler pages deploy --branch main` depuis `pages/`.

**Avant de travailler, lire le journal partagé** : dossier OneDrive `Revisions ICAM/JOURNAL.md`.
Il dit ce qui a été fait en dernier, par qui, et la suite. Le mettre à jour après chaque séance.

Façon de contribuer : voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Organisation

| Fichier | Rôle |
|---|---|
| `public/index.html` | Le site : cours et exercices |
| `public/progression.js` | Enregistre les exercices réussis, affiche les pastilles |
| `public/connexion.html` | Page de connexion |
| `src/index.js` | Serveur (Cloudflare Worker) : connexion, sessions, progression, protection des pages |
| `migrations/` | Structure de la base D1 |

Nouvel exercice : ajouter ses blocs dans la table `UNITES` en tête de `public/progression.js`,
et garder les classes de correction (`border-emerald-500`, `border-red-500`, bilans
`emerald` / `red`), sinon la réussite n'est pas comptée.

## Tester en local

```
npm install
npm run db:local
npm run dev
```

Puis ouvrir http://localhost:8787 et se connecter avec n'importe quelle adresse `@icam.fr`
(la base locale est séparée de celle du site en ligne).

## Mise en ligne

**Automatique** : chaque merge sur `main` est publié par Cloudflare (Workers Builds, relié
à ce dépôt). Les branches et les pull requests ne sont pas publiées.

Seule exception : une modification de la base (nouveau fichier dans `migrations/`) doit être
appliquée par Aidan **avant** le merge, avec
`npx wrangler d1 migrations apply studicam --remote`.
