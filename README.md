# Studicam

Site de révision des promos A1 et A2 de l'ICAM Toulouse (BTS ATI) : cours et exercices
interactifs par matière, connexion par compte Google ICAM et suivi de la progression.

En ligne : https://studicam.pages.dev

Le site est le Worker `studicam` (dossier racine). `studicam.pages.dev` est un petit projet
Cloudflare Pages (dossier `pages/`) qui lui transmet chaque visite, pour avoir une adresse
sans nom de compte. Ce dossier ne change presque jamais ; s'il change, Aidan le republie avec
`npx wrangler pages deploy --branch main` depuis `pages/`.

Fait par Aidan et Baptiste, étudiants de l'ICAM. Ce n'est pas un service officiel de l'ICAM.

**Contribuer** : voir [CONTRIBUTING.md](CONTRIBUTING.md). Les membres de l'équipe lisent
aussi le journal partagé (dossier OneDrive `Revisions ICAM/JOURNAL.md`) avant de travailler.

## Organisation

| Fichier | Rôle |
|---|---|
| `public/index.html` | Le site : cours et exercices |
| `public/progression.js` | Enregistre les exercices réussis, affiche les pastilles |
| `public/navigation.js` | Une adresse `#/...` par écran, bouton retour du navigateur, routes ajoutées par d'autres scripts (voir « Adresses des écrans ») |
| `public/revision-ds.js` | Onglet « Révision DS » de l'A2 : examen blanc, QCM, exercices corrigés, formules |
| `public/revision-ds-blancs.js` | Les deux DS blancs de cet onglet (sujets et corrigés, fichier généré) |
| `public/prof.js` | Bouton « Vue prof » / « Vue élève » de l'en-tête et Espace prof, pour les comptes qui ont un rôle |
| `public/connexion.html` | Page de connexion |
| `src/index.js` | Serveur (Cloudflare Worker) : connexion Google, sessions, progression, accès prof, protection des pages ; les modules d'API s'ajoutent au tableau `MODULES_API` |
| `src/commun.js` | Outils partagés par le serveur et ses modules : session, rôle, réponses JSON, limites |
| `src/regles.js` | Règles de validation : jeton Google, progression, périmètre des profs (testées par `npm test`) |
| `migrations/` | Structure de la base D1 |

Nouvel exercice : ajouter ses blocs dans la table `UNITES` en tête de `public/progression.js`,
et garder les classes de correction (`border-emerald-500`, `border-red-500`, bilans
`emerald` / `red`), sinon la réussite n'est pas comptée.

## Adresses des écrans

Chaque écran a sa propre adresse, après un `#` : le bouton retour du navigateur (ou le geste
retour du téléphone) réaffiche l'écran précédent, et rafraîchir la page ou ouvrir une adresse
copiée ramène au même écran. Le serveur ne voit pas cette partie de l'adresse.

