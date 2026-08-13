#!/usr/bin/env bash
# Build and atomically deploy the shresearch.cn static site.
# Usage:
#   ./deploy/deploy.sh build
#   ./deploy/deploy.sh list
#   ./deploy/deploy.sh rollback <release-id>
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="ubuntu@82.157.208.201"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/yaosihang.pem}"
WEB_ROOT="/var/www/shresearch.cn"
RELEASE_ROOT="$WEB_ROOT/releases"
CURRENT_LINK="$WEB_ROOT/current"
SRC_ROOT="/srv/shresearch.cn"
KEEP_RELEASES=3
SSH=(ssh -i "$SSH_KEY" -o BatchMode=yes "$SERVER")

usage() {
  sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'
}

list_releases() {
  "${SSH[@]}" "sudo find '$RELEASE_ROOT' -mindepth 1 -maxdepth 1 -type d -printf '%f\n' 2>/dev/null | sort -r; printf 'current -> '; sudo readlink '$CURRENT_LINK' || true"
}

rollback() {
  local release_id="${1:-}"
  [[ "$release_id" =~ ^[0-9]{8}T[0-9]{6}Z-[0-9a-z]+$ ]] || {
    echo "Invalid or missing release id." >&2
    list_releases
    exit 2
  }

  "${SSH[@]}" bash -s -- "$RELEASE_ROOT" "$CURRENT_LINK" "$release_id" <<'REMOTE'
set -euo pipefail
release_root="$1"
current_link="$2"
release_id="$3"
target="$release_root/$release_id"
sudo test -f "$target/index.html"
sudo ln -sfn "$target" "${current_link}.next"
sudo mv -Tf "${current_link}.next" "$current_link"
sudo nginx -t
sudo systemctl reload nginx
REMOTE

  curl --noproxy '*' --fail --silent --show-error --max-time 20 \
    https://www.shresearch.cn/ >/dev/null
  echo "Rolled back to $release_id"
}

