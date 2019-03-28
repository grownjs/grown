#!/bin/bash

set -eu

# DO NOT remove this file, is automatically used by postgres through volumes
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS dblink;
EOSQL
