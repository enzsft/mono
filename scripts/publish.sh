#!/bin/sh

set -e

# Assert quality (includes build)
./scripts/quality-check.sh

# Move into newly built package
cd .build

# Finally publish
npm adduser
npm publish --access public
