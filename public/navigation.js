/*
 * Studicam : une adresse par écran (#/...) et le bouton retour du navigateur.
 *
 * Chargé en dernier par index.html (defer). Chaque changement d'écran ajoute une entrée à
 * l'historique (history.pushState) ; le bouton retour, ou le geste retour du téléphone,
 * réaffiche l'écran précédent (popstate). Rafraîchir la page ou ouvrir une adresse copiée
 * ramène au même écran. Le serveur ne voit jamais la partie après « # ».
 *
 * Adresses (année a1 ou a2, matière cm, ce, aii, oi, est, maths, phys, eco) :
 *   #/                                   accueil (choix de l'année)
 *   #/a2                                 choix du domaine
 *   #/a2/techniques, #/a2/sciences       liste des matières du domaine
 *   #/a2/ce                              chapitres de la matière
 *   #/a2/ce/asynchrone/lecon             leçon du chapitre (identifiant de la leçon sans
 *                                        son préfixe : « ce2-asynchrone » donne « asynchrone »)
 *   #/a2/ce/asynchrone/lecon/3           leçon ouverte sur sa partie 3 (renvoi d'une correction)
 *   #/a2/ce/asynchrone/exo/<clé>         exercice (clé de EXOS) ; chapitres interactifs :
 *                                        #/a2/cm/vecteurs/exo/exo1, #/a1/cm/liaisons/exo/exo
 *   #/a2/revision-ds                     Révision DS, sur son dernier onglet
 *   #/a2/revision-ds/examen              un onglet : examen, ce, expo, cours, formules, dsblanc
 *   #/a2/revision-ds/ce/<sujet>          un chapitre des onglets ce, expo, cours
 *   #/prof, #/prof/<section>             Espace prof (comptes qui ont un rôle)
 *   #/lecon/<id>, #/exo/<clé>            leçon ou exercice absents de CHAPITRES
 * Adresse inconnue, ou contenu absent : accueil, sans erreur.
 *
 * Fonctions du site qui appellent ce fichier (une ligne chacune, sans effet s'il manque) :
 * cacherToutesLesEtapes, ouvrirLecon, allerLecon, afficherOngletInter(A1) dans index.html,
 * afficherOnglet dans revision-ds.js, rendreSections dans prof.js. L'adresse est déduite de
 * l'écran visible une fois le clic traité (plusieurs appels dans le même clic n'en font qu'un).
 *
 * Point d'entrée public (scripts chargés en defer APRÈS celui-ci) :
 *   window.studicamRoutes.ajouter(motif, fonction, titre?)
 *     motif    '#/progression' ou '/progression/:onglet' (« :nom » prend un segment), ou une
 *              RegExp testée sur l'adresse sans « # » (« /progression/... »)
 *     fonction (params, adresse) affiche l'écran : elle masque les autres étapes avec
 *              cacherToutesLesEtapes() puis montre la sienne. Elle peut renvoyer une fonction,
 *              appelée quand on quitte cet écran ; renvoyer false veut dire « contenu absent ».
 *     titre    texte de l'onglet du navigateur, ou fonction (params) qui le renvoie
 *   window.studicamRoutes.aller(adresse) ouvre une adresse en ajoutant une entrée d'historique.
 * Événement « studicam:ecran » sur document à chaque changement d'écran,
 *   detail = { adresse, ecran, titre } (ecran : accueil, annee, domaine, matiere, lecon, exo,
 *   revision-ds, prof, ou perso pour une route ajoutée).
 * Avant la connexion Google, connexion.html garde l'adresse demandée dans sessionStorage
 * (« studicam-adresse ») ; elle est rouverte ici au retour.
 */
