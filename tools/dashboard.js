// ============================================================================
// NTRPRNG DASHBOARD - OPTIMIZED VERSION (v1.3.0 Compatible)
// ============================================================================
// Global State Variables
// ============================================================================

let rng; // The ntrpRNG instance
let perfData = []; // Stores performance data for the chart
let seedHistory = []; // Stores a history of generated seeds
let eventLog = []; // Stores log messages for the UI
let statsInterval = null; // Interval ID for updating stats
let autoGenInterval = null; // Interval ID for auto-generation
let isStressTestRunning = false; // Flag to control the cancellable stress test
let isGenerating = false; // Global lock for seed generation
let statsUpdateScheduled = false; // Debouncing flag for stats updates

// Memory management constants
const MAX_LOG_ENTRIES = 100;
const MAX_HISTORY_ENTRIES = 50;
const MAX_PERF_DATA_POINTS = 50;

// Generation timeout constant (30 seconds)
const GENERATION_TIMEOUT = 30000;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the dashboard, sets up event listeners, and prepares the UI.
 */
function init() {
  updateConfig();
  addLog('info', 'Dashboard initialized - ntrpRNG v1.3.0 with weighted event counting');
  addLog('info', 'Required: 500 weighted events (keyboard×3, mouse down/touch×2, move/scroll×1)');
  
  // Core control buttons
  document.getElementById('generateBtn').addEventListener('click', generateSeed);
  document.getElementById('startBtn').addEventListener('click', startCollection);
  document.getElementById('stopBtn').addEventListener('click', stopCollection);
  document.getElementById('clearBtn').addEventListener('click', () => {
    if (rng) {
      rng.clearEntropy();
      addLog('info', 'Entropy cleared');
      updateStats();
    }
  });

  // Auto-generation toggle
  document.getElementById('autoGenToggle').addEventListener('change', toggleAutoGen);
  
  // Configuration sliders (minEvents removed, only iterations and saltSize)
  ['iterSlider', 'saltSlider'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateConfig);
  });

  // Auto-gen interval validation
  const autoGenInput = document.getElementById('autoGenInterval');
  autoGenInput.addEventListener('change', () => {
    const min = parseInt(autoGenInput.min);
    const max = parseInt(autoGenInput.max);
    let value = parseInt(autoGenInput.value);
    if (isNaN(value) || value < min) value = min;
    if (value > max) value = max;
    autoGenInput.value = value;
  });

  // Preset buttons with event delegation
  document.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-preset')) {
      applyPreset(e.target.dataset.preset);
    }
  });

  // Stress test button
  document.getElementById('stressTestBtn').addEventListener('click', stressTest);

  // History action buttons
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
  document.getElementById('exportSeedsBtn').addEventListener('click', exportSeeds);
  document.getElementById('checkUniquenessBtn').addEventListener('click', checkUniqueness);

  // Log action buttons
  document.getElementById('clearLogBtn').addEventListener('click', clearLog);
  document.getElementById('exportLogsBtn').addEventListener('click', exportLogs);

  // Copy seed buttons
  document.getElementById('copyHexBtn').addEventListener('click', () => copySeed('hex'));
  document.getElementById('copyBase64Btn').addEventListener('click', () => copySeed('base64'));

  // Tooltip system with event delegation
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('info-btn')) {
      showTooltip(e, e.target.dataset.tooltip);
    }
  });

  // Close tooltip on click outside
  document.addEventListener('click', (e) => {
    if (currentTooltip && !e.target.classList.contains('info-btn')) {
      currentTooltip.remove();
      currentTooltip = null;
      if (tooltipTimeout) clearTimeout(tooltipTimeout);
    }
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  // Draw initial empty chart to prevent layout shift
  updatePerfChart();
}

// ============================================================================
// COLLECTION MANAGEMENT
// ============================================================================

/**
 * Starts the entropy collection process and updates the UI accordingly.
 */
function startCollection() {
  if (!rng) updateConfig();
  rng.startCollecting();
  
  // Update control buttons
  document.getElementById('startBtn').disabled = true;
  document.getElementById('startBtn').className = 'inactive';
  document.getElementById('stopBtn').disabled = false;
  document.getElementById('stopBtn').className = 'danger';
  document.getElementById('generateBtn').disabled = false;
  document.getElementById('generateBtn').className = 'active';

  // Disable preset buttons during collection
  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.disabled = true;
  });
  
  // Start stats update interval
  if (!statsInterval) {
    statsInterval = setInterval(updateStats, 250);
  }
  
  addLog('success', 'Collection started - gathering weighted entropy');
}

