# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload (LESS compilation + local server on port 8080)
- `npm run build` - Build for production (minified, bundled output to public/index.js)
- `npm run serve` - Start local development server only
- `npm run less` - Compile LESS styles and watch for changes

## Project Architecture

This is a Three.js-based single-page website for Bits & Bobs Co. The architecture follows a simple pattern:

### Core Structure
- **Entry Point**: `src/index.js` creates a DOM element and mounts the main App
- **Main App**: `src/app.js` contains the Three.js scene setup, rendering pipeline, and animation loop
- **3D Components**: `src/token.js` defines the Token geometry and mesh classes for the 3D particle system

### Key Technical Features
- **Custom Three.js Pipeline**: Uses EffectComposer with FXAA, BokehPass, and custom shadow mapping
- **Advanced Shader Integration**: Implements Percentage Closer Soft Shadows (PCSS) via shader chunk replacement
- **Procedural 3D Tokens**: Dynamic token generation with custom LatheGeometry, gradient textures, and varied warp types (BULGE/PINCH)
- **Responsive Design**: Mobile-optimized shadow map sizes and touch detection

### Build System
- **ESBuild**: Handles JSX transformation, bundling, and minification
- **LESS**: CSS preprocessing with watch compilation
- **Development Server**: ESBuild's built-in dev server with live reload

## File Structure
- `src/` - Source code (ES6 modules with JSX)
- `public/` - Static assets and build output
- `utils/` - Build and development scripts
- CSS is compiled from `src/main.less` to `public/main.css`

## Dependencies
- Three.js for 3D graphics and post-processing
- ESBuild for bundling and development
- LESS for CSS preprocessing
- Concurrently for parallel script execution