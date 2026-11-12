#!/bin/sh
set -eu

if [ -z "${ConnectionStrings__Default:-}" ]; then
  echo "Set ConnectionStrings__Default for the target PostgreSQL database before running migrations." >&2
  exit 2
fi

cd /app/migrator
exec dotnet MosaicTalent.Migrator.dll -q
