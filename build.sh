#!/usr/bin/env bash
# Builds dist/focus-timer/ (the folder to copy to the tablet) and dist/focus-timer.zip
set -euo pipefail
cd "$(dirname "$0")"

RCC="$(command -v rcc || command -v rcc6 || true)"
if [ -z "$RCC" ]; then
  for p in /opt/homebrew/share/qt/libexec/rcc /opt/homebrew/opt/qt/share/qt/libexec/rcc /opt/homebrew/opt/qt/libexec/rcc; do
    if [ -x "$p" ]; then RCC="$p"; break; fi
  done
fi
if [ -z "$RCC" ]; then echo "rcc not found. Install Qt with: brew install qt"; exit 1; fi

node tests/test.js
rm -rf dist && mkdir -p dist/focus-timer
"$RCC" --binary -o dist/focus-timer/resources.rcc src/resources.qrc
cp package/manifest.json package/icon.png dist/focus-timer/
cp src/qml/focus.js docs/focus.js        # keep the web demo in sync
(cd dist && zip -qr focus-timer.zip focus-timer)
echo "Built dist/focus-timer and dist/focus-timer.zip"
