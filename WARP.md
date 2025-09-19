# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a modern Angular 20 web application with Server-Side Rendering (SSR) capabilities. The project is named "DIME-WEB-APP" and uses the latest Angular features including standalone components, signals, and zoneless change detection.

## Architecture

### Key Features
- **Angular 20**: Latest version with modern features
- **Server-Side Rendering**: Full SSR support with Node.js/Express backend
- **Standalone Components**: Uses standalone components architecture (no NgModules)
- **Signals**: Modern reactive programming with Angular signals
- **Zoneless Change Detection**: Enhanced performance with `provideZonelessChangeDetection()`
- **TypeScript**: Strict TypeScript configuration with comprehensive compiler options

### Directory Structure
- `DIME-WEB-APP/` - Main application directory
  - `src/app/` - Angular application source code
    - `app.ts` - Root standalone component
    - `app.config.ts` - Application configuration with providers
    - `app.routes.ts` - Route definitions (currently empty)
  - `src/server.ts` - Express server configuration for SSR
  - `src/main.ts` - Browser bootstrap entry point
  - `src/main.server.ts` - Server bootstrap entry point

### Configuration Files
- `angular.json` - Angular CLI workspace configuration
- `tsconfig.json` - TypeScript base configuration with strict settings
- `package.json` - Dependencies and npm scripts
- `.editorconfig` - Code formatting standards (2-space indentation, single quotes)

## Development Commands

### Primary Development
```bash
# Navigate to the application directory
cd DIME-WEB-APP

# Start development server (http://localhost:4200)
npm start
# or
ng serve

# Build for production
npm run build
# or
ng build

# Run unit tests
npm test
# or
ng test

# Build and watch for development
npm run watch
# or
ng build --watch --configuration development
```

### SSR Development
```bash
# Build for SSR
ng build

# Run SSR server (after build)
npm run serve:ssr:DIME-WEB-APP
# or
node dist/DIME-WEB-APP/server/server.mjs
```

### Code Generation
```bash
# Generate new component
ng generate component component-name

# Generate service
ng generate service service-name

# Generate other schematics
ng generate --help
```

## Code Standards

### TypeScript Configuration
- **Strict Mode**: All strict TypeScript options enabled
- **Target**: ES2022 with modern JavaScript features
- **Module Preservation**: Uses `"module": "preserve"` for optimal bundling
- **Experimental Decorators**: Enabled for Angular compatibility

### Code Style (from .editorconfig)
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for TypeScript
- **Line Endings**: CRLF (Windows)
- **Final Newline**: Required
- **Trailing Whitespace**: Trimmed

### Angular Patterns
- **Standalone Components**: All new components should be standalone
- **Signals**: Use signals for reactive state management
- **Dependency Injection**: Use `inject()` function in standalone components
- **Routing**: Define routes in `app.routes.ts`

## Server Configuration

The application includes a full SSR setup:
- **Express Server**: Located in `src/server.ts`
- **Default Port**: 4000 (configurable via PORT environment variable)
- **Static Files**: Served from `/browser` with 1-year cache headers
- **API Ready**: Express server configured to handle REST API endpoints

## VS Code Configuration

Recommended extensions:
- `angular.ng-template` - Angular Language Service

Available tasks:
- Start development server (background task)
- Run tests (background task)

## Testing

- **Framework**: Jasmine with Karma test runner
- **Configuration**: `tsconfig.spec.json` for test-specific TypeScript settings
- **Coverage**: Karma coverage reports available

## Build & Deployment

### Production Build
```bash
cd DIME-WEB-APP
ng build
```

Build artifacts are stored in `dist/DIME-WEB-APP/`:
- `browser/` - Client-side bundles
- `server/` - Server-side bundles and server entry point

### Bundle Size Limits
- Initial bundle: 500kB warning, 1MB error
- Component styles: 4kB warning, 8kB error

## SSR Considerations

- Server runs on port 4000 by default
- Client hydration with event replay enabled
- Static file serving optimized for production
- API endpoints can be added to `src/server.ts`

## Development Workflow

1. **Project Setup**: Run `npm install` in the `DIME-WEB-APP` directory
2. **Development**: Use `npm start` for live reload development server
3. **Testing**: Use `npm test` for unit tests
4. **Building**: Use `npm run build` for production builds
5. **SSR Testing**: Build first, then run `npm run serve:ssr:DIME-WEB-APP`

## File Paths

When referencing files, use paths relative to the project root:
- Application code: `DIME-WEB-APP/src/app/`
- Configuration: `DIME-WEB-APP/angular.json`, `DIME-WEB-APP/package.json`
- Build output: `DIME-WEB-APP/dist/`