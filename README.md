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
- Cursor (for using with the AI assistant)

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
   - Edit `.env` and set your Xano credentials:
     - `XANO_API_KEY`: Your Xano API key
     - `XANO_WORKSPACE`: Your Xano workspace ID
     - `XANO_API_BASE`: Your Xano instance API URL (e.g., https://your-instance.xano.io/api:your-api-id)

4. Build the project:
```bash
npm run build
```

## Usage with Cursor

1. Open Cursor
2. Click "Add MCP Server"
3. Configure the server:
   - Name: `whatever you want to call it`
   - Type: `command`
   - Command: `node /path/to/xano-mcp/build/index.js`

Replace `/path/to/xano-mcp` with the absolute path to your project directory.

## Tool Reference

### list-tables

Lists all tables in your Xano workspace with their details.

**Parameters:** None

**Returns:**
- Formatted list of tables with their IDs, descriptions, creation/update times, and tags

**Example Usage:**
```
List all tables in my Xano workspace
```

### get-table-schema

Gets the detailed schema for a specific table.

**Parameters:**
- `table_id` (string, required): ID of the table to retrieve schema from

**Returns:**
- Formatted list of all schema fields with their types, requirements, access levels, and configurations

**Example Usage:**
```
Get the schema for table with ID "123456"
```

### add-table

Creates a new table in the Xano database with optional schema configuration.

**Parameters:**
- `name` (string, required): Name of the new table
- `description` (string, optional): Description of the table
- `schema` (array, optional): Array of schema elements with complete configuration

**Schema Element Properties:**
- `name` (string, required): Name of the schema element
- `type` (string, required): Type of the schema element (text, int, bool, etc.)
- `description` (string, optional): Description of the schema element
- `nullable` (boolean, optional): Whether the field can be null
- `required` (boolean, optional): Whether the field is required
- `access` (string, optional): Access level (public, private, internal)
- `style` (string, optional): Whether the field is a single value or a list
- `default` (string, optional): Default value for the field
- `config` (object, optional): Additional configuration for specific field types
- `children` (array, optional): Nested fields for object types

**Example Usage:**
```
Create a new table named "Customers" with description "Store customer information" and schema with fields for name (text), email (email), and age (int)
```

### delete-table

Deletes a table from the Xano workspace.

**Parameters:**
- `table_id` (string, required): ID of the table to delete

**Example Usage:**
```
Delete the table with ID "123456"
```

### edit-table-schema

Comprehensive tool for editing the schema of an existing table - add, remove, rename columns, or update the entire schema in a single operation.

**Parameters:**
- `table_id` (string, required): ID of the table to edit
- `operation` (string, required): Type of schema operation to perform
  - Options: 'update', 'add_column', 'rename_column', 'remove_column'

**Operation-specific parameters:**

For `operation: 'update'`:
- `schema` (array, required): Full schema specification replacing the existing schema

For `operation: 'add_column'`:
- `column` (object, required): Column specification with:
  - `name` (string, required): Name of the column
  - `type` (string, required): Type of the column
  - `description` (string, optional): Description of the column
  - Other properties as needed (nullable, required, access, style, default, config)

For `operation: 'rename_column'`:
- `rename` (object, required): Rename specification with:
  - `old_name` (string, required): Current name of the column
  - `new_name` (string, required): New name for the column

For `operation: 'remove_column'`:
- `column_name` (string, required): Name of the column to remove

**Example Usages:**

1. Adding a column:
```
Edit table schema for table ID "123456" by adding a new text column called "notes" that is nullable
```

2. Renaming a column:
```
Edit table schema for table ID "123456" by renaming column "user_name" to "username"
```

3. Removing a column:
```
Edit table schema for table ID "123456" by removing the column "temporary_field"
```

4. Updating the entire schema:
```
Edit table schema for table ID "123456" by updating the entire schema with new fields for "id", "name", and "email"
```

## Development

### Project Structure

```
xano-mcp/
├── src/
│   └── index.ts      # Main server implementation
├── build/            # Compiled JavaScript files
├── .env.example      # Example environment variables
├── .env              # Your actual environment variables (git-ignored)
├── package.json      # Project configuration
└── tsconfig.json     # TypeScript configuration
```

### API Configuration

The server is configured to use the Xano API endpoint:
```
https://x6if-wu0q-dtak.n7.xano.io/api:hdUmQe32
```

### Adding New Tools

To add a new tool, use the `server.tool()` method in `src/index.ts`:

```typescript
server.tool(
  "tool-name",
  "Tool description",
  {
    // Zod schema for parameters
    paramName: z.string().describe("Parameter description")
  },
  async ({ paramName }) => {
    // Tool implementation
    return {
      content: [
        {
          type: "text",
          text: "Response text"
        }
      ]
    };
  }
);
```

## Scripts

- `npm run build`: Compile TypeScript and set executable permissions
- `npm start`: Run the compiled server

## Debugging

The server outputs debug information to stderr, which can be viewed when running the server directly:

```bash
node build/index.js
```

## License

ISC 