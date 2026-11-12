/*
 * Studicam : relecture des leçons et signalements d'erreurs.
 *
 * Chargé à la fin de index.html, après progression.js et prof.js. Ne réécrit aucune fonction
 * du site : il enveloppe ouvrirLecon, ouvrirExercice et ouvrirMatiere, puis ajoute ses
 * éléments à côté de ce qu'elles ont affiché.
 *
 * Élèves (et profs) :
 *   - « Signaler une erreur » en bas de chaque leçon et de chaque exercice : petite fenêtre,
 *     POST /api/signalement {annee, matiere, lecon, cle_exo?, message}.
 *   - badge « Relu par ... » sur la carte du chapitre et en tête de la leçon (GET /api/relectures).
 * Profs et équipe (rôle lu dans window.studicamMoi ou l'événement « studicam:moi ») :
 *   - « Marquer comme relu » en bas des leçons de leur périmètre (POST/DELETE /api/prof/relecture) ;
 *   - section « Signalements » de l'Espace prof (GET/PATCH /api/prof/signalements).
 * Le bouton n'est qu'un raccourci : le serveur vérifie le rôle et le périmètre.
 *
 * Année et matière d'une leçon : d'après CHAPITRES (a1/a2, id de MATIERES en minuscules),
 * comme les clés de progression.js. Une leçon absente de CHAPITRES n'a pas de bouton.
 * Tout texte venant du serveur est posé par textContent.
 */
