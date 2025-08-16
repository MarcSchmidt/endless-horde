# Deployment Guide - Endless Horde

This document provides comprehensive instructions for deploying Endless Horde to various platforms.

## 🚀 Quick Deployment

### GitHub Pages (Recommended)

The project is configured for automatic deployment to GitHub Pages:

1. **Push to main branch** - Deployment happens automatically
2. **GitHub Actions** builds and deploys the game
3. **Live URL** will be available at `https://yourusername.github.io/endless-horde`

#### Automatic Deployment Process

```yaml
# .github/workflows/deploy.yml handles:
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (npm ci)
4. Build project (npm run build)
5. Commit and push built files to docs/ folder
```

### Manual Deployment

For other hosting platforms:

```bash
# 1. Build the project
npm run build

# 2. Deploy the docs/ folder contents to your web server
# The built files will be in the docs/ directory
```

## 🔧 Build Configuration

### Vite Configuration

The project uses Vite for building with the following optimizations:

```typescript
// vite.config.ts
export default defineConfig({
  base: './',  // Relative paths for GitHub Pages
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  }
})
```

### Build Output

After running `npm run build`, you'll get:

```
docs/
├── index.html          # Main HTML file
├── assets/
│   ├── index-[hash].js # Bundled JavaScript
└── vite.svg           # Game icon
```

## 🌐 Platform-Specific Deployment

### GitHub Pages

**Automatic Setup:**
1. Fork/clone the repository
2. Enable GitHub Pages in repository settings
3. Set source to "Deploy from a branch" → "main" → "/docs"
4. Push changes to main branch

**Manual Setup:**
```bash
# Build locally
npm run build

# The built files are automatically in docs/ folder
git add docs/
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Netlify

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `docs`
3. **Deploy**: Netlify will automatically build and deploy

### Vercel

1. **Import Project**: Import from GitHub repository
2. **Framework Preset**: Vite
3. **Build Settings**: Auto-detected
4. **Deploy**: Automatic deployment on push

### Static Web Hosting

For any static hosting service:

```bash
# Build the project
npm run build

# Upload docs/ folder contents to your web server
# Ensure index.html is served for the root path
```

## 📋 Pre-Deployment Checklist

### Build Verification

- [ ] **Clean Build**: `npm run build` completes without errors
- [ ] **File Sizes**: JavaScript bundle < 50KB gzipped
- [ ] **Asset Loading**: All assets load correctly
- [ ] **No Console Errors**: Clean browser console

### Functionality Testing

- [ ] **Game Loads**: Canvas initializes properly
- [ ] **Walker Spawning**: 40+ walkers appear and move
- [ ] **Zombie Spawning**: Click/tap spawns zombies
- [ ] **Combat System**: Zombies defeat walkers and award souls
- [ ] **Upgrade System**: Upgrades can be purchased and applied
- [ ] **Area Progression**: Areas unlock at correct thresholds
- [ ] **Save/Load**: Progress persists between sessions
- [ ] **Mobile UI**: Touch controls work on mobile devices

### Performance Validation

- [ ] **Desktop FPS**: 60+ FPS with 40+ entities
- [ ] **Mobile FPS**: 30+ FPS with 20+ entities
- [ ] **Memory Usage**: <50MB during gameplay
- [ ] **Load Time**: <3 seconds on modern browsers

### Cross-Browser Testing

- [ ] **Chrome**: Full functionality
- [ ] **Firefox**: Full functionality
- [ ] **Safari**: Full functionality
- [ ] **Edge**: Full functionality
- [ ] **Mobile Chrome**: Touch controls work
- [ ] **Mobile Safari**: iOS compatibility

## 🔍 Deployment Troubleshooting

### Common Issues

#### 1. Assets Not Loading (404 Errors)

**Problem**: CSS/JS files return 404 errors
**Solution**: Check base path configuration

```typescript
// vite.config.ts
export default defineConfig({
  base: './',  // Use relative paths
  // or for subdirectory deployment:
  base: '/your-subdirectory/'
})
```

#### 2. GitHub Pages Not Updating

**Problem**: Changes don't appear on live site
**Solutions**:
- Check GitHub Actions tab for build status
- Verify GitHub Pages source settings
- Clear browser cache
- Wait 5-10 minutes for CDN propagation

#### 3. Mobile Touch Issues

**Problem**: Touch controls not working on mobile
**Solutions**:
- Verify viewport meta tag is present
- Check touch-action CSS properties
- Test on actual mobile devices, not just browser dev tools

#### 4. Performance Issues

**Problem**: Low FPS or stuttering
**Solutions**:
- Enable performance monitoring in browser dev tools
- Check for memory leaks
- Verify entity culling is working
- Test on target hardware specifications

### Debug Mode

To enable debug information:

```typescript
// In main.ts, enable FPS counter and debug info
private drawFPS(): void {
  // FPS counter is always visible in debug builds
  // Add additional debug information here
}
```

## 📊 Deployment Metrics

### Build Performance

- **Build Time**: ~2-5 seconds
- **Bundle Size**: ~33KB (minified)
- **Gzipped Size**: ~8KB
- **Asset Count**: 3 files (HTML, JS, SVG)

### Runtime Performance

- **Initial Load**: <3 seconds
- **Memory Usage**: 20-50MB
- **CPU Usage**: <10% on modern devices
- **Network Usage**: One-time download only

## 🔒 Security Considerations

### Content Security Policy

For enhanced security, consider adding CSP headers:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### HTTPS Deployment

- **GitHub Pages**: Automatic HTTPS
- **Custom Domain**: Ensure SSL certificate is configured
- **Mixed Content**: All assets should be served over HTTPS

## 🚀 Production Optimization

### Performance Optimizations

1. **Asset Compression**: Gzip/Brotli compression enabled
2. **Caching Headers**: Set appropriate cache headers
3. **CDN**: Consider using a CDN for global distribution
4. **Monitoring**: Set up performance monitoring

### SEO and Metadata

The game includes proper metadata:

```html
<meta name="description" content="Endless Horde - A browser-based idle survival game">
<meta name="theme-color" content="#1a1a1a">
<meta property="og:title" content="Endless Horde">
<meta property="og:description" content="Command zombies to defeat walkers in this idle survival game">
```

## 📈 Monitoring and Analytics

### Performance Monitoring

Consider adding:
- Google Analytics for usage tracking
- Performance monitoring (Web Vitals)
- Error tracking (Sentry, LogRocket)

### User Feedback

- GitHub Issues for bug reports
- Analytics for user behavior
- Performance metrics collection

## 🎯 Post-Deployment

### Verification Steps

1. **Smoke Test**: Basic functionality works
2. **Performance Test**: Meets FPS targets
3. **Mobile Test**: Touch controls functional
4. **Cross-Browser Test**: Works in all supported browsers
5. **Accessibility Test**: Screen reader compatibility

### Maintenance

- **Regular Updates**: Keep dependencies updated
- **Performance Monitoring**: Watch for performance regressions
- **User Feedback**: Address reported issues
- **Browser Compatibility**: Test with new browser versions

---

## 🎉 Deployment Complete!

Once deployed, your Endless Horde game will be available to players worldwide. The game is optimized for:

- **Fast Loading**: <3 second initial load
- **Smooth Performance**: 60 FPS on desktop, 30 FPS on mobile
- **Cross-Platform**: Works on all modern browsers
- **Mobile Optimized**: Touch-friendly controls
- **Accessible**: Supports reduced motion and screen readers

**Live Game URL**: `https://yourusername.github.io/endless-horde`

Enjoy your deployed game! 🧟‍♂️⚔️