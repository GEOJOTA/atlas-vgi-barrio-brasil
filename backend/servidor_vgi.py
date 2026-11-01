#!/usr/bin/env python3
"""
backend/servidor_vgi.py
-----------------------
Servidor backend local para el Atlas de Información Geográfica Voluntaria.
Permite ejecutar la plataforma en local sirviendo la interfaz web y resolviendo
las peticiones a /api/consulta y /api/calidad con reintentos en servidores espejo,
soporte SSL para macOS y caché en disco.

No requiere pip install (utiliza únicamente la biblioteca estándar de Python 3).

Uso:
  python3 backend/servidor_vgi.py
  # Abre automáticamente: http://localhost:8000
"""

import os
import sys
import json
import ssl
import urllib.request
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
import hashlib
import math

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE_DIR, "src")
DATA_DIR = os.path.join(BASE_DIR, "data")
CACHE_DIR = os.path.join(DATA_DIR, "cache_consultas")
os.makedirs(CACHE_DIR, exist_ok=True)

PUERTO = 8000

OVERPASS_ESPEJOS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter"
]

try:
    SSL_CTX = ssl._create_unverified_context()
except Exception:
    SSL_CTX = None

# Parámetros geodésicos WGS 84 / UTM Huso 19 Sur (EPSG:32719)
A_WGS84 = 6378137.0
F_WGS84 = 1.0 / 298.257223563
E2 = 2.0 * F_WGS84 - F_WGS84 * F_WGS84
E_PRIME2 = E2 / (1.0 - E2)
K0 = 0.9996
FALSO_ESTE = 500000.0
FALSO_NORTE = 10000000.0
MERIDIANO_CENTRAL_19S = -69.0

def wgs84_a_utm19s(lon, lat):
    """
    Reproyecta coordenadas geográficas WGS84 a planas métricas UTM 19S (EPSG:32719).
    Ecuaciones conformes de Transverse Mercator (Snyder, 1987).
    """
    phi = math.radians(lat)
    lam = math.radians(lon)
    lam0 = math.radians(MERIDIANO_CENTRAL_19S)
    delta_lam = lam - lam0

    sin_phi = math.sin(phi)
    cos_phi = math.cos(phi)
    tan_phi = math.tan(phi)

    N = A_WGS84 / math.sqrt(1.0 - E2 * sin_phi * sin_phi)
    T = tan_phi * tan_phi
    C = E_PRIME2 * cos_phi * cos_phi
    A = cos_phi * delta_lam

    M = A_WGS84 * (
        (1.0 - E2 / 4.0 - 3.0 * E2 * E2 / 64.0 - 5.0 * E2 * E2 * E2 / 256.0) * phi
        - (3.0 * E2 / 8.0 + 3.0 * E2 * E2 / 32.0 + 45.0 * E2 * E2 * E2 / 1024.0) * math.sin(2.0 * phi)
        + (15.0 * E2 * E2 / 256.0 + 45.0 * E2 * E2 * E2 / 1024.0) * math.sin(4.0 * phi)
        - (35.0 * E2 * E2 * E2 / 3072.0) * math.sin(6.0 * phi)
    )

    este = FALSO_ESTE + K0 * N * (
        A
        + (1.0 - T + C) * (A ** 3) / 6.0
        + (5.0 - 18.0 * T + T * T + 72.0 * C - 58.0 * E_PRIME2) * (A ** 5) / 120.0
    )

    norte = FALSO_NORTE + K0 * (
        M + N * tan_phi * (
            (A ** 2) / 2.0
            + (5.0 - T + 9.0 * C + 4.0 * C * C) * (A ** 4) / 24.0
            + (61.0 - 58.0 * T + T * T + 600.0 * C - 330.0 * E_PRIME2) * (A ** 6) / 720.0
        )
    )

    return este, norte

def calcular_superficie_poligono(coords_lon_lat):
    """
    Calcula el área métrica plana de un polígono cerrado reprojectando a EPSG:32719 y aplicando Gauss.
    """
    if not coords_lon_lat or len(coords_lon_lat) < 3:
        return {"areaM2": 0.0, "areaHa": 0.0, "areaKm2": 0.0, "srs": "EPSG:32719"}
    coords_utm = [wgs84_a_utm19s(pt[0], pt[1]) for pt in coords_lon_lat]
    suma = 0.0
    n = len(coords_utm)
    for i in range(n - 1):
        suma += (coords_utm[i][0] * coords_utm[i + 1][1]) - (coords_utm[i + 1][0] * coords_utm[i][1])
    area_m2 = abs(suma) / 2.0
    return {
        "areaM2": round(area_m2, 1),
        "areaHa": round(area_m2 / 10000.0, 3),
        "areaKm2": round(area_m2 / 1000000.0, 6),
        "srs": "EPSG:32719 (WGS 84 / UTM Huso 19 Sur)"
    }

