#!/bin/sh
# wait-for-db.sh

set -e

host=$(echo $DATABASE_URL | sed 's/.*@\(.*\):.*/\1/')
port=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')

echo "Waiting for PostgreSQL to be ready on $host:$port..."

# Wait for the database to be ready
until node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT 1').then(() => { console.log('PostgreSQL is ready!'); process.exit(0); }).catch(err => { console.error('PostgreSQL is not ready:', err); process.exit(1); })"; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing command"
exec "$@"