deploy() {
  local revision release_id release_path verify_dir redirect origin_revision

  if [[ -n "$(git -C "$REPO_DIR" status --porcelain --untracked-files=all)" ]]; then
    echo "Commit and push the complete site before deploying." >&2
    exit 2
  fi
  git -C "$REPO_DIR" fetch origin main
  revision="$(git -C "$REPO_DIR" rev-parse --short HEAD)"
  origin_revision="$(git -C "$REPO_DIR" rev-parse origin/main)"
  if [[ "$(git -C "$REPO_DIR" rev-parse HEAD)" != "$origin_revision" ]]; then
    echo "Commit and push the complete site before deploying." >&2
    exit 2
  fi
  release_id="$(date -u +%Y%m%dT%H%M%SZ)-$revision"
  release_path="$RELEASE_ROOT/$release_id"

  echo ">> Building and testing the static export..."
  (cd "$REPO_DIR" && SITE_URL=https://www.shresearch.cn npm test)

  echo ">> Uploading release $release_id..."
  "${SSH[@]}" bash -s -- "$WEB_ROOT" "$RELEASE_ROOT" "$CURRENT_LINK" "$SRC_ROOT" <<'REMOTE'
set -euo pipefail
web_root="$1"
release_root="$2"
current_link="$3"
src_root="$4"
sudo mkdir -p "$release_root" "$src_root"
if ! sudo test -L "$current_link"; then
  legacy_release="$release_root/$(date -u +%Y%m%dT%H%M%SZ)-legacy"
  sudo mkdir -p "$legacy_release"
  sudo find "$web_root" -mindepth 1 -maxdepth 1 \
    ! -name releases ! -name current \
    -exec cp -a -t "$legacy_release" -- {} +
  sudo ln -s "$legacy_release" "$current_link"
fi
REMOTE
  "${SSH[@]}" "sudo mkdir -p '$release_path'"
  rsync -az --delete \
    -e "ssh -i $SSH_KEY -o BatchMode=yes" \
    --rsync-path="sudo rsync" \
    "$REPO_DIR/out/" "$SERVER:$release_path/"

  "${SSH[@]}" bash -s -- "$release_path" <<'REMOTE'
set -euo pipefail
release_path="$1"
sudo test -s "$release_path/index.html"
sudo test -s "$release_path/earnings/index.html"
sudo test -s "$release_path/company-icons/minimax.png"
sudo test -s "$release_path/company-icons/pdd.png"
sudo test -s "$release_path/data/catalog.json"
sudo grep -q '京ICP备2026051102号-1' "$release_path/index.html"
sudo grep -q 'https://www.shresearch.cn' "$release_path/index.html"
sudo grep -q 'AI 热点' "$release_path/index.html"
sudo grep -q '财报工作台' "$release_path/earnings/index.html"
REMOTE

  echo ">> Installing the site configuration and switching atomically..."
  rsync -az \
    -e "ssh -i $SSH_KEY -o BatchMode=yes" \
    "$REPO_DIR/deploy/nginx-shresearch.cn.conf" \
    "$SERVER:/tmp/nginx-shresearch.cn.conf"

  "${SSH[@]}" bash -s -- "$release_path" "$CURRENT_LINK" <<'REMOTE'
set -euo pipefail
release_path="$1"
current_link="$2"
config=/etc/nginx/sites-available/shresearch.cn
backup="${config}.pre-atomic-deploy"
sudo cp "$config" "$backup"
sudo install -m 0644 /tmp/nginx-shresearch.cn.conf "$config"
if ! sudo nginx -t; then
  sudo cp "$backup" "$config"
  sudo nginx -t
  exit 1
fi
sudo ln -sfn "$release_path" "${current_link}.next"
sudo mv -Tf "${current_link}.next" "$current_link"
sudo systemctl reload nginx
REMOTE

  echo ">> Syncing the source backup..."
  rsync -az --delete \
    -e "ssh -i $SSH_KEY -o BatchMode=yes" \
    --rsync-path="sudo rsync" \
    --exclude .git --exclude node_modules --exclude .next --exclude out \
    --exclude .impeccable --exclude deploy/icp-filing-draft.md \
    "$REPO_DIR/" "$SERVER:$SRC_ROOT/"

  echo ">> Verifying the public site..."
  verify_dir="$(mktemp -d)"
  trap 'rm -rf "$verify_dir"' RETURN
  curl --noproxy '*' --fail --silent --show-error --max-time 20 \
    --output "$verify_dir/index.html" https://www.shresearch.cn/
  grep -q '京ICP备2026051102号-1' "$verify_dir/index.html"
  curl --noproxy '*' --fail --silent --show-error --max-time 20 \
    https://www.shresearch.cn/data/catalog.json >/dev/null
  curl --noproxy '*' --fail --silent --show-error --max-time 20 \
    --output "$verify_dir/earnings.html" https://www.shresearch.cn/earnings/
  grep -q '财报工作台' "$verify_dir/earnings.html"
  grep -q '返回首页导航' "$verify_dir/earnings.html"
  curl --noproxy '*' --fail --silent --show-error --max-time 20 \
    --range 0-65535 \
    --output "$verify_dir/radar.json" https://www.shresearch.cn/ai-radar/data/latest-24h.json
  grep -q 'total_items' "$verify_dir/radar.json"
  curl --noproxy '*' --fail --silent --show-error --max-time 20 \
    --output "$verify_dir/radar.html" https://www.shresearch.cn/ai-radar/
  grep -q '返回首页导航' "$verify_dir/radar.html"
  curl --noproxy '*' --fail --silent --show-error --max-time 20 \
    https://www.shresearch.cn/company-icons/minimax.png >/dev/null
  curl --noproxy '*' --fail --silent --show-error --max-time 20 \
    https://www.shresearch.cn/company-icons/pdd.png >/dev/null
  redirect="$(curl --noproxy '*' --silent --show-error --max-time 20 \
    --output /dev/null --write-out '%{http_code} %{redirect_url}' \
    https://shresearch.cn/)"
  [[ "$redirect" == "301 https://www.shresearch.cn/" ]]
  rm -rf "$verify_dir"
  trap - RETURN

  "${SSH[@]}" "sudo find '$RELEASE_ROOT' -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -nr | tail -n +$((KEEP_RELEASES + 1)) | cut -d' ' -f2- | xargs -r sudo rm -rf"
  echo ">> Published $release_id"
  list_releases
}

case "${1:-}" in
  build) deploy ;;
  list) list_releases ;;
  rollback) rollback "${2:-}" ;;
  *) usage; exit 2 ;;
esac
