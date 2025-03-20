# Tables Tools

This directory contains tools for managing Xano database tables.

## Tools

### list-tables

Provides a list of all tables in the Xano workspace.

**Parameters**: None

**Returns**: A markdown-formatted list of tables with their IDs, descriptions, creation dates, and other metadata.

### get-table-schema

Returns the schema definition for a specific table.

**Parameters**:
- `table_id` (string): ID of the table to get schema from
- `format` ("markdown" | "json"): Output format preference

**Returns**: The table schema in either markdown or JSON format depending on the format parameter.

### create-table

Creates a new table in the Xano database.

**Parameters**:
- `name` (string): Name of the table
- `description` (string, optional): Description of the table
- `schema` (array, optional): Schema configuration for the table

**Returns**: Confirmation message with the new table ID.

### update-table-schema

Edits the schema of an existing table (adds, removes, or modifies columns).

**Parameters**:
- `table_id` (string): ID of the table to edit
- `operation` ("update" | "add_column" | "rename_column" | "remove_column"): Type of schema operation to perform
- Additional parameters based on the operation type

**Returns**: Confirmation message of the schema update.

### delete-table (Disabled by default)

Deletes a table from the Xano workspace. This tool is disabled by default for safety.

**Parameters**:
- `table_id` (string): ID of the table to delete

**Returns**: Confirmation message upon successful deletion.

## Usage

The tools in this directory are automatically registered with the MCP server in the main index.ts file.