#!/bin/sh
set -e

mkdir -p /app/uploads
chown -R appuser:appuser /app/uploads

su -s /bin/sh appuser -c "exec $*"
