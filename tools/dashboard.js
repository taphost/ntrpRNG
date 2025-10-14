// --- Global State Variables ---
let rng; // The ntrpRNG instance
let perfData = []; // Stores performance data for the chart
let seedHistory = []; // Stores a history of generated seeds
let eventLog = []; // Stores log messages for the UI
let statsInterval = null; // Interval ID for updating stats
let autoGenInterval = null; // Interval ID for auto-generation
let isStressTestRunning = false; // Flag to control the cancellable stress test
let isGenerating = false; // Global lock for seed generation

// --- Refactor (High Priority): Added constants for memory limits ---
const MAX_LOG_ENTRIES = 100;
const MAX_HISTORY_ENTRIES = 50;

/**
 * Initializes the dashboard, sets up event listeners, and prepares the UI.
 */
function init() {
  updateConfig();
  addLog('info', 'Dashboard initialized - Click "Start Collection" to begin');
  
  document.getElementById('generateBtn').addEventListener('click', generateSeed);
  document.getElementById('startBtn').addEventListener('click', startCollection);
  document.getElementById('stopBtn').addEventListener('click', stopCollection);
  document.getElementById('clearBtn').addEventListener('click', () => {
    if (rng) {
      rng.clearEntropy();
      addLog('info', 'Entropy cleared');
      // --- Bug Fix: Force stats update after clearing entropy ---
      updateStats();
    }
  });

  document.getElementById('autoGenToggle').addEventListener('change', toggleAutoGen);
  
  ['iterSlider', 'saltSlider', 'eventsSlider'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateConfig);
  });

  // --- Refactor (Low Priority): Add validation for auto-gen interval input ---
  const autoGenInput = document.getElementById('autoGenInterval');
  autoGenInput.addEventListener('change', () => {
    const min = parseInt(autoGenInput.min);
    const max = parseInt(autoGenInput.max);
    let value = parseInt(autoGenInput.value);
    if (isNaN(value) || value < min) value = min;
    if (value > max) value = max;
    autoGenInput.value = value;
  });

  // --- User Feedback Fix: Draw chart on init to prevent layout shift ---
  updatePerfChart();
}

/**
 * Starts the entropy collection process and updates the UI accordingly.
 */
function startCollection() {
  if (!rng) updateConfig();
  rng.startCollecting();
  document.getElementById('startBtn').disabled = true;
  document.getElementById('startBtn').className = 'inactive';
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('stopBtn').className = 'danger';
  document.getElementById('generateBtn').disabled = false;
  document.getElementById('generateBtn').className = 'active';

  // --- Usability Fix: Disable preset buttons during collection ---
  document.querySelectorAll('.button-row button[onclick^="applyPreset"]').forEach(btn => {
    btn.disabled = true;
  });
  
  if (!statsInterval) {
    // --- Refactor (Low Priority): Reduced stats update frequency to improve performance ---
    statsInterval = setInterval(updateStats, 250);
  }
  addLog('success', 'Collection started');
}

/**
 * Stops the entropy collection process and updates the UI.
 */
function stopCollection() {
  if (rng) rng.stopCollecting();
  document.getElementById('startBtn').disabled = false;
  document.getElementById('startBtn').className = 'success';
  document.getElementById('stopBtn').disabled = true;
  document.getElementById('stopBtn').className = 'inactive';

  // --- Usability Fix: Re-enable preset buttons ---
  document.querySelectorAll('.button-row button[onclick^="applyPreset"]').forEach(btn => {
    btn.disabled = false;
  });
  
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
  
  if (autoGenInterval) {
    clearInterval(autoGenInterval);
    autoGenInterval = null;
    document.getElementById('autoGenToggle').checked = false;
  }
  
  addLog('info', 'Collection stopped');
}

/**
 * Reads configuration from the UI, updates labels, and re-initializes the ntrpRNG instance.
 */
function updateConfig() {
  const iterations = parseInt(document.getElementById('iterSlider').value);
  const saltSize = parseInt(document.getElementById('saltSlider').value);
  const minEvents = parseInt(document.getElementById('eventsSlider').value);

  document.getElementById('iterValue').textContent = iterations;
  document.getElementById('saltValue').textContent = saltSize;
  document.getElementById('eventsValue').textContent = minEvents;

  const estimatedTime = Math.round(iterations / 50);
  document.getElementById('estimatedTime').textContent = `~${estimatedTime}ms`;

  if (rng) rng.stopCollecting();
  rng = new ntrpRNG({ iterations, saltSize, minEvents, autoCollect: false });
}

