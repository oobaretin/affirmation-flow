#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DEVELOPER_DIR="$("$ROOT/scripts/resolve-developer-dir.sh")"
XCODE_APP="$(cd "$(dirname "$DEVELOPER_DIR")/.." && pwd)"

echo "Using $(defaults read "$XCODE_APP/Contents/Info" CFBundleShortVersionString) at $XCODE_APP"
open -a "$XCODE_APP" "$ROOT/ios/App/App.xcworkspace"
