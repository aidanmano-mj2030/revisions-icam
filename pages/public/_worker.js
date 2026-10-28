// Porte d'entrée de studicam.pages.dev : chaque requête est transmise telle quelle
// au Worker « studicam », qui porte tout le site (pages, connexion, progression).
export default {
  fetch(request, env) {
    return env.SITE.fetch(request);
  },
};
