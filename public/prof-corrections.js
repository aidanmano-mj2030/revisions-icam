/*
 * Studicam : corrections de cours par les profs et l'équipe.
 *
 * Chargé à la fin de index.html, après prof.js et prof-signalements.js. Ne réécrit aucune
 * fonction du site : il enveloppe ouvrirLecon et les fabriques de blocs H.p, H.formule,
 * H.note, H.liste, H.listeNum et H.tableau, seulement pendant l'affichage d'une leçon.
 *
 * Chaque bloc d'une leçon (paragraphe, formule, encadré, ligne de liste, case de tableau)
 * reçoit data-bloc = type + empreinte de son texte d'origine (« p-1k3x9za »). Une correction
 * active de ce bloc (GET /api/corrections?lecon=, chargé à la première ouverture de la leçon)
 * remplace son texte à l'affichage, pour tous. Un même texte répété dans la leçon (cases « 0 »
 * d'une table) donne des blocs distincts : -2, -3… pour les occurrences suivantes.
 * Si le texte d'origine change dans le code, l'empreinte change : la correction ne s'affiche
 * plus et l'onglet « Corriger les cours » de l'Espace prof la marque « à revoir ».
 *
 * Profs (leur périmètre) et équipe (tout) : bouton « Corriger cette leçon », puis mode
 * correction (on touche un bloc, une fenêtre s'ouvre avec aperçu) ; POST et DELETE
 * /api/prof/corrections. Le serveur vérifie le rôle et la matière de la leçon (src/lecons.js).
 *
 * Sécurité : le texte d'un prof n'est jamais inséré tel quel. Tout est échappé, puis seuls
 * **gras**, *italique*, <sup>, <sub> et les retours à la ligne redeviennent du HTML, hors des
 * formules ($…$, $$…$$, \(…\), \[…\]). Les commandes TeX dangereuses sont refusées ici et par
 * le serveur, et MathJax charge l'extension ui/safe (index.html).
 */
