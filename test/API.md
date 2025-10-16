# ntrpRNGDev API Documentation

Version 1.5.0

## Table of Contents

- [Overview](#overview)
- [Changelog](#changelog)
- [Constructor](#constructor)
- [RNG Type Detection](#rng-type-detection)
- [Methods](#methods)
  - [Statistical Tests](#statistical-tests)
  - [Monitoring & Diagnostics](#monitoring--diagnostics)
  - [Security & Compatibility](#security--compatibility)
  - [Test Suites](#test-suites)
  - [Utilities](#utilities)
- [cgRNDV Support](#cgrndv-support)
- [Test Levels](#test-levels)
- [Types](#types)
- [Test Results](#test-results)

---

## Overview

**ntrpRNGDev** is a comprehensive testing suite for validating random number generators. It supports:

- **ntrpRNG v1.3.0+**: Behavioral entropy with weighted event counting and dual-path fortification
- **cgRNDV v1.1.0+**: Pure crypto.getRandomValues() wrapper with API compatibility

The suite automatically detects RNG type, weighted counting support, and adapts test execution accordingly.

---

## Changelog

### v1.5.0 (Current)

**BREAKING CHANGES:**
- Removed backward compatibility with ntrpRNG < 1.3.0 and cgRNDV < 1.1.0
- Constructor now requires ntrpRNG v1.3.0+ or cgRNDV v1.1.0+

**New Features:**
- **Test 7: verifyIntegrityChecks()** - Validates security constants and minEvents enforcement
- **Test 8: verifyAPICompatibility()** - Ensures RNG interchangeability
- Weighted event counting detection and proper logging
- Uses `getProgress()` API instead of manual calculations
- Enhanced RNG type detection with `usesWeightedCounting` flag

**Enhancements:**
- All logging distinguishes "weighted events" vs "raw events"
- `runTestSuite()` now executes 8 tests (6 universal + 2 behavioral-only)
- Updated all references to ntrpRNG 1.3.0 and cgRNDV 1.1.0
- Improved test result output with weighted counting awareness

### v1.4.0

- Added Chi-Square, Serial Correlation, and Avalanche Effect tests
- Concatenated mode support for new statistical tests
- All six statistical tests available in both modes

### v1.3.0

- Universal support for ntrpRNG and cgRNDV
- Auto-detection of RNG type (behavioral vs pure-crypto)
- Conditional test execution based on RNG capabilities

### v1.2.1

- Renamed library to `ntrpRNGDev.js`
- Updated class name to `ntrpRNGDev`

---

## Constructor

### `new ntrpRNGDev(rngInstance)`

Creates a new testing suite instance with automatic RNG type and capability detection.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rngInstance` | `ntrpRNG v1.3.0+` \| `cgRNDV v1.1.0+` | RNG instance to test |

**Returns:** `ntrpRNGDev` instance

**Throws:** `Error` if `rngInstance` is invalid or version incompatible

**Detects:**
- RNG type (behavioral vs pure-crypto)
- Weighted event counting support
- API compatibility level

**Example:**
```javascript
// Test ntrpRNG 1.3.0
const rng1 = new ntrpRNG();
const dev1 = new ntrpRNGDev(rng1);
// Console: "Detected RNG type: behavioral"
// Console: "Weighted event counting: enabled"

// Test cgRNDV 1.1.0
const rng2 = new cgRNDV();
const dev2 = new ntrpRNGDev(rng2);
// Console: "Detected RNG type: pure-crypto"
```

---

## RNG Type Detection

### Properties

#### `rngType`

RNG classification:
- `'behavioral'` - ntrpRNG (supports all 8 tests)
- `'pure-crypto'` - cgRNDV (6 tests, skips monitoring/jitter)

#### `usesWeightedCounting`

Boolean flag indicating weighted event counting support (ntrpRNG 1.3.0+).

**Example:**
```javascript
const dev = new ntrpRNGDev(rng);

console.log(`Type: ${dev.rngType}`);
console.log(`Weighted: ${dev.usesWeightedCounting}`);
// ntrpRNG 1.3.0: behavioral, true
// cgRNDV 1.1.0: pure-crypto, false
```

### Methods

#### `supportsBehavioralTests()`

Check if RNG supports behavioral entropy tests (monitoring, jitter analysis).

**Returns:** `boolean`

**Example:**
```javascript
if (dev.supportsBehavioralTests()) {
  console.log('Full 8-test suite available');
} else {
  console.log('6 universal tests only');
}
```

---

## Methods

### Statistical Tests

#### `runMultiSeedTest(count, seedSize, concatenated)`

Generates multiple seeds and analyzes statistical quality using six comprehensive tests.

**Works with:** ntrpRNG, cgRNDV

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | `number` | `10` | Number of seeds to generate |
| `seedSize` | `number` | `64` | Size of each seed in bytes |
| `concatenated` | `boolean` | `false` | Calculate all tests on concatenated dataset |

**Returns:** `Promise<Object>` - Test results with statistics

**Statistical Metrics:**

1. **Shannon Entropy**: Information density (ideal: 7.9-8.0 bits/byte)
2. **Monobit Test**: Equality of 0s and 1s (ideal: < 2.0, closer to 0)
3. **Runs Test**: Bit oscillation (ideal: < 2.0, lower is better)
4. **Chi-Square Test**: Byte distribution uniformity (ideal: < 293.25 for 95% confidence)
5. **Serial Correlation Test**: Bit sequence independence (ideal: < 0.1, closer to 0)

**Example:**
```javascript
// Compare ntrpRNG 1.3.0 vs cgRNDV 1.1.0
const r1 = await dev1.runMultiSeedTest(100, 64, true);
const r2 = await dev2.runMultiSeedTest(100, 64, true);

console.log(`ntrpRNG Shannon: ${r1.shannonEntropy.value}`);
console.log(`cgRNDV Shannon: ${r2.shannonEntropy.value}`);
console.log(`ntrpRNG Chi-Square: ${r1.chiSquareTest.value}`);
console.log(`cgRNDV Chi-Square: ${r2.chiSquareTest.value}`);
```

---

#### `verifySaltConsistency(iterations)`

Generates multiple salts and verifies uniqueness and collision rate.

**Works with:** ntrpRNG, cgRNDV

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `iterations` | `number` | `100` | Number of salts to generate |

**Returns:** `Promise<Object>` - Test results

**Example:**
```javascript
const results = await dev.verifySaltConsistency(1000);

if (results.passed) {
  console.log('✓ All salts unique');
} else {
  console.warn(`✗ ${results.collisions} collisions`);
}
```

---

#### `checkRepeatability(iterations)`

Verifies consecutive seed generations produce unique outputs. Calculates Hamming distances.

**Works with:** ntrpRNG, cgRNDV

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `iterations` | `number` | `2` | Number of seeds to generate |

**Returns:** `Promise<Object>` - Test results

**Example:**
```javascript
const results = await dev.checkRepeatability(10);
console.log(`Hamming: ${results.averageHammingDistance}`);
console.log(`Status: ${results.passed ? 'PASSED' : 'FAILED'}`);
```

---

#### `testAvalancheEffect(iterations)`

Tests bit-flip propagation between consecutive seed generations. Ideal avalanche effect is ~50% bit change.

**Works with:** ntrpRNG, cgRNDV

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `iterations` | `number` | `10` | Number of seed pairs to analyze |

**Returns:** `Promise<Object>` - Avalanche effect statistics

**Example:**
```javascript
const results = await dev.testAvalancheEffect(50);
console.log(`Mean: ${results.meanAvalanche} (ideal: ${results.ideal})`);
console.log(`Deviation: ${results.deviationFrom50}`);
console.log(`Status: ${results.passed ? '✓ PASSED' : '✗ FAILED'}`);
```

---

### Monitoring & Diagnostics

#### `monitorEntropyPool(intervalMs, maxSamples)`

Monitors entropy pool statistics over time. Shows weighted events for ntrpRNG 1.3.0+.

**Works with:** ntrpRNG only (skipped for cgRNDV)

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `intervalMs` | `number` | `100` | Sampling interval in milliseconds |
| `maxSamples` | `number` | `30` | Maximum number of samples |

**Returns:** `Promise<void>`

**Behavior:**
- **ntrpRNG 1.3.0+**: Displays pool size, timer size, weighted event counts, progress percentage
- **cgRNDV**: Logs "SKIPPED" message and returns immediately

**Example:**
```javascript
// ntrpRNG - shows weighted events
await dev.monitorEntropyPool(100, 30);
// Output: "Events=150 (weighted), Progress=30.0%"

// cgRNDV - skips
await dev.monitorEntropyPool(100, 30);
// Output: "SKIPPED: pure-crypto RNG does not collect behavioral entropy"
```

---

#### `analyzeTimingJitter(samples)`

Analyzes timing jitter distribution with statistics and histogram.

**Works with:** ntrpRNG only (skipped for cgRNDV)

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `samples` | `number` | `100` | Number of timing samples |

**Returns:** `Promise<Object>` - Statistical analysis or skip status

**Example:**
```javascript
const results = await dev.analyzeTimingJitter(1000);

if (!results.skipped) {
  console.log(`Jitter CV: ${results.coefficientOfVariation}`);
}
```

---

### Security & Compatibility

#### `verifyIntegrityChecks(level)` 🆕

Validates security constants, minEvents enforcement, and integrity check functionality.

**Works with:** ntrpRNG, cgRNDV

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `level` | `string` | `'medium'` | Test level: 'low', 'medium', 'high', 'extreme' |

**Returns:** `Promise<Object>` - Integrity validation results

**Return Type:**
```typescript
{
  rngType: string;
  level: string;
  minEventsEnforced: boolean;
  overrideIgnored: boolean;
  integrityChecksPass: {
    constructor: boolean;
    validation: boolean;
    generation: boolean;
  };
  constantsValid: boolean;
  securityType: 'active' | 'none';
  passed: boolean;
  duration: string;
}
```

**Test Levels:**

- **LOW**: Basic minEvents validation
- **MEDIUM**: Runtime checks + override attempts
- **HIGH**: Security edge cases + prototype tampering
- **EXTREME**: 100+ initialization stress test

**What It Tests:**

**For ntrpRNG 1.3.0:**
- `minEvents` === 500 (hardcoded enforcement)
- Constructor ignores override attempts
- Integrity checks in `hasMinimumEntropy()` and `generateSeed()`
- Constants validation (REQUIRED_MIN_EVENTS, _VERIFY_A/B/C)
- Prototype tampering resistance
- `getProgress().requiredEvents` === 500

**For cgRNDV 1.1.0:**
- No security constants (by design)
- `minEvents` property exists (compatibility only)
- No integrity checks (always pass)
- No validation enforcement

**Example:**
```javascript
// Validate ntrpRNG 1.3.0 security
const results = await dev.verifyIntegrityChecks('high');

console.log(`minEvents enforced: ${results.minEventsEnforced}`);
console.log(`Override ignored: ${results.overrideIgnored}`);
console.log(`Security type: ${results.securityType}`); // "active"
console.log(`Status: ${results.passed ? '✓ PASSED' : '✗ FAILED'}`);

// Validate cgRNDV 1.1.0 (no security)
const results2 = await dev2.verifyIntegrityChecks('medium');
console.log(`Security type: ${results2.securityType}`); // "none"
```

---

#### `verifyAPICompatibility(level)` 🆕

Ensures RNG implements complete API and validates output formats for interchangeability.

**Works with:** ntrpRNG, cgRNDV

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `level` | `string` | `'medium'` | Test level: 'low', 'medium', 'high', 'extreme' |

**Returns:** `Promise<Object>` - Compatibility validation results

**Return Type:**
```typescript
{
  rngType: string;
  level: string;
  methodsPresent: number;
  methodsRequired: number;
  missingMethods: string[];
  outputFormatsValid: boolean;
  behaviorExpected: boolean;
  stressTestPassed?: boolean;
  passed: boolean;
  duration: string;
}
```

**Test Levels:**

- **LOW**: Method existence (13 required methods)
- **MEDIUM**: Output format validation + type checking
- **HIGH**: Behavioral validation + cross-compatibility
- **EXTREME**: 100+ method calls stress test

**Required Methods:**
```javascript
[
  'generateSeed', 'generateSeedHex', 'generateSeedBase64',
  'generateSalt', 'combineEntropy', 'hasMinimumEntropy',
  'getProgress', 'getStats', 'clearEntropy',
  'startCollecting', 'stopCollecting', 'toHex', 'toBase64'
]
```

**Validated Outputs:**
- `generateSeed()`: Uint8Array, 64 bytes
- `generateSeedHex()`: string, 128 chars, valid hex
- `generateSeedBase64()`: string, valid base64
- `getProgress()`: {currentEvents, requiredEvents, percentage, ready}
- `getStats()`: proper structure with expected fields

**Behavioral Validation:**

**ntrpRNG 1.3.0 Expected:**
- `getProgress().ready` can be false (during collection)
- `entropyPool` and `timerDeltas` are arrays
- `eventCount` is object with weighted values
- `totalEvents` increases with interaction

**cgRNDV 1.1.0 Expected:**
- `getProgress().ready` always true
- `getProgress().percentage` always 100
- `entropyPoolSize` always 0
- `totalEvents` always 0
- `hasMinimumEntropy` always true

**Example:**
```javascript
// Validate ntrpRNG 1.3.0 API
const results = await dev.verifyAPICompatibility('high');

console.log(`Methods: ${results.methodsPresent}/${results.methodsRequired}`);
console.log(`Output formats: ${results.outputFormatsValid ? 'VALID' : 'INVALID'}`);
console.log(`Behavior: ${results.behaviorExpected ? 'EXPECTED' : 'UNEXPECTED'}`);
console.log(`Status: ${results.passed ? '✓ PASSED' : '✗ FAILED'}`);

// Validate cgRNDV 1.1.0 compatibility
const results2 = await dev2.verifyAPICompatibility('medium');
console.log(`cgRNDV compatible: ${results2.passed}`);
```

**Use Cases:**
- Validate RNG interchangeability
- Ensure API contract compliance
- Detect version drift
- Verify upgrade compatibility

---

### Test Suites

#### `runTestSuite(level)`

Runs comprehensive 8-test suite with automatic RNG type adaptation.

**Works with:** ntrpRNG, cgRNDV

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `level` | `string` | `'medium'` | Test level: 'low', 'medium', 'high', 'extreme' |

**Returns:** `Promise<Object>` - Combined test results

**Return Type:**
```typescript
{
  level: string;
  rngType: string;
  weightedCounting: boolean;
  timestamp: number;
  tests: {
    multiSeed: Object;       // 5 statistical tests
    salt: Object;
    repeatability: Object;
    avalanche: Object;
    integrity: Object;       // NEW in v1.5.0
    apiCompat: Object;       // NEW in v1.5.0
    jitter?: Object;         // Only for ntrpRNG
  };
}
```

**Tests Executed:**

| Test | ntrpRNG | cgRNDV |
|------|---------|--------|
| Multi-Seed Statistical (5 tests) | ✓ | ✓ |
| Entropy Pool Monitor | ✓ | ✗ Skipped |
| Salt Consistency | ✓ | ✓ |
| Timing Jitter | ✓ | ✗ Skipped |
| Repeatability | ✓ | ✓ |
| Avalanche Effect | ✓ | ✓ |
| **Integrity Checks** 🆕 | ✓ | ✓ |
| **API Compatibility** 🆕 | ✓ | ✓ |

**Total:** 8 tests (6 universal + 2 behavioral-only)

**Example:**
```javascript
// ntrpRNG 1.3.0 - runs all 8 tests
const dev1 = new ntrpRNGDev(new ntrpRNG());
const results1 = await dev1.runTestSuite('medium');
// Console: "Weighted event counting: enabled"
// Runs: MultiSeed, Monitor, Salt, Jitter, Repeatability, Avalanche, Integrity, APICompat

// cgRNDV 1.1.0 - runs 6 tests, skips 2
const dev2 = new ntrpRNGDev(new cgRNDV());
const results2 = await dev2.runTestSuite('medium');
// Runs: MultiSeed, Salt, Repeatability, Avalanche, Integrity, APICompat
// Skips: Monitor, Jitter

console.log(`Tests run: ${Object.keys(results1.tests).length}`);
console.log(`Weighted counting: ${results1.weightedCounting}`);
```

---

### Utilities

#### `getTestResults()`

Returns all stored test results.

**Returns:** `Array<Object>` - Test result history

**Example:**
```javascript
const history = dev.getTestResults();
history.forEach(r => {
  console.log(`${r.test} at ${new Date(r.timestamp)}`);
});
```

---

#### `clearTestResults()`

Clears all stored test results.

**Returns:** `void`

**Example:**
```javascript
dev.clearTestResults();
```

---

## cgRNDV Support

### What is cgRNDV?

**cgRNDV.js v1.1.0** is a lightweight baseline RNG wrapper that uses only `crypto.getRandomValues()`. It provides identical API to ntrpRNG for comparison testing.

### Version 1.1.0 Updates

**API Compatibility with ntrpRNG 1.3.0:**
- `minEvents` property (compatibility only, not enforced)
- Added `getProgress()` method (always returns ready: true)
- **REMOVED**: All security constants and placeholder integrity checks from v1.0.0
- Pure wrapper around crypto.getRandomValues() (simplified design)

### Key Differences

| Feature | ntrpRNG 1.3.0 | cgRNDV 1.1.0 |
|---------|---------------|--------------|
| Entropy Source | User events + timers + crypto | crypto.getRandomValues() only |
| Weighted Events | ✓ Yes (3-2-1 weights) | ✗ No (always 0) |
| minEvents | ✓ 500 (enforced) | ✓ Property exists (not enforced) |
| Security Constants | ✓ Yes (hardcoded) | ✗ No (by design) |
| Dual-Path Fortification | ✓ Yes (5000 iterations) | ✗ No |
| Statistical Tests | ✓ All 6 | ✓ All 6 |
| Monitoring Tests | ✓ Both | ✗ Skipped |
| Integrity Checks | ✓ Active (3 checkpoints) | ✗ None (by design) |
| API Compatibility | ✓ Full | ✓ Full |
| Performance | Slower (requires interaction) | Instant |
| Use Case | Enhanced entropy mixing | Baseline comparison |

### Testing cgRNDV 1.1.0

```javascript
// Create cgRNDV instance
const rng = new cgRNDV({
  saltSize: 32,
  iterations: 5000,  // Stored but not used
  autoCollect: true, // No-op
  minEvents: 100     // Stored but not enforced
});

// Test with ntrpRNGDev
const dev = new ntrpRNGDev(rng);

console.log(`Type: ${dev.rngType}`); // "pure-crypto"
console.log(`Behavioral: ${dev.supportsBehavioralTests()}`); // false
console.log(`Weighted: ${dev.usesWeightedCounting}`); // false

// Run full suite (auto-skips incompatible tests)
const results = await dev.runTestSuite('medium');
// Runs 6 tests, skips 2
```

### Comparison Testing

```javascript
async function compareRNGs() {
  const ntrp = new ntrpRNG();
  const cg = new cgRNDV();
  
  const dev1 = new ntrpRNGDev(ntrp);
  const dev2 = new ntrpRNGDev(cg);
  
  // Run same test on both
  const r1 = await dev1.runMultiSeedTest(100, 64, true);
  const r2 = await dev2.runMultiSeedTest(100, 64, true);
  
  console.log('=== ntrpRNG 1.3.0 vs cgRNDV 1.1.0 ===');
  console.log(`Shannon - ntrpRNG: ${r1.shannonEntropy.value}`);
  console.log(`Shannon - cgRNDV:  ${r2.shannonEntropy.value}`);
  console.log(`Chi-Square - ntrpRNG: ${r1.chiSquareTest.value}`);
  console.log(`Chi-Square - cgRNDV:  ${r2.chiSquareTest.value}`);
  
  // Test integrity
  const i1 = await dev1.verifyIntegrityChecks('high');
  const i2 = await dev2.verifyIntegrityChecks('high');
  
  console.log(`Integrity - ntrpRNG: ${i1.securityType}`); // "active"
  console.log(`Integrity - cgRNDV:  ${i2.securityType}`); // "none"
}
```

---

## Test Levels

### Predefined Parameters

| Level | Multi-Seed | Monitor | Salt | Jitter | Repeatability | Avalanche | Integrity | API Compat |
|-------|-----------|---------|------|--------|---------------|-----------|-----------|------------|
| **LOW** | 10 seeds, 32B | 100ms, 30 | 100 | 100 | 2 | 10 | low | low |
| **MEDIUM** | 50 seeds, 64B | 50ms, 60 | 500 | 500 | 5 | 25 | medium | medium |
| **HIGH** | 100 seeds, 64B | 20ms, 100 | 1000 | 1000 | 10 | 50 | high | high |
| **EXTREME** | 500 seeds, 128B | 10ms, 300 | 5000 | 5000 | 20 | 100 | extreme | extreme |

### Level Selection

- **LOW**: Quick validation (~10-30s)
- **MEDIUM**: Standard testing (~1-3m)
- **HIGH**: Comprehensive QA (~3-6m)
- **EXTREME**: Full validation (~10-25m)

### Performance by RNG Type

| Level | ntrpRNG 1.3.0 | cgRNDV 1.1.0 |
|-------|---------------|--------------|
| LOW | 10-20s | 5-10s |
| MEDIUM | 1-3m | 30-60s |
| HIGH | 3-6m | 1-3m |
| EXTREME | 10-25m | 5-15m |

---

## Types

### IntegrityCheckResults 🆕

```typescript
interface IntegrityCheckResults {
  rngType: string;
  level: string;
  minEventsEnforced: boolean;
  overrideIgnored: boolean;
  integrityChecksPass: {
    constructor: boolean;
    validation: boolean;
    generation: boolean;
  };
  constantsValid: boolean;
  securityType: 'active' | 'none';
  stressTestPassed?: boolean;
  passed: boolean;
  duration: string;
  error?: string;
}
```

### APICompatibilityResults 🆕

```typescript
interface APICompatibilityResults {
  rngType: string;
  level: string;
  methodsPresent: number;
  methodsRequired: number;
  missingMethods: string[];
  outputFormatsValid: boolean;
  behaviorExpected: boolean;
  stressTestPassed?: boolean;
  passed: boolean;
  duration: string;
  error?: string;
}
```

### TestSuiteResults (Updated)

```typescript
interface TestSuiteResults {
  level: string;
  rngType: string;
  weightedCounting: boolean;  // NEW in v1.5.0
  timestamp: number;
  tests: {
    multiSeed: MultiSeedResults;
    salt: SaltConsistencyResults;
    repeatability: RepeatabilityResults;
    avalanche: AvalancheEffectResults;
    integrity: IntegrityCheckResults;    // NEW in v1.5.0
    apiCompat: APICompatibilityResults;  // NEW in v1.5.0
    jitter?: TimingJitterResults;        // Only for behavioral RNGs
  };
}
```

---

## Test Results

### Interpretation Guide

#### Integrity Checks 🆕

| Check | Expected | Interpretation |
|-------|----------|----------------|
| minEventsEnforced | true (ntrpRNG) / false (cgRNDV) | Security enforcement status |
| overrideIgnored | true (ntrpRNG) / false (cgRNDV) | Constructor protection |
| constantsValid | true (ntrpRNG) / N/A (cgRNDV) | Security constants present |
| integrityChecksPass.* | all true | Checkpoint functionality |

**Security Types:**
- **active** (ntrpRNG 1.3.0): Real security enforcement with hardcoded constants
- **none** (cgRNDV 1.1.0): No security layer (pure wrapper design)

#### API Compatibility 🆕

| Metric | Expected | Interpretation |
|--------|----------|----------------|
| methodsPresent | 13/13 | All required methods exist |
| outputFormatsValid | true | Correct types and formats |
| behaviorExpected | true | RNG-specific behavior correct |

**ntrpRNG Behavioral:**
- Progress can be < 100% during collection
- Entropy arrays populated during collection
- Event counts increase with interaction
- Weighted counting enabled

**cgRNDV Behavioral:**
- Progress always 100%
- Entropy arrays always empty
- Event counts always 0
- No weighted counting

### Weighted Event Counting 🆕

**ntrpRNG 1.3.0 Event Weights:**
- Keyboard events: **3 points**
- Mouse down/Touch/Motion: **2 points**
- Mouse move/Scroll: **1 point**

**Total required:** 500 weighted events

**Example:**
- 100 keyboard + 100 mouse_down + 100 move = (100×3) + (100×2) + (100×1) = 600 points ✓
- 500 mouse_move = 500×1 = 500 points ✓
- 200 keyboard = 200×3 = 600 points ✓

---

## Usage Examples

### New Test Examples

#### Integrity Validation

```javascript
async function validateSecurity() {
  const rng = new ntrpRNG();
  const dev = new ntrpRNGDev(rng);
  
  // Test security enforcement
  const results = await dev.verifyIntegrityChecks('high');
  
  console.log('=== Security Validation ===');
  console.log(`minEvents enforced: ${results.minEventsEnforced}`);
  console.log(`Override protection: ${results.overrideIgnored}`);
  console.log(`Constants valid: ${results.constantsValid}`);
  console.log(`Security type: ${results.securityType}`);
  console.log(`Status: ${results.passed ? '✓ PASSED' : '✗ FAILED'}`);
  
  if (!results.passed) {
    console.error('Security validation failed!');
    console.error(results);
  }
}
```

#### API Interchangeability Test

```javascript
async function testInterchangeability() {
  const rng1 = new ntrpRNG();
  const rng2 = new cgRNDV();
  
  const dev1 = new ntrpRNGDev(rng1);
  const dev2 = new ntrpRNGDev(rng2);
  
  // Validate both have identical API
  const compat1 = await dev1.verifyAPICompatibility('high');
  const compat2 = await dev2.verifyAPICompatibility('high');
  
  console.log('=== API Interchangeability ===');
  console.log(`ntrpRNG API: ${compat1.methodsPresent}/${compat1.methodsRequired}`);
  console.log(`cgRNDV API: ${compat2.methodsPresent}/${compat2.methodsRequired}`);
  
  if (compat1.passed && compat2.passed) {
    console.log('✓ Both RNGs are interchangeable');
  } else {
    console.warn('⚠ API compatibility issues detected');
    console.log('ntrpRNG missing:', compat1.missingMethods);
    console.log('cgRNDV missing:', compat2.missingMethods);
  }
}
```

#### Complete v1.5.0 Test Suite

```javascript
async function fullValidation() {
  const rng = new ntrpRNG();
  const dev = new ntrpRNGDev(rng);
  
  console.log('=== ntrpRNGDev v1.5.0 Full Suite ===');
  console.log(`RNG Type: ${dev.rngType}`);
  console.log(`Weighted Counting: ${dev.usesWeightedCounting}`);
  
  // Run all 8 tests
  const results = await dev.runTestSuite('high');
  
  console.log(`\nTests executed: ${Object.keys(results.tests).length}`);
  console.log(`Duration: ${results.duration}`);
  
  // Check all results
  const allPassed = 
    results.tests.salt.passed &&
    results.tests.repeatability.passed &&
    results.tests.avalanche.passed &&
    results.tests.integrity.passed &&
    results.tests.apiCompat.passed;
  
  console.log(`\nOverall: ${allPassed ? '✓ PASSED' : '✗ FAILED'}`);
  
  return results;
}
```

#### Weighted Counting Validation

```javascript
async function validateWeightedCounting() {
  const rng = new ntrpRNG();
  const dev = new ntrpRNGDev(rng);
  
  if (!dev.usesWeightedCounting) {
    console.log('RNG does not use weighted counting');
    return;
  }
  
  console.log('=== Weighted Event Counting ===');
  
  // Monitor collection with weighted events
  await dev.monitorEntropyPool(100, 50);
  // Output shows: "Events=X (weighted)"
  
  // Verify progress uses weighted calculation
  const progress = rng.getProgress();
  console.log(`Current: ${progress.currentEvents} weighted events`);
  console.log(`Required: ${progress.requiredEvents} weighted events`);
  console.log(`Progress: ${progress.percentage}%`);
  console.log(`Ready: ${progress.ready}`);
}
```

---

## Best Practices

### Version Compatibility

```javascript
// ✓ CORRECT: Use v1.5.0 with updated libraries
const rng1 = new ntrpRNG();        // v1.3.0+
const rng2 = new cgRNDV();         // v1.1.0+
const dev1 = new ntrpRNGDev(rng1); // v1.5.0
const dev2 = new ntrpRNGDev(rng2); // v1.5.0

// ✗ INCORRECT: v1.5.0 does not support old versions
const oldRNG = new ntrpRNG_v1_2_1();
const dev = new ntrpRNGDev(oldRNG); // Error!
```

### Testing Strategy

1. **Development**: cgRNDV with `'low'` level for fast iteration
2. **Pre-commit**: Both RNGs with `'medium'` level + integrity checks
3. **CI/CD**: cgRNDV `'medium'` with API compatibility validation
4. **Release**: ntrpRNG `'high'` full validation
5. **Production**: Periodic cgRNDV monitoring + integrity validation

### New Test Integration

```javascript
async function completeValidation() {
  const rng = new ntrpRNG();
  const dev = new ntrpRNGDev(rng);
  
  // 1. Statistical quality
  const stats = await dev.runMultiSeedTest(100, 64, true);
  
  // 2. Security validation
  const security = await dev.verifyIntegrityChecks('high');
  
  // 3. API compliance
  const api = await dev.verifyAPICompatibility('high');
  
  // 4. Avalanche effect
  const avalanche = await dev.testAvalancheEffect(50);
  
  const allPassed = 
    parseFloat(stats.shannonEntropy.value) >= 7.9 &&
    parseFloat(stats.chiSquareTest.value) < 293.25 &&
    security.passed &&
    api.passed &&
    avalanche.passed;
  
  return allPassed;
}
```

---

## Troubleshooting

### Integrity Check Failures

```javascript
// Problem: Integrity checks fail
const results = await dev.verifyIntegrityChecks('high');

if (!results.passed) {
  if (!results.minEventsEnforced) {
    console.error('minEvents not enforced at 500');
  }
  
  if (!results.constantsValid) {
    console.error('Security constants tampered or invalid');
  }
  
  if (!results.integrityChecksPass.constructor) {
    console.error('Constructor integrity check failed');
  }
  
  // Solution: Ensure using ntrpRNG 1.3.0+ or cgRNDV 1.1.0+
  console.log('Upgrade to compatible version');
}
```

### API Compatibility Issues

```javascript
// Problem: API compatibility fails
const results = await dev.verifyAPICompatibility('high');

if (!results.passed) {
  console.log('Missing methods:', results.missingMethods);
  console.log('Output formats valid:', results.outputFormatsValid);
  console.log('Behavior expected:', results.behaviorExpected);
  
  // Solution: Check RNG version
  console.log('Requires ntrpRNG 1.3.0+ or cgRNDV 1.1.0+');
}
```

### Weighted Counting Confusion

```javascript
// Problem: Event counts don't match expectations
const stats = rng.getStats();

if (dev.usesWeightedCounting) {
  console.log('Using weighted counting:');
  console.log('  totalEvents = weighted sum, not raw count');
  console.log('  keyboard events = 3 points each');
  console.log('  mouse_down/touch/motion = 2 points each');
  console.log('  mouse_move/scroll = 1 point each');
} else {
  console.log('No weighted counting (cgRNDV)');
}

// Solution: Use getProgress() for accurate status
const progress = rng.getProgress();
console.log(`Progress: ${progress.currentEvents}/${progress.requiredEvents}`);
```

---

## FAQ

### Q: What's new in v1.5.0?

**A:** 
- 2 new tests: Integrity Checks + API Compatibility (8 total)
- Weighted event counting support
- Uses `getProgress()` API
- Requires ntrpRNG 1.3.0+ and cgRNDV 1.1.0+

### Q: Why do I need integrity checks?

**A:** ntrpRNG 1.3.0 hardcodes minEvents=500 for security. Integrity checks verify:
- No tampering with security constants
- Override protection works
- All 3 checkpoints functional

cgRNDV has no integrity checks by design (pure wrapper).

### Q: What's the difference between "active" and "none" security?

**A:**
- **Active** (ntrpRNG): Real enforcement, throws errors if tampered
- **None** (cgRNDV): No security layer, pure crypto.getRandomValues() wrapper

### Q: How do weighted events work?

**A:** ntrpRNG 1.3.0 assigns different weights:
- High-entropy events (keyboard) = 3 points
- Medium-entropy (mouse_down, touch) = 2 points  
- Low-entropy (mouse_move, scroll) = 1 point

Total 500 weighted points required (not 500 raw events).

### Q: Can I still use ntrpRNG 1.2.1?

**A:** No. ntrpRNGDev 1.5.0 requires ntrpRNG 1.3.0+ for:
- Weighted counting support
- `getProgress()` API
- Security integrity checks
- Dual-path fortification

### Q: Should I always run all 8 tests?

**A:**
- **Development**: 4-6 tests (skip monitoring for speed)
- **CI/CD**: 6 tests (use cgRNDV, auto-skips 2)
- **Release**: All 8 tests with ntrpRNG

### Q: Why doesn't cgRNDV have security constants?

**A:** cgRNDV v1.1.0 is intentionally minimal - a pure wrapper around crypto.getRandomValues(). 

**v1.0.0 → v1.1.0 changes:**
- **REMOVED**: Placeholder security constants (REQUIRED_MIN_EVENTS, _VERIFY_A/B/C)
- **REMOVED**: Placeholder integrity check logic
- **ADDED**: `getProgress()` method for API compatibility
- **KEPT**: Simple property-based approach (no global constants)

This simplicity enables fair performance benchmarking against ntrpRNG without unnecessary overhead.

---

## License

MIT

---

## Related Documentation

- **ntrpRNG v1.3.0 API**: Core RNG with weighted counting
- **cgRNDV v1.1.0 API**: Baseline crypto wrapper
- **NIST SP 800-22**: Statistical test specifications
- **ntrpRNGDev v1.5.0 Changelog**: Detailed changes

---

## Support

For issues or questions:
- Verify RNG versions (ntrpRNG 1.3.0+, cgRNDV 1.1.0+)
- Check weighted counting detection
- Run integrity and API compatibility tests
- Compare with cgRNDV baseline