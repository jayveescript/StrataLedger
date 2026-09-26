#!/bin/sh
# Creates the application role as a NON-superuser without BYPASSRLS so Postgres row-level security applies to the API.
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<SQL
CREATE ROLE strataledger LOGIN PASSWORD '${APP_DB_PASSWORD}' NOSUPERUSER NOBYPASSRLS NOCREATEROLE;
CREATE DATABASE strataledger OWNER strataledger;
SQL
