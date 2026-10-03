/* Pont avec la salle de jeux (dchirez.fr/games/).
   Chaque jeu le charge par <script src="/games/pont-hub.js"> et doit tourner
   sans lui (page ouverte en file://, réseau coupé) : on teste window.HubJeux.
   Toutes les pages de dchirez.fr partagent le même localStorage : le jeu y lit
   le profil et les réglages de la salle, et y consigne ses parties. Aucun serveur. */
window.HubJeux = (function () {
  "use strict";
  var P = "dchirez-hub:";
  function lire(k, d) { try { var v = localStorage.getItem(P + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function ecrire(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { /* navigation privée, quota */ } }
  function deux(n) { return (n < 10 ? "0" : "") + n; }
  function fiche(j, jeu) { return j[jeu] || (j[jeu] = { parties: 0, victoires: 0, defaites: 0, nulles: 0, records: {}, faits: {} }); }
  return {
    profil: function () { return lire("profil", null); },
    reglages: function () { return lire("reglages", {}); },
    /* Le jeu vient d'être ouvert (alimente « Continuer » et « Touche-à-tout »). */
    ouvert: function (jeu) { var v = lire("visites", {}); v[jeu] = Date.now(); ecrire("visites", v); },
    /* Fin de partie. r = { issue: "victoire"|"defaite"|"nulle"|"fin", detail: "texte court",
       records: { cle: [valeur, "min"|"max"] }, faits: ["cle", ...] } */
    partie: function (jeu, r) {
      r = r || {};
      var j = lire("journal", {}), s = fiche(j, jeu), k;
      s.parties++;
      if (r.issue === "victoire") s.victoires++;
      else if (r.issue === "defaite") s.defaites++;
      else if (r.issue === "nulle") s.nulles++;
      for (k in r.records || {}) {
        var v = r.records[k][0], a = s.records[k];
        if (a == null || (r.records[k][1] === "min" ? v < a : v > a)) s.records[k] = v;
      }
      (r.faits || []).forEach(function (f) { s.faits[f] = (s.faits[f] || 0) + 1; });
      s.dernier = Date.now();
      ecrire("journal", j);
      var h = lire("historique", []);
      h.unshift({ jeu: jeu, issue: r.issue || "fin", detail: r.detail || "", t: s.dernier });
      ecrire("historique", h.slice(0, 40));
    },
    /* Un exploit sans fin de partie (ex. 1000 générations au Jeu de la Vie). */
    fait: function (jeu, f, record) {
      var j = lire("journal", {}), s = fiche(j, jeu);
      if (f) s.faits[f] = (s.faits[f] || 0) + 1;
      if (record) { var a = s.records[record[0]]; if (a == null || record[1] > a) s.records[record[0]] = record[1]; }
      ecrire("journal", j);
    },
    /* Partie interrompue à reprendre depuis le hub ; null quand elle est finie. */
    enCours: function (jeu, info) {
      var e = lire("encours", {});
      if (info) { info.t = Date.now(); e[jeu] = info; } else delete e[jeu];
      ecrire("encours", e);
    },
    /* Défi du jour : même grille pour tout le monde, tirée de la date. */
    aujourdhui: function () { var d = new Date(); return d.getFullYear() + "-" + deux(d.getMonth() + 1) + "-" + deux(d.getDate()); },
    defi: function (jeu, res) { var d = lire("defis", {}), j = this.aujourdhui(); (d[j] || (d[j] = {}))[jeu] = res; ecrire("defis", d); },
    resultatDefi: function (jeu) { var d = lire("defis", {})[this.aujourdhui()]; return d ? d[jeu] || null : null; },
    /* Générateur pseudo-aléatoire déterministe (mulberry32) initialisé par une chaîne. */
    alea: function (graine) {
      var h = 1779033703 ^ graine.length;
      for (var i = 0; i < graine.length; i++) { h = Math.imul(h ^ graine.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
      return function () {
        h = (h + 0x6D2B79F5) | 0;
        var t = Math.imul(h ^ (h >>> 15), 1 | h);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    /* Thème de la salle : "light" ou "dark". Réglé sur « Système » (ou jamais
       réglé), il suit le système, comme la salle elle-même. */
    theme: function () {
      var t = lire("reglages", {}).theme;
      if (t === "light" || t === "dark") return t;
      return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    },
    sonCoupe: function () { return lire("reglages", {}).son === false; }
  };
})();
/* Le jeu est déduit du chemin (dchirez.fr/<jeu>/) : toute page qui charge ce
   fichier compte comme une visite, sans que le jeu ait rien à appeler. */
(function () {
  var jeu = location.pathname.split("/")[1];
  if (jeu && jeu !== "games") HubJeux.ouvert(jeu);
  // Les jeux solo ont un service worker : ouverts directement, ils se mettent eux aussi en cache.
  var HORS_LIGNE = ["sudoku", "queens", "bomberman", "jeu-de-la-vie", "chess"];
  if (HORS_LIGNE.indexOf(jeu) >= 0 && "serviceWorker" in navigator)
    navigator.serviceWorker.register("/" + jeu + "/sw.js", { scope: "/" + jeu + "/" }).catch(function () {});
})();
