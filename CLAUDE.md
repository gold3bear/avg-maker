# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a local Ink script editor built with **React + Tailwind CSS + Electron**. It provides a complete IDE for creating, editing, and testing interactive fiction stories using the Ink scripting language.

## Key Commands

### Development
```bash
# Start development environment (Vite + Ink watching + Electron)
npm run dev

# Watch only Ink files for compilation
npm run watch:ink

# Lint code
npm run lint
```

### Building & Distribution
```bash
# Build web version (static files to dist/)
npm run build:web

# Build TypeScript and Vite bundle
npm run build

# Package as desktop application (Electron)
npm run make

# Preview build
npm run preview
```

### Ink Compilation
The project uses `inklecate` compiler located in `bin/` directory. Ink files in `story/` are compiled to `public/story.json`.

## Architecture

### Core Structure
- **Frontend**: React SPA with TypeScript, styled with Tailwind CSS
- **Backend**: Electron main process handling file I/O and Ink compilation
- **Build System**: Vite for frontend bundling, Electron Forge for desktop packaging

### Main Components
- `src/App.tsx`: Main layout with 3-panel interface (file explorer, editor, preview/graph)
- `src/components/Editor.tsx`: Monaco-based code editor with Ink syntax support
- `src/components/Preview.tsx`: Real-time Ink story preview using inkjs runtime
- `src/components/NodeGraph.tsx`: Visual story flow graph using D3/force-graph
- `src/components/ProjectExplorer.tsx`: File tree for managing .ink files
- `src/components/PluginHost.tsx`: H5 plugin execution environment

### Key Contexts
- `InkContext`: Manages Ink compilation, parsing, and syntax checking
- `ProjectContext`: Handles project file management, file watching, and plugin loading

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

## Important Files

- `package.json`: Scripts and dependencies
- `electron/main.ts`: Electron main process and IPC handlers
- `src/context/`: React contexts for state management
- `bin/inklecate`: Ink compiler executable
- `story/`: Example Ink project files
- `public/story.json`: Compiled Ink output

## Notes

- Project uses ESM modules (`"type": "module"`)
- File paths are handled as absolute paths throughout the application
- Ink compilation errors are parsed and displayed as Monaco editor markers
- The app supports both development (Vite dev server) and production (static files) modes