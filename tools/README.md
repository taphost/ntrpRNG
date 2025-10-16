# ntrpRNG Test Bench

## Overview
Web-based dashboard for testing and demonstrating the ntrpRNG entropy-based random number generator. 
Collects weighted entropy from user interactions (keyboard, mouse, touch, scroll, device motion) and 
timing jitter to generate secure cryptographic seeds. Features configurable parameters, live stats, 
performance charts, seed history, and comprehensive logging.

## Requirements
- **ntrpRNG v1.3.0+** (core library)
- Modern web browser with Web Crypto API support (Chrome, Firefox, Safari, Edge)

## Setup
1. Download the following files into a single folder:
   - `testbench.html` (main HTML interface)
   - `dashboard.js` (dashboard logic)
   - `ntrpRNG.js` (core library v1.3.0+)
2. Open `testbench.html` in your browser. No server required—runs entirely client-side.

## Weighted Event System
ntrpRNG v1.3.0 uses weighted event counting where different interactions contribute different entropy levels:
- **Keyboard events:** ×3 weight (highest entropy from timing + key choice)
- **Mouse down / Touch start / Device motion:** ×2 weight
- **Mouse move / Touch move / Scroll:** ×1 weight

**Minimum requirement:** 500 weighted events (hardcoded for security, non-configurable)

## Usage

### Basic Workflow
1. **Start Collection:** Click "Start Collection" to begin entropy gathering. Interact with the page 
   (type, move mouse, scroll, touch) to accumulate weighted events.
2. **Monitor Progress:** Watch the progress bar fill to 100% (500 weighted events). Status indicator 
   shows current weighted count.
3. **Generate Seed:** Click "Generate Seed" to create a 512-bit cryptographic seed (displayed as 
   Hex and Base64). Copy using provided buttons.

### Configuration
- **Iterations:** Hash rounds (1000-20000). Higher = more secure but slower. Default: 5000
- **Salt Size:** Random data length in bytes (16-128). Larger = better security. Default: 32
- **Note:** Minimum events fixed at 500 weighted events in v1.3.0

### Quick Presets
- **Quick:** 1000 iterations, 32-byte salt (fast testing)
- **Standard:** 5000 iterations, 32-byte salt (balanced)
- **Secure:** 10000 iterations, 64-byte salt (maximum security)

### Advanced Features
- **Auto-Generate:** Toggle on with interval (1-10 seconds) for automatic seed generation
- **Stress Test:** Run 10 consecutive generations (click again to cancel)
- **Seed History:** View last 10 seeds with metadata. Click "View" to display full seed, 
  export to CSV, or check uniqueness
- **Event Log:** Real-time activity feed with clear/export options (JSON format)
- **Performance Chart:** Visual tracking of last 50 generation times

### Controls
- **Stop Collection:** Pause entropy gathering
- **Clear Entropy:** Reset pool and event counters
- **Theme Toggle:** Switch between dark/light modes (top-right)

## Live Statistics
Dashboard displays real-time weighted event counts:
- Individual event type counters (with weight multipliers shown)
- Total weighted events (progress toward 500 requirement)
- Entropy pool size and timer delta measurements
- Generation performance metrics (last/average duration, total seeds)

## Security Notes
- Requires 500 weighted events (~5-10 seconds of varied user interaction)
- Dual-path fortification: behavioral entropy XOR CSPRNG output
- 5000 default iterations provide timing attack resistance
- Output: 512-bit seed suitable for cryptographic key derivation
- For testing/demonstration purposes—review ntrpRNG.js implementation for production use

## Tooltips
Click "?" buttons throughout the interface for context-specific help on each section.

## Browser Compatibility
Tested on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. Requires:
- Web Crypto API (`crypto.subtle`, `crypto.getRandomValues`)
- Performance API (`performance.now()`)
- ES6+ JavaScript support

## Troubleshooting
- **Progress stuck:** Ensure active interaction (keyboard typing is most efficient)
- **Generation fails:** Check browser console for errors; verify ntrpRNG.js version
- **Performance issues:** Reduce iterations or increase auto-gen interval
- **Theme persistence:** Uses localStorage; clear browser data if issues occur

## File Structure
```
/testbench/
  ├── testbench.html    (UI and styling)
  ├── dashboard.js      (logic and event handling)
  └── ntrpRNG.js        (core entropy collection library)
```

No internet connection required—all processing happens locally in the browser.
