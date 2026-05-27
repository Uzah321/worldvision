#!/bin/bash
# ============================================================
#  WorldVision AMS — One-shot VPS Setup Script
#  Tested on: Ubuntu 22.04 LTS
#  Run as:    sudo bash setup-server.sh
# ============================================================
set -euo pipefail

SERVER_IP="93.127.142.6"
REPO_URL="https://github.com/Uzah321/worldvision.git"
APP_DIR="/var/www/worldvision"
DB_NAME="worldvision"
DB_USER="worldvision"
DB_PASS="$(openssl rand -base64 20 | tr -d '=+/')"

echo "========================================================"
echo "  WorldVision AMS — Server Setup"
echo "  Server: $SERVER_IP"
echo "========================================================"

# ── 1. System packages ──────────────────────────────────────
echo "[1/9] Updating system packages..."
apt-get update -y -q
apt-get install -y -q software-properties-common curl git unzip

# ── 2. PHP 8.3 ──────────────────────────────────────────────
echo "[2/9] Installing PHP 8.3..."
add-apt-repository -y ppa:ondrej/php > /dev/null
apt-get update -y -q
apt-get install -y -q \
    php8.3-fpm php8.3-cli \
    php8.3-mysql php8.3-mbstring php8.3-xml \
    php8.3-zip php8.3-curl php8.3-gd php8.3-bcmath php8.3-intl

# ── 3. Nginx ────────────────────────────────────────────────
echo "[3/9] Installing Nginx..."
apt-get install -y -q nginx

# ── 4. MySQL ────────────────────────────────────────────────
echo "[4/9] Installing MySQL..."
DEBIAN_FRONTEND=noninteractive apt-get install -y -q mysql-server

# Create DB and user
mysql -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo "DB_PASS=$DB_PASS" > /root/worldvision-credentials.txt
echo "  ✓ Database credentials saved to /root/worldvision-credentials.txt"

# ── 5. Node.js 20 & Composer ────────────────────────────────
echo "[5/9] Installing Node.js 20 and Composer..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
apt-get install -y -q nodejs
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer > /dev/null

# ── 6. Clone / pull repo ────────────────────────────────────
echo "[6/9] Cloning repository..."
if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" pull origin master
else
    git clone "$REPO_URL" "$APP_DIR"
fi

# ── 7. Laravel backend setup ────────────────────────────────
echo "[7/9] Setting up Laravel backend..."
cd "$APP_DIR/backend"

composer install --no-dev --optimize-autoloader --no-interaction -q

# Write .env
cat > .env << EOF
APP_NAME="WorldVision AMS"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://$SERVER_IP

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=$DB_NAME
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASS

CORS_ALLOWED_ORIGINS=http://$SERVER_IP

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync

LOG_CHANNEL=stderr
LOG_LEVEL=error
EOF

php artisan key:generate --force
php artisan storage:link --force
php artisan migrate --force
php artisan db:seed --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

chown -R www-data:www-data "$APP_DIR/backend"
chmod -R 775 "$APP_DIR/backend/storage"
chmod -R 775 "$APP_DIR/backend/bootstrap/cache"

# ── 8. React frontend build ─────────────────────────────────
echo "[8/9] Building React frontend..."
cd "$APP_DIR/frontend"
npm ci --silent
# Frontend and backend share the same origin, so use relative /api
echo "VITE_API_URL=/api" > .env
npm run build

chown -R www-data:www-data "$APP_DIR/frontend/dist"

# ── 9. Nginx configuration ──────────────────────────────────
echo "[9/9] Configuring Nginx..."

cat > /etc/nginx/sites-available/worldvision << 'NGINX'
server {
    listen 80;
    server_name _;

    # ── React SPA (default root) ──────────────────────────
    root /var/www/worldvision/frontend/dist;
    index index.html;

    # ── Laravel API: all /api/* requests ──────────────────
    location ^~ /api {
        root /var/www/worldvision/backend/public;
        try_files $uri $uri/ /index.php?$query_string;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/worldvision/backend/public/index.php;
            fastcgi_param REQUEST_URI     $request_uri;
        }
    }

    # ── Laravel health check endpoint ─────────────────────
    location ^~ /up {
        root /var/www/worldvision/backend/public;
        try_files $uri /index.php?$query_string;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/worldvision/backend/public/index.php;
            fastcgi_param REQUEST_URI     $request_uri;
        }
    }

    # ── SPA fallback (all other routes) ───────────────────
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

# Enable site, remove default
ln -sf /etc/nginx/sites-available/worldvision /etc/nginx/sites-enabled/worldvision
rm -f /etc/nginx/sites-enabled/default

# Validate and reload
nginx -t
systemctl enable nginx php8.3-fpm mysql
systemctl restart nginx php8.3-fpm

echo ""
echo "========================================================"
echo "  ✓ Deployment complete!"
echo ""
echo "  App URL : http://$SERVER_IP"
echo "  Creds   : /root/worldvision-credentials.txt"
echo ""
echo "  Default login: admin@worldvision.org / Admin@1234!"
echo "========================================================"
