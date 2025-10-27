# Mathy Desktop App (Electron)

This document explains how to build and run the Mathy desktop application using Electron.

## 🏗️ Architecture

```
mathy/
├── electron/                 # Electron main process files
│   ├── main.js             # Main Electron process
│   └── preload.js          # Preload script for security
├── electron-builder.json   # Electron builder configuration
├── app/                    # Next.js application
└── out/                    # Built static files (generated)
```

## 🚀 Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
```bash
# Start Next.js dev server and Electron
npm run electron-dev
```

This will:
1. Start Next.js development server on `http://localhost:3000`
2. Wait for the server to be ready
3. Launch Electron window pointing to the dev server

### Run Electron Only (if Next.js is already running)
```bash
npm run electron
```

## 📦 Building for Production

### Build Static Files
```bash
# Build Next.js app for static export
ELECTRON=true npm run build
```

### Package Desktop App
```bash
# Create distributable packages
npm run electron-dist
```

This creates platform-specific installers in `dist-electron/`:
- **macOS**: `.dmg` file
- **Windows**: `.exe` installer
- **Linux**: `.AppImage` file

### Development Build (unpacked)
```bash
# Create unpacked app for testing
npm run electron-pack
```

## 🎯 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run electron-dev` | Development mode with hot reload |
| `npm run electron` | Run Electron (Next.js must be running) |
| `npm run electron-build` | Build and package for distribution |
| `npm run electron-dist` | Create distributable packages |
| `npm run electron-pack` | Create unpacked app for testing |

## 🔧 Configuration

### Electron Builder
Configuration is in `electron-builder.json`:
- App ID: `com.mathy.notebook`
- Product Name: `Mathy`
- Output directory: `dist-electron`
- Platform targets: macOS, Windows, Linux

### Next.js
Configuration is in `next.config.ts`:
- Static export enabled for Electron builds
- Image optimization disabled for static export
- Trailing slashes enabled

## 🛡️ Security Features

- **Context Isolation**: Enabled
- **Node Integration**: Disabled
- **Remote Module**: Disabled
- **Web Security**: Enabled
- **Preload Script**: Secure IPC communication

## 📱 Native Features

### Menu Bar
- **File**: New, Open, Save notebooks
- **Edit**: Standard editing commands
- **View**: Zoom, dev tools, fullscreen
- **Math**: Insert math, toggle math mode
- **Help**: About dialog

### Keyboard Shortcuts
- `Cmd/Ctrl+N`: New notebook
- `Cmd/Ctrl+O`: Open notebook
- `Cmd/Ctrl+S`: Save notebook
- `Cmd/Ctrl+M`: Insert math equation
- `Cmd/Ctrl+Shift+M`: Toggle math mode

### File Operations
- Native file dialogs
- File association support
- Desktop shortcuts

## 🐛 Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Kill existing process
   lsof -ti:3000 | xargs kill -9
   ```

2. **Electron won't start**
   ```bash
   # Clear Electron cache
   rm -rf ~/.cache/electron
   ```

3. **Build fails**
   ```bash
   # Clean and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Debug Mode
```bash
# Run with debug logging
DEBUG=electron* npm run electron-dev
```

## 📋 Next Steps

1. **Test the desktop app**: `npm run electron-dev`
2. **Build for your platform**: `npm run electron-dist`
3. **Test the installer**: Install and run the generated package
4. **Add more native features**: File system access, notifications, etc.

## 🔗 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [Next.js Static Export](https://nextjs.org/docs/advanced-features/static-html-export)
