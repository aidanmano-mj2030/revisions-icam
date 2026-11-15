/*
 * Studicam : moteur de l'onglet « Révision DS » (A2).
 *
 * Chargé par index.html avant le contenu de chaque DS (revision-ds-<aaaa-mm>.js), avant
 * progression.js. Chaque fichier de contenu appelle window.StudicamRevisionDS.enregistrer(def) :
 *   def = { id: 'ds-2026-11', annee: 'a2', date: new Date(2026, 10, 14), libelle: 'samedi 14 novembre 2026',
 *           archive: true|false, titre, titrePage, resume, intro, prefixeId,
 *           parties: { <cle>: { titre, court, icone, sujets, intro } }, ordre: [<cle>...],
 *           filtres: [['tout', 'Tout'], [<cle>, libellé]...], chap: { <cle>: <id du 1er chapitre> },
 *           matiere: (cle) => 'ce' | 'oi' | 'phys'..., formules: [...], dsBlancs: [...] }
 * Un DS est « passé » s'il porte archive: true ou si sa date est dépassée : sa carte quitte
 * l'accueil A2 et rejoint la rubrique « DS passés », sous les cartes des DS à venir. Tout reste
 * consultable, avec la progression des élèves.
 *
 * Onglets : Examen blanc (QCM mélangés, filtrables) · un par partie · Formules · DS blanc.
 * Examen blanc et QCM des chapitres : séries de serie.js (mode Entraînement ou DS, Terminer, bilan,
 * refaire ses erreurs, série en cours gardée dans le navigateur). Identifiant d'une question :
 * <prefixeId>/<partie>/<id du chapitre>#<hash de l'énoncé> (window.studicamIdQuestion) ;
 * prefixeId vaut « rds » pour le DS du 14/11/2026 (historique) et ds/<id> par défaut.
 *
 * Progression (via window.studicamResultat de progression.js), envoyée à Terminer :
 *   <annee>/ds/<id>/<chapitre>          QCM du chapitre terminés ; réussi si tous justes
 *   <annee>/ds/<id>/examen-<filtre>     examen blanc terminé ; score = % de bonnes réponses
 * Le serveur range ces clés par matière grâce à DS_CHAPITRES de src/regles.js : y déclarer
 * chaque nouveau DS. « Refaire mes erreurs » n'est pas enregistré. Les exercices de calcul ne
 * sont pas comptés.
 */
