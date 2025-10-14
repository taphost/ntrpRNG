# ntrpRNG Test Bench

## Overview
This is a web-based dashboard for testing and demonstrating the ntrpRNG entropy-based random number generator. 
It collects entropy from user interactions (mouse, keyboard, touch, scroll) and timing jitter to generate secure 
cryptographic seeds. Features include configurable parameters, live stats, performance charts, seed history, and 
logging.

## Usage

- **Open** `testbench.html` in a modern web browser (e.g., Chrome, Firefox). No server is needed; it runs locally.
- **Start Collection:** Click "Start Collection" to begin gathering entropy. Interact with the page (move mouse, type, scroll) 
  to build the entropy pool.
- **Configuration:** Adjust sliders for Iterations (hash rounds), Salt Size (bytes), and Min Events (required interactions).
  Use presets like "Quick," "Standard," or "Secure" for quick setups.
- **Generate Seed:** Once enough entropy is collected (progress bar reaches 100%), click "Generate Seed" to create a 512-bit 
  seed in Hex and Base64 formats. Copy them via the buttons.
- **Auto-Generate:** Toggle "Auto-Generate" and set an interval (1-10 seconds) to produce seeds automatically.
- **Stress Test:** Click "Stress Test" to run 10 consecutive generations (cancelable).
- **Monitoring:** View live stats, performance chart, seed history (last 10 seeds with view/export options), and event log (clear/export as JSON).
- **Stop/Clear:** Use "Stop Collection" to pause, or "Clear Entropy" to reset.

## File Structure
   - `testbench.html` (the main HTML file)
   - `dashboard.js` (the dashboard logic)
   - `ntrpRNG.js` (the core ntrpRNG library) is required actullay linked from src folder


## Notes
- This tool is for testing purposes; ensure `ntrpRNG.js` is properly implemented for secure use.
- No internet required—everything runs client-side.

- For questions, refer to the tooltips (?) in the dashboard for section-specific help.


