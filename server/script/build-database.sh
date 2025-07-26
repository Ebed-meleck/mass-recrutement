  #!/bin/bash

# do not silent error, and force to exit
set -o pipefail

# This assumes you run tests from the top level bhima directory.
echo "[build]"
echo "Build in database"

set -a
source .env || { echo '[build-database.sh] did not load .env, using variables from environment.' ; }
set +a

# set build timeout
TIMEOUT=${BUILD_TIMEOUT:-8}

fout=/dev/null

if [ "$1" == "debug" ]; then
    fout=/dev/tty
fi

# default database port
DB_PORT=${DB_PORT:-5432}

echo "Building database"
echo "postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

# build the test database
# drop first the database with dropdb
PGPASSWORD=$DB_PASS dropdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" --if-exists --force "$DB_NAME" || { echo 'failed to drop DB' ; exit 1; } 
# create the database with createdb
# defining --template="template0" is important for custom locale
PGPASSWORD=$DB_PASS createdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" --owner="$DB_USER" --template="template0" --encoding="UTF8"  --tablespace="pg_default" "$DB_NAME" || { echo 'failed to create DB' ; exit 1; }

echo "[build] database schema"
PGPASSWORD=$DB_PASS psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" < server/database/schema.sql || { echo 'failed to build DB schema' ; exit 1; }


echo "[import]"
PGPASSWORD=$DB_PASS psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" < server/database/default.sql || { echo 'failed to import content' ; exit 1; }


echo "[/build]"