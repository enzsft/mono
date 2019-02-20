<div align="center">
  <h1>@enzsft/mono</h1>
  <h1>😲</h1>
  <h3>Manage JavaScript mono repos with ease.</h3>
  <a href='https://travis-ci.org/enzsft/mono'>
    <img src="https://travis-ci.org/enzsft/mono.svg?branch=master" alt="Build Status" />
  </a>
  <a href="https://codecov.io/github/enzsft/mono?branch=master">
    <img src="https://codecov.io/github/enzsft/mono/coverage.svg?branch=master" alt="Coverage via Codecov" />
  </a>
  <a href="https://www.npmjs.com/package/@enzsft/mono">
    <img src="https://badge.fury.io/js/%40enzsft%2Fmono.svg" alt="npm version">
  </a>
  <img alt="undefined" src="https://img.shields.io/github/languages/top/enzsft/mono.svg?style=flat">
</div>
<hr />

Managing mono repos should be easy. We've written **@enzsft/mono** to make it easy to work with mono repos and perform common tasks across multiple packages easily!

**This package has a hard dependency on [Yarn Workspaces](https://yarnpkg.com/lang/en/docs/workspaces/). Please ensure you have Yarn installed and Workspaces enabled.**

## Motivation 🧐

Yarn Workspaces are amazing! We ❤️ them! However they're missing a few features that we think are essential to a complete mono repo tool. This package merely builds upon Yarn Workspaces and adds a few features we hope they'll add in the future 🙂. Seriously, Yarn does **all** the heavy lifting in this package so you know you're in good hands, we merely orchestrate it and nudge it in the right direction.

## Getting started 🏎

Getting up and running is fast! ⚡️

### 1. Install the package:

```bash
yarn global add @enzsft/mono
```

### 2. Use the tool:

```bash
# Add react to all packages
mono add react react-dom

# Already have a tool installed called 'mono'?
# Not a problem, just use the alternative tool name!
enz-mono add react react-dom
```

## Commands

### Add

Use the Add command to add dependencies to packages in your mono repo.

```bash
mono add react react-dom

# Dev dependencies
mono add jest --dev

# Shorthand dev dependencies
mono add jest -D
```

### Run

Use the Run command to run NPM scripts in packages in your mono repo.

```bash
mono run start

# Forwarding arguments to the NPM script
mono run test -- --coverage
```

### Remove

Use the Remove command to remove dependencies from packages in your mono repo.

```bash
mono remove react react-dom
```

## Common options

### Include

Use the Include option to filter packages on a command:

```bash
# Only add to the package named 'app'
mono add react react-dom --include app

# Shorthand
mono add react react-dom -i app

# Only add to the packages named 'app' and 'e2e'
mono add jest --include app,e2e

# Add to all packages starting with 'app-'
mono add react react-dom --include app-*
```

## Built with TypeScript with 💖

[TypeScript](https://www.typescriptlang.org/) type definitions are bundled in with the module. No need to install an additional module for type definitions.

## Alternatives 😽

[Lerna](https://www.npmjs.com/package/lerna) is a great alternative with fleshed out features. Unlike Lerna this tool does not focus on publishing packages.
