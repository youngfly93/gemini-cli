/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { SlashCommand } from '../ui/commands/types.js';
import { memoryCommand } from '../ui/commands/memoryCommand.js';
import { helpCommand } from '../ui/commands/helpCommand.js';
import { clearCommand } from '../ui/commands/clearCommand.js';
import { themeCommand } from '../ui/commands/themeCommand.js';
import { CustomCommandLoader } from './CustomCommandLoader.js';
import { Config } from '@google/gemini-cli-core';

const loadBuiltInCommands = async (): Promise<SlashCommand[]> => [
  clearCommand,
  helpCommand,
  memoryCommand,
  themeCommand,
];

export class CommandService {
  private commands: SlashCommand[] = [];
  private customCommandLoader: CustomCommandLoader | null = null;

  constructor(
    private commandLoader: () => Promise<SlashCommand[]> = loadBuiltInCommands,
    private config?: Config | null,
    private projectRoot?: string,
  ) {
    // Initialize custom command loader if config is provided
    if (this.config) {
      this.customCommandLoader = new CustomCommandLoader(
        this.config,
        this.projectRoot,
      );
    }
  }

  async loadCommands(): Promise<void> {
    // Load built-in commands
    const builtInCommands = await this.commandLoader();
    
    // Load custom commands if loader is available
    let customCommands: SlashCommand[] = [];
    if (this.customCommandLoader) {
      try {
        customCommands = await this.customCommandLoader.loadCustomCommands();
        if (this.config?.getDebugMode()) {
          console.debug(`Loaded ${customCommands.length} custom commands`);
        }
      } catch (error) {
        console.error('Failed to load custom commands:', error);
      }
    }

    // Combine commands (custom commands can override built-in ones with same name)
    const commandMap = new Map<string, SlashCommand>();
    
    // Add built-in commands first
    for (const command of builtInCommands) {
      commandMap.set(command.name, command);
      if (command.altName) {
        commandMap.set(command.altName, command);
      }
    }
    
    // Add custom commands (they can override built-in ones)
    for (const command of customCommands) {
      commandMap.set(command.name, command);
      if (command.altName) {
        commandMap.set(command.altName, command);
      }
    }

    this.commands = Array.from(commandMap.values());
  }

  getCommands(): SlashCommand[] {
    return this.commands;
  }

  /**
   * Get custom command loader instance
   */
  getCustomCommandLoader(): CustomCommandLoader | null {
    return this.customCommandLoader;
  }

  /**
   * Start watching for custom command changes (hot reload)
   */
  async startWatching(): Promise<void> {
    if (this.customCommandLoader) {
      await this.customCommandLoader.startWatching();
    }
  }

  /**
   * Stop watching for custom command changes
   */
  stopWatching(): void {
    if (this.customCommandLoader) {
      this.customCommandLoader.stopWatching();
    }
  }

  /**
   * Reload all commands (useful for hot reload)
   */
  async reloadCommands(): Promise<void> {
    await this.loadCommands();
  }

  /**
   * Get commands by scope
   */
  getCommandsByScope(scope: 'builtin' | 'project' | 'personal'): SlashCommand[] {
    return this.commands.filter(cmd => {
      const cmdScope = cmd.metadata?.scope || 'builtin';
      return cmdScope === scope;
    });
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: string): SlashCommand[] {
    return this.commands.filter(cmd => cmd.metadata?.category === category);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopWatching();
    if (this.customCommandLoader) {
      this.customCommandLoader.dispose();
    }
  }
}
