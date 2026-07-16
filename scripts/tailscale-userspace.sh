#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  Tailscale userspace connector — tanpa root / TUN device
#  Berguna untuk: CI, sandbox, container, atau mesin tanpa /dev/net/tun
#
#  Pakai:
#    export TAILSCALE_KEY="tskey-auth-..."   # auth key (buat di admin console)
#    ./scripts/tailscale-userspace.sh
#    curl --socks5-hostname localhost:1055 http://100.93.139.73:3001/
#
#  ⚠️ Jangan hardcode key di file ini — selalu lewat env.
#  Binari tailscale & state disimpan di /tmp (tidak masuk git).
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

TS_VER="${TS_VER:-1.98.9}"
TS_IP="${TS_IP:-100.93.139.73}"      # IP tailnet Oracle VM (roc-vm)
DIR="/tmp/tailscale_${TS_VER}_amd64"
STATE="/tmp/ts-state"
SOCK="$STATE/tailscaled.sock"

[ -z "${TAILSCALE_KEY:-}" ] && { echo "❌ set TAILSCALE_KEY dulu (https://login.tailscale.com/admin/settings/keys)"; exit 1; }

if [ ! -x "$DIR/tailscale" ]; then
  echo "⬇️  Download tailscale $TS_VER..."
  ( cd /tmp && curl -fsSL -o ts.tgz \
      "https://pkgs.tailscale.com/stable/tailscale_${TS_VER}_amd64.tgz" \
      && tar xzf ts.tgz )
fi

mkdir -p "$STATE"
if [ ! -S "$SOCK" ]; then
  echo "🚀 Start tailscaled (userspace networking, SOCKS5 :1055)..."
  nohup "$DIR/tailscaled" --tun=userspace-networking \
        --socks5-server=localhost:1055 \
        --state="$STATE/tailscaled.state" \
        --socket="$SOCK" >/tmp/tsd.log 2>&1 &
  sleep 5
fi

echo "🔑 Join tailnet..."
"$DIR/tailscale" --socket="$SOCK" up \
  --authkey="$TAILSCALE_KEY" \
  --hostname="${TS_HOSTNAME:-arena-agent-ivan}" \
  --timeout=45s

"$DIR/tailscale" --socket="$SOCK" status

echo ""
echo "✅ Connected. Probe contoh:"
echo "   Kuma  → curl --socks5-hostname localhost:1055 http://$TS_IP:3001/"
echo "   WVC   → curl --socks5-hostname localhost:1055 http://$TS_IP:8090/"
echo "   Nginx → curl --socks5-hostname localhost:1055 http://$TS_IP/"
echo ""
echo "Stop: pkill -f tailscaled"
