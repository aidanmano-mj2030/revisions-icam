/*
 * Studicam : onglet « Révision DS » de l'A2 (DS du samedi 14 novembre 2026, CE puis OI).
 *
 * Chargé par index.html avant progression.js. Affiche l'étape #etape-revision-ds :
 *   Examen blanc (QCM mélangés, filtrables) · CE · OI exposés · OI cours · Formules · DS blanc.
 * L'entrée est la carte #carte-revision-ds de l'étape « Choisis un domaine », visible en A2.
 *
 * Contenu :
 *   - Exposés de veille technologique : les QCM écrits par chaque groupe pour la classe
 *     (attribués au sujet de l'exposé, sans nom d'élève).
 *   - Cours d'OI et CE : notions et QCM écrits par nous ; les exercices reprennent le type
 *     des TD et DS mais avec d'autres données, recalculées et vérifiées par script.
 *   - Variateur hors programme du DS de CE : volontairement absent.
 *
 * Progression (via window.studicamResultat de progression.js) :
 *   a2/ds/ds-2026-11/<chapitre>          tous les QCM du chapitre répondus ; réussi si tous justes
 *   a2/ds/ds-2026-11/examen-<filtre>     examen blanc terminé ; score = % de bonnes réponses
 * Les exercices de calcul ne sont pas comptés (on lit la correction, on ne saisit rien).
 */
