#!/bin/bash
# Sauvegarde logique de la base : rôles + dump complet horodaté, avec
# somme de contrôle et rotation (7 dernières conservées).
#
# Usage :
#   PGURL="postgresql://postgres.<ref>:<mdp>@aws-0-<region>.pooler.supabase.com:5432/postgres" \
#   DEST=/media/lef/B44C80744C8032E2/sauvegarde-xwegan/bdd \
#   ./scripts/sauvegarde-bdd.sh
#
# Le mot de passe transite par l'environnement, jamais par un argument
# (visible dans `ps`) ni dans un fichier versionné.
#
# Prérequis : PostgreSQL >= 17 (même majeur que le serveur, sinon refus de
# version). À défaut : `docker run --rm -e PGPASSWORD=... postgres:17
# pg_dumpall ...` avec les mêmes arguments.
set -euo pipefail

: "${PGURL:?PGURL manquant (voir l'en-tête)}"
: "${DEST:?DEST manquant (voir l'en-tête)}"

DATE=$(date +%Y%m%d-%H%M)
mkdir -p "$DEST"
BASE="$DEST/sauvegarde-bdd-$DATE"

echo ">> rôles…"
pg_dumpall --globals-only --dbname="$PGURL" > "$BASE-globals.sql"
echo ">> base…"
pg_dump --dbname="$PGURL" --format=custom --file="$BASE.dump"
echo ">> contrôle…"
(cd "$DEST" && sha256sum "$(basename "$BASE-globals.sql")" "$(basename "$BASE.dump")" > "$BASE.sha256")
echo ">> rotation (7 dernières)…"
ls -1t "$DEST"/sauvegarde-bdd-*.dump 2>/dev/null | tail -n +8 | while read -r vieux; do
  rm -f "$vieux" "${vieux%.dump}-globals.sql" "${vieux%.dump}.sha256"
done
echo "OK : $BASE.dump"
