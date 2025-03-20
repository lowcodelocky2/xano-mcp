# API Endpoints Tools

This directory contains tools for managing Xano API endpoints within API groups.

## Tools

### list-apis

Browses APIs (endpoints) in a specific API group.

**Parameters**:
- `apigroup_id` (string): ID of the API group to browse
- `page` (number, optional): Page number for pagination
- `per_page` (number, optional): Number of items per page
- `search` (string, optional): Search term to filter APIs
- `sort` ("created_at" | "updated_at" | "name", optional): Field to sort by
- `order` ("asc" | "desc", optional): Sort order

**Returns**: A markdown-formatted list of APIs in the specified API group.

### create-api

Adds a new API to an API group.

**Parameters**:
- `apigroup_id` (string): ID of the API group to add the API to
- `name` (string): Name of the API
- `description` (string): Description of the API
- `docs` (string, optional): Documentation for the API
- `verb` ("GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "HEAD"): HTTP verb for the API
- `tag` (string[], optional): Tags to associate with the API

**Returns**: Details of the newly created API.

### get-api-details

Gets details for a specific API endpoint.

**Parameters**:
- `apigroup_id` (string): ID of the API group containing the API
- `api_id` (string): ID of the API to get details for

**Returns**: Detailed information about the API endpoint.

### update-api

Updates an existing API endpoint.

**Parameters**:
- `apigroup_id` (string): ID of the API group containing the API
- `api_id` (string): ID of the API to update
- `name` (string): Updated name of the API
- `description` (string): Updated description of the API
- `docs` (string, optional): Updated documentation for the API
- `verb` ("GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "HEAD"): Updated HTTP verb for the API
- `tag` (string[], optional): Updated tags to associate with the API
- `cache` (object, optional): Cache configuration for the API

**Returns**: Details of the updated API.

### delete-api

Deletes an API endpoint from an API group.

**Parameters**:
- `apigroup_id` (string): ID of the API group containing the API
- `api_id` (string): ID of the API to delete

**Returns**: Confirmation message upon successful deletion.

## Usage

The tools in this directory are automatically registered with the MCP server in the main index.ts file.