# ntrpRNG - Cryptographically Secure Seed Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)]()

A browser-based cryptographic seed generator that collects behavioral and temporal entropy from user interactions and fortifies it with CSPRNG output. Designed for scenarios where `crypto.getRandomValues()` may be compromised. Uses only native Web Crypto API (SHA-256/SHA-512) without external dependencies.

## ⚠️ v1.3.0 Breaking Changes

- **Hardcoded 500 minimum events** (not configurable)
- **Export name**: `window.ntrpRng` → `window.ntrpRNG`
- **Weighted event counting**: keyboard=3, mouse_down/touch/motion=2, move/scroll=1
- **Non-deterministic seeds**: Path B introduces fresh randomness on every generation
- See [CHANGELOG.md](CHANGELOG.md) for migration guide

## Features

### 🎯 Multiple Entropy Sources

**User Behavioral Entropy (Primary Trust Anchor):**
- **Mouse**: Movements (weight 1), clicks (weight 2) - position + timing
- **Keyboard**: Key events (weight 3) - timing + choice
- **Touch**: Start (weight 2), move (weight 1) - position + pressure
- **Scroll**: Events (weight 1)
- **Device Motion**: Accelerometer/gyroscope (weight 2)

**Temporal Entropy:**
- High-frequency timer jitter: `requestAnimationFrame`, `setInterval`, recursive `setTimeout`
- Microsecond precision: `performance.now()` + `Date.now()`

**Hardware Entropy (Whitening):**
- Cryptographic salt via `crypto.getRandomValues()`
- Fresh random bytes in Path B for fortification

### 🔒 Dual-Path Fortification (v1.3.0)

**Path A - User Entropy (Primary):**
```
Behavioral + Temporal
  ↓ Serialize Float64 big-endian
  ↓ SHA-256 pre-hash (remove IEEE 754 patterns)
  ↓ Combine with salt
  ↓ SHA-256 × 5000 iterations (batched)
  ↓ SHA-512 × 5000 iterations (batched, truncated)
  ↓ XOR
→ 32 bytes
```

**Path B - CSPRNG Whitening:**
```
crypto.getRandomValues(64)
  ↓ SHA-256
  ↓ SHA-512 (truncated)
  ↓ XOR
→ 32 bytes
```

**Final Mixing:**
```
Path A || Path B || Salt
  ↓ SHA-512
  ↓ SHA-512
→ 64-byte seed
```

### 🛡️ Security Hardening

- **500 minimum weighted events** (~5-10 seconds interaction, ~150-200 bits entropy)
- **Triple integrity checks**: Prevents runtime tampering with security requirements
- **Async batching**: 100 iterations/batch, non-blocking UI
- **Security margin**: >256 bits even if CSPRNG compromised

### ⚙️ Configuration & Monitoring

- **Configurable iterations**: Balance security vs performance (default: 5000)
- **Custom salt size**: 16-128 bytes (default: 32)
- **Progress tracking**: New `getProgress()` method for UX feedback
- **Real-time stats**: Pool sizes, weighted event counts, entropy readiness

### 🚀 Easy Integration

- Zero dependencies (native Web Crypto API only)
- ES Modules and global window export
- Simple async/await API
- Multiple output formats (raw bytes, hex, base64)

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
// Create instance (500 minimum events enforced)
const rng = new ntrpRNG();

// Monitor progress
const monitor = setInterval(async () => {
  const progress = rng.getProgress();
  console.log(`Progress: ${progress.percentage.toFixed(1)}%`);
  console.log(`Events: ${progress.currentEvents}/${progress.requiredEvents}`);
  
  if (progress.ready) {
    clearInterval(monitor);
    
    // Generate seed
    const seedHex = await rng.generateSeedHex();
    console.log('Seed:', seedHex);
    
    // Cleanup
    rng.stopCollecting();
  }
}, 500);
```

## API Reference

### Constructor

```javascript
new ntrpRNG(options)
```

**Options:**
- `iterations` (number): Hash iterations, default: 5000
- `saltSize` (number): Salt size in bytes, default: 32
- `autoCollect` (boolean): Auto-start collection, default: true

**Note:** `minEvents` is hardcoded to 500 and cannot be overridden.

### Key Methods

#### Seed Generation

```javascript
await generateSeed(skipValidation = false)
```
Returns `Uint8Array` (64 bytes). Non-deterministic output.

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
stopCollecting()
clearEntropy()
hasMinimumEntropy() // Returns boolean
```

#### Progress Tracking (NEW)

```javascript
getProgress()
```
Returns:
```javascript
{
  currentEvents: 245,        // Current weighted count
  requiredEvents: 500,       // Always 500
  percentage: 49.0,          // 0-100
  ready: false               // currentEvents >= 500
}
```

#### Statistics

```javascript
getStats()
```
Returns detailed statistics including weighted event counts, pool sizes, and collection status.

## Usage Examples

### Progress Bar Implementation

```javascript
const rng = new ntrpRNG();

function updateUI() {
  const progress = rng.getProgress();
  
  document.getElementById('progress').style.width = progress.percentage + '%';
  document.getElementById('status').textContent = 
    `${progress.currentEvents}/500 events`;
  document.getElementById('generateBtn').disabled = !progress.ready;
}

setInterval(updateUI, 100);

document.getElementById('generateBtn').addEventListener('click', async () => {
  const seed = await rng.generateSeedHex();
  console.log('Generated:', seed);
  rng.stopCollecting();
});
```

