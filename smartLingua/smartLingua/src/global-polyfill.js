/**
 * Polyfill pour les libs (ex. sockjs-client) qui utilisent "global" (Node) dans le navigateur.
 * Doit être chargé avant tout autre script.
 */
(function () {
  if (typeof global === 'undefined') {
    window.global = window;
  }
  if (typeof globalThis === 'undefined') {
    window.globalThis = window;
  }
})();
