#!/usr/bin/env bash
# Deploys the database, edge functions and their secrets to the Supabase project in .env.
# Safe to run again: migrations already applied are skipped.
set -euo pipefail
cd "$(dirname "$0")/.."

set -a; source .env; set +a
: "${SUPABASE_PROJECT_REF:?Set SUPABASE_PROJECT_REF in .env}"
: "${SUPABASE_DB_PASSWORD:?Set SUPABASE_DB_PASSWORD in .env}"
: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN in .env}"
export SUPABASE_ACCESS_TOKEN

echo "› Linking project $SUPABASE_PROJECT_REF"
supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"

echo "› Applying auth settings from supabase/config.toml (sign-up off, password rules, two-step sign-in)"
supabase config push --project-ref "$SUPABASE_PROJECT_REF" --yes

echo "› Applying database migrations"
supabase db push --password "$SUPABASE_DB_PASSWORD" --yes

echo "› Deploying edge functions"
for fn in supabase/functions/*/; do
  name=$(basename "$fn")
  [[ "$name" == _shared ]] && continue
  supabase functions deploy "$name" --project-ref "$SUPABASE_PROJECT_REF"
done

echo "› Setting edge function secrets (blank ones are skipped)"
secrets=()
for key in SITE_URL ALLOWED_ORIGIN PAYSTACK_SECRET_KEY TERMII_API_KEY TERMII_SENDER_ID TERMII_BASE_URL TERMII_CHANNEL RESEND_API_KEY EMAIL_FROM CRON_SECRET; do
  [[ -n "${!key:-}" ]] && secrets+=("$key=${!key}")
done
[[ ${#secrets[@]} -gt 0 ]] && supabase secrets set --project-ref "$SUPABASE_PROJECT_REF" "${secrets[@]}"

if [[ -n "${CRON_SECRET:-}" ]]; then
  echo "› Scheduling send-notifications every 5 minutes"
  sql=$(mktemp)
  trap 'rm -f "$sql"' EXIT
  cat > "$sql" <<SQL
create extension if not exists pg_net;
select cron.unschedule('send-notifications') where exists (select 1 from cron.job where jobname = 'send-notifications');
select cron.schedule('send-notifications', '*/5 * * * *', \$\$
  select net.http_post(
    url := 'https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '${CRON_SECRET}'),
    body := '{}'::jsonb
  )
\$\$);
SQL
  supabase db query --linked -f "$sql" --output table
fi

echo "✓ Backend deployed. Next: node scripts/create-admin.mjs"
