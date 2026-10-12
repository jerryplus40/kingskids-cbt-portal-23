#!/usr/bin/env bash
# Pushes the edge function secrets from .env to Supabase. Blank values are skipped.
set -euo pipefail
cd "$(dirname "$0")/.."

set -a; source .env; set +a
: "${SUPABASE_PROJECT_REF:?Set SUPABASE_PROJECT_REF in .env}"

secrets=()
for key in SITE_URL ALLOWED_ORIGIN PAYSTACK_SECRET_KEY TERMII_API_KEY TERMII_SENDER_ID TERMII_BASE_URL TERMII_CHANNEL RESEND_API_KEY EMAIL_FROM CRON_SECRET; do
  if [[ -n "${!key:-}" ]]; then secrets+=("$key=${!key}"); fi
done

if [[ ${#secrets[@]} -eq 0 ]]; then
  echo "No secrets to set"
  exit 0
fi
supabase secrets set --project-ref "$SUPABASE_PROJECT_REF" "${secrets[@]}"
echo "Set ${#secrets[@]} secrets"
