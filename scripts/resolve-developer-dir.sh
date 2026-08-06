#!/usr/bin/env bash
# Prefer Xcode 16.1+ for Capacitor/RN builds. Falls back to /Applications.

xcode_version() {
  local app="$1"
  defaults read "$app/Contents/Info" CFBundleShortVersionString 2>/dev/null
}

version_ge() {
  [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

for candidate in \
  "/Applications/Xcode.app" \
  "$HOME/Downloads/Xcode.app"; do
  if [ -d "$candidate/Contents/Developer" ]; then
    version="$(xcode_version "$candidate")"
    if [ -n "$version" ] && version_ge "$version" "16.1"; then
      echo "$candidate/Contents/Developer"
      exit 0
    fi
  fi
done

if [ -d "/Applications/Xcode.app/Contents/Developer" ]; then
  echo "/Applications/Xcode.app/Contents/Developer"
  exit 0
fi

echo "No Xcode installation found" >&2
exit 1
