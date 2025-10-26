#!/usr/bin/env bash
set -euo pipefail
API="http://localhost:8080/api/v1"
echo "[SMOKE] health/docs"
curl -sf http://localhost:8080/health >/dev/null && echo "HEALTH=OK"
curl -sf $API/docs >/dev/null && echo "DOCS=OK"

echo "[SMOKE] register → accessToken"
RESP=$(curl -s -X POST $API/auth/register -H 'content-type: application/json' -d '{"email":"smoke_'$RANDOM'@qetta.local","password":"StrongPass!234"}')
if command -v jq >/dev/null 2>&1; then ACCESS=$(echo "$RESP" | jq -r .accessToken); else ACCESS=$(echo "$RESP" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p'); fi
[ -n "${ACCESS:-}" ] || { echo "NO_ACCESS_TOKEN"; exit 1; }

echo "[SMOKE] verify + rate-limit"
VERIFY=$(curl -s -X POST $API/verify -H "authorization: Bearer $ACCESS" -H 'content-type: application/json' -d '{"document":{"amount":100000,"date":"2025-09-30","subjectMatched":true},"account":{"balance":101000,"date":"2025-10-01"}}')
if command -v jq >/dev/null 2>&1; then echo "VERIFY_SEVERITY=$(echo "$VERIFY" | jq -c .severity_counts)"; else echo "$VERIFY" | sed -n 's/.*"severity_counts":{\([^}]*\)}.*/VERIFY_SEVERITY={\1}/p'; fi

LAST=200; for i in $(seq 1 101); do LAST=$(curl -s -o /dev/null -w "%{http_code}" $API/users/me -H "authorization: Bearer $ACCESS"); done
echo "RATE_LIMIT_101ST=$LAST"

if [ -n "${STRIPE_SECRET_KEY:-}" ]; then
  echo "[SMOKE] stripe checkout (dry)"
  curl -s -X POST $API/billing/checkout -H "authorization: Bearer $ACCESS" -H 'content-type: application/json' -d '{"tier":"STARTER"}' || true
else
  echo "STRIPE=SKIPPED"
fi

echo "[SMOKE] web"
curl -sf http://localhost:3000 >/dev/null && echo "WEB=OK"
