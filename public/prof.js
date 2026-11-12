/*
 * Studicam : Espace prof.
 *
 * Chargé à la fin de index.html, après progression.js. Ne fait aucun appel réseau : il lit
 * ce que progression.js a reçu de /api/moi (window.studicamMoi(), ou l'événement
 * « studicam:moi »). Si le compte a un rôle (prof ou equipe), il ajoute un bouton
 * « Espace prof » au bandeau #studicam-session, qui ouvre l'étape #etape-espace-prof.
 *
 * Le bouton n'est qu'un raccourci : chaque route /api/prof/... vérifie le rôle et le
 * périmètre côté serveur (garderProf de src/index.js, exigerProf de src/commun.js).
 *
 * Point d'entrée public, pour ajouter un onglet sans modifier ce fichier (script chargé
 * en defer APRÈS prof.js) :
 *   window.studicamEspaceProf.ajouterSection({ id, titre, afficher(conteneur, moi) })
 *     id       identifiant unique (un second appel avec le même id remplace la section)
 *     titre    texte de l'onglet
 *     afficher appelée à chaque ouverture de l'onglet, avec un conteneur vide et
 *              moi = {email, role, perimetre} ; peut être async.
 *   window.studicamEspaceProf.ouvrir(id?) ouvre l'Espace prof (sur cet onglet si donné).
 *
 * Fonction du site enveloppée : cacherToutesLesEtapes() (masque aussi l'Espace prof).
 */
