/*
 * Studicam : section « Questions ratées » de l'Espace prof (ajoutée par window.studicamEspaceProf).
 *
 * Lit GET /api/prof/questions?annee=a2&matiere=ce (src/prof-questions.js) : par promo, les
 * questions de QCM de la matière classées par taux d'échec à la première réponse, donné par
 * tranches de 20 %. Jamais nominatif ; une question répondue par moins de 5 élèves de la promo
 * n'y figure pas. Le serveur ne renvoie que des identifiants : l'énoncé, la bonne réponse et le
 * chapitre viennent du site lui-même (window.studicamQuestionParId, public/serie.js), affichés
 * en texte simple.
 */
(function () {
    'use strict';

    const ANNEES = { a1: '1ère Année', a2: '2ème Année' };
    const PARTIES_DS = { ce: 'CE', expo: 'OI exposés', cours: 'OI cours' };
    const LETTRES = 'ABCDEFG';

    function el(tag, classes, texte) {
        const n = document.createElement(tag);
        if (classes) n.className = classes;
        if (texte !== undefined && texte !== null) n.textContent = texte;
        return n;
    }
    // Texte brut d'un énoncé écrit en HTML par le site (template : rien n'est exécuté ni chargé).
    function texteBrut(html) {
        const t = document.createElement('template');
        t.innerHTML = String(html == null ? '' : html);
        return t.content.textContent.replace(/\s+/g, ' ').trim();
    }
    function nomMatiere(id) {
        if (typeof MATIERES === 'undefined') return id.toUpperCase();
        const m = [...(MATIERES.techniques || []), ...(MATIERES.scientifiques || [])].find(x => x.id.toLowerCase() === id);
        return m ? m.nom : id.toUpperCase();
    }
    // Paires année/matière proposées : le périmètre du prof, ou tout pour l'équipe.
    function pairesDe(moi) {
        if (moi && moi.role === 'equipe') {
            const toutes = [];
            Object.keys(ANNEES).forEach(a => {
                const parMatiere = (typeof CHAPITRES !== 'undefined' && CHAPITRES[ANNEES[a]]) || {};
                Object.keys(parMatiere).forEach(m => toutes.push(a + '/' + m.toLowerCase()));
            });
            return toutes;
        }
        return (moi && Array.isArray(moi.perimetre) ? moi.perimetre : []).filter(p => /^a[12]\/[a-z]+$/.test(p));
    }
    const libellePaire = (paire) => paire.slice(0, 2).toUpperCase() + ' · ' + nomMatiere(paire.slice(3));

    // Question telle que le site la connaît, ou null (question modifiée ou retirée depuis).
    function questionDuSite(id) {
        try { return typeof window.studicamQuestionParId === 'function' ? window.studicamQuestionParId(id) : null; } catch (e) { return null; }
    }
    // Chapitre lisible déduit de l'identifiant, si le site ne connaît plus la question.
    function chapitreDeId(id) {
        const source = String(id).split('#')[0].split('/');
        if (source[0] === 'rds') return `Révision DS · ${PARTIES_DS[source[1]] || source[1]} · ${source[2] || ''}`;
        if (source[0] === 'exo') {
            const e = typeof EXOS !== 'undefined' ? EXOS[source[1]] : null;
            return (e && (e.libelle || e.titre)) || source[1];
        }
        return id;
    }

    function barre(t) {
        const piste = el('div', 'relative h-2 w-full rounded-full bg-slate-800 overflow-hidden');
        if (t) {
            const plein = el('div', 'absolute inset-y-0 rounded-full bg-red-500/80');
            plein.style.left = t.min + '%';
            plein.style.width = (t.max - t.min) + '%';
            piste.appendChild(plein);
        }
        return piste;
    }

    function ligneQuestion(q, rang) {
        const site = questionDuSite(q.id);
        const carte = el('li', 'rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3');
        const tete = el('div', 'flex items-start gap-3');
        tete.appendChild(el('span', 'shrink-0 w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-300 flex items-center justify-center', String(rang)));
        const texte = el('div', 'min-w-0 space-y-1');
        texte.appendChild(el('p', 'text-[11px] font-bold uppercase tracking-wider text-slate-500 break-words', (site && site.chapitre) || chapitreDeId(q.id)));
        texte.appendChild(el('p', 'text-sm text-white leading-relaxed break-words', site ? texteBrut(site.q) : typeof window.studicamQuestionParId === 'function' ? 'Question modifiée ou retirée du site depuis.' : 'Énoncé indisponible.'));
        if (site && Array.isArray(site.ok) && Array.isArray(site.opts)) {
            const bonnes = site.ok.map(i => `${LETTRES[i] || '?'}. ${texteBrut(site.opts[i])}`).join(' ; ');
            texte.appendChild(el('p', 'text-xs text-emerald-300 leading-relaxed break-words', 'Bonne réponse : ' + bonnes));
        }
        tete.appendChild(texte);
        carte.appendChild(tete);
        const chiffres = el('div', 'grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2 sm:items-center');
        const mesure = el('div', 'space-y-1');
        const ligne = el('div', 'flex items-baseline justify-between gap-2 text-xs');
        const tranche = q.echec ? `${q.echec.min} à ${q.echec.max} %` : '–';
        ligne.append(el('span', 'text-slate-500', 'Ratée du premier coup'), el('span', 'font-semibold text-slate-200 whitespace-nowrap', tranche));
        mesure.append(ligne, barre(q.echec));
        mesure.lastChild.setAttribute('role', 'img');
        mesure.lastChild.setAttribute('aria-label', 'Ratée du premier coup : ' + tranche);
        chiffres.append(mesure, el('span', 'text-xs text-slate-400 sm:text-right whitespace-nowrap', `${q.repondu} élèves ont répondu`));
        carte.appendChild(chiffres);
        return carte;
    }

    function afficherPromo(zone, donnees, nomPromo) {
        zone.replaceChildren();
        const promo = donnees.promos.find(p => p.promo === nomPromo);
        if (!promo) return;
        if (!promo.questions.length) {
            zone.append(el('p', 'text-sm text-slate-400', `Promo ${promo.promo} : aucune question de cette matière n'a encore été répondue par ${donnees.seuil} élèves ou plus.`));
            return;
        }
        const liste = el('ol', 'space-y-3');
        promo.questions.forEach((q, i) => liste.appendChild(ligneQuestion(q, i + 1)));
        zone.append(liste);
        if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([zone]).catch(e => console.warn(e));
    }

    const ERREURS = { 401: 'Session expirée : rechargez la page.', 403: 'Cette matière n\'est pas dans votre périmètre.', 429: 'Trop de requêtes, réessayez dans une minute.' };

    function afficher(conteneur, moi) {
        conteneur.replaceChildren();
        conteneur.append(el('p', 'text-sm text-slate-400 leading-relaxed',
            'Les questions de QCM que vos élèves ratent le plus, par promo : part des élèves qui ont raté la question à leur première réponse, par tranches de 20 %. Jamais nominatif ; une question répondue par moins de 5 élèves de la promo n\'apparaît pas.'));
        const paires = pairesDe(moi);
        if (!paires.length) {
            conteneur.append(el('p', 'text-sm text-slate-400 mt-3', 'Aucune matière dans votre périmètre.'));
            return;
        }
        const outils = el('div', 'flex flex-wrap items-end gap-3');
        const choix = (libelle) => {
            const l = el('label', 'flex flex-col gap-1 text-xs text-slate-500');
            const s = el('select', 'bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 max-w-full');
            l.append(libelle, s);
            outils.append(l);
            return s;
        };
        const choixMatiere = choix('Matière');
        const choixPromo = choix('Promo');
        paires.forEach(p => choixMatiere.append(new Option(libellePaire(p), p)));
        const etat = el('p', 'text-sm text-slate-400');
        etat.setAttribute('aria-live', 'polite');
        const zone = el('div', 'space-y-4');
        conteneur.append(outils, etat, zone);

        const cache = {};
        let courant = null;
        async function charger() {
            const paire = choixMatiere.value;
            courant = null;
            choixPromo.replaceChildren();
            zone.replaceChildren();
            etat.textContent = 'Chargement…';
            let donnees = cache[paire];
            if (!donnees) {
                try {
                    const [annee, matiere] = paire.split('/');
                    const r = await fetch(`/api/prof/questions?annee=${encodeURIComponent(annee)}&matiere=${encodeURIComponent(matiere)}`, { credentials: 'same-origin' });
                    if (!r.ok) { if (choixMatiere.value === paire) etat.textContent = ERREURS[r.status] || `Chiffres indisponibles (erreur ${r.status}).`; return; }
                    donnees = cache[paire] = await r.json();
                } catch (e) {
                    console.warn('Studicam : questions ratées', e);
                    if (choixMatiere.value === paire) etat.textContent = 'Serveur injoignable, réessayez plus tard.';
                    return;
                }
            }
            if (choixMatiere.value !== paire) return;
            courant = donnees;
            if (!donnees.promos.length) { etat.textContent = 'Aucune réponse d\'élève enregistrée pour cette matière.'; return; }
            donnees.promos.forEach(p => choixPromo.append(new Option('Promo ' + p.promo, p.promo)));
            const parDefaut = [...donnees.promos].sort((a, b) => b.questions.length - a.questions.length)[0];
            choixPromo.value = parDefaut.promo;
            etat.textContent = 'Chiffres du ' + new Date(donnees.genereLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) + '.';
            afficherPromo(zone, donnees, choixPromo.value);
        }
        choixMatiere.addEventListener('change', charger);
        choixPromo.addEventListener('change', () => { if (courant) afficherPromo(zone, courant, choixPromo.value); });
        charger();
    }

    // prof.js est chargé avant ce fichier ; s'il n'a pas encore créé l'Espace prof, on attend /api/moi.
    function inscrire() {
        const espace = window.studicamEspaceProf;
        if (!espace || typeof espace.ajouterSection !== 'function') return false;
        espace.ajouterSection({ id: 'questions-ratees', titre: 'Questions ratées', afficher });
        return true;
    }
    if (!inscrire()) {
        document.addEventListener('studicam:moi', function attendre() {
            if (inscrire()) document.removeEventListener('studicam:moi', attendre);
        });
    }
})();