(function () {
    'use strict';

    const DS = { id: 'ds-2026-11', date: new Date(2026, 10, 14), libelle: 'samedi 14 novembre 2026' };
    const R = String.raw;

    // ---------- petits blocs HTML (mêmes classes que les leçons du site) ----------
    const P = (t) => `<p class="text-slate-300 text-sm leading-relaxed">${t}</p>`;
    const UL = (items) => `<ul class="list-disc pl-5 space-y-1.5 text-slate-300 text-sm leading-relaxed">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    const OL = (items) => `<ol class="list-decimal pl-5 space-y-1.5 text-slate-300 text-sm leading-relaxed">${items.map(i => `<li>${i}</li>`).join('')}</ol>`;
    const NOTE = (titre, t) => `<div class="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90 leading-relaxed"><p class="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">${titre}</p>${t}</div>`;
    // formule en LaTeX + légende de tous ses symboles
    const F = (tex, legende) => `<div class="bg-slate-950/80 rounded-xl border border-slate-800 px-4 py-3 space-y-1.5"><div class="text-center text-amber-300 text-base overflow-x-auto">$$${tex}$$</div><p class="text-xs text-slate-400 leading-relaxed text-center">${legende}</p></div>`;
    const T = (entetes, lignes) => `<div class="overflow-x-auto rounded-xl border border-slate-800"><table class="w-full text-xs text-left border-collapse">`
        + `<thead><tr class="bg-slate-900/80 border-b border-slate-800">${entetes.map(e => `<th class="px-3 py-2 font-bold text-slate-300">${e}</th>`).join('')}</tr></thead>`
        + `<tbody class="divide-y divide-slate-800/80 bg-slate-950/50">${lignes.map(l => `<tr>${l.map(c => `<td class="px-3 py-2 text-slate-200 align-top">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const S = (titre, icone, ...blocs) => ({ titre, icone, contenu: blocs.join('') });

    // ==========================================
    // OI : exposés de veille technologique
    // ==========================================
    const EXPOSES = [
        {
            id: 'maintenance', code: 'MAINT', titre: 'La maintenance industrielle', sous: 'Exposé maintenance',
            sections: [
                S('Définition et enjeux', 'wrench',
                    P(`« Ensemble des actions destinées à maintenir ou à rétablir un bien dans un état lui permettant d'accomplir sa fonction » (norme NF EN 13306). Trois enjeux : <b>disponibilité</b> (une machine arrêtée ne produit plus), <b>sécurité</b> (10 à 15 % des accidents mortels du travail sont liés à la maintenance) et <b>coûts</b> (anticiper coûte moins cher que l'urgence).`)),
                S('Les stratégies', 'git-branch',
                    T(['Stratégie', 'Quand intervient-on ?', 'Limite'], [
                        ['<b>Corrective</b>', 'Après la panne. Dépannage = provisoire (palliatif), réparation = définitive (curatif)', 'Arrêt subi, urgence, risques accrus'],
                        ['<b>Préventive systématique</b>', 'À intervalle fixe : date, heures de marche, nombre de cycles', 'Pièce changée trop tôt, ou panne avant l\'échéance'],
                        ['<b>Conditionnelle</b>', 'Quand une mesure (vibration, température, usure) franchit un seuil', 'Dit « maintenant », pas « quand »'],
                        ['<b>Prédictive (prévisionnelle)</b>', 'Avant la date de panne estimée à partir de la tendance des mesures', 'Données, modèles, compétences, coût']
                    ]),
                    P(`L'exposé découpe aussi la corrective en trois : <b>catastrophe</b> (urgence, la plus risquée), <b>sélective</b> (on traite d'abord les équipements critiques) et <b>liée à la préventive</b> (anomalie vue en visite, corrigée aussitôt).`),
                    P(`<b>Type, tâche, action</b> : le type dit <i>quand</i> intervenir, la tâche <i>quoi</i> faire (contrôle des paramètres), l'action <i>comment</i> (mesurer les vibrations).`),
                    NOTE('Piège', `Conditionnelle = on agit quand le seuil est franchi. Prédictive = on estime <i>quand</i> la panne arrivera pour planifier avant. Les deux sont des maintenances préventives. Le diaporama de l'exposé définit la « prévisionnelle » par l'historique des pannes (durée de vie moyenne), alors que sa fiche et son QCM l'assimilent à la prédictive : pour le DS, retiens la version de la fiche et du QCM.`)),
                S('Indicateur et cas réel', 'gauge',
                    F(R`D = \dfrac{MTBF}{MTBF + MTTR}`, `D disponibilité (%) · MTBF temps moyen de bon fonctionnement entre deux pannes (h) · MTTR temps moyen de réparation (h). Exemple de l'exposé, un convoyeur : 190 / (190 + 10) = 95 %.`),
                    P(`<b>SNCF</b> : avant, contrôles à date fixe (monter sur le toit pour les pantographes). Aujourd'hui, capteurs et 4G/5G sur portes, climatisation, freins, batteries, intervention sur alerte. Résultat : pannes divisées par 2 sur les rames en télédiagnostic, −20 % de coûts, un train de plus à l'heure de pointe à Paris-Nord.`),
                    P(`La prédictive se justifie quand une panne coûte plus cher que la surveillance : équipement critique, risque pour la sécurité, données disponibles. Les capteurs alertent, mais c'est l'humain qui décide.`))
            ],
            qcm: [
                { q: "Sur un moteur, un capteur mesure les vibrations chaque jour. Les valeurs sont encore sous le seuil d'alerte, mais elles augmentent régulièrement. L'équipe utilise cette tendance pour estimer la date à laquelle le moteur risque de tomber en panne et planifie l'intervention avant cette date. De quel type de maintenance s'agit-il ?",
                    opts: ["Maintenance corrective", "Maintenance préventive systématique", "Maintenance conditionnelle simple (intervention dès que le seuil est franchi)", "Maintenance prédictive (prévisionnelle)"], ok: [3],
                    expl: "Pas de panne, donc pas corrective. Pas de calendrier fixe, donc pas systématique. Le seuil n'est pas franchi, donc pas conditionnelle simple. On exploite l'évolution des mesures pour estimer la date de défaillance : c'est la prédictive, que l'INRS appelle « conditionnelle et prévisionnelle ».",
                    src: "Corrigé de l'exposé" },
                { q: "Dans laquelle de ces situations la mise en place d'une maintenance prédictive (capteurs, collecte et analyse des données) est-elle la MOINS justifiée ?",
                    opts: ["Un compresseur unique dont l'arrêt bloque toute l'usine", "Un petit ventilateur d'armoire électrique, bon marché, disponible en stock et doublé par un second ventilateur", "Une machine-outil critique pour laquelle on dispose de plusieurs années de données de fonctionnement", "Une pompe dont la défaillance peut mettre en danger les opérateurs"], ok: [1],
                    expl: "La prédictive coûte cher (capteurs, logiciel, compétences). Elle se justifie si la panne est coûteuse ou dangereuse, et si des données existent. Un ventilateur bon marché, en stock et redondant : sa panne n'arrête rien, la surveillance coûterait plus que la panne.",
                    src: "Corrigé de l'exposé" }
            ]
        },
        {
            id: 'cnd', code: 'CND', titre: 'Le contrôle non destructif', sous: 'Exposé CND',
            sections: [
                S('Définition et cadre', 'scan-search',
                    P(`Ensemble de méthodes pour connaître l'état d'intégrité d'une pièce <b>sans l'altérer</b> : elle reste 100 % utilisable. But : détecter fissures, corrosion, inclusions, porosités avant la rupture, sans jeter de pièces saines. Image de l'exposé : les ultrasons sont l'échographie de l'industrie, la radiographie sa radio.`),
                    P(`Utilisé en <b>fabrication</b> (fonderie, soudures), à la <b>réception</b> (pièces stratégiques) et en <b>maintenance en service</b> (usure, fatigue, corrosion). Secteurs : aéronautique, nucléaire, ferroviaire, spatial, équipements sous pression.`)),
                S('Les méthodes', 'list',
                    T(['Famille', 'Méthode', 'Principe', 'À retenir'], [
                        ['Surface', '<b>Ressuage</b> (PT)', 'Liquide coloré ou fluorescent qui entre dans les fissures par capillarité, puis révélation', 'Défauts débouchants, tout matériau non poreux'],
                        ['Surface', '<b>Magnétoscopie</b> (MT)', 'Aimantation et particules ferromagnétiques : les fuites de flux révèlent le défaut', 'Matériaux ferromagnétiques uniquement'],
                        ['Volume', '<b>Ultrasons</b> (UT)', 'Onde haute fréquence réfléchie par les interfaces et défauts (principe du sonar)', 'Mesure d\'épaisseur, soudures épaisses'],
                        ['Volume', '<b>Radiographie</b> (RT)', 'Rayons X ou gamma, image par absorption différentielle', 'Porosités et inclusions ; protection contre les rayonnements'],
                        ['Électromagnétique', '<b>Courants de Foucault</b> (ET)', 'Courants induits, variation d\'impédance', 'Matériaux conducteurs, tubes, corrosion, très rapide']
                    ])),
                S('Normes, exemple, bilan', 'shield-check',
                    UL([
                        `<b>NF EN ISO 9712</b> : certification du <i>personnel</i>, pas des machines. Niveau 1 réalise le contrôle, niveau 2 choisit la technique, niveau 3 écrit les procédures. En France, la <b>COFREND</b> certifie. Valable 5 ans.`,
                        `<b>NF EN ISO 17025</b> : compétence des laboratoires d'essais et d'étalonnage.`,
                        `<b>Airbus A350</b> (composite) : le Line Tool, système à ultrasons à diagnostic automatique après un choc, 70 exemplaires commandés par 7 compagnies. En fabrication, Epsilon est qualifié pour la tomographie en série.`,
                        `Avantages : contrôle de 100 % de la production, détection avant la panne. Limites : opérateurs certifiés, matériel cher, chaque méthode a son domaine. Évolution : automatisation, sondes multiéléments sur manipulateur.`
                    ])),
                S('2e exposé : un cas dans le nucléaire', 'atom',
                    P(`Une pièce forgée doit être usinée. Avant l'usinage : <b>ressuage</b> pour les défauts de surface, <b>ultrasons</b> pour les défauts internes. Une anomalie non conforme est détectée. La pièce finale étant asymétrique, on <b>modifie l'usinage pour retirer la zone défectueuse</b> en copeaux, en gardant assez de matière saine et en respectant les exigences de sécurité et de qualité : pas de rebut.`),
                    UL([
                        `Autres limites : aucune méthode ne voit tout (il faut les combiner), les très petits défauts peuvent passer, le résultat dépend de l'opérateur, il faut préparer la surface et accéder à la zone, risques (radioprotection, produits chimiques).`,
                        `Évolutions : IA, drones et robots d'inspection, capteurs connectés, ultrasons avancés (Phased Array, TOFD), vers la maintenance prédictive.`
                    ]))
            ],
            qcm: [
                { q: "Quelle méthode de CND permet de détecter des fissures débouchant à la surface d'une pièce grâce à un liquide pénétrant ?",
                    opts: ["La radiographie industrielle", "Le ressuage", "La thermographie infrarouge"], ok: [1],
                    expl: "Le ressuage : le liquide pénètre par capillarité dans les fissures débouchantes puis ressort à la révélation. La radiographie est une méthode volumique.",
                    src: "Corrigé de l'exposé (3 propositions seulement)" },
                { q: "Pourquoi utilise-t-on plusieurs méthodes de contrôle non destructif dans l'industrie ?",
                    opts: ["Parce que chaque méthode permet de détecter tous les types de défauts", "Pour accélérer la fabrication des pièces en supprimant les contrôles", "Parce que chaque méthode est adaptée à certains matériaux et types de défauts"], ok: [2],
                    expl: "Aucune méthode ne voit tout : la magnétoscopie ne marche que sur les ferromagnétiques, le ressuage ne voit que la surface, les ultrasons et la radiographie voient le volume. On choisit selon le matériau et le défaut cherché.",
                    src: "Corrigé de l'exposé" },                { q: "Dans l'exemple du nucléaire, que font les professionnels lorsqu'une anomalie non conforme est détectée sur la pièce forgée ?",
                    opts: ["Ils jettent immédiatement la pièce", "Ils livrent la pièce telle quelle au client", "Ils réparent le défaut par soudure", "Ils modifient l'usinage pour retirer la zone défectueuse tout en gardant assez de matière saine"], ok: [3],
                    expl: "La pièce finale est asymétrique : on décale l'usinage pour que le défaut parte en copeaux, en respectant les exigences de sécurité et de qualité. Le CND évite ainsi le rebut et le gaspillage de matière.",
                    src: "Corrigé de l'exposé, 2e groupe" }
            ]
        },
        {
            id: 'jobshop', code: 'FLUX', titre: 'Job Shop vs Flow Shop', sous: 'Exposé Job Shop et Flow Shop',
            sections: [
                S("L'idée", 'route',
                    P(`L'<b>implantation</b> (la disposition des machines) fixe le chemin des pièces. Deux logiques opposées, choisies selon le <b>volume</b> et la <b>variété</b>.`),
                    T(['', 'Job Shop (atelier par fonction)', 'Flow Shop (ligne)'], [
                        ['<b>Principe</b>', 'Machines regroupées par métier', 'Machines dans l\'ordre de la gamme'],
                        ['<b>Chemin</b>', 'Propre à chaque produit', 'Le même pour tous'],
                        ['<b>Pour</b>', 'Petites séries très variées', 'Grandes séries standard'],
                        ['<b>+</b>', 'Flexible, investissement progressif', 'Délais et en-cours réduits, coût unitaire bas'],
                        ['<b>−</b>', 'En-cours et délais élevés, ordonnancement complexe', 'Peu adaptable, investissement élevé, une panne arrête le flux'],
                        ['<b>Exemples</b>', 'Usinage à la commande, prototypes, maintenance', 'Automobile, électroménager, embouteillage']
                    ]),
                    NOTE('Piège', `Le <b>poste fixe</b>, où le produit reste immobile et les ouvriers viennent à lui, est une troisième organisation, distincte du Job Shop. C'est l'option C du QCM 1.`)),
                S('Exemple, évolution, notions', 'history',
                    UL([
                        `<b>Ford, Highland Park, 1913</b> : passage du poste fixe à la chaîne mobile, assemblage de la Model T de 12 h 30 à 93 min. Le gain vient aussi des postes spécialisés et des pièces standardisées.`,
                        `<b>Cellules de production</b> : mini-lignes pour une famille de pièces, dans l'atelier. <b>Trumpf</b> assemble des machines-outils en ligne, sur rails ou coussins d'air.`,
                        `<b>Takt</b> = temps disponible / demande, le rythme cible (480 min / 240 pièces = 2 min par pièce). <b>Goulot</b> = poste à la plus faible capacité, qui limite le débit réel.`,
                        `<b>En-cours</b> = pièces en attente entre deux opérations. Beaucoup d'usines combinent les deux (usinage par fonction, assemblage en ligne).`
                    ]))
            ],
            qcm: [
                { q: "Dans un Job Shop, les machines sont regroupées :",
                    opts: ["dans l'ordre des opérations du produit", "par fonction (tournage, fraisage, perçage…)", "autour d'un produit qui reste immobile", "selon leur date d'achat"], ok: [1],
                    expl: "Job Shop = atelier par fonction. A décrit le Flow Shop, C le poste fixe.",
                    src: "Corrigé de l'exposé" },
                { q: "Quelle situation convient le mieux à un Flow Shop ?",
                    opts: ["Des pièces uniques sur plan client", "La réparation de machines de clients différents", "La grande série d'un produit standardisé", "La réalisation de prototypes"], ok: [2],
                    expl: "Fort volume et faible variété : ligne. Les trois autres sont des cas de faible volume et forte variété, donc Job Shop.",
                    src: "Corrigé de l'exposé" }
            ]
        },
        {
            id: 'equilibrage', code: 'LIGNE', titre: "L'équilibrage de ligne", sous: 'Exposé équilibrage de ligne',
            sections: [
                S('Définition', 'scale',
                    P(`Répartir les tâches entre les postes d'une ligne pour que leurs <b>charges</b> soient proches, en respectant l'<b>ordre des tâches</b> (antériorités) et la <b>cadence demandée</b>. La ligne va à la vitesse de son poste le plus lent : un poste surchargé fait attendre les suivants et accumule des pièces devant lui.`),
                    P(`Méthode en 5 étapes : lister les tâches et leur ordre, mesurer leur durée, calculer le takt, répartir les tâches, tester en atelier et ajuster.`)),
                S('Formules', 'sigma',
                    F(R`T_k = \dfrac{\text{temps disponible}}{\text{quantité demandée}}`, `T<sub>k</sub> takt time (s par pièce) : le rythme imposé par le client · temps disponible (s) · quantité demandée (pièces)`),
                    F(R`T_C = \text{charge du poste le plus chargé} \quad\text{avec}\quad T_C \le T_k`, `T<sub>C</sub> temps de cycle (s) : ce que la ligne fait réellement · charge d'un poste = somme des temps de ses tâches (s)`),
                    F(R`N_{\min} = \left\lceil \dfrac{\sum T_i}{T_k} \right\rceil \qquad E = \dfrac{\sum T_i}{N \times T_C} \times 100 \qquad \text{Débit} = \dfrac{3600}{T_C}`, `N<sub>min</sub> nombre minimal de postes (arrondi à l'entier supérieur) · ΣT<sub>i</sub> somme des temps de toutes les tâches (s) · N nombre de postes réels · E efficacité de la ligne (%) · Débit en pièces par heure (3 600 s dans une heure)`)),
                S("Exemple de l'exposé", 'table',
                    P(`Tâches A 30 s, B 15 s, C 25 s, D 20 s, E 20 s, F 25 s, soit ΣT<sub>i</sub> = 135 s. Demande : 560 pièces en 420 min, donc T<sub>k</sub> = 25 200 / 560 = <b>45 s</b> et N<sub>min</sub> = 135 / 45 = <b>3 postes</b>.`),
                    T(['', 'Poste 1', 'Poste 2', 'Poste 3', 'Cycle', 'E', 'Débit'], [
                        ['Avant', 'A = 30 s', 'B+C+D = 60 s', 'E+F = 45 s', '60 s', '75 %', '60 p/h'],
                        ['Après', 'A+B = 45 s', 'C+D = 45 s', 'E+F = 45 s', '45 s', '100 %', '80 p/h']
                    ]),
                    P(`B peut passer au poste 1 parce que son seul prédécesseur, A, y est déjà. Capacité +33 %.`),
                    P(`<b>Cas réel</b> (Malaisie, 2012, composants automobiles) : passage d'une ligne droite à une <b>ligne en U</b>, +16,3 % d'efficacité d'équilibrage. Ce n'est pas +16,3 % de pièces produites. Le U aide car un opérateur peut couvrir plusieurs postes.`)),
                S("2e exposé : le coffret électrique", 'table',
                    P(`7 tâches, ΣT<sub>i</sub> = 210 s ; 7 h par jour (25 200 s) pour 420 coffrets, donc T<sub>k</sub> = <b>60 s</b> et N<sub>min</sub> = 210 / 60 = 3,5, soit <b>4 postes</b> (toujours arrondi au-dessus).`),
                    T(['', 'Postes', 'Cycle', 'Taux d\'équilibrage', 'Production / jour'], [
                        ['Sans méthode', '45, 70, 35, 60 s', '70 s (goulot)', '210 / (4 × 70) = 75 %', '25 200 / 70 = 360'],
                        ['Dans l\'ordre du graphe, ≤ takt', '50, 60, 40, 60 s', '60 s', '210 / (4 × 60) = 87,5 %', '420']
                    ]),
                    P(`100 % est rarement atteint : une tâche ne se coupe pas en deux. Ford 1913 : volant magnétique 20 min (un ouvrier seul) → 13 min (travail découpé en ligne) → 5 min (après réglages). Limites : ligne rigide si la demande change, opérateurs polyvalents, une panne bloque tout. Évolution : logiciels d'équilibrage (+25 % d'utilisation des équipements chez Volvo Cars), lignes multi-modèles.`))
            ],
            qcm: [
                { q: "Quel est l'objectif principal de l'équilibrage de ligne ?",
                    opts: ["Augmenter le nombre de machines dans l'usine.", "Répartir les tâches entre les postes pour équilibrer les temps de travail.", "Réduire le nombre de contrôles qualité.", "Faire travailler tous les opérateurs plus rapidement."], ok: [1],
                    expl: "On répartit les tâches pour rapprocher les charges des postes, sans forcément investir dans de nouvelles machines.",
                    src: "Corrigé de l'exposé" },
                { q: "Qu'est-ce qu'un goulot d'étranglement sur une ligne de production ?",
                    opts: ["Un poste qui réalise les tâches plus rapidement que les autres.", "Une machine qui fonctionne uniquement en automatique.", "Un poste dont le temps de travail limite la cadence de toute la ligne.", "Un espace destiné au stockage des pièces."], ok: [2],
                    expl: "Le goulot est le poste le plus chargé : il fixe le temps de cycle de toute la ligne (60 s au poste 2 dans l'exemple avant équilibrage).",
                    src: "Corrigé de l'exposé" },
                { q: "Une ligne compte 4 postes, chargés à 40 s, 55 s, 75 s et 45 s. Quel est son temps de cycle ?",
                    opts: ["40 s", "53,75 s", "75 s", "215 s"], ok: [2],
                    expl: "La ligne avance au rythme de son poste le plus lent, le goulot. 40 s est le poste le plus rapide, 53,75 s la moyenne des postes et 215 s la somme des temps.",
                    src: "Corrigé de l'exposé, 2e groupe" },
                { q: "La somme des temps des tâches vaut 250 s et le takt time est de 60 s. Combien faut-il de postes au minimum ?",
                    opts: ["4", "4,17", "5", "6"], ok: [2],
                    expl: "250 / 60 = 4,17. On ne peut pas avoir une fraction de poste, et avec 4 postes au moins un poste dépasserait le takt : on arrondit à l'entier supérieur, 5 postes.",
                    src: "Corrigé de l'exposé, 2e groupe" }
            ]
        },
        {
            id: 'sst', code: 'SST', titre: 'La SST : sauveteur secouriste du travail', sous: 'Exposé SST',
            sections: [
                S('Rôle et cadre légal', 'heart-pulse',
                    P(`Le SST est un <b>salarié formé</b> pour protéger, examiner, alerter et secourir en cas de malaise ou d'accident, en attendant les secours. Il contribue aussi à la prévention, par exemple au <b>DUERP</b> (document unique d'évaluation des risques professionnels).`),
                    UL([
                        `<b>Art. R. 4224-15 du Code du travail</b> : au moins un SST dans chaque atelier à travaux dangereux, et sur chaque chantier de 20 personnes ou plus pendant plus de 15 jours avec travaux dangereux.`,
                        `Repère usuel, <b>non réglementaire</b> : 10 à 15 % de l'effectif formé.`,
                        `Formation par des organismes habilités, ouverte à tous les salariés, sur volontariat (l'employeur peut l'imposer).`
                    ])),
                S('Formation et méthode', 'graduation-cap',
                    T(['Élément', 'Valeur'], [
                        ['Formation initiale', '14 h (2 jours de 7 h)'],
                        ['Certificat SST', '24 mois, Assurance Maladie et INRS'],
                        ['MAC (maintien et actualisation des compétences)', '7 h tous les 2 ans']
                    ]),
                    P(`<b>Les 4 objectifs</b> : 1. Protéger et prévenir d'un danger · 2. Examiner une victime · 3. Alerter (faire alerter et informer) · 4. Secourir. Jour 1 : fonction, cadre, dangers, examen. Jour 2 : gestes de secours (saignement, étouffement, malaise, traumatisme, victime qui ne répond pas) et évaluation pratique.`)),
                S('Exemple et bilan', 'info',
                    UL([
                        `<b>ICAM</b> : affiches avec photo et nom de tous les SST du site, aux points de passage (imprimantes, portes à badge).`,
                        `Avantages : 1 € investi rapporte 2,20 € en moyenne (étude ISSA 2011, estimations d'experts), baisse des cotisations AT/MP, moins d'absentéisme.`,
                        `Limites : coût initial, temps (14 h puis 7 h tous les 2 ans), DUERP à tenir à jour. Programme conforme au référentiel INRS V8.`
                    ]))
            ],
            qcm: [
                { q: "Combien de temps de formation faut-il pour être Sauveteur Secouriste du Travail ?",
                    opts: ["3 h", "7 h", "14 h", "21 h"], ok: [2],
                    expl: "14 h, en deux jours de 7 h. Le piège est 7 h : c'est la durée du MAC, le recyclage tous les 2 ans.",
                    src: "Bonne réponse non marquée par l'exposé, déduite de sa fiche (formation initiale de 14 h)" },
                { q: "Quel pourcentage de SST est recommandé en entreprise ?",
                    opts: ["4 %", "10 à 15 %", "25 %", "37 %"], ok: [1],
                    expl: "10 à 15 % de l'effectif. C'est un repère usuel, pas une obligation : la loi (R. 4224-15) impose seulement au moins un SST dans certains ateliers et chantiers.",
                    src: "Bonne réponse non marquée par l'exposé, déduite de sa fiche" }
            ]
        },
        {
            id: 'metrologie', code: 'MESURE', titre: 'La métrologie industrielle', sous: 'Exposé métrologie',
            sections: [
                S('Définition et principe', 'ruler',
                    P(`La métrologie est la science des mesures, en trois branches : <b>scientifique</b> (étalons internationaux), <b>légale</b> (réglementation) et <b>industrielle</b> (vérifier avec des instruments que les pièces respectent les spécifications). Enjeux : qualité, sécurité, coût.`),
                    UL([
                        `<b>Mesurer</b> = comparer une grandeur à une unité de même nature.`,
                        `<b>Erreur systématique</b> : toujours dans le même sens, on la <i>corrige</i> (justesse). <b>Erreur aléatoire</b> : varie à chaque mesure, on la <i>réduit en répétant</i> (fidélité).`,
                        `<b>Traçabilité</b> : LNE, puis laboratoire accrédité Cofrac, puis entreprise.`
                    ]),
                    F(R`\text{Résultat} = x \pm U \quad (k = 2)`, `x valeur mesurée · U incertitude élargie, dans l'unité de la mesure · k facteur d'élargissement (2 par défaut, environ 95 % de confiance). Aucune mesure n'est exacte. Exemple : 10,00 mm ± 0,002 mm.`),
                    NOTE('Piège', `Faire la moyenne de plusieurs mesures réduit l'erreur <i>aléatoire</i>, jamais l'erreur <i>systématique</i> : un instrument décalé reste décalé sur chaque mesure. C'est l'option fausse du QCM 1.`)),
                S('Méthodes', 'list-checks',
                    T(['Méthode', 'Outil', 'Détail'], [
                        ['Mesure directe', 'Pied à coulisse, micromètre', '0,02 mm et 0,01 mm'],
                        ['Contrôle par calibre', 'Tampon, mâchoire', 'ENTRE / N\'ENTRE PAS'],
                        ['Mesure indirecte', 'Comparateur', 'Écart à une référence'],
                        ['État de surface', 'Rugosimètre', 'Ra']
                    ]),
                    F(R`\text{résolution} \le \dfrac{\text{tolérance}}{10}`, `Règle du 1/10 : résolution = plus petit écart que l'instrument sait afficher (mm) · tolérance = intervalle de tolérance de la cote (mm). On mesure à 20 °C et on étalonne régulièrement.`)),
                S('Exemple et évolution', 'history',
                    UL([
                        `<b>GKN Driveline</b> (Suède, transmissions automobiles) : avant, chaque pièce partait en salle de mesure. Une MMT (machine à mesurer tridimensionnelle, Hexagon) installée dans la cellule contrôle une pièce en 90 s. Changer de pièce = changer le programme et les montages.`,
                        `Avantages : qualité, moins de rebuts, interchangeabilité entre sous-traitants, industrie 4.0. Limites : investissement lourd pour les PME, environnement d'atelier instable, manque de techniciens.`,
                        `Histoire : 1791, le mètre défini sur le quart du méridien ; 1795, système métrique ; 1960, création du SI.`
                    ])),
                S('2e exposé : incertitude, étalonnage, Airbus', 'crosshair',
                    UL([
                        `<b>SI</b> : 7 unités de base (m, kg, s, A, K, mol, cd), redéfinies à partir de 7 constantes depuis le 20 mai 2019.`,
                        `<b>Erreur</b> = |V<sub>mes</sub> − V<sub>ref</sub>|. <b>Incertitude</b> = dispersion des valeurs attribuables à la grandeur. <b>Étalonnage</b> = comparer l'instrument à un étalon. <b>Traçabilité</b> : SI → LNE → laboratoires COFRAC → atelier.`,
                        `<b>Répétabilité</b> : mêmes conditions. <b>Reproductibilité</b> : on change une condition (souvent l'opérateur). Étude <b>R&amp;R</b> : &lt; 10 % adéquat, &gt; 30 % inacceptable.`,
                        `Normes : ISO/IEC 17025 (laboratoires), ISO 10012 (management de la mesure), rédigées par des organismes privés indépendants (ISO, AFNOR).`,
                        `<b>Airbus</b> : laser tracker (faisceau qui suit un réflecteur, 2 angles + 1 distance). Saint-Éloi : 50 % de temps de mesure gagné ; Hambourg : 30 trackers pour l'assemblage final de l'A320. Limites : coût, formation, ligne de vue.`
                    ]),
                    NOTE('Piège', `Cote 20,00 ± 0,05 mm, mesure 20,04 ± 0,02 mm : la vraie valeur peut aller jusqu'à 20,06, hors tolérance. La conformité n'est pas garantie.`))
            ],
            qcm: [
                { q: "Le mesurage de l'opérateur du poste de fraisage avec un pied à coulisse relève récemment des mesures inhabituelles. Comment faut-il réagir ?", multi: true,
                    opts: ["Contrôler le pied à coulisse sur des cales étalons, car l'écart peut aussi venir de la méthode de mesure ou de l'environnement", "Comme l'erreur de justesse est une erreur systématique, multiplier les mesures et en calculer la moyenne pour l'éliminer", "Faire mesurer la même pièce par un second opérateur ou avec un autre instrument, afin de distinguer un défaut de l'instrument", "Si l'instrument est jugé non conforme, le signaler comme inutilisable, puis examiner les pièces mesurées depuis la dernière vérification satisfaisante"], ok: [0, 2, 3],
                    expl: "Seule B est fausse : une erreur systématique décale toutes les mesures dans le même sens, la moyenne ne la supprime pas. On la corrige par l'étalonnage. A, C et D sont la bonne démarche : vérifier l'instrument, croiser les mesures, puis traiter les pièces suspectes.",
                    src: "Corrigé non indiqué par l'exposé : réponse déduite de son cours (justesse et fidélité)" },
                { q: "Selon la règle du 1/10e, quelle est la précision minimale de l'instrument de mesure d'une cote de tolérance 0,07 ?",
                    opts: ["0,001", "0,700", "0,007", "0,010"], ok: [2],
                    expl: "0,07 / 10 = 0,007. Le piège est 0,010 : c'est plus grossier que 0,007, donc insuffisant. 0,001 conviendrait aussi mais ce n'est pas le minimum demandé.",
                    src: "Bonne réponse non marquée par l'exposé, calculée par la règle du 1/10" },
                { q: "Que signifie étalonnage ?",
                    opts: ["Comparer l'instrument à un étalon", "Calculer la dispersion des mesures", "Ajuster les instruments pour qu'ils soient parfaitement à zéro", "Je ne sais pas"], ok: [0],
                    expl: "Étalonner, c'est comparer l'instrument à un étalon, lui-même rattaché au SI par la chaîne de traçabilité (LNE, laboratoires COFRAC, atelier). La dispersion des mesures, c'est l'incertitude ; régler à zéro, c'est un ajustage.",
                    src: "Exposé métrologie, 2e groupe (bonne réponse non marquée, déduite de sa définition)" },
                { q: "Les normes sont imposées par :",
                    opts: ["Un organisme privé, externe à l'entreprise", "Un service interne à l'entreprise", "Exclusivement l'État", "Je ne sais pas"], ok: [0],
                    expl: "Les normes (ISO/IEC 17025, ISO 10012…) sont rédigées par des organismes de normalisation indépendants comme l'ISO ou l'AFNOR, ni par l'État ni par l'entreprise elle-même.",
                    src: "Exposé métrologie, 2e groupe (bonne réponse non marquée, déduite de son cours)" }
            ]
        },
        {
            id: 'smed', code: 'SMED', titre: 'La méthode SMED', sous: 'Exposé SMED',
            sections: [
                S('Définition et intérêt', 'timer',
                    P(`<b>Single Minute Exchange of Die</b> : méthode du Lean qui réduit le temps de changement de série. « Single minute » veut dire <b>un seul chiffre de minutes</b>, donc moins de 10 minutes, pas une minute. Associée à Shigeo Shingo et au système de production Toyota (paternité discutée).`),
                    P(`<b>Temps de changement</b> : de la dernière bonne pièce du lot A à la première bonne pièce du lot B, essais et réglages compris. Les clients veulent de la variété en petites quantités, donc on change plus souvent. Les deux réponses classiques, gros lots (stocks) ou experts du réglage, sont celles que le SMED dépasse.`)),
                S('Interne et externe', 'arrow-left-right',
                    T(['Opération', 'Quand', 'Exemples'], [
                        ['<b>Interne</b> (temps visible)', 'Machine arrêtée', 'Démonter et monter l\'outil, régler, pièces d\'essai'],
                        ['<b>Externe</b> (temps masqué)', 'Machine en marche', 'Apporter outillage et matières, préchauffer le moule, vérifier, ranger']
                    ]),
                    P(`<b>Idée clé</b> : convertir un maximum d'interne en externe, puis raccourcir ce qui reste.`),
                    P(`<b>Méthode en 4 étapes</b> : 1. Observer (chronométrer, filmer, diagramme spaghetti) · 2. Séparer interne et externe · 3. Convertir (préparer et préchauffer l'outil à l'avance, chariots, gabarits, standardiser) · 4. Rationaliser (fixations rapides à un seul tour ou serrage magnétique ou hydraulique, opérations en parallèle à deux opérateurs, suppression des réglages). Puis on recommence : il faut souvent plusieurs cycles.`)),
                S('Effet sur le TRS', 'gauge',
                    F(R`TRS = D \times P \times Q \qquad D = \dfrac{t_{\text{ouverture}} - t_{\text{arrêt}}}{t_{\text{ouverture}}}`, `TRS taux de rendement synthétique · D disponibilité · P performance (cadence réelle / cadence nominale) · Q qualité (bonnes pièces / pièces produites) · t<sub>ouverture</sub> temps d'ouverture du poste (min) · t<sub>arrêt</sub> temps d'arrêt (min). Le SMED améliore D (moins d'arrêt) et Q (moins de pièces d'essai).`),
                    T(['Poste de 480 min, 3 changements', 'Arrêt', 'Disponibilité', 'TRS (P 90 %, Q 98 %)'], [
                        ['Avant : 60 min par changement', '180 min', '300 / 480 = 62,5 %', '≈ 55 %'],
                        ['Après : 8 min par changement', '24 min', '456 / 480 = 95 %', '≈ 84 %']
                    ]),
                    P(`Exemple construit par l'exposé, pas des mesures réelles. C'est le calcul du QCM 2.`)),
                S('Exemples, bilan, évolution', 'history',
                    UL([
                        `<b>Toyota, presse de 1 000 t</b> : 4 h, puis 1 h 30, puis environ 3 min, sans investissement lourd (chiffres rapportés par Shingo).`,
                        `<b>Soudage automobile</b> (Cranfield, 2013) : −33 % de temps de changement en 4 mois, méthode adaptée au site. <b>Machines CNC</b> (2023) : plus de −20 %, et −88 % sur le chargement des programmes grâce à des lecteurs de codes-barres.`,
                        `Avantages : lots plus petits, moins de stocks, flexibilité, TRS en hausse, souvent peu d'investissement. Limites : gain typique d'environ 60 % (Penn State), méthode à adapter à chaque site, gains difficiles à tenir, réglages à sécuriser (INRS).`,
                        `Évolution : agir dès la conception des machines, systèmes de changement rapide, objectif <b>OTED</b> : moins de 100 secondes.`,
                        `Image à retenir : l'équipe de stand de course qui change 4 roues en quelques secondes, parce que tout est préparé, à portée de main, simplifié (un écrou par roue) et entraîné.`
                    ]))
            ],
            qcm: [
                { q: "Quel est le principe central du SMED ?",
                    opts: ["Produire de plus gros lots pour changer moins souvent", "Convertir un maximum d'opérations internes en externes, puis raccourcir le reste", "Confier le changement à un expert du réglage plus rapide", "Supprimer les opérations externes pour simplifier le changement"], ok: [1],
                    expl: "Gros lots (A) et experts du réglage (C) sont les deux réponses classiques que le SMED dépasse. On ne supprime pas les opérations externes (D) : on y fait passer un maximum de travail, machine en marche.",
                    src: "Corrigé de l'exposé" },
                { q: "Poste de 480 min, 3 changements de 60 min ramenés à 8 min après SMED : quelle est la nouvelle disponibilité ?",
                    opts: ["62,5 %", "85 %", "95 %", "98 %"], ok: [2],
                    expl: "Arrêt = 3 × 8 = 24 min. Disponibilité = (480 − 24) / 480 = 95 %. Le piège est 62,5 % : c'est la disponibilité avant SMED, (480 − 180) / 480.",
                    src: "Corrigé de l'exposé" }
            ]
        },
        {
            id: 'vsm', code: 'VSM', titre: 'Value Stream Mapping', sous: 'Exposé VSM',
            sections: [
                S('Définition et principe', 'map',
                    P(`Le VSM, ou <b>cartographie de la chaîne de valeur</b>, est un outil du Lean : on suit un produit de la matière première jusqu'au client pour voir où on perd du temps. Né chez Toyota, mis par écrit en 1998 par Mike Rother et John Shook (<i>Learning to See</i>).`),
                    UL([
                        `<b>Une carte, deux flux</b> : le <b>flux matière</b> (chemin physique du produit : étapes, stocks, transports) et le <b>flux d'information</b> (ce qui déclenche la production : commandes, planning).`,
                        `<b>Avec valeur ajoutée</b> : ce que le client paie (usiner, assembler). <b>Sans valeur ajoutée</b> : attendre, stocker, déplacer, refaire.`
                    ])),
                S('Les pictogrammes', 'shapes',
                    T(['Pictogramme', 'Signification'], [
                        ['Usine', 'Fournisseur ou client'],
                        ['Poste + cadre de données', 'Poste de travail : temps de cycle (C/T), changement de série (C/O), disponibilité (Uptime), opérateurs'],
                        ['<b>Triangle avec un « I »</b>', '<b>Stock</b> (Inventory)'],
                        ['Camion', 'Livraison'],
                        ['Flèche fine', 'Flux d\'information'],
                        ['Grosse flèche', 'Flux matière']
                    ])),
                S('Méthode, exemple, bilan', 'list-ordered',
                    UL([
                        `<b>5 étapes</b> : choisir une famille de produits, dessiner l'état actuel sur le terrain, mesurer (temps de cycle, stocks, opérateurs ; temps de travail réel comparé au délai total), imaginer l'état futur, agir avec un plan d'action.`,
                        `<b>Pilgrim Screw</b> (États-Unis, vis et boulons) : le VSM d'un boulon a montré beaucoup d'attente et des tâches en double. Après réorganisation, −40 % de délai sur une de ses gammes les plus rentables.`,
                        `Avantages : vision globale du flux, simple et visuel, travail en équipe, point de départ du Lean. Limites : « photo » à un instant donné, long à faire à la main, moins adapté à une grande variété de produits.`,
                        `<b>VSM 4.0</b> : données récupérées automatiquement (capteurs, logiciels) et simulation de l'état futur avant de toucher à l'atelier.`
                    ]))
            ],
            qcm: [
                { q: "Sur une carte VSM, que représente un triangle avec un « I » ?",
                    opts: ["Un poste de travail", "Un stock", "Une livraison par camion", "Un contrôle qualité"], ok: [1],
                    expl: "Le triangle « I » (Inventory) est le stock. Le poste est un rectangle avec son cadre de données, la livraison un camion.",
                    src: "Corrigé de l'exposé" },
                { q: "Quels sont les deux flux représentés sur une carte VSM ?",
                    opts: ["Financier et personnel", "Énergie et déchets", "Matière et information", "Clients et fournisseurs"], ok: [2],
                    expl: "Flux matière (grosse flèche) et flux d'information (flèche fine). Clients et fournisseurs sont les deux bouts de la carte, pas des flux.",
                    src: "Corrigé de l'exposé" }
            ]
        }
    ];

    // ==========================================
    // OI : cours et TD (MSP, MRP, Kanban, contrat de phase)
    // ==========================================
    const COURS_OI = [
        {
            id: 'msp', code: 'MSP', titre: 'Maîtrise statistique des procédés et loi normale', sous: 'Contrôle, risques, loi normale',
            sections: [
                S('Contrôler, oui, mais comment', 'clipboard-check',
                    P(`La <b>MSP</b> (SPC en anglais) utilise des outils statistiques pour assurer la conformité d'une <b>série</b> de pièces, pas d'une pièce isolée. Elle suit l'évolution du procédé pour corriger <b>avant</b> de produire trop de non-conformes. Préalable : vérifier que la distribution suit une loi normale.`),
                    T(['Contrôle', 'Produit de sécurité', 'Produit sans risque'], [
                        ['Destructif (essai de traction)', 'Échantillonné', 'Échantillonné'],
                        ['Non destructif (ultrasons)', '<b>100 %</b>', 'Échantillonné']
                    ]),
                    P(`Un contrôle à 100 % porte sur certaines caractéristiques choisies, vérifiées sur tous les exemplaires, pas sur toutes les caractéristiques.`),
                    UL([
                        `<b>Risque client</b> : accepter un lot non conforme (le patient malade déclaré sain).`,
                        `<b>Risque fournisseur</b> : se voir refuser un lot conforme (le patient sain déclaré malade).`
                    ])),
                S('Loi normale', 'activity',
                    F(R`X \sim \mathcal{N}(\mu\,;\,\sigma^2) \qquad W = x_{\max} - x_{\min}`, `X grandeur mesurée · µ moyenne · σ écart-type (dispersion) · σ² variance · W étendue · x<sub>max</sub>, x<sub>min</sub> valeurs extrêmes de la série`),
                    T(['Intervalle', 'Part des valeurs'], [
                        ['µ ± σ', '≈ 68 %'],
                        ['µ ± 2σ', '≈ 95 %'],
                        ['µ ± 3σ (l\'intervalle « 6σ »)', '≈ 99,7 %']
                    ]),
                    F(R`Z = \dfrac{X - \mu}{\sigma} \qquad \Pi(z) = P(Z \le z) \qquad \Pi(-z) = 1 - \Pi(z)`, `Z variable centrée réduite, Z suit N(0 ; 1) · Π(z) valeur lue dans la table de la loi normale centrée réduite · z valeur positive de la table`),
                    P(`Propriétés de la table : Π(0) = 0,5 ; P(a ≤ Z ≤ b) = Π(b) − Π(a). Inégalités larges et strictes sont équivalentes pour une loi continue.`),
                    NOTE('Piège', `Si l'énoncé donne la <b>variance</b>, σ est sa racine carrée. Variance 25 donne σ = 5, pas 25.`))
            ],
            qcm: [
                { q: "Le risque client, c'est la probabilité :",
                    opts: ["de refuser un lot conforme", "d'accepter un lot non conforme", "qu'un client annule sa commande", "de contrôler à 100 %"], ok: [1],
                    expl: "Risque client = accepter un mauvais lot. Refuser un bon lot, c'est le risque fournisseur." },
                { q: "Un axe de direction (pièce de sécurité) peut être contrôlé par courants de Foucault. Quel contrôle prévoir ?",
                    opts: ["Échantillonné", "100 %", "Aucun", "Destructif sur chaque pièce"], ok: [1],
                    expl: "Pièce de sécurité et contrôle non destructif possible : 100 %. Un contrôle destructif, lui, est forcément échantillonné." },
                { q: "Des mesures suivent une loi normale de moyenne 45,6 et d'écart-type 1,9. Entre quelles valeurs se trouvent environ 95 % d'entre elles ?",
                    opts: ["43,7 et 47,5", "41,8 et 49,4", "39,9 et 51,3", "44,65 et 46,55"], ok: [1],
                    expl: "95 % = µ ± 2σ = 45,6 ± 3,8, soit de 41,8 à 49,4. ±σ donne 68 % (43,7 à 47,5), ±3σ donne 99,7 % (39,9 à 51,3)." },
                { q: "Z suit N(0 ; 1). Que vaut P(−1,2 ≤ Z ≤ 1,8) ? (table : Π(1,2) = 0,8849 et Π(1,8) = 0,9641)",
                    opts: ["0,1151", "0,8490", "0,9641", "0,0792"], ok: [1],
                    expl: "Π(1,8) − Π(−1,2) = 0,9641 − (1 − 0,8849) = 0,9641 − 0,1151 = 0,8490. Le piège 0,0792 oublie la symétrie : Π(1,8) − Π(1,2)." },
                { calc: true, q: "Le diamètre X d'un lot suit une loi normale de moyenne 80 mm et de <b>variance</b> 25. Calculer P(71,5 ≤ X ≤ 77,5). Table : Π(0,5) = 0,6915 ; Π(1,7) = 0,9554.",
                    steps: ["Variance 25, donc σ = √25 = 5 mm.", "On centre et on réduit : z₁ = (71,5 − 80) / 5 = −1,7 et z₂ = (77,5 − 80) / 5 = −0,5.", "P = Π(−0,5) − Π(−1,7) = (1 − Π(0,5)) − (1 − Π(1,7)) = Π(1,7) − Π(0,5).", "P = 0,9554 − 0,6915 ≈ 0,264, soit environ 26,4 % des pièces."] },
                { calc: true, q: "Le temps d'un cycle X suit une loi normale de moyenne 120 s et d'écart-type 4 s. Calculer P(X ≥ 110,8). Table : Π(2,3) = 0,9893.",
                    steps: ["z = (110,8 − 120) / 4 = −2,3.", "P(X ≥ 110,8) = P(Z ≥ −2,3) = P(Z ≤ 2,3) par symétrie.", "Π(2,3) = 0,9893, donc P ≈ 0,989 : presque tous les cycles durent plus de 110,8 s."] }
            ]
        },
        {
            id: 'henry', code: 'HENRY', titre: 'Droite de Henry', sous: 'Vérifier la normalité d\'une série',
            sections: [
                S('À quoi elle sert', 'trending-up',
                    P(`Vérifier <b>graphiquement</b> qu'une série de mesures suit une loi normale, avant de mettre le procédé sous contrôle. Sur un papier <b>gausso-arithmétique</b>, les fréquences cumulées d'une loi normale s'alignent : on obtient une droite. Points sensiblement alignés : on ne rejette pas la normalité. Le jugement reste un peu subjectif.`)),
                S('La méthode', 'list-ordered',
                    F(R`k = \left\lceil \sqrt{n} \right\rceil \qquad \text{ou} \qquad k = 1 + 3{,}3 \log n`, `k nombre de classes, arrondi à l'entier supérieur · n taille de la série (nombre de mesures) · log logarithme décimal. Le sujet dit quelle formule utiliser.`),
                    OL([
                        `Nombre de classes k, puis étendue totale E = max − min.`,
                        `Étendue par classe = E / k, puis on <b>choisit</b> une valeur ronde juste au-dessus.`,
                        `Tableau : limites des classes (inférieure incluse, supérieure exclue), effectif nᵢ, pourcentage, <b>pourcentage cumulé</b>.`,
                        `On place chaque point : abscisse = <b>limite supérieure</b> de la classe, ordonnée = % cumulé. Le 0 % et le 100 % sont rejetés à l'infini : on ne les trace pas.`,
                        `On trace la droite qui passe au mieux par les points.`
                    ]),
                    F(R`\mu = x_{50\,\%} \qquad 2\sigma = x_{84{,}13\,\%} - x_{15{,}87\,\%}`, `µ moyenne : abscisse de la droite à 50 % · σ écart-type · x<sub>84,13 %</sub> et x<sub>15,87 %</sub> abscisses de la droite à ces pourcentages cumulés (µ + σ et µ − σ)`),
                    NOTE('Pièges', `Arrondir le nombre de classes à l'entier <b>supérieur</b> (√40 ≈ 6,32 donne 7). Choisir une étendue de classe plus <b>grande</b> que E / k, sinon la dernière valeur sort du tableau. Le point à 100 % ne se place pas.`))
            ],
            qcm: [
                { q: "40 mesures, formule √n : combien de classes ?",
                    opts: ["6", "7", "40", "5"], ok: [1],
                    expl: "√40 ≈ 6,32, arrondi à l'entier supérieur : 7 classes." },
                { q: "Sur la droite de Henry, où lit-on la moyenne ?",
                    opts: ["À l'abscisse du point le plus haut", "À l'abscisse où la droite coupe 50 %", "À la pente de la droite", "Au milieu de l'étendue totale"], ok: [1],
                    expl: "Pour une loi normale, moyenne = médiane, donc 50 % des valeurs cumulées." },
                { q: "Comment lit-on l'écart-type σ sur la droite de Henry ?",
                    opts: ["Abscisse à 50 % divisée par 2", "Demi-écart des abscisses entre 15,87 % et 84,13 %", "Écart entre les abscisses à 0 % et 100 %", "Pente de la droite"], ok: [1],
                    expl: "De 15,87 % à 84,13 %, on couvre µ − σ à µ + σ, soit 2σ. On divise par 2." },
                { q: "Les points tracés sur le papier gausso-arithmétique sont nettement courbés. Conclusion ?",
                    opts: ["La distribution est normale", "On rejette l'hypothèse de normalité", "Il faut ajouter des classes jusqu'à aligner les points", "Le procédé est capable"], ok: [1],
                    expl: "Une loi normale donne des points sensiblement alignés. Sinon on rejette la normalité, après avoir vérifié qu'un point aberrant n'est pas en cause." },
                { q: "Pourquoi ne trace-t-on pas le point à 100 % cumulé ?",
                    opts: ["Parce qu'il est faux", "Parce que 0 % et 100 % sont rejetés à l'infini sur ce papier", "Parce qu'il représente la moyenne", "Par convention de couleur"], ok: [1],
                    expl: "L'échelle gaussienne n'atteint jamais 0 % ni 100 % : ces points seraient à l'infini." },
                { calc: true, q: "40 diamètres mesurés, de 24,983 à 24,995 mm. Avec √n classes, déterminer le nombre de classes, l'étendue et l'intervalle de classe, puis les pourcentages cumulés sachant que les effectifs sont 1, 4, 9, 12, 9, 4, 1 (classes de 24,982 à 24,996 mm).",
                    steps: ["k = √40 ≈ 6,32, arrondi à 7 classes.", "E = 24,995 − 24,983 = 0,012 mm.", "E / k = 0,012 / 7 ≈ 0,0017 mm : on choisit 0,002 mm. Classes [24,982 ; 24,984[ … [24,994 ; 24,996[.", "Pourcentages (n = 40, donc × 2,5) : 2,5 · 10 · 22,5 · 30 · 22,5 · 10 · 2,5 %.", "Cumulés : 2,5 · 12,5 · 35 · 65 · 87,5 · 97,5 · 100 %. On trace les 6 premiers aux limites supérieures 24,984 … 24,994.", "Le calcul sur les centres de classe donne µ ≈ 24,989 mm et σ ≈ 0,0026 mm : c'est ce qu'on doit retrouver sur la droite (50 % et demi-écart 15,87 % – 84,13 %)."] },
                { calc: true, q: "25 temps de montage, de 31 s à 52 s. Avec la formule 1 + 3,3·log n, déterminer le nombre de classes et un intervalle de classe, puis les cumulés sachant que les effectifs sont 2, 5, 8, 6, 3, 1.",
                    steps: ["k = 1 + 3,3 × log 25 = 1 + 3,3 × 1,398 ≈ 5,61, arrondi à 6 classes.", "E = 52 − 31 = 21 s, donc E / k = 3,5 s. Avec 3,5 s pile, 52 tombe sur la borne supérieure exclue de la dernière classe : on prend 4 s.", "Classes [31 ; 35[ · [35 ; 39[ · [39 ; 43[ · [43 ; 47[ · [47 ; 51[ · [51 ; 55[.", "Cumulés : 8 · 28 · 60 · 84 · 96 · 100 %. On trace les 5 premiers aux abscisses 35, 39, 43, 47, 51.", "Points assez alignés : rien ne permet de rejeter la normalité. Sur les centres de classe : moyenne ≈ 42,0 s, σ ≈ 5,0 s."] }
            ]
        },
        {
            id: 'cartes', code: 'CARTES', titre: 'Causes de variation et cartes de contrôle', sous: 'Aléatoire ou assignable, lecture des cartes',
            sections: [
                S('Deux familles de causes', 'git-compare',
                    T(['', 'Cause aléatoire (commune)', 'Cause assignable (spéciale)'], [
                        ['Origine', 'Nombreuses petites causes inhérentes au procédé', 'Un événement précis, identifiable'],
                        ['Exemples', 'Petites variations de matière, de température, vibrations habituelles, jeu des glissières', 'Mauvais réglage, outil desserré ou ébréché, capteur en panne, refroidissement coupé'],
                        ['Réaction', '<b>Ne pas toucher</b> à la machine (le sur-réglage ajoute de la dispersion)', 'Chercher la cause, corriger, vérifier les pièces produites']
                    ]),
                    P(`Mise sous contrôle en 3 étapes : 1. causes assignables présentes, pas de courbe de Gauss, pièces hors tolérance · 2. causes assignables supprimées, procédé prévisible mais pas encore capable · 3. capabilité améliorée, plus de pièces hors tolérance, procédé maîtrisé.`)),
                S('Cartes de contrôle', 'line-chart',
                    P(`On prélève régulièrement un petit échantillon de pièces consécutives, on calcule sa <b>moyenne</b> x̄ et son <b>étendue</b> W = max − min, on les reporte sur deux cartes avec la moyenne des moyennes et la moyenne des étendues.`),
                    UL([
                        `<b>Carte des moyennes</b> : voit un <b>déréglage</b> ou une dérive par rapport à la cible.`,
                        `<b>Carte des étendues</b> : voit la <b>dispersion</b>. Moyenne et étendue sont indépendantes : il faut suivre les deux.`
                    ]),
                    T(['Où est le point ?', 'Lecture'], [
                        ['Entre les limites de surveillance', 'Variation habituelle (s\'il n\'y a pas d\'autre signal)'],
                        ['Entre surveillance (LSS) et contrôle (LSC)', 'Zone de vigilance : on recontrôle, on surveille'],
                        ['Au-delà d\'une limite de contrôle', 'Signal fort : procédé hors contrôle, on arrête et on cherche'],
                        ['Points successifs qui montent (ou descendent)', '<b>Dérive</b>, même sans dépasser les limites']
                    ]),
                    NOTE('Piège', `L'usure d'un outil est parfois rangée dans les causes aléatoires (usure normale, lente), mais une usure progressive qui fait <b>dériver</b> la moyenne (points qui montent) est traitée comme une cause <b>assignable</b>. Au DS, si la moyenne dérive, réponds assignable et justifie par la dérive.`))
            ],
            qcm: [
                { q: "Le programme d'un autre article est chargé par erreur sur la machine. Cause aléatoire ou assignable ?",
                    opts: ["Aléatoire", "Assignable"], ok: [1],
                    expl: "Un événement précis, identifiable et corrigible : cause assignable." },
                { q: "D'un lot de barres à l'autre, la dureté varie légèrement, toujours dans la spécification du fournisseur. Cause aléatoire ou assignable ?",
                    opts: ["Aléatoire", "Assignable"], ok: [0],
                    expl: "Une petite variation inhérente à la matière, présente en permanence : cause aléatoire." },
                { q: "Une plaquette s'ébrèche et les cotes sautent d'un coup. Cause ?",
                    opts: ["Aléatoire", "Assignable"], ok: [1],
                    expl: "Un incident identifiable qui décale la production : cause assignable, on change la plaquette et on vérifie les pièces produites depuis." },
                { q: "Que montre la carte des étendues ?",
                    opts: ["Le déréglage par rapport à la cible", "La dispersion du procédé", "Le nombre de pièces rebutées", "Le coût de la non-qualité"], ok: [1],
                    expl: "L'étendue W = max − min de l'échantillon mesure la dispersion. Le déréglage se voit sur la carte des moyennes." },
                { q: "Seules des causes aléatoires sont présentes. Faut-il régler la machine à chaque écart ?",
                    opts: ["Oui, pour rester au plus près de la cible", "Non : régler en permanence ajoute de la variation au lieu d'en enlever", "Oui, mais seulement le matin", "Non, il faut arrêter la production"], ok: [1],
                    expl: "Corriger une variation naturelle revient à suivre le hasard : on augmente la dispersion. On ne réagit qu'aux signaux statistiques." },
                { q: "Cible 25,00 mm, LSC = 25,12. Moyennes successives : 25,01 · 25,02 · 25,04 · 25,05 · 25,07 · 25,09, toutes sous la LSC. Le procédé est-il sous contrôle ?",
                    opts: ["Oui, aucun point ne dépasse la limite de contrôle", "Non, la montée continue est une dérive", "On ne peut rien dire sans la carte des étendues", "Oui, car la cible est 25,00"], ok: [1],
                    expl: "Une série de points qui évoluent dans le même sens signale une dérive, donc une cause assignable, même à l'intérieur des limites." },
                { calc: true, q: "Cible 25,00 mm, LSS = 25,08, LSC = 25,12. Les moyennes des prélèvements 1 à 6 oscillent autour de 25,00, puis valent 25,02 · 25,03 · 25,05 · 25,06 · 25,09 · 25,07 · 25,10 · 25,11 (prélèvements 7 à 14). Interpréter.",
                    steps: ["Prélèvements 1 à 6 : fluctuations autour de 25,00 sans tendance, causes aléatoires.", "Dès le prélèvement 7, la moyenne monte presque à chaque fois : on suspecte une dérive.", "Prélèvement 11 (25,09) : au-dessus de la LSS (25,08), sous la LSC (25,12). Zone de vigilance.", "Prélèvement 14 (25,11) : toujours sous la LSC, mais la tendance continue, donc le procédé n'est pas sous contrôle.", "Usure progressive de l'outil depuis le prélèvement 7 : cause assignable. On change ou on corrige l'outil, puis on vérifie les pièces depuis le début de la dérive."] }
            ]
        },
        {
            id: 'capa', code: 'CAPA', titre: 'Capabilité : Cm et Cmk', sous: 'Dispersion et centrage',
            sections: [
                S('Les deux indicateurs', 'target',
                    F(R`C_m = \dfrac{IT}{6\sigma} \qquad IT = T_s - T_i`, `C<sub>m</sub> capabilité machine · IT intervalle de tolérance (mm) · T<sub>s</sub> tolérance supérieure (mm) · T<sub>i</sub> tolérance inférieure (mm) · σ écart-type de la production (mm)`),
                    F(R`C_{mk} = \min\left( \dfrac{T_s - \bar{x}}{3\sigma}\ ;\ \dfrac{\bar{x} - T_i}{3\sigma} \right)`, `C<sub>mk</sub> capabilité avec centrage · x̄ moyenne de la production (mm) · T<sub>s</sub>, T<sub>i</sub> tolérances supérieure et inférieure (mm) · σ écart-type (mm)`),
                    UL([
                        `<b>Cm</b> ne regarde que la <b>dispersion</b> : un Cm élevé n'assure pas des pièces conformes si la production est décentrée.`,
                        `<b>Cmk</b> ajoute le <b>centrage</b> : il prend le côté le plus proche d'une tolérance.`,
                        `Cm ≥ 1,33 satisfaisant, ≥ 1,67 excellent. Cmk ≥ 1,33 satisfaisant. Cm = Cmk : production parfaitement centrée.`,
                        `<b>Cm</b> : court terme (une série, une journée, sans réglage). <b>Cp</b> : long terme (une semaine au moins, les 5M jouent), même formule.`
                    ]),
                    NOTE('Piège', `Cmk ≤ Cm toujours. Si Cm est bon et Cmk faible, la machine est assez précise mais <b>mal réglée</b> : on recentre, on ne change pas de machine.`))
            ],
            qcm: [
                { q: "Cm = 1,8 et Cmk = 0,9. Que faut-il faire ?",
                    opts: ["Changer de machine, elle disperse trop", "Recentrer le réglage : la dispersion est bonne mais la production est décentrée", "Rien, Cm suffit", "Élargir la tolérance"], ok: [1],
                    expl: "Cm élevé : dispersion faible. Cmk faible : moyenne trop près d'une tolérance. On règle." },
                { q: "Que mesure le Cm ?",
                    opts: ["Le centrage de la production", "L'aptitude de la machine à produire de façon précise et répétable (dispersion)", "Le nombre de pièces hors tolérance", "La durée de vie de l'outil"], ok: [1],
                    expl: "Cm = IT / 6σ compare la tolérance à la dispersion, sans tenir compte du centrage." },
                { q: "À partir de quelle valeur un Cmk est-il jugé satisfaisant ?",
                    opts: ["0,5", "1", "1,33", "3"], ok: [2],
                    expl: "Cm et Cmk ≥ 1,33 : satisfaisant. Cm ≥ 1,67 : excellent." },
                { q: "Quelle différence entre Cm et Cp ?",
                    opts: ["Cm se calcule avec 3σ, Cp avec 6σ", "Cm est court terme (une série sans réglage), Cp long terme (une semaine, les 5M)", "Cp mesure le centrage", "Aucune"], ok: [1],
                    expl: "La formule est la même. Seule la période d'observation change." },
                { calc: true, q: "Cote 20 ± 0,06 mm. La production a pour moyenne x̄ = 20,02 mm et pour écart-type σ = 0,012 mm. Calculer Cm et Cmk et conclure.",
                    steps: ["Ts = 20,06, Ti = 19,94, donc IT = 0,12 mm.", "Cm = IT / 6σ = 0,12 / (6 × 0,012) = 0,12 / 0,072 ≈ 1,67 : excellente dispersion.", "Cmk sup = (20,06 − 20,02) / (3 × 0,012) = 0,04 / 0,036 ≈ 1,11.", "Cmk inf = (20,02 − 19,94) / 0,036 = 0,08 / 0,036 ≈ 2,22.", "Cmk = min = 1,11 < 1,33 : machine capable mais décentrée vers le haut. On recentre sur 20,00."] },
                { calc: true, q: "Alésage Ø 32 ± 0,04 mm : sur 50 pièces, x̄ = 31,985 mm et σ = 0,009 mm. Calculer Cm et Cmk et conclure.",
                    steps: ["IT = 32,04 − 31,96 = 0,08 mm.", "Cm = 0,08 / (6 × 0,009) = 0,08 / 0,054 ≈ 1,48 : dispersion satisfaisante.", "Cmk sup = (32,04 − 31,985) / (3 × 0,009) = 0,055 / 0,027 ≈ 2,04 ; Cmk inf = (31,985 − 31,96) / 0,027 = 0,025 / 0,027 ≈ 0,93.", "Cmk ≈ 0,93 < 1 : la production est décalée vers la tolérance basse, des pièces sortent probablement sous 31,96. On recentre vers 32,00 avant de produire."] }
            ]
        },
        {
            id: 'mrp', code: 'MRP', titre: 'MRP : calcul des besoins', sous: 'Flux poussé, tableau semaine par semaine',
            sections: [
                S('Le principe', 'workflow',
                    P(`<b>MRP</b> (Manufacturing Resources Planning), États-Unis, années 60, puis MRP 2 et ERP. Méthode en <b>flux poussé</b> : on calcule à l'avance ce qu'il faut produire ou acheter, combien et quand, à partir des prévisions.`),
                    P(`Données nécessaires : le <b>PDP</b> (plan directeur de production, qui découle du <b>PIC</b>, plan industriel et commercial), les <b>nomenclatures</b> et gammes, les moyens de production, l'<b>état des stocks</b>, les délais et les tailles de lot.`)),
                S('Le tableau, semaine par semaine', 'table',
                    F(R`BN = BB - S_{\text{dispo}} \qquad S_{\text{fin}} = S_{\text{début}} + \text{réceptions} - BB`, `BN besoin net · BB besoin brut (PDP pour le produit fini, ordres lancés des parents pour un composant) · S<sub>dispo</sub> stock disponible · S<sub>fin</sub>, S<sub>début</sub> stock prévisionnel en fin et en début de semaine. Toutes les quantités en pièces.`),
                    OL([
                        `Besoins bruts du produit fini : le PDP.`,
                        `On consomme le stock tant qu'il suffit.`,
                        `Dès que le stock ne suffit plus, besoin net &gt; 0 : on doit recevoir au moins cette quantité, arrondie au <b>lot</b> s'il est imposé (sinon le besoin net exact).`,
                        `L'<b>ordre est lancé</b> plus tôt, du <b>délai</b> d'obtention (réception en semaine s, lancement en s − délai).`,
                        `Les ordres lancés du parent × quantité de la nomenclature = besoins bruts des composants, aux mêmes semaines.`
                    ]),
                    NOTE('Pièges', `Le besoin brut d'un composant tombe à la date de <b>lancement</b> du parent, pas à sa date de livraison. Multiplier par le coefficient de la nomenclature (4 pieds par table). Un lot imposé crée un excédent qui reste en stock la semaine suivante.`))
            ],
            qcm: [
                { q: "Le MRP fonctionne en :",
                    opts: ["flux tiré, à partir de la demande réelle", "flux poussé, à partir des prévisions", "flux continu sans stock", "flux tiré par étiquettes"], ok: [1],
                    expl: "MRP : on calcule en amont (PDP, PIC) et on pousse la production. Le Kanban, lui, est en flux tiré." },
                { q: "D'où vient le plan directeur de production (PDP) ?",
                    opts: ["Du plan industriel et commercial (PIC)", "Du tableau de Kanban", "De la nomenclature", "Du contrat de phase"], ok: [0],
                    expl: "Le PIC donne la stratégie à long terme, le PDP le décline en quantités par période." },
                { q: "Composant avec un délai d'obtention de 3 semaines, nécessaire en semaine 9. Quand lancer l'ordre ?",
                    opts: ["Semaine 12", "Semaine 9", "Semaine 6", "Semaine 3"], ok: [2],
                    expl: "On décale du délai : 9 − 3 = semaine 6." },
                { q: "Un vélo contient 2 roues. On lance 40 vélos en semaine 4. Besoin brut en roues ?",
                    opts: ["40 en semaine 4", "80 en semaine 4", "80 en semaine 5", "20 en semaine 4"], ok: [1],
                    expl: "Quantité × coefficient de nomenclature, à la date de lancement du parent : 40 × 2 = 80 en semaine 4." },
                { calc: true, q: "Table T : PDP de 120, 150, 130 et 160 tables des semaines 1 à 4, stock initial 300, délai d'obtention 1 semaine, pas de lot imposé. Une table contient 4 pieds P et 1 plateau Q. Stocks : P 500 (délai 1 semaine), Q 120 (délai 2 semaines). Calculer les ordres de T, puis ceux de P et de Q.",
                    steps: ["Stock de T en fin de semaine : 300 − 120 = 180 (S1), 180 − 150 = 30 (S2). En S3, il manque 130 − 30 = 100.", "Besoins nets de T : 100 en S3 et 160 en S4 (le stock est vide). Délai 1 semaine : ordres de 100 lancés en S2 et de 160 lancés en S3.", "Besoins bruts des composants aux dates de lancement : P = 4 × 100 = 400 en S2 et 4 × 160 = 640 en S3 ; Q = 100 en S2 et 160 en S3.", "P : 500 − 400 = 100 en fin de S2, puis besoin net 640 − 100 = 540 en S3, ordre lancé en S2 (délai 1 semaine).", "Q : 120 − 100 = 20 en fin de S2, puis besoin net 160 − 20 = 140 en S3, ordre lancé en S1 (délai 2 semaines)."] }
            ]
        },
        {
            id: 'kanban', code: 'KANBAN', titre: 'Kanban et juste-à-temps', sous: 'Flux tiré, nombre de kanbans',
            sections: [
                S('Le principe', 'tags',
                    P(`<b>Kanban</b> = « étiquette » en japonais. Toyota, fin des années 50. Méthode <b>visuelle</b> en <b>flux tiré</b> : c'est l'aval, donc la demande réelle, qui déclenche la production. Pas de kanban reçu, pas de fabrication.`),
                    UL([
                        `<b>Kanban de fabrication</b> : ordre de fabrication du poste consommateur vers le poste producteur.`,
                        `<b>Kanban de transfert</b> : en plus, si la circulation est complexe, la distance grande ou s'il y a plusieurs destinations (stocks intermédiaires).`,
                        `<b>Temps excédentaire</b> (poste qui attend) : on ne produit pas pour rien, on fait de la maintenance préventive, du 5S, de la polyvalence, de l'amélioration.`,
                        `<b>Priorité</b> : stock = étiquettes totales − étiquettes reçues au tableau. On lance le produit dont le stock est le plus bas.`
                    ]),
                    F(R`n = \left\lceil \dfrac{D \times L + G}{C} \right\rceil`, `n nombre de kanbans (arrondi au-dessus) · D demande moyenne (pièces/h) · L délai total du cycle (h) : fabrication + attente + transport · G stock de sécurité (pièces) · C capacité d'un conteneur (pièces), 1 conteneur = 1 kanban`)),
                S('MRP ou Kanban', 'git-compare',
                    T(['Critère', 'MRP', 'Kanban'], [
                        ['Origine', 'États-Unis, années 60', 'Japon, Toyota, années 50'],
                        ['Flux', 'Poussé', 'Tiré'],
                        ['Produits', 'Variés, nombreux composants', 'Peu de composants'],
                        ['Base', 'Prévisions (PDP, PIC)', 'Demande réelle'],
                        ['Condition', 'Investissement (logiciel, formation, données)', 'Production stable, opérateurs polyvalents']
                    ]),
                    P(`Le <b>JAT</b> produit le nécessaire, au bon moment, en éliminant les gaspillages (rebuts, pannes, stocks). Le kanban en est un outil. JAT sans marge d'erreur : chaîne robuste exigée. En pratique, on combine : MRP pour le moyen terme, JAT sur le terrain.`))
            ],
            qcm: [
                { q: "Que signifie « kanban » ?",
                    opts: ["Juste-à-temps", "Étiquette", "Flux tiré", "Stock zéro"], ok: [1],
                    expl: "L'étiquette porte l'information : désignation, provenance, destination." },
                { q: "Un poste n'a plus de kanban à traiter. Que doit-il faire ?",
                    opts: ["Produire quand même pour anticiper", "Maintenance préventive, 5S, polyvalence, amélioration", "Arrêter et attendre sans rien faire", "Envoyer des kanbans en amont"], ok: [1],
                    expl: "Produire sans kanban créerait des stocks inutiles, l'inverse du but recherché." },
                { q: "Tableau de kanbans : A 6 étiquettes au total dont 2 reçues, B 4 dont 4, C 5 dont 2, D 3 dont 1. Quel produit lancer en priorité ?",
                    opts: ["A", "B", "C", "D"], ok: [1],
                    expl: "Stock = total − reçues : A 4, B 0, C 3, D 2. B n'a plus de stock." },
                { q: "Quelle méthode convient à des produits très variés avec de nombreux composants et des prévisions fiables ?",
                    opts: ["Kanban", "MRP", "Aucune", "SMED"], ok: [1],
                    expl: "Le MRP calcule les besoins de nomenclatures complexes. Le kanban convient à peu de références et une demande régulière." },
                { calc: true, q: "Demande moyenne 40 pièces/h, délai total du cycle 3 h, stock de sécurité 20 pièces, conteneurs de 25 pièces. Combien de kanbans mettre en circulation ?",
                    steps: ["n = (D × L + G) / C = (40 × 3 + 20) / 25.", "n = (120 + 20) / 25 = 140 / 25 = 5,6.", "On arrondit au-dessus : 6 kanbans, ajustés ensuite selon la charge réelle."] }
            ]
        },
        {
            id: 'phase', code: 'PHASE', titre: 'Contrat de phase et conditions de coupe', sous: 'Document de l\'opérateur, Vc, N, Vf',
            sections: [
                S("Le document de l'opérateur", 'file-text',
                    P(`Le contrat de phase décrit les opérations d'<b>une phase</b> sur un poste. Il contient : numéro et désignation de la phase, pièce et matière, machine, <b>croquis de phase</b> (mise en position, cotes de fabrication, surfaces usinées en trait fort, outils, axes machine), opérations, <b>conditions de coupe</b>, outillage de fabrication et de vérification.`),
                    P(`<b>MIP</b> = mise en position (les flèches noires numérotées 1 à 6 : appuis qui suppriment les degrés de liberté). <b>MAP</b> = maintien en position (serrage). Symbole : 1 trait = surface usinée, 2 traits = brute.`)),
                S('Formules de coupe', 'sigma',
                    F(R`N = \dfrac{1000 \times V_c}{\pi \times D}`, `N fréquence de rotation (tr/min) · V<sub>c</sub> vitesse de coupe (m/min) · D diamètre (mm) : de la pièce en tournage, de l'outil en fraisage et perçage · 1000 convertit les m en mm`),
                    F(R`V_f = f_z \times Z \times N \ \text{(fraisage)} \qquad V_f = f \times N \ \text{(tournage, perçage)}`, `V<sub>f</sub> vitesse d'avance (mm/min) · f<sub>z</sub> avance par dent (mm/dent) · Z nombre de dents · f avance par tour (mm/tr) · N fréquence de rotation (tr/min)`),
                    F(R`t_c = \dfrac{L}{V_f}`, `t<sub>c</sub> temps de coupe (min) · L longueur parcourue par l'outil (mm) · V<sub>f</sub> vitesse d'avance (mm/min). C'est V<sub>f</sub>, pas V<sub>c</sub>.`),
                    P(`D'où vient N : V = ω·R avec ω = π·N / 30. Avec D en mm, V<sub>c</sub> (m/min) = π·D·N / 1000, d'où N = 1000·V<sub>c</sub> / (π·D).`),
                    UL([
                        `<b>Ébauche puis finition</b> avec un <b>second exemplaire</b> de l'outil : l'ébauche enlève beaucoup de matière et use l'outil, la finition demande un tranchant intact pour la précision et l'état de surface.`,
                        `<b>Carbure</b> : V<sub>c</sub> bien plus élevées, tient à chaud, pour la productivité et les matériaux durs, mais fragile et plus cher. <b>ARS</b> (acier rapide supérieur) : plus tenace et moins cher, pour les petits outils (forets), les montages peu rigides et les petites séries.`
                    ]))
            ],
            qcm: [
                { q: "Sur le croquis d'un contrat de phase, à quoi servent les six flèches noires numérotées posées sur la pièce ?",
                    opts: ["À indiquer les trajectoires de l'outil", "À définir la mise en position (MIP) de la pièce", "À donner les cotes de fabrication", "À indiquer le sens de rotation de la broche"], ok: [1],
                    expl: "Ce sont les normales de repérage : chaque appui supprime un degré de liberté. Le serrage est le maintien en position (MAP)." },
                { q: "Fraise Ø 63 mm, Vc = 180 m/min. Fréquence de rotation ?",
                    opts: ["2 857 tr/min", "909 tr/min", "91 tr/min", "1 819 tr/min"], ok: [1],
                    expl: "N = 1000 × 180 / (π × 63) ≈ 909 tr/min. 2 857 oublie π, 1 819 prend le rayon au lieu du diamètre." },
                { q: "Une même fraise sert à l'ébauche puis à la finition. Pourquoi en prévoir un second exemplaire pour la finition ?",
                    opts: ["Pour aller plus vite", "Parce que l'ébauche use l'outil : un tranchant neuf garantit précision et état de surface", "Parce que la finition demande un outil plus gros", "Par obligation réglementaire"], ok: [1],
                    expl: "L'outil d'ébauche a enlevé beaucoup de matière, son arête n'est plus assez nette pour la finition." },
                { q: "Avec quelle relation obtient-on la durée d'une passe d'usinage ?",
                    opts: ["L / Vc", "L / Vf", "Vf / L", "N × L"], ok: [1],
                    expl: "tc = longueur parcourue / vitesse d'avance. Vc est une vitesse de coupe à la périphérie de l'outil, pas une vitesse de déplacement." },
                { calc: true, q: "Fraise carbure Ø 20 mm, Z = 3, Vc = 160 m/min, fz = 0,08 mm/dent en ébauche et 0,05 en finition. Calculer N et Vf, puis le temps d'un contournage de 180 mm en ébauche.",
                    steps: ["N = 1000 × 160 / (π × 20) ≈ 2 546 tr/min.", "Ébauche : Vf = fz × Z × N = 0,08 × 3 × 2 546 ≈ 611 mm/min.", "Finition : Vf = 0,05 × 3 × 2 546 ≈ 382 mm/min.", "tc ébauche = 180 / 611 ≈ 0,29 min, soit environ 18 s."] }
            ]
        },
        {
            id: 'annales', code: 'ANNALES', titre: 'Annales : qualité, AMDEC, PERT, stocks, charge', sous: 'Ce que mélangent les DS d\'OI des années passées',
            sections: [
                S('Ce que disent les annales', 'history',
                    T(['DS', 'Exercices'], [
                        ['Novembre 2024', 'Contrat de phase (conditions de coupe, MIP) · MSP : droite de Henry, cartes de contrôle, Cm et Cmk'],
                        ['Octobre 2025', 'AMDEC · calcul MRP · charge de production · quantité économique (Wilson)'],
                        ['Novembre 2025', 'Centrage long et court · coût d\'obtention de la qualité · Gantt et PERT · droite de Henry']
                    ]),
                    P(`Durée 1 h 30, calculatrice autorisée, aucun document, réponses sur la feuille. Chaque DS mélange un outil qualité, un calcul de gestion de production et une question de cours.`)),
                S('Qualité', 'badge-check',
                    F(R`COQ = C_{\text{prév}} + C_{\text{éval}} + C_{NCi} + C_{NCe}`, `COQ coût d'obtention de la qualité (€) · C<sub>prév</sub> coûts de prévention (€) · C<sub>éval</sub> coûts d'évaluation ou de détection (€) · C<sub>NCi</sub>, C<sub>NCe</sub> coûts des non-conformités internes et externes (€). Prévention et évaluation sont volontaires, les non-conformités sont subies.`),
                    F(R`c_d = \dfrac{C_{NCi} + C_{NCe}}{n_{reb} + n_{ret}} \qquad \tau = \dfrac{n_{reb} + n_{ret}}{n_{prod}}`, `c<sub>d</sub> coût par pièce défectueuse (€) · n<sub>reb</sub> pièces rebutées · n<sub>ret</sub> pièces retournées par les clients · τ taux de non-conformité · n<sub>prod</sub> pièces produites`),
                    F(R`C = G \times O \times D`, `AMDEC · C criticité · G gravité · O occurrence (fréquence) · D détection : plus la défaillance est <b>difficile</b> à détecter, plus D est <b>haut</b>. On agit d'abord sur les C les plus fortes.`)),
                S('Planification, stocks et charge', 'calendar-range',
                    F(R`MT = t_{\text{tard}}^{\text{fin}} - t_{\text{tôt}}^{\text{début}} - d`, `PERT · MT marge totale d'une tâche (j) · t<sub>tard</sub><sup>fin</sup> date au plus tard de l'étape qui suit la tâche · t<sub>tôt</sub><sup>début</sup> date au plus tôt de l'étape qui la précède · d durée de la tâche (j). Date au plus tôt = MAX des arrivées, date au plus tard = MIN des départs. Chemin critique = tâches à marge nulle.`),
                    F(R`Q^* = \sqrt{\dfrac{2\,D\,C_c}{C_p}}`, `Q* quantité économique de Wilson (unités) · D consommation annuelle (unités/an) · C<sub>c</sub> coût de passation d'une commande (€) · C<sub>p</sub> coût de possession d'une unité pendant un an (€) = prix unitaire × taux de possession`),
                    F(R`C_T = \dfrac{D}{Q}\,C_c + \dfrac{Q}{2}\,C_p`, `C<sub>T</sub> coût total annuel (€) · Q quantité par commande (unités) · D/Q nombre de commandes par an · Q/2 stock moyen : c'est lui qui coûte en possession, pas Q`),
                    F(R`n_j = \dfrac{q \times T_u / e}{t_{\text{utile}}}`, `n<sub>j</sub> nombre de jours de travail (arrondi au-dessus) · q quantité à produire · T<sub>u</sub> temps unitaire (min) · e efficacité de la machine (0,80 pour 80 %) · t<sub>utile</sub> temps utile par jour (min) = temps de présence − pauses`),
                    P(`<b>Centrage long</b> : longueur de contact grande devant le diamètre, il supprime 4 degrés de liberté (2 translations et 2 rotations). <b>Centrage court</b> : longueur faible devant le diamètre, il ne supprime que 2 translations.`),
                    NOTE('Pièges', `Wilson : C<sub>p</sub> seul au dénominateur, et le stock moyen Q / 2 dans le coût de possession. COQ : les quatre coûts s'additionnent, pas seulement la prévention. Charge : 6,4 jours de calcul, donc 7 jours à prévoir.`))
            ],
            qcm: [
                { q: "AMDEC : la défaillance A a G = 7, O = 2, D = 7 ; la B a G = 6, O = 4, D = 5. Laquelle traiter en premier ?",
                    opts: ["A, car sa gravité est la plus forte", "B, car sa criticité est la plus forte (120 contre 98)", "A, car sa détection est la plus difficile", "Les deux en même temps, elles se valent"], ok: [1],
                    expl: "C = G × O × D : A = 7 × 2 × 7 = 98, B = 6 × 4 × 5 = 120. On traite d'abord la criticité la plus élevée, même si A est plus grave et plus difficile à détecter." },
                { q: "Dans le coût d'obtention de la qualité, les coûts de prévention et d'évaluation sont :",
                    opts: ["des coûts subis", "des coûts volontaires, engagés pour éviter les défauts", "des coûts de non-conformité externe", "exclus du COQ"], ok: [1],
                    expl: "Prévention et détection sont des investissements volontaires. Les non-conformités internes et externes sont subies. Les quatre forment le COQ." },
                { q: "Dans un réseau PERT, la date au plus tôt d'une étape où arrivent plusieurs tâches est :",
                    opts: ["le MIN des dates d'arrivée", "le MAX des dates d'arrivée", "la moyenne", "la date au plus tard moins la marge"], ok: [1],
                    expl: "On attend que toutes les tâches précédentes soient finies : MAX. Au plus tard, en remontant, on prend le MIN." },
                { q: "Avec la formule de Wilson, le coût de possession annuel se calcule sur :",
                    opts: ["la quantité commandée Q", "le stock moyen Q / 2", "la consommation annuelle", "le nombre de commandes"], ok: [1],
                    expl: "Le stock descend de Q à 0 entre deux livraisons : en moyenne Q / 2 unités sont stockées." },
                { q: "Un arbre est guidé dans un alésage dont la longueur de contact est grande devant le diamètre. Combien de degrés de liberté ce centrage supprime-t-il ?",
                    opts: ["4 : 2 translations et 2 rotations", "2 : 2 translations", "3 : 3 translations", "5 : tout sauf la rotation autour de l'axe"], ok: [0],
                    expl: "C'est un centrage long : il bloque 2 translations et 2 rotations. Un centrage court (contact court devant le diamètre) ne bloque que les 2 translations." },
                { calc: true, q: "8 000 pièces produites en un mois. Prévention 1 800 €, évaluation 1 200 €, non-conformités internes 2 600 €, externes 3 900 €. 320 pièces rebutées, 80 retournées. Calculer le COQ, le coût par pièce défectueuse et le taux de non-conformité, puis proposer deux actions.",
                    steps: ["COQ = 1 800 + 1 200 + 2 600 + 3 900 = 9 500 €.", "Coût par pièce défectueuse = (2 600 + 3 900) / (320 + 80) = 6 500 / 400 = 16,25 €.", "Taux de non-conformité = 400 / 8 000 = 5 %.", "Actions : renforcer la prévention (formation, AMDEC, détrompeurs) et la détection en amont (MSP, cartes de contrôle) pour arrêter les défauts avant le client, où ils coûtent le plus."] },
                { calc: true, q: "Projet : A 3 j · B 5 j après A · C 2 j après A · D 4 j après C · E 6 j après B · F 3 j après B et D · G 2 j après E et F · H 4 j après D · I 3 j après G et H. Durée du projet, chemin critique et marges totales ?",
                    steps: ["Au plus tôt : A finit à 3, B à 8, C à 5, D à 9, E à 14.", "F démarre au MAX de B (8) et D (9) : 9, finit à 12. H démarre à 9, finit à 13.", "G démarre au MAX de E (14) et F (12) : 14, finit à 16. I démarre au MAX de G (16) et H (13) : 16, finit à 19. Durée : 19 jours.", "Chemin critique : A, B, E, G, I (marges nulles).", "Marges totales : C = 7 − 3 − 2 = 2 j ; D = 11 − 5 − 4 = 2 j ; F = 14 − 9 − 3 = 2 j ; H = 16 − 9 − 4 = 3 j."] },
                { calc: true, q: "Commande de 1 500 pièces, temps unitaire 1,5 min, efficacité de la machine 80 %, journées de 8 h avec 2 pauses de 20 min. Combien de jours de travail ?",
                    steps: ["Temps théorique : 1 500 × 1,5 = 2 250 min.", "Avec l'efficacité : 2 250 / 0,80 = 2 812,5 min.", "Temps utile par jour : 8 × 60 − 2 × 20 = 440 min.", "2 812,5 / 440 ≈ 6,39 jours : il faut prévoir 7 jours de travail."] },
                { calc: true, q: "Consommation 12 000 pièces par an, 40 commandes par an aujourd'hui, coût de passation 45 € par commande, coût de possession 3 € par pièce et par an. Comparer la méthode actuelle et la quantité économique.",
                    steps: ["Actuel : Q = 12 000 / 40 = 300 pièces. Coût = 40 × 45 + (300 / 2) × 3 = 1 800 + 450 = 2 250 €.", "Wilson : Q* = √(2 × 12 000 × 45 / 3) = √360 000 = 600 pièces.", "Nombre de commandes : 12 000 / 600 = 20 par an.", "Coût : 20 × 45 + (600 / 2) × 3 = 900 + 900 = 1 800 €. À l'optimum, passation et possession sont égales.", "Gain : 2 250 − 1 800 = 450 € par an."] }
            ]
        }
    ];

    // ==========================================
    // CE : construction électrique (sans variateur)
    // ==========================================
    const CE = [
        {
            id: 'mas', code: 'MAS', titre: 'Moteur asynchrone : vitesse et glissement', sous: 'Champ tournant, N0, glissement',
            sections: [
                S('Principe', 'rotate-cw',
                    P(`Trois bobines décalées de 120° et alimentées en triphasé créent un <b>champ tournant</b> à la vitesse de synchronisme N<sub>0</sub>. Ce champ balaie les barres de la cage d'écureuil : le flux y varie, une f.é.m. est induite (Faraday-Lenz), un courant circule, la force de Laplace sur les barres crée le couple.`),
                    P(`<b>Le rotor ne peut pas atteindre N<sub>0</sub></b> : à N<sub>0</sub> il verrait un champ fixe, donc plus de variation de flux, plus de courant induit, plus de couple. Il tourne toujours un peu moins vite : c'est le glissement. Le <b>moteur synchrone</b>, lui, tourne exactement à N<sub>0</sub> (pas de glissement, cos φ ≈ 1, démarre mal seul).`)),
                S('Formules', 'sigma',
                    F(R`N_0 = \dfrac{60\,f}{p}`, `N<sub>0</sub> vitesse de synchronisme (tr/min) · f fréquence du réseau (Hz) · p nombre de <b>paires</b> de pôles`),
                    F(R`g = \dfrac{N_0 - N}{N_0}`, `g glissement (sans unité, souvent en %) · N vitesse réelle du rotor (tr/min) · N<sub>0</sub> vitesse de synchronisme (tr/min)`),
                    F(R`\Omega = \dfrac{2\pi N}{60} = \dfrac{\pi N}{30}`, `Ω vitesse angulaire (rad/s) · N vitesse de rotation (tr/min)`),
                    T(['p (paires)', 'Pôles', 'N0 à 50 Hz', 'Vitesse plaque typique'], [
                        ['1', '2', '3 000 tr/min', '≈ 2 880 à 2 910'],
                        ['2', '4', '1 500 tr/min', '≈ 1 400 à 1 460'],
                        ['3', '6', '1 000 tr/min', '≈ 950 à 970'],
                        ['4', '8', '750 tr/min', '≈ 700 à 730']
                    ]),
                    P(`Ordres de grandeur : glissement nominal de 2 à 7 %, courant de démarrage direct 6 à 7 × I<sub>N</sub>, couple de démarrage ≈ 2,5 × C<sub>N</sub>. Inconvénient majeur : la pointe de courant au démarrage ; si on la réduit, on réduit aussi beaucoup le couple de démarrage.`),
                    NOTE('Piège', `« Moteur 8 pôles » = <b>4 paires</b> de pôles. Pour trouver p sur une plaque, prends la vitesse de synchronisme juste au-dessus de la vitesse nominale : 1 455 tr/min donne N<sub>0</sub> = 1 500, donc p = 2.`))
            ],
            qcm: [
                { q: "Moteur asynchrone 8 pôles alimenté en 50 Hz : quelle est sa vitesse de synchronisme ?",
                    opts: ["3 000 tr/min", "1 500 tr/min", "750 tr/min", "375 tr/min"], ok: [2],
                    expl: "8 pôles = 4 paires, donc N0 = 60 × 50 / 4 = 750 tr/min. 375 tr/min est le piège de qui prend p = 8." },
                { q: "Une plaque indique 1 455 tr/min sur le réseau 50 Hz. Nombre de paires de pôles et glissement ?",
                    opts: ["p = 2 et g = 3 %", "p = 4 et g = 3 %", "p = 2 et g = 97 %", "p = 2 et g = 0,3 %"], ok: [0],
                    expl: "1 455 est juste sous 1 500, donc p = 2. g = (1 500 − 1 455) / 1 500 = 45 / 1 500 = 3 %." },
                { q: "Pourquoi le rotor d'un moteur asynchrone ne peut-il pas tourner à la vitesse de synchronisme ?",
                    opts: ["Les frottements mécaniques l'en empêchent", "À N0, le flux ne varie plus dans la cage : plus de f.é.m. induite, plus de courant, plus de couple", "Le champ tournant ralentit dès que le rotor accélère", "La norme impose un glissement minimal de 2 %"], ok: [1],
                    expl: "C'est le lien avec la magnétostatique : le couple vient d'un courant induit, qui n'existe que si le flux varie dans les barres, donc si le rotor glisse par rapport au champ." },
                { q: "Moteur 6 pôles, 50 Hz, qui tourne à 960 tr/min. Glissement ?",
                    opts: ["4 %", "3,3 %", "96 %", "2 %"], ok: [0],
                    expl: "6 pôles = 3 paires, N0 = 3 000 / 3 = 1 000 tr/min. g = (1 000 − 960) / 1 000 = 4 %." },
                { q: "Quel moteur tourne exactement à la vitesse de synchronisme ?",
                    opts: ["Le moteur asynchrone à cage", "Le moteur asynchrone à bagues", "Le moteur synchrone", "Aucun, tous glissent un peu"], ok: [2],
                    expl: "Le moteur synchrone n'a pas de glissement : N = N0. Il démarre mal seul et peut décrocher si la charge est trop forte." },
                { calc: true, q: "Moteur asynchrone 4 pôles, 2,2 kW, 1 425 tr/min, réseau 50 Hz. Calculer p, N0, le glissement, puis le couple utile nominal.",
                    steps: ["4 pôles = 2 paires de pôles, donc N0 = 60 × 50 / 2 = 1 500 tr/min.", "g = (N0 − N) / N0 = (1 500 − 1 425) / 1 500 = 5 %. Cohérent avec 2 à 7 %.", "Ω = π × 1 425 / 30 ≈ 149,2 rad/s.", "C = Pu / Ω = 2 200 / 149,2 ≈ 14,7 N·m."] }
            ]
        },
        {
            id: 'plaque', code: 'PLAQUE', titre: 'Plaque signalétique, couplage, puissances', sous: 'Tensions, couplage étoile ou triangle, Pa, η',
            sections: [
                S('Lire la tension et choisir le couplage', 'tag',
                    P(`« 230 V / 400 V Δ / Y » veut dire : <b>chaque enroulement supporte 230 V</b>. En triangle, un enroulement reçoit la tension entre phases U ; en étoile, il reçoit V = U / √3.`),
                    F(R`V = \dfrac{U}{\sqrt{3}}`, `V tension aux bornes d'un enroulement en étoile (V) · U tension entre phases du réseau (V). Exemple : 400 / √3 = 230 V`),
                    T(['Plaque', 'Réseau 230 V', 'Réseau 400 V', 'Étoile-triangle sur 400 V ?'], [
                        ['230 / 400 V Δ / Y', 'Triangle', '<b>Étoile</b>', 'Non : le triangle mettrait 400 V sur des enroulements prévus pour 230 V'],
                        ['400 / 690 V Δ / Y', 'Non', '<b>Triangle</b>', 'Oui : démarrage en étoile, puis triangle']
                    ]),
                    P(`<b>Démarrage étoile-triangle</b> : en étoile, chaque enroulement voit U / √3, donc courant de ligne et couple de démarrage sont <b>divisés par 3</b>. Les deux courants de la plaque (ex. 10,9 / 6,3 A) sont dans un rapport √3 : prends celui du couplage réellement utilisé.`)),
                S('Puissances', 'zap',
                    F(R`P_a = \sqrt{3}\,U\,I\cos\varphi`, `P<sub>a</sub> puissance absorbée (W) · U tension entre phases (V) · I courant de ligne (A) · cos φ facteur de puissance`),
                    F(R`\eta = \dfrac{P_u}{P_a} \qquad P_u = C\,\Omega`, `η rendement · P<sub>u</sub> puissance utile sur l'arbre (W) · P<sub>a</sub> puissance absorbée (W) · C couple utile (N·m) · Ω vitesse angulaire (rad/s)`),
                    P(`La puissance écrite sur la plaque est la puissance <b>utile</b>. On calcule P<sub>a</sub> de deux façons (√3·U·I·cos φ et P<sub>N</sub> / η) et on commente l'écart : il vient des arrondis du catalogue.`),
                    F(R`S = \sqrt{3}\,U I \qquad Q = \sqrt{3}\,U I \sin\varphi \qquad S^2 = P^2 + Q^2 \qquad P = P_1 + P_2 \qquad Q = \sqrt{3}\,(P_1 - P_2)`, `S puissance apparente (VA) · Q puissance réactive (var) · P puissance active (W) · φ déphasage entre tension simple et courant · P<sub>1</sub>, P<sub>2</sub> lectures des deux wattmètres (W)`),
                    P(`<b>Deux wattmètres</b> : P<sub>2</sub> s'annule quand cos φ = 0,5 et devient négatif en dessous. Un moteur peu chargé a un mauvais cos φ, car la puissance réactive magnétisante domine.`),
                    NOTE('Pièges', `En triphasé, jamais P = U·I. On ne multiplie pas une puissance utile par cos φ. On divise par la tension du réseau réellement utilisé (230 V ou 400 V).`))
            ],
            qcm: [
                { q: "Plaque 230 / 400 V Δ / Y. L'atelier a un réseau 400 V entre phases. Quel couplage ?",
                    opts: ["Triangle, pour avoir plus de couple", "Étoile, car chaque enroulement reçoit alors 400 / √3 = 230 V", "Triangle, car le réseau est en 400 V", "Indifférent, le moteur s'adapte"], ok: [1],
                    expl: "Chaque enroulement supporte 230 V. En étoile sur 400 V, il reçoit 400 / √3 = 230 V : c'est le bon couplage." },
                { q: "Un moteur dont la plaque indique 230 / 400 V Δ / Y peut-il démarrer en étoile-triangle sur un réseau 400 V ?",
                    opts: ["Oui, c'est fait pour", "Non, en fin de démarrage le triangle mettrait 400 V sur des enroulements prévus pour 230 V", "Oui, à condition de réduire la charge", "Non, car l'étoile-triangle n'existe qu'en monophasé"], ok: [1],
                    expl: "L'étoile-triangle demande un moteur dont le couplage de marche est le triangle sur ce réseau, donc un moteur 400 / 690 V." },
                { q: "Quelle puissance est indiquée sur la plaque signalétique d'un moteur ?",
                    opts: ["La puissance absorbée au réseau", "La puissance utile sur l'arbre", "La puissance apparente", "La puissance réactive"], ok: [1],
                    expl: "P_N est la puissance mécanique utile. La puissance absorbée se calcule : Pa = P_N / η." },
                { q: "Démarrage étoile-triangle : que deviennent le courant de ligne et le couple de démarrage par rapport au démarrage direct ?",
                    opts: ["Divisés par √3", "Divisés par 3", "Inchangés", "Courant divisé par 3, couple inchangé"], ok: [1],
                    expl: "En étoile, chaque enroulement voit U / √3 : le courant de ligne et le couple sont divisés par 3. Moins de pointe, mais moins de couple." },
                { q: "Méthode des deux wattmètres : quand la lecture P₂ s'annule-t-elle ?",
                    opts: ["Quand cos φ = 1", "Quand cos φ = 0,5", "Quand cos φ = 0", "Jamais"], ok: [1],
                    expl: "P₂ = U·I·cos(φ + 30°) = 0 quand φ + 30° = 90°, donc φ = 60° et cos φ = 0,5. En dessous, P₂ est négatif : on garde son signe." },
                { calc: true, q: "Plaque : 230 / 400 V Δ / Y · 10,9 / 6,3 A · 3 kW · cos φ 0,84 · 1 440 tr/min · 50 Hz. Réseau 400 V. Calculer la puissance absorbée, le rendement et le couple utile nominaux.",
                    steps: ["Réseau 400 V : couplage étoile, donc courant de ligne I = 6,3 A.", "Pa = √3·U·I·cos φ = √3 × 400 × 6,3 × 0,84 ≈ 3 666 W.", "η = Pu / Pa = 3 000 / 3 666 ≈ 81,8 %.", "Ω = π × 1 440 / 30 ≈ 150,8 rad/s, donc Cu = Pu / Ω = 3 000 / 150,8 ≈ 19,9 N·m."] },
                { calc: true, q: "Moteur 2,2 kW alimenté en triphasé 230 V, cos φ = 0,83, η = 86 %. Calculer le courant absorbé.",
                    steps: ["Pa = Pu / η = 2 200 / 0,86 ≈ 2 558 W.", "I = Pa / (√3·U·cos φ) = 2 558 / (√3 × 230 × 0,83) ≈ 7,74 A.", "Contrôle : on a divisé par 230 V (le réseau de l'énoncé), sans multiplier Pu par cos φ."] },
                { calc: true, q: "Moteur 5,5 kW : I_N = 10,6 A sous 400 V, cos φ = 0,84, η = 89 %. Calculer la puissance absorbée de deux manières et commenter.",
                    steps: ["Par l'électrique : Pa = √3 × 400 × 10,6 × 0,84 ≈ 6 169 W.", "Par le rendement : Pa = P_N / η = 5 500 / 0,89 ≈ 6 180 W.", "Écart d'environ 0,2 % : il vient des arrondis des valeurs du catalogue. L'écrire sur la copie rapporte."] }
            ]
        },
        {
            id: 'bilan', code: 'BILAN', titre: 'Bilan des puissances du moteur asynchrone', sous: 'De la prise au bout de l\'arbre',
            sections: [
                S('De la prise au bout de l\'arbre', 'arrow-down-wide-narrow',
                    F(R`P_{tr} = P_a - P_{js} - P_{fs}`, `P<sub>tr</sub> puissance transmise au rotor par l'entrefer (W) · P<sub>a</sub> puissance absorbée (W) · P<sub>js</sub> pertes Joule au stator (W) · P<sub>fs</sub> pertes fer au stator (W)`),
                    F(R`P_{jr} = g\,P_{tr}`, `P<sub>jr</sub> pertes Joule au rotor (W) · g glissement · P<sub>tr</sub> puissance transmise (W)`),
                    F(R`P_{em} = P_{tr} - P_{jr} = (1 - g)\,P_{tr}`, `P<sub>em</sub> puissance électromagnétique convertie en mécanique (W) · g glissement`),
                    F(R`P_u = P_{em} - p_m`, `P<sub>u</sub> puissance utile (W) · p<sub>m</sub> pertes mécaniques : frottements et ventilation (W)`),
                    F(R`C_{em} = \dfrac{P_{tr}}{\Omega_s} = \dfrac{P_{em}}{\Omega}`, `C<sub>em</sub> couple électromagnétique (N·m) · Ω<sub>s</sub> vitesse de synchronisme (rad/s) · Ω vitesse du rotor (rad/s)`),
                    P(`Le bilan doit « boucler » : en partant de P<sub>a</sub> et en retirant toutes les pertes, on retombe sur la puissance utile de la plaque. C'est le contrôle à écrire.`),
                    NOTE('Piège', `C<sub>em</sub> = P<sub>tr</sub> / <b>Ω<sub>s</sub></b> (synchronisme), ou P<sub>em</sub> / Ω (rotor). Mélanger les deux donne un couple faux. Et P<sub>jr</sub> = g·P<sub>tr</sub>, pas g·P<sub>a</sub>.`))
            ],
            qcm: [
                { q: "Les pertes Joule au rotor d'un moteur asynchrone valent :",
                    opts: ["g × Pa", "g × Ptr", "(1 − g) × Ptr", "Ptr / g"], ok: [1],
                    expl: "Pjr = g·Ptr. Le reste, (1 − g)·Ptr, est converti en puissance mécanique Pem." },
                { q: "Le couple électromagnétique se calcule par :",
                    opts: ["Cem = Pu / Ωs", "Cem = Ptr / Ω", "Cem = Ptr / Ωs", "Cem = Pa / Ωs"], ok: [2],
                    expl: "Cem = Ptr / Ωs, avec la vitesse de synchronisme. On peut aussi écrire Pem / Ω avec la vitesse du rotor : c'est le même couple." },
                { q: "Un moteur glisse de 5 % et reçoit 4 000 W dans l'entrefer. Pertes Joule rotor ?",
                    opts: ["200 W", "3 800 W", "190 W", "80 W"], ok: [0],
                    expl: "Pjr = g·Ptr = 0,05 × 4 000 = 200 W. 3 800 W est Pem." },
                { calc: true, q: "Le moteur 3 kW du chapitre PLAQUE (1 440 tr/min, N0 = 1 500 tr/min) absorbe 3 666 W. Pertes Joule stator 230 W, pertes fer stator 150 W, pertes mécaniques 155 W, pertes fer rotor négligées. Établir le bilan et calculer Cem.",
                    steps: ["g = (1 500 − 1 440) / 1 500 = 4 %.", "Ptr = Pa − Pjs − Pfs = 3 666 − 230 − 150 = 3 286 W.", "Pjr = g·Ptr = 0,04 × 3 286 ≈ 131 W, donc Pem = Ptr − Pjr ≈ 3 155 W.", "Pu = Pem − pm = 3 155 − 155 ≈ 3 000 W : le bilan boucle sur la puissance de la plaque.", "Ωs = π × 1 500 / 30 ≈ 157,1 rad/s, donc Cem = Ptr / Ωs = 3 286 / 157,1 ≈ 20,9 N·m. Contrôle : Pem / Ω = 3 155 / 150,8 ≈ 20,9 N·m."] }
            ]
        },
        {
            id: 'charge', code: 'CHARGE', titre: 'Chaîne de transmission et choix d\'un moteur', sous: 'Réducteur, convoyeur, charges, quadrants',
            sections: [
                S('Remonter de la charge vers le moteur', 'cog',
                    P(`Réseau → moteur (η<sub>m</sub>) → réducteur (i, η<sub>r</sub>) → charge. On part toujours de ce que la charge demande.`),
                    F(R`P = C\,\Omega \qquad \Omega = \dfrac{\pi N}{30}`, `P puissance (W) · C couple (N·m) · Ω vitesse angulaire (rad/s) · N vitesse (tr/min)`),
                    F(R`N_{mot} = i\,N_s \qquad C_{mot} = \dfrac{C_s}{i\,\eta_r} \qquad P_{mot} = \dfrac{P_s}{\eta_r}`, `N<sub>mot</sub>, C<sub>mot</sub>, P<sub>mot</sub> vitesse (tr/min), couple (N·m) et puissance (W) côté moteur · N<sub>s</sub>, C<sub>s</sub>, P<sub>s</sub> les mêmes en sortie du réducteur · i rapport de réduction (&gt; 1, le réducteur divise la vitesse par i) · η<sub>r</sub> rendement du réducteur`),
                    F(R`N_t = \dfrac{60\,v}{\pi D} \qquad C_t = \dfrac{F\,D}{2} \qquad P = F\,v`, `N<sub>t</sub> vitesse du tambour (tr/min) · v vitesse de la bande (m/s) · D diamètre du tambour (m) · C<sub>t</sub> couple au tambour (N·m) · F effort tangentiel sur la bande (N) · P puissance (W)`),
                    F(R`J\,\dfrac{d\Omega}{dt} = C_m - C_r`, `J moment d'inertie ramené à l'arbre (kg·m²) · dΩ/dt accélération angulaire (rad/s²) · C<sub>m</sub> couple moteur (N·m) · C<sub>r</sub> couple résistant (N·m). Régime établi : C<sub>m</sub> = C<sub>r</sub>. Démarrage possible si C<sub>d</sub> &gt; C<sub>r</sub>, avec C<sub>d</sub> couple de démarrage.`)),
                S('Les trois charges types', 'layers',
                    T(['Loi', 'Exemples', 'Ce qui dimensionne le moteur'], [
                        ['Cr = constante', 'Levage, convoyeur horizontal', 'Démarrage et vitesse'],
                        ['Cr = k·Ω²', 'Pompe centrifuge, ventilateur', 'La vitesse maximale'],
                        ['Cr = k / Ω (P constante)', 'Essoreuse, concasseur', 'Le démarrage']
                    ]),
                    P(`k est une constante propre à la charge, Ω la vitesse (rad/s).`)),
                S('Quadrants et freinage', 'compass',
                    T(['Quadrant', 'Vitesse', 'Couple', 'P = C·Ω', 'Machine'], [
                        ['1', '+', '+', '&gt; 0', 'Moteur, charge résistante'],
                        ['2', '+', '−', '&lt; 0', 'Génératrice, charge entraînante (freinage)'],
                        ['3', '−', '−', '&gt; 0', 'Moteur, sens inverse'],
                        ['4', '−', '+', '&lt; 0', 'Génératrice, sens inverse']
                    ]),
                    P(`Cinq moyens de freiner : élément mécanique, système électrique extérieur (poudre, courants de Foucault), le moteur lui-même, injection de courant continu, fonctionnement en génératrice. <b>En cas de coupure du réseau, seul le frein mécanique immobilise la charge.</b> Plus J est grand, plus l'arrêt est long.`),
                    P(`<b>Facteur de service d'un motoréducteur</b> (ex. 1,6) : le réducteur peut transmettre 1,6 fois le couple nominal du moteur, il est surdimensionné de 60 % et convient à un service dur (chocs, démarrages fréquents). Pour un moteur seul, le facteur de service est la surcharge permanente admissible (souvent 1,15).`),
                    NOTE('Piège', `Garde le rapport i tel quel (32) au lieu de l'écrire 1/32 ≈ 0,031 arrondi : on perd de la précision sur les vitesses. Et toujours Ω en rad/s dans P = C·Ω.`))
            ],
            qcm: [
                { q: "Pour une pompe centrifuge (Cr = k·Ω²), qu'est-ce qui dimensionne le moteur ?",
                    opts: ["Le démarrage", "La vitesse maximale", "L'inertie", "Le freinage"], ok: [1],
                    expl: "Le couple augmente avec Ω² : c'est en haut de la plage de vitesse que le moteur est le plus sollicité." },
                { q: "Vitesse positive et couple négatif : la machine fonctionne…",
                    opts: ["en moteur, quadrant 1", "en génératrice, quadrant 2, charge entraînante", "en moteur, quadrant 3", "en génératrice, quadrant 4"], ok: [1],
                    expl: "P = C·Ω < 0 : la machine reçoit de la puissance mécanique, elle freine une charge entraînante." },
                { q: "En cas de coupure du réseau, qu'est-ce qui assure l'immobilisation de la charge ?",
                    opts: ["L'injection de courant continu", "Le fonctionnement en génératrice", "Le frein mécanique", "L'inertie du rotor"], ok: [2],
                    expl: "Tous les freinages électriques ont besoin d'énergie. Sans réseau, seul le frein mécanique tient la charge." },
                { q: "Couple de 360 N·m au tambour, réducteur i = 32, ηr = 0,9. Couple que doit fournir le moteur ?",
                    opts: ["10,1 N·m", "11,25 N·m", "12,5 N·m", "400 N·m"], ok: [2],
                    expl: "C_mot = C_tambour / (i·ηr) = 360 / (32 × 0,9) = 12,5 N·m. Les pertes du réducteur augmentent le couple demandé au moteur : on divise par ηr, on ne multiplie pas (10,1 N·m). 11,25 N·m oublie les pertes." },
                { q: "Un moteur peut démarrer si :",
                    opts: ["son couple de démarrage est supérieur au couple résistant", "son couple nominal est supérieur au couple de démarrage", "son inertie est supérieure à celle de la charge", "sa vitesse nominale est atteinte"], ok: [0],
                    expl: "J·dΩ/dt = Cm − Cr doit être positif à vitesse nulle, donc Cd > Cr." },
                { calc: true, q: "Convoyeur : tambour D = 320 mm, réducteur i = 32 et ηr = 0,9, bande à v = 0,75 m/s, effort tangentiel F = 2 250 N. Calculer la vitesse du tambour, celle du moteur, le couple ramené au moteur et la puissance qu'il fournit. Un moteur de 2,2 kW convient-il ?",
                    steps: ["N_tambour = 60·v / (π·D) = 60 × 0,75 / (π × 0,32) ≈ 44,8 tr/min.", "N_mot = i × N_tambour = 32 × 44,8 ≈ 1 432 tr/min : un moteur 4 pôles.", "C_tambour = F·D / 2 = 2 250 × 0,16 = 360 N·m, donc C_mot = 360 / (32 × 0,9) = 12,5 N·m.", "P_mot = C_mot·Ω_mot = 12,5 × (π × 1 432 / 30) ≈ 1 875 W, ou plus vite F·v / ηr = 1 687,5 / 0,9 = 1 875 W.", "1,88 kW pour un moteur de 2,2 kW : il convient, avec un peu de marge."] },
                { calc: true, q: "Motoréducteur : moteur 2,2 kW à 1 440 tr/min, réducteur 12:1, couple nominal de sortie 152 N·m. Calculer la vitesse de sortie et le rendement du réducteur, puis interpréter un facteur de service de 1,6.",
                    steps: ["Vitesse de sortie : 1 440 / 12 = 120 tr/min.", "P_sortie = C·Ω = 152 × (π × 120 / 30) ≈ 1 910 W.", "η_réducteur = 1 910 / 2 200 ≈ 86,8 %.", "Facteur de service 1,6 : le réducteur peut transmettre 1,6 fois le couple nominal du moteur. Il est adapté à un service dur (chocs, démarrages fréquents)."] }
            ]
        },
        {
            id: 'normes', code: 'NORMES', titre: 'Environnement : IP, isolation, services', sous: 'Indices de protection, échauffement, services S1 à S10',
            sections: [
                S('Tout est thermique', 'thermometer',
                    P(`Un moteur ne meurt pas d'un manque de puissance : il meurt parce que le vernis de ses bobinages cuit. Toutes ces rubriques gèrent la chaleur.`),
                    UL([
                        `<b>IP</b>, deux chiffres : le 1er contre les corps <b>solides</b> (0 à 6), le 2e contre les <b>liquides</b> (0 à 8). IP55 : protégé contre les poussières sans dépôt nuisible et contre les jets d'eau de toutes directions. On compare au local chiffre par chiffre.`,
                        `<b>IK</b> : résistance aux chocs, IK01 à IK10 (IK10 = 20 J).`,
                        `<b>Classe d'isolation</b> A, E, B, F, H : la température que tient l'isolant des bobinages. <b>F</b> est le standard industriel : 155 °C pour l'isolant.`,
                        `Conditions normales : de −16 °C à 40 °C, altitude &lt; 1 000 m. Au-delà, on <b>déclasse</b>.`
                    ]),
                    F(R`P_{inst} = k\,P_{calc}`, `P<sub>inst</sub> puissance du moteur à installer (kW) · P<sub>calc</sub> puissance calculée pour la charge (kW) · k coefficient de déclassement : 100/95 à 45 °C, 100/90 à 50 °C, 100/85 à 55 °C. k &gt; 1 : on installe plus de puissance, jamais moins, puis on prend le standard au-dessus.`)),
                S('Services', 'clock',
                    T(['Service', 'Description'], [
                        ['<b>S1</b>', 'Continu : la machine atteint son équilibre thermique. Cas de référence'],
                        ['<b>S2</b>', 'Temporaire : marche trop courte pour l\'équilibre, puis repos jusqu\'au retour à l\'ambiante'],
                        ['<b>S3</b>', 'Intermittent périodique : cycles marche et repos, équilibre jamais atteint'],
                        ['<b>S4</b>', 'Comme S3, mais le démarrage est compté (il chauffe beaucoup)'],
                        ['S5 à S10', 'S5 freinage électrique, S6 marche à vide au lieu du repos, S7 sans repos, S8 changements de vitesse, S9 non périodique, S10 charges distinctes']
                    ]))
            ],
            qcm: [
                { q: "Dans IP55, que désignent les deux chiffres ?",
                    opts: ["Puissance et tension", "Protection contre les solides, puis contre les liquides", "Protection contre les chocs, puis contre l'humidité", "Classe d'isolation et indice de service"], ok: [1],
                    expl: "1er chiffre : corps solides et poussières. 2e chiffre : liquides. Les chocs relèvent de l'indice IK." },
                { q: "Que fixe la classe d'isolation (A, E, B, F, H) d'un moteur ?",
                    opts: ["La tension maximale du réseau", "La température que supporte l'isolant des bobinages", "La résistance aux chocs", "Le courant de démarrage"], ok: [1],
                    expl: "C'est une limite thermique. Au-delà, la durée de vie de l'isolant s'effondre. F est le standard industriel." },
                { q: "Le service S2 correspond à :",
                    opts: ["une marche continue jusqu'à l'équilibre thermique", "une marche temporaire suivie d'un repos jusqu'au retour à l'ambiante", "des cycles marche et repos sans équilibre", "une marche sans aucun repos avec freinage"], ok: [1],
                    expl: "S2 : la marche est trop courte pour atteindre l'équilibre thermique, et le repos assez long pour refroidir complètement." },
                { q: "Le calcul donne 6,8 kW, mais l'atelier est à 45 °C (k = 100/95). Quel moteur installer ? (standards : 5,5 · 7,5 · 11 kW)",
                    opts: ["5,5 kW : on reste sous le calcul", "7,16 kW calculés, donc le standard au-dessus : 7,5 kW", "6,46 kW : on multiplie par 0,95", "7,16 kW, arrondi au standard en dessous : 5,5 kW"], ok: [1],
                    expl: "P_installée = 6,8 × 100/95 ≈ 7,16 kW. On prend la puissance normalisée immédiatement supérieure, 7,5 kW. L'air chaud refroidit moins bien, donc il faut de la marge." }
            ]
        },
        {
            id: 'magneto', code: 'MAGNÉTO', titre: 'Magnétostatique', sous: 'Champs, flux, Laplace, Faraday',
            sections: [
                S('Les champs à connaître', 'magnet',
                    F(R`B = \dfrac{\mu_0\,I}{2\pi a}`, `Fil rectiligne infini · B champ magnétique (T) · µ<sub>0</sub> = 4π·10⁻⁷ H/m perméabilité du vide · I courant (A) · a distance au fil (m)`),
                    F(R`B = \dfrac{\mu_0\,I}{2R}`, `Spire circulaire, au centre · B champ (T) · µ<sub>0</sub> perméabilité du vide (H/m) · I courant (A) · R rayon de la spire (m)`),
                    F(R`B = \mu_0\,n\,I \qquad n = \dfrac{N}{\ell}`, `Solénoïde infini · B champ à l'intérieur (T) · n nombre de spires <b>par mètre</b> · N nombre total de spires · ℓ longueur de la bobine (m) · I courant (A)`),
                    F(R`\Phi = \oint\!\!\!\oint_S \vec{B}\cdot d\vec{S} = 0`, `Φ flux magnétique (Wb = T·m²) à travers une surface S fermée · dS élément de surface orienté (m²)`),
                    P(`<b>Le flux se conserve</b> : il n'existe pas de charge magnétique isolée, les lignes de champ se referment toujours. Conséquence dans un moteur : tout le flux du stator traverse l'entrefer.`)),
                S('Forces et induction', 'move',
                    F(R`\vec{F} = q\,(\vec{E} + \vec{v} \wedge \vec{B})`, `Force de Lorentz sur une charge · F force (N) · q charge (C) · E champ électrique (V/m) · v vitesse de la charge (m/s) · B champ magnétique (T)`),
                    F(R`F = I\,\ell\,B\,\sin\theta`, `Force de Laplace sur un conducteur · F force (N) · I courant (A) · ℓ longueur du conducteur dans le champ (m) · B champ (T) · θ angle entre le conducteur et B`),
                    F(R`e = -\dfrac{d\Phi}{dt}`, `Loi de Faraday-Lenz · e f.é.m. induite (V) · dΦ/dt variation du flux (Wb/s). Le signe « − » : le courant induit s'oppose à la cause qui le crée.`),
                    P(`<b>Rails de Laplace</b> : on injecte un courant, le rail avance (moteur). On pousse le rail, un courant induit apparaît et crée une force qui s'oppose au mouvement (génératrice et frein). C'est un moteur déplié à plat.`),
                    P(`<b>Unités en SI de base</b> : [B] = kg·s⁻²·A⁻¹ (tesla) et [µ<sub>0</sub>] = kg·m·s⁻²·A⁻² (H/m). Finir toujours par la phrase réponse avec l'unité en kg, m, s, A.`),
                    NOTE('Piège', `Dans B = µ<sub>0</sub>·n·I, n est en spires <b>par mètre</b>. 500 spires sur 2,5 cm donnent n = 20 000 spires/m, pas 500.`))
            ],
            qcm: [
                { q: "Bobine assimilée à un solénoïde infini : 500 spires sur 2,5 cm, I = 0,3 A. Champ à l'intérieur ?",
                    opts: ["0,188 mT", "3,77 mT", "7,54 mT", "75,4 mT"], ok: [2],
                    expl: "n = 500 / 0,025 = 20 000 spires/m. B = 4π·10⁻⁷ × 20 000 × 0,3 ≈ 7,54 mT. 0,188 mT est le piège de qui prend n = 500." },
                { q: "Expression du tesla en unités de base du SI :",
                    opts: ["kg·s⁻²·A⁻¹", "kg·m·s⁻²·A⁻²", "kg·m²·s⁻³·A⁻¹", "kg·s⁻¹·A⁻¹"], ok: [0],
                    expl: "B = F / (I·ℓ), donc [B] = N / (A·m) = kg·m·s⁻² / (A·m) = kg·s⁻²·A⁻¹. La 2e réponse est l'unité de µ0, la 3e celle du volt." },
                { q: "Rails de Laplace : on pousse le rail à la main. Que fait la force de Laplace due au courant induit ?",
                    opts: ["Elle accélère le rail", "Elle s'oppose au mouvement", "Elle est nulle", "Elle est perpendiculaire au plan des rails"], ok: [1],
                    expl: "Loi de Lenz : le courant induit s'oppose à sa cause. Le dispositif fonctionne en génératrice et freine." },
                { q: "Pourquoi le flux du champ magnétique à travers une surface fermée est-il toujours nul ?",
                    opts: ["Parce que B est toujours uniforme", "Parce qu'il n'existe pas de charge magnétique isolée : les lignes de champ se referment", "Parce que µ0 est très petit", "Parce que le courant est continu"], ok: [1],
                    expl: "Ce qui entre d'un côté ressort de l'autre. Conséquence dans un moteur : tout le flux du stator traverse l'entrefer." },
                { q: "Champ créé par un fil rectiligne infini parcouru par 10 A, à 5 cm du fil ?",
                    opts: ["40 µT", "4 µT", "126 µT", "0,4 mT"], ok: [0],
                    expl: "B = µ0·I / (2π·a) = 4π·10⁻⁷ × 10 / (2π × 0,05) = 2·10⁻⁷ × 10 / 0,05 = 4·10⁻⁵ T = 40 µT. Piège : 2πa, pas 2a (qui donne 126 µT)." },
                { calc: true, q: "Une barre de la cage d'écureuil, de longueur active ℓ = 15 cm, est parcourue par I = 120 A dans un champ radial B = 0,7 T. Calculer la force sur la barre, puis le couple de deux barres diamétralement opposées à 5 cm de l'axe, parcourues par des courants opposés.",
                    steps: ["Barre perpendiculaire à B (sin θ = 1) : F = I·ℓ·B = 120 × 0,15 × 0,7 = 12,6 N.", "Les deux forces sont opposées et de part et d'autre de l'axe, chacune à r = 0,05 m : elles tournent dans le même sens.", "C = 2 × F × r = 2 × 12,6 × 0,05 = 1,26 N·m."] },
                { calc: true, q: "À partir de la formule du solénoïde B = µ0·n·I, retrouver l'unité de µ0 en unités de base, sachant que [B] = kg·s⁻²·A⁻¹.",
                    steps: ["µ0 = B / (n·I).", "[n] = m⁻¹ (spires par mètre) et [I] = A, donc [n·I] = A·m⁻¹.", "[µ0] = kg·s⁻²·A⁻¹ / (A·m⁻¹) = kg·m·s⁻²·A⁻².", "Phrase réponse : µ0 s'exprime en kg·m·s⁻²·A⁻², soit N/A² ou H/m."] }
            ]
        },
        {
            id: 'mcc', code: 'MCC', titre: 'Moteur à courant continu à excitation indépendante', sous: 'Quatre relations, point de fonctionnement',
            sections: [
                S('Les quatre relations', 'battery-charging',
                    F(R`U = E + R_a\,I`, `U tension d'induit (V) · E force contre-électromotrice (V) · R<sub>a</sub> résistance d'induit (Ω) · I courant d'induit (A)`),
                    F(R`E = k\Phi\,\Omega \qquad C_{em} = k\Phi\,I \qquad E\,I = C_{em}\,\Omega`, `kΦ constante de la machine à flux constant, en V/(rad/s) ou N·m/A (le même nombre) · Ω vitesse angulaire (rad/s) · C<sub>em</sub> couple électromagnétique (N·m) · I courant d'induit (A)`),
                    P(`kΦ est le même dans les deux relations car la puissance se conserve : E·I = C<sub>em</sub>·Ω.`),
                    P(`<b>À vide</b> : C<sub>em</sub> = 0, donc I = 0, donc E = U : la vitesse à vide se trouve en une ligne. <b>Démarrage direct</b> : E = 0, donc I = U / R<sub>a</sub>, énorme. C'est pour ça qu'on ne démarre jamais un moteur CC directement sous pleine tension.`),
                    P(`<b>Point de fonctionnement</b> : égalité entre le couple fourni par le moteur et le couple demandé par la charge, écrits avec la même variable. Graphiquement, l'intersection des deux caractéristiques.`),
                    NOTE('Piège', `Deux constantes se ressemblent : kΦ s'utilise avec Ω en rad/s, et la constante de E = k'·N avec N en tr/min. Le lien : k' = kΦ × π / 30. Exemple : k' = 0,125 V/(tr/min) donne kΦ = 0,125 × 30 / π ≈ 1,194 V/(rad/s).`))
            ],
            qcm: [
                { q: "Moteur CC à excitation indépendante, à vide : quelle relation donne directement la vitesse ?",
                    opts: ["E = U, car I = 0", "Cem = kΦ·I", "U = Ra·I", "E = 0"], ok: [0],
                    expl: "À vide, pas de couple, donc pas de courant : U = E = kΦ·Ω. Avec E = 0,125·N et U = 220 V, N0 = 1 760 tr/min." },
                { q: "U = 220 V, Ra = 0,5 Ω. Courant au démarrage direct ?",
                    opts: ["21 A", "220 A", "440 A", "0 A"], ok: [2],
                    expl: "À l'arrêt E = 0, donc I = U / Ra = 220 / 0,5 = 440 A, contre environ 21 A en charge. D'où la résistance de démarrage ou la montée progressive de la tension." },
                { q: "Pourquoi la même constante kΦ apparaît-elle dans E = kΦ·Ω et dans Cem = kΦ·I ?",
                    opts: ["Par convention d'écriture", "Par conservation de la puissance : E·I = Cem·Ω", "Parce que Ra est négligeable", "Parce que le flux varie avec la vitesse"], ok: [1],
                    expl: "La puissance électrique convertie E·I devient la puissance mécanique Cem·Ω : les deux constantes sont forcément égales." },
                { calc: true, q: "U = 220 V, Ra = 0,5 Ω, E = 0,125·N (N en tr/min). La charge demande C = 0,015·N (N·m). Établir Cem(N), puis trouver la vitesse à vide et le point de fonctionnement.",
                    steps: ["kΦ = 0,125 × 30 / π ≈ 1,194 N·m/A.", "Cem = kΦ·I = kΦ·(U − E) / Ra = 1,194 × (220 − 0,125·N) / 0,5 ≈ 525,2 − 0,298·N.", "À vide : E = U, donc 0,125·N0 = 220, N0 = 1 760 tr/min.", "Point de fonctionnement : 525,2 − 0,298·N = 0,015·N, donc N = 525,2 / 0,313 ≈ 1 676 tr/min.", "Couple : C = 0,015 × 1 676 ≈ 25,1 N·m. Contrôle : E = 0,125 × 1 676 ≈ 209,5 V, I = (220 − 209,5) / 0,5 ≈ 21,1 A, Cem = 1,194 × 21,1 ≈ 25,1 N·m."] }
            ]
        }
    ];

    // ==========================================
    // Formules à savoir refaire
    // ==========================================
    const FORMULES = [
        { titre: 'Construction électrique', items: [
            [R`N_0 = \dfrac{60\,f}{p}`, `N<sub>0</sub> vitesse de synchronisme (tr/min) · f fréquence (Hz) · p paires de pôles`],
            [R`g = \dfrac{N_0 - N}{N_0}`, `g glissement · N vitesse du rotor (tr/min) · N<sub>0</sub> vitesse de synchronisme (tr/min)`],
            [R`\Omega = \dfrac{\pi N}{30}`, `Ω vitesse angulaire (rad/s) · N vitesse (tr/min)`],
            [R`P = C\,\Omega`, `P puissance (W) · C couple (N·m) · Ω vitesse angulaire (rad/s)`],
            [R`P_a = \sqrt{3}\,U I \cos\varphi`, `P<sub>a</sub> puissance absorbée (W) · U tension entre phases (V) · I courant de ligne (A) · cos φ facteur de puissance`],
            [R`\eta = \dfrac{P_u}{P_a}`, `η rendement · P<sub>u</sub> puissance utile sur l'arbre (W) · P<sub>a</sub> puissance absorbée au réseau (W)`],
            [R`P_{jr} = g\,P_{tr} \qquad C_{em} = \dfrac{P_{tr}}{\Omega_s}`, `P<sub>tr</sub> puissance transmise au rotor (W) · P<sub>jr</sub> pertes Joule rotor (W) · g glissement · C<sub>em</sub> couple électromagnétique (N·m) · Ω<sub>s</sub> vitesse de synchronisme (rad/s)`],
            [R`C_{mot} = \dfrac{C_s}{i\,\eta_r}`, `C<sub>mot</sub> couple moteur (N·m) · C<sub>s</sub> couple en sortie du réducteur (N·m) · i rapport de réduction (&gt; 1) · η<sub>r</sub> rendement du réducteur`],
            [R`B = \mu_0\,n\,I`, `Solénoïde infini · B champ (T) · µ<sub>0</sub> = 4π·10⁻⁷ H/m · n spires par mètre · I courant (A)`],
            [R`U = E + R_a I \qquad E = k\Phi\,\Omega \qquad C = k\Phi\,I`, `Moteur CC · U tension d'induit (V) · E f.c.é.m. (V) · R<sub>a</sub> résistance d'induit (Ω) · I courant (A) · kΦ constante (N·m/A) · Ω vitesse (rad/s) · C couple (N·m)`]
        ] },
        { titre: 'Organisation industrielle', items: [
            [R`T_k = \dfrac{\text{temps disponible}}{\text{demande}}`, `T<sub>k</sub> takt (s par pièce) : rythme imposé par le client · temps disponible (s) · demande (pièces). Exemple : 25 200 s / 560 = 45 s`],
            [R`N_{\min} = \left\lceil \dfrac{\sum T_i}{T_k} \right\rceil`, `N<sub>min</sub> nombre minimal de postes, arrondi au-dessus · ΣT<sub>i</sub> somme des temps des tâches (s) · T<sub>k</sub> takt (s)`],
            [R`E = \dfrac{\sum T_i}{N \times T_C} \times 100`, `E efficacité (%) · N nombre de postes · T<sub>C</sub> temps de cycle = charge du poste le plus chargé (s), avec T<sub>C</sub> ≤ T<sub>k</sub>`],
            [R`\text{Débit} = \dfrac{3600}{T_C}`, `Débit (pièces/h) · 3 600 secondes par heure · T<sub>C</sub> temps de cycle (s)`],
            [R`D = \dfrac{MTBF}{MTBF + MTTR}`, `D disponibilité · MTBF temps moyen entre pannes (h) · MTTR temps moyen de réparation (h)`],
            [R`TRS = D \times P \times Q`, `TRS taux de rendement synthétique · D disponibilité · P performance · Q qualité`],
            [R`\text{résolution} \le \dfrac{\text{tolérance}}{10}`, `Règle du 1/10 · résolution de l'instrument (mm) · tolérance de la cote (mm)`],
            [R`Z = \dfrac{X - \mu}{\sigma}`, `Z variable centrée réduite · X valeur · µ moyenne · σ écart-type`],
            [R`C_m = \dfrac{IT}{6\sigma} \qquad C_{mk} = \min\left(\dfrac{T_s - \bar{x}}{3\sigma}\,;\,\dfrac{\bar{x} - T_i}{3\sigma}\right)`, `IT intervalle de tolérance (mm) · σ écart-type (mm) · T<sub>s</sub>, T<sub>i</sub> tolérances supérieure et inférieure (mm) · x̄ moyenne (mm)`],
            [R`BN = BB - S_{\text{dispo}}`, `BN besoin net · BB besoin brut · S<sub>dispo</sub> stock disponible (pièces)`],
            [R`C = G \times O \times D`, `AMDEC · C criticité · G gravité · O occurrence · D détection (haut = difficile à détecter)`],
            [R`Q^* = \sqrt{\dfrac{2\,D\,C_c}{C_p}}`, `Q* quantité économique · D consommation annuelle · C<sub>c</sub> coût d'une commande (€) · C<sub>p</sub> coût de possession d'une unité par an (€)`],
            [R`n = \left\lceil \dfrac{D \times L + G}{C} \right\rceil`, `n nombre de kanbans · D demande (pièces/h) · L délai du cycle (h) · G stock de sécurité (pièces) · C pièces par conteneur`],
            [R`N = \dfrac{1000\,V_c}{\pi D} \qquad V_f = f_z\,Z\,N \qquad t_c = \dfrac{L}{V_f}`, `N rotation (tr/min) · V<sub>c</sub> vitesse de coupe (m/min) · D diamètre (mm) · V<sub>f</sub> avance (mm/min) · f<sub>z</sub> avance par dent (mm) · Z nombre de dents · t<sub>c</sub> temps de coupe (min) · L longueur usinée (mm)`]
        ] }
    ];

    // ==========================================
    // DS blancs : sujet puis corrigé masqué. Le HTML vient de revision-ds-blancs.js (généré par script) ;
    // sans ce fichier, la carte affiche « Bientôt ».
    // ==========================================
    const DSB = window.STUDICAM_DS_BLANCS || {};
    const DS_BLANCS = [
        { id: 'ce', titre: 'DS blanc de construction électrique' },
        { id: 'oi', titre: 'DS blanc d\'organisation industrielle' }
    ].map(d => Object.assign(d, { sujet: (DSB[d.id] && DSB[d.id].sujet) || null, corrige: (DSB[d.id] && DSB[d.id].corrige) || null }));

    const PARTIES = {
        ce: { titre: 'Construction électrique', court: 'CE', icone: 'zap', sujets: CE,
            intro: `Hors DS selon le professeur : le variateur (choix, rampes, chronogrammes, câblage du bornier), la loi U/f et le redresseur. Ce qui reste : le moteur asynchrone, sa plaque, le bilan des puissances, la chaîne de transmission, l'environnement, la magnétostatique et le moteur CC.` },
        expo: { titre: 'OI : exposés de veille technologique', court: 'Exposés OI', icone: 'presentation', sujets: EXPOSES,
            intro: `Une partie du DS portera sur ces exposés. Chaque groupe a écrit 2 questions de QCM pour la classe (CND, équilibrage et métrologie ont été présentés par deux groupes) : les voici avec leur corrigé et l'essentiel de l'exposé.` },
        cours: { titre: 'OI : cours et TD', court: 'Cours OI', icone: 'factory', sujets: COURS_OI,
            intro: `MSP (loi normale, droite de Henry, cartes de contrôle, Cm et Cmk), MRP, Kanban, contrat de phase, puis ce qui tombe dans les annales (qualité, AMDEC, PERT, Wilson, charge). Les exercices reprennent le type des TD et des DS avec d'autres valeurs.` }
    };
    const ORDRE_PARTIES = ['ce', 'expo', 'cours'];
    const TOUS = ORDRE_PARTIES.flatMap(p => PARTIES[p].sujets.map(s => ({ s, part: p })));
    const FILTRES = [['tout', 'Tout'], ['expo', 'Exposés OI'], ['cours', 'Cours OI'], ['ce', 'CE']];
    const LETTRES = 'ABCDEFG';

    // ---------- état ----------
    const ETAT = { onglet: 'examen', chap: { ce: 'mas', expo: 'maintenance', cours: 'msp' }, filtre: 'tout' };
    // ---------- outils ----------
    const $ = (id) => document.getElementById(id);
    function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
    function bouton(cls, html, action) { const b = el('button', cls, html); b.type = 'button'; if (action) b.addEventListener('click', action); return b; }
    function rafraichir(zone) {
        if (window.lucide) lucide.createIcons();
        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise(zone ? [zone] : undefined).catch(e => console.warn(e));
    }
    const cleChap = (id) => `a2/ds/${DS.id}/${id}`;
    const cleExamen = (f) => `a2/ds/${DS.id}/examen-${f}`;
    function lire(cle) { try { return typeof window.studicamLire === 'function' ? window.studicamLire(cle) : null; } catch (e) { return null; } }
    function enregistrer(cle, reussi, score) { try { if (typeof window.studicamResultat === 'function') window.studicamResultat(cle, reussi, score); } catch (e) { console.warn('Studicam : révision DS', e); } }
    const qcmDe = (s) => s.qcm.filter(q => !q.calc);
    function joursAvantDS() {
        const auj = new Date(); auj.setHours(0, 0, 0, 0);
        return Math.round((DS.date - auj) / 86400000);
    }
    function texteCompteARebours() {
        const j = joursAvantDS();
        if (j > 1) return `dans ${j} jours`;
        if (j === 1) return 'demain';
        if (j === 0) return "aujourd'hui";
        return 'passé';
    }

    // ---------- QCM ----------
    const CL_OPT = 'w-full flex items-start gap-3 text-left text-sm rounded-xl border px-3 py-2.5 transition-all ';
    const OPT_NEUTRE = 'bg-slate-950/50 border-slate-700 text-slate-200 hover:border-slate-500';
    const OPT_JUSTE = 'bg-emerald-500/10 border-emerald-500 text-slate-100';
    const OPT_FAUX = 'bg-red-500/10 border-red-500 text-slate-100';

    function rendreQcm(q, meta, onDone) {
        const box = el('div', 'bg-slate-950/40 border border-slate-800 border-l-4 border-l-amber-500/70 rounded-xl p-4 space-y-3');
        box.appendChild(el('p', 'text-[11px] font-bold uppercase tracking-wider text-slate-400', meta + (q.multi ? ' · plusieurs bonnes réponses' : '')));
        box.appendChild(el('p', 'text-sm font-semibold text-white leading-relaxed', q.q));
        const liste = el('div', 'grid gap-2');
        const opts = [];
        let valider = null;
        function finir(choisis) {
            const bon = q.ok.length === choisis.length && q.ok.every(i => choisis.includes(i));
            opts.forEach((b, i) => {
                b.disabled = true; b.classList.remove('hover:border-slate-500');
                const inp = b.querySelector('input'); if (inp) inp.disabled = true;
                const etat = q.ok.includes(i) ? OPT_JUSTE : choisis.includes(i) ? OPT_FAUX : 'bg-slate-950/50 border-slate-800 text-slate-400';
                b.className = CL_OPT + etat + ' cursor-default';
            });
            if (valider) valider.remove();
            const ex = el('div', 'rounded-xl border px-4 py-3 text-sm leading-relaxed space-y-1.5 ' + (bon ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'));
            ex.setAttribute('role', 'status');
            ex.appendChild(el('p', 'font-bold ' + (bon ? 'text-emerald-300' : 'text-red-300'), bon ? 'Juste.' : 'Raté. Bonne réponse : ' + q.ok.map(i => LETTRES[i]).join(', ') + '.'));
            ex.appendChild(el('p', 'text-slate-200', q.expl));
            if (q.src) ex.appendChild(el('p', 'text-xs text-slate-400', q.src));
            box.appendChild(ex);
            if (onDone) onDone(bon, ex);
            rafraichir(ex);
        }
        q.opts.forEach((t, i) => {
            let b;
            if (q.multi) {
                b = el('label', CL_OPT + OPT_NEUTRE + ' cursor-pointer', `<input type="checkbox" class="mt-1 w-4 h-4 accent-amber-400 shrink-0"><span class="font-mono font-bold text-slate-400 shrink-0">${LETTRES[i]}</span><span>${t}</span>`);
            } else {
                b = bouton(CL_OPT + OPT_NEUTRE, `<span class="font-mono font-bold text-slate-400 shrink-0">${LETTRES[i]}</span><span>${t}</span>`, () => finir([i]));
            }
            opts.push(b); liste.appendChild(b);
        });
        box.appendChild(liste);
        if (q.multi) {
            valider = bouton('px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold flex items-center gap-2 transition-all', '<i data-lucide="check-circle-2" class="w-4 h-4"></i> Valider mes réponses', () => {
                const choisis = opts.map((b, i) => b.querySelector('input').checked ? i : -1).filter(i => i >= 0);
                if (!choisis.length) { if (typeof afficherToast === 'function') afficherToast('Coche au moins une réponse.'); return; }
                finir(choisis);
            });
            box.appendChild(valider);
        }
        return box;
    }

    function rendreCalc(q, n) {
        const box = el('div', 'bg-slate-950/40 border border-slate-800 border-l-4 border-l-blue-500/70 rounded-xl p-4 space-y-3');
        box.appendChild(el('p', 'text-[11px] font-bold uppercase tracking-wider text-blue-300', 'Exercice ' + n));
        box.appendChild(el('p', 'text-sm text-slate-200 leading-relaxed', q.q));
        const sol = el('div', 'rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 leading-relaxed');
        sol.hidden = true;
        sol.innerHTML = `<p class="font-bold text-violet-200 mb-1.5">Correction</p>` + `<ol class="list-decimal pl-5 space-y-1.5">${q.steps.map(t => `<li>${t}</li>`).join('')}</ol>`;
        const b = bouton('px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-violet-300 border border-violet-500/30 text-sm font-semibold flex items-center gap-2 transition-all', '<i data-lucide="eye" class="w-4 h-4"></i> <span>Voir la correction</span>', () => {
            sol.hidden = !sol.hidden;
            b.querySelector('span').textContent = sol.hidden ? 'Voir la correction' : 'Masquer la correction';
            b.setAttribute('aria-expanded', String(!sol.hidden));
        });
        b.setAttribute('aria-expanded', 'false');
        box.appendChild(b); box.appendChild(sol);
        return box;
    }

    // ---------- en-tête, onglets ----------
    const ONGLETS = [['examen', 'Examen blanc'], ['ce', 'CE'], ['expo', 'OI : exposés'], ['cours', 'OI : cours'], ['formules', 'Formules'], ['dsblanc', 'DS blanc']];

    function pastilleHTML(faits, total, mot) {
        const fini = total > 0 && faits === total;
        const cls = fini ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : faits > 0 ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-slate-800 text-slate-400 border-slate-700';
        return `<span data-ds-pastille class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cls}">${fini ? '✓ ' : ''}${faits}/${total} ${mot}${total > 1 ? 's' : ''} réussi${faits > 1 ? 's' : ''}</span>`;
    }
    function compterChapitres() {
        const faits = TOUS.filter(({ s }) => { const p = lire(cleChap(s.id)); return p && p.reussi; }).length;
        return { faits, total: TOUS.length };
    }

    function rendreOnglets() {
        const zone = $('ds-onglets');
        zone.innerHTML = '';
        const barre = el('div', 'flex border-b border-darkborder overflow-x-auto');
        barre.setAttribute('role', 'tablist'); barre.setAttribute('aria-label', 'Parties de la révision');
        ONGLETS.forEach(([cle, lib]) => {
            const actif = ETAT.onglet === cle;
            const b = bouton(`px-4 sm:px-5 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${actif ? 'border-blue-400 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`, lib, () => afficherOnglet(cle));
            b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(actif));
            barre.appendChild(b);
        });
        zone.appendChild(barre);
    }

    function afficherOnglet(cle, idChap) {
        ETAT.onglet = cle;
        if (idChap && PARTIES[cle]) ETAT.chap[cle] = idChap;
        rendreOnglets();
        const zone = $('ds-contenu');
        zone.innerHTML = '';
        if (cle === 'examen') rendreExamen(zone);
        else if (PARTIES[cle]) rendrePartie(zone, cle);
        else if (cle === 'formules') rendreFormules(zone);
        else rendreDsBlanc(zone);
        rafraichir(zone);
    }

    // ---------- une partie (CE, exposés, cours) ----------
    function rendrePartie(zone, part) {
        const P_ = PARTIES[part];
        zone.appendChild(el('div', 'rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90 leading-relaxed', P_.intro));
        const puces = el('div', 'flex flex-wrap gap-2');
        puces.setAttribute('aria-label', 'Chapitres');
        P_.sujets.forEach(s => {
            const actif = ETAT.chap[part] === s.id;
            const p = lire(cleChap(s.id));
            const b = bouton(`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${actif ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'}`,
                (p && p.reussi ? '✓ ' : '') + s.code, () => allerChapitre(part, s.id));
            b.title = s.titre;
            if (actif) b.setAttribute('aria-current', 'true');
            puces.appendChild(b);
        });
        zone.appendChild(puces);
        const s = P_.sujets.find(x => x.id === ETAT.chap[part]) || P_.sujets[0];
        rendreChapitre(zone, part, s);
    }

    function rendreChapitre(zone, part, s) {
        const tete = el('div', 'space-y-1 pt-2');
        tete.innerHTML = `<div class="flex flex-wrap items-center gap-2"><span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950">${s.code}</span><span class="text-xs text-slate-400">${s.sous}</span><span data-ds-chap-pastille></span></div><h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">${s.titre}</h2>`;
        zone.appendChild(tete);
        majPastilleChapitre(tete, s);

        s.sections.forEach(sec => {
            zone.insertAdjacentHTML('beforeend', `<div class="bg-darkcard border border-darkborder rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">`
                + `<div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0"><i data-lucide="${sec.icone}" class="w-4 h-4"></i></div>`
                + `<h3 class="text-lg font-bold text-white">${sec.titre}</h3></div>${sec.contenu}</div>`);
        });

        // QCM du chapitre : comptés une fois tous répondus
        const qcm = qcmDe(s);
        const carteQ = el('div', 'bg-darkcard border border-darkborder rounded-2xl p-5 sm:p-6 shadow-xl space-y-4');
        const titreQ = el('div', 'flex flex-wrap items-center justify-between gap-2');
        titreQ.innerHTML = `<div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0"><i data-lucide="list-checks" class="w-4 h-4"></i></div><h3 class="text-lg font-bold text-white">${part === 'expo' ? "QCM de l'exposé" : 'QCM'}</h3></div>`;
        const score = el('span', 'text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300');
        score.setAttribute('aria-live', 'polite');
        titreQ.appendChild(score);
        carteQ.appendChild(titreQ);
        const listeQ = el('div', 'space-y-3');
        carteQ.appendChild(listeQ);
        const recommencer = bouton('px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-sm font-semibold flex items-center gap-2 transition-all', '<i data-lucide="rotate-ccw" class="w-4 h-4"></i> Recommencer les QCM', () => lancerQ());
        carteQ.appendChild(recommencer);
        zone.appendChild(carteQ);

        function lancerQ() {
            let rep = 0, justes = 0;
            score.textContent = `0 / ${qcm.length}`;
            listeQ.innerHTML = '';
            qcm.forEach((q, i) => {
                const meta = (part === 'expo' ? "QCM de l'exposé" : 'QCM') + ' · question ' + (i + 1);
                listeQ.appendChild(rendreQcm(q, meta, (bon) => {
                    rep++; if (bon) justes++;
                    score.textContent = `${justes} / ${qcm.length}` + (rep < qcm.length ? ` · ${rep} répondue${rep > 1 ? 's' : ''}` : '');
                    if (rep === qcm.length) {
                        enregistrer(cleChap(s.id), justes === qcm.length, 100 * justes / qcm.length);
                        score.textContent = `${justes} / ${qcm.length} · ` + (justes === qcm.length ? 'sans faute' : 'recommence pour viser le sans-faute');
                    }
                }));
            });
            rafraichir(listeQ);
        }
        lancerQ();

        // exercices corrigés
        const calcs = s.qcm.filter(q => q.calc);
        if (calcs.length) {
            const carteC = el('div', 'bg-darkcard border border-darkborder rounded-2xl p-5 sm:p-6 shadow-xl space-y-4');
            carteC.innerHTML = `<div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0"><i data-lucide="calculator" class="w-4 h-4"></i></div><h3 class="text-lg font-bold text-white">Exercices corrigés</h3></div>`
                + `<p class="text-xs text-slate-400">Fais le calcul sur papier, puis ouvre la correction étape par étape.</p>`;
            calcs.forEach((q, i) => carteC.appendChild(rendreCalc(q, i + 1)));
            zone.appendChild(carteC);
        }

        // chapitre suivant
        const liste = PARTIES[part].sujets, idx = liste.indexOf(s);
        const nav = el('div', 'flex flex-wrap gap-2 justify-between');
        if (idx > 0) nav.appendChild(bouton('px-4 py-2.5 rounded-xl bg-darkcard border border-darkborder hover:border-slate-500 text-slate-300 text-sm font-semibold flex items-center gap-2 transition-all', `<i data-lucide="arrow-left" class="w-4 h-4"></i> ${liste[idx - 1].code}`, () => allerChapitre(part, liste[idx - 1].id)));
        else nav.appendChild(el('span'));
        if (idx < liste.length - 1) nav.appendChild(bouton('px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-sm font-semibold flex items-center gap-2 transition-all', `Chapitre suivant : ${liste[idx + 1].code} <i data-lucide="arrow-right" class="w-4 h-4"></i>`, () => allerChapitre(part, liste[idx + 1].id)));
        zone.appendChild(nav);
    }
    function allerChapitre(part, id) {
        ETAT.chap[part] = id;
        afficherOnglet(part);
        // l'en-tête collant (barre + bandeau de session) mesure environ 100 px
        window.scrollTo({ top: Math.max(0, $('ds-onglets').getBoundingClientRect().top + window.scrollY - 110) });
    }
    function majPastilleChapitre(tete, s) {
        const z = tete.querySelector('[data-ds-chap-pastille]');
        if (!z) return;
        const p = lire(cleChap(s.id));
        z.innerHTML = p ? (p.reussi ? '<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">✓ QCM réussis</span>'
            : `<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-300 border-blue-500/30">Meilleur score ${Math.round(p.score || 0)} %</span>`) : '';
    }

    // ---------- examen blanc ----------
    function poolDe(f) {
        return TOUS.filter(({ part }) => f === 'tout' || part === f).flatMap(({ s, part }) => qcmDe(s).map(q => ({ q, s, part })));
    }
    function rendreExamen(zone) {
        zone.appendChild(el('p', 'text-sm text-slate-300 leading-relaxed', "Toutes les questions de QCM, mélangées. Le chapitre n'est révélé qu'après ta réponse. Vise le sans-faute, puis relance pour un nouvel ordre. Les exercices de calcul sont dans les onglets CE et OI."));
        const barre = el('div', 'flex flex-wrap items-center gap-2');
        const filtres = el('div', 'flex flex-wrap gap-2');
        filtres.setAttribute('role', 'group'); filtres.setAttribute('aria-label', "Matière de l'examen");
        FILTRES.forEach(([f, lib]) => {
            const actif = ETAT.filtre === f;
            const b = bouton(`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${actif ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'}`, `${lib} · ${poolDe(f).length}`, () => { ETAT.filtre = f; afficherOnglet('examen'); });
            b.setAttribute('aria-pressed', String(actif));
            filtres.appendChild(b);
        });
        barre.appendChild(filtres);
        zone.appendChild(barre);

        const ligne = el('div', 'flex flex-wrap items-center gap-2');
        const score = el('span', 'text-sm font-mono font-bold px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300');
        score.setAttribute('aria-live', 'polite');
        const meilleur = el('span', 'text-xs text-slate-400');
        ligne.appendChild(score);
        ligne.appendChild(bouton('px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 text-sm font-semibold flex items-center gap-2 transition-all', '<i data-lucide="shuffle" class="w-4 h-4"></i> Nouvel ordre', () => lancer()));
        ligne.appendChild(meilleur);
        zone.appendChild(ligne);
        const liste = el('div', 'space-y-3');
        zone.appendChild(liste);

        function majMeilleur() {
            const p = lire(cleExamen(ETAT.filtre));
            meilleur.textContent = p && p.score != null ? `Meilleur score enregistré : ${Math.round(p.score)} %` : '';
        }
        function lancer() {
            const pool = poolDe(ETAT.filtre);
            for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
            let rep = 0, justes = 0;
            const maj = () => { score.textContent = `${justes} / ${pool.length} · ${rep} répondue${rep > 1 ? 's' : ''}`; };
            maj(); majMeilleur();
            liste.innerHTML = '';
            pool.forEach(({ q, s, part }, n) => {
                liste.appendChild(rendreQcm(q, `Question ${n + 1} / ${pool.length}`, (bon, ex) => {
                    rep++; if (bon) justes++; maj();
                    const lien = el('p', 'text-xs text-slate-400');
                    lien.append('Chapitre : ');
                    lien.appendChild(bouton('underline decoration-dotted underline-offset-2 text-blue-300 hover:text-blue-200 font-semibold text-left', `${PARTIES[part].court} · ${s.titre}`, () => { afficherOnglet(part, s.id); window.scrollTo(0, 0); }));
                    ex.appendChild(lien);
                    if (rep === pool.length) {
                        enregistrer(cleExamen(ETAT.filtre), justes === pool.length, 100 * justes / pool.length);
                        score.textContent = `${justes} / ${pool.length} · terminé (${Math.round(100 * justes / pool.length)} %)`;
                    }
                }));
            });
            rafraichir(liste);
        }
        lancer();
    }

    // ---------- formules ----------
    function rendreFormules(zone) {
        zone.appendChild(el('p', 'text-sm text-slate-300 leading-relaxed', 'Les formules à savoir refaire sans le cours, avec la légende de chaque symbole. Le détail et les pièges sont dans les chapitres.'));
        FORMULES.forEach(g => {
            const carte = el('div', 'bg-darkcard border border-darkborder rounded-2xl p-5 sm:p-6 shadow-xl space-y-4');
            carte.innerHTML = `<h3 class="text-lg font-bold text-white">${g.titre}</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${g.items.map(([tex, leg]) => F(tex, leg)).join('')}</div>`;
            zone.appendChild(carte);
        });
    }

    // ---------- DS blanc ----------
    function rendreDsBlanc(zone) {
        zone.appendChild(el('p', 'text-sm text-slate-300 leading-relaxed', 'Un sujet complet par matière, à faire en temps limité. Le corrigé reste masqué tant que tu ne l\'ouvres pas.'));
        DS_BLANCS.forEach(d => {
            const carte = el('div', 'bg-darkcard border border-darkborder rounded-2xl p-5 sm:p-6 shadow-xl space-y-4');
            const tete = el('div', 'flex flex-wrap items-center justify-between gap-2');
            tete.innerHTML = `<h3 class="text-lg font-bold text-white">${d.titre}</h3>` + (d.sujet ? '' : '<span class="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">Bientôt</span>');
            carte.appendChild(tete);
            if (!d.sujet) {
                carte.appendChild(el('p', 'text-sm text-slate-400', 'Le sujet et son corrigé arrivent ici avant le DS.'));
            } else {
                carte.appendChild(el('div', 'space-y-3 text-sm text-slate-300 leading-relaxed', `<p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sujet</p>${d.sujet}`));
                const corr = el('div', 'rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 leading-relaxed space-y-2', `<p class="font-bold text-violet-200">Corrigé</p>${d.corrige || '<p>Corrigé à venir.</p>'}`);
                corr.hidden = true;
                const b = bouton('px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-violet-300 border border-violet-500/30 text-sm font-semibold flex items-center gap-2 transition-all', '<i data-lucide="eye" class="w-4 h-4"></i> <span>Afficher le corrigé</span>', () => {
                    corr.hidden = !corr.hidden;
                    b.querySelector('span').textContent = corr.hidden ? 'Afficher le corrigé' : 'Masquer le corrigé';
                });
                carte.appendChild(b); carte.appendChild(corr);
            }
            zone.appendChild(carte);
        });
    }

    // ---------- progression affichée ----------
    let progressionLue = false;   // vrai après le premier événement de progression.js (session ouverte)
    function majProgression() {
        const { faits, total } = compterChapitres();
        const aDonnees = progressionLue;
        ['ds-progression', 'carte-ds-progression'].forEach(id => { const z = $(id); if (z) z.innerHTML = aDonnees ? pastilleHTML(faits, total, 'chapitre') : ''; });
        const etape = $('etape-revision-ds');
        if (etape && !etape.classList.contains('hidden') && PARTIES[ETAT.onglet]) {
            const tete = document.querySelector('#ds-contenu [data-ds-chap-pastille]');
            const s = PARTIES[ETAT.onglet].sujets.find(x => x.id === ETAT.chap[ETAT.onglet]);
            if (tete && s) majPastilleChapitre(tete.closest('div').parentElement, s);
            document.querySelectorAll('#ds-contenu [aria-label="Chapitres"] button').forEach((b, i) => {
                const sj = PARTIES[ETAT.onglet].sujets[i]; if (!sj) return;
                const p = lire(cleChap(sj.id));
                b.textContent = (p && p.reussi ? '✓ ' : '') + sj.code;
            });
        }
    }
    document.addEventListener('studicam:progression', () => { progressionLue = true; majProgression(); });

    // ---------- entrée ----------
    function ouvrirRevisionDS(onglet) {
        if (typeof cacherToutesLesEtapes === 'function') cacherToutesLesEtapes();
        $('etape-revision-ds').classList.remove('hidden');
        $('ds-compte').textContent = texteCompteARebours();
        $('ds-stats').innerHTML = [
            `CE : <b>${CE.length}</b> chapitres`, `OI exposés : <b>${EXPOSES.length}</b> exposés, <b>${EXPOSES.reduce((n, s) => n + qcmDe(s).length, 0)}</b> QCM`,
            `OI cours : <b>${COURS_OI.length}</b> chapitres`, `<b>${poolDe('tout').length}</b> QCM au total`
        ].map(t => `<span class="text-xs px-2.5 py-1 rounded-lg bg-darkcard border border-darkborder text-slate-300">${t}</span>`).join('');
        majProgression();
        afficherOnglet(onglet || ETAT.onglet);
        window.scrollTo(0, 0);
    }
    window.ouvrirRevisionDS = ouvrirRevisionDS;

    // carte d'entrée (étape « Choisis un domaine ») : compte à rebours
    function initCarte() {
        const c = $('carte-ds-compte');
        if (c) c.textContent = texteCompteARebours();
        majProgression();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCarte); else initCarte();
})();
