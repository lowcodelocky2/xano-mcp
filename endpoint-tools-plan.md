# Xano MCP Endpoint Tools Plan

## Tool Implementation Template

Based on the existing implementations, each tool would follow this pattern:

```typescript
server.tool(
  "descriptive-tool-name", // Kebab-case, descriptive name
  "Clear description of what the tool does",
  {
    // Zod schema for parameters - derived from API endpoint parameters
    param1: z.string().describe("Description of parameter 1"),
    param2: z.number().optional().describe("Description of parameter 2"),
    // etc.
  },
  async ({ param1, param2 }) => {
    console.error(`[Tool] Executing descriptive-tool-name with params: ${param1}, ${param2}`);
    try {
      // Make request to Xano API
      const response = await makeXanoRequest<ResponseType>(
        `/endpoint/path/${param1}`, 
        'HTTP_METHOD',
        requestBodyIfNeeded
      );
      
      // Format response for user
      const formattedContent = formatResponseToMarkdown(response);
      
      return {
        content: [{ type: "text", text: formattedContent }]
      };
    } catch (error) {
      console.error(`[Error] Failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [{ 
          type: "text", 
          text: `Error: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true
      };
    }
  }
);
```

## Proposed Endpoint Tools

Here's a sample of how we would rename and structure tools for the Xano API endpoints:

### Workspace Management

1. `list-workspaces` - GET /workspace - List all workspaces
2. `get-workspace-details` - GET /workspace/{workspace_id} - Get details for a specific workspace

### Table Management

3. `list-tables` (existing) - GET /workspace/{workspace_id}/table - List all tables
4. `get-table-details` - GET /workspace/{workspace_id}/table/{table_id} - Get table details
5. `create-table` - POST /workspace/{workspace_id}/table - Create a new table
6. `update-table` - PUT /workspace/{workspace_id}/table/{table_id} - Update a table
7. `delete-table` (commented out) - DELETE /workspace/{workspace_id}/table/{table_id} - Delete a table
8. `get-table-schema` (existing) - GET /workspace/{workspace_id}/table/{table_id}/schema - Get table schema
9. `update-table-schema` - PUT /workspace/{workspace_id}/table/{table_id}/schema - Update table schema

### Column Management

10. `add-column` - POST /workspace/{workspace_id}/table/{table_id}/schema/type/{type} - Add column
11. `update-column` - PUT /workspace/{workspace_id}/table/{table_id}/schema/{column_name} - Update column
12. `delete-column` - DELETE /workspace/{workspace_id}/table/{table_id}/schema/{column_name} - Delete column
13. `rename-column` - POST /workspace/{workspace_id}/table/{table_id}/schema/rename - Rename column

### API Group Management

14. `list-api-groups` (existing) - GET /workspace/{workspace_id}/apigroup - List API groups
15. `create-api-group` (existing) - POST /workspace/{workspace_id}/apigroup - Create API group
16. `get-api-group-details` - GET /workspace/{workspace_id}/apigroup/{apigroup_id} - Get API group details
17. `update-api-group` - PUT /workspace/{workspace_id}/apigroup/{apigroup_id} - Update API group
18. `delete-api-group` - DELETE /workspace/{workspace_id}/apigroup/{apigroup_id} - Delete API group

### API Endpoint Management

19. `list-apis` (existing as browse-apis) - GET /workspace/{workspace_id}/apigroup/{apigroup_id}/api - List APIs
20. `create-api` (existing as add-api) - POST /workspace/{workspace_id}/apigroup/{apigroup_id}/api - Create API
21. `get-api-details` - GET /workspace/{workspace_id}/apigroup/{apigroup_id}/api/{api_id} - Get API details
22. `update-api` - PUT /workspace/{workspace_id}/apigroup/{apigroup_id}/api/{api_id} - Update API
23. `delete-api` - DELETE /workspace/{workspace_id}/apigroup/{apigroup_id}/api/{api_id} - Delete API

### API Documentation

24. `get-api-specification` (existing as get-api-spec) - Custom tool using Swagger link - Get API specification

### Branch Management

25. `list-branches` - GET /workspace/{workspace_id}/branch - List branches
26. `create-branch` - POST /workspace/{workspace_id}/branch - Create branch
27. `get-branch-details` - GET /workspace/{workspace_id}/branch/{branch_id} - Get branch details
28. `update-branch` - PUT /workspace/{workspace_id}/branch/{branch_id} - Update branch
29. `delete-branch` - DELETE /workspace/{workspace_id}/branch/{branch_id} - Delete branch

### Function Management

30. `list-functions` - GET /workspace/{workspace_id}/function - List functions
31. `create-function` - POST /workspace/{workspace_id}/function - Create function
32. `get-function-details` - GET /workspace/{workspace_id}/function/{function_id} - Get function details
33. `update-function` - PUT /workspace/{workspace_id}/function/{function_id} - Update function
34. `delete-function` - DELETE /workspace/{workspace_id}/function/{function_id} - Delete function

### Task Management

35. `list-tasks` - GET /workspace/{workspace_id}/task - List tasks
36. `create-task` - POST /workspace/{workspace_id}/task - Create task
37. `get-task-details` - GET /workspace/{workspace_id}/task/{task_id} - Get task details
38. `update-task` - PUT /workspace/{workspace_id}/task/{task_id} - Update task
39. `delete-task` - DELETE /workspace/{workspace_id}/task/{task_id} - Delete task

... and so on for the remaining endpoints.

## Implementation Strategy

Given the large number of endpoints (78 paths with 102 operations), I recommend a phased approach:

1. Group related endpoints (tables, schemas, API groups, etc.)
2. Implement most frequently used operations first
3. Follow a consistent naming convention: `action-resource-type`
4. Ensure comprehensive error handling and documentation

Each tool should have:
- Clear, descriptive name
- Comprehensive description
- Well-documented parameters
- Proper error handling
- Formatted, readable output

For optimal user experience, the tools should follow these patterns:
- List operations: `list-resources`
- Create operations: `create-resource`
- Read operations: `get-resource-details`
- Update operations: `update-resource`
- Delete operations: `delete-resource`