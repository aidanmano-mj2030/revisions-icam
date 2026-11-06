/*
 * Studicam : session et progression des élèves.
 *
 * Chargé à la fin de index.html. Ne réécrit aucune fonction du site : chaque fonction de
 * vérification globale est enveloppée, s'exécute normalement, puis on lit le résultat
 * qu'elle a laissé (classes des champs, bilan, variables) pour l'envoyer au serveur.
 * Aucune donnée de progression n'est gardée dans le navigateur : la source de vérité est
 * GET /api/progression. Toute erreur réseau est silencieuse (console.warn).
 *
 * Clés envoyées : "<année>/<matière>/<exercice>/<bloc>"
 *   <année>   a1 ou a2 (d'après CHAPITRES), <matière> id de MATIERES en minuscules.
 *   <exercice> clé de EXOS (exoCourant), <bloc> identifiant du bloc dans le DOM.
 *
 * Fonction enveloppée            Clé(s)                                   Réussi si
 * -----------------------------  ---------------------------------------  ------------------------------------
 * verifierExo1()                 a2/cm/produit-scalaire/exo1              #exo1-feedback vert (orange = incomplet, ignoré)
 * verifierExo2()                 a2/cm/produit-scalaire/exo2              les 3 questions justes ; score = réponses justes (ignoré tant qu'une question est sans réponse)
 * verifierExoA1()                a1/cm/liaisons/exo                       #a1-exo-feedback vert
 * verifierExoCodes()             a1/aii/aii-codes/codes                   toutes les cases justes ; score = cases justes
 * verifierBloc(id)               a1/aii/aii-karnaugh/kn                   tous les champs F justes ; score = champs justes
 *                                a1/aii/aii-tables/tv3, .../tv4
 * verifierRemplir()              a1/aii/aii-karnaugh/kv                   16 cases justes ; score = cases justes
 * verifierPortes(id)             a1/aii/aii-portes/p2, .../p3             bilan vert (orange = circuit incomplet, ignoré)
 * verifierChrono(id)             a1/aii/aii-bascules/bs                   toutes les cases justes ; score = réponses justes
 *                                a1/aii/aii-grafcet/gt, .../ge
 * verifierNum(id)                a2/cm/cm2-trains/tr, a2/cm/cm2-epi/ep    tous les champs justes ; score = champs justes
 * ciVerifier()                   a2/cm/cm2-cinematique/cin                5 vecteurs justes ; score = champs justes
 * mxVerifier()                   a2/maths/maths-matrices/mt               bilan vert ; score = cases justes
 * exgVerifier(id)                a2/maths/maths-dl-usuels/dlu, -ops/dlo,  bilan vert ; score = réponses justes
 *                                -lim/dll, -tang/dlt ; maths-vecto-coord/vco,
 *                                -colin/vcl, -param/vpa, -repere/vre, -droites/vdr ;
 *                                a1/aii/aii-pneu/dsx ; a1/maths/m1-calculs/m1x-m1-calculs
 *                                (idem pour les 11 chapitres m1-*)
 *
 * Un essai est ignoré s'il n'y a aucune réponse saisie, ou si la correction de cet
 * exercice a été affichée (corriger*, ciCorriger, mxCorriger, exgCorriger) depuis le
 * dernier tirage (nouveau*, generer*, ciNouveau, demarrerExoCodes, mxNouvelle, exgNouvelle).
 * Une fois un exercice réussi, on n'envoie plus que les scores meilleurs.
 *
 * Point d'entrée public : window.studicamResultat(cle, reussi, score?)
 */
