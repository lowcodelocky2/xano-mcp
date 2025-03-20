# API Groups Tools

This directory contains tools for managing Xano API groups.

## Tools

### create-api-group

Creates a new API group in the Xano workspace.

**Parameters**:
- `name` (string): Name of the API group
- `description` (string): Description of the API group
- `swagger` (boolean): Whether to enable Swagger documentation
- `docs` (string, optional): Documentation for the API group
- `tag` (string[], optional): Tags to associate with the API group
- `branch` (string, optional): Branch name for the API group

**Returns**: Details of the newly created API group.

### list-api-groups

Browses all API groups in the Xano workspace.

**Parameters**:
- `page` (number, optional): Page number for pagination
- `per_page` (number, optional): Number of items per page
- `search` (string, optional): Search term to filter API groups
- `sort` ("created_at" | "updated_at" | "name", optional): Field to sort by
- `order` ("asc" | "desc", optional): Sort order

**Returns**: A markdown-formatted list of API groups.

### get-api-group-details

Gets detailed information for a specific API group.

**Parameters**:
- `apigroup_id` (string): ID of the API group to get details for

**Returns**: Detailed information about the API group.

### update-api-group

Updates an existing API group.

**Parameters**:
- `apigroup_id` (string): ID of the API group to update
- `name` (string): Updated name of the API group
- `description` (string): Updated description of the API group
- `swagger` (boolean): Whether to enable Swagger documentation
- `docs` (string, optional): Updated documentation for the API group
- `tag` (string[], optional): Updated tags to associate with the API group
- `branch` (string, optional): Updated branch name for the API group

**Returns**: Details of the updated API group.

### delete-api-group

Deletes an API group from the workspace.

**Parameters**:
- `apigroup_id` (string): ID of the API group to delete

**Returns**: Confirmation message upon successful deletion.

### get-api-specification

Gets and converts Swagger specification for an API group to a minified markdown format.

**Parameters**:
- `apigroup_id` (string): ID of the API group to get specification for
- `format` ("markdown" | "json"): Output format preference

**Returns**: The API specification in either markdown or JSON format.

## Usage

The tools in this directory are automatically registered with the MCP server in the main index.ts file.