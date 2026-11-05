/*
  leyenda_atajos.js
  -----------------
  Módulo de Navegación Lateral y Leyenda Dinámica de Apartados (Atajos) del Atlas VGI.
  Proporciona una guía visual lateral en todos los módulos de la plataforma web,
  permitiendo a usuarios que no realizan scroll identificar al instante las herramientas,
  consultas y catálogos disponibles más abajo (Overpass API, catálogo de 123 capas,
  auditorías, storyboards, etc.) y desplazarse suavemente con un solo clic.

  Características:
  - 100% dinámico y reactivo a los 10 módulos del Atlas.
  - Sincronización continua con activarPanel().
  - Scrollspy activo para iluminar la sección visible en tiempo real.
  - Resaltado visual momentáneo (.seccion-resaltada-atajo) del apartado de destino.
  - Diseño responsivo adaptativo (panel lateral sticky en escritorio, drawer táctil en móviles).
  - Plegable / minimizable para no interferir con el visor Leaflet ni con formularios.
*/

const ModuloAtajosLeyenda = (() => {
  'use strict';

  // Configuración exhaustiva de los 10 módulos de la plataforma web
  const CONFIG_MODULOS = {
    'inicio': {
      id: 'inicio',
      nombre: 'Visor y Atlas VGI',
      icono: '🗺️',
      badge: 'Módulo 01',
      apartados: [
        {
          id: 'sec-inicio-hero',
          titulo: 'Propósito y Cobertura',
          icono: '🏛️',
          desc: 'Resumen territorial, métricas y calidad 95,4%',
          abajo: false
        },
        {
          id: 'mapa-atlas',
          titulo: 'Visor Cartográfico Interactivo',
          icono: '🗺️',
          desc: 'Mapa Leaflet con capas comunitarias y oficiales',
          abajo: false
        },
        {
          id: 'sec-inicio-inspector',
          titulo: 'Inspector de Entidades y Calidad ICV',
          icono: '🔍',
          desc: 'Atributos, capas activas, PRC y base PostGIS',
          abajo: false
        },
        {
          id: 'consola-capas-gis',
          titulo: 'Catálogo de 123 Capas Oficiales del Estado',
          icono: '📦',
          desc: 'Coberturas IDE Chile, 10 categorías VGI y filtros',
          abajo: true
        },
        {
          id: 'seccion-importador-capas',
          titulo: 'Importador de Capas Locales Drag & Drop',
          icono: '📂',
          desc: 'Carga archivos propios .kmz, .kml, .geojson, .csv',
          abajo: true
        },
        {
          id: 'sec-inicio-territorio',
          titulo: 'Ficha del Territorio de Estudio',
          icono: '📍',
          desc: 'Parámetros territoriales de Santiago y Barrio Brasil',
          abajo: true
        }
      ]
    },
    'explorador-osm': {
      id: 'explorador-osm',
      nombre: 'Consultas en OpenStreetMap',
      icono: '🔍',
      badge: 'Módulo 02',
      apartados: [
        {
          id: 'sec-osm-cabecera',
          titulo: 'Guía y Alcance Territorial',
          icono: '💡',
          desc: 'Estándar ISO 19110 y buenas prácticas de consulta',
          abajo: false
        },
        {
          id: 'sec-osm-temas-rapidos',
          titulo: 'Consultas Rápidas por Tema (1 Clic)',
          icono: '⚡',
          desc: 'Farmacias, ciclovías, educación, salud y patrimonio',
          abajo: false
        },
        {
          id: 'sec-osm-constructor-overpass',
          titulo: 'Constructor Overpass API en Vivo',
          icono: '🛠️',
          desc: 'Búsqueda personalizada, clave/valor y editor QL',
          abajo: true
        },
        {
          id: 'sec-osm-geodatabase-rm',
          titulo: 'Geodatabase Regional RM (Geofabrik)',
          icono: '📦',
          desc: 'Extracto local de 921k entidades sin usar la API',
          abajo: true
        },
        {
          id: 'resultado-osm',
          titulo: 'Resultados, Superficies y Exportación',
          icono: '📊',
          desc: 'Tabla de entidades, cálculo m² y GeoJSON/CSV',
          abajo: true
        }
      ]
    },
    'biodiversidad-gbif': {
      id: 'biodiversidad-gbif',
      nombre: 'Biodiversidad Urbana y GBIF',
      icono: '🌿',
      badge: 'Módulo 03',
      apartados: [
        {
          id: 'sec-gbif-cabecera',
          titulo: 'Marco de Ciencia Ciudadana',
          icono: '🌱',
          desc: 'Integración GBIF e iNaturalist en el territorio',
          abajo: false
        },
        {
          id: 'sec-gbif-busqueda',
          titulo: 'Búsqueda Taxonómica Inteligente',
          icono: '🔍',
          desc: 'Backbone oficial Nub y especies prioritarias de Chile',
          abajo: false
        },
        {
          id: 'sec-gbif-ambito',
          titulo: 'Ámbito Espacial y Selectores Rápidos',
          icono: '🗺️',
          desc: 'Región Metropolitana, Barrio Brasil o Todo Chile',
          abajo: true
        },
        {
          id: 'sec-gbif-guia',
          titulo: 'Metodología y Estándar Darwin Core',
          icono: '📖',
          desc: 'Protocolo de avistamientos y licencias abiertas',
          abajo: true
        },
        {
          id: 'resultado-gbif',
          titulo: 'Registros Biológicos y Descargas',
          icono: '📊',
          desc: 'Observaciones verificadas, visor y GeoJSON',
          abajo: true
        }
      ]
    },
    'proyectos-umap': {
      id: 'proyectos-umap',
      nombre: 'Mapas Comunitarios (uMap)',
      icono: '🗺️',
      badge: 'Módulo 04',
      apartados: [
        {
          id: 'sec-umap-cabecera',
          titulo: 'Cartografía Social y Participativa',
          icono: '🤝',
          desc: 'Iniciativas y relatos territoriales colaborativos',
          abajo: false
        },
        {
          id: 'sec-umap-selector',
          titulo: 'Catálogo de Mapas Colaborativos',
          icono: '📋',
          desc: 'Selecciona proyectos: Árboles, Ciclovías, Patrimonio',
          abajo: false
        },
        {
          id: 'sec-umap-guia',
          titulo: 'Guía de Mapeo Ciudadano en uMap',
          icono: '📖',
          desc: 'Paso a paso para crear proyectos cartográficos libres',
          abajo: true
        },
        {
          id: 'resultado-umap',
          titulo: 'Visor Embebido Interactivo',
          icono: '🖥️',
          desc: 'Exploración directa de mapas colaborativos en vivo',
          abajo: true
        }
      ]
    },
    'indicadores': {
      id: 'indicadores',
      nombre: 'Indicadores y Relatos Cartográficos',
      icono: '📊',
      badge: 'Módulo 05',
      apartados: [
        {
          id: 'sec-ind-cabecera',
          titulo: 'Marco Analítico Multidimensional',
          icono: '🎯',
          desc: 'Integración estadística y espacial en Santiago',
          abajo: false
        },
        {
          id: 'sec-ind-dimensiones',
          titulo: '5 Dimensiones de Análisis Territorial',
          icono: '📐',
          desc: 'Sociodemográfica, socioeconómica, ambiental, etc.',
          abajo: false
        },
        {
          id: 'contenedor-acordeon-capas',
          titulo: 'Métricas e Indicadores por Dimensión',
          icono: '📊',
          desc: 'Censo 2024, EOD, áreas verdes y equipamiento',
          abajo: true
        },
        {
          id: 'seccion-storyboards',
          titulo: '8 Storyboards Analíticos (83 Mapas)',
          icono: '📚',
          desc: 'Relatos cartográficos KDE, LISA, demografía y hábitat',
          abajo: true
        }
      ]
    },
    'calidad-ohsome': {
      id: 'calidad-ohsome',
      nombre: 'Evaluación de Calidad (ISO 19157)',
      icono: '🛡️',
      badge: 'Módulo 06',
      apartados: [
        {
          id: 'sec-calidad-cabecera',
          titulo: 'Marco de Calidad Cartográfica',
          icono: '📋',
          desc: 'Estándar ISO 19157 y dimensiones intrínsecas',
          abajo: false
        },
        {
          id: 'sec-calidad-evaluador',
          titulo: 'Evaluador de Calidad de Capas (IGV)',
          icono: '📈',
          desc: 'Índice de Grado de Verificación (0 a 100) y WLC v2.0',
          abajo: false
        },
        {
          id: 'sec-calidad-ohsome',
          titulo: 'Evolución Histórica (Ohsome API)',
          icono: '⏳',
          desc: 'Trayectoria temporal de mapeo 2008-2026 en el área',
          abajo: true
        },
        {
          id: 'sec-calidad-osmcha',
          titulo: 'Auditoría de Ediciones (OSMCha)',
          icono: '🔍',
          desc: 'Monitoreo de changesets y validación comunitaria',
          abajo: true
        }
      ]
    },
    'manual': {
      id: 'manual',
      nombre: 'Manual Metodológico del Sistema',
      icono: '📘',
      badge: 'Módulo 07',
      apartados: [
        {
          id: 'sec-manual-cabecera',
          titulo: 'Introducción y Arquitectura',
          icono: '🏛️',
          desc: 'Fundamentación del Atlas e infraestructura territorial',
          abajo: false
        },
        {
          id: 'buscador-general-manual',
          titulo: 'Buscador y Filtro de Capítulos',
          icono: '🔍',
          desc: 'Búsqueda por palabra clave o procedimiento técnico',
          abajo: false
        },
        {
          id: 'lista-capitulos-manual',
          titulo: 'Capítulos del Manual de Uso',
          icono: '📖',
          desc: 'Operación de módulos 01 al 10, ICV dinámico y PRC',
          abajo: true
        },
        {
          id: 'tbody-catalogo-manual',
          titulo: 'Inventario Dinámico de 133 Capas',
          icono: '📦',
          desc: 'Tabla completa con fuentes, licencias y enlaces',
          abajo: true
        }
      ]
    },
    'metadatos-iso': {
      id: 'metadatos-iso',
      nombre: 'Catálogo y Metadatos (ISO 19115)',
      icono: '📋',
      badge: 'Módulo 08',
      apartados: [
        {
          id: 'sec-meta-cabecera',
          titulo: 'Marco de Metadatos Espaciales',
          icono: '🏛️',
          desc: 'Normas ISO 19115, ISO 19139 y perfil IDE Chile',
          abajo: false
        },
        {
          id: 'sec-meta-calidad-general',
          titulo: 'Calidad General del Catálogo (133 Capas)',
          icono: '📊',
          desc: 'Puntajes consolidados y completitud de metadatos',
          abajo: false
        },
        {
          id: 'form-metadatos',
          titulo: 'Formulario de Perfil de Metadatos',
          icono: '📝',
          desc: 'Identificación, extensión espacial, linaje y contacto',
          abajo: true
        },
        {
          id: 'sec-meta-estandar',
          titulo: 'Especificaciones Técnicas IDE Chile',
          icono: '🏛️',
          desc: 'Requerimientos obligatorios y directrices SNIT',
          abajo: true
        },
        {
          id: 'resultado-metadatos',
          titulo: 'Generador y Exportador XML / JSON',
          icono: '📥',
          desc: 'Descarga de ficha técnica formal estandarizada',
          abajo: true
        }
      ]
    },
    'diccionario': {
      id: 'diccionario',
      nombre: 'Diccionario de Datos y Catálogo',
      icono: '📚',
      badge: 'Módulo 09',
      apartados: [
        {
          id: 'sec-dicc-cabecera',
          titulo: 'Marco del Diccionario Territorial',
          icono: '💡',
          desc: 'Estructuración semántica y equivalencias ISO 19110',
          abajo: false
        },
        {
          id: 'dicc-sec-esquema',
          titulo: 'Estándar Canónico de 17 Atributos',
          icono: '📋',
          desc: 'Esquema universal de interoperabilidad VGI',
          abajo: false
        },
        {
          id: 'contenedor-filtros-diccionario',
          titulo: 'Buscador y Filtro de Capas',
          icono: '🔍',
          desc: 'Filtrado instantáneo por institución y temática',
          abajo: true
        },
        {
          id: 'contenido-diccionario',
          titulo: 'Catálogo Detallado de 133 Capas',
          icono: '📚',
          desc: 'Definición de tablas, geometrías y atributos',
          abajo: true
        }
      ]
    },
    'licencias': {
      id: 'licencias',
      nombre: 'Licencias Abiertas y Descargas',
      icono: '⚖️',
      badge: 'Módulo 10',
      apartados: [
        {
          id: 'sec-lic-cabecera',
          titulo: 'Marco Jurídico de Licenciamiento',
          icono: '⚖️',
          desc: 'Copyleft y reciprocidad comunitaria (Ley 17.336)',
          abajo: false
        },
        {
          id: 'sec-lic-descargas-maestras',
          titulo: 'Descarga Geodatabase Completa (.ZIP)',
          icono: '📦',
          desc: 'Paquete consolidado de 542 MB con 133 capas GeoJSON',
          abajo: false
        },
        {
          id: 'sec-lic-marco-tripartito',
          titulo: 'Marco Tripartito de Licencias',
          icono: '🛡️',
          desc: 'CC BY-SA 4.0, ODbL 1.0 y GNU AGPLv3',
          abajo: true
        },
        {
          id: 'sec-lic-atribuciones-fuentes',
          titulo: 'Atribuciones y Citas Bibliográficas',
          icono: '🎓',
          desc: 'Citación APA 7ª ed. y agradecimiento a fuentes',
          abajo: true
        }
      ]
    }
  };

  let moduloActivo = 'inicio';
  let colapsado = false;
  let observerScrollspy = null;
  let timerThrottle = null;

  /**
   * Normaliza el ID del módulo admitiendo variantes como "panel-inicio" o "inicio"
   */
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

  /**
   * Genera el contenedor HTML de la leyenda si aún no existe en el DOM
   */
  function asegurarContenedorDOM() {
    let contenedor = document.getElementById('leyenda-atajos-modulo');
    if (contenedor) return contenedor;

    contenedor = document.createElement('aside');
    contenedor.id = 'leyenda-atajos-modulo';
    contenedor.className = 'leyenda-atajos-flotante';
    contenedor.setAttribute('aria-label', 'Atajos y apartados del módulo activo');

    contenedor.innerHTML = `
      <!-- Pestaña lateral para alternar colapso / expansión -->
      <button type="button" 
              id="btn-toggle-leyenda-atajos" 
              class="btn-toggle-leyenda-atajos" 
              title="Mostrar u ocultar la leyenda de apartados"
              aria-expanded="true">
        <span class="icono-toggle-leyenda">📑</span>
        <span class="texto-toggle-leyenda">Apartados</span>
        <span class="flecha-toggle-leyenda">▶</span>
      </button>

      <!-- Caja principal con la lista de apartados -->
      <div class="caja-leyenda-atajos" id="caja-leyenda-atajos">
        <div class="cabecera-leyenda-atajos">
          <div class="meta-leyenda-modulo">
            <span class="badge-modulo-leyenda" id="leyenda-badge-modulo">Módulo 01</span>
            <h4 class="titulo-modulo-leyenda" id="leyenda-titulo-modulo">Visor y Atlas VGI</h4>
          </div>
          <button type="button" 
                  id="btn-cerrar-leyenda-atajos" 
                  class="btn-cerrar-leyenda-atajos" 
                  title="Minimizar panel de apartados"
                  aria-label="Minimizar apartados">
            ✕
          </button>
        </div>

        <div class="aviso-guia-leyenda">
          <span class="icono-aviso-guia">💡</span>
          <span class="texto-aviso-guia">
            <strong>Atajos de sección:</strong> Haz clic para navegar directamente. Los apartados marcados con <em>↓ Abajo</em> están disponibles al desplazarte.
          </span>
        </div>

        <nav class="lista-atajos-modulo" id="lista-atajos-modulo" aria-label="Lista de apartados de este módulo">
          <!-- Renderizado dinámico de apartados -->
        </nav>

        <div class="pie-leyenda-atajos">
          <div class="contador-apartados-leyenda" id="contador-apartados-leyenda">
            6 apartados disponibles
          </div>
          <button type="button" 
                  class="btn-volver-arriba-modulo" 
                  id="btn-volver-arriba-modulo" 
                  title="Desplazarse al inicio de este módulo">
            ↑ Arriba
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(contenedor);

    // Eventos de toggle (expandir / contraer)
    const btnToggle = document.getElementById('btn-toggle-leyenda-atajos');
    const btnCerrar = document.getElementById('btn-cerrar-leyenda-atajos');
    const btnArriba = document.getElementById('btn-volver-arriba-modulo');

    if (btnToggle) {
      btnToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleColapso();
      });
    }

    if (btnCerrar) {
      btnCerrar.addEventListener('click', (e) => {
        e.stopPropagation();
        setColapsado(true);
      });
    }

    if (btnArriba) {
      btnArriba.addEventListener('click', (e) => {
        e.stopPropagation();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Cerrar en móviles si se hace clic fuera del widget
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024 && !colapsado) {
        if (!contenedor.contains(e.target)) {
          setColapsado(true);
        }
      }
    });

    return contenedor;
  }

  /**
   * Controla el estado de colapso de la leyenda
   */
  function setColapsado(nuevoEstado) {
    colapsado = Boolean(nuevoEstado);
    const cont = document.getElementById('leyenda-atajos-modulo');
    const btnToggle = document.getElementById('btn-toggle-leyenda-atajos');
    if (!cont) return;

    if (colapsado) {
      cont.classList.add('colapsada');
      if (btnToggle) {
        btnToggle.setAttribute('aria-expanded', 'false');
        const flecha = btnToggle.querySelector('.flecha-toggle-leyenda');
        if (flecha) flecha.textContent = '◀';
      }
    } else {
      cont.classList.remove('colapsada');
      if (btnToggle) {
        btnToggle.setAttribute('aria-expanded', 'true');
        const flecha = btnToggle.querySelector('.flecha-toggle-leyenda');
        if (flecha) flecha.textContent = '▶';
      }
    }

    try {
      localStorage.setItem('atlas_leyenda_atajos_colapsada', colapsado ? '1' : '0');
    } catch (_) {}
  }

  function toggleColapso() {
    setColapsado(!colapsado);
  }

  /**
   * Navega suavemente a un apartado identificado por su ID y aplica un resplandor momentáneo
   */
  function desplazarseAApartado(idElemento) {
    if (!idElemento) return;
    const destino = document.getElementById(idElemento);
    if (!destino) {
      console.warn(`[ModuloAtajosLeyenda] Elemento no encontrado: #${idElemento}`);
      return;
    }

    // En pantallas estrechas (< 1024px), colapsar para despejar el campo de visión
    if (window.innerWidth <= 1024) {
      setColapsado(true);
    }

    // Desplazamiento suave con compensación por la cabecera fija
    const offsetCabecera = 110;
    const posRect = destino.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const destinoTop = posRect.top + scrollTop - offsetCabecera;

    window.scrollTo({
      top: Math.max(0, destinoTop),
      behavior: 'smooth'
    });

    // Efecto de halo luminoso momentáneo
    destino.classList.remove('seccion-resaltada-atajo');
    // Forzar reflow para reiniciar la animación
    void destino.offsetWidth;
    destino.classList.add('seccion-resaltada-atajo');

    setTimeout(() => {
      destino.classList.remove('seccion-resaltada-atajo');
    }, 2200);
  }

  /**
   * Renderiza los atajos correspondientes al módulo activo
   */
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
    if (elTitulo) elTitulo.innerHTML = `${info.icono} ${info.nombre}`;
    if (btnToggle) {
      const txt = btnToggle.querySelector('.texto-toggle-leyenda');
      if (txt) txt.textContent = `Apartados (${info.apartados.length})`;
    }

    if (!lista) return;

    let itemsHtml = '';
    const totalAbajo = info.apartados.filter(a => a.abajo).length;

    info.apartados.forEach((ap, index) => {
      const numStr = String(index + 1).padStart(2, '0');
      const badgeAbajo = ap.abajo 
        ? `<span class="badge-indicador-abajo" title="Ubicado más abajo en la página">↓ Abajo</span>` 
        : `<span class="badge-indicador-vista" title="En la zona superior de la pantalla">● Superior</span>`;

      itemsHtml += `
        <button type="button" 
                class="item-atajo-modulo" 
                data-target-id="${ap.id}" 
                id="btn-atajo-${ap.id}"
                title="Ir a: ${ap.titulo}">
          <div class="indicador-orden-atajo">${numStr}</div>
          <div class="cuerpo-atajo-modulo">
            <div class="fila-superior-atajo">
              <span class="icono-apartado">${ap.icono}</span>
              <strong class="titulo-apartado">${ap.titulo}</strong>
              ${badgeAbajo}
            </div>
            <p class="desc-apartado">${ap.desc}</p>
          </div>
        </button>
      `;
    });

    lista.innerHTML = itemsHtml;

    if (elContador) {
      elContador.innerHTML = `<strong>${info.apartados.length} apartados</strong> · ${totalAbajo} más abajo`;
    }

    // Configurar listeners de clic en cada atajo
    lista.querySelectorAll('.item-atajo-modulo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = btn.dataset.targetId;
        desplazarseAApartado(targetId);
      });
    });

    // Reinicializar el observador Scrollspy
    configurarScrollspy(info.apartados);
  }

  /**
   * Scrollspy con IntersectionObserver para iluminar el apartado activo según scroll
   */
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
      // Fallback con evento scroll throttled
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
      const offset = 140;

      const info = CONFIG_MODULOS[moduloActivo] || CONFIG_MODULOS['inicio'];
      let actualId = null;

      info.apartados.forEach(ap => {
        const el = document.getElementById(ap.id);
        if (el) {
          const top = el.offsetTop - offset;
          if (scrollY >= top) {
            actualId = ap.id;
          }
        }
      });

      if (actualId) {
        marcarApartadoActivo(actualId);
      }
    }, 120);
  }

  /**
   * Inicialización pública
   */
  function inicializar() {
    asegurarContenedorDOM();

    // Recuperar preferencia de minimizado (por defecto expandido en escritorio, colapsado en móvil)
    let prefColapso = false;
    try {
      const guardado = localStorage.getItem('atlas_leyenda_atajos_colapsada');
      if (guardado !== null) {
        prefColapso = guardado === '1';
      } else {
        prefColapso = window.innerWidth <= 1024;
      }
    } catch (_) {
      prefColapso = window.innerWidth <= 1024;
    }

    setColapsado(prefColapso);

    // Detectar panel activo inicial
    const panelActivoEl = document.querySelector('.panel.activo');
    const panelIdInicial = panelActivoEl ? panelActivoEl.id.replace('panel-', '') : 'inicio';
    renderizarAtajosModulo(panelIdInicial);

    // Ajustar responsividad al redimensionar
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 1024 && !colapsado) {
        setColapsado(true);
      }
    }, { passive: true });
  }

  /**
   * Actualización pública invocada al cambiar de panel
   */
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

// Exposición en ámbito global para llamadas de activación
if (typeof window !== 'undefined') {
  window.ModuloAtajosLeyenda = ModuloAtajosLeyenda;
}
