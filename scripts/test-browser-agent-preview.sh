#!/usr/bin/env bash
set -euo pipefail
sdk_dir=$(cd "${1:?Usage: bash scripts/test-browser-agent-preview.sh /path/to/lexmount-js-sdk}" && pwd)
repo_dir=$(cd "$(dirname "$0")/.." && pwd)
(cd "$sdk_dir" && npm ci && npm run build)
cd "$repo_dir"
npm install --ignore-scripts
npm install --no-save --package-lock=false "$sdk_dir"
node --input-type=module -e "import {Lexmount, RunWaitTimeout} from 'lexmount'; if (!('browserAgent' in Lexmount.prototype) || !RunWaitTimeout) throw Error('Companion Browser Agent SDK is required')"
npm test
npx tsc --noEmit
