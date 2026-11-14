/*
 * Studicam : séries de QCM avec fin de série (Terminer, bilan, refaire ses erreurs).
 *
 * Chargé par index.html avant revision-ds.js. Sert à l'examen blanc et aux QCM des chapitres de
 * la Révision DS (revision-ds.js), et aux séries de QCM de index.html marquées `serie` (QCM des
 * oraux de la veille OI, voir veilleSerie et exgDessiner).
 *
 * Deux modes : « Entraînement » (correction après chaque question) et « Mode DS » (aucune
 * correction avant Terminer, réponses modifiables jusque-là). Une question sans réponse compte
 * fausse. Le bilan donne la note sur 20 (arrondie au demi-point) et en %, la durée, le détail par
 * chapitre et les questions ratées ; « Refaire mes erreurs » relance une série avec celles-ci.
 *
 * La série en cours (ordre, réponses, mode, chrono) est gardée dans localStorage
 * (« studicam:serie:<emplacement> ») et effacée à Terminer. Rien n'est envoyé au serveur avant
 * Terminer ; à Terminer, l'hôte peut demander l'enregistrement par window.studicamResultat.
 * Une série déjà montée est gardée en mémoire avec son affichage (comme EXO_RANGE) : quitter la
 * page pour un chapitre puis revenir ne perd rien.
 *
 * Contrat avec les autres fichiers :
 *   window.studicamIdQuestion(source, texte)  « <source>#<h> », h = FNV-1a 32 bits des octets UTF-8
 *                                             du texte brut de l'énoncé, 8 caractères hexadécimaux
 *   window.studicamQuestionParId(id)          { q, opts, ok, expl, chapitre } ou null
 *                                             (opts : propositions en HTML, ok : indices des bonnes)
 *   window.studicamLancerSerie(ids, titre[, { zone, revenir }])  ouvre une série « Refaire »
 *   événement « studicam:serie-terminee » sur document à chaque Terminer, detail =
 *     { cle, annee, matiere, titre, mode, total, justes, note20, pourcent, duree_s,
 *       questions: [{ id, chapitre, juste, repondue }] }
 *   window.studicamSourcesQcm : tableau de [préfixe, fonction] rempli par les fichiers qui ont des
 *     questions ; chaque fonction renvoie ses questions au format
 *     { id, q, opts, ok, multi, expl, src, chapitre, matiere, ouvrir } (ouvrir : affiche le
 *     chapitre de la question et renvoie l'élément qui le contient).
 *   window.StudicamSerie : monter(config), reposerRetour(zone), oublierRetour(), et les calculs.
 */