### Multiple Seed Generation

```javascript
async function generateMultipleSeeds(count) {
  const rng = new ntrpRNG();
  const seeds = [];
  
  while (!rng.hasMinimumEntropy()) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  for (let i = 0; i < count; i++) {
    seeds.push(await rng.generateSeedHex());
    rng.clearEntropy();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  rng.stopCollecting();
  return seeds;
}
```

### Error Handling

```javascript
try {
  const seed = await rng.generateSeedHex();
} catch (error) {
  if (error.message.includes('Insufficient entropy')) {
    const progress = rng.getProgress();
    console.log(`Need ${500 - progress.currentEvents} more events`);
  } else if (error.message.includes('integrity check')) {
    console.error('Security violation detected');
  }
}
```

## Documentation

- **API Reference**: [API.md](docs/API.md) - Complete API documentation
- **Changelog**: [CHANGELOG.md](docs/CHANGELOG.md) - Version history and migration guide
- **Examples**: [EXAMPLES.md](docs/EXAMPLES.md) - Additional usage examples

## Security Considerations

### Threat Model

Designed for scenarios where `crypto.getRandomValues()` is **suspected compromised or backdoored**. User behavioral entropy serves as the primary trust anchor, with CSPRNG providing output whitening.

**NOT a replacement** for `crypto.getRandomValues()` in standard scenarios. For normal applications, native Web Crypto API is sufficient and faster.

### Entropy Estimates

- **Keyboard events**: ~8-10 bits per event (weight 3)
- **Mouse/Touch down**: ~4-6 bits per event (weight 2)
- **Movement/Scroll**: ~2-4 bits per event (weight 1)
- **Total 500 weighted events**: ~150-200 bits effective entropy

Combined with CSPRNG fortification: **>256-bit security margin**

### Security Hardening Features

1. **Triple Integrity Checks**: Constructor, validation, and generation
2. **Hardcoded Requirements**: No runtime override of 500 minimum events
3. **Pre-hash Entropy**: Eliminates IEEE 754 floating-point patterns
4. **Dual-path Architecture**: Security even if one path compromised
5. **Async Batching**: 5000 iterations without UI blocking

### Best Practices

1. **Never skip validation** in production
2. **Wait for full 500 weighted events** (~5-10 seconds interaction)
3. **Use `getProgress()` for user feedback**
4. **Clear entropy between generations** for unique seeds
5. **Stop collection after generation** to free resources
6. **Use 10000 iterations** for high-security scenarios
7. **Derive keys properly** using KDF (PBKDF2, Argon2)

## Performance

### Generation Time (v1.3.0)

| Iterations | Desktop | Mobile | Notes |
|------------|---------|--------|-------|
| 5000 (default) | 300-700ms | 700-1400ms | +100-200ms from async batching |
| 10000 | 600-1400ms | 1400-3000ms | High security |

Async batching ensures UI remains responsive during generation.

### Memory Usage

- Entropy pool: Capped at 5000 values (~40KB)
- Timer deltas: Capped at 1000 values (~8KB)
- Total overhead: <100KB

## Browser Compatibility

**Required APIs:**
- `crypto.subtle.digest()` (SHA-256/SHA-512)
- `crypto.getRandomValues()` (Hardware RNG)
- `performance.now()` (High-resolution timestamps)
- `requestAnimationFrame()` (High-frequency timer)
- `DataView` (Float64 serialization)

**Supported Browsers:**
- Chrome 37+
- Firefox 34+
- Safari 11+
- Edge 79+
- Opera 24+

## Tools

### ntrpRNG Test Bench

Interactive web-based dashboard for testing and demonstrating ntrpRNG capabilities:

- **Real-time monitoring**: Progress bars, event statistics, performance charts
- **Configuration presets**: Quick, Standard, Secure modes
- **Seed management**: History, export (CSV/JSON), uniqueness testing
- **Stress testing**: Batch generation and validation

## Migration from v1.2.1

### Required Changes

1. **Remove `minEvents` option** (now ignored, console warning)
   ```javascript
   // Before
   const rng = new ntrpRNG({ minEvents: 50 });
   
   // After
   const rng = new ntrpRNG();
   ```

2. **Update export reference**
   ```javascript
   // Before
   const RNG = window.ntrpRng;
   
   // After
   const RNG = window.ntrpRNG;
   ```

3. **Account for weighted events**
   ```javascript
   // Before: raw count
   if (stats.totalEvents >= 50) { ... }
   
   // After: weighted count
   if (rng.getProgress().ready) { ... }
   ```

4. **Remove seed reproducibility assumptions**
   - v1.2.1: Same user entropy → same seed
   - v1.3.0: Always unique due to Path B randomness

### Recommended Enhancements

- Implement `getProgress()` for progress bars
- Increase `iterations` to 10000 for higher security
- Add UI feedback during 5-10 second collection period

## License

MIT License - See source file for details.

## Contributing

This library uses only native Web Crypto API without external dependencies. Contributions should maintain this constraint and adhere to the security-focused design principles.