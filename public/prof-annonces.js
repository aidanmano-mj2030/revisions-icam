/*
 * Studicam : annonces des profs (« DS jeudi, revoir les chapitres 2 et 4 »).
 *
 * Chargé à la fin de index.html, après prof.js. Deux parties :
 *
 * 1. Élèves (et tout connecté) : ouvrirMatiere() est enveloppée, sans être réécrite. Après
 *    l'affichage de la liste des chapitres, on lit GET /api/annonces?annee=a2&matiere=ce et on
 *    épingle les annonces en cours en tête de la vue (#studicam-annonces, avant
 *    #liste-chapitres) ; les chapitres cités sont entourés et marqués « À revoir ».
 *    Le serveur ne renvoie que les annonces en cours (fin incluse) et de la promo de l'élève.
 *
 * 2. Profs : section « Annonces » de l'Espace prof (window.studicamEspaceProf.ajouterSection) :
 *    liste du périmètre, création (matière limitée au périmètre, chapitres à cocher depuis
 *    CHAPITRES), suppression. Le serveur revérifie rôle et périmètre à chaque requête.
 *
 * Identifiant d'un chapitre : chap.lecon ; pour les deux chapitres interactifs sans leçon,
 * « liaisons » (CM A1) et « produit-scalaire » (CM A2), comme les clés de progression.js.
 * Tout texte venant du serveur s'affiche par textContent. Bandeau, cartes et section prof portent
 * la classe « mathjax_ignore » : chargerIconesEtMaths() passe MathJax sur toute la page, et un
 * « $\href{javascript:...}{...}$ » écrit dans une annonce ne doit jamais devenir un lien.
 */
