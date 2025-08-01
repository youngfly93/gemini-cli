# Gemini CLI (Enhanced Fork)

[![Gemini CLI CI](https://github.com/youngfly93/gemini-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/youngfly93/gemini-cli/actions/workflows/ci.yml)

![Gemini CLI Screenshot](./docs/assets/gemini-screenshot.png)

> **🚀 Enhanced Fork** - This is an enhanced version of the [official Gemini CLI](https://github.com/google-gemini/gemini-cli) with additional features and improvements.

This repository contains the Gemini CLI, a command-line AI workflow tool that connects to your
tools, understands your code and accelerates your workflows.

With the Gemini CLI you can:

- Query and edit large codebases in and beyond Gemini's 1M token context window.
- Generate new apps from PDFs or sketches, using Gemini's multimodal capabilities.
- Automate operational tasks, like querying pull requests or handling complex rebases.
- Use tools and MCP servers to connect new capabilities, including [media generation with Imagen,
  Veo or Lyria](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia)
- Ground your queries with the [Google Search](https://ai.google.dev/gemini-api/docs/grounding)
  tool, built in to Gemini.
- **🆕 Create custom slash commands** to extend the CLI with your own reusable workflows and automation.

## 🌟 Enhanced Features (Compared to Official Version)

This fork includes several enhancements over the original Google Gemini CLI:

### ✨ Comprehensive Custom Slash Commands System
- **Advanced TypeScript Support**: Full TypeScript integration for command development
- **Multiple Command Formats**: Support for TypeScript, JSON, YAML, and Markdown command definitions
- **Hot-Reload Development**: Commands automatically reload during development
- **Scoped Commands**: Project-level (`.gemini/commands/`) and personal (`~/.gemini/commands/`) command scopes
- **Rich Metadata**: Categories, tags, versioning, and detailed command descriptions
- **Command Override**: Ability to override built-in commands with custom implementations
- **Enhanced Command Discovery**: Improved command listing with better organization

### 🔧 Infrastructure Improvements
- **Enhanced CI/CD**: Improved GitHub Actions workflows
- **Better Documentation**: Comprehensive documentation for custom commands
- **Code Quality**: Refined code structure and better test coverage
- **Authentication Enhancements**: Improved OAuth2 and API key handling

### 📚 Documentation Enhancements
- **Custom Commands Guide**: Detailed documentation for creating custom slash commands
- **CLAUDE.md Integration**: Improved Claude Code integration guide
- **Enhanced Configuration**: Better configuration options and settings

## Quickstart

1. **Prerequisites:** Ensure you have [Node.js version 20](https://nodejs.org/en/download) or higher installed.
2. **Run the Enhanced CLI:** Execute the following command in your terminal:

   ```bash
   npx https://github.com/youngfly93/gemini-cli
   ```

   Or install it directly:

   ```bash
   npm install -g https://github.com/youngfly93/gemini-cli
   gemini
   ```

3. **Pick a color theme**
4. **Authenticate:** When prompted, sign in with your personal Google account. This will grant you up to 60 model requests per minute and 1,000 model requests per day using Gemini.

You are now ready to use the Enhanced Gemini CLI!

### Use a Gemini API key:

The Gemini API provides a free tier with [100 requests per day](https://ai.google.dev/gemini-api/docs/rate-limits#free-tier) using Gemini 2.5 Pro, control over which model you use, and access to higher rate limits (with a paid plan):

1. Generate a key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Set it as an environment variable in your terminal. Replace `YOUR_API_KEY` with your generated key.

   ```bash
   export GEMINI_API_KEY="YOUR_API_KEY"
   ```

3. (Optionally) Upgrade your Gemini API project to a paid plan on the API key page (will automatically unlock [Tier 1 rate limits](https://ai.google.dev/gemini-api/docs/rate-limits#tier-1))

### Use a Vertex AI API key:

The Vertex AI provides [free tier](https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview) using express mode for Gemini 2.5 Pro, control over which model you use, and access to higher rate limits with a billing account:

1. Generate a key from [Google Cloud](https://cloud.google.com/vertex-ai/generative-ai/docs/start/api-keys).
2. Set it as an environment variable in your terminal. Replace `YOUR_API_KEY` with your generated key and set GOOGLE_GENAI_USE_VERTEXAI to true

   ```bash
   export GOOGLE_API_KEY="YOUR_API_KEY"
   export GOOGLE_GENAI_USE_VERTEXAI=true
   ```

3. (Optionally) Add a billing account on your project to get access to [higher usage limits](https://cloud.google.com/vertex-ai/generative-ai/docs/quotas)

For other authentication methods, including Google Workspace accounts, see the [authentication](./docs/cli/authentication.md) guide.

## Examples

Once the CLI is running, you can start interacting with Gemini from your shell.

You can start a project from a new directory:

```sh
cd new-project/
gemini
> Write me a Gemini Discord bot that answers questions using a FAQ.md file I will provide
```

Or work with an existing project:

```sh
git clone https://github.com/youngfly93/gemini-cli
cd gemini-cli
gemini
> Give me a summary of all of the changes that went in yesterday
```

### Next steps

- Learn how to [contribute to or build from the source](./CONTRIBUTING.md).
- Explore the available **[CLI Commands](./docs/cli/commands.md)**.
- **🆕 Create [Custom Slash Commands](./docs/CUSTOM_SLASH_COMMANDS.md)** to extend the CLI with your own workflows.
- If you encounter any issues, review the **[Troubleshooting guide](./docs/troubleshooting.md)**.
- For more comprehensive documentation, see the [full documentation](./docs/index.md).
- Take a look at some [popular tasks](#popular-tasks) for more inspiration.

### Troubleshooting

Head over to the [troubleshooting](docs/troubleshooting.md) guide if you're
having issues.

## Popular tasks

### Explore a new codebase

Start by `cd`ing into an existing or newly-cloned repository and running `gemini`.

```text
> Describe the main pieces of this system's architecture.
```

```text
> What security mechanisms are in place?
```

### Work with your existing code

```text
> Implement a first draft for GitHub issue #123.
```

```text
> Help me migrate this codebase to the latest version of Java. Start with a plan.
```

### Automate your workflows

Use MCP servers to integrate your local system tools with your enterprise collaboration suite.

```text
> Make me a slide deck showing the git history from the last 7 days, grouped by feature and team member.
```

```text
> Make a full-screen web app for a wall display to show our most interacted-with GitHub issues.
```

### 🆕 Enhanced Custom Slash Commands

Create your own reusable commands to streamline repetitive tasks and workflows:

```bash
# Create a simple build command
echo '{"name": "build", "description": "Build project", "command": "npm run build"}' > .gemini/commands/build.json

# Use it in Gemini CLI
> /build
```

```typescript
// Advanced TypeScript command with custom logic
// .gemini/commands/deploy.ts
import { SlashCommand } from '@google/gemini-cli';

export default {
  name: 'deploy',
  description: 'Deploy to staging with confirmation',
  category: 'deployment',
  async execute(args: string[]) {
    const env = args[0] || 'staging';
    return { type: 'shell', command: `npm run deploy:${env}` };
  }
} as SlashCommand;
```

```yaml
# YAML command definition
# .gemini/commands/test.yaml
name: test
description: Run project tests
category: development
metadata:
  tags: [testing, ci]
  version: "1.0.0"
command: npm test
```

**Enhanced Features:**
- 🔄 **Hot-reload** during development
- 📁 **Project & personal scopes** 
- 🎯 **Override built-in commands**
- 🛠️ **Multiple formats** (TypeScript, JSON, YAML, Markdown)
- 🏷️ **Rich metadata** (categories, tags, versioning)
- 📝 **Markdown commands** for documentation-driven commands
- 🔍 **Enhanced discovery** with better organization

👉 **[Get Started with Enhanced Custom Commands →](./docs/CUSTOM_SLASH_COMMANDS.md)**

### Interact with your system

```text
> Convert all the images in this directory to png, and rename them to use dates from the exif data.
```

```text
> Organize my PDF invoices by month of expenditure.
```

### Uninstall

Head over to the [Uninstall](docs/Uninstall.md) guide for uninstallation instructions.

## 🔗 Links

- **Original Repository**: [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)
- **Enhanced Fork**: [youngfly93/gemini-cli](https://github.com/youngfly93/gemini-cli)
- **Issues & Feature Requests**: [GitHub Issues](https://github.com/youngfly93/gemini-cli/issues)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

To sync with the upstream repository:
```bash
git remote add upstream https://github.com/google-gemini/gemini-cli.git
git fetch upstream
git merge upstream/main
```

## Terms of Service and Privacy Notice

For details on the terms of service and privacy notice applicable to your use of Gemini CLI, see the [Terms of Service and Privacy Notice](./docs/tos-privacy.md).