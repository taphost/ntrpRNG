/**
 * ntrpRNG.js - Secure Seed Generator for Browser
 * 
 * Generates cryptographically secure seeds by collecting behavioral 
 * and temporal entropy from user interactions and system timers.
 * Uses only native Web Crypto API (SHA-256 and SHA-512).
 * 
 * @version 1.2.1
 * @license MIT
 * 
 * CHANGELOG:
 * v1.2.1 - Renamed library file from `NtrpRng.js` to `ntrpRNG.js` for naming consistency.
 *        - Updated main class name from `NtrpRng` → `ntrpRNG`.
 *          IEEE 754 floating-point representation artifacts
 */

class ntrpRNG {
  /**
   * Create a new seed generator instance
   * @param {Object} options - Configuration options
   * @param {number} options.iterations - Number of hash iterations (default: 5000)
   * @param {number} options.saltSize - Salt size in bytes (default: 32)
   * @param {boolean} options.autoCollect - Automatically start entropy collection (default: true)
   * @param {number} options.minEvents - Minimum events before seed generation (default: 0)
   */
  constructor(options = {}) {
    this.iterations = options.iterations || 5000;
    this.saltSize = options.saltSize || 32;
    this.autoCollect = options.autoCollect !== false;
    this.minEvents = options.minEvents || 0;
    
    // Pre-allocate arrays for better performance
    this.entropyPool = [];
    this.timerDeltas = [];
    this.lastTimestamp = performance.now();
    this.isCollecting = false;
    
    // Event counters
    this.eventCount = {
      mouse: 0,
      keyboard: 0,
      touch: 0,
      scroll: 0,
      other: 0
    };
    
    // Event handlers
    this.handlers = {
      mousemove: this._onMouseMove.bind(this),
      mousedown: this._onMouseDown.bind(this),
      keydown: this._onKeyDown.bind(this),
      touchstart: this._onTouchStart.bind(this),
      touchmove: this._onTouchMove.bind(this),
      scroll: this._onScroll.bind(this),
      devicemotion: this._onDeviceMotion.bind(this)
    };
    
    // Timer IDs
    this.timerId1 = null;
    this.timerId2 = null;
    this.rafId = null;
    
    if (this.autoCollect) {
      this.startCollecting();
    }
  }
  
  /**
   * Start collecting entropy from user events
   */
  startCollecting() {
    if (this.isCollecting) return;
    this.isCollecting = true;
    
    // Register event listeners
    document.addEventListener('mousemove', this.handlers.mousemove, { passive: true });
    document.addEventListener('mousedown', this.handlers.mousedown, { passive: true });
    document.addEventListener('keydown', this.handlers.keydown, { passive: true });
    document.addEventListener('touchstart', this.handlers.touchstart, { passive: true });
    document.addEventListener('touchmove', this.handlers.touchmove, { passive: true });
    window.addEventListener('scroll', this.handlers.scroll, { passive: true });
    
    // DeviceMotion only if available
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', this.handlers.devicemotion, { passive: true });
    }
    
