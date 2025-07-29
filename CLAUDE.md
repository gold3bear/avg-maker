# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AVG Maker** is an AI-era interactive fiction game engine - the "Cursor for AVG games". This is a modern, local Ink script editor and runtime built with **React + Tailwind CSS + Electron**, designed to lower the barrier for creating engaging text-based interactive games and novels.

## Product Positioning

AVG Maker positions itself as the **"Cursor for AVG games"** - a professional, AI-friendly development environment specifically designed for:

- 🤖 **AI-assisted creation**: Optimized workflow perfect for AI-powered content generation
- 📝 **Low-barrier authoring**: Intuitive visual interface requiring no complex programming knowledge  
- 🎮 **Professional features**: Supporting complex branching narratives, character systems, save mechanisms
- 🚀 **Modern experience**: VSCode-like professional development environment
- 📱 **Cross-platform publishing**: One-click export to web and desktop applications

## Key Architecture Components

### Core Application Structure
- **Frontend**: React SPA with TypeScript, styled with Tailwind CSS
- **Backend**: Electron main process handling file I/O and Ink compilation
- **Build System**: Vite for frontend bundling, Electron Forge for desktop packaging

### State Management Architecture
The project follows Single Responsibility Principle (SRP) with a modern state management system:

#### Primary Systems (Current Implementation)
- `src/utils/crashRecovery.ts`: Legacy crash recovery system (currently active)
- `src/hooks/useWorkspaceState.ts`: Workspace state management
- `src/context/`: React contexts for state management

#### Next-Generation Architecture (Implemented but not yet active)
- `src/utils/StateManager.ts`: Unified application state management
- `src/utils/CrashRecoveryManager.ts`: Dedicated crash recovery handling
- `src/utils/SessionPersistenceManager.ts`: Normal session persistence
- `src/utils/RecoveryOrchestrator.ts`: Unified recovery flow management
- `src/utils/StorageSystem.ts`: Unified API entry point

### Main Components
- `src/App.tsx`: Main layout with startup mode management and 3-panel interface
- `src/components/WelcomeScreen.tsx`: VSCode-like welcome page for new users
- `src/components/Editor.tsx`: Monaco-based code editor with Ink syntax support
- `src/components/Preview.tsx`: Real-time Ink story preview using inkjs runtime
- `src/components/NodeGraph.tsx`: Visual story flow graph using D3/force-graph
- `src/components/ProjectExplorer.tsx`: File tree for managing .ink files
- `src/components/PluginHost.tsx`: H5 plugin execution environment

### Key Features

#### Startup Experience
- **App Startup Manager** (`src/utils/AppStartupManager.ts`): Manages different startup modes
  - Welcome mode: For new users or clean starts
  - Crash recovery mode: Automatic recovery after unexpected closure
  - Session restore mode: Normal session continuation
  
#### Crash Recovery System
- **Automatic State Backup**: Continuous backup of work state
- **Smart Recovery Detection**: Distinguishes between crashes and normal exits
- **File Content Protection**: Automatic backup of unsaved file contents
- **Multi-layer Recovery**: Session storage + localStorage + crash recovery data

#### Development Tools
- **Testing Utilities** (`src/utils/testingUtils.ts`): Comprehensive debugging tools
  - Startup mode simulation and testing
  - Crash recovery scenario testing  
  - Data cleanup and management tools
  - Storage system inspection utilities

### IPC Communication
Electron main process (`electron/main.ts`) exposes APIs via `window.inkAPI`:
- File operations (read/write/watch)
- Ink compilation via inklecate
- Project directory management
- Game export (web/desktop)

### Plugin System
- H5 plugins stored in `plugins/` directory
- Each plugin has `manifest.json` + `index.html`
- Invoked from Ink scripts using `~ runPlugin("plugin-id", params)`
- Rendered in iframe within the preview area

## Development Workflow

### Primary Commands
```bash
# Start development environment (Vite + Ink watching + Electron)
npm run dev

# Build web version (static files to dist/)
npm run build:web

# Package as desktop application (Electron)
npm run make

# Lint code
npm run lint

# Watch only Ink files for compilation
npm run watch:ink
```

### Development Process
1. **Start Development**: Use `npm run dev` which concurrently runs:
   - Vite dev server (http://localhost:5173)
   - Ink file watcher (compiles .ink files to JSON)
   - Electron app (loads the Vite dev server)

2. **File Editing**: 
   - Monaco editor provides syntax highlighting and error detection
   - Changes are debounced and automatically compiled via inklecate
   - File watching triggers UI updates when files change externally

3. **Testing Stories**:
   - Preview panel shows real-time story rendering
   - Node graph visualizes story structure and flow
   - Plugins can be tested inline via iframe

## Developer Tools & Testing

### Console Commands (Available in dev mode)
```javascript
// Startup mode management
await window.__DEV_TESTING__.startup.checkStartupMode()
await window.__DEV_TESTING__.startup.getStartupInfo()
window.__DEV_TESTING__.startup.simulateFirstTimeUser()
window.__DEV_TESTING__.startup.simulateCrashRecovery()
window.__DEV_TESTING__.startup.forceCleanAndReload()

// Crash recovery testing
window.__DEV_TESTING__.crashRecovery.simulateCrash()
window.__DEV_TESTING__.crashRecovery.showRecoveryData()
window.__DEV_TESTING__.recovery.clearAllRecoveryData()

// Storage management
window.__DEV_TESTING__.recovery.showAllStorageData()
```

### Architecture Migration Status
- **Current**: Using legacy crash recovery system (working and stable)
- **Next-Gen**: New SRP-compliant architecture implemented but not active
- **Migration**: Available for future major version updates

## Important Implementation Notes

### File Paths
- All file paths are handled as absolute paths throughout the application
- Ink compilation errors are parsed and displayed as Monaco editor markers
- The app supports both development (Vite dev server) and production (static files) modes

### State Management
- **Current Active**: Legacy system with mixed responsibilities (working)
- **Architecture Ready**: New SRP-based system available for migration
- **Crash Recovery**: Dual-system approach with fallback mechanisms
- **Session Persistence**: Multiple storage layers for reliability

### Testing and Debugging
- Comprehensive testing utilities for all major systems
- Startup mode simulation for different user scenarios
- Storage system inspection and cleanup tools
- Crash recovery scenario testing

## Code Quality Standards

- **TypeScript**: Strict mode enabled, comprehensive type safety
- **Architecture**: Single Responsibility Principle (SRP) compliance
- **Error Handling**: Comprehensive crash recovery and error boundaries
- **Testing**: Built-in debugging tools and simulation capabilities
- **Documentation**: Extensive inline documentation and README

## Contributing Guidelines

When working on this codebase:
1. Follow the existing architectural patterns
2. Use the built-in testing tools for validation
3. Maintain compatibility with the Ink scripting language
4. Ensure cross-platform compatibility (Windows/macOS/Linux)
5. Test both normal operation and crash recovery scenarios

The project emphasizes reliability, user experience, and developer productivity, making it the premier tool for AI-assisted interactive fiction creation.