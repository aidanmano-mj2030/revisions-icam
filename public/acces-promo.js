/*
 * Studicam : accès selon la promo.
 * Les élèves des promos de PROMOS_A1 (adresse prenom.nom@<promo>.icam.fr) n'ont accès qu'à la
 * 1ère année : la carte « 2ème Année » est verrouillée, et toute leçon, tout exercice ou toute
 * Révision DS de 2ème année les ramène à l'accueil avec un message. Les Révisions DS de 1ère année restent ouvertes. Les comptes qui ont un rôle
 * (prof, équipe) voient tout.
 * L'adresse est lue dans /api/moi (événement « studicam:moi » de progression.js). C'est un
 * verrou d'affichage : le contenu reste dans la page, il ne protège pas un élève qui fouille le code.
 * À chaque rentrée, mettre ici la promo qui entre en 1ère année.
 */
(function () {
    'use strict';
    const PROMOS_A1 = ['2031'];
    const MESSAGE = "La 2ème année n'est pas ouverte à ta promo : tu as accès aux cours de 1ère année.";
    let bloque = false;

    const promoA1 = (moi) => !!moi && !moi.role && typeof moi.email === 'string'
        && PROMOS_A1.some(p => moi.email.toLowerCase().endsWith('@' + p + '.icam.fr'));
    const estA2 = (o) => !!o && typeof o.badge === 'string' && o.badge.includes('2ème Année');
    const lecon = (id) => { try { return LECONS[id]; } catch (e) { return null; } };
    const exo = (id) => { try { return EXOS[id]; } catch (e) { return null; } };
    function refuser() {
        if (typeof afficherToast === 'function') afficherToast(MESSAGE);
        if (typeof retourAnnee === 'function') retourAnnee();
    }

    // une fonction du site remplacée par une version qui vérifie l'accès d'abord
    function garder(nom, interdit) {
        const avant = window[nom];
        if (typeof avant !== 'function') return;
        window[nom] = function (...args) {
            if (bloque && interdit(...args)) return refuser();
            return avant.apply(this, args);
        };
    }

    function installer() {
        garder('choisirAnnee', (annee) => annee === '2ème Année');
        garder('ouvrirLecon', (id) => estA2(lecon(id)));
        garder('allerLecon', (id) => estA2(lecon(id)));
        garder('ouvrirExercice', (id) => estA2(exo(id)));
        garder('ouvrirChapitreInteractif', () => true);            // CM 2ème année : produit scalaire et vectoriel
        garder('ouvrirRevisionDS', (onglet, chap, id) => { const rd = window.StudicamRevisionDS; return (rd && rd.anneeDe(id)) !== 'a1'; });   // seules les Révisions DS de 1ère année restent ouvertes
    }

    // carte « 2ème Année » de l'accueil : grisée, avec un cadenas
    function verrouillerCarte() {
        const carte = document.querySelector('button[onclick="choisirAnnee(\'2ème Année\')"]');
        if (!carte || carte.dataset.verrou) return;
        carte.dataset.verrou = '1';
        carte.classList.add('opacity-50');
        carte.setAttribute('aria-disabled', 'true');
        carte.title = MESSAGE;
        const note = document.createElement('p');
        note.className = 'mt-2 text-xs font-semibold text-amber-300 flex items-center gap-1.5';
        note.innerHTML = '<i data-lucide="lock" class="w-3.5 h-3.5"></i> Réservée à la promo de 2ème année';
        carte.appendChild(note);
        if (window.lucide) try { window.lucide.createIcons(); } catch (e) { }
    }

    function recevoir(moi) {
        bloque = promoA1(moi);
        if (!bloque) return;
        verrouillerCarte();
        // déjà sur un écran de 2ème année (adresse ouverte avant la réponse de /api/moi) : retour à l'accueil
        let annee = '';
        try { annee = anneeSelectionnee; } catch (e) { }
        if (annee === '2ème Année' || /^#\/a2(\/|$)/.test(location.hash)) refuser();
    }

    installer();
    document.addEventListener('studicam:moi', (e) => recevoir(e.detail));
    if (typeof window.studicamMoi === 'function' && window.studicamMoi()) recevoir(window.studicamMoi());
})();
