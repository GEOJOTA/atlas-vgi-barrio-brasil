#!/usr/bin/env python3
"""
Descentraliza y actualiza de forma exhaustiva las 119 coberturas vectoriales
individualizadas de OpenStreetMap (OSM) del Atlas VGI para toda la Región
Metropolitana (RM) y Barrio Brasil.

Fuentes integradas por orden de prioridad geométrica/tabular (sin duplicados):
  1. Extracción PBF RM completa (`/tmp/pbf_rm_cache/*.pkl` o `/tmp/chile-latest.osm.pbf`)
     con geometrías íntegras (`Point`, `LineString`, `Polygon`, `MultiPolygon`) y
     etiquetas originales sin colapsar (`all_tags`).
  2. Suplemento limpio por categoría para etiquetas históricas/complementarias
     (`cat01`: `research` -> `office=research`, `dormitory` -> `building=dormitory`,
      `college` -> `building=college`; `capa_osm_rm_completo_vgi.geojson`: `ramp*`).

Garantías:
  - Recorte estricto contra el polígono regional oficial RM (`ide_censo2024_regional.geojson`),
    eliminando derrames hacia Valparaíso / O'Higgins.
  - Cero contaminación por etiquetas genéricas (`subtipo == 'yes'`).
  - Esquema normalizado de 17 atributos + metadatos ISO (`vgi_utils`).
  - Sincronización exacta de `src/data/`, `data/` y `catalogo_vgi_descentralizado.js`.
"""
import json
import os
import pickle
import sys
import time
from concurrent.futures import ProcessPoolExecutor

import shapely
from shapely.geometry import shape

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

import vgi_utils  # noqa: E402

BASE = os.path.dirname(SCRIPT_DIR)
DATA_SRC = os.path.join(BASE, "src", "data")
PBF_CACHE_DIR = "/tmp/pbf_rm_cache"

GEOM_RANK = {
    "Point": 1,
    "MultiPoint": 1,
    "LineString": 2,
    "MultiLineString": 3,
    "Polygon": 4,
    "MultiPolygon": 5,
    "GeometryCollection": 2,
}

# Capa objetivo -> función de coincidencia exacta sobre dict de tags OSM
SPECIAL_MATCHERS = {
    "vgi_numero_de_pisos": lambda t: bool(str(t.get("building:levels") or "").strip()),
    "vgi_ciclobanda_demarcada_en_calzada": lambda t: (
        t.get("cycleway") == "lane"
        or t.get("cycleway:left") == "lane"
        or t.get("cycleway:right") == "lane"
        or t.get("cycleway:both") == "lane"
    ),
    "vgi_rampa_de_acceso_peatonal_con_pendiente_normada": lambda t: (
        t.get("highway") == "ramp"
        or t.get("ramp") in ("yes", "separate")
        or t.get("ramp:wheelchair") in ("yes", "separate")
    ),
    "vgi_cite_patrimonial": lambda t: _es_cite_osm(t),
    "vgi_residencia_universitaria": lambda t: (
        t.get("amenity") == "student_accommodation" or t.get("building") == "dormitory"
    ),
    "vgi_centro_de_investigacion": lambda t: (
        t.get("amenity") == "research_institute" or t.get("office") == "research"
    ),
    "vgi_instituto_profesional_ip": lambda t: (
        t.get("amenity") == "college" or t.get("building") == "college"
    ),
}


def _es_cite_osm(t: dict) -> bool:
    h = str(t.get("heritage") or "").lower()
    if "cite" in h or "cité" in h:
        return True
    nm = str(t.get("name") or "").lower().strip()
    if not nm:
        return False
    if "bicité" in nm or "neo-cité" in nm:
        return False
    return ("cité " in nm) or nm.startswith("cité") or nm == "cité"


def _norm_osm_key(osm_type: str, raw_id: str) -> str:
    clean_id = "".join(ch for ch in str(raw_id) if ch.isdigit()) or str(raw_id)
    ot = str(osm_type or "node").lower()
    if ot not in ("node", "way", "relation"):
        ot = "way"
    return f"{ot}/{clean_id}"


def _parse_id_igv(raw_id: str, fallback_geom_type: str):
    s = str(raw_id or "").strip()
    parts = s.split("/")
    if len(parts) >= 3 and parts[0].upper() == "OSM":
        return parts[1].lower(), parts[2]
    digits = "".join(ch for ch in s if ch.isdigit())
    if "Polygon" in fallback_geom_type or "Line" in fallback_geom_type:
        return "way", digits or s
    return "node", digits or s