    // Asynchronous timers for micro-jitter
    this._startTimerJitter();
  }
  
  /**
   * Stop entropy collection
   */
  stopCollecting() {
    if (!this.isCollecting) return;
    this.isCollecting = false;
    
    document.removeEventListener('mousemove', this.handlers.mousemove);
    document.removeEventListener('mousedown', this.handlers.mousedown);
    document.removeEventListener('keydown', this.handlers.keydown);
    document.removeEventListener('touchstart', this.handlers.touchstart);
    document.removeEventListener('touchmove', this.handlers.touchmove);
    window.removeEventListener('scroll', this.handlers.scroll);
    
    if (window.DeviceMotionEvent) {
      window.removeEventListener('devicemotion', this.handlers.devicemotion);
    }
    
    this._stopTimerJitter();
  }
  
  /**
   * Start asynchronous timers to collect micro-jitter
   * @private
   */
  _startTimerJitter() {
    // RequestAnimationFrame for high-frequency jitter
    const rafCollect = () => {
      if (!this.isCollecting) return;
      this._collectTimerDelta();
      this.rafId = requestAnimationFrame(rafCollect);
    };
    this.rafId = requestAnimationFrame(rafCollect);
    
    // Interval for medium-frequency jitter
    this.timerId1 = setInterval(() => {
      if (this.isCollecting) {
        this._collectTimerDelta();
      }
    }, 100);
    
    // Recursive timeout for variable jitter
    const recursiveTimeout = () => {
      if (!this.isCollecting) return;
      this._collectTimerDelta();
      this.timerId2 = setTimeout(recursiveTimeout, 50 + Math.random() * 50);
    };
    this.timerId2 = setTimeout(recursiveTimeout, 50);
  }
  
  /**
   * Stop asynchronous timers
   * @private
   */
  _stopTimerJitter() {
    if (this.timerId1) {
      clearInterval(this.timerId1);
      this.timerId1 = null;
    }
    if (this.timerId2) {
      clearTimeout(this.timerId2);
      this.timerId2 = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  /**
   * Collect time delta between successive reads
   * @private
   */
  _collectTimerDelta() {
    const now = performance.now();
    const delta = now - this.lastTimestamp;
    this.lastTimestamp = now;
    const dateNow = Date.now();
    
    this.timerDeltas.push(delta, dateNow);
    
    // Limit array size
    if (this.timerDeltas.length > 1000) {
      this.timerDeltas = this.timerDeltas.slice(-500);
    }
  }
  
  /**
   * Handler for mousemove event
   * @private
   */
  _onMouseMove(e) {
    this._addEntropy([
      performance.now(),
      e.clientX,
      e.clientY,
      e.movementX || 0,
      e.movementY || 0,
      e.screenX,
      e.screenY
    ]);
    this.eventCount.mouse++;
  }
  
  /**
   * Handler for mousedown event
   * @private
   */
  _onMouseDown(e) {
    this._addEntropy([
      performance.now(),
      e.clientX,
      e.clientY,
      e.button,
      e.buttons
    ]);
    this.eventCount.mouse++;
  }
  
  /**
   * Handler for keydown event
   * @private
   */
  _onKeyDown(e) {
    this._addEntropy([
      performance.now(),
      e.keyCode,
      e.which,
      e.repeat ? 1 : 0
    ]);
    this.eventCount.keyboard++;
  }
  
  /**
   * Handler for touchstart event
   * @private
   */
  _onTouchStart(e) {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this._addEntropy([
        performance.now(),
        touch.clientX,
        touch.clientY,
        touch.force || 0,
        touch.radiusX || 0,
        touch.radiusY || 0
      ]);
    }
    this.eventCount.touch++;
  }
  
  /**
   * Handler for touchmove event
   * @private
   */
  _onTouchMove(e) {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this._addEntropy([
        performance.now(),
        touch.clientX,
        touch.clientY
      ]);
    }
    this.eventCount.touch++;
  }
  
  /**
   * Handler for scroll event
   * @private
   */
  _onScroll() {
    this._addEntropy([
      performance.now(),
      window.scrollX,
      window.scrollY,
      window.innerWidth,
      window.innerHeight
    ]);
    this.eventCount.scroll++;
  }
  
  /**
   * Handler for devicemotion event
   * @private
   */
  _onDeviceMotion(e) {
    if (e.accelerationIncludingGravity) {
      this._addEntropy([
        performance.now(),
        e.accelerationIncludingGravity.x || 0,
        e.accelerationIncludingGravity.y || 0,
        e.accelerationIncludingGravity.z || 0,
        e.rotationRate ? e.rotationRate.alpha || 0 : 0,
        e.rotationRate ? e.rotationRate.beta || 0 : 0,
        e.rotationRate ? e.rotationRate.gamma || 0 : 0
      ]);
      this.eventCount.other++;
    }
  }
  
  /**
   * Add values to entropy pool
   * @private
   * @param {Array<number>} values - Array of numeric values
   */
  _addEntropy(values) {
    // Direct push instead of spread for performance
    for (let i = 0; i < values.length; i++) {
      this.entropyPool.push(values[i]);
    }
    
    // Limit pool size
    if (this.entropyPool.length > 5000) {
      this.entropyPool = this.entropyPool.slice(-2500);
    }
  }
  
  /**
   * Generate random salt using crypto.getRandomValues
   * @returns {Uint8Array} Random salt
   */
  generateSalt() {
    const salt = new Uint8Array(this.saltSize);
    crypto.getRandomValues(salt);
    return salt;
  }
  
  /**
   * Serialize float array to bytes using DataView (big-endian)
   * @private
   * @param {Array<number>} floatArray - Array of floats
   * @returns {Uint8Array} Serialized bytes
   */
  _serializeFloats(floatArray) {
    const buffer = new ArrayBuffer(floatArray.length * 8);
    const view = new DataView(buffer);
    
    for (let i = 0; i < floatArray.length; i++) {
      view.setFloat64(i * 8, floatArray[i], false); // false = big-endian
    }
    
    return new Uint8Array(buffer);
  }
  
  /**
   * Combine behavioral entropy, timers, and salt
   * Pre-hashes entropy pools to avoid IEEE 754 pattern repetition artifacts
   * @param {Uint8Array} salt - Salt to include
   * @returns {Promise<Uint8Array>} Combined input
   */
  async combineEntropy(salt) {
    // Serialize entropy pools to deterministic byte representations
    // Using DataView with big-endian Float64 to ensure consistent serialization
    const entropyBytes = this._serializeFloats(this.entropyPool);
    const timerBytes = this._serializeFloats(this.timerDeltas);
    
    // Pre-hash each entropy source with SHA-256 to eliminate floating-point
    // representation patterns that could reduce entropy quality
    const entropyHashBuffer = await crypto.subtle.digest('SHA-256', entropyBytes);
    const entropyHash = new Uint8Array(entropyHashBuffer);
    
    const timerHashBuffer = await crypto.subtle.digest('SHA-256', timerBytes);
    const timerHash = new Uint8Array(timerHashBuffer);
    
    // Combine both 32-byte digests with salt (64 + saltSize bytes total)
    const totalLength = entropyHash.length + timerHash.length + salt.length;
    const combined = new Uint8Array(totalLength);
    
    let offset = 0;
    combined.set(entropyHash, offset);
    offset += entropyHash.length;
    combined.set(timerHash, offset);
    offset += timerHash.length;
    combined.set(salt, offset);
    
    return combined;
  }
  
  /**
   * Perform iterative hashing using Web Crypto API
   * @private
   * @param {Uint8Array} data - Data to hash
   * @param {string} algorithm - Algorithm ('SHA-256' or 'SHA-512')
   * @param {number} iterations - Number of iterations
   * @returns {Promise<Uint8Array>} Resulting hash
   */
  async _iterativeHash(data, algorithm, iterations) {
    let hash = data;
    
    for (let i = 0; i < iterations; i++) {
      const hashBuffer = await crypto.subtle.digest(algorithm, hash);
      hash = new Uint8Array(hashBuffer);
    }
    
    return hash;
  }
  
  /**
   * Perform XOR between two Uint8Arrays (truncates to shorter length)
   * @private
   * @param {Uint8Array} a - First array
   * @param {Uint8Array} b - Second array
   * @returns {Uint8Array} XOR result
   */
  _xorArrays(a, b) {
    const minLength = Math.min(a.length, b.length);
    const result = new Uint8Array(minLength);
    
    for (let i = 0; i < minLength; i++) {
      result[i] = a[i] ^ b[i];
    }
    
    return result;
  }
  
  /**
   * Truncate SHA-512 to 32 bytes for symmetry with SHA-256
   * @private
   * @param {Uint8Array} hash512 - SHA-512 hash (64 bytes)
   * @returns {Uint8Array} Truncated hash (32 bytes)
   */
  _truncate512(hash512) {
    return hash512.slice(0, 32);
  }
  
  /**
   * Verify sufficient entropy has been collected
   * @returns {boolean} True if entropy is sufficient
   */
  hasMinimumEntropy() {
    const totalEvents = Object.values(this.eventCount).reduce((a, b) => a + b, 0);
    return totalEvents >= this.minEvents && 
           this.entropyPool.length > 0 && 
           this.timerDeltas.length > 0;
  }
  
  /**
   * Generate cryptographically secure seed
   * @param {boolean} skipValidation - Skip minimum entropy validation (default: false)
   * @returns {Promise<Uint8Array>} Final seed
   * @throws {Error} If entropy is insufficient and skipValidation is false
   */
  async generateSeed(skipValidation = false) {
    // Validate entropy
    if (!skipValidation && !this.hasMinimumEntropy()) {
      const stats = this.getStats();
      throw new Error(
        `Insufficient entropy. Events: ${stats.totalEvents}/${this.minEvents}, ` +
        `Pool: ${this.entropyPool.length}, Timer: ${this.timerDeltas.length}`
      );
    }
    
    // 1. Generate salt
    const salt = this.generateSalt();
    
    // 2. Combine entropy (now with pre-hashing)
    const combined = await this.combineEntropy(salt);
    
    // 3. Pre-hash with SHA-256
    const preHashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const preHash = new Uint8Array(preHashBuffer);
    
    // 4. Iterative SHA-256 hash
    const hash256 = await this._iterativeHash(preHash, 'SHA-256', this.iterations);
    
    // 5. Iterative SHA-512 hash (truncated to 32 bytes)
    const hash512Full = await this._iterativeHash(preHash, 'SHA-512', this.iterations);
    const hash512 = this._truncate512(hash512Full);
    
    // 6. XOR of both hashes (now both 32 bytes)
    const xorResult = this._xorArrays(hash256, hash512);
    
    // 7. Final hash combining XOR with original hashes
    const finalInputLength = xorResult.length + hash256.length + hash512.length;
    const finalInput = new Uint8Array(finalInputLength);
    
    let offset = 0;
    finalInput.set(xorResult, offset);
    offset += xorResult.length;
    finalInput.set(hash256, offset);
    offset += hash256.length;
    finalInput.set(hash512, offset);
    
    // Final hash with SHA-512 for longer output
    const finalHashBuffer = await crypto.subtle.digest('SHA-512', finalInput);
    const finalSeed = new Uint8Array(finalHashBuffer);
    
    return finalSeed;
  }
  
  /**
   * Convert Uint8Array to hexadecimal string
   * @param {Uint8Array} bytes - Byte array
   * @returns {string} Hexadecimal string
   */
  toHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  /**
   * Convert Uint8Array to Base64 string
   * @param {Uint8Array} bytes - Byte array
   * @returns {string} Base64 string
   */
  toBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
  }
  
  /**
   * Generate seed and return in hexadecimal format
   * @param {boolean} skipValidation - Skip minimum entropy validation
   * @returns {Promise<string>} Seed in hex format
   */
  async generateSeedHex(skipValidation = false) {
    const seed = await this.generateSeed(skipValidation);
    return this.toHex(seed);
  }
  
  /**
   * Generate seed and return in Base64 format
   * @param {boolean} skipValidation - Skip minimum entropy validation
   * @returns {Promise<string>} Seed in Base64 format
   */
  async generateSeedBase64(skipValidation = false) {
    const seed = await this.generateSeed(skipValidation);
    return this.toBase64(seed);
  }
  
  /**
   * Get statistics about entropy collection
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      entropyPoolSize: this.entropyPool.length,
      timerDeltasSize: this.timerDeltas.length,
      isCollecting: this.isCollecting,
      eventCount: { ...this.eventCount },
      totalEvents: Object.values(this.eventCount).reduce((a, b) => a + b, 0),
      minEvents: this.minEvents,
      hasMinimumEntropy: this.hasMinimumEntropy()
    };
  }
  
  /**
   * Clear entropy pool
   */
  clearEntropy() {
    this.entropyPool = [];
    this.timerDeltas = [];
    this.eventCount = {
      mouse: 0,
      keyboard: 0,
      touch: 0,
      scroll: 0,
      other: 0
    };
  }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ntrpRNG;
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.ntrpRng = ntrpRNG;
}