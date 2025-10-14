# ntrpRNG API Documentation

Version 1.2.1

## Table of Contents

- [Constructor](#constructor)
- [Methods](#methods)
  - [Entropy Collection](#entropy-collection)
  - [Seed Generation](#seed-generation)
  - [Utilities](#utilities)
- [Properties](#properties)
- [Types](#types)
- [Error Handling](#error-handling)

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
| `options.minEvents` | `number` | `0` | Minimum user events required before seed generation |

**Returns:** `ntrpRNG` instance

**Example:**
```javascript
const rng = new ntrpRNG({
  iterations: 10000,
  saltSize: 64,
  autoCollect: true,
  minEvents: 50
});
```

---

## Methods

### Entropy Collection

#### `startCollecting()`

Starts collecting entropy from user events and timers. Registers event listeners for:
- Mouse events (mousemove, mousedown)
- Keyboard events (keydown)
- Touch events (touchstart, touchmove)
- Scroll events
- Device motion events (if available)
- High-frequency timer jitter (RAF, intervals, timeouts)

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

Checks if sufficient entropy has been collected based on `minEvents` configuration.

**Returns:** `boolean` - `true` if entropy requirements are met

**Example:**
```javascript
if (rng.hasMinimumEntropy()) {
  const seed = await rng.generateSeed();
}
```

---

### Seed Generation

#### `generateSeed(skipValidation)`

Generates a cryptographically secure 64-byte seed using collected entropy.

**Process:**
1. Generates cryptographic salt via `crypto.getRandomValues()`
2. Serializes entropy pools to big-endian Float64 bytes using DataView
3. Pre-hashes serialized pools with SHA-256 to eliminate IEEE 754 artifacts
4. Combines hashed pools with salt
5. Applies iterative SHA-256 and SHA-512 hashing
6. XORs both hash results
7. Final SHA-512 hash of combined data

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skipValidation` | `boolean` | `false` | Skip minimum entropy validation |

**Returns:** `Promise<Uint8Array>` - 64-byte seed

**Throws:** `Error` if entropy is insufficient and `skipValidation` is `false`

**Example:**
```javascript
try {
  const seed = await rng.generateSeed();
  console.log(seed); // Uint8Array(64)
} catch (error) {
  console.error('Insufficient entropy:', error.message);
}
```

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
1. Serializes `entropyPool` floats to big-endian bytes
2. Serializes `timerDeltas` floats to big-endian bytes
3. Pre-hashes each with SHA-256
4. Concatenates both 32-byte digests with salt

---

#### `getStats()`

Returns detailed statistics about entropy collection state.

**Returns:** `Object` - Statistics object

**Return Type:**
```typescript
{
  entropyPoolSize: number;        // Number of values in entropy pool
  timerDeltasSize: number;        // Number of timer delta values
  isCollecting: boolean;          // Collection active status
  eventCount: {
    mouse: number;                // Mouse event count
    keyboard: number;             // Keyboard event count
    touch: number;                // Touch event count
    scroll: number;               // Scroll event count
    other: number;                // Other events (device motion)
  };
  totalEvents: number;            // Sum of all events
  minEvents: number;              // Configured minimum
  hasMinimumEntropy: boolean;     // Validation result
}
```

**Example:**
```javascript
const stats = rng.getStats();
console.log(`Events: ${stats.totalEvents}/${stats.minEvents}`);
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
| `iterations` | `number` | Configured hash iterations |
| `saltSize` | `number` | Configured salt size in bytes |
| `minEvents` | `number` | Minimum events requirement |
| `isCollecting` | `boolean` | Current collection status |
| `entropyPool` | `Array<number>` | Collected entropy values |
| `timerDeltas` | `Array<number>` | Collected timer deltas |
| `eventCount` | `Object` | Event counters by type |

**Note:** Direct modification of these properties is not recommended.

---

## Types

### EventCount

```typescript
interface EventCount {
  mouse: number;
  keyboard: number;
  touch: number;
  scroll: number;
  other: number;
}
```

### Stats

```typescript
interface Stats {
  entropyPoolSize: number;
  timerDeltasSize: number;
  isCollecting: boolean;
  eventCount: EventCount;
  totalEvents: number;
  minEvents: number;
  hasMinimumEntropy: boolean;
}
```

---

## Error Handling

### Insufficient Entropy Error

Thrown by `generateSeed()`, `generateSeedHex()`, and `generateSeedBase64()` when `skipValidation` is `false` and minimum entropy requirements are not met.

**Error Message Format:**
```
Insufficient entropy. Events: {actual}/{required}, Pool: {poolSize}, Timer: {timerSize}
```

**Example:**
```javascript
try {
  const seed = await rng.generateSeed();
} catch (error) {
  if (error.message.includes('Insufficient entropy')) {
    console.log('Need more user interaction');
    // Option 1: Wait for more events
    setTimeout(() => tryAgain(), 1000);
    
    // Option 2: Skip validation (not recommended)
    const seed = await rng.generateSeed(true);
  }
}
```

---

## Performance Considerations

### Generation Time

Seed generation time is primarily affected by the `iterations` parameter:

| Iterations | Desktop | Mobile |
|------------|---------|--------|
| 1000 | 50-100ms | 100-200ms |
| 5000 (default) | 200-500ms | 500-1000ms |
| 10000 | 400-1000ms | 1000-2000ms |

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

### Entropy Sources

The library combines multiple entropy sources:
1. **Behavioral**: User mouse, keyboard, touch, scroll events
2. **Temporal**: High-frequency timer jitter from RAF, intervals, timeouts
3. **Hardware**: Cryptographic salt from `crypto.getRandomValues()`
4. **Environmental**: Device motion (accelerometer/gyroscope) when available

### Cryptographic Process

**v1.2.0 Improvements:**
- Pre-hashing eliminates IEEE 754 floating-point representation patterns
- Deterministic big-endian serialization via DataView
- Each entropy pool independently hashed before combination

**Multi-stage hashing:**
1. Pre-hash serialized entropy with SHA-256
2. Iterative SHA-256 (configurable iterations)
3. Iterative SHA-512 (configurable iterations, truncated to 32 bytes)
4. XOR both results
5. Final SHA-512 of combined data (64-byte output)

### Best Practices

1. **Production use**: Always set `minEvents` ≥ 50
2. **High security**: Use `iterations: 10000` and `minEvents: 100`
3. **Multiple seeds**: Call `clearEntropy()` between generations
4. **Resource cleanup**: Call `stopCollecting()` when done
5. **Validation**: Never skip validation in production unless necessary

---

## Advanced Usage

### Custom Entropy Processing

```javascript
// Generate salt separately
const salt = rng.generateSalt();

// Access raw entropy (not recommended)
console.log('Pool:', rng.entropyPool.length);
console.log('Timers:', rng.timerDeltas.length);

// Combine entropy manually (internal API)
const combined = await rng.combineEntropy(salt);
```

### Event-Driven Generation

```javascript
const rng = new ntrpRNG({ minEvents: 50, autoCollect: false });

// Start collection on user action
document.addEventListener('click', () => {
  if (!rng.isCollecting) {
    rng.startCollecting();
  }
}, { once: true });

// Monitor and generate
const monitor = setInterval(async () => {
  if (rng.hasMinimumEntropy()) {
    clearInterval(monitor);
    const seed = await rng.generateSeedHex();
    console.log('Seed:', seed);
    rng.stopCollecting();
  }
}, 500);
```

### Stress Testing

```javascript
async function stressTest(count) {
  const rng = new ntrpRNG({ minEvents: 0 });
  const seeds = new Set();
  
  for (let i = 0; i < count; i++) {
    const seed = await rng.generateSeedHex(true);
    seeds.add(seed);
    rng.clearEntropy();
  }
  
  console.log(`Generated ${count} seeds`);
  console.log(`Unique: ${seeds.size} (${(seeds.size/count*100).toFixed(2)}%)`);
  
  rng.stopCollecting();
}

stressTest(1000);
```