/**
 * Stops the entropy collection process and updates the UI.
 */
function stopCollection() {
  if (rng) rng.stopCollecting();
  
  // Update control buttons
  document.getElementById('startBtn').disabled = false;
  document.getElementById('startBtn').className = 'success';
  document.getElementById('stopBtn').disabled = true;
  document.getElementById('stopBtn').className = 'inactive';

  // Re-enable preset buttons
  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.disabled = false;
  });
  
  // Clear intervals
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

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Reads configuration from the UI, updates labels, and re-initializes the ntrpRNG instance.
 * Note: minEvents is hardcoded to 500 in ntrpRNG v1.3.0
 */
function updateConfig() {
  const iterations = parseInt(document.getElementById('iterSlider').value);
  const saltSize = parseInt(document.getElementById('saltSlider').value);

  document.getElementById('iterValue').textContent = iterations;
  document.getElementById('saltValue').textContent = saltSize;

  const estimatedTime = Math.round(iterations / 50);
  document.getElementById('estimatedTime').textContent = `~${estimatedTime}ms`;

  if (rng) rng.stopCollecting();
  // minEvents is hardcoded to 500 in ntrpRNG v1.3.0, no need to pass it
  rng = new ntrpRNG({ iterations, saltSize, autoCollect: false });
}

// ============================================================================
// STATISTICS UPDATE (WITH DEBOUNCING)
// ============================================================================

/**
 * Fetches the latest stats from the RNG and updates all relevant UI elements.
 * Uses requestAnimationFrame for optimized rendering.
 * Uses getProgress() API for accurate weighted event tracking.
 */
function updateStats() {
  if (!rng || statsUpdateScheduled) return;
  
  statsUpdateScheduled = true;
  requestAnimationFrame(() => {
    const stats = rng.getStats();
    const progress = rng.getProgress();
    
    // Update event counters (these are weighted values)
    document.getElementById('statMouse').textContent = stats.eventCount.mouse;
    document.getElementById('statKeyboard').textContent = stats.eventCount.keyboard;
    document.getElementById('statTouch').textContent = stats.eventCount.touch;
    document.getElementById('statScroll').textContent = stats.eventCount.scroll;
    document.getElementById('statOther').textContent = stats.eventCount.other;
    document.getElementById('statTotal').textContent = progress.currentEvents;
    document.getElementById('statPool').textContent = stats.entropyPoolSize;
    document.getElementById('statTimer').textContent = stats.timerDeltasSize;

    // Update progress bar using getProgress() API
    const progressBarFill = document.getElementById('progressBar');
    const progressBarContainer = progressBarFill.parentElement;
    
    progressBarFill.style.width = progress.percentage + '%';
    progressBarFill.textContent = progress.percentage.toFixed(0) + '%';
    progressBarContainer.setAttribute('aria-valuenow', progress.percentage.toFixed(0));

    // Update status indicator
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (stats.isCollecting) {
      indicator.className = 'status-indicator status-collecting';
      statusText.textContent = `Collecting... (${progress.currentEvents}/500 weighted)`;
    } else if (progress.ready) {
      indicator.className = 'status-indicator status-ready';
      statusText.textContent = 'Ready';
    } else {
      indicator.className = 'status-indicator status-stopped';
      statusText.textContent = 'Stopped';
    }
    
    statsUpdateScheduled = false;
  });
}

// ============================================================================
// SEED GENERATION (WITH ERROR HANDLING AND TIMEOUT)
// ============================================================================

/**
 * Generates a new seed with timeout protection and comprehensive error handling.
 */
