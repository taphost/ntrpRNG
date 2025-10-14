# ntrpRNGDev API Documentation

Version 1.4.0

## Table of Contents

- [Overview](#overview)
- [Changelog](#changelog)
- [Constructor](#constructor)
- [RNG Type Detection](#rng-type-detection)
- [Methods](#methods)
  - [Statistical Tests](#statistical-tests)
  - [Monitoring & Diagnostics](#monitoring--diagnostics)
  - [Test Suites](#test-suites)
  - [Utilities](#utilities)
- [cgRNDV Support](#cgrndv-support)
- [Test Levels](#test-levels)
- [Types](#types)
- [Test Results](#test-results)

---

## Overview

**ntrpRNGDev** is a comprehensive testing suite for validating random number generators. It supports both:

- **ntrpRNG**: Behavioral entropy collection with user interaction
- **cgRNDV**: Pure crypto.getRandomValues() wrapper

The suite automatically detects RNG type and adapts test execution accordingly.

---

## Changelog

### v1.4.0 (Current)

**New Statistical Tests:**
- **Chi-Square Test**: Validates byte frequency distribution uniformity
- **Serial Correlation Test**: Measures bit sequence independence
- **Avalanche Effect Test**: Analyzes bit-flip propagation

**Enhancements:**
- Integrated new tests into `runTestSuite()` with level-based parameters
- Added concatenated mode support for Chi-Square and Serial Correlation
- All six statistical tests now available in both individual and concatenated modes

### v1.3.0

- Added universal support for ntrpRNG and cgRNDV
- Auto-detection of RNG type (behavioral vs pure-crypto)
- Conditional test execution based on RNG capabilities

### v1.2.1

- Renamed library to `ntrpRNGDev.js`
- Updated class name to `ntrpRNGDev`

### v1.2.0

- Extended concatenated mode to all statistical tests
- Unified test mode across Shannon, Monobit, Runs

### v1.1.0

- Added concatenated mode to Shannon Entropy test
- Multi-seed dataset analysis

---

## Constructor

### `new ntrpRNGDev(rngInstance)`

Creates a new testing suite instance with automatic RNG type detection.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rngInstance` | `ntrpRNG` \| `cgRNDV` | RNG instance to test |

**Returns:** `ntrpRNGDev` instance

**Throws:** `Error` if `rngInstance` is invalid

**Example:**
```javascript
// Test ntrpRNG
const rng1 = new ntrpRNG();
const dev1 = new ntrpRNGDev(rng1);

// Test cgRNDV
const rng2 = new cgRNDV();
const dev2 = new ntrpRNGDev(rng2);
```

---

## RNG Type Detection

### `supportsBehavioralTests()`

Check if RNG supports behavioral entropy tests.

**Returns:** `boolean` - `true` for ntrpRNG, `false` for cgRNDV

**Example:**
```javascript
const dev = new ntrpRNGDev(rng);

if (dev.supportsBehavioralTests()) {
  console.log('Full test suite available');
} else {
  console.log('Statistical tests only');
}
```

### RNG Type Property

The `rngType` property indicates detected RNG:

- `'behavioral'` - ntrpRNG (supports all tests)
- `'pure-crypto'` - cgRNDV (statistical tests only)

**Example:**
```javascript
console.log(`RNG Type: ${dev.rngType}`);
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

**Return Type (concatenated: false):**
```typescript
{
  rngType: string;
  count: number;
  seedSize: number;
  duration: string;
  concatenatedMode: false;
  shannonEntropy: {
    mean: string;
    stdDev: string;
    min: string;
    max: string;
    ideal: string;
  };
  monobitTest: { /* same structure */ };
  runsTest: { /* same structure */ };
  chiSquareTest: { /* same structure */ };
  serialCorrelationTest: { /* same structure */ };
}
```

**Return Type (concatenated: true):**
```typescript
{
  rngType: string;
  count: number;
  seedSize: number;
  duration: string;
  concatenatedMode: true;
  shannonEntropy: {
    value: string;
    datasetSize: string;
    ideal: string;
  };
  monobitTest: { /* same structure */ };
  runsTest: { /* same structure */ };
  chiSquareTest: { /* same structure */ };
  serialCorrelationTest: { /* same structure */ };
}
```

**Statistical Metrics:**

1. **Shannon Entropy**: Information density (ideal: 7.9-8.0 bits/byte)
2. **Monobit Test**: Equality of 0s and 1s (ideal: < 2.0, closer to 0)
3. **Runs Test**: Bit oscillation (ideal: < 2.0, lower is better)
4. **Chi-Square Test**: Byte distribution uniformity (ideal: < 293.25 for 95% confidence)
5. **Serial Correlation Test**: Bit sequence independence (ideal: < 0.1, closer to 0)

**Test Modes:**

- **Individual mode** (`concatenated: false`): Per-seed analysis, returns mean ± stdDev
- **Concatenated mode** (`concatenated: true`): Single-dataset analysis

**Example:**
```javascript
// Compare both RNG types with all tests
const ntrp = new ntrpRNG();
const cg = new cgRNDV();

const dev1 = new ntrpRNGDev(ntrp);
const dev2 = new ntrpRNGDev(cg);

const r1 = await dev1.runMultiSeedTest(100, 64, true);
const r2 = await dev2.runMultiSeedTest(100, 64, true);

console.log(`ntrpRNG Shannon: ${r1.shannonEntropy.value}`);
console.log(`cgRNDV Shannon: ${r2.shannonEntropy.value}`);
console.log(`ntrpRNG Chi-Square: ${r1.chiSquareTest.value}`);
console.log(`cgRNDV Chi-Square: ${r2.chiSquareTest.value}`);
console.log(`ntrpRNG Serial Corr: ${r1.serialCorrelationTest.value}`);
console.log(`cgRNDV Serial Corr: ${r2.serialCorrelationTest.value}`);
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

**Return Type:**
```typescript
{
  rngType: string;
  iterations: number;
  uniqueSalts: number;
  collisions: number;
  collisionRate: string;
  averageLength: string;
  duration: string;
  passed: boolean;
}
```

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

**Return Type:**
```typescript
{
  rngType: string;
  iterations: number;
  uniqueSeeds: number;
  repeats: number;
  repeatRate: string;
  averageHammingDistance: string;
  duration: string;
  passed: boolean;
}
```

**Example:**
```javascript
const results = await dev.checkRepeatability(10);
console.log(`Hamming: ${results.averageHammingDistance}`);
console.log(`Status: ${results.passed ? 'PASSED' : 'FAILED'}`);
```

---

#### `testAvalancheEffect(iterations)` 🆕

Tests bit-flip propagation between consecutive seed generations. Ideal avalanche effect is ~50% bit change.

**Works with:** ntrpRNG, cgRNDV

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `iterations` | `number` | `10` | Number of seed pairs to analyze |

**Returns:** `Promise<Object>` - Avalanche effect statistics

**Return Type:**
```typescript
{
  rngType: string;
  iterations: number;
  meanAvalanche: string;
  stdDev: string;
  min: string;
  max: string;
  deviationFrom50: string;
  ideal: string;
  duration: string;
  passed: boolean;
}
```

**Interpretation:**

| Mean Avalanche | Quality | Interpretation |
|----------------|---------|----------------|
| 45-55% | Excellent | Ideal bit-flip propagation |
| 40-45% or 55-60% | Good | Acceptable variation |
| 35-40% or 60-65% | Fair | Investigate |
| < 35% or > 65% | Poor | Insufficient propagation |

**Example:**
```javascript
const results = await dev.testAvalancheEffect(50);
console.log(`Mean: ${results.meanAvalanche} (ideal: ${results.ideal})`);
console.log(`Deviation: ${results.deviationFrom50}`);
console.log(`Status: ${results.passed ? 'PASSED ✓' : 'FAILED ✗'}`);
```

---

### Monitoring & Diagnostics

#### `monitorEntropyPool(intervalMs, maxSamples)`

Monitors entropy pool statistics over time.

**Works with:** ntrpRNG only (skipped for cgRNDV)

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `intervalMs` | `number` | `100` | Sampling interval in milliseconds |
| `maxSamples` | `number` | `30` | Maximum number of samples |

**Returns:** `Promise<void>`

**Behavior:**
- **ntrpRNG**: Displays real-time pool size, timer size, event counts
- **cgRNDV**: Logs "SKIPPED" message and returns immediately

**Example:**
```javascript
// Works with ntrpRNG
await dev.monitorEntropyPool(100, 30);

// Skipped for cgRNDV (logs skip message)
await dev.monitorEntropyPool(100, 30);
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

**Return Type (ntrpRNG):**
```typescript
{
  rngType: string;
  samplesAnalyzed: number;
  min: string;
  max: string;
  mean: string;
  stdDev: string;
  range: string;
  coefficientOfVariation: string;
  histogram: number[];
}
```

**Return Type (cgRNDV):**
```typescript
{
  skipped: true;
  reason: string;
}
```

**Example:**
```javascript
const results = await dev.analyzeTimingJitter(1000);

if (!results.skipped) {
  console.log(`Jitter CV: ${results.coefficientOfVariation}`);
}
```

---

### Test Suites

#### `runTestSuite(level)`

Runs comprehensive test suite with automatic RNG type adaptation. Now includes all six statistical tests plus avalanche effect.

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
  timestamp: number;
  tests: {
    multiSeed: Object;         // All 5 statistical tests
    salt: Object;
    jitter?: Object;           // Only for ntrpRNG
    repeatability: Object;
    avalanche: Object;         // NEW in v1.4.0
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

**Example:**
```javascript
// ntrpRNG - runs all tests
const ntrpDev = new ntrpRNGDev(new ntrpRNG());
const results1 = await ntrpDev.runTestSuite('medium');
// Runs: MultiSeed (5 tests), Monitor, Salt, Jitter, Repeatability, Avalanche

// cgRNDV - runs 4 tests, skips 2
const cgDev = new ntrpRNGDev(new cgRNDV());
const results2 = await cgDev.runTestSuite('medium');
// Runs: MultiSeed (5 tests), Salt, Repeatability, Avalanche
// Skips: Monitor, Jitter
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

**cgRNDV.js** is a lightweight baseline RNG wrapper that uses only `crypto.getRandomValues()`. It provides the same API as ntrpRNG for comparison testing.

### Key Differences

| Feature | ntrpRNG | cgRNDV |
|---------|---------|--------|
| Entropy Source | User events + timers + crypto | crypto.getRandomValues() only |
| Behavioral Collection | ✓ Yes | ✗ No |
| Iterative Hashing | ✓ Yes (5000 iterations) | ✗ No |
| Statistical Tests | ✓ All 6 | ✓ All 6 |
| Monitoring Tests | ✓ Both | ✗ Skipped |
| Avalanche Test | ✓ Yes | ✓ Yes |
| Performance | Slower (requires interaction) | Instant |
| Use Case | Enhanced entropy mixing | Baseline comparison |

### Testing cgRNDV

```javascript
// Create cgRNDV instance
const rng = new cgRNDV({
  saltSize: 32,
  iterations: 5000,  // Ignored
  autoCollect: true, // Ignored
  minEvents: 0       // Ignored
});

// Test with ntrpRNGDev
const dev = new ntrpRNGDev(rng);

console.log(`Type: ${dev.rngType}`); // "pure-crypto"
console.log(`Behavioral: ${dev.supportsBehavioralTests()}`); // false

// Run full suite (auto-skips incompatible tests)
const results = await dev.runTestSuite('medium');
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
  
  console.log('=== Comparison Results ===');
  console.log(`ntrpRNG Shannon: ${r1.shannonEntropy.value}`);
  console.log(`cgRNDV Shannon:  ${r2.shannonEntropy.value}`);
  console.log(`ntrpRNG Chi-Square: ${r1.chiSquareTest.value}`);
  console.log(`cgRNDV Chi-Square:  ${r2.chiSquareTest.value}`);
  console.log(`ntrpRNG Serial Corr: ${r1.serialCorrelationTest.value}`);
  console.log(`cgRNDV Serial Corr:  ${r2.serialCorrelationTest.value}`);
}
```

---

## Test Levels

### Predefined Parameters

| Level | Multi-Seed | Monitor | Salt | Jitter | Repeatability | Avalanche |
|-------|-----------|---------|------|--------|---------------|-----------|
| **LOW** | 10 seeds, 32B | 100ms, 30 | 100 | 100 | 2 | 10 |
| **MEDIUM** | 50 seeds, 64B | 50ms, 60 | 500 | 500 | 5 | 25 |
| **HIGH** | 100 seeds, 64B | 20ms, 100 | 1000 | 1000 | 10 | 50 |
| **EXTREME** | 500 seeds, 128B | 10ms, 300 | 5000 | 5000 | 20 | 100 |

### Level Selection

- **LOW**: Quick validation (~10-30s)
- **MEDIUM**: Standard testing (~1-3m)
- **HIGH**: Comprehensive QA (~3-6m)
- **EXTREME**: Full validation (~10-25m)

### Performance by RNG Type

| Level | ntrpRNG | cgRNDV |
|-------|---------|--------|
| LOW | 10-20s | 5-10s |
| MEDIUM | 1-3m | 30-60s |
| HIGH | 3-6m | 1-3m |
| EXTREME | 10-25m | 5-15m |

*cgRNDV is faster due to no behavioral collection or iterative hashing*

---

## Types

### TestResult

```typescript
interface TestResult {
  test: string;
  timestamp: number;
  results: Object;
}
```

### MultiSeedResults

```typescript
interface MultiSeedResults {
  rngType: string;
  count: number;
  seedSize: number;
  duration: string;
  concatenatedMode: boolean;
  shannonEntropy: StatMetrics | ConcatenatedMetrics;
  monobitTest: StatMetrics | ConcatenatedMetrics;
  runsTest: StatMetrics | ConcatenatedMetrics;
  chiSquareTest: StatMetrics | ConcatenatedMetrics;        // NEW
  serialCorrelationTest: StatMetrics | ConcatenatedMetrics; // NEW
}
```

### StatMetrics

```typescript
interface StatMetrics {
  mean: string;
  stdDev: string;
  min: string;
  max: string;
  ideal: string;
}
```

### ConcatenatedMetrics

```typescript
interface ConcatenatedMetrics {
  value: string;
  datasetSize: string;
  ideal: string;
}
```

### SaltConsistencyResults

```typescript
interface SaltConsistencyResults {
  rngType: string;
  iterations: number;
  uniqueSalts: number;
  collisions: number;
  collisionRate: string;
  averageLength: string;
  duration: string;
  passed: boolean;
}
```

### RepeatabilityResults

```typescript
interface RepeatabilityResults {
  rngType: string;
  iterations: number;
  uniqueSeeds: number;
  repeats: number;
  repeatRate: string;
  averageHammingDistance: string;
  duration: string;
  passed: boolean;
}
```

### AvalancheEffectResults 🆕

```typescript
interface AvalancheEffectResults {
  rngType: string;
  iterations: number;
  meanAvalanche: string;
  stdDev: string;
  min: string;
  max: string;
  deviationFrom50: string;
  ideal: string;
  duration: string;
  passed: boolean;
}
```

### TimingJitterResults

```typescript
interface TimingJitterResults {
  rngType: string;
  samplesAnalyzed: number;
  min: string;
  max: string;
  mean: string;
  stdDev: string;
  range: string;
  coefficientOfVariation: string;
  histogram: number[];
}
```

---

## Test Results

### Interpretation Guide

#### Shannon Entropy

| Range | Quality | Interpretation |
|-------|---------|----------------|
| 7.9-8.0 | Excellent | Ideal randomness |
| 7.5-7.9 | Good | Acceptable for most uses |
| 7.0-7.5 | Fair | May indicate bias |
| < 7.0 | Poor | Insufficient randomness |

#### Monobit Test

| Range | Quality | Interpretation |
|-------|---------|----------------|
| 0.0-1.0 | Excellent | Balanced distribution |
| 1.0-2.0 | Good | Acceptable variance |
| 2.0-3.0 | Fair | Investigate |
| > 3.0 | Poor | Significant bias |

#### Runs Test

| Range | Quality | Interpretation |
|-------|---------|----------------|
| 0.0-1.0 | Excellent | Good oscillation |
| 1.0-2.0 | Good | Acceptable patterns |
| 2.0-3.0 | Fair | Investigate patterns |
| > 3.0 | Poor | Non-random sequences |

#### Chi-Square Test 🆕

| Range | Quality | Interpretation |
|-------|---------|----------------|
| < 200 | Excellent | Highly uniform distribution |
| 200-293.25 | Good | Passes 95% confidence threshold |
| 293.25-350 | Fair | Marginal uniformity |
| > 350 | Poor | Non-uniform distribution |

*Critical value at 95% confidence (255 degrees of freedom) = 293.25*

#### Serial Correlation Test 🆕

| Range | Quality | Interpretation |
|-------|---------|----------------|
| 0.0-0.05 | Excellent | Highly independent bits |
| 0.05-0.10 | Good | Acceptable independence |
| 0.10-0.20 | Fair | Some correlation present |
| > 0.20 | Poor | Significant correlation |

#### Avalanche Effect 🆕

| Range | Quality | Interpretation |
|-------|---------|----------------|
| 45-55% | Excellent | Ideal bit-flip propagation |
| 40-45% or 55-60% | Good | Acceptable variation |
| 35-40% or 60-65% | Fair | Investigate |
| < 35% or > 65% | Poor | Insufficient propagation |

#### Collision Rate

| Rate | Status | Action |
|------|--------|--------|
| 0% | Perfect | Expected |
| > 0% | Failed | Investigate immediately |

#### Hamming Distance

| Distance | Quality | Interpretation |
|----------|---------|----------------|
| 250-260 bits | Excellent | ~50% bit flips (ideal) |
| 200-250 bits | Good | Acceptable variation |
| 150-200 bits | Fair | Low diversity |
| < 150 bits | Poor | Seeds too similar |

---

## Usage Examples

### Complete Statistical Analysis

```javascript
async function fullAnalysis() {
  const rng = new ntrpRNG();
  const dev = new ntrpRNGDev(rng);
  
  // Wait for entropy collection
  await new Promise(r => setTimeout(r, 5000));
  
  // Run concatenated analysis with all 5 statistical tests
  const results = await dev.runMultiSeedTest(500, 128, true);
  
  console.log('=== Statistical Analysis (64KB dataset) ===');
  console.log(`Shannon Entropy: ${results.shannonEntropy.value}`);
  console.log(`Monobit Test: ${results.monobitTest.value}`);
  console.log(`Runs Test: ${results.runsTest.value}`);
  console.log(`Chi-Square: ${results.chiSquareTest.value}`);
  console.log(`Serial Correlation: ${results.serialCorrelationTest.value}`);
}
```

### Avalanche Effect Analysis

```javascript
async function analyzeAvalanche() {
  const rng = new cgRNDV(); // Fast testing
  const dev = new ntrpRNGDev(rng);
  
  const results = await dev.testAvalancheEffect(100);
  
  console.log('=== Avalanche Effect ===');
  console.log(`Mean: ${results.meanAvalanche}`);
  console.log(`Deviation from 50%: ${results.deviationFrom50}`);
  console.log(`Range: [${results.min}, ${results.max}]`);
  console.log(`Status: ${results.passed ? 'PASSED ✓' : 'FAILED ✗'}`);
}
```

### Comparing ntrpRNG vs cgRNDV

```javascript
async function compareEntropy() {
  const ntrp = new ntrpRNG({ minEvents: 50 });
  const cg = new cgRNDV();
  
  // Wait for ntrpRNG to collect entropy
  await new Promise(r => setTimeout(r, 5000));
  
  const dev1 = new ntrpRNGDev(ntrp);
  const dev2 = new ntrpRNGDev(cg);
  
  console.log('Testing ntrpRNG...');
  const r1 = await dev1.runTestSuite('medium');
  
  console.log('\nTesting cgRNDV...');
  const r2 = await dev2.runTestSuite('medium');
  
  // Compare all metrics
  console.log('\n=== Comparison ===');
  console.log(`Shannon - ntrpRNG: ${r1.tests.multiSeed.shannonEntropy.mean}`);
  console.log(`Shannon - cgRNDV:  ${r2.tests.multiSeed.shannonEntropy.mean}`);
  console.log(`Chi-Square - ntrpRNG: ${r1.tests.multiSeed.chiSquareTest.mean}`);
  console.log(`Chi-Square - cgRNDV:  ${r2.tests.multiSeed.chiSquareTest.mean}`);
  console.log(`Avalanche - ntrpRNG: ${r1.tests.avalanche.meanAvalanche}`);
  console.log(`Avalanche - cgRNDV:  ${r2.tests.avalanche.meanAvalanche}`);
}
```

### CI/CD Integration

```javascript
async function ciValidation() {
  const rng = new cgRNDV(); // Fast, no user interaction needed
  const dev = new ntrpRNGDev(rng);
  
  const results = await dev.runTestSuite('medium');
  
  const entropy = parseFloat(results.tests.multiSeed.shannonEntropy.mean);
  const monobit = parseFloat(results.tests.multiSeed.monobitTest.mean);
  const chiSquare = parseFloat(results.tests.multiSeed.chiSquareTest.mean);
  const serialCorr = parseFloat(results.tests.multiSeed.serialCorrelationTest.mean);
  
  if (entropy < 7.5 || 
      monobit > 2.0 || 
      chiSquare > 293.25 ||
      serialCorr > 0.1) {
    throw new Error('Quality thresholds not met');
  }
  
  console.log('✓ All tests passed');
}
```

### Production Monitoring

```javascript
async function productionCheck() {
  const rng = new ntrpRNG({
    iterations: 10000,
    saltSize: 64,
    minEvents: 100
  });
  
  const dev = new ntrpRNGDev(rng);
  
  // Wait for entropy
  await new Promise(r => setTimeout(r, 10000));
  
  const results = await dev.runTestSuite('high');
  
  const report = {
    timestamp: new Date().toISOString(),
    rngType: results.rngType,
    passed: results.tests.salt.passed && 
            results.tests.repeatability.passed &&
            results.tests.avalanche.passed,
    entropy: results.tests.multiSeed.shannonEntropy.mean,
    chiSquare: results.tests.multiSeed.chiSquareTest.mean,
    avalanche: results.tests.avalanche.meanAvalanche
  };
  
  console.log('Production Report:', report);
  return report;
}
```

### Baseline Comparison with New Tests

```javascript
async function establishBaseline() {
  // Test cgRNDV as baseline
  const baseline = new cgRNDV();
  const devBase = new ntrpRNGDev(baseline);
  
  console.log('Establishing cgRNDV baseline...');
  const baseResults = await devBase.runMultiSeedTest(500, 128, true);
  
  // Test ntrpRNG implementation
  const impl = new ntrpRNG();
  const devImpl = new ntrpRNGDev(impl);
  
  await new Promise(r => setTimeout(r, 10000));
  
  console.log('Testing ntrpRNG implementation...');
  const implResults = await devImpl.runMultiSeedTest(500, 128, true);
  
  // Compare all 5 statistical tests
  console.log('\n=== Baseline Comparison ===');
  console.log('Dataset: 500 seeds × 128 bytes = 64KB');
  
  console.log('\nShannon Entropy:');
  console.log(`  Baseline (cgRNDV): ${baseResults.shannonEntropy.value}`);
  console.log(`  ntrpRNG:           ${implResults.shannonEntropy.value}`);
  
  console.log('\nMonobit Test:');
  console.log(`  Baseline (cgRNDV): ${baseResults.monobitTest.value}`);
  console.log(`  ntrpRNG:           ${implResults.monobitTest.value}`);
  
  console.log('\nRuns Test:');
  console.log(`  Baseline (cgRNDV): ${baseResults.runsTest.value}`);
  console.log(`  ntrpRNG:           ${implResults.runsTest.value}`);
  
  console.log('\nChi-Square Test:');
  console.log(`  Baseline (cgRNDV): ${baseResults.chiSquareTest.value}`);
  console.log(`  ntrpRNG:           ${implResults.chiSquareTest.value}`);
  
  console.log('\nSerial Correlation:');
  console.log(`  Baseline (cgRNDV): ${baseResults.serialCorrelationTest.value}`);
  console.log(`  ntrpRNG:           ${implResults.serialCorrelationTest.value}`);
  
  // Test avalanche effect
  console.log('\n=== Avalanche Effect Comparison ===');
  const baseAvalanche = await devBase.testAvalancheEffect(100);
  const implAvalanche = await devImpl.testAvalancheEffect(100);
  
  console.log(`Baseline (cgRNDV): ${baseAvalanche.meanAvalanche}`);
  console.log(`ntrpRNG:           ${implAvalanche.meanAvalanche}`);
}
```

---

## Best Practices

### Testing Strategy

1. **Development**: Use cgRNDV with `'low'` level for fast iteration
2. **Pre-commit**: Run both RNGs with `'medium'` level
3. **CI/CD**: Automate cgRNDV `'medium'` tests (fast, no interaction)
4. **Release**: Full ntrpRNG `'extreme'` validation
5. **Production**: Periodic cgRNDV monitoring for baseline verification

### RNG Selection

**Use cgRNDV when:**
- Running automated tests
- Need instant results
- No user interaction available
- Establishing performance baseline
- CI/CD pipelines

**Use ntrpRNG when:**
- Testing behavioral entropy collection
- Validating user interaction integration
- Full entropy mixing validation required
- Production deployment testing
- Maximum entropy diversity needed

### Statistical Test Selection

**Always run:**
- Shannon Entropy (information density)
- Monobit Test (bit balance)
- Chi-Square Test (uniformity)

**Additional validation:**
- Runs Test (pattern detection)
- Serial Correlation (independence)
- Avalanche Effect (propagation)

### Concatenated vs Individual Mode

**Use Concatenated Mode when:**
- Testing large datasets (>10KB)
- Need single comprehensive score
- Comparing implementations
- Establishing baseline metrics

**Use Individual Mode when:**
- Analyzing per-seed quality
- Detecting outliers
- Understanding variance
- Debugging specific seeds

### Resource Management

```javascript
try {
  await dev.runTestSuite('high');
} finally {
  if (dev.supportsBehavioralTests()) {
    dev.rng.stopCollecting();
  }
  dev.clearTestResults();
}
```

### Quality Thresholds

```javascript
function validateQuality(results) {
  const entropy = parseFloat(results.shannonEntropy.value);
  const monobit = parseFloat(results.monobitTest.value);
  const runs = parseFloat(results.runsTest.value);
  const chiSquare = parseFloat(results.chiSquareTest.value);
  const serialCorr = parseFloat(results.serialCorrelationTest.value);
  
  return {
    passed: entropy >= 7.9 &&
            monobit < 2.0 &&
            runs < 2.0 &&
            chiSquare < 293.25 &&
            serialCorr < 0.1,
    metrics: { entropy, monobit, runs, chiSquare, serialCorr }
  };
}
```

---

## Advanced Testing Patterns

### Multi-Stage Validation

```javascript
async function multiStageValidation() {
  const rng = new ntrpRNG();
  const dev = new ntrpRNGDev(rng);
  
  // Stage 1: Quick check
  console.log('Stage 1: Quick validation...');
  const quick = await dev.runMultiSeedTest(10, 32);
  if (parseFloat(quick.shannonEntropy.mean) < 7.5) {
    throw new Error('Failed quick check');
  }
  
  // Stage 2: Standard analysis
  console.log('Stage 2: Standard analysis...');
  const standard = await dev.runMultiSeedTest(100, 64, true);
  if (parseFloat(standard.chiSquareTest.value) > 293.25) {
    throw new Error('Failed chi-square test');
  }
  
  // Stage 3: Comprehensive validation
  console.log('Stage 3: Comprehensive validation...');
  const full = await dev.runTestSuite('high');
  
  return full;
}
```

### Regression Testing

```javascript
async function regressionTest() {
  const baselineScores = {
    shannon: 7.9985,
    chiSquare: 250.3,
    serialCorr: 0.045,
    avalanche: 49.8
  };
  
  const rng = new cgRNDV();
  const dev = new ntrpRNGDev(rng);
  
  const results = await dev.runMultiSeedTest(500, 128, true);
  const avalanche = await dev.testAvalancheEffect(100);
  
  const shannon = parseFloat(results.shannonEntropy.value);
  const chiSquare = parseFloat(results.chiSquareTest.value);
  const serialCorr = parseFloat(results.serialCorrelationTest.value);
  const avl = parseFloat(avalanche.meanAvalanche);
  
  const regressions = [];
  
  if (Math.abs(shannon - baselineScores.shannon) > 0.01) {
    regressions.push(`Shannon drift: ${shannon} vs ${baselineScores.shannon}`);
  }
  
  if (Math.abs(chiSquare - baselineScores.chiSquare) > 20) {
    regressions.push(`Chi-Square drift: ${chiSquare} vs ${baselineScores.chiSquare}`);
  }
  
  if (Math.abs(serialCorr - baselineScores.serialCorr) > 0.02) {
    regressions.push(`Serial Corr drift: ${serialCorr} vs ${baselineScores.serialCorr}`);
  }
  
  if (Math.abs(avl - baselineScores.avalanche) > 2.0) {
    regressions.push(`Avalanche drift: ${avl}% vs ${baselineScores.avalanche}%`);
  }
  
  if (regressions.length > 0) {
    console.warn('Regressions detected:', regressions);
    return false;
  }
  
  console.log('✓ All metrics within expected ranges');
  return true;
}
```

### Stress Testing

```javascript
async function stressTest() {
  const rng = new cgRNDV();
  const dev = new ntrpRNGDev(rng);
  
  console.log('=== Stress Test ===');
  
  // Test 1: Rapid generation
  console.log('\n1. Rapid seed generation (1000 seeds)...');
  const start1 = performance.now();
  for (let i = 0; i < 1000; i++) {
    await rng.generateSeed(true);
  }
  const duration1 = performance.now() - start1;
  console.log(`Duration: ${(duration1 / 1000).toFixed(2)}s`);
  console.log(`Rate: ${(1000 / (duration1 / 1000)).toFixed(2)} seeds/s`);
  
  // Test 2: Large dataset analysis
  console.log('\n2. Large dataset analysis (1MB)...');
  const large = await dev.runMultiSeedTest(2000, 512, true);
  console.log(`Shannon: ${large.shannonEntropy.value}`);
  console.log(`Chi-Square: ${large.chiSquareTest.value}`);
  
  // Test 3: Avalanche consistency
  console.log('\n3. Avalanche consistency (200 pairs)...');
  const avl = await dev.testAvalancheEffect(200);
  console.log(`Mean: ${avl.meanAvalanche}`);
  console.log(`StdDev: ${avl.stdDev}`);
  
  // Test 4: Salt collision check
  console.log('\n4. Salt collision (10000 salts)...');
  const salt = await dev.verifySaltConsistency(10000);
  console.log(`Collisions: ${salt.collisions}`);
  console.log(`Status: ${salt.passed ? 'PASSED ✓' : 'FAILED ✗'}`);
  
  return {
    generationRate: (1000 / (duration1 / 1000)).toFixed(2),
    largeDatasetQuality: large,
    avalancheConsistency: avl,
    saltUniqueness: salt
  };
}
```

### A/B Testing

```javascript
async function abTest() {
  const configA = new ntrpRNG({ iterations: 5000, saltSize: 32 });
  const configB = new ntrpRNG({ iterations: 10000, saltSize: 64 });
  
  const devA = new ntrpRNGDev(configA);
  const devB = new ntrpRNGDev(configB);
  
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Testing Configuration A (5K iterations, 32B salt)...');
  const resultsA = await devA.runMultiSeedTest(100, 64, true);
  
  console.log('Testing Configuration B (10K iterations, 64B salt)...');
  const resultsB = await devB.runMultiSeedTest(100, 64, true);
  
  console.log('\n=== A/B Comparison ===');
  console.log('Shannon Entropy:');
  console.log(`  Config A: ${resultsA.shannonEntropy.value}`);
  console.log(`  Config B: ${resultsB.shannonEntropy.value}`);
  
  console.log('Chi-Square:');
  console.log(`  Config A: ${resultsA.chiSquareTest.value}`);
  console.log(`  Config B: ${resultsB.chiSquareTest.value}`);
  
  console.log('Serial Correlation:');
  console.log(`  Config A: ${resultsA.serialCorrelationTest.value}`);
  console.log(`  Config B: ${resultsB.serialCorrelationTest.value}`);
  
  console.log('Duration:');
  console.log(`  Config A: ${resultsA.duration}`);
  console.log(`  Config B: ${resultsB.duration}`);
}
```

---

## Browser Compatibility

Same as ntrpRNG and cgRNDV:
- `crypto.getRandomValues()` (all browsers since 2013)
- `crypto.subtle.digest()` (SHA-256, SHA-512)
- `async/await` (ES2017+)
- `Math.log2()` (ES2015+)
- Console API for logging

**Tested on:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Node.js 16+ (with crypto polyfill)

---

## Performance Considerations

### Test Duration Estimates

**cgRNDV (Fast Mode):**
- LOW: 5-10 seconds
- MEDIUM: 30-60 seconds
- HIGH: 1-3 minutes
- EXTREME: 5-15 minutes

**ntrpRNG (With Entropy Collection):**
- LOW: 10-20 seconds
- MEDIUM: 1-3 minutes
- HIGH: 3-6 minutes
- EXTREME: 10-25 minutes

### Memory Usage

| Test | Memory Impact | Notes |
|------|---------------|-------|
| Multi-Seed (LOW) | ~1 MB | 10 × 32 bytes |
| Multi-Seed (EXTREME) | ~64 MB | 500 × 128 bytes |
| Concatenated Mode | 2x data size | Temporary array |
| Avalanche Test | Minimal | Pair-wise comparison |
| Monitoring | ~100 KB | Sample storage |

### Optimization Tips

1. **Use concatenated mode** for large datasets (reduces iterations)
2. **Run cgRNDV in CI/CD** for speed (no entropy collection)
3. **Clear test results** periodically (`clearTestResults()`)
4. **Adjust test levels** based on environment
5. **Parallelize independent tests** when possible

---

## Troubleshooting

### Common Issues

#### Low Shannon Entropy

```javascript
// Problem: Shannon < 7.5
const results = await dev.runMultiSeedTest(100, 64);
if (parseFloat(results.shannonEntropy.mean) < 7.5) {
  // Solution 1: Increase dataset size
  const larger = await dev.runMultiSeedTest(500, 128, true);
  
  // Solution 2: Check RNG configuration
  console.log(dev.rng.getStats());
  
  // Solution 3: For ntrpRNG, ensure entropy collection
  if (dev.supportsBehavioralTests()) {
    await new Promise(r => setTimeout(r, 10000));
  }
}
```

#### High Chi-Square Values

```javascript
// Problem: Chi-Square > 293.25
if (parseFloat(results.chiSquareTest.value) > 293.25) {
  // This indicates non-uniform byte distribution
  // Check for:
  // 1. Insufficient seed size
  // 2. Biased entropy source
  // 3. Hash function issues
  
  // Re-test with larger dataset
  const retest = await dev.runMultiSeedTest(1000, 128, true);
  console.log(`Retest Chi-Square: ${retest.chiSquareTest.value}`);
}
```

#### Poor Avalanche Effect

```javascript
// Problem: Avalanche not ~50%
const avl = await dev.testAvalancheEffect(100);
const mean = parseFloat(avl.meanAvalanche);

if (Math.abs(mean - 50) > 5) {
  // This indicates poor bit-flip propagation
  // Possible causes:
  // 1. Weak hash function
  // 2. Insufficient mixing
  // 3. Correlated inputs
  
  console.warn(`Avalanche ${mean}% (target: 50%)`);
  console.warn(`Deviation: ${avl.deviationFrom50}`);
}
```

---

## FAQ

### Q: Which tests are most important?

**A:** For production validation:
1. **Shannon Entropy** - Overall randomness quality
2. **Chi-Square Test** - Distribution uniformity
3. **Avalanche Effect** - Bit propagation quality
4. **Salt Consistency** - Collision detection

### Q: When should I use concatenated mode?

**A:** Use concatenated mode when:
- Testing >10KB of data
- Establishing baseline metrics
- Comparing RNG implementations
- Need single comprehensive score

### Q: How do I interpret avalanche results?

**A:** Ideal avalanche is 50% (half the bits change):
- 45-55%: Excellent propagation
- 40-60%: Acceptable
- <40% or >60%: Investigation needed

### Q: Can I skip behavioral tests?

**A:** Yes, use cgRNDV for:
- CI/CD pipelines
- Automated testing
- Quick validation
- Baseline comparison

### Q: What's a good test level for CI/CD?

**A:** Use `'medium'` with cgRNDV:
```javascript
const rng = new cgRNDV();
const dev = new ntrpRNGDev(rng);
await dev.runTestSuite('medium'); // ~30-60s
```

### Q: How often should I run tests?

**A:**
- Development: On significant changes
- CI/CD: Every commit (cgRNDV, medium)
- Staging: Daily (ntrpRNG, high)
- Production: Weekly monitoring (cgRNDV, baseline)

---

## License

MIT

---

## Related Documentation

- **ntrpRNG API**: Core RNG implementation
- **cgRNDV API**: Baseline crypto wrapper
- **NIST SP 800-22**: Statistical test specifications
- **Avalanche Effect**: Cryptographic diffusion theory

---

## Support

For issues or questions:
- Check interpretation guides above
- Review test results section
- Compare with cgRNDV baseline
- Run multi-level validation