# Custom Slash Commands 🚀

> **New Feature:** Extend Gemini CLI with your own custom slash commands using TypeScript, JSON, YAML, or Markdown formats!

## Overview

The Gemini CLI now supports a powerful custom slash commands system that allows you to:

- ✨ **Create reusable commands** for common tasks and workflows
- 🔄 **Hot-reload** commands during development
- 📁 **Scope commands** at project and personal levels  
- 🎯 **Override built-in commands** with custom implementations
- 🛠️ **Use multiple formats** (TypeScript, JSON, YAML, Markdown)
- 🏷️ **Organize with metadata** (categories, tags, versioning)

## Quick Start

### 1. Create Command Directories

```bash
# Project-level commands (shared with team)
mkdir -p .gemini/commands

# Personal commands (your private commands)
mkdir -p ~/.gemini/commands
```

### 2. Create Your First Command

**Simple JSON Command:**
```json
// .gemini/commands/build.json
{
  "name": "build",
  "description": "Build the project",
  "category": "development", 
  "command": "npm run build"
}
```

**Advanced TypeScript Command:**
```typescript
// .gemini/commands/deploy.ts
import { SlashCommand } from '@google/gemini-cli';

export default {
  name: 'deploy',
  altName: 'd',
  description: 'Deploy to staging with confirmation',
  category: 'deployment',
  
  async execute(args: string[], context: any) {
    const env = args[0] || 'staging';
    
    // Custom logic here
    console.log(`Deploying to ${env}...`);
    
    return {
      type: 'shell',
      command: `npm run deploy:${env}`
    };
  }
} as SlashCommand;
```

### 3. Use Your Commands

```bash
gemini
> /build           # Run your build command
> /deploy prod     # Deploy with arguments  
> /d              # Use alt name shortcut
```

## Command Formats

### 📄 JSON Commands
**Best for:** Simple shell command wrappers

```json
{
  "name": "test-watch",
  "altName": "tw",
  "description": "Run tests in watch mode",
  "category": "testing",
  "tags": ["test", "watch", "development"],
  "command": "npm test -- --watch",
  "cwd": "./packages/core"
}
```

### 🔧 TypeScript Commands  
**Best for:** Complex logic, API calls, custom workflows

```typescript
export default {
  name: 'git-clean-branches',
  description: 'Clean merged git branches',
  category: 'git',
  
  async execute(args: string[]) {
    // Custom implementation
    const force = args.includes('--force');
    
    return {
      type: 'shell',
      command: `git branch --merged | grep -v main | xargs ${force ? '-n 1' : '-n 1 -p'} git branch -d`
    };
  }
} as SlashCommand;
```

### 📝 YAML Commands
**Best for:** Configuration-heavy commands

```yaml
name: docker-dev
altName: dd
description: Start development environment with Docker
category: docker
metadata:
  author: team@company.com
  version: "1.2.0"
command: |
  docker-compose -f docker-compose.dev.yml up -d
args: "--build --force-recreate"
```

### 📋 Markdown Commands
**Best for:** Documentation with executable sections

```markdown
# Database Reset

Reset the development database and run migrations.

## Usage
- `/db-reset` - Reset with sample data
- `/db-reset --clean` - Reset without sample data

```bash
npm run db:reset
npm run db:migrate
npm run db:seed
```

**Category:** database
**Tags:** db, reset, development
```

## Command Scopes

### 🏢 Project Commands (`.gemini/commands/`)
- Available only in current project
- Committed to version control
- Shared with team members
- Perfect for project-specific workflows

### 👤 Personal Commands (`~/.gemini/commands/`)  
- Available across all projects
- Private to your user account
- Great for personal productivity commands

## Advanced Features

### 🔄 Hot Reload
Commands automatically reload when files change during development:

```bash
# Start Gemini CLI with debug mode for hot reload feedback
DEBUG=1 gemini
```

### 🏷️ Rich Metadata
Organize commands with comprehensive metadata:

