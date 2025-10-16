# Changelog

All notable changes to ntrpRNG will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2025-10-15

### 🔒 Security

- **CRITICAL:** Hardcoded minimum event requirement to 500 with triple integrity checks
  - Added three independent validation constants (`REQUIRED_MIN_EVENTS`, `_VERIFY_A`, `_VERIFY_B`, `_VERIFY_C`)
  - Integrity checks in constructor, `hasMinimumEntropy()`, and `generateSeed()`
  - Prevents runtime tampering with security requirements
- Implemented dual-path XOR fortification architecture
  - Path A: User behavioral entropy (primary trust anchor)
  - Path B: CSPRNG whitening via `crypto.getRandomValues()`
  - XOR mixing provides >256-bit security margin
- Enhanced final mixing with double-hash (SHA-512 → SHA-512)
- Designed for scenarios where CSPRNG may be compromised/backdoored

### Added

- New `getProgress()` method for real-time UX feedback
  - Returns current/required events, percentage, and ready status
  - Enables progress bars and user interaction guidance
- Weighted event counting system
  - Keyboard events: weight 3 (~8-10 bits entropy)
  - Mouse down, touch start, device motion: weight 2 (~4-6 bits)
  - Mouse move, touch move, scroll: weight 1 (~2-4 bits)
  - Total 500 weighted events ≈ 150-200 bits effective entropy
- Asynchronous hash batching (100 iterations/batch)
  - Non-blocking UI during 5000 iterations
  - `setTimeout(0)` yields between batches
  - Maintains responsiveness in real-time applications

### Changed

- **BREAKING:** Removed `options.minEvents` configuration parameter
  - Now hardcoded to 500 for security
  - Attempts to override trigger console warning
  - No exceptions, no test mode bypass
- **BREAKING:** `getStats().totalEvents` now returns weighted sum instead of raw count
- **BREAKING:** Seed generation is now non-deterministic
  - Path B introduces fresh randomness on every call
  - Same user entropy produces different seeds
  - Improves security but breaks reproducibility
- **BREAKING:** Export name changed from `window.ntrpRng` to `window.ntrpRNG` (uppercase RNG)
- Updated all event handlers to use weighted increments
- Enhanced `generateSeed()` with dual-path architecture
- Modified `hasMinimumEntropy()` to check weighted event count ≥ 500

### Performance

- Generation time increased by ~100-200ms due to async batching
- UI remains responsive during 5000-iteration hashing
- Suitable for real-time web applications

### Documentation

- Added comprehensive security considerations section
- Updated threat model documentation
- Added migration guide for v1.2.1 → v1.3.0
- New API documentation for `getProgress()` method

### Migration Notes

1. Remove `minEvents` from constructor options (now ignored)
2. Update `window.ntrpRng` references to `window.ntrpRNG`
3. Update event threshold checks to account for weighted counting
4. Remove assumptions about deterministic/reproducible seeds
5. Account for +100-200ms generation overhead in tight loops

---

## [1.2.1] - 2025-10-13

### Changed

- Renamed library file from `NtrpRng.js` to `ntrpRNG.js` for naming consistency
- Updated main class name from `NtrpRng` → `ntrpRNG`

---

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

---

## [1.1.1] - 2024

### Fixed

- Fixed infinite recursion bug in `getStats()` caused by circular dependency with `hasMinimumEntropy()`

### Improved

- Library stability and reliability
- Internal method call structure

---

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

---

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

## Upgrade Paths

### From v1.2.x to v1.3.0

**Required changes:**
1. Remove `minEvents` from configuration (no longer supported)
2. Update `window.ntrpRng` to `window.ntrpRNG`
3. Update event counting logic (now weighted)
4. Remove seed reproducibility assumptions

**Optional enhancements:**
1. Implement `getProgress()` for better UX
2. Increase `iterations` to 10000 for higher security
3. Add progress bars during seed generation

### From v1.1.x to v1.2.0+

**Required changes:**
1. Update `combineEntropy()` calls to use `await` (now async)

**Benefits:**
1. Improved entropy quality
2. Eliminated floating-point artifacts

### From v1.0.x to v1.1.0+

**Required changes:**
1. Add entropy validation before seed generation

**Benefits:**
1. Configurable minimum event requirements
2. Better entropy sufficiency checks

## Links

- [Repository](https://github.com/taphost/ntrpRNG)
- [API Documentation](./API.md)
- [Usage Examples](./USAGE.md)
- [Security Considerations](./SECURITY.md)