def calcular_superficie_bbox(bbox):
    """
    Calcula superficie métrica de un Bbox proyectando sus 4 esquinas a EPSG:32719 y evaluando con Gauss.
    """
    oeste, sur, este, norte = bbox
    p1 = wgs84_a_utm19s(oeste, sur)
    p2 = wgs84_a_utm19s(este, sur)
    p3 = wgs84_a_utm19s(este, norte)
    p4 = wgs84_a_utm19s(oeste, norte)
    vertices = [p1, p2, p3, p4, p1]
    suma = 0.0
    for i in range(4):
        suma += (vertices[i][0] * vertices[i + 1][1]) - (vertices[i + 1][0] * vertices[i][1])
    area_m2 = abs(suma) / 2.0
    return {
        "areaM2": round(area_m2),
        "areaHa": round(area_m2 / 10000.0, 2),
        "areaKm2": round(area_m2 / 1000000.0, 4),
        "srs": "EPSG:32719 (WGS 84 / UTM Huso 19 Sur)"
    }

class ManejadorVGI(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SRC_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/consulta":
            self.manejar_consulta()
        elif self.path == "/api/calidad":
            self.manejar_calidad()
        else:
            self.send_error(404, "Endpoint de API no encontrado")

    def do_GET(self):
        if self.path in ("/", ""):
            self.path = "/index.html"

        # Servir datos estáticos adicionales de data/ o docs/ si se solicitan
        if self.path.startswith("/data/"):
            archivo = os.path.join(BASE_DIR, self.path.lstrip("/"))
            if not os.path.isfile(archivo):
                archivo = os.path.join(SRC_DIR, self.path.lstrip("/"))
            if os.path.isfile(archivo):
                self.servir_archivo_externo(archivo, "application/geo+json")
                return
        elif self.path.startswith("/config/"):
            archivo = os.path.join(SRC_DIR, self.path.lstrip("/"))
            if not os.path.isfile(archivo):
                archivo = os.path.join(BASE_DIR, self.path.lstrip("/"))
            if os.path.isfile(archivo):
                self.servir_archivo_externo(archivo, "application/json; charset=utf-8")
                return
        elif self.path.startswith("/docs/"):
            archivo = os.path.join(BASE_DIR, self.path.lstrip("/"))
            if os.path.isfile(archivo):
                self.servir_archivo_externo(archivo, "application/octet-stream")
                return
        elif self.path == "/api/estado":
            self.responder_json(200, {
                "estado": "operativo",
                "servidor": "Atlas VGI Backend Local (Python 3)",
                "puerto": PUERTO,
                "endpoints_espejo_overpass": len(OVERPASS_ESPEJOS),
                "cache_activa": True
            })
            return

        super().do_GET()

    def servir_archivo_externo(self, ruta, mime_type):
        try:
            with open(ruta, "rb") as f:
                contenido = f.read()
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(len(contenido)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(contenido)
        except Exception as e:
            self.send_error(500, f"Error leyendo archivo: {e}")

    def responder_json(self, status, objeto):
        cuerpo = json.dumps(objeto, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(cuerpo)

    def leer_body_json(self):
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return {}

    def manejar_consulta(self):
        body = self.leer_body_json()
        bbox = body.get("bbox")
        if not bbox or len(bbox) != 4:
            self.responder_json(400, {"error": "Se requiere bbox [oeste, sur, este, norte]"})
            return

        oeste, sur, este, norte = bbox
        bbox_str = f"{sur},{oeste},{norte},{este}"

        clave = body.get("clave", "")
        valor = body.get("valor", "")
        operador = body.get("operador", "=")
        entidad = body.get("entidad", "nwr")
        ql_custom = body.get("queryPersonalizada", "")

        if ql_custom:
            ql_limpio = ql_custom.replace("{{bbox}}", bbox_str).strip()
            if any(token in ql_limpio for token in ["[out:", "out ", "out;"]):
                if "[out:json]" not in ql_limpio:
                    ql_limpio = f"[out:json][timeout:30];\n{ql_limpio}"
                if "out " not in ql_limpio and "out;" not in ql_limpio:
                    ql_limpio = f"{ql_limpio}\nout geom tags qt 400;"
                query_overpass = ql_limpio
            else:
                query_overpass = f"""
                [out:json][timeout:30];
                (
                  {ql_limpio}
                );
                out geom tags qt 400;
                """
        else:
            if clave and valor and valor != "*":
                if operador == "~":
                    filtro = f'["{clave}"~"{valor}"]'
                elif operador == "!=":
                    filtro = f'["{clave}"!="{valor}"]'
                else:
                    filtro = f'["{clave}"="{valor}"]'
            elif clave:
                filtro = f'["{clave}"]'
            else:
                filtro = '["amenity"]'
            query_overpass = f"""
            [out:json][timeout:30];
            (
              {entidad}{filtro}({bbox_str});
            );
            out geom tags qt 400;
            """

        # Verificar caché en disco
        clave_cache = hashlib.md5(query_overpass.encode("utf-8")).hexdigest()
        archivo_cache = os.path.join(CACHE_DIR, f"{clave_cache}.json")

        if os.path.isfile(archivo_cache):
            try:
                with open(archivo_cache, "r", encoding="utf-8") as f:
                    datos_cache = json.load(f)
                self.responder_json(200, {
                    "ok": True,
                    "desdeCache": True,
                    "total": datos_cache.get("total", 0),
                    "geojson": datos_cache.get("geojson", {}),
                    "servidor": "Caché local"
                })
                return
            except Exception:
                pass

        # Consultar espejos
        data_encoded = urllib.parse.urlencode({"data": query_overpass}).encode("utf-8")
        elementos = None
        servidor_usado = None

        for srv in OVERPASS_ESPEJOS:
            try:
                req = urllib.request.Request(
                    srv,
                    data=data_encoded,
                    headers={"User-Agent": "AtlasVGI-LocalBackend/1.0"}
                )
                with urllib.request.urlopen(req, timeout=12, context=SSL_CTX) as res:
                    if res.status == 200:
                        data = json.loads(res.read().decode("utf-8"))
                        elementos = data.get("elements", [])
                        servidor_usado = srv
                        break
            except Exception as e:
                print(f"[!] Falló espejo {srv}: {e}")
                continue

        if elementos is None:
            # Contingencia local en disco si Overpass está inaccesible
            clave_candidata = body.get("categoria") or body.get("etiqueta") or body.get("clave", "")
            for ruta_candidata in [
                os.path.join(DATA_DIR, f"capa_{clave_candidata}.geojson"),
                os.path.join(SRC_DIR, "data", f"capa_{clave_candidata}.geojson"),
                os.path.join(DATA_DIR, "atlas_vgi_barrio_brasil_uah_completo.geojson"),
                os.path.join(SRC_DIR, "data", "atlas_vgi_barrio_brasil_uah_completo.geojson")
            ]:
                if os.path.isfile(ruta_candidata):
                    try:
                        with open(ruta_candidata, "r", encoding="utf-8") as f:
                            gj_local = json.load(f)
                        self.responder_json(200, {
                            "ok": True,
                            "desdeCache": True,
                            "servidor": "Catálogo local de contingencia (Barrio Brasil / UAH)",
                            "total": len(gj_local.get("features", [])),
                            "geojson": gj_local,
                            "consulta": query_overpass
                        })
                        return
                    except Exception:
                        pass
            self.responder_json(502, {"ok": False, "error": "Overpass temporalmente no disponible en todos los espejos"})
            return

        geojson = self.elementos_a_geojson(elementos, body.get("nombreConsulta", "personalizada"))

        # Guardar en caché
        try:
            with open(archivo_cache, "w", encoding="utf-8") as f:
                json.dump({"total": len(elementos), "geojson": geojson}, f, ensure_ascii=False)
        except Exception:
            pass

        self.responder_json(200, {
            "ok": True,
            "desdeCache": False,
            "servidor": servidor_usado,
            "total": len(elementos),
            "geojson": geojson,
            "consulta": query_overpass
        })

    def manejar_calidad(self):
        body = self.leer_body_json()
        bbox = body.get("bbox")
        filtro = body.get("filtro", "building=* and type:way")

        if not bbox or len(bbox) != 4:
            self.responder_json(400, {"error": "Bbox requerido"})
            return

        intervalo = body.get("intervalo", "P1Y")
        version = body.get("version", "v1")
        api_key = body.get("apiKey", "")

        base_v1 = "https://api.ohsome.org/v1"
        base_v2 = "https://api.heigit.org/ohsome-api/v2-rc"
        bboxes_str = ",".join(str(x) for x in bbox)
        user_agent = "AtlasVGI-UAH/2.0 (nodo.geoabierto@uahurtado.cl)"

        def extraer_items(obj):
            if not obj:
                return []
            if isinstance(obj, list):
                return obj
            if isinstance(obj, dict):
                if "result" in obj and isinstance(obj["result"], list):
                    return obj["result"]
                if "data" in obj and isinstance(obj["data"], list):
                    return obj["data"]
            return []

        # Intentar caché en disco si existe
        cache_key = hashlib.md5(f"{bboxes_str}_{filtro}_{intervalo}_{version}".encode("utf-8")).hexdigest()
        cache_path = os.path.join(CACHE_DIR, f"calidad_{cache_key}.json")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                    self.responder_json(200, cached_data)
                    return
            except Exception:
                pass

        try:
            # Obtener fecha máxima con timeout seguro
            meta_req = urllib.request.Request(f"{base_v1}/metadata", headers={"User-Agent": user_agent})
            with urllib.request.urlopen(meta_req, timeout=6, context=SSL_CTX) as res:
                meta = json.loads(res.read().decode("utf-8"))
                fecha_fin = meta.get("extractRegion", {}).get("temporalExtent", {}).get("toTimestamp", "2026-06-01")[:10]
        except Exception:
            fecha_fin = "2026-06-01"

        anio_fin = int(fecha_fin[:4])
        fecha_inicio = f"{anio_fin - 5}-01-01"
        if intervalo == "P1M":
            fecha_inicio = f"{anio_fin - 1}-{fecha_fin[5:]}"
        elif intervalo == "P6M":
            fecha_inicio = f"{anio_fin - 3}-01-01"

        ventana = f"{fecha_inicio}/{fecha_fin}/{intervalo}"

        def post_ohsome(endpoint, time_param, usar_v2=False):
            base = base_v2 if usar_v2 else base_v1
            p = urllib.parse.urlencode({
                "bboxes": bboxes_str,
                "filter": filtro,
                "time": time_param
            }).encode("utf-8")
            headers = {"User-Agent": user_agent}
            if usar_v2 and api_key:
                token = api_key.strip()
                auth_val = token if token.startswith("Bearer ") else f"Bearer {token}"
                headers["Authorization"] = auth_val
                headers["apiKey"] = token.replace("Bearer ", "")

            req = urllib.request.Request(f"{base}{endpoint}", data=p, headers=headers)
            with urllib.request.urlopen(req, timeout=12, context=SSL_CTX) as res:
                return json.loads(res.read().decode("utf-8"))

        try:
            f_lower = filtro.lower()
            tipo_geo = "punto"
            if any(k in f_lower for k in ["highway", "cycleway", "footway", "waterway", "railway", "path", "track"]):
                tipo_geo = "linea"
            elif any(k in f_lower for k in ["building", "leisure", "landuse", "boundary"]):
                tipo_geo = "poligono"

            conteo = None
            usuarios = None
            serie = None
            res_especial = None
            res_contrib = None
            version_real = "v1"
            motor_real = "OSHDB (HeiGIT Java Engine)"
            fue_fallback = False

            if version == "v2":
                try:
                    conteo = post_ohsome("/stats/features/count", fecha_fin, usar_v2=True)
                    try:
                        usuarios = post_ohsome("/stats/contributors/count", ventana, usar_v2=True)
                    except Exception:
                        usuarios = None
                    try:
                        serie = post_ohsome("/stats/features/count", ventana, usar_v2=True)
                    except Exception:
                        serie = None
                    if tipo_geo == "linea":
                        try:
                            res_especial = post_ohsome("/stats/features/length", fecha_fin, usar_v2=True)
                        except Exception:
                            res_especial = None
                    elif tipo_geo == "poligono":
                        try:
                            res_especial = post_ohsome("/stats/features/area", fecha_fin, usar_v2=True)
                        except Exception:
                            res_especial = None
                    try:
                        res_contrib = post_ohsome("/stats/contributors/count", ventana, usar_v2=True)
                    except Exception:
                        res_contrib = None

                    if conteo and extraer_items(conteo):
                        version_real = "v2"
                        motor_real = "ohsomeDB (PostgreSQL / Citus / Python)"
                    else:
                        conteo = None
                except Exception as err_v2:
                    print(f"[!] Consulta ohsome v2 falló ({err_v2}), ejecutando fallback a v1")
                    fue_fallback = True
                    conteo = None

            if conteo is None:
                conteo = post_ohsome("/elements/count", fecha_fin, usar_v2=False)
                try:
                    usuarios = post_ohsome("/users/count", ventana, usar_v2=False)
                except Exception:
                    usuarios = None
                try:
                    serie = post_ohsome("/elements/count", ventana, usar_v2=False)
                except Exception:
                    serie = None
                if tipo_geo == "linea":
                    try:
                        res_especial = post_ohsome("/elements/length", fecha_fin, usar_v2=False)
                    except Exception:
                        res_especial = None
                elif tipo_geo == "poligono":
                    try:
                        res_especial = post_ohsome("/elements/area", fecha_fin, usar_v2=False)
                    except Exception:
                        res_especial = None
                try:
                    res_contrib = post_ohsome("/contributions/count", ventana, usar_v2=False)
                except Exception:
                    res_contrib = None

            items_conteo = extraer_items(conteo)
            elem_ahora = int(items_conteo[0].get("value", 0)) if items_conteo else 0

            sup_bbox = calcular_superficie_bbox(bbox)
            area_calc = sup_bbox["areaKm2"]
            area_m2 = sup_bbox["areaM2"]
            area_ha = sup_bbox["areaHa"]
            densidad_calc = round(elem_ahora / area_calc, 2) if area_calc > 0 else None
            densidad_m2 = round(elem_ahora / area_m2, 6) if area_m2 > 0 else None
            densidad_ha = round(elem_ahora / area_ha, 4) if area_ha > 0 else None

            metrica_geom = None
            items_especial = extraer_items(res_especial)
            if tipo_geo == "linea" and items_especial:
                val_m = items_especial[0].get("value", 0)
                metrica_geom = {"tipo": "longitud", "etiqueta": "Longitud de red trazada", "valorM": round(val_m), "valorKm": round(val_m / 1000, 2), "unidad": "km"}
            elif tipo_geo == "poligono" and items_especial:
                val_m2 = items_especial[0].get("value", 0)
                metrica_geom = {"tipo": "superficie", "etiqueta": "Superficie total cubierta", "valorM2": round(val_m2), "valorHa": round(val_m2 / 10000, 2), "valorKm2": round(val_m2 / 1000000, 4), "unidad": "m²"}

            lista_usr = [{"fecha": (r.get("fromTimestamp") or r.get("timestamp") or "")[:10], "valor": int(r.get("value", 0))} for r in extraer_items(usuarios)]
            lista_contrib = [{"fecha": (r.get("fromTimestamp") or r.get("timestamp") or "")[:10], "valor": int(r.get("value", 0))} for r in extraer_items(res_contrib)]
            ult_usr = lista_usr[-1]["valor"] if lista_usr else 0
            ult_ctb = lista_contrib[-1]["valor"] if lista_contrib else 0
            ratio = round(ult_ctb / ult_usr, 1) if ult_usr > 0 else None

            lista_serie = [{"fecha": (r.get("fromTimestamp") or r.get("timestamp") or "")[:10], "valor": int(r.get("value", 0))} for r in extraer_items(serie)]

            respuesta_final = {
                "ok": True,
                "version": version_real,
                "motor": motor_real,
                "fueFallback": fue_fallback,
                "fechaCorte": fecha_fin,
                "tipoGeometria": tipo_geo,
                "elementosAhora": elem_ahora,
                "metricaGeometrica": metrica_geom,
                "densidad": densidad_calc,
                "densidad_m2": densidad_m2,
                "densidad_ha": densidad_ha,
                "areaKm2": round(area_calc, 4),
                "areaHa": sup_bbox["areaHa"],
                "areaM2": sup_bbox["areaM2"],
                "srs": sup_bbox["srs"],
                "reproyeccion_aplicada": "EPSG:32719 (WGS 84 / UTM Huso 19 Sur - Transverse Mercator)",
                "ratioContribucionPorUsuario": ratio,
                "usuariosPorAnio": lista_usr,
                "elementosPorAnio": lista_serie,
                "contribucionesPorAnio": lista_contrib,
                "referencias": [
                    {"autor": "HeiGIT / Heidelberg University", "url": "https://docs.ohsome.org/ohsome-api/v1/"},
                    {"autor": "Raifer et al. (2019)", "doi": "10.1186/s40965-019-0061-3"}
                ]
            }

            # Guardar en caché
            try:
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump(respuesta_final, f, ensure_ascii=False)
            except Exception:
                pass

            self.responder_json(200, respuesta_final)
        except Exception as e:
            self.responder_json(500, {"ok": False, "error": str(e)})

    def elementos_a_geojson(self, elementos, nombre):
        features = []
        for el in elementos:
            tags = el.get("tags", {})
            el_type = el.get("type", "node")
            el_id = el.get("id")
            geometria = None

            if el_type == "node":
                lat = el.get("lat")
                lon = el.get("lon")
                if lat is not None and lon is not None:
                    geometria = {"type": "Point", "coordinates": [lon, lat]}
            elif el_type == "way":
                geom = el.get("geometry", [])
                if geom and len(geom) >= 2:
                    coords = [[p["lon"], p["lat"]] for p in geom if "lat" in p and "lon" in p]
                    es_cerrado = len(coords) >= 4 and abs(coords[0][0] - coords[-1][0]) < 1e-6 and abs(coords[0][1] - coords[-1][1]) < 1e-6
                    es_poligono = es_cerrado and any([
                        "building" in tags, "leisure" in tags, "landuse" in tags,
                        "amenity" in tags, "historic" in tags, tags.get("natural") in ("wood", "scrub"),
                        "shop" in tags, tags.get("area") == "yes"
                    ])
                    if es_poligono:
                        geometria = {"type": "Polygon", "coordinates": [coords]}
                    else:
                        geometria = {"type": "LineString", "coordinates": coords}
                elif "center" in el:
                    c = el["center"]
                    geometria = {"type": "Point", "coordinates": [c["lon"], c["lat"]]}
            elif "center" in el:
                c = el["center"]
                geometria = {"type": "Point", "coordinates": [c["lon"], c["lat"]]}

            if not geometria:
                continue

            sup_info = None
            if geometria["type"] == "Polygon" and coords:
                sup_info = calcular_superficie_poligono(coords)

            nom = tags.get("name") or tags.get("name:es") or tags.get("description") or "Sin denominación"
            subtipo = tags.get("amenity") or tags.get("shop") or tags.get("highway") or tags.get("leisure") or tags.get("historic") or tags.get("building") or tags.get("railway") or "Elemento VGI"
            features.append({
                "type": "Feature",
                "id": f"{el_type}/{el_id}",
                "geometry": geometria,
                "properties": {
                    "id_vgi": f"OSM/{el_type}/{el_id}",
                    "osm_type": el_type,
                    "osm_id": el_id,
                    "tipo_geometria": geometria["type"],
                    "subtipo": subtipo,
                    "nombre": nom,
                    "operador": tags.get("operator"),
                    "direccion": f"{tags.get('addr:street', '')} {tags.get('addr:housenumber', '')}".strip() or None,
                    "accesibilidad": tags.get("wheelchair"),
                    "superficie_m2": sup_info["areaM2"] if sup_info else None,
                    "superficie_ha": sup_info["areaHa"] if sup_info else None,
                    "superficie_km2": sup_info["areaKm2"] if sup_info else None,
                    "srs_superficie": sup_info["srs"] if sup_info else None,
                    "fuente": "OpenStreetMap",
                    "licencia": "ODbL 1.0",
                    "tags": tags
                }
            })
        return {
            "type": "FeatureCollection",
            "name": f"Consulta_{nombre}",
            "features": features
        }

def iniciar():
    os.chdir(SRC_DIR)
    servidor = HTTPServer(("127.0.0.1", PUERTO), ManejadorVGI)
    print("==========================================================================")
    print("   ATLAS DE INFORMACIÓN GEOGRÁFICA VOLUNTARIA — BACKEND LOCAL OPERATIVO")
    print("==========================================================================")
    print(f"[*] Servidor web y API disponible en: http://localhost:{PUERTO}")
    print(f"[*] API /api/consulta: Consultas espaciales Overpass activas")
    print(f"[*] API /api/calidad: Métricas históricas ohsome activas")
    print(f"[*] Caché de consultas en: {CACHE_DIR}")
    print("Presiona Ctrl+C para detener el servidor.\n")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Deteniendo servidor...")
        servidor.server_close()

if __name__ == "__main__":
    iniciar()