(function () {
    'use strict';

    const ANNEES = { '1ère Année': 'a1', '2ème Année': 'a2' };

    // Blocs de chaque exercice de EXOS, pour compter les « x/y » des chapitres et matières.
    const UNITES = {
        'aii-codes': ['codes'], 'aii-karnaugh': ['kn', 'kv'], 'aii-tables': ['tv3', 'tv4'],
        'aii-portes': ['p2', 'p3'], 'aii-bascules': ['bs'], 'aii-grafcet': ['gt', 'ge'],
        'aii-pneu': ['dsx'], 'cm2-trains': ['tr'], 'cm2-epi': ['ep'], 'cm2-cinematique': ['cin'],
        'maths-matrices': ['mt'], 'maths-dl-usuels': ['dlu'], 'maths-dl-ops': ['dlo'],
        'maths-dl-lim': ['dll'], 'maths-dl-tang': ['dlt'], 'maths-vecto-coord': ['vco'],
        'maths-vecto-colin': ['vcl'], 'maths-vecto-param': ['vpa'], 'maths-vecto-repere': ['vre'],
        'maths-vecto-droites': ['vdr'],
        'm1-calculs': ['m1x-m1-calculs'], 'm1-polynomes': ['m1x-m1-polynomes'], 'm1-trigo': ['m1x-m1-trigo'],
        'm1-limites': ['m1x-m1-limites'], 'm1-derivation': ['m1x-m1-derivation'],
        'm1-fonctions': ['m1x-m1-fonctions'], 'm1-complexes': ['m1x-m1-complexes'], 'm1-suites': ['m1x-m1-suites'],
        'm1-integrale': ['m1x-m1-integrale'], 'm1-edo': ['m1x-m1-edo'], 'm1-fourier': ['m1x-m1-fourier'],
        'maths-geo-bary': ['gba'], 'maths-geo-scal': ['gsc'], 'maths-geo-vect': ['gve']
    };
    const CLES_PS = ['a2/cm/produit-scalaire/exo1', 'a2/cm/produit-scalaire/exo2'];
    const CLES_LIAISONS = ['a1/cm/liaisons/exo'];

    let progression = {};          // copie en mémoire de GET /api/progression
    let charge = false;            // pastilles affichées seulement une fois la progression lue
    const corriges = new Set();    // clés dont la correction a été affichée

    // ---------- réseau ----------
    async function api(methode, chemin, corps) {
        const r = await fetch(chemin, {
            method: methode,
            credentials: 'same-origin',
            headers: corps ? { 'Content-Type': 'application/json' } : {},
            body: corps ? JSON.stringify(corps) : undefined
        });
        return r;
    }

    function nettoyer(cle) {
        return String(cle).toLowerCase().replace(/[^a-z0-9/_.-]/g, '-').slice(0, 120);
    }

    function enregistrer(cleBrute, reussi, score) {
        const cle = nettoyer(cleBrute);
        reussi = !!reussi;
        if (typeof score === 'number' && Number.isFinite(score)) score = Math.max(0, Math.min(100, Math.round(score)));
        else score = undefined;
        if (reussi && corriges.has(cle)) return;                        // correction vue : pas de réussite
        const avant = progression[cle];
        if (avant && avant.reussi && (score === undefined || (avant.score != null && score <= avant.score))) return;
        progression[cle] = {
            reussi: reussi || !!(avant && avant.reussi),
            score: score !== undefined ? score : (avant ? avant.score : null),
            maj_le: new Date().toISOString()
        };
        decorer();
        const corps = { cle, reussi };
        if (score !== undefined) corps.score = score;
        api('PUT', '/api/progression', corps)
            .then(r => {
                if (r.status === 401) { location.replace('/connexion'); return; }  // session expirée ou remplacée
                if (!r.ok) console.warn('Studicam : progression non enregistrée', r.status);
            })
            .catch(e => console.warn('Studicam : progression non enregistrée', e));
    }
    window.studicamResultat = enregistrer;

    // ---------- clés ----------
    function prefixeChapitre(idChapitre) {
        if (typeof CHAPITRES === 'undefined') return null;
        for (const annee of Object.keys(CHAPITRES)) {
            for (const mat of Object.keys(CHAPITRES[annee])) {
                if (CHAPITRES[annee][mat].some(c => c.lecon === idChapitre)) return (ANNEES[annee] || 'ax') + '/' + mat.toLowerCase();
            }
        }
        return null;
    }
    function cleExo(idExo, bloc) {
        const exo = typeof EXOS !== 'undefined' ? EXOS[idExo] : null;
        const prefixe = (exo && prefixeChapitre(exo.chapitre)) || 'ax/autre';
        return nettoyer(prefixe + '/' + idExo + '/' + bloc);
    }
    function cleCourante(bloc) {
        const idExo = typeof exoCourant !== 'undefined' ? exoCourant : null;
        return idExo ? cleExo(idExo, bloc) : null;
    }

    // ---------- lecture des résultats ----------
    function etatChamp(el) {
        const c = el.className || '';
        if (c.includes('border-dashed')) return 'vide';
        if (c.includes('border-emerald-500')) return 'juste';
        if (c.includes('border-red-500')) return 'faux';
        return 'neutre';
    }
    // Compte les champs ; enregistre sauf si rien n'a été saisi.
    function bilanChamps(cle, champs) {
        if (!cle || champs.length === 0) return;
        let juste = 0, vide = 0;
        champs.forEach(el => { const e = etatChamp(el); if (e === 'juste') juste++; else if (e === 'vide' || e === 'neutre') vide++; });
        if (vide === champs.length) return;
        enregistrer(cle, juste === champs.length, 100 * juste / champs.length);
    }
    function couleurBilan(el) {
        const c = (el && el.className) || '';
        if (c.includes('emerald')) return 'vert';
        if (c.includes('red')) return 'rouge';
        return 'autre';
    }
    const $ = (id) => document.getElementById(id);

    // ---------- enveloppes ----------
    function envelopper(nom, apres) {
        const original = window[nom];
        if (typeof original !== 'function') { console.warn('Studicam : fonction absente', nom); return; }
        window[nom] = function (...args) {
            const r = original.apply(this, args);
            try { apres(args, r); } catch (e) { console.warn('Studicam : lecture du résultat impossible', nom, e); }
            return r;
        };
    }
    const marquerCorrige = (cle) => { if (cle) corriges.add(nettoyer(cle)); };
    const oublierCorrige = (cle) => { if (cle) corriges.delete(nettoyer(cle)); };

    // CM A2 produit scalaire, exercice 1 (étiquettes à placer)
    envelopper('verifierExo1', () => {
        const c = couleurBilan($('exo1-feedback'));
        if (c !== 'autre' && !corriges.has(CLES_PS[0])) enregistrer(CLES_PS[0], c === 'vert');
    });
    envelopper('corrigerExo1', () => marquerCorrige(CLES_PS[0]));
    envelopper('genererExo1', () => oublierCorrige(CLES_PS[0]));

    // CM A2 produit scalaire, exercice 2 : 3 questions à choix, comptées une fois toutes répondues
    envelopper('verifierExo2', () => {
        const questions = typeof questionsExo2 !== 'undefined' ? questionsExo2 : null;
        const choix = typeof choixExo2 !== 'undefined' ? choixExo2 : null;
        if (!questions || !choix || corriges.has(CLES_PS[1])) return;
        const n = questions.length;
        if (questions.some((_, q) => choix[q] === undefined)) return;
        const justes = questions.filter((qo, q) => qo.options[choix[q]].bonne).length;
        enregistrer(CLES_PS[1], justes === n, 100 * justes / n);
    });
    envelopper('corrigerExo2', () => marquerCorrige(CLES_PS[1]));
    envelopper('genererExo2', () => oublierCorrige(CLES_PS[1]));

    // CM A1 liaisons
    envelopper('verifierExoA1', () => {
        const c = couleurBilan($('a1-exo-feedback'));
        if (c !== 'autre' && !corriges.has(CLES_LIAISONS[0])) enregistrer(CLES_LIAISONS[0], c === 'vert');
    });
    envelopper('corrigerExoA1', () => marquerCorrige(CLES_LIAISONS[0]));
    envelopper('genererExoA1', () => oublierCorrige(CLES_LIAISONS[0]));

    // AII conversion des codes
    envelopper('verifierExoCodes', () => {
        if (typeof exoCodes === 'undefined' || !exoCodes) return;
        const champs = [];
        exoCodes.lignes.forEach((l, i) => {
            for (let c = 0; c < 5; c++) if (c !== l.donnee) { const el = $(`conv-${i}-${c}`); if (el) champs.push(el); }
        });
        bilanChamps(cleCourante('codes'), champs);
    });
    envelopper('corrigerExoCodes', () => marquerCorrige(cleCourante('codes')));
    envelopper('demarrerExoCodes', () => oublierCorrige(cleCourante('codes')));

    // AII expressions booléennes (Karnaugh et tables)
    envelopper('verifierBloc', ([id]) => {
        const corps = $(`bloc-${id}-corps`);
        if (corps) bilanChamps(cleCourante(id), [...corps.querySelectorAll('input[data-expr]')]);
    });
    envelopper('corrigerBloc', ([id]) => marquerCorrige(cleCourante(id)));
    envelopper('nouveauBloc', ([id]) => oublierCorrige(cleCourante(id)));

    // AII Karnaugh à remplir
    envelopper('verifierRemplir', () => {
        const champs = [];
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const el = $(`kv-${i}-${j}`); if (el) champs.push(el); }
        bilanChamps(cleCourante('kv'), champs);
    });
    envelopper('corrigerRemplir', () => marquerCorrige(cleCourante('kv')));
    envelopper('nouveauRemplir', () => oublierCorrige(cleCourante('kv')));

    // AII portes logiques
    envelopper('verifierPortes', ([id]) => {
        const c = couleurBilan($(`${id}-bilan`));
        if (c !== 'autre') enregistrer(cleCourante(id), c === 'vert');
    });
    envelopper('corrigerPortes', ([id]) => marquerCorrige(cleCourante(id)));
    envelopper('nouveauPortes', ([id]) => oublierCorrige(cleCourante(id)));

    // AII chronogrammes (bascules, GRAFCET)
    envelopper('verifierChrono', ([id]) => {
        const b = typeof CHRONO !== 'undefined' ? CHRONO[id] : null;
        if (!b) return;
        let ok = 0, total = 0;
        b.rows.filter(r => r.saisie).forEach(r => (r.etat || []).forEach(e => { total++; if (e === 'ok') ok++; }));
        (b.questions || []).forEach(q => { total++; if (q.etat === 'ok') ok++; });
        const repondu = b.rows.some(r => r.saisie && (r.etat || []).some(e => e !== null)) || (b.questions || []).some(q => q.etat);
        if (total && repondu) enregistrer(cleCourante(id), ok === total, 100 * ok / total);
    });
    envelopper('corrigerChrono', ([id]) => marquerCorrige(cleCourante(id)));
    envelopper('nouveauChrono', ([id]) => oublierCorrige(cleCourante(id)));

    // CM engrenages (réponses numériques)
    envelopper('verifierNum', ([id]) => {
        const corps = $(`bloc-${id}-corps`);
        if (corps) bilanChamps(cleCourante(id), [...corps.querySelectorAll('input[data-num]')]);
    });
    envelopper('corrigerNum', ([id]) => marquerCorrige(cleCourante(id)));
    envelopper('nouveauNum', ([id]) => oublierCorrige(cleCourante(id)));

    // CM cinématique
    envelopper('ciVerifier', () => {
        bilanChamps(cleCourante('cin'), ['o1', 'o2', 'o3', 'v', 'g'].map(k => $(`cin-${k}`)).filter(Boolean));
    });
    envelopper('ciCorriger', () => marquerCorrige(cleCourante('cin')));
    envelopper('ciNouveau', () => oublierCorrige(cleCourante('cin')));

    // Maths matrices (MX.utilisee = correction vue, géré par le site)
    envelopper('mxVerifier', () => {
        if (typeof MX === 'undefined' || !MX.q || MX.utilisee) return;
        const cle = cleCourante('mt');
        const bilan = $('mt-bilan'), sp = $('mt-special');
        const cases = [...document.querySelectorAll('[id^="mt-c-"]')];
        const justes = cases.filter(el => etatChamp(el) === 'juste').length;
        if (couleurBilan(bilan) === 'vert') return enregistrer(cle, true, 100);
        const echec = cases.some(el => etatChamp(el) === 'faux') || (sp && sp.checked) || /^Réfléchis/.test(bilan ? bilan.textContent : '');
        if (echec) enregistrer(cle, false, cases.length ? 100 * justes / cases.length : 0);
    });

    // Exercices génériques (DL, vecteurs, distributeurs) : EXG[id].utilisee = correction vue
    envelopper('exgVerifier', ([id]) => {
        const e = typeof EXG !== 'undefined' ? EXG[id] : null;
        if (!e || !e.q || e.utilisee) return;
        let total = 0, justes = 0, vides = 0;
        e.q.champs.forEach(c => {
            if (c.requis === false) return;
            total++;
            const nom = `${id}-f-${c.cle}`;
            if (c.kind === 'choix') {
                const choisi = document.querySelector(`input[name="${nom}"]:checked`);
                if (!choisi) vides++; else if (choisi.value === c.sol) justes++;
                return;
            }
            const champ = $(nom);
            if (!champ || champ.value.trim() === '') vides++;
            else if (etatChamp(champ) === 'juste') justes++;
        });
        if (!total || vides === total) return;
        enregistrer(cleCourante(id), justes === total, 100 * justes / total);
    });

    // Un exercice ouvert et non restauré tire de nouvelles valeurs : on oublie les
    // corrections vues pour cet exercice, avant son démarrage.
    (function () {
        const original = window.ouvrirExercice;
        if (typeof original !== 'function') return;
        window.ouvrirExercice = function (id, ...reste) {
            try {
                const range = typeof EXO_RANGE !== 'undefined' ? EXO_RANGE : {};
                const dejaAffiche = typeof exoCourant !== 'undefined' && exoCourant === id;  // l'original le range puis le restaure
                if (!range[id] && !dejaAffiche) {
                    const debut = cleExo(id, '');
                    [...corriges].forEach(k => { if (k.startsWith(debut)) corriges.delete(k); });
                }
            } catch (e) { /* rien */ }
            return original.call(this, id, ...reste);
        };
    })();

    // ---------- affichage de la progression ----------
    function clesChapitre(chap, annee, matId) {
        if (chap.interactif && annee === '2ème Année' && matId === 'CM') return CLES_PS;
        if (chap.interactifA1 && annee === '1ère Année' && matId === 'CM') return CLES_LIAISONS;
        if (!chap.lecon || typeof EXOS === 'undefined') return [];
        const cles = [];
        Object.keys(EXOS).filter(k => EXOS[k].chapitre === chap.lecon).forEach(k => {
            const blocs = UNITES[k];
            if (blocs) blocs.forEach(b => cles.push(cleExo(k, b)));
            else {
                // exercice inconnu de la table : ses clés déjà enregistrées, ou une unité
                const debut = cleExo(k, '');
                const vues = Object.keys(progression).filter(c => c.startsWith(debut));
                if (vues.length) cles.push(...vues); else cles.push(debut + '?');
            }
        });
        return cles;
    }
    function compter(cles) {
        return { faits: cles.filter(c => progression[c] && progression[c].reussi).length, total: cles.length };
    }
    function pastille({ faits, total }) {
        const fini = total > 0 && faits === total;
        const s = document.createElement('span');
        s.dataset.studicam = '1';
        s.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border align-middle whitespace-nowrap '
            + (fini ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : faits > 0 ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-slate-800 text-slate-400 border-slate-700');
        s.textContent = (fini ? '✓ ' : '') + `${faits}/${total} exercice${total > 1 ? 's' : ''} réussi${faits > 1 ? 's' : ''}`;
        s.setAttribute('aria-label', `${faits} exercice${faits > 1 ? 's' : ''} réussi${faits > 1 ? 's' : ''} sur ${total}`);
        return s;
    }

    function decorerChapitres() {
        if (typeof matiereSelectionnee === 'undefined' || !matiereSelectionnee) return;
        const liste = $('liste-chapitres');
        if (!liste) return;
        const annee = anneeSelectionnee, mat = matiereSelectionnee;
        const chapitres = (CHAPITRES[annee] && CHAPITRES[annee][mat.id]) || [];
        const cartes = [...liste.children];
        if (cartes.length !== chapitres.length) return;
        chapitres.forEach((chap, i) => {
            const entete = cartes[i].querySelector(':scope > div');
            if (!entete) return;
            entete.querySelectorAll('[data-studicam]').forEach(n => n.remove());
            const cles = clesChapitre(chap, annee, mat.id);
            if (!cles.length) return;
            const p = pastille(compter(cles));
            p.classList.add('ml-2');
            const num = entete.querySelector('span');
            if (num) num.after(p); else entete.prepend(p);
        });
    }

    function decorerMatieres() {
        if (typeof categorieSelectionnee === 'undefined' || !categorieSelectionnee || typeof MATIERES === 'undefined') return;
        const grille = $('grille-matieres');
        const matieres = MATIERES[categorieSelectionnee] || [];
        if (!grille || grille.children.length !== matieres.length) return;
        const annee = anneeSelectionnee;
        matieres.forEach((m, i) => {
            const pied = grille.children[i].querySelector(':scope > div:last-child');
            if (!pied) return;
            pied.querySelectorAll('[data-studicam]').forEach(n => n.remove());
            const chapitres = (CHAPITRES[annee] && CHAPITRES[annee][m.id]) || [];
            const cles = chapitres.flatMap(c => clesChapitre(c, annee, m.id));
            if (!cles.length) return;
            const p = pastille(compter(cles));
            p.classList.add('ml-auto');
            pied.appendChild(p);
        });
    }

    function decorer() {
        if (!charge) return;
        try { decorerChapitres(); decorerMatieres(); } catch (e) { console.warn('Studicam : affichage de la progression', e); }
    }
    envelopper('ouvrirMatiere', () => decorer());
    envelopper('choisirCategorie', () => decorer());

    // ---------- bandeau de session ----------
    function bandeau(email) {
        const entete = document.querySelector('header');
        if (!entete || document.getElementById('studicam-session')) return;
        const barre = document.createElement('div');
        barre.id = 'studicam-session';
        barre.className = 'border-t border-darkborder/60';
        barre.innerHTML = '<div class="max-w-6xl mx-auto px-6 h-8 flex items-center justify-end gap-3 text-xs text-slate-400">'
            + '<span class="truncate min-w-0" title=""></span>'
            + '<button type="button" class="shrink-0 px-2 py-0.5 rounded-md border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors">Se déconnecter</button>'
            + '</div>';
        const span = barre.querySelector('span');
        span.textContent = email;
        span.title = email;
        barre.querySelector('button').addEventListener('click', async () => {
            try {
                const r = await api('POST', '/api/deconnexion');
                if (r.ok) { location.href = '/connexion'; return; }
            } catch (e) { console.warn('Studicam : déconnexion', e); }
            if (typeof afficherToast === 'function') afficherToast('Déconnexion impossible, réessaie dans un instant.');
        });
        entete.appendChild(barre);
    }

    // ---------- démarrage ----------
    async function demarrer() {
        let r;
        try { r = await api('GET', '/api/moi'); }
        catch (e) { console.warn('Studicam : serveur injoignable, progression désactivée', e); return; }
        if (r.status === 401) { location.replace('/connexion'); return; }
        if (!r.ok) { console.warn('Studicam : /api/moi', r.status); return; }
        try { const moi = await r.json(); bandeau(moi.email); } catch (e) { console.warn('Studicam : /api/moi illisible', e); }
        try {
            const p = await api('GET', '/api/progression');
            if (!p.ok) { console.warn('Studicam : /api/progression', p.status); return; }
            const donnees = await p.json();
            // fusion clé par clé avec ce qui a pu être enregistré pendant le chargement
            const serveur = (donnees && donnees.progression) || {};
            for (const [cle, s] of Object.entries(serveur)) {
                const l = progression[cle];
                if (!l) { progression[cle] = s; continue; }
                const scores = [s.score, l.score].filter(x => x != null);
                progression[cle] = { reussi: !!(s.reussi || l.reussi), score: scores.length ? Math.max(...scores) : null, maj_le: l.maj_le };
            }
            charge = true;
            decorer();
        } catch (e) { console.warn('Studicam : progression illisible', e); }
    }
    demarrer();
    // Page restaurée depuis le cache arrière (après une déconnexion par exemple) : on revérifie.
    window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
})();