async function generateSeed() {
  // Prevent concurrent generation
  if (isGenerating) {
    showToast('Generation already in progress', 'warning');
    return;
  }
  
  try {
    isGenerating = true;
    updateUIState(true);

    const startTime = performance.now();
    addLog('info', 'Generating seed...');

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Generation timeout after 30s')), GENERATION_TIMEOUT)
    );
    
    // Create generation promise
    const seedPromise = Promise.all([
      rng.generateSeedHex(),
      rng.generateSeedBase64()
    ]);
    
    // Race between generation and timeout
    const [seedHex, seedBase64] = await Promise.race([
      seedPromise,
      timeoutPromise
    ]);

    const duration = performance.now() - startTime;

    // Update seed display
    document.getElementById('seedHex').textContent = seedHex;
    document.getElementById('seedBase64').textContent = seedBase64;

    // Update performance data
    perfData.push(duration);
    if (perfData.length > MAX_PERF_DATA_POINTS) {
      perfData.shift();
    }

    const avg = perfData.reduce((a, b) => a + b, 0) / perfData.length;
    document.getElementById('perfLast').textContent = duration.toFixed(2);
    document.getElementById('perfAvg').textContent = avg.toFixed(2);

    const seedCount = parseInt(document.getElementById('statSeeds').textContent) + 1;
    document.getElementById('statSeeds').textContent = seedCount;

    // Update performance chart
    updatePerfChart();

    // Add to history
    seedHistory.push({
      timestamp: new Date().toISOString(),
      hex: seedHex,
      base64: seedBase64,
      duration: duration.toFixed(2),
      config: {
        iterations: rng.iterations,
        saltSize: rng.saltSize,
        minEvents: 500 // Always 500 in v1.3.0
      }
    });
    
    // Enforce memory limit on history
    if (seedHistory.length > MAX_HISTORY_ENTRIES) {
      seedHistory = seedHistory.slice(-MAX_HISTORY_ENTRIES);
    }

    updateHistoryTable();
    addLog('success', `Seed generated in ${duration.toFixed(2)}ms (from 500 weighted events)`);
    showToast(`✓ Seed generated in ${duration.toFixed(2)}ms`, 'success');

  } catch (error) {
    console.error('Generation error:', error);
    const errorMsg = `Generation failed: ${error.message}`;
    addLog('error', errorMsg);
    showToast(errorMsg, 'error');
  } finally {
    isGenerating = false;
    updateUIState(false);
  }
}

// ============================================================================
// PERFORMANCE CHART (OPTIMIZED RENDERING)
// ============================================================================

/**
 * Renders the performance data onto the canvas chart with optimized rendering.
 */
