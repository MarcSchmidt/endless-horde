# Endless Horde

A browser-based idle/survival web game inspired by Incremancer. Built with TypeScript, HTML5 Canvas, and Vite for fast development and deployment.

## 🎮 Game Overview

Endless Horde is an incremental survival game where players spawn zombies to hunt walking figures (walkers) across different areas. Defeat walkers to earn souls, purchase upgrades, and progress through increasingly challenging areas with stronger enemies and better rewards.

### Key Features

- **Real-time Canvas Rendering**: Smooth 60 FPS gameplay with HTML5 Canvas
- **Progressive Difficulty**: Multiple areas with stronger walkers and better rewards
- **Upgrade System**: Improve zombie speed and maximum zombie count
- **Mobile Optimized**: Touch-friendly controls and responsive design
- **Accessibility Support**: Reduced motion options and screen reader compatibility
- **Persistent Progress**: Automatic save/load using localStorage
- **Performance Monitoring**: Adaptive quality settings for different devices

## 🚀 Quick Start

### Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/endless-horde.git
   cd endless-horde
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173`
   - The game should load automatically

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production version
- `npm run preview` - Preview production build locally

### Project Structure

```
src/
├── core/                   # Core game systems
│   ├── Animation.ts        # Animation system
│   ├── AssetManager.ts     # Asset loading and management
│   ├── BatchRenderer.ts    # Optimized rendering
│   ├── CollisionSystem.ts  # Collision detection
│   ├── EntityCuller.ts     # Performance optimization
│   ├── PerformanceMonitor.ts # FPS and performance tracking
│   └── VisualEffects.ts    # Particle effects and visuals
├── entities/               # Game entities
│   ├── Walker.ts          # Walker entity logic
│   └── Zombie.ts          # Zombie entity logic
├── managers/               # Game state managers
│   ├── AccessibilityManager.ts # Accessibility features
│   ├── AreaManager.ts     # Area progression
│   ├── ResourceManager.ts # Souls and resources
│   ├── SaveManager.ts     # Save/load functionality
│   ├── SettingsManager.ts # Game settings
│   └── UpgradeManager.ts  # Upgrade system
├── systems/                # Game systems
│   ├── InputManager.ts    # Input handling
│   ├── WalkerSystem.ts    # Walker AI and management
│   └── ZombieSystem.ts    # Zombie AI and management
├── ui/                     # User interface
│   ├── HUD.ts             # Game HUD and upgrade menu
│   └── MobileUI.ts        # Mobile-specific UI
└── main.ts                 # Game entry point
```

### Development Guidelines

1. **TypeScript**: All code is written in TypeScript for type safety
2. **Modular Architecture**: Systems are separated for maintainability
3. **Performance First**: 60 FPS target on desktop, 30 FPS on mobile
4. **Mobile Responsive**: Touch-friendly controls and adaptive UI
5. **Accessibility**: Support for reduced motion and screen readers

## 📱 Mobile Support

The game is fully optimized for mobile devices:

- **Touch Controls**: Tap to spawn zombies, touch buttons for pause/upgrades
- **Responsive Design**: Adapts to different screen sizes and orientations
- **Performance Optimization**: Automatic quality adjustment for mobile devices
- **Accessibility**: Voice announcements and reduced motion support

### Mobile Controls

- **Tap anywhere**: Spawn zombie at tap location
- **Pause Button**: Pause/resume game
- **Upgrades Button**: Open upgrade menu
- **Settings Button**: Toggle reduced motion

## 🎯 Gameplay

### Basic Controls

- **Mouse/Touch**: Click or tap to spawn zombies
- **P Key**: Pause/resume game
- **U Key**: Toggle upgrade menu
- **M Key**: Toggle reduced motion mode

### Game Mechanics

1. **Spawn Zombies**: Click/tap to spawn zombies that hunt walkers
2. **Earn Souls**: Zombies defeat walkers to earn souls (currency)
3. **Purchase Upgrades**: Spend souls to improve zombie speed and count
4. **Progress Areas**: Defeat walkers to unlock new areas with stronger enemies
5. **Persistent Progress**: Game automatically saves your progress

### Areas and Progression

- **Peaceful Village**: Starting area with basic walkers (1 HP, 1x souls)
- **Busy Town**: Unlocked after 25 defeats (2 HP, 2x souls)
- **Fortified City**: Unlocked after 100 defeats (4 HP, 4x souls)

## 🚀 Deployment

### GitHub Pages Deployment

The game is configured for automatic deployment to GitHub Pages:

1. **Automatic Deployment**: Pushes to `main` branch trigger automatic builds
2. **GitHub Actions**: Uses `.github/workflows/deploy.yml` for CI/CD
3. **Static Hosting**: Built files are deployed to the repository root

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy built files**
   - Copy contents of `dist/` folder to your web server
   - Ensure `index.html` is served for the root path

### Custom Domain Setup

To use a custom domain with GitHub Pages:

1. Add a `CNAME` file to the repository root with your domain
2. Configure DNS to point to `yourusername.github.io`
3. Enable HTTPS in repository settings

## 🔧 Configuration

### Performance Settings

The game automatically adjusts performance based on device capabilities:

- **High Performance**: Full visual effects, 60 FPS target
- **Medium Performance**: Reduced effects, stable performance
- **Low Performance**: Minimal effects, 30 FPS target

### Accessibility Options

- **Reduced Motion**: Disable animations for motion sensitivity
- **Screen Reader Support**: Announcements for game state changes
- **High Contrast**: Improved visibility for visual impairments
- **Touch Accessibility**: Large touch targets and clear feedback

## 🧪 Testing

### Browser Compatibility

Tested and supported browsers:

- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: Chrome Mobile 90+, Safari iOS 14+, Samsung Internet 14+

### Performance Targets

- **Desktop**: 60 FPS with 40+ walkers and 10+ zombies
- **Mobile**: 30 FPS with 20+ walkers and 5+ zombies
- **Memory**: <50MB heap usage during normal gameplay

### Manual Testing Checklist

See `TESTING.md` for comprehensive testing procedures.

## 🐛 Troubleshooting

### Common Issues

1. **Game won't load**
   - Check browser console for errors
   - Ensure JavaScript is enabled
   - Try refreshing the page

2. **Poor performance**
   - Close other browser tabs
   - Check if reduced motion is enabled
   - Try a different browser

3. **Touch controls not working**
   - Ensure you're using a supported mobile browser
   - Check if touch events are being blocked
   - Try refreshing the page

4. **Save data lost**
   - Check if localStorage is enabled
   - Ensure you're using the same browser/device
   - Private browsing may prevent saves

### Performance Optimization

If experiencing performance issues:

1. **Enable reduced motion** (M key or settings button)
2. **Close other applications** to free up system resources
3. **Use a modern browser** with hardware acceleration
4. **Check system requirements** (mid-range laptop or newer mobile device)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

1. Follow the installation steps above
2. Make your changes
3. Test thoroughly on desktop and mobile
4. Ensure TypeScript compiles without errors
5. Verify performance targets are met

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Incremancer](https://incremancer.com/)
- Built with [Vite](https://vitejs.dev/) for fast development
- Uses HTML5 Canvas for high-performance rendering
- TypeScript for type safety and maintainability

## 📞 Support

If you encounter issues or have questions:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Include browser version, device type, and error messages

---

**Enjoy playing Endless Horde!** 🧟‍♂️⚔️