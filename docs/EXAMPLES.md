ntrpRNG v1.2.1 - Usage Examples
================================================================================

BASIC USAGE
--------------------------------------------------------------------------------

Example 1: Quick Start (Default Configuration)
```javascript
// Create instance with auto-collection enabled
const rng = new ntrpRNG();

// Wait for user to interact (move mouse, type, scroll, etc.)
// Then generate a seed

const seed = await rng.generateSeedHex();
console.log('Generated seed:', seed);
// Output: 64-byte hex string (128 characters)
```


Example 2: Generate Seed with Minimum Events Requirement
```javascript
// Require at least 10 user events before allowing seed generation
const rng = new ntrpRNG({ minEvents: 10 });

// Check if enough entropy collected
if (rng.hasMinimumEntropy()) {
  const seed = await rng.generateSeedHex();
  console.log('Seed:', seed);
} else {
  console.log('Please interact more with the page');
}
```


Example 3: Manual Collection Control
```javascript
// Start with collection disabled
const rng = new ntrpRNG({ autoCollect: false });

// Start collection when needed
document.getElementById('startBtn').addEventListener('click', () => {
  rng.startCollecting();
  console.log('Entropy collection started');
});

// Stop collection after generating seed
document.getElementById('generateBtn').addEventListener('click', async () => {
  const seed = await rng.generateSeedHex();
  rng.stopCollecting();
  console.log('Seed generated:', seed);
});
```


COMMON PATTERNS
--------------------------------------------------------------------------------

Example 4: Different Output Formats
```javascript
const rng = new ntrpRNG();

// Hexadecimal (128 chars)
const hexSeed = await rng.generateSeedHex();
console.log('Hex:', hexSeed);

// Base64 (88 chars, more compact)
const base64Seed = await rng.generateSeedBase64();
console.log('Base64:', base64Seed);

// Raw bytes (64 bytes)
const rawSeed = await rng.generateSeed();
console.log('Bytes:', rawSeed);
```


Example 5: Monitoring Entropy Collection
```javascript
const rng = new ntrpRNG({ minEvents: 20 });

// Display real-time stats
setInterval(() => {
  const stats = rng.getStats();
  console.log(`Events: ${stats.totalEvents}/${stats.minEvents}`);
  console.log(`Mouse: ${stats.eventCount.mouse}`);
  console.log(`Keyboard: ${stats.eventCount.keyboard}`);
  console.log(`Ready: ${stats.hasMinimumEntropy}`);
}, 1000);

// Generate when ready
document.getElementById('generateBtn').addEventListener('click', async () => {
  if (rng.hasMinimumEntropy()) {
    const seed = await rng.generateSeedHex();
    console.log('Seed:', seed);
  } else {
    alert('Not enough entropy collected yet!');
  }
});
```


Example 6: Multiple Seeds from Same Instance
```javascript
const rng = new ntrpRNG();

// Generate first seed
const seed1 = await rng.generateSeedHex();
console.log('Seed 1:', seed1);

// Continue collecting entropy, generate another seed
// (each seed will be unique due to different entropy state)
setTimeout(async () => {
  const seed2 = await rng.generateSeedHex();
  console.log('Seed 2:', seed2);
}, 5000);
```


Example 7: Custom Configuration
```javascript
const rng = new ntrpRNG({
  iterations: 10000,      // More hash iterations (slower, more secure)
  saltSize: 64,           // Larger salt (default: 32)
  autoCollect: true,      // Start collecting immediately
  minEvents: 15           // Require 15 events minimum
});

const seed = await rng.generateSeedHex();
console.log('Custom seed:', seed);
```


ERROR HANDLING
--------------------------------------------------------------------------------

Example 8: Handling Insufficient Entropy
```javascript
const rng = new ntrpRNG({ minEvents: 50 });

try {
  const seed = await rng.generateSeedHex();
  console.log('Success:', seed);
} catch (error) {
  console.error('Error:', error.message);
  // Output: "Insufficient entropy. Events: 12/50, Pool: 156, Timer: 234"
  
  // Skip validation if needed (not recommended for production)
  const seed = await rng.generateSeedHex(true);
  console.log('Generated anyway:', seed);
}
```


CLEANUP
--------------------------------------------------------------------------------

Example 9: Proper Cleanup
```javascript
const rng = new ntrpRNG();

// Use the generator
const seed = await rng.generateSeedHex();

// Stop collection when done
rng.stopCollecting();

// Clear entropy data if needed
rng.clearEntropy();

console.log('Cleanup complete');
```


PRACTICAL APPLICATION
--------------------------------------------------------------------------------

Example 10: Wallet Seed Generation UI
```javascript
const rng = new ntrpRNG({ minEvents: 30 });

const progressBar = document.getElementById('progress');
const generateBtn = document.getElementById('generate');
const seedDisplay = document.getElementById('seed');

// Update UI with collection progress
const updateProgress = () => {
  const stats = rng.getStats();
  const progress = Math.min(100, (stats.totalEvents / 30) * 100);
  progressBar.style.width = progress + '%';
  
  if (stats.hasMinimumEntropy) {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Seed';
  } else {
    generateBtn.textContent = `Collecting... (${stats.totalEvents}/30)`;
  }
};

setInterval(updateProgress, 200);

generateBtn.addEventListener('click', async () => {
  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';
  
  const seed = await rng.generateSeedHex();
  seedDisplay.textContent = seed;
  
  rng.stopCollecting();
  generateBtn.textContent = 'Seed Generated!';
});
```