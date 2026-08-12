#!/usr/bin/env bash
# Add A records for shresearch.cn via DNSPod API.
# Usage: DNSPOD_LOGIN_TOKEN="id,token" ./deploy/dnspod-add-records.sh
set -euo pipefail

TOKEN="${DNSPOD_LOGIN_TOKEN:?set DNSPOD_LOGIN_TOKEN=id,token (see console.dnspod.cn/account/token)}"
DOMAIN="shresearch.cn"
IP="82.157.208.201"

for sub in "@" "www"; do
  echo ">> Creating A record for $sub.$DOMAIN -> $IP"
  curl -sS -X POST "https://dnsapi.cn/Record.Create" \
    --data-urlencode "login_token=${TOKEN}" \
    --data-urlencode "format=json" \
    --data-urlencode "domain=${DOMAIN}" \
    --data-urlencode "sub_domain=${sub}" \
    --data-urlencode "record_type=A" \
    --data-urlencode "record_line=默认" \
    --data-urlencode "value=${IP}" \
    --data-urlencode "ttl=600"
  echo
done
