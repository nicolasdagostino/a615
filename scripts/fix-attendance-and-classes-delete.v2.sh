#!/usr/bin/env bash
set -euo pipefail

# Estamos en repo con src/
BASE="src"

COACH_ROUTE="$BASE/app/api/coach/attendance/route.ts"
STAFF_ROUTE="$BASE/app/api/staff/attendance/route.ts"
CLASSES_TABLE="$BASE/components/classes/ClassesTable.tsx"

if [ ! -f "$COACH_ROUTE" ] || [ ! -f "$STAFF_ROUTE" ] || [ ! -f "$CLASSES_TABLE" ]; then
  echo "ERROR: No encuentro alguno de estos archivos:"
  echo " - $COACH_ROUTE"
  echo " - $STAFF_ROUTE"
  echo " - $CLASSES_TABLE"
  echo "Corré esto desde la raíz del repo (A615)."
  exit 1
fi

ts() { date +"%Y%m%d-%H%M%S"; }
RUN="fixv2-$(ts)"
BK="logs/backups/$RUN"
mkdir -p "$BK"

backup() {
  local f="$1"
  mkdir -p "$BK/$(dirname "$f")"
  cp "$f" "$BK/$f"
  echo "OK backup: $f -> $BK/$f"
}

backup "$COACH_ROUTE"
backup "$STAFF_ROUTE"
backup "$CLASSES_TABLE"

# ---- 1) Parchear coach/staff attendance: dejar de pedir classes.name ----
python3 - <<PY
import re
from pathlib import Path

paths = [Path("$COACH_ROUTE"), Path("$STAFF_ROUTE")]

def patch(text: str) -> str:
    out = text

    # Caso típico: select("..., classes(name, ...), ...")
    out = re.sub(r"classes\\(\\s*name\\s*,", "classes(program:programs(name),", out)
    out = re.sub(r"classes\\(\\s*name\\s*\\)", "classes(program:programs(name))", out)

    # Caso con alias: classes:classes(name,...)
    out = re.sub(r"classes\\s*:\\s*classes\\(\\s*name\\s*,", "classes:classes(program:programs(name),", out)
    out = re.sub(r"classes\\s*:\\s*classes\\(\\s*name\\s*\\)", "classes:classes(program:programs(name))", out)

    # Si el response mapea row.classes.name => row.classes.program?.name
    out = re.sub(r"(\\bclasses\\b(?:\\?\\.)?\\.)name\\b", r"\\1program?.name", out)

    return out

for p in paths:
    s = p.read_text(encoding="utf-8")
    n = patch(s)
    if n != s:
        p.write_text(n.replace("\\x00",""), encoding="utf-8")
        print("OK patched", p)
    else:
        print("WARN no changes", p)
PY

# ---- 2) Simplificar ClassesTable: no restore, no showCancelled, refrescar tras delete ----
python3 - <<PY
import re
from pathlib import Path

p = Path("$CLASSES_TABLE")
s = p.read_text(encoding="utf-8")
orig = s

# 2a) quitar showCancelled state si está
s = re.sub(r"\\n\\s*const\\s*\\[\\s*showCancelled\\s*,\\s*setShowCancelled\\s*\\]\\s*=\\s*useState\\([^\\)]*\\);\\s*\\n", "\\n", s)

# 2b) forzar fetchRows a /api/admin/classes
s = re.sub(r'const url\\s*=\\s*showCancelled\\s*\\?\\s*\"/api/admin/classes\\?includeCancelled=1\"\\s*:\\s*\"/api/admin/classes\";',
           'const url = "/api/admin/classes";', s)

# 2c) borrar checkbox Show cancelled (label)
s = re.sub(r"\\n\\s*<label[\\s\\S]*?Show cancelled\\s*</label>\\s*\\n", "\\n", s)

# 2d) borrar bloque Restore button
s = re.sub(r"\\{\\s*item\\.status\\s*===\\s*\"Cancelled\"\\s*\\?\\s*\\([\\s\\S]*?\\)\\s*:\\s*null\\s*\\}", "", s)

# 2e) borrar function restoreClass completa
s = re.sub(r"\\n\\s*const\\s+restoreClass\\s*=\\s*async\\s*\\([\\s\\S]*?\\n\\s*\\};\\s*\\n", "\\n", s)

# 2f) después de delete ok, asegurar refresh
# si ya existe fetchRows, no duplicamos
if "await fetchRows();" not in s:
    s = re.sub(
        r'if\\s*\\(!res\\.ok\\)\\s*throw new Error\\([^;]*\\);',
        lambda m: m.group(0) + "\\n\\n        await fetchRows();",
        s,
        count=1
    )

s = s.replace("\\x00","")

if s != orig:
    p.write_text(s, encoding="utf-8")
    print("OK updated ClassesTable")
else:
    print("WARN ClassesTable no changes (quizás ya estaba)")
PY

# Extra: eliminar NUL bytes por las dudas
perl -pi -e 's/\x00//g' "$COACH_ROUTE" "$STAFF_ROUTE" "$CLASSES_TABLE" || true

echo "== Build check =="
npm run build
echo "DONE. Backups: $BK"
