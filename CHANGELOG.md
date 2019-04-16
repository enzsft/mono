# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.1/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.2.1 - 2019-04-16

### Added

- Added Find command ([Issue #14](https://github.com/enzsft/mono/issues/14))

## [1.1.1] - 2019-03-24

### Added

- README docs for List command

## [1.1.0] - 2019-03-24

### Added

- Added List command ([Issue #13](https://github.com/enzsft/mono/issues/13))

## [1.0.2] - 2019-03-19

### Fixed

- Added `glob` as dependency due to `glob-promise` having it as a peer dependency ([Issue #12](https://github.com/enzsft/mono/issues/12))

## [1.0.1] - 2019-03-08

### Added

- Moved to babel compilation from TSC ([Issue #5](https://github.com/enzsft/mono/issues/10))
- Renamed interfaces to not use the convention of starting with 'I'
- Moved from TSLint to ESLint ([Issue #6](https://github.com/enzsft/mono/issues/11))

## [1.0.0] - 2019-02-25

### Added

- Add, Remove and Run commands
- Include and Dev options
- Package functions to get/filter packages and parse name/version strings
- Mono repo function to load mono repo config from directory in a mono repo
- Mono repo functions to create/delete whole mono repos for tests
- Setup repo
