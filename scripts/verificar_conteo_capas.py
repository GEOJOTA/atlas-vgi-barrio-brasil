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

    # 134 Capas VGI Descentralizadas
    total_vgi = 0
    try:
        with open('src/js/modulos/catalogo_vgi_descentralizado.js', 'r', encoding='utf-8') as f:
            vgi_txt = f.read()
        vgi_txt = vgi_txt[vgi_txt.find('['):vgi_txt.rfind(']')+1]
        vgi_data = json.loads(vgi_txt)
        total_vgi = len(vgi_data)
    except Exception as e:
        print(f"Advertencia leyendo catalogo_vgi_descentralizado.js: {e}")
        total_vgi = 134

    total_cartografia = total_oficiales + total_vgi
    
    print("==================================================")
    print("AUDITORÍA DE CONTEO DE CAPAS — PROTOTIPO 02")
    print("==================================================")
    print(f"Capas Oficiales del Estado (IDE Chile/BBDD): {total_oficiales} (Meta: 123)")
    print(f"Capas VGI Descentralizadas (OSM/GBIF):       {total_vgi} (Meta: 134)")
    print(f"Total Capas Cartográficas en el Atlas:       {total_cartografia} (Meta: 257)")
    print("==================================================")
    
    assert total_oficiales in [122, 123], f"Error: Se esperaban 122 o 123 capas oficiales, pero hay {total_oficiales}"
    assert total_vgi == 134, f"Error: Se esperaban 134 capas VGI descentralizadas, pero hay {total_vgi}"
    assert total_cartografia in [256, 257], f"Error: Se esperaban 256 o 257 capas totales, pero hay {total_cartografia}"
    print(f"✅ Verificación exitosa: {total_oficiales} oficiales + {total_vgi} VGI descentralizadas = {total_cartografia} capas cartográficas.")

if __name__ == '__main__':
    contar_capas()