(function () {
    'use strict';

    const ANNEES = { '1ère Année': 'a1', '2ème Année': 'a2' };
    const LIBELLES_ANNEE = { a1: 'A1', a2: 'A2' };
    const MESSAGE_MAX = 1000;
    const STATUTS = {
        ouvert: { libelle: 'Ouvert', classe: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
        corrige: { libelle: 'Corrigé', classe: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
        rejete: { libelle: 'Rejeté', classe: 'bg-slate-800 text-slate-400 border-slate-700' }
    };
    const $ = (id) => document.getElementById(id);

    let moi = null;              // {email, role, perimetre} ; role null pour un élève
    let relectures = {};         // lecon → [{nom, annee, matiere, moi}]
    let contexte = null;         // leçon ou exercice affiché : {lecon, cle_exo, annee, matiere, titre}

    function el(tag, cls, texte) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (texte != null) e.textContent = texte;
        return e;
    }
    function icones() { if (window.lucide) lucide.createIcons(); }

    async function api(methode, chemin, corps) {
        const r = await fetch(chemin, {
            method: methode,
            credentials: 'same-origin',
            headers: corps ? { 'Content-Type': 'application/json' } : {},
            body: corps ? JSON.stringify(corps) : undefined
        });
        if (r.status === 401) { location.replace('/connexion'); throw new Error('Non connecté'); }
        let donnees = null;
        try { donnees = await r.json(); } catch (e) { /* corps vide ou illisible */ }
        if (!r.ok) throw new Error((donnees && donnees.erreur) || 'Erreur ' + r.status);
        return donnees;
    }

    // ---------- leçons : année et matière d'après CHAPITRES ----------
    let lieux = null;
    function lieu(idLecon) {
        if (!lieux) {
            lieux = {};
            if (typeof CHAPITRES !== 'undefined') {
                for (const annee of Object.keys(CHAPITRES)) {
                    for (const mat of Object.keys(CHAPITRES[annee])) {
                        for (const c of CHAPITRES[annee][mat]) {
                            if (c.lecon && !lieux[c.lecon] && ANNEES[annee]) lieux[c.lecon] = { annee: ANNEES[annee], matiere: mat.toLowerCase() };
                        }
                    }
                }
            }
        }
        return lieux[idLecon] || null;
    }
    function titreLecon(id) {
        return (typeof LECONS !== 'undefined' && LECONS[id] && LECONS[id].titre) || id;
    }
    function titreExo(id) {
        return (typeof EXOS !== 'undefined' && EXOS[id] && EXOS[id].titre) || id;
    }

    // Relectures d'une leçon dont l'année et la matière sont bien celles de CHAPITRES.
    function relusPour(idLecon) {
        const l = lieu(idLecon);
        if (!l) return [];
        return (relectures[idLecon] || []).filter(r => r.annee === l.annee && r.matiere === l.matiere);
    }
    function texteRelu(liste) {
        const noms = liste.map(r => r.nom);
        if (noms.length <= 1) return 'Relu par ' + (noms[0] || '');
        return 'Relu par ' + noms.slice(0, -1).join(', ') + ' et ' + noms[noms.length - 1];
    }
    function badgeRelu(liste) {
        const b = el('span', 'mathjax_ignore inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border align-middle bg-emerald-500/10 text-emerald-300 border-emerald-500/30');
        b.appendChild(el('span', null, '✓'));
        b.appendChild(el('span', null, texteRelu(liste)));
        b.title = 'Leçon relue par un prof de l\'ICAM';
        return b;
    }

    function estProf() { return !!moi && (moi.role === 'prof' || moi.role === 'equipe'); }
    function dansPerimetre(annee, matiere) {
        if (!moi) return false;
        if (moi.role === 'equipe') return true;
        return moi.role === 'prof' && Array.isArray(moi.perimetre) && moi.perimetre.includes(annee + '/' + matiere);
    }

    // ---------- pied de leçon et d'exercice ----------
    function pied(id, voisin) {
        let p = $(id);
        if (p) return p;
        const ref = $(voisin);
        if (!ref) return null;
        p = el('div', 'pt-4 mt-2 border-t border-darkborder/60 flex flex-wrap items-center gap-3');
        p.id = id;
        ref.after(p);
        return p;
    }
    function boutonDiscret(texte, icone) {
        const b = el('button', 'inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg transition-colors');
        b.type = 'button';
        const i = el('i', 'w-3.5 h-3.5');
        i.dataset.lucide = icone;
        b.append(i, el('span', null, texte));
        return b;
    }

    function remplirPied(p) {
        p.replaceChildren();
        if (!contexte) { p.classList.add('hidden'); return; }
        p.classList.remove('hidden');
        const signaler = boutonDiscret('Signaler une erreur', 'flag');
        signaler.addEventListener('click', ouvrirFenetre);
        p.appendChild(signaler);

        if (!contexte.cle_exo && estProf() && dansPerimetre(contexte.annee, contexte.matiere)) {
            const relu = relusPour(contexte.lecon).some(r => r.moi);
            const b = el('button', 'ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors '
                + (relu ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-400'),
                relu ? 'Retirer ma relecture' : 'Marquer comme relu');
            b.type = 'button';
            b.addEventListener('click', () => basculerRelu(b, relu));
            p.appendChild(b);
        }
        icones();
    }

    function enTeteLecon() {
        const titre = $('lecon-titre');
        if (!titre) return;
        let zone = $('studicam-relu-lecon');
        if (!zone) {
            zone = el('div', 'pt-1');
            zone.id = 'studicam-relu-lecon';
            titre.after(zone);
        }
        zone.replaceChildren();
        const liste = contexte && !contexte.cle_exo ? relusPour(contexte.lecon) : [];
        if (liste.length) zone.appendChild(badgeRelu(liste));
    }

    function afficherContexte() {
        const etapeLecon = $('etape-lecon-generique');
        if (etapeLecon && !etapeLecon.classList.contains('hidden') && contexte && !contexte.cle_exo) {
            enTeteLecon();
            const p = pied('studicam-pied-lecon', 'lecon-contenu');
            if (p) remplirPied(p);
        }
        const etapeExo = $('etape-exercice-generique');
        if (etapeExo && !etapeExo.classList.contains('hidden') && contexte && contexte.cle_exo) {
            const p = pied('studicam-pied-exo', 'exo-contenu');
            if (p) remplirPied(p);
        }
    }

    async function basculerRelu(bouton, dejaRelu) {
        if (!contexte) return;
        const { lecon, annee, matiere } = contexte;
        bouton.disabled = true;
        try {
            await api(dejaRelu ? 'DELETE' : 'POST', '/api/prof/relecture', { lecon, annee, matiere });
            await chargerRelectures();
            if (typeof afficherToast === 'function') afficherToast(dejaRelu ? 'Relecture retirée.' : 'Leçon marquée comme relue. Merci !');
        } catch (e) {
            bouton.disabled = false;
            if (typeof afficherToast === 'function') afficherToast(e.message);
        }
    }

    // ---------- cartes des chapitres ----------
    function decorerChapitres() {
        if (typeof matiereSelectionnee === 'undefined' || !matiereSelectionnee || typeof CHAPITRES === 'undefined') return;
        const liste = $('liste-chapitres');
        if (!liste) return;
        const chapitres = (CHAPITRES[anneeSelectionnee] && CHAPITRES[anneeSelectionnee][matiereSelectionnee.id]) || [];
        const cartes = [...liste.children];
        if (cartes.length !== chapitres.length) return;
        chapitres.forEach((chap, i) => {
            const entete = cartes[i].querySelector(':scope > div');
            if (!entete) return;
            entete.querySelectorAll('[data-studicam-relu]').forEach(n => n.remove());
            const relus = chap.lecon ? relusPour(chap.lecon) : [];
            if (!relus.length) return;
            const zone = el('div', 'pt-2');
            zone.dataset.studicamRelu = '1';
            zone.appendChild(badgeRelu(relus));
            entete.appendChild(zone);
        });
    }

    async function chargerRelectures() {
        try {
            const d = await api('GET', '/api/relectures');
            relectures = (d && d.relectures) || {};
        } catch (e) { console.warn('Studicam : relectures', e); return; }
        try { decorerChapitres(); afficherContexte(); } catch (e) { console.warn('Studicam : affichage des relectures', e); }
    }

    // ---------- fenêtre « Signaler une erreur » ----------
    let fenetre = null;
    function creerFenetre() {
        if (fenetre) return fenetre;
        const fond = el('div', 'mathjax_ignore hidden fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4');
        fond.id = 'studicam-signalement';
        fond.innerHTML = ''
            + '<div role="dialog" aria-modal="true" aria-labelledby="studicam-signalement-titre" class="w-full max-w-lg bg-darkcard border border-darkborder rounded-2xl p-5 space-y-4 shadow-2xl text-left">'
            + '  <div class="space-y-1">'
            + '    <h2 id="studicam-signalement-titre" class="text-lg font-bold text-white">Signaler une erreur</h2>'
            + '    <p data-sig-lieu class="text-xs text-slate-400"></p>'
            + '  </div>'
            + '  <div data-sig-formulaire class="space-y-3">'
            + '    <label for="studicam-signalement-texte" class="block text-sm text-slate-300">Où est l\'erreur, et que faudrait-il écrire ?</label>'
            + '    <textarea id="studicam-signalement-texte" rows="5" maxlength="' + MESSAGE_MAX + '" class="w-full rounded-xl px-3 py-2 text-sm text-slate-100 bg-slate-950 border border-slate-700 placeholder:text-slate-600 focus:outline-none focus:border-amber-400" placeholder="Ex. : partie 3, la formule de la puissance a un facteur √3 en trop."></textarea>'
            + '    <div class="flex items-center justify-between gap-3 text-xs text-slate-500">'
            + '      <span>Les profs voient ton message, pas ton nom.</span><span data-sig-compte></span>'
            + '    </div>'
            + '    <p data-sig-erreur class="hidden text-sm text-red-300"></p>'
            + '    <div class="flex justify-end gap-2">'
            + '      <button type="button" data-sig-annuler class="px-4 py-2 rounded-xl text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors">Annuler</button>'
            + '      <button type="button" data-sig-envoyer class="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors">Envoyer</button>'
            + '    </div>'
            + '  </div>'
            + '  <div data-sig-merci class="hidden space-y-3">'
            + '    <p class="text-sm text-emerald-300">Merci ! Ton signalement a été envoyé aux profs de la matière.</p>'
            + '    <div class="flex justify-end"><button type="button" data-sig-fermer class="px-4 py-2 rounded-xl text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors">Fermer</button></div>'
            + '  </div>'
            + '</div>';
        const zone = fond.querySelector('textarea');
        const compte = fond.querySelector('[data-sig-compte]');
        const majCompte = () => { compte.textContent = zone.value.length + ' / ' + MESSAGE_MAX; };
        zone.addEventListener('input', majCompte);
        fond.querySelector('[data-sig-annuler]').addEventListener('click', fermerFenetre);
        fond.querySelector('[data-sig-fermer]').addEventListener('click', fermerFenetre);
        fond.querySelector('[data-sig-envoyer]').addEventListener('click', envoyerSignalement);
        fond.addEventListener('click', (e) => { if (e.target === fond) fermerFenetre(); });
        fond.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermerFenetre(); });
        fond.majCompte = majCompte;
        document.body.appendChild(fond);
        fenetre = fond;
        return fond;
    }

    let contexteFenetre = null;
    let focusAvant = null;
    function ouvrirFenetre() {
        if (!contexte) return;
        contexteFenetre = contexte;
        const f = creerFenetre();
        f.querySelector('[data-sig-lieu]').textContent = contexte.cle_exo
            ? 'Exercice : ' + titreExo(contexte.cle_exo)
            : 'Leçon : ' + titreLecon(contexte.lecon);
        f.querySelector('textarea').value = '';
        f.majCompte();
        f.querySelector('[data-sig-erreur]').classList.add('hidden');
        f.querySelector('[data-sig-formulaire]').classList.remove('hidden');
        f.querySelector('[data-sig-merci]').classList.add('hidden');
        f.querySelector('[data-sig-envoyer]').disabled = false;
        focusAvant = document.activeElement;
        f.classList.remove('hidden');
        f.querySelector('textarea').focus();
    }
    function fermerFenetre() {
        if (!fenetre) return;
        fenetre.classList.add('hidden');
        if (focusAvant && typeof focusAvant.focus === 'function') focusAvant.focus();
    }
    async function envoyerSignalement() {
        const f = fenetre, c = contexteFenetre;
        if (!f || !c) return;
        const message = f.querySelector('textarea').value.trim();
        const erreur = f.querySelector('[data-sig-erreur]');
        const montrer = (t) => { erreur.textContent = t; erreur.classList.remove('hidden'); };
        if (!message) { montrer('Écris d\'abord ce qui ne va pas.'); return; }
        const bouton = f.querySelector('[data-sig-envoyer]');
        bouton.disabled = true;
        try {
            const corps = { annee: c.annee, matiere: c.matiere, lecon: c.lecon, message };
            if (c.cle_exo) corps.cle_exo = c.cle_exo;
            await api('POST', '/api/signalement', corps);
            f.querySelector('[data-sig-formulaire]').classList.add('hidden');
            f.querySelector('[data-sig-merci]').classList.remove('hidden');
            f.querySelector('[data-sig-fermer]').focus();
        } catch (e) {
            bouton.disabled = false;
            montrer(e.message);
        }
    }

    // ---------- fonctions du site enveloppées ----------
    function envelopper(nom, apres) {
        const original = window[nom];
        if (typeof original !== 'function') { console.warn('Studicam : fonction absente', nom); return; }
        window[nom] = function (...args) {
            const r = original.apply(this, args);
            try { apres(args, r); } catch (e) { console.warn('Studicam : signalements', nom, e); }
            return r;
        };
    }
    envelopper('ouvrirLecon', ([id]) => {
        if (typeof LECONS === 'undefined' || !LECONS[id]) return;
        const l = lieu(id);
        contexte = l ? { lecon: id, cle_exo: null, annee: l.annee, matiere: l.matiere } : null;
        enTeteLecon();
        const p = pied('studicam-pied-lecon', 'lecon-contenu');
        if (p) remplirPied(p);
    });
    envelopper('ouvrirExercice', ([id]) => {
        const exo = typeof EXOS !== 'undefined' ? EXOS[id] : null;
        if (!exo) return;
        const l = exo.chapitre ? lieu(exo.chapitre) : null;
        contexte = l ? { lecon: exo.chapitre, cle_exo: id, annee: l.annee, matiere: l.matiere } : null;
        const p = pied('studicam-pied-exo', 'exo-contenu');
        if (p) remplirPied(p);
    });
    envelopper('ouvrirMatiere', () => decorerChapitres());

    // ---------- Espace prof : section « Signalements » ----------
    function dateCourte(iso) {
        if (!iso) return '';
        // les profs ne reçoivent que le jour (AAAA-MM-JJ), l'équipe l'heure exacte
        if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
            try { return new Date(iso + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); }
            catch (e) { return iso; }
        }
        try { return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
        catch (e) { return iso.slice(0, 16).replace('T', ' '); }
    }

    function sectionSignalements(conteneur) {
        let filtre = 'ouvert';
        conteneur.replaceChildren();
        const barre = el('div', 'flex flex-wrap gap-2');
        const liste = el('div', 'space-y-3');
        const etat = el('p', 'text-sm text-slate-400');
        conteneur.append(barre, etat, liste);

        function boutonFiltre(cle, libelle, n) {
            const actif = filtre === cle;
            const b = el('button', 'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors '
                + (actif ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'),
                libelle + (n != null ? ' (' + n + ')' : ''));
            b.type = 'button';
            b.setAttribute('aria-pressed', actif ? 'true' : 'false');
            b.addEventListener('click', () => { filtre = cle; charger(); });
            return b;
        }

        function carte(s, voitEleves) {
            const c = el('div', 'bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2');
            const haut = el('div', 'flex flex-wrap items-center gap-2 text-xs');
            const st = STATUTS[s.statut] || STATUTS.ouvert;
            haut.appendChild(el('span', 'px-2 py-0.5 rounded-full border font-semibold ' + st.classe, st.libelle));
            haut.appendChild(el('span', 'font-mono text-slate-400', (LIBELLES_ANNEE[s.annee] || s.annee) + ' · ' + String(s.matiere).toUpperCase()));
            haut.appendChild(el('span', 'text-slate-500 ml-auto', dateCourte(s.cree_le)));
            c.appendChild(haut);

            const lien = el('button', 'text-left text-sm font-semibold text-white hover:text-blue-300 underline decoration-dotted underline-offset-2',
                s.cle_exo ? 'Exercice : ' + titreExo(s.cle_exo) : 'Leçon : ' + titreLecon(s.lecon));
            lien.type = 'button';
            lien.addEventListener('click', () => {
                if (s.cle_exo && typeof ouvrirExercice === 'function') ouvrirExercice(s.cle_exo);
                else if (typeof ouvrirLecon === 'function') ouvrirLecon(s.lecon);
            });
            c.appendChild(lien);
            c.appendChild(el('p', 'mathjax_ignore text-sm text-slate-300 whitespace-pre-wrap break-words', s.message));

            const bas = el('div', 'flex flex-wrap items-center gap-2 pt-1');
            const infos = [];
            if (voitEleves && s.email_eleve) infos.push('Élève : ' + s.email_eleve);
            if (s.traite_par) infos.push((s.statut === 'corrige' ? 'Corrigé' : 'Rejeté') + ' par ' + s.traite_par + ', ' + dateCourte(s.traite_le));
            if (infos.length) bas.appendChild(el('span', 'mathjax_ignore text-xs text-slate-500 break-all', infos.join(' · ')));
            const actions = el('div', 'ml-auto flex gap-2');
            const action = (statut, libelle, cls) => {
                const b = el('button', 'px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ' + cls, libelle);
                b.type = 'button';
                b.addEventListener('click', async () => {
                    b.disabled = true;
                    try { await api('PATCH', '/api/prof/signalements', { id: s.id, statut }); charger(); }
                    catch (e) { b.disabled = false; if (typeof afficherToast === 'function') afficherToast(e.message); }
                });
                actions.appendChild(b);
            };
            if (s.statut === 'ouvert') {
                action('corrige', 'Corrigé', 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-400');
                action('rejete', 'Rejeté', 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500');
            } else {
                action('ouvert', 'Rouvrir', 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500');
            }
            bas.appendChild(actions);
            c.appendChild(bas);
            return c;
        }

        async function charger() {
            etat.textContent = 'Chargement…';
            let d;
            try { d = await api('GET', '/api/prof/signalements?statut=' + encodeURIComponent(filtre)); }
            catch (e) { etat.textContent = 'Impossible de lire les signalements : ' + e.message; return; }
            const compte = d.compte || {};
            barre.replaceChildren(
                boutonFiltre('ouvert', 'Ouverts', compte.ouvert),
                boutonFiltre('corrige', 'Corrigés', compte.corrige),
                boutonFiltre('rejete', 'Rejetés', compte.rejete),
                boutonFiltre('tous', 'Tous', null)
            );
            const lignes = d.signalements || [];
            liste.replaceChildren(...lignes.map(s => carte(s, d.voit_eleves)));
            etat.textContent = lignes.length ? '' : (filtre === 'ouvert' ? 'Aucun signalement ouvert dans votre périmètre.' : 'Aucun signalement.');
            etat.classList.toggle('hidden', !!lignes.length);
        }
        charger();
    }

    let sectionAjoutee = false;
    function ajouterSection() {
        if (sectionAjoutee || !estProf()) return;
        const espace = window.studicamEspaceProf;
        if (!espace || typeof espace.ajouterSection !== 'function') { console.warn('Studicam : Espace prof absent'); return; }
        espace.ajouterSection({
            id: 'signalements',
            titre: 'Signalements',
            afficher: (conteneur) => sectionSignalements(conteneur)
        });
        sectionAjoutee = true;
    }

    // ---------- démarrage ----------
    function recevoir(donnees) {
        if (!donnees || typeof donnees !== 'object') return;
        moi = donnees;
        ajouterSection();
        try { afficherContexte(); } catch (e) { console.warn('Studicam : signalements', e); }
    }
    const deja = typeof window.studicamMoi === 'function' ? window.studicamMoi() : window.studicamMoi;
    if (deja) recevoir(deja);
    document.addEventListener('studicam:moi', (e) => recevoir(e.detail));
    chargerRelectures();
})();