(function (W) {
    'use strict';

    // ==========================================
    // Calculs (testés par npm test : test/serie.test.js)
    // ==========================================
    function fnv1a(texte) {
        const octets = new TextEncoder().encode(String(texte));
        let h = 0x811c9dc5;
        for (let i = 0; i < octets.length; i++) { h ^= octets[i]; h = Math.imul(h, 0x01000193) >>> 0; }
        return h.toString(16).padStart(8, '0');
    }
    const idQuestion = (source, texte) => `${source}#${fnv1a(texte)}`;
    const noteSur20 = (justes, total) => (total > 0 ? Math.round(40 * justes / total) / 2 : 0);
    const pourcentage = (justes, total) => (total > 0 ? Math.round(100 * justes / total) : 0);
    const virgule = (x) => String(x).replace('.', ',');
    const texteNote = (justes, total) => `${virgule(noteSur20(justes, total))} / 20 (${pourcentage(justes, total)} %)`;
    function texteDuree(secondes) {
        const s = Math.max(0, Math.round(secondes || 0));
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
        if (h) return `${h} h ${String(m).padStart(2, '0')} min`;
        if (m) return `${m} min ${String(r).padStart(2, '0')} s`;
        return `${r} s`;
    }
    const memeChoix = (ok, choisis) => Array.isArray(choisis) && ok.length === choisis.length && ok.every(i => choisis.includes(i));
    // questions : [{ id, ok, chapitre }] ; rep : { id: [indices choisis] }
    function resultats(questions, rep) {
        const lignes = questions.map(q => {
            const c = (rep && rep[q.id]) || [];
            return { id: q.id, chapitre: q.chapitre || '', juste: memeChoix(q.ok, c), repondue: c.length > 0 };
        });
        const total = lignes.length, justes = lignes.filter(l => l.juste).length;
        const chap = new Map();
        lignes.forEach(l => {
            const c = chap.get(l.chapitre) || { chapitre: l.chapitre, justes: 0, total: 0 };
            c.total++; if (l.juste) c.justes++;
            chap.set(l.chapitre, c);
        });
        return { lignes, total, justes, note20: noteSur20(justes, total), pourcent: pourcentage(justes, total), parChapitre: [...chap.values()] };
    }

    // ==========================================
    // Questions connues (sources déclarées par revision-ds.js et index.html)
    // ==========================================
    const SOURCES = (W.studicamSourcesQcm = W.studicamSourcesQcm || []);
    let index = null, indexTaille = -1;
    function trouver(id) {
        if (!index || indexTaille !== SOURCES.length) {
            index = new Map(); indexTaille = SOURCES.length;
            SOURCES.forEach(([prefixe, fn]) => {
                try { (fn() || []).forEach(q => { if (q && q.id && !index.has(q.id)) index.set(q.id, q); }); }
                catch (e) { console.warn('Studicam : questions de', prefixe, e); }
            });
        }
        return index.get(String(id)) || null;
    }
    function questionParId(id) {
        const q = trouver(id);
        return q ? { q: q.q, opts: q.opts.slice(), ok: q.ok.slice(), expl: q.expl || '', chapitre: q.chapitre || '' } : null;
    }

    // ==========================================
    // Stockage dans le navigateur (jamais bloquant)
    // ==========================================
    const STOCK = 'studicam:serie:';
    function stockLire(slot) {
        try {
            const t = W.localStorage.getItem(STOCK + slot);
            const e = t ? JSON.parse(t) : null;
            return e && e.v === 1 && Array.isArray(e.ids) && e.rep && typeof e.rep === 'object' ? e : null;
        } catch (e) { return null; }
    }
    function stockEcrire(slot, etat) { try { W.localStorage.setItem(STOCK + slot, JSON.stringify(etat)); } catch (e) { /* stockage indisponible : la série continue sans */ } }
    function stockEffacer(slot) { try { W.localStorage.removeItem(STOCK + slot); } catch (e) { /* rien */ } }

    // ==========================================
    // Affichage
    // ==========================================
    const LETTRES = 'ABCDEFGH';
    const CL_OPT = 'w-full flex items-start gap-3 text-left text-sm rounded-xl border px-3 py-2.5 transition-all ';
    const OPT_NEUTRE = 'bg-slate-950/50 border-slate-700 text-slate-200 hover:border-slate-500';
    const OPT_CHOISI = 'bg-amber-500/15 border-amber-400 text-slate-100';
    const OPT_JUSTE = 'bg-emerald-500/10 border-emerald-500 text-slate-100';
    const OPT_FAUX = 'bg-red-500/10 border-red-500 text-slate-100';
    const OPT_ETEINT = 'bg-slate-950/50 border-slate-800 text-slate-400';
    const BT_SECOND = 'px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all';
    const MODES = { entrainement: 'Entraînement', ds: 'Mode DS' };

    function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
    function texte(tag, cls, t) { const e = el(tag, cls); e.textContent = t; return e; }
    function bouton(cls, html, action) { const b = el('button', cls, html); b.type = 'button'; if (action) b.addEventListener('click', action); return b; }
    function rafraichir(zone) {
        if (W.lucide) W.lucide.createIcons();
        if (W.MathJax && W.MathJax.typesetPromise && zone) W.MathJax.typesetPromise([zone]).catch(e => console.warn(e));
    }
    function toast(m) { if (typeof W.afficherToast === 'function') W.afficherToast(m); }
    function surligner(e) {
        if (!e) return;
        e.style.boxShadow = '0 0 0 2px rgba(251, 191, 36, .8)';
        setTimeout(() => { e.style.boxShadow = ''; }, 2200);
    }
    const lettresDe = (q, liste) => liste.map(i => `${LETTRES[i]}. ${q.opts[i]}`).join(' · ');

    // ---------- retour vers la série après un détour par le chapitre ----------
    let retour = null;
    function poserRetour(zone) {
        if (!retour || !zone) return;
        zone.querySelectorAll(':scope > [data-serie-retour]').forEach(n => n.remove());
        const b = bouton('sticky top-28 z-30 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40 shadow-lg', '<i data-lucide="arrow-left" class="w-4 h-4 shrink-0"></i> <span></span>', revenir);
        b.querySelector('span').textContent = retour.libelle;
        b.setAttribute('data-serie-retour', '');
        zone.insertBefore(b, zone.firstChild);
        if (W.lucide) W.lucide.createIcons();
    }
    function oublierRetour() {
        retour = null;
        document.querySelectorAll('[data-serie-retour]').forEach(n => n.remove());
    }
    function revenir() {
        const r = retour;
        oublierRetour();
        if (!r) return;
        r.comp.config().revenir();
        // la question revient à la même hauteur dans la fenêtre qu'au moment du départ
        const placer = () => { if (r.el && r.el.isConnected) W.scrollTo(0, r.el.getBoundingClientRect().top + W.scrollY - r.delta); };
        placer(); setTimeout(placer, 120); surligner(r.el);
    }

    // ---------- séries montées, gardées par emplacement ----------
    const SERIES = new Map();
    let ticTac = null;
    function tic() { SERIES.forEach(c => c.tic()); }
    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('visibilitychange', () => SERIES.forEach(c => (document.hidden ? c.pause() : c.reprendre())));
        W.addEventListener && W.addEventListener('pagehide', () => SERIES.forEach(c => c.pause()));
    }

    /*
     * config : {
     *   slot            emplacement de stockage, unique (ex. « rds/examen », « rds/chap/mas »)
     *   depart()        { questions, cle, annee, matiere, titre } d'une nouvelle série
     *   choixModeAvant  écran de départ avec le choix du mode (examen) ; sinon la série démarre en
     *                   Entraînement et le mode se change tant que rien n'est répondu
     *   avantDepart(zone, redessiner)  contenu de l'hôte sur l'écran de départ (filtres…)
     *   melanger        ordre au hasard à chaque nouvelle série
     *   enregistrer     window.studicamResultat(cle, …) à Terminer (pas pour « Refaire mes erreurs »)
     *   lienCorrection  lien « Chapitre : … » sous chaque correction (défaut : oui)
     *   montrerChapitre chapitre affiché avant la réponse (QCM des oraux : nom de l'oral)
     *   libelleRetour   « à l'examen » → bouton « Revenir à l'examen, question N »
     *   revenir()       réaffiche l'hôte (son affichage est gardé)
     *   surChapitre(q)  remplace l'ouverture du chapitre (QCM affiché dans le chapitre même)
     *   apresTerminer(detail)
     * }
     */
    function monter(config) {
        const deja = SERIES.get(config.slot);
        if (deja) { deja.reconfigurer(config); return deja; }
        const c = creer(config);
        SERIES.set(config.slot, c);
        if (!ticTac) ticTac = setInterval(tic, 1000);
        return c;
    }

    function creer(cfg) {
        let config = cfg;
        const racine = el('div', 'space-y-4');
        racine.setAttribute('data-serie', config.slot);
        let phase = 'depart', etat = null, questions = [], bilan = null, reprise = null;
        let refs = {};             // éléments vivants de l'écran en cours
        let armer = null;          // confirmation de Terminer avec des questions sans réponse

        // ---------- état ----------
        const ecoule = () => (etat ? etat.ecoule + (reprise ? Date.now() - reprise : 0) : 0);
        const repDe = (q) => etat.rep[q.id] || [];
        const nbRepondues = () => questions.filter(q => repDe(q).length).length;
        const valide = (q) => etat.mode === 'entrainement' && etat.valides.includes(q.id);
        function sauver() {
            if (phase !== 'encours' || !etat || !etat.demarre) return;
            if (reprise) { etat.ecoule = ecoule(); reprise = Date.now(); }
            stockEcrire(config.slot, etat);
        }
        function demarrer() {
            if (etat.demarre) return;
            etat.demarre = true;
            if (typeof document === 'undefined' || !document.hidden) reprise = Date.now();
            // le choix du mode laisse place au badge et au bouton Recommencer
            if (refs.tete && refs.tete.isConnected) { const t = teteSerie(); refs.tete.replaceWith(t); refs.tete = t; rafraichir(t); }
        }
        function nouvelEtat(d, mode, extra) {
            return Object.assign({
                v: 1, cle: d.cle, cleOrigine: d.cle, annee: d.annee || null, matiere: d.matiere || null,
                titre: d.titre, titreOrigine: d.titre, mode, ids: questions.map(q => q.id),
                rep: {}, valides: [], ecoule: 0, demarre: false, refaire: false
            }, extra || {});
        }
        function charger() {
            const e = stockLire(config.slot);
            if (e) {
                const qs = e.ids.map(trouver).filter(Boolean);
                if (qs.length) {
                    questions = qs;
                    const rep = {};
                    qs.forEach(q => {
                        const r = e.rep[q.id];
                        if (Array.isArray(r)) rep[q.id] = r.filter(i => Number.isInteger(i) && i >= 0 && i < q.opts.length);
                    });
                    etat = Object.assign({}, e, {
                        ids: qs.map(q => q.id), rep, mode: e.mode === 'ds' ? 'ds' : 'entrainement',
                        valides: Array.isArray(e.valides) ? e.valides.filter(id => rep[id] && rep[id].length) : [],
                        ecoule: Number(e.ecoule) > 0 ? Number(e.ecoule) : 0, demarre: true
                    });
                    phase = 'encours';
                    if (typeof document === 'undefined' || !document.hidden) reprise = Date.now();
                    dessiner();
                    return;
                }
                stockEffacer(config.slot);
            }
            if (config.choixModeAvant) { phase = 'depart'; dessiner(); } else nouvelle('entrainement', false);
        }
        function nouvelle(mode, demarre) {
            const d = config.depart();
            questions = d.questions.slice();
            if (config.melanger) for (let i = questions.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [questions[i], questions[j]] = [questions[j], questions[i]]; }
            etat = nouvelEtat(d, mode);
            phase = 'encours'; bilan = null; reprise = null;
            stockEffacer(config.slot);
            if (demarre) { demarrer(); sauver(); }
            dessiner();
        }
        function refaire(ids) {
            const avant = etat;
            questions = ids.map(trouver).filter(Boolean);
            if (!questions.length) return;
            const base = avant.cleOrigine || avant.cle;
            etat = nouvelEtat({ cle: /\/refaire$/.test(base) ? base : base + '/refaire', annee: avant.annee, matiere: avant.matiere, titre: 'Refaire mes erreurs · ' + avant.titreOrigine }, avant.mode,
                { cleOrigine: base, titreOrigine: avant.titreOrigine, refaire: true });
            phase = 'encours'; bilan = null; reprise = null;
            demarrer(); sauver();
            dessiner();
            allerEnHaut();
        }
        function abandonner() {
            stockEffacer(config.slot);
            reprise = null;
            if (config.choixModeAvant) { phase = 'depart'; etat = null; dessiner(); } else nouvelle(etat ? etat.mode : 'entrainement', false);
            allerEnHaut();
        }
        function allerEnHaut() {
            if (!racine.isConnected) return;
            const y = racine.getBoundingClientRect().top + W.scrollY - 120;
            if (racine.getBoundingClientRect().top < 100) W.scrollTo(0, Math.max(0, y));
        }

        // ---------- chapitre de la question ----------
        function allerAuChapitre(q, n, ref) {
            if (config.surChapitre) { config.surChapitre(q); return; }
            if (typeof q.ouvrir !== 'function') return;
            sauver();
            retour = {
                comp: api, el: ref, delta: ref ? ref.getBoundingClientRect().top : 0,
                libelle: phase === 'bilan' ? 'Revenir au bilan' : `Revenir ${config.libelleRetour || 'à la série'}, question ${n}`
            };
            let zone = null;
            try { zone = q.ouvrir(); } catch (e) { console.warn('Studicam : chapitre', e); }
            poserRetour(zone);
        }
        function lienChapitre(q, n, ref) {
            const p = el('p', 'text-xs text-slate-400');
            if (!q.chapitre || (!config.surChapitre && typeof q.ouvrir !== 'function')) return null;
            p.append(config.surChapitre ? '' : 'Chapitre : ');
            const b = bouton('underline decoration-dotted underline-offset-2 text-blue-300 hover:text-blue-200 font-semibold text-left', '', () => allerAuChapitre(q, n, ref));
            b.textContent = config.surChapitre ? 'Revoir le cours de ce chapitre' : q.chapitre;
            p.appendChild(b);
            return p;
        }

        // ---------- une question ----------
        function boiteQuestion(q, n) {
            const box = el('div', 'bg-slate-950/40 border border-slate-800 border-l-4 border-l-amber-500/70 rounded-xl p-4 space-y-3 scroll-mt-32 transition-shadow');
            box.setAttribute('data-n', String(n));
            const choisis = repDe(q), fini = valide(q), ds = etat.mode === 'ds';
            box.appendChild(texte('p', 'text-[11px] font-bold uppercase tracking-wider text-slate-400', `Question ${n} / ${questions.length}` + (config.montrerChapitre && q.chapitre ? ' · ' + q.chapitre : '') + (q.multi ? ' · plusieurs bonnes réponses' : '')));
            box.appendChild(el('p', 'text-sm font-semibold text-white leading-relaxed', q.q));
            const liste = el('div', 'grid gap-2');
            const cases = [];
            const redessiner = (focus) => {
                const nb = boiteQuestion(q, n);
                box.replaceWith(nb); rafraichir(nb); majBarre();
                if (focus != null) { const f = nb.querySelector(`[data-opt="${focus}"]`); if (f) f.focus(); }
            };
            q.opts.forEach((t, i) => {
                const contenu = `<span class="font-mono font-bold text-slate-400 shrink-0">${LETTRES[i]}</span><span>${t}</span>`;
                let b;
                if (fini) {
                    const cl = q.ok.includes(i) ? OPT_JUSTE : choisis.includes(i) ? OPT_FAUX : OPT_ETEINT;
                    b = el('div', CL_OPT + cl, contenu);
                } else if (q.multi) {
                    b = el('label', CL_OPT + (choisis.includes(i) ? OPT_CHOISI : OPT_NEUTRE) + ' cursor-pointer', `<input type="checkbox" class="mt-1 w-4 h-4 accent-amber-400 shrink-0"${choisis.includes(i) ? ' checked' : ''}>${contenu}`);
                    const inp = b.querySelector('input');
                    inp.setAttribute('data-opt', String(i));
                    cases.push(inp);
                    inp.addEventListener('change', () => {
                        demarrer();
                        etat.rep[q.id] = cases.map((c, k) => (c.checked ? k : -1)).filter(k => k >= 0);
                        b.className = CL_OPT + (inp.checked ? OPT_CHOISI : OPT_NEUTRE) + ' cursor-pointer';
                        sauver(); majBarre();
                    });
                } else {
                    b = bouton(CL_OPT + (choisis.includes(i) ? OPT_CHOISI : OPT_NEUTRE), contenu, () => {
                        demarrer();
                        if (ds) etat.rep[q.id] = choisis.length === 1 && choisis[0] === i ? [] : [i];
                        else { etat.rep[q.id] = [i]; if (!etat.valides.includes(q.id)) etat.valides.push(q.id); }
                        sauver(); redessiner(i);
                    });
                    b.setAttribute('data-opt', String(i));
                    b.setAttribute('aria-pressed', String(choisis.includes(i)));
                }
                liste.appendChild(b);
            });
            box.appendChild(liste);
            if (!fini && q.multi && !ds) {
                box.appendChild(bouton('px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold flex items-center gap-2 transition-all', '<i data-lucide="check-circle-2" class="w-4 h-4"></i> Valider mes réponses', () => {
                    if (!repDe(q).length) { toast('Coche au moins une réponse.'); return; }
                    if (!etat.valides.includes(q.id)) etat.valides.push(q.id);
                    sauver(); redessiner(null);
                }));
            }
            if (fini) {
                const bon = memeChoix(q.ok, choisis);
                const ex = el('div', 'rounded-xl border px-4 py-3 text-sm leading-relaxed space-y-1.5 ' + (bon ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'));
                ex.setAttribute('role', 'status');
                ex.appendChild(el('p', 'font-bold ' + (bon ? 'text-emerald-300' : 'text-red-300'), bon ? 'Juste.' : 'Raté. Bonne réponse : ' + q.ok.map(i => LETTRES[i]).join(', ') + '.'));
                if (q.expl) ex.appendChild(el('p', 'text-slate-200', q.expl));
                if (q.src) ex.appendChild(el('p', 'text-xs text-slate-400', q.src));
                if (config.lienCorrection !== false) { const l = lienChapitre(q, n, box); if (l) ex.appendChild(l); }
                box.appendChild(ex);
            }
            return box;
        }

        // ---------- écrans ----------
        function dessiner() {
            racine.innerHTML = ''; refs = {}; armer = null;
            if (phase === 'depart') dessinerDepart();
            else if (phase === 'bilan') dessinerBilan();
            else dessinerSerie();
            rafraichir(racine);
        }
        function dessinerDepart() {
            if (config.avantDepart) { const z = el('div', 'space-y-3'); config.avantDepart(z, dessiner); racine.appendChild(z); }
            racine.appendChild(el('p', 'text-sm font-semibold text-slate-200', 'Choisis ton mode, puis commence :'));
            const choix = el('div', 'grid sm:grid-cols-2 gap-3');
            [['entrainement', 'graduation-cap', "La correction s'affiche après chaque question, avec le lien vers le chapitre."],
             ['ds', 'timer', "Comme le jour du DS : aucune correction avant Terminer, et tu peux changer tes réponses jusque-là."]].forEach(([m, ic, d]) => {
                choix.appendChild(bouton('text-left rounded-2xl border border-slate-700 bg-darkcard hover:border-amber-400 p-4 space-y-1.5 transition-all',
                    `<span class="flex items-center gap-2 text-white font-bold"><i data-lucide="${ic}" class="w-4 h-4 text-amber-400"></i>${MODES[m]}</span>`
                    + `<span class="block text-xs text-slate-400 leading-relaxed">${d}</span>`
                    + `<span class="inline-flex items-center gap-1 text-xs font-bold text-amber-300">Commencer <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></span>`,
                    () => { nouvelle(m, true); allerEnHaut(); }));
            });
            racine.appendChild(choix);
        }
        function teteSerie() {
            const tete = el('div', 'flex flex-wrap items-center gap-2');
            tete.appendChild(texte('span', 'text-sm font-bold text-white mr-auto', etat.titre));
            const rien = !etat.demarre;
            if (rien && !etat.refaire && !config.choixModeAvant) {
                const g = el('div', 'flex rounded-xl border border-slate-700 overflow-hidden');
                g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Mode');
                Object.keys(MODES).forEach(m => {
                    const actif = etat.mode === m;
                    const b = bouton(`px-3 py-1.5 text-xs font-bold transition-all ${actif ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:text-white'}`, MODES[m], () => { etat.mode = m; dessiner(); });
                    b.setAttribute('aria-pressed', String(actif));
                    b.title = m === 'ds' ? 'Aucune correction avant Terminer' : 'Correction après chaque question';
                    g.appendChild(b);
                });
                tete.appendChild(g);
            } else {
                tete.appendChild(texte('span', 'text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ' + (etat.mode === 'ds' ? 'bg-violet-500/10 text-violet-300 border-violet-500/30' : 'bg-blue-500/10 text-blue-300 border-blue-500/30'), MODES[etat.mode]));
            }
            if (!rien || config.choixModeAvant) {
                const lib = config.choixModeAvant ? 'Abandonner' : 'Recommencer';
                const b = bouton(BT_SECOND, `<i data-lucide="${config.choixModeAvant ? 'x' : 'rotate-ccw'}" class="w-4 h-4"></i> <span>${lib}</span>`, () => {
                    if (rien || b.dataset.arme) { abandonner(); return; }
                    b.dataset.arme = '1'; b.querySelector('span').textContent = 'Sûr ? Tes réponses seront perdues';
                    setTimeout(() => { if (b.isConnected) { delete b.dataset.arme; b.querySelector('span').textContent = lib; } }, 4000);
                });
                tete.appendChild(b);
            }
            return tete;
        }
        function dessinerSerie() {
            refs.tete = teteSerie();
            racine.appendChild(refs.tete);
            if (etat.mode === 'ds') racine.appendChild(el('p', 'text-xs text-slate-400', 'Mode DS : aucune correction avant Terminer. Une question sans réponse compte fausse.'));

            const liste = el('div', 'space-y-3');
            questions.forEach((q, i) => liste.appendChild(boiteQuestion(q, i + 1)));
            racine.appendChild(liste);
            refs.liste = liste;

            // barre collante : avancement, chrono, Terminer
            const barre = el('div', 'sticky z-20 px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 backdrop-blur shadow-2xl flex items-center gap-2 sm:gap-3');
            barre.style.bottom = 'max(0.5rem, env(safe-area-inset-bottom))';
            const info = el('div', 'flex-1 min-w-0 leading-tight');
            refs.avance = el('p', 'text-xs sm:text-sm font-mono font-semibold text-slate-200');
            refs.avance.setAttribute('aria-live', 'polite');
            refs.chrono = el('p', 'text-[11px] font-mono text-slate-400');
            info.appendChild(refs.avance); info.appendChild(refs.chrono);
            barre.appendChild(info);
            refs.saut = bouton('shrink-0 px-2.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold flex items-center gap-1 transition-all', '<i data-lucide="arrow-down-to-line" class="w-4 h-4"></i><span class="hidden sm:inline">Sans réponse</span>', () => {
                const q = questions.find(x => !repDe(x).length);
                const b = q && liste.querySelector(`[data-n="${questions.indexOf(q) + 1}"]`);
                if (b) { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); surligner(b); }
            });
            refs.saut.title = 'Aller à la première question sans réponse';
            refs.saut.setAttribute('aria-label', 'Aller à la première question sans réponse');
            barre.appendChild(refs.saut);
            refs.terminer = bouton('shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold flex items-center gap-2 transition-all', '<i data-lucide="flag" class="w-4 h-4"></i> <span>Terminer</span>', cliquerTerminer);
            barre.appendChild(refs.terminer);
            racine.appendChild(barre);
            majBarre();
        }
        function majBarre() {
            if (phase !== 'encours' || !refs.avance) return;
            const rep = nbRepondues(), total = questions.length;
            let t = `${rep} / ${total} répondue${rep > 1 ? 's' : ''}`;
            if (etat.mode === 'entrainement') {
                const faites = questions.filter(valide), justes = faites.filter(q => memeChoix(q.ok, repDe(q))).length;
                if (faites.length) t += ` · ${justes} juste${justes > 1 ? 's' : ''}`;
            }
            refs.avance.textContent = t;
            refs.saut.hidden = rep === total;
            majChrono();
            if (armer && rep === total) desarmer();
        }
        function majChrono() { if (refs.chrono) refs.chrono.textContent = etat.demarre ? 'Durée : ' + texteDuree(ecoule() / 1000) : 'Le chrono démarre à ta première réponse'; }
        function desarmer() {
            clearTimeout(armer); armer = null;
            if (refs.terminer) refs.terminer.querySelector('span').textContent = 'Terminer';
        }
        function cliquerTerminer() {
            const vides = questions.length - nbRepondues();
            if (vides && !armer) {
                refs.terminer.querySelector('span').textContent = `Confirmer (${vides} sans réponse)`;
                toast(`${vides} question${vides > 1 ? 's' : ''} sans réponse ${vides > 1 ? 'compteront' : 'comptera'} fausse${vides > 1 ? 's' : ''}. Appuie encore pour terminer.`);
                armer = setTimeout(desarmer, 5000);
                return;
            }
            terminer();
        }
        function terminer() {
            if (armer) { clearTimeout(armer); armer = null; }
            const r = resultats(questions, etat.rep);
            const duree = Math.round(ecoule() / 1000);
            const detail = {
                cle: etat.cle, annee: etat.annee, matiere: etat.matiere, titre: etat.titre, mode: etat.mode,
                total: r.total, justes: r.justes, note20: r.note20, pourcent: r.pourcent, duree_s: duree,
                questions: r.lignes.map(l => ({ id: l.id, chapitre: l.chapitre, juste: l.juste, repondue: l.repondue }))
            };
            stockEffacer(config.slot);
            reprise = null;
            if (config.enregistrer && !etat.refaire && r.total && typeof W.studicamResultat === 'function') {
                try { W.studicamResultat(etat.cle, r.justes === r.total, 100 * r.justes / r.total); } catch (e) { console.warn('Studicam : résultat', e); }
            }
            try { document.dispatchEvent(new CustomEvent('studicam:serie-terminee', { detail })); } catch (e) { console.warn('Studicam : fin de série', e); }
            bilan = { r, duree, etat, questions: questions.slice() };
            phase = 'bilan';
            dessiner();
            allerEnHaut();
            if (config.apresTerminer) { try { config.apresTerminer(detail); } catch (e) { console.warn(e); } }
        }
        function dessinerBilan() {
            const { r, duree, etat: e, questions: qs } = bilan;
            const sansFaute = r.total > 0 && r.justes === r.total;
            const carte = el('div', 'rounded-2xl border p-5 sm:p-6 space-y-4 ' + (sansFaute ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-darkborder bg-darkcard'));
            carte.appendChild(texte('p', 'text-[11px] font-bold uppercase tracking-wider text-slate-400', 'Bilan · ' + e.titre));
            const note = el('p', 'text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight');
            note.textContent = `${virgule(r.note20)} / 20 `;
            note.appendChild(texte('span', 'text-lg sm:text-xl text-slate-400', `(${r.pourcent} %)`));
            carte.appendChild(note);
            const vides = r.lignes.filter(l => !l.repondue).length;
            carte.appendChild(texte('p', 'text-sm text-slate-300', `${r.justes} juste${r.justes > 1 ? 's' : ''} sur ${r.total}` + (vides ? ` · ${vides} sans réponse` : '') + ` · durée ${texteDuree(duree).replace(/ /g, '\u00a0')} · ${MODES[e.mode]}`));
            if (sansFaute) carte.appendChild(texte('p', 'text-sm font-bold text-emerald-300', e.refaire ? 'Sans-faute : toutes tes erreurs sont corrigées.' : 'Sans-faute, bravo !'));

            // détail par chapitre, du plus faible au plus fort
            if (r.parChapitre.length > 1) {
                const bloc = el('div', 'space-y-2');
                bloc.appendChild(texte('p', 'text-xs font-bold uppercase tracking-wider text-slate-400', 'Par chapitre'));
                r.parChapitre.slice().sort((a, b) => a.justes / a.total - b.justes / b.total || a.chapitre.localeCompare(b.chapitre, 'fr'))
                    .forEach(c => {
                        const ligne = el('div', 'space-y-1');
                        const haut = el('div', 'flex items-baseline gap-3 text-sm');
                        haut.appendChild(texte('span', 'flex-1 min-w-0 text-slate-300', c.chapitre || 'Sans chapitre'));
                        haut.appendChild(texte('span', 'shrink-0 font-mono text-xs font-semibold ' + (c.justes === c.total ? 'text-emerald-300' : 'text-slate-300'), `${c.justes} / ${c.total}`));
                        ligne.appendChild(haut);
                        const jauge = el('div', 'h-1.5 rounded-full bg-slate-800 overflow-hidden');
                        const plein = el('div', 'h-full rounded-full ' + (c.justes === c.total ? 'bg-emerald-500' : c.justes ? 'bg-amber-500' : 'bg-red-500'));
                        plein.style.width = Math.max(4, Math.round(100 * c.justes / c.total)) + '%';
                        jauge.appendChild(plein); ligne.appendChild(jauge);
                        bloc.appendChild(ligne);
                    });
                carte.appendChild(bloc);
            }

            const actions = el('div', 'flex flex-wrap gap-2');
            const ratees = qs.filter((q, i) => !r.lignes[i].juste);
            if (ratees.length) actions.appendChild(bouton('px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold flex items-center gap-2 transition-all', `<i data-lucide="repeat" class="w-4 h-4"></i> Refaire mes erreurs (${ratees.length})`, () => refaire(ratees.map(q => q.id))));
            actions.appendChild(bouton(BT_SECOND, `<i data-lucide="rotate-ccw" class="w-4 h-4"></i> ${config.choixModeAvant ? 'Nouvel examen' : e.refaire ? 'Toute la série' : 'Recommencer'}`, () => abandonner()));
            carte.appendChild(actions);
            racine.appendChild(carte);

            if (ratees.length) {
                racine.appendChild(texte('h3', 'text-lg font-bold text-white pt-1', `À revoir (${ratees.length})`));
                const liste = el('div', 'space-y-3');
                ratees.forEach(q => {
                    const n = qs.indexOf(q) + 1, choisis = e.rep[q.id] || [];
                    const box = el('div', 'bg-slate-950/40 border border-slate-800 border-l-4 border-l-red-500/70 rounded-xl p-4 space-y-2 text-sm leading-relaxed scroll-mt-32 transition-shadow');
                    box.appendChild(texte('p', 'text-[11px] font-bold uppercase tracking-wider text-slate-400', `Question ${n}` + (q.chapitre ? ' · ' + q.chapitre : '')));
                    box.appendChild(el('p', 'font-semibold text-white', q.q));
                    const ta = el('p', 'text-red-300');
                    ta.innerHTML = choisis.length ? '<span class="font-bold">Ta réponse :</span> ' + lettresDe(q, choisis) : '<span class="font-bold">Sans réponse</span>';
                    box.appendChild(ta);
                    box.appendChild(el('p', 'text-emerald-300', '<span class="font-bold">Bonne réponse :</span> ' + lettresDe(q, q.ok)));
                    if (q.expl) box.appendChild(el('p', 'text-slate-200', q.expl));
                    if (q.src) box.appendChild(el('p', 'text-xs text-slate-400', q.src));
                    const l = lienChapitre(q, n, box); if (l) box.appendChild(l);
                    liste.appendChild(box);
                });
                racine.appendChild(liste);
            }
        }

        // ---------- interface de la série ----------
        const api = {
            racine,
            config: () => config,
            reconfigurer(c) { config = c; },
            nouvelle,
            phase: () => phase,
            ids: () => questions.map(q => q.id),
            tic() { if (phase === 'encours' && reprise && racine.isConnected) majChrono(); },
            pause() { if (phase === 'encours' && etat && reprise) { sauver(); reprise = null; } },
            reprendre() { if (phase === 'encours' && etat && etat.demarre && !reprise) reprise = Date.now(); }
        };
        charger();
        return api;
    }

    // ==========================================
    // Série « Refaire » ouverte depuis une autre page (carnet d'erreurs)
    // ==========================================
    function lancerSerie(ids, titre, options) {
        const vus = new Set();
        const qs = (Array.isArray(ids) ? ids : []).map(trouver).filter(q => q && !vus.has(q.id) && vus.add(q.id));
        if (!qs.length) { toast("Aucune de ces questions n'existe encore sur le site."); return null; }
        const opt = options || {};
        const titreSerie = String(titre || 'Refaire mes erreurs').slice(0, 120);
        const etape = document.getElementById('etape-serie');
        let zone = opt.zone || null;
        let revenirHote = opt.revenir;
        if (!zone && etape) {
            if (typeof W.cacherToutesLesEtapes === 'function') W.cacherToutesLesEtapes();
            etape.classList.remove('hidden');
            document.getElementById('serie-titre').textContent = titreSerie;
            zone = document.getElementById('serie-contenu');
            revenirHote = () => { if (typeof W.cacherToutesLesEtapes === 'function') W.cacherToutesLesEtapes(); etape.classList.remove('hidden'); };
            W.scrollTo(0, 0);
        }
        if (!zone) return null;
        const matieres = [...new Set(qs.map(q => q.matiere || null))];
        const annees = [...new Set(qs.map(q => q.annee || 'a2'))];
        const config = {
            slot: 'libre', melanger: false, enregistrer: false, libelleRetour: 'à la série',
            revenir: revenirHote || (() => {}),
            depart: () => ({ questions: qs, cle: 'serie/refaire', annee: annees.length === 1 ? annees[0] : null, matiere: matieres.length === 1 ? matieres[0] : null, titre: titreSerie })
        };
        const c = monter(config);
        const memes = c.phase() === 'encours' && c.ids().length === qs.length && qs.every(q => c.ids().includes(q.id));
        if (!memes) c.nouvelle('entrainement', false);
        zone.innerHTML = '';
        zone.appendChild(c.racine);
        rafraichir(zone);
        return c.racine;
    }

    // ==========================================
    // Points d'entrée
    // ==========================================
    W.studicamIdQuestion = idQuestion;
    W.studicamQuestionParId = questionParId;
    W.studicamLancerSerie = lancerSerie;
    W.StudicamSerie = {
        monter, reposerRetour: poserRetour, oublierRetour,
        fnv1a, noteSur20, pourcentage, texteNote, texteDuree, resultats, memeChoix
    };
})(typeof window !== 'undefined' ? window : globalThis);
