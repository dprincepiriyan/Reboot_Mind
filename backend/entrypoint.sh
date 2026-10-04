#!/bin/sh
set -e

# Docker Compose sets WAIT_FOR_DB_HOST so we wait for the local Postgres container.
# Managed hosts (Render) don't set it; the app's startup retries/creates tables itself.
if [ -n "$WAIT_FOR_DB_HOST" ]; then
  echo "Waiting for Postgres at $WAIT_FOR_DB_HOST:5432..."
  while ! nc -z "$WAIT_FOR_DB_HOST" 5432; do
    sleep 0.5
  done
  echo "PostgreSQL is ready!"
fi

# Tables are created idempotently on app startup (see lifespan in main.py).
echo "Starting Uvicorn server on port ${PORT:-8000}..."
exec uvicorn mad_app.main:socket_app --host 0.0.0.0 --port "${PORT:-8000}"
