/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Config, GitService, Logger } from '@google/gemini-cli-core';
import { LoadedSettings } from '../../config/settings.js';
import { UseHistoryManagerReturn } from '../hooks/useHistoryManager.js';
import { SessionStatsState } from '../contexts/SessionContext.js';

// Grouped dependencies for clarity and easier mocking
export interface CommandContext {
  // Core services and configuration
  services: {
    // TODO(abhipatel12): Ensure that config is never null.
    config: Config | null;
    settings: LoadedSettings;
    git: GitService | undefined;
    logger: Logger;
  };
  // UI state and history management
  ui: {
    // TODO - As more commands are add some additions may be needed or reworked using this new context.
    // Ex.
    // history: HistoryItem[];
    // pendingHistoryItems: HistoryItemWithoutId[];

    /** Adds a new item to the history display. */
    addItem: UseHistoryManagerReturn['addItem'];
    /** Clears all history items and the console screen. */
    clear: () => void;
    /**
     * Sets the transient debug message displayed in the application footer in debug mode.
     */
    setDebugMessage: (message: string) => void;
  };
  // Session-specific data
  session: {
    stats: SessionStatsState;
  };
}

/**
 * The return type for a command action that results in scheduling a tool call.
 */
export interface ToolActionReturn {
  type: 'tool';
  toolName: string;
  toolArgs: Record<string, unknown>;
}

/**
 * The return type for a command action that results in a simple message
 * being displayed to the user.
 */
export interface MessageActionReturn {
  type: 'message';
  messageType: 'info' | 'error';
  content: string;
}

/**
 * The return type for a command action that needs to open a dialog.
 */
export interface OpenDialogActionReturn {
  type: 'dialog';
  // TODO: Add 'theme' | 'auth' | 'editor' | 'privacy' as migration happens.
  dialog: 'help' | 'theme';
}

/**
 * The return type for a command action that sends content to AI as a prompt.
 */
export interface AiPromptActionReturn {
  type: 'ai-prompt';
  content: string;
}

export type SlashCommandActionReturn =
  | ToolActionReturn
  | MessageActionReturn
  | OpenDialogActionReturn
  | AiPromptActionReturn;

/**
 * Scope where a custom command is defined
 */
export type CommandScope = 'builtin' | 'project' | 'personal';

/**
 * Source format for custom commands
 */
export type CommandSourceFormat = 'typescript' | 'json' | 'yaml' | 'markdown';

/**
 * Metadata for custom commands
 */
export interface CustomCommandMetadata {
  /** Source scope: builtin, project (.gemini/commands/), or personal (~/.gemini/commands/) */
  scope: CommandScope;
  /** Format of the source file */
  sourceFormat?: CommandSourceFormat;
  /** Path to the source file */
  sourcePath?: string;
  /** Category for organization (e.g., 'git', 'build', 'test') */
  category?: string;
  /** Tags for searching and filtering */
  tags?: string[];
  /** Whether this command can execute shell commands */
  canExecuteShell?: boolean;
  /** Author information for custom commands */
  author?: string;
  /** Version of the command */
  version?: string;
}

// The standardized contract for any command in the system.
export interface SlashCommand {
  name: string;
  altName?: string;
  description?: string;

  // The action to run. Optional for parent commands that only group sub-commands.
  action?: (
    context: CommandContext,
    args: string,
  ) =>
    | void
    | SlashCommandActionReturn
    | Promise<void | SlashCommandActionReturn>;

  // Provides argument completion (e.g., completing a tag for `/chat resume <tag>`).
  completion?: (
    context: CommandContext,
    partialArg: string,
  ) => Promise<string[]>;

  subCommands?: SlashCommand[];
  
  /** Metadata for custom commands (optional, used by CustomCommandLoader) */
  metadata?: CustomCommandMetadata;
}
