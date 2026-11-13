/*
 * Studicam : section « Tableau de bord » de l'Espace prof (ajoutée par window.studicamEspaceProf).
 *
 * Lit GET /api/prof/stats?annee=a2&matiere=ce : chiffres agrégés par promo, jamais une ligne
 * par élève, et pour la réussite seulement une tranche de 20 % (jamais le nombre de réussis).
 * Un exercice tenté par moins de 5 élèves n'y figure pas, une promo de moins de 5 inscrits
 * n'a aucun chiffre : la page affiche alors « moins de 5 ».
 * Les clés sont regroupées par chapitre avec CHAPITRES et window.studicamClesChapitre
 * (progression.js) ; les clés de la Révision DS et les clés inconnues vont dans des groupes à part.
 * L'export CSV est fabriqué dans le navigateur à partir de la même réponse.
 */
(function () {
    'use strict';

    const ANNEES = { a1: '1ère Année', a2: '2ème Année' };
    const PART_PEU_TRAVAILLE = 0.25;  // chapitre tenté par moins d'un quart de la promo

    // ---------- petits outils ----------
    function el(tag, classes, texte) {
        const n = document.createElement(tag);
        if (classes) n.className = classes;
        if (texte !== undefined && texte !== null) n.textContent = texte;
        return n;
    }
    const pourcent = (x) => Math.round(100 * x) + ' %';
    const moinsDe = (seuil) => 'moins de ' + seuil;
    const tranche = (t) => t ? `${t.min} à ${t.max} %` : '–';

    function nomMatiere(id) {
        if (typeof MATIERES === 'undefined') return id.toUpperCase();
        const m = [...(MATIERES.techniques || []), ...(MATIERES.scientifiques || [])].find(x => x.id.toLowerCase() === id);
        return m ? m.nom : id.toUpperCase();
    }
    function chapitresDe(paire) {
        const [annee, mat] = paire.split('/');
        if (typeof CHAPITRES === 'undefined' || !ANNEES[annee]) return [];
        return (CHAPITRES[ANNEES[annee]] || {})[mat.toUpperCase()] || [];
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

    function libelleCle(cle) {
        const [, deuxieme, exo, bloc] = cle.split('/');
        if (deuxieme === 'ds') return bloc.startsWith('examen-') ? 'Examen blanc (' + bloc.slice(7).toUpperCase() + ')' : 'QCM ' + bloc;
        const e = typeof EXOS !== 'undefined' ? EXOS[exo] : null;
        const nom = (e && (e.libelle || e.titre)) || exo;
        return bloc && bloc !== '?' ? nom + ' · ' + bloc : nom;
    }

    // ---------- regroupement par chapitre ----------
    // Renvoie [{titre, cles, chapitre?}] : les chapitres de la matière (même sans exercice),
    // puis la Révision DS et les autres clés reçues qui ne tombent dans aucun chapitre.
    function grouper(paire, connues) {
        const [annee, mat] = paire.split('/');
        const clesDe = window.studicamClesChapitre;
        const vues = new Set();
        const groupes = chapitresDe(paire).map(chap => {
            const cles = typeof clesDe === 'function' ? clesDe(chap, ANNEES[annee], mat.toUpperCase(), connues) : [];
            cles.forEach(c => vues.add(c));
            return { titre: [chap.num, chap.titre].filter(Boolean).join(' : '), cles };
        });
        const restes = connues.filter(c => !vues.has(c)).sort();
        const ds = restes.filter(c => c.split('/')[1] === 'ds');
        const autres = restes.filter(c => c.split('/')[1] !== 'ds');
        if (ds.length) groupes.push({ titre: 'Révision DS', cles: ds });
        if (autres.length) groupes.push({ titre: 'Autres exercices', cles: autres });
        return groupes;
    }

    // Chiffres d'un groupe de clés pour une promo, calculés sur les seules clés reçues (tentées
    // par 5 élèves ou plus) : une clé masquée n'entre dans aucune somme, on ne peut donc pas la
    // reconstituer par soustraction. Il n'y a pas non plus de total « toutes promos ».
    //   tentesMax : élèves de l'exercice le plus tenté (null si aucun n'atteint 5)
    //   reussite  : fourchette {min, max} en % du taux de réussite du groupe, déduite des seules
    //               tranches reçues (bornes moyennées, pondérées par les tentés) : le vrai taux
    //               est dedans. Pour un exercice seul, c'est sa tranche.
    function bilan(cles, statsCles, inscrits) {
        let tentesMax = null, tentes = 0, bas = 0, haut = 0;
        cles.forEach(c => {
            const s = statsCles[c];
            if (!s || !s.reussite) return;
            tentesMax = Math.max(tentesMax || 0, s.tentes);
            tentes += s.tentes;
            bas += s.tentes * s.reussite.min;
            haut += s.tentes * s.reussite.max;
        });
        const part = tentesMax !== null && inscrits ? Math.min(1, tentesMax / inscrits) : null;
        return {
            tentesMax,
            part,
            reussite: tentes ? { min: Math.floor(bas / tentes), max: Math.ceil(haut / tentes) } : null,
            peuTravaille: cles.length > 0 && (part === null || part < PART_PEU_TRAVAILLE)
        };
    }

    // ---------- affichage ----------
    // Barre de debut à fin (en %, de 0 à 100) : jauge pleine (debut = 0) ou fourchette ; vide si fin est null.
    function barre(debut, fin, couleur, titre) {
        const piste = el('div', 'relative h-2 w-full rounded-full bg-slate-800 overflow-hidden');
        piste.setAttribute('role', 'img');
        piste.setAttribute('aria-label', titre);
        piste.title = titre;
        if (fin !== null) {
            const plein = el('div', 'absolute inset-y-0 rounded-full ' + couleur);
            plein.style.left = debut + '%';
            plein.style.width = Math.max(0, fin - debut) + '%';
            piste.appendChild(plein);
        }
        return piste;
    }
    function mesure(libelle, valeur, debut, fin, couleur) {
        const bloc = el('div', 'min-w-0');
        const ligne = el('div', 'flex items-baseline justify-between gap-2 text-xs mb-1');
        ligne.append(el('span', 'text-slate-500', libelle), el('span', 'font-semibold text-slate-200 whitespace-nowrap', valeur));
        bloc.append(ligne, barre(debut, fin, couleur, libelle + ' : ' + valeur));
        return bloc;
    }

    function carteChapitre(groupe, promo, seuil) {
        const b = bilan(groupe.cles, promo.cles, promo.inscrits);
        const carte = el('details', 'group rounded-xl border bg-slate-900/60 '
            + (b.peuTravaille ? 'border-amber-500/40' : 'border-slate-800'));
        const resume = el('summary', 'cursor-pointer list-none p-4 grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center');
        const titre = el('div', 'min-w-0');
        const ligneTitre = el('div', 'flex items-center gap-2 flex-wrap');
        ligneTitre.append(el('span', 'font-semibold text-white', groupe.titre));
        if (b.peuTravaille) ligneTitre.append(el('span', 'text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300', 'Peu travaillé'));
        titre.append(ligneTitre);
        const n = groupe.cles.length;
        titre.append(el('div', 'text-xs text-slate-500 mt-0.5', n ? `${n} exercice${n > 1 ? 's' : ''} suivi${n > 1 ? 's' : ''}` : 'Pas d\'exercice suivi pour ce chapitre'));
        resume.append(titre);
        if (n) {
            resume.append(
                mesure('Élèves (exercice le plus tenté)', b.tentesMax === null ? moinsDe(seuil) : `${b.tentesMax} (${pourcent(b.part)})`,
                    0, b.part === null ? null : Math.round(100 * b.part), 'bg-blue-500'),
                mesure('Réussite (fourchette)', tranche(b.reussite),
                    b.reussite ? b.reussite.min : 0, b.reussite ? b.reussite.max : null, 'bg-emerald-500')
            );
        }
        carte.append(resume);
        if (!n) return carte;

        const corps = el('div', 'px-4 pb-4 overflow-x-auto');
        const table = el('table', 'w-full text-sm');
        const tete = el('tr', 'text-left text-xs text-slate-500');
        ['Exercice', 'Ont tenté', 'Réussite', 'Score moyen'].forEach((t, i) => tete.append(el('th', 'py-2 font-medium' + (i ? ' text-right pl-3 whitespace-nowrap' : ''), t)));
        table.append(el('thead'), el('tbody'));
        table.tHead.append(tete);
        groupe.cles.forEach(cle => {
            const s = promo.cles[cle];
            const tr = el('tr', 'border-t border-slate-800');
            const nom = el('td', 'py-2 text-slate-300', libelleCle(cle));
            nom.title = cle;
            tr.append(nom,
                el('td', 'py-2 pl-3 text-right whitespace-nowrap ' + (s ? 'text-slate-200' : 'text-slate-500'), s ? String(s.tentes) : moinsDe(seuil)),
                el('td', 'py-2 pl-3 text-right whitespace-nowrap text-slate-200', s ? tranche(s.reussite) : '–'),
                el('td', 'py-2 pl-3 text-right whitespace-nowrap text-slate-200', s && s.scoreMoyen !== null ? s.scoreMoyen + ' / 100' : '–'));
            table.tBodies[0].append(tr);
        });
        corps.append(table);
        carte.append(corps);
        return carte;
    }

    function afficherPromo(zone, donnees, paire, nomPromo) {
        zone.replaceChildren();
        const promo = donnees.promos.find(p => p.promo === nomPromo);
        if (!promo) return;
        const seuil = donnees.seuil;
        if (promo.inscrits === null) {
            zone.append(el('p', 'text-sm text-slate-400', `Promo ${promo.promo} : ${moinsDe(seuil)} élèves inscrits sur Studicam, aucun chiffre n'est affiché.`));
            return;
        }
        const chiffres = el('div', 'grid grid-cols-2 lg:grid-cols-4 gap-3');
        const nombre = (v) => v === null || v === undefined ? moinsDe(seuil) : String(v);
        [['Comptes de la promo sur Studicam (toutes matières)', String(promo.inscrits)],
         [`Venus sur le site en ${donnees.joursActifs} jours (toutes matières)`, nombre(promo.actifs)],
         ['Élèves ayant fait au moins un exercice de cette matière', nombre(promo.eleves)],
         ['Exercices tentés par 5 élèves ou plus', String(Object.keys(promo.cles).length)]].forEach(([l, v]) => {
            const c = el('div', 'rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3');
            c.append(el('div', 'text-xs text-slate-500', l), el('div', 'text-xl font-bold text-white mt-1', v));
            chiffres.append(c);
        });
        zone.append(chiffres);

        const groupes = grouper(paire, cleConnues(donnees));
        const peu = groupes.filter(g => bilan(g.cles, promo.cles, promo.inscrits).peuTravaille);
        if (peu.length) {
            const alerte = el('p', 'text-sm rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 px-4 py-3');
            alerte.textContent = `Peu travaillé (moins d'un quart de la promo sur l'exercice le plus tenté) : ${peu.map(g => g.titre).join(' ; ')}.`;
            zone.append(alerte);
        }
        const liste = el('div', 'space-y-3');
        groupes.forEach(g => liste.append(carteChapitre(g, promo, seuil)));
        zone.append(liste);
    }

    const cleConnues = (donnees) => [...new Set(donnees.promos.flatMap(p => Object.keys(p.cles)))];

    // ---------- export CSV ----------
    function celluleCsv(v) {
        let t = v === null || v === undefined ? '' : String(v);
        if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;  // pas de formule dans un tableur
        return /[";\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    }
    function exporterCsv(donnees, paire) {
        const lignes = [['promo', 'chapitre', 'exercice', 'cle', 'comptes_promo', `venus_${donnees.joursActifs}_jours`,
            'eleves_matiere', 'eleves_ayant_tente', 'reussite_min_pct', 'reussite_max_pct', 'score_moyen_sur_100', 'remarque']];
        const groupes = grouper(paire, cleConnues(donnees));
        donnees.promos.forEach(promo => {
            if (promo.inscrits === null) {
                lignes.push([promo.promo, '', '', '', '', '', '', '', '', '', '', `moins de ${donnees.seuil} élèves inscrits`]);
                return;
            }
            groupes.forEach(g => g.cles.forEach(cle => {
                const s = promo.cles[cle];
                lignes.push([promo.promo, g.titre, libelleCle(cle), cle, promo.inscrits, promo.actifs,
                    promo.eleves, s ? s.tentes : '', s && s.reussite ? s.reussite.min : '', s && s.reussite ? s.reussite.max : '',
                    s && s.scoreMoyen !== null ? s.scoreMoyen : '',
                    s ? '' : `tenté par moins de ${donnees.seuil} élèves`]);
            }));
        });
        const texte = '﻿' + lignes.map(l => l.map(celluleCsv).join(';')).join('\r\n') + '\r\n';
        const url = URL.createObjectURL(new Blob([texte], { type: 'text/csv;charset=utf-8' }));
        const a = el('a');
        a.href = url;
        a.download = `studicam-${paire.replace('/', '-')}-${donnees.genereLe.slice(0, 10)}.csv`;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // ---------- section ----------
    const ERREURS = { 401: 'Session expirée : recharge la page.', 403: 'Cette matière n\'est pas dans votre périmètre.', 429: 'Trop de requêtes, réessayez dans une minute.' };

    function afficher(conteneur, moi) {
        conteneur.replaceChildren();
        const paires = pairesDe(moi);
        conteneur.append(el('p', 'text-sm text-slate-400',
            'Chiffres agrégés par promo, jamais nominatifs. Un exercice tenté par moins de 5 élèves, ou une promo de moins de 5 inscrits, n\'affiche aucun chiffre.'));
        if (!paires.length) {
            conteneur.append(el('p', 'text-sm text-slate-400 mt-3', 'Aucune matière dans votre périmètre.'));
            return;
        }

        const barreOutils = el('div', 'flex flex-wrap items-end gap-3 mt-4');
        const choix = (libelle) => {
            const l = el('label', 'flex flex-col gap-1 text-xs text-slate-500');
            const s = el('select', 'bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200');
            l.append(libelle, s);
            barreOutils.append(l);
            return s;
        };
        const choixMatiere = choix('Matière');
        const choixPromo = choix('Promo');
        paires.forEach(p => choixMatiere.append(new Option(libellePaire(p), p)));
        const bouton = el('button', 'px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50', 'Exporter en CSV');
        bouton.type = 'button';
        barreOutils.append(bouton);
        const etat = el('p', 'text-sm text-slate-400 mt-4');
        etat.setAttribute('aria-live', 'polite');
        const zone = el('div', 'space-y-4 mt-4');
        conteneur.append(barreOutils, etat, zone);

        const cache = {};
        let courant = null;
        async function charger() {
            const paire = choixMatiere.value;
            courant = null;
            bouton.disabled = true;
            choixPromo.replaceChildren();
            zone.replaceChildren();
            etat.textContent = 'Chargement…';
            let donnees = cache[paire];
            if (!donnees) {
                try {
                    const [annee, matiere] = paire.split('/');
                    const r = await fetch(`/api/prof/stats?annee=${encodeURIComponent(annee)}&matiere=${encodeURIComponent(matiere)}`, { credentials: 'same-origin' });
                    if (!r.ok) { if (choixMatiere.value === paire) etat.textContent = ERREURS[r.status] || `Chiffres indisponibles (erreur ${r.status}).`; return; }
                    donnees = cache[paire] = await r.json();
                } catch (e) {
                    console.warn('Studicam : tableau de bord', e);
                    if (choixMatiere.value === paire) etat.textContent = 'Serveur injoignable, réessayez plus tard.';
                    return;
                }
            }
            if (choixMatiere.value !== paire) return;  // une autre matière a été choisie entre-temps
            courant = { paire, donnees };
            if (!donnees.promos.length) { etat.textContent = 'Aucun élève n\'est encore inscrit sur Studicam.'; return; }
            donnees.promos.forEach(p => choixPromo.append(new Option('Promo ' + p.promo, p.promo)));
            // par défaut : la promo qui a le plus d'exercices tentés par 5 élèves ou plus
            const parDefaut = [...donnees.promos].sort((a, b) => Object.keys(b.cles).length - Object.keys(a.cles).length)[0];
            choixPromo.value = parDefaut.promo;
            etat.textContent = 'Chiffres du ' + new Date(donnees.genereLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) + '.';
            bouton.disabled = false;
            afficherPromo(zone, donnees, paire, choixPromo.value);
        }
        choixMatiere.addEventListener('change', charger);
        choixPromo.addEventListener('change', () => { if (courant) afficherPromo(zone, courant.donnees, courant.paire, choixPromo.value); });
        bouton.addEventListener('click', () => { if (courant) exporterCsv(courant.donnees, courant.paire); });
        charger();
    }

    window.studicamTableauDeBord = { bilan };  // pour test/stats.test.js

    // prof.js est chargé avant ce fichier ; s'il n'a pas encore créé l'Espace prof, on attend /api/moi.
    function inscrire() {
        const espace = window.studicamEspaceProf;
        if (!espace || typeof espace.ajouterSection !== 'function') return false;
        espace.ajouterSection({ id: 'tableau-de-bord', titre: 'Tableau de bord', afficher });
        return true;
    }
    if (!inscrire()) {
        document.addEventListener('studicam:moi', function attendre() {
            if (inscrire()) document.removeEventListener('studicam:moi', attendre);
            else console.warn('Studicam : Espace prof absent, tableau de bord non ajouté');
        });
    }
})();
