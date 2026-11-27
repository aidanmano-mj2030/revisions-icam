/*
 * Studicam : contenu de la Révision de l'évaluation d'éco-gestion du lundi 30 novembre 2026 (A2),
 * chapitres 3 à 6 : les contrats, le droit du travail, le diagnostic stratégique, les contrats avec
 * les partenaires (et le choix d'une structure juridique).
 *
 * Chargé par index.html juste après revision-ds.js, qui l'affiche sur l'accueil A2 (voir « Ajouter
 * une Révision DS » dans le README). Parties :
 *   - Cours : une fiche par chapitre, reprise des leçons du site, avec QCM et cas corrigés.
 *   - Cas pratiques : méthode (qualifier les faits, appliquer la règle) et cas inventés, par thème.
 * Pas d'ancienne évaluation fournie : tout est écrit par nous à partir des leçons. Pas de formules.
 * Clés de progression : a2/ds/ds-2026-11-eco/<chapitre> et a2/ds/ds-2026-11-eco/examen-<filtre>.
 */
(function () {
    'use strict';
    const RD = window.StudicamRevisionDS;
    if (!RD) return;
    const { P, UL, NOTE, T, S } = RD.outils;

    // Schémas : ceux des leçons d'éco (constantes globales d'index.html). Absent : '' sans erreur.
    const OK_H = typeof H !== 'undefined';
    const essai = (f) => { try { return typeof f === 'function' ? f() : ''; } catch (e) { console.warn('Studicam : schéma', e); return ''; } };
    const FIGURE = (svg, legende) => (svg && OK_H ? H.figure(svg, legende) : '');
    /* global svgEcoValidite, svgEcoInexecution, svgEcoNormes, svgEcoModif, svgEcoLCAG, svgEcoSWOT, svgEcoPorter, svgEcoTempsContrat, svgEcoStructures */
    const FIG = {
        validite: () => essai(typeof svgEcoValidite !== 'undefined' && svgEcoValidite),
        inexecution: () => essai(typeof svgEcoInexecution !== 'undefined' && svgEcoInexecution),
        normes: () => essai(typeof svgEcoNormes !== 'undefined' && svgEcoNormes),
        modif: () => essai(typeof svgEcoModif !== 'undefined' && svgEcoModif),
        lcag: () => essai(typeof svgEcoLCAG !== 'undefined' && svgEcoLCAG),
        swot: () => essai(typeof svgEcoSWOT !== 'undefined' && svgEcoSWOT),
        porter: () => essai(typeof svgEcoPorter !== 'undefined' && svgEcoPorter),
        temps: () => essai(typeof svgEcoTempsContrat !== 'undefined' && svgEcoTempsContrat),
        structures: () => essai(typeof svgEcoStructures !== 'undefined' && svgEcoStructures)
    };
    const fig = (cle) => FIG[cle]();

    // ==========================================
    // Cours : chapitres 3 à 6
    // ==========================================
    const COURS = [
        {
            id: 'contrats', code: 'CH3', titre: 'Les contrats', sous: 'Conditions de validité, vices du consentement, capacité, contenu, nullité, inexécution',
            sections: [
                S('Les trois conditions de validité', 'scale',
                    P(`Un contrat est un accord de volontés qui crée des obligations. L'article 1128 du Code civil exige, en même temps : le <b>consentement</b> des parties, leur <b>capacité</b> de contracter, un <b>contenu licite et certain</b>.`),
                    FIGURE(fig('validite'), `Chaque condition manquante a sa sanction : la nullité, relative ou absolue.`)),
                S('Le consentement et ses vices', 'handshake',
                    T(['Vice', 'Définition', 'Exemple'], [
                        ['<b>Dol</b>', 'manœuvres, mensonge ou silence volontaire (<b>réticence dolosive</b>) pour tromper l\'autre partie', 'taire des infiltrations d\'eau dans la maison vendue'],
                        ['<b>Erreur</b>', 'se tromper sans avoir été trompé, sur une <b>qualité essentielle</b> de la prestation ou du cocontractant', 'acheter un meuble « d\'époque » qui est une copie'],
                        ['<b>Violence</b>', 'contrainte pour faire signer : physique (aucun consentement) ou morale (menace sur la personne, ses proches, sa fortune)', 'signer sous la menace d\'un licenciement']
                    ]),
                    NOTE('Ne vicient pas', `L'erreur sur la <b>valeur</b>, sur un simple <b>motif</b>, et l'erreur <b>inexcusable</b>. Le consentement doit aussi être réel (facultés intactes) et sérieux (pas une plaisanterie).`)),
                S('Capacité et contenu', 'user-check',
                    T(['Acte', 'Exemple', 'Gravité'], [
                        ['Conservation', 'réparer, entretenir', 'faible'],
                        ['Administration', 'louer, gérer', 'moyenne'],
                        ['Disposition', 'vendre, donner', 'forte : le bien sort du patrimoine']
                    ]),
                    UL([
                        `Mineur non émancipé : représenté par ses parents, sauf actes de la vie courante. Majeur protégé : <b>sauvegarde de justice</b> (légère), <b>curatelle</b> (assisté), <b>tutelle</b> (représenté).`,
                        `Contenu <b>licite</b> (pas contraire à l'ordre public) et <b>certain</b> (prestation possible, déterminée ou déterminable). Un prix dérisoire ou une clause très déséquilibrée peuvent être écartés.`
                    ])),
                S('Nullité et inexécution', 'ban',
                    T(['', 'Nullité absolue', 'Nullité relative'], [
                        ['Protège', 'l\'intérêt général', 'un intérêt particulier'],
                        ['Cas', 'contenu illicite ou incertain', 'vice du consentement, incapacité'],
                        ['Qui la demande', 'toute personne intéressée', 'seulement la partie protégée']
                    ]),
                    FIGURE(fig('inexecution'), `Les réponses du créancier quand le contrat n'est pas exécuté.`),
                    UL([
                        `<b>Exécution forcée en nature</b> (le juge ordonne d'exécuter) ou <b>par équivalent</b> (dommages et intérêts).`,
                        `<b>Résolution</b> : le contrat est anéanti depuis le début. <b>Résiliation</b> : il prend fin pour l'avenir (contrats à exécution successive).`,
                        `Responsabilité contractuelle : inexécution + dommage + lien de causalité ; exonération si <b>force majeure</b>.`
                    ]))
            ],
            qcm: [
                { q: "Quelles sont les trois conditions de validité d'un contrat ?", opts: ["Consentement, capacité, contenu licite et certain", "Écrit, signature, date", "Prix, durée, objet", "Offre, acceptation, livraison"], ok: [0], expl: "Article 1128 du Code civil." },
                { q: "Se taire volontairement sur un défaut déterminant pour l'autre partie, c'est…", opts: ["Une réticence dolosive", "Une erreur sur la valeur", "Une violence morale", "Une résiliation"], ok: [0], expl: "C'est une forme de dol." },
                { q: "Laquelle de ces erreurs n'annule pas le contrat ?", opts: ["L'erreur sur la valeur", "L'erreur sur une qualité essentielle de la prestation", "L'erreur sur la personne dans un contrat conclu pour elle", "Aucune, toutes l'annulent"], ok: [0], expl: "Ni la valeur, ni un simple motif, ni une erreur inexcusable." },
                { q: "La violence physique entraîne…", opts: ["Une absence totale de consentement", "Une simple erreur", "Une résiliation", "Un contrat valable"], ok: [0], expl: "" },
                { q: "Vendre un bien est un acte…", opts: ["De disposition", "D'administration", "De conservation", "De gestion courante"], ok: [0], expl: "Le bien sort du patrimoine : c'est l'acte le plus grave." },
                { q: "Un majeur sous curatelle est…", opts: ["Assisté pour les actes de disposition", "Représenté pour tous les actes", "Totalement libre", "Considéré comme mineur"], ok: [0], expl: "Sous tutelle, il est représenté." },
                { q: "Un contrat contraire à l'ordre public est frappé de…", opts: ["Nullité absolue", "Nullité relative", "Résiliation", "Rien, s'il est écrit"], ok: [0], expl: "Contenu illicite : l'intérêt général est en jeu." },
                { q: "Qui peut demander la nullité relative ?", opts: ["Seulement la partie que la règle protège", "Toute personne intéressée", "Le ministère public seulement", "Personne"], ok: [0], expl: "" },
                { q: "Un contrat d'entretien mensuel prend fin pour l'avenir, les mois passés restent dus : c'est…", opts: ["Une résiliation", "Une résolution", "Une nullité", "Une exécution forcée"], ok: [0], expl: "La résolution, elle, efface le contrat depuis le début." },
                { q: "Pour engager la responsabilité contractuelle, il faut…", opts: ["Une inexécution, un dommage et un lien de causalité", "Seulement un retard", "Une plainte pénale", "Un contrat notarié"], ok: [0], expl: "La force majeure exonère le débiteur." },
                { calc: true, fig: fig('validite'), q: "Cas : M. Durand achète une machine présentée comme neuve. Il découvre qu'elle a déjà servi trois ans, ce que le vendeur savait et a caché. Le contrat est-il valable ? Que peut-il demander ?",
                    steps: ["Faits : le vendeur a volontairement caché une information déterminante (la machine est d'occasion).", "Règle : le dol (manœuvre, mensonge ou silence volontaire pour tromper) vicie le consentement (article 1137 du Code civil).", "Application : sans ce silence, M. Durand n'aurait pas acheté à ce prix : c'est une réticence dolosive.", "Conclusion : consentement vicié, nullité relative que seul M. Durand peut demander ; chacun rend ce qu'il a reçu, et il peut aussi demander des dommages et intérêts."] }
            ]
        },
        {
            id: 'travail', code: 'CH4', titre: 'Le droit du travail', sous: 'Sources, droit négocié, contrat de travail, modification, rupture',
            sections: [
                S('Les sources', 'scale',
                    T(['Famille', 'Sources'], [
                        ['Internationale', 'règles de l\'Union européenne (directives)'],
                        ['Interne étatique', 'Constitution, lois (Code du travail), décrets, jurisprudence'],
                        ['Interne non étatique', 'droit négocié (conventions et accords collectifs, accords d\'entreprise), usages, règlement intérieur, contrat de travail']
                    ]),
                    FIGURE(fig('normes'), `Hiérarchie des normes : chaque règle respecte celles qui sont au-dessus.`),
                    UL([
                        `<b>Droit négocié</b> : syndicats représentatifs et employeurs ; accord d'entreprise signé par des syndicats <b>majoritaires</b>.`,
                        `<b>Principe de faveur</b> : la règle la plus favorable au salarié s'applique en général. Exceptions : accords <b>dérogatoires</b> (moins favorables, cas limités) ; accords <b>supplétifs</b> (règles que la loi ne prévoit pas).`
                    ])),
                S('Le contrat de travail', 'file-text',
                    P(`Trois critères en même temps : un <b>travail</b>, une <b>rémunération</b>, un <b>lien de subordination</b> (l'employeur donne des ordres, contrôle, sanctionne). Le juge regarde la réalité, pas le titre : un faux indépendant est requalifié en salarié.`),
                    T(['Contrat', 'Nature'], [
                        ['CDI', '<b>droit commun</b>, activité permanente'],
                        ['CDD', '<b>dérogatoire</b> : remplacement, accroissement temporaire d\'activité ; en général 18 mois au maximum'],
                        ['CTT (intérim)', '<b>dérogatoire</b>, l\'intérimaire est mis à disposition par une entreprise de travail temporaire']
                    ]),
                    UL([
                        `Éléments essentiels (accord du salarié obligatoire pour les changer) : <b>rémunération, durée du travail, qualification</b>.`,
                        `Clauses : période d'essai, non-concurrence (après le contrat), confidentialité, mobilité ; valables seulement si elles protègent un <b>intérêt légitime</b> de l'employeur.`
                    ])),
                S('Exécution et modification', 'briefcase',
                    T(['', 'Modification du contrat', 'Changement des conditions de travail'], [
                        ['Exemples', 'salaire, durée, qualification', 'horaires dans la journée, service, tâches de même niveau'],
                        ['Fondement', 'force obligatoire du contrat', 'pouvoir de direction (subordination)'],
                        ['Accord du salarié', '<b>obligatoire</b>', 'pas nécessaire'],
                        ['Refus', 'l\'employeur renonce ou licencie pour motif économique', 'faute : licenciement pour motif personnel']
                    ]),
                    FIGURE(fig('modif'), `Le changement touche-t-il un élément essentiel ?`),
                    NOTE('Obligations', `Non-discrimination, santé et sécurité, respect de la vie privée, bonne foi, formation (CPF, PTP, VAE). Si l'employeur change (vente, fusion), le contrat continue avec le nouvel employeur.`)),
                S('La fin du contrat', 'door-open',
                    T(['Initiative', 'Rupture', 'À retenir'], [
                        ['Employeur', 'licenciement pour motif personnel', 'faute ou inaptitude ; indemnité sauf faute grave ou lourde'],
                        ['Employeur', 'licenciement économique', 'difficultés, mutations technologiques, réorganisation ; parfois un PSE'],
                        ['Salarié', 'démission', 'pas d\'allocation chômage, sauf cas particuliers'],
                        ['Les deux', 'rupture conventionnelle', 'négociée et encadrée']
                    ]),
                    NOTE('Toujours', `Un licenciement exige une <b>cause réelle et sérieuse</b> et une procédure (entretien préalable).`))
            ],
            qcm: [
                { q: "Le critère essentiel du contrat de travail est…", opts: ["Le lien de subordination", "L'écrit", "La durée", "Le lieu de travail"], ok: [0], expl: "Avec le travail et la rémunération." },
                { q: "Le contrat de droit commun est…", opts: ["Le CDI", "Le CDD", "Le contrat d'intérim", "Le contrat d'apprentissage"], ok: [0], expl: "CDD et intérim sont dérogatoires." },
                { q: "Un accord collectif est une source…", opts: ["Interne non étatique", "Interne étatique", "Internationale", "Jurisprudentielle"], ok: [0], expl: "C'est le droit négocié." },
                { q: "La jurisprudence est une source…", opts: ["Interne étatique", "Interne non étatique", "Internationale", "Négociée"], ok: [0], expl: "Elle vient des juges (Cour de cassation)." },
                { q: "Le principe de faveur veut dire que…", opts: ["La règle la plus favorable au salarié s'applique en général", "L'employeur choisit la règle", "La loi s'applique toujours", "Le contrat prime sur la loi"], ok: [0], expl: "" },
                { q: "Baisser le salaire d'un salarié, c'est…", opts: ["Une modification du contrat : son accord est obligatoire", "Un simple changement des conditions de travail", "Un usage", "Une sanction automatique"], ok: [0], expl: "La rémunération est un élément essentiel." },
                { q: "Décaler les horaires d'une heure dans la journée, c'est…", opts: ["Un changement des conditions de travail", "Une modification du contrat", "Un licenciement", "Une rupture conventionnelle"], ok: [0], expl: "Pouvoir de direction de l'employeur." },
                { q: "Une clause de non-concurrence s'applique…", opts: ["Après la fin du contrat", "Pendant la période d'essai seulement", "Avant la signature", "Jamais"], ok: [0], expl: "Valable si elle protège un intérêt légitime de l'employeur." },
                { q: "Un salarié qui démissionne…", opts: ["N'a en principe pas droit à l'allocation chômage", "Touche toujours une indemnité de licenciement", "Doit passer devant le juge", "Signe une rupture conventionnelle"], ok: [0], expl: "Sauf cas particuliers." },
                { q: "Tout licenciement doit reposer sur…", opts: ["Une cause réelle et sérieuse", "L'accord du salarié", "Une décision du juge", "Une faute lourde"], ok: [0], expl: "Et respecter une procédure." },
                { calc: true, fig: fig('modif'), q: "Cas : l'employeur de Léa veut la faire passer de 35 h à 30 h par semaine, avec une baisse de salaire. Léa refuse. Peut-il l'imposer ? Que peut-il faire ?",
                    steps: ["Faits : changement de la durée du travail et de la rémunération, refusé par la salariée.", "Règle : durée du travail et rémunération sont des éléments essentiels du contrat ; les modifier exige l'accord du salarié (force obligatoire du contrat).", "Application : c'est une modification du contrat, pas un simple changement des conditions de travail ; le refus de Léa n'est pas une faute.", "Conclusion : l'employeur ne peut pas l'imposer ; il renonce, ou, si la raison est économique, il peut engager un licenciement pour motif économique."] }
            ]
        },
        {
            id: 'strategie', code: 'CH5', titre: 'Le diagnostic stratégique', sous: 'Modèle LCAG, stratégie délibérée ou émergente, diagnostics interne et externe, SWOT',
            sections: [
                S('La démarche stratégique', 'route',
                    FIGURE(fig('lcag'), `Les quatre étapes du modèle LCAG.`),
                    UL([
                        `<b>LCAG</b> (Learned, Christensen, Andrews, Guth) : 1. diagnostic, 2. choix possibles, 3. objectifs, 4. mise en œuvre et contrôle (indicateurs, tableaux de bord).`,
                        `Stratégie <b>délibérée</b> (planifiée) ou <b>émergente</b> (construite en route, Mintzberg) ; les acteurs peuvent la faire dévier (Crozier et Friedberg).`
                    ])),
                S('Diagnostic interne : forces et faiblesses', 'building',
                    T(['Notion', 'Ce que c\'est'], [
                        ['Ressources tangibles / intangibles', 'physiques, financières, humaines / brevets, image de marque, culture (Penrose)'],
                        ['Compétence distinctive', 'savoir-faire qui a de la valeur pour le client, rare et difficile à imiter (Hamel et Prahalad)'],
                        ['Ressource stratégique', 'ressource clé qui donne un avantage concurrentiel durable'],
                        ['Chaîne de valeur (Porter)', 'activités principales (production, vente, SAV) et de soutien (RH, R&D, achats)']
                    ])),
                S('Diagnostic externe : opportunités et menaces', 'globe',
                    UL([
                        `<b>Macroenvironnement</b> : <b>PESTEL</b> (Politique, Économique, Socioculturel, Technologique, Écologique, Légal).`,
                        `<b>Microenvironnement</b> : les <b>5 forces de Porter</b> (clients, fournisseurs, concurrents actuels, entrants potentiels, produits de substitution).`,
                        `Il fait ressortir les <b>facteurs clés de succès</b> : ce qu'il faut maîtriser pour réussir sur le marché.`
                    ]),
                    FIGURE(fig('porter'), `Plus une force est puissante, plus elle menace la rentabilité.`)),
                S('La synthèse SWOT', 'layout-grid',
                    FIGURE(fig('swot'), `Interne en haut, externe en bas.`),
                    NOTE('Piège', `Force et faiblesse : l'entreprise elle-même, elle peut agir dessus. Opportunité et menace : l'extérieur, elle les subit.`))
            ],
            qcm: [
                { q: "Quelle est la première étape du modèle LCAG ?", opts: ["Le diagnostic interne et externe", "La fixation des objectifs", "Le contrôle", "Le choix des actions"], ok: [0], expl: "" },
                { q: "Une stratégie qui se construit au fil des imprévus est…", opts: ["Émergente", "Délibérée", "Distinctive", "Planifiée"], ok: [0], expl: "Henry Mintzberg." },
                { q: "Le diagnostic interne fait ressortir…", opts: ["Les forces et les faiblesses", "Les opportunités et les menaces", "Les facteurs clés de succès", "Les cinq forces"], ok: [0], expl: "" },
                { q: "Un brevet est une ressource…", opts: ["Intangible", "Tangible", "Financière", "Humaine"], ok: [0], expl: "" },
                { q: "Une compétence distinctive est…", opts: ["Rare, difficile à imiter et utile au client", "Partagée par tous les concurrents", "Une ressource financière", "Une menace"], ok: [0], expl: "Hamel et Prahalad." },
                { q: "PESTEL analyse…", opts: ["Le macroenvironnement", "Le microenvironnement", "La chaîne de valeur", "Le bilan"], ok: [0], expl: "" },
                { q: "Une hausse du prix de l'énergie est, pour un industriel, un facteur…", opts: ["Économique, plutôt une menace", "Légal, une opportunité", "Interne, une faiblesse", "Socioculturel, une force"], ok: [0], expl: "" },
                { q: "Laquelle n'est pas une des cinq forces de Porter ?", opts: ["L'État", "Les clients", "Les fournisseurs", "Les produits de substitution"], ok: [0], expl: "" },
                { q: "Dans la matrice SWOT, une nouvelle loi favorable au secteur est…", opts: ["Une opportunité", "Une force", "Une faiblesse", "Une menace"], ok: [0], expl: "Elle vient de l'extérieur." },
                { q: "À l'étape 4 du modèle LCAG, on contrôle avec…", opts: ["Des indicateurs de performance et des tableaux de bord", "La matrice SWOT", "PESTEL", "La chaîne de valeur"], ok: [0], expl: "" },
                { calc: true, fig: fig('swot'), q: "Cas : une PME de vélos électriques a un brevet de batterie légère et une marque connue, mais une seule usine saturée. L'État aide l'achat de vélos électriques et une marque chinoise arrive à bas prix. Classe chaque élément dans la matrice SWOT.",
                    steps: ["Forces (interne, positif) : le brevet (ressource intangible, peut-être une compétence distinctive) et la marque connue.", "Faiblesse (interne, négatif) : une seule usine saturée, capacité de production limitée.", "Opportunité (externe, positif) : l'aide de l'État, facteur politique du PESTEL.", "Menace (externe, négatif) : l'arrivée d'un concurrent à bas prix (entrant potentiel, 5 forces de Porter)."] }
            ]
        },
        {
            id: 'partenaires', code: 'CH6', titre: 'Les contrats avec les partenaires', sous: 'Grands principes, formation, clauses, analyser un contrat, structure juridique',
            sections: [
                S('Les trois temps et les grands principes', 'handshake',
                    FIGURE(fig('temps'), `Négociation, formation, exécution.`),
                    T(['Principe', 'Sens'], [
                        ['Liberté contractuelle', 'libre de contracter ou non, avec qui, et de fixer le contenu'],
                        ['Consensualisme', 'l\'accord des volontés suffit'],
                        ['Force obligatoire', 'ce qui est convenu s\'impose aux parties'],
                        ['Bonne foi', 'sincérité, loyauté, coopération, dès la négociation'],
                        ['Information précontractuelle', 'donner toute information déterminante pour l\'autre']
                    ])),
                S('Les clauses', 'list-checks',
                    T(['Clause', 'Effet'], [
                        ['Suspensive', 'contrat définitif seulement si l\'événement arrive (prêt obtenu)'],
                        ['Résolutoire', 'si l\'événement arrive (manquement), le contrat prend fin'],
                        ['Renégociation', 'revoir le contrat si un imprévu bouleverse son équilibre'],
                        ['Réserve de propriété', 'vendeur propriétaire jusqu\'au paiement complet'],
                        ['Limitative de responsabilité', 'indemnité plafonnée, sauf faute lourde ou inexcusable'],
                        ['Pénale', 'somme forfaitaire si inexécution ; le juge peut la modérer (art. 1231-5)']
                    ])),
                S('Analyser un contrat', 'search',
                    P(`Type de contrat, parties (et qui signe pour une société), lieu et date (à la fin), obligations de chacun, clauses, durée et préavis, validité. Pour répondre : citer l'article, dire ce qu'il prévoit, l'appliquer.`)),
                S('Choisir une structure juridique', 'building-2',
                    FIGURE(fig('structures'), `Entreprise individuelle ou société.`),
                    NOTE('À retenir', `Société : personne morale, patrimoine propre, impôt sur les sociétés. EI : pas de personnalité morale, impôt sur le revenu (depuis 2022, patrimoines professionnel et personnel séparés par la loi).`))
            ],
            qcm: [
                { q: "Le consensualisme signifie que…", opts: ["Le seul accord des volontés suffit à former le contrat", "Il faut toujours un écrit", "Les parties ne prennent pas position", "Le juge valide le contrat"], ok: [0], expl: "" },
                { q: "La bonne foi s'applique…", opts: ["Dès les négociations, puis à la formation et à l'exécution", "Seulement après la signature", "Seulement devant le juge", "Seulement aux contrats de travail"], ok: [0], expl: "" },
                { q: "Une offre de vente est refusée. Alors…", opts: ["Aucun contrat n'est formé", "Le contrat est formé quand même", "Le vendeur doit une indemnité", "Le contrat est résolu"], ok: [0], expl: "" },
                { q: "L'achat d'un local « sous réserve d'obtenir le prêt » contient une clause…", opts: ["Suspensive", "Résolutoire", "Pénale", "Limitative"], ok: [0], expl: "Sans prêt, pas de vente." },
                { q: "« 200 € par jour de retard » est une clause…", opts: ["Pénale", "Suspensive", "De réserve de propriété", "De renégociation"], ok: [0], expl: "Le juge peut la modérer si elle est excessive." },
                { q: "Avec une clause de réserve de propriété, avant le paiement complet, l'acheteur est…", opts: ["Possesseur, pas propriétaire", "Propriétaire", "Locataire", "Sans droit sur le bien"], ok: [0], expl: "" },
                { q: "Une clause limitative de responsabilité tombe si…", opts: ["Le débiteur a commis une faute lourde ou inexcusable", "Le dommage est faible", "Le contrat est écrit", "Le client est une entreprise"], ok: [0], expl: "" },
                { q: "Dans un contrat de location, les parties sont…", opts: ["Le bailleur et le locataire", "Le vendeur et l'acheteur", "L'employeur et le salarié", "Le donneur d'ordre et le prestataire"], ok: [0], expl: "" },
                { q: "Quel est l'intérêt d'une société dotée de la personnalité morale ?", opts: ["Elle a son propre patrimoine", "Elle ne paie pas d'impôt", "Elle n'a pas de statuts", "Elle ne signe pas de contrats"], ok: [0], expl: "" },
                { q: "Trois amis veulent créer ensemble une entreprise. Formes possibles ?", opts: ["SARL ou SAS", "EURL ou SASU", "Micro-entreprise", "Entreprise individuelle"], ok: [0], expl: "Plusieurs associés." },
                { calc: true, fig: fig('temps'), q: "Cas : un contrat de livraison de pièces prévoit 300 € de pénalité par jour de retard, et la livraison a 20 jours de retard (6 000 € pour une commande de 4 000 €). Le client réclame les 6 000 €. Le fournisseur peut-il contester ?",
                    steps: ["Faits : clause fixant d'avance une somme forfaitaire par jour de retard ; montant dû supérieur à la valeur de la commande.", "Règle : c'est une clause pénale ; l'article 1231-5 du Code civil permet au juge de la réduire (ou de l'augmenter) si elle est manifestement excessive (ou dérisoire).", "Application : 6 000 € pour une commande de 4 000 € peut être jugé manifestement excessif.", "Conclusion : la clause s'applique (force obligatoire), mais le fournisseur peut demander au juge d'en réduire le montant."] }
            ]
        }
    ];

    // ==========================================
    // Cas pratiques : méthode et entraînement, par thème
    // ==========================================
    const METHODE = S('La méthode du cas pratique', 'list-ordered',
        T(['Étape', 'Ce qu\'on écrit'], [
            ['1. Les faits', 'qui sont les parties, ce qui s\'est passé (seulement les faits utiles), en termes juridiques'],
            ['2. Le problème', 'la question de droit, posée de façon générale : « un employeur peut-il… ? »'],
            ['3. La règle', 'l\'article, le principe ou la notion du cours qui répond'],
            ['4. L\'application', 'confronter les faits à la règle, condition par condition'],
            ['5. La conclusion', 'répondre clairement à la question posée']
        ]),
        NOTE('Conseil', `Une réponse sans règle ne rapporte presque rien, une règle sans application non plus. Utiliser le vocabulaire exact : dol, nullité relative, modification du contrat, clause pénale…`));
    const CAS = [
        {
            id: 'cascontrats', code: 'CAS 1', titre: 'Cas : former et exécuter un contrat', sous: 'Validité, vices, nullité, clauses, sanctions de l\'inexécution',
            sections: [METHODE,
                S('Repères pour ces cas', 'compass',
                    UL([
                        `Un défaut au moment de la <b>formation</b> → <b>nullité</b> (relative ou absolue). Un problème pendant l'<b>exécution</b> → <b>sanctions de l'inexécution</b> ou clause prévue.`,
                        `Regarder s'il existe une <b>clause</b> qui règle déjà la difficulté (pénale, résolutoire, limitative…).`
                    ]))],
            qcm: [
                { q: "Un contrat est signé par un enfant de 12 ans pour acheter une moto. Sanction ?", opts: ["Nullité relative pour incapacité", "Nullité absolue", "Résiliation", "Aucune, le contrat est valable"], ok: [0], expl: "Seul le mineur (ses représentants) peut la demander." },
                { q: "Une société vend des produits interdits. Le contrat est…", opts: ["Nul de nullité absolue", "Valable s'il est écrit", "Simplement résiliable", "Nul de nullité relative"], ok: [0], expl: "Contenu illicite." },
                { q: "Le fournisseur ne livre pas : le client veut que le juge l'oblige à livrer. Il demande…", opts: ["L'exécution forcée en nature", "La résiliation", "La nullité", "L'exécution par équivalent"], ok: [0], expl: "" },
                { q: "Le contrat prévoit sa fin automatique en cas d'impayé après mise en demeure. C'est une clause…", opts: ["Résolutoire", "Suspensive", "Pénale", "De renégociation"], ok: [0], expl: "" },
                { q: "Un événement imprévisible, irrésistible et extérieur empêche la livraison. Le fournisseur…", opts: ["Est exonéré : c'est un cas de force majeure", "Doit des dommages et intérêts", "Voit le contrat annulé pour dol", "Doit payer la clause pénale"], ok: [0], expl: "" },
                { calc: true, q: "Cas : une imprimerie loue une machine pour un an (loyer mensuel). Article 8 : « En cas de panne due au bailleur, sa responsabilité est limitée à un mois de loyer. » Article 10 : « Le contrat est résilié de plein droit si le loyer reste impayé quinze jours après une mise en demeure. » Au 4e mois, le bailleur, par négligence grave, livre une machine défectueuse qui détruit un stock de 20 000 €. L'imprimerie suspend ses paiements. Analyse la situation.",
                    steps: ["Contrat : location ; parties : le bailleur et le locataire (l'imprimerie) ; durée un an.", "Article 8 : clause limitative de responsabilité. Elle est écartée en cas de faute lourde : la négligence grave du bailleur permet à l'imprimerie de demander la réparation intégrale (20 000 €), pas seulement un mois de loyer.", "Article 10 : clause résolutoire. Si l'imprimerie ne paie pas quinze jours après une mise en demeure, le contrat est résilié de plein droit : suspendre les paiements est risqué.", "Conclusion : l'imprimerie doit continuer à payer (ou agir en justice) et demander des dommages et intérêts pour le préjudice ; la résiliation joue pour l'avenir, les mois passés restent dus."] }
            ]
        },
        {
            id: 'castravail', code: 'CAS 2', titre: 'Cas : la relation de travail', sous: 'Qualifier le contrat, modification ou changement, rupture',
            sections: [METHODE,
                S('Repères pour ces cas', 'compass',
                    UL([
                        `Contrat de travail ? Vérifier les <b>trois critères</b>, surtout la subordination (ordres, contrôle, sanctions).`,
                        `Changement imposé ? Se demander s'il touche un <b>élément essentiel</b> (salaire, durée, qualification).`,
                        `Rupture ? Qui en a l'initiative, et pour quel motif ?`
                    ]))],
            qcm: [
                { q: "Un livreur « indépendant » reçoit ses horaires, ses tournées et des sanctions de la plateforme. Le juge peut…", opts: ["Requalifier la relation en contrat de travail", "Rien faire, le contrat dit « prestation »", "Annuler la plateforme", "Le déclarer bénévole"], ok: [0], expl: "Subordination réelle : la qualification dépend des faits, pas du titre." },
                { q: "Un salarié est muté dans un autre service, mêmes tâches, même salaire, même ville. Accord nécessaire ?", opts: ["Non : changement des conditions de travail", "Oui : modification du contrat", "Oui, et devant le juge", "Seulement s'il a un CDD"], ok: [0], expl: "" },
                { q: "Il refuse cette mutation. Son refus est…", opts: ["Une faute pouvant justifier un licenciement pour motif personnel", "Un droit absolu", "Une démission", "Une rupture conventionnelle"], ok: [0], expl: "" },
                { q: "Une entreprise embauche en CDD pour remplacer une salariée en congé maternité. Ce motif est…", opts: ["Autorisé", "Interdit", "Réservé à l'intérim", "Réservé aux cadres"], ok: [0], expl: "Remplacement d'un salarié absent." },
                { q: "Employeur et salarié se mettent d'accord pour rompre le CDI. C'est…", opts: ["Une rupture conventionnelle", "Une démission", "Un licenciement économique", "Une résolution"], ok: [0], expl: "" },
                { calc: true, q: "Cas : Hugo, technicien en CDI à Lyon depuis cinq ans, n'a pas de clause de mobilité. Son employeur lui annonce qu'il travaillera désormais à Marseille, avec le même salaire. Hugo refuse. L'employeur parle de licenciement pour faute. Qu'en penses-tu ?",
                    steps: ["Faits : changement du lieu de travail vers une autre région, sans clause de mobilité, refusé par le salarié.", "Règle : l'employeur peut changer les conditions de travail (pouvoir de direction), mais une modification du contrat exige l'accord du salarié. Un changement de secteur géographique important, sans clause de mobilité, est en général une modification du contrat.", "Application : Lyon → Marseille n'est pas le même secteur géographique et aucune clause ne l'a prévu : il faut l'accord d'Hugo.", "Conclusion : son refus n'est pas une faute ; un licenciement pour faute n'aurait pas de cause réelle et sérieuse. L'employeur doit renoncer, ou justifier un motif économique."] }
            ]
        },
        {
            id: 'casstrategie', code: 'CAS 3', titre: 'Cas : le diagnostic d\'une entreprise', sous: 'Classer les informations, PESTEL, Porter, SWOT, LCAG',
            sections: [
                S('Méthode du diagnostic', 'list-ordered',
                    T(['Étape', 'Ce qu\'on fait'], [
                        ['1. Trier', 'interne (l\'entreprise) ou externe (l\'environnement) ?'],
                        ['2. Qualifier', 'interne : ressource tangible ou intangible, compétence ; externe : facteur PESTEL ou force de Porter'],
                        ['3. Juger', 'positif (force, opportunité) ou négatif (faiblesse, menace) ?'],
                        ['4. Synthétiser', 'remplir la matrice SWOT et en tirer les facteurs clés de succès']
                    ]),
                    NOTE('Piège', `Une même information ne va que dans une case : la concurrence, c'est de l'externe (menace), même si elle « fait du tort » à l'entreprise.`))],
            qcm: [
                { q: "« Nos salariés maîtrisent une technique de soudure que peu de concurrents savent faire. » C'est…", opts: ["Une force (compétence distinctive)", "Une opportunité", "Une menace", "Un facteur PESTEL"], ok: [0], expl: "" },
                { q: "« Une nouvelle norme européenne impose des emballages recyclables. » Facteur PESTEL ?", opts: ["Légal (ou écologique)", "Socioculturel", "Technologique", "Économique"], ok: [0], expl: "Une obligation juridique : légal ; son objectif est écologique." },
                { q: "« Un seul fournisseur au monde produit le composant clé. » C'est…", opts: ["Une menace : fort pouvoir des fournisseurs", "Une force", "Une opportunité", "Une faiblesse interne"], ok: [0], expl: "" },
                { q: "« La visioconférence remplace une partie des voyages d'affaires » pour une compagnie aérienne. C'est…", opts: ["Un produit de substitution", "Un entrant potentiel", "Un fournisseur", "Une force"], ok: [0], expl: "" },
                { q: "L'entreprise suit chaque mois ses ventes sur un tableau de bord. Étape LCAG ?", opts: ["4. Mise en œuvre et contrôle", "1. Diagnostic", "2. Choix possibles", "3. Objectifs"], ok: [0], expl: "" },
                { calc: true, q: "Cas : une brasserie artisanale régionale a une recette primée et une clientèle fidèle, mais peu de trésorerie et une petite équipe commerciale. Les consommateurs recherchent des produits locaux, le prix du verre augmente fortement et de grands groupes lancent des « bières artisanales ». Fais le diagnostic SWOT, puis propose un facteur clé de succès.",
                    steps: ["Forces : recette primée (ressource intangible, savoir-faire distinctif), clientèle fidèle (image de marque).", "Faiblesses : peu de trésorerie (ressource financière), petite équipe commerciale (ressource humaine).", "Opportunité : goût pour les produits locaux (socioculturel). Menaces : hausse du prix du verre (économique, pouvoir des fournisseurs) et grands groupes sur le créneau (concurrents actuels ou entrants).", "Facteur clé de succès : l'authenticité et l'ancrage local (prouver l'origine, la qualité), que les grands groupes ont du mal à imiter."] }
            ]
        }
    ];

    // Le moteur ne mélange pas les propositions : permutation fixe, selon le texte de la question.
    const hacher = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    COURS.concat(CAS).forEach(ch => ch.qcm.forEach(q => {
        if (q.calc || !Array.isArray(q.opts)) return;
        let g = hacher(q.q);
        const ordre = q.opts.map((_, i) => i);
        for (let i = ordre.length - 1; i > 0; i--) { g = Math.imul(g ^ (g >>> 15), 2246822507) >>> 0; const j = g % (i + 1); [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; }
        const bons = new Set(q.ok);
        q.opts = ordre.map(i => q.opts[i]);
        q.ok = ordre.map((i, k) => (bons.has(i) ? k : -1)).filter(k => k >= 0);
    }));

    const PARTIES = {
        cours: { titre: 'Éco-gestion : cours des chapitres 3 à 6', court: 'Cours', icone: 'book-open', sujets: COURS,
            intro: `Les contrats, le droit du travail, le diagnostic stratégique et les contrats avec les partenaires. L'essentiel de chaque leçon, avec des QCM et un cas corrigé par chapitre.` },
        cas: { titre: 'Éco-gestion : cas pratiques', court: 'Cas pratiques', icone: 'briefcase', sujets: CAS,
            intro: `La méthode du cas pratique (faits, problème, règle, application, conclusion), puis des cas inventés par thème, corrigés étape par étape. Pas d'ancienne évaluation fournie : les cas reprennent les notions du cours.` }
    };

    RD.enregistrer({
        id: 'ds-2026-11-eco', annee: 'a2', date: new Date(2026, 10, 30), libelle: 'lundi 30 novembre 2026',
        titre: "Évaluation d'éco-gestion (chapitres 3 à 6)", titrePage: "Révision : évaluation d'éco-gestion (chapitres 3 à 6)",
        resume: "Examen blanc, cours des chapitres 3 à 6, cas pratiques corrigés.",
        intro: "Les contrats, le droit du travail, le diagnostic stratégique et les contrats avec les partenaires. Les QCM se corrigent au clic (Entraînement) ou à la fin (Mode DS), les cas montrent leur correction étape par étape.",
        parties: PARTIES, ordre: ['cours', 'cas'], filtres: [['tout', 'Tout'], ['cours', 'Cours'], ['cas', 'Cas pratiques']],
        onglets: { cours: 'Cours', cas: 'Cas pratiques' },
        chap: { cours: 'contrats', cas: 'cascontrats' },
        matiere: () => 'eco',
        formules: [], dsBlancs: []
    });
})();
