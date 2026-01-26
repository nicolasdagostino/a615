#!/usr/bin/env bash
set -euo pipefail

echo "== cleanup local artifacts =="

# 1) Asegurar .gitignore con reglas para backups/scripts locales
touch .gitignore

add_ignore () {
  local rule="$1"
  if ! rg -q --fixed-strings "$rule" .gitignore; then
    echo "$rule" >> .gitignore
    echo "added to .gitignore: $rule"
  else
    echo "exists in .gitignore: $rule"
  fi
}

echo
echo "-- updating .gitignore --"
add_ignore ""
add_ignore "# Local backups / debug artifacts"
add_ignore "logs/backups/"
add_ignore "*.log"
add_ignore ".DS_Store"

# si querés que scripts one-off NO se trackeen nunca más:
add_ignore ""
add_ignore "# One-off local scripts (keep repo clean)"
add_ignore "scripts/_local/"
add_ignore "scripts/tmp/"

# 2) Crear carpetas locales si no existen
mkdir -p scripts/_local scripts/tmp

# 3) Mover scripts one-off a scripts/_local (solo los que empiezan por apply-/fix-/diag-/wire-/include-/guard-/overwrite-)
echo
echo "-- moving one-off scripts to scripts/_local (if tracked, this won't delete history) --"
shopt -s nullglob
for f in scripts/{apply,fix,diag,wire,include,guard,overwrite}-*.sh; do
  # Si el script está trackeado por git, NO lo movemos automáticamente (para no armar lío),
  # solo lo copiamos y te avisamos.
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    echo "TRACKED (no move): $f"
  else
    echo "move: $f -> scripts/_local/"
    mv "$f" scripts/_local/
  fi
done
shopt -u nullglob

# 4) Borrar backups locales
echo
echo "-- removing logs/backups (local) --"
rm -rf logs/backups || true
mkdir -p logs/backups

echo
echo "OK ✅ cleanup done."
echo "Next steps:"
echo " - run: npm run build"
echo " - check: git status"
