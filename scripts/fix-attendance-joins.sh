#!/usr/bin/env bash
set -euo pipefail

BASE="src"
COACH_ROUTE="$BASE/app/api/coach/attendance/route.ts"
STAFF_ROUTE="$BASE/app/api/staff/attendance/route.ts"

for f in "$COACH_ROUTE" "$STAFF_ROUTE"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: no existe $f (corré el script desde la raiz del repo)"
    exit 1
  fi
done

ts() { date +"%Y%m%d-%H%M%S"; }
BK="logs/backups/attendance-fix-$(ts)"
mkdir -p "$BK/$(dirname "$COACH_ROUTE")" "$BK/$(dirname "$STAFF_ROUTE")"
cp "$COACH_ROUTE" "$BK/$COACH_ROUTE"
cp "$STAFF_ROUTE" "$BK/$STAFF_ROUTE"
echo "Backups en: $BK"

python3 - <<PY
import re
from pathlib import Path

coach_path = Path("$COACH_ROUTE")
staff_path = Path("$STAFF_ROUTE")

def patch_select_block(s: str) -> str:
    # Reemplaza: classes:classes ( id, name, coach, type )
    # por: classes:classes ( id, program:programs(name), coach_profile:profiles(full_name, email) )
    s = re.sub(
        r"classes:classes\s*\(\s*id\s*,\s*name\s*,\s*coach\s*,\s*type\s*\)",
        "classes:classes ( id, program:programs(name), coach_profile:profiles(full_name, email) )",
        s,
    )
    return s

def patch_output_mapping(s: str) -> str:
    # Cambia donde se arma class: { name, coach, type } desde s.classes?.name etc.
    # a program/coaches.
    # 1) name: String(s.classes?.name || "")
    s = re.sub(
        r'name:\s*String\(\s*s\.classes\?\.\s*name\s*\|\|\s*""\s*\)',
        'name: String((s.classes as any)?.program?.name || "")',
        s
    )

    # 2) coach: String(s.classes?.coach || "")
    # => full_name o email
    s = re.sub(
        r'coach:\s*String\(\s*s\.classes\?\.\s*coach\s*\|\|\s*""\s*\)',
        'coach: String((s.classes as any)?.coach_profile?.full_name || (s.classes as any)?.coach_profile?.email || "")',
        s
    )

    # 3) type: String(s.classes?.type || "")
    # => usamos el mismo program name (o vacío)
    s = re.sub(
        r'type:\s*String\(\s*s\.classes\?\.\s*type\s*\|\|\s*""\s*\)',
        'type: String((s.classes as any)?.program?.name || "")',
        s
    )

    return s

def apply(path: Path):
    original = path.read_text(encoding="utf-8")
    s = original

    s = patch_select_block(s)
    s = patch_output_mapping(s)

    # limpia NULs por las dudas
    s = s.replace("\x00","")

    if s == original:
        print("WARN: no hubo cambios en", path)
    else:
        path.write_text(s, encoding="utf-8")
        print("OK patched", path)

apply(coach_path)
apply(staff_path)
PY

echo "== Build check =="
npm run build
echo "DONE ✅"
