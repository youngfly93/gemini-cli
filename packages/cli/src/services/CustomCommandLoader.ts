/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { watch, FSWatcher } from 'fs';
import { homedir } from 'os';
import {
  SlashCommand,
  CommandScope,
  CommandSourceFormat,
  CustomCommandMetadata,
} from '../ui/commands/types.js';
import { Config } from '@google/gemini-cli-core';

/**
 * Configuration for custom command directories
 */
interface CommandDirectoryConfig {
  path: string;
  scope: CommandScope;
  enabled: boolean;
}

/**
 * Configuration for a simple JSON/YAML command
 */
interface SimpleCommandConfig {
  name: string;
  altName?: string;
  description?: string;
  category?: string;
  tags?: string[];
  author?: string;
  version?: string;
  /** Simple shell command to execute */
  command?: string;
  /** Arguments template for the command */
  args?: string;
  /** Working directory for the command */
  cwd?: string;
}

/**
 * Service for loading and managing custom slash commands
 */
export class CustomCommandLoader {
  private commands: Map<string, SlashCommand> = new Map();
  private watchers: FSWatcher[] = [];
  private directories: CommandDirectoryConfig[] = [];
  private isWatching = false;
  private debugMode: boolean = false;

  constructor(
    private config: Config | null = null,
    private projectRoot: string = process.cwd(),
  ) {
    this.debugMode = config?.getDebugMode() || false;
    this.setupDirectories();
  }

  /**
   * Initialize command directories configuration
   */
  private setupDirectories(): void {
    this.directories = [
      {
        path: path.join(this.projectRoot, '.gemini', 'commands'),
        scope: 'project',
        enabled: true,
      },
      {
        path: path.join(homedir(), '.gemini', 'commands'),
        scope: 'personal',
        enabled: true,
      },
    ];
  }

  /**
   * Load all custom commands from configured directories
   */
  async loadCustomCommands(): Promise<SlashCommand[]> {
    this.commands.clear();
    const loadedCommands: SlashCommand[] = [];

    for (const dirConfig of this.directories) {
      if (!dirConfig.enabled) continue;

      try {
        const commands = await this.loadCommandsFromDirectory(dirConfig);
        loadedCommands.push(...commands);
      } catch (error) {
        console.warn(
          `Failed to load commands from ${dirConfig.path}:`,
          error,
        );
      }
    }

    return loadedCommands;
  }

  /**
   * Load commands from a specific directory
   */
  private async loadCommandsFromDirectory(
    dirConfig: CommandDirectoryConfig,
  ): Promise<SlashCommand[]> {
    const { path: dirPath, scope } = dirConfig;
    const commands: SlashCommand[] = [];

    try {
      const exists = await this.directoryExists(dirPath);
      if (!exists) {
        if (this.debugMode) console.debug(`Command directory does not exist: ${dirPath}`);
        return commands;
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile()) continue;

        const filePath = path.join(dirPath, entry.name);
        const command = await this.loadCommandFromFile(filePath, scope);

        if (command) {
          commands.push(command);
          this.commands.set(command.name, command);
          if (command.altName) {
            this.commands.set(command.altName, command);
          }
        }
      }
    } catch (error) {
      console.error(`Error loading commands from ${dirPath}:`, error);
    }

