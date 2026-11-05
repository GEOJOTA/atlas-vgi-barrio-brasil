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

  // Configuración de apartados por módulo (sin iconos, títulos claros)
  const CONFIG_MODULOS = {
    'inicio': {
      id: 'inicio',
      nombre: 'Visor cartográfico',
      badge: 'Módulo 01',
      apartados: [
        { id: 'sec-inicio-hero', titulo: 'Propósito y resumen', abajo: false },
        { id: 'mapa-atlas', titulo: 'Visor cartográfico', abajo: false },
        { id: 'sec-inicio-inspector', titulo: 'Inspector de atributos y calidad', abajo: false },
        { id: 'consola-capas-gis', titulo: 'Catálogo de 123 capas oficiales', abajo: true },
        { id: 'seccion-importador-capas', titulo: 'Importador de capas locales', abajo: true },
        { id: 'sec-inicio-territorio', titulo: 'Ficha territorial de estudio', abajo: true }
      ]
    },
    'explorador-osm': {
      id: 'explorador-osm',
      nombre: 'Consultas en OpenStreetMap',
      badge: 'Módulo 02',
      apartados: [
        { id: 'sec-osm-cabecera', titulo: 'Guía y alcance técnico', abajo: false },
        { id: 'sec-osm-temas-rapidos', titulo: 'Consultas rápidas por tema', abajo: false },
        { id: 'sec-osm-constructor-overpass', titulo: 'Constructor Overpass API en vivo', abajo: true },
        { id: 'sec-osm-geodatabase-rm', titulo: 'Geodatabase regional RM', abajo: true },
        { id: 'resultado-osm', titulo: 'Resultados y descargas', abajo: true }
      ]
    },
    'biodiversidad-gbif': {
      id: 'biodiversidad-gbif',
      nombre: 'Biodiversidad urbana (GBIF)',
      badge: 'Módulo 03',
      apartados: [
        { id: 'sec-gbif-cabecera', titulo: 'Marco de ciencia ciudadana', abajo: false },
        { id: 'sec-gbif-busqueda', titulo: 'Búsqueda taxonómica inteligente', abajo: false },
        { id: 'sec-gbif-ambito', titulo: 'Ámbito espacial de consulta', abajo: true },
        { id: 'sec-gbif-guia', titulo: 'Metodología Darwin Core', abajo: true },
        { id: 'resultado-gbif', titulo: 'Registros biológicos y descargas', abajo: true }
      ]
    },
    'proyectos-umap': {
      id: 'proyectos-umap',
      nombre: 'Mapas comunitarios (uMap)',
      badge: 'Módulo 04',
      apartados: [
        { id: 'sec-umap-cabecera', titulo: 'Cartografía social y participativa', abajo: false },
        { id: 'sec-umap-selector', titulo: 'Catálogo de mapas colaborativos', abajo: false },
        { id: 'sec-umap-guia', titulo: 'Guía de mapeo ciudadano', abajo: true },
        { id: 'resultado-umap', titulo: 'Visor embebido interactivo', abajo: true }
      ]
    },
    'indicadores': {
      id: 'indicadores',
      nombre: 'Indicadores y relatos',
      badge: 'Módulo 05',
      apartados: [
        { id: 'sec-ind-cabecera', titulo: 'Marco analítico multidimensional', abajo: false },
        { id: 'sec-ind-dimensiones', titulo: '5 dimensiones territoriales', abajo: false },
        { id: 'contenedor-acordeon-capas', titulo: 'Métricas e indicadores por dimensión', abajo: true },
        { id: 'seccion-storyboards', titulo: '8 relatos cartográficos (83 mapas)', abajo: true }
      ]
    },
    'calidad-ohsome': {
      id: 'calidad-ohsome',
      nombre: 'Evaluación de calidad (ISO 19157)',
      badge: 'Módulo 06',
      apartados: [
        { id: 'sec-calidad-cabecera', titulo: 'Marco de calidad cartográfica', abajo: false },
        { id: 'sec-calidad-evaluador', titulo: 'Evaluador de capas (IGV)', abajo: false },
        { id: 'sec-calidad-ohsome', titulo: 'Evolución histórica (ohsome API)', abajo: true },
        { id: 'sec-calidad-osmcha', titulo: 'Auditoría de cambios (OSMCha)', abajo: true }
      ]
    },
    'manual': {
      id: 'manual',
      nombre: 'Manual metodológico',
      badge: 'Módulo 07',
      apartados: [
        { id: 'sec-manual-cabecera', titulo: 'Introducción y arquitectura', abajo: false },
        { id: 'buscador-general-manual', titulo: 'Buscador de capítulos', abajo: false },
        { id: 'lista-capitulos-manual', titulo: 'Capítulos del manual de uso', abajo: true },
        { id: 'cap-uso-04', titulo: 'Inventario de 133 capas', abajo: true }
      ]
    },
    'metadatos-iso': {
      id: 'metadatos-iso',
      nombre: 'Catálogo y metadatos (ISO 19115)',
      badge: 'Módulo 08',
      apartados: [
        { id: 'sec-meta-cabecera', titulo: 'Marco de metadatos espaciales', abajo: false },
        { id: 'sec-meta-calidad-general', titulo: 'Calidad general (133 capas)', abajo: false },
        { id: 'form-metadatos', titulo: 'Formulario de perfil de metadatos', abajo: true },
        { id: 'sec-meta-estandar', titulo: 'Especificaciones IDE Chile', abajo: true },
        { id: 'resultado-metadatos', titulo: 'Generador y exportador XML/JSON', abajo: true }
      ]
    },
    'diccionario': {
      id: 'diccionario',
      nombre: 'Diccionario de datos',
      badge: 'Módulo 09',
      apartados: [
        { id: 'sec-dicc-cabecera', titulo: 'Marco del diccionario territorial', abajo: false },
        { id: 'dicc-sec-esquema', titulo: 'Esquema de 17 atributos canónicos', abajo: false },
        { id: 'contenedor-filtros-diccionario', titulo: 'Buscador y filtro de capas', abajo: true },
        { id: 'contenido-diccionario', titulo: 'Catálogo detallado de 133 capas', abajo: true }
      ]
    },
    'licencias': {
      id: 'licencias',
      nombre: 'Licencias y descargas',
      badge: 'Módulo 10',
      apartados: [
        { id: 'sec-lic-cabecera', titulo: 'Marco jurídico y reciprocidad', abajo: false },
        { id: 'sec-lic-descargas-maestras', titulo: 'Descarga de geodatabase completa (ZIP)', abajo: false },
        { id: 'sec-lic-marco-tripartito', titulo: 'Marco tripartito de licencias', abajo: true },
        { id: 'sec-lic-atribuciones-fuentes', titulo: 'Atribuciones y citas bibliográficas', abajo: true }
      ]
    }
  };

  let moduloActivo = 'inicio';
  let colapsado = false;
  let observerScrollspy = null;
  let timerThrottle = null;

  function normalizarIdModulo(id) {
    if (!id) return 'inicio';
    const limpio = String(id).replace(/^panel-/, '').trim().toLowerCase();
    if (CONFIG_MODULOS[limpio]) return limpio;
    if (limpio === 'visor') return 'inicio';
    if (limpio === 'osm') return 'explorador-osm';
    if (limpio === 'gbif') return 'biodiversidad-gbif';
    if (limpio === 'umap') return 'proyectos-umap';
    if (limpio === 'calidad') return 'calidad-ohsome';
    if (limpio === 'metadatos') return 'metadatos-iso';
    return 'inicio';
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
          <button type="button" 
                  id="btn-cerrar-leyenda-atajos" 
                  class="btn-cerrar-leyenda-atajos" 
                  title="Cerrar panel de apartados (X)"
                  aria-label="Cerrar panel de apartados">
            ✕
          </button>
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
    const btnCerrar = document.getElementById('btn-cerrar-leyenda-atajos');
    const btnArriba = document.getElementById('btn-volver-arriba-modulo');

    if (btnToggle) {
      btnToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setColapsado(false);
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

    // En pantallas pequeñas (< 1024px), cerrar si se hace clic fuera del widget
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024 && !colapsado) {
        if (!contenedor.contains(e.target)) {
          setColapsado(true);
        }
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

  function toggleColapso() {
    setColapsado(!colapsado);
  }

  function desplazarseAApartado(idElemento) {
    if (!idElemento) return;

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

    // En móviles/tablets, cerrar al seleccionar apartado para ver el contenido
    if (window.innerWidth <= 1024) {
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

    configurarScrollspy(info.apartados);
  }

  function configurarScrollspy(apartados) {
    if (observerScrollspy) {
      try { observerScrollspy.disconnect(); } catch (_) {}
      observerScrollspy = null;
    }

    const ids = apartados.map(a => a.id);
    const elementos = ids.map(id => document.getElementById(id)).filter(Boolean);

    if ('IntersectionObserver' in window && elementos.length > 0) {
      observerScrollspy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            marcarApartadoActivo(entry.target.id);
          }
        });
      }, {
        root: null,
        rootMargin: '-15% 0px -65% 0px',
        threshold: [0, 0.2]
      });

      elementos.forEach(el => observerScrollspy.observe(el));
    } else {
      configurarScrollFallback(ids);
    }
  }

  function marcarApartadoActivo(idElemento) {
    const lista = document.getElementById('lista-atajos-modulo');
    if (!lista) return;

    lista.querySelectorAll('.item-atajo-modulo').forEach(btn => {
      const coincide = btn.dataset.targetId === idElemento;
      btn.classList.toggle('activo', coincide);
      btn.setAttribute('aria-current', coincide ? 'true' : 'false');
    });
  }

  function configurarScrollFallback(ids) {
    window.removeEventListener('scroll', handlerScrollFallback);
    window.addEventListener('scroll', handlerScrollFallback, { passive: true });
  }

  function handlerScrollFallback() {
    if (timerThrottle) return;
    timerThrottle = setTimeout(() => {
      timerThrottle = null;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const offset = 130;

      const info = CONFIG_MODULOS[moduloActivo] || CONFIG_MODULOS['inicio'];
      let actualId = null;

      info.apartados.forEach(ap => {
        let el = document.getElementById(ap.id);
        if (!el && ap.id === 'cap-uso-04') {
          el = document.getElementById('tbody-catalogo-manual');
        }
        if (el) {
          const top = el.offsetTop - offset;
          if (scrollY >= top) actualId = ap.id;
        }
      });

      if (actualId) marcarApartadoActivo(actualId);
    }, 120);
  }

  function inicializar() {
    asegurarContenedorDOM();

    // Requisito expreso del usuario: la leyenda siempre se despliega al abrir la página
    setColapsado(false);

    const panelActivoEl = document.querySelector('.panel.activo');
    const panelIdInicial = panelActivoEl ? panelActivoEl.id.replace('panel-', '') : 'inicio';
    renderizarAtajosModulo(panelIdInicial);
  }

  function actualizar(panelId) {
    const modKey = normalizarIdModulo(panelId);
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
