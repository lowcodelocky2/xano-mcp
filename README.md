# Xano MCP Server

A Model Context Protocol (MCP) server for interacting with Xano's metadata API. This server provides tools that can be used by AI assistants (like Claude) through Cursor or other MCP-compatible clients.

## Features

- **Manage Tables**: Create, list, and delete tables in your Xano database
- **Schema Operations**: View and modify table schemas with comprehensive schema editing capabilities
- **Database Management**: Complete toolset for interacting with your Xano database structure

## Prerequisites

- Node.js (v16 or higher)
- npm or another Node.js package manager
- A Xano account with API access
- Cursor, Claude Desktop, Cline or another MCP client.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/xano-mcp.git
cd xano-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `index.ts` and set your Xano credentials:
     - `XANO_API_KEY`: Your Xano API key
     - `XANO_WORKSPACE`: Your Xano workspace ID
     - `XANO_API_BASE`: Your Xano instance API URL (e.g., https://your-instance.xano.io/api:meta)

4. Build the project:
```bash
npm run build
```

## Usage with Claude Desktop

Follow this guide - https://modelcontextprotocol.io/quickstart/user

Update your config with: 

{
  "mcpServers": {
    "xano": {
      "command": "node",
      "args": [
        "/path/to/xano-mcp"
      ]
    }
  }
} 


Replace `/path/to/xano-mcp` with the absolute path to your project directory.


## Usage with Cursor

1. Open Cursor
2. Click "Add MCP Server"
3. Configure the server:
   - Name: `whatever you want to call it`
   - Type: `command`
   - Command: `node /path/to/xano-mcp/build/index.js`

Replace `/path/to/xano-mcp` with the absolute path to your project directory.

Example mac  
node /Users/your-user/Documents/folder-name/xano-mcp/build/index.js

If you're in your're inside your directory you can run the comman 'pwd' into your terminal to get the absolute path.

## Xano MCP Tools Overview

This integration provides a comprehensive set of tools for managing your Xano workspace through the Model Context Protocol (MCP). Here's what you can do:

## Database Management

### Tables
- List all tables in your workspace
- View detailed table schemas
- Create new tables with custom schemas
- Delete existing tables
- Modify table schemas (add/remove/rename columns)

### Schema Operations
- Add new columns with various data types
- Remove columns
- Rename columns
- Update entire table schemas
- Support for complex data types and relationships

## API Management

### API Groups
- Create new API groups
- List all API groups
- Browse APIs within groups
- Enable/disable Swagger documentation
- Manage API group metadata (tags, branches, etc.)

### Individual APIs
- Add new APIs to groups
- Configure HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD)
- Set up API documentation
- Add metadata (tags, descriptions)

## Documentation
- Generate API Group specifications in both markdown (reduced tokens) and JSO (full) formats
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
   
   That's it! The delete-table tool will now be active again.   (After running a new build)

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
2. Restart your MCP server
3. The delete-table tool should now be available in your toolset

### Safety Note
The delete-table tool permanently removes tables from your Xano workspace. Make sure you have appropriate backups before using this functionality. 
