# ntrpRNG 

### Cryptographically Secure Seed Generator
---
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.2.1-blue.svg)]()

A browser-based cryptographic seed generator that collects behavioral and temporal entropy from user interactions. Uses only native Web Crypto API (SHA-256/SHA-512) without external dependencies.

## 🧩 Why use it?

While `crypto.getRandomValues()` provides strong randomness for most purposes, it fully depends on the system’s hardware entropy sources (CPU RNG, TPM, Secure Boot, etc.).
In certain environments — such as sandboxed browsers, virtual machines, or low-latency servers where **fTPM or hardware RNGs are disabled** — these sources may be limited or unavailable.

`ntrpRNG.js` is designed to **remain functional and verifiable even when hardware entropy is missing**.
It collects timing and behavioral noise, applies multi-stage hashing, and maintains internal entropy pools to ensure consistent randomness quality across environments.

### Use cases

* Testing and benchmarking against `crypto.getRandomValues()`
* Environments with restricted or unreliable entropy (VMs, sandboxed browsers, air-gapped systems)
* Educational and research purposes: visualize and understand entropy dynamics
* Security testing: detect degraded RNG behavior or missing hardware entropy

## Features

### 🎯 Multiple Entropy Sources

* **User Events**: Mouse movements, clicks, keyboard input, touch gestures, scroll
* **Timer Jitter**: High-frequency microsecond deltas from `requestAnimationFrame`, `setInterval`, and recursive `setTimeout`
* **Device Motion**: Accelerometer and gyroscope data (when available)
* **Cryptographic Salt**: Hardware RNG via `crypto.getRandomValues()`

### 🔒 Robust Cryptographic Processing

* **Pre-Hash Entropy Pools**: SHA-256 digests eliminate IEEE 754 floating-point representation artifacts
* **Dual Hash Algorithm**: SHA-256 and SHA-512 with configurable iterations (default: 5000)
* **XOR Mixing**: Symmetric 32-byte XOR between truncated hashes
* **Multi-Stage Hashing**: Pre-hash → Iterative hash → XOR → Final hash
* **64-byte Output**: SHA-512 final output (128 hex chars / 88 base64 chars)

### ⚙️ Flexible Configuration

* **Configurable Iterations**: Balance between security and performance
* **Custom Salt Size**: Adjustable from 16 to 128 bytes
* **Minimum Entropy Validation**: Ensure sufficient randomness before generation
* **Auto-Collection**: Start/stop entropy gathering on demand

### 📊 Monitoring & Statistics

* Real-time entropy pool size tracking
* Event count by type (mouse, keyboard, touch, scroll, device motion)
* Entropy readiness validation
* Collection status monitoring

### 🚀 Easy Integration

* Zero dependencies (native Web Crypto API only)
* ES Modules and global window export
* Simple async/await API
* Multiple output formats (raw bytes, hex, base64)

## Installation

```html
<!-- Direct include -->
<script src="ntrpRNG.js"></script>

<!-- ES Module -->
<script type="module">
  import ntrpRNG from './ntrpRNG.js';
</script>
```

## Quick Start

```javascript
// Create instance with automatic entropy collection
const rng = new ntrpRNG({ minEvents: 50 });

// Wait for sufficient entropy
const checkEntropy = setInterval(async () => {
  const stats = rng.getStats();
  console.log(`Collecting: ${stats.totalEvents}/${rng.minEvents} events`);
  
  if (rng.hasMinimumEntropy()) {
    clearInterval(checkEntropy);
    
    // Generate seed
    const seedHex = await rng.generateSeedHex();
    console.log('Seed:', seedHex);
    
    // Stop collection
    rng.stopCollecting();
  }
}, 1000);
```

## API Reference

### Constructor

```javascript
new ntrpRNG(options)
```

**Options:**

* `iterations` (number): Hash iterations, default: 5000
* `saltSize` (number): Salt size in bytes, default: 32
* `autoCollect` (boolean): Auto-start collection, default: true
* `minEvents` (number): Minimum events before generation, default: 0

### Methods

