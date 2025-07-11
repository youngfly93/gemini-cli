# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development Workflow
- **Build**: `npm run build` - Builds all packages (CLI and Core)
- **Build All**: `npm run build:all` - Builds both CLI and sandbox container
- **Start**: `npm start` - Runs the Gemini CLI from source
- **Debug**: `npm run debug` - Starts CLI with Node.js debugger attached

### Testing
- **Unit Tests**: `npm run test` - Runs unit tests for all packages
- **Integration Tests**: `npm run test:e2e` - Runs end-to-end integration tests
- **All Tests**: `npm run test:ci` - Comprehensive test suite for CI

### Code Quality
- **Lint**: `npm run lint` - Runs ESLint checks
- **Format**: `npm run format` - Formats code with Prettier
- **Type Check**: `npm run typecheck` - Runs TypeScript type checking
- **Preflight**: `npm run preflight` - Comprehensive check (clean, install, format, lint, build, typecheck, test)

Always run `npm run preflight` before submitting changes - this is the gold standard for code quality.

## Architecture Overview

This is a monorepo with two main packages:

### packages/cli/
Frontend terminal interface built with React and Ink. Handles:
- User input processing and command parsing
- Terminal UI rendering and themes
- History management and configuration
- Auth dialogs and privacy notices

### packages/core/
Backend logic that orchestrates Gemini API interactions. Handles:
- Gemini API client and request management
- Tool registration and execution
- Session state and conversation management
- File system operations and git integration

### Tools System
Located in `packages/core/src/tools/`, tools extend Gemini's capabilities:
- File operations (read, write, edit)
- Shell command execution  
- Web fetching and search
- Memory management
- MCP (Model Context Protocol) server integration

## Key Technical Details

### Authentication
Supports multiple auth methods:
- OAuth2 for personal Google accounts
- API keys (GEMINI_API_KEY) for Gemini API
- Vertex AI keys (GOOGLE_API_KEY + GOOGLE_GENAI_USE_VERTEXAI=true)

### Sandboxing
Security features for tool execution:
- macOS Seatbelt profiles (permissive/restrictive, open/closed/proxied)
- Container-based sandboxing (Docker/Podman) via GEMINI_SANDBOX
- Proxied networking restrictions

### Testing Framework
Uses Vitest throughout:
- Test files co-located with source (`*.test.ts`, `*.test.tsx`)
- Extensive mocking with `vi.mock()` for Node.js modules and external SDKs
- React component testing with ink-testing-library
- Integration tests validate end-to-end CLI functionality

### Build System
- TypeScript compilation with strict settings
- ESBuild for bundling
- Workspace-based package management
- Bundle includes macOS sandbox profiles

## Import Restrictions

Custom ESLint rule prevents relative imports between packages - use package names instead:
- ❌ `import '../core/something'` 
- ✅ `import { something } from '@google/gemini-cli-core'`

## Environment Variables

Key environment variables for development:
- `DEBUG=1` - Enable debug mode
- `DEV=true` - Development mode for React DevTools
- `GEMINI_SANDBOX=true|docker|podman` - Enable sandboxing
- `SEATBELT_PROFILE=restrictive-closed` - macOS sandbox profile
- `NO_BROWSER=true` - Force offline OAuth flow

## Development Notes

- Node.js 20+ required (development uses ~20.19.0 specifically)
- ESM modules throughout (`"type": "module"`)
- React DevTools v4.28.5 compatible for UI debugging
- Git pre-commit hooks recommended for quality checks