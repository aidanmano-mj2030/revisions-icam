/*
 * Studicam : page « Ma progression », carnet d'erreurs et résumé en tête de chaque matière.
 *
 * Chargé à la fin de index.html (defer), après progression.js. Ne modifie aucune fonction du
 * site : il en enveloppe quelques-unes (cacherToutesLesEtapes pour masquer sa page,
 * ouvrirMatiere et ouvrirRevisionDS pour les résumés) et écoute des événements.
 *
 * Enregistrement : à chaque « studicam:serie-terminee » (public/serie.js, contrat commun point B),
 * le detail est envoyé à POST /api/series (src/series.js). Une série sans aucune réponse n'est pas
 * envoyée. Lecture : GET /api/series (ses 200 dernières séries et son carnet d'erreurs), une fois
 * la session connue (« studicam:moi »), puis après chaque envoi. Rien n'est gardé dans le navigateur.
 *
 * Page : étape #etape-ma-progression, adresse #/progression déclarée par
 * window.studicamRoutes.ajouter (public/navigation.js) ; sans lui, le bouton de l'en-tête
 * l'ouvre directement. Courbe des notes sur 20 par matière (SVG fait main), dernières séries,
 * carnet d'erreurs groupé par chapitre avec « Refaire ces questions »
 * (window.studicamLancerSerie, contrat point C ; sans lui, la liste s'affiche sans bouton).
 * L'énoncé d'une question vient de window.studicamQuestionParId (contrat point C).
 *
 * Tout texte reçu du serveur (titres, chapitres) est affiché par textContent.
 * Pour les tests : window.studicamMaProgression = { tendance, resume, grouperCarnet, ... }.
 */
