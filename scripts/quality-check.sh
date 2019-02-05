#!/bin/sh

set -e

yarn build
yarn lint
yarn test --coverage