(function () {
    'use strict';

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
    // Registre des DS (chaque fichier de contenu appelle enregistrer)
    // ==========================================
    const DEFS = [];
    // DS affiché : les noms ci-dessous désignent toujours celui-ci (voir activer)
    let D = null, DS = null, PARTIES = {}, ORDRE_PARTIES = [], TOUS = [], FILTRES = [], ETAT = null, FORMULES = [], DS_BLANCS = [], ONGLETS = [];
    const tousDe = (def) => def.ordre.flatMap(p => def.parties[p].sujets.map(s => ({ s, part: p })));
    function activer(def) {
        if (!def || def === D) return;
        D = DS = def;
        PARTIES = def.parties; ORDRE_PARTIES = def.ordre; TOUS = def.tous; FILTRES = def.filtres;
        ETAT = def.etat; FORMULES = def.formules; DS_BLANCS = def.dsBlancs;
        ONGLETS = [['examen', 'Examen blanc'], ...def.ordre.map(p => [p, (def.onglets && def.onglets[p]) || def.parties[p].court])];
        if (FORMULES.length) ONGLETS.push(['formules', 'Formules']);
        if (DS_BLANCS.length) ONGLETS.push(['dsblanc', 'DS blanc']);
    }
    const aujourdhui = () => { const a = new Date(); a.setHours(0, 0, 0, 0); return a; };
    const estPasse = (def) => !!def.archive || def.date < aujourdhui();
    // DS ouvert par défaut : le prochain à venir, sinon le plus récent
    function parDefaut() {
        const avenir = DEFS.filter(d => !estPasse(d)).sort((a, b) => a.date - b.date);
        return avenir[0] || DEFS.slice().sort((a, b) => b.date - a.date)[0] || null;
    }
    const defDe = (id) => DEFS.find(d => d.id === id) || null;
    // ---------- outils ----------
    const $ = (id) => document.getElementById(id);
    function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
    function bouton(cls, html, action) { const b = el('button', cls, html); b.type = 'button'; if (action) b.addEventListener('click', action); return b; }
    function rafraichir(zone) {
        if (window.lucide) lucide.createIcons();
        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise(zone ? [zone] : undefined).catch(e => console.warn(e));
    }
    const cleChapDe = (def, id) => `${def.annee}/ds/${def.id}/${id}`;
    const cleChap = (id) => cleChapDe(D, id);
    const cleExamen = (f) => `${D.annee}/ds/${D.id}/examen-${f}`;
    function lire(cle) { try { return typeof window.studicamLire === 'function' ? window.studicamLire(cle) : null; } catch (e) { return null; } }
    const qcmDe = (s) => s.qcm.filter(q => !q.calc);
    const SERIE = window.StudicamSerie || null;   // serie.js, chargé avant ce fichier
    const matiereDe = (part) => D.matiere(part);
    // « CE, OI : exposés et OI : cours » : onglets des parties du DS affiché
    function listeOnglets() {
        const noms = D.ordre.map(p => (D.onglets && D.onglets[p]) || D.parties[p].court);
        return noms.length > 1 ? noms.slice(0, -1).join(', ') + ' et ' + noms[noms.length - 1] : noms.join('');
    }
    const libelleChapitre = (part, s) => `${PARTIES[part].court} · ${s.titre}`;
    // QCM au format de serie.js, calculés une fois (même objet pour l'examen et les chapitres).
    // Une question garde son DS : elle peut être rouverte depuis « Refaire » quel que soit le DS affiché.
    const QSERIE = new Map();
    function enSerieDe(def, q, s, part) {
        if (!QSERIE.has(q)) QSERIE.set(q, {
            id: window.studicamIdQuestion(`${def.prefixeId}/${part}/${s.id}`, q.q), q: q.q, fig: q.fig || '', opts: q.opts, ok: q.ok, multi: !!q.multi,
            expl: q.expl, src: q.src || '', chapitre: `${def.parties[part].court} · ${s.titre}`, matiere: def.matiere(part), annee: def.annee,
            ouvrir: () => { def.etat.chap[part] = s.id; ouvrirRevisionDS(part, null, def.id); return $('ds-contenu'); }
        });
        return QSERIE.get(q);
    }
    const enSerie = (q, s, part) => enSerieDe(D, q, s, part);
    function joursAvant(def) { return Math.round((def.date - aujourdhui()) / 86400000); }
    function texteCompteARebours(def) {
        const j = joursAvant(def || D);
        if (j > 1) return `dans ${j} jours`;
        if (j === 1) return 'demain';
        if (j === 0) return "aujourd'hui";
        return 'passé';
    }

    function enregistrer(def) {
        if (!def || !def.id || defDe(def.id)) { console.warn('Studicam : Révision DS invalide ou déjà enregistrée', def && def.id); return; }
        def.annee = def.annee || 'a2';
        def.prefixeId = def.prefixeId || `ds/${def.id}`;
        def.formules = def.formules || [];
        def.dsBlancs = def.dsBlancs || [];
        def.matiere = def.matiere || (() => 'ds');
        def.tous = tousDe(def);
        def.etat = { onglet: 'examen', chap: Object.assign({}, def.chap), filtre: 'tout' };
        DEFS.push(def);
        if (SERIE) (window.studicamSourcesQcm = window.studicamSourcesQcm || []).push([def.prefixeId, () => def.tous.flatMap(({ s, part }) => qcmDe(s).map(q => enSerieDe(def, q, s, part)))]);
        if (document.readyState !== 'loading') rendreCartes();
    }

    function rendreCalc(q, n) {
        const box = el('div', 'bg-slate-950/40 border border-slate-800 border-l-4 border-l-blue-500/70 rounded-xl p-4 space-y-3');
        box.appendChild(el('p', 'text-[11px] font-bold uppercase tracking-wider text-blue-300', 'Exercice ' + n));
        box.appendChild(el('p', 'text-sm text-slate-200 leading-relaxed', q.q));
        if (q.fig) box.appendChild(el('div', 'my-2 flex justify-center bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-x-auto', q.fig));   // schéma de l'exercice (SVG)
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

    function pastilleHTML(faits, total, mot) {
        const fini = total > 0 && faits === total;
        const cls = fini ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : faits > 0 ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-slate-800 text-slate-400 border-slate-700';
        return `<span data-ds-pastille class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cls}">${fini ? '✓ ' : ''}${faits}/${total} ${mot}${total > 1 ? 's' : ''} réussi${faits === 1 ? '' : 's'}</span>`;
    }
    function compterChapitres(def) {
        const d = def || D;
        const faits = d.tous.filter(({ s }) => { const p = lire(cleChapDe(d, s.id)); return p && p.reussi; }).length;
        return { faits, total: d.tous.length };
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
        window.studicamNav?.noter({ ds: { id: D.id, onglet: cle, chap: PARTIES[cle] ? (PARTIES[cle].sujets.find(x => x.id === ETAT.chap[cle]) || PARTIES[cle].sujets[0]).id : null } });   // adresse (navigation.js)
        rendreOnglets();
        const zone = $('ds-contenu');
        zone.innerHTML = '';
        if (cle === 'examen') rendreExamen(zone);
        else if (PARTIES[cle]) rendrePartie(zone, cle);
        else if (cle === 'formules') rendreFormules(zone);
        else rendreDsBlanc(zone);
        // venu d'un lien « Chapitre : … » d'une série : bouton collant pour y revenir
        if (SERIE && cle !== 'examen') SERIE.reposerRetour(zone);
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

        // QCM du chapitre : série de serie.js, enregistrée à Terminer (réussi si tous justes)
        const qcm = qcmDe(s);
        const carteQ = el('div', 'bg-darkcard border border-darkborder rounded-2xl p-5 sm:p-6 shadow-xl space-y-4');
        carteQ.innerHTML = `<div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0"><i data-lucide="list-checks" class="w-4 h-4"></i></div><h3 class="text-lg font-bold text-white">${part === 'expo' ? "QCM de l'exposé" : 'QCM'}</h3></div>`;
        const serieQ = SERIE.monter({
            slot: `rds/chap/${part}/${s.id}`, melanger: false, enregistrer: true, lienCorrection: false,
            depart: () => ({ questions: qcm.map(q => enSerie(q, s, part)), cle: cleChap(s.id), annee: D.annee, matiere: matiereDe(part), titre: `QCM · ${libelleChapitre(part, s)}` }),
            surChapitre: () => window.scrollTo({ top: Math.max(0, tete.getBoundingClientRect().top + window.scrollY - 120), behavior: 'smooth' }),
            revenir: () => afficherOnglet(part),
            apresTerminer: () => { majPastilleChapitre(tete, s); majProgression(); }
        });
        carteQ.appendChild(serieQ.racine);
        zone.appendChild(carteQ);

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
    // L'examen est une seule série gardée en mémoire (et dans le navigateur) : revenir sur l'onglet,
    // y compris depuis un lien « Chapitre : … », retrouve l'ordre, les réponses et le bilan.
    let EXAMEN = null;
    function rendreExamen(zone) {
        zone.appendChild(el('p', 'text-sm text-slate-300 leading-relaxed', "Toutes les questions de QCM, mélangées. Le chapitre n'est révélé qu'après la correction. En Entraînement, chaque réponse est corrigée tout de suite ; en Mode DS, tout est corrigé à Terminer. Ton examen en cours est gardé sur cet appareil jusqu'à Terminer. Les exercices de calcul sont dans les onglets " + listeOnglets() + "."));
        if (!EXAMEN) EXAMEN = SERIE.monter({
            slot: 'rds/examen', choixModeAvant: true, melanger: true, enregistrer: true, libelleRetour: "à l'examen",
            avantDepart: (z, redessiner) => {
                const filtres = el('div', 'flex flex-wrap gap-2');
                filtres.setAttribute('role', 'group'); filtres.setAttribute('aria-label', "Matière de l'examen");
                FILTRES.forEach(([f, lib]) => {
                    const actif = ETAT.filtre === f;
                    const b = bouton(`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${actif ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'}`, `${lib} · ${poolDe(f).length}`, () => { ETAT.filtre = f; redessiner(); });
                    b.setAttribute('aria-pressed', String(actif));
                    filtres.appendChild(b);
                });
                z.appendChild(filtres);
                const p = lire(cleExamen(ETAT.filtre));
                if (p && p.score != null) z.appendChild(el('p', 'text-xs text-slate-400', `Meilleur score enregistré : ${Math.round(p.score)} %`));
            },
            depart: () => {
                const lib = FILTRES.find(([f]) => f === ETAT.filtre)[1];
                return {
                    questions: poolDe(ETAT.filtre).map(({ q, s, part }) => enSerie(q, s, part)), cle: cleExamen(ETAT.filtre), annee: D.annee,
                    matiere: ETAT.filtre === 'tout' ? 'ds' : matiereDe(ETAT.filtre), titre: `Examen blanc · ${lib}`
                };
            },
            revenir: () => ouvrirRevisionDS('examen'),
            apresTerminer: () => majProgression()
        });
        SERIE.oublierRetour();
        zone.appendChild(EXAMEN.racine);
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
        const aDonnees = progressionLue;
        DEFS.forEach(def => {
            const { faits, total } = compterChapitres(def);
            const h = aDonnees ? pastilleHTML(faits, total, 'chapitre') : '';
            document.querySelectorAll(`[data-ds-carte-progression="${def.id}"]`).forEach(z => { z.innerHTML = h; });
            if (def === D) { const z = $('ds-progression'); if (z) z.innerHTML = h; }
        });
        const etape = $('etape-revision-ds');
        if (D && etape && !etape.classList.contains('hidden') && PARTIES[ETAT.onglet]) {
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
    // idDs : id d'un DS enregistré ; absent ou inconnu, le DS déjà affiché, sinon le prochain à venir, sinon le plus récent.
    // Renvoie false si aucun DS n'est enregistré.
    function ouvrirRevisionDS(onglet, idChap, idDs) {
        const def = defDe(idDs) || D || parDefaut();
        if (!def) return false;
        activer(def);
        if (typeof cacherToutesLesEtapes === 'function') cacherToutesLesEtapes();
        $('etape-revision-ds').classList.remove('hidden');
        const passe = estPasse(def);
        $('ds-badge').textContent = `${def.annee === 'a1' ? '1ère' : '2ème'} Année • ${passe ? 'DS passé' : 'DS'} du ${def.libelle}`;
        $('ds-compte').textContent = passe ? '' : ' · ' + texteCompteARebours(def);
        $('ds-titre').textContent = def.titrePage || ('Révision DS : ' + def.titre);
        $('ds-intro').textContent = def.intro || '';
        $('ds-stats').innerHTML = [
            ...ORDRE_PARTIES.map(p => `${PARTIES[p].court} : <b>${PARTIES[p].sujets.length}</b> chapitres`),
            `<b>${poolDe('tout').length}</b> QCM au total`
        ].map(t => `<span class="text-xs px-2.5 py-1 rounded-lg bg-darkcard border border-darkborder text-slate-300">${t}</span>`).join('');
        majProgression();
        afficherOnglet(ONGLETS.some(([c]) => c === onglet) ? onglet : ETAT.onglet, idChap);
        window.scrollTo(0, 0);
        return true;
    }
    window.ouvrirRevisionDS = ouvrirRevisionDS;

    // ---------- cartes de l'accueil A2 : DS à venir, puis la rubrique « DS passés » ----------
    const echapper = (t) => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const majuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    function carteAvenir(def) {
        return `<button type="button" data-ds-ouvrir="${echapper(def.id)}" class="group w-full bg-darkcard hover:bg-slate-800/80 p-5 sm:p-6 rounded-2xl border border-indigo-500/40 hover:border-indigo-400 transition-all duration-300 text-left shadow-xl hover:-translate-y-1 flex flex-col sm:flex-row sm:items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform shrink-0 pointer-events-none"><i data-lucide="calendar-clock" class="w-6 h-6"></i></div>
            <div class="flex-1 min-w-0 pointer-events-none">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">Révision DS</span>
                    <span class="text-xs font-semibold text-slate-400">${echapper(majuscule(def.libelle.replace(/\s+\d{4}$/, '')))} · ${echapper(texteCompteARebours(def))}</span>
                </div>
                <h2 class="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">${echapper(def.titre)}</h2>
                ${def.resume ? `<p class="text-xs text-slate-400 mt-1">${echapper(def.resume)}</p>` : ''}
                <div data-ds-carte-progression="${echapper(def.id)}" class="mt-2"></div>
            </div>
            <div class="flex items-center gap-2 text-sm font-semibold text-indigo-400 shrink-0 pointer-events-none"><span>Réviser</span><i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i></div>
        </button>`;
    }
    function cartePassee(def) {
        return `<button type="button" data-ds-ouvrir="${echapper(def.id)}" class="group w-full bg-slate-900/60 hover:bg-slate-800/80 px-4 py-3 rounded-xl border border-darkborder hover:border-slate-500 transition-all text-left flex items-center gap-3">
            <i data-lucide="archive" class="w-4 h-4 text-slate-500 shrink-0 pointer-events-none"></i>
            <div class="flex-1 min-w-0 pointer-events-none">
                <p class="text-sm font-semibold text-slate-200 group-hover:text-white">${echapper(def.titre)}</p>
                <p class="text-xs text-slate-400">${echapper(majuscule(def.libelle))}</p>
                <div data-ds-carte-progression="${echapper(def.id)}" class="mt-1"></div>
            </div>
            <span class="text-xs font-semibold text-slate-400 group-hover:text-white shrink-0 pointer-events-none">Revoir</span>
        </button>`;
    }
    function rendreCartes() {
        const zone = $('cartes-revision-ds');
        if (!zone) return;
        const avenir = DEFS.filter(d => !estPasse(d)).sort((a, b) => a.date - b.date);
        const passes = DEFS.filter(estPasse).sort((a, b) => b.date - a.date);
        const ouvert = zone.querySelector('details[data-ds-passes]');
        zone.innerHTML = avenir.map(carteAvenir).join('')
            + (passes.length ? `<details data-ds-passes class="rounded-2xl border border-darkborder bg-darkcard/60 px-4 py-3"${ouvert && ouvert.open ? ' open' : ''}>
                <summary class="cursor-pointer select-none text-sm font-semibold text-slate-300 hover:text-white flex items-center gap-2"><i data-lucide="history" class="w-4 h-4"></i>DS passés (${passes.length})</summary>
                <p class="text-xs text-slate-400 mt-2 mb-3">Les révisions des DS déjà passés restent consultables, avec ta progression.</p>
                <div class="space-y-2">${passes.map(cartePassee).join('')}</div>
            </details>` : '');
        if (!zone._pret) {
            zone._pret = true;
            zone.addEventListener('click', (ev) => { const b = ev.target.closest && ev.target.closest('[data-ds-ouvrir]'); if (b) ouvrirRevisionDS(null, null, b.dataset.dsOuvrir); });
        }
        majProgression();
        if (window.lucide) lucide.createIcons();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rendreCartes); else rendreCartes();

    window.StudicamRevisionDS = {
        outils: { R, P, UL, OL, NOTE, F, T, S },
        enregistrer,
        // pour navigation.js et ma-progression.js
        liste: () => DEFS.map(d => ({ id: d.id, annee: d.annee, titre: d.titre, passe: estPasse(d) })),
        courant: () => (D ? { id: D.id, annee: D.annee, prefixeCle: `${D.annee}/ds/${D.id}/`, prefixeId: D.prefixeId + '/' } : null),
        titreOnglet: (id, onglet) => { const d = defDe(id) || D; if (!d) return null; if (onglet === 'examen') return 'Examen blanc'; if (onglet === 'formules') return 'Formules'; if (onglet === 'dsblanc') return 'DS blanc'; return d.parties[onglet] ? ((d.onglets && d.onglets[onglet]) || d.parties[onglet].court) : null; }
    };
})();
