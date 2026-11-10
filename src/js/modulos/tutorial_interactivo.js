/**
 * tutorial_interactivo.js
 * -----------------------
 * Módulo de Tutorial Interactivo Guiado para el Atlas para la Gestión Territorial.
 * Destaca visualmente (con foco de luz / spotlight y oscurecimiento perimetral)
 * cada módulo, apartado y sección del Atlas, explicando de forma clara, directa
 * y respetuosa del lenguaje técnico la función y utilidad de cada componente.
 */

(function (window, document) {
  'use strict';

  const PASOS_TUTORIAL = [
    {
      id: 'paso-navegacion-modulos',
      selector: '.barra-grupos-tarea',
      modulo: null,
      insignia: 'Navegación General',
      titulo: '3 Módulos del Atlas Territorial',
      texto: 'La plataforma se organiza en 3 módulos funcionales: Módulo 01 (Análisis y síntesis territorial), Módulo 02 (Exploración cartográfica SIG) y Módulo 03 (Documentación y geodatos abiertos). Puedes alternar directamente entre tareas con estos botones.'
    },
    {
      id: 'paso-analisis-cabecera',
      selector: '#sec-ind-cabecera',
      modulo: 'indicadores',
      insignia: 'Módulo 01 · Análisis',
      titulo: 'Síntesis Territorial y Diagnóstico',
      texto: 'Presenta el diagnóstico comunal y barrial construido a partir de 83 cartografías temáticas que revelan patrones de concentración espacial, habitabilidad censal, segregación y metabolismo urbano en Santiago y Barrio Brasil.'
    },
    {
      id: 'paso-analisis-narrativas',
      selector: '#seccion-storyboards',
      modulo: 'indicadores',
      insignia: 'Módulo 01 · Análisis',
      titulo: '4 Narrativas Espaciales Basadas en Datos',
      texto: 'Reúne 4 láminas analíticas: Concentración KDE, Autocorrelación Espacial Local (LISA), Estructura Demográfica y Metabolismo Urbano. Al pulsar "Leer relato", se despliega una lámina en alta resolución con carrusel de mapas y diagnóstico interpretativo.'
    },
    {
      id: 'paso-analisis-dimensiones',
      selector: '#sec-ind-dimensiones',
      modulo: 'indicadores',
      insignia: 'Módulo 01 · Análisis',
      titulo: '5 Dimensiones y Catálogo de 294 Capas',
      texto: 'Estructura la información en 5 dimensiones (Sociodemográfica, Socioeconómica, Socioambiental, Sociosanitaria y Sociourbana). Al pulsar una tarjeta, se abre el acordeón con buscador dinámico en español y botón directo "Ver en Mapa".'
    },
    {
      id: 'paso-mapa-territorio',
      selector: '.barra-herramientas-mapa',
      modulo: 'inicio',
      insignia: 'Módulo 02 · Explorar Mapa',
      titulo: 'Área de Enfoque y Encuadre Territorial',
      texto: 'Permite alternar la escala geográfica entre "Barrio Brasil Completo" y "Comuna de Santiago", delimitar un polígono de búsqueda espacial personalizado ("Delimitar área") o reencuadrar la vista geográfica inicial.'
    },
    {
      id: 'paso-mapa-inspector',
      selector: '#btn-inspector-normativo',
      modulo: 'inicio',
      insignia: 'Módulo 02 · Explorar Mapa',
      titulo: 'Inspector Normativo (PRC y OGUC)',
      texto: 'Herramienta de análisis geodésico que, al activarse y hacer clic sobre cualquier predio o manzana del mapa, consulta automáticamente la zonificación del Plan Regulador Comunal (PRC) y emite el Certificado de Informaciones Normativas (CIN-VGI).'
    },
    {
      id: 'paso-mapa-exportar',
      selector: '#btn-exportar-geojson-mapa',
      modulo: 'inicio',
      insignia: 'Módulo 02 · Explorar Mapa',
      titulo: 'Exportación de Vista y Geodatabase Completa',
      texto: 'Permite descargar en GeoJSON las coberturas visibles en pantalla con su simbología temáticamente aplicada ("Exportar vista") o descargar el archivo comprimido (.zip de 542 MB) con las 294 capas del sistema.'
    },
    {
      id: 'paso-mapa-simbologia',
      selector: '#panel-simbologia-dinamica',
      modulo: 'inicio',
      insignia: 'Módulo 02 · Explorar Mapa',
      titulo: 'Simbología Temática Dinámica (Natural Breaks)',
      texto: 'Clasifica automáticamente capas cuantitativas mediante cortes naturales de Jenks (Natural Breaks) o cualitativas por entidad única. Permite ajustar en vivo paletas cromáticas, número de clases, opacidad y tamaños de marcadores.'
    },
    {
      id: 'paso-mapa-visor',
      selector: '#mapa-atlas',
      modulo: 'inicio',
      insignia: 'Módulo 02 · Explorar Mapa',
      titulo: 'Visor Cartográfico Interactivo Leaflet',
      texto: 'Entorno de navegación cartográfica con marcadores vectoriales SVG. El árbol de capas superior permite encender o apagar coberturas temáticas y seleccionar mapas base abiertos de alta velocidad sin dependencias de claves de API externas.'
    },
    {
      id: 'paso-mapa-detalles',
      selector: '#sidebar-detalle-bidat',
      modulo: 'inicio',
      insignia: 'Módulo 02 · Explorar Mapa',
      titulo: 'Detalles',
      texto: 'Ubicado debajo del mapa a ancho completo, visualiza el esquema canónico completo de 17 atributos (nombre, operador, categoría, coordenadas, superficie y método de adquisición: Geofabrik, Overpass o GBIF) de la entidad seleccionada.'
    },
    {
      id: 'paso-documentacion-cabecera',
      selector: '#sec-manual-cabecera',
      modulo: 'manual',
      insignia: 'Módulo 03 · Documentación',
      titulo: 'Documentación Integral y Manual de Uso',
      texto: 'Explica los fundamentos conceptuales, objetivos específicos y cifras consolidadas de la plataforma. Incluye el inventario exhaustivo y filtrable de las 294 capas espaciales, diccionario de descriptores y marco legal de licencias abiertas.'
    },
    {
      id: 'paso-utilidad-glosario',
      selector: '#btn-abrir-glosario-rapido',
      modulo: null,
      insignia: 'Utilidades del Sistema',
      titulo: 'Glosario de Siglas y Términos Técnicos',
      texto: 'Consulta en cualquier momento la definición de siglas y conceptos técnicos del Atlas (VGI, IGV, KDE, LISA, PRC, OGUC, etc.) en una ventana modal para una comprensión directa y accesible de cada indicador territorial.'
    }
  ];

  let pasoActual = 0;
  let tutorialActivo = false;
  let elementoSpotlight = null;
  let elementoTooltip = null;
  let temporizadorTransicion = null;

  /**
   * Crea e inyecta los elementos DOM del tutorial si no existen
   */
  function asegurarElementosDOM() {
    if (!elementoSpotlight) {
      elementoSpotlight = document.getElementById('tutorial-interactivo-spotlight');
      if (!elementoSpotlight) {
        elementoSpotlight = document.createElement('div');
        elementoSpotlight.id = 'tutorial-interactivo-spotlight';
        elementoSpotlight.className = 'tutorial-interactivo-spotlight';
        elementoSpotlight.style.display = 'none';
        document.body.appendChild(elementoSpotlight);
      }
    }

    if (!elementoTooltip) {
      elementoTooltip = document.getElementById('tutorial-tooltip-card');
      if (!elementoTooltip) {
        elementoTooltip = document.createElement('div');
        elementoTooltip.id = 'tutorial-tooltip-card';
        elementoTooltip.className = 'tutorial-card-tooltip';
        elementoTooltip.setAttribute('role', 'dialog');
        elementoTooltip.setAttribute('aria-modal', 'true');
        elementoTooltip.setAttribute('aria-label', 'Tutorial interactivo guiado');
        elementoTooltip.style.display = 'none';
        document.body.appendChild(elementoTooltip);
      }
    }
  }

  /**
   * Manejador de teclado para navegación accesible
   */
  function manejarTeclas(e) {
    if (!tutorialActivo) return;
    if (e.key === 'Escape') {
      detener();
    } else if (e.key === 'ArrowRight') {
      siguiente();
    } else if (e.key === 'ArrowLeft') {
      anterior();
    }
  }

  /**
   * Reposiciona el spotlight y la tarjeta tooltip con respecto al elemento destino
   */
  function actualizarPosiciones() {
    if (!tutorialActivo) return;
    const paso = PASOS_TUTORIAL[pasoActual];
    if (!paso) return;

    const el = document.querySelector(paso.selector);
    if (!el || !elementoSpotlight || !elementoTooltip) return;

    const rect = el.getBoundingClientRect();
    const pad = 8;

    // 1. Posicionar marco de luz / spotlight
    const topSpot = Math.max(0, rect.top - pad);
    const leftSpot = Math.max(0, rect.left - pad);
    const widthSpot = Math.min(window.innerWidth - leftSpot, rect.width + pad * 2);
    const heightSpot = Math.min(window.innerHeight - topSpot, rect.height + pad * 2);

    elementoSpotlight.style.top = `${topSpot}px`;
    elementoSpotlight.style.left = `${leftSpot}px`;
    elementoSpotlight.style.width = `${widthSpot}px`;
    elementoSpotlight.style.height = `${heightSpot}px`;
    elementoSpotlight.style.display = 'block';

    // 2. Posicionar tarjeta tooltip
    const cardRect = elementoTooltip.getBoundingClientRect();
    const cardWidth = cardRect.width || 420;
    const cardHeight = cardRect.height || 220;

    let cardTop = 0;
    let cardLeft = 0;

    const espacioAbajo = window.innerHeight - (topSpot + heightSpot);
    const espacioArriba = topSpot;

    if (espacioAbajo >= cardHeight + 20) {
      cardTop = topSpot + heightSpot + 14;
    } else if (espacioArriba >= cardHeight + 20) {
      cardTop = topSpot - cardHeight - 14;
    } else {
      // Si el elemento cubre gran parte de la pantalla, fijar al pie
      cardTop = Math.max(16, window.innerHeight - cardHeight - 24);
    }

    // Centrar horizontalmente respecto al objetivo, cuidando bordes
    const centroObjetivo = leftSpot + widthSpot / 2;
    cardLeft = centroObjetivo - cardWidth / 2;

    if (cardLeft < 16) cardLeft = 16;
    if (cardLeft + cardWidth > window.innerWidth - 16) {
      cardLeft = window.innerWidth - cardWidth - 16;
    }

    elementoTooltip.style.top = `${cardTop}px`;
    elementoTooltip.style.left = `${cardLeft}px`;
    elementoTooltip.style.display = 'block';
  }

  /**
   * Renderiza el contenido del paso actual
   */
  function renderizarPaso() {
    const paso = PASOS_TUTORIAL[pasoActual];
    if (!paso || !elementoTooltip) return;

    const totalPasos = PASOS_TUTORIAL.length;
    const numPaso = pasoActual + 1;
    const pctProgreso = Math.round((numPaso / totalPasos) * 100);
    const esUltimo = numPaso === totalPasos;
    const esPrimero = pasoActual === 0;

    elementoTooltip.innerHTML = `
      <div class="tutorial-card-header">
        <span class="tutorial-badge-modulo">${paso.insignia}</span>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="tutorial-contador-pasos">Paso ${numPaso} de ${totalPasos}</span>
          <button type="button" class="tutorial-btn-cerrar" title="Cerrar tutorial (Esc)" onclick="ModuloTutorialInteractivo.detener()" aria-label="Cerrar">✕</button>
        </div>
      </div>
      <div class="tutorial-card-barra-progreso" role="progressbar" aria-valuenow="${pctProgreso}" aria-valuemin="0" aria-valuemax="100">
        <div class="tutorial-card-barra-relleno" style="width:${pctProgreso}%;"></div>
      </div>
      <h4 class="tutorial-card-titulo">${paso.titulo}</h4>
      <p class="tutorial-card-texto">${paso.texto}</p>
      <div class="tutorial-card-footer">
        <button type="button" class="tutorial-btn-saltar" onclick="ModuloTutorialInteractivo.detener()">Saltar tutorial</button>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="tutorial-btn-accion secundario" ${esPrimero ? 'disabled' : ''} onclick="ModuloTutorialInteractivo.anterior()" title="Ir al paso anterior (Flecha Izquierda)">
            ◀ Anterior
          </button>
          <button type="button" class="tutorial-btn-accion primario" onclick="ModuloTutorialInteractivo.siguiente()" title="${esUltimo ? 'Finalizar tutorial' : 'Ir al siguiente paso (Flecha Derecha)'}">
            ${esUltimo ? 'Finalizar ✓' : 'Siguiente ▶'}
          </button>
        </div>
      </div>
    `;

    actualizarPosiciones();
  }

  /**
   * Ejecuta la transición hacia el paso indicado
   */
  function irAPaso(indice) {
    if (indice < 0 || indice >= PASOS_TUTORIAL.length) return;
    pasoActual = indice;
    const paso = PASOS_TUTORIAL[pasoActual];

    if (temporizadorTransicion) {
      clearTimeout(temporizadorTransicion);
    }

    // 1. Si el paso requiere cambio de módulo/panel
    if (paso.modulo && typeof window.activarPanel === 'function') {
      window.activarPanel(paso.modulo);
    }

    // 2. Dar tiempo para el desocultamiento del panel DOM
    temporizadorTransicion = setTimeout(() => {
      const el = document.querySelector(paso.selector);
      if (el) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        } catch (e) {
          el.scrollIntoView(true);
        }
      }

      // 3. Dar tiempo para que el desplazamiento suave se complete antes de medir rect
      setTimeout(() => {
        renderizarPaso();
      }, 160);
    }, 180);
  }

  /**
   * Inicia el tutorial desde el paso 0
   */
  function iniciar() {
    asegurarElementosDOM();
    tutorialActivo = true;
    window.addEventListener('keydown', manejarTeclas);
    window.addEventListener('resize', actualizarPosiciones);
    window.addEventListener('scroll', actualizarPosiciones, { passive: true });
    irAPaso(0);
  }

  /**
   * Avanza al siguiente paso
   */
  function siguiente() {
    if (pasoActual < PASOS_TUTORIAL.length - 1) {
      irAPaso(pasoActual + 1);
    } else {
      detener();
    }
  }

  /**
   * Retrocede al paso anterior
   */
  function anterior() {
    if (pasoActual > 0) {
      irAPaso(pasoActual - 1);
    }
  }

  /**
   * Cierra y limpia el tutorial interactivo
   */
  function detener() {
    tutorialActivo = false;
    window.removeEventListener('keydown', manejarTeclas);
    window.removeEventListener('resize', actualizarPosiciones);
    window.removeEventListener('scroll', actualizarPosiciones);

    if (elementoSpotlight) {
      elementoSpotlight.style.display = 'none';
    }
    if (elementoTooltip) {
      elementoTooltip.style.display = 'none';
    }
  }

  // Exportar al objeto global
  const ModuloTutorialInteractivo = {
    iniciar: iniciar,
    siguiente: siguiente,
    anterior: anterior,
    irAPaso: irAPaso,
    detener: detener,
    obtenerPasos: function () {
      return PASOS_TUTORIAL.slice();
    }
  };

  window.ModuloTutorialInteractivo = ModuloTutorialInteractivo;
  window.iniciarTutorialInteractivo = iniciar;

})(window, document);