| Adresse | Écran |
|---|---|
| `#/` | Accueil (choix de l'année) |
| `#/a2` | Choix du domaine de l'année (`a1` ou `a2`) |
| `#/a2/techniques`, `#/a2/sciences` | Matières du domaine |
| `#/a2/ce` | Chapitres d'une matière (`cm`, `ce`, `aii`, `oi`, `est`, `maths`, `phys`, `eco`) |
| `#/a2/ce/asynchrone/lecon` | Leçon : identifiant de la leçon sans son préfixe (`ce2-asynchrone` donne `asynchrone`) |
| `#/a2/ce/asynchrone/lecon/3` | Leçon ouverte sur sa partie 3 (renvoi depuis une correction) |
| `#/a2/ce/asynchrone/exo/ce2-asynchrone` | Exercice (clé de `EXOS`) ; chapitres interactifs : `#/a2/cm/vecteurs/exo/exo1`, `#/a1/cm/liaisons/exo/exo` |
| `#/a2/revision-ds/examen` | Révision DS, un onglet : `examen`, `ce`, `expo`, `cours`, `formules`, `dsblanc` |
| `#/a2/revision-ds/ce/mas` | Un chapitre des onglets `ce`, `expo`, `cours` |
| `#/prof`, `#/prof/annonces` | Espace prof, sur un onglet |

Une adresse inconnue, ou dont le contenu n'existe plus, ramène à l'accueil sans erreur. Si
l'élève n'est pas connecté, la page de connexion garde l'adresse demandée (`sessionStorage`)
et le site la rouvre après la connexion Google. Renommer une leçon (son identifiant dans
`CHAPITRES`) change son adresse : les liens déjà partagés mènent alors à l'accueil.

Pour un nouvel écran hors de ces adresses, un script chargé après `navigation.js` appelle
`window.studicamRoutes.ajouter('#/progression', fonction, titre)` et l'ouvre avec
`window.studicamRoutes.aller('#/progression')`. L'événement `studicam:ecran` est émis à chaque
changement d'écran. Le détail est en tête de `public/navigation.js`.

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

## Accès prof

Un compte n'a un rôle que s'il est dans la table `roles` (migration `0003_roles.sql`) : une
adresse `@icam.fr` seule ne donne rien. Deux rôles :

- `prof` : agit seulement sur son périmètre, une liste de paires année/matière séparées par
  des virgules (`a2/ce` ou `a2/ce,a2/oi`). Années `a1`, `a2` ; matières `cm`, `ce`, `aii`,
  `oi`, `est`, `maths`, `phys`, `eco`.
- `equipe` : Aidan et Baptiste, voient tout (périmètre ignoré).

Le rôle est rangé par adresse : on peut ajouter un prof avant sa première connexion. Il est
relu à chaque requête, donc un ajout ou un retrait vaut tout de suite. La session d'un compte
qui a un rôle dure 30 jours (180 pour un élève). Le site s'ouvre toujours en vue élève : le
bouton « Vue prof », en haut à gauche près du logo, ouvre l'Espace prof, puis devient « Vue
élève » et ramène là où on en était. Ce bouton n'est qu'un raccourci : chaque route `/api/prof/...` vérifie le rôle et le périmètre côté serveur.
Les statistiques montrées aux profs seront seulement agrégées, jamais par élève.

Ajouter ou modifier un prof (Aidan, dans PowerShell, adresse en minuscules) :

```
$env:XDG_CONFIG_HOME = "C:\Users\aidan\.config-wrangler-aidan"
npx wrangler d1 execute studicam --remote --command "INSERT INTO roles (email, role, perimetre, ajoute_par, ajoute_le) VALUES ('prenom.nom@icam.fr', 'prof', 'a2/ce', 'aidan', datetime('now')) ON CONFLICT(email) DO UPDATE SET role = excluded.role, perimetre = excluded.perimetre, ajoute_par = excluded.ajoute_par, ajoute_le = excluded.ajoute_le"
```

Puis, pour que ses sessions déjà ouvertes passent tout de suite à 30 jours :

```
npx wrangler d1 execute studicam --remote --command "UPDATE sessions SET expire_le = MIN(expire_le, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+30 days')) WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'prenom.nom@icam.fr')"
```

Retirer un rôle : `--command "DELETE FROM roles WHERE email = 'prenom.nom@icam.fr'"`. Pour la
base locale, remplacer `--remote` par `--local`.

La migration `0003_roles.sql` doit être appliquée en ligne **avant** le merge (voir « Mise en
ligne ») : sans la table `roles`, plus aucune page ne s'ouvre.

### Relecture et signalements

Migration `0005_relecture_signalements.sql`. Sous chaque leçon et chaque exercice, « Signaler
une erreur » (5 par compte sur 24 heures). Les profs traitent ceux de leur périmètre dans
l'onglet « Signalements » de l'Espace prof, sans l'adresse de l'élève ni l'heure (le jour
seulement) ; l'équipe voit tout, avec l'adresse. Un prof marque une leçon de son périmètre
comme relue : les élèves voient « Relu par Prénom Nom », un nom tiré de l'adresse.

Effacer un compte efface ses signalements (`ON DELETE CASCADE`). Purge des signalements
traités, une fois par an après la fin de l'année scolaire (début juillet) :

```
npx wrangler d1 execute studicam --remote --command "DELETE FROM signalements WHERE statut IN ('corrige', 'rejete') AND traite_le < '2027-07-01'"
```

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

## Licence

- Le code (serveur, pages, scripts, tests) est sous licence [MIT](LICENSE).
- Le contenu des cours et des exercices est sous licence
  [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr) : libre de le
  partager et de l'adapter, en citant Studicam, sans usage commercial et sous la même licence.
