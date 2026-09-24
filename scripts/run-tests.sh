#!/bin/sh
# Runs the test suite in the same container CI uses; falls back to local Node without Docker.
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    exec docker compose run --rm --quiet-pull test
fi
echo "Docker unavailable, running tests with local Node." >&2
exec npm run check --silent
