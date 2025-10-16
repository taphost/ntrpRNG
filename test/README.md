# RNG Comparison Test Suite

Interactive web-based testing suite for comparing **ntrpRNG** (behavioral entropy) vs **cgRNDV** (pure crypto) random number generators.

## 🎯 Features

- **Side-by-side comparison** of both RNG implementations
- **6 statistical tests**: Shannon Entropy, Monobit, Runs, Chi-Square, Serial Correlation, Avalanche Effect
- **Real-time entropy collection** monitoring for ntrpRNG
- **Three test modes**: ntrpRNG only, cgRNDV only, or compare both
- **Quick presets**: FAST, BALANCED, SECURE configurations
- **Visual quality indicators**: color-coded results (Excellent/Good/Fair/Poor)
- **Responsive design**: works on desktop and mobile

## 📋 Requirements

- Modern web browser with ES6+ support
- `ntrpRNG.js` - Behavioral entropy RNG
- `cgRNDV.js` - Pure crypto RNG
- `ntrpRNGDev.js` v1.4.0+ - Testing suite library

## 🚀 Quick Start

1. **Download files:**
   ```
   rng_comparison_test.html
   ntrpRNG.js
   cgRNDV.js
   ntrpRNGDev.js
   ```

2. **Open in browser:**
   ```
   Open rng_comparison_test.html in your browser
   ```

3. **Run test:**
   - Select test mode (ntrpRNG/cgRNDV/Both)
   - Choose preset (FAST/BALANCED/SECURE)
   - Click "Start Test"
   - For ntrpRNG: move mouse to collect entropy

## 🎮 Test Modes

### 🎯 ntrpRNG Only
Tests behavioral entropy collection with:
- User interaction entropy
- Timer-based jitter
- Iterative hashing (configurable)
- Salt generation (configurable)

### 🎲 cgRNDV Only
Tests pure crypto baseline with:
- `crypto.getRandomValues()` only
- No behavioral entropy
- No salt or iterations (compatibility mode)

### ⚔️ Compare Both
Side-by-side comparison showing:
- All 6 statistical tests
- Winner indicators (🏆)
- Overall score (X/6)
- Performance metrics

## ⚙️ Configuration

### Quick Presets

| Preset | Iterations | Salt Size | Collection | Use Case |
|--------|-----------|-----------|------------|----------|
| **⚡ FAST** | 1,000 | 32 bytes | 1s | Development/Testing |
| **⚖️ BALANCED** | 5,000 | 32 bytes | 3s | Recommended |
| **🔒 SECURE** | 10,000 | 64 bytes | 5s | Production |

### Custom Parameters

- **Dataset Size**: 1 KB - 10 MB (10,240 KB)
- **Hash Iterations**: 100 - 50,000
- **Salt Size**: 16 - 128 bytes

## 📊 Statistical Tests

### 1. Shannon Entropy
**Measures:** Information density  
**Ideal:** 7.9-8.0 bits/byte  
**Scale:** Excellent (7.9-8.0) | Good (7.5-7.9) | Fair (7.0-7.5) | Poor (<7.0)

### 2. Monobit Test
**Measures:** Balance between 0s and 1s  
**Ideal:** < 2.0 (closer to 0)  
**Scale:** Excellent (0-1.0) | Good (1.0-2.0) | Fair (2.0-3.0) | Poor (>3.0)

### 3. Runs Test
**Measures:** Bit oscillation patterns  
**Ideal:** < 2.0 (lower is better)  
**Scale:** Excellent (0-1.0) | Good (1.0-2.0) | Fair (2.0-3.0) | Poor (>3.0)

### 4. Chi-Square Test
**Measures:** Byte distribution uniformity  
**Ideal:** < 293.25 (95% confidence threshold)  
**Scale:** Excellent (<250) | Good (250-293) | Fair (293-350) | Poor (>350)

### 5. Serial Correlation Test
**Measures:** Bit sequence independence  
**Ideal:** < 0.1 (closer to 0)  
**Scale:** Excellent (<0.05) | Good (0.05-0.1) | Fair (0.1-0.2) | Poor (>0.2)

