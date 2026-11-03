# Studicam

Site de révision des promos A1 et A2 de l'ICAM Toulouse (BTS ATI) : cours et exercices
interactifs par matière, connexion par compte Google ICAM et suivi de la progression.

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
| `src/index.js` | Serveur (Cloudflare Worker) : connexion Google, sessions, progression, protection des pages |
| `src/regles.js` | Règles de validation, dont le contrôle du jeton Google (testées par `npm test`) |
| `migrations/` | Structure de la base D1 |

Nouvel exercice : ajouter ses blocs dans la table `UNITES` en tête de `public/progression.js`,
et garder les classes de correction (`border-emerald-500`, `border-red-500`, bilans
`emerald` / `red`), sinon la réussite n'est pas comptée.

## Connexion

Bouton « Se connecter avec mon compte ICAM » : connexion Google (OpenID Connect, avec PKCE).
Au retour, le serveur exige un compte Google Workspace de l'ICAM (`hd` = `icam.fr` ou un
sous-domaine) et une adresse vérifiée par Google. Un compte Google personnel est refusé.
Seules les sessions ouvertes ainsi (`methode = 'google'`) sont acceptées.

Identifiants dans la console Google Cloud d'Aidan (client OAuth « Application Web »), avec
ces deux URI de redirection autorisées :

- `https://studicam.pages.dev/api/google/retour`
- `http://localhost:8787/api/google/retour`

L'identifiant client est dans `wrangler.jsonc` (`GOOGLE_CLIENT_ID`). Le secret n'est jamais
dans le dépôt : en ligne, `npx wrangler secret put GOOGLE_CLIENT_SECRET` ; en local, un
fichier `.dev.vars` (ignoré par git) avec `GOOGLE_CLIENT_ID=...` et `GOOGLE_CLIENT_SECRET=...`.

## Tester en local

```
npm install
npm run db:local
npm run dev
npm test
```

Puis ouvrir http://localhost:8787 et se connecter avec son compte ICAM (il faut le fichier
`.dev.vars`). La base locale est séparée de celle du site en ligne.

## Mise en ligne

**Automatique** : chaque merge sur `main` est publié par Cloudflare (Workers Builds, relié
à ce dépôt). Les branches et les pull requests ne sont pas publiées.

Seule exception : une modification de la base (nouveau fichier dans `migrations/`) doit être
appliquée par Aidan **avant** le merge, avec
`npx wrangler d1 migrations apply studicam --remote`.
