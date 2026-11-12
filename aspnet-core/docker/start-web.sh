#!/bin/sh
set -eu

# Free Render has no pre-deploy hook: stop startup if the schema cannot be updated.
/app/run-migrations.sh
cd /app
exec dotnet MosaicTalent.Web.Host.dll "$@"
