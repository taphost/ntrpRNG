# Changelog

All notable changes to ntrpRNG will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.2.1] – 2025-10-13

### Changed
- Renamed library file from `NtrpRng.js` to `ntrpRNG.js` for naming consistency.
- Updated main class name from `NtrpRng` → `ntrpRNG`.


## [1.2.0] - 2025-10-12

### Fixed
- Fixed entropy pattern repetition bug in `combineEntropy()` method
- Eliminated IEEE 754 floating-point representation artifacts that created repetitive patterns in binary data

### Added
- Pre-hashing of entropy pools with SHA-256 before byte concatenation
- `_serializeFloats()` private method for deterministic big-endian Float64 serialization using DataView
- Enhanced entropy distribution quality through pre-hash digests

### Changed
- `combineEntropy()` method is now asynchronous to support pre-hash operations
- Entropy pools are now serialized using DataView with big-endian encoding for consistency
- Seeds now have improved cryptographic properties with better entropy distribution

### Security
- Improved entropy quality by removing floating-point representation patterns
- Enhanced cryptographic strength through pre-hash processing of raw entropy data

## [1.1.1] - 2024

### Fixed
- Fixed infinite recursion bug in `getStats()` caused by circular dependency with `hasMinimumEntropy()`

### Improved
- Library stability and reliability
- Internal method call structure

## [1.1.0] - 2024

### Fixed
- Timer memory leaks in entropy collection
- Event listener cleanup issues

### Added
- Entropy validation system with `hasMinimumEntropy()` method
- `minEvents` configuration option for minimum entropy requirements

### Changed
- Symmetric XOR with truncated SHA-512 (32 bytes) for hash mixing
- Improved performance in entropy collection loop

### Security
- Better validation of entropy sufficiency before seed generation

## [1.0.0] - 2024

### Added
- Initial release
- Basic entropy collection from user events (mouse, keyboard, touch, scroll)
- Timer jitter collection from multiple sources (RAF, intervals, timeouts)
- SHA-256 and SHA-512 dual hashing algorithm
- Configurable hash iterations for key stretching
- Multiple output formats (raw bytes, hex, base64)
- Real-time statistics and monitoring via `getStats()`
- Auto-collection mode with manual control options
- Device motion entropy collection support
- ES Modules and browser global exports
- Zero external dependencies (native Web Crypto API only)

### Security
- Cryptographic salt generation via `crypto.getRandomValues()`
- Multi-stage hashing pipeline
- XOR mixing of dual hash algorithms
- 64-byte final output via SHA-512

---

## Version Numbering

- **Major version** (X.0.0): Breaking API changes
- **Minor version** (0.X.0): New features, backwards compatible
- **Patch version** (0.0.X): Bug fixes, backwards compatible

## Links

- [Repository](https://github.com/taphost/ntrpRNG)
- [Documentation](./API.md)
- [Usage Examples](./USAGE.md)