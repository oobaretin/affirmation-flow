#!/usr/bin/env bash
set -euo pipefail

DOWNLOADS_XCODE="$HOME/Downloads/Xcode.app"

if [ ! -d "$DOWNLOADS_XCODE" ]; then
  echo "Missing $DOWNLOADS_XCODE — download Xcode 16.1 from developer.apple.com first." >&2
  exit 1
fi

version="$(defaults read "$DOWNLOADS_XCODE/Contents/Info" CFBundleShortVersionString)"
echo "Installing Xcode $version into /Applications..."

sudo rm -rf /Applications/Xcode.app
sudo mv "$DOWNLOADS_XCODE" /Applications/
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

echo ""
xcodebuild -version
echo ""
echo "Done. Open Xcode once to finish installing components:"
echo "  open /Applications/Xcode.app"
