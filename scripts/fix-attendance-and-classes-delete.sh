#!/usr/bin/env bash
set -euo pipefail

# Detect base (repo puede tener src/app o app directamente)
if [ -d "src/app" ]; then
  BASE="src"
elif [ -d "app" ]; then
  BASE="."
else
  echo "ERROR: No encuentro app/ ni src/app/. Corré esto desde la raíz del repo."
  exit 1
fi

COACH_ROUTE="$BASE/app/api/coach/attendance/route.ts"
STAFF_ROUTE="$BASE/app/api/staff/attendance/route.ts"
CLASSES_TABLE="$BASE/components/classes/ClassesTable.tsx"

ts() { date +"%Y%m%d-%H%M%S"; }
RUN="fix-$(ts)"
BK="logs/backups/$RUN"
mkdir -p "$BK"

backup() {
  local f="$1"
  if [ -f "$f" ]; then
    mkdir -p "$BK/$(dirname "$f")"
    cp "$f" "$BK/$f"
    echo "OK backup: $f -> $BK/$f"
  else
    echo "WARN: no existe $f (skip)"
  fi
}

backup "$COACH_ROUTE"
backup "$STAFF_ROUTE"
backup "$CLASSES_TABLE"

# 1) Fix coach/staff attendance: eliminar referencia a classes.name
#    y traer program.name como "class name".
python3 - <<'PY'
import re, pathlib

def patch_route(path: str):
    p = pathlib.Path(path)
    if not p.exists():
        print(f"SKIP {path} (no existe)")
        return

    s = p.read_text(encoding="utf-8")

    # a) si hay un select que contiene classes(name...) lo reemplazamos por nested program:programs(name)
    # Intentamos varios patrones comunes de PostgREST select.
    patterns = [
        # classes(name, ...)
        (r"classes\(\s*name\s*,", "classes(program:programs(name),"),
        # classes:classes(name, ...)
        (r"classes\s*:\s*classes\(\s*name\s*,", "classes:classes(program:programs(name),"),
        # classes(name)
        (r"classes\(\s*name\s*\)", "classes(program:programs(name))"),
        # classes:classes(name)
        (r"classes\s*:\s*classes\(\s*name\s*\)", "classes:classes(program:programs(name))"),
    ]

    out = s
    changed = False
    for pat, rep in patterns:
        new = re.sub(pat, rep, out)
        if new != out:
            out = new
            changed = True

    # b) si en el mapeo/response se usa .name, lo normalizamos a program.name (sin romper si no existe)
    # Esto es "best effort": cambia cosas tipo row.classes.name -> row.classes.program?.name
    new = re.sub(r"(\bclasses\b(?:\?\.)?\.)(name)\b", r"\1program?.name", out)
    if new != out:
        out = new
        changed = True

    if not changed:
        print(f"WARN {path}: no encontré 'classes(name' ni '.classes.name' para parchear (puede estar con otro formato).")
    else:
        p.write_text(out, encoding="utf-8")
        print(f"OK patched {path}")

patch_route("")
patch_route("")
PY

python3 - <<'PY'
import re, pathlib

p = pathlib.Path("")
if not p.exists():
    print("SKIP ClassesTable (no existe)")
    raise SystemExit(0)

s = p.read_text(encoding="utf-8")
orig = s

# Quitar showCancelled state si existe
s = re.sub(r"\n\s*const\s*\[\s*showCancelled\s*,\s*setShowCancelled\s*\]\s*=\s*useState\([^\)]*\);\s*\n", "\n", s)

# Forzar fetchRows siempre a /api/admin/classes (sin includeCancelled)
s = re.sub(r'const url\s*=\s*showCancelled\s*\?\s*\"/api/admin/classes\?includeCancelled=1\"\s*:\s*\"/api/admin/classes\";', 
           'const url = "/api/admin/classes";', s)

# Quitar checkbox "Show cancelled" (bloque label)
s = re.sub(r"\n\s*<label[^>]*>\s*<input[\s\S]*?Show cancelled\s*</label>\s*\n", "\n", s)

# Quitar restore button (bloque {item.status === "Cancelled" ? ( ... ) : null})
s = re.sub(r"\{\s*item\.status\s*===\s*\"Cancelled\"\s*\?\s*\([\s\S]*?\)\s*:\s*null\s*\}", "", s)

# Quitar restoreClass function completa si existe
s = re.sub(r"\n\s*const\s+restoreClass\s*=\s*async\s*\([\s\S]*?\n\s*\};\s*\n", "\n", s)

# En confirmDelete: después de delete ok, forzar await fetchRows() para consistencia
# (si ya lo tiene, no pasa nada)
if "await fetchRows();" not in s:
    s = re.sub(
        r'if\s*\(!res\.ok\)\s*throw new Error\([^;]*\);\s*',
        lambda m: m.group(0) + "\n        await fetchRows();\n",
        s,
        count=1
    )

# Seguridad: eliminar bytes NUL
s = s.replace("\x00", "")

if s == orig:
    print("WARN ClassesTable: no hubo cambios (puede que ya esté limpio).")
else:
    p.write_text(s, encoding="utf-8")
    print("OK updated ClassesTable")

PY

# Remove NUL bytes por las dudas (turbopack)
perl -pi -e 's/\x00//g' "$COACH_ROUTE" "$STAFF_ROUTE" "$CLASSES_TABLE" 2>/dev/null || true

echo "== Build check =="
npm run build
echo "DONE. Backups: $BK"