function updatePerfChart() {
  const canvas = document.getElementById('perfChart');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = 120;

  // Get theme-aware colors from CSS variables
  const computedStyle = getComputedStyle(document.documentElement);
  const accentColor = computedStyle.getPropertyValue('--accent').trim();
  const textColor = computedStyle.getPropertyValue('--text-secondary').trim();
  const bgColor = computedStyle.getPropertyValue('--bg-tertiary').trim();

  // Clear with background color instead of transparent
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Handle empty or insufficient data
  if (perfData.length === 0) {
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('No performance data yet. Generate a seed to see the chart.', width / 2, height / 2);
    return;
  }
  
  if (perfData.length < 2) {
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
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

  // Draw line
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

  // Draw points
  ctx.fillStyle = accentColor;
  perfData.forEach((val, i) => {
    const x = padding + i * step;
    const y = height - padding - (val / max) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ============================================================================
// SEED HISTORY
// ============================================================================

/**
 * Updates the seed history table with the latest generated seeds.
 */
function updateHistoryTable() {
  const tbody = document.getElementById('historyBody');
  tbody.innerHTML = '';

  // Display the last 10 seeds in reverse chronological order
  seedHistory.slice(-10).reverse().forEach((seed) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = new Date(seed.timestamp).toLocaleTimeString();
    row.insertCell(1).innerHTML = `<span style="font-family: monospace; font-size: 0.8rem;">${seed.hex.slice(0, 16)}...</span>`;
    row.insertCell(2).textContent = seed.duration + 'ms';
    row.insertCell(3).textContent = `I:${seed.config.iterations} S:${seed.config.saltSize}`;
    
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

// ============================================================================
// EVENT LOG (OPTIMIZED INCREMENTAL RENDERING)
// ============================================================================

/**
 * Adds a new entry to the event log with optimized DOM manipulation.
 * @param {string} type - The type of log (e.g., 'info', 'success', 'error', 'warning').
 * @param {string} message - The log message to display.
 */
function addLog(type, message) {
  const time = new Date().toLocaleTimeString();
  const logItem = { time, type, message };
  eventLog.push(logItem);

  // Enforce memory limit - remove oldest entry
  if (eventLog.length > MAX_LOG_ENTRIES) {
    eventLog.shift();
  }
  
  const logDiv = document.getElementById('eventLog');
  
  // Create and append only the new entry
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `
    <span class="log-time">${time}</span>
    <span class="log-type log-${type}">[${type.toUpperCase()}]</span>
    ${message}
  `;
  logDiv.appendChild(entry);
  
  // Remove first DOM element if exceeds limit
  if (logDiv.children.length > MAX_LOG_ENTRIES) {
    logDiv.removeChild(logDiv.firstChild);
  }

  // Auto-scroll to bottom
  logDiv.scrollTop = logDiv.scrollHeight;
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

/**
 * Shows a non-intrusive toast notification.
 * @param {string} message - The message to display.
 * @param {string} type - The type of toast ('info', 'success', 'error', 'warning').
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Auto-remove after 3 seconds with fade-out animation
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================================
// CLIPBOARD OPERATIONS
// ============================================================================

/**
 * Copies the generated seed to the clipboard in the specified format.
 * @param {string} format - The format to copy ('hex' or 'base64').
 */
function copySeed(format) {
  const text = document.getElementById(format === 'hex' ? 'seedHex' : 'seedBase64').textContent;
  if (text && text !== 'No seed generated yet') {
    navigator.clipboard.writeText(text).then(() => {
      addLog('info', `Copied ${format.toUpperCase()} to clipboard`);
      showToast(`✓ ${format.toUpperCase()} copied to clipboard`, 'success');
    }).catch(err => {
      addLog('error', `Failed to copy: ${err.message}`);
      showToast('Failed to copy to clipboard', 'error');
    });
  }
}

// ============================================================================
// UI ACTION FUNCTIONS
// ============================================================================

/**
 * Clears the event log.
 */
function clearLog() {
  document.getElementById('eventLog').innerHTML = '';
  eventLog = [];
  addLog('info', 'Log cleared');
}

/**
 * Clears the seed history.
 */
function clearHistory() {
  seedHistory = [];
  updateHistoryTable();
  addLog('info', 'History cleared');
  showToast('History cleared', 'info');
}

/**
 * Exports event logs as JSON.
 */
function exportLogs() {
  const data = JSON.stringify(eventLog, null, 2);
  downloadFile('event-logs.json', data);
  addLog('info', 'Logs exported');
  showToast('Logs exported successfully', 'success');
}

/**
 * Exports seed history as CSV with proper escaping.
 */
function exportSeeds() {
  const escapeCsvField = (field) => `"${String(field).replace(/"/g, '""')}"`;
  
  const headers = ['Timestamp', 'Hex', 'Base64', 'Duration', 'Iterations', 'SaltSize'];
  let csv = headers.join(',') + '\n';
  
  seedHistory.forEach(s => {
    const row = [
      s.timestamp,
      s.hex,
      s.base64,
      s.duration,
      s.config.iterations,
      s.config.saltSize
    ].map(escapeCsvField).join(',');
    csv += row + '\n';
  });
  
  downloadFile('seeds.csv', csv);
  addLog('info', 'Seeds exported');
  showToast('Seeds exported successfully', 'success');
}

/**
 * Checks uniqueness of generated seeds.
 */
function checkUniqueness() {
  const hexSeeds = seedHistory.map(s => s.hex);
  const unique = new Set(hexSeeds);
  const isUnique = unique.size === hexSeeds.length;
  const msg = isUnique
    ? `✓ All ${hexSeeds.length} seeds are unique`
    : `✗ Found ${hexSeeds.length - unique.size} duplicates!`;
  
  addLog(isUnique ? 'success' : 'error', msg);
  showToast(msg, isUnique ? 'success' : 'error');
}

/**
 * Downloads a file with the given content.
 * @param {string} filename - The name of the file to download.
 * @param {string} content - The content of the file.
 */
function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Applies a configuration preset.
 * Note: minEvents is always 500 in ntrpRNG v1.3.0
 * @param {string} type - The preset type ('quick', 'standard', 'secure').
 */
function applyPreset(type) {
  const presets = {
    quick: { iter: 1000, salt: 32 },
    standard: { iter: 5000, salt: 32 },
    secure: { iter: 10000, salt: 64 }
  };

  const p = presets[type];
  if (!p) return;
  
  document.getElementById('iterSlider').value = p.iter;
  document.getElementById('saltSlider').value = p.salt;
  updateConfig();
  addLog('info', `Applied ${type} preset (500 weighted events always required)`);
  showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} preset applied`, 'info');
}

// ============================================================================
// STRESS TEST
// ============================================================================

/**
 * Runs a stress test with 10 consecutive seed generations.
 * Can be cancelled by clicking the button again.
 */
async function stressTest() {
  if (isGenerating) {
    showToast('Cannot start stress test while a generation is in progress', 'warning');
    return;
  }
  
  const stressTestBtn = document.getElementById('stressTestBtn');
  
  // Cancel if already running
  if (isStressTestRunning) {
    isStressTestRunning = false;
    addLog('warning', 'Stress test cancellation requested...');
    showToast('Stress test cancelled', 'warning');
    stressTestBtn.textContent = 'Stress Test';
    stressTestBtn.className = 'active';
    return;
  }

  // Validate collection is active
  if (!rng || !rng.isCollecting) {
    addLog('error', 'Start collection first!');
    showToast('Start collection before running stress test', 'error');
    return;
  }
  
  isStressTestRunning = true;
  stressTestBtn.textContent = 'Cancel Test';
  stressTestBtn.className = 'danger';
  addLog('info', 'Starting stress test: 10 consecutive generations');
  
  for (let i = 1; i <= 10; i++) {
    if (!isStressTestRunning) {
      addLog('info', 'Stress test cancelled by user.');
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const progress = rng.getProgress();
    if (!progress.ready) {
      addLog('error', `Stress test stopped at ${i}/10: insufficient weighted entropy (${progress.currentEvents}/500)`);
      showToast('Stress test stopped: insufficient entropy', 'error');
      break;
    }
    
    await generateSeed();
    addLog('info', `Stress test: ${i}/10 completed`);
  }
  
  if (isStressTestRunning) {
    addLog('success', 'Stress test completed!');
    showToast('✓ Stress test completed successfully', 'success');
  }
  
  isStressTestRunning = false;
  stressTestBtn.textContent = 'Stress Test';
  stressTestBtn.className = 'active';
  
  if (!isGenerating) {
    updateUIState(false);
  }
}

// ============================================================================
// AUTO-GENERATION
// ============================================================================

/**
 * Toggles automatic seed generation.
 * @param {Event} e - The change event from the toggle switch.
 */
function toggleAutoGen(e) {
  if (e.target.checked) {
    if (!rng || !rng.isCollecting) {
      addLog('error', 'Start collection first!');
      showToast('Start collection before enabling auto-generation', 'error');
      e.target.checked = false;
      return;
    }
    
    const intervalSeconds = parseInt(document.getElementById('autoGenInterval').value);
    const intervalMs = Math.max(1000, intervalSeconds * 1000);
    
    const autoGenFn = async () => {
      if (isGenerating) return; // Skip if another generation is running
      
      const progress = rng.getProgress();
      if (!progress.ready) {
        addLog('warning', `Auto-gen paused: insufficient weighted entropy (${progress.currentEvents}/500)`);
        return;
      }
      
      await generateSeed();
    };
    
    autoGenInterval = setInterval(autoGenFn, intervalMs);
    addLog('success', `Auto-generation enabled (${intervalMs/1000}s interval)`);
    showToast(`Auto-generation enabled (${intervalMs/1000}s)`, 'success');
  } else {
    if (autoGenInterval) {
      clearInterval(autoGenInterval);
      autoGenInterval = null;
    }
    addLog('info', 'Auto-generation disabled');
    showToast('Auto-generation disabled', 'info');
  }
}

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

/**
 * Centralized function to update the UI state based on whether an operation is in progress.
 * @param {boolean} isBusy - True if a critical operation is running.
 */
function updateUIState(isBusy) {
  const generateBtn = document.getElementById('generateBtn');
  const stressTestBtn = document.getElementById('stressTestBtn');
  const clearBtn = document.getElementById('clearBtn');

  if (isBusy) {
    generateBtn.disabled = true;
    generateBtn.innerHTML = 'Generating... <span class="spinner"></span>';
    stressTestBtn.disabled = true;
    clearBtn.disabled = true;
  } else {
    const isCollecting = rng && rng.isCollecting;
    generateBtn.disabled = !isCollecting;
    generateBtn.innerHTML = 'Generate Seed';
    stressTestBtn.disabled = !isCollecting;
    clearBtn.disabled = false;
  }
}

// ============================================================================
// TOOLTIP SYSTEM
// ============================================================================

let currentTooltip = null;
let tooltipTimeout = null;

const tooltips = {
  control: {
    title: 'Control Panel',
    content: '<p><strong>Start Collection:</strong> Begin gathering weighted entropy from user interactions. Events have different weights: keyboard (×3), mouse down/touch start/motion (×2), move/scroll (×1).</p><p><strong>Stop Collection:</strong> Halt entropy collection and disable generation.</p><p><strong>Generate Seed:</strong> Create a cryptographic seed using collected entropy. Requires 500 weighted events.</p><p><strong>Clear Entropy:</strong> Reset the entropy pool and event counters.</p><p><strong>Quick Presets:</strong> Apply predefined configurations for different security levels (iterations and salt size only).</p><p><strong>Stress Test:</strong> Run 10 consecutive seed generations to test performance.</p><p><strong>Auto-Generate:</strong> Automatically generate seeds at regular intervals.</p>'
  },
  config: {
    title: 'Configuration',
    content: '<p><strong>Iterations:</strong> Number of hash rounds (1000-20000). Higher values = more secure but slower.</p><p><strong>Salt Size:</strong> Random data length in bytes (16-128). Larger salt = better security.</p><p><strong>Note:</strong> Minimum events is hardcoded to 500 weighted events in ntrpRNG v1.3.0 for security.</p><p><strong>Performance Metrics:</strong> Last/Average generation time and total seeds created.</p>'
  },
  stats: {
    title: 'Live Statistics (Weighted)',
    content: '<p><strong>Weighted Event Counting:</strong> ntrpRNG v1.3.0 uses weighted event counting where different event types contribute different amounts to entropy:</p><p>• <strong>Keyboard:</strong> ×3 weight (highest entropy)</p><p>• <strong>Mouse down/Touch start/Device motion:</strong> ×2 weight</p><p>• <strong>Mouse move/Touch move/Scroll:</strong> ×1 weight</p><p><strong>Total Weighted:</strong> Sum of all weighted events. 500 required for seed generation.</p><p><strong>Pool Size:</strong> Number of entropy values stored.</p><p><strong>Timer Deltas:</strong> High-resolution timing measurements collected.</p>'
  },
  perf: {
    title: 'Performance Chart',
    content: '<p>Visual representation of seed generation times over the last 50 operations.</p><p>Blue line shows performance trends - lower values indicate faster generation.</p><p>Helps identify performance consistency and potential bottlenecks.</p><p>Generation time depends on iterations setting and device performance.</p>'
  },
  seed: {
    title: 'Generated Seed',
    content: '<p>Display area for the last generated cryptographic seed in two formats:</p><p><strong>Hex:</strong> Hexadecimal representation (128 characters for 512-bit output).</p><p><strong>Base64:</strong> Base64-encoded format for easier transmission.</p><p>Use Copy buttons to transfer seeds to clipboard.</p><p>Each seed requires 500 weighted events of entropy collection.</p>'
  },
  history: {
    title: 'Seed History',
    content: '<p>Log of the last 10 generated seeds with metadata:</p><p><strong>Time:</strong> When the seed was created.</p><p><strong>Preview:</strong> First 16 hex characters of the seed.</p><p><strong>Duration:</strong> Time taken to generate in milliseconds.</p><p><strong>Config:</strong> Parameters used (Iterations, Salt size). MinEvents is always 500 in v1.3.0.</p><p><strong>View:</strong> Display full seed in the output panel above.</p>'
  },
  log: {
    title: 'Event Log',
    content: '<p>Real-time activity feed showing system operations:</p><p><strong>[INFO]:</strong> General status updates and actions.</p><p><strong>[SUCCESS]:</strong> Successful operations and completions.</p><p><strong>[ERROR]:</strong> Failed operations or validation errors.</p><p><strong>[WARNING]:</strong> Important warnings or paused operations.</p><p>Export logs as JSON for debugging or analysis.</p><p>All entropy references use weighted event counting (v1.3.0).</p>'
  },
};

/**
 * Shows a tooltip for the given section.
 * @param {Event} event - The click event.
 * @param {string} type - The tooltip type key.
 */
function showTooltip(event, type) {
  event.stopPropagation();
  
  // Toggle: remove existing tooltip
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
    if (tooltipTimeout) clearTimeout(tooltipTimeout);
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

  // Auto-hide after 4 seconds
  tooltipTimeout = setTimeout(() => {
    if (currentTooltip) {
      currentTooltip.remove();
      currentTooltip = null;
    }
  }, 4000);
}

// ============================================================================
// THEME TOGGLE
// ============================================================================

/**
 * Toggles between dark and light themes.
 */
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
  updateThemeIcon(newTheme);
  localStorage.setItem('theme', newTheme);
  showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme activated`, 'info');
}

/**
 * Updates the theme toggle icon.
 * @param {string} theme - The current theme ('light' or 'dark').
 */
function updateThemeIcon(theme) {
  document.getElementById('themeIcon').textContent = theme === 'light' ? '☀️' : '🌙';
}

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================

// Initialize on page load
window.addEventListener('load', init);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (rng) rng.stopCollecting();
  if (statsInterval) clearInterval(statsInterval);
  if (autoGenInterval) clearInterval(autoGenInterval);
});