```json
{
  "name": "deploy-staging",
  "description": "Deploy to staging environment",
  "category": "deployment",
  "tags": ["deploy", "staging", "ci"],
  "author": "devops-team@company.com",
  "version": "2.1.0",
  "metadata": {
    "requiredPermissions": ["deploy"],
    "estimatedTime": "2-3 minutes"
  }
}
```

### 🎯 Command Overrides
Custom commands can override built-in ones:

```typescript
// Override the built-in /help command
export default {
  name: 'help',
  description: 'Custom help with company-specific info',
  
  async execute() {
    return {
      type: 'message', 
      content: 'Welcome to CompanyName Gemini CLI!\n\nCustom commands available...'
    };
  }
} as SlashCommand;
```

### 🔍 Command Discovery
List and filter your commands:

```bash
> /help                    # Show all commands
> /help --scope project   # Show only project commands  
> /help --category deploy # Show deployment commands
```

## Best Practices

### 📁 Organization
```
.gemini/commands/
├── development/
│   ├── build.json
│   ├── test.json
│   └── lint.ts
├── deployment/
│   ├── deploy-staging.ts
│   └── deploy-prod.ts
└── utilities/
    ├── clean.json
    └── docs.md
```

### 🛡️ Security
- ⚠️ **Never commit API keys** in command files
- ✅ **Use environment variables** for sensitive data
- ✅ **Validate user inputs** in TypeScript commands
- ✅ **Use descriptive command names** to avoid conflicts

### 🚀 Performance  
- 💡 **Use JSON/YAML** for simple commands (faster loading)
- 💡 **Use TypeScript** only when custom logic is needed
- 💡 **Keep command files small** and focused
- 💡 **Cache expensive operations** in TypeScript commands

## Examples

### Real-World Command Examples

**Database Operations:**
```json
// .gemini/commands/db-reset.json
{
  "name": "db-reset",
  "description": "Reset development database",
  "category": "database",
  "command": "npm run db:reset && npm run db:seed"
}
```

**Code Quality:**
```typescript
// .gemini/commands/quality-check.ts
export default {
  name: 'quality',
  description: 'Run full quality check suite',
  
  async execute() {
    return {
      type: 'shell',
      command: 'npm run lint && npm run typecheck && npm run test && npm run build'
    };
  }
} as SlashCommand;
```

**Git Workflows:**
```yaml
name: feature-branch
altName: fb
description: Create and switch to a new feature branch
category: git
command: |
  git checkout -b feature/$1
  git push -u origin feature/$1
```

## Troubleshooting

### Common Issues

**Commands not loading:**
- ✅ Check file permissions
- ✅ Verify JSON/YAML syntax
- ✅ Ensure TypeScript files export default
- ✅ Check file extensions (.json, .ts, .yml, .md)

**TypeScript compilation errors:**
- ✅ Install dependencies: `npm install @google/gemini-cli`
- ✅ Check TypeScript configuration
- ✅ Verify import statements

**Hot reload not working:**
- ✅ Start with debug mode: `DEBUG=1 gemini`
- ✅ Check file system permissions
- ✅ Verify command directory exists

### Debug Mode
Enable debug output to troubleshoot:

```bash
DEBUG=1 gemini
# Shows command loading, file watching, and execution details
```

## Migration Guide

### From Built-in Commands
If you have been using basic shell aliases, here's how to migrate:

**Before:**
```bash
alias build="npm run build"
alias test="npm test"
```

**After:**
```json
// .gemini/commands/build.json
{
  "name": "build",
  "description": "Build the project", 
  "command": "npm run build"
}

// .gemini/commands/test.json  
{
  "name": "test",
  "description": "Run tests",
  "command": "npm test"
}
```

## API Reference

For detailed API documentation and advanced usage, see:
- 📖 [Complete API Documentation](./custom-commands.md)
- 🏗️ [Architecture Overview](./architecture.md)
- 🔧 [TypeScript Types](../packages/cli/src/ui/commands/types.ts)

---

**🎉 Ready to create your first custom command?** Start with a simple JSON command and gradually explore the advanced TypeScript features as your needs grow!