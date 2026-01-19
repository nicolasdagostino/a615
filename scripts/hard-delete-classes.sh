#!/usr/bin/env bash
set -euo pipefail

ts() { date +"%Y%m%d-%H%M%S"; }
RUN_ID="$(ts)"
LOG_DIR="logs/hard-delete-$RUN_ID"
BK_DIR="$LOG_DIR/backups"
mkdir -p "$BK_DIR"

log(){ echo "== $* =="; }

ROOT="$PWD"
if [ ! -f "$ROOT/package.json" ]; then
  echo "ERROR: corré este script desde la carpeta donde está package.json"
  exit 1
fi

APP_BASE="app"
COMP_BASE="components"
if [ -d "src/app" ]; then APP_BASE="src/app"; fi
if [ -d "src/components" ]; then COMP_BASE="src/components"; fi

ADMIN_ROUTE="$APP_BASE/api/admin/classes/route.ts"
CLASSES_TABLE="$COMP_BASE/classes/ClassesTable.tsx"

log "Paths"
echo "ADMIN_ROUTE=$ADMIN_ROUTE"
echo "CLASSES_TABLE=$CLASSES_TABLE"

[ -f "$ADMIN_ROUTE" ] || { echo "ERROR: No existe $ADMIN_ROUTE"; exit 1; }
[ -f "$CLASSES_TABLE" ] || { echo "ERROR: No existe $CLASSES_TABLE"; exit 1; }

log "Backups"
mkdir -p "$(dirname "$BK_DIR/$ADMIN_ROUTE")" "$(dirname "$BK_DIR/$CLASSES_TABLE")"
cp -a "$ADMIN_ROUTE" "$BK_DIR/$ADMIN_ROUTE"
cp -a "$CLASSES_TABLE" "$BK_DIR/$CLASSES_TABLE"

log "1) API DELETE = hard delete (borra sesiones futuras + borra class)"
python3 - <<PY
from pathlib import Path
p = Path("$ADMIN_ROUTE")
s = p.read_text(encoding="utf-8")

start = s.find("/**\n * DELETE /api/admin/classes?id=...")
if start == -1:
    start = s.find("export async function DELETE")
    if start == -1:
        raise SystemExit("No encuentro el handler DELETE en route.ts")

if s.find("/**\n * DELETE /api/admin/classes?id=...") == -1:
    jsdoc_start = s.rfind("/**", 0, start)
    if jsdoc_start != -1:
        start = jsdoc_start

prefix = s[:start].rstrip() + "\n\n"

delete_block = r'''/**
 * DELETE /api/admin/classes?id=...
 * Hard delete: borra la clase (y sus sesiones futuras) de verdad.
 */
export async function DELETE(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const id = String(url.searchParams.get("id") || "").trim();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const admin = createAdminClient();

    // 1) borrar sesiones FUTURAS
    const todayISO = new Date().toISOString().slice(0, 10);
    const { error: delSessionsErr } = await admin
      .from("class_sessions")
      .delete()
      .eq("class_id", id)
      .gte("session_date", todayISO);

    if (delSessionsErr) return NextResponse.json({ error: delSessionsErr.message }, { status: 400 });

    // 2) borrar la clase
    const { error: delClassErr } = await admin.from("classes").delete().eq("id", id);
    if (delClassErr) return NextResponse.json({ error: delClassErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
'''
p.write_text(prefix + delete_block + "\n", encoding="utf-8")
print("OK wrote hard-delete DELETE handler")
PY

log "2) UI: sacar restore + showCancelled"
python3 - <<PY
from pathlib import Path
import re
p = Path("$CLASSES_TABLE")
s = p.read_text(encoding="utf-8")

s = s.replace("  const [showCancelled, setShowCancelled] = useState(false);\n", "")
s = s.replace("const [showCancelled, setShowCancelled] = useState(false);\n", "")

s = s.replace('const url = showCancelled ? "/api/admin/classes?includeCancelled=1" : "/api/admin/classes";\n        const res = await fetch(url, { method: "GET" });',
              'const res = await fetch("/api/admin/classes", { method: "GET" });')
s = s.replace("}, [showCancelled]);", "}, []);")

s = re.sub(r"\n\s*const restoreClass = async \([\s\S]*?\n\s*};\n", "\n", s, flags=re.M)
s = re.sub(r"\n\s*<label className=\"flex items-center gap-2 text-sm[\s\S]*?</label>\s*\n", "\n", s, flags=re.M)
s = re.sub(r"\{\s*item\.status\s*===\s*\"Cancelled\"\s*\?\s*\([\s\S]*?\)\s*:\s*null\s*\}", "", s, flags=re.M)

# asegurar que luego del delete refresca
if "await fetchRows();" not in s:
    s = s.replace(
        'if (!res.ok) throw new Error(json?.error || "Failed to delete");\n\n        setRows((prev) => prev.filter((x) => x.id !== deletingId));',
        'if (!res.ok) throw new Error(json?.error || "Failed to delete");\n\n        setRows((prev) => prev.filter((x) => x.id !== deletingId));\n        await fetchRows();'
    )

p.write_text(s, encoding="utf-8")
print("OK updated ClassesTable")
PY

log "3) Remove NUL bytes"
perl -pi -e 's/\x00//g' "$ADMIN_ROUTE" "$CLASSES_TABLE" || true

log "Build check"
npm run build | tee "$LOG_DIR/build.log"

log "DONE"
echo "Backups: $BK_DIR"
echo "Build log: $LOG_DIR/build.log"
