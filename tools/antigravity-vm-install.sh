#!/usr/bin/env bash
# =============================================================================
# antigravity-vm-install.sh  —  label panel: antigravity.ai.studio
# Antigravity IDE 2.3.0 (ARM64) @ Oracle Cloud VM + VNC + noVNC (systemd)
# Idempoten: aman dijalankan ulang. Jalankan sebagai user login (bukan root).
# =============================================================================
set -euo pipefail

# ---- Konstanta (sama dengan hermes cmd_antigravity) -------------------------
AG_VER="2.3.0-5214728084127744"
AG_URL_DEFAULT="https://storage.googleapis.com/antigravity-public/antigravity-hub/${AG_VER}/linux-arm/Antigravity.tar.gz"
AG_SIZE_EXPECTED=161941577
AG_MD5_B64_EXPECTED="TgDz78WspgmIJHTw/A5uDQ=="
PREFIX_DIR="${PREFIX:-$HOME/.local}"
AG_PARENT="$PREFIX_DIR/opt"
AG_DIR="$AG_PARENT/Antigravity-arm64"
AG_BIN_LINK="$PREFIX_DIR/bin/antigravity"
DISPLAY_NUM=99
VNC_PORT="${AG_VNC_PORT:-5905}"
NOVNC_PORT="${AG_NOVNC_PORT:-6905}"
SCREEN="${AG_SCREEN:-1600x900x24}"
LABEL="antigravity.ai.studio"

log(){ printf '[%s] %s\n' "$LABEL" "$*"; }
die(){ log "FATAL: $*"; exit 1; }
need(){ command -v "$1" >/dev/null 2>&1; }

[[ "$(id -u)" -ne 0 ]] || die "Jalankan sebagai user biasa (bukan root); sudo dipakai internal."

# ---- 0) Arsitektur ----------------------------------------------------------
ARCH="$(uname -m)"
log "arch = $ARCH"
[[ "$ARCH" == "aarch64" ]] || die "Antigravity hanya tersedia ARM64 (aarch64); VM ini $ARCH."

# ---- 1) Dependensi OS -------------------------------------------------------
if need apt-get; then
  log "pasang dependensi (apt-get)…"
  sudo apt-get update -y -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    curl tar openssl ca-certificates jq \
    xvfb x11vnc novnc websockify netfilter-persistent \
    libnss3 libgbm1 libasound2 libxkbcommon0 libxrandr2 libgtk-3-0 fonts-liberation
else
  log "PERINGATAN: apt-get tidak ada — pastikan xvfb/x11vnc/novnc/websockify terpasang manual."
fi

# ---- 2) Unduh + verifikasi + ekstrak ---------------------------------------
mkdir -p "$AG_PARENT" "$PREFIX_DIR/bin" "$PREFIX_DIR/share/$LABEL"
if [[ -x "$AG_DIR/antigravity" ]]; then
  log "sudah terpasang di $AG_DIR — lewati unduhan."
else
  tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
  tgz="$tmp/Antigravity.tar.gz"
  log "unduh: $AG_URL_DEFAULT"
  curl -fL --retry 3 --retry-delay 2 -C - -o "$tgz" "$AG_URL_DEFAULT"
  size="$(stat -c%s "$tgz")"
  [[ "$size" == "$AG_SIZE_EXPECTED" ]] || die "size $size ≠ $AG_SIZE_EXPECTED"
  md5="$(openssl md5 -binary "$tgz" | base64)"
  [[ "$md5" == "$AG_MD5_B64_EXPECTED" ]] || die "MD5 mismatch: $md5"
  log "verifikasi size + MD5 cocok (build asli $AG_VER)."
  tar -xzf "$tgz" -C "$AG_PARENT"
  [[ -x "$AG_DIR/antigravity" ]] || die "binary tidak ditemukan setelah ekstrak."
  ln -sfn "$AG_DIR/antigravity" "$AG_BIN_LINK"
fi
log "binary: $(file -b "$AG_DIR/antigravity" | cut -c1-80)"

# ---- 3) Unit systemd (Xvfb → IDE → x11vnc → noVNC) --------------------------
ME="$(id -un)"; MYHOME="$HOME"
mk_unit(){ sudo tee "/etc/systemd/system/$1" >/dev/null; }

mk_unit antigravity-xvfb.service <<EOF
[Unit]
Description=[$LABEL] Xvfb :$DISPLAY_NUM
After=network.target
[Service]
Type=simple
User=$ME
ExecStart=/usr/bin/Xvfb :$DISPLAY_NUM -screen 0 $SCREEN -nolisten tcp
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
EOF

mk_unit antigravity-ide.service <<EOF
[Unit]
Description=[$LABEL] Antigravity IDE $AG_VER
Requires=antigravity-xvfb.service
After=antigravity-xvfb.service
[Service]
Type=simple
User=$ME
Environment=DISPLAY=:$DISPLAY_NUM
Environment=HOME=$MYHOME
Environment=ELECTRON_DISABLE_SANDBOX=1
ExecStartPre=/bin/sleep 2
ExecStart=$AG_DIR/antigravity --no-sandbox --disable-gpu --disable-dev-shm-usage
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
EOF

mk_unit antigravity-vnc.service <<EOF
[Unit]
Description=[$LABEL] x11vnc :$DISPLAY_NUM → :$VNC_PORT
Requires=antigravity-xvfb.service
After=antigravity-xvfb.service
[Service]
Type=simple
User=$ME
ExecStart=/usr/bin/x11vnc -display :$DISPLAY_NUM -forever -shared -rfbport $VNC_PORT -localhost -nopw
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
EOF

mk_unit antigravity-novnc.service <<EOF
[Unit]
Description=[$LABEL] noVNC web UI :$NOVNC_PORT
Requires=antigravity-vnc.service
After=antigravity-vnc.service
[Service]
Type=simple
User=$ME
ExecStart=/usr/bin/websockify --web /usr/share/novnc $NOVNC_PORT localhost:$VNC_PORT
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now antigravity-xvfb antigravity-ide antigravity-vnc antigravity-novnc

# ---- 4) Firewall lokal (iptables OCI) --------------------------------------
for port in "$NOVNC_PORT"; do
  if ! sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
    sudo iptables -I INPUT -p tcp --dport "$port" -j ACCEPT
    log "iptables: ACCEPT tcp/$port"
  fi
done
if need netfilter-persistent; then sudo netfilter-persistent save >/dev/null 2>&1 || true; fi

# ---- 5) Stempel & status ----------------------------------------------------
cat > "$PREFIX_DIR/share/$LABEL/INFO.json" <<EOF
{"label":"$LABEL","version":"$AG_VER","arch":"$ARCH","dir":"$AG_DIR",
 "display":":$DISPLAY_NUM","vnc_port":$VNC_PORT,"novnc_port":$NOVNC_PORT,
 "installed_at":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF
sleep 3
log "=== STATUS ==="
systemctl --no-pager --full status antigravity-xvfb antigravity-ide antigravity-vnc antigravity-novnc 2>/dev/null | grep -E "●|Active:" | head -12 || true
log "noVNC: http://<VM_IP>:$NOVNC_PORT/vnc.html   (x11vnc bind localhost → akses web via noVNC)"
log "SELESAI ✅  Jangan lupa buka tcp/$NOVNC_PORT di OCI Security List bila akses dari internet."
