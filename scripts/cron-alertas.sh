#!/usr/bin/env bash
# Cron job para el motor de alertas DJI
# Configuración recomendada (crontab -e):
#   0 6 * * * /ruta/absoluta/al/proyecto/scripts/cron-alertas.sh >> /var/log/dji-alertas.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Cargar variables de entorno desde .env si existe
if [[ -f "$PROJECT_DIR/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$PROJECT_DIR/.env"
  set +a
fi

APP_URL="${NEXTAUTH_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:?La variable CRON_SECRET no está configurada}"

echo "[$(date -Iseconds)] Iniciando procesamiento de alertas DJI..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  "${APP_URL}/api/cron/procesar-alertas")

HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "[$(date -Iseconds)] ✅ Completado: $HTTP_BODY"
else
  echo "[$(date -Iseconds)] ❌ Error HTTP $HTTP_CODE: $HTTP_BODY"
  exit 1
fi
