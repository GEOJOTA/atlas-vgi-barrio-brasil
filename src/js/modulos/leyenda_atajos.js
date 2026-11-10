/*
  leyenda_atajos.js
  -----------------
  Módulo de Navegación Lateral y Leyenda de Apartados (Atajos) del Atlas VGI.
  Diseño sobrio, tipográfico, minimalista y sin iconos.
  Permite al usuario identificar rápidamente los apartados y herramientas disponibles
  más abajo en cada módulo y navegar con desplazamiento suave en un solo clic.

  Adaptado dinámicamente a todos los dispositivos (escritorio, tablets y móviles)
  sin interferir con el visor Leaflet ni los controles interactivos.
  Se despliega automáticamente al abrir la página y cuenta con un botón de cierre claro (✕).
*/

const ModuloAtajosLeyenda = (() => {
  'use strict';

  // Configuración de apartados por módulo alineada con las 5 tareas de navegación
  const CONFIG_MODULOS = {
    'indicadores': {
      id: 'indicadores',
      nombre: 'Análisis territorial',
      badge: 'Análisis',
      apartados: [
        { id: 'seccion-storyboards', titulo: 'Narrativas espaciales (4 láminas)', abajo: false },
        { id: 'sec-ind-dimensiones', titulo: 'Dimensiones Analíticas', abajo: true }
      ]
    },
    'inicio': {
      id: 'inicio',
      nombre: 'Visor cartográfico',
      badge: 'Explorar mapa',
      apartados: [
        { id: 'mapa-atlas', titulo: 'Explorar mapa', abajo: false },
        { id: 'sidebar-detalle-bidat', titulo: 'Explorar capas', abajo: true }
      ]
    },
    'manual': {
      id: 'manual',
      nombre: 'Documentación',
      badge: 'Módulo 03',
      apartados: [
        { id: 'sec-manual-cabecera', titulo: 'Documentación del Atlas', abajo: false },
        { id: 'lista-capitulos-manual', titulo: 'Capítulos del manual de uso', abajo: true },
        { id: 'sec-lic-descargas-maestras', titulo: 'Licencias y descargas (294 capas)', abajo: true }
      ]
    },
    'diccionario': {
      id: 'manual',
      nombre: 'Documentación',
      badge: 'Módulo 03',
      apartados: [
        { id: 'sec-manual-cabecera', titulo: 'Documentación del Atlas', abajo: false },
        { id: 'lista-capitulos-manual', titulo: 'Capítulos del manual de uso', abajo: true },
        { id: 'sec-lic-descargas-maestras', titulo: 'Licencias y descargas (294 capas)', abajo: true }
      ]
    },
    'licencias': {
      id: 'manual',
      nombre: 'Documentación',
      badge: 'Módulo 03',
      apartados: [
        { id: 'sec-manual-cabecera', titulo: 'Documentación del Atlas', abajo: false },
        { id: 'lista-capitulos-manual', titulo: 'Capítulos del manual de uso', abajo: true },
        { id: 'sec-lic-descargas-maestras', titulo: 'Licencias y descargas (294 capas)', abajo: true }
      ]
    }
  };

  let moduloActivo = 'indicadores';
  let colapsado = false;
  let observerScrollspy = null;
  let timerThrottle = null;

  function normalizarIdModulo(id) {
    if (!id) return 'indicadores';
    const limpio = String(id).replace(/^panel-/, '').trim().toLowerCase();
    if (CONFIG_MODULOS[limpio]) return limpio;
    if (limpio === 'analisis' || limpio === 'relatos') return 'indicadores';
    if (limpio === 'visor' || limpio === 'explorar' || limpio === 'mapa') return 'inicio';
    if (limpio === 'documentacion' || limpio === 'doc') return 'manual';
    return 'indicadores';
  }

  function asegurarContenedorDOM() {
    let contenedor = document.getElementById('leyenda-atajos-modulo');
    if (contenedor) return contenedor;

    contenedor = document.createElement('aside');
    contenedor.id = 'leyenda-atajos-modulo';
    contenedor.className = 'leyenda-atajos-flotante';
    contenedor.setAttribute('aria-label', 'Apartados y atajos del módulo');

    contenedor.innerHTML = `
      <button type="button" 
              id="btn-toggle-leyenda-atajos" 
              class="btn-toggle-leyenda-atajos" 
              title="Abrir apartados del módulo"
              aria-expanded="true">
        <span class="texto-toggle-leyenda">Apartados</span>
        <span class="flecha-toggle-leyenda">›</span>
      </button>

      <div class="caja-leyenda-atajos" id="caja-leyenda-atajos">
        <div class="cabecera-leyenda-atajos">
          <div class="meta-leyenda-modulo">
            <span class="badge-modulo-leyenda" id="leyenda-badge-modulo">Módulo</span>
            <h4 class="titulo-modulo-leyenda" id="leyenda-titulo-modulo">Apartados</h4>
          </div>
          <div class="controles-cabecera-leyenda">
            <button type="button" 
                    id="btn-minimizar-leyenda-atajos" 
                    class="btn-min-leyenda" 
                    title="Minimizar panel de apartados"
                    aria-label="Minimizar panel de apartados">
              ─
            </button>
            <button type="button" 
                    id="btn-cerrar-leyenda-atajos" 
                    class="btn-cerrar-leyenda-atajos" 
                    title="Cerrar panel de apartados (Esc)"
                    aria-label="Cerrar panel de apartados">
              ✕
            </button>
          </div>
        </div>

        <nav class="lista-atajos-modulo" id="lista-atajos-modulo" aria-label="Navegación interna del módulo">
          <!-- Renderizado dinámico de apartados -->
        </nav>

        <div class="pie-leyenda-atajos">
          <span class="contador-apartados-leyenda" id="contador-apartados-leyenda">0 apartados</span>
          <button type="button" 
                  class="btn-volver-arriba-modulo" 
                  id="btn-volver-arriba-modulo" 
                  title="Subir al inicio del módulo">
            ↑ Inicio
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(contenedor);

    const btnToggle = document.getElementById('btn-toggle-leyenda-atajos');
    const btnMinimizar = document.getElementById('btn-minimizar-leyenda-atajos');
    const btnCerrar = document.getElementById('btn-cerrar-leyenda-atajos');
    const btnArriba = document.getElementById('btn-volver-arriba-modulo');

    if (btnToggle) {
      btnToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setColapsado(false);
      });
    }

    if (btnMinimizar) {
      btnMinimizar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setColapsado(true);
      });
    }

    if (btnCerrar) {
      btnCerrar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setColapsado(true);
      });
    }

    if (btnArriba) {
      btnArriba.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // En todos los dispositivos, si se hace clic fuera del widget se colapsa automáticamente
    // para no tapar los formularios, tablas o mapas del módulo específico.
    document.addEventListener('click', (e) => {
      if (!colapsado && contenedor && !contenedor.contains(e.target)) {
        setColapsado(true);
      }
    });

    // Permitir colapsar con la tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !colapsado) {
        setColapsado(true);
      }
    });

    // Auto-colapso al redimensionar solo en pantallas móviles
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768 && !colapsado) {
        setColapsado(true);
      }
    });

    return contenedor;
  }

  function setColapsado(nuevoEstado) {
    colapsado = Boolean(nuevoEstado);
    const cont = document.getElementById('leyenda-atajos-modulo');
    const btnToggle = document.getElementById('btn-toggle-leyenda-atajos');
    if (!cont) return;

    if (colapsado) {
      cont.classList.add('colapsada');
      if (btnToggle) {
        btnToggle.setAttribute('aria-expanded', 'false');
      }
    } else {
      cont.classList.remove('colapsada');
      if (btnToggle) {
        btnToggle.setAttribute('aria-expanded', 'true');
      }
    }

    try {
      localStorage.setItem('atlas_leyenda_atajos_colapsada', colapsado ? '1' : '0');
    } catch (_) {}
  }

  let bloqueoScrollPorClick = false;
  let timerDesbloqueoScroll = null;

  function toggleColapso() {
    setColapsado(!colapsado);
  }

  function desplazarseAApartado(idElemento) {
    if (!idElemento) return;

    // 1. ILUMINAR INMEDIATAMENTE EL APARTADO SELECCIONADO POR EL USUARIO
    marcarApartadoActivo(idElemento);

    // 2. BLOQUEAR SOBREESCRITURAS DE SCROLLSPY MIENTRAS SE COMPLETA EL DESPLAZAMIENTO SUAVE
    bloqueoScrollPorClick = true;
    if (timerDesbloqueoScroll) clearTimeout(timerDesbloqueoScroll);
    timerDesbloqueoScroll = setTimeout(() => {
      bloqueoScrollPorClick = false;
    }, 1400);

    // Si el destino es el inventario del manual, asegurar que dicho capítulo esté abierto
    if (idElemento === 'cap-uso-04' && window.ModuloManual && typeof window.ModuloManual.irACapitulo === 'function') {
      window.ModuloManual.irACapitulo('cap-uso-04');
    }

    let destino = document.getElementById(idElemento);

    // Fallback especial para manual si el capítulo aún no se ha renderizado
    if (!destino && idElemento === 'cap-uso-04') {
      destino = document.getElementById('tbody-catalogo-manual') || document.getElementById('contenido-manual');
    }

    if (!destino) {
      console.warn(`[ModuloAtajosLeyenda] Elemento no encontrado: #${idElemento}`);
      return;
    }

    // Solo en dispositivos móviles pequeños (<= 768px) colapsar al seleccionar apartado.
    // En escritorio/laptop no forzar colapso (haciendo un poco de scroll el apartado no obstruye)
    if (window.innerWidth <= 768) {
      setColapsado(true);
    }

    // Desplazamiento suave con compensación de cabecera sticky
    const offsetCabecera = 120;
    const posRect = destino.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const destinoTop = Math.max(0, posRect.top + scrollTop - offsetCabecera);

    window.scrollTo({
      top: destinoTop,
      behavior: 'smooth'
    });

    // Halo luminoso momentáneo
    destino.classList.remove('seccion-resaltada-atajo');
    void destino.offsetWidth;
    destino.classList.add('seccion-resaltada-atajo');

    setTimeout(() => {
      destino.classList.remove('seccion-resaltada-atajo');
    }, 2200);
  }

  function renderizarAtajosModulo(modId) {
    const cont = asegurarContenedorDOM();
    const modKey = normalizarIdModulo(modId);
    moduloActivo = modKey;

    const info = CONFIG_MODULOS[modKey] || CONFIG_MODULOS['inicio'];
    const elBadge = document.getElementById('leyenda-badge-modulo');
    const elTitulo = document.getElementById('leyenda-titulo-modulo');
    const lista = document.getElementById('lista-atajos-modulo');
    const elContador = document.getElementById('contador-apartados-leyenda');
    const btnToggle = document.getElementById('btn-toggle-leyenda-atajos');

    if (elBadge) elBadge.textContent = info.badge || 'Módulo';
    if (elTitulo) elTitulo.textContent = info.nombre || 'Apartados';
    if (btnToggle) {
      const txt = btnToggle.querySelector('.texto-toggle-leyenda');
      if (txt) txt.textContent = `Apartados (${info.apartados.length})`;
    }

    if (!lista) return;

    let itemsHtml = '';
    info.apartados.forEach((ap, index) => {
      const numStr = String(index + 1).padStart(2, '0');
      const tagAbajo = ap.abajo 
        ? `<span class="tag-abajo-simple" title="Disponible más abajo en la página">↓</span>` 
        : '';

      itemsHtml += `
        <button type="button" 
                class="item-atajo-modulo" 
                data-target-id="${ap.id}" 
                id="btn-atajo-${ap.id}"
                title="Ir a: ${ap.titulo}">
          <span class="num-apartado">${numStr}</span>
          <span class="titulo-apartado">${ap.titulo}</span>
          ${tagAbajo}
        </button>
      `;
    });

    lista.innerHTML = itemsHtml;

    if (elContador) {
      const totalAbajo = info.apartados.filter(a => a.abajo).length;
      elContador.textContent = `${info.apartados.length} apartados (${totalAbajo} abajo)`;
    }

    lista.querySelectorAll('.item-atajo-modulo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        desplazarseAApartado(btn.dataset.targetId);
      });
    });

    configurarScrollspy();
  }

  function configurarScrollspy() {
    if (observerScrollspy) {
      try { observerScrollspy.disconnect(); } catch (_) {}
      observerScrollspy = null;
    }
    window.removeEventListener('scroll', handlerScrollFallback);
    window.addEventListener('scroll', handlerScrollFallback, { passive: true });
    // Evaluar estado inicial sin bloquear
    determinarApartadoActivo();
  }

  function marcarApartadoActivo(idElemento) {
    if (!idElemento) return;
    const lista = document.getElementById('lista-atajos-modulo');
    if (!lista) return;

    lista.querySelectorAll('.item-atajo-modulo').forEach(btn => {
      const coincide = btn.dataset.targetId === idElemento;
      btn.classList.toggle('activo', coincide);
      btn.setAttribute('aria-current', coincide ? 'true' : 'false');
    });
  }

  function determinarApartadoActivo() {
    if (bloqueoScrollPorClick) return;
    const info = CONFIG_MODULOS[moduloActivo] || CONFIG_MODULOS['inicio'];
    if (!info || !info.apartados || info.apartados.length === 0) return;

    const offsetCabecera = 140;
    let mejorApartado = null;
    let menorDistancia = Infinity;

    // Evaluar elementos visibles según su posición real en la ventana (getBoundingClientRect)
    for (let i = 0; i < info.apartados.length; i++) {
      const ap = info.apartados[i];
      let el = document.getElementById(ap.id);
      if (!el && ap.id === 'cap-uso-04') {
        el = document.getElementById('tbody-catalogo-manual') || document.getElementById('contenido-manual');
      }
      if (el) {
        const rect = el.getBoundingClientRect();
        // El elemento ocupa el área de lectura si su fondo supera la cabecera
        if (rect.bottom > offsetCabecera) {
          const dist = Math.abs(rect.top - offsetCabecera);
          if (rect.top <= offsetCabecera + 60 && dist < menorDistancia) {
            menorDistancia = dist;
            mejorApartado = ap.id;
          }
        }
      }
    }

    if (!mejorApartado) {
      for (let i = 0; i < info.apartados.length; i++) {
        const ap = info.apartados[i];
        let el = document.getElementById(ap.id);
        if (!el && ap.id === 'cap-uso-04') {
          el = document.getElementById('tbody-catalogo-manual');
        }
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= offsetCabecera + 100 && rect.bottom >= offsetCabecera) {
            mejorApartado = ap.id;
            break;
          }
        }
      }
    }

    if (mejorApartado) {
      marcarApartadoActivo(mejorApartado);
    }
  }

  function handlerScrollFallback() {
    if (timerThrottle || bloqueoScrollPorClick) return;
    timerThrottle = setTimeout(() => {
      timerThrottle = null;
      determinarApartadoActivo();
    }, 100);
  }

  function inicializar() {
    asegurarContenedorDOM();

    // Adaptación dinámica por dispositivo y resolución:
    // En móviles y tablets (< 1024px) inicia colapsado para nunca tapar los módulos específicos.
    // En pantallas de escritorio y laptops (>= 1024px), respeta preferencia guardada o inicia visible.
    const pantallaPequena = window.innerWidth < 1024;
    const prefGuardada = localStorage.getItem('atlas_leyenda_atajos_colapsada');

    if (pantallaPequena) {
      setColapsado(true);
    } else if (prefGuardada !== null) {
      setColapsado(prefGuardada === '1');
    } else {
      setColapsado(false);
    }

    const panelActivoEl = document.querySelector('.panel.activo');
    const panelIdInicial = panelActivoEl ? panelActivoEl.id.replace('panel-', '') : 'inicio';
    renderizarAtajosModulo(panelIdInicial);
  }

  function actualizar(panelId) {
    const modKey = normalizarIdModulo(panelId);
    // Mantener la coherencia del estado visual (no forzar colapso ni movimientos bruscos al cambiar de pestaña)
    renderizarAtajosModulo(modKey);
  }

  return {
    inicializar,
    actualizar,
    desplazarseAApartado,
    setColapsado,
    toggleColapso,
    CONFIG_MODULOS
  };
})();

if (typeof window !== 'undefined') {
  window.ModuloAtajosLeyenda = ModuloAtajosLeyenda;
}
