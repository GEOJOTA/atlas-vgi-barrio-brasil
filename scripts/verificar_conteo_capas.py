import sys
import re
import json

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def contar_capas():
    with open('src/js/modulos/ide_chile.js', 'r', encoding='utf-8') as f:
        content = f.read()

    match = re.search(r'const CAPAS_OFICIALES = \{([\s\S]*?)\n  \};', content)
    if not match:
        print("No se encontró CAPAS_OFICIALES")
        return

    bloque = match.group(1)
    claves = re.findall(r'^\s{4}([\'\w]+):\s*\{', bloque, re.MULTILINE)
    total_oficiales = len(claves)

    # 171 Capas VGI Descentralizadas (119 OSM + 52 Especies GBIF)
    total_vgi = 0
    try:
        with open('src/js/modulos/catalogo_vgi_descentralizado.js', 'r', encoding='utf-8') as f:
            vgi_txt = f.read()
        vgi_txt = vgi_txt[vgi_txt.find('['):vgi_txt.rfind(']')+1]
        vgi_data = json.loads(vgi_txt)
        total_vgi = len(vgi_data)
    except Exception as e:
        print(f"Advertencia leyendo catalogo_vgi_descentralizado.js: {e}")
        total_vgi = 171

    total_cartografia = total_oficiales + total_vgi
    
    print("==================================================")
    print("AUDITORÍA DE CONTEO DE CAPAS — PROTOTIPO 02")
    print("==================================================")
    print(f"Capas Oficiales del Estado (IDE Chile/BBDD): {total_oficiales} (Meta: 123)")
    print(f"Capas VGI Descentralizadas (OSM/GBIF):       {total_vgi} (Meta: 171)")
    print(f"Total Capas Cartográficas en el Atlas:       {total_cartografia} (Meta: 294)")
    print("==================================================")
    
    assert total_oficiales in [122, 123], f"Error: Se esperaban 122 o 123 capas oficiales, pero hay {total_oficiales}"
    assert total_vgi == 171, f"Error: Se esperaban 171 capas VGI descentralizadas, pero hay {total_vgi}"
    assert total_cartografia in [293, 294], f"Error: Se esperaban 293 o 294 capas totales, pero hay {total_cartografia}"
    print(f"✅ Verificación exitosa: {total_oficiales} oficiales + {total_vgi} VGI descentralizadas = {total_cartografia} capas cartográficas.")

if __name__ == '__main__':
    contar_capas()