#### Seed Generation

```javascript
await generateSeed(skipValidation = false)
```

Returns `Uint8Array` (64 bytes). Throws error if entropy insufficient and `skipValidation` is false.

```javascript
await generateSeedHex(skipValidation = false)
```

Returns hex string (128 characters).

```javascript
await generateSeedBase64(skipValidation = false)
```

Returns base64 string (88 characters).

#### Entropy Management

```javascript
startCollecting()
```

Begin collecting entropy from user events.

```javascript
stopCollecting()
```

Stop entropy collection and cleanup event listeners.

```javascript
clearEntropy()
```

Clear entropy pool and reset event counters.

```javascript
hasMinimumEntropy()
```

Returns `boolean` - true if sufficient entropy collected.

#### Utilities

```javascript
getStats()
```

Returns statistics object:

```javascript
{
  entropyPoolSize: 1234,
  timerDeltasSize: 567,
  isCollecting: true,
  eventCount: { mouse: 45, keyboard: 12, touch: 0, scroll: 3, other: 1 },
  totalEvents: 61,
  minEvents: 50,
  hasMinimumEntropy: true
}
```

```javascript
generateSalt()
```

Returns `Uint8Array` with cryptographic random salt.

```javascript
toHex(bytes)
```

Convert `Uint8Array` to hex string.

```javascript
toBase64(bytes)
```

Convert `Uint8Array` to base64 string.

## Documentation

* **Usage Examples**: See [EXAMPLES.md](docs/EXAMPLES.md) for beginner-friendly examples
* **API Reference**: See [API.md](docs/API.md) for complete API documentation
* **Changelog**: See [CHANGELOG.md](docs/CHANGELOG.md) for version history

## Tools

### ntrpRNG Test Bench

An interactive web-based dashboard for testing and demonstrating the ntrpRNG library's entropy collection and seed generation capabilities. Key features include:

* **Controls**: Start/stop entropy collection, generate seeds, clear pool, auto-generate, and stress testing.
* **Configuration**: Adjustable sliders for iterations, salt size, and minimum events, with quick presets (Quick, Standard, Secure).
* **Monitoring**: Live event statistics, progress bar, performance charts, and detailed logging.
* **Output**: Display generated seeds in Hex/Base64, copy functionality, seed history table with export (CSV/JSON), and uniqueness checks.

## Security Considerations

### Entropy Quality

* **User Interaction Required**: Needs actual user events for behavioral entropy
* **Minimum Events**: Set appropriate `minEvents` threshold (recommended: 50-100)
* **Timer Diversity**: Combines three timer sources for temporal randomness

### Cryptographic Strength

* **Hardware RNG**: Uses `crypto.getRandomValues()` for salt generation
* **Key Stretching**: Configurable iterations protect against brute force
* **Multi-Algorithm**: Combines SHA-256 and SHA-512 for defense in depth
* **Entropy Pre-Hashing**: Eliminates floating-point representation patterns for improved entropy distribution

### Best Practices

1. Always validate entropy before generation in production
2. Use minimum 50 user events for adequate randomness
3. Increase iterations for higher security needs (trade-off: performance)
4. Clear entropy pool between generations for unique seeds
5. Stop collection after generation to free resources

## Browser Compatibility

Requires modern browsers with:

* Web Crypto API (`crypto.subtle`)
* `crypto.getRandomValues()`
* `performance.now()`
* `requestAnimationFrame()`

Supported: Chrome 37+, Firefox 34+, Safari 11+, Edge 79+

## Performance

Typical generation time (5000 iterations):

* Desktop: 200-500ms
* Mobile: 500-1000ms

Higher iterations increase security but impact performance proportionally.

## Error Handling

```javascript
try {
  const seed = await rng.generateSeedHex();
} catch (error) {
  if (error.message.includes('Insufficient entropy')) {
    console.log('Need more user interaction');
    // Wait or skip validation
  }
}
```

## License

MIT License - See source file for details.

## Contributing

This library uses only native Web Crypto API without external dependencies. Contributions should maintain this constraint.

