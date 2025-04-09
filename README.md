# react-analyzer-mcp

Analyze & generate docs for React code using the Model Context Protocol. Based on [react-analyzer](https://github.com/azer/react-analyzer) library.

[![mitte c](https://github.com/user-attachments/assets/615f43d7-9b81-4480-9a2a-773819223ddb)](https://x.com/azerkoculu/status/1910071779457900866)

## What it does

This tool analyzes React component files (JSX/TSX) and extracts information about components and their props.

## Available Tools

- **analyze-react**: Analyzes a single React component from source code
- **analyze-project**: Generates documentation for all React components in a project folder
- **list-projects**: Lists all projects under the root folder

## Installation

```bash
# Clone the repository
git clone https://github.com/azer/react-analyzer-mcp.git
cd react-analyzer-mcp

# Install dependencies
npm install

# Update PROJECT_ROOT in the index.ts file.
vim src/index.ts

# Build
npm run build
```

## Using with Claude

1. Enable MCP server in the Claude Desktop config:

```bash
{
    "react-analyzer-mcp": {
      "command": "node",
      "args": [
        "/Users/azer/code/sandbox/react-analyzer-mcp/build/index.js"
      ]
    }
}
```

2. Connect Claude to your MCP server using the Claude Shell.

3. Use the tools directly in Claude conversations:

```
Analyze my project's React components in the "ui" folder.
```

Or:

```
What React components do I have in my project?
```

## Examples

### Analyzing a project folder:

Input:
```
Can you analyze the components in my "foobar" folder?
```

Output:
```
# Components

## Button

### Props

| Prop | Type | Optional | Default |
|------|------|----------|---------|
| `variant` | `string` | ✓ | `primary` |
| `size` | `string` | ✓ | `md` |
| `onClick` | `function` | ✓ | |
...
```

## License

MIT
