#!/usr/bin/env bash
set -euo pipefail
repo_dir=$(cd "$(dirname "$0")/.." && pwd)
cd "$repo_dir"
npm install --ignore-scripts
node --input-type=module -e "import {VERSION, Lexmount, RunWaitTimeout, SessionsResource} from 'lexmount'; if (VERSION !== '0.9.0' || !('browserAgent' in Lexmount.prototype) || !RunWaitTimeout || typeof SessionsResource.prototype.getReplayUrl !== 'function') throw Error('Published Browser Agent SDK 0.9.0 is required')"
npm test
npx --no-install tsc --noEmit