(function () {
    'use strict';

    const ANNEES = { a1: '1ère Année', a2: '2ème Année' };
    const CODES_ANNEE = { '1ère Année': 'a1', '2ème Année': 'a2' };
    // Ordre fixe des matières : chacune garde sa couleur, quel que soit le filtre.
    const ORDRE = ['ce', 'oi', 'cm', 'aii', 'maths', 'phys', 'eco', 'est'];
    const COURTS = { ce: 'CE', oi: 'OI', cm: 'CM', aii: 'AII', maths: 'Maths', phys: 'Physique', eco: 'Éco', est: 'EST' };
    const MIXTE = 'mixte';         // examen blanc « tout » de la Révision DS (CE et OI mélangés)
    const PREFIXE_DS = 'a2/ds/';
    const SERIES_VISIBLES = 5;     // dernières séries affichées avant « Voir plus »
    const $ = (id) => document.getElementById(id);

    let donnees = null;            // { series, carnet } de GET /api/series
    let erreurLecture = false;
    let enCours = null;            // promesse de lecture en cours
    let connecte = false;
    let filtre = 'tout';           // 'tout', 'a2/ce', ..., 'mixte'
    let serieRefaire = null;       // titre de la dernière série lancée depuis le carnet
    let seriesMontrees = SERIES_VISIBLES;

    // ---------- outils ----------
    function el(tag, cls, texte) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (texte != null) e.textContent = texte;
        return e;
    }
    function bouton(cls, texte, action) {
        const b = el('button', cls, texte);
        b.type = 'button';
        if (action) b.addEventListener('click', action);
        return b;
    }
    function icone(nom, cls) {
        const i = document.createElement('i');
        i.dataset.lucide = nom;
        i.className = cls || 'w-4 h-4';
        return i;
    }
    function rafraichir(zone) {
        if (window.lucide) lucide.createIcons();
        if (zone && window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([zone]).catch(e => console.warn(e));
    }
    const virgule = (x) => (Math.round(x * 100) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    const pluriel = (n, mot, motPluriel) => `${n} ${n > 1 ? (motPluriel || mot + 's') : mot}`;
    // Texte brut d'un énoncé écrit en HTML par le site (template : rien n'est exécuté ni chargé).
    function texteBrut(html) {
        const t = document.createElement('template');
        t.innerHTML = String(html == null ? '' : html);
        return t.content.textContent.replace(/\s+/g, ' ').trim();
    }
    function dateCourte(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return '';
        const memeAnnee = d.getFullYear() === new Date().getFullYear();
        return d.toLocaleDateString('fr-FR', memeAnnee ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
    }
    function quand(iso, maintenant = Date.now()) {
        const d = new Date(iso);
        if (isNaN(d)) return '';
        const jour = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
        const ecart = Math.round((jour(new Date(maintenant)) - jour(d)) / 864e5);
        if (ecart <= 0) return "aujourd'hui";
        if (ecart === 1) return 'hier';
        if (ecart < 7) return `il y a ${ecart} jours`;
        return 'le ' + dateCourte(iso);
    }
    function texteDuree(s) {
        if (s == null) return '';
        const m = Math.floor(s / 60), r = s % 60;
        return m ? `${m} min${r ? ' ' + String(r).padStart(2, '0') + ' s' : ''}` : `${r} s`;
    }
    function nomMatiere(m) {
        if (typeof MATIERES === 'undefined') return m.toUpperCase();
        const t = [...(MATIERES.techniques || []), ...(MATIERES.scientifiques || [])].find(x => x.id.toLowerCase() === m);
        return t ? t.nom : m.toUpperCase();
    }

    // ---------- calculs (sans DOM, testés par npm test) ----------
    // Clé de regroupement d'une série : 'a2/ce', ou 'mixte' pour l'examen blanc « tout ».
    function groupeDeSerie(s) {
        if (s.annee && s.matiere) return s.annee + '/' + s.matiere;
        if (typeof s.cle === 'string' && s.cle.startsWith(PREFIXE_DS)) return MIXTE;
        return null;
    }
    function groupeDeQuestion(q) {
        return q.annee && q.matiere ? q.annee + '/' + q.matiere : null;
    }
    function libelleGroupe(g, plusieursAnnees) {
        if (g === MIXTE) return 'Examen CE + OI';
        const [a, m] = g.split('/');
        return (plusieursAnnees ? a.toUpperCase() + ' · ' : '') + (COURTS[m] || m.toUpperCase());
    }
    function rangGroupe(g) {
        if (g === MIXTE) return 99;
        const [a, m] = g.split('/');
        return (a === 'a2' ? 0 : 50) + (ORDRE.indexOf(m) >= 0 ? ORDRE.indexOf(m) : 40);
    }
    // Couleur fixe : celle de la matière (une même matière garde sa couleur dans les deux années).
    const classeCouleur = (g) => g === MIXTE ? 'mp-c-mixte' : 'mp-c-' + g.split('/')[1];

    // Tendance d'une suite de notes (de la plus ancienne à la plus récente) : la dernière comparée
    // à la moyenne des trois précédentes. Null avec moins de deux notes.
    function tendance(notes) {
        if (!Array.isArray(notes) || notes.length < 2) return null;
        const derniere = notes[notes.length - 1];
        const avant = notes.slice(-4, -1);
        const ecart = Math.round((derniere - avant.reduce((a, b) => a + b, 0) / avant.length) * 10) / 10;
        return { sens: ecart >= 1 ? 'hausse' : ecart <= -1 ? 'baisse' : 'stable', ecart };
    }

    // Résumé d'un groupe de séries et d'erreurs : { derniere, tendance, erreurs, series }.
    //   garderSerie(s), garderQuestion(q) : filtres ; les séries « Refaire » ne comptent pas.
    //   memeCle : tendance calculée sur les seules séries de la même clé que la dernière (la
    //   Révision DS mélange examens CE, OI et « tout », qu'on ne compare pas entre eux).
    function resume(d, garderSerie, garderQuestion, memeCle) {
        const series = ((d && d.series) || []).filter(s => !s.refaire && garderSerie(s))
            .sort((a, b) => String(a.fait_le).localeCompare(String(b.fait_le)));
        const erreurs = ((d && d.carnet) || []).filter(garderQuestion).length;
        const derniere = series.length ? series[series.length - 1] : null;
        const comparees = memeCle && derniere ? series.filter(s => s.cle === derniere.cle) : series;
        return { derniere, tendance: tendance(comparees.map(s => s.note20)), erreurs, series: series.length };
    }

    // Carnet groupé par chapitre : [{ chapitre, questions }], le plus fourni d'abord.
    function grouperCarnet(carnet) {
        const groupes = new Map();
        (carnet || []).forEach(q => {
            const c = q.chapitre || 'Autres questions';
            if (!groupes.has(c)) groupes.set(c, []);
            groupes.get(c).push(q);
        });
        return [...groupes].map(([chapitre, questions]) => ({ chapitre, questions }))
            .sort((a, b) => b.questions.length - a.questions.length || a.chapitre.localeCompare(b.chapitre, 'fr'));
    }

    // Corps envoyé à POST /api/series, ou null si la série n'a aucune réponse.
    function corpsSerie(detail, refaire) {
        if (!detail || typeof detail !== 'object' || !Array.isArray(detail.questions)) return null;
        if (!detail.questions.some(q => q && q.repondue !== false)) return null;
        const champs = ['cle', 'annee', 'matiere', 'titre', 'mode', 'total', 'justes', 'note20', 'pourcent', 'duree_s'];
        const corps = {};
        champs.forEach(c => { if (detail[c] !== undefined) corps[c] = detail[c]; });
        corps.questions = detail.questions.map(q => ({ id: q.id, chapitre: q.chapitre, juste: !!q.juste, repondue: q.repondue !== false }));
        if (refaire) corps.refaire = true;
        return corps;
    }

    // ---------- réseau ----------
    function charger() {
        if (enCours) return enCours;
        enCours = fetch('/api/series', { credentials: 'same-origin' })
            .then(r => {
                if (!r.ok) throw new Error('GET /api/series ' + r.status);
                return r.json();
            })
            .then(j => {
                donnees = { series: Array.isArray(j.series) ? j.series : [], carnet: Array.isArray(j.carnet) ? j.carnet : [] };
                erreurLecture = false;
            })
            .catch(e => { console.warn('Studicam : ma progression', e); erreurLecture = !donnees; })
            .then(() => { enCours = null; majTout(); });
        return enCours;
    }

    function envoyer(detail) {
        const refaire = !!serieRefaire && !!detail && detail.titre === serieRefaire;
        if (refaire) serieRefaire = null;
        const corps = corpsSerie(detail, refaire);
        if (!corps) return;
        fetch('/api/series', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps)
        }).then(r => {
            if (r.ok) return charger();
            console.warn('Studicam : série non enregistrée', r.status);
            if (typeof afficherToast === 'function') {
                afficherToast(r.status === 401 ? 'Note non enregistrée : ta session a expiré, reconnecte-toi.' : 'Note non enregistrée, réessaie plus tard.');
            }
        }).catch(e => {
            console.warn('Studicam : série non enregistrée', e);
            if (typeof afficherToast === 'function') afficherToast('Note non enregistrée : serveur injoignable.');
        });
    }
    document.addEventListener('studicam:serie-terminee', (e) => { try { envoyer(e.detail); } catch (err) { console.warn('Studicam : ma progression', err); } });

    // ---------- styles (couleurs fixes par matière, en sombre et en clair) ----------
    function ajouterStyles() {
        if ($('mp-styles')) return;
        const s = el('style');
        s.id = 'mp-styles';
        // palette catégorielle validée (8 teintes), pas sombres puis pas clairs ; mixte : gris
        const sombre = { ce: '#3987e5', oi: '#d95926', cm: '#199e70', aii: '#c98500', maths: '#d55181', phys: '#008300', eco: '#9085e9', est: '#e66767', mixte: '#94a3b8' };
        const clair = { ce: '#2a78d6', oi: '#eb6834', cm: '#1baf7a', aii: '#eda100', maths: '#e87ba4', phys: '#008300', eco: '#6250d6', est: '#e34948', mixte: '#64748b' };
        s.textContent = Object.keys(sombre).map(k => `.mp-c-${k}{color:${sombre[k]}}html.clair .mp-c-${k}{color:${clair[k]}}`).join('')
            + '.mp-grille{stroke:#273449}html.clair .mp-grille{stroke:#e2e8f0}'
            + '.mp-axe{fill:#94a3b8}html.clair .mp-axe{fill:#475569}'
            + '.mp-anneau{stroke:#161e2e}html.clair .mp-anneau{stroke:#ffffff}'
            + '.mp-clamp{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}';
        document.head.appendChild(s);
    }

    // ---------- page ----------
    function creerEtape() {
        let etape = $('etape-ma-progression');
        if (etape) return etape;
        const voisine = $('etape-revision-ds');
        if (!voisine || !voisine.parentElement) return null;
        ajouterStyles();
        etape = el('div', 'hidden space-y-6 text-left max-w-4xl mx-auto');
        etape.id = 'etape-ma-progression';
        const tete = el('div', 'flex flex-col items-start gap-4');
        const retour = bouton('inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white px-4 py-2 rounded-xl bg-darkcard border border-darkborder transition-all hover:border-slate-500', null, () => {
            if (typeof retourAnnee === 'function') retourAnnee();
        });
        retour.append(icone('arrow-left'), document.createTextNode(" Retour à l'accueil"));
        const titres = el('div', 'space-y-2');
        titres.append(
            el('div', 'inline-block px-3 py-1 rounded-md text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20', 'Suivi personnel'),
            el('h1', 'text-2xl sm:text-4xl font-extrabold text-white tracking-tight', 'Ma progression'),
            el('p', 'text-sm text-slate-400 leading-relaxed max-w-2xl', "Tes notes aux séries de QCM terminées et les questions à retravailler. Toi seul vois ce détail : les profs n'ont que des chiffres d'ensemble, jamais nominatifs.")
        );
        tete.append(retour, titres);
        const contenu = el('div', 'space-y-5');
        contenu.dataset.mpContenu = '1';
        etape.append(tete, contenu);
        voisine.after(etape);
        return etape;
    }
    const pageVisible = () => { const e = $('etape-ma-progression'); return !!e && !e.classList.contains('hidden'); };

    // Affiche la page (appelée par la route #/progression, ou directement sans navigation.js).
    function afficherPage() {
        const etape = creerEtape();
        if (!etape) return false;
        if (typeof cacherToutesLesEtapes === 'function') cacherToutesLesEtapes();
        if (typeof reinitialiserFond === 'function') reinitialiserFond();
        etape.classList.remove('hidden');
        seriesMontrees = SERIES_VISIBLES;
        rendrePage();
        window.scrollTo(0, 0);
        charger();
        return true;
    }
    function ouvrirPage(groupe) {
        if (groupe) filtre = groupe;
        const routes = window.studicamRoutes;
        if (routes && typeof routes.aller === 'function') {
            routes.aller('#/progression');
            if (pageVisible()) return;          // sinon : route non déclarée, on ouvre quand même
        }
        afficherPage();
    }
    window.studicamOuvrirProgression = ouvrirPage;

    function carte(titre, nomIcone) {
        const c = el('section', 'bg-darkcard border border-darkborder rounded-2xl p-4 sm:p-6 shadow-xl space-y-4');
        const t = el('div', 'flex items-center gap-3');
        const pastille = el('div', 'w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0');
        pastille.appendChild(icone(nomIcone));
        t.append(pastille, el('h2', 'text-lg font-bold text-white', titre));
        c.appendChild(t);
        return c;
    }

    function rendrePage() {
        const etape = $('etape-ma-progression');
        const zone = etape && etape.querySelector('[data-mp-contenu]');
        if (!zone) return;
        zone.replaceChildren();
        if (!donnees) {
            zone.appendChild(el('p', 'text-sm text-slate-400', erreurLecture ? "Impossible de lire ta progression pour l'instant. Réessaie dans un moment." : 'Chargement…'));
            return;
        }
        const series = donnees.series, carnet = donnees.carnet;
        if (!series.length && !carnet.length) {
            const vide = carte('Rien pour l\'instant', 'sparkles');
            vide.appendChild(el('p', 'text-sm text-slate-300 leading-relaxed', "Termine une série de QCM (l'examen blanc de la Révision DS, ou les QCM d'un chapitre) avec le bouton « Terminer » : ta note et les questions ratées apparaîtront ici."));
            zone.appendChild(vide);
            rafraichir(zone);
            return;
        }

        // groupes présents (séries hors « Refaire » et carnet), pour les filtres
        const groupes = new Set();
        series.filter(s => !s.refaire).forEach(s => { const g = groupeDeSerie(s); if (g) groupes.add(g); });
        carnet.forEach(q => { const g = groupeDeQuestion(q); if (g) groupes.add(g); });
        const liste = [...groupes].sort((a, b) => rangGroupe(a) - rangGroupe(b));
        const plusieursAnnees = new Set(liste.filter(g => g !== MIXTE).map(g => g.split('/')[0])).size > 1;
        if (filtre !== 'tout' && !groupes.has(filtre)) filtre = 'tout';

        if (liste.length > 1) {
            const filtres = el('div', 'flex flex-wrap gap-2');
            filtres.setAttribute('role', 'group');
            filtres.setAttribute('aria-label', 'Matière affichée');
            ['tout', ...liste].forEach(g => {
                const actif = filtre === g;
                const b = bouton(`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${actif ? 'bg-slate-200 text-slate-950 border-slate-200' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'}`, null, () => { filtre = g; seriesMontrees = SERIES_VISIBLES; rendrePage(); });
                if (g !== 'tout') {
                    const point = el('span', 'inline-block w-2.5 h-2.5 rounded-full ' + classeCouleur(g));
                    point.style.background = 'currentColor';
                    b.appendChild(point);
                }
                b.appendChild(document.createTextNode(g === 'tout' ? 'Toutes' : libelleGroupe(g, plusieursAnnees)));
                b.setAttribute('aria-pressed', String(actif));
                filtres.appendChild(b);
            });
            zone.appendChild(filtres);
        }

        const garde = (g) => filtre === 'tout' || g === filtre;
        const seriesCourbe = series.filter(s => !s.refaire && groupeDeSerie(s) && garde(groupeDeSerie(s)));
        const seriesListe = series.filter(s => filtre === 'tout' || groupeDeSerie(s) === filtre);
        const carnetFiltre = carnet.filter(q => filtre === 'tout'
            || (filtre === MIXTE ? String(q.id).startsWith('rds/') : groupeDeQuestion(q) === filtre));

        zone.appendChild(carteCourbe(seriesCourbe, plusieursAnnees));
        zone.appendChild(carteSeries(seriesListe, plusieursAnnees));
        zone.appendChild(carteCarnet(carnetFiltre));
        rafraichir(zone);
    }

    // ---------- courbe des notes (SVG fait main) ----------
    const SVG = 'http://www.w3.org/2000/svg';
    function svg(tag, attrs) {
        const n = document.createElementNS(SVG, tag);
        Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, String(v)));
        return n;
    }

    function carteCourbe(series, plusieursAnnees) {
        const c = carte('Mes notes sur 20', 'trending-up');
        if (!series.length) {
            c.appendChild(el('p', 'text-sm text-slate-400', 'Aucune série terminée ici pour l\'instant (les séries « Refaire » ne comptent pas dans la courbe).'));
            return c;
        }
        const parGroupe = new Map();
        series.forEach(s => {
            const g = groupeDeSerie(s);
            if (!parGroupe.has(g)) parGroupe.set(g, []);
            parGroupe.get(g).push(s);
        });
        parGroupe.forEach(l => l.sort((a, b) => String(a.fait_le).localeCompare(String(b.fait_le))));
        const groupes = [...parGroupe.keys()].sort((a, b) => rangGroupe(a) - rangGroupe(b));

        // légende (toujours là dès deux matières) avec la dernière note de chacune
        if (groupes.length > 1) {
            const legende = el('ul', 'flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300');
            groupes.forEach(g => {
                const l = parGroupe.get(g), der = l[l.length - 1];
                const li = el('li', 'inline-flex items-center gap-1.5');
                const trait = el('span', 'inline-block w-4 h-0.5 rounded ' + classeCouleur(g));
                trait.style.background = 'currentColor';
                li.append(trait, document.createTextNode(`${libelleGroupe(g, plusieursAnnees)} · ${virgule(der.note20)}/20`));
                legende.appendChild(li);
            });
            c.appendChild(legende);
        }

        const cadre = el('div', 'relative');
        c.appendChild(cadre);
        const info = el('div', 'pointer-events-none absolute z-10 hidden max-w-[220px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 shadow-xl');
        info.setAttribute('role', 'status');
        const dessiner = () => dessinerCourbe(cadre, info, parGroupe, groupes, plusieursAnnees);
        // dessinée une fois la carte insérée (largeur connue), puis à chaque changement de largeur
        requestAnimationFrame(dessiner);
        if (typeof ResizeObserver === 'function') {
            let largeur = 0, minuterie = null;
            new ResizeObserver(entrees => {
                const w = Math.round(entrees[0].contentRect.width);
                if (!w || w === largeur) return;
                largeur = w;
                clearTimeout(minuterie);
                minuterie = setTimeout(dessiner, 80);
            }).observe(cadre);
        }
        c.appendChild(el('p', 'text-xs text-slate-500', 'Chaque point est une série terminée. Touche ou survole un point pour voir le détail ; la liste juste en dessous reprend les mêmes notes.'));
        return c;
    }

    function dessinerCourbe(cadre, info, parGroupe, groupes, plusieursAnnees) {
        const largeur = Math.max(260, Math.round(cadre.clientWidth || 300));
        const hauteur = largeur < 480 ? 200 : 240;
        const m = { g: 30, d: 14, h: 10, b: 26 };
        const toutes = groupes.flatMap(g => parGroupe.get(g));
        const temps = toutes.map(s => new Date(s.fait_le).getTime()).filter(t => !isNaN(t));
        let t0 = Math.min(...temps), t1 = Math.max(...temps);
        if (t1 - t0 < 864e5) { t0 -= 432e5; t1 += 432e5; }           // moins d'un jour : on élargit
        const x = (t) => m.g + (largeur - m.g - m.d) * (t - t0) / (t1 - t0);
        const y = (n) => m.h + (hauteur - m.h - m.b) * (1 - Math.max(0, Math.min(20, n)) / 20);

        const racine = svg('svg', { width: largeur, height: hauteur, viewBox: `0 0 ${largeur} ${hauteur}`, role: 'img' });
        racine.setAttribute('aria-label', 'Courbe de mes notes sur 20 dans le temps, par matière');
        racine.style.display = 'block';
        racine.style.overflow = 'visible';
        [0, 5, 10, 15, 20].forEach(n => {
            racine.appendChild(svg('line', { x1: m.g, x2: largeur - m.d, y1: y(n), y2: y(n), class: 'mp-grille', 'stroke-width': 1 }));
            const t = svg('text', { x: m.g - 6, y: y(n) + 4, 'text-anchor': 'end', 'font-size': 11, class: 'mp-axe' });
            t.textContent = String(n);
            racine.appendChild(t);
        });
        // dates : début, fin, et le milieu s'il y a la place
        const reperes = largeur >= 420 ? [t0, (t0 + t1) / 2, t1] : [t0, t1];
        reperes.forEach((t, i) => {
            const ancre = i === 0 ? 'start' : i === reperes.length - 1 ? 'end' : 'middle';
            const txt = svg('text', { x: x(t), y: hauteur - 6, 'text-anchor': ancre, 'font-size': 11, class: 'mp-axe' });
            txt.textContent = dateCourte(new Date(t).toISOString());
            racine.appendChild(txt);
        });

        const cibles = [];
        groupes.forEach(g => {
            const l = parGroupe.get(g).filter(s => !isNaN(new Date(s.fait_le)));
            const couleur = classeCouleur(g);
            if (l.length > 1) {
                const d = l.map((s, i) => `${i ? 'L' : 'M'}${x(new Date(s.fait_le).getTime()).toFixed(1)},${y(s.note20).toFixed(1)}`).join(' ');
                const trait = svg('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', class: couleur });
                if (g === MIXTE) trait.setAttribute('stroke-dasharray', '5 4');
                racine.appendChild(trait);
            }
            l.forEach(s => {
                const cx = x(new Date(s.fait_le).getTime()), cy = y(s.note20);
                racine.appendChild(svg('circle', { cx, cy, r: 4, fill: 'currentColor', 'stroke-width': 2, class: couleur + ' mp-anneau' }));
                cibles.push({ s, g, cx, cy });
            });
        });
        // zones de survol plus grandes que les points, au-dessus de tout
        cibles.forEach(({ s, g, cx, cy }) => {
            const zone = svg('circle', { cx, cy, r: 14, fill: 'transparent', tabindex: 0 });
            zone.style.cursor = 'pointer';
            const texte = `${libelleGroupe(g, plusieursAnnees)} · ${virgule(s.note20)}/20 (${s.pourcent} %) · ${dateCourte(s.fait_le)}`;
            zone.setAttribute('aria-label', texte + ' · ' + s.titre);
            const montrer = () => {
                info.replaceChildren(el('p', 'font-semibold text-white', s.titre), el('p', 'text-slate-300 mt-0.5', texte));
                info.classList.remove('hidden');
                const w = info.offsetWidth, h = info.offsetHeight;
                info.style.left = Math.max(0, Math.min(largeur - w, cx - w / 2)) + 'px';
                info.style.top = Math.max(0, cy - h - 12) + 'px';
            };
            const cacher = () => info.classList.add('hidden');
            zone.addEventListener('pointerenter', montrer);
            zone.addEventListener('pointerleave', cacher);
            zone.addEventListener('focus', montrer);
            zone.addEventListener('blur', cacher);
            zone.addEventListener('click', montrer);
            racine.appendChild(zone);
        });
        cadre.replaceChildren(racine, info);
    }

    // ---------- dernières séries ----------
    function carteSeries(series, plusieursAnnees) {
        const c = carte('Dernières séries', 'list-checks');
        if (!series.length) {
            c.appendChild(el('p', 'text-sm text-slate-400', 'Aucune série terminée ici pour l\'instant.'));
            return c;
        }
        const liste = el('ul', 'divide-y divide-slate-800/80');
        series.slice(0, seriesMontrees).forEach(s => {
            const li = el('li', 'flex items-start justify-between gap-3 py-3');
            const gauche = el('div', 'min-w-0');
            gauche.appendChild(el('p', 'text-sm font-semibold text-white break-words', s.titre));
            const g = groupeDeSerie(s);
            const details = [quand(s.fait_le)];
            if (g) details.push(libelleGroupe(g, plusieursAnnees));
            details.push(s.refaire ? 'Refaire mes erreurs' : s.mode === 'ds' ? 'Mode DS' : 'Entraînement');
            details.push(pluriel(s.total, 'question'));
            if (s.duree_s != null) details.push(texteDuree(s.duree_s));
            gauche.appendChild(el('p', 'text-xs text-slate-400 mt-0.5', details.filter(Boolean).join(' · ')));
            const droite = el('div', 'text-right shrink-0');
            droite.append(el('p', 'text-sm font-mono font-bold text-white whitespace-nowrap', `${virgule(s.note20)}/20`),
                el('p', 'text-xs text-slate-400 whitespace-nowrap', `${s.justes}/${s.total} · ${s.pourcent} %`));
            li.append(gauche, droite);
            liste.appendChild(li);
        });
        c.appendChild(liste);
        if (series.length > seriesMontrees) {
            const reste = series.length - seriesMontrees;
            c.appendChild(bouton('px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-sm font-semibold transition-all',
                `Voir plus (${pluriel(reste, 'autre série', 'autres séries')})`, () => { seriesMontrees += 20; rendrePage(); }));
        }
        return c;
    }

    // ---------- carnet d'erreurs ----------
    function questionDuSite(id) {
        try { return typeof window.studicamQuestionParId === 'function' ? window.studicamQuestionParId(id) : null; } catch (e) { return null; }
    }
    const lancerDisponible = () => typeof window.studicamLancerSerie === 'function';
    function refaire(ids, titre) {
        if (!lancerDisponible() || !ids.length) return;
        serieRefaire = String(titre).slice(0, 120);
        try { window.studicamLancerSerie(ids, serieRefaire); } catch (e) { console.warn('Studicam : refaire', e); serieRefaire = null; }
    }

    function carteCarnet(carnet) {
        const c = carte("Carnet d'erreurs", 'notebook-pen');
        const tete = c.firstChild;
        tete.appendChild(el('span', 'ml-auto text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300', String(carnet.length)));
        if (!carnet.length) {
            c.appendChild(el('p', 'text-sm text-slate-400', 'Aucune erreur à refaire ici. Les questions ratées dans une série terminée arrivent dans ce carnet ; réussies plus tard, elles en sortent.'));
            return c;
        }
        c.appendChild(el('p', 'text-xs text-slate-400 leading-relaxed', 'Les questions ratées à ta dernière réponse. Réussie plus tard dans une série, une question sort du carnet.'));
        const lancer = lancerDisponible();
        const existe = (q) => !!questionDuSite(q.id);
        if (lancer) {
            const ids = carnet.filter(existe).map(q => q.id);
            if (ids.length) {
                const b = bouton('w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold inline-flex items-center justify-center gap-2 transition-all', null,
                    () => refaire(ids, 'Refaire mes erreurs'));
                b.append(icone('rotate-ccw'), document.createTextNode(` Refaire toutes mes erreurs (${ids.length})`));
                c.appendChild(b);
            }
        }
        const groupes = grouperCarnet(carnet);
        const liste = el('div', 'space-y-3');
        groupes.forEach((g, i) => {
            const bloc = el('details', 'group rounded-xl border border-slate-800 bg-slate-950/40');
            if (i === 0) bloc.open = true;
            const resume = el('summary', 'cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3');
            resume.append(el('span', 'text-sm font-semibold text-white min-w-0 break-words', g.chapitre),
                el('span', 'shrink-0 text-xs text-slate-400 whitespace-nowrap', pluriel(g.questions.length, 'question')));
            bloc.appendChild(resume);
            const corps = el('div', 'px-4 pb-4 space-y-3');
            const ids = g.questions.filter(existe).map(q => q.id);
            if (lancer && ids.length) {
                const b = bouton('px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold inline-flex items-center gap-2 transition-all', null,
                    () => refaire(ids, 'Refaire : ' + g.chapitre));
                b.append(icone('rotate-ccw', 'w-3.5 h-3.5'), document.createTextNode(' Refaire ces questions'));
                corps.appendChild(b);
            }
            const ul = el('ul', 'space-y-2');
            g.questions.forEach(q => {
                const li = el('li', 'rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2');
                const site = questionDuSite(q.id);
                const enonce = site ? texteBrut(site.q) : '';
                li.appendChild(el('p', 'text-sm text-slate-200 leading-relaxed mp-clamp', enonce || (site || !lancerDisponible() ? 'Question de QCM' : 'Question modifiée ou retirée du site depuis.')));
                li.appendChild(el('p', 'text-xs text-slate-500 mt-1', `Ratée ${q.echecs > 1 ? q.echecs + ' fois' : 'une fois'}` + (q.dernier_echec ? ` · dernière fois ${quand(q.dernier_echec)}` : '')));
                ul.appendChild(li);
            });
            corps.appendChild(ul);
            bloc.appendChild(corps);
            liste.appendChild(bloc);
        });
        c.appendChild(liste);
        return c;
    }

    // ---------- résumé en tête d'une matière et de la Révision DS ----------
    function texteResume(r) {
        const morceaux = [];
        if (r.derniere) morceaux.push({ fort: `${virgule(r.derniere.note20)}/20`, texte: 'dernière note, ' + quand(r.derniere.fait_le) });
        if (r.tendance) {
            const signe = r.tendance.ecart > 0 ? '+' : '';
            morceaux.push({ fort: r.tendance.sens === 'hausse' ? 'En hausse' : r.tendance.sens === 'baisse' ? 'En baisse' : 'Stable',
                texte: `${signe}${virgule(r.tendance.ecart)} pt par rapport aux séries d'avant`, sens: r.tendance.sens });
        }
        morceaux.push({ fort: String(r.erreurs), texte: r.erreurs > 1 ? 'erreurs à refaire' : 'erreur à refaire' });
        return morceaux;
    }

    function remplirResume(boite, r, groupe) {
        boite.replaceChildren();
        if (!r || (!r.series && !r.erreurs)) { boite.classList.add('hidden'); return; }
        boite.classList.remove('hidden');
        const ligne = el('div', 'flex flex-wrap items-center gap-x-5 gap-y-2');
        texteResume(r).forEach(m => {
            const p = el('p', 'text-xs text-slate-400 inline-flex items-center gap-1.5');
            if (m.sens) p.appendChild(icone(m.sens === 'hausse' ? 'trending-up' : m.sens === 'baisse' ? 'trending-down' : 'minus',
                'w-3.5 h-3.5 ' + (m.sens === 'hausse' ? 'text-emerald-400' : m.sens === 'baisse' ? 'text-red-400' : 'text-slate-400')));
            p.append(el('span', 'text-sm font-bold text-white', m.fort), document.createTextNode(m.texte));
            ligne.appendChild(p);
        });
        const lien = bouton('ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-white', null, () => ouvrirPage(groupe));
        lien.append(document.createTextNode('Ma progression'), icone('chevron-right', 'w-3.5 h-3.5'));
        ligne.appendChild(lien);
        boite.appendChild(ligne);
        rafraichir(null);
    }

    function boiteResume(parent, apres, attribut) {
        let b = parent.querySelector(`[${attribut}]`);
        if (b) return b;
        b = el('div', 'hidden w-full rounded-xl border border-darkborder bg-darkcard px-4 py-3');
        b.setAttribute(attribut, '1');
        b.setAttribute('aria-label', 'Résumé de ma progression');
        if (apres) apres.after(b); else parent.prepend(b);
        return b;
    }

    function majResumes() {
        if (!donnees) return;
        // matière ouverte (liste des chapitres)
        const chap = $('etape-chapitres-liste');
        if (chap && !chap.classList.contains('hidden') && typeof matiereSelectionnee !== 'undefined' && matiereSelectionnee) {
            const a = CODES_ANNEE[typeof anneeSelectionnee !== 'undefined' ? anneeSelectionnee : ''];
            const m = String(matiereSelectionnee.id || '').toLowerCase();
            const boite = boiteResume(chap, chap.firstElementChild, 'data-mp-resume');
            if (a && m) {
                remplirResume(boite, resume(donnees, s => s.annee === a && s.matiere === m, q => q.annee === a && q.matiere === m), a + '/' + m);
            }
        }
        // Révision DS : toutes ses séries (CE, OI et l'examen mélangé) et ses erreurs
        const ds = $('etape-revision-ds');
        const repere = $('ds-progression');
        if (ds && repere && !ds.classList.contains('hidden')) {
            const boite = boiteResume(repere.parentElement, repere, 'data-mp-resume-ds');
            remplirResume(boite, resume(donnees, s => String(s.cle).startsWith(PREFIXE_DS), q => String(q.id).startsWith('rds/'), true), null);
        }
    }

    function majTout() {
        try {
            majResumes();
            if (pageVisible()) rendrePage();
        } catch (e) { console.warn('Studicam : ma progression', e); }
    }

    // ---------- branchements ----------
    function envelopper(nom, apres) {
        const original = window[nom];
        if (typeof original !== 'function') return false;
        window[nom] = function (...args) {
            const r = original.apply(this, args);
            try { apres(); } catch (e) { console.warn('Studicam : ma progression', nom, e); }
            return r;
        };
        return true;
    }
    // Toute navigation du site passe par cacherToutesLesEtapes : on y masque aussi la page.
    if (!envelopper('cacherToutesLesEtapes', () => { const e = $('etape-ma-progression'); if (e) e.classList.add('hidden'); })) {
        console.warn('Studicam : fonction absente', 'cacherToutesLesEtapes');
    }
    envelopper('ouvrirMatiere', majResumes);
    document.addEventListener('studicam:ecran', majResumes);

    // Bouton « Ma progression » de l'en-tête, à gauche du bouton jour/nuit (icône seule sur téléphone).
    function creerBoutonEntete() {
        if (document.querySelector('[data-mp-bouton]')) return;
        const theme = $('bouton-theme');
        if (!theme || !theme.parentElement) { console.warn('Studicam : bouton Ma progression non ajouté'); return; }
        const b = bouton('h-9 shrink-0 inline-flex items-center gap-2 px-2.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-blue-300 text-xs font-semibold transition-all', null, () => ouvrirPage());
        b.dataset.mpBouton = '1';
        b.title = 'Ma progression : mes notes et mon carnet d\'erreurs';
        b.setAttribute('aria-label', 'Ma progression');
        b.append(icone('trending-up'), el('span', 'hidden sm:inline', 'Ma progression'));
        theme.before(b);
        rafraichir(null);
    }

    function recevoirMoi(moi) {
        if (!moi || connecte) return;
        connecte = true;
        creerBoutonEntete();
        charger();
    }

    function declarerRoute() {
        const routes = window.studicamRoutes;
        if (!routes || typeof routes.ajouter !== 'function' || declarerRoute.fait) return;
        declarerRoute.fait = true;
        routes.ajouter('#/progression', () => afficherPage(), 'Ma progression');
    }

    function demarrer() {
        // ouvrirRevisionDS vient de revision-ds.js, chargé avant ce fichier
        envelopper('ouvrirRevisionDS', majResumes);
        declarerRoute();
        if (typeof window.studicamMoi === 'function') recevoirMoi(window.studicamMoi());
    }
    document.addEventListener('studicam:moi', (e) => recevoirMoi(e.detail));
    // navigation.js peut être chargé après ce fichier : la route est déclarée au plus tard au
    // DOMContentLoaded (tous les scripts defer ont alors tourné).
    demarrer();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', declarerRoute, { once: true });

    window.studicamMaProgression = { tendance, resume, grouperCarnet, corpsSerie, groupeDeSerie };
})();
