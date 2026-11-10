#!/usr/bin/env bash
# Site checks. Same command locally and in CI: bash scripts/check-site.sh
set -euo pipefail
cd "$(dirname "$0")/.."

fail=0
step() { printf '\n== %s\n' "$1"; }
bad() { echo "FAIL: $1"; fail=1; }

step "HTML parses (html-validate 9.5.0)"
npx --yes html-validate@9.5.0 --config .htmlvalidate.json index.html rosie-demo/index.html || bad "html-validate"

step "JavaScript syntax"
node --check gate.js || bad "gate.js"
node --check tools/encrypt-gate.mjs || bad "tools/encrypt-gate.mjs"

step "CNAME"
[ "$(cat CNAME)" = "ambientguidance.com" ] || bad "CNAME must read exactly ambientguidance.com"

step "No plaintext TestFlight link"
needle="testflight.apple"".com"
rc=0
git grep -I -i -n --untracked -e "$needle" -- . ':!scripts/check-site.sh' || rc=$?
if [ "$rc" -eq 0 ]; then
    bad "plaintext TestFlight link found"
elif [ "$rc" -gt 1 ]; then
    bad "TestFlight scan could not run (git grep exit $rc)"
fi

[ "$fail" -eq 0 ] && echo && echo "site checks passed"
exit "$fail"
