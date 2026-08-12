#!/usr/bin/env bash
# certbot manual DNS-01 auth hook: create TXT record via DNSPod API.
# Requires: DNSPOD_LOGIN_TOKEN=id,token ; CERTBOT_DOMAIN, CERTBOT_VALIDATION provided by certbot.
set -euo pipefail

TOKEN="${DNSPOD_LOGIN_TOKEN:-$(cat /etc/letsencrypt/dnspod-login-token 2>/dev/null)}"
TOKEN="${TOKEN:?set DNSPOD_LOGIN_TOKEN or /etc/letsencrypt/dnspod-login-token}"
DOMAIN="${CERTBOT_DOMAIN:?}"
VALIDATION="${CERTBOT_VALIDATION:?}"

if [[ "$DOMAIN" == "shresearch.cn" ]]; then
  SUB="_acme-challenge"
else
  SUB="_acme-challenge.${DOMAIN%.shresearch.cn}"
fi

RESP="$(curl -sS -X POST "https://dnsapi.cn/Record.Create" \
  --data-urlencode "login_token=${TOKEN}" \
  --data-urlencode "format=json" \
  --data-urlencode "domain=shresearch.cn" \
  --data-urlencode "sub_domain=${SUB}" \
  --data-urlencode "record_type=TXT" \
  --data-urlencode "record_line=默认" \
  --data-urlencode "value=${VALIDATION}" \
  --data-urlencode "ttl=600")"

echo "$RESP"
RID="$(printf '%s' "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["record"]["id"])' 2>/dev/null || true)"
if [[ -n "$RID" ]]; then
  printf '%s' "$RID" > "/tmp/dnspod-txt-${DOMAIN}.id"
fi
