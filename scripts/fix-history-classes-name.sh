#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TS="$(date +%Y%m%d-%H%M%S)"
LOG_DIR="$ROOT/logs/fix-history-$TS"
BK_DIR="$LOG_DIR/backups"
mkdir -p "$LOG_DIR" "$BK_DIR"

log(){ echo "[$(date +%H:%M:%S)] $*"; }

# Encuentra el archivo route.ts (sirve si estás parado en repo root o dentro de src/)
HISTORY_ROUTE=""
for CAND in \
  "src/app/api/athlete/history/route.ts" \
  "app/api/athlete/history/route.ts" \
  "../src/app/api/athlete/history/route.ts" \
  "../app/api/athlete/history/route.ts"
do
  if [[ -f "$CAND" ]]; then
    HISTORY_ROUTE="$CAND"
    break
  fi
done

if [[ -z "${HISTORY_ROUTE}" ]]; then
  echo "ERROR: No encuentro el history route.ts. Busqué en:"
  echo "  - src/app/api/athlete/history/route.ts"
  echo "  - app/api/athlete/history/route.ts"
  exit 1
fi

log "History route: $HISTORY_ROUTE"
mkdir -p "$BK_DIR/$(dirname "$HISTORY_ROUTE")"
cp -a "$HISTORY_ROUTE" "$BK_DIR/$HISTORY_ROUTE"

log "Patching select() para no pedir classes.name (que no existe)..."

python3 - <<PY
from pathlib import Path
import re

p = Path("${HISTORY_ROUTE}")
s = p.read_text(encoding="utf-8")

orig = s

# 1) Reemplazo directo: classes(name) -> classes(program_id, day, time, programs(name))
#    (incluye variantes con espacios y alias tipo class:classes(...))
def repl_classes_block(m):
    inside = m.group(1)
    # si ya no contiene "name" solo devolvemos igual
    if re.search(r'\\bname\\b', inside) is None:
        return m.group(0)
    # Construimos un bloque seguro (sin name)
    return "classes(program_id, day, time, programs(name))"

# Reemplaza exactamente "classes(...)" cuando dentro haya name
s = re.sub(r'classes\\(([^)]*)\\)', lambda m: repl_classes_block(m), s)

# 2) Por si estaba como alias: class:classes(name) o classes:classes(name)
#    Ya queda cubierto por el regex anterior, pero lo dejamos por seguridad.

# Limpieza: quitar bytes NUL por si turbopack se queja
s = s.replace("\\x00", "")

if s == orig:
    print("WARN: No vi un 'classes(name)' claro para reemplazar. Igual guardo (solo NUL clean si había).")
else:
    print("OK: Reemplacé selects con classes.name -> programs.name")

p.write_text(s, encoding="utf-8")
PY

log "Build check..."
( npm run build ) 2>&1 | tee "$LOG_DIR/build.log"

log "DONE ✅"
echo "Backups: $BK_DIR"
echo "Build log: $LOG_DIR/build.log"
