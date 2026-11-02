/**
 * src/js/modulos/manifold_canvas.js
 * ----------------------------------
 * Módulo de fondo desactivado conforme al estándar visual institucional sobrio.
 * Preserva la interfaz pública `window.ManifoldCanvas` para compatibilidad interna,
 * eliminando el renderizado de partículas animadas y efectos luminosos distractores.
 */

window.ManifoldCanvas = (function () {
  function init() {
    const existing = document.getElementById("manifold-bg-canvas");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  function destroy() {
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init: init,
    destroy: destroy,
    isEnabled: false
  };
})();
