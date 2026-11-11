#!/bin/sh
set -e

cd /app

# O volume anônimo de node_modules nasce vazio quando é recriado.
if [ ! -d node_modules/next ]; then
    echo "[entrypoint] instalando dependências do npm..."
    npm install
fi

exec "$@"
