#!/usr/bin/env bash
# Scaffold a new solution from the skeleton and rename MyApp -> <Name> everywhere (dirs, files, namespaces, config).
#   usage: new-project.sh <target-dir> <PascalCaseName>      e.g. new-project.sh ~/src/acme Acme
set -euo pipefail

TARGET="${1:?target directory required}"
NAME="${2:?PascalCase project name required (e.g. Acme)}"
[[ "$NAME" =~ ^[A-Z][A-Za-z0-9]+$ ]] || { echo "Name must be PascalCase letters/digits, e.g. Acme"; exit 1; }
LOWER="$(echo "$NAME" | tr '[:upper:]' '[:lower:]')"
UPPER="$(echo "$NAME" | tr '[:lower:]' '[:upper:]')"
SKELETON="$(cd "$(dirname "$0")/../templates/skeleton" && pwd)"

if [ -e "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2>/dev/null)" ]; then
  echo "Target $TARGET exists and is not empty; refusing to overwrite." >&2
  exit 1
fi

mkdir -p "$TARGET"
cp -R "$SKELETON"/. "$TARGET"/

# Rename directories/files deepest-first, then replace content in text files.
find "$TARGET" -depth -name '*MyApp*' | while read -r path; do
  mv "$path" "$(dirname "$path")/$(basename "$path" | sed "s/MyApp/$NAME/g")"
done
grep -rlI --exclude-dir=node_modules --exclude-dir=.git -e MyApp -e myapp -e MYAPP "$TARGET" | while read -r file; do
  sed -i.bak -e "s/MyApp/$NAME/g" -e "s/myapp/$LOWER/g" -e "s/MYAPP/$UPPER/g" "$file" && rm -f "$file.bak"
done

cat <<MSG
Created $NAME in $TARGET

Next:
  cd $TARGET/backend && dotnet tool restore && dotnet build && dotnet test      # integration tests need Docker or ${UPPER}_TEST_PG_ADMIN
  cd $TARGET/frontend && npm install && npm run dev
  cp $TARGET/.env.example $TARGET/.env && docker compose -f $TARGET/docker-compose.yml up --build
Then replace the example Items module with your first real module (see references/backend-architecture.md).
MSG
