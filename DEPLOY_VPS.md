# Fikir Admin Dashboard VPS Deployment (MySQL + HTTPS)

This guide deploys the app to Ubuntu VPS `116.203.128.35` with:
- Node.js 20
- MySQL 8
- PM2 process manager
- Nginx reverse proxy
- HTTPS via Let's Encrypt
- Basic server hardening and optimization

## 1) Connect to VPS

```bash
ssh root@116.203.128.35
```

## 2) System prep and security

```bash
apt update && apt upgrade -y
apt install -y curl git ufw fail2ban nginx
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
systemctl enable fail2ban
systemctl start fail2ban
```

## 3) Install Node.js 20 + PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs build-essential
npm install -g pm2
node -v
npm -v
```

## 4) Install and secure MySQL

```bash
apt install -y mysql-server
mysql_secure_installation
```

Create app database/user (replace strong password):

```bash
mysql -u root -p
```

Inside MySQL:

```sql
CREATE DATABASE fikir_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fikir_user'@'localhost' IDENTIFIED BY 'CHANGE_THIS_TO_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON fikir_admin.* TO 'fikir_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 5) Deploy app code

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/lilfaithontrack/fikir-design-admin-dashboard.git fikir-admin-dashboard
cd /var/www/fikir-admin-dashboard
npm ci
```

Create `.env`:

```bash
nano /var/www/fikir-admin-dashboard/.env
```

Use at least:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="mysql://fikir_user:CHANGE_THIS_TO_STRONG_PASSWORD@localhost:3306/fikir_admin"
JWT_SECRET="REPLACE_WITH_LONG_RANDOM_SECRET"
NEXTAUTH_URL="https://YOUR_DOMAIN"
```

## 6) Prisma migrations + build

```bash
cd /var/www/fikir-admin-dashboard
npx prisma generate
npx prisma migrate deploy
npm run build
```

Run **one command per line** in the shell (do not paste `migrate deploy` on the same line as `git pull` output).

Safe all-in-one after `git pull`:

```bash
npm run db:setup
```

(`generate` → `migrate deploy` → `seed` in order.)

`prisma/migrations/` is tracked in this repo. After `git pull`, always run `npx prisma migrate deploy` before `npm run seed` or the DB will have no tables (`P2021`).

## 7) Run with PM2

```bash
cd /var/www/fikir-admin-dashboard
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root
pm2 status
```

## 8) Configure Nginx reverse proxy

Create site config:

```bash
nano /etc/nginx/sites-available/fikir-admin-dashboard
```

Paste (replace `YOUR_DOMAIN`):

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:

```bash
ln -s /etc/nginx/sites-available/fikir-admin-dashboard /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 9) Enable HTTPS (Let's Encrypt)

Point your domain A record first:
- `YOUR_DOMAIN` -> `116.203.128.35`
- `www.YOUR_DOMAIN` -> `116.203.128.35`

Then install SSL:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
systemctl status certbot.timer
```

## 10) Performance optimization checklist

- Keep swap enabled (2GB recommended for smaller VPS):

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

- Add gzip in Nginx `/etc/nginx/nginx.conf` inside `http {}`:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript application/xml+rss application/xml text/javascript image/svg+xml;
gzip_min_length 1000;
gzip_comp_level 5;
```

- Keep app updated safely:

```bash
cd /var/www/fikir-admin-dashboard
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart fikir-admin-dashboard
```

## 11) Health checks

```bash
pm2 logs fikir-admin-dashboard --lines 100
systemctl status nginx
curl -I http://127.0.0.1:3000
curl -I https://YOUR_DOMAIN
```

## Notes

- Let's Encrypt requires a real domain. HTTPS for raw IP alone is not practical for trusted browsers.
- If you only have IP and no domain, use a self-signed certificate (browser warning) or buy/connect a domain.

## IP-only deployment (no domain)

If you want to run only on public IP `116.203.128.35`, use one of these:

### Fastest way (single script, prompts for passwords)

From your VPS, run:

```bash
git clone https://github.com/lilfaithontrack/fikir-design-admin-dashboard.git /var/www/fikir-admin-dashboard
cd /var/www/fikir-admin-dashboard
bash scripts/vps-deploy-ip.sh
```

The script will ask you for:
- your repository URL
- MySQL password
- JWT secret
- HTTP or self-signed HTTPS mode

After it finishes, app is live on your public IP.

### Option A: HTTP on public IP (recommended for IP-only)

Nginx site config:

```nginx
server {
    listen 80 default_server;
    server_name 116.203.128.35 _;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Set in `.env`:

```env
NEXTAUTH_URL="http://116.203.128.35"
```

### Option B: HTTPS with self-signed cert (works, but browser warning)

Create certificate:

```bash
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/fikir-ip.key \
  -out /etc/nginx/ssl/fikir-ip.crt \
  -subj "/CN=116.203.128.35"
```

Nginx config:

```nginx
server {
    listen 80;
    server_name 116.203.128.35;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 116.203.128.35;

    ssl_certificate /etc/nginx/ssl/fikir-ip.crt;
    ssl_certificate_key /etc/nginx/ssl/fikir-ip.key;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Set in `.env`:

```env
NEXTAUTH_URL="https://116.203.128.35"
```

Reload Nginx:

```bash
nginx -t && systemctl reload nginx
```
