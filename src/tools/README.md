# Tools

This directory contains the implementation of all MCP tools for interacting with Xano.

## Overview

The tools are organized by category, each focusing on a specific aspect of the Xano platform:

- **Tables**: Database table operations (list, create, schema manipulation, etc.)
- **API Groups**: API group management (list, create, update, etc.)
- **API Endpoints**: API endpoint operations (list, create, update, etc.)

## Structure

- **index.ts** - Central registration point for all tools
- **api.ts** - Shared API request functionality
- **types.ts** - TypeScript interfaces and types
- **utils.ts** - Shared utility functions

## Categories

Each category is organized in its own directory with an index.ts file implementing the specific tools:

- **tables/** - Database table management tools
- **apiGroups/** - API group management tools
- **apiEndpoints/** - API endpoint management tools

## Planned Features

The following directories are currently empty but reserved for future tool implementations:

- **branches/** - Branch management tools
- **columns/** - Table column management tools
- **functions/** - Function management tools
- **tasks/** - Task management tools
- **workspaces/** - Workspace management tools
- **utils/** - Additional utility functions

## Tool Implementation

Each tool follows a standard structure:

```typescript
export const toolName = {
  name: "tool-name",
  description: "Description of what the tool does",
  parameters: { /* zod schema for parameters */ },
  handler: async (params, extra) => {
    // Implementation
    return {
      content: [
        {
          type: "text",
          text: "Response content"
        }
      ]
    };
  }
};
```