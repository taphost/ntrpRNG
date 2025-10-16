ntrpRNG v1.3.0 - Usage Examples
================================================================================

BASIC USAGE
--------------------------------------------------------------------------------

Example 1: Quick Start with Progress Monitoring
```javascript
// Create instance (500 weighted events required, auto-collect enabled)
const rng = new ntrpRNG();

// Monitor progress
const monitor = setInterval(async () => {
  const progress = rng.getProgress();
  console.log(`Progress: ${progress.percentage.toFixed(1)}%`);
  console.log(`Events: ${progress.currentEvents}/500`);
  
  if (progress.ready) {
    clearInterval(monitor);
    const seed = await rng.generateSeedHex();
    console.log('Generated seed:', seed);
    rng.stopCollecting();
  }
}, 500);
```


Example 2: Simple Generation (Wait for Ready)
```javascript
const rng = new ntrpRNG();

// Wait for sufficient entropy
while (!rng.hasMinimumEntropy()) {
  await new Promise(resolve => setTimeout(resolve, 100));
}

const seed = await rng.generateSeedHex();
console.log('Seed:', seed);
rng.stopCollecting();
```


Example 3: Manual Collection Control
```javascript
// Start with collection disabled
const rng = new ntrpRNG({ autoCollect: false });

// Start collection on user action
document.getElementById('startBtn').addEventListener('click', () => {
  rng.startCollecting();
  console.log('Entropy collection started');
});

// Generate when ready
document.getElementById('generateBtn').addEventListener('click', async () => {
  if (rng.hasMinimumEntropy()) {
    const seed = await rng.generateSeedHex();
    rng.stopCollecting();
    console.log('Seed:', seed);
  } else {
    alert('Need more interaction (500 weighted events required)');
  }
});
```


COMMON PATTERNS
--------------------------------------------------------------------------------

Example 4: Different Output Formats
```javascript
const rng = new ntrpRNG();

// Wait for ready state
while (!rng.getProgress().ready) {
  await new Promise(resolve => setTimeout(resolve, 100));
}

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


Example 5: Real-Time Progress Display
```javascript
const rng = new ntrpRNG();