(function (racine) {
    'use strict';

    // ---------- analyse et construction des adresses (sans DOM, testées par npm test) ----------
    const ANNEES = { a1: '1ère Année', a2: '2ème Année' };
    const DOMAINES = { techniques: 'techniques', sciences: 'scientifiques' };   // adresse -> clé de MATIERES
    const ONGLETS_DS = { examen: 'Examen blanc', ce: 'CE', expo: 'OI : exposés', cours: 'OI : cours', formules: 'Formules', dsblanc: 'DS blanc' };
    const PARTIES_DS = ['ce', 'expo', 'cours'];
    const SEGMENT = /^[a-z0-9][a-z0-9_.-]{0,79}$/i;

    // « #/a2/ce » -> ['a2', 'ce'] ; '' ou '#' ou '#/' -> [] ; autre chose -> null
    function segments(adresse) {
        let h = String(adresse == null ? '' : adresse).trim();
        if (h.startsWith('#')) h = h.slice(1);
        if (h === '' || h === '/') return [];
        if (!h.startsWith('/')) return null;
        const morceaux = h.slice(1).split('/');
        if (morceaux[morceaux.length - 1] === '') morceaux.pop();      // « #/a2/ce/ »
        const sortie = [];
        for (const m of morceaux) {
            let d;
            try { d = decodeURIComponent(m); } catch (e) { return null; }
            if (!SEGMENT.test(d)) return null;
            sortie.push(d);
        }
        return sortie;
    }

    function analyserAdresse(adresse) {
        const s = segments(adresse);
        if (!s) return null;
        if (s.length === 0) return { ecran: 'accueil' };
        const n = s.length, tete = s[0].toLowerCase();
        if (tete === 'prof') return n === 1 ? { ecran: 'prof' } : n === 2 ? { ecran: 'prof', section: s[1] } : null;
        if (tete === 'lecon' && n === 2) return { ecran: 'lecon', lecon: s[1] };
        if (tete === 'exo' && n === 2) return { ecran: 'exo', exo: s[1] };
        if (!ANNEES[tete]) return null;
        const annee = tete;
        if (n === 1) return { ecran: 'annee', annee };
        const b = s[1].toLowerCase();
        if (b === 'revision-ds') {
            const r = { ecran: 'revision-ds', annee };
            if (n >= 3) { if (!ONGLETS_DS[s[2]]) return null; r.onglet = s[2]; }
            if (n === 4) { if (!PARTIES_DS.includes(s[2])) return null; r.chap = s[3]; }
            return n <= 4 ? r : null;
        }
        if (DOMAINES[b]) return n === 2 ? { ecran: 'domaine', annee, domaine: b } : null;
        if (!/^[a-z]+$/.test(b)) return null;
        const matiere = b;
        if (n === 2) return { ecran: 'matiere', annee, matiere };
        const chapitre = s[2];
        if (n === 3 || (n === 4 && s[3] === 'lecon')) return { ecran: 'lecon', annee, matiere, chapitre };
        if (n === 5 && s[3] === 'lecon' && /^[1-9]\d?$/.test(s[4])) return { ecran: 'lecon', annee, matiere, chapitre, partie: Number(s[4]) };
        if (n === 5 && s[3] === 'exo') return { ecran: 'exo', annee, matiere, chapitre, exo: s[4] };
        return null;
    }

    function construireAdresse(r) {
        const seg = (x) => encodeURIComponent(String(x));
        if (!r) return '#/';
        const chap = () => `#/${r.annee}/${r.matiere}/${seg(r.chapitre)}`;
        switch (r.ecran) {
            case 'annee': return `#/${r.annee}`;
            case 'domaine': return `#/${r.annee}/${r.domaine}`;
            case 'matiere': return `#/${r.annee}/${r.matiere}`;
            case 'lecon':
                if (!r.annee) return `#/lecon/${seg(r.lecon)}`;
                return chap() + '/lecon' + (r.partie ? '/' + r.partie : '');
            case 'exo':
                if (!r.annee) return `#/exo/${seg(r.exo)}`;
                return chap() + '/exo/' + seg(r.exo);
            case 'revision-ds':
                return `#/${r.annee || 'a2'}/revision-ds` + (r.onglet ? '/' + r.onglet + (r.chap && PARTIES_DS.includes(r.onglet) ? '/' + seg(r.chap) : '') : '');
            case 'prof': return '#/prof' + (r.section ? '/' + seg(r.section) : '');
            default: return '#/';
        }
    }

    // segment d'adresse d'un chapitre de CHAPITRES
    function slugChapitre(chap) {
        if (!chap) return null;
        if (typeof chap.lecon === 'string') return chap.lecon.replace(/^[a-z]+\d*-/, '');
        if (chap.interactif) return 'vecteurs';
        if (chap.interactifA1) return 'liaisons';
        return null;
    }

    const estRegExp = (x) => Object.prototype.toString.call(x) === '[object RegExp]';

    // paramètres si l'adresse correspond au motif d'une route ajoutée, sinon null
    function correspondMotif(motif, adresse) {
        const s = segments(adresse);
        if (!s) return null;
        if (estRegExp(motif)) {
            const m = motif.exec('/' + s.join('/'));
            return m ? Object.assign({}, m.groups || {}, { correspondance: m.slice(1) }) : null;
        }
        const attendu = String(motif).replace(/^#/, '').split('/').filter(Boolean);
        if (attendu.length !== s.length || attendu.length === 0) return null;
        const params = {};
        for (let i = 0; i < s.length; i++) {
            if (attendu[i].startsWith(':')) params[attendu[i].slice(1)] = s[i];
            else if (attendu[i] !== s[i]) return null;
        }
        return params;
    }

    function memeAdresse(a, b) {
        const n = (x) => { const h = String(x || ''); return h === '' || h === '#' ? '#/' : h; };
        return n(a) === n(b);
    }

    racine.studicamAdresses = { analyserAdresse, construireAdresse, slugChapitre, correspondMotif, memeAdresse, ONGLETS_DS };
    if (typeof document === 'undefined' || typeof history === 'undefined' || typeof location === 'undefined') return;

    // ---------- côté page ----------
    const TITRE_BASE = document.title || 'Cours Icam BTS ATI';
    const CLE_CONNEXION = 'studicam-adresse';
    const routes = [];                 // { motif, fonction, titre }
    const etat = { lecon: null, partie: null, ds: null, prof: null };
    let perso = null;                  // écran d'une route ajoutée : { adresse, quitter, titre }
    let restauration = 0;              // > 0 pendant l'affichage d'une adresse : rien n'est empilé
    let prevu = false, dernierY = 0, minuterieY = null, attenteInconnue = null;

    // variables et constantes du script principal de index.html (portée globale, pas sur window)
    const site = {
        chapitres: () => (typeof CHAPITRES !== 'undefined' ? CHAPITRES : {}),
        matieres: () => (typeof MATIERES !== 'undefined' ? MATIERES : {}),
        lecons: () => (typeof LECONS !== 'undefined' ? LECONS : {}),
        exos: () => (typeof EXOS !== 'undefined' ? EXOS : {}),
        annee: () => (typeof anneeSelectionnee !== 'undefined' ? anneeSelectionnee : ''),
        categorie: () => (typeof categorieSelectionnee !== 'undefined' ? categorieSelectionnee : ''),
        matiere: () => (typeof matiereSelectionnee !== 'undefined' ? matiereSelectionnee : null),
        exoCourant: () => (typeof exoCourant !== 'undefined' ? exoCourant : null)
    };
    const codeAnnee = (nom) => Object.keys(ANNEES).find(k => ANNEES[k] === nom) || null;
    const visible = (id) => { const e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
    const texte = (t) => String(t == null ? '' : t).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    function trouverMatiere(code) {
        for (const [cat, liste] of Object.entries(site.matieres())) {
            const m = (liste || []).find(x => x.id.toLowerCase() === code);
            if (m) return { m, domaine: Object.keys(DOMAINES).find(d => DOMAINES[d] === cat) };
        }
        return null;
    }
    function chapitresDe(annee, matiere) {
        return ((site.chapitres()[ANNEES[annee]] || {})[String(matiere).toUpperCase()]) || [];
    }
    function trouverChapitre(annee, matiere, slug) {
        const liste = chapitresDe(annee, matiere);
        return liste.find(c => slugChapitre(c) === slug) || liste.find(c => c.lecon === slug) || null;
    }
    // où se trouve un chapitre dans CHAPITRES (préférence : l'année et la matière ouvertes)
    function lieuDe(test) {
        const lieux = [];
        for (const [annee, nomAnnee] of Object.entries(ANNEES)) {
            for (const [mat, liste] of Object.entries(site.chapitres()[nomAnnee] || {})) {
                const chap = (liste || []).find(test);
                if (chap) lieux.push({ annee, matiere: mat.toLowerCase(), chapitre: slugChapitre(chap), chap });
            }
        }
        const m = site.matiere();
        return lieux.find(l => l.annee === codeAnnee(site.annee()) && m && l.matiere === m.id.toLowerCase()) || lieux[0] || null;
    }

    // ---------- écran visible -> adresse ----------
    function ecranCourant() {
        if (perso) return { ecran: 'perso', adresse: perso.adresse };
        if (visible('etape-espace-prof')) return etat.prof ? { ecran: 'prof', section: etat.prof } : { ecran: 'prof' };
        if (visible('etape-revision-ds')) {
            const r = { ecran: 'revision-ds', annee: 'a2' };
            if (etat.ds && ONGLETS_DS[etat.ds.onglet]) { r.onglet = etat.ds.onglet; if (etat.ds.chap) r.chap = etat.ds.chap; }
            return r;
        }
        if (visible('etape-lecon-generique')) {
            const id = etat.lecon;
            if (!id || !site.lecons()[id]) return null;
            const l = lieuDe(c => c.lecon === id);
            const r = l ? { ecran: 'lecon', annee: l.annee, matiere: l.matiere, chapitre: l.chapitre } : { ecran: 'lecon' };
            r.lecon = id;
            if (etat.partie) r.partie = etat.partie;
            return r;
        }
        if (visible('etape-exercice-generique')) {
            const k = site.exoCourant(), exo = k && site.exos()[k];
            if (!exo) return null;
            const l = exo.chapitre ? lieuDe(c => c.lecon === exo.chapitre) : null;
            return l ? { ecran: 'exo', annee: l.annee, matiere: l.matiere, chapitre: l.chapitre, exo: k } : { ecran: 'exo', exo: k };
        }
        for (const [etape, drapeau, prefixe, onglets] of [
            ['etape-chapitre-interactif', 'interactif', 'section-', ['exo1', 'exo2']],
            ['etape-chapitre-a1-interactif', 'interactifA1', 'section-a1-', ['exo']]]) {
            if (!visible(etape)) continue;
            const l = lieuDe(c => c[drapeau]);
            if (!l) return null;
            const r = { annee: l.annee, matiere: l.matiere, chapitre: l.chapitre, titreChapitre: l.chap.titre };
            const exo = onglets.find(o => visible(prefixe + o));
            return Object.assign(r, exo ? { ecran: 'exo', exo } : { ecran: 'lecon' });
        }
        const annee = codeAnnee(site.annee());
        if (visible('etape-chapitres-liste')) {
            const m = site.matiere();
            return annee && m ? { ecran: 'matiere', annee, matiere: m.id.toLowerCase(), nom: m.nom } : null;
        }
        if (visible('etape-matieres-liste')) {
            const domaine = Object.keys(DOMAINES).find(d => DOMAINES[d] === site.categorie());
            return annee && domaine ? { ecran: 'domaine', annee, domaine } : null;
        }
        if (visible('etape-categories')) return annee ? { ecran: 'annee', annee } : null;
        if (visible('etape-annee')) return { ecran: 'accueil' };
        return null;
    }

    function titreDe(r) {
        const avec = (t) => (t ? texte(t) + ' · ' + TITRE_BASE : TITRE_BASE);
        switch (r.ecran) {
            case 'annee': return avec(ANNEES[r.annee]);
            case 'domaine': return avec((r.domaine === 'techniques' ? 'Matières techniques' : 'Sciences et économie') + ' · ' + ANNEES[r.annee]);
            case 'matiere': return avec((r.nom || r.matiere.toUpperCase()) + ' · ' + ANNEES[r.annee]);
            case 'lecon': { const l = r.lecon && site.lecons()[r.lecon]; return avec(l ? l.titre : r.titreChapitre); }
            case 'exo': { const e = site.exos()[r.exo]; return avec(e && !r.titreChapitre ? e.titre : (r.titreChapitre || '') + ' : exercices'); }
            case 'revision-ds': {
                let t = 'Révision DS' + (r.onglet ? ' : ' + ONGLETS_DS[r.onglet] : '');
                const h = r.chap && document.querySelector('#ds-contenu h2');
                if (h) t += ' · ' + h.textContent;
                return avec(t);
            }
            case 'prof': return avec('Espace prof');
            case 'perso': return avec(perso && perso.titre);
            default: return TITRE_BASE;
        }
    }

    function emettre(r, adresse) {
        try {
            document.dispatchEvent(new CustomEvent('studicam:ecran', { detail: { adresse, ecran: r.ecran, titre: document.title } }));
        } catch (e) { console.warn('Studicam : studicam:ecran', e); }
    }

    function memoriserY(y) {
        clearTimeout(minuterieY);
        try { history.replaceState(Object.assign({}, history.state, { studicam: 1, y }), '', location.href); } catch (e) { /* rien */ }
    }

    // Écrit l'adresse de l'écran visible : entrée ajoutée (ou remplacée), titre, événement.
    function publier(remplacer) {
        const r = ecranCourant();
        if (!r) return;
        const adresse = r.ecran === 'perso' ? r.adresse : construireAdresse(r);
        const change = !memeAdresse(adresse, location.hash);
        if (change) {
            const avant = analyserAdresse(location.hash);
            // onglet de l'Espace prof : changement mineur, pas de nouvelle entrée
            if (remplacer || (r.ecran === 'prof' && avant && avant.ecran === 'prof')) history.replaceState({ studicam: 1 }, '', adresse);
            else { memoriserY(dernierY); history.pushState({ studicam: 1 }, '', adresse); }
        }
        document.title = titreDe(r);
        if (change || remplacer) emettre(r, adresse);
    }

    // Appelée par les fonctions du site qui changent d'écran ; indices : { lecon, partie, ds, prof }
    function noter(indices) {
        if (indices && typeof indices === 'object') Object.assign(etat, indices);
        if (prevu) return;
        prevu = true;
        queueMicrotask(() => { prevu = false; if (!restauration) publier(false); });
    }
    // Appelée par cacherToutesLesEtapes : on quitte l'écran d'une route ajoutée.
    function etapesCachees() {
        if (perso) {
            const p = perso;
            perso = null;
            if (p.quitter) try { p.quitter(); } catch (e) { console.warn('Studicam : route', p.adresse, e); }
        }
        noter();
    }

    // ---------- adresse -> écran ----------
    // remet le fil année -> domaine -> matière, comme si l'élève avait cliqué (seulement s'il change)
    function preparer(annee, domaine, matiere) {
        let refaire = false;
        if (site.annee() !== ANNEES[annee]) { choisirAnnee(ANNEES[annee]); refaire = true; }
        if (!domaine) return;
        if (refaire || site.categorie() !== DOMAINES[domaine]) { choisirCategorie(DOMAINES[domaine]); refaire = true; }
        if (!matiere) return;
        if (refaire || site.matiere() !== matiere) ouvrirMatiere(matiere);
    }

    function afficherChapitre(r) {
        const mt = trouverMatiere(r.matiere);
        const chap = mt && trouverChapitre(r.annee, r.matiere, r.chapitre);
        if (!chap) return false;
        const onglet = r.ecran === 'lecon' ? 'lecon' : r.exo;
        if (chap.interactif || chap.interactifA1) {
            const a1 = !chap.interactif;
            if (!(a1 ? ['lecon', 'exo'] : ['lecon', 'exo1', 'exo2']).includes(onglet)) return false;
            preparer(r.annee, mt.domaine, mt.m);
            const etape = a1 ? 'etape-chapitre-a1-interactif' : 'etape-chapitre-interactif';
            if (visible(etape)) (a1 ? afficherOngletInterA1 : afficherOngletInter)(onglet);
            else (a1 ? ouvrirChapitreA1Interactif : ouvrirChapitreInteractif)(onglet);
            return true;
        }
        if (r.ecran === 'lecon') {
            if (!site.lecons()[chap.lecon]) return false;
            preparer(r.annee, mt.domaine, mt.m);
            if (r.partie) allerLecon(chap.lecon, r.partie); else ouvrirLecon(chap.lecon);
            return true;
        }
        if (!site.exos()[r.exo]) return false;
        preparer(r.annee, mt.domaine, mt.m);
        ouvrirExercice(r.exo);
        return true;
    }

    // true : écran affiché ; false : rien à afficher (accueil) ; 'attente' : on attend /api/moi
    function afficherEcran(r, adresse) {
        switch (r.ecran) {
            case 'accueil': retourAnnee(); return true;
            case 'annee': choisirAnnee(ANNEES[r.annee]); return true;
            case 'domaine': preparer(r.annee); choisirCategorie(DOMAINES[r.domaine]); return true;
            case 'matiere': {
                const mt = trouverMatiere(r.matiere);
                if (!mt) return false;
                preparer(r.annee, mt.domaine);
                ouvrirMatiere(mt.m);
                return true;
            }
            case 'lecon':
                if (r.annee) return afficherChapitre(r);
                if (!site.lecons()[r.lecon]) return false;
                ouvrirLecon(r.lecon);
                return true;
            case 'exo':
                if (r.annee) return afficherChapitre(r);
                if (!site.exos()[r.exo]) return false;
                ouvrirExercice(r.exo);
                return true;
            case 'revision-ds':
                if (r.annee !== 'a2' || typeof racine.ouvrirRevisionDS !== 'function') return false;
                preparer('a2');
                racine.ouvrirRevisionDS(r.onglet, r.chap);
                return true;
            case 'prof': {
                const espace = racine.studicamEspaceProf;
                if (!espace) return false;
                espace.ouvrir(r.section);
                if (visible('etape-espace-prof')) return true;
                const moi = typeof racine.studicamMoi === 'function' ? racine.studicamMoi() : null;
                if (moi) return false;             // compte sans rôle
                document.addEventListener('studicam:moi', () => setTimeout(() => {
                    if (memeAdresse(location.hash, adresse)) afficher(adresse);
                }, 0), { once: true });
                return 'attente';
            }
            default: return false;
        }
    }

    function afficherPerso(route, adresse) {
        const ancien = perso;
        perso = null;
        if (ancien && ancien.quitter) try { ancien.quitter(); } catch (e) { console.warn('Studicam : route', ancien.adresse, e); }
        const params = correspondMotif(route.motif, adresse);
        const retour = route.fonction(params, adresse);
        if (retour === false) return false;
        let titre = route.titre;
        if (typeof titre === 'function') try { titre = titre(params); } catch (e) { titre = null; }
        perso = { adresse: '#/' + segments(adresse).join('/'), quitter: typeof retour === 'function' ? retour : null, titre };
        return true;
    }

    // Affiche l'écran d'une adresse (retour, avance, rafraîchissement, adresse collée).
    function afficher(adresse, y) {
        let resultat = false, r = null;
        restauration++;
        try {
            const route = routes.find(x => correspondMotif(x.motif, adresse));
            if (route) resultat = afficherPerso(route, adresse);
            else { r = analyserAdresse(adresse); resultat = r ? afficherEcran(r, adresse) : false; }
        } catch (e) {
            console.warn('Studicam : adresse', adresse, e);
            resultat = false;
        }
        if (resultat === 'attente') { restauration--; return; }
        if (!resultat) {
            if (!r) attenteInconnue = adresse;   // une route peut encore être ajoutée
            try { retourAnnee(); } catch (e) { /* rien */ }
        }
        restauration--;
        publier(true);
        if (r && r.partie && resultat === true) allerPartie(r.partie); else defiler(y);
    }

    // allerLecon défile doucement vers la partie ; au chargement, MathJax peut interrompre ce
    // défilement : on le refait tant que l'élève n'a pas bougé la page.
    function allerPartie(n) {
        [600, 1500].forEach(t => setTimeout(() => {
            const s = document.getElementById('lecon-sec-' + n);
            if (s && visible('etape-lecon-generique') && window.scrollY < 40 && s.getBoundingClientRect().top > 200) s.scrollIntoView({ block: 'start' });
        }, t));
    }

    function defiler(y) {
        const cible = y > 0 ? y : 0;
        const aller = () => window.scrollTo(0, cible);
        aller();
        if (!cible) return;
        requestAnimationFrame(aller);
        // les formules (MathJax) allongent la page après coup
        setTimeout(() => { if (window.scrollY < cible - 40 && window.scrollY < 40) aller(); }, 400);
    }

    // ---------- branchements ----------
    racine.studicamNav = { noter, etapesCachees };
    racine.studicamRoutes = {
        ajouter(motif, fonction, titre) {
            if (!(estRegExp(motif)) && typeof motif !== 'string') return console.warn('Studicam : motif de route invalide', motif);
            if (typeof fonction !== 'function') return console.warn('Studicam : route sans fonction', motif);
            routes.push({ motif, fonction, titre });
            if (attenteInconnue && correspondMotif(motif, attenteInconnue) && memeAdresse(location.hash, '#/')) {
                const a = attenteInconnue;
                attenteInconnue = null;
                history.replaceState({ studicam: 1 }, '', a);
                afficher(a);
            }
        },
        aller(adresse) {
            const a = String(adresse || '#/');
            if (!memeAdresse(a, location.hash)) { memoriserY(dernierY); history.pushState({ studicam: 1 }, '', a.startsWith('#') ? a : '#' + a); }
            afficher(location.hash);
        }
    };

    try { history.scrollRestoration = 'manual'; } catch (e) { /* rien */ }
    window.addEventListener('scroll', () => {
        dernierY = window.scrollY;
        clearTimeout(minuterieY);
        if (!restauration) minuterieY = setTimeout(() => memoriserY(window.scrollY), 400);   // pour un rafraîchissement
    }, { passive: true });

    window.addEventListener('popstate', (ev) => {
        const h = location.hash;
        if (h && h !== '#' && !h.startsWith('#/')) return;     // ancre dans la page
        attenteInconnue = null;
        afficher(h, ev.state && ev.state.y);
    });

    // ---------- au chargement ----------
    let depart = location.hash;
    try {
        const garde = sessionStorage.getItem(CLE_CONNEXION);
        if (garde) sessionStorage.removeItem(CLE_CONNEXION);
        if (garde && garde.startsWith('#/') && memeAdresse(depart, '#/')) {
            depart = garde;
            history.replaceState({ studicam: 1 }, '', garde);
        }
    } catch (e) { /* stockage bloqué */ }
    const yDepart = history.state && history.state.y;
    const demarrer = () => {
        if (memeAdresse(depart, '#/')) publier(true); else afficher(depart, yDepart);
    };
    // une adresse qui n'est pas du site attend les routes des scripts chargés après celui-ci
    if (analyserAdresse(depart) || document.readyState !== 'loading') demarrer();
    else document.addEventListener('DOMContentLoaded', demarrer, { once: true });
})(typeof window !== 'undefined' ? window : globalThis);