def _formatear_direccion(tags: dict) -> str:
    calle = str(tags.get("addr:street") or "").strip()
    num = str(tags.get("addr:housenumber") or "").strip()
    ciudad = str(tags.get("addr:city") or tags.get("addr:suburb") or "").strip()
    if calle and num:
        return f"{calle} {num}" + (f", {ciudad}" if ciudad else "")
    if calle:
        return calle + (f", {ciudad}" if ciudad else "")
    return str(tags.get("addr:full") or ciudad or "Región Metropolitana de Santiago")


def _formatear_accesibilidad(tags: dict, default_cat: str) -> str:
    w = str(tags.get("wheelchair") or "").lower().strip()
    acc = str(tags.get("access") or "").lower().strip()
    if w == "yes":
        return "Accesible Silla de Ruedas (wheelchair=yes)"
    if w == "limited":
        return "Accesibilidad Parcial (wheelchair=limited)"
    if w == "no":
        return "Sin Acceso Silla de Ruedas"
    if acc in ("private", "no"):
        return "Acceso Privado / Restringido"
    if default_cat == "CAT-09":
        return "Edificación / Predio Urbano"
    return "Acceso Público"


def _construir_extras(tags: dict, tag_spec: str) -> dict:
    extras = {"osm_tag": tag_spec}
    for src_k, dst_k in (
        ("building:levels", "pisos"),
        ("height", "altura_m"),
        ("surface", "superficie_calzada"),
        ("highway", "clasificacion_vial"),
        ("wheelchair", "wheelchair"),
        ("tactile_paving", "pavimento_tactil"),
        ("traffic_signals:sound", "semaforo_audible"),
        ("ramp", "rampa"),
        ("ramp:wheelchair", "rampa_silla_ruedas"),
        ("kerb", "solera"),
        ("cycleway", "ciclovia"),
        ("opening_hours", "horario"),
        ("capacity", "capacidad"),
        ("brand", "marca"),
    ):
        val = tags.get(src_k)
        if val is not None and str(val).strip() != "":
            extras[dst_k] = str(val).strip()
    return extras


_REFS = None


def _get_refs():
    global _REFS
    if _REFS is None:
        _REFS = vgi_utils.cargar_poligonos_referencia()
    return _REFS


def _procesar_una_capa(args):
    entry, items_list = args
    refs = _get_refs()
    cid = entry["id"]
    tag_spec = entry["tag"]
    cat = entry["categoriaVGI"]
    nombre_corto = entry.get("nombreCorto") or entry["nombre"]
    titulo = entry["nombre"]
    institucion = entry.get("institucion") or "Comunidad OpenStreetMap"
    grupo = entry.get("dimension") or "sociourbana"
    filename = os.path.basename(entry["archivoLocal"])
    cita_apa = f"Atlas para la Gestión Territorial. (2026). {titulo}. OpenStreetMap."

    features = []
    geom_counts = {"Puntos": 0, "Líneas": 0, "Polígonos": 0}
    br_count = 0

    for rank, geom_type_hint, canonical_id, geom_src, tags, is_wkb, source_label in items_list:
        try:
            if is_wkb:
                g_shp = shapely.from_wkb(geom_src)
                geom_dict = g_shp.__geo_interface__
            else:
                geom_dict = geom_src
            res = vgi_utils.procesar_geometria(geom_dict, refs)
            if not res:
                continue
            geom_clean, meta_g, en_br = res
        except Exception:
            continue

        if en_br:
            br_count += 1

        gtype = geom_clean["type"]
        if "Polygon" in gtype:
            geom_counts["Polígonos"] += 1
        elif "LineString" in gtype:
            geom_counts["Líneas"] += 1
        else:
            geom_counts["Puntos"] += 1

        ot, clean_id = canonical_id.split("/", 1)
        id_igv = f"OSM/{ot}/{clean_id}"
        nombre = (
            str(tags.get("name") or "").strip()
            or str(tags.get("official_name") or "").strip()
            or str(tags.get("alt_name") or "").strip()
            or str(tags.get("ref") or "").strip()
            or f"{nombre_corto} ({ot}/{clean_id})"
        )
        operador = (
            str(tags.get("operator") or "").strip()
            or str(tags.get("brand") or "").strip()
            or str(tags.get("network") or "").strip()
            or institucion
        )
        direccion = _formatear_direccion(tags)
        accesibilidad = _formatear_accesibilidad(tags, cat)
        fecha_reg = str(tags.get("check_date") or "2026-11-10")[:10]
        extras = _construir_extras(tags, tag_spec)

        props = vgi_utils.construir_propiedades_vgi(
            id_igv=id_igv,
            categoria=cat,
            subtipo=nombre_corto,
            nombre=nombre,
            operador=operador,
            direccion=direccion,
            accesibilidad=accesibilidad,
            fuente=source_label,
            metodo_adquisicion="Extracción exhaustiva Geofabrik OSM Chile (RM completa + Barrio Brasil)",
            licencia="ODbL 1.0 (Open Data Commons)",
            fecha_registro=fecha_reg,
            meta_g=meta_g,
            capa_id=cid,
            titulo=titulo,
            institucion=institucion,
            grupo=grupo,
            cita_apa=cita_apa,
            extras=extras,
        )
        features.append({"type": "Feature", "geometry": geom_clean, "properties": props})

    meta_header = {
        "capa_id": cid,
        "titulo": titulo,
        "categoria_vgi": cat,
        "tag_osm": tag_spec,
        "total_rm": len(features),
        "total_barrio_brasil": br_count,
        "generado": "2026-11-10",
    }
    vgi_utils.escribir_capa_geojson(filename, features, metadata=meta_header)

    dom_geom = entry["geometria"]
    if features:
        dom_geom = max(geom_counts.items(), key=lambda kv: kv[1])[0]

    return cid, len(features), br_count, dom_geom


