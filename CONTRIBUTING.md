# Contribuer

Toute contribution est bienvenue : un cours, un exercice, une correction de formule ou de
code. Pas besoin d'être dans l'équipe.

## Proposer une modification

1. Faire un *fork* du dépôt sur GitHub (les membres de l'équipe peuvent créer une branche
   directement, au format `prenom/sujet`, par exemple `baptiste/cours-ce-moteurs`).
2. Faire ses modifications et vérifier la page dans un navigateur (voir « Tester en local »
   dans le [README](README.md)).
3. Ouvrir une *pull request* vers `main` en expliquant ce qui change. Un membre de l'équipe
   relit avant le merge. Personne ne pousse directement sur `main`.

Chaque merge sur `main` est publié automatiquement sur https://studicam.pages.dev.

## Règles pour le contenu

- N'ajouter que du contenu écrit par soi-même. Ne pas copier un polycopié, un sujet ou un
  corrigé d'enseignant sans son accord.
- Formules : notation LaTeX entre `$...$`, rendue par MathJax.
- Nouvel exercice : ajouter ses blocs dans la table `UNITES` en tête de
  `public/progression.js` et garder les classes de correction (voir le README), sinon la
  réussite n'est pas comptée.
- En proposant du contenu, on accepte qu'il soit publié sous la licence du dépôt (voir le
  README).
- Nouvelle leçon, ou leçon déplacée dans `CHAPITRES` : lancer `node scripts/maj-lecons.mjs`
  (sinon `npm test` échoue). Le serveur s'en sert pour savoir quel prof peut corriger quelle
  leçon.
- Les profs corrigent le texte des leçons depuis le site (Espace prof, « Corriger les cours »).
  Une correction est rattachée au texte d'origine d'un paragraphe, d'une formule, d'un
  encadré, d'une ligne de liste ou d'une case de tableau : si on réécrit ce passage dans le
  code, sa correction ne s'affiche plus et passe « à revoir » dans l'Espace prof. Avant de
  réécrire une leçon, regarder ses corrections et les reporter dans le code.

## Sécurité

Une faille trouvée ? Ne pas ouvrir de ticket public : écrire à aidanmano@gmail.com.

## Équipe

Les membres de l'équipe tiennent aussi le journal partagé (dossier OneDrive
`Revisions ICAM/JOURNAL.md`) : ce qui a été fait, le numéro de la PR, ce qui reste.
