#!/bin/sh

set -e

# Clean old build
rm -rf .build

# Build code
tsc --declaration

# Copy files
cp README.md .build/README.md
cp package.json .build/package.json
