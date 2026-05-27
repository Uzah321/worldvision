#!/bin/bash
# ============================================================
#  WorldVision AMS — Redeploy (pull latest changes)
#  Run as:  sudo bash redeploy.sh
# ============================================================
set -euo pipefail

APP_DIR="/var/www/worldvision"

echo "==> Pulling latest code..."
git -C "$APP_DIR" pull origin master

echo "==> Updating PHP dependencies..."
cd "$APP_DIR/backend"
composer install --no-dev --optimize-autoloader --no-interaction -q

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Refreshing caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Rebuilding frontend..."
cd "$APP_DIR/frontend"
npm ci --silent
npm run build

echo "==> Fixing permissions..."
chown -R www-data:www-data "$APP_DIR/backend" "$APP_DIR/frontend/dist"
chmod -R 775 "$APP_DIR/backend/storage" "$APP_DIR/backend/bootstrap/cache"

echo "==> Reloading services..."
systemctl reload php8.3-fpm
nginx -t && systemctl reload nginx

echo ""
echo "  ✓ Redeployment complete — http://93.127.142.6"
