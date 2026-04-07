#!/usr/bin/env sh
set -eu

TARGET_NAME="${1:-mail-qianban-worker}"
sed -i "s/^name = \"mail-worker\"$/name = \"${TARGET_NAME}\"/" wrangler.toml
npx wrangler deploy
