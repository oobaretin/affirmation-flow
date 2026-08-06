#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DEVELOPER_DIR="$("$ROOT/scripts/resolve-developer-dir.sh")"
export PATH="$HOME/.gem/ruby/2.6.0/bin:${PATH:-}"
export LANG="${LANG:-en_US.UTF-8}"

exec "$@"
