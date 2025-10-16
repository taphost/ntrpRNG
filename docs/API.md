# ntrpRNG API Documentation

Version 1.3.0

## Table of Contents

- [Constructor](#constructor)
- [Methods](#methods)
  - [Entropy Collection](#entropy-collection)
  - [Seed Generation](#seed-generation)
  - [Utilities](#utilities)
- [Properties](#properties)
- [Types](#types)
- [Error Handling](#error-handling)
- [Breaking Changes](#breaking-changes)

---

## Constructor

### `new ntrpRNG(options)`

Creates a new ntrpRNG instance.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options` | `Object` | `{}` | Configuration options |
| `options.iterations` | `number` | `5000` | Number of hash iterations for key stretching |
| `options.saltSize` | `number` | `32` | Salt size in bytes (16-128 recommended) |
| `options.autoCollect` | `boolean` | `true` | Automatically start entropy collection |

**⚠️ BREAKING CHANGE:** `options.minEvents` is no longer configurable. Minimum events are hardcoded to 500 for security. Any attempt to override will trigger a console warning and be ignored.

**Security:** Constructor includes integrity check #1 to prevent tampering with minimum event constants.

**Returns:** `ntrpRNG` instance

**Throws:** `Error` if minimum event constants are tampered

**Example:**
```javascript
const rng = new ntrpRNG({
  iterations: 10000,
  saltSize: 64,
  autoCollect: true
});
```

---

## Methods

### Entropy Collection

#### `startCollecting()`

Starts collecting entropy from user events and timers. Registers event listeners for:
- **Mouse events** (mousemove: weight 1, mousedown: weight 2)
- **Keyboard events** (keydown: weight 3)
- **Touch events** (touchstart: weight 2, touchmove: weight 1)
- **Scroll events** (scroll: weight 1)
- **Device motion events** (devicemotion: weight 2, if available)
- **High-frequency timer jitter** (RAF, intervals, timeouts)

**Weighted Event System (v1.3.0):**
- Keyboard events contribute more entropy (weight 3)
- Mouse down, touch start, device motion have medium weight (2)
- Movement and scroll events have base weight (1)

**Returns:** `void`

**Example:**
```javascript
rng.startCollecting();
```

---

#### `stopCollecting()`

Stops entropy collection and removes all event listeners. Cleans up timers and requestAnimationFrame.

**Returns:** `void`

**Example:**
```javascript
rng.stopCollecting();
```

---

#### `clearEntropy()`

Clears the entropy pool and resets all event counters to zero. Does not stop collection.

**Returns:** `void`

**Example:**
```javascript
rng.clearEntropy();
```

---

#### `hasMinimumEntropy()`

Checks if sufficient entropy has been collected. Requires 500 weighted events minimum.

**Security:** Includes integrity check #2 to prevent tampering with minimum event constants.

**Returns:** `boolean` - `true` if weighted event count ≥ 500 and pools are not empty

**Throws:** `Error` if minimum event constants are tampered

**Example:**
```javascript
if (rng.hasMinimumEntropy()) {
  const seed = await rng.generateSeed();
}
```

---

### Seed Generation

#### `generateSeed(skipValidation)`

Generates a cryptographically secure 64-byte seed using dual-path fortification.

**Dual-Path Fortification Process (v1.3.0):**

**Path A - User Entropy (Primary Trust Anchor):**
1. Serializes entropy pools to big-endian Float64 bytes
2. Pre-hashes with SHA-256 to eliminate IEEE 754 artifacts
3. Combines hashed pools with cryptographic salt
4. Applies 5000 iterations of SHA-256 (with async batching)
5. Applies 5000 iterations of SHA-512 (with async batching)
6. XORs truncated results → `user_final` (32 bytes)

**Path B - CSPRNG Whitening:**
1. Generates 64 fresh random bytes via `crypto.getRandomValues()`
2. Hashes with SHA-256 → 32 bytes
3. Hashes with SHA-512, truncates → 32 bytes
4. XORs results → `csprng_final` (32 bytes)

**Final Mixing:**
1. Concatenates: `user_final || csprng_final || salt` (96 bytes)
2. SHA-512 hash → intermediate (64 bytes)
3. SHA-512 hash of intermediate → final seed (64 bytes)

**Async Batching:** Hashing performed in batches of 100 iterations with `setTimeout(0)` yielding to prevent UI blocking.

**Security:** Includes integrity check #3 before generation.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skipValidation` | `boolean` | `false` | Skip minimum entropy validation |

**Returns:** `Promise<Uint8Array>` - 64-byte seed

**Throws:** 
- `Error` if entropy insufficient and `skipValidation` is `false`
- `Error` if minimum event constants are tampered

**Example:**
```javascript
try {
  const seed = await rng.generateSeed();
  console.log(seed); // Uint8Array(64)
} catch (error) {
  console.error('Insufficient entropy:', error.message);
}
```

**⚠️ Non-Deterministic:** Unlike v1.2.1, seeds are NOT reproducible. Path B introduces fresh randomness on every call, even with identical user entropy.

---

#### `generateSeedHex(skipValidation)`

Generates seed and returns as hexadecimal string.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skipValidation` | `boolean` | `false` | Skip minimum entropy validation |

**Returns:** `Promise<string>` - 128-character hex string

**Example:**
```javascript
const seedHex = await rng.generateSeedHex();
console.log(seedHex); // "a3f2c1..." (128 chars)
```

---

#### `generateSeedBase64(skipValidation)`

Generates seed and returns as Base64 string.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skipValidation` | `boolean` | `false` | Skip minimum entropy validation |

**Returns:** `Promise<string>` - 88-character Base64 string

**Example:**
```javascript
const seedB64 = await rng.generateSeedBase64();
console.log(seedB64); // "o/LC..." (88 chars)
```

---

### Utilities

#### `getProgress()` ✨ NEW

Returns progress toward minimum entropy requirement with UX-friendly metrics.

**Returns:** `Object` - Progress information

**Return Type:**
```typescript
{
  currentEvents: number;      // Current weighted event count
  requiredEvents: number;     // Required minimum (always 500)
  percentage: number;         // Progress percentage (0-100)
  ready: boolean;             // True when currentEvents >= 500
}
```

**Example:**
```javascript
const progress = rng.getProgress();
console.log(`Progress: ${progress.percentage.toFixed(1)}%`);
console.log(`Events: ${progress.currentEvents}/${progress.requiredEvents}`);
if (progress.ready) {
  console.log('Ready to generate seed!');
}
```

**UI Integration:**
```javascript
function updateProgressBar() {
  const progress = rng.getProgress();
  document.getElementById('progress').style.width = progress.percentage + '%';
  document.getElementById('status').textContent = 
    `${progress.currentEvents}/${progress.requiredEvents} events`;
  document.getElementById('generateBtn').disabled = !progress.ready;
}

setInterval(updateProgressBar, 100);
```

---

#### `generateSalt()`

Generates cryptographically secure random salt using `crypto.getRandomValues()`.

**Returns:** `Uint8Array` - Random salt of size `saltSize`

**Example:**
```javascript
const salt = rng.generateSalt();
console.log(salt); // Uint8Array(32)
```

---

#### `combineEntropy(salt)`

Combines collected entropy pools with salt. Pre-hashes entropy pools to eliminate floating-point representation artifacts.

**Internal method** - Called automatically by `generateSeed()`.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `salt` | `Uint8Array` | Cryptographic salt |

**Returns:** `Promise<Uint8Array>` - Combined entropy data

**Process:**
1. Serializes `entropyPool` floats to big-endian bytes (DataView)
2. Serializes `timerDeltas` floats to big-endian bytes
3. Pre-hashes each with SHA-256
4. Concatenates both 32-byte digests with salt

---

#### `getStats()`

Returns detailed statistics about entropy collection state.

**⚠️ BREAKING CHANGE:** `totalEvents` now returns weighted sum instead of raw event count.

**Returns:** `Object` - Statistics object

**Return Type:**
```typescript
{
  entropyPoolSize: number;        // Number of values in entropy pool
  timerDeltasSize: number;        // Number of timer delta values
  isCollecting: boolean;          // Collection active status
  eventCount: {
    mouse: number;                // Weighted mouse events
    keyboard: number;             // Weighted keyboard events
    touch: number;                // Weighted touch events
    scroll: number;               // Weighted scroll events
    other: number;                // Weighted other events
  };
  totalEvents: number;            // Weighted sum of all events
  minEvents: number;              // Hardcoded to 500
  hasMinimumEntropy: boolean;     // Validation result
}
```

**Example:**
```javascript
const stats = rng.getStats();
console.log(`Weighted events: ${stats.totalEvents}/500`);
console.log(`Pool size: ${stats.entropyPoolSize}`);
console.log(`Ready: ${stats.hasMinimumEntropy}`);
```

---

#### `toHex(bytes)`

Converts byte array to hexadecimal string.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `bytes` | `Uint8Array` | Byte array to convert |

**Returns:** `string` - Lowercase hex string

**Example:**
```javascript
const bytes = new Uint8Array([255, 0, 128]);
const hex = rng.toHex(bytes);
console.log(hex); // "ff0080"
```

---

#### `toBase64(bytes)`

Converts byte array to Base64 string.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `bytes` | `Uint8Array` | Byte array to convert |

**Returns:** `string` - Base64 string

**Example:**
```javascript
const bytes = new Uint8Array([255, 0, 128]);
const b64 = rng.toBase64(bytes);
console.log(b64); // "/wCA"
```

---

## Properties

### Public Properties

| Property | Type | Description |
|----------|------|-------------|
| `iterations` | `number` | Configured hash iterations (default: 5000) |
| `saltSize` | `number` | Configured salt size in bytes (default: 32) |
| `minEvents` | `number` | **Hardcoded to 500** (not configurable) |
| `isCollecting` | `boolean` | Current collection status |
| `entropyPool` | `Array<number>` | Collected entropy values |
| `timerDeltas` | `Array<number>` | Collected timer deltas |
| `eventCount` | `Object` | Weighted event counters by type |

**Note:** Direct modification of these properties is not recommended.

---

## Types

### EventCount

```typescript
interface EventCount {
  mouse: number;      // Weighted count (move=1, down=2)
  keyboard: number;   // Weighted count (keydown=3)
  touch: number;      // Weighted count (start=2, move=1)
  scroll: number;     // Weighted count (scroll=1)
  other: number;      // Weighted count (devicemotion=2)
}
```

### Stats

```typescript
interface Stats {
  entropyPoolSize: number;
  timerDeltasSize: number;
  isCollecting: boolean;
  eventCount: EventCount;
  totalEvents: number;            // Weighted sum
  minEvents: number;              // Always 500
  hasMinimumEntropy: boolean;
}
```

### Progress ✨ NEW

```typescript
interface Progress {
  currentEvents: number;          // Current weighted count
  requiredEvents: number;         // Always 500
  percentage: number;             // 0-100
  ready: boolean;                 // currentEvents >= 500
}
```

---

## Error Handling

### Insufficient Entropy Error

Thrown by seed generation methods when `skipValidation` is `false` and weighted event count < 500.

**Error Message Format:**
```
Insufficient entropy. Weighted events: {actual}/500, Pool: {poolSize}, Timer: {timerSize}
```

**Example:**
```javascript
try {
  const seed = await rng.generateSeed();
} catch (error) {
  if (error.message.includes('Insufficient entropy')) {
    console.log('Need more user interaction');
    
    // Monitor progress
    const interval = setInterval(async () => {
      const progress = rng.getProgress();
      console.log(`${progress.percentage.toFixed(1)}% complete`);
      
      if (progress.ready) {
        clearInterval(interval);
        const seed = await rng.generateSeed();
        console.log('Seed generated!');
      }
    }, 500);
  }
}
```

### Integrity Check Errors

Thrown by constructor, `hasMinimumEntropy()`, and `generateSeed()` if minimum event constants are tampered.

**Error Message:**
```
Security integrity check failed: minimum events constant tampered
```

**Example:**
```javascript
try {
  const rng = new ntrpRNG();
} catch (error) {
  console.error('Security violation detected:', error.message);
}
```

---

## Performance Considerations

### Generation Time (v1.3.0)

Async batching adds overhead but prevents UI blocking:

| Iterations | Desktop | Mobile | Notes |
|------------|---------|--------|-------|
| 1000 | 60-120ms | 120-250ms | Minimal batching overhead |
| 5000 (default) | 250-600ms | 600-1200ms | +100-200ms from batching |
| 10000 | 500-1200ms | 1200-2500ms | Recommended for high security |

**Batching Behavior:**
- 100 iterations per batch
- `setTimeout(0)` between batches
- Non-blocking UI updates during generation
- Suitable for real-time applications

### Memory Usage

- Entropy pool: Capped at 5000 values (~40KB)
- Timer deltas: Capped at 1000 values (~8KB)
- Total overhead: < 100KB during collection

---

## Browser Compatibility

### Required APIs

- `crypto.subtle.digest()` - SHA-256/SHA-512 hashing
- `crypto.getRandomValues()` - Hardware RNG
- `performance.now()` - High-resolution timestamps
- `requestAnimationFrame()` - High-frequency timer
- `DataView` - Float64 serialization
- `setTimeout()` - Async batching

### Supported Browsers

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 37+ |
| Firefox | 34+ |
| Safari | 11+ |
| Edge | 79+ |
| Opera | 24+ |

---

## Security Notes

### Threat Model (v1.3.0)

**Designed for scenarios where `crypto.getRandomValues()` is suspected compromised or backdoored.** User behavioral entropy serves as the primary trust anchor, with CSPRNG providing output whitening.

**NOT a replacement for `crypto.getRandomValues()` in standard scenarios.** For normal applications, native Web Crypto API is sufficient and faster.

### Entropy Sources

The library combines multiple independent entropy sources:

1. **Behavioral** (Primary):
   - Mouse movement and clicks (position + timing)
   - Keyboard events (timing + key choice)
   - Touch interactions (position + pressure + timing)
   - Scroll events
   
2. **Temporal**:
   - High-frequency timer jitter (RAF, intervals, timeouts)
   - Performance.now() microsecond precision
   - Date.now() millisecond timestamps
   
3. **Hardware** (Whitening):
   - Cryptographic salt from `crypto.getRandomValues()`
   - Fresh random bytes in Path B
   
4. **Environmental** (Optional):
   - Device motion (accelerometer/gyroscope)

### Entropy Estimates (Weighted System)

- **Keyboard events:** ~8-10 bits per event (weight 3)
- **Mouse down/Touch start:** ~4-6 bits per event (weight 2)
- **Mouse move/Touch move/Scroll:** ~2-4 bits per event (weight 1)
- **Device motion:** ~3-5 bits per event (weight 2)

**Total:** 500 weighted events ≈ 150-200 bits effective entropy from user behavior

### Security Margin

Combined with CSPRNG fortification:
- **User entropy:** ~150-200 bits (primary trust)
- **CSPRNG whitening:** 512 bits (if trusted)
- **Total security margin:** >256 bits
- **Even if CSPRNG compromised:** User entropy provides security baseline

### Cryptographic Process (v1.3.0)

**Dual-path fortification ensures security even if one path is compromised:**

```
PATH A (User Trust Anchor):
  entropyPool + timerDeltas
    ↓ serialize (Float64 big-endian)
    ↓ SHA-256 pre-hash (remove IEEE 754 patterns)
    ↓ combine with salt
    ↓ SHA-256 (5000 iterations, batched)
    ↓ SHA-512 (5000 iterations, batched, truncated)
    ↓ XOR
  → user_final (32 bytes)

PATH B (CSPRNG Whitening):
  crypto.getRandomValues(64)
    ↓ SHA-256
    ↓ SHA-512 (truncated)
    ↓ XOR
  → csprng_final (32 bytes)

FINAL MIXING:
  user_final || csprng_final || salt
    ↓ SHA-512
    ↓ SHA-512
  → seed (64 bytes)
```

### Hardcoded Security Requirements (v1.3.0)

**Minimum 500 weighted events enforced with triple integrity checks:**

```javascript
const REQUIRED_MIN_EVENTS = 500;
const _VERIFY_A = 0x1F4;    // 500 in hex
const _VERIFY_B = 500;
const _VERIFY_C = 250 * 2;

// Check #1: Constructor
// Check #2: hasMinimumEntropy()
// Check #3: generateSeed()
```

**Prevents:**
- Runtime tampering with minEvents
- Test mode bypasses in production
- Accidental weakening of security requirements

### Best Practices

1. **Production use:** 
   - Never skip validation
   - Wait for full 500 weighted events (~5-10 seconds interaction)
   - Use `getProgress()` for user feedback

2. **High security:** 
   - Use `iterations: 10000`
   - Collect 1000+ weighted events if time permits
   - Generate multiple independent seeds

3. **Resource cleanup:** 
   - Call `stopCollecting()` when done
   - Call `clearEntropy()` between generations
   - Monitor `getStats()` for pool sizes

4. **Error handling:**
   - Always catch insufficient entropy errors
   - Provide UI feedback during collection
   - Never use `skipValidation` in production

5. **Key derivation:**
   - Use generated seed as input to KDF (e.g., PBKDF2, Argon2)
   - Derive multiple keys from single seed
   - Never reuse seeds directly as keys

---

## Advanced Usage

### Real-time Progress Monitoring

```javascript
const rng = new ntrpRNG();

function updateUI() {
  const progress = rng.getProgress();
  const stats = rng.getStats();
  
  document.getElementById('progress').style.width = progress.percentage + '%';
  document.getElementById('events').textContent = 
    `${progress.currentEvents}/${progress.requiredEvents}`;
  document.getElementById('details').textContent = 
    `Keyboard: ${stats.eventCount.keyboard}, ` +
    `Mouse: ${stats.eventCount.mouse}, ` +
    `Touch: ${stats.eventCount.touch}`;
  
  if (progress.ready) {
    document.getElementById('generateBtn').disabled = false;
  }
}

setInterval(updateUI, 100);
```

### Event-Driven Generation

```javascript
const rng = new ntrpRNG({ autoCollect: false });

// Start on first interaction
document.addEventListener('click', () => {
  rng.startCollecting();
  console.log('Entropy collection started');
}, { once: true });

// Auto-generate when ready
const monitor = setInterval(async () => {
  const progress = rng.getProgress();
  
  if (progress.ready) {
    clearInterval(monitor);
    console.log('Generating seed...');
    
    const seed = await rng.generateSeedHex();
    console.log('Seed:', seed);
    
    rng.stopCollecting();
  } else {
    console.log(`Progress: ${progress.percentage.toFixed(1)}%`);
  }
}, 500);
```

### Multiple Seed Generation

```javascript
async function generateMultipleSeeds(count) {
  const rng = new ntrpRNG();
  const seeds = [];
  
  // Wait for initial entropy
  while (!rng.hasMinimumEntropy()) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  for (let i = 0; i < count; i++) {
    const seed = await rng.generateSeedHex();
    seeds.push(seed);
    
    // Clear and collect fresh entropy
    rng.clearEntropy();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  rng.stopCollecting();
  return seeds;
}

generateMultipleSeeds(5).then(seeds => {
  console.log(`Generated ${seeds.length} independent seeds`);
  seeds.forEach((seed, i) => console.log(`Seed ${i+1}:`, seed));
});
```

### Stress Testing Uniqueness

```javascript
async function testUniqueness(count) {
  const rng = new ntrpRNG({ iterations: 1000 });
  const seeds = new Set();
  
  // Generate seeds rapidly
  for (let i = 0; i < count; i++) {
    const seed = await rng.generateSeedHex(true);
    seeds.add(seed);
    
    if (i % 100 === 0) {
      console.log(`Generated ${i}/${count}`);
    }
  }
  
  const uniqueRate = (seeds.size / count * 100).toFixed(4);
  console.log(`Unique: ${seeds.size}/${count} (${uniqueRate}%)`);
  
  rng.stopCollecting();
  
  // Should be 100% due to Path B randomness
  return seeds.size === count;
}

testUniqueness(1000);
```

---

## Breaking Changes

### v1.2.1 → v1.3.0

#### API Breaking Changes

1. **`minEvents` option removed**
   ```javascript
   // v1.2.1 (allowed)
   const rng = new ntrpRNG({ minEvents: 100 });
   
   // v1.3.0 (ignored, warning issued)
   const rng = new ntrpRNG({ minEvents: 100 });
   // Console: "ntrpRNG: minEvents override ignored. Hardcoded to 500 for security."
   ```

2. **Export name changed**
   ```javascript
   // v1.2.1
   const rng = new window.ntrpRng();
   
   // v1.3.0
   const rng = new window.ntrpRNG();  // Uppercase RNG
   ```

#### Behavioral Breaking Changes

3. **Non-deterministic seed generation**
   ```javascript
   // v1.2.1 (reproducible)
   const seed1 = await rng.generateSeed();
   const seed2 = await rng.generateSeed();
   // seed1 ≈ seed2 (if pool unchanged)
   
   // v1.3.0 (always unique)
   const seed1 = await rng.generateSeed();
   const seed2 = await rng.generateSeed();
   // seed1 ≠ seed2 (Path B introduces fresh randomness)
   ```

4. **Weighted event counting**
   ```javascript
   // v1.2.1
   stats.totalEvents // Raw count: 10 keyboard = 10
   
   // v1.3.0
   stats.totalEvents // Weighted: 10 keyboard = 30
   ```

5. **Longer generation time**
   ```javascript
   // v1.2.1: ~200-500ms (blocking)
   // v1.3.0: ~300-700ms (non-blocking, batched)
   ```

### Migration Guide

1. **Remove `minEvents` from configuration:**
   ```javascript
   // Before
   const rng = new ntrpRNG({ minEvents: 50 });
   
   // After (just remove it)
   const rng = new ntrpRNG();
   ```

2. **Update export references:**
   ```javascript
   // Before
   const RNG = window.ntrpRng;
   
   // After
   const RNG = window.ntrpRNG;
   ```

3. **Update event threshold checks:**
   ```javascript
   // Before
   if (stats.totalEvents >= 50) { ... }
   
   // After (account for weighting)
   if (stats.totalEvents >= 500) { ... }
   // Or use the new method:
   if (rng.getProgress().ready) { ... }
   ```

4. **Remove deterministic seed assumptions:**
   ```javascript
   // Before (reproducible seeds)
   const seed = await rng.generateSeed();
   // seed derived only from user entropy
   
   // After (unique seeds)
   const seed = await rng.generateSeed();
   // seed = user_entropy XOR fresh_randomness
   // Always unique, even with identical user input
   ```

5. **Account for async batching in tight loops:**
   ```javascript
   // Before (may block UI)
   for (let i = 0; i < 10; i++) {
     const seed = await rng.generateSeed(true);
     // synchronous, may freeze UI
   }
   
   // After (yields between batches)
   for (let i = 0; i < 10; i++) {
     const seed = await rng.generateSeed(true);
     // +100-200ms per seed, UI remains responsive
   }
   ```

---

## Changelog

### v1.3.0 (Current)
- **SECURITY:** Hardcoded 500 minimum events with triple integrity checks
- **SECURITY:** Dual-path XOR fortification (user entropy + CSPRNG)
- Weighted event counting (keyboard=3, mouse_down/touch/motion=2, move/scroll=1)
- Asynchronous batching for 5000 iterations (non-blocking UI)
- Double-hash final mixing (SHA-512 → SHA-512)
- New `getProgress()` method for UX feedback
- Fixed export: `window.ntrpRNG` (uppercase)
- **BREAKING:** `minEvents` no longer configurable
- **BREAKING:** Seeds now non-deterministic
- **BREAKING:** `totalEvents` returns weighted sum

### v1.2.1
- Renamed file: `NtrpRng.js` → `ntrpRNG.js`
- Renamed class: `NtrpRng` → `ntrpRNG`
- Pre-hashing to eliminate IEEE 754 artifacts

### v1.2.0
- Initial release with entropy collection
- Multi-stage hashing with SHA-256/SHA-512
- Configurable iterations and minEvents

---

## License

MIT License - See source file for details