/**
 * Fetches the latest stats from the RNG and updates all relevant UI elements.
 */
function updateStats() {
  if (!rng) return;

  const stats = rng.getStats();
  document.getElementById('statMouse').textContent = stats.eventCount.mouse;
  document.getElementById('statKeyboard').textContent = stats.eventCount.keyboard;
  document.getElementById('statTouch').textContent = stats.eventCount.touch;
  document.getElementById('statScroll').textContent = stats.eventCount.scroll;
  document.getElementById('statOther').textContent = stats.eventCount.other;
  document.getElementById('statTotal').textContent = stats.totalEvents;
  document.getElementById('statPool').textContent = stats.entropyPoolSize;
  document.getElementById('statTimer').textContent = stats.timerDeltasSize;

  const progress = stats.minEvents > 0 ? Math.min(100, (stats.totalEvents / stats.minEvents) * 100) : 0;
  const progressBarFill = document.getElementById('progressBar');
  const progressBarContainer = progressBarFill.parentElement;
  
  progressBarFill.style.width = progress + '%';
  progressBarFill.textContent = progress.toFixed(0) + '%';
  // --- Refactor (Medium Priority): Accessibility for progress bar ---
  progressBarContainer.setAttribute('aria-valuenow', progress.toFixed(0));

  const indicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  
  if (stats.isCollecting) {
    indicator.className = 'status-indicator status-collecting';
    statusText.textContent = 'Collecting...';
  } else if (stats.hasMinimumEntropy) {
    indicator.className = 'status-indicator status-ready';
    statusText.textContent = 'Ready';
  } else {
    indicator.className = 'status-indicator status-stopped';
    statusText.textContent = 'Stopped';
  }
}

/**
 * Generates a new seed, updates the UI with the result, and handles performance tracking.
 */
async function generateSeed() {
  if (isGenerating) {
    addLog('warning', 'Generation already in progress.');
    return;
  }
  isGenerating = true;
  updateUIState(true);

  const startTime = performance.now();
  addLog('info', 'Generating seed...');

  try {
    const [seedHex, seedBase64] = await Promise.all([
      rng.generateSeedHex(),
      rng.generateSeedBase64()
    ]);

    const duration = performance.now() - startTime;

    document.getElementById('seedHex').textContent = seedHex;
    document.getElementById('seedBase64').textContent = seedBase64;

    perfData.push(duration);
    if (perfData.length > 50) perfData.shift(); // Increased chart history

    const avg = perfData.reduce((a, b) => a + b, 0) / perfData.length;
    document.getElementById('perfLast').textContent = duration.toFixed(2);
    document.getElementById('perfAvg').textContent = avg.toFixed(2);

    const seedCount = parseInt(document.getElementById('statSeeds').textContent) + 1;
    document.getElementById('statSeeds').textContent = seedCount;

    updatePerfChart();

    seedHistory.push({
      timestamp: new Date().toISOString(),
      hex: seedHex,
      base64: seedBase64,
      duration: duration.toFixed(2),
      config: {
        iterations: rng.iterations,
        saltSize: rng.saltSize,
        minEvents: rng.minEvents
      }
    });
    
    // --- Refactor (High Priority): Enforce memory limit on seed history array ---
    if (seedHistory.length > MAX_HISTORY_ENTRIES) {
      seedHistory = seedHistory.slice(-MAX_HISTORY_ENTRIES);
    }

    updateHistoryTable();
    addLog('success', `Seed generated in ${duration.toFixed(2)}ms`);

  } catch (error) {
    addLog('error', `Generation failed: ${error.message}`);
  } finally {
    isGenerating = false;
    updateUIState(false);
  }
}

/**
 * Renders the performance data onto the canvas chart.
 */
