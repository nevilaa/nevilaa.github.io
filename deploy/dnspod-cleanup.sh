#!/usr/bin/env bash
# certbot manual DNS-01 cleanup hook: remove the TXT record created by dnspod-auth.sh.
set -euo pipefail

TOKEN="${DNSPOD_LOGIN_TOKEN:-$(cat /etc/letsencrypt/dnspod-login-token 2>/dev/null)}"
TOKEN="${TOKEN:?set DNSPOD_LOGIN_TOKEN or /etc/letsencrypt/dnspod-login-token}"
DOMAIN="${CERTBOT_DOMAIN:?}"
ID_FILE="/tmp/dnspod-txt-${DOMAIN}.id"

if [[ -f "$ID_FILE" ]]; then
  RID="$(cat "$ID_FILE")"
  curl -sS -X POST "https://dnsapi.cn/Record.Remove" \
    --data-urlencode "login_token=${TOKEN}" \
    --data-urlencode "format=json" \
    --data-urlencode "domain=shresearch.cn" \
    --data-urlencode "record_id=${RID}" >/dev/null
  rm -f "$ID_FILE"
  echo "removed TXT for $DOMAIN (record $RID)"
else
  echo "no record id file for $DOMAIN; nothing to remove"
fi
