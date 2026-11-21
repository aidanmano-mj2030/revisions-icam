/*
 * Studicam : contenu de la Révision DS du samedi 28 novembre 2026 (A2, AII puis maths).
 *
 * Chargé par index.html juste après revision-ds.js, qui l'affiche (voir « Ajouter une
 * Révision DS » dans le README). Parties :
 *   - AII : le GEMMA, la structuration du GRAFCET (sources et puits, synchronisation,
 *     macro-étapes, forçage, encapsulation) et l'asservissement (boucle fermée, transmittances,
 *     valeur finale). Les trois chapitres n'ont encore jamais été évalués en DS.
 *   - Maths : géométrie (droites et plans, barycentres, produits scalaire, vectoriel et mixte),
 *     fonctions vectorielles et fonctions de deux variables. Programme probable, à confirmer.
 *   - Anciens DS : AII d'octobre et de fin novembre 2025 et du 30/11/2024 ; maths DS n°2 de 2022
 *     et 2023 et DS de fin novembre 2025. Résumés reformulés, avec la correction du professeur
 *     quand on l'a, sinon la nôtre, puis une variante. Aucun nom d'élève.
 * Notions et QCM écrits par nous ; exercices avec d'autres données, recalculées. Clés de progression : a2/ds/ds-2026-11-aii-maths/<chapitre> et
 * a2/ds/ds-2026-11-aii-maths/examen-<filtre>.
 */
