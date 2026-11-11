#!/bin/sh
set -e

cd /var/www/html

# Clone novo não tem .env (ele é ignorado pelo git): parte do exemplo.
if [ ! -f .env ]; then
    cp .env.example .env
fi

# O volume anônimo de vendor/ nasce vazio quando é recriado.
if [ ! -f vendor/autoload.php ]; then
    echo "[entrypoint] instalando dependências do Composer..."
    composer install --no-interaction --no-scripts --prefer-dist
fi

if ! grep -q '^APP_KEY=base64:' .env; then
    php artisan key:generate --force
fi

mkdir -p storage/framework/cache/data storage/framework/sessions \
         storage/framework/views storage/logs bootstrap/cache
# Só os diretórios: um `chmod -R` marcaria os arquivos como executáveis e o git
# do host veria o bind mount inteiro como modificado.
find storage bootstrap/cache -type d -exec chmod 777 {} + 2>/dev/null || true

php artisan config:clear >/dev/null 2>&1 || true

echo "[entrypoint] aguardando o MongoDB em ${MONGODB_URI}..."
until php -r '
$uri = getenv("MONGODB_URI") ?: "mongodb://mongo:27017";
try {
    (new MongoDB\Driver\Manager($uri))
        ->executeCommand("admin", new MongoDB\Driver\Command(["ping" => 1]));
    exit(0);
} catch (Throwable $e) {
    exit(1);
}' 2>/dev/null; do
    sleep 1
done
echo "[entrypoint] MongoDB respondeu."

# DB_SEED: auto (semeia só quando o banco está vazio), always, never.
seed() {
    echo "[entrypoint] populando o banco com os dados de demonstração..."
    php artisan db:seed --class=DemoSeeder --force
}

case "${DB_SEED:-auto}" in
    always)
        seed
        ;;
    never)
        ;;
    *)
        EMPTY=$(php -r '
$uri = getenv("MONGODB_URI") ?: "mongodb://mongo:27017";
$db  = getenv("MONGODB_DATABASE") ?: "basi_escalas";
$query = new MongoDB\Driver\Query([], ["limit" => 1]);
$rows = (new MongoDB\Driver\Manager($uri))->executeQuery("$db.users", $query)->toArray();
echo $rows === [] ? "1" : "0";
')
        [ "$EMPTY" = "1" ] && seed
        ;;
esac

exec "$@"