def main():
    t0 = time.time()
    _, _, catalog_entries = vgi_utils.cargar_catalogo_vgi()
    osm_entries = [e for e in catalog_entries if not e["tag"].startswith("dwc:")]
    print(f"[INIT] Catálogo OSM individualizado: {len(osm_entries)} capas", flush=True)

    # Construir tabla rápida kv -> [cid, ...] y lista de especiales
    kv_to_cids = {}
    special_cids = []
    entry_by_cid = {e["id"]: e for e in osm_entries}
    for e in osm_entries:
        cid = e["id"]
        tag = e["tag"]
        if cid in SPECIAL_MATCHERS:
            special_cids.append((cid, SPECIAL_MATCHERS[cid]))
        if "=" in tag:
            k, v = tag.split("=", 1)
            kv_to_cids.setdefault((k, v), []).append(cid)

    # Almacén deduplicado por capa: cid -> { canonical_osm_key: record_tuple }
    buckets = {e["id"]: {} for e in osm_entries}

    def add_candidate(cid, canonical_key, geom_type_hint, geom_src, tags, is_wkb, source_label):
        rank = GEOM_RANK.get(geom_type_hint, 1)
        prev = buckets[cid].get(canonical_key)
        # Prioridad a geometría más rica (Polygon/MultiPolygon > LineString > Point) o PBF actual
        if prev is None or rank > prev[0] or (rank == prev[0] and is_wkb and not prev[5]):
            buckets[cid][canonical_key] = (rank, geom_type_hint, canonical_key, geom_src, tags, is_wkb, source_label)

    # 1. Leer los 4 pickles PBF RM (puntos, líneas, multipolígonos, multilíneas)
    pbf_files = [
        ("points.pkl", "Point"),
        ("lines.pkl", "LineString"),
        ("multipolygons.pkl", "Polygon"),
        ("multilinestrings.pkl", "MultiLineString"),
    ]
    total_pbf = 0
    for fn, g_hint in pbf_files:
        fp = os.path.join(PBF_CACHE_DIR, fn)
        if not os.path.exists(fp):
            raise FileNotFoundError(f"Falta caché PBF RM en {fp}")
        arr = pickle.load(open(fp, "rb"))
        total_pbf += len(arr)
        for ot, clean_id, wkb, tags in arr:
            ck = _norm_osm_key(ot, clean_id)
            matched_cids = set()
            for k, v in tags.items():
                cids = kv_to_cids.get((k, v))
                if cids:
                    matched_cids.update(cids)
            for scid, pred in special_cids:
                if pred(tags):
                    matched_cids.add(scid)
            for cid in matched_cids:
                add_candidate(
                    cid, ck, g_hint, wkb, tags, True,
                    "OpenStreetMap (Geofabrik Chile PBF · Nov 2026)"
                )
    print(f"[PBF] Procesados {total_pbf} objetos PBF RM en {time.time()-t0:.1f}s", flush=True)

    # 2. Suplemento limpio cat01 para tags históricos/complementarios (research, dormitory, college)
    cat01_path = os.path.join(DATA_SRC, "capa_osm_rm_cat01_educacion.geojson")
    if os.path.exists(cat01_path):
        cat01 = json.load(open(cat01_path, encoding="utf-8"))
        sub_to_cid = {
            "research": "vgi_centro_de_investigacion",
            "dormitory": "vgi_residencia_universitaria",
            "college": "vgi_instituto_profesional_ip",
        }
        added_cat01 = 0
        for ft in cat01.get("features", []):
            p = ft.get("properties") or {}
            g = ft.get("geometry")
            if not g:
                continue
            sub = str(p.get("subtipo") or "").strip().lower()
            cid = sub_to_cid.get(sub)
            if not cid:
                continue
            ot, clean_id = _parse_id_igv(p.get("id_igv") or p.get("osm_id"), g.get("type", ""))
            ck = _norm_osm_key(ot, clean_id)
            if ck not in buckets[cid]:
                tags_fb = {
                    "name": p.get("nombre") or "",
                    "operator": p.get("operador") or "",
                    "addr:street": p.get("direccion") or "",
                    "check_date": str(p.get("fecha_registro") or "2026-09-27")[:10],
                }
                add_candidate(cid, ck, g.get("type", "Point"), g, tags_fb, False, "OpenStreetMap (Geofabrik RM)")
                added_cat01 += 1
        print(f"[CAT01] Suplemento limpio (research/dormitory/college): +{added_cat01}", flush=True)

    # 3. Suplemento limpio completo_vgi solo para rampas si hay algún ID extra no presente en PBF
    comp_path = os.path.join(DATA_SRC, "capa_osm_rm_completo_vgi.geojson")
    if os.path.exists(comp_path):
        comp = json.load(open(comp_path, encoding="utf-8"))
        added_ramp = 0
        for ft in comp.get("features", []):
            p = ft.get("properties") or {}
            g = ft.get("geometry")
            if not g:
                continue
            sub = str(p.get("subtipo") or "").strip().lower()
            # Nunca admitir subtipo == 'yes'
            if sub == "ramp":
                ot, clean_id = _parse_id_igv(p.get("id_igv") or p.get("osm_id"), g.get("type", ""))
                ck = _norm_osm_key(ot, clean_id)
                if ck not in buckets["vgi_rampa_de_acceso_peatonal_con_pendiente_normada"]:
                    tags_fb = {
                        "name": p.get("nombre") or "",
                        "highway": "ramp",
                        "check_date": str(p.get("fecha_registro") or "2026-09-27")[:10],
                    }
                    add_candidate(
                        "vgi_rampa_de_acceso_peatonal_con_pendiente_normada",
                        ck, g.get("type", "LineString"), g, tags_fb, False,
                        "OpenStreetMap (Geofabrik RM)"
                    )
                    added_ramp += 1
        print(f"[COMPLETO] Suplemento rampas limpias: +{added_ramp}", flush=True)

    # 4. Escribir en paralelo todas las 119 capas GeoJSON en src/data/ y data/
    tasks = [(entry_by_cid[cid], list(buckets[cid].values())) for cid in entry_by_cid]
    tasks.sort(key=lambda x: len(x[1]), reverse=True)

    actualizaciones = {}
    with ProcessPoolExecutor(max_workers=4) as pool:
        for i, (cid, n_rm, n_br, dom_geom) in enumerate(pool.map(_procesar_una_capa, tasks), 1):
            actualizaciones[cid] = {
                "totalEntidades": n_rm,
                "rm_count": n_rm,
                "br_count": n_br,
                "geometria": dom_geom,
            }
            if i % 20 == 0 or n_rm >= 5000 or n_rm == 0:
                print(f"[{i:03d}/119] {cid:56s} | RM={n_rm:6d} | BB={n_br:5d} | {dom_geom}", flush=True)

    updated = vgi_utils.actualizar_catalogo_vgi_js(actualizaciones)
    print(f"[DONE] 119 capas OSM descentralizadas y catálogo actualizado ({updated} entradas) en {time.time()-t0:.1f}s", flush=True)


if __name__ == "__main__":
    main()