(function () {
    'use strict';
    const RD = window.StudicamRevisionDS;
    if (!RD) return;
    const { R, P, UL, NOTE, F, T, S } = RD.outils;

    // Schémas : ceux des leçons d'index.html (gfGemma, asAsservi, svgCourbeParam…, globaux).
    // Si index.html change, un schéma absent donne '' sans erreur.
    const OK_H = typeof H !== 'undefined';
    const dessin = (nom, ...a) => { try { return typeof window[nom] === 'function' ? window[nom](...a) : ''; } catch (e) { console.warn('Studicam : schéma', e); return ''; } };
    const FIGURE = (svg, legende) => (svg && OK_H ? H.figure(svg, legende) : '');
    const FIG = {
        gemma: () => dessin('gfGemma'), chemin: () => dessin('gfCheminement'),
        sources: () => dessin('gfSourcePuits'), sync: () => dessin('gfSync'), macro: () => dessin('gfMacro'),
        forcage: () => dessin('gfForcage'), encaps: () => dessin('gfEncaps'),
        systeme: () => dessin('asSysteme'), boucles: () => dessin('asBoucles'), asservi: () => dessin('asAsservi'),
        lissajous: () => dessin('svgCourbeParam', { x: (t) => Math.cos(t), y: (t) => Math.sin(2 * t), tMin: 0, tMax: 2 * Math.PI, cadre: [-1.4, 1.4, -1.3, 1.3], label: 'Courbe x = cos t, y = sin 2t' }),
        rebrousse: () => dessin('svgCourbeParam', { x: (t) => t * t, y: (t) => t * t * t, tMin: -1.3, tMax: 1.3, cadre: [-0.4, 1.8, -1.6, 1.6], label: 'Point de rebroussement' })
    };
    // les figures sont calculées au moment de l'affichage
    const fig = (cle) => FIG[cle]();

    // ==========================================
    // AII : cours
    // ==========================================
    const AII = [
        {
            id: 'gemma', code: 'AII 1', titre: 'Le GEMMA', sous: 'Familles A, F, D, rectangles-états, cheminements, passage aux grafcets',
            sections: [
                S('Principe', 'layout-grid',
                    P(`Le <b>GEMMA</b> (Guide d'Étude des Modes de Marches et d'Arrêts) recense tous les états d'une machine automatisée et les passages entre eux. Il donne un vocabulaire commun à ceux qui la conçoivent, la fabriquent, l'utilisent et la dépannent.`),
                    FIGURE(fig('gemma'), `Les trois familles de rectangles-états, à droite de la zone « PC hors énergie ».`),
                    UL([
                        `Zone tout à gauche : partie commande <b>hors énergie</b>. Le reste : PC en énergie, en trois familles : <b>A</b> (arrêts), <b>F</b> (fonctionnement), <b>D</b> (défaillances).`,
                        `Chaque rectangle-état a une lettre et un numéro (F1, A6…). Pour une machine donnée, il est <b>retenu</b> (on lui donne un nom propre) ou <b>barré</b>.`,
                        `Les liaisons retenues sont en trait fort, avec leurs conditions : boutons (DCY, AUTO, MANU, AU…), capteurs, défauts.`
                    ])),
                S('Les états à connaître', 'list',
                    T(['État', 'Nom', 'À retenir'], [
                        ['<b>F1</b>', 'Production normale', 'ce pour quoi la machine est faite ; souvent le grafcet de base'],
                        ['F2 / F3', 'Préparation / clôture', 'avant la production (préchauffage) / avant un arrêt prolongé (vidage)'],
                        ['F4 / F5', 'Vérification dans le désordre / dans l\'ordre', 'mode <b>manuel</b> / mode <b>semi-automatique</b> (pas à pas, cycle par cycle)'],
                        ['F6', 'Marche de test', 'réglage, étalonnage des capteurs'],
                        ['<b>A1</b>', 'Arrêt dans l\'état initial', 'état de repos, comme l\'étape initiale d\'un grafcet'],
                        ['A2 / A3', 'Arrêt demandé en fin de cycle / dans un état déterminé', 'états transitoires, vers A1 / vers A4'],
                        ['A4', 'Arrêt obtenu', 'machine arrêtée ailleurs qu\'en fin de cycle'],
                        ['A5', 'Préparation après défaillance', 'dégagement, nettoyage, souvent manuel'],
                        ['A6 / A7', 'Mise de la PO dans l\'état initial / déterminé', 'remise en position pour repartir'],
                        ['<b>D1</b>', 'Arrêt d\'urgence', 'accessible depuis <b>tout</b> état'],
                        ['D2 / D3', 'Diagnostic / production tout de même', 'recherche de panne / production dégradée']
                    ])),
                S('Cheminements et grafcets', 'route',
                    FIGURE(fig('chemin'), `Démarrage, arrêt en fin de cycle, clôture et arrêt d'urgence.`),
                    T(['Situation', 'Cheminement'], [
                        ['Démarrage (avec préparation)', 'A1 → F1 (A1 → F2 → F1)'],
                        ['Arrêt en fin de cycle', 'F1 → A2 → A1'],
                        ['Arrêt avec clôture', 'F1 → F3 → A1'],
                        ['Défaillance majeure', 'D1 → A5 → A6 → A1'],
                        ['Défaillance mineure', 'D1 → A5 → A7 → A4'],
                        ['Production malgré un défaut', 'F1 → D3']
                    ]),
                    UL([
                        `<b>Grafcet de conduite</b> (ou des modes de marche) : familles A et F ; <b>grafcet de production normale</b> : F1 ; <b>grafcet de sûreté</b> : famille D, hiérarchiquement supérieur, il agit par <b>forçage</b>.`,
                        `Arrêt d'urgence : actions mises à 0, figeage du grafcet, ou séquence d'urgence.`
                    ]),
                    NOTE('Pièges', `Retour du manuel (F4) vers la production : on repasse par A6 pour retrouver l'état initial. On évite D3 → F1 en direct : on préfère passer par un arrêt.`))
            ],
            qcm: [
                { fig: fig('gemma'), q: "Que signifie GEMMA ?", opts: ["Guide d'Étude des Modes de Marches et d'Arrêts", "Grafcet Étendu des Machines et Modes Automatiques", "Gestion Électrique des Moteurs et Machines Asynchrones", "Guide d'Entretien et de Maintenance des Machines Automatisées"], ok: [0], expl: "Un guide graphique de tous les états de la machine." },
                { q: "Quelles sont les trois familles de procédures du GEMMA ?", opts: ["A : arrêts, F : fonctionnement, D : défaillances", "A : automatique, F : forcé, D : dégradé", "A : alimentation, F : fabrication, D : démarrage", "A : alarme, F : fin, D : diagnostic"], ok: [0], expl: "Plus la zone « PC hors énergie » tout à gauche." },
                { q: "Dans quel rectangle-état se trouve la production normale ?", opts: ["A1", "F1", "F4", "D3"], ok: [1], expl: "F1 est souvent décrit par le grafcet de base de la machine." },
                { q: "Le mode manuel (actionneurs commandés un par un, sans ordre imposé) correspond à…", opts: ["F4 : vérification dans le désordre", "F5 : vérification dans l'ordre", "F6 : marche de test", "A6 : mise de la PO dans l'état initial"], ok: [0], expl: "F5, dans l'ordre, correspond au semi-automatique." },
                { q: "Depuis quels états peut-on aller en D1 (arrêt d'urgence) ?", opts: ["Depuis tous les états", "Seulement depuis F1", "Seulement depuis la famille F", "Seulement depuis A1"], ok: [0], expl: "Un arrêt d'urgence doit toujours être possible." },
                { fig: fig('chemin'), q: "Arrêt demandé en fin de cycle pendant la production normale : quel cheminement ?", opts: ["F1 → A2 → A1", "F1 → D1 → A1", "F1 → A4 → A1", "F1 → F4 → A1"], ok: [0], expl: "A2 est transitoire : la machine finit son cycle puis rejoint l'état initial A1." },
                { q: "Après un arrêt d'urgence pour une défaillance majeure, quel cheminement ramène à l'état initial ?", opts: ["D1 → A5 → A6 → A1", "D1 → F1", "D1 → A2 → A1", "D1 → D3 → F1"], ok: [0], expl: "A5 : préparation (dégagement, nettoyage) ; A6 : remise de la PO en position initiale." },
                { q: "Que fait le grafcet de sûreté par rapport aux autres grafcets ?", opts: ["Il est hiérarchiquement supérieur et agit par forçage", "Il est esclave du grafcet de production", "Il ne gère que le démarrage", "Il remplace le GEMMA"], ok: [0], expl: "Il gère la famille D et peut figer ou forcer les autres grafcets." },
                { q: "Que fait-on d'un rectangle-état qui ne sert pas pour la machine étudiée ?", opts: ["On le barre d'une croix", "On le relie à D1", "On l'efface du guide", "On le renomme F1"], ok: [0], expl: "Les états retenus reçoivent un nom propre à la machine." },
                { calc: true, fig: fig('chemin'), q: "Une presse est en production normale. L'opérateur appuie sur l'arrêt d'urgence (défaillance mineure : on veut repartir de là où on était). Donner le cheminement dans le GEMMA, puis celui d'un arrêt en fin de journée avec vidage de la presse.",
                    steps: ["Arrêt d'urgence : F1 → D1, possible depuis n'importe quel état.", "Défaillance mineure : D1 → A5 (préparation, dégagement) → A7 (PO remise dans l'état où elle était) → A4 (arrêt obtenu dans cet état), d'où l'on peut repartir.", "Fin de journée avec vidage : c'est une marche de clôture, F1 → F3 → A1.", "Sans vidage, on aurait l'arrêt en fin de cycle : F1 → A2 → A1."] }
            ]
        },
        {
            id: 'grafcet', code: 'AII 2', titre: 'GRAFCET : structuration et hiérarchisation', sous: 'Sources et puits, synchronisation, sous-grafcets, macro-étapes, forçage, encapsulation',
            sections: [
                S('Sources, puits et désignation', 'git-branch',
                    FIGURE(fig('sources'), `Transition source, transition puits, étape source, étape puits.`),
                    T(['Forme', 'Comportement'], [
                        ['Transition source (pas d\'étape amont)', 'toujours validée : franchie dès que sa réceptivité est vraie (mettre un front)'],
                        ['Transition puits (pas d\'étape aval)', 'son franchissement désactive seulement l\'étape d\'avant'],
                        ['Étape source (pas de transition amont)', 'activée seulement si elle est initiale, par forçage ou par encapsulation'],
                        ['Étape puits (pas de transition aval)', 'désactivée seulement par forçage ou par la fin de l\'encapsulation']
                    ]),
                    UL([
                        `<b>X12</b> vaut 1 si l'étape 12 est active. <b>G100</b> désigne le grafcet partiel 100 ; <b>XG100</b> vaut 1 si au moins une de ses étapes est active.`,
                        `Grafcet <b>connexe</b> (un seul morceau), <b>partiel</b> (regroupement de connexes), <b>global</b> (toute l'application).`
                    ])),
                S('Synchronisation, sous-grafcets, macro-étapes', 'layers',
                    FIGURE(fig('sync'), `Deux grafcets synchronisés : chacun attend une étape de l'autre (réceptivités X11 et X22).`),
                    UL([
                        `<b>Synchronisation</b> : une réceptivité utilise l'activité d'une étape d'un autre grafcet (X11). Attention à l'<b>interblocage</b> : deux grafcets qui s'attendent dès le départ ne démarrent jamais.`,
                        `<b>Sous-grafcet</b> (tâche) : appelé par une étape (X15 + X25 dans sa transition de départ), il rend la main par son étape de fin. Une même tâche peut être appelée de plusieurs endroits.`,
                        `<b>Macro-étape</b> M5 : une seule expansion, de E5 (entrée) à S5 (sortie). La transition après M5 n'est validée que quand S5 est active. Pas d'action sur E et S de préférence. Des cycles identiques demandent autant de macro-étapes.`
                    ]),
                    FIGURE(fig('macro'), `Macro-étape M5 et son expansion, de E5 à S5.`)),
                S('Forçage et encapsulation', 'lock',
                    FIGURE(fig('forcage'), `Les quatre ordres de forçage.`),
                    T(['Ordre', 'Notation', 'Effet'], [
                        ['Situation déterminée', 'G12{8, 9, 11}', 'G12 est mis dans les étapes 8, 9 et 11'],
                        ['Figeage', 'G3{*}', 'G3 garde ses étapes actives et n\'évolue plus'],
                        ['Vidage', 'G4{ }', 'toutes les étapes de G4 sont désactivées'],
                        ['Situation initiale', 'G8{INIT}', 'G8 revient à ses étapes initiales']
                    ]),
                    UL([
                        `Le forçage (double rectangle) est <b>prioritaire</b> sur les règles d'évolution ; le grafcet forçant est de niveau <b>supérieur</b>.`,
                        `<b>Encapsulation</b> : activer l'étape encapsulante active les étapes marquées d'un astérisque du grafcet encapsulé ; la désactiver désactive tout le grafcet encapsulé. Notation : X5/X51 (étape 51 encapsulée dans l'étape 5).`
                    ]),
                    FIGURE(fig('encaps'), `G2 encapsulé dans l'étape 5 de G1.`))
            ],
            qcm: [
                { fig: fig('sources'), q: "Une transition source (sans étape en amont) est franchie…", opts: ["Dès que sa réceptivité est vraie", "Jamais", "Seulement par forçage", "Seulement à l'initialisation"], ok: [0], expl: "Elle est toujours validée ; on met souvent un front dans sa réceptivité." },
                { q: "Comment une étape puits peut-elle être désactivée ?", opts: ["Par forçage ou par la fin de l'encapsulation", "Par sa transition aval", "Toute seule après 1 s", "Elle ne peut jamais l'être"], ok: [0], expl: "Elle n'a pas de transition aval." },
                { q: "Que vaut XG100 ?", opts: ["1 si au moins une étape du grafcet partiel G100 est active", "1 si l'étape 100 est active", "Le nombre d'étapes actives de G100", "1 si G100 est figé"], ok: [0], expl: "X100 (sans G) désigne l'étape 100." },
                { fig: fig('sync'), q: "G1 attend X22 et G2 attend X11 dès leur première transition. Que se passe-t-il ?", opts: ["Interblocage : aucun ne démarre", "Ils démarrent ensemble", "G1 démarre seul", "Le forçage s'applique automatiquement"], ok: [0], expl: "Chacun attend l'autre : il faut qu'un des deux puisse avancer seul." },
                { fig: fig('macro'), q: "Quand la transition qui suit la macro-étape M5 est-elle validée ?", opts: ["Quand l'étape de sortie S5 est active", "Dès que E5 est active", "Dès que M5 est activée", "Jamais"], ok: [0], expl: "On sort de la macro-étape par S5." },
                { q: "Avantage d'un sous-grafcet sur une macro-étape :", opts: ["Il peut être appelé depuis plusieurs étapes sans être redessiné", "Il n'a pas d'étape initiale", "Il est prioritaire sur tout", "Il n'a pas besoin de réceptivités"], ok: [0], expl: "Une macro-étape a une seule expansion, à dessiner pour chaque cycle identique." },
                { fig: fig('forcage'), q: "Que fait l'ordre G3{*} ?", opts: ["Il fige G3 dans sa situation courante", "Il vide G3", "Il remet G3 à l'état initial", "Il active toutes les étapes de G3"], ok: [0], expl: "{ } vide, {INIT} initialise, {*} fige." },
                { fig: fig('forcage'), q: "Après un vidage G4{ }, que faut-il pour que G4 reparte ?", opts: ["Le forcer de nouveau (par exemple G4{INIT})", "Rien, il repart seul", "Couper l'alimentation", "Un front sur sa première transition"], ok: [0], expl: "Plus aucune étape n'est active : aucune transition ne peut être validée." },
                { q: "Le grafcet qui en force un autre doit être…", opts: ["De niveau hiérarchique supérieur", "De même niveau", "De niveau inférieur", "Encapsulé dans le grafcet forcé"], ok: [0], expl: "Typiquement : sûreté au-dessus de conduite, au-dessus de production." },
                { fig: fig('encaps'), q: "Que se passe-t-il quand l'étape encapsulante 5 est désactivée ?", opts: ["Toutes les étapes du grafcet encapsulé sont désactivées", "Le grafcet encapsulé continue seul", "Seules les étapes marquées * sont désactivées", "Le grafcet encapsulé est figé"], ok: [0], expl: "À l'activation, seules les étapes avec * s'activent ; à la désactivation, tout s'éteint." },
                { q: "Que désigne X5/X51 ?", opts: ["L'étape 51 encapsulée dans l'étape 5", "X5 divisé par X51", "Le passage de l'étape 5 à l'étape 51", "Le forçage de l'étape 51 par l'étape 5"], ok: [0], expl: "Le nom de l'encapsulante précède celui de l'élément encapsulé." }
            ]
        },
        {
            id: 'asserv', code: 'AII 3', titre: 'Régulation et asservissement', sous: 'Boucle ouverte et fermée, schéma-bloc, transmittances, valeur finale, superposition',
            sections: [
                S('Boucle ouverte, boucle fermée', 'repeat',
                    P(`Une <b>consigne</b> (entrée commandable) et une <b>perturbation</b> (entrée subie) agissent sur le système ; on veut contrôler la <b>sortie</b>. Moteur CC : consigne U, perturbation couple résistant, sortie vitesse Ω.`),
                    FIGURE(fig('boucles'), `Sans retour (boucle ouverte), puis avec mesure et comparaison (boucle fermée).`),
                    UL([
                        `<b>Régulation</b> : consigne constante, on rejette les perturbations. <b>Asservissement</b> : la consigne varie, la sortie doit la suivre.`,
                        `Boucle ouverte : la sortie n'est pas mesurée, une perturbation n'est pas corrigée. Boucle fermée : la sortie est mesurée et comparée à la consigne, l'<b>écart</b> corrige la commande.`
                    ])),
                S('Schéma-bloc et transmittances', 'workflow',
                    FIGURE(fig('asservi'), `K(p) régulateur, G(p) système, H(p) capteur de la chaîne de retour.`),
                    F(R`\varepsilon = E - H\,S \qquad S = K\,G\,\varepsilon`, `ε écart (sortie du comparateur) · E consigne · S sortie · K, G, H transmittances (fonctions de p)`),
                    F(R`\dfrac{S}{E} = \dfrac{K\,G}{1 + K\,G\,H}`, `Boucle fermée = chaîne directe / (1 + boucle ouverte) · chaîne directe K·G · boucle ouverte K·G·H · si H = 1 : K·G / (1 + K·G)`),
                    UL([
                        `Blocs en <b>série</b> : les transmittances se multiplient. En <b>parallèle</b> : elles s'additionnent.`,
                        `Laplace : dériver revient à multiplier par p, intégrer à diviser par p (conditions initiales nulles).`
                    ])),
                S('Valeur finale et superposition', 'target',
                    F(R`s_\infty = \lim_{t \to \infty} s(t) = \lim_{p \to 0} p\,S(p) \qquad E(p) = \dfrac{e_0}{p} \text{ pour un échelon}`, `Théorème de la valeur finale · e<sub>0</sub> hauteur de l'échelon de consigne`),
                    F(R`S = \dfrac{K\,G}{1 + K\,G\,H}\,E + \dfrac{G}{1 + K\,G\,H}\,D`, `Superposition (système linéaire) · D perturbation qui entre avant G · on calcule l'effet de E avec D = 0, puis celui de D avec E = 0, et on additionne`),
                    NOTE('Méthode', `Pour une sortie finale : 1. écrire S/E (et S/D) ; 2. remplacer E par e<sub>0</sub>/p ; 3. multiplier par p et faire p → 0. Un régulateur à action <b>intégrale</b> (1/p dans K) annule l'écart final.`))
            ],
            qcm: [
                { q: "Dans un moteur CC asservi en vitesse, le couple résistant de la charge est…", opts: ["Une perturbation", "La consigne", "La sortie", "La transmittance"], ok: [0], expl: "Il est subi, on ne le commande pas." },
                { q: "Différence entre régulation et asservissement :", opts: ["Régulation : consigne constante ; asservissement : consigne qui varie", "Régulation : boucle ouverte ; asservissement : boucle fermée", "Aucune", "Régulation : sans capteur"], ok: [0], expl: "Les deux sont en boucle fermée." },
                { fig: fig('boucles'), q: "Pourquoi une boucle ouverte ne corrige-t-elle pas les perturbations ?", opts: ["La sortie n'est pas mesurée", "Elle n'a pas de régulateur", "Elle est trop lente", "Elle n'a pas de consigne"], ok: [0], expl: "Sans retour, la commande ignore l'effet de la perturbation." },
                { fig: fig('asservi'), q: "Que calcule le comparateur ?", opts: ["L'écart ε = E − H·S", "La sortie S = K·G·E", "Le produit E·S", "La perturbation D"], ok: [0], expl: "Il soustrait la mesure de la sortie à la consigne." },
                { fig: fig('asservi'), q: "Transmittance en boucle fermée S/E ?", opts: ["K·G / (1 + K·G·H)", "K·G·H", "K·G / (1 − K·G·H)", "1 / (1 + K·G·H)"], ok: [0], expl: "Chaîne directe / (1 + boucle ouverte), pour un retour négatif." },
                { q: "Deux blocs G1 et G2 en série :", opts: ["G1·G2", "G1 + G2", "G1 / G2", "G1 / (1 + G1·G2)"], ok: [0], expl: "En parallèle, on additionnerait." },
                { q: "K = 4, G = 1/(1 + 2p), H = 1. Transmittance en boucle fermée ?", opts: ["4 / (5 + 2p)", "4 / (1 + 2p)", "4 / (3 + 2p)", "1 / (5 + 2p)"], ok: [0], expl: "K·G / (1 + K·G) = [4/(1+2p)] / [(1 + 2p + 4)/(1+2p)] = 4 / (5 + 2p)." },
                { q: "Avec S/E = 4 / (5 + 2p) et un échelon de consigne e0 = 1, que vaut s∞ ?", opts: ["0,8", "1", "4", "0,2"], ok: [0], expl: "s∞ = lim p·(4/(5+2p))·(1/p) = 4/5 = 0,8. Écart final : 0,2." },
                { q: "En Laplace (conditions initiales nulles), dériver un signal revient à…", opts: ["Multiplier par p", "Diviser par p", "Ajouter p", "Mettre au carré"], ok: [0], expl: "Intégrer revient à diviser par p." },
                { q: "Comment annuler l'écart final dû à une perturbation constante ?", opts: ["Mettre une action intégrale dans le régulateur", "Ouvrir la boucle", "Supprimer le capteur", "Diminuer la consigne"], ok: [0], expl: "Le 1/p du régulateur fait tendre l'écart final vers 0." },
                { calc: true, fig: fig('asservi'), q: "K = 5, G(p) = 2 / (1 + 3p), H = 1. Calculer la transmittance en boucle fermée, la sortie finale pour un échelon de consigne e0 = 2 et l'écart final. Une perturbation en échelon d0 = 0,5 entre juste avant G : quel est son effet sur la sortie finale ?",
                    steps: ["K·G = 10 / (1 + 3p), donc S/E = K·G / (1 + K·G) = 10 / (1 + 3p + 10) = 10 / (11 + 3p).", "E = 2/p : s∞ = lim p·[10/(11 + 3p)]·(2/p) = 20/11 ≈ 1,82.", "Écart final : 2 − 1,82 ≈ 0,18 (pas d'action intégrale, il n'est pas nul).", "Perturbation : S/D = G / (1 + K·G) = 2 / (11 + 3p) ; D = 0,5/p donne 2 × 0,5 / 11 ≈ 0,09.", "Superposition : sortie finale ≈ 1,82 + 0,09 ≈ 1,91."] }
            ]
        }
    ];

    // ==========================================
    // Maths : cours
    // ==========================================
    const MATHS = [
        {
            id: 'droites', code: 'GÉO 1', titre: 'Vecteurs, droites et plans de l\'espace', sous: 'Coordonnées, colinéarité, représentations paramétriques, positions relatives',
            sections: [
                S('Vecteurs', 'move-up-right',
                    F(R`\overrightarrow{AB} = (x_B - x_A,\ y_B - y_A,\ z_B - z_A) \qquad \|\vec u\| = \sqrt{x^2 + y^2 + z^2}`, `Coordonnées d'un vecteur (arrivée moins départ) · norme dans un repère orthonormé`),
                    UL([
                        `Milieu de [AB] : moyenne des coordonnées. Chasles : AB→ + BC→ = AC→.`,
                        `<b>Colinéaires</b> : u→ = k·v→ (dans le plan : xy′ − x′y = 0). <b>Coplanaires</b> : w→ = λu→ + μv→. <b>Orthogonaux</b> : xx′ + yy′ + zz′ = 0.`,
                        `Trois vecteurs non coplanaires forment une <b>base</b> de l'espace.`
                    ])),
                S('Droites et plans', 'move-3d',
                    F(R`(d) : \begin{cases} x = x_A + \lambda u_x \\ y = y_A + \lambda u_y \\ z = z_A + \lambda u_z \end{cases} \quad \lambda \in \mathbb{R}`, `Droite passant par A, de vecteur directeur u→ · un plan : AM→ = λu→ + μv→ avec u→, v→ non colinéaires`),
                    T(['Objets', 'Positions possibles'], [
                        ['Deux droites', 'sécantes (un point), parallèles (strictement ou confondues), non coplanaires'],
                        ['Deux plans', 'sécants (une droite), parallèles (strictement ou confondus)'],
                        ['Droite et plan', 'sécants (un point), droite parallèle au plan ou incluse dedans']
                    ]),
                    NOTE('Méthode : intersection de deux droites', `Écrire les deux représentations avec deux paramètres différents (λ et μ), égaler les coordonnées, résoudre avec deux équations, puis <b>vérifier la troisième</b>. Si elle est fausse : pas de point commun (non coplanaires si les directeurs ne sont pas colinéaires).`))
            ],
            qcm: [
                { q: "A(1 ; 2 ; −1) et B(4 ; 0 ; 3). Coordonnées de AB→ ?", opts: ["(3 ; −2 ; 4)", "(−3 ; 2 ; −4)", "(5 ; 2 ; 2)", "(2,5 ; 1 ; 1)"], ok: [0], expl: "Arrivée moins départ : (4 − 1 ; 0 − 2 ; 3 − (−1))." },
                { q: "Norme de u→(2 ; −1 ; 2) ?", opts: ["3", "√5", "9", "5"], ok: [0], expl: "√(4 + 1 + 4) = √9 = 3." },
                { q: "u→(2 ; −4 ; 6) et v→(−1 ; 2 ; −3) sont…", opts: ["Colinéaires (u→ = −2v→)", "Orthogonaux", "Ni l'un ni l'autre", "Égaux"], ok: [0], expl: "Chaque coordonnée de u→ vaut −2 fois celle de v→." },
                { q: "u→(1 ; 2 ; 3) et v→(3 ; 0 ; −1) sont…", opts: ["Orthogonaux", "Colinéaires", "De même norme", "Opposés"], ok: [0], expl: "1×3 + 2×0 + 3×(−1) = 0." },
                { q: "La droite x = 1 + 2λ, y = −λ, z = 3 passe par…", opts: ["(3 ; −1 ; 3)", "(2 ; −1 ; 3)", "(1 ; 0 ; 0)", "(3 ; 1 ; 3)"], ok: [0], expl: "λ = 1 donne (3 ; −1 ; 3)." },
                { q: "Vecteur directeur de la droite x = 1 + 2λ, y = −λ, z = 3 ?", opts: ["(2 ; −1 ; 0)", "(1 ; 0 ; 3)", "(2 ; −1 ; 3)", "(1 ; −1 ; 0)"], ok: [0], expl: "Les coefficients de λ ; z ne dépend pas de λ, d'où 0." },
                { q: "Deux droites de l'espace sans point commun et dont les vecteurs directeurs ne sont pas colinéaires sont…", opts: ["Non coplanaires", "Parallèles", "Sécantes", "Confondues"], ok: [0], expl: "Parallèles demanderait des directeurs colinéaires." },
                { q: "Deux plans distincts non parallèles se coupent suivant…", opts: ["Une droite", "Un point", "Rien", "Un plan"], ok: [0], expl: "" },
                { calc: true, q: "(d1) : x = 1 + λ, y = λ, z = 2 et (d2) : x = μ, y = 1 − μ, z = 1 + μ. Les droites sont-elles sécantes ? Si oui, donner le point commun.",
                    steps: ["Directeurs (1 ; 1 ; 0) et (1 ; −1 ; 1) : non colinéaires, donc sécantes ou non coplanaires.", "z : 2 = 1 + μ, donc μ = 1. x : 1 + λ = μ = 1, donc λ = 0.", "Vérification avec y : λ = 0 et 1 − μ = 0 : égalité vraie.", "Les droites sont sécantes en (1 ; 0 ; 2)."] }
            ]
        },
        {
            id: 'bary', code: 'GÉO 2', titre: 'Barycentres', sous: 'Définition, coordonnées, barycentres partiels, centre de gravité',
            sections: [
                S('Barycentre de points pondérés', 'scale',
                    F(R`\alpha\,\overrightarrow{GA} + \beta\,\overrightarrow{GB} = \vec 0 \iff \overrightarrow{AG} = \dfrac{\beta}{\alpha + \beta}\,\overrightarrow{AB} \qquad (\alpha + \beta \neq 0)`, `G barycentre de (A ; α) et (B ; β) · G est sur (AB), plus près du point le plus lourd`),
                    F(R`x_G = \dfrac{\alpha x_A + \beta x_B + \gamma x_C}{\alpha + \beta + \gamma}`, `Même formule pour y et z : chaque coordonnée est une moyenne pondérée`),
                    UL([
                        `Poids égaux : G est le milieu (isobarycentre). Multiplier tous les poids par un même réel non nul ne change pas G.`,
                        `Pour tout point M : αMA→ + βMB→ = (α + β)MG→.`,
                        `Poids négatif : G est hors du segment, mais sur la droite (AB).`,
                        `<b>Barycentres partiels</b> : on remplace deux points par leur barycentre affecté de la somme de leurs poids. Le centre de gravité d'un triangle est aux 2/3 de chaque médiane depuis le sommet.`
                    ]))
            ],
            qcm: [
                { q: "G barycentre de (A ; 1) et (B ; 3). Alors AG→ = …", opts: ["(3/4) AB→", "(1/4) AB→", "(1/3) AB→", "3 AB→"], ok: [0], expl: "AG→ = β/(α+β) AB→ = 3/4 AB→ : G est plus près de B, le plus lourd." },
                { q: "A(2 ; 0) poids 3 et B(−2 ; 4) poids 1. Coordonnées de G ?", opts: ["(1 ; 1)", "(0 ; 2)", "(−1 ; 3)", "(1 ; 3)"], ok: [0], expl: "x = (6 − 2)/4 = 1 ; y = (0 + 4)/4 = 1." },
                { q: "Le barycentre de (A ; 2) et (B ; 2) est…", opts: ["Le milieu de [AB]", "A", "B", "Non défini"], ok: [0], expl: "Poids égaux." },
                { q: "Le barycentre de (A ; 1) et (B ; −1) …", opts: ["N'existe pas (somme des poids nulle)", "Est le milieu de [AB]", "Est A", "Est B"], ok: [0], expl: "Il faut α + β ≠ 0." },
                { q: "G barycentre de (A ; 2) et (B ; −1) se trouve…", opts: ["Sur la droite (AB), hors du segment [AB]", "Au milieu de [AB]", "Entre A et B", "Hors de la droite (AB)"], ok: [0], expl: "AG→ = −1/1 AB→ = −AB→ : G est le symétrique de B par rapport à A." },
                { q: "Le centre de gravité d'un triangle est situé, sur chaque médiane, …", opts: ["Aux 2/3 depuis le sommet", "Au milieu", "Au 1/3 depuis le sommet", "Sur le côté opposé"], ok: [0], expl: "Barycentre de (I ; 2) et (C ; 1) avec I milieu de [AB]." },
                { calc: true, q: "A(1 ; 2), B(5 ; −2), C(3 ; 6). Calculer le barycentre G de (A ; 3) et (B ; 1), puis le barycentre K de (A ; 3), (B ; 1) et (C ; 2) en utilisant G.",
                    steps: ["x_G = (3×1 + 1×5)/4 = 2 ; y_G = (3×2 + 1×(−2))/4 = 1 : G(2 ; 1). Vérification : AG→ = (1 ; −1) = 1/4 AB→ avec AB→ = (4 ; −4).", "Barycentres partiels : K est le barycentre de (G ; 4) et (C ; 2).", "x_K = (4×2 + 2×3)/6 = 14/6 ≈ 2,33 ; y_K = (4×1 + 2×6)/6 = 16/6 ≈ 2,67.", "Directement : x_K = (3 + 5 + 6)/6 = 14/6, y_K = (6 − 2 + 12)/6 = 16/6 : même résultat."] }
            ]
        },
        {
            id: 'produits', code: 'GÉO 3', titre: 'Produit scalaire, vectoriel et mixte', sous: 'Angles, orthogonalité, équations de plans, distances, aires, volumes',
            sections: [
                S('Produit scalaire', 'percent',
                    F(R`\vec u\cdot\vec v = xx' + yy' + zz' = \|\vec u\|\,\|\vec v\|\cos(\vec u, \vec v)`, `Un nombre · base orthonormée · u→ ⊥ v→ ⟺ u→·v→ = 0`),
                    F(R`ax + by + cz + d = 0 \qquad d(M, P) = \dfrac{|a x_M + b y_M + c z_M + d|}{\sqrt{a^2 + b^2 + c^2}}`, `Plan de vecteur normal n→(a ; b ; c) · distance d'un point M au plan`),
                    UL([
                        `Al-Kashi : a² = b² + c² − 2bc cos Â. Aire d'un triangle : ½ ac sin B̂.`,
                        `Plan passant par A de normale n→ : AM→·n→ = 0, puis on développe.`,
                        `Plans parallèles : normales colinéaires. Perpendiculaires : n→·n′→ = 0.`
                    ])),
                S('Produit vectoriel et produit mixte', 'box',
                    F(R`\begin{pmatrix} x \\ y \\ z \end{pmatrix} \wedge \begin{pmatrix} x' \\ y' \\ z' \end{pmatrix} = \begin{pmatrix} yz' - zy' \\ zx' - xz' \\ xy' - yx' \end{pmatrix}`, `Un vecteur orthogonal à u→ et v→, trièdre direct, norme ‖u→‖‖v→‖|sin θ| · nul ⟺ colinéaires`),
                    F(R`[\vec u, \vec v, \vec w] = \vec u\cdot(\vec v\wedge\vec w)`, `Produit mixte : un nombre · nul ⟺ coplanaires · |[u→, v→, w→]| volume du parallélépipède`),
                    UL([
                        `Aire du triangle ABC : ½‖AB→ ∧ AC→‖ ; du parallélogramme : ‖AB→ ∧ AC→‖.`,
                        `Plan (ABC) : n→ = AB→ ∧ AC→ est normal, puis AM→·n→ = 0.`,
                        `v→ ∧ u→ = −u→ ∧ v→ ; pas associatif. i→ ∧ j→ = k→, j→ ∧ k→ = i→, k→ ∧ i→ = j→.`
                    ]))
            ],
            qcm: [
                { q: "u→(2 ; −1 ; 3) · v→(1 ; 4 ; 1) = ?", opts: ["1", "−1", "9", "(2 ; −4 ; 3)"], ok: [0], expl: "2 − 4 + 3 = 1. Le produit scalaire est un nombre." },
                { q: "u→(1 ; 2 ; 2) et v→(2 ; −1 ; 2) : cos de l'angle entre eux ?", opts: ["4/9", "4/3", "0", "1/3"], ok: [0], expl: "u→·v→ = 2 − 2 + 4 = 4 ; ‖u→‖ = ‖v→‖ = 3 : cos θ = 4/9, θ ≈ 63,6°." },
                { q: "Plan passant par A(1 ; 0 ; 2) de normale n→(2 ; 1 ; −1) ?", opts: ["2x + y − z = 0", "x + 2z = 0", "2x + y − z − 4 = 0", "x + y + z − 3 = 0"], ok: [0], expl: "2(x − 1) + y − (z − 2) = 0, soit 2x + y − z = 0." },
                { q: "Distance de l'origine au plan 2x − y + 2z − 6 = 0 ?", opts: ["2", "6", "3", "6/√5"], ok: [0], expl: "|−6| / √(4 + 1 + 4) = 6/3 = 2." },
                { q: "(1 ; 0 ; 2) ∧ (0 ; 3 ; 1) = ?", opts: ["(−6 ; −1 ; 3)", "(6 ; 1 ; −3)", "(0 ; 0 ; 2)", "5"], ok: [0], expl: "(0×1 − 2×3 ; 2×0 − 1×1 ; 1×3 − 0×0)." },
                { q: "Si u→ ∧ v→ = 0→ (avec des vecteurs non nuls), alors u→ et v→ sont…", opts: ["Colinéaires", "Orthogonaux", "De même norme", "Coplanaires avec tout vecteur, mais pas colinéaires"], ok: [0], expl: "La norme vaut ‖u→‖‖v→‖|sin θ| : nulle si θ = 0 ou π." },
                { q: "Que vaut j→ ∧ i→ ?", opts: ["−k→", "k→", "0→", "1"], ok: [0], expl: "i→ ∧ j→ = k→ et le produit vectoriel est antisymétrique." },
                { q: "Le produit mixte [u→, v→, w→] est nul. Les trois vecteurs sont…", opts: ["Coplanaires", "Orthogonaux deux à deux", "Unitaires", "Une base directe"], ok: [0], expl: "Sinon ils forment une base, et |[u→, v→, w→]| est un volume." },
                { q: "Aire du triangle ABC si AB→ ∧ AC→ = (3 ; 0 ; 4) ?", opts: ["2,5", "5", "7", "12,5"], ok: [0], expl: "‖(3 ; 0 ; 4)‖ = 5, et l'aire du triangle vaut la moitié." },
                { calc: true, q: "A(1 ; 2 ; 0), B(2 ; 0 ; 1), C(0 ; 1 ; 3). Calculer un vecteur normal au plan (ABC), son équation, l'aire du triangle ABC et la distance de l'origine O à ce plan.",
                    steps: ["AB→ = (1 ; −2 ; 1), AC→ = (−1 ; −1 ; 3).", "AB→ ∧ AC→ = ((−2)×3 − 1×(−1) ; 1×(−1) − 1×3 ; 1×(−1) − (−2)×(−1)) = (−5 ; −4 ; −3) ; on prend n→(5 ; 4 ; 3).", "5(x − 1) + 4(y − 2) + 3z = 0, soit 5x + 4y + 3z − 13 = 0. Vérification : B donne 10 + 0 + 3 − 13 = 0, C donne 0 + 4 + 9 − 13 = 0.", "Aire = ½‖n→‖ = ½√(25 + 16 + 9) = ½√50 ≈ 3,54.", "d(O, P) = |−13| / √50 ≈ 1,84."] },
                { calc: true, q: "u→(1 ; 0 ; 1), v→(0 ; 1 ; 1), w→(1 ; 1 ; 0). Ces vecteurs forment-ils une base ? Calculer le volume du parallélépipède qu'ils engendrent.",
                    steps: ["v→ ∧ w→ = (1×0 − 1×1 ; 1×1 − 0×0 ; 0×1 − 1×1) = (−1 ; 1 ; −1).", "[u→, v→, w→] = u→·(v→ ∧ w→) = −1 + 0 − 1 = −2.", "Non nul : les vecteurs ne sont pas coplanaires, ils forment une base (indirecte, car le signe est négatif).", "Volume = |−2| = 2."] }
            ]
        },
        {
            id: 'fvect', code: 'CH 5', titre: 'Fonctions vectorielles et courbes paramétrées', sous: 'Dérivée, points stationnaires, tangentes, asymptotes, symétries',
            sections: [
                S('Dérivée et tangente', 'spline',
                    P(`M(t) a pour coordonnées (x(t), y(t)) : c'est la position d'un mobile, la courbe est sa trajectoire. On travaille <b>composante par composante</b>.`),
                    F(R`\vec F'(t) = \big(x'(t),\ y'(t)\big)`, `Vecteur vitesse, qui dirige la tangente en un point régulier (F′(t) ≠ 0→)`),
                    T(['Cas', 'Conclusion'], [
                        ['x′ ≠ 0 et y′ = 0', 'tangente <b>horizontale</b>'],
                        ['x′ = 0 et y′ ≠ 0', 'tangente <b>verticale</b>'],
                        ['x′ = y′ = 0', 'point <b>stationnaire</b> : pente = limite de (y(t) − y(t₀)) / (x(t) − x(t₀))']
                    ]),
                    FIGURE(fig('rebrousse'), `x = t², y = t³ : point stationnaire en t = 0, pente des sécantes t → 0, tangente horizontale.`)),
                S('Branches infinies et plan d\'étude', 'chart-spline',
                    T(['Quand t → t₀', 'Conclusion'], [
                        ['x → l et |y| → ∞', 'asymptote verticale x = l'],
                        ['|x| → ∞ et y → l', 'asymptote horizontale y = l'],
                        ['les deux → ∞, y/x → a puis y − ax → b', 'asymptote oblique y = ax + b'],
                        ['|y/x| → ∞ (ou y/x → 0)', 'branche parabolique de direction (Oy) (ou (Ox))']
                    ]),
                    UL([
                        `Symétries : x(−t) = x(t) et y(−t) = −y(t) → symétrie par rapport à (Ox) ; x(−t) = −x(t) et y(−t) = y(t) → par rapport à (Oy) ; les deux impaires → par rapport à O. On étudie alors sur [0 ; +∞[.`,
                        `Plan : domaine, symétries, tableau de variations de x et y côte à côte, points stationnaires, branches infinies, tracé.`
                    ]),
                    FIGURE(fig('lissajous'), `x = cos t, y = sin 2t : une même abscisse donne deux points, ce n'est pas le graphe d'une fonction.`))
            ],
            qcm: [
                { q: "x(t) = t², y(t) = 3t − 1. Vecteur dérivé en t = 2 ?", opts: ["(4 ; 3)", "(4 ; 5)", "(2 ; 3)", "(4 ; 0)"], ok: [0], expl: "x′ = 2t = 4, y′ = 3." },
                { q: "Un point M(t₀) est stationnaire quand…", opts: ["x′(t₀) = y′(t₀) = 0", "x′(t₀) = 0 seulement", "y′(t₀) = 0 seulement", "x(t₀) = y(t₀) = 0"], ok: [0], expl: "Le vecteur vitesse est nul." },
                { q: "En t₀, x′(t₀) = 2 et y′(t₀) = 0. La tangente est…", opts: ["Horizontale", "Verticale", "Indéterminée", "Confondue avec la courbe"], ok: [0], expl: "Elle est dirigée par (2 ; 0)." },
                { q: "x(t) = t², y(t) = t³. En t = 0, la tangente est…", opts: ["Horizontale (point de rebroussement)", "Verticale", "De pente 1", "Inexistante"], ok: [0], expl: "Point stationnaire ; pente des sécantes t³/t² = t → 0." },
                { q: "Quand t → 2, x(t) → 3 et y(t) → +∞. On a…", opts: ["Une asymptote verticale x = 3", "Une asymptote horizontale y = 3", "Une asymptote oblique", "Une branche parabolique"], ok: [0], expl: "x se rapproche de 3 pendant que y part à l'infini." },
                { q: "x(−t) = −x(t) et y(−t) = y(t) : la courbe est symétrique par rapport…", opts: ["À l'axe (Oy)", "À l'axe (Ox)", "À l'origine", "À la droite y = x"], ok: [0], expl: "M(−t) a la même ordonnée et l'abscisse opposée." },
                { q: "Les deux coordonnées tendent vers l'infini, y/x → 2 et y − 2x → −1. Conclusion ?", opts: ["Asymptote y = 2x − 1", "Asymptote y = −x + 2", "Branche parabolique de direction (Oy)", "Asymptote x = 2"], ok: [0], expl: "a = 2 puis b = −1." },
                { calc: true, q: "x(t) = t² − 2t, y(t) = t³ − 3t. Calculer x′ et y′, trouver les points à tangente horizontale ou verticale et les points stationnaires, puis la pente de la tangente au point stationnaire.",
                    steps: ["x′(t) = 2t − 2 et y′(t) = 3t² − 3 = 3(t − 1)(t + 1).", "t = −1 : y′ = 0 et x′ = −4 ≠ 0, tangente horizontale en M(−1) = (3 ; 2).", "t = 1 : x′ = y′ = 0, point stationnaire M(1) = (−1 ; −2). Il n'y a pas d'autre valeur où x′ = 0, donc pas de tangente verticale.", "Pente des sécantes en t = 1 : (y(t) + 2) / (x(t) + 1) = (t³ − 3t + 2) / (t² − 2t + 1) = (t − 1)²(t + 2) / (t − 1)² = t + 2.", "Quand t → 1, la pente tend vers 3 : tangente de pente 3 en (−1 ; −2)."] },
                { calc: true, q: "x(t) = 1/(t + 1), y(t) = t²/(t + 1). Étudier les branches infinies quand t → −1 et quand t → ±∞.",
                    steps: ["t → ±∞ : x → 0 et |y| → +∞ : asymptote verticale x = 0.", "t → −1 : |x| et |y| → +∞. y/x = t² → 1.", "y − x = (t² − 1)/(t + 1) = t − 1 → −2 : asymptote oblique y = x − 2.", "Position : y − x + 2 = t + 1, positif pour t → −1⁺ (courbe au-dessus), négatif pour t → −1⁻ (en dessous)."] }
            ]
        }
    ];

    // Fonctions de deux variables : pas de leçon sur le site, mais au DS de fin novembre en 2023 et 2025
    MATHS.push({
        id: 'deuxvar', code: 'DEUX VAR.', titre: 'Fonctions de deux variables', sous: 'Domaine, lignes de niveau, continuité, dérivées partielles, extrema',
        sections: [
            S('Domaine, lignes de niveau, continuité', 'grid-3x3',
                P(`f associe un réel f(x, y) à chaque point (x, y) d'une partie du plan. Ce chapitre n'a pas encore de leçon sur le site, mais il est tombé au DS de fin novembre en 2023 et en 2025.`),
                UL([
                    `<b>Domaine</b> : là où la formule a un sens. Avec ln : l'intérieur doit être &gt; 0 ; avec √ : ≥ 0 ; avec une fraction : dénominateur ≠ 0. On reconnaît souvent un cercle en complétant les carrés : x² − 10x + y² + 4y + 4 = (x − 5)² + (y + 2)² − 25.`,
                    `<b>Ligne de niveau k</b> : l'ensemble des points où f(x, y) = k. Exemple : ln(x² + y² − 10) = 0 ⟺ x² + y² = 11, cercle de centre O et de rayon √11.`,
                    `<b>Continuité en (0, 0)</b> : f(x, y) doit tendre vers f(0, 0) quel que soit le chemin. Pour montrer qu'elle n'est <b>pas</b> continue, il suffit de deux chemins (axes, droites y = mx) qui donnent deux limites différentes.`
                ])),
            S('Dérivées partielles et extrema', 'mountain',
                F(R`\dfrac{\partial f}{\partial x} \;(y \text{ fixé}) \qquad \dfrac{\partial f}{\partial y} \;(x \text{ fixé})`, `On dérive par rapport à une variable en traitant l'autre comme une constante`),
                F(R`r = \dfrac{\partial^2 f}{\partial x^2} \qquad s = \dfrac{\partial^2 f}{\partial x\,\partial y} \qquad t = \dfrac{\partial^2 f}{\partial y^2}`, `Dérivées secondes au point critique, pour connaître sa nature`),
                T(['Au point critique (dérivées partielles nulles)', 'Nature'], [
                    ['rt − s² &gt; 0 et r &gt; 0', '<b>minimum</b> local'],
                    ['rt − s² &gt; 0 et r &lt; 0', '<b>maximum</b> local'],
                    ['rt − s² &lt; 0', '<b>point selle</b> (col) : ni min ni max'],
                    ['rt − s² = 0', 'on ne peut pas conclure ainsi']
                ]),
                NOTE('Local ou global ?', `Un extremum local n'est pas forcément global : pour x³ + y³ − 3xy, f(x, 0) = x³ tend vers −∞, donc le minimum local en (1 ; 1) n'est pas un minimum global.`))
        ],
        qcm: [
            { q: "Domaine de f(x, y) = ln(x² + y² − 10) ?", opts: ["L'extérieur strict du cercle de centre O et de rayon √10", "L'intérieur du cercle de rayon √10", "Tout le plan", "Le cercle de rayon 10"], ok: [0], expl: "Il faut x² + y² − 10 > 0, soit x² + y² > 10.", src: 'DS de fin novembre 2025' },
            { q: "Ligne de niveau 0 de f(x, y) = ln(x² + y² − 10) ?", opts: ["Le cercle x² + y² = 11", "Le cercle x² + y² = 10", "Le point O", "La droite y = x"], ok: [0], expl: "ln(u) = 0 ⟺ u = 1, donc x² + y² − 10 = 1.", src: 'DS de fin novembre 2025' },
            { q: "Pour f(x, y) = x²y + 3y, que vaut ∂f/∂x ?", opts: ["2xy", "x² + 3", "2xy + 3", "2x"], ok: [0], expl: "y est traité comme une constante : 3y disparaît." },
            { q: "f(x, y) = (x² − y²)/(x² + y²). Sur l'axe des x elle vaut 1, sur l'axe des y elle vaut −1. Conclusion en (0, 0) ?", opts: ["Pas de limite, donc pas continue", "Continue, de limite 0", "Continue, de limite 1", "On ne peut rien dire"], ok: [0], expl: "Deux chemins, deux limites différentes." },
            { q: "Au point critique, r = 6, s = −3, t = 6. Nature ?", opts: ["Minimum local", "Maximum local", "Point selle", "On ne peut pas conclure"], ok: [0], expl: "rt − s² = 36 − 9 = 27 > 0 et r > 0." },
            { q: "Au point critique, r = 0, s = −3, t = 0. Nature ?", opts: ["Point selle", "Minimum local", "Maximum local", "Minimum global"], ok: [0], expl: "rt − s² = −9 < 0." },
            { calc: true, q: "f(x, y) = x³ + y³ − 3xy. Chercher les points critiques et leur nature. Le minimum trouvé est-il global ?",
                steps: ["∂f/∂x = 3x² − 3y et ∂f/∂y = 3y² − 3x. Points critiques : y = x² et x = y², donc x = x⁴, x(x³ − 1) = 0 : (0 ; 0) et (1 ; 1).", "r = 6x, s = −3, t = 6y.", "(0 ; 0) : rt − s² = −9 < 0, point selle.", "(1 ; 1) : rt − s² = 36 − 9 = 27 > 0 et r = 6 > 0 : minimum local, f(1 ; 1) = −1.", "Pas global : f(x ; 0) = x³ tend vers −∞ quand x → −∞."], src: 'DS 2023 et DS de fin novembre 2025' }
        ]
    });

    // ==========================================
    // Anciens DS d'AII : sujets résumés, correction, variantes
    // ==========================================
    const AII_DS = [
        {
            id: 'peinture', code: 'OCT. 2025', titre: 'Chaîne de peinture d\'enjoliveurs : GEMMA et grafcet de conduite', sous: 'DS d\'AII d\'octobre 2025 (1 h 30, sans calculatrice)',
            sections: [
                S('Le sujet', 'file-text',
                    P(`Un convoyeur (M1, KM50) amène des plaques d'enjoliveurs, détectées par <b>pe</b>, sous un chariot porte-buses (moteur M2 : KM30 à droite jusqu'à <b>cd</b>, KM40 à gauche jusqu'à <b>cg</b>) ; une électrovanne (KM60) envoie la peinture. Pupitre : ARU, Rearm, Init, auto/manu, dcy, cycle par cycle / continu, commandes manuelles md / mg (bouton 3 positions à retour au centre), voyants VAUTO, VMANU, VARU.`),
                    FIGURE(fig('gemma'), `Le sujet donne le GEMMA de la machine : A1, F1, A2, F4, A6, D1, D2, A5.`),
                    UL([
                        `1. Repérer les boucles du GEMMA. 2. Entourer sur le pupitre les boutons de chaque boucle.`,
                        `3. Écrire le grafcet de conduite (GC) à partir du GEMMA, du grafcet de sécurité et du grafcet d'initialisation donnés.`,
                        `4. Compléter le grafcet de production normale (GPN) du point de vue de la partie commande.`,
                        `5. Justifier le front montant ↑pe. 6. Mode manuel F4 en logique câblée : table de vérité et Karnaugh de KM30 et KM40.`
                    ])),
                S('Correction', 'check-check',
                    T(['Boucle', 'Cheminement'], [
                        ['Fonctionnement normal', 'A1 → F1 → A2 → A1'],
                        ['Réglage (manuel)', 'A6 → A1 → F4 → A6'],
                        ['Arrêt d\'urgence', 'D1 → D2 → A5 → A6 → A1']
                    ]),
                    UL([
                        `GC : étape 1 (A1) ; <b>auto·dcy·CI</b> → étape 2 « autoriser GPN » (F1) ; <b>cy/cy + manu</b> → étape 3 (A2), qui attend la fin du cycle (X20) puis revient en 1 ; <b>manu</b> → étape 4 « autoriser le manuel » (F4) ; <b>/manu·init</b> → étape 5 « autoriser Ginit » (A6) ; fin de l'initialisation → retour en 1.`,
                        `GPN : sans plaque, on avance le convoyeur (KM50) ; avec une plaque, on peint en déplaçant le chariot à gauche (KM60, KM40) jusqu'à cg, puis à droite jusqu'à cd, puis on avance. En cycle par cycle, on attend une nouvelle plaque.`,
                        `<b>Front ↑pe</b> : la plaque reste devant le capteur ; sans front, pe = 1 relancerait le cycle en boucle. Le front ne compte qu'une plaque qui arrive.`,
                        `F4 : <b>KM30 = md·/cd</b> et <b>KM40 = mg·/cg</b> (md et mg ne valent jamais 1 ensemble : cases indifférentes). Le bouton à retour au centre ne peut pas commander les deux sens à la fois, et le chariot s'arrête dès que l'opérateur lâche.`
                    ]),
                    NOTE('À retenir', `Le grafcet de conduite reprend le GEMMA rectangle par rectangle : une étape par état retenu, les transitions du GEMMA deviennent ses réceptivités.`))
            ],
            qcm: [
                { fig: fig('gemma'), q: "Dans le GEMMA de la chaîne de peinture, quelle est la boucle de réglage ?", opts: ["A6 → A1 → F4 → A6", "A1 → F1 → A2 → A1", "D1 → D2 → A5 → A6 → A1", "F1 → D3 → F1"], ok: [0], expl: "F4 est le mode manuel, on revient par A6 pour retrouver l'état initial.", src: 'DS AII, octobre 2025' },
                { q: "Pourquoi utiliser le front montant ↑pe pour lancer le cycle de peinture ?", opts: ["Pour ne compter qu'une nouvelle plaque, et pas relancer le cycle tant que la même plaque est devant le capteur", "Parce que pe est un capteur analogique", "Pour accélérer le convoyeur", "Pour que le cycle démarre plus tard"], ok: [0], expl: "", src: 'DS AII, octobre 2025' },
                { q: "En mode manuel, le chariot va à droite avec md jusqu'au fin de course cd. Équation de KM30 ?", opts: ["KM30 = md·/cd", "KM30 = md + cd", "KM30 = /md·cd", "KM30 = md·cd"], ok: [0], expl: "On commande tant que md est appuyé et que la butée n'est pas atteinte.", src: 'DS AII, octobre 2025' },
                { calc: true, fig: fig('gemma'), q: "Variante : une machine a les états A1, F1, A2, F4, A6, D1 et A5. Écrire les étapes et les réceptivités du grafcet de conduite (boutons auto/manu, dcy, acy, init, rearm, AU ; CI = conditions initiales).",
                    steps: ["Étape 1 = A1 (initiale). 1 → 2 (F1, « autoriser la production ») si auto·dcy·CI.", "2 → 3 (A2, arrêt en fin de cycle) si acy + manu ; 3 → 1 quand le grafcet de production est revenu à son étape initiale.", "1 → 4 (F4, « autoriser le manuel ») si manu ; 4 → 5 (A6, « autoriser l'initialisation ») si /manu·init ; 5 → 1 si CI.", "D1 et A5 ne sont pas dans le GC : le grafcet de sûreté, de niveau supérieur, force le GC (F/GC{ }) sur AU, puis le remet à l'étape 1 après rearm."] }
            ]
        },
        {
            id: 'embout', code: 'NOV. 2024', titre: 'Chaîne d\'embouteillage : grafcets de tâches, sécurité et forçage', sous: 'DS d\'AII du 30/11/2024 (1 h 30, sans calculatrice)',
            sections: [
                S('Le sujet', 'file-text',
                    P(`Un tapis (moteur MTP, 10 impulsions imp_tp par emplacement) fait passer les bouteilles par trois postes indépendants : <b>étiquetage</b> (pb_etq, KMETQ, petq1 présence d'étiquettes, petq2 tension du ruban), <b>remplissage</b> (pb_emb, cône VCEMB, électrovanne YVCV pendant 15 s, pvc vin présent) et <b>bouchage</b> (pb_bch, cône VCBCH, piston VPBCH, bch_ok bouchons présents). Le grafcet de fonctionnement normal (GFN) synchronise les tâches GTA (tapis), GTE, GTR et GTB. Sécurité câblée : AU (NF), carter (NF) et bouton rearm en série avec le relais secu.`),
                    FIGURE(fig('sync'), `Les grafcets de tâches se synchronisent par des réceptivités X…, comme ici.`),
                    UL([
                        `Compléter les transitions vides des grafcets GC, GFN et des quatre tâches.`,
                        `Donner l'équation logique du relais secu, puis proposer le grafcet de sécurité (rappel du sujet : F/G{ } vide, F/G{*} fige, F/G{20, 50} active les étapes 20 et 50).`,
                        `Simplifier S = ab/d + ācd + bcd + abd + āc/d + bc/d, par le calcul et par Karnaugh.`
                    ])),
                S('Correction', 'check-check',
                    UL([
                        `<b>GFN</b> : 20 →X13 (GC en production)→ 21 « autoriser avance tapis et étiquetage » →<b>X32·X43</b> (les deux tâches finies)→ 22 « autoriser remplissage et bouchage » →<b>X54·X65</b>→ 20.`,
                        `<b>GTA</b> : 30 (C0 = 0) →X21→ 31 KMTP, C0 = C0 + 1 sur ↑imp_tp →[C0 = 10]→ 32 (fin) →<b>/X21</b>→ 30. Même principe pour l'étiquetage (départ sur X21, retour sur /X21).`,
                        `<b>GTR</b> : 50 →pb_emb·X22→ 51 descendre le cône → 52 YVCV →15 s/X52→ 53 remonter → 54 (fin) ; sans bouteille : 50 →<b>/pb_emb·X22</b>→ 54 directement ; 54 →/X22→ 50. Idem pour le bouchage avec pb_bch. Une bouteille absente ne bloque pas la chaîne.`,
                        `<b>secu = /AU · /carter · (rearm + secu)</b> : contacts NF en série et auto-maintien du relais (effet mémoire, arrêt prioritaire).`,
                        `<b>Grafcet de sécurité</b> : 0 →/secu→ 1 HAU (clignotant), F/GC{ }, F/GFN{ }, F/GTA{ }… (vidage) →secu→ 2 F/GC{10}, F/GFN{20}, F/GTA{30}… (situation initiale) →X10·X20·X30·X40·X50·X60→ 0.`,
                        `S = ab(d + /d) + āc(d + /d) + bc(d + /d) = ab + āc + bc = <b>ab + āc</b> : bc est le terme de consensus, déjà couvert par ab et āc. Dans Karnaugh, ne pas entourer ce groupe redondant.`
                    ]),
                    NOTE('Barème', `Le correcteur a surtout sanctionné les réceptivités de synchronisation (X21, /X21, X22) oubliées ou approximatives, et le groupe redondant dans Karnaugh.`))
            ],
            qcm: [
                { q: "Équation du relais secu (AU et carter à contact NF, rearm en série, auto-maintien) ?", opts: ["secu = /AU·/carter·(rearm + secu)", "secu = AU + carter + rearm", "secu = /AU + /carter + rearm", "secu = rearm·secu"], ok: [0], expl: "Tout en série, et le contact secu en parallèle sur rearm mémorise l'état.", src: 'DS AII, 30/11/2024' },
                { q: "Dans le GTR, comment éviter qu'un emplacement vide bloque la chaîne ?", opts: ["Une transition /pb_emb·X22 qui saute directement à l'étape de fin", "Attendre une bouteille", "Arrêter le tapis", "Forcer le GFN"], ok: [0], expl: "Sans bouteille, la tâche est déclarée finie tout de suite.", src: 'DS AII, 30/11/2024' },
                { q: "Le GFN passe de l'étape 21 à 22 quand…", opts: ["X32·X43 : l'avance du tapis et l'étiquetage sont finis", "X21", "pb_emb", "Au bout de 15 s"], ok: [0], expl: "Les étapes de fin des tâches servent de synchronisation.", src: 'DS AII, 30/11/2024' },
                { q: "Simplifier S = ab + āc + bc.", opts: ["ab + āc", "a + c", "bc", "ab + bc"], ok: [0], expl: "bc = bc(a + ā) = abc + ābc, absorbés par ab et āc : c'est le théorème du consensus.", src: 'DS AII 2024 et novembre 2025' },
                { q: "Dans le grafcet de sécurité, que faire des autres grafcets sur arrêt d'urgence ?", opts: ["Les vider (F/G{ }) pour arrêter tous les mouvements", "Les laisser évoluer", "Les mettre en manuel", "Les figer sans couper les actions"], ok: [0], expl: "Puis, au réarmement, les forcer dans leur situation initiale.", src: 'DS AII, 30/11/2024' },
                { calc: true, q: "Variante : simplifier S = a/b/c + a/bc + ab/c + /abc, par le calcul puis avec Karnaugh.",
                    steps: ["a/b/c + a/bc = a/b(/c + c) = a/b.", "Il reste S = a/b + ab/c + /abc.", "Karnaugh (abc) : les 1 sont en 100, 101, 110 et 011. Groupes de deux : a/b (100, 101) et a/c (100, 110). La case 011 n'a aucune voisine à 1 : elle reste seule (/abc).", "S = a/b + a/c + /abc = a·/(bc) + /abc. Le calcul y arrive aussi : ab/c = ab/c + a/b/c (déjà là) se regroupe en a/c."] }
            ]
        },
        {
            id: 'bidons', code: 'NOV. 2025', titre: 'Remplissage et bouchage de bidons, simplification, schémas-blocs', sous: 'DS d\'AII du 29/11/2025 (1 h 30, sans calculatrice)',
            sections: [
                S('Le sujet', 'file-text',
                    P(`1. Grafcet de la PO : un tapis avance d'un pas (AP, fin fa) sur un ordre Oa, depuis les conditions initiales Ci. Deux postes travaillent ensuite en même temps : remplissage (R, fin fr) et bouchage (B, fin fb). L'approvisionnement est irrégulier : chaque poste a un capteur bidon présent (bp) et bidon absent (ba).`),
                    UL([
                        `2. Simplifier xy + x̄z + yz par le calcul et par Karnaugh.`,
                        `3. Trouver la fonction de transfert de trois schémas-blocs, dont : (a) un intégrateur 1/p bouclé par un gain 4, suivi de 2/(p + 2), additionné à une branche directe 10·E, puis un gain 1/100 ; (b) un bloc A bouclé par D, suivi d'un bloc B bouclé par C, l'ensemble bouclé par un retour unitaire.`
                    ])),
                S('Correction', 'check-check',
                    UL([
                        `<b>Grafcet</b> : 0 →Ci·Oa→ 10 AP →fa→ divergence en ET vers les deux postes. Remplissage : 20 →bp→ 30 R →fr→ 35, ou 20 →ba→ 35 (saut si pas de bidon). Bouchage : 40 →bp→ 50 B →fb→ 55, ou 40 →ba→ 55. Convergence en ET sur les <b>étapes d'attente</b> 35 et 55 →=1→ 0.`,
                        `<b>xy + x̄z + yz = xy + x̄z</b> : yz est le terme de consensus (yz = xyz + x̄yz, absorbé).`,
                        `<b>(a)</b> 1/p bouclé par 4 : (1/p) / (1 + 4/p) = 1/(p + 4). Avec 2/(p + 2) : 2/(p² + 6p + 8). Plus la branche 10 : (10p² + 60p + 82)/(p² + 6p + 8). Avec 1/100 : <b>S/E = (10p² + 60p + 82) / (100(p² + 6p + 8))</b>.`,
                        `<b>(b)</b> A/(1 + AD) et B/(1 + BC) en série, puis retour unitaire : <b>S/E = AB / ((1 + AD)(1 + BC) + AB)</b>.`
                    ]),
                    FIGURE(fig('asservi'), `Méthode : réduire les boucles de l'intérieur vers l'extérieur, avec boucle = directe / (1 + boucle ouverte).`),
                    NOTE('Pièges', `Sans les étapes d'attente 35 et 55, la convergence en ET ne peut pas attendre le poste le plus lent. Dans un schéma-bloc, une branche qui part de l'entrée et rejoint un sommateur s'<b>additionne</b>, elle ne se multiplie pas.`))
            ],
            qcm: [
                { q: "Dans la divergence en ET remplissage / bouchage, pourquoi des étapes d'attente 35 et 55 avant la convergence ?", opts: ["Pour que la convergence attende que les deux postes aient fini", "Pour temporiser le tapis", "Parce qu'une divergence en ET doit finir par une étape initiale", "Pour compter les bidons"], ok: [0], expl: "La transition après la convergence ne se franchit que si les deux étapes d'attente sont actives.", src: 'DS AII, 29/11/2025' },
                { q: "Poste sans bidon (ba = 1) : que fait le grafcet du poste ?", opts: ["Il saute directement à son étape d'attente", "Il attend un bidon", "Il arrête le tapis", "Il remplit quand même"], ok: [0], expl: "Un saut d'étapes par une transition ba.", src: 'DS AII, 29/11/2025' },
                { q: "1/p bouclé par un retour de gain 4 donne…", opts: ["1/(p + 4)", "4/(p + 4)", "1/(4p)", "p/(p + 4)"], ok: [0], expl: "(1/p) / (1 + 4/p) = 1/(p + 4).", src: 'DS AII, 29/11/2025' },
                { q: "A bouclé par D, puis B bouclé par C, le tout bouclé par un retour unitaire :", opts: ["AB / ((1 + AD)(1 + BC) + AB)", "AB / (1 + ABCD)", "(A + B) / (1 + C + D)", "AB / (1 + AD + BC)"], ok: [0], expl: "Réduire chaque boucle, multiplier, puis G/(1 + G).", src: 'DS AII, 29/11/2025' },
                { calc: true, fig: fig('asservi'), q: "Variante : 2/p bouclé par un gain 3, suivi de 1/(p + 1), additionné à une branche directe 5·E, le tout multiplié par 1/10. Fonction de transfert et gain statique (p → 0) ?",
                    steps: ["2/p bouclé par 3 : (2/p) / (1 + 6/p) = 2/(p + 6).", "Avec 1/(p + 1) : 2/((p + 6)(p + 1)) = 2/(p² + 7p + 6).", "Plus 5 : (5p² + 35p + 30 + 2)/(p² + 7p + 6) = (5p² + 35p + 32)/(p² + 7p + 6).", "S/E = (5p² + 35p + 32) / (10(p² + 7p + 6)).", "Gain statique : 32 / 60 ≈ 0,53."] }
            ]
        }
    ];

    // ==========================================
    // Anciens DS de maths
    // ==========================================
    const MATHS_DS = [
        {
            id: 'espace', code: '2022-2025', titre: 'Géométrie de l\'espace : plans, droites, barycentres', sous: 'DS n°2 de 2022 et 2023, DS de fin novembre 2025',
            sections: [
                S('Ce qui revient', 'file-text',
                    UL([
                        `<b>2022</b> : milieux et point défini par BJ→ = ¼BC→ ; plan (IJK) avec IJ→ ∧ IK→ ; intersection d'une droite et d'un plan ; barycentre de 4 points par barycentres partiels pour prouver que 4 points sont coplanaires ; triangle rectangle par le produit scalaire ; plans orthogonaux à une droite ; distance d'un point à un plan.`,
                        `<b>2023</b> : plan (ABC) par le produit vectoriel, produit mixte [DA→, DB→, DC→], projeté orthogonal H de D sur le plan, distance DH, symétrique de D.`,
                        `<b>2025</b> : vecteur directeur lu dans une représentation paramétrique, position relative de deux droites, base d'un plan, droite parallèle à un plan (directeur combinaison des vecteurs du plan), intersection.`
                    ]),
                    NOTE('Piège relevé en 2025', `Le vecteur directeur se lit dans les <b>coefficients du paramètre</b>, pas dans les constantes : x = −2 + 3t, y = 1 − t, z = 3 + t donne u→(3 ; −1 ; 1).`)),
                S('Corrections', 'check-check',
                    UL([
                        `<b>2022</b> : A(−1 ; 0 ; 2), B(3 ; 2 ; −4), C(1 ; −4 ; 2), D(5 ; −2 ; 4). I(1 ; 1 ; −1), J(5/2 ; 1/2 ; −5/2), K(3 ; −3 ; 3). IJ→ ∧ IK→ est colinéaire à (8 ; 9 ; 5) : plan <b>8x + 9y + 5z − 12 = 0</b>. (AD) : x = −1 + 6t, y = −2t, z = 2 + 2t coupe ce plan pour t = 1/4 en L(1/2 ; −1/2 ; 5/2). G barycentre de (A ; 3), (B ; 3), (C ; 1), (D ; 1) est sur (LJ) (L = bar(A ; 3)(D ; 1), J = bar(B ; 3)(C ; 1)) et sur (IK) : I, J, K, L sont coplanaires.`,
                        `<b>2022, ex. 2</b> : AB→(3 ; 3 ; 3)·AC→(3 ; 0 ; −3) = 0 : rectangle en A. Plan orthogonal à (AB) passant par A : x + y + z − 3 = 0 ; à (AC) : x − z − 1 = 0 ; leur intersection est dirigée par (1 ; 1 ; 1) ∧ (1 ; 0 ; −1) = (−1 ; 2 ; −1). D(0 ; 4 ; −1) : AD→ est orthogonal à AB→ et AC→, donc la distance de D au plan (ABC) est AD = √54 = 3√6.`,
                        `<b>2023</b> : A(3 ; 0 ; 1), B(0 ; −1 ; 2), C(1 ; −1 ; 0), D(1 ; 1 ; −5). AB→ ∧ AC→ = (2 ; −5 ; 1), plan <b>2x − 5y + z − 7 = 0</b>. [DA→, DB→, DC→] = 15. Droite D + k(2 ; −5 ; 1) : le plan donne 30k − 15 = 0, k = 1/2, H(2 ; −3/2 ; −9/2), DH = √30 / 2 ≈ 2,74, symétrique D′(3 ; −4 ; −4).`,
                        `<b>2025</b> : (D1) dirigée par (3 ; −1 ; 1), (D2) : x = 2s, y = 2s − 5, z = −6 − s, dirigée par (2 ; 2 ; −1). Égaler x et y donne t = s = 2, mais z donne 5 ≠ −8 : <b>non coplanaires</b>. Plan P : A(0 ; −1 ; 3), base (2 ; −3 ; 1), (1 ; 2 ; 0) ; (3 ; −1 ; 1) = (2 ; −3 ; 1) + (1 ; 2 ; 0) : D1 est parallèle à P ; le point (−2 ; 1 ; 3) de D1 n'est pas dans P (normale (−2 ; 1 ; 7), P : −2x + y + 7z − 20 = 0, et 4 + 1 + 21 − 20 ≠ 0) : <b>aucune intersection</b>.`
                    ]))
            ],
            qcm: [
                { q: "(D) : x = −2 + 3t, y = 1 − t, z = 3 + t. Un vecteur directeur ?", opts: ["(3 ; −1 ; 1)", "(−2 ; 1 ; 3)", "(1 ; 0 ; 4)", "(3 ; 1 ; 1)"], ok: [0], expl: "Les coefficients de t. (−2 ; 1 ; 3) est un point de la droite.", src: 'DS de fin novembre 2025' },
                { q: "AB→ ∧ AC→ = (2 ; −5 ; 1) et A(3 ; 0 ; 1). Équation du plan (ABC) ?", opts: ["2x − 5y + z − 7 = 0", "2x − 5y + z = 0", "3x + z − 7 = 0", "2x − 5y + z + 7 = 0"], ok: [0], expl: "2×3 − 0 + 1 = 7.", src: 'DS n°2, 2023' },
                { q: "Distance de D(1 ; 1 ; −5) au plan 2x − 5y + z − 7 = 0 ?", opts: ["15/√30 = √30/2", "15", "√30", "7/√30"], ok: [0], expl: "|2 − 5 − 5 − 7| / √(4 + 25 + 1) = 15/√30.", src: 'DS n°2, 2023' },
                { q: "Le vecteur directeur d'une droite est une combinaison des deux vecteurs de base d'un plan. Alors la droite est…", opts: ["Parallèle au plan (ou incluse dedans)", "Orthogonale au plan", "Sécante au plan", "Non coplanaire avec le plan"], ok: [0], expl: "Il reste à tester un point de la droite pour savoir si elle est incluse.", src: 'DS de fin novembre 2025' },
                { q: "G barycentre de (A ; 3), (B ; 3), (C ; 1), (D ; 1). Par associativité, G est aussi le barycentre de…", opts: ["(I ; 6) et (K ; 2), avec I milieu de [AB] et K milieu de [CD]", "(A ; 6) et (C ; 2)", "(I ; 3) et (K ; 1)", "A, B, C, D avec des poids égaux"], ok: [0], expl: "On remplace deux points par leur barycentre affecté de la somme de leurs poids.", src: 'DS n°2, 2022' },
                { calc: true, q: "Variante : A(1 ; 0 ; 2), B(2 ; 1 ; 0), C(0 ; 1 ; 1), D(3 ; 2 ; 4). Équation du plan (ABC), distance de D au plan, et coordonnées du projeté H de D sur le plan.",
                    steps: ["AB→ = (1 ; 1 ; −2), AC→ = (−1 ; 1 ; −1). AB→ ∧ AC→ = (1×(−1) − (−2)×1 ; (−2)×(−1) − 1×(−1) ; 1×1 − 1×(−1)) = (1 ; 3 ; 2).", "Plan : x + 3y + 2z + d = 0, avec A : 1 + 4 + d = 0, d = −5. Vérification : B donne 2 + 3 − 5 = 0, C donne 3 + 2 − 5 = 0.", "D : 3 + 6 + 8 − 5 = 12, distance = 12/√14 ≈ 3,21.", "H = D + k(1 ; 3 ; 2) avec (3 + k) + 3(2 + 3k) + 2(4 + 2k) − 5 = 0, soit 12 + 14k = 0, k = −6/7.", "H(3 − 6/7 ; 2 − 18/7 ; 4 − 12/7) = (15/7 ; −4/7 ; 16/7)."] }
            ]
        },
        {
            id: 'courbes', code: '2023', titre: 'Courbes paramétrées : symétries et branches infinies', sous: 'DS n°2 de 2023, exercices 1 et 2',
            sections: [
                S('Le sujet', 'file-text',
                    UL([
                        `Ex. 1 : x(t) = t/(1 + t⁴), y(t) = t³/(1 + t⁴). Domaine, symétries pour t → −t puis t → 1/t, intervalle d'étude, variations, tangentes, points stationnaires, tracé.`,
                        `Ex. 2 : branches infinies de x(t) = t³/(t² − 9), y(t) = t(t − 2)/(t − 3).`
                    ]),
                    FIGURE(fig('lissajous'), `Comme cette courbe, celle de l'ex. 1 se boucle : on l'étudie sur un petit intervalle puis on complète par symétrie.`)),
                S('Correction (la nôtre)', 'check-check',
                    UL([
                        `<b>Ex. 1</b> : définie sur ℝ. x et y impaires : symétrie par rapport à O, on étudie sur [0 ; +∞[. x(1/t) = t³/(1 + t⁴) = y(t) et y(1/t) = x(t) : M(1/t) est le symétrique de M(t) par rapport à la droite y = x, on étudie sur [0 ; 1].`,
                        `x′(t) = (1 − 3t⁴)/(1 + t⁴)², y′(t) = t²(3 − t⁴)/(1 + t⁴)². En t = 0 : x′ = 1, y′ = 0, tangente horizontale à l'origine. En t = 3<sup>−1/4</sup> ≈ 0,76 : x′ = 0, y′ ≠ 0, tangente verticale. Pas de point stationnaire ; x et y restent bornées : pas de branche infinie. En t = 1 : M(1/2 ; 1/2), sur l'axe de symétrie.`,
                        `<b>Ex. 2</b>, t → −3 : x → ∞ et y → −5/2 : asymptote horizontale <b>y = −5/2</b>.`,
                        `t → 3 : les deux tendent vers l'infini ; y/x = (t − 2)(t + 3)/t² → 2/3 ; y − (2/3)x = (t³/3 + t² − 6t)/((t − 3)(t + 3)) → 9/6 = 3/2 (forme 0/0, factoriser ou dériver) : asymptote <b>y = (2/3)x + 3/2</b>.`,
                        `t → ±∞ : y/x → 1 et y − x = (t² − 6t)/(t² − 9) → 1 : asymptote <b>y = x + 1</b>.`
                    ]))
            ],
            qcm: [
                { q: "x(t) = t/(1 + t⁴), y(t) = t³/(1 + t⁴). Que donne t → 1/t ?", opts: ["x(1/t) = y(t) et y(1/t) = x(t) : symétrie par rapport à la droite y = x", "Symétrie par rapport à O", "Symétrie par rapport à (Ox)", "Rien de particulier"], ok: [0], expl: "Multiplier haut et bas par t⁴.", src: 'DS n°2, 2023' },
                { q: "Avec les symétries t → −t et t → 1/t, sur quel intervalle étudier cette courbe ?", opts: ["[0 ; 1]", "ℝ", "[0 ; +∞[", "[−1 ; 1]"], ok: [0], expl: "t → −t ramène à [0 ; +∞[, puis t → 1/t à [0 ; 1].", src: 'DS n°2, 2023' },
                { q: "x(t) = t³/(t² − 9), y(t) = t(t − 2)/(t − 3). Quand t → −3 ?", opts: ["Asymptote horizontale y = −5/2", "Asymptote verticale x = −3", "Asymptote oblique y = x + 1", "Point stationnaire"], ok: [0], expl: "x part à l'infini, y → (−3)(−5)/(−6) = −5/2.", src: 'DS n°2, 2023' },
                { calc: true, q: "Variante : x(t) = t²/(t − 1), y(t) = t/(t − 1). Étudier les branches infinies.",
                    steps: ["t → 1 : x et y tendent vers l'infini. y/x = 1/t → 1.", "y − x = (t − t²)/(t − 1) = −t → −1 : asymptote y = x − 1.", "t → ±∞ : x ~ t → ±∞ et y → 1 : asymptote horizontale y = 1.", "Position quand t → 1 : y − x + 1 = 1 − t, positif pour t → 1⁻ (au-dessus), négatif pour t → 1⁺."] }
            ]
        },
        {
            id: 'reperes', code: '2025', titre: 'Coordonnées cylindriques et sphériques', sous: 'DS de fin novembre 2025, exercice 1',
            sections: [
                S('Méthode et correction', 'globe',
                    F(R`x = r\sin\theta\cos\varphi \quad y = r\sin\theta\sin\varphi \quad z = r\cos\theta \qquad r = \sqrt{x^2 + y^2 + z^2},\ \cos\theta = \dfrac{z}{r}`, `Sphériques · θ colatitude (angle avec Oz, entre 0 et π) · φ longitude · cylindriques : x = r cos θ, y = r sin θ, z = z`),
                    UL([
                        `M(−√6/2 ; √6/2 ; 1) en sphériques : r = √(3/2 + 3/2 + 1) = 2 ; cos θ = 1/2, donc <b>θ = π/3</b> ; r sin θ = √3, donc cos φ = −√2/2 et sin φ = √2/2 : <b>φ = 3π/4</b> (x &lt; 0, y &gt; 0).`,
                        `M(7 ; π/4 ; √5) en cylindriques : x = 7 cos(π/4) = 7√2/2, y = 7√2/2, z = √5.`
                    ]),
                    NOTE('Piège', `Pour φ, regarder les signes de x et y : un seul cosinus ne suffit pas à choisir l'angle.`))
            ],
            qcm: [
                { q: "M(0 ; 0 ; 3) en coordonnées sphériques (r, θ, φ) ?", opts: ["r = 3, θ = 0 (φ quelconque)", "r = 3, θ = π/2", "r = 0, θ = 3", "r = 3, θ = π"], ok: [0], expl: "Sur l'axe Oz positif, la colatitude est nulle." },
                { q: "M(−√6/2 ; √6/2 ; 1). Que vaut r ?", opts: ["2", "√6", "4", "1"], ok: [0], expl: "√(6/4 + 6/4 + 1) = √4.", src: 'DS de fin novembre 2025' },
                { q: "Cylindriques (2 ; π/3 ; 5) → cartésiennes ?", opts: ["(1 ; √3 ; 5)", "(√3 ; 1 ; 5)", "(2 ; π/3 ; 5)", "(1 ; √3 ; 2)"], ok: [0], expl: "x = 2 cos(π/3) = 1, y = 2 sin(π/3) = √3." },
                { calc: true, q: "Variante : écrire M(1 ; −1 ; √2) en coordonnées sphériques.",
                    steps: ["r = √(1 + 1 + 2) = 2.", "cos θ = z/r = √2/2, donc θ = π/4.", "r sin θ = √2 : cos φ = 1/√2 et sin φ = −1/√2.", "x > 0 et y < 0 : φ = −π/4 (ou 7π/4)."] }
            ]
        },
        {
            id: 'deuxvards', code: '2023 / 2025', titre: 'Fonctions de deux variables : domaine, continuité, extrema', sous: 'DS n°2 de 2023 (ex. 4 et 5) et DS de fin novembre 2025 (ex. 3 et 4)',
            sections: [
                S('Le sujet et la correction', 'check-check',
                    UL([
                        `<b>2023</b> : f(x, y) = ln(x² − 10x + y² + 4y + 4). x² − 10x + y² + 4y + 4 = (x − 5)² + (y + 2)² − 25 : domaine = <b>extérieur strict du cercle de centre (5 ; −2) et de rayon 5</b>.`,
                        `<b>2023</b> : g(x, y) = (x² − 3y³)/(2x² + √2 y²) en (0, 0). Sur y = 0 : 1/2 ; sur x = 0 : −3y/√2 → 0. Deux limites différentes : <b>pas continue</b>.`,
                        `<b>2025</b> : f(x, y) = ln(x² + y² − 10) : domaine x² + y² &gt; 10 ; f(x, 10) = ln(x² + 90), définie partout ; ligne de niveau 0 : x² + y² = 11. Continuité étudiée sur les axes, comme ci-dessus.`,
                        `<b>2023 et 2025 (même exercice !)</b> : extrema de x³ + y³ − 3xy : points critiques (0 ; 0), point selle, et (1 ; 1), minimum local de valeur −1, pas global.`
                    ]),
                    NOTE('Bon à savoir', `L'exercice des extrema de x³ + y³ − 3xy est tombé deux fois à l'identique. Le chapitre est détaillé dans la partie « Maths : cours ».`))
            ],
            qcm: [
                { q: "Domaine de ln(x² − 10x + y² + 4y + 4) ?", opts: ["Extérieur strict du cercle de centre (5 ; −2) et de rayon 5", "Intérieur du cercle de centre (5 ; −2) et de rayon 5", "Extérieur du cercle de centre (−5 ; 2) et de rayon 5", "Tout le plan"], ok: [0], expl: "Compléter les carrés : (x − 5)² + (y + 2)² − 25 > 0.", src: 'DS n°2, 2023' },
                { q: "g(x, y) = (x² − 3y³)/(2x² + √2 y²) : limite sur l'axe y = 0 ?", opts: ["1/2", "0", "1", "−3/√2"], ok: [0], expl: "x²/(2x²) = 1/2, alors que sur x = 0 la limite vaut 0 : pas continue en (0, 0).", src: 'DS n°2, 2023' },
                { calc: true, q: "Variante : f(x, y) = x² + y² − 2x + 4y. Points critiques et nature.",
                    steps: ["∂f/∂x = 2x − 2, ∂f/∂y = 2y + 4 : point critique (1 ; −2).", "r = 2, s = 0, t = 2 : rt − s² = 4 > 0 et r > 0 : minimum local.", "f(1 ; −2) = 1 + 4 − 2 − 8 = −5.", "f = (x − 1)² + (y + 2)² − 5 ≥ −5 : c'est même un minimum global."] }
            ]
        }
    ];

    // Le moteur ne mélange pas les propositions : on les permute une fois pour toutes, selon le
    // texte de la question, pour que la bonne réponse ne soit pas toujours la première.
    const hacher = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    [AII, MATHS, AII_DS, MATHS_DS].forEach(liste => liste.forEach(ch => ch.qcm.forEach(q => {
        if (q.calc || !Array.isArray(q.opts)) return;
        let g = hacher(q.q);
        const ordre = q.opts.map((_, i) => i);
        for (let i = ordre.length - 1; i > 0; i--) { g = Math.imul(g ^ (g >>> 15), 2246822507) >>> 0; const j = g % (i + 1); [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; }
        const bons = new Set(q.ok);
        q.opts = ordre.map(i => q.opts[i]);
        q.ok = ordre.map((i, k) => (bons.has(i) ? k : -1)).filter(k => k >= 0);
    })));

    // ==========================================
    // Formules à savoir refaire
    // ==========================================
    const FORMULES = [
        { titre: 'AII : asservissement', items: [
            [R`\varepsilon = E - H\,S \qquad S = K\,G\,\varepsilon`, `Comparateur et chaîne directe · K régulateur · G système · H capteur`],
            [R`\dfrac{S}{E} = \dfrac{K\,G}{1 + K\,G\,H}`, `Boucle fermée · K·G chaîne directe · K·G·H boucle ouverte`],
            [R`s_\infty = \lim_{p \to 0} p\,S(p) \qquad E(p) = \dfrac{e_0}{p}`, `Valeur finale pour un échelon de hauteur e<sub>0</sub>`],
            [R`S = \dfrac{K\,G}{1 + K\,G\,H}\,E + \dfrac{G}{1 + K\,G\,H}\,D`, `Superposition avec une perturbation D qui entre avant G`]
        ] },
        { titre: 'Maths : géométrie', items: [
            [R`\overrightarrow{AG} = \dfrac{\beta}{\alpha + \beta}\,\overrightarrow{AB} \qquad x_G = \dfrac{\alpha x_A + \beta x_B}{\alpha + \beta}`, `Barycentre de (A ; α) et (B ; β)`],
            [R`\vec u\cdot\vec v = xx' + yy' + zz' = \|\vec u\|\,\|\vec v\|\cos\theta`, `Produit scalaire · orthogonaux ⟺ 0`],
            [R`d(M, P) = \dfrac{|a x_M + b y_M + c z_M + d|}{\sqrt{a^2 + b^2 + c^2}}`, `Distance d'un point au plan ax + by + cz + d = 0`],
            [R`\vec u\wedge\vec v = (yz' - zy',\ zx' - xz',\ xy' - yx')`, `Produit vectoriel · aire du triangle ½‖AB→ ∧ AC→‖`],
            [R`[\vec u, \vec v, \vec w] = \vec u\cdot(\vec v\wedge\vec w)`, `Produit mixte · nul ⟺ coplanaires · volume = valeur absolue`]
        ] },
        { titre: 'Maths : fonctions vectorielles', items: [
            [R`\vec F'(t) = \big(x'(t),\ y'(t)\big)`, `Vecteur vitesse, directeur de la tangente en un point régulier`],
            [R`m = \lim_{t \to t_0} \dfrac{y(t) - y(t_0)}{x(t) - x(t_0)}`, `Pente de la tangente en un point stationnaire`],
            [R`a = \lim \dfrac{y}{x} \qquad b = \lim\,(y - a\,x)`, `Asymptote oblique y = ax + b`]
        ] }
    ];

    const PARTIES = {
        aii: { titre: 'AII : cours', court: 'Cours AII', icone: 'cpu', sujets: AII,
            intro: `Le GEMMA, la structuration du GRAFCET et l'asservissement. Ces trois chapitres n'ont encore jamais été évalués en DS cette année : tout peut tomber.` },
        aiids: { titre: 'AII : anciens DS', court: 'Anciens DS AII', icone: 'archive', sujets: AII_DS,
            intro: `Les DS d'AII d'octobre et de fin novembre 2025 et celui du 30/11/2024, résumés avec leur correction (celle du professeur quand on l'a, sinon la nôtre), puis une variante. GEMMA, grafcet de conduite, tâches synchronisées, forçage, Karnaugh et schémas-blocs reviennent chaque année : c'est un bon indice, pas une promesse.` },
        maths: { titre: 'Maths : cours', court: 'Cours maths', icone: 'sigma', sujets: MATHS,
            intro: `Géométrie de l'espace (droites et plans, barycentres, produits scalaire, vectoriel et mixte), fonctions vectorielles et fonctions de deux variables. Programme probable, d'après les DS des années précédentes à cette période : il sera confirmé.` },
        mathsds: { titre: 'Maths : anciens DS', court: 'Anciens DS maths', icone: 'archive', sujets: MATHS_DS,
            intro: `Les DS n°2 de 2022 et 2023 et le DS de fin novembre 2025, regroupés par thème, avec leur correction (la nôtre quand le professeur n'en a pas donné) et une variante.` }
    };
    const ORDRE_PARTIES = ['aii', 'aiids', 'maths', 'mathsds'];
    const FILTRES = [['tout', 'Tout'], ['aii', 'Cours AII'], ['aiids', 'Anciens DS AII'], ['maths', 'Cours maths'], ['mathsds', 'Anciens DS maths']];

    RD.enregistrer({
        id: 'ds-2026-11-aii-maths', annee: 'a2', date: new Date(2026, 10, 28), libelle: 'samedi 28 novembre 2026',
        titre: "DS d'AII puis de maths", titrePage: 'Révision DS : AII puis maths',
        resume: "Examen blanc, cours d'AII et de maths, exercices des anciens DS corrigés, formules.",
        intro: "Automatismes d'abord, maths ensuite. Les QCM se corrigent au clic (Entraînement) ou à la fin (Mode DS), les exercices montrent leur correction étape par étape. Le programme de maths sera confirmé.",
        parties: PARTIES, ordre: ORDRE_PARTIES, filtres: FILTRES,
        onglets: { aii: 'AII : cours', aiids: 'AII : anciens DS', maths: 'Maths : cours', mathsds: 'Maths : anciens DS' },
        chap: { aii: 'gemma', aiids: 'peinture', maths: 'droites', mathsds: 'espace' },
        matiere: (part) => (part.startsWith('aii') ? 'aii' : 'maths'),
        formules: FORMULES, dsBlancs: []
    });
})();