(function () {
    'use strict';

    const ANNEES = { a1: '1ère année', a2: '2ème année' };
    const MATIERES = {
        cm: 'Construction mécanique', ce: 'Construction électrique', aii: 'Automatisme et informatique industrielle',
        oi: 'Organisation industrielle', est: 'Étude des systèmes techniques', maths: 'Mathématiques',
        phys: 'Physique-chimie', eco: 'Économie et gestion'
    };
    const ROLES = { prof: 'Prof', equipe: 'Équipe Studicam' };
    const $ = (id) => document.getElementById(id);
    let moi = null;                // {email, role, perimetre} d'un compte qui a un rôle
    const sections = [];           // {id, titre, afficher}, dans l'ordre d'ajout
    let ongletActif = null;

    function el(tag, cls, texte) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (texte != null) e.textContent = texte;
        return e;
    }
    const aUnRole = (m) => !!m && (m.role === 'prof' || m.role === 'equipe');

    // ---------- étape « Espace prof » ----------
    function creerEtape() {
        let etape = $('etape-espace-prof');
        if (etape) return etape;
        const voisine = $('etape-revision-ds');
        if (!voisine || !voisine.parentElement) return null;
        etape = el('div', 'hidden space-y-6 text-left max-w-4xl mx-auto');
        etape.id = 'etape-espace-prof';
        etape.innerHTML = ''
            + '<div class="flex flex-col items-start gap-4">'
            + '  <button type="button" data-prof-retour class="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white px-4 py-2 rounded-xl bg-darkcard border border-darkborder transition-all hover:border-slate-500">'
            + '    <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour à l\'accueil'
            + '  </button>'
            + '  <div class="space-y-2">'
            + '    <div data-prof-role class="inline-block px-3 py-1 rounded-md text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"></div>'
            + '    <h1 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Espace prof</h1>'
            + '    <p data-prof-email class="text-sm text-slate-400 break-all"></p>'
            + '  </div>'
            + '</div>'
            + '<div class="bg-darkcard border border-darkborder rounded-2xl p-5 space-y-3">'
            + '  <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400">Votre périmètre</h2>'
            + '  <div data-prof-perimetre class="flex flex-wrap gap-2"></div>'
            + '</div>'
            + '<div data-prof-onglets></div>'
            + '<div data-prof-contenu class="space-y-5"></div>';
        etape.querySelector('[data-prof-retour]').addEventListener('click', () => {
            if (typeof retourAnnee === 'function') retourAnnee();
        });
        voisine.after(etape);
        return etape;
    }

    function remplirEntete(etape) {
        etape.querySelector('[data-prof-role]').textContent = ROLES[moi.role] || moi.role;
        etape.querySelector('[data-prof-email]').textContent = moi.email || '';
        const zone = etape.querySelector('[data-prof-perimetre]');
        zone.replaceChildren();
        const puce = (texte) => el('span', 'text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300', texte);
        if (moi.role === 'equipe') { zone.appendChild(puce('Toutes les années et toutes les matières')); return; }
        const paires = Array.isArray(moi.perimetre) ? moi.perimetre : [];
        if (!paires.length) {
            zone.appendChild(el('p', 'text-sm text-slate-400', 'Aucune matière pour l\'instant. Demandez à l\'équipe Studicam de l\'ajouter.'));
            return;
        }
        paires.forEach(p => {
            const [annee, matiere] = String(p).split('/');
            zone.appendChild(puce(`${ANNEES[annee] || annee} · ${MATIERES[matiere] || matiere}`));
        });
    }

    // Onglets (un par section) puis contenu de l'onglet actif.
    function rendreSections(etape) {
        const onglets = etape.querySelector('[data-prof-onglets]');
        const contenu = etape.querySelector('[data-prof-contenu]');
        onglets.replaceChildren();
        contenu.replaceChildren();
        if (!sections.length) {
            contenu.appendChild(el('p', 'text-sm text-slate-400 leading-relaxed', 'Les outils de l\'espace prof arrivent ici bientôt : annonces de DS, relecture et signalements, statistiques de la classe (seulement agrégées, jamais par élève).'));
            return;
        }
        if (!sections.some(s => s.id === ongletActif)) ongletActif = sections[0].id;
        if (sections.length > 1) {
            const barre = el('div', 'flex gap-1 overflow-x-auto border-b border-darkborder');
            barre.setAttribute('role', 'tablist');
            sections.forEach(s => {
                const actif = s.id === ongletActif;
                const b = el('button', `px-4 sm:px-5 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${actif ? 'border-blue-400 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`, s.titre);
                b.type = 'button';
                b.setAttribute('role', 'tab');
                b.setAttribute('aria-selected', actif ? 'true' : 'false');
                b.addEventListener('click', () => { ongletActif = s.id; rendreSections(etape); });
                barre.appendChild(b);
            });
            onglets.appendChild(barre);
        }
        const section = sections.find(s => s.id === ongletActif);
        const conteneur = el('div', 'space-y-5');
        conteneur.dataset.profSection = section.id;
        contenu.appendChild(conteneur);
        const echec = (e) => {
            console.warn('Studicam : section de l\'Espace prof', section.id, e);
            conteneur.replaceChildren(el('p', 'text-sm text-red-400', 'Cette partie n\'a pas pu s\'afficher. Réessayez dans un instant.'));
        };
        try {
            const r = section.afficher(conteneur, moi);
            if (r && typeof r.then === 'function') r.then(() => rafraichir(conteneur), echec);
        } catch (e) { echec(e); }
        rafraichir(conteneur);
    }

    function rafraichir(zone) {
        if (window.lucide) lucide.createIcons();
        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([zone]).catch(e => console.warn(e));
    }

    function ouvrirEspaceProf(idSection) {
        if (!aUnRole(moi)) return;
        const etape = creerEtape();
        if (!etape) return;
        if (typeof idSection === 'string') ongletActif = idSection;
        if (typeof cacherToutesLesEtapes === 'function') cacherToutesLesEtapes();
        if (typeof reinitialiserFond === 'function') reinitialiserFond();
        remplirEntete(etape);
        etape.classList.remove('hidden');
        rendreSections(etape);
        window.scrollTo(0, 0);
    }

    function ajouterSection(section) {
        if (!section || typeof section.id !== 'string' || !section.id || typeof section.afficher !== 'function') {
            console.warn('Studicam : section de l\'Espace prof invalide', section);
            return;
        }
        const propre = { id: section.id, titre: String(section.titre || section.id), afficher: section.afficher };
        const i = sections.findIndex(s => s.id === propre.id);
        if (i >= 0) sections[i] = propre; else sections.push(propre);
        const etape = $('etape-espace-prof');
        if (etape && !etape.classList.contains('hidden')) rendreSections(etape);
    }

    window.studicamEspaceProf = { ajouterSection, ouvrir: ouvrirEspaceProf };

    // Toute navigation du site passe par cacherToutesLesEtapes : on y masque aussi l'Espace prof.
    (function () {
        const original = window.cacherToutesLesEtapes;
        if (typeof original !== 'function') { console.warn('Studicam : fonction absente', 'cacherToutesLesEtapes'); return; }
        window.cacherToutesLesEtapes = function (...args) {
            const r = original.apply(this, args);
            const etape = $('etape-espace-prof');
            if (etape) etape.classList.add('hidden');
            return r;
        };
    })();

    // ---------- bouton du bandeau ----------
    function boutonBandeau() {
        const barre = $('studicam-session');
        if (!barre || barre.querySelector('[data-prof-bouton]')) return;
        const deconnexion = barre.querySelector('button');
        const b = el('button', 'shrink-0 px-2 py-0.5 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:text-white hover:border-blue-400 transition-colors', 'Espace prof');
        b.type = 'button';
        b.dataset.profBouton = '1';
        b.addEventListener('click', () => ouvrirEspaceProf());
        if (deconnexion) deconnexion.before(b); else barre.firstElementChild.appendChild(b);
    }

    function recevoir(donnees) {
        if (!aUnRole(donnees)) return;
        moi = donnees;
        boutonBandeau();
    }
    if (typeof window.studicamMoi === 'function') recevoir(window.studicamMoi());
    document.addEventListener('studicam:moi', (e) => recevoir(e.detail));
})();