    return commands;
  }

  /**
   * Load a command from a specific file
   */
  private async loadCommandFromFile(
    filePath: string,
    scope: CommandScope,
  ): Promise<SlashCommand | null> {
    const ext = path.extname(filePath).toLowerCase();
    const sourceFormat = this.getSourceFormat(ext);

    if (!sourceFormat) {
      if (this.debugMode) console.debug(`Unsupported file type: ${filePath}`);
      return null;
    }

    try {
      let command: SlashCommand | null = null;

      switch (sourceFormat) {
        case 'typescript':
          command = await this.loadTypeScriptCommand(filePath);
          break;
        case 'json':
          command = await this.loadJsonCommand(filePath);
          break;
        case 'yaml':
          command = await this.loadYamlCommand(filePath);
          break;
        case 'markdown':
          command = await this.loadMarkdownCommand(filePath);
          break;
      }

      if (command) {
        // Add metadata
        command.metadata = {
          scope,
          sourceFormat,
          sourcePath: filePath,
          ...command.metadata,
        };

        if (this.debugMode) console.debug(`Loaded command '${command.name}' from ${filePath}`);
      }

      return command;
    } catch (error) {
      console.error(`Failed to load command from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Load a TypeScript command file
   */
  private async loadTypeScriptCommand(
    filePath: string,
  ): Promise<SlashCommand | null> {
    try {
      // Convert to file URL for ES module imports
      const fileUrl = pathToFileURL(filePath).href;
      
      // Add cache busting for hot reload
      const cacheBustedUrl = `${fileUrl}?t=${Date.now()}`;
      
      const module = await import(cacheBustedUrl);
      
      // Look for default export or named export 'command'
      const command = module.default || module.command;
      
      if (!command || typeof command !== 'object') {
        console.warn(`No valid command export found in ${filePath}`);
        return null;
      }

      return this.validateCommand(command);
    } catch (error) {
      console.error(`Error loading TypeScript command ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Load a JSON command file
   */
  private async loadJsonCommand(filePath: string): Promise<SlashCommand | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const config: SimpleCommandConfig = JSON.parse(content);
      const command = this.createSimpleCommand(config);
      
      if (!command) {
        // Validation failed, error already logged in createSimpleCommand
        return null;
      }
      
      return command;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(`Invalid JSON in command file ${filePath}:`, error.message);
      } else {
        console.error(`Error loading JSON command ${filePath}:`, error);
      }
      return null;
    }
  }

  /**
   * Load a YAML command file
   */
  private async loadYamlCommand(filePath: string): Promise<SlashCommand | null> {
    try {
      // For now, we'll implement basic YAML support
      // In a full implementation, you'd use a YAML parser like 'yaml' package
      console.warn(`YAML command support not yet implemented: ${filePath}`);
      return null;
    } catch (error) {
      console.error(`Error loading YAML command ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Load a Markdown command file (Claude Code style)
   */
  private async loadMarkdownCommand(filePath: string): Promise<SlashCommand | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const filename = path.basename(filePath, path.extname(filePath));
      
      // Parse the markdown content for command information
      const lines = content.split('\n');
      let title = '';
      let description = '';
      let shellCommand = '';
      
      // Extract title from first heading
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) {
          title = trimmed.substring(2).trim();
          break;
        }
      }
      
      // Look for shell commands in code blocks
      let inCodeBlock = false;
      let codeBlockContent = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('```bash') || trimmed.startsWith('```sh') || trimmed.startsWith('```shell')) {
          inCodeBlock = true;
          continue;
        }
        
        if (trimmed === '```' && inCodeBlock) {
          if (codeBlockContent.trim()) {
            shellCommand = codeBlockContent.trim();
            break;
          }
          inCodeBlock = false;
          codeBlockContent = '';
          continue;
        }
        
        if (inCodeBlock) {
          codeBlockContent += line + '\n';
        }
        
        // Also look for description in second-level headings or paragraphs
        if (!description && trimmed.startsWith('## ')) {
          description = trimmed.substring(3).trim();
        } else if (!description && trimmed.length > 0 && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
          description = trimmed;
        }
      }
      
      // Use filename as command name if no title found or title sanitization failed
      let commandName = this.sanitizeCommandName(title);
      
      if (!commandName) {
        // Fallback to filename
        commandName = this.sanitizeCommandName(filename);
      }
      
      if (!commandName) {
        console.warn(`Could not determine command name from ${filePath}`);
        return null;
      }
      
      // Create the command
      const command: SlashCommand = {
        name: commandName,
        description: description || title || `Command from ${filename}`,
        metadata: {
          scope: 'personal', // Will be overridden by caller
          sourceFormat: 'markdown',
          category: 'markdown',
          tags: ['markdown', 'custom'],
        },
      };
      
      // Add action based on whether we found a shell command
      if (shellCommand) {
        command.action = async (context, args) => {
          try {
            const finalCommand = shellCommand.replace(/\{\{args\}\}/g, args || '');
            
            return {
              type: 'tool',
              toolName: 'run_shell_command',
              toolArgs: {
                command: finalCommand,
                cwd: context.services.config?.getProjectRoot() || process.cwd(),
              },
            };
          } catch (error) {
            return {
              type: 'message',
              messageType: 'error',
              content: `Failed to execute command: ${error}`,
            };
          }
        };
        
        if (command.metadata) {
          command.metadata.canExecuteShell = true;
        }
      } else {
        // If no shell command found, send the markdown content to AI as a prompt
        command.action = async (context, args) => {
          // Combine markdown content with any additional arguments
          let finalContent = content.trim();
          
          if (args && args.trim()) {
            // If user provided additional arguments, combine them with markdown content
            finalContent = `${content.trim()}\n\n${args.trim()}`;
          }
          
          // Return a special type that indicates this should be sent to AI
          return {
            type: 'ai-prompt',
            content: finalContent,
          };
        };
      }
      
      return command;
    } catch (error) {
      console.error(`Error loading Markdown command ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Sanitize command name to be valid
   */
  private sanitizeCommandName(name: string): string {
    // If the name contains only non-ASCII characters, use a transliteration or default
    const ascii = name.replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII characters
    
    if (ascii.trim().length === 0) {
      // If no ASCII characters remain, use filename-based approach or a default
      return ''; // This will trigger fallback to filename
    }
    
    return ascii
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/^[^a-zA-Z]+/, '') // Ensure starts with letter
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50); // Limit length
  }

  /**
   * Validate simple command configuration
   */
  private validateSimpleCommand(config: SimpleCommandConfig): string[] {
    const errors: string[] = [];

    if (!config.name || typeof config.name !== 'string') {
      errors.push('Missing required "name" property');
    } else if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(config.name)) {
      errors.push('Command name must start with a letter and contain only letters, numbers, and hyphens');
    }

    if (config.altName && !/^[a-zA-Z][a-zA-Z0-9-]*$/.test(config.altName)) {
      errors.push('Command altName must start with a letter and contain only letters, numbers, and hyphens');
    }

    if (config.command && typeof config.command !== 'string') {
      errors.push('Command "command" must be a string');
    }

    if (config.args && typeof config.args !== 'string') {
      errors.push('Command "args" must be a string');
    }

    if (config.cwd && typeof config.cwd !== 'string') {
      errors.push('Command "cwd" must be a string');
    }

    if (config.category && typeof config.category !== 'string') {
      errors.push('Command "category" must be a string');
    }

    if (config.tags && !Array.isArray(config.tags)) {
      errors.push('Command "tags" must be an array');
    } else if (config.tags) {
      for (const tag of config.tags) {
        if (typeof tag !== 'string') {
          errors.push('All tags must be strings');
          break;
        }
      }
    }

    if (config.author && typeof config.author !== 'string') {
      errors.push('Command "author" must be a string');
    }

    if (config.version && typeof config.version !== 'string') {
      errors.push('Command "version" must be a string');
    }

    return errors;
  }

  /**
   * Create a simple command from configuration
   */
  private createSimpleCommand(config: SimpleCommandConfig): SlashCommand | null {
    // Validate configuration first
    const errors = this.validateSimpleCommand(config);
    if (errors.length > 0) {
      console.error(`Simple command validation failed for "${config.name || 'unknown'}":`, errors);
      return null;
    }

    const { name, altName, description, category, tags, author, version, command: shellCommand, args = '', cwd } = config;

    const slashCommand: SlashCommand = {
      name,
      altName,
      description,
      metadata: {
        scope: 'project', // Will be overridden by caller
        sourceFormat: 'json',
        category,
        tags,
        author,
        version,
        canExecuteShell: !!shellCommand,
      },
    };

    if (shellCommand) {
      slashCommand.action = async (context, userArgs) => {
        try {
          // Replace argument placeholders
          const finalArgs = args.replace('{{args}}', userArgs);
          const fullCommand = `${shellCommand} ${finalArgs}`.trim();

          if (this.debugMode) console.debug(`Executing command: ${fullCommand}`);

          return {
            type: 'tool',
            toolName: 'run_shell_command',
            toolArgs: {
              command: fullCommand,
              cwd: cwd || context.services.config?.getProjectRoot() || process.cwd(),
            },
          };
        } catch (error) {
          return {
            type: 'message',
            messageType: 'error',
            content: `Failed to execute command: ${error}`,
          };
        }
      };
    }

    return slashCommand;
  }

  /**
   * Validate a command object
   */
  private validateCommand(command: any): SlashCommand | null {
    const errors: string[] = [];

    // Required fields
    if (!command.name || typeof command.name !== 'string') {
      errors.push('Command missing required "name" property');
    } else {
      // Validate name format
      if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(command.name)) {
        errors.push('Command name must start with a letter and contain only letters, numbers, and hyphens');
      }
    }

    if (command.description && typeof command.description !== 'string') {
      errors.push('Command "description" must be a string');
    }

    // Validate altName if provided
    if (command.altName) {
      if (typeof command.altName !== 'string') {
        errors.push('Command "altName" must be a string');
      } else if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(command.altName)) {
        errors.push('Command altName must start with a letter and contain only letters, numbers, and hyphens');
      }
    }

    // Validate action function if provided
    if (command.action && typeof command.action !== 'function') {
      errors.push('Command "action" must be a function');
    }

    // Validate completion function if provided
    if (command.completion && typeof command.completion !== 'function') {
      errors.push('Command "completion" must be a function');
    }

    // Validate subCommands if provided
    if (command.subCommands) {
      if (!Array.isArray(command.subCommands)) {
        errors.push('Command "subCommands" must be an array');
      } else {
        // Recursively validate sub-commands
        for (let i = 0; i < command.subCommands.length; i++) {
          const subCommand = this.validateCommand(command.subCommands[i]);
          if (!subCommand) {
            errors.push(`Invalid sub-command at index ${i}`);
          }
        }
      }
    }

    // Validate metadata if provided
    if (command.metadata) {
      if (typeof command.metadata !== 'object') {
        errors.push('Command "metadata" must be an object');
      } else {
        const meta = command.metadata;
        
        if (meta.category && typeof meta.category !== 'string') {
          errors.push('Metadata "category" must be a string');
        }
        
        if (meta.tags && !Array.isArray(meta.tags)) {
          errors.push('Metadata "tags" must be an array');
        } else if (meta.tags) {
          for (const tag of meta.tags) {
            if (typeof tag !== 'string') {
              errors.push('All tags must be strings');
              break;
            }
          }
        }
        
        if (meta.author && typeof meta.author !== 'string') {
          errors.push('Metadata "author" must be a string');
        }
        
        if (meta.version && typeof meta.version !== 'string') {
          errors.push('Metadata "version" must be a string');
        }
        
        if (meta.canExecuteShell && typeof meta.canExecuteShell !== 'boolean') {
          errors.push('Metadata "canExecuteShell" must be a boolean');
        }
      }
    }

    // Check for conflicting properties
    if (command.action && command.subCommands && command.subCommands.length > 0) {
      console.warn(`Command "${command.name}" has both action and subCommands. Action will be ignored when subCommands are present.`);
    }

    if (errors.length > 0) {
      console.error(`Command validation failed for "${command.name || 'unknown'}":`, errors);
      return null;
    }

    return command as SlashCommand;
  }

  /**
   * Get source format from file extension
   */
  private getSourceFormat(ext: string): CommandSourceFormat | null {
    switch (ext) {
      case '.ts':
      case '.js':
        return 'typescript';
      case '.json':
        return 'json';
      case '.yaml':
      case '.yml':
        return 'yaml';
      case '.md':
      case '.markdown':
        return 'markdown';
      default:
        return null;
    }
  }

  /**
   * Check if directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Start watching for file changes (hot reload)
   */
  async startWatching(): Promise<void> {
    if (this.isWatching) return;

    for (const dirConfig of this.directories) {
      if (!dirConfig.enabled) continue;

      try {
        const exists = await this.directoryExists(dirConfig.path);
        if (!exists) continue;

        const watcher = watch(
          dirConfig.path,
          { recursive: false },
          (eventType, filename) => {
            if (filename && eventType === 'change') {
              if (this.debugMode) console.debug(`Command file changed: ${filename}`);
              // Debounce reload to avoid multiple rapid reloads
              this.scheduleReload();
            }
          },
        );

        this.watchers.push(watcher);
      } catch (error) {
        console.warn(`Failed to watch directory ${dirConfig.path}:`, error);
      }
    }

    this.isWatching = true;
  }

  /**
   * Schedule a debounced reload
   */
  private reloadTimer: NodeJS.Timeout | null = null;
  private scheduleReload(): void {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }
    
    this.reloadTimer = setTimeout(async () => {
      try {
        await this.loadCustomCommands();
        if (this.debugMode) console.debug('Custom commands reloaded');
      } catch (error) {
        console.error('Failed to reload custom commands:', error);
      }
    }, 500); // 500ms debounce
  }

  /**
   * Stop watching for file changes
   */
  stopWatching(): void {
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
    this.isWatching = false;

    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
      this.reloadTimer = null;
    }
  }

  /**
   * Get a loaded command by name
   */
  getCommand(name: string): SlashCommand | undefined {
    return this.commands.get(name);
  }

  /**
   * Get all loaded commands
   */
  getAllCommands(): SlashCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by scope
   */
  getCommandsByScope(scope: CommandScope): SlashCommand[] {
    return this.getAllCommands().filter(cmd => cmd.metadata?.scope === scope);
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: string): SlashCommand[] {
    return this.getAllCommands().filter(cmd => cmd.metadata?.category === category);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopWatching();
    this.commands.clear();
  }
}