function updatePerfChart() {
  const canvas = document.getElementById('perfChart');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = 120;

  // --- Fix: Hardcode colors to ensure they are applied correctly ---
  const accentColor = '#3b82f6';
  const textColor = '#cbd5e1';

  ctx.clearRect(0, 0, width, height);

  // --- Refactor (High Priority): Add error handling for chart ---
  if (perfData.length === 0) {
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    // --- User Feedback Fix: Increase placeholder text size ---
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('No performance data yet. Generate a seed to see the chart.', width / 2, height / 2);
    return;
  }
  if (perfData.length < 2) {
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    // --- User Feedback Fix: Increase placeholder text size ---
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Need at least 2 data points to draw the chart.', width / 2, height / 2);
    return;
  }

  const max = Math.max(...perfData);
  if (max === 0) return; // Avoid division by zero

  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const step = chartWidth / (perfData.length - 1);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();

  perfData.forEach((val, i) => {
    const x = padding + i * step;
    const y = height - padding - (val / max) * chartHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  ctx.fillStyle = accentColor;
  perfData.forEach((val, i) => {
    const x = padding + i * step;
    const y = height - padding - (val / max) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Updates the seed history table with the latest generated seeds.
 */
function updateHistoryTable() {
  const tbody = document.getElementById('historyBody');
  tbody.innerHTML = '';

  // Display the last 10 seeds, which is a reasonable amount for a scrollable view
  seedHistory.slice(-10).reverse().forEach((seed) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = new Date(seed.timestamp).toLocaleTimeString();
    row.insertCell(1).innerHTML = `<span style="font-family: monospace; font-size: 0.8rem;">${seed.hex.slice(0, 16)}...</span>`;
    row.insertCell(2).textContent = seed.duration + 'ms';
    row.insertCell(3).textContent = `I:${seed.config.iterations} S:${seed.config.saltSize} E:${seed.config.minEvents}`;
    
    const actionsCell = row.insertCell(4);
    const btn = document.createElement('button');
    btn.textContent = 'View';
    btn.className = 'active';
    btn.style.padding = '4px 8px';
    btn.style.minWidth = '60px';
    btn.onclick = () => {
      document.getElementById('seedHex').textContent = seed.hex;
      document.getElementById('seedBase64').textContent = seed.base64;
    };
    actionsCell.appendChild(btn);
  });
}

/**
 * Adds a new entry to the event log and updates the UI.
 * @param {string} type - The type of log (e.g., 'info', 'success', 'error').
 * @param {string} message - The log message to display.
 */
function addLog(type, message) {
  const time = new Date().toLocaleTimeString();
  const logItem = { time, type, message };
  eventLog.push(logItem);

  // --- Refactor (High Priority): Enforce memory limit on event log array ---
  if (eventLog.length > MAX_LOG_ENTRIES) {
    eventLog = eventLog.slice(-MAX_LOG_ENTRIES);
  }
  
  const logDiv = document.getElementById('eventLog');
  // --- Refactor: Efficiently rebuild log instead of appending/removing ---
  logDiv.innerHTML = eventLog.map(item => {
    return `<div class="log-entry">
      <span class="log-time">${item.time}</span>
      <span class="log-type log-${item.type}">[${item.type.toUpperCase()}]</span>
      ${item.message}
    </div>`;
  }).join('');

  logDiv.scrollTop = logDiv.scrollHeight;
}

/**
 * Copies the generated seed to the clipboard in the specified format.
 * @param {string} format - The format to copy ('hex' or 'base64').
 */
function copySeed(format) {
  const text = document.getElementById(format === 'hex' ? 'seedHex' : 'seedBase64').textContent;
  if (text && text !== 'No seed generated yet') {
    navigator.clipboard.writeText(text).then(() => {
      addLog('info', `Copied ${format} to clipboard`);
    });
  }
}

// --- UI Action Functions ---

function clearLog() {
  document.getElementById('eventLog').innerHTML = '';
  eventLog = [];
  addLog('info', 'Log cleared');
}

function clearHistory() {
  seedHistory = [];
  updateHistoryTable();
  addLog('info', 'History cleared');
}

function exportLogs() {
  const data = JSON.stringify(eventLog, null, 2);
  downloadFile('event-logs.json', data);
  addLog('info', 'Logs exported');
}

function exportSeeds() {
  // --- Refactor (Low Priority): Properly quote all CSV fields to handle special characters ---
  const escapeCsvField = (field) => `"${String(field).replace(/"/g, '""')}"`;
  
  const headers = ['Timestamp', 'Hex', 'Base64', 'Duration', 'Iterations', 'SaltSize', 'MinEvents'];
  let csv = headers.join(',') + '\n';
  
  seedHistory.forEach(s => {
    const row = [
      s.timestamp,
      s.hex,
      s.base64,
      s.duration,
      s.config.iterations,
      s.config.saltSize,
      s.config.minEvents
    ].map(escapeCsvField).join(',');
    csv += row + '\n';
  });
  downloadFile('seeds.csv', csv);
  addLog('info', 'Seeds exported');
}

function checkUniqueness() {
  const hexSeeds = seedHistory.map(s => s.hex);
  const unique = new Set(hexSeeds);
  const msg = unique.size === hexSeeds.length 
    ? `✓ All ${hexSeeds.length} seeds are unique`
    : `✗ Found ${hexSeeds.length - unique.size} duplicates!`;
  addLog(unique.size === hexSeeds.length ? 'success' : 'error', msg);
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function applyPreset(type) {
  const presets = {
    quick: { iter: 1000, salt: 32, events: 20 },
    standard: { iter: 5000, salt: 32, events: 50 },
    secure: { iter: 10000, salt: 64, events: 100 }
  };

  const p = presets[type];
  document.getElementById('iterSlider').value = p.iter;
  document.getElementById('saltSlider').value = p.salt;
  document.getElementById('eventsSlider').value = p.events;
  updateConfig();
  addLog('info', `Applied ${type} preset`);
}

async function stressTest() {
  if (isGenerating) {
    addLog('warning', 'Cannot start stress test while a generation is in progress.');
    return;
  }
  const stressTestBtn = document.getElementById('stressTestBtn');
  if (isStressTestRunning) {
    isStressTestRunning = false; // Signal to stop
    addLog('warning', 'Stress test cancellation requested...');
    stressTestBtn.textContent = 'Stress Test';
    stressTestBtn.className = 'active';
    return;
  }

  if (!rng || !rng.isCollecting) {
    addLog('error', 'Start collection first!');
    return;
  }
  
  isStressTestRunning = true;
  stressTestBtn.textContent = 'Cancel Test';
  stressTestBtn.className = 'danger';
  addLog('info', 'Starting stress test: 10 consecutive generations');
  
  for (let i = 1; i <= 10; i++) {
    if (!isStressTestRunning) {
      addLog('info', 'Stress test cancelled by user.');
      break; // Exit loop if cancelled
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!rng.hasMinimumEntropy()) {
      addLog('error', `Stress test stopped at ${i}/10: insufficient entropy`);
      break;
    }
    
    await generateSeed();
    addLog('info', `Stress test: ${i}/10 completed`);
  }
  
  if (isStressTestRunning) {
    addLog('success', 'Stress test completed!');
  }
  
  isStressTestRunning = false;
  stressTestBtn.textContent = 'Stress Test';
  stressTestBtn.className = 'active';
  // Also update the global UI state in case it was the last operation
  if (!isGenerating) {
    updateUIState(false);
  }
}

function toggleAutoGen(e) {
  if (e.target.checked) {
    if (!rng || !rng.isCollecting) {
      addLog('error', 'Start collection first!');
      e.target.checked = false;
      return;
    }
    
    const intervalSeconds = parseInt(document.getElementById('autoGenInterval').value);
    const intervalMs = Math.max(1000, intervalSeconds * 1000); // Ensure at least 1s
    
    const autoGenFn = async () => {
      if (isGenerating) return; // Skip if another generation is running
      // --- Refactor (Medium Priority): Stop auto-gen if entropy is insufficient ---
      if (!rng.hasMinimumEntropy()) {
        addLog('warning', 'Auto-gen paused: insufficient entropy.');
        return;
      }
      await generateSeed();
    };
    
    autoGenInterval = setInterval(autoGenFn, intervalMs);
    addLog('success', `Auto-generation enabled (${intervalMs/1000}s interval)`);
  } else {
    if (autoGenInterval) {
      clearInterval(autoGenInterval);
      autoGenInterval = null;
    }
    addLog('info', 'Auto-generation disabled');
  }
}

window.addEventListener('load', init);

window.addEventListener('beforeunload', () => {
  if (rng) rng.stopCollecting();
  if (statsInterval) clearInterval(statsInterval);
  if (autoGenInterval) clearInterval(autoGenInterval);
});

// Tooltip system
const tooltips = {
  control: {
    title: 'Control Panel',
    content: '<p><strong>Start Collection:</strong> Begin gathering entropy from user interactions (mouse, keyboard, touch, scroll) and timer jitter.</p><p><strong>Stop Collection:</strong> Halt entropy collection and disable generation.</p><p><strong>Generate Seed:</strong> Create a cryptographic seed using collected entropy.</p><p><strong>Clear Entropy:</strong> Reset the entropy pool and event counters.</p><p><strong>Quick Presets:</strong> Apply predefined configurations for different security levels.</p><p><strong>Stress Test:</strong> Run 10 consecutive seed generations to test performance.</p><p><strong>Auto-Generate:</strong> Automatically generate seeds at regular intervals.</p>'
  },
  config: {
    title: 'Configuration',
    content: '<p><strong>Iterations:</strong> Number of hash rounds (1000-20000). Higher values = more secure but slower.</p><p><strong>Salt Size:</strong> Random data length in bytes (16-128). Larger salt = better security.</p><p><strong>Min Events:</strong> Minimum user interactions required before generation (0-200). Higher = more entropy collected.</p><p><strong>Performance Metrics:</strong> Last/Average generation time and total seeds created.</p>'
  },
  stats: {
    title: 'Live Statistics',
    content: '<p><strong>Mouse/Keyboard/Touch/Scroll:</strong> Count of events captured from each input source.</p><p><strong>Total Events:</strong> Sum of all captured interactions.</p><p><strong>Pool Size:</strong> Number of entropy values stored.</p><p><strong>Timer Deltas:</strong> High-resolution timing measurements collected.</p><p><strong>Other:</strong> Device motion and additional sensor data.</p>'
  },
  perf: {
    title: 'Performance Chart',
    content: '<p>Visual representation of seed generation times over the last 20 operations.</p><p>Blue line shows performance trends - lower values indicate faster generation.</p><p>Helps identify performance consistency and potential bottlenecks.</p>'
  },
  seed: {
    title: 'Generated Seed',
    content: '<p>Display area for the last generated cryptographic seed in two formats:</p><p><strong>Hex:</strong> Hexadecimal representation (128 characters for 512-bit output).</p><p><strong>Base64:</strong> Base64-encoded format for easier transmission.</p><p>Use Copy buttons to transfer seeds to clipboard.</p>'
  },
  history: {
    title: 'Seed History',
    content: '<p>Log of the last 10 generated seeds with metadata:</p><p><strong>Time:</strong> When the seed was created.</p><p><strong>Preview:</strong> First 16 hex characters of the seed.</p><p><strong>Duration:</strong> Time taken to generate in milliseconds.</p><p><strong>Config:</strong> Parameters used (Iterations, Salt size, Min events).</p><p><strong>View:</strong> Display full seed in the output panel above.</p>'
  },
  log: {
    title: 'Event Log',
    content: '<p>Real-time activity feed showing system operations:</p><p><strong>[INFO]:</strong> General status updates and actions.</p><p><strong>[SUCCESS]:</strong> Successful operations and completions.</p><p><strong>[ERROR]:</strong> Failed operations or validation errors.</p><p>Export logs as JSON for debugging or analysis.</p>'
  },
};

let currentTooltip = null;
let tooltipTimeout = null;

function showTooltip(event, type) {
  event.stopPropagation();
  
  // Remove existing tooltip
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
    return;
  }

  const info = tooltips[type];
  if (!info) return;

  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip show';
  tooltip.innerHTML = `<h3>${info.title}</h3>${info.content}`;
  document.body.appendChild(tooltip);

  const rect = event.target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  let left = rect.left - tooltipRect.width - 10;
  let top = rect.top;

  // Adjust if tooltip goes off screen
  if (left < 10) {
    left = rect.right + 10;
  }
  if (left + tooltipRect.width > window.innerWidth - 10) {
    left = window.innerWidth - tooltipRect.width - 10;
  }
  if (top + tooltipRect.height > window.innerHeight - 10) {
    top = window.innerHeight - tooltipRect.height - 10;
  }

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';

  currentTooltip = tooltip;

  // --- Refactor (Low Priority): Add tooltip timeout to auto-hide ---
  if (tooltipTimeout) clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(() => {
    if (currentTooltip) {
      currentTooltip.remove();
      currentTooltip = null;
    }
  }, 4000);
}

// Close tooltip on click outside
document.addEventListener('click', (e) => {
  if (currentTooltip && !e.target.classList.contains('info-btn')) {
    currentTooltip.remove();
    currentTooltip = null;
  }
});

/**
 * Centralized function to update the UI state based on whether an operation is in progress.
 * @param {boolean} isBusy - True if a critical operation is running.
 */
function updateUIState(isBusy) {
  const generateBtn = document.getElementById('generateBtn');
  const stressTestBtn = document.getElementById('stressTestBtn');
  const clearBtn = document.getElementById('clearBtn');
  const autoGenToggle = document.getElementById('autoGenToggle');

  if (isBusy) {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    stressTestBtn.disabled = true;
    clearBtn.disabled = true;
    // Optionally disable auto-gen toggle during generation
    // autoGenToggle.disabled = true;
  } else {
    // Only re-enable if collection is active
    const isCollecting = rng && rng.isCollecting;
    generateBtn.disabled = !isCollecting;
    generateBtn.textContent = 'Generate Seed';
    stressTestBtn.disabled = !isCollecting;
    clearBtn.disabled = false;
    // autoGenToggle.disabled = false;
  }
}