(function () {
    'use strict';

    if (typeof H === 'undefined' || typeof LECONS === 'undefined' || typeof window.ouvrirLecon !== 'function') {
        console.warn('Studicam : corrections de cours indisponibles');
        return;
    }

    const ANNEES = { '1ère Année': 'a1', '2ème Année': 'a2' };
    const LIBELLES_ANNEE = { a1: 'A1', a2: 'A2' };
    const NOMS_TYPE = { p: 'ce paragraphe', formule: 'cette formule', note: 'cet encadré', li: 'cette ligne de liste', td: 'cette case de tableau' };
    const COURTS_TYPE = { p: 'Paragraphe', formule: 'Formule', note: 'Encadré', li: 'Ligne de liste', td: 'Case de tableau' };
    const TEXTE_MAX = 3000;
    // type-empreinte, puis -N pour la Nᵉ occurrence d'un même texte dans la leçon
    const MOTIF_BLOC = /^(?:p|formule|note|li|td)-[0-9a-z]{1,12}(?:-(?:[2-9]|[1-9][0-9]{1,3}))?$/;
    // même liste que src/regles-corrections.js
    const MACROS_INTERDITES = /\\(?:href|url|class|cssId|style|html[A-Za-z]*|data|require|unicode|def|gdef|edef|xdef|let|futurelet|newcommand|renewcommand|providecommand|newenvironment|renewenvironment|DeclareMathOperator|mmlToken|Newextarrow|setOptions|rule|Rule|kern|mkern|mskip|hskip|hspace|mspace|Space|llap|rlap|clap|mathllap|mathrlap|mathclap|raise|lower|moveleft|moveright|raisebox)(?![A-Za-z])/;
    // formules dans un texte : $$…$$, \[…\], \(…\), $…$ (groupe capturant : split les garde)
    const MATHS = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/;
    const $ = (id) => document.getElementById(id);

    let moi = null;                    // {email, role, perimetre}
    const actives = new Map();         // « lecon/bloc » → {id, texte, nom, le}
    let enCours = null;                // leçon en train d'être affichée (substitutions actives)
    let collecte = null;               // Map bloc → {type, original} pendant un affichage
    let blocsAffiches = new Map();     // blocs de la dernière leçon affichée
    let leconAffichee = null;
    let modeCorrection = null;         // id de la leçon en mode correction

    // ---------- outils ----------
    function el(tag, cls, texte) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (texte != null) e.textContent = texte;
        return e;
    }
    function bouton(cls, texte) { const b = el('button', cls, texte); b.type = 'button'; return b; }
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    function dateFr(j) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(j || '')); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; }
    function icones() { if (window.lucide) lucide.createIcons(); }
    function toast(m) { if (typeof afficherToast === 'function') afficherToast(m); }

    // empreinte 53 bits (cyrb53), en base 36 : 11 caractères au plus
    function empreinte(texte) {
        let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (let i = 0; i < texte.length; i++) {
            const c = texte.charCodeAt(i);
            h1 = Math.imul(h1 ^ c, 2654435761);
            h2 = Math.imul(h2 ^ c, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    }

    async function api(methode, chemin, corps) {
        const r = await fetch(chemin, {
            method: methode,
            credentials: 'same-origin',
            headers: corps ? { 'Content-Type': 'application/json' } : {},
            body: corps ? JSON.stringify(corps) : undefined
        });
        if (r.status === 401) { location.replace('/connexion'); throw new Error('Non connecté'); }
        let donnees = null;
        try { donnees = await r.json(); } catch (e) { /* corps vide */ }
        if (!r.ok) throw new Error((donnees && donnees.erreur) || 'Erreur ' + r.status);
        return donnees;
    }

    // ---------- texte du prof → HTML sûr ----------
    function miseEnForme(t) {   // t est déjà échappé
        return t.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*\s](?:[^*\n]*?[^*\s])?)\*/g, '<em>$1</em>')
            .replace(/&lt;(\/?)(sup|sub)&gt;/g, '<$1$2>')
            .replace(/\n/g, '<br>');
    }
    function rendu(src, type) {
        if (type === 'formule') return esc(src);
        return String(src).split(MATHS).map((m, i) => (i % 2 ? esc(m) : miseEnForme(esc(m)))).join('');
    }

    // HTML d'origine → texte modifiable (gras et italique en **…** et *…*, entités décodées)
    function decoder(s) { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; }
    function horsMaths(s, f) { return String(s).split(MATHS).map((m, i) => (i % 2 ? m : f(m))).join(''); }
    function modifiable(original, type) {
        if (type === 'formule') return decoder(original).trim();
        const s = horsMaths(original, (m) => m
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
            .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*')
            .replace(/<(?!\/?(?:sup|sub)>)\/?[a-zA-Z][^>]*>/g, ''));
        return decoder(s).trim();
    }
    function miseEnFormePerdue(original, type) {
        if (type === 'formule') return false;
        let perdue = false;
        horsMaths(original, (m) => { if (/<\/?(?!(?:strong|b|em|i|sup|sub|br)\b)[a-zA-Z][^>]*>/.test(m)) perdue = true; return m; });
        return perdue;
    }

    // ---------- marquage des blocs ----------
    const ORIG = { p: H.p, formule: H.formule, note: H.note, liste: H.liste, listeNum: H.listeNum, tableau: H.tableau };
    const actif = () => enCours !== null || collecte !== null;

    function marque(c) {
        return `<span class="studicam-corrige mathjax_ignore" title="Corrigé par ${esc(c.nom)} le ${esc(dateFr(c.le))}">✎</span>`;
    }
    function bloc(type, t) {
        const original = String(t);
        if (!original.trim()) return { id: null, c: null, contenu: original };
        // même texte plusieurs fois dans la leçon (cases « 0 » d'une table) : -2, -3…
        const base = type + '-' + empreinte(type + '|' + original);
        let n = 1;
        while (collecte && collecte.has(n === 1 ? base : base + '-' + n)) n++;
        const id = n === 1 ? base : base + '-' + n;
        if (collecte) collecte.set(id, { type, original });
        const c = enCours ? actives.get(enCours + '/' + id) || null : null;
        return { id, c, contenu: c ? rendu(c.texte, type) + (type === 'formule' ? '' : marque(c)) : original };
    }
    function attribut(b) { return b.id ? ` data-bloc="${b.id}"` + (b.c ? ' data-corrige="1"' : '') : ''; }
    function poser(html, b) { return String(html).replace(/^<([a-z]+)/, (m, tag) => `<${tag}${attribut(b)}`); }

    for (const type of ['p', 'note']) {
        H[type] = function (t) {
            if (!actif()) return ORIG[type].apply(this, arguments);
            const b = bloc(type, t);
            return poser(ORIG[type](b.contenu), b);
        };
    }
    H.formule = function (t) {
        if (!actif()) return ORIG.formule.apply(this, arguments);
        const b = bloc('formule', t);
        let html = poser(ORIG.formule(b.contenu), b);
        if (b.c) html = html.replace(/<\/div>$/, marque(b.c) + '</div>');
        return html;
    };
    for (const nom of ['liste', 'listeNum']) {
        H[nom] = function (items) {
            if (!actif() || !Array.isArray(items)) return ORIG[nom].apply(this, arguments);
            const bs = items.map((i) => bloc('li', i));
            const html = ORIG[nom](bs.map((b) => b.contenu));
            if ((html.match(/<li>/g) || []).length !== bs.length) return html;
            let k = 0;
            return html.replace(/<li>/g, () => `<li${attribut(bs[k++])}>`);
        };
    }
    H.tableau = function (entetes, lignes, opt) {
        if (!actif() || !Array.isArray(entetes) || !Array.isArray(lignes) || !lignes.every(Array.isArray)) return ORIG.tableau.apply(this, arguments);
        const be = entetes.map((e) => bloc('td', e));
        const bl = lignes.map((l) => l.map((c) => bloc('td', c)));
        const html = ORIG.tableau(be.map((b) => b.contenu), bl.map((l) => l.map((b) => b.contenu)), opt);
        const tous = be.concat(...bl);
        const motif = /<(th|td) class=/g;
        if ((html.match(motif) || []).length !== tous.length) return html;
        let k = 0;
        return html.replace(motif, (m, tag) => `<${tag}${attribut(tous[k++])} class=`);
    };

    // blocs d'une leçon sans l'afficher (pour repérer les corrections à revoir)
    function blocsDe(idLecon) {
        const avant = collecte;
        collecte = new Map();
        try { LECONS[idLecon].sections(); return collecte; }
        catch (e) { return new Map(); }
        finally { collecte = avant; }
    }

    // ---------- droits (le serveur revérifie) ----------
    let lieux = null;
    function lieu(idLecon) {
        if (!lieux) {
            lieux = {};
            if (typeof CHAPITRES !== 'undefined') {
                for (const annee of Object.keys(CHAPITRES)) {
                    for (const mat of Object.keys(CHAPITRES[annee])) {
                        for (const c of CHAPITRES[annee][mat]) {
                            if (c.lecon && LECONS[c.lecon] && !lieux[c.lecon] && ANNEES[annee]) lieux[c.lecon] = { annee: ANNEES[annee], matiere: mat.toLowerCase() };
                        }
                    }
                }
            }
        }
        return lieux[idLecon] || null;
    }
    function peutCorriger(idLecon) {
        const l = lieu(idLecon);
        if (!l || !moi) return false;
        if (moi.role === 'equipe') return true;
        return moi.role === 'prof' && Array.isArray(moi.perimetre) && moi.perimetre.includes(l.annee + '/' + l.matiere);
    }
    function titreLecon(id) { return (LECONS[id] && LECONS[id].titre) || id; }

    // ---------- affichage d'une leçon ----------
    const ouvrirOriginal = window.ouvrirLecon;
    window.ouvrirLecon = function (id, ...reste) {
        if (id !== modeCorrection) modeCorrection = null;
        const connue = typeof id === 'string' && Object.hasOwn(LECONS, id);
        enCours = connue ? id : null;
        collecte = connue ? new Map() : null;
        let r, vus = null;
        try { r = ouvrirOriginal.call(this, id, ...reste); }
        finally {
            vus = collecte;
            enCours = null;
            collecte = null;
        }
        // blocs réellement posés dans la page (un second appel de sections(), pour les titres
        // des onglets, ne compte pas)
        blocsAffiches = new Map();
        const zone = $('lecon-contenu');
        if (vus && zone) zone.querySelectorAll('[data-bloc]').forEach((n) => {
            const info = vus.get(n.dataset.bloc);
            if (info) blocsAffiches.set(n.dataset.bloc, info);
        });
        leconAffichee = connue ? id : null;
        try { apresLecon(); } catch (e) { console.warn('Studicam : corrections', e); }
        if (connue && !chargees.has(id)) charger(id);
        return r;
    };

    // ---------- corrections d'une leçon, chargées à sa première ouverture ----------
    const chargees = new Set();
    const enChargement = new Set();
    async function charger(id) {
        if (enChargement.has(id)) return;
        enChargement.add(id);
        try {
            const d = await api('GET', '/api/corrections?lecon=' + encodeURIComponent(id));
            for (const cle of [...actives.keys()]) if (cle.startsWith(id + '/')) actives.delete(cle);
            for (const c of (d && d.corrections) || []) {
                if (c.lecon === id && typeof c.bloc === 'string' && MOTIF_BLOC.test(c.bloc) && typeof c.texte === 'string') {
                    actives.set(id + '/' + c.bloc, { id: c.id, texte: c.texte, nom: String(c.nom || 'Un prof'), le: c.le });
                }
            }
            chargees.add(id);
            if (leconVisible() && leconAffichee === id) appliquerSurPlace(id);
        } catch (e) {
            console.warn('Studicam : corrections non chargées', e);
        } finally {
            enChargement.delete(id);
        }
    }

    // pose les corrections arrivées après l'affichage, bloc par bloc, sans réafficher la leçon
    // (les réponses en cours dans les mini-exercices et le bouton « Revenir à l'exercice » restent)
    function appliquerSurPlace(id) {
        const zone = $('lecon-contenu');
        if (!zone) return;
        const poses = [];
        for (const c of correctionsDe(id)) {
            const n = zone.querySelector(`[data-bloc="${c.bloc}"]`);
            if (!n || n.hasAttribute('data-corrige')) continue;
            const type = c.bloc.split('-')[0];
            const h = rendu(c.texte, type);
            if (window.MathJax && MathJax.typesetClear) MathJax.typesetClear([n]);
            n.innerHTML = type === 'formule' ? '$$' + h + '$$' + marque(c) : h + marque(c);
            n.setAttribute('data-corrige', '1');
            poses.push(n);
        }
        if (poses.length && window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise(poses).catch((e) => console.warn(e));
        apresLecon();
    }

    function leconVisible() {
        const e = $('etape-lecon-generique');
        return !!(e && !e.classList.contains('hidden') && leconAffichee);
    }
    function correctionsDe(idLecon) {
        const liste = [];
        for (const [cle, c] of actives) if (cle.startsWith(idLecon + '/')) liste.push({ ...c, bloc: cle.slice(idLecon.length + 1) });
        return liste;
    }

    // réaffiche la leçon au même endroit (après une correction ou au chargement des corrections)
    function reafficher(blocVise) {
        if (!leconVisible()) return;
        const y = window.scrollY;
        window.ouvrirLecon(leconAffichee);
        window.scrollTo(0, y);
        if (blocVise) eclairer(blocVise);
    }
    function eclairer(idBloc) {
        if (!MOTIF_BLOC.test(idBloc)) return;
        const n = document.querySelector(`#lecon-contenu [data-bloc="${idBloc}"]`);
        if (!n) return;
        n.scrollIntoView({ behavior: 'smooth', block: 'center' });
        n.style.boxShadow = '0 0 0 3px rgba(52, 211, 153, .8)';
        setTimeout(() => { n.style.boxShadow = ''; }, 2600);
    }

    function apresLecon() {
        const contenu = $('lecon-contenu');
        if (!contenu) return;
        const id = leconAffichee;
        contenu.classList.toggle('studicam-mode-correction', !!id && modeCorrection === id);
        enTete(id);
        bandeau(id);
    }

    function enTete(id) {
        const titre = $('lecon-titre');
        if (!titre) return;
        let zone = $('studicam-corrections-lecon');
        if (!zone) {
            zone = el('div', 'mathjax_ignore flex flex-wrap items-center gap-2 pt-1');
            zone.id = 'studicam-corrections-lecon';
            titre.after(zone);
        }
        zone.replaceChildren();
        if (!id) return;
        const affichees = correctionsDe(id).filter((c) => blocsAffiches.has(c.bloc));
        if (affichees.length) {
            const noms = [...new Set(affichees.map((c) => c.nom))];
            const texte = 'Corrigée par ' + (noms.length === 1 ? noms[0] : noms.slice(0, -1).join(', ') + ' et ' + noms[noms.length - 1]);
            const b = el('span', 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-500/10 text-emerald-300 border-emerald-500/30');
            b.append(el('span', null, '✎'), el('span', null, texte));
            b.title = 'Passages marqués ✎ : corrigés par un prof de l\'ICAM';
            zone.appendChild(b);
        }
        if (peutCorriger(id) && modeCorrection !== id) {
            const b = bouton('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-blue-500/10 text-blue-300 border-blue-500/30 hover:border-blue-400 transition-colors');
            const i = el('i', 'w-3.5 h-3.5');
            i.dataset.lucide = 'pencil';
            b.append(i, el('span', null, 'Corriger cette leçon'));
            b.addEventListener('click', () => corrigerLecon(id));
            zone.appendChild(b);
        }
        icones();
    }

    function bandeau(id) {
        let zone = $('studicam-bandeau-correction');
        const actifIci = !!id && modeCorrection === id;
        if (!actifIci) { if (zone) zone.remove(); return; }
        if (!zone) {
            zone = el('div', 'mathjax_ignore sticky top-20 z-20 rounded-2xl border border-blue-500/40 bg-darkcard p-4 shadow-xl space-y-3');
            zone.id = 'studicam-bandeau-correction';
            $('lecon-contenu').before(zone);
        }
        zone.replaceChildren();
        const haut = el('div', 'flex flex-wrap items-center gap-3');
        haut.appendChild(el('span', 'text-sm font-bold text-blue-300', 'Mode correction'));
        const fin = bouton('ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white', 'Terminer');
        fin.addEventListener('click', () => { modeCorrection = null; reafficher(); });
        const espace = bouton('text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-400', 'Liste des corrections');
        espace.addEventListener('click', () => { modeCorrection = null; window.studicamEspaceProf && window.studicamEspaceProf.ouvrir('cours'); });
        haut.append(espace, fin);
        zone.appendChild(haut);
        zone.appendChild(el('p', 'text-xs text-slate-300 leading-relaxed',
            'Touchez un paragraphe, une formule, un encadré, une ligne de liste ou une case de tableau pour le corriger. '
            + 'Les élèves voient la correction dès que vous l\'enregistrez, avec votre nom. Le texte d\'origine est toujours gardé. '
            + 'Les figures et les exercices interactifs ne se corrigent pas ici : utilisez « Signaler une erreur ».'));
        const orphelines = correctionsDe(id).filter((c) => !blocsAffiches.has(c.bloc));
        if (orphelines.length) {
            zone.appendChild(el('p', 'text-xs text-amber-300',
                `${orphelines.length} correction${orphelines.length > 1 ? 's' : ''} de cette leçon ne correspond${orphelines.length > 1 ? 'ent' : ''} plus au cours, qui a été modifié depuis : voir la liste des corrections.`));
        }
    }

    function corrigerLecon(id, blocVise) {
        if (!peutCorriger(id)) return;
        modeCorrection = id;
        window.ouvrirLecon(id);
        if (blocVise) setTimeout(() => eclairer(blocVise), 80);
    }

    // clic sur un bloc en mode correction (capture : avant les autres boutons du bloc)
    document.addEventListener('click', (ev) => {
        if (!modeCorrection || leconAffichee !== modeCorrection) return;
        const cible = ev.target instanceof Element ? ev.target.closest('#lecon-contenu [data-bloc]') : null;
        if (!cible) return;
        ev.preventDefault();
        ev.stopPropagation();
        const id = cible.dataset.bloc;
        const info = blocsAffiches.get(id);
        if (info) ouvrirEditeur(leconAffichee, id, info);
    }, true);

    // ---------- fenêtre de correction ----------
    function apercuHTML(type, src) {
        const h = rendu(src, type);
        if (type === 'formule') return ORIG.formule(h);
        if (type === 'note') return ORIG.note(h);
        if (type === 'li') return ORIG.liste([h]);
        if (type === 'td') return `<div class="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-200">${h}</div>`;
        return ORIG.p(h);
    }

    function ouvrirEditeur(idLecon, idBloc, info) {
        const ancien = $('studicam-editeur');
        if (ancien) ancien.remove();
        if ([...info.original].length > TEXTE_MAX) {
            toast('Ce passage est trop long pour être corrigé ici (il contient sans doute une figure) : utilisez « Signaler une erreur ».');
            return;
        }
        const existante = actives.get(idLecon + '/' + idBloc) || null;
        const depart = existante ? existante.texte : modifiable(info.original, info.type);
        const origineTexte = modifiable(info.original, info.type);

        const fond = el('div', 'mathjax_ignore fixed inset-0 z-[80] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4');
        fond.id = 'studicam-editeur';
        const boite = el('div', 'w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-darkcard border border-darkborder rounded-t-2xl sm:rounded-2xl p-5 space-y-4 shadow-2xl text-left');
        boite.setAttribute('role', 'dialog');
        boite.setAttribute('aria-modal', 'true');
        boite.appendChild(el('h2', 'text-lg font-bold text-white', 'Corriger ' + (NOMS_TYPE[info.type] || 'ce passage')));
        boite.appendChild(el('p', 'text-xs text-slate-400', titreLecon(idLecon)));

        if (existante) {
            const ligne = el('div', 'flex flex-wrap items-center gap-2 text-xs text-emerald-300');
            ligne.appendChild(el('span', null, `Correction affichée de ${existante.nom}, le ${dateFr(existante.le)}.`));
            const retour = bouton('text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-600 text-slate-300 hover:border-red-400 hover:text-red-300', 'Revenir au texte d\'origine');
            retour.addEventListener('click', () => annulerDepuisEditeur(existante, retour));
            ligne.appendChild(retour);
            boite.appendChild(ligne);
        }

        const outils = el('div', 'flex flex-wrap items-center gap-2');
        const zone = el('textarea', 'w-full min-h-[9rem] rounded-xl bg-slate-950 border border-slate-700 focus:border-blue-400 outline-none p-3 text-sm text-slate-100 leading-relaxed' + (info.type === 'formule' ? ' font-mono' : ''));
        zone.value = depart;
        zone.maxLength = TEXTE_MAX;
        zone.setAttribute('aria-label', 'Texte corrigé');
        if (info.type !== 'formule') {
            const outil = (texte, avant, apres, titre) => {
                const b = bouton('text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500', texte);
                b.title = titre;
                b.addEventListener('click', () => entourer(zone, avant, apres));
                outils.appendChild(b);
            };
            outil('Gras', '**', '**', '**texte**');
            outil('Italique', '*', '*', '*texte*');
            outil('Formule', '$', '$', '$x^2$');
            outil('Exposant', '<sup>', '</sup>', '<sup>texte</sup>');
            outil('Indice', '<sub>', '</sub>', '<sub>texte</sub>');
            boite.appendChild(outils);
        }
        boite.appendChild(zone);
        boite.appendChild(el('p', 'text-[11px] text-slate-500 leading-relaxed', info.type === 'formule'
            ? 'Code LaTeX de la formule, sans les $$ autour.'
            : '**gras**, *italique*, $x^2$ pour une formule dans le texte, $$…$$ pour une formule centrée. Retour à la ligne : Entrée.'));
        if (miseEnFormePerdue(info.original, info.type)) {
            boite.appendChild(el('p', 'text-[11px] text-amber-300', 'Ce passage avait une mise en forme spéciale (couleurs, liens) : elle sera simplifiée par la correction.'));
        }

        boite.appendChild(el('h3', 'text-xs font-bold uppercase tracking-wider text-slate-400', 'Aperçu'));
        const apercu = el('div', 'mathjax_process rounded-xl border border-dashed border-slate-700 p-3');
        boite.appendChild(apercu);
        const alerte = el('p', 'hidden text-xs text-red-400');
        boite.appendChild(alerte);

        const details = el('details', 'text-xs text-slate-400');
        details.appendChild(el('summary', 'cursor-pointer select-none', 'Texte d\'origine'));
        details.appendChild(el('pre', 'mt-2 whitespace-pre-wrap break-words font-sans text-slate-300 bg-slate-950/60 rounded-lg p-3', origineTexte));
        boite.appendChild(details);

        boite.appendChild(el('p', 'text-[11px] text-slate-500 leading-relaxed',
            'En enregistrant, vous publiez cette correction avec votre nom, sous la licence des cours de Studicam (CC BY-NC-SA 4.0). '
            + 'L\'équipe Studicam et les profs de la matière peuvent revenir au texte d\'origine.'));

        const pied = el('div', 'flex flex-wrap justify-end gap-2 pt-1');
        const fermer = bouton('text-sm px-4 py-2 rounded-xl border border-slate-600 text-slate-300 hover:border-slate-400', 'Fermer');
        const enregistrer = bouton('text-sm font-semibold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed', 'Enregistrer');
        pied.append(fermer, enregistrer);
        boite.appendChild(pied);
        fond.appendChild(boite);
        document.body.appendChild(fond);

        let minuterie = null;
        const majApercu = () => {
            const src = zone.value.trim();
            const interdite = MACROS_INTERDITES.test(src);
            alerte.classList.toggle('hidden', !interdite);
            alerte.textContent = interdite ? 'Cette commande LaTeX n\'est pas acceptée (liens, styles, définitions de macros).' : '';
            enregistrer.disabled = !src || interdite || src === depart || [...src].length > TEXTE_MAX;
            clearTimeout(minuterie);
            minuterie = setTimeout(() => {
                if (window.MathJax && MathJax.typesetClear) MathJax.typesetClear([apercu]);
                apercu.innerHTML = interdite ? '' : apercuHTML(info.type, src);
                if (!interdite && window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([apercu]).catch((e) => console.warn(e));
            }, 250);
        };
        zone.addEventListener('input', majApercu);
        majApercu();

        const clore = () => { document.removeEventListener('keydown', touche, true); fond.remove(); };
        const touche = (e) => { if (e.key === 'Escape') { e.preventDefault(); clore(); } };
        document.addEventListener('keydown', touche, true);
        fermer.addEventListener('click', clore);
        fond.addEventListener('click', (e) => { if (e.target === fond) clore(); });
        enregistrer.addEventListener('click', async () => {
            enregistrer.disabled = true;
            enregistrer.textContent = 'Enregistrement…';
            try {
                const r = await api('POST', '/api/prof/corrections', { lecon: idLecon, bloc: idBloc, original: info.original, texte: zone.value.trim() });
                const c = r.correction;
                actives.set(idLecon + '/' + idBloc, { id: c.id, texte: c.texte, nom: c.nom, le: c.le });
                clore();
                reafficher(idBloc);
                toast('Correction enregistrée : les élèves la voient déjà.');
            } catch (e) {
                alerte.classList.remove('hidden');
                alerte.textContent = e.message;
                enregistrer.disabled = false;
                enregistrer.textContent = 'Enregistrer';
            }
        });
        setTimeout(() => zone.focus(), 30);

        async function annulerDepuisEditeur(c, b) {
            b.disabled = true;
            try {
                await api('DELETE', '/api/prof/corrections', { id: c.id });
                actives.delete(idLecon + '/' + idBloc);
                clore();
                reafficher(idBloc);
                toast('Texte d\'origine rétabli.');
            } catch (e) {
                alerte.classList.remove('hidden');
                alerte.textContent = e.message;
                b.disabled = false;
            }
        }
    }

    function entourer(zone, avant, apres) {
        const d = zone.selectionStart, f = zone.selectionEnd, v = zone.value;
        zone.value = v.slice(0, d) + avant + v.slice(d, f) + apres + v.slice(f);
        zone.focus();
        zone.setSelectionRange(d + avant.length, f + avant.length);
        zone.dispatchEvent(new Event('input'));
    }

    // ---------- onglet « Corriger les cours » de l'Espace prof ----------
    async function afficherSection(conteneur, moiProf) {
        if (moiProf) moi = moiProf;
        conteneur.classList.add('mathjax_ignore');
        conteneur.appendChild(el('p', 'text-sm text-slate-300 leading-relaxed',
            'Ouvrez une leçon de votre matière et touchez le passage à corriger (paragraphe, formule, encadré, ligne de liste ou case de tableau). '
            + 'La correction remplace le texte pour les élèves dès l\'enregistrement, avec votre nom. Le texte d\'origine est gardé : on peut y revenir à tout moment.'));

        // leçons du périmètre, par année et matière
        const groupes = [];
        if (typeof CHAPITRES !== 'undefined') {
            for (const annee of Object.keys(CHAPITRES)) {
                for (const mat of Object.keys(CHAPITRES[annee])) {
                    const ids = CHAPITRES[annee][mat].map((c) => c.lecon).filter((l) => l && LECONS[l] && peutCorriger(l));
                    const uniques = [...new Set(ids)];
                    if (uniques.length) groupes.push({ titre: `${LIBELLES_ANNEE[ANNEES[annee]] || annee} · ${mat}`, ids: uniques });
                }
            }
        }
        const blocLecons = el('div', 'bg-darkcard border border-darkborder rounded-2xl p-5 space-y-3');
        blocLecons.appendChild(el('h2', 'text-sm font-bold uppercase tracking-wider text-slate-400', 'Vos leçons'));
        if (!groupes.length) blocLecons.appendChild(el('p', 'text-sm text-slate-400', 'Aucune leçon dans votre périmètre pour l\'instant.'));
        for (const g of groupes) {
            const d = el('details', 'group');
            if (groupes.length <= 3) d.open = true;
            d.appendChild(el('summary', 'cursor-pointer select-none text-sm font-semibold text-slate-200 py-1', `${g.titre} (${g.ids.length})`));
            const liste = el('div', 'flex flex-wrap gap-2 pt-2 pb-1');
            for (const id of g.ids) {
                const b = bouton('text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:border-blue-400 hover:text-blue-200 text-left', titreLecon(id));
                b.addEventListener('click', () => corrigerLecon(id));
                liste.appendChild(b);
            }
            d.appendChild(liste);
            blocLecons.appendChild(d);
        }
        conteneur.appendChild(blocLecons);

        const blocListe = el('div', 'space-y-3');
        blocListe.appendChild(el('h2', 'text-sm font-bold uppercase tracking-wider text-slate-400', 'Corrections'));
        const attente = el('p', 'text-sm text-slate-400', 'Chargement…');
        blocListe.appendChild(attente);
        conteneur.appendChild(blocListe);

        let donnees;
        try { donnees = await api('GET', '/api/prof/corrections'); }
        catch (e) { attente.textContent = 'Liste indisponible : ' + e.message; attente.className = 'text-sm text-red-400'; return; }
        const liste = (donnees && donnees.corrections) || [];
        if (!liste.length) { attente.textContent = 'Aucune correction pour l\'instant.'; return; }
        attente.remove();

        const blocsParLecon = new Map();
        const blocsDeLecon = (id) => {
            if (!blocsParLecon.has(id)) blocsParLecon.set(id, LECONS[id] ? blocsDe(id) : new Map());
            return blocsParLecon.get(id);
        };
        for (const c of liste) blocListe.appendChild(carte(c, blocsDeLecon(c.lecon), conteneur));
    }

    function carte(c, blocs, conteneur) {
        const info = blocs.get(c.bloc);
        const typeBloc = String(c.bloc).split('-')[0];
        const aRevoir = c.statut === 'active' && !info;
        const statut = aRevoir ? ['À revoir', 'bg-amber-500/10 text-amber-300 border-amber-500/30']
            : c.statut === 'active' ? ['Affichée', 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30']
                : c.statut === 'remplacee' ? ['Remplacée', 'bg-slate-800 text-slate-400 border-slate-700']
                    : ['Annulée', 'bg-slate-800 text-slate-400 border-slate-700'];
        const art = el('article', 'bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2' + (c.statut === 'active' ? '' : ' opacity-70'));
        const haut = el('div', 'flex flex-wrap items-center gap-2 text-xs');
        haut.appendChild(el('span', `px-2 py-0.5 rounded-md border font-semibold ${statut[1]}`, statut[0]));
        haut.appendChild(el('span', 'font-semibold text-slate-200', titreLecon(c.lecon)));
        haut.appendChild(el('span', 'font-mono text-slate-400', `${LIBELLES_ANNEE[c.annee] || c.annee} · ${String(c.matiere).toUpperCase()} · ${COURTS_TYPE[typeBloc] || typeBloc}`));
        art.appendChild(haut);
        let qui = `Par ${c.nom}${c.email_prof ? ' (' + c.email_prof + ')' : ''}, le ${dateFr(c.cree_le)}`;
        if (c.statut === 'annulee' && c.annule_par) qui += ` · annulée par ${c.annule_par} le ${dateFr(c.annule_le)}`;
        art.appendChild(el('p', 'text-xs text-slate-400', qui));
        if (aRevoir) art.appendChild(el('p', 'text-xs text-amber-300', 'Le texte d\'origine a changé dans le cours : cette correction ne s\'affiche plus. À reporter à la main si elle est encore utile.'));
        const deux = el('div', 'grid sm:grid-cols-2 gap-2');
        const colonne = (titre, texte) => {
            const d = el('div', 'rounded-lg bg-slate-950/60 border border-slate-800 p-2.5 space-y-1');
            d.appendChild(el('div', 'text-[10px] font-bold uppercase tracking-wider text-slate-500', titre));
            d.appendChild(el('pre', 'whitespace-pre-wrap break-words font-sans text-xs text-slate-200', texte));
            return d;
        };
        // « Avant » : le texte réel du cours quand le bloc existe encore (pas celui envoyé avec la correction)
        deux.append(colonne('Avant', modifiable(info ? info.original : c.original, typeBloc)), colonne('Après', c.texte));
        art.appendChild(deux);
        const actions = el('div', 'flex flex-wrap gap-2 pt-1');
        if (LECONS[c.lecon] && peutCorriger(c.lecon)) {
            const voir = bouton('text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:border-blue-400 hover:text-blue-200', 'Voir dans la leçon');
            voir.addEventListener('click', () => corrigerLecon(c.lecon, info ? c.bloc : null));
            actions.appendChild(voir);
        }
        if (c.statut === 'active') {
            const annuler = bouton('text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:border-red-400 hover:text-red-300', 'Revenir au texte d\'origine');
            annuler.addEventListener('click', async () => {
                annuler.disabled = true;
                try {
                    await api('DELETE', '/api/prof/corrections', { id: c.id });
                    actives.delete(c.lecon + '/' + c.bloc);
                    toast('Texte d\'origine rétabli.');
                    if (window.studicamEspaceProf) window.studicamEspaceProf.ouvrir('cours');
                } catch (e) { annuler.disabled = false; toast(e.message); }
            });
            actions.appendChild(annuler);
        }
        if (actions.childNodes.length) art.appendChild(actions);
        return art;
    }

    // ---------- démarrage ----------
    const style = document.createElement('style');
    style.textContent = ''
        + '.studicam-mode-correction [data-bloc]{cursor:pointer;outline:1px dashed rgba(148,163,184,.3);outline-offset:3px;border-radius:6px}'
        + '.studicam-mode-correction td[data-bloc],.studicam-mode-correction th[data-bloc]{outline-offset:-2px;border-radius:0}'
        + '.studicam-mode-correction [data-bloc]:hover{outline:2px dashed rgba(96,165,250,.9)}'
        + '.studicam-mode-correction [data-corrige]{outline-color:rgba(52,211,153,.7)}'
        + '.studicam-corrige{font-size:10px;color:rgba(110,231,183,.85);margin-left:3px;vertical-align:super;cursor:help}';
    document.head.appendChild(style);

    function recevoirMoi(m) {
        moi = m && (m.role === 'prof' || m.role === 'equipe') ? m : null;
        if (moi && window.studicamEspaceProf) {
            window.studicamEspaceProf.ajouterSection({ id: 'cours', titre: 'Corriger les cours', afficher: afficherSection });
        }
        if (leconVisible()) apresLecon();
    }
    if (typeof window.studicamMoi === 'function' && window.studicamMoi()) recevoirMoi(window.studicamMoi());
    document.addEventListener('studicam:moi', (e) => recevoirMoi(e.detail));

})();
