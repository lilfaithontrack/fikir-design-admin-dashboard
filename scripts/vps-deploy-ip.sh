#!/usr/bin/env bash
set -euo pipefail

APP_NAME="fikir-admin-dashboard"
APP_DIR="/var/www/${APP_NAME}"
SERVER_IP="116.203.128.35"
DB_NAME="fikir_admin"
DB_USER="fikir_user"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/vps-deploy-ip.sh"
  exit 1
fi

echo "=== ${APP_NAME} VPS Deploy (IP-only) ==="
echo
read -rp "Git repository URL (https/ssh): " REPO_URL
if [[ -z "${REPO_URL}" ]]; then
  echo "Repository URL is required."
  exit 1
fi

read -rsp "MySQL password for user '${DB_USER}': " DB_PASS
echo
if [[ -z "${DB_PASS}" ]]; then
  echo "Database password is required."
  exit 1
fi

read -rsp "JWT secret (long random text): " JWT_SECRET
echo
if [[ -z "${JWT_SECRET}" ]]; then
  echo "JWT secret is required."
  exit 1
fi

echo
echo "Choose runtime mode:"
echo "1) HTTP only (recommended for no domain)"
echo "2) HTTPS self-signed certificate (browser warning)"
read -rp "Enter 1 or 2: " SSL_MODE
if [[ "${SSL_MODE}" != "1" && "${SSL_MODE}" != "2" ]]; then
  echo "Invalid choice."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt update
apt upgrade -y
apt install -y curl git ufw fail2ban nginx mysql-server openssl

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs build-essential
fi

npm install -g pm2

ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable
systemctl enable fail2ban
systemctl restart fail2ban

mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

mkdir -p /var/www
if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" fetch --all
  git -C "${APP_DIR}" reset --hard origin/HEAD
else
  rm -rf "${APP_DIR}"
  git clone "${REPO_URL}" "${APP_DIR}"
fi

cat > "${APP_DIR}/.env" <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"
JWT_SECRET="${JWT_SECRET}"
NEXTAUTH_URL="http://${SERVER_IP}"
EOF

if [[ "${SSL_MODE}" == "2" ]]; then
  sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"https://${SERVER_IP}\"|" "${APP_DIR}/.env"
fi

cd "${APP_DIR}"
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

if [[ ! -f "${APP_DIR}/ecosystem.config.js" ]]; then
  cat > "${APP_DIR}/ecosystem.config.js" <<'EOF'
module.exports = {
  apps: [
    {
      name: 'fikir-admin-dashboard',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/fikir-admin-dashboard',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
EOF
fi

pm2 delete "${APP_NAME}" >/dev/null 2>&1 || true
pm2 start "${APP_DIR}/ecosystem.config.js"
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null || true

if [[ "${SSL_MODE}" == "1" ]]; then
  cat > /etc/nginx/sites-available/${APP_NAME} <<EOF
server {
    listen 80 default_server;
    server_name ${SERVER_IP} _;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
else
  mkdir -p /etc/nginx/ssl
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/fikir-ip.key \
    -out /etc/nginx/ssl/fikir-ip.crt \
    -subj "/CN=${SERVER_IP}"

  cat > /etc/nginx/sites-available/${APP_NAME} <<EOF
server {
    listen 80;
    server_name ${SERVER_IP};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${SERVER_IP};

    ssl_certificate /etc/nginx/ssl/fikir-ip.crt;
    ssl_certificate_key /etc/nginx/ssl/fikir-ip.key;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
fi

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}
nginx -t
systemctl restart nginx

if [[ ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q "/swapfile" /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

echo
echo "=== Deployment complete ==="
echo "App URL: http://${SERVER_IP}"
if [[ "${SSL_MODE}" == "2" ]]; then
  echo "App URL: https://${SERVER_IP} (self-signed cert warning expected)"
fi
echo
pm2 status
