#!/bin/sh
set -e

echo "Waiting for Postgres at postgres:5432..."
while ! nc -z postgres 5432; do
  sleep 0.5
done
echo "PostgreSQL is ready!"

echo "Running database migrations..."
alembic upgrade head

echo "Starting Uvicorn server..."
exec uvicorn mad_app.main:socket_app --host 0.0.0.0 --port 8000 --reload
