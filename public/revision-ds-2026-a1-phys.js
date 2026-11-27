/*
 * Studicam : contenu de la Révision DS de physique de 1ère année (chapitres 1 à 4).
 * Date du DS à confirmer (dateAConfirmer). Parties : Cours (ch. 1 à 4) et Anciens DS (DS n°2 de
 * 2021, 2023 et 2025, regroupés par type d'exercice, corrections refaites par nous, sans nom d'élève).
 *
 * Chargé par index.html juste après revision-ds.js, qui l'affiche sur l'accueil de 1ère année
 * (voir « Ajouter une Révision DS » dans le README). Partie « Cours » : grandeurs électriques et
 * lois de Kirchhoff, dipôles, théorèmes généraux, grandeurs sinusoïdales. Notions et QCM écrits par nous à partir des
 * leçons du site ; exercices avec d'autres données, recalculées.
 * Clés de progression : a1/ds/ds-2026-a1-phys/<chapitre> et a1/ds/ds-2026-a1-phys/examen-<filtre>.
 */
(function () {
    'use strict';
    const RD = window.StudicamRevisionDS;
    if (!RD) return;
    const { R, P, UL, NOTE, F, T, S } = RD.outils;

    // Schémas : ceux des leçons de physique d'A1 (globaux d'index.html). Absent : '' sans erreur.
    const OK_H = typeof H !== 'undefined';
    const dessin = (nom, ...a) => { try { return typeof window[nom] === 'function' ? window[nom](...a) : ''; } catch (e) { console.warn('Studicam : schéma', e); return ''; } };
    const FIGURE = (svg, legende) => (svg && OK_H ? H.figure(svg, legende) : '');
    const FIG = {
        conventions: () => dessin('phConventions'), noeud: () => dessin('phNoeud'),
        carac: () => dessin('phCarac'), diviseur: () => dessin('phDiviseurU'), theNor: () => dessin('phTheNor'),
        sinus: () => dessin('phSinus'), dephasage: () => dessin('phDephasage'), phaseurs: () => dessin('phPhaseurs')
    };
    const fig = (cle) => FIG[cle]();

    const COURS = [
        {
            id: 'grandeurs', code: 'CH1', titre: 'Grandeurs électriques et lois de Kirchhoff', sous: 'Tension, courant, puissance, conventions, loi des nœuds, loi des mailles',
            sections: [
                S('Tension, courant, puissance', 'zap',
                    F(R`U_{AB} = V_A - V_B \qquad i = \dfrac{dq}{dt}`, `U<sub>AB</sub> tension entre A et B (V), flèche dirigée vers A · V potentiel (V) · i courant (A), débit de charges q (C) · U<sub>BA</sub> = −U<sub>AB</sub>`),
                    F(R`P = U\,I \qquad E = P\,t`, `P puissance (W) · E énergie (J) pour une puissance constante pendant t (s) · 1 kWh = 3,6 × 10⁶ J`),
                    NOTE('Signe', `Une tension ou un courant négatif veut seulement dire « dans le sens opposé à la flèche » : on ne change pas la flèche en cours de calcul.`)),
                S('Conventions récepteur et générateur', 'arrow-left-right',
                    FIGURE(fig('conventions'), `Flèches de U et I opposées (récepteur) ou de même sens (générateur).`),
                    T(['Convention', 'Flèches', 'P = UI &gt; 0 veut dire'], [
                        ['Récepteur', 'U et I en sens opposés', 'le dipôle <b>reçoit</b> de la puissance'],
                        ['Générateur', 'U et I dans le même sens', 'le dipôle <b>fournit</b> de la puissance']
                    ])),
                S('Lois de Kirchhoff', 'git-fork',
                    FIGURE(fig('noeud'), `Loi des nœuds : ce qui entre ressort.`),
                    UL([
                        `<b>ARQS</b> : en basse fréquence, le courant a la même valeur en tout point d'une branche.`,
                        `<b>Loi des nœuds</b> : somme des courants entrants = somme des courants sortants.`,
                        `<b>Loi des mailles</b> : on parcourt la maille dans un sens ; tension dans le sens de parcours comptée +, sinon − ; la somme vaut 0.`
                    ]))
            ],
            qcm: [
                { q: "V_A = 12 V et V_B = 5 V. Que vaut U_BA ?", opts: ["7 V", "−7 V", "17 V", "−17 V"], ok: [1], expl: "U_BA = V_B − V_A = 5 − 12 = −7 V." },
                { q: "Un appareil de 1 500 W fonctionne 2 heures. Énergie consommée ?", opts: ["3 kWh", "750 Wh", "3 000 J", "1,5 kWh"], ok: [0], expl: "E = P·t = 1,5 kW × 2 h = 3 kWh (soit 10,8 × 10⁶ J)." },
                { fig: fig('conventions'), q: "En convention récepteur, on trouve P = U·I = −4 W. Le dipôle…", opts: ["Reçoit 4 W", "Fournit 4 W", "Ne consomme rien", "Est forcément une résistance"], ok: [1], expl: "En convention récepteur, P < 0 veut dire que le dipôle fournit de la puissance : c'est un générateur." },
                { q: "En convention générateur, U et I sont…", opts: ["Fléchés dans le même sens", "Fléchés en sens opposés", "Toujours positifs", "Toujours de même valeur"], ok: [0], expl: "" },
                { fig: fig('noeud'), q: "À un nœud arrivent 3 A et 2 A, et repart un courant I et un courant de 1 A. Que vaut I ?", opts: ["6 A", "4 A", "2 A", "0 A"], ok: [1], expl: "3 + 2 = I + 1, donc I = 4 A." },
                { q: "Que dit la loi des mailles ?", opts: ["La somme des tensions (avec leur signe) le long d'une maille est nulle", "La somme des courants d'une maille est nulle", "Toutes les tensions d'une maille sont égales", "U = R·I dans toute la maille"], ok: [0], expl: "Les courants, c'est la loi des nœuds." },
                { q: "L'ARQS permet de dire que…", opts: ["Le courant est le même en tout point d'une branche", "La tension est nulle", "Le courant est toujours continu", "Les résistances sont parfaites"], ok: [0], expl: "Valable tant que le temps de propagation est négligeable devant la période (basse fréquence)." },
                { calc: true, fig: fig('noeud'), q: "Une maille contient un générateur E = 12 V et trois résistances en série : U₁ = 3 V, U₂ = 5 V (fléchées en convention récepteur). Le courant vaut 50 mA. Calculer U₃, la puissance fournie par le générateur et celle reçue par chaque résistance.",
                    steps: ["Loi des mailles : E − U₁ − U₂ − U₃ = 0, donc U₃ = 12 − 3 − 5 = 4 V.", "Générateur (convention générateur) : P = E·I = 12 × 0,05 = 0,6 W fournis.", "Résistances : P₁ = 3 × 0,05 = 0,15 W, P₂ = 0,25 W, P₃ = 0,2 W.", "Vérification : 0,15 + 0,25 + 0,2 = 0,6 W, toute la puissance fournie est reçue."] }
            ]
        },
        {
            id: 'dipoles', code: 'CH2', titre: 'Dipôles électriques', sous: 'Caractéristiques, résistances, diviseurs, condensateur, bobine, sources réelles',
            sections: [
                S('Caractéristiques et résistance', 'activity',
                    FIGURE(fig('carac'), `Résistance : droite par l'origine (passif). Générateur de Thévenin : droite qui ne passe pas par l'origine (actif).`),
                    F(R`u = R\,i \qquad P = R\,i^2 = \dfrac{u^2}{R} \qquad G = \dfrac{1}{R}`, `Loi d'Ohm · effet Joule (W) · conductance G (S)`),
                    T(['Association', 'Résistance équivalente', 'Diviseur'], [
                        ['Série (même courant)', 'R<sub>eq</sub> = R₁ + R₂ + …', 'u₁ = u · R₁ / (R₁ + R₂)'],
                        ['Parallèle (même tension)', '1/R<sub>eq</sub> = 1/R₁ + 1/R₂', 'i₁ = i · R₂ / (R₁ + R₂)']
                    ]),
                    FIGURE(fig('diviseur'), `Diviseur de tension à vide : U<sub>s</sub> = E·R₂ / (R₁ + R₂).`)),
                S('Condensateur et bobine', 'battery',
                    F(R`q = C\,u \qquad i = C\,\dfrac{du}{dt} \qquad E_C = \tfrac12\,C\,u^2`, `Condensateur · C capacité (F) · la <b>tension</b> ne saute pas · en continu : i = 0, interrupteur ouvert`),
                    F(R`u = L\,\dfrac{di}{dt} + r\,i \qquad E_L = \tfrac12\,L\,i^2`, `Bobine · L inductance (H) · le <b>courant</b> ne saute pas · en continu : u = r·i ≈ 0, simple fil`),
                    UL([
                        `Condensateurs : en parallèle C<sub>eq</sub> = C₁ + C₂ ; en série 1/C<sub>eq</sub> = 1/C₁ + 1/C₂ (l'inverse des résistances).`,
                        `Couper le courant d'une bobine crée une surtension : on met une <b>diode de roue libre</b> en parallèle.`
                    ])),
                S('Sources réelles', 'plug',
                    F(R`u = E - r\,i \qquad I_{cc} = \dfrac{E}{r} \qquad I_N = \dfrac{E}{r},\ G_N = \dfrac1r`, `Générateur de Thévenin (E, r) et son équivalent de Norton · I<sub>cc</sub> courant de court-circuit · idéal de tension : r = 0`))
            ],
            qcm: [
                { q: "R₁ = 100 Ω et R₂ = 300 Ω en série. Résistance équivalente ?", opts: ["75 Ω", "400 Ω", "200 Ω", "300 Ω"], ok: [1], expl: "En série, on additionne." },
                { q: "R₁ = 100 Ω et R₂ = 300 Ω en parallèle. Résistance équivalente ?", opts: ["75 Ω", "400 Ω", "200 Ω", "133 Ω"], ok: [0], expl: "R₁R₂/(R₁ + R₂) = 30 000 / 400 = 75 Ω, plus petite que la plus petite des deux." },
                { fig: fig('diviseur'), q: "Diviseur de tension à vide : E = 12 V, R₁ = 2 kΩ, R₂ = 1 kΩ. Tension U_s aux bornes de R₂ ?", opts: ["4 V", "8 V", "6 V", "12 V"], ok: [0], expl: "U_s = 12 × 1 / (2 + 1) = 4 V." },
                { q: "Une résistance de 50 Ω est parcourue par 0,2 A. Puissance dissipée ?", opts: ["10 W", "2 W", "0,8 W", "250 W"], ok: [1], expl: "P = R·I² = 50 × 0,04 = 2 W." },
                { q: "En régime continu établi, un condensateur se comporte comme…", opts: ["Un interrupteur ouvert", "Un fil", "Une résistance nulle", "Une source de courant"], ok: [0], expl: "u constante donc i = C·du/dt = 0." },
                { q: "En régime continu établi, une bobine parfaite se comporte comme…", opts: ["Un interrupteur ouvert", "Un fil (court-circuit)", "Un condensateur", "Une source de tension"], ok: [1], expl: "i constant donc L·di/dt = 0." },
                { q: "Quelle grandeur ne peut pas varier brutalement dans un condensateur ?", opts: ["La tension à ses bornes", "Le courant qui le traverse", "Les deux", "Aucune"], ok: [0], expl: "Pour la bobine, c'est le courant." },
                { q: "Énergie stockée dans un condensateur de 100 µF chargé sous 20 V ?", opts: ["20 mJ", "2 mJ", "40 mJ", "0,2 J"], ok: [0], expl: "½ × 100 × 10⁻⁶ × 400 = 0,02 J." },
                { fig: fig('carac'), q: "Un générateur a E = 12 V et r = 2 Ω. Courant de court-circuit ?", opts: ["24 A", "6 A", "12 A", "0,17 A"], ok: [1], expl: "I_cc = E/r = 6 A." },
                { q: "Ce générateur (E = 12 V, r = 2 Ω) débite 1,5 A. Tension à ses bornes ?", opts: ["9 V", "12 V", "15 V", "3 V"], ok: [0], expl: "u = E − r·i = 12 − 3 = 9 V." },
                { calc: true, fig: fig('diviseur'), q: "Diviseur de tension : E = 15 V, R₁ = 1 kΩ, R₂ = 2 kΩ. Calculer U_s à vide. On branche une charge R_c = 2 kΩ aux bornes de R₂ : que devient U_s ?",
                    steps: ["À vide : U_s = 15 × 2 / (1 + 2) = 10 V.", "Avec la charge, R₂ et R_c sont en parallèle : R₂ // R_c = 2 × 2 / (2 + 2) = 1 kΩ.", "U_s = 15 × 1 / (1 + 1) = 7,5 V.", "La charge fait chuter la tension : un diviseur ne marche bien qu'avec une charge grande devant R₂."] }
            ]
        },
        {
            id: 'theoremes', code: 'CH3', titre: 'Théorèmes généraux', sous: 'Linéarité, Millman, superposition, Thévenin et Norton',
            sections: [
                S('Millman et superposition', 'network',
                    F(R`V_N = \dfrac{\sum_k \dfrac{V_k}{R_k} + \sum \eta}{\sum_k \dfrac{1}{R_k}}`, `Millman au nœud N · R<sub>k</sub> résistance de chaque branche, reliée au potentiel V<sub>k</sub> · η sources de courant qui arrivent au nœud`),
                    UL([
                        `<b>Circuit linéaire</b> (R, L, C, sources) : homogène et additif. La <b>puissance</b> n'est pas linéaire : on n'additionne pas les puissances de deux sources.`,
                        `<b>Superposition</b> : on calcule l'effet de chaque source seule, puis on additionne. Éteindre une source de tension : la remplacer par un <b>fil</b>. Une source de courant : par un <b>circuit ouvert</b>.`
                    ])),
                S('Thévenin et Norton', 'plug-zap',
                    FIGURE(fig('theNor'), `Vu de A et B, tout circuit linéaire équivaut à un générateur de Thévenin ou de Norton.`),
                    T(['Grandeur', 'Comment la trouver'], [
                        ['E<sub>Th</sub>', 'tension à vide entre A et B (charge débranchée)'],
                        ['R<sub>Th</sub> = R<sub>N</sub>', 'résistance vue entre A et B, toutes les sources éteintes'],
                        ['I<sub>N</sub>', 'courant de court-circuit entre A et B, = E<sub>Th</sub> / R<sub>Th</sub>']
                    ]),
                    NOTE('Méthode', `Thévenin d'un diviseur (E, R₁, R₂) vu aux bornes de R₂ : E<sub>Th</sub> = E·R₂/(R₁ + R₂) et R<sub>Th</sub> = R₁ // R₂. Ensuite, le courant dans une charge R<sub>c</sub> vaut E<sub>Th</sub> / (R<sub>Th</sub> + R<sub>c</sub>).`))
            ],
            qcm: [
                { q: "Pour appliquer la superposition, comment éteint-on une source de tension ?", opts: ["On la remplace par un fil", "On la remplace par un circuit ouvert", "On double sa valeur", "On la retire avec sa branche"], ok: [0], expl: "E = 0 : un fil. Une source de courant éteinte devient un circuit ouvert." },
                { q: "Peut-on additionner les puissances calculées avec chaque source seule ?", opts: ["Non, la puissance n'est pas linéaire", "Oui, toujours", "Seulement en continu", "Seulement avec deux sources"], ok: [0], expl: "On additionne les courants ou les tensions, puis on calcule la puissance." },
                { q: "Millman : deux branches, 12 V à travers 100 Ω et 0 V à travers 100 Ω, arrivent au nœud N. V_N ?", opts: ["6 V", "12 V", "0 V", "3 V"], ok: [0], expl: "(12/100 + 0/100) / (1/100 + 1/100) = 6 V." },
                { fig: fig('theNor'), q: "Comment obtient-on E_Th vu de A et B ?", opts: ["Tension entre A et B à vide", "Courant de court-circuit", "Résistance entre A et B", "Tension avec la charge branchée"], ok: [0], expl: "" },
                { fig: fig('theNor'), q: "Comment obtient-on R_Th ?", opts: ["Résistance vue entre A et B, sources éteintes", "E_Th × I_N", "Somme de toutes les résistances", "Résistance de la charge"], ok: [0], expl: "Ou E_Th / I_N." },
                { q: "Thévenin d'un diviseur E = 10 V, R₁ = R₂ = 1 kΩ, vu aux bornes de R₂ ?", opts: ["E_Th = 5 V, R_Th = 500 Ω", "E_Th = 10 V, R_Th = 2 kΩ", "E_Th = 5 V, R_Th = 2 kΩ", "E_Th = 10 V, R_Th = 500 Ω"], ok: [0], expl: "E_Th = 10 × 1/2 ; R_Th = R₁ // R₂ = 500 Ω." },
                { q: "Thévenin : E_Th = 9 V, R_Th = 3 Ω. Modèle de Norton équivalent ?", opts: ["I_N = 3 A, R_N = 3 Ω", "I_N = 27 A, R_N = 3 Ω", "I_N = 3 A, R_N = 1/3 Ω", "I_N = 9 A, R_N = 3 Ω"], ok: [0], expl: "I_N = E_Th / R_Th et R_N = R_Th." },
                { calc: true, q: "Deux générateurs E₁ = 12 V (avec R₁ = 100 Ω) et E₂ = 6 V (avec R₂ = 200 Ω) alimentent ensemble une résistance R₃ = 300 Ω (trois branches entre deux nœuds). Calculer la tension aux bornes de R₃ par Millman, puis le courant I₃.",
                    steps: ["Millman : U = (12/100 + 6/200 + 0/300) / (1/100 + 1/200 + 1/300).", "Numérateur : 0,12 + 0,03 = 0,15 A ; dénominateur : 0,01 + 0,005 + 0,00333 ≈ 0,01833 S.", "U ≈ 0,15 / 0,01833 ≈ 8,18 V.", "I₃ = U / R₃ ≈ 8,18 / 300 ≈ 27,3 mA (même résultat que l'exemple de la leçon, par superposition)."] },
                { calc: true, fig: fig('theNor'), q: "Un diviseur E = 24 V, R₁ = 3 kΩ, R₂ = 6 kΩ alimente une charge R_c branchée aux bornes de R₂. Donner le Thévenin vu de R_c, puis le courant et la tension pour R_c = 2 kΩ.",
                    steps: ["E_Th = 24 × 6 / (3 + 6) = 16 V.", "R_Th = R₁ // R₂ = 3 × 6 / 9 = 2 kΩ.", "I = E_Th / (R_Th + R_c) = 16 / 4 = 4 mA.", "U = R_c·I = 2 × 4 = 8 V (la moitié de E_Th, car R_c = R_Th)."] }
            ]
        },
        {
            id: 'sinus', code: 'CH4', titre: 'Les grandeurs sinusoïdales', sous: 'Amplitude, période, pulsation, déphasage, valeurs moyenne et efficace, Fresnel',
            sections: [
                S('Signal sinusoïdal', 'audio-waveform',
                    FIGURE(fig('sinus'), `X<sub>m</sub> amplitude, ω pulsation, φ₀ phase à l'origine.`),
                    F(R`x(t) = X_m\cos(\omega t + \varphi_0) \qquad \omega = 2\pi f = \dfrac{2\pi}{T}`, `X<sub>m</sub> amplitude (valeur max) · ω pulsation (rad/s) · f fréquence (Hz) · T = 1/f période (s) · ωt + φ₀ phase instantanée`),
                    NOTE('Lire un oscillogramme', `On compte des <b>divisions</b> (les grands carreaux), pas les petites graduations. Durée = nombre de divisions × base de temps (ms/div) ; tension = nombre de divisions × sensibilité (V/div).`)),
                S('Déphasage', 'move-horizontal',
                    FIGURE(fig('dephasage'), `x₂ passe par son maximum après x₁ : x₂ est en retard d'une durée Δt.`),
                    F(R`|\Delta\varphi| = 2\pi\,\dfrac{\Delta t}{T}`, `Δt décalage entre deux maximums successifs des deux courbes · on met le signe ensuite : <b>négatif</b> pour le signal en retard, positif pour celui en avance`),
                    T(['Δφ', 'Situation'], [
                        ['0', 'en phase'],
                        ['± π/2', 'en quadrature (Δt = T/4)'],
                        ['π', 'en opposition de phase (Δt = T/2)']
                    ])),
                S('Valeurs moyenne et efficace', 'gauge',
                    F(R`\langle x\rangle = \dfrac1T\int_0^T x(t)\,dt \qquad X_{eff} = \sqrt{\langle x^2\rangle} \qquad X_{eff} = \dfrac{X_m}{\sqrt2}\ \text{(sinus pur)}`, `Un sinus pur a une valeur moyenne nulle · avec une composante continue X₀ : X<sub>eff</sub>² = X₀² + X<sub>eff,∼</sub>²`),
                    NOTE('Exemple', `Le secteur 230 V est une valeur efficace : U<sub>m</sub> = 230 × √2 ≈ 325 V. La valeur efficace, c'est la tension continue qui chaufferait autant une résistance.`)),
                S('Fresnel et complexes', 'compass',
                    UL([
                        `<b>Fresnel</b> : x(t) = X<sub>m</sub>cos(ωt + φ) est représenté par un vecteur de longueur X<sub>m</sub> faisant l'angle φ avec l'axe horizontal.`,
                        `Somme de deux sinusoïdes de <b>même fréquence</b> : on additionne les vecteurs. Coordonnées : X<sub>m</sub>cos φ et X<sub>m</sub>sin φ.`,
                        `<b>Complexe</b> : X = X<sub>m</sub>e<sup>jφ</sup> (amplitude complexe), module X<sub>m</sub>, argument φ.`,
                        `Pour retrouver φ à partir des coordonnées : cos φ = (horizontale)/X<sub>m</sub>, et le signe de la verticale dit si φ est positif ou négatif.`
                    ]))
            ],
            qcm: [
                { q: "Le secteur a une fréquence de 50 Hz. Pulsation ?", opts: ["100π ≈ 314 rad/s", "50π rad/s", "50 rad/s", "2π/50 rad/s"], ok: [0], expl: "ω = 2πf = 100π." },
                { q: "Une période dure 4 ms. Fréquence ?", opts: ["250 Hz", "4 Hz", "25 Hz", "2,5 kHz"], ok: [0], expl: "f = 1/T = 1/0,004 = 250 Hz." },
                { fig: fig('sinus'), q: "u(t) = 10 cos(200πt + π/3). Fréquence et phase à l'origine ?", opts: ["100 Hz et π/3", "200 Hz et π/3", "200π Hz et π/3", "100 Hz et 10"], ok: [0], expl: "ω = 200π = 2πf donc f = 100 Hz ; φ₀ = π/3 ; l'amplitude est 10." },
                { q: "Valeur efficace d'une tension sinusoïdale d'amplitude 12 V ?", opts: ["≈ 8,49 V", "12 V", "≈ 17 V", "6 V"], ok: [0], expl: "12/√2." },
                { q: "Le secteur 230 V : valeur maximale de la tension ?", opts: ["≈ 325 V", "230 V", "≈ 163 V", "460 V"], ok: [0], expl: "230 est une valeur efficace : 230 × √2 ≈ 325 V." },
                { q: "Valeur moyenne d'une tension sinusoïdale pure ?", opts: ["0", "U_m/√2", "U_m/2", "U_m"], ok: [0], expl: "Les alternances positive et négative se compensent." },
                { fig: fig('dephasage'), q: "Deux sinus de période 4 ms sont décalés de 1 ms. Ils sont…", opts: ["En quadrature (π/2)", "En phase", "En opposition de phase", "Déphasés de π/4"], ok: [0], expl: "2π × 1/4 = π/2." },
                { fig: fig('dephasage'), q: "x₂ passe par son maximum juste après x₁. Alors…", opts: ["x₂ est en retard sur x₁", "x₂ est en avance sur x₁", "Ils sont en phase", "On ne peut rien dire"], ok: [0], expl: "Le premier à atteindre son maximum est en avance." },
                { q: "Une tension a une composante continue de 3 V et une partie sinusoïdale de valeur efficace 4 V. Valeur efficace totale ?", opts: ["5 V", "7 V", "1 V", "4 V"], ok: [0], expl: "U_eff² = 3² + 4² = 25." },
                { q: "Amplitude complexe de u(t) = 5 cos(ωt − π/4) ?", opts: ["5 e^(−jπ/4)", "5 e^(jπ/4)", "5", "−5j"], ok: [0], expl: "Module = amplitude, argument = phase à l'origine." },
                { calc: true, fig: fig('sinus'), q: "u(t) = 311 cos(100πt − π/6) (en V, t en s). Donner l'amplitude, la valeur efficace, la fréquence, la période et la valeur de u à t = 0.",
                    steps: ["Amplitude : U_m = 311 V ; valeur efficace : 311/√2 ≈ 220 V.", "ω = 100π rad/s, donc f = ω/2π = 50 Hz et T = 1/f = 20 ms.", "À t = 0 : u(0) = 311 cos(−π/6) = 311 × √3/2 ≈ 269 V."] },
                { calc: true, q: "Fresnel : u₁ = 6 cos(ωt) et u₂ = 8 cos(ωt + π/2) sont en série. Trouver l'amplitude, la phase et la valeur efficace de u = u₁ + u₂.",
                    steps: ["Vecteurs : u₁ → (6 ; 0), u₂ → (8 cos 90° ; 8 sin 90°) = (0 ; 8). Somme : (6 ; 8).", "Amplitude : U_m = √(6² + 8²) = 10 V.", "cos φ = 6/10 = 0,6, donc arccos(0,6) ≈ 53,13° ; la verticale (8) est positive, φ est positif : φ ≈ 53,13° ≈ 0,93 rad.", "u(t) = 10 cos(ωt + 0,93) et U_eff = 10/√2 ≈ 7,07 V. On n'additionne jamais les amplitudes directement (6 + 8 = 14 serait faux)."] }
            ]
        }
    ];

    // ==========================================
    // Anciens DS (DS n°2 de 2021, 2023 et 2025), regroupés par type d'exercice
    // ==========================================
    const ANNALES = [
        {
            id: 'vraifaux', code: 'V/F', titre: 'Vrai ou faux et relations des dipôles', sous: 'DS n°2 de 2023 et 2025 (exercices 1 et 2), DS n°2 de 2021 (exercice 1)',
            sections: [
                S('Le vrai / faux (2023 et 2025, mot pour mot)', 'list-checks',
                    P(`Huit affirmations, +0,25 par bonne réponse, −0,25 par erreur, rien si on ne répond pas. Le même exercice est tombé deux années de suite.`),
                    T(['Affirmation', 'Réponse', 'Pourquoi'], [
                        ['La convention récepteur impose des flèches de U et I dans le même sens', '<b>Faux</b>', 'récepteur : flèches opposées ; générateur : même sens'],
                        ['Un générateur de tension parfait a une résistance interne infinie', '<b>Faux</b>', 'elle est <b>nulle</b> : u = E quel que soit le courant'],
                        ['Un générateur de courant parfait a une résistance interne infinie', '<b>Vrai</b>', 'son courant ne dépend pas de la charge'],
                        ['Deux résistances en série sont parcourues par le même courant', '<b>Vrai</b>', ''],
                        ['La loi des nœuds vient de ce qu\'aucune charge ne s\'accumule en un nœud', '<b>Vrai</b>', 'conservation de la charge'],
                        ['L\'intensité du courant est toujours positive', '<b>Faux</b>', 'son signe dépend du sens de la flèche choisie'],
                        ['Un voltmètre se branche toujours en dérivation', '<b>Vrai</b>', 'l\'ampèremètre, lui, en série'],
                        ['Le théorème de Millman découle d\'une loi des mailles', '<b>Faux</b>', 'il découle de la <b>loi des nœuds</b>']
                    ])),
                S('Écrire la bonne relation (2021 et 2025)', 'sigma',
                    T(['Dipôle et flèches', 'Relation'], [
                        ['Condensateur, i arrive sur l\'armature qui porte q', 'i = dq/dt'],
                        ['Condensateur, u fléchée vers l\'armature q, i qui y arrive (récepteur)', 'q = C·u et <b>i = C du/dt</b>'],
                        ['Condensateur, u fléchée dans l\'autre sens', 'q = −C·u et <b>i = −C du/dt</b>'],
                        ['Bobine (L, r), u<sub>AB</sub> fléchée vers A, i de A vers B', '<b>u<sub>AB</sub> = L di/dt + r·i</b>'],
                        ['Résistance, U et I fléchés en sens opposés', 'U = R·I'],
                        ['Générateur (E, r) traversé « à l\'envers », U et I opposés (récepteur)', 'U = E + r·I']
                    ]),
                    NOTE('Méthode', `Toujours partir des flèches : en convention récepteur la relation s'écrit avec un +, et chaque flèche retournée ajoute un signe −. Sur la copie de 2025 que nous avons, ce point a été perdu faute d'avoir regardé les flèches.`))
            ],
            qcm: [
                { q: "Vrai ou faux : un générateur de tension parfait possède une résistance interne infinie.", opts: ["Faux : elle est nulle", "Vrai", "Vrai seulement en continu", "On ne peut pas savoir"], ok: [0], expl: "C'est le générateur de courant parfait qui a une résistance interne infinie.", src: 'DS n°2, 2023 et 2025' },
                { q: "Vrai ou faux : le théorème de Millman découle d'une loi des mailles.", opts: ["Faux : il découle de la loi des nœuds", "Vrai", "Il découle de la loi d'Ohm seule", "Il découle de la superposition"], ok: [0], expl: "On écrit la loi des nœuds au nœud étudié, avec la loi d'Ohm dans chaque branche.", src: 'DS n°2, 2023 et 2025' },
                { q: "Vrai ou faux : la convention récepteur impose des flèches de tension et de courant dans le même sens.", opts: ["Faux : elles sont opposées", "Vrai", "Seulement pour une résistance", "Seulement en alternatif"], ok: [0], expl: "Même sens : convention générateur.", src: 'DS n°2, 2023 et 2025' },
                { q: "Condensateur : la flèche de u pointe vers l'armature qui reçoit le courant i. Relation ?", opts: ["i = C du/dt", "i = −C du/dt", "u = C di/dt", "u = i·dq/dt"], ok: [0], expl: "Convention récepteur : q = Cu, puis i = dq/dt.", src: 'DS n°2, 2025' },
                { q: "Même condensateur, mais la flèche de u est retournée. Relation ?", opts: ["i = −C du/dt", "i = C du/dt", "u = −L di/dt", "i = 0"], ok: [0], expl: "La charge vaut alors q = −Cu.", src: 'DS n°2, 2025' },
                { q: "Bobine d'inductance L et de résistance r, u_AB fléchée vers A, i de A vers B. Relation ?", opts: ["u_AB = L di/dt + r·i", "u_AB = −L di/dt", "u_AB = r·i seulement", "i = L du/dt"], ok: [0], expl: "Convention récepteur.", src: 'DS n°2, 2025' }
            ]
        },
        {
            id: 'reseaux', code: 'Req', titre: 'Résistances équivalentes, diviseurs, puissance', sous: 'DS n°2 de 2021 (exercices 2 à 6), 2023 (exercices 2 et 5), 2025 (exercice 3)',
            sections: [
                S('Les sujets', 'file-text',
                    UL([
                        `<b>2023 et 2025</b> : R₁ = 100 Ω en série avec R₂ = 50 Ω, elle-même en parallèle sur R₃ + R₄ = 60 + 25 Ω. Req, puis (2023) courants dans R₁ et R₂ sous E = 10 V.`,
                        `<b>2021</b> : Req d'un réseau 100 Ω + (400 // 200 // 100) + 300 Ω ; un générateur 15 V qui alimente R₁ = 1 kΩ en parallèle sur 100 + 2 500 + 400 Ω (flécher, placer un voltmètre, U₃, I, I₁, I₂) ; cinq résistances de 1 kΩ en série sous 6 V ; deux résistances en parallèle et leurs puissances.`,
                        `<b>2023</b> : R₁ = 10 Ω // R₂ = 20 Ω sous E = 10 V, pendant 40 minutes : puissances, énergies, puissance du générateur.`
                    ]),
                    FIGURE(fig('diviseur'), `Diviseur de tension : on l'utilise sans calculer le courant.`)),
                S('Correction (calculs revérifiés)', 'check-check',
                    UL([
                        `<b>2023 / 2025</b> : R₂ // (R₃ + R₄) = 50 × 85 / 135 ≈ 31,5 Ω, Req ≈ <b>131,5 Ω</b>. Sous 10 V : I = 10 / 131,5 ≈ <b>76 mA</b> dans R₁, puis diviseur de courant I₂ = I × 85 / 135 ≈ <b>48 mA</b>.`,
                        `<b>2021</b> : 1/(1/400 + 1/200 + 1/100) = 400/7 ≈ 57,1 Ω, Req ≈ 100 + 57,1 + 300 = <b>457,1 Ω</b>.`,
                        `<b>2021</b> : R₁ est directement sous 15 V : U₁ = 15 V, I₁ = 15 mA. Branche de 3 kΩ : I₂ = 5 mA, U₃ = 2 500 × 0,005 = <b>12,5 V</b> (diviseur de tension). I = I₁ + I₂ = 20 mA (Req = 1 // 3 = 750 Ω). Voltmètre : en dérivation, borne V côté + .`,
                        `<b>2021</b> : 6 V sur 5 × 1 kΩ : I = 1,2 mA ; une résistance a 1,2 V à ses bornes, deux en ont 2,4 V.`,
                        `<b>2023</b> : I₂ = 10/20 = 0,5 A, P₂ = R₂·I₂² = <b>5 W</b>, W₂ = 5 × 2 400 s = <b>12 000 J</b> (40 min = 2 400 s, pas 24 000 !). P₁ = 10 W, W₁ = 24 000 J. Générateur : P = E·I = 10 × 1,5 = 15 W = 10 + 5 : <b>conservation de l'énergie</b>.`
                    ]),
                    NOTE('Pièges', `Convertir les minutes en secondes (× 60). En parallèle, la résistance équivalente est <b>plus petite</b> que la plus petite des résistances : un résultat plus grand signale une erreur.`))
            ],
            qcm: [
                { q: "R₁ = 100 Ω en série avec R₂ = 50 Ω, elle-même en parallèle sur R₃ + R₄ = 85 Ω. Req ?", opts: ["≈ 131,5 Ω", "235 Ω", "≈ 31,5 Ω", "185 Ω"], ok: [0], expl: "100 + 50 × 85 / 135.", src: 'DS n°2, 2023 et 2025' },
                { q: "Deux résistances de 20 Ω et 5 Ω en parallèle :", opts: ["4 Ω", "25 Ω", "12,5 Ω", "3,2 Ω"], ok: [0], expl: "100 / 25 = 4 Ω.", src: 'DS n°2, 2021' },
                { q: "Un circuit fonctionne pendant 40 minutes. Durée en secondes ?", opts: ["2 400 s", "24 000 s", "240 s", "4 000 s"], ok: [0], expl: "40 × 60.", src: 'DS n°2, 2023' },
                { q: "Deux résistances en parallèle reçoivent 10 W et 5 W. Puissance fournie par le générateur parfait ?", opts: ["15 W", "5 W", "10 W", "50 W"], ok: [0], expl: "Conservation de l'énergie : le générateur fournit ce que les récepteurs reçoivent.", src: 'DS n°2, 2023' },
                { q: "Cinq résistances identiques en série sous 6 V. Tension aux bornes de deux d'entre elles ?", opts: ["2,4 V", "1,2 V", "3 V", "6 V"], ok: [0], expl: "Chacune a 6/5 = 1,2 V.", src: 'DS n°2, 2021' },
                { calc: true, fig: fig('diviseur'), q: "Variante : R₁ = 200 Ω en série avec R₂ = 300 Ω, elle-même en parallèle sur R₃ + R₄ = 100 + 500 Ω, le tout sous E = 12 V. Calculer Req, le courant dans R₁, puis celui dans R₂ et la puissance reçue par R₁ pendant 10 minutes.",
                    steps: ["R₂ // (R₃ + R₄) = 300 × 600 / 900 = 200 Ω ; Req = 200 + 200 = 400 Ω.", "I = 12 / 400 = 30 mA (c'est le courant de R₁).", "Diviseur de courant : I₂ = I × 600 / 900 = 20 mA (et 10 mA dans R₃ + R₄).", "P₁ = R₁·I² = 200 × 0,03² = 0,18 W ; en 10 min = 600 s : W₁ = 0,18 × 600 = 108 J."] }
            ]
        },
        {
            id: 'expressions', code: 'U1 = ?', titre: 'Exprimer une tension avec les résistances', sous: 'DS n°2 de 2025, exercice 4 (5 points)',
            sections: [
                S('Le sujet', 'file-text',
                    P(`Quatre montages : (1) générateur idéal e avec R₁ et R₂ en série ; (2) le même avec une résistance R en parallèle sur l'ensemble ; (3) générateur réel (e, r) avec R₁ et R₂ en série ; (4) générateur réel avec (R₁ + R₂) en parallèle sur R. Dans chaque cas, exprimer U₁ (tension aux bornes de R₁) en fonction de e et des résistances.`)),
                S('Correction', 'check-check',
                    T(['Cas', 'U₁'], [
                        ['1. Générateur idéal, R₁ et R₂ en série', 'U₁ = e·R₁ / (R₁ + R₂)'],
                        ['2. Idem avec R en parallèle sur le tout', 'U₁ = e·R₁ / (R₁ + R₂) : R est directement sur la source idéale, elle ne change rien pour R₁ et R₂'],
                        ['3. Générateur réel (e, r), R₁ et R₂ en série', 'U₁ = e·R₁ / (r + R₁ + R₂)'],
                        ['4. Générateur réel, (R₁ + R₂) // R', 'U₁ = e·R·R₁ / (r(R + R₁ + R₂) + R(R₁ + R₂))']
                    ]),
                    UL([
                        `Cas 4 : on remplace (R₁ + R₂) // R par R<sub>eq</sub> = R(R₁ + R₂)/(R + R₁ + R₂), diviseur avec r : U = e·R<sub>eq</sub>/(r + R<sub>eq</sub>), puis diviseur entre R₁ et R₂ : U₁ = U·R₁/(R₁ + R₂).`
                    ]),
                    NOTE('Remarque du correcteur', `« Il faut simplifier » : écrire U₁ = e − e·R₂/(R₁ + R₂) n'a rapporté qu'une partie des points. Mettre au même dénominateur pour obtenir e·R₁/(R₁ + R₂).`))
            ],
            qcm: [
                { q: "Générateur idéal e, R₁ et R₂ en série. U₁ aux bornes de R₁ ?", opts: ["e·R₁/(R₁ + R₂)", "e·R₂/(R₁ + R₂)", "e·(R₁ + R₂)/R₁", "e"], ok: [0], expl: "Diviseur de tension.", src: 'DS n°2, 2025' },
                { q: "On ajoute une résistance R en parallèle sur une source de tension idéale qui alimente R₁ et R₂. U₁…", opts: ["Ne change pas", "Diminue", "Augmente", "Devient nulle"], ok: [0], expl: "La source idéale impose e à ses bornes quel que soit le courant.", src: 'DS n°2, 2025' },
                { q: "Générateur réel (e, r), R₁ et R₂ en série. U₁ ?", opts: ["e·R₁/(r + R₁ + R₂)", "e·R₁/(R₁ + R₂)", "e·r/(r + R₁ + R₂)", "(e − r)·R₁"], ok: [0], expl: "r fait partie du diviseur.", src: 'DS n°2, 2025' },
                { calc: true, q: "Variante : générateur réel e = 12 V, r = 2 Ω, alimentant R₁ = 4 Ω et R₂ = 6 Ω en série, ces deux-là étant en parallèle sur R = 10 Ω. Calculer U₁ avec la formule littérale, puis vérifier en passant par R_eq.",
                    steps: ["Formule : U₁ = e·R·R₁ / (r(R + R₁ + R₂) + R(R₁ + R₂)) = 12 × 10 × 4 / (2 × 20 + 10 × 10) = 480 / 140 ≈ 3,43 V.", "Vérification : R_eq = 10 × 10 / 20 = 5 Ω ; U = 12 × 5 / (2 + 5) ≈ 8,57 V.", "U₁ = 8,57 × 4 / 10 ≈ 3,43 V : même résultat."] }
            ]
        },
        {
            id: 'theoremesds', code: 'THÉO.', titre: 'Superposition, Millman, Thévenin', sous: 'DS n°2 de 2023 (exercices 3 et 4) et 2025 (exercice 5)',
            sections: [
                S('Les sujets', 'file-text',
                    UL([
                        `<b>2023, ex. 3</b> : E₁ = 10 V en série avec R₁ = 10 Ω, R₃ = 20 Ω au milieu, E₂ = 5 V en série avec R₂ = 5 Ω, masse en bas. Courant I dans R₃ par superposition, puis potentiel V<sub>A</sub> par Millman, et comparaison.`,
                        `<b>2023, ex. 4</b> : pont de résistances (R₁ = 400, R₄ = 300, R<sub>x</sub> = 100, R₂ + R₃ = 300, R₅ = 200 Ω) sous E = 10 V : exprimer puis calculer U<sub>BC</sub>.`,
                        `<b>2025, ex. 5</b> : une source de courant 3 A en parallèle sur 40 Ω, puis 20 Ω vers le point a ; entre a et b, une branche 120 Ω + source 120 V. Générateur de Thévenin vu par R<sub>L</sub>, puis tension aux bornes de R<sub>L</sub> = 100 Ω.`
                    ]),
                    FIGURE(fig('theNor'), `Thévenin et Norton : la base de l'exercice de 2025.`)),
                S('Correction (calculs revérifiés)', 'check-check',
                    UL([
                        `<b>2023, ex. 3</b> : E₁ seule : R<sub>eq</sub> = 10 + 20 // 5 = 14 Ω, I₁′ ≈ 0,714 A, I′ = 0,714 × 5/25 ≈ 0,143 A. E₂ seule : R<sub>eq</sub> = 5 + 10 // 20 ≈ 11,67 Ω, I₂″ ≈ 0,429 A, I″ = 0,429 × 10/30 ≈ 0,143 A. <b>I ≈ 0,286 A</b>. Millman : V<sub>A</sub> = (10/10 + 5/5 + 0/20)/(1/10 + 1/5 + 1/20) = 2/0,35 ≈ <b>5,71 V</b>, et V<sub>A</sub>/R₃ ≈ 0,286 A : même résultat.`,
                        `<b>2023, ex. 4</b> : Millman en B et en C : 19 V<sub>B</sub> = 30 + 12 V<sub>C</sub> et 11 V<sub>C</sub> = 20 + 6 V<sub>B</sub>. D'où V<sub>C</sub> = 560/137 ≈ 4,088 V, V<sub>B</sub> = 570/137 ≈ 4,161 V et <b>U<sub>BC</sub> ≈ 73 mV</b>.`,
                        `<b>2025, ex. 5</b> : sources éteintes (source de courant ouverte, source de tension en fil) : R<sub>Th</sub> = (40 + 20) // 120 = <b>40 Ω</b>. Norton → Thévenin : 3 A × 40 Ω = 120 V derrière 40 + 20 = 60 Ω ; Millman en a : (120/60 + 120/120)/(1/60 + 1/120) = <b>120 V</b> = E<sub>Th</sub>. Avec R<sub>L</sub> = 100 Ω : I = 120/140 ≈ 0,857 A, <b>U ≈ 85,7 V</b>.`
                    ]),
                    NOTE('Méthode', `Millman avec plusieurs inconnues (pont) : écrire l'équation à chaque nœud, puis résoudre le système. Penser à mettre la masse sur le point où arrivent le plus de branches.`))
            ],
            qcm: [
                { q: "Millman : branches 10 V / 10 Ω, 5 V / 5 Ω et 0 V / 20 Ω arrivent au nœud A. V_A ?", opts: ["≈ 5,71 V", "7,5 V", "15 V", "≈ 2,86 V"], ok: [0], expl: "(1 + 1 + 0) / (0,1 + 0,2 + 0,05) = 2 / 0,35.", src: 'DS n°2, 2023' },
                { q: "Pour trouver R_Th, que fait-on d'une source de courant ?", opts: ["On la remplace par un circuit ouvert", "On la remplace par un fil", "On la garde", "On la double"], ok: [0], expl: "Une source de tension éteinte devient un fil.", src: 'DS n°2, 2025' },
                { q: "Une source de 3 A en parallèle sur 40 Ω équivaut à…", opts: ["Une source de 120 V en série avec 40 Ω", "Une source de 13,3 V en série avec 40 Ω", "Une source de 120 V seule", "Une résistance de 120 Ω"], ok: [0], expl: "Norton → Thévenin : E = I_N × R.", src: 'DS n°2, 2025' },
                { q: "E_Th = 120 V, R_Th = 40 Ω, charge R_L = 100 Ω. Tension aux bornes de R_L ?", opts: ["≈ 85,7 V", "120 V", "≈ 34,3 V", "100 V"], ok: [0], expl: "120 × 100 / 140.", src: 'DS n°2, 2025' },
                { calc: true, fig: fig('theNor'), q: "Variante : source de courant 2 A en parallèle sur 30 Ω, puis 30 Ω vers le point a ; entre a et b, une branche 60 Ω + source 30 V (borne + côté a). Générateur de Thévenin vu de a et b, puis tension aux bornes d'une charge R_L = 30 Ω.",
                    steps: ["Sources éteintes : R_Th = (30 + 30) // 60 = 30 Ω.", "Norton → Thévenin : 2 × 30 = 60 V derrière 30 + 30 = 60 Ω.", "Millman en a (masse en b) : (60/60 + 30/60) / (1/60 + 1/60) = 1,5 / (1/30) = 45 V = E_Th.", "Avec R_L = 30 Ω : U = 45 × 30 / (30 + 30) = 22,5 V."] }
            ]
        },
        {
            id: 'oscillo', code: 'OSCILLO', titre: 'Oscillogramme : valeurs, période, déphasage', sous: 'DS n°2 de 2025, exercice 6 (6 points), chapitre 4',
            sections: [
                S('Le sujet', 'file-text',
                    P(`Deux tensions sinusoïdales u₁ (en gras) et u₂ sur l'écran d'un oscilloscope, 0,5 ms/div et 2 V/div. Pour chacune : valeur maximale, valeur efficace, période, pulsation. Laquelle est en avance ? Déphasage de u₁ par rapport à u₂, et expressions u₁(t), u₂(t) en prenant la phase de u₂ nulle.`),
                    FIGURE(fig('dephasage'), `Comme ici, la courbe qui passe par son maximum en premier est en avance.`),
                    NOTE('Lien avec le cours', `C'est l'exercice type du chapitre 4 : il faut savoir lire l'écran (divisions), passer de T à ω, de la valeur max à la valeur efficace, et donner le bon signe au déphasage. Voir la partie Cours, chapitre 4.`)),
                S('Correction (relevés faits par nous sur l\'oscillogramme)', 'check-check',
                    UL([
                        `Une période occupe 4 divisions : <b>T = 4 × 0,5 = 2 ms</b>, f = 500 Hz, <b>ω = 2π/T = 1 000π ≈ 3 142 rad/s</b> (même valeur pour les deux).`,
                        `u₁ : crête à 3,4 divisions, <b>U<sub>1max</sub> = 6,8 V</b>, U<sub>1eff</sub> = 6,8/√2 ≈ 4,81 V. u₂ : 2,6 divisions, <b>U<sub>2max</sub> = 5,2 V</b>, U<sub>2eff</sub> ≈ 3,68 V.`,
                        `u₂ passe par son maximum avant u₁ : <b>u₂ est en avance</b>, u₁ en retard d'environ Δt = 0,4 ms.`,
                        `Δφ<sub>u1/u2</sub> = −2π·Δt/T = −2π × 0,4/2 = <b>−2π/5 rad (−72°)</b>. u₂(t) = 5,2 cos(1 000πt) et u₁(t) = 6,8 cos(1 000πt − 2π/5).`
                    ]),
                    NOTE('Pièges vus sur une copie', `Compter des petites graduations (cinq par division) comme des divisions, ce qui multiplie tout par 5. Et donner un déphasage positif pour la tension qui est en retard.`))
            ],
            qcm: [
                { q: "Une période occupe 4 divisions à 0,5 ms/div. Pulsation ?", opts: ["1 000π rad/s", "500 rad/s", "200π rad/s", "4π rad/s"], ok: [0], expl: "T = 2 ms, ω = 2π/T.", src: 'DS n°2, 2025' },
                { q: "Crête à 3,4 divisions avec 2 V/div. Valeur efficace ?", opts: ["≈ 4,81 V", "6,8 V", "≈ 9,6 V", "3,4 V"], ok: [0], expl: "6,8/√2.", src: 'DS n°2, 2025' },
                { fig: fig('dephasage'), q: "u₂ passe par son maximum 0,4 ms avant u₁, T = 2 ms. Déphasage de u₁ par rapport à u₂ ?", opts: ["−2π/5", "+2π/5", "−π/5", "+π"], ok: [0], expl: "u₁ est en retard : déphasage négatif, 2π × 0,4/2.", src: 'DS n°2, 2025' },
                { calc: true, fig: fig('sinus'), q: "Variante : 1 ms/div et 5 V/div. u₁ a une crête à 2,8 divisions, u₂ à 2 divisions ; une période fait 5 divisions ; u₁ passe par son maximum 1 division après u₂. Donner T, ω, les valeurs efficaces, le déphasage de u₁ par rapport à u₂ et les expressions.",
                    steps: ["T = 5 × 1 = 5 ms, f = 200 Hz, ω = 2π/T = 400π ≈ 1 257 rad/s.", "U1max = 2,8 × 5 = 14 V, U1eff ≈ 9,90 V ; U2max = 10 V, U2eff ≈ 7,07 V.", "Δt = 1 ms et u₁ est en retard : Δφ = −2π × 1/5 = −2π/5.", "u₂(t) = 10 cos(400πt) et u₁(t) = 14 cos(400πt − 2π/5)."] }
            ]
        }
    ];

    // Le moteur ne mélange pas les propositions : permutation fixe, selon le texte de la question.
    const hacher = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    COURS.concat(ANNALES).forEach(ch => ch.qcm.forEach(q => {
        if (q.calc || !Array.isArray(q.opts)) return;
        let g = hacher(q.q);
        const ordre = q.opts.map((_, i) => i);
        for (let i = ordre.length - 1; i > 0; i--) { g = Math.imul(g ^ (g >>> 15), 2246822507) >>> 0; const j = g % (i + 1); [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; }
        const bons = new Set(q.ok);
        q.opts = ordre.map(i => q.opts[i]);
        q.ok = ordre.map((i, k) => (bons.has(i) ? k : -1)).filter(k => k >= 0);
    }));

    const FORMULES = [
        { titre: 'Chapitre 1', items: [
            [R`U_{AB} = V_A - V_B \qquad P = U\,I \qquad E = P\,t`, `Tension, puissance (W), énergie (J)`],
            [R`\sum i_{\text{entrants}} = \sum i_{\text{sortants}} \qquad \sum_{\text{maille}} \pm U = 0`, `Lois des nœuds et des mailles`]
        ] },
        { titre: 'Chapitre 2', items: [
            [R`u = R\,i \qquad P = R\,i^2 = \dfrac{u^2}{R}`, `Loi d'Ohm, effet Joule`],
            [R`R_{eq} = R_1 + R_2 \qquad \dfrac{1}{R_{eq}} = \dfrac{1}{R_1} + \dfrac{1}{R_2}`, `Série, parallèle`],
            [R`u_2 = u\,\dfrac{R_2}{R_1 + R_2} \qquad i_1 = i\,\dfrac{R_2}{R_1 + R_2}`, `Diviseurs de tension et de courant`],
            [R`i = C\,\dfrac{du}{dt} \qquad u = L\,\dfrac{di}{dt} \qquad E_C = \tfrac12 C u^2 \qquad E_L = \tfrac12 L i^2`, `Condensateur et bobine`],
            [R`u = E - r\,i`, `Générateur réel de tension`]
        ] },
        { titre: 'Chapitre 3', items: [
            [R`V_N = \dfrac{\sum V_k / R_k + \sum \eta}{\sum 1 / R_k}`, `Millman`],
            [R`I_N = \dfrac{E_{Th}}{R_{Th}} \qquad R_N = R_{Th}`, `Passage Thévenin ↔ Norton`]
        ] },
        { titre: 'Chapitre 4', items: [
            [R`x(t) = X_m\cos(\omega t + \varphi_0) \qquad \omega = 2\pi f = \dfrac{2\pi}{T}`, `Signal sinusoïdal`],
            [R`|\Delta\varphi| = 2\pi\,\dfrac{\Delta t}{T} \qquad X_{eff} = \dfrac{X_m}{\sqrt2}`, `Déphasage (négatif pour le signal en retard), valeur efficace d'un sinus`],
            [R`X_{eff}^2 = X_0^2 + X_{eff,\sim}^2 \qquad \underline X = X_m\,e^{j\varphi}`, `Composante continue + partie sinusoïdale · amplitude complexe`]
        ] }
    ];

    const PARTIES = {
        cours: { titre: 'Physique : cours des chapitres 1 à 4', court: 'Cours', icone: 'book-open', sujets: COURS,
            intro: `Grandeurs électriques et lois de Kirchhoff, dipôles, théorèmes généraux, grandeurs sinusoïdales. Les exercices reprennent le type des TD avec d'autres valeurs.` },
        annales: { titre: 'Physique : anciens DS', court: 'Anciens DS', icone: 'archive', sujets: ANNALES,
            intro: `Les DS n°2 de 2021, 2023 et 2025, regroupés par type d'exercice, avec leur correction (calculs refaits par nous) et une variante. Le vrai / faux est tombé à l'identique en 2023 et en 2025, et le même réseau de résistances deux fois : c'est un bon indice, pas une promesse.` }
    };

    RD.enregistrer({
        id: 'ds-2026-a1-phys', annee: 'a1', date: new Date(2026, 11, 12), dateAConfirmer: true, libelle: 'date à confirmer',
        titre: 'DS de physique (chapitres 1 à 4)', titrePage: 'Révision DS : physique (chapitres 1 à 4)',
        resume: "Examen blanc, cours des chapitres 1 à 4, exercices des anciens DS corrigés, formules.",
        intro: "Grandeurs électriques, dipôles, théorèmes généraux et grandeurs sinusoïdales. Les QCM se corrigent au clic (Entraînement) ou à la fin (Mode DS), les exercices montrent leur correction étape par étape.",
        parties: PARTIES, ordre: ['cours', 'annales'], filtres: [['tout', 'Tout'], ['cours', 'Cours'], ['annales', 'Anciens DS']],
        onglets: { cours: 'Cours', annales: 'Anciens DS' },
        chap: { cours: 'grandeurs', annales: 'vraifaux' },
        matiere: () => 'phys',
        formules: FORMULES, dsBlancs: []
    });
})();
