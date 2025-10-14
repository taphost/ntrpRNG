/**
 * cgRNDV.js - Lightweight baseline RNG wrapper based on crypto.getRandomValues()
 * 
 * Provides a compatible API with ntrpRNG.js for comparison purposes.
 * Uses only crypto.getRandomValues() as the entropy source, without
 * behavioral entropy collection or iterative hashing.
 * 
 * @version 1.0.0
 * @license MIT
 */

class cgRNDV {
  /**
   * Create a new RNG instance
   * @param {Object} options - Configuration options (maintained for API compatibility)
   * @param {number} options.iterations - Ignored (maintained for compatibility)
   * @param {number} options.saltSize - Salt size in bytes (default: 32)
   * @param {boolean} options.autoCollect - Ignored (maintained for compatibility)
   * @param {number} options.minEvents - Ignored (maintained for compatibility)
   */
  constructor(options = {}) {
    this.iterations = options.iterations || 5000; // Stored but not used
    this.saltSize = options.saltSize || 32;
    this.autoCollect = options.autoCollect !== false;
    this.minEvents = options.minEvents || 0;
    
    // Dummy state for API compatibility
    this.isCollecting = false;
    this.entropyPool = [];
    this.timerDeltas = [];
    
    // Event counters (always zero)
    this.eventCount = {
      mouse: 0,
      keyboard: 0,
      touch: 0,
      scroll: 0,
      other: 0
    };
    
    // Auto-collect does nothing but sets flag for compatibility
    if (this.autoCollect) {
      this.startCollecting();
    }
  }
  
  /**
   * Start collecting entropy (no-op for compatibility)
   */
  startCollecting() {
    this.isCollecting = true;
  }
  
  /**
   * Stop entropy collection (no-op for compatibility)
   */
  stopCollecting() {
    this.isCollecting = false;
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
   * Combine entropy (simplified - just returns random bytes)
   * @param {Uint8Array} salt - Salt to include
   * @returns {Promise<Uint8Array>} Combined input
   */
  async combineEntropy(salt) {
    // For compatibility, return salt directly
    return salt;
  }
  
  /**
   * Verify sufficient entropy (always true for crypto.getRandomValues)
   * @returns {boolean} Always true
   */
  hasMinimumEntropy() {
    return true;
  }
  
  /**
   * Generate cryptographically secure seed using crypto.getRandomValues
   * @param {boolean} skipValidation - Ignored (always sufficient entropy)
   * @returns {Promise<Uint8Array>} Final seed (64 bytes to match SHA-512 output)
   */
  async generateSeed(skipValidation = false) {
    // Generate 64 bytes to match ntrpRNG's SHA-512 final output
    const seed = new Uint8Array(64);
    crypto.getRandomValues(seed);
    return seed;
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
   * @param {boolean} skipValidation - Ignored
   * @returns {Promise<string>} Seed in hex format
   */
  async generateSeedHex(skipValidation = false) {
    const seed = await this.generateSeed(skipValidation);
    return this.toHex(seed);
  }
  
  /**
   * Generate seed and return in Base64 format
   * @param {boolean} skipValidation - Ignored
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
      entropyPoolSize: 0,
      timerDeltasSize: 0,
      isCollecting: this.isCollecting,
      eventCount: { ...this.eventCount },
      totalEvents: 0,
      minEvents: this.minEvents,
      hasMinimumEntropy: true
    };
  }
  
  /**
   * Clear entropy pool (no-op for compatibility)
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
  module.exports = cgRNDV;
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.cgRNDV = cgRNDV;
}