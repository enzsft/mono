#!/bin/sh

set -e

# Clean old build
rm -rf .build

# Build code
tsc

# Copy files
cp README.md .build/README.md
cp package.json .build/package.json

# Make entry executable
chmod u+x .build/index.js
