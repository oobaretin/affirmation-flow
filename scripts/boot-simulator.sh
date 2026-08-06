#!/usr/bin/env bash
# Boot iPhone 16 Pro Max on iOS 18.1 for AffirmEaze development.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DEVELOPER_DIR="$("$ROOT/scripts/resolve-developer-dir.sh")"

IOS_18_1_PRO_MAX="C8D9D134-EDE7-41E0-B12C-591250C9673A"
RUNTIME="com.apple.CoreSimulator.SimRuntime.iOS-18-1"

if ! xcrun simctl list runtimes | grep -q "iOS 18.1"; then
  echo "iOS 18.1 simulator runtime not found." >&2
  echo "Install it in Xcode → Settings → Platforms → iOS 18.1" >&2
  exit 1
fi

if ! xcrun simctl list devices | grep -q "$IOS_18_1_PRO_MAX"; then
  IOS_18_1_PRO_MAX="$(xcrun simctl create "iPhone 16 Pro Max" com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro-Max "$RUNTIME")"
fi

xcrun simctl shutdown all 2>/dev/null || true
xcrun simctl boot "$IOS_18_1_PRO_MAX"
open -a Simulator

echo "Booted iPhone 16 Pro Max on iOS 18.1 ($IOS_18_1_PRO_MAX)"
