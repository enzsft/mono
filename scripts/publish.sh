#!/bin/sh

set -e

# Build and quality check
yarn build
yarn lint
yarn test --coverage

# Move into newly built package
cd .build

# Finally publish
npm adduser
npm publish --access public
