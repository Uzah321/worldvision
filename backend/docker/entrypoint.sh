#!/bin/bash
set -e

# Railway injects PORT; default to 80 for Render/local environments
export PORT="${PORT:-80}"

# Patch Apache to listen on the correct port
sed -i "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/g" /etc/apache2/sites-available/000-default.conf

# Railway provides DATABASE_URL; map it to the variable Laravel expects
if [ -n "$DATABASE_URL" ] && [ -z "$DB_URL" ]; then
  export DB_URL="$DATABASE_URL"
fi

echo "==> Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Running database migrations..."
php artisan migrate --force

echo "==> Starting Apache on port ${PORT}..."
exec apache2-foreground