// Display live stats with weighted event breakdown
setInterval(() => {
  const stats = rng.getStats();
  const progress = rng.getProgress();
  
  console.log(`Progress: ${progress.percentage.toFixed(1)}%`);
  console.log(`Weighted events: ${progress.currentEvents}/500`);
  console.log(`  Keyboard: ${stats.eventCount.keyboard} (weight 3)`);
  console.log(`  Mouse: ${stats.eventCount.mouse} (weight 1-2)`);
  console.log(`  Touch: ${stats.eventCount.touch} (weight 1-2)`);
  console.log(`  Scroll: ${stats.eventCount.scroll} (weight 1)`);
  console.log(`Ready: ${progress.ready}`);
}, 1000);
```


Example 6: Multiple Independent Seeds
```javascript
async function generateMultipleSeeds(count) {
  const rng = new ntrpRNG();
  const seeds = [];
  
  // Wait for initial entropy
  while (!rng.hasMinimumEntropy()) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Generate multiple unique seeds
  for (let i = 0; i < count; i++) {
    const seed = await rng.generateSeedHex();
    seeds.push(seed);
    
    // Clear and wait for fresh entropy
    rng.clearEntropy();
    console.log(`Generated seed ${i + 1}/${count}`);
    
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  rng.stopCollecting();
  return seeds;
}

generateMultipleSeeds(3).then(seeds => {
  console.log('All seeds generated:', seeds);
});
```


Example 7: Custom Configuration (High Security)
```javascript
const rng = new ntrpRNG({
  iterations: 10000,      // Double iterations for higher security
  saltSize: 64,           // Larger salt (default: 32)
  autoCollect: true       // Start immediately
});
// Note: minEvents is hardcoded to 500 and cannot be changed

const seed = await rng.generateSeedHex();
console.log('High-security seed:', seed);
```


ERROR HANDLING
--------------------------------------------------------------------------------

Example 8: Handling Insufficient Entropy
```javascript
const rng = new ntrpRNG();

try {
  // Attempt generation before ready
  const seed = await rng.generateSeedHex();
  console.log('Success:', seed);
} catch (error) {
  if (error.message.includes('Insufficient entropy')) {
    const progress = rng.getProgress();
    console.error(
      `Need ${500 - progress.currentEvents} more weighted events`
    );
    
    // Option 1: Wait for more events
    console.log('Please interact more (move mouse, type, scroll)');
    
    // Option 2: Skip validation (NOT RECOMMENDED for production)
    const seed = await rng.generateSeedHex(true);
    console.log('Generated with skipValidation:', seed);
  }
}
```


Example 9: Integrity Check Error Handling
```javascript
try {
  const rng = new ntrpRNG();
  const seed = await rng.generateSeed();
} catch (error) {
  if (error.message.includes('integrity check')) {
    console.error('SECURITY VIOLATION: Minimum events constant tampered');
    // This should never happen in normal operation
    // Indicates potential security compromise
  }
}
```


CLEANUP & RESOURCE MANAGEMENT
--------------------------------------------------------------------------------

Example 10: Proper Cleanup
```javascript
const rng = new ntrpRNG();

// Wait and generate
while (!rng.hasMinimumEntropy()) {
  await new Promise(resolve => setTimeout(resolve, 100));
}

const seed = await rng.generateSeedHex();

// Stop collection (removes event listeners, clears timers)
rng.stopCollecting();

// Clear entropy data if generating new seed later
rng.clearEntropy();

console.log('Cleanup complete');
```


PRACTICAL APPLICATIONS
--------------------------------------------------------------------------------

Example 11: Progress Bar UI Implementation
```javascript
const rng = new ntrpRNG();

const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progressText');
const generateBtn = document.getElementById('generate');
const seedDisplay = document.getElementById('seed');

// Update UI every 100ms
const updateUI = () => {
  const progress = rng.getProgress();
  
  // Update progress bar
  progressBar.style.width = progress.percentage + '%';
  progressText.textContent = `${progress.currentEvents}/500 weighted events`;
  
  // Enable button when ready
  if (progress.ready) {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Seed';
    generateBtn.classList.add('ready');
  } else {
    generateBtn.textContent = 
      `Collecting... ${progress.percentage.toFixed(0)}%`;
  }
};

setInterval(updateUI, 100);

// Generate on click
generateBtn.addEventListener('click', async () => {
  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';
  
  const seed = await rng.generateSeedHex();
  seedDisplay.textContent = seed;
  
  rng.stopCollecting();
  generateBtn.textContent = 'Seed Generated ✓';
});
```


Example 12: Detailed Event Type Display
```javascript
const rng = new ntrpRNG();

const eventElements = {
  keyboard: document.getElementById('keyboard'),
  mouse: document.getElementById('mouse'),
  touch: document.getElementById('touch'),
  scroll: document.getElementById('scroll'),
  other: document.getElementById('other')
};

setInterval(() => {
  const stats = rng.getStats();
  
  // Display weighted counts by type
  eventElements.keyboard.textContent = 
    `Keyboard: ${stats.eventCount.keyboard} (weight 3)`;
  eventElements.mouse.textContent = 
    `Mouse: ${stats.eventCount.mouse} (weight 1-2)`;
  eventElements.touch.textContent = 
    `Touch: ${stats.eventCount.touch} (weight 1-2)`;
  eventElements.scroll.textContent = 
    `Scroll: ${stats.eventCount.scroll} (weight 1)`;
  eventElements.other.textContent = 
    `Motion: ${stats.eventCount.other} (weight 2)`;
  
  // Total weighted events
  document.getElementById('total').textContent = 
    `Total: ${stats.totalEvents}/500`;
}, 200);
```


Example 13: Seed History Tracker
```javascript
const rng = new ntrpRNG();
const seedHistory = [];

async function generateAndStore() {
  if (!rng.hasMinimumEntropy()) {
    console.log('Waiting for entropy...');
    return;
  }
  
  const seed = await rng.generateSeedHex();
  const timestamp = new Date().toISOString();
  
  seedHistory.push({ seed, timestamp });
  console.log(`Seed ${seedHistory.length} generated at ${timestamp}`);
  
  // Clear for next generation
  rng.clearEntropy();
}

// Generate seeds at intervals
setInterval(generateAndStore, 10000);

// Export history
function exportHistory() {
  const json = JSON.stringify(seedHistory, null, 2);
  console.log('History:', json);
  return json;
}
```


Example 14: Interactive Seed Generator with Countdown
```javascript
const rng = new ntrpRNG();

let countdownInterval;

const startGeneration = () => {
  console.log('Please interact: move mouse, type, or scroll');
  
  countdownInterval = setInterval(() => {
    const progress = rng.getProgress();
    const remaining = 500 - progress.currentEvents;
    
    console.log(`${remaining} weighted events needed`);
    console.log(`${progress.percentage.toFixed(1)}% complete`);
    
    if (progress.ready) {
      clearInterval(countdownInterval);
      console.log('Ready! Generating seed...');
      
      rng.generateSeedHex().then(seed => {
        console.log('Seed:', seed);
        rng.stopCollecting();
      });
    }
  }, 1000);
};

startGeneration();
```


ADVANCED USAGE
--------------------------------------------------------------------------------

Example 15: Uniqueness Testing
```javascript
async function testUniqueness(count) {
  const rng = new ntrpRNG({ iterations: 1000 });
  const seeds = new Set();
  
  console.log(`Generating ${count} seeds...`);
  
  for (let i = 0; i < count; i++) {
    const seed = await rng.generateSeedHex(true); // Skip validation
    seeds.add(seed);
    
    if ((i + 1) % 100 === 0) {
      console.log(`Generated ${i + 1}/${count}`);
    }
  }
  
  rng.stopCollecting();
  
  const uniqueRate = (seeds.size / count * 100).toFixed(4);
  console.log(`Unique: ${seeds.size}/${count} (${uniqueRate}%)`);
  
  // Should be 100% due to Path B fresh randomness
  return seeds.size === count;
}

testUniqueness(1000);
```


Example 16: Performance Measurement
```javascript
const rng = new ntrpRNG();

// Wait for entropy
while (!rng.hasMinimumEntropy()) {
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Measure generation time
const start = performance.now();
const seed = await rng.generateSeedHex();
const elapsed = performance.now() - start;

console.log(`Seed generated in ${elapsed.toFixed(2)}ms`);
console.log('Seed:', seed);

rng.stopCollecting();
```


NOTES
--------------------------------------------------------------------------------

v1.3.0 Breaking Changes:
- minEvents is hardcoded to 500 (cannot be configured)
- Export name: window.ntrpRng → window.ntrpRNG
- Event counting is now weighted:
  * Keyboard: weight 3
  * Mouse down, touch start, device motion: weight 2
  * Mouse move, touch move, scroll: weight 1
- Seeds are non-deterministic (always unique due to CSPRNG path)
- Generation time: +100-200ms due to async batching

Security Recommendations:
- Never use skipValidation in production
- Always wait for full 500 weighted events (~5-10 seconds)
- Use getProgress() for user feedback
- Call stopCollecting() after generation
- Use iterations: 10000 for high-security scenarios