(function () {
    'use strict';

    const ANNEES = { '1ère Année': 'a1', '2ème Année': 'a2' };
    const LIBELLES_ANNEES = { a1: '1ère année', a2: '2ème année' };
    const TEXTE_MAX = 500;
    const DUREE_CACHE = 60 * 1000;   // une annonce créée apparaît au plus une minute après
    const $ = (id) => document.getElementById(id);
    const cache = new Map();         // "a2/ce" → {t, annonces}
    const SANS_MATHJAX = 'mathjax_ignore';  // ignoreHtmlClass par défaut de MathJax 3

    function el(tag, cls, texte) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (texte != null) e.textContent = texte;
        return e;
    }
    function icones() {
        try { if (window.lucide) lucide.createIcons(); } catch (e) { /* rien */ }
    }

    async function api(methode, chemin, corps) {
        const r = await fetch(chemin, {
            method: methode,
            credentials: 'same-origin',
            headers: corps ? { 'Content-Type': 'application/json' } : {},
            body: corps ? JSON.stringify(corps) : undefined
        });
        if (r.status === 401) { location.replace('/connexion'); throw new Error('session expirée'); }
        let donnees = null;
        try { donnees = await r.json(); } catch (e) { /* corps vide */ }
        return { ok: r.ok, statut: r.status, donnees: donnees || {} };
    }

    // ---------- dates (heure de Paris, comme le serveur) ----------
    function aujourdhui() {
        const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })
            .formatToParts(new Date());
        const v = (t) => p.find(x => x.type === t).value;
        return `${v('year')}-${v('month')}-${v('day')}`;
    }
    function plusJours(date, n) {
        return new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
    }
    function dateLisible(date, avecJour) {
        const d = new Date(date + 'T12:00:00Z');
        if (Number.isNaN(d.getTime())) return date;
        return d.toLocaleDateString('fr-FR', { timeZone: 'UTC', weekday: avecJour ? 'long' : undefined, day: 'numeric', month: 'long' });
    }
    function jusquau(fin) {
        const j = aujourdhui();
        if (fin === j) return "jusqu'à ce soir";
        if (fin === plusJours(j, 1)) return "jusqu'à demain soir";
        return "jusqu'au " + dateLisible(fin, true);
    }

    // ---------- chapitres de la page ----------
    function idChapitre(chap) {
        if (chap.lecon) return chap.lecon;
        if (chap.interactifA1) return 'liaisons';
        if (chap.interactif) return 'produit-scalaire';
        return null;
    }
    function libelleAnneePage(annee) {
        return Object.keys(ANNEES).find(k => ANNEES[k] === annee) || null;
    }
    // [{id, chap}] des chapitres désignables d'une matière, dans l'ordre de CHAPITRES.
    function chapitresDe(annee, matiere) {
        if (typeof CHAPITRES === 'undefined') return [];
        const libelle = libelleAnneePage(annee);
        const liste = (libelle && CHAPITRES[libelle] && CHAPITRES[libelle][matiere.toUpperCase()]) || [];
        return liste.map(chap => ({ id: idChapitre(chap), chap })).filter(c => c.id);
    }
    function nomMatiere(matiere) {
        if (typeof MATIERES !== 'undefined') {
            for (const cat of Object.keys(MATIERES)) {
                const m = MATIERES[cat].find(x => x.id.toLowerCase() === matiere);
                if (m) return m.nom;
            }
        }
        return matiere.toUpperCase();
    }
    function libellePaire(annee, matiere) {
        return `${LIBELLES_ANNEES[annee] || annee} · ${nomMatiere(matiere)}`;
    }

    // =====================================================================
    // 1. Élèves : bandeau épinglé et chapitres mis en évidence
    // =====================================================================
    async function lireAnnonces(annee, matiere) {
        const cle = annee + '/' + matiere;
        const vu = cache.get(cle);
        if (vu && Date.now() - vu.t < DUREE_CACHE) return vu.annonces;
        const r = await api('GET', `/api/annonces?annee=${encodeURIComponent(annee)}&matiere=${encodeURIComponent(matiere)}`);
        if (!r.ok) { console.warn('Studicam : /api/annonces', r.statut); return []; }
        const annonces = Array.isArray(r.donnees.annonces) ? r.donnees.annonces : [];
        cache.set(cle, { t: Date.now(), annonces });
        return annonces;
    }

    function retirerBandeau() {
        const ancien = $('studicam-annonces');
        if (ancien) ancien.remove();
    }

    function carteAnnonce(a, chapitres) {
        const carte = el('article', SANS_MATHJAX + ' rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 space-y-3 shadow-lg');
        const tete = el('div', 'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold uppercase tracking-wider text-amber-400');
        const icone = el('i', 'w-3.5 h-3.5');
        icone.dataset.lucide = 'pin';
        tete.append(icone, el('span', null, 'Annonce'), el('span', 'text-amber-500/70 normal-case tracking-normal font-semibold', '· ' + jusquau(a.fin)));
        carte.appendChild(tete);
        carte.appendChild(el('p', 'text-sm sm:text-base text-slate-200 whitespace-pre-line break-words leading-relaxed', a.texte));

        const cites = chapitres.filter(c => (a.chapitres || []).includes(c.id));
        if (cites.length) {
            const zone = el('div', 'flex flex-wrap items-center gap-2');
            zone.appendChild(el('span', 'text-xs font-semibold text-slate-400', 'À revoir :'));
            cites.forEach(c => {
                const b = el('button', 'text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500/30 text-amber-300 hover:border-amber-400 transition-colors text-left', `${c.chap.num} · ${c.chap.titre}`);
                b.type = 'button';
                b.addEventListener('click', () => {
                    const carteChap = document.querySelector(`#liste-chapitres [data-studicam-annonce="${CSS.escape(c.id)}"]`);
                    if (carteChap) carteChap.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
                zone.appendChild(b);
            });
            carte.appendChild(zone);
        }
        if (a.auteur) carte.appendChild(el('p', 'text-xs text-slate-500 break-all', a.auteur));
        return carte;
    }

    function marquerChapitres(chapitresPage, ids) {
        const liste = $('liste-chapitres');
        if (!liste) return;
        const cartes = [...liste.children];
        chapitresPage.forEach((chap, i) => {
            const carte = cartes[i];
            const id = idChapitre(chap);
            if (!carte || !id || !ids.has(id)) return;
            carte.dataset.studicamAnnonce = id;
            carte.classList.add('ring-2', 'ring-amber-500/50');
            const entete = carte.querySelector(':scope > div');
            if (!entete || entete.querySelector('[data-annonce-badge]')) return;
            const badge = el('span', 'inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold border align-middle whitespace-nowrap bg-amber-500/15 text-amber-300 border-amber-500/30', 'À revoir');
            badge.dataset.annonceBadge = '1';
            const num = entete.querySelector('span');
            if (num) num.after(badge); else entete.prepend(badge);
        });
    }

    async function afficherAnnoncesMatiere(matiere) {
        retirerBandeau();
        if (!matiere || typeof anneeSelectionnee === 'undefined') return;
        const annee = ANNEES[anneeSelectionnee];
        if (!annee) return;
        const mat = String(matiere.id).toLowerCase();
        let annonces;
        try { annonces = await lireAnnonces(annee, mat); }
        catch (e) { console.warn('Studicam : annonces illisibles', e); return; }
        // l'élève a pu changer de matière pendant la lecture
        if (matiereSelectionnee !== matiere || ANNEES[anneeSelectionnee] !== annee) return;
        const etape = $('etape-chapitres-liste'), liste = $('liste-chapitres');
        if (!annonces.length || !etape || !liste || etape.classList.contains('hidden')) return;

        retirerBandeau();
        const chapitres = chapitresDe(annee, mat);
        const bandeau = el('section', SANS_MATHJAX + ' space-y-3');
        bandeau.id = 'studicam-annonces';
        bandeau.setAttribute('aria-label', 'Annonces des profs');
        annonces.forEach(a => bandeau.appendChild(carteAnnonce(a, chapitres)));
        liste.before(bandeau);

        const chapitresPage = (CHAPITRES[anneeSelectionnee] && CHAPITRES[anneeSelectionnee][matiere.id]) || [];
        marquerChapitres(chapitresPage, new Set(annonces.flatMap(a => a.chapitres || [])));
        icones();
    }

    (function () {
        const original = window.ouvrirMatiere;
        if (typeof original !== 'function') { console.warn('Studicam : fonction absente', 'ouvrirMatiere'); return; }
        window.ouvrirMatiere = function (matiere, ...reste) {
            const r = original.call(this, matiere, ...reste);
            afficherAnnoncesMatiere(matiere).catch(e => console.warn('Studicam : annonces', e));
            return r;
        };
    })();

    // =====================================================================
    // 2. Profs : section « Annonces » de l'Espace prof
    // =====================================================================
    const CLASSE_CHAMP = 'w-full rounded-lg px-3 py-2 text-sm text-slate-100 bg-slate-950 border border-slate-700 focus:outline-none focus:border-amber-400';
    const ETATS = {
        en_cours: ['En cours', 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'],
        a_venir: ['À venir', 'bg-blue-500/10 text-blue-300 border-blue-500/30'],
        terminee: ['Terminée', 'bg-slate-800 text-slate-400 border-slate-700']
    };

    // Paires année/matière proposées : celles du périmètre, ou toutes pour l'équipe.
    function pairesDe(moi) {
        if (moi.role === 'equipe') {
            const toutes = [];
            const matieres = typeof MATIERES !== 'undefined' ? Object.values(MATIERES).flat().map(m => m.id.toLowerCase()) : [];
            ['a1', 'a2'].forEach(a => matieres.forEach(m => toutes.push(a + '/' + m)));
            return toutes;
        }
        return Array.isArray(moi.perimetre) ? moi.perimetre.filter(p => /^a[12]\/[a-z]+$/.test(p)) : [];
    }

    function champ(libelle, controle, aide) {
        const bloc = el('label', 'block space-y-1');
        bloc.appendChild(el('span', 'block text-xs font-semibold text-slate-400', libelle));
        bloc.appendChild(controle);
        if (aide) bloc.appendChild(el('span', 'block text-[11px] text-slate-500', aide));
        return bloc;
    }

    function afficherSection(conteneurProf, moi) {
        conteneurProf.replaceChildren();
        // tout le contenu de la section, formulaire compris, hors de portée de MathJax
        const conteneur = el('div', SANS_MATHJAX + ' space-y-4');
        conteneurProf.appendChild(conteneur);
        const paires = pairesDe(moi);
        conteneur.appendChild(el('p', 'text-sm text-slate-400 leading-relaxed',
            "Message épinglé en tête de la matière pour les élèves, du début à la fin incluse, puis plus rien. "
            + "Les chapitres cochés sont mis en évidence dans la liste des chapitres."));
        if (!paires.length) {
            conteneur.appendChild(el('p', 'text-sm text-slate-400', "Aucune matière dans votre périmètre : demandez à l'équipe Studicam de l'ajouter."));
            return;
        }

        // ----- formulaire -----
        const form = el('form', 'bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4');
        form.noValidate = true;
        const selPaire = el('select', CLASSE_CHAMP);
        paires.forEach(p => {
            const [a, m] = p.split('/');
            const o = el('option', null, libellePaire(a, m));
            o.value = p;
            selPaire.appendChild(o);
        });
        const promo = el('input', CLASSE_CHAMP);
        Object.assign(promo, { type: 'text', inputMode: 'numeric', maxLength: 4, placeholder: 'Toutes', autocomplete: 'off' });
        const debut = el('input', CLASSE_CHAMP);
        const fin = el('input', CLASSE_CHAMP);
        const j = aujourdhui();
        Object.assign(debut, { type: 'date', value: j, min: j });
        Object.assign(fin, { type: 'date', value: plusJours(j, 7), min: j });
        debut.addEventListener('change', () => {
            if (!debut.value) return;
            fin.min = debut.value;
            if (!fin.value || fin.value < debut.value) fin.value = debut.value;
        });
        const texte = el('textarea', CLASSE_CHAMP + ' min-h-[96px] resize-y');
        Object.assign(texte, { maxLength: TEXTE_MAX, rows: 3, placeholder: 'Ex. : DS jeudi 14 sur le triphasé et la MAS. Revoyez les chapitres cochés.' });
        const compteur = el('span', 'block text-[11px] text-slate-500 text-right', `0/${TEXTE_MAX}`);
        texte.addEventListener('input', () => { compteur.textContent = `${[...texte.value].length}/${TEXTE_MAX}`; });

        const grille = el('div', 'grid grid-cols-1 sm:grid-cols-2 gap-3');
        grille.append(
            champ('Matière', selPaire),
            champ('Promo (facultatif)', promo, 'Ex. 2030 pour les adresses @2030.icam.fr ; vide = toute l\'année'),
            champ('Début', debut),
            champ('Fin (incluse)', fin)
        );
        form.appendChild(grille);
        const blocTexte = champ('Texte', texte);
        blocTexte.appendChild(compteur);
        form.appendChild(blocTexte);

        const fieldset = el('fieldset', 'space-y-2');
        fieldset.appendChild(el('legend', 'text-xs font-semibold text-slate-400 mb-1', 'Chapitres à revoir (facultatif)'));
        const cases = el('div', 'grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1');
        fieldset.appendChild(cases);
        form.appendChild(fieldset);
        function remplirChapitres() {
            const [a, m] = selPaire.value.split('/');
            cases.replaceChildren();
            const chapitres = chapitresDe(a, m);
            if (!chapitres.length) { cases.appendChild(el('p', 'text-xs text-slate-500', 'Pas de chapitre en ligne pour cette matière.')); return; }
            chapitres.forEach(({ id, chap }) => {
                const l = el('label', 'flex items-start gap-2 text-xs text-slate-300 px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer');
                const c = el('input', 'mt-0.5 accent-amber-500');
                c.type = 'checkbox';
                c.value = id;
                l.append(c, el('span', null, `${chap.num} · ${chap.titre}`));
                cases.appendChild(l);
            });
        }
        selPaire.addEventListener('change', remplirChapitres);
        remplirChapitres();

        const pied = el('div', 'flex flex-wrap items-center gap-3');
        const envoyer = el('button', 'px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-semibold transition-all disabled:opacity-50', "Publier l'annonce");
        envoyer.type = 'submit';
        const statut = el('p', 'text-xs text-slate-400');
        statut.setAttribute('role', 'status');
        pied.append(envoyer, statut);
        form.appendChild(pied);

        // ----- liste -----
        const titreListe = el('h3', 'text-sm font-bold uppercase tracking-wider text-slate-400', 'Annonces');
        const liste = el('div', 'space-y-3');
        conteneur.append(form, titreListe, liste);

        async function charger() {
            liste.replaceChildren(el('p', 'text-sm text-slate-500', 'Chargement…'));
            let r;
            try { r = await api('GET', '/api/prof/annonces'); }
            catch (e) { liste.replaceChildren(el('p', 'text-sm text-red-400', 'Serveur injoignable.')); return; }
            if (!r.ok) { liste.replaceChildren(el('p', 'text-sm text-red-400', r.donnees.erreur || 'Lecture impossible.')); return; }
            const { annonces = [], actives = 0, limite = 20 } = r.donnees;
            titreListe.textContent = `Annonces du périmètre · vos annonces actives : ${actives}/${limite}`;
            liste.replaceChildren();
            if (!annonces.length) { liste.appendChild(el('p', 'text-sm text-slate-500', 'Aucune annonce pour l\'instant.')); return; }
            annonces.forEach(a => liste.appendChild(ligneAnnonce(a)));
        }

        function ligneAnnonce(a) {
            const carte = el('article', SANS_MATHJAX + ' bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2' + (a.etat === 'terminee' ? ' opacity-70' : ''));
            const tete = el('div', 'flex flex-wrap items-center gap-2 text-xs');
            const [nomEtat, classeEtat] = ETATS[a.etat] || ETATS.terminee;
            tete.appendChild(el('span', 'px-2 py-0.5 rounded-full border font-semibold ' + classeEtat, nomEtat));
            tete.appendChild(el('span', 'font-semibold text-slate-200', libellePaire(a.annee, a.matiere)));
            if (a.promo) tete.appendChild(el('span', 'px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300', 'Promo ' + a.promo));
            tete.appendChild(el('span', 'text-slate-400', `du ${dateLisible(a.debut)} au ${dateLisible(a.fin)}`));
            carte.appendChild(tete);
            carte.appendChild(el('p', 'text-sm text-slate-200 whitespace-pre-line break-words', a.texte));
            const chapitres = chapitresDe(a.annee, a.matiere).filter(c => (a.chapitres || []).includes(c.id));
            if (chapitres.length) {
                carte.appendChild(el('p', 'text-xs text-slate-400', 'À revoir : ' + chapitres.map(c => c.chap.num.replace('Chapitre n°', 'ch. ') + ' ' + c.chap.titre).join(' ; ')));
            }
            const bas = el('div', 'flex flex-wrap items-center justify-between gap-2');
            bas.appendChild(el('span', 'text-[11px] text-slate-500 break-all', a.auteur || ''));
            if (a.supprimable) {
                const suppr = el('button', 'text-xs px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 hover:text-red-300 hover:border-red-400/50 transition-colors', 'Supprimer');
                suppr.type = 'button';
                suppr.addEventListener('click', async () => {
                    if (!confirm('Supprimer cette annonce ? Les élèves ne la verront plus.')) return;
                    suppr.disabled = true;
                    try {
                        const r = await api('DELETE', '/api/prof/annonces', { id: a.id });
                        if (!r.ok) { suppr.disabled = false; alert(r.donnees.erreur || 'Suppression impossible.'); return; }
                        cache.clear();
                        charger();
                    } catch (e) { suppr.disabled = false; }
                });
                bas.appendChild(suppr);
            }
            carte.appendChild(bas);
            return carte;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const [annee, matiere] = selPaire.value.split('/');
            const corps = {
                annee, matiere,
                promo: promo.value.trim() || null,
                texte: texte.value,
                chapitres: [...cases.querySelectorAll('input:checked')].map(c => c.value),
                debut: debut.value,
                fin: fin.value
            };
            if (!corps.texte.trim()) { statut.textContent = 'Le texte est vide.'; texte.focus(); return; }
            if (corps.promo && !/^\d{4}$/.test(corps.promo)) { statut.textContent = 'Promo : 4 chiffres, ex. 2030.'; promo.focus(); return; }
            envoyer.disabled = true;
            statut.textContent = 'Envoi…';
            try {
                const r = await api('POST', '/api/prof/annonces', corps);
                if (!r.ok) { statut.textContent = r.donnees.erreur || 'Envoi impossible.'; return; }
                statut.textContent = 'Annonce publiée.';
                texte.value = '';
                compteur.textContent = `0/${TEXTE_MAX}`;
                cases.querySelectorAll('input:checked').forEach(c => { c.checked = false; });
                cache.clear();
                charger();
            } catch (err) {
                statut.textContent = 'Serveur injoignable.';
            } finally {
                envoyer.disabled = false;
            }
        });

        charger();
    }

    const espace = window.studicamEspaceProf;
    if (espace && typeof espace.ajouterSection === 'function') {
        espace.ajouterSection({ id: 'annonces', titre: 'Annonces', afficher: afficherSection });
    } else {
        console.warn('Studicam : Espace prof absent, section Annonces non ajoutée');
    }
})();
