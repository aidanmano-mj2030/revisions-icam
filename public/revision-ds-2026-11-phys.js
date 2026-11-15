/*
 * Studicam : contenu de la Révision DS du samedi 21 novembre 2026 (A2, physique, chapitres 10 à 13).
 *
 * Chargé par index.html juste après revision-ds.js, qui l'affiche (voir « Ajouter une
 * Révision DS » dans le README). Deux parties :
 *   - Cours : composants à semi-conducteurs, redressement non commandé et commandé, hacheur,
 *     onduleur. Notions et QCM écrits par nous ; exercices du type des TD avec d'autres
 *     données, recalculées et vérifiées par script.
 *   - Anciens DS : les exercices des DS n°2 de 2022, 2024 et 2025 et de l'épreuve de sciences
 *     de janvier 2026, résumés avec leur correction (celle du professeur quand elle existe,
 *     sinon la nôtre, signalée), suivis de variantes avec d'autres valeurs.
 * Le DS de cette année n'est pas connu : les anciens sujets montrent ce qui revient, pas ce qui
 * tombera. Clés de progression : a2/ds/ds-2026-11-phys/<chapitre> et a2/ds/ds-2026-11-phys/examen-<filtre>.
 */
(function () {
    'use strict';
    const RD = window.StudicamRevisionDS;
    if (!RD) return;
    const { R, P, UL, NOTE, F, T, S } = RD.outils;

    // ==========================================
    // Cours : chapitres 10 à 13
    // ==========================================
    const COURS = [
        {
            id: 'semi', code: 'CH10', titre: 'Composants à semi-conducteurs', sous: 'Diode, Zener, thyristor, transistor, triac',
            sections: [
                S('Diode et thyristor', 'toggle-right',
                    T(['Composant', 'Conduit quand…', 'Se bloque quand…', 'Commandable ?'], [
                        ['<b>Diode</b>', 'V<sub>AK</sub> ≥ 0 (ou ≥ V<sub>s</sub>, tension de seuil, ≈ 0,6 à 0,7 V pour le silicium)', 'V<sub>AK</sub> &lt; 0 : le circuit impose le blocage', 'Non : unidirectionnelle, non commandable'],
                        ['<b>Thyristor</b>', 'V<sub>AK</sub> &gt; 0 <b>et</b> impulsion de courant sur la gâchette G', 'Le courant i<sub>AK</sub> s\'annule', 'À la fermeture seulement'],
                        ['<b>Triac</b>', 'Impulsion de gâchette, quel que soit le signe de la tension', 'Le courant passe sous le courant de maintien', 'À la fermeture, bidirectionnel (deux thyristors tête-bêche)'],
                        ['<b>Transistor</b> en commutation', 'i<sub>B</sub> ≥ i<sub>Bsat</sub> : saturé, interrupteur fermé', 'i<sub>B</sub> = 0 : bloqué, interrupteur ouvert', 'À la fermeture et à l\'ouverture']
                    ]),
                    P(`<b>Angle de retard à l'amorçage</b> : θ = ω·t<sub>0</sub> = 2π·t<sub>0</sub> / T, où t<sub>0</sub> est le retard de l'impulsion de gâchette après le début de chaque période. Une impulsion envoyée pendant que V<sub>AK</sub> &lt; 0 ne fait rien : le thyristor reste bloqué.`),
                    P(`<b>Diode Zener</b> : en direct, une diode normale. En inverse, elle conduit à une tension bien précise (tension Zener) sans être détruite : elle sert à fixer une tension.`),
                    NOTE('Piège', `Pour <b>bloquer</b> un thyristor, couper la gâchette ne suffit pas : il faut que son courant s'annule. Sur charge résistive, cela arrive tout seul à θ = π, quand la tension s'annule.`)),
                S('Transistor bipolaire', 'cpu',
                    F(R`i_E = i_B + i_C \qquad i_C = \beta\, i_B \ \text{(régime linéaire)} \qquad i_{B\,sat} = \dfrac{i_{C\,sat}}{\beta}`, `i<sub>B</sub> courant de base · i<sub>C</sub> courant de collecteur · i<sub>E</sub> courant d'émetteur (A) · β coefficient d'amplification en courant (sans unité, de quelques dizaines à quelques centaines)`),
                    UL([
                        `<b>NPN</b> : la flèche de l'émetteur sort (le courant de base <i>entre</i>). <b>PNP</b> : la flèche entre. La flèche indique le sens du courant dans la jonction base-émetteur.`,
                        `<b>Bloqué</b> : i<sub>B</sub> = 0, tous les courants sont nuls, V<sub>CE</sub> = tension d'alimentation de la charge.`,
                        `<b>Saturé</b> : i<sub>B</sub> ≥ i<sub>Bsat</sub>, i<sub>C</sub> = i<sub>Csat</sub> fixé par la charge, V<sub>CE</sub> = V<sub>CEsat</sub> ≈ 0 (valeur donnée par l'énoncé).`,
                        `<b>Coefficient de sursaturation</b> k : on prend i<sub>B</sub> = k·i<sub>Bsat</sub> (souvent k = 2) pour être sûr de saturer malgré la dispersion de β.`
                    ]),
                    F(R`R_B = \dfrac{U_{cde} - V_{BE\,sat}}{i_B}`, `Maille de la base · R<sub>B</sub> résistance de base (Ω) · U<sub>cde</sub> tension de commande (V) · V<sub>BEsat</sub> ≈ 0,7 V · i<sub>B</sub> courant de base voulu (A)`),
                    NOTE('Méthode du DS', `Calcule R<sub>B</sub>, puis choisis dans la liste la valeur normalisée <b>juste en dessous</b> : une résistance plus petite donne un courant de base plus grand, donc la saturation est garantie. R<sub>B</sub> calculée est un <b>maximum</b>.`))
            ],
            qcm: [
                { q: "Un thyristor est soumis à V_AK < 0. On envoie une impulsion sur sa gâchette. Que se passe-t-il ?",
                    opts: ["Il s'amorce", "Il reste bloqué", "Il se détruit", "Il conduit en sens inverse"], ok: [1],
                    expl: "Pour amorcer un thyristor, il faut à la fois V_AK > 0 et un courant de gâchette. C'est la question de cours du TD 11 (réponse b : u_AK > 0 et une impulsion i_g)." },
                { q: "Comment bloque-t-on un thyristor qui conduit ?",
                    opts: ["En supprimant le courant de gâchette", "En envoyant une impulsion négative sur la gâchette", "En annulant le courant i_AK qui le traverse", "En inversant la tension de gâchette"], ok: [2],
                    expl: "Le thyristor n'est commandable qu'à la fermeture. Il se bloque quand son courant s'annule, imposé par le reste du circuit." },
                { q: "Quel composant est un interrupteur commandable à la fermeture ET à l'ouverture ?",
                    opts: ["La diode", "Le thyristor", "Le transistor en commutation", "La diode Zener"], ok: [2],
                    expl: "Le transistor se ferme (saturé) avec i_B ≥ i_Bsat et s'ouvre (bloqué) avec i_B = 0. C'est pour ça qu'on l'utilise dans les hacheurs et les onduleurs." },
                { q: "Transistor NPN saturé : β = 50, i_Csat = 0,6 A. Quel est le courant de base minimal pour le saturer ?",
                    opts: ["30 A", "12 mA", "1,2 mA", "0,6 mA"], ok: [1],
                    expl: "i_Bsat = i_Csat / β = 0,6 / 50 = 0,012 A = 12 mA. Ce sont les valeurs de l'épreuve de sciences de janvier 2026 (porte de garage)." },
                { q: "On calcule R_B = 1 720 Ω pour saturer un transistor. Valeurs disponibles : 1,5 kΩ, 1,8 kΩ, 2,2 kΩ. Laquelle choisir ?",
                    opts: ["1,5 kΩ", "1,8 kΩ", "2,2 kΩ", "N'importe laquelle"], ok: [0],
                    expl: "R_B calculée est un maximum : une résistance plus grande donnerait un courant de base trop faible. On prend la valeur juste en dessous, 1,5 kΩ." },
                { q: "Un triac est équivalent à…",
                    opts: ["Deux diodes en série", "Deux thyristors montés tête-bêche (en antiparallèle)", "Un transistor et une diode de roue libre", "Une diode Zener et un thyristor"], ok: [1],
                    expl: "Le triac conduit dans les deux sens et s'amorce quel que soit le signe de la tension : il commande les deux alternances d'un courant alternatif." },
                { q: "Thyristor sur le réseau 50 Hz, amorcé 2,5 ms après le début de chaque période. Angle de retard θ ?",
                    opts: ["π/8", "π/4", "π/2", "45 rad"], ok: [1],
                    expl: "θ = 2π·t0 / T = 2π × 2,5 / 20 = π/4 (45°). C'est l'angle des CB et DS n°2 de 2025." },
                { calc: true, q: "Un relais de 12 V (bobine de 120 Ω) est commandé par un transistor NPN : β = 80, V_BEsat = 0,7 V, V_CEsat ≈ 0. La commande vaut 0 V ou 5 V. On veut un coefficient de sursaturation de 2. Calculer i_Csat, i_Bsat, le courant de base, puis R_B, et choisir parmi 1,5 kΩ, 1,8 kΩ et 2,2 kΩ.",
                    steps: ["Saturé : V_CE ≈ 0, toute la tension est sur la bobine : i_Csat = 12 / 120 = 0,100 A = 100 mA.", "i_Bsat = i_Csat / β = 0,100 / 80 = 1,25 mA.", "Sursaturation 2 : i_B = 2 × 1,25 = 2,5 mA.", "Maille de la base : R_B = (5 − 0,7) / 2,5·10⁻³ = 1 720 Ω. C'est un maximum.", "On choisit 1,5 kΩ (juste en dessous) : i_B = 4,3 / 1 500 ≈ 2,87 mA ≥ 2,5 mA, la saturation est assurée.", "Une diode de roue libre en parallèle sur la bobine protège le transistor à l'ouverture (même rôle que D6 dans la porte de garage)."] },
                { calc: true, q: "Une DEL (V_F = 2 V) est allumée par un transistor saturé (V_CEsat = 0,2 V) sous 5 V, avec une résistance R_C en série. On veut environ 15 mA. Calculer R_C et choisir entre 150 Ω, 180 Ω et 220 Ω.",
                    steps: ["Maille de sortie : 5 = R_C·I + V_F + V_CEsat.", "R_C = (5 − 2 − 0,2) / 0,015 ≈ 187 Ω.", "Avec 180 Ω : I = 2,8 / 180 ≈ 15,6 mA, le plus proche de 15 mA. Avec 220 Ω, I ≈ 12,7 mA, DEL moins lumineuse mais plus protégée : les deux se justifient si on l'écrit."] }
            ]
        },
        {
            id: 'graetz', code: 'CH11a', titre: 'Redressement non commandé : pont de Graetz', sous: 'Diodes passantes, valeurs moyenne et efficace, lissage',
            sections: [
                S('Le pont de diodes', 'git-merge',
                    P(`Le pont de Graetz (4 diodes) transforme une tension alternative v en une tension u toujours positive (double alternance). <b>Alternance positive</b> : D1 et D3 passantes, u = v. <b>Alternance négative</b> : D2 et D4 passantes, u = −v. À chaque instant, deux diodes conduisent et deux sont bloquées.`),
                    F(R`T_u = \dfrac{T}{2} \qquad f_u = 2f = 100\ \text{Hz}`, `T<sub>u</sub>, f<sub>u</sub> période et fréquence de la tension redressée · T, f celles du réseau (20 ms, 50 Hz)`),
                    F(R`\langle u \rangle = \dfrac{2\hat{V}}{\pi} \qquad U_{eff} = V = \dfrac{\hat{V}}{\sqrt{2}}`, `⟨u⟩ valeur moyenne de la tension redressée (V) · V̂ valeur maximale de v (V) · U<sub>eff</sub> valeur efficace de u, égale à celle de v car u² = v² (V)`),
                    F(R`\langle i \rangle = \dfrac{\langle u \rangle}{R} \qquad \langle i_D \rangle = \dfrac{\langle i \rangle}{2} \qquad P = \dfrac{U_{eff}^2}{R}`, `Charge résistive R (Ω) · chaque diode conduit une demi-période · P puissance reçue par R (W)`),
                    NOTE('Pièges', `La valeur efficace de u n'est pas ⟨u⟩ : U<sub>eff</sub> = V. La fréquence double (100 Hz). Avec un transformateur parfait, m = U<sub>2</sub> / U<sub>1</sub> (secondaire sur primaire).`)),
                S('Mesures et oscilloscope', 'activity',
                    T(['On veut mesurer…', 'Appareil', 'Mode'], [
                        ['La valeur moyenne ⟨u⟩', 'Voltmètre (magnétoélectrique ou numérique)', '<b>DC</b>'],
                        ['La valeur efficace d\'une tension sinusoïdale (U<sub>1</sub>, U<sub>2</sub>)', 'Voltmètre', '<b>AC</b>'],
                        ['La valeur efficace d\'une tension redressée (non sinusoïdale)', 'Voltmètre <b>TRMS</b>', '<b>AC+DC</b>']
                    ]),
                    P(`<b>Lire un oscillogramme</b> : amplitude = nombre de divisions × calibre (V/div) ; période = nombre de divisions × base de temps (ms/div). Exemple du DS « store » : 3,8 div × 10 V/div = 38 V.`),
                    P(`<b>Couplage DC</b> : on voit le signal entier. <b>Couplage AC</b> : la valeur moyenne est retirée (utile pour regarder une petite ondulation). Le mode <b>XY</b> sert aux caractéristiques, pas aux chronogrammes.`)),
                S('Lissage et régulation', 'waves',
                    UL([
                        `<b>Condensateur en parallèle</b> sur la charge : il se charge vite pendant les crêtes, se décharge lentement dans la charge. Plus C est grand, plus l'ondulation Δu est faible. Taux d'ondulation Δu / U<sub>max</sub>. Pour les <b>petits courants</b>.`,
                        `<b>Bobine en série</b> : lisse le <b>courant</b>, qui ne s'annule plus (conduction ininterrompue). Comme ⟨u<sub>L</sub>⟩ = 0, ⟨u⟩ = R·⟨i⟩. Pour les forts courants (moteurs).`,
                        `<b>Régulateur intégré de tension (RIT)</b> après le condensateur : il supprime l'ondulation restante et délivre une tension parfaitement continue (ex. 15 V ou 24 V).`
                    ]),
                    P(`Chaîne d'un « bloc secteur » : transformateur (abaisse la tension) → pont de diodes (redresse) → condensateur (lisse) → RIT (régule).`))
            ],
            qcm: [
                { q: "Pont de Graetz alimenté par v de valeur efficace 24 V. Valeur moyenne de la tension redressée ?",
                    opts: ["24 V", "33,9 V", "21,6 V", "15,3 V"], ok: [2],
                    expl: "V̂ = 24√2 ≈ 33,9 V, puis ⟨u⟩ = 2V̂/π ≈ 21,6 V. C'est l'exercice 2 des DS n°2 de 2024 et 2025. 15,3 V serait V̂/π (simple alternance)." },
                { q: "Pendant l'alternance positive d'un pont de Graetz, quelles diodes conduisent ?",
                    opts: ["D1 et D2", "D1 et D3", "D2 et D4", "Les quatre"], ok: [1],
                    expl: "Convention du cours : D1 et D3 passantes, u = v. Pendant l'alternance négative, D2 et D4, u = −v. Vérifie toujours la numérotation du schéma de l'énoncé." },
                { q: "Le réseau est à 50 Hz. Fréquence de la tension en sortie d'un pont de Graetz ?",
                    opts: ["25 Hz", "50 Hz", "100 Hz", "0 Hz, elle est continue"], ok: [2],
                    expl: "La tension redressée reproduit chaque alternance : sa période est T/2 = 10 ms, donc 100 Hz (question 5 du DS « store »)." },
                { q: "Tension v sinusoïdale de valeur efficace 26,9 V, redressée par un pont de diodes. Valeur efficace de u ?",
                    opts: ["26,9 V", "17,1 V", "24,2 V", "38 V"], ok: [0],
                    expl: "u² = v² à chaque instant, donc même valeur efficace : U = 26,9 V. 24,2 V est la valeur moyenne, pas l'efficace." },
                { q: "Avec quel appareil et quel mode mesure-t-on la valeur moyenne ⟨u⟩ d'une tension redressée ?",
                    opts: ["Voltmètre en mode AC", "Voltmètre en mode DC", "Ampèremètre en mode AC+DC", "Oscilloscope en mode XY"], ok: [1],
                    expl: "Le mode DC donne la valeur moyenne. Le mode AC+DC d'un voltmètre TRMS donnerait la valeur efficace vraie." },
                { q: "Quel composant ajoute-t-on en série avec un moteur pour lisser son courant ?",
                    opts: ["Un condensateur", "Une bobine (inductance)", "Une diode Zener", "Une résistance"], ok: [1],
                    expl: "La bobine s'oppose aux variations de courant. Le condensateur, lui, se place en parallèle et lisse la tension. Question 7 du DS « store »." },
                { q: "Quel est le rôle du régulateur intégré de tension placé après le condensateur ?",
                    opts: ["Redresser la tension", "Abaisser la tension du réseau", "Supprimer l'ondulation résiduelle pour obtenir une tension parfaitement continue", "Protéger les diodes des surtensions"], ok: [2],
                    expl: "Le condensateur laisse une ondulation ; le RIT délivre une tension constante (question 7 de la porte de garage, janvier 2026)." },
                { calc: true, q: "Un transformateur parfait 230 V / 18 V alimente un pont de Graetz débitant sur R = 47 Ω. Calculer m, V̂, ⟨u⟩, ⟨i⟩, ⟨i_D⟩ et la puissance reçue par R.",
                    steps: ["m = U2 / U1 = 18 / 230 ≈ 0,078.", "V̂ = 18√2 ≈ 25,5 V.", "⟨u⟩ = 2V̂/π = 2 × 25,46 / π ≈ 16,2 V.", "⟨i⟩ = ⟨u⟩ / R = 16,2 / 47 ≈ 0,345 A ; chaque diode conduit une alternance sur deux : ⟨i_D⟩ ≈ 0,172 A.", "La valeur efficace de u vaut 18 V (u² = v²), donc P = U² / R = 18² / 47 ≈ 6,89 W. Piège : ⟨u⟩²/R ≈ 5,6 W est faux."] },
                { calc: true, q: "Oscillogramme de u2 : 4,2 divisions crête, calibre 5 V/div ; une période dure 4 divisions à 5 ms/div. Calculer U2max, U2, f, puis la valeur moyenne après un pont de diodes parfait.",
                    steps: ["U2max = 4,2 × 5 = 21 V.", "U2 = 21 / √2 ≈ 14,8 V.", "T = 4 × 5 = 20 ms, donc f = 1 / 0,020 = 50 Hz.", "⟨u⟩ = 2 × 21 / π ≈ 13,4 V, à 100 Hz."] }
            ]
        },
        {
            id: 'commande', code: 'CH11b', titre: 'Redressement commandé : thyristors et pont mixte', sous: 'Angle θ, tension moyenne réglable, moteur CC',
            sections: [
                S('Les trois montages', 'sliders-horizontal',
                    T(['Montage', 'Valeur moyenne de u', 'À retenir'], [
                        ['Pont de diodes (θ = 0)', R`$U_0 = \dfrac{2\hat{V}}{\pi}$`, 'Non commandé'],
                        ['Thyristors sur charge résistive', R`$\langle u \rangle = \dfrac{\hat{V}}{\pi}(1 + \cos\theta)$`, 'Le thyristor se bloque à θ = π, quand i s\'annule'],
                        ['Pont tout thyristors, charge inductive (i constant)', R`$\langle u \rangle = \dfrac{2\hat{V}}{\pi}\cos\theta$`, 'Négative si θ &gt; 90° : fonctionnement en onduleur assisté'],
                        ['Pont mixte (2 thyristors, 2 diodes)', R`$\langle u \rangle = \dfrac{\hat{V}}{\pi}(1 + \cos\theta)$`, 'Phases de roue libre : u = 0, le courant continue grâce à la bobine']
                    ]),
                    P(`L'intérêt : régler la tension moyenne, donc la vitesse d'un moteur à courant continu. θ (parfois noté α) est l'angle de retard à l'amorçage : θ = ω·t<sub>0</sub>.`),
                    NOTE('Repère', `Sur le document réponse, on écrit pour chaque intervalle les composants passants et le signe de la puissance. Pont mixte du DS n°2 de 2025 (thyristors en haut, diodes en bas, θ = π/4) : de π/4 à π, T1 et D2 conduisent (u = v, alimentation) ; de π à 5π/4, D1 et D2 (roue libre, u = 0) ; de 5π/4 à 2π, T3 et D1 (u = −v). Vérifie toujours la disposition des composants du schéma.`)),
                S('Avec un moteur à courant continu', 'cog',
                    F(R`\langle u \rangle = E + R\,I \qquad E = k\,n`, `⟨u⟩ tension moyenne aux bornes de l'induit (V) · E f.é.m. du moteur (V) · R résistance de l'induit, plus celle de la bobine s'il y en a une (Ω) · I courant constant (A) · n vitesse (tr/min) · k constante (V par tr/min)`),
                    P(`On passe la loi des mailles aux valeurs moyennes : la bobine de lissage disparaît car ⟨u<sub>L</sub>⟩ = 0. Puis E = ⟨u⟩ − R·I et n = E / k.`),
                    P(`<b>Puissances</b> : P<sub>em</sub> = E·I (puissance électromagnétique) ; P<sub>a</sub> = ⟨u⟩·I absorbée par l'induit si I est constant ; pertes Joule R·I². À couple constant, I est constant : le couple électromagnétique vaut C<sub>em</sub> = k<sub>Φ</sub>·I, donc doubler le couple double I.`))
            ],
            qcm: [
                { q: "Pont mixte alimenté par v de valeur efficace 230 V, θ = 60°. Valeur moyenne de u ?",
                    opts: ["103,5 V", "155,3 V", "179,3 V", "207,1 V"], ok: [1],
                    expl: "V̂ = 230√2 ≈ 325,3 V ; ⟨u⟩ = V̂/π × (1 + cos 60°) = 103,5 × 1,5 ≈ 155,3 V. 207,1 V est 2V̂/π, le pont de diodes." },
                { q: "Pont tout thyristors sur charge très inductive : quand la tension moyenne devient-elle négative ?",
                    opts: ["Jamais", "Dès que θ > 0", "Quand θ > 90°", "Quand θ > 180°"], ok: [2],
                    expl: "⟨u⟩ = (2V̂/π)·cos θ, négative pour θ > 90° : l'énergie revient vers le réseau. Un pont mixte, lui, ne donne jamais une tension moyenne négative." },
                { q: "Pourquoi la tension u d'un pont mixte s'annule-t-elle pendant certaines phases ?",
                    opts: ["Les thyristors sont détruits", "Les diodes assurent une roue libre : la charge n'est plus reliée au réseau, la bobine maintient le courant", "Le transformateur est saturé", "La gâchette est coupée"], ok: [1],
                    expl: "Phase de roue libre : deux composants en série court-circuitent la charge (les deux diodes dans le pont mixte du DS de 2025), u = 0, l'énergie stockée dans la bobine entretient le courant." },
                { q: "Moteur CC derrière un redresseur : ⟨u⟩ = 160 V, R = 0,5 Ω, I = 20 A. Quelle est la f.é.m. E ?",
                    opts: ["170 V", "160 V", "150 V", "140 V"], ok: [2],
                    expl: "⟨u⟩ = E + R·I, donc E = 160 − 0,5 × 20 = 150 V." },
                { q: "Dans la loi des mailles d'un moteur avec bobine de lissage, pourquoi la tension de la bobine disparaît-elle en valeur moyenne ?",
                    opts: ["Car L est négligeable", "Car en régime périodique ⟨u_L⟩ = L·⟨di/dt⟩ = 0", "Car le courant est nul", "Car la bobine est en parallèle"], ok: [1],
                    expl: "Le courant revient à la même valeur à chaque période : la moyenne de sa dérivée est nulle, donc ⟨u_L⟩ = 0." },
                { calc: true, q: "Un pont mixte est alimenté par v de valeur efficace 230 V, 50 Hz, avec θ = 60°. Il alimente un moteur CC : R = 0,5 Ω, I = 20 A constant grâce à la bobine, E = 0,1·n (n en tr/min). Calculer t0, ⟨u⟩, E, n et la puissance électromagnétique.",
                    steps: ["θ = 60° = π/3, donc t0 = θ / ω = (π/3) / (100π) ≈ 3,33 ms (T/6).", "V̂ = 230√2 ≈ 325,3 V ; ⟨u⟩ = V̂/π × (1 + cos 60°) ≈ 155,3 V.", "E = ⟨u⟩ − R·I = 155,3 − 0,5 × 20 = 145,3 V.", "n = E / 0,1 ≈ 1 453 tr/min.", "Pem = E·I = 145,3 × 20 ≈ 2 906 W."] },
                { calc: true, q: "Pont tout thyristors, v de valeur efficace 230 V, courant constant. Calculer ⟨u⟩ pour θ = 30° puis θ = 120°, et commenter.",
                    steps: ["2V̂/π = 2 × 325,3 / π ≈ 207,1 V.", "θ = 30° : ⟨u⟩ = 207,1 × cos 30° ≈ 179,3 V, fonctionnement en redresseur.", "θ = 120° : ⟨u⟩ = 207,1 × cos 120° ≈ −103,5 V : tension moyenne négative avec un courant toujours positif, la puissance revient vers le réseau (onduleur assisté). Il faut une source capable de fournir cette énergie, par exemple une machine qui freine."] }
            ]
        },
        {
            id: 'hacheur', code: 'CH12', titre: 'Hacheur série et hacheur 4 quadrants', sous: 'Rapport cyclique, roue libre, sens de rotation',
            sections: [
                S('Hacheur série (dévolteur)', 'zap',
                    P(`Convertisseur <b>continu → continu</b>. L'interrupteur K (transistor) est fermé de 0 à αT, ouvert de αT à T. α est le <b>rapport cyclique</b> (0 ≤ α ≤ 1). f = 1/T est la fréquence de hachage.`),
                    F(R`\langle v \rangle = \alpha\, U`, `⟨v⟩ tension moyenne aux bornes de la charge (V) · α rapport cyclique · U tension de la source continue (V)`),
                    UL([
                        `Charge inductive : une <b>diode de roue libre</b> en parallèle sur la charge laisse passer le courant de la bobine quand K s'ouvre. Sans elle, une surtension détruirait le transistor.`,
                        `K fermé : v = U, i<sub>K</sub> = i, i<sub>D</sub> = 0, le courant croît. K ouvert : v = 0, i<sub>D</sub> = i, le courant décroît.`,
                        `Ondulation Δi = I<sub>max</sub> − I<sub>min</sub> : pour la diminuer, augmenter <b>L</b> et/ou la <b>fréquence</b> f. Courant moyen I = (I<sub>max</sub> + I<sub>min</sub>) / 2.`
                    ]),
                    F(R`\langle i_K \rangle = \alpha\, I \qquad \langle i_D \rangle = (1 - \alpha)\, I`, `⟨i<sub>K</sub>⟩ courant moyen dans le transistor (A) · ⟨i<sub>D</sub>⟩ courant moyen dans la diode (A) · I courant moyen dans la charge (A)`),
                    F(R`\alpha U = E + R\,I \qquad n = \alpha\, n_M`, `Moteur CC · E f.é.m. (V) · R résistance de l'induit (Ω) · I courant (A) · si R est négligée, E = αU et la vitesse n est proportionnelle à α (n<sub>M</sub> vitesse pour α = 1)`)),
                S('Hacheurs réversibles et pont en H', 'arrow-left-right',
                    T(['Hacheur', 'Composants', 'Tension moyenne', 'Ce qu\'il permet'], [
                        ['Réversible en courant', 'T1, D2 (moteur) ou T2, D1 (génératrice)', 'αU &gt; 0', 'Freinage avec récupération, un seul sens de rotation'],
                        ['Réversible en tension', 'T1 et T2 commandés ensemble, D1 et D2', '(2α − 1)U', 'Inverser la tension, i reste positif'],
                        ['<b>4 quadrants (pont en H)</b>', 'T1 à T4, D1 à D4', '(2α − 1)U en commande simultanée', 'Les deux sens de rotation, en moteur ou en génératrice']
                    ]),
                    F(R`\langle u \rangle = (2\alpha - 1)\,U`, `Pont en H : u = +U pendant αT (une diagonale commandée, T1 et T4 sur le schéma du robot RICA IV), u = −U pendant (1 − α)T ·⟨u⟩ &gt; 0 si α &gt; 0,5 (marche avant), ⟨u⟩ &lt; 0 si α &lt; 0,5 (marche arrière), ⟨u⟩ = 0 pour α = 0,5 (arrêt)`),
                    NOTE('Méthode du DS (RICA IV)', `Pour remplir le tableau des composants passants avec i &gt; 0 : quand les transistors d'une diagonale sont commandés, ce sont eux qui conduisent (u = +U). Quand ils sont bloqués, le courant, qui ne peut pas s'arrêter dans la bobine du moteur, passe par les <b>diodes de l'autre diagonale</b> (u = −U), même si ces transistors-là sont commandés.`))
            ],
            qcm: [
                { q: "Hacheur série : U = 48 V, α = 0,75. Tension moyenne aux bornes de la charge ?",
                    opts: ["12 V", "36 V", "48 V", "64 V"], ok: [1],
                    expl: "⟨v⟩ = α·U = 0,75 × 48 = 36 V. Le hacheur série est abaisseur : ⟨v⟩ ≤ U." },
                { q: "Quel est le rôle de la diode de roue libre d'un hacheur série sur charge inductive ?",
                    opts: ["Redresser la tension", "Laisser passer le courant de la bobine quand le transistor s'ouvre, pour éviter une surtension", "Augmenter la tension de sortie", "Limiter le courant de démarrage"], ok: [1],
                    expl: "Le courant d'une bobine ne peut pas s'interrompre : sans chemin, une surtension (un arc) apparaîtrait aux bornes du transistor et le détruirait." },
                { q: "Comment réduire l'ondulation du courant dans un moteur alimenté par un hacheur ?",
                    opts: ["Diminuer L", "Augmenter L ou la fréquence de hachage", "Diminuer la fréquence de hachage", "Augmenter la tension U"], ok: [1],
                    expl: "Le cours le dit : pour diminuer Δi, augmenter l'inductance et/ou la fréquence." },
                { q: "Pont en H (hacheur 4 quadrants) : U = 24 V, α = 0,3. Valeur moyenne de u et sens de marche ?",
                    opts: ["7,2 V, marche avant", "−9,6 V, marche arrière", "9,6 V, marche avant", "−7,2 V, marche arrière"], ok: [1],
                    expl: "⟨u⟩ = (2α − 1)U = (0,6 − 1) × 24 = −9,6 V : négative, donc le moteur tourne dans l'autre sens (marche arrière du robot RICA IV)." },
                { q: "Pont en H : pour quelles valeurs de α le robot fait-il marche arrière ?",
                    opts: ["0,5 < α ≤ 1", "0 ≤ α < 0,5", "α = 0,5", "α > 1"], ok: [1],
                    expl: "⟨u⟩ = (2α − 1)U < 0 ⇔ α < 0,5. Question 5 des DS n°2 de 2024 et 2025." },
                { q: "Hacheur série, I = 10 A dans le moteur, α = 0,75. Courant moyen dans la diode de roue libre ?",
                    opts: ["7,5 A", "2,5 A", "10 A", "0 A"], ok: [1],
                    expl: "La diode conduit pendant (1 − α)T : ⟨i_D⟩ = (1 − α)·I = 0,25 × 10 = 2,5 A. Le transistor porte ⟨i_K⟩ = 7,5 A." },
                { q: "Pourquoi fait-on varier le rapport cyclique α d'un hacheur qui alimente un moteur ?",
                    opts: ["Pour changer la fréquence du réseau", "Pour régler la tension moyenne, donc la vitesse (et, avec un pont en H, le sens)", "Pour protéger le transistor", "Pour charger la batterie"], ok: [1],
                    expl: "La f.é.m., donc la vitesse, suit la tension moyenne : E ≈ αU (hacheur série) ou (2α − 1)U (pont en H)." },
                { calc: true, q: "Hacheur série : U = 48 V, f = 2 kHz, α = 0,75, moteur CC avec R = 0,8 Ω, courant constant I = 10 A, E = 0,02·n (n en tr/min). Calculer T, la durée de fermeture, ⟨v⟩, E, n, ⟨i_K⟩ et ⟨i_D⟩.",
                    steps: ["T = 1 / f = 1 / 2 000 = 0,5 ms ; K est fermé pendant αT = 0,375 ms.", "⟨v⟩ = αU = 0,75 × 48 = 36 V.", "⟨v⟩ = E + R·I, donc E = 36 − 0,8 × 10 = 28 V.", "n = E / 0,02 = 1 400 tr/min.", "⟨i_K⟩ = αI = 7,5 A et ⟨i_D⟩ = (1 − α)I = 2,5 A ; leur somme redonne I = 10 A."] },
                { calc: true, q: "Pont en H alimenté par une batterie de 36 V. Le moteur doit recevoir ⟨u⟩ = 9 V. Calculer α. Que vaut α pour ⟨u⟩ = −9 V ? Pour l'arrêt ?",
                    steps: ["⟨u⟩ = (2α − 1)U, donc α = (⟨u⟩/U + 1) / 2.", "⟨u⟩ = 9 V : α = (0,25 + 1) / 2 = 0,625.", "⟨u⟩ = −9 V : α = (−0,25 + 1) / 2 = 0,375 (marche arrière).", "Arrêt : ⟨u⟩ = 0, donc α = 0,5. Ce n'est pas α = 0, qui donnerait ⟨u⟩ = −36 V, pleine vitesse en arrière."] }
            ]
        },
        {
            id: 'onduleur', code: 'CH13', titre: 'Onduleur monophasé', sous: 'Commande symétrique et décalée, charge inductive',
            sections: [
                S('Principe', 'repeat',
                    P(`Convertisseur <b>continu → alternatif</b>. Autonome : il impose sa fréquence à la charge. Montage à 2 interrupteurs (deux sources V) ou en <b>pont à 4 interrupteurs</b> (une seule source E).`),
                    T(['Commande', 'Tension u aux bornes de la charge', 'Valeur efficace'], [
                        ['<b>Symétrique</b> : K1 et K3 fermés pendant T/2, puis K2 et K4', '+E pendant T/2, −E pendant T/2 (créneau)', 'U<sub>eff</sub> = E'],
                        ['<b>Décalée</b> : commande de K1, K4 décalée de τ par rapport à K3, K2', '0 pendant les phases où K3 et K4 (ou K1 et K2) conduisent', R`$U_{eff} = E\sqrt{1 - \dfrac{2\tau}{T}}$, réglable de 0 à E`]
                    ]),
                    P(`La valeur moyenne de u est nulle. Sur charge résistive, i = u / R, P = U<sub>eff</sub>² / R. Si les interrupteurs sont parfaits, la puissance fournie par la source E égale celle reçue par la charge : rendement de 100 %.`),
                    P(`<b>MLI</b> (modulation de largeur d'impulsion) : des impulsions de largeurs calculées, suivies d'un filtre passe-bas, recréent une sinusoïde presque parfaite.`)),
                S('Charge inductive et applications', 'battery-charging',
                    UL([
                        `Le courant d'une bobine est continu dans le temps : quand u change de signe, i garde un moment son signe. Chaque interrupteur doit être <b>bidirectionnel</b> : transistor H avec une diode D en antiparallèle.`,
                        `Interrupteur commandé, courant de signe opposé à u : c'est sa <b>diode</b> qui conduit, p = u·i &lt; 0, la charge rend de l'énergie à la source (récupération).`,
                        `Courant du même signe que u : c'est le <b>transistor</b> qui conduit, p &gt; 0.`,
                        `Applications : alimentation de secours (onduleur informatique sur batterie), onduleur solaire, <b>variation de vitesse</b> d'un moteur synchrone ou asynchrone (redresseur puis onduleur à fréquence réglable).`
                    ]),
                    NOTE('Piège', `Les sources de tension doivent accepter un courant en sens inverse pendant les phases de récupération.`))
            ],
            qcm: [
                { q: "Quelle conversion réalise un onduleur autonome ?",
                    opts: ["Alternatif → continu", "Continu → continu", "Continu → alternatif", "Alternatif → alternatif"], ok: [2],
                    expl: "Redresseur : alternatif → continu. Hacheur : continu → continu. Onduleur : continu → alternatif." },
                { q: "Onduleur en pont, commande symétrique, E = 48 V, charge R = 24 Ω. Valeur efficace de u et puissance reçue par R ?",
                    opts: ["48 V et 96 W", "34 V et 48 W", "24 V et 24 W", "0 V et 0 W"], ok: [0],
                    expl: "En commande symétrique u vaut ±E : U_eff = E = 48 V, P = 48² / 24 = 96 W. La valeur moyenne, elle, est nulle." },
                { q: "Commande décalée : quel est l'intérêt par rapport à la commande symétrique ?",
                    opts: ["Supprimer les diodes", "Régler la valeur efficace entre 0 et E et se rapprocher d'une sinusoïde", "Augmenter la tension au-delà de E", "Rendre la tension continue"], ok: [1],
                    expl: "U_eff = E√(1 − 2τ/T) : le décalage τ règle la valeur efficace, et les paliers à 0 rapprochent la forme d'une sinusoïde." },
                { q: "Onduleur sur charge inductive : u = +E et i < 0. Quel composant conduit ?",
                    opts: ["Le transistor H1", "La diode D1 en antiparallèle de H1", "La diode D2", "Aucun"], ok: [1],
                    expl: "K1 est commandé (u = +E), mais le courant est négatif : il passe par la diode D1. p = u·i < 0, la charge rend de l'énergie." },
                { q: "Citer une application des onduleurs :",
                    opts: ["Le chargeur de téléphone", "L'alimentation de secours d'un serveur informatique", "Le pont de Graetz", "La diode de roue libre"], ok: [1],
                    expl: "En cas de coupure, l'onduleur fabrique une tension alternative à partir des batteries. Autres : onduleur solaire, variateur de vitesse." },
                { calc: true, q: "Onduleur en pont, E = 200 V, R = 100 Ω, commande décalée avec τ = T/6. Calculer la valeur efficace de u, celle de i et la puissance reçue par la charge. Comparer avec la commande symétrique.",
                    steps: ["2τ/T = 1/3, donc U_eff = 200 × √(1 − 1/3) = 200 × √(2/3) ≈ 163,3 V.", "I_eff = U_eff / R ≈ 1,63 A.", "P = U_eff² / R = 200² × (2/3) / 100 ≈ 266,7 W.", "En commande symétrique : U_eff = 200 V et P = 400 W. Le décalage permet donc de régler la puissance."] },
                { calc: true, q: "Onduleur en pont, commande symétrique, E = 24 V, R = 100 Ω, interrupteurs parfaits, période 20 ms. Calculer f, U_eff, I_eff, P, le courant moyen débité par le générateur et le rendement.",
                    steps: ["f = 1 / 0,020 = 50 Hz.", "U_eff = E = 24 V ; I_eff = 24 / 100 = 0,24 A ; P = 24² / 100 = 5,76 W.", "Le générateur débite toujours dans le même sens un courant de 0,24 A (i_G = |i|) : ⟨i_G⟩ = 0,24 A et P_G = E·⟨i_G⟩ = 5,76 W.", "Rendement η = 5,76 / 5,76 = 100 % : normal avec des interrupteurs parfaits. En réalité, les pertes en commutation le diminuent."] }
            ]
        }
    ];

    // ==========================================
    // Anciens DS : énoncés résumés, correction, variantes
    // ==========================================
    const ANNALES = [
        {
            id: 'store', code: 'STORE', titre: 'Store motorisé : transformateur et pont de diodes', sous: 'DS n°2 de 2022 et de 2024, exercice 1 (5 points)',
            sections: [
                S('Le sujet', 'file-text',
                    P(`Un transformateur parfait (réseau 230 V / 50 Hz) alimente un pont de 4 diodes, qui alimente un moteur CC à aimants permanents à travers la résistance des fils R<sub>fil</sub>. Oscillogramme : CH1 = u<sub>1</sub> à 100 V/div, CH2 = u<sub>2</sub> à 10 V/div, couplage DC, base de temps 2 ms/div. Diodes parfaites, courant I constant.`),
                    UL([
                        `1-2. Amplitude U<sub>2max</sub> et valeur efficace U<sub>2</sub>.`,
                        `3. Pour u<sub>2</sub> &gt; 0 puis u<sub>2</sub> &lt; 0, remplacer chaque diode par un interrupteur ouvert ou fermé et flécher le chemin de I.`,
                        `4-6. Tracer u<sub>3</sub>, donner sa fréquence et sa valeur efficace en justifiant.`,
                        `7. Quel élément ajouter en série avec le moteur pour lisser le courant ?`
                    ])),
                S('Correction du professeur (2024)', 'check-check',
                    UL([
                        `U<sub>2max</sub> = 3,8 div × 10 V/div = <b>38 V</b> ; U<sub>2</sub> = 38 / √2 ≈ <b>26,9 V</b>.`,
                        `u<sub>2</sub> &gt; 0 : diode en haut à gauche et diode en bas à droite fermées. u<sub>2</sub> &lt; 0 : les deux autres. Le courant traverse le moteur toujours dans le même sens.`,
                        `u<sub>3</sub> = |u<sub>2</sub>| (arches positives), période 10 ms, donc <b>f = 100 Hz</b>.`,
                        `u<sub>3</sub>² = u<sub>2</sub>², donc même valeur efficace : <b>U<sub>3</sub> = 26,9 V</b>. Écrire la formule de la valeur efficace rapporte des points.`,
                        `Une <b>bobine</b> (inductance) en série.`
                    ]),
                    NOTE('Barème', `Lecture de l'oscillogramme 0,5 + 0,5 ; schémas des diodes 1,5 ; tracé 0,5 ; fréquence 0,75 ; valeur efficace 1 ; bobine 0,25. Le schéma des diodes pèse lourd : entraîne-toi à le refaire sans regarder.`))
            ],
            qcm: [
                { q: "Store : CH2 réglé à 10 V/div, la crête de u2 est à 3,8 divisions. Valeur efficace U2 ?",
                    opts: ["38 V", "26,9 V", "24,2 V", "53,7 V"], ok: [1],
                    expl: "U2max = 38 V, U2 = 38 / √2 ≈ 26,9 V. 24,2 V est la valeur moyenne après redressement (2 × 38 / π).", src: 'DS n°2, 2024' },
                { q: "Store : quelle est la valeur efficace U3 de la tension redressée, si U2 = 26,9 V ?",
                    opts: ["13,5 V", "19,0 V", "24,2 V", "26,9 V"], ok: [3],
                    expl: "u3 = |u2|, donc u3² = u2² : les valeurs efficaces sont égales.", src: 'DS n°2, 2024' },
                { calc: true, q: "Variante : même montage, mais la crête de u2 est à 3,4 divisions (10 V/div) et la base de temps vaut 5 ms/div, une période de u2 occupant 4 divisions. Calculer U2max, U2, la fréquence du réseau, celle de u3, puis ⟨u3⟩ et U3.",
                    steps: ["U2max = 3,4 × 10 = 34 V ; U2 = 34 / √2 ≈ 24,0 V.", "T = 4 × 5 = 20 ms, f = 50 Hz ; u3 a pour période 10 ms, donc 100 Hz.", "⟨u3⟩ = 2 × 34 / π ≈ 21,6 V (voltmètre en DC).", "U3 = U2 ≈ 24,0 V (voltmètre TRMS en AC+DC)."] }
            ]
        },
        {
            id: 'portes', code: 'PORTES', titre: 'Contrôle d\'ouverture de portes : diodes passantes et valeur moyenne', sous: 'DS n°2 de 2024 et de 2025, exercice 2 (4 points)',
            sections: [
                S('Le sujet', 'file-text',
                    P(`Un dispositif relié au réseau 230 V / 50 Hz alimente un motoréducteur commandé par un relais. Conversion alternatif-continu : transformateur, pont de 4 diodes, puis filtrage. On donne les oscillogrammes de u<sub>2</sub>, u<sub>3</sub>, u<sub>4</sub>, u<sub>5</sub>.`),
                    UL([
                        `1. Cocher les réglages de l'oscilloscope.`,
                        `2. Tableau : diode passante (P) ou bloquée (B) pour chaque alternance, et relation entre u<sub>2</sub> et u<sub>3</sub>.`,
                        `3. Calculer ⟨u<sub>3</sub>⟩.`,
                        `4. Appareil qui mesure ⟨u<sub>3</sub>⟩ et son réglage.`,
                        `5. Nom du composant qui réalise le filtrage.`
                    ])),
                S('Correction du professeur (2025)', 'check-check',
                    UL([
                        `Alternance positive : D1 P, D2 B, D3 P, D4 B, et u<sub>3</sub> = u<sub>2</sub>. Alternance négative : D1 B, D2 P, D3 B, D4 P, et u<sub>3</sub> = −u<sub>2</sub>.`,
                        `⟨u<sub>3</sub>⟩ = 2U<sub>3max</sub>/π avec U<sub>3max</sub> = U<sub>2</sub>√2 = 24√2 ≈ 33,9 V, donc <b>⟨u<sub>3</sub>⟩ ≈ 21,6 V</b>.`,
                        `Un voltmètre réglé en <b>DC</b> (valeur moyenne).`,
                        `Filtrage : un <b>condensateur</b> (filtre passe-bas avec une résistance adaptée).`
                    ]),
                    NOTE('Indice', `Cet exercice est tombé à l'identique en 2024 et en 2025. La même méthode sert dans la porte de garage de janvier 2026.`))
            ],
            qcm: [
                { q: "Porte : U2 = 24 V efficace, pont de diodes parfait. ⟨u3⟩ ?",
                    opts: ["24 V", "33,9 V", "21,6 V", "10,8 V"], ok: [2],
                    expl: "⟨u3⟩ = 2 × 24√2 / π ≈ 21,6 V. 10,8 V serait la simple alternance.", src: 'DS n°2, 2025' },
                { q: "Pendant l'alternance négative, quelle relation lie u3 et u2 ?",
                    opts: ["u3 = u2", "u3 = −u2", "u3 = 0", "u3 = 2u2"], ok: [1],
                    expl: "D2 et D4 conduisent et retournent la tension : u3 = −u2, qui est positive puisque u2 < 0.", src: 'DS n°2, 2025' },
                { q: "Pour mesurer ⟨u3⟩, on règle le voltmètre en…",
                    opts: ["AC", "DC", "AC+DC", "Ohmmètre"], ok: [1],
                    expl: "DC donne la valeur moyenne. AC+DC (TRMS) donnerait la valeur efficace.", src: 'DS n°2, 2025' },
                { calc: true, q: "Variante : transformateur 230 V / 15 V parfait, pont de diodes parfait, charge de 30 Ω. Calculer le rapport de transformation, U3max, ⟨u3⟩, le courant moyen et le courant moyen dans une diode.",
                    steps: ["m = 15 / 230 ≈ 0,065.", "U3max = 15√2 ≈ 21,2 V.", "⟨u3⟩ = 2 × 21,2 / π ≈ 13,5 V.", "⟨i⟩ = 13,5 / 30 = 0,45 A ; chaque diode conduit une alternance sur deux : 0,225 A."] }
            ]
        },
        {
            id: 'garage', code: 'GARAGE', titre: 'Porte de garage : alimentation et détection d\'obstacle', sous: 'Épreuve de sciences de janvier 2026, exercice 1 (10 points)',
            sections: [
                S('Partie A : l\'alimentation', 'file-text',
                    P(`Secteur U<sub>1</sub> = 230 V, 50 Hz ; transformateur parfait 230 V / 24 V ; pont de Graetz (diodes idéales), puis condensateur et régulateur intégré de tension (RIT) qui délivre u<sub>alim</sub>.`),
                    UL([
                        `<b>Q1</b> : m = 24 / 230 ≈ <b>0,104</b>.`,
                        `<b>Q2-Q3</b> : D1/D3 passantes et u<sub>R</sub> = u<sub>2</sub> sur l'alternance positive ; D2/D4 et u<sub>R</sub> = −u<sub>2</sub> sur la négative.`,
                        `<b>Q4</b> : U<sub>Rmax</sub> = U<sub>2max</sub> = 24√2 ≈ <b>33,9 V</b>.`,
                        `<b>Q5</b> : U<sub>1</sub> sinusoïdale : voltmètre en mode <b>AC</b>.`,
                        `<b>Q6</b> : sur l'oscilloscope (10 V/div, 5 ms/div), la sinusoïde est u<sub>2</sub>, la tension presque continue avec une petite ondulation est u<sub>C</sub>, la droite parfaitement continue est u<sub>alim</sub>.`,
                        `<b>Q7</b> : le RIT donne une tension parfaitement continue.`
                    ])),
                S('Partie B : la détection d\'obstacle', 'scan-line',
                    P(`Un phototransistor PT reçoit un faisceau infrarouge. L'A.D.I. (±15 V) compare V<sup>+</sup> (fixé par PT) et V<sup>−</sup> (pont R1 = 20 kΩ, R2 = 10 kΩ, R3 = 10 kΩ). Sa sortie U<sub>s</sub> commande, par R<sub>B</sub>, un transistor T (β = 50, V<sub>BEsat</sub> = 0,7 V) qui alimente un relais (U<sub>alim</sub> = 24 V, i<sub>Csat</sub> = 0,6 A). Le relais relève la porte si un obstacle coupe le faisceau.`),
                    T(['Question', 'Réponse du professeur'], [
                        ['Q8 Régime de l\'A.D.I.', 'Aucune liaison entre la sortie et une entrée : <b>régime de saturation</b> (comparateur), U<sub>s</sub> = ±15 V'],
                        ['Q9 V<sup>−</sup>', 'Pont diviseur : V<sup>−</sup> = 15 × 20 / (20 + 10) = <b>10 V</b>'],
                        ['Q10 Obstacle (PT non éclairé, bloqué)', 'V<sup>+</sup> = 15 V, v<sub>d</sub> = 5 V, U<sub>s</sub> = +15 V'],
                        ['Q10 Pas d\'obstacle (PT éclairé, saturé)', 'V<sup>+</sup> = 0 V, v<sub>d</sub> = −10 V, U<sub>s</sub> = −15 V'],
                        ['Q11 Transistor T', 'Transistor bipolaire <b>NPN</b>'],
                        ['Q12 États', 'U<sub>s</sub> = +15 V : saturé, V<sub>CE</sub> = 0 V. U<sub>s</sub> = −15 V : bloqué, V<sub>CE</sub> = U<sub>alim</sub> = 24 V'],
                        ['Q13 R<sub>B</sub>', 'i<sub>B</sub> = 0,6 / 50 = 0,012 A ; R<sub>B</sub> = (15 − 0,7) / 0,012 ≈ <b>1 192 Ω</b>'],
                        ['Q14 Choix (1,0 / 2,2 / 4,7 kΩ)', '<b>1,0 kΩ</b> : la valeur inférieure la plus proche, pour garantir la saturation'],
                        ['Q15 Diode D6', 'Diode de roue libre : protège le circuit des surtensions (arcs) à l\'ouverture du circuit du relais']
                    ]))
            ],
            qcm: [
                { q: "Porte de garage : l'A.D.I. n'a aucune liaison entre sa sortie et ses entrées. Son régime ?",
                    opts: ["Linéaire", "Saturation (comparateur)", "Bloqué", "Impossible à dire"], ok: [1],
                    expl: "Sans contre-réaction, l'amplificateur fonctionne en comparateur : sa sortie vaut +Vsat ou −Vsat selon le signe de v_d = V+ − V−.", src: 'Sciences, janvier 2026' },
                { q: "Le calcul donne R_B = 1 192 Ω. Valeurs disponibles : 1,0 ; 2,2 ; 4,7 kΩ. Choix ?",
                    opts: ["1,0 kΩ", "2,2 kΩ", "4,7 kΩ", "Aucune ne convient"], ok: [0],
                    expl: "Avec 1,0 kΩ, i_B = 14,3 mA ≥ 12 mA : saturation garantie. Avec 2,2 kΩ, i_B = 6,5 mA, le transistor ne sature pas.", src: 'Sciences, janvier 2026' },
                { q: "Quel est le rôle de la diode placée en parallèle sur la bobine du relais ?",
                    opts: ["Redresser la tension", "Allumer un voyant", "Laisser passer le courant de la bobine à l'ouverture pour éviter une surtension", "Augmenter le courant du relais"], ok: [2],
                    expl: "C'est une diode de roue libre, comme dans le hacheur : le courant d'une bobine ne peut pas s'interrompre brutalement.", src: 'Sciences, janvier 2026' },
                { q: "Le transistor T est bloqué, alimenté sous 24 V. Que vaut V_CE ?",
                    opts: ["0 V", "0,7 V", "15 V", "24 V"], ok: [3],
                    expl: "Bloqué, aucun courant ne circule : pas de tension aux bornes de la bobine, toute la tension d'alimentation est sur le transistor.", src: 'Sciences, janvier 2026' },
                { calc: true, q: "Variante : même montage, mais le relais demande i_Csat = 0,24 A et le transistor a β = 40. U_s = +15 V, V_BEsat = 0,7 V. Calculer i_Bsat, R_B, puis choisir entre 1,0 kΩ, 2,2 kΩ et 4,7 kΩ.",
                    steps: ["i_Bsat = 0,24 / 40 = 6 mA.", "R_B = (15 − 0,7) / 0,006 ≈ 2 383 Ω : c'est un maximum.", "On prend 2,2 kΩ : i_B = 14,3 / 2 200 = 6,5 mA ≥ 6 mA. 1,0 kΩ marche aussi (14,3 mA) mais consomme plus ; 4,7 kΩ ne sature pas (3 mA)."] }
            ]
        },
        {
            id: 'cardio', code: 'CARDIO', titre: 'Rythme cardiaque et comparateur', sous: 'DS n°2 de 2022, exercices 2 et 3 (ALI, DEL, transistor)',
            sections: [
                S('Ce qui tombait en 2022', 'heart-pulse',
                    P(`En 2022, le DS mêlait le redressement (le store) et l'électronique de la 1re année : un comparateur et un capteur de rythme cardiaque. Ces exercices révisent la diode électroluminescente et le transistor du chapitre 10, et l'ALI qui revient dans tous les DS n°2 (capteur du robot RICA IV, porte de garage).`),
                    UL([
                        `<b>Comparateur</b> (ALI ±15 V, triangle v<sub>1</sub> sur l'entrée −, tension continue V<sub>3</sub> sur l'entrée +) : v<sub>4</sub> = −15 V si v<sub>1</sub> &gt; V<sub>3</sub>, +15 V si v<sub>1</sub> &lt; V<sub>3</sub>. Avec un triangle de 0 à 7,5 V, α = V<sub>3</sub> / 7,5 : α = 0 pour V<sub>3</sub> = −2 V et 0 V, α = 1/3 pour V<sub>3</sub> = 2,5 V.`,
                        `<b>DEL</b> blanche, seuil 3,6 V, 20 mA max, sous 5 V : R<sub>1</sub> = (5 − 3,6) / 0,020 = <b>70 Ω</b>.`,
                        `<b>Amplificateur non inverseur</b> : A<sub>V</sub> = 1 + (R<sub>5</sub> + R<sub>6</sub>) / R<sub>4</sub>, avec R<sub>4</sub> = 4,7 kΩ, R<sub>5</sub> = 33 kΩ, R<sub>6</sub> de 0 à 470 kΩ : A<sub>V</sub> de 8,0 à 108 ; A<sub>V</sub> = 10 pour R<sub>6</sub> = 9,3 kΩ.`,
                        `<b>Transistor saturé</b> (V<sub>BEsat</sub> = 0,6 V, β = 100, i<sub>Csat</sub> = 400 µA) commandé par 6 V à travers 4,7 kΩ : i<sub>B</sub> = 5,4 / 4 700 ≈ 1,15 mA, bien plus que les 4 µA nécessaires : il est saturé.`
                    ]),
                    NOTE('Source', `Pas de corrigé du professeur pour ce DS : ces réponses sont les nôtres, recalculées.`))
            ],
            qcm: [
                { q: "Comparateur alimenté en ±15 V : v1 sur l'entrée −, V3 sur l'entrée +. Si v1 > V3, que vaut la sortie ?",
                    opts: ["+15 V", "−15 V", "0 V", "v1 − V3"], ok: [1],
                    expl: "v_d = V+ − V− = V3 − v1 < 0, donc la sortie sature à −15 V.", src: 'DS n°2, 2022' },
                { q: "DEL : seuil 3,6 V, courant maximal 20 mA, alimentation 5 V. Résistance série ?",
                    opts: ["70 Ω", "180 Ω", "250 Ω", "430 Ω"], ok: [0],
                    expl: "R1 = (5 − 3,6) / 0,020 = 70 Ω. 250 Ω serait 5 / 0,020, en oubliant le seuil de la DEL.", src: 'DS n°2, 2022' }
            ]
        },
        {
            id: 'variateur', code: 'MIXTE', titre: 'Variateur de vitesse : pont mixte et moteur CC', sous: 'DS n°2 de 2025, exercice 1 (5 points)',
            sections: [
                S('Le sujet', 'file-text',
                    P(`Un pont mixte (thyristors T1 et T3 en haut, diodes D1 et D2 en bas) alimente l'induit d'un moteur CC à excitation indépendante et constante : R = 0,5 Ω, E = 180 V à 1 250 tr/min. Le courant est parfaitement lissé par une bobine : I = 10 A. Entrée : v sinusoïdale, 220 V efficace, 50 Hz. Impulsions de gâchette aux instants t<sub>0</sub> + kT/2, θ = ω·t<sub>0</sub> = π/4.`),
                    UL([
                        `1. Tracer v(t), u(t), i<sub>L</sub>, i<sub>1</sub> et i<sub>D</sub> en concordance de temps pour θ = π/4.`,
                        `2-3. Calculer ⟨u⟩, puis l'exprimer en fonction de E, I et R.`,
                        `4-5. Calculer E pour θ = π/4, puis la vitesse du moteur.`
                    ])),
                S('Correction du professeur', 'check-check',
                    UL([
                        `<b>Chronogrammes</b> : de 0 à π/4, roue libre (u = 0) ; de π/4 à π, T1 et D2 conduisent, u = v ; de π à 5π/4, roue libre par D1 et D2 (u = 0) ; de 5π/4 à 2π, T3 et D1, u = −v. i<sub>1</sub> = 10 A de π/4 à π ; i<sub>D1</sub> = 10 A de π à 2π ; i<sub>L</sub> (courant de ligne) vaut +10 A, 0 en roue libre, puis −10 A. Puissance p = 0 en roue libre, positive en alimentation.`,
                        `⟨u⟩ = (220√2 / π)(1 + cos π/4) ≈ <b>169 V</b>.`,
                        `u = L·di/dt + R·i + E ; i constant, donc ⟨u⟩ = <b>E + R·I</b>.`,
                        `E = 169 − 0,5 × 10 = <b>164 V</b>.`,
                        `À excitation constante, E est proportionnelle à n : 180 / 1 250 = 164 / n, soit <b>n ≈ 1 139 tr/min</b>.`
                    ]),
                    NOTE('Lien', `Même montage que le CB n°1 de novembre (θ = π/4) et que l'exercice 2 du TD 11 (θ = 45°, ⟨u⟩ = 169 V) : c'est un grand classique.`))
            ],
            qcm: [
                { q: "Pont mixte, v = 220 V efficace, θ = π/4. Valeur moyenne de u ?",
                    opts: ["99 V", "140 V", "169 V", "198 V"], ok: [2],
                    expl: "⟨u⟩ = (220√2/π)(1 + cos π/4) = 99,0 × 1,707 ≈ 169 V. 198 V serait le pont de diodes (2V̂/π).", src: 'DS n°2, 2025' },
                { q: "E = 180 V à 1 250 tr/min, excitation constante. Vitesse quand E = 164 V ?",
                    opts: ["1 139 tr/min", "1 372 tr/min", "1 250 tr/min", "911 tr/min"], ok: [0],
                    expl: "E est proportionnelle à n : n = 1 250 × 164 / 180 ≈ 1 139 tr/min.", src: 'DS n°2, 2025' },
                { q: "Pont mixte, θ = π/4 : quels composants conduisent pendant la phase de roue libre qui suit θ = π ?",
                    opts: ["Aucun, le courant s'annule", "Les deux diodes D1 et D2", "T1 et D2", "Les quatre"], ok: [1],
                    expl: "Quand v devient négative, D1 devient passante et prend le courant : T1, dont le courant s'annule, se bloque. D1 et D2 court-circuitent la charge, u = 0, et la bobine entretient le courant. D'où i1 = 10 A seulement de π/4 à π, et iD1 = 10 A de π à 2π (corrigé du professeur)", src: 'DS n°2, 2025' },
                { calc: true, q: "Variante : même moteur (R = 0,5 Ω, E = 180 V à 1 250 tr/min), même pont et même réseau 220 V, mais θ = π/3 et I = 12 A. Calculer t0, ⟨u⟩, E et n.",
                    steps: ["t0 = θ / ω = (π/3) / (100π) ≈ 3,33 ms.", "⟨u⟩ = (220√2/π)(1 + cos π/3) = 99,0 × 1,5 ≈ 148,6 V.", "E = ⟨u⟩ − R·I = 148,6 − 0,5 × 12 ≈ 142,6 V.", "n = 1 250 × 142,6 / 180 ≈ 990 tr/min : en retardant l'amorçage, on ralentit le moteur."] }
            ]
        },
        {
            id: 'rica', code: 'RICA', titre: 'Robot RICA IV : hacheur 4 quadrants et capteur infrarouge', sous: 'DS n°2 de 2024 et de 2025, exercice 3 (11 points)',
            sections: [
                S('Partie 1 : la commande du moteur', 'bot',
                    P(`Le robot du CEA est entraîné par un moteur CC alimenté par un hacheur 4 quadrants sous U<sub>alim</sub> = 24 V : T1, D1 et T2, D2 à gauche, T3, D3 et T4, D4 à droite. Transistors parfaits en commutation, diodes parfaites, i(t) &gt; 0. Les commandes : C1 et C4 à 5 V pendant 6 carreaux, puis C2 et C3 à 5 V pendant 3 carreaux.`),
                    T(['Question', 'Réponse du professeur', 'Points'], [
                        ['Q8 Composants passants', 'C1, C4 à 5 V : <b>T1 et T4</b> ; C2, C3 à 5 V : <b>D2 et D3</b> (i &gt; 0 ne peut pas passer dans T2 et T3)', '1'],
                        ['Q9 Tracé de u', '+24 V quand T1 et T4 conduisent, −24 V quand D2 et D3 conduisent', '1'],
                        ['Q10 Rapport cyclique', 'α = 6 / 9 = <b>0,67</b>', '0,5'],
                        ['Q11 Signe de ⟨u⟩', 'α &gt; 0,5 (l\'aire positive l\'emporte), donc ⟨u⟩ &gt; 0, E &gt; 0, le moteur et le robot avancent : <b>marche avant</b>', '1'],
                        ['Q12 Marche arrière', '<b>0 &lt; α &lt; 0,5</b>', '0,5'],
                        ['Q13 Intérêt de faire varier α', 'Faire avancer ou reculer le robot à vitesse variable', '0,5']
                    ]),
                    P(`Avec la formule du cours : ⟨u⟩ = (2α − 1)U = (2 × 0,67 − 1) × 24 ≈ +8 V.`)),
                S('Partie 2 : la carte du capteur', 'scan-line',
                    P(`Une DEL infrarouge éclaire la courroie dentée ; un phototransistor TS (V<sub>CEsat</sub> = 0,3 V) reçoit le reflet, plus fort quand une dent passe. ALI1 (alimenté en 24 V / 0 V, parfait) recopie V<sub>CE</sub>. Résistance R1 entre 24 V et le collecteur.`),
                    T(['Question', 'Réponse du professeur', 'Points'], [
                        ['Q14 Type de TS', 'Bipolaire <b>NPN</b>', '0,5'],
                        ['Q15 Distance optimale', 'Lue sur i<sub>C</sub> = f(d) au maximum : <b>d ≈ 7 mm</b> (légèrement plus)', '0,5'],
                        ['Q16 Montage d\'ALI1', '<b>Suiveur</b> : V<sub>s1</sub> = V<sub>CE</sub>', '1'],
                        ['Q17 Courants', 'i<sup>−</sup> = i<sup>+</sup> = 0 (ALI parfait), donc <b>i<sub>1</sub> = i<sub>C</sub></b>', '0,5'],
                        ['Q18 Choix de R1', '24 = V<sub>CEsat</sub> + R·i<sub>C</sub>, donc i<sub>C</sub> = (24 − 0,3) / R. 0,21 mA &lt; i<sub>C</sub> &lt; 3 mA donne 7,9 kΩ &lt; R &lt; 113 kΩ : <b>R = 10 kΩ</b>', '1,5'],
                        ['Q19 Une dent approche', 'i<sub>C</sub> augmente, donc V<sub>CE</sub> diminue : <b>V<sub>s1</sub> diminue</b>', '1']
                    ]),
                    NOTE('Indice', `Exercice tombé à l'identique en 2024 et 2025, et le TD 12 (exercice 5, portail en pont en H) suit la même démarche. Sache remplir le tableau des composants sans hésiter : c'est 2 points sur 11.`))
            ],
            qcm: [
                { q: "RICA IV : C1 et C4 sont à 0 V, C2 et C3 à 5 V, et i > 0. Quels composants conduisent ?",
                    opts: ["T2 et T3", "D2 et D3", "T1 et T4", "D1 et D4"], ok: [1],
                    expl: "T2 et T3 sont commandés, mais un transistor ne conduit que dans un sens : avec i > 0, le courant passe par les diodes D2 et D3, et u = −24 V.", src: 'DS n°2, 2025' },
                { q: "Commandes : C1 et C4 hautes pendant 6 carreaux, C2 et C3 pendant 3 carreaux. Rapport cyclique et sens ?",
                    opts: ["α = 0,33, marche arrière", "α = 0,5, arrêt", "α = 0,67, marche avant", "α = 2, marche avant"], ok: [2],
                    expl: "α = 6 / 9 ≈ 0,67 > 0,5 : ⟨u⟩ = (2α − 1) × 24 ≈ +8 V, le robot avance.", src: 'DS n°2, 2025' },
                { q: "ALI1 monté en suiveur, entrée sur V_CE. Que vaut V_s1 ?",
                    opts: ["0 V", "24 V", "V_CE", "−V_CE"], ok: [2],
                    expl: "Un suiveur recopie sa tension d'entrée : V_s1 = V_CE. Il ne prélève aucun courant, d'où i1 = iC.", src: 'DS n°2, 2025' },
                { q: "Le phototransistor (V_CEsat = 0,3 V) est relié au 24 V par R. i_C doit rester entre 0,21 mA et 3 mA. Quelle résistance ?",
                    opts: ["4,7 kΩ", "10 kΩ", "150 kΩ", "1 kΩ"], ok: [1],
                    expl: "i_C = (24 − 0,3) / R : 3 mA impose R > 7,9 kΩ, 0,21 mA impose R < 113 kΩ. 10 kΩ convient.", src: 'DS n°2, 2025' },
                { calc: true, q: "Variante : pont en H sous U = 36 V. C1 et C4 sont hautes pendant 2 carreaux, puis C2 et C3 pendant 6 carreaux, i > 0. Composants passants, niveaux de u, α, ⟨u⟩ et sens de marche ?",
                    steps: ["C1 et C4 hautes : T1 et T4 conduisent, u = +36 V.", "C2 et C3 hautes : avec i > 0, ce sont D2 et D3 qui conduisent, u = −36 V.", "α = 2 / (2 + 6) = 0,25.", "⟨u⟩ = (2 × 0,25 − 1) × 36 = −18 V.", "⟨u⟩ < 0 : le robot recule. α < 0,5 est bien la condition de marche arrière."] }
            ]
        }
    ];

    // ==========================================
    // Formules à savoir refaire
    // ==========================================
    const FORMULES = [
        { titre: 'Composants', items: [
            [R`\theta = \omega\,t_0 = \dfrac{2\pi\,t_0}{T}`, `θ angle de retard à l'amorçage (rad) · t<sub>0</sub> retard de l'impulsion de gâchette (s) · T période (s)`],
            [R`i_E = i_B + i_C \qquad i_{B\,sat} = \dfrac{i_{C\,sat}}{\beta}`, `Transistor · i<sub>B</sub>, i<sub>C</sub>, i<sub>E</sub> courants de base, collecteur, émetteur (A) · β coefficient d'amplification`],
            [R`R_B = \dfrac{U_{cde} - V_{BE\,sat}}{k\, i_{B\,sat}}`, `R<sub>B</sub> résistance de base maximale (Ω) · U<sub>cde</sub> tension de commande (V) · V<sub>BEsat</sub> ≈ 0,7 V · k coefficient de sursaturation (souvent 2)`]
        ] },
        { titre: 'Redressement', items: [
            [R`\hat{V} = V\sqrt{2} \qquad m = \dfrac{U_2}{U_1}`, `V̂ valeur maximale (V) · V valeur efficace (V) · m rapport de transformation (secondaire sur primaire)`],
            [R`\langle u \rangle = \dfrac{2\hat{V}}{\pi} \qquad U_{eff} = V \qquad f_u = 2f`, `Pont de Graetz · ⟨u⟩ valeur moyenne (V) · U<sub>eff</sub> valeur efficace de u (V) · f<sub>u</sub> fréquence de u (Hz)`],
            [R`\langle u \rangle = \dfrac{\hat{V}}{\pi}(1 + \cos\theta)`, `Pont mixte, ou thyristors sur charge résistive · θ angle de retard à l'amorçage`],
            [R`\langle u \rangle = \dfrac{2\hat{V}}{\pi}\cos\theta`, `Pont tout thyristors, courant constant · négative si θ &gt; 90°`],
            [R`\langle u \rangle = E + R\,I \qquad E = k\,n`, `Moteur CC · E f.é.m. (V) · R résistance de l'induit (Ω) · I courant (A) · n vitesse (tr/min)`]
        ] },
        { titre: 'Hacheur et onduleur', items: [
            [R`\langle v \rangle = \alpha\, U`, `Hacheur série · α rapport cyclique · U tension de la source (V)`],
            [R`\langle i_K \rangle = \alpha I \qquad \langle i_D \rangle = (1 - \alpha) I`, `Courants moyens dans le transistor et la diode de roue libre (A) · I courant de la charge (A)`],
            [R`\langle u \rangle = (2\alpha - 1)\,U`, `Pont en H (4 quadrants) · marche arrière si α &lt; 0,5`],
            [R`U_{eff} = E \qquad U_{eff} = E\sqrt{1 - \dfrac{2\tau}{T}}`, `Onduleur en pont, commande symétrique puis décalée · E tension continue (V) · τ décalage (s) · T période (s)`],
            [R`P = \dfrac{U_{eff}^2}{R}`, `Puissance reçue par une résistance R (W) avec la valeur efficace, jamais la valeur moyenne`]
        ] }
    ];

    const PARTIES = {
        cours: { titre: 'Physique : cours des chapitres 10 à 13', court: 'Cours', icone: 'book-open', sujets: COURS,
            intro: `Composants à semi-conducteurs, redressement non commandé et commandé, hacheur, onduleur. Les exercices reprennent le type des TD 10 à 13 avec d'autres valeurs.` },
        annales: { titre: 'Physique : anciens DS', court: 'Anciens DS', icone: 'archive', sujets: ANNALES,
            intro: `Les exercices des DS n°2 de 2022, 2024 et 2025 et de l'épreuve de sciences de janvier 2026, résumés avec leur correction, puis une variante avec d'autres valeurs. Certains reviennent d'une année sur l'autre (le pont de diodes de la porte et le robot RICA IV en 2024 et 2025) : c'est un bon indice de ce que les professeurs aiment, pas une promesse.` }
    };
    const ORDRE_PARTIES = ['cours', 'annales'];
    const FILTRES = [['tout', 'Tout'], ['cours', 'Cours'], ['annales', 'Anciens DS']];

    RD.enregistrer({
        id: 'ds-2026-11-phys', annee: 'a2', date: new Date(2026, 10, 21), libelle: 'samedi 21 novembre 2026',
        titre: 'DS de physique', titrePage: 'Révision DS : physique (chapitres 10 à 13)',
        resume: "Examen blanc, cours des chapitres 10 à 13, exercices des anciens DS corrigés, formules.",
        intro: "Composants, redressement, hacheur, onduleur, puis les anciens DS. Les QCM se corrigent au clic (Entraînement) ou à la fin (Mode DS), les exercices montrent leur correction étape par étape. L'espagnol du même matin n'est pas ici.",
        parties: PARTIES, ordre: ORDRE_PARTIES, filtres: FILTRES,
        onglets: { cours: 'Cours', annales: 'Anciens DS' },
        chap: { cours: 'semi', annales: 'store' },
        matiere: () => 'phys',
        formules: FORMULES, dsBlancs: []
    });
})();
