# Xano MCP Server Development Plan

This document outlines the plan for developing an MCP server to interact with the Xano API, specifically focusing on table and schema management.

## Project Setup

*   Project Location: `/Users/locky/Documents/GitHub/xano-mcp`
*   Dependencies: `@modelcontextprotocol/sdk`, `zod` (ensure these are installed)
*   Modify `src/index.ts`:
    *   Remove existing tool definitions.
    *   Update server configuration with:
        *   API Base URL: `https://xhib-njau-6vza.d2.dev.xano.io`
        *   Workspace ID: `2`
        *   API Key: (To be provided by the user and added to the environment variables)

## API Client

A helper function `makeXanoRequest` (to be modified from existing code) will handle API requests:

*   Constructs the full API URL.
*   Includes the API key in the `Authorization` header (Bearer token).
*   Includes the workspace ID in the `X-Workspace` header.
*   Handles different HTTP methods (GET, POST, PUT, and DELETE).
*   Accepts a request body for POST and PUT requests.
*   Parses JSON responses.
*   Handles errors and throws `McpError`.

## Tools

The following tools will be implemented:

1.  **`list_tables`**:
    *   **Description:** Browse workspace tables.
    *   **Endpoint:** `GET /workspace/{workspace_id}/table`
    *   **Input:** None (or a dummy parameter as required by the SDK).
    *   **Output:** A list of tables, including their IDs and names.
    *   **Implementation:** Call `makeXanoRequest` with the appropriate endpoint and workspace ID.

2.  **`add_table`**:
    *   **Description:** Add a workspace table.
    *   **Endpoint:** `POST /workspace/{workspace_id}/table`
    *   **Input:**
        *   `name`: (string, required) The name of the table.
        *   `description`: (string, optional) A description of the table.
    *   **Output:** Confirmation message with the new table's ID and name.
    *   **Implementation:** Call `makeXanoRequest` with the appropriate endpoint, workspace ID, and request body.

3.  **`delete_table`**:
    *   **Description:** Delete a workspace table.
    *   **Endpoint:** `DELETE /workspace/{workspace_id}/table/{table_id}`
    *   **Input:**
        *   `table_id`: (string, required) The ID of the table to delete.
    *   **Output:** Confirmation message.
    *   **Implementation:** Call `makeXanoRequest` with the appropriate endpoint, workspace ID, and table ID.

4.  **`get_table_schema`**:
    *   **Description:** Get the schema of a workspace table.
    *   **Endpoint:** `GET /workspace/{workspace_id}/table/{table_id}/schema`
    *   **Input:**
        *   `table_id`: (string, required) The ID of the table.
    *   **Output:** The table schema in JSON format.
    *   **Implementation:** Call `makeXanoRequest` with the appropriate endpoint and workspace ID.

5.  **`update_table_schema`**:
    *   **Description:** Update the schema of a workspace table (batch update).
    *   **Endpoint:** `POST /workspace/{workspace_id}/table/{table_id}/schema/type/{schema_name}` (for adding) and `DELETE /workspace/{workspace_id}/table/{table_id}/schema/{schema_name}` (for deleting), and `POST /workspace/{workspace_id}/table/{table_id}/schema/rename` (for renaming).
    *   **Input:**
        *   `table_id`: (string, required) The ID of the table.
        *   `schema_updates`: (array, required) An array of schema update objects. Each object should specify:
            *   `action`: (string, required) The action: "add", "delete", or "rename".
            *   `name`: (string, required) The name of the schema field.
            *   `type`: (string, required for "add") The data type of the field.
            *   `options`: (object, optional) Additional options (e.g., `nullable`, `default`).
            *   `new_name`: (string, required for "rename") The new name for the field (only for rename action).
    *   **Output:** Confirmation message.
    *   **Implementation:** Iterate through `schema_updates` and call `makeXanoRequest` for each update, using the appropriate endpoint and request body based on the `action`.

## Available Schema Types

The following schema types are available, based on the `api-spec.json` file:

*   int
*   text
*   boolean
*   timestamp
*   email
*   password
*   object
*   enum
*   image
*   video
*   audio
*   attachment
*   geo_point
*   geo_linestring
*   geo_multipoint
*   geo_multipolygon
*   decimal
*   tableref
*   tablerefuuid
*   vector

## Error Handling

*   `makeXanoRequest` will handle API errors and throw `McpError`.
*   Tools will handle errors and return error messages in the `content` array.

## Testing

*   Each tool will be tested thoroughly with valid and invalid inputs.
*   Output format will be verified.
*   Test results will be documented.

## Documentation

*   Update `README.md` with information about the MCP server and its tools.

## Configuration

*   Update `cline_mcp_settings.json` with the server configuration.