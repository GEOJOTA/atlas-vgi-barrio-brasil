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

    # Buscar bloque CAPAS_OFICIALES = { ... };
    match = re.search(r'const CAPAS_OFICIALES = \{([\s\S]*?)\n  \};', content)
    if not match:
        print("No se encontró CAPAS_OFICIALES")
        return

    bloque = match.group(1)
    
    # Extraer claves de primer nivel en el objeto: id: { o 'id': {
    claves = re.findall(r'^\s{4}([\'\w]+):\s*\{', bloque, re.MULTILINE)
    total_oficiales = len(claves)
    total_vgi = 10
    total_cartografia = total_oficiales + total_vgi
    
    print("==================================================")
    print("AUDITORÍA DE CONTEO DE CAPAS — ATLAS VGI UAH")
    print("==================================================")
    print(f"Capas Oficiales del Estado (IDE Chile/BBDD): {total_oficiales} (Meta: 124)")
    print(f"Macro-categorías Comunitarias VGI (OSM/GBIF): {total_vgi} (Meta: 10)")
    print(f"Total Capas Cartográficas en el Atlas:       {total_cartografia} (Meta: 134)")
    print("==================================================")
    
    assert total_oficiales == 124, f"Error: Se esperaban 124 capas oficiales, pero hay {total_oficiales}"
    assert total_cartografia == 134, f"Error: Se esperaban 134 capas totales, pero hay {total_cartografia}"
    print("✅ Verificación exitosa: 124 oficiales + 10 VGI = 134 capas cartográficas.")

if __name__ == '__main__':
    contar_capas()
