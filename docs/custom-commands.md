# Custom Slash Commands

Gemini CLI supports custom slash commands that can be defined at both project and personal levels. This allows you to create reusable commands for common tasks and workflows.

## Quick Start

1. **Create a command directory**:
   ```bash
   mkdir -p .gemini/commands    # Project-level commands
   mkdir -p ~/.gemini/commands  # Personal commands
   ```

2. **Create a simple JSON command**:
   ```json
   // .gemini/commands/build.json
   {
     "name": "build",
     "description": "Build the project", 
     "command": "npm run build"
   }
   ```

3. **Use the command**:
   ```bash
   gemini
   > /build
   ```

## Command Scopes

### Project Commands (`.gemini/commands/`)
- Available only in the current project
- Committed to version control  
- Shared with team members
- Good for project-specific workflows

### Personal Commands (`~/.gemini/commands/`)
- Available across all projects
- Private to your user account
- Good for personal productivity commands

## Command Formats

### JSON Commands (Simple)

Best for wrapping shell commands with minimal logic:

```json
{
  "name": "test",
  "altName": "t", 
  "description": "Run project tests",
  "category": "development",
  "tags": ["test", "npm"],
  "author": "Your Name",
  "version": "1.0.0",
  "command": "npm test",
  "args": "{{args}}",
  "cwd": "."
}
```

**Properties:**
- `name` (required) - Command name without `/`
- `altName` - Optional alias (e.g., `t` for `test`)
- `description` - Help text
- `category` - Organization category  
- `tags` - Array of searchable tags
- `command` - Shell command to execute
- `args` - Argument template (use `{{args}}` for user input)
- `cwd` - Working directory (defaults to project root)

### TypeScript Commands (Advanced)

For complex logic, tool integration, and custom workflows:

```typescript
export const command = {
  name: 'advanced-example',
  altName: 'ae',
  description: 'An advanced command with custom logic',
  metadata: {
    category: 'examples',
    tags: ['advanced', 'demo'],
    author: 'Your Name',
    version: '1.0.0',
  },
  
  action: async (context, args) => {
    // Custom logic here
    if (args === 'help') {
      return {
        type: 'message',
        messageType: 'info',
        content: 'This is help text for the command',
      };
    }
    
    // Execute a Gemini tool
    return {
      type: 'tool',
      toolName: 'list_directory',
      toolArgs: { path: '.' },
    };
  },
  
  completion: async (context, partialArg) => {
    return ['help', 'option1', 'option2'];
  },
};
```

## Command Context

TypeScript commands receive a `context` object with access to:

```typescript
interface CommandContext {
  services: {
    config: Config | null;      // Project configuration
    settings: LoadedSettings;   // User settings
    git: GitService;           // Git operations
    logger: Logger;            // Session logging
  };
  ui: {
    addItem: (item) => void;   // Add to conversation
    clear: () => void;         // Clear screen
    setDebugMessage: (msg) => void; // Debug output
  };
  session: {
    stats: SessionStatsState;  // Session statistics
  };
}
```

## Return Types

Commands can return different types of responses:

### Message Response
Display information to the user:
```typescript
return {
  type: 'message',
  messageType: 'info' | 'error',
  content: 'Your message here',
};
```

### Tool Execution
Execute a Gemini CLI tool:
```typescript
return {
  type: 'tool', 
  toolName: 'run_shell_command',
  toolArgs: {
    command: 'npm test',
    cwd: '/path/to/project',
  },
};
```

### Dialog Opening
Open a UI dialog:
```typescript
return {
  type: 'dialog',
  dialog: 'help',
};
```

## Available Tools

Commands can execute these built-in tools:

- `run_shell_command` - Execute shell commands
- `read_file` - Read file contents
- `write_file` - Write to files
- `list_directory` - List directory contents
- `grep` - Search in files
- `edit_file` - Edit file contents

## Command Validation

The system validates commands automatically:

### Name Rules
- Must start with a letter
- Can contain letters, numbers, and hyphens
- No spaces or special characters

### JSON Schema Validation
- Required: `name`
- Optional but typed: all other properties
- Arrays must contain correct types
- Shell commands are validated for basic syntax

### TypeScript Validation
- Function signatures are checked
- Return types must match expected interfaces
- Metadata structure is validated

## Auto-completion

Commands support argument auto-completion:

```typescript
completion: async (context, partialArg) => {
  const parts = partialArg.split(' ');
  
  if (parts.length === 1) {
    // Complete main argument
    return ['option1', 'option2', 'help'];
  }
  
  // Complete sub-arguments
  return ['file1.txt', 'file2.txt'];
}
```

## Hot Reload

In development mode, commands are automatically reloaded when files change:

```bash
DEV=true gemini  # Enable hot reload
```

## Command Templates

Use the provided templates to get started:

- `.gemini/commands/template-simple.json` - Basic JSON command
- `.gemini/commands/template-advanced.ts` - Advanced TypeScript command  
- `.gemini/commands/template-tool.ts` - Tool execution examples

## Best Practices

1. **Use descriptive names** - Clear, unambiguous command names
2. **Add help text** - Always include descriptions and completion
3. **Organize with categories** - Group related commands
4. **Version your commands** - Track changes with version numbers
5. **Validate inputs** - Check arguments before execution
6. **Handle errors gracefully** - Return helpful error messages
7. **Keep commands focused** - One command, one responsibility

## Troubleshooting

### Command Not Loading
- Check file syntax (JSON/TypeScript)
- Verify file permissions
- Look for validation errors in console
- Ensure command name follows naming rules

### Command Not Working
- Check the `action` function implementation
- Verify tool names and arguments
- Test with simple message returns first
- Use debug mode for more information

### Hot Reload Not Working
- Ensure `DEV=true` environment variable
- Check file system permissions
- Restart Gemini CLI if needed

## Examples

See the example commands in `.gemini/commands/` for practical implementations of different command types and patterns.