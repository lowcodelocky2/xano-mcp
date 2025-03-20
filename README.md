# Xano MCP Server

A Model Context Protocol (MCP) server for interacting with Xano's metadata API. This server provides tools that can be used by AI assistants (like Claude) through Cursor or other MCP-compatible clients.

## Features

- **Manage Tables**: Create, list, and delete tables in your Xano database
- **Schema Operations**: View and modify table schemas with comprehensive schema editing capabilities
- **Database Management**: Complete toolset for interacting with your Xano database structure
- **API Management**: Create and manage API groups and individual APIs
- **Swagger Spec**: Extract your API group details in either JSON or Markdown format
- **39 Tools**: Complete implementation of 39 tools for managing your Xano workspace

Note: This is an early-stage project with feedback and requests welcomed.

## Prerequisites

- Node.js (v16 or higher)
- npm or another Node.js package manager
- A Xano account with API access
- Cursor, Claude Desktop, Cline or another MCP client

## Installation

1. Clone the repository:
```bash
git clone https://github.com/lowcodelocky2/xano-mcp.git
cd xano-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Configure your Xano credentials by creating a `.env` file in the root directory with the following variables:
```
XANO_API_KEY=your_api_key_here
XANO_WORKSPACE=your_workspace_id_here
XANO_API_BASE=your_xano_instance_api_url_here
```

Example for XANO_API_BASE: `https://your-instance.xano.io/api:meta`

4. Build the project:
```bash
npm run build
```

## Usage with Claude Desktop

Follow this guide: https://modelcontextprotocol.io/quickstart/user

Update your config with: 
```json
{
  "mcpServers": {
    "xano": {
      "command": "node",
      "args": [
        "/path/to/xano-mcp/build/index.js"
      ]
    }
  }
} 
```

Replace `/path/to/xano-mcp` with the absolute path to your project directory.

**This works only with the Claude desktop app - https://claude.ai/download**

## Usage with Cursor

1. Open Cursor
2. Click "Add MCP Server"
3. Configure the server:
   - Name: `whatever you want to call it`
   - Type: `command`
   - Command: `node /path/to/xano-mcp/build/index.js`

Replace `/path/to/xano-mcp` with the absolute path to your project directory.

Example for macOS:  
`node /Users/your-user/Documents/folder-name/xano-mcp/build/index.js`

If you're inside your directory, you can run the command `pwd` in your terminal to get the absolute path.

## Environment Configuration

The following environment variables are required:

- `XANO_API_KEY`: Your Xano API key
- `XANO_WORKSPACE`: Your Xano workspace ID
- `XANO_API_BASE`: Your Xano instance API URL

These can be set in a `.env` file in the root directory or through your system's environment variables.

## Development and Maintenance

This project includes several npm scripts to help with development:

```bash
# Build the project
npm run build

# Start the server
npm run start

# Lint the code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

## Xano MCP Tools Overview

This integration provides a comprehensive set of tools for managing your Xano workspace through the Model Context Protocol (MCP). Here's what you can do:

### Database Management

#### Tables
- List all tables in your workspace
- View detailed table schemas
- Create new tables with custom schemas
- Delete existing tables (disabled by default)
- Modify table schemas (add/remove/rename columns)

#### Schema Operations
- Add new columns with various data types
- Remove columns
- Rename columns
- Update entire table schemas
- Support for complex data types and relationships

### API Management

#### API Groups
- Create new API groups
- List all API groups
- Browse APIs within groups
- Enable/disable Swagger documentation
- Manage API group metadata (tags, branches, etc.)

#### Individual APIs
- Add new APIs to groups
- Configure HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD)
- Set up API documentation
- Add metadata (tags, descriptions)

### Documentation
- Generate API Group specifications in both markdown (reduced tokens) and JSON (full) formats
- View Swagger documentation
- Access detailed schema information

This toolset enables complete management of your Xano workspace, allowing you to build and maintain your backend infrastructure programmatically through the MCP interface.

## Re-enabling the Delete Table Tool

To re-enable the delete-table functionality in this codebase, follow these step-by-step instructions:

1. Open the file `src/index.ts` in your code editor
2. Locate the commented-out section that starts with:
   ```typescript
   // Delete Table Tool
   /*
   server.tool(
   ```
   and ends with:
   ```typescript
   );
   */
   ```

3. To uncomment this section:
   - Delete the opening `/*` on the line after "Delete Table Tool"
   - Delete the closing `*/` before "Edit Table Schema Tool"
   
   That's it! The delete-table tool will now be active again (after running a new build).

### Example of What the Code Should Look Like After

```typescript
// Delete Table Tool
server.tool(
  "delete-table",
  "Delete a table from the Xano workspace",
  {
    table_id: z.string().describe("ID of the table to delete")
  },
  async ({ table_id }) => {
    // ... rest of the implementation
  }
);
```

### Verification
After making these changes:
1. Save the file
2. Run a new build: `npm run build`
3. Restart your MCP client (Claude / Cursor)
4. The delete-table tool should now be available in your toolset

### Safety Note
The delete-table tool permanently removes tables from your Xano workspace. Make sure you have appropriate backups before using this functionality.