### 6. Avalanche Effect Test
**Measures:** Bit-flip propagation  
**Ideal:** ~50% (half the bits change)  
**Scale:** Excellent (45-55%) | Good (40-60%) | Fair (35-65%) | Poor (else)

## 🎨 UI Elements

### Entropy Collector (ntrpRNG only)
- **Progress bar**: Visual pool fill indicator
- **Event counter**: Current/Target (0-5000)
- **Collection rate**: Events per second
- **ETA**: Estimated time to completion
- **Status messages**: Real-time feedback

### Results Display
- **Color-coded values**: Green (good), Orange (fair), Red (poor)
- **Quality labels**: Text indicators for each metric
- **Winner badges**: 🏆 for best score in comparison mode
- **Overall score**: X/6 wins shown in header

## 🔬 Usage Examples

### Development Testing
```
Mode: cgRNDV Only
Preset: FAST (1K iterations)
Dataset: 64 KB
Time: ~5-10 seconds
```

### Standard Validation
```
Mode: Compare Both
Preset: BALANCED (5K iterations)
Dataset: 64 KB
Time: ~30-60 seconds
```

### Production Verification
```
Mode: ntrpRNG Only
Preset: SECURE (10K iterations)
Dataset: 512 KB
Time: ~2-5 minutes
```

### Stress Testing
```
Mode: Compare Both
Preset: SECURE (10K iterations)
Dataset: 1024 KB (1 MB)
Time: ~5-10 minutes
```

## 💡 Tips

### For Best Results (ntrpRNG)
1. **Move mouse actively** during entropy collection
2. **Cover full screen area** for better distribution
3. **Vary movement patterns** (circles, zigzags, random)
4. **Wait for 5000 events** before test starts
5. **Avoid interruptions** during collection

### Performance Notes
- **cgRNDV** is faster (no entropy collection)
- **Large datasets** (>1MB) may take several minutes
- **Higher iterations** improve security but slow generation
- **Browser tab must stay active** during testing

## 📱 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ Internet Explorer (not supported)

## 🐛 Troubleshooting

### Entropy not collecting (ntrpRNG)
- **Issue**: Event counter stuck at 0
- **Fix**: Move mouse actively over page

### Low Shannon entropy
- **Issue**: Values < 7.5
- **Fix**: Increase dataset size or iterations

### High Chi-Square values
- **Issue**: Values > 293.25
- **Fix**: Check entropy quality, increase dataset

### Poor avalanche effect
- **Issue**: Not close to 50%
- **Fix**: Increase iterations, check hash function

### Test hangs
- **Issue**: Progress bar stuck
- **Fix**: Refresh page, reduce dataset size

## 📄 Output Interpretation

### Single Mode Results
- Individual test scores
- Quality rating for each metric
- Dataset size and duration
- Seed count used

### Comparison Mode Results
- Side-by-side scores
- Winner indicators per test
- Overall winner (X/6 score)
- Duration for each RNG

## 🔒 Security Notes

- **ntrpRNG**: Enhanced with behavioral entropy mixing
- **cgRNDV**: Baseline `crypto.getRandomValues()` wrapper
- **Both**: Suitable for cryptographic applications
- **Test data**: Not saved, runs entirely in browser

## 📚 Related Documentation

- `ntrprngdev_api_140.md` - Full API documentation
- `ntrpRNG.js` - Behavioral RNG implementation
- `cgRNDV.js` - Pure crypto RNG wrapper
- `ntrpRNGDev.js` - Testing suite library

## 🏆 Typical Results

### ntrpRNG (BALANCED preset, 64KB)
- Shannon: 7.99-8.00
- Chi-Square: 240-270
- Serial Corr: 0.03-0.07
- Avalanche: 48-52%

### cgRNDV (BALANCED preset, 64KB)
- Shannon: 7.99-8.00
- Chi-Square: 235-265
- Serial Corr: 0.02-0.06
- Avalanche: 49-51%

**Note:** Both implementations typically score "Excellent" on all tests.

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Verify all dependencies are loaded
3. Test with smaller dataset first
4. Review browser console for errors

## 📜 License

MIT License - See individual library files for details

---