import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Configuration - HARDCODED VALUES - Replace with actual values
const XANO_API_KEY = "eyJhbGciOiJSUzI1NiJ9.eyJ4YW5vIjp7ImRibyI6Im1hc3Rlcjp1c2VyIiwiaWQiOjIyNzMsImFjY2Vzc190b2tlbiI6eyJrZXlpZCI6Ijc3YzgwMjFmLWU1N2EtNDJlMS1iNGZjLTVhNWYxYTUxZjVmOSIsInNjb3BlIjp7IndvcmtzcGFjZTphZGRvbiI6MTUsIndvcmtzcGFjZTphcGkiOjE1LCJ3b3Jrc3BhY2U6Y29udGVudCI6MTUsIndvcmtzcGFjZTpkYXRhYmFzZSI6MTUsIndvcmtzcGFjZTpkYXRhc291cmNlOmxpdmUiOjE1LCJ3b3Jrc3BhY2U6ZmlsZSI6MTUsIndvcmtzcGFjZTpmdW5jdGlvbiI6MTUsIndvcmtzcGFjZTpyZXF1ZXN0aGlzdG9yeSI6MTUsIndvcmtzcGFjZTp0YXNrIjoxNX19fSwiaWF0IjoxNzM4MzY0NDcyLCJuYmYiOjE3MzgzNjQ0NzIsImF1ZCI6Inhhbm86bWV0YSJ9.vouISGScMloQr0iBJl8NYVYolngHUM2gd6vbJPHmet1zwb3IueDOFeX5jN2G_t3LjJEYb9Fm965Ee6uSYMtGBWhoZq_sDeRyiJIDOjW1hHp4lqEDjTtd7owxAzTyn3sULsMvjkPn-HJzu3y26KezuMJF32zpj9kVqosi4OuQoC9UTpRlPVZwkrekgamksMo8vG8IdhYXDSLNlT45QHbLjhNAd3R-CgjrUSh4DPF3P5fhsoi-W4uY3GC0vuLyjBp3W3yNILlEN2kk2q8gOeJSpndxQnhU_nYPb-yWizDWSE0VBDNRtJbaq8E8mnWKE_AbOInupxW-jtd7Cz8ydSLiCUmB6cxfZPIoW_Vd3kKe4IFkdCttw1Yoe90pDuXOs3a-yxarPcdQ9BYk5Lng7QhXTolxvll-utiYWZaNYvlv8opiLU2MgCO2lUV_hsHynqRnhG4HLJGvFUrjnMd1_gZ1y_SbXqD3ldmEyfVnHLixt2OWtx0ACGXm9Kxf8gYnfc_c8o6jOciDj74J87ascvdSE0ByHqeszYBYzRBGKm5Hic37EOp2HucibO4owRTluVt2y31ILjP1UEjuOOKGV9j9JO_bO5KQxkq2V4OpBggbnGsSwjezpG5L77bpYERoTOPaVVSiPK5GG12tlva6OzFt6Aa9LxuQw-37U-wA1wgH6uQ"; // REPLACE WITH YOUR ACTUAL API KEY
const XANO_WORKSPACE = 2; // REPLACE WITH YOUR ACTUAL WORKSPACE ID
const XANO_API_BASE = "https://xhib-njau-6vza.d2.dev.xano.io/api:meta"; // REPLACE IF YOUR BASE URL IS DIFFERENT

// Types
interface DatabaseRecord {
  id: string;
  [key: string]: any;
}

// Xano specific types
interface XanoTable {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface XanoTableSchema {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  nullable?: boolean;
  access?: 'public' | 'private' | 'internal';
  config?: Record<string, any>;
}

// API Group and API interfaces
interface XanoApiGroup {
  id: string;
  name: string;
  description?: string;
  docs?: string;
  created_at: string;
  updated_at: string;
  guid?: string;
  canonical?: string;
  swagger?: boolean;
  documentation?: {
    require_token: boolean;
    token: string;
    link: string;
  };
  branch?: string;
  tag?: string[];
}

interface XanoApi {
  id: string;
  name: string;
  description: string;
  docs?: string;
  guid?: string;
  created_at: string;
  updated_at: string;
  verb: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH' | 'HEAD';
  tag?: string[];
  cache?: {
    active: boolean;
    ttl: number;
    input: boolean;
    auth: boolean;
    datasource: boolean;
    ip: boolean;
    headers: string[];
    env?: string[];
  };
  auth?: Record<string, any>;
  input?: any[];
}

// Server configuration
const SERVER_CONFIG = {
  name: "xano-mcp",
  version: "1.0.0",
  description: "MCP server for interacting with Xano database and APIs",
};

// Create server instance with better configuration
console.error(`[Setup] Creating MCP server: ${SERVER_CONFIG.name} v${SERVER_CONFIG.version}`);
const server = new McpServer({
  name: SERVER_CONFIG.name,
  version: SERVER_CONFIG.version,
});

// Helper function for making Xano API requests
async function makeXanoRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any): Promise<T> {
  try {
    console.error(`[API] Making ${method} request to endpoint: ${endpoint}`);
    if (body) {
      console.error(`[API] Request body: ${JSON.stringify(body, null, 2)}`);
    }
    
    const url = new URL(`${XANO_API_BASE}${endpoint}`);
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XANO_API_KEY}`,
      'X-Workspace': String(XANO_WORKSPACE)
    };

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Error] HTTP error! status: ${response.status}, response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const data = await response.json();
    console.error(`[API] Successfully received response from endpoint: ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`[Error] Failed to make Xano request to ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// List Tables Tool
server.tool(
  "list-tables",
  "Browse all tables in the Xano workspace",
  {},
  async () => {
    console.error('[Tool] Executing list-tables');
    try {
      const response = await makeXanoRequest<{ items: XanoTable[] }>(`/workspace/${XANO_WORKSPACE}/table`);
      const tables = response.items; // Access the 'items' property

      // Format tables into a more readable structure
      const formattedContent = `# Xano Database Tables\n\n${tables.map(table =>
        `## ${table.name}\n` +
        `**ID**: ${table.id}\n` +
        `**Description**: ${table.description || 'No description'}\n` +
        `**Created**: ${new Date(table.created_at).toLocaleString()}\n` +
        `**Updated**: ${new Date(table.updated_at).toLocaleString()}\n` +
        `${table.tags && table.tags.length > 0 ? `**Tags**: ${table.tags.join(', ')}\n` : ''}`
      ).join('\n\n')}`;

      console.error(`[Tool] Successfully listed ${tables.length} tables`);
      return {
        content: [
          {
            type: "text",
            text: formattedContent
          }
        ]
      };
    } catch (error) {
      console.error(`[Error] Failed to list tables: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [
          {
            type: "text",
            text: `Error listing tables: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Get Table Schema Tool
server.tool(
  "get-table-schema",
  "Browse the schema of a table",
  {
    table_id: z.string().describe("ID of the table to get schema from")
  },
  async ({ table_id }) => {
    console.error(`[Tool] Executing get-table-schema for table ID: ${table_id}`);
    try {
      const schema = await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/table/${table_id}/schema`);
      
      // Format schema into readable structure
      const formattedContent = `# Schema for Table ID: ${table_id}\n\n` +
        (Array.isArray(schema) ? 
          schema.map(field => {
            return `## ${field.name} (${field.type})\n` +
              `**Required**: ${field.required ? 'Yes' : 'No'}\n` +
              `**Nullable**: ${field.nullable ? 'Yes' : 'No'}\n` +
              `**Access**: ${field.access || 'public'}\n` +
              `${field.description ? `**Description**: ${field.description}\n` : ''}` +
              `${field.default !== undefined ? `**Default**: ${field.default}\n` : ''}`;
          }).join('\n\n') : 
          `Error: Unexpected schema format: ${JSON.stringify(schema)}`
        );

      console.error(`[Tool] Successfully retrieved schema for table ID: ${table_id}`);
      return {
        content: [
          {
            type: "text",
            text: formattedContent
          }
        ]
      };
    } catch (error) {
      console.error(`[Error] Failed to get table schema: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [
          {
            type: "text",
            text: `Error getting table schema: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add Table Tool with Complete Schema Support
server.tool(
  "add-table",
  "Add a new table to the Xano database",
  {
    name: z.string().describe("Name of the table"),
    description: z.string().optional().describe("Description of the table"),
    schema: z.array(z.object({
      name: z.string().describe("Name of the schema element"),
      type: z.enum([
        "attachment", "audio", "bool", "date", "decimal", "email", "enum", 
        "geo_linestring", "geo_multilinestring", "geo_multipoint", "geo_multipolygon", 
        "geo_point", "geo_polygon", "image", "int", "json", "object", "password", 
        "tableref", "tablerefuuid", "text", "timestamp", "uuid", "vector", "video"
      ]).describe("Type of the schema element"),
      description: z.string().optional().describe("Description of the schema element"),
      nullable: z.boolean().optional().default(false).describe("Whether the field can be null"),
      required: z.boolean().optional().default(false).describe("Whether the field is required"),
      access: z.enum(["public", "private", "internal"]).optional().default("public").describe("Access level for the field"),
      style: z.enum(["single", "list"]).optional().default("single").describe("Whether the field is a single value or a list"),
      default: z.string().optional().describe("Default value for the field"),
      config: z.record(z.any()).optional().describe("Additional configuration for specific field types"),
      validators: z.object({
        lower: z.boolean().optional(),
        max: z.number().optional(),
        maxLength: z.number().optional(),
        min: z.number().optional(),
        minLength: z.number().optional(),
        pattern: z.string().optional(),
        precision: z.number().optional(),
        scale: z.number().optional(),
        trim: z.boolean().optional()
      }).optional().describe("Validation rules for the field"),
      children: z.array(z.any()).optional().describe("Nested fields for object types")
    })).optional().describe("Schema configuration for the table")
  },
  async ({ name, description, schema }) => {
    console.error(`[Tool] Executing add-table for table: ${name}`);
    try {
      // Step 1: Create the table
      const createTableResponse = await makeXanoRequest<{ id: string }>(
        `/workspace/${XANO_WORKSPACE}/table`, 
        'POST', 
        { name, description }
      );
      
      const tableId = createTableResponse.id;
      console.error(`[Tool] Table created with ID: ${tableId}`);
      
      // Step 2: If schema is provided, add it to the table
      if (schema && schema.length > 0) {
        try {
          // Update the entire schema at once
          await makeXanoRequest(
            `/workspace/${XANO_WORKSPACE}/table/${tableId}/schema`, 
            'PUT', 
            { schema }
          );
          console.error(`[Tool] Schema successfully added to table ID: ${tableId}`);
        } catch (schemaError) {
          console.error(`[Error] Failed to add schema: ${schemaError instanceof Error ? schemaError.message : String(schemaError)}`);
          return {
            content: [
              {
                type: "text",
                text: `Table created with ID ${tableId}, but failed to add schema: ${schemaError instanceof Error ? schemaError.message : String(schemaError)}`
              }
            ],
            isError: true
          };
        }
      }
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully created table "${name}" with ID: ${tableId}${schema ? ' and added the specified schema.' : '.'}`
          }
        ]
      };
    } catch (error) {
      console.error(`[Error] Failed to create table: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [
          {
            type: "text",
            text: `Error creating table: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Delete Table Tool
server.tool(
  "delete-table",
  "Delete a table from the Xano workspace",
  {
    table_id: z.string().describe("ID of the table to delete")
  },
  async ({ table_id }) => {
    console.error(`[Tool] Executing delete-table for table ID: ${table_id}`);
    try {
      await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/table/${table_id}`, 'DELETE');
      
      console.error(`[Tool] Successfully deleted table ID: ${table_id}`);
      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted table with ID: ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error(`[Error] Failed to delete table: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [
          {
            type: "text",
            text: `Error deleting table: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Edit Table Schema Tool
server.tool(
  "edit-table-schema",
  "Edit the schema of an existing table (add, remove, or modify columns)",
  {
    table_id: z.string().describe("ID of the table to edit"),
    operation: z.enum(['update', 'add_column', 'rename_column', 'remove_column']).describe("Type of schema operation to perform"),
    
    // For updating the entire schema
    schema: z.array(z.object({
      name: z.string().describe("Name of the schema element"),
      type: z.enum([
        "attachment", "audio", "bool", "date", "decimal", "email", "enum", 
        "geo_linestring", "geo_multilinestring", "geo_multipoint", "geo_multipolygon", 
        "geo_point", "geo_polygon", "image", "int", "json", "object", "password", 
        "tableref", "tablerefuuid", "text", "timestamp", "uuid", "vector", "video"
      ]).describe("Type of the schema element"),
      description: z.string().optional().describe("Description of the schema element"),
      nullable: z.boolean().optional().default(false).describe("Whether the field can be null"),
      required: z.boolean().optional().default(false).describe("Whether the field is required"),
      access: z.enum(["public", "private", "internal"]).optional().default("public").describe("Access level for the field"),
      style: z.enum(["single", "list"]).optional().default("single").describe("Whether the field is a single value or a list"),
      default: z.string().optional().describe("Default value for the field"),
      config: z.record(z.any()).optional().describe("Additional configuration for specific field types"),
      children: z.array(z.any()).optional().describe("Nested fields for object types")
    })).optional().describe("Full schema specification (for 'update' operation)"),
    
    // For adding a single column
    column: z.object({
      name: z.string().describe("Name of the column"),
      type: z.enum([
        "attachment", "audio", "bool", "date", "decimal", "email", "enum", 
        "geo_linestring", "geo_multilinestring", "geo_multipoint", "geo_multipolygon", 
        "geo_point", "geo_polygon", "image", "int", "json", "object", "password", 
        "tableref", "tablerefuuid", "text", "timestamp", "uuid", "vector", "video"
      ]).describe("Type of the column"),
      description: z.string().optional().describe("Description of the column"),
      nullable: z.boolean().optional().default(false).describe("Whether the field can be null"),
      required: z.boolean().optional().default(false).describe("Whether the field is required"),
      access: z.enum(["public", "private", "internal"]).optional().default("public").describe("Access level for the field"),
      style: z.enum(["single", "list"]).optional().default("single").describe("Whether the field is a single value or a list"),
      default: z.string().optional().describe("Default value for the field"),
      config: z.record(z.any()).optional().describe("Additional configuration for the column")
    }).optional().describe("Column specification (for 'add_column' operation)"),
    
    // For renaming a column
    rename: z.object({
      old_name: z.string().describe("Current name of the column"),
      new_name: z.string().describe("New name for the column")
    }).optional().describe("Rename specification (for 'rename_column' operation)"),
    
    // For removing a column
    column_name: z.string().optional().describe("Name of the column to remove (for 'remove_column' operation)")
  },
  async ({ table_id, operation, schema, column, rename, column_name }) => {
    console.error(`[Tool] Executing edit-table-schema for table ID: ${table_id}, operation: ${operation}`);
    
    try {
      let result;
      let successMessage = "";
      
      switch (operation) {
        case 'update':
          if (!schema || schema.length === 0) {
            return {
              content: [{ type: "text", text: "Error: Schema array must be provided for 'update' operation" }],
              isError: true
            };
          }
          
          // PUT request to update the entire schema
          await makeXanoRequest(
            `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema`,
            'PUT',
            { schema }
          );
          
          successMessage = `Successfully updated the entire schema for table ID: ${table_id}`;
          break;
          
        case 'add_column':
          if (!column) {
            return {
              content: [{ type: "text", text: "Error: Column specification must be provided for 'add_column' operation" }],
              isError: true
            };
          }
          
          // POST request to add a new column of the specified type
          await makeXanoRequest(
            `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/type/${column.type}`,
            'POST',
            column
          );
          
          successMessage = `Successfully added column '${column.name}' of type '${column.type}' to table ID: ${table_id}`;
          break;
          
        case 'rename_column':
          if (!rename) {
            return {
              content: [{ type: "text", text: "Error: Rename specification must be provided for 'rename_column' operation" }],
              isError: true
            };
          }
          
          // POST request to rename a column
          await makeXanoRequest(
            `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/rename`,
            'POST',
            rename
          );
          
          successMessage = `Successfully renamed column from '${rename.old_name}' to '${rename.new_name}' in table ID: ${table_id}`;
          break;
          
        case 'remove_column':
          if (!column_name) {
            return {
              content: [{ type: "text", text: "Error: Column name must be provided for 'remove_column' operation" }],
              isError: true
            };
          }
          
          // DELETE request to remove a column
          await makeXanoRequest(
            `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/${column_name}`,
            'DELETE'
          );
          
          successMessage = `Successfully removed column '${column_name}' from table ID: ${table_id}`;
          break;
      }
      
      console.error(`[Tool] ${successMessage}`);
      return {
        content: [{ type: "text", text: successMessage }]
      };
      
    } catch (error) {
      console.error(`[Error] Failed to edit table schema: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [
          {
            type: "text",
            text: `Error editing table schema: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Get API Specification Tool
server.tool(
  "get-api-spec",
  "Get and convert Swagger specification for an API group to a minified markdown format",
  {
    apigroup_id: z.string().describe("ID of the API group to get specification for"),
    format: z.enum(["markdown", "json"]).default("markdown").describe("Output format: 'markdown' for concise documentation or 'json' for full specification")
  },
  async ({ apigroup_id, format }) => {
    console.error(`[Tool] Executing get-api-spec for API group ID: ${apigroup_id} with format: ${format}`);
    try {
      // Step 1: Get the API group details to find the Swagger spec link
      const apiGroup = await makeXanoRequest<XanoApiGroup>(`/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}`);
      
      if (!apiGroup.swagger || !apiGroup.documentation || !apiGroup.documentation.link) {
        return {
          content: [
            {
              type: "text",
              text: `API group (ID: ${apigroup_id}) does not have Swagger documentation available.`
            }
          ],
          isError: true
        };
      }
      
      console.error(`[Tool] Found Swagger spec link: ${apiGroup.documentation.link}`);
      
      // Step 2: Fetch the Swagger JSON specification
      const swaggerResponse = await fetch(apiGroup.documentation.link);
      if (!swaggerResponse.ok) {
        throw new Error(`Failed to fetch Swagger spec: ${swaggerResponse.statusText}`);
      }
      
      const swaggerSpec = await swaggerResponse.json();
      console.error(`[Tool] Successfully retrieved Swagger specification`);
      
      // Step 3: Process the spec based on format
      if (format === "json") {
        // Return the full JSON specification
        return {
          content: [
            {
              type: "text",
              text: `# ${apiGroup.name} API Specification (Full JSON)\n\n\`\`\`json\n${JSON.stringify(swaggerSpec, null, 2)}\n\`\`\``
            }
          ]
        };
      } else {
        // Process the Swagger spec into a minified markdown format
        const markdown = processSwaggerToMarkdown(swaggerSpec, apiGroup.name);
        
        return {
          content: [
            {
              type: "text",
              text: markdown
            }
          ]
        };
      }
    } catch (error) {
      console.error(`[Error] Failed to get API spec: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [
          {
            type: "text",
            text: `Error getting API specification: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Helper function to process Swagger spec into concise markdown
function processSwaggerToMarkdown(swaggerSpec: any, apiGroupName: string): string {
  try {
    console.error(`[Process] Converting Swagger spec to markdown for: ${apiGroupName}`);
    
    // Extract basic API information
    const info = swaggerSpec.info || {};
    const server = swaggerSpec.servers?.[0]?.url || 'https://';
    const baseUrl = server;
    
    // Build the markdown content
    let markdown = `# ${apiGroupName} API\n\n`;
    markdown += `## API Info\n`;
    markdown += `- Title: ${info.title || apiGroupName}\n`;
    markdown += `- Version: ${info.version || 'N/A'}\n`;
    markdown += `- Base URL: ${baseUrl}\n\n`;
    
    // Common responses
    markdown += `## Responses\n`;
    markdown += `| Code | Description |\n`;
    markdown += `|------|-------------|\n`;
    markdown += `| 200  | Success!    |\n`;
    markdown += `| 400  | Input Error |\n`;
    markdown += `| 401  | Unauthorized|\n`;
    markdown += `| 403  | Access Denied|\n`;
    markdown += `| 404  | Not Found  |\n`;
    markdown += `| 429  | Rate Limited|\n`;
    markdown += `| 500  | Server Error|\n\n`;
    
    // Process endpoints
    markdown += `## Endpoints\n\n`;
    const paths = swaggerSpec.paths || {};
    const pathKeys = Object.keys(paths).sort();
    
    for (const path of pathKeys) {
      const pathInfo = paths[path];
      const methods = Object.keys(pathInfo).filter(m => ['get', 'post', 'put', 'delete', 'patch'].includes(m.toLowerCase()));
      
      for (const method of methods) {
        const operation = pathInfo[method];
        markdown += `### ${method.toUpperCase()} ${path}\n`;
        markdown += `${operation.summary || 'No summary'}\n`;
        
        // Parameters
        const parameters = operation.parameters || [];
        if (parameters.length > 0) {
          markdown += `| Param | In | Req | Type |\n`;
          markdown += `|-------|----|-----|------|\n`;
          for (const param of parameters) {
            markdown += `| ${param.name} | ${param.in} | ${param.required ? 'Y' : 'N'} | ${param.schema?.type || 'unknown'} |\n`;
          }
        }
        markdown += '\n';
      }
    }
    
    // Authentication
    const securitySchemes = swaggerSpec.components?.securitySchemes || {};
    if (Object.keys(securitySchemes).length > 0) {
      markdown += `## Auth\n`;
      for (const name in securitySchemes) {
        const scheme = securitySchemes[name];
        markdown += `- ${name}: ${scheme.type}`;
        if (scheme.scheme) markdown += ` (${scheme.scheme})`;
        markdown += '\n';
      }
    }
    
    console.error(`[Process] Successfully converted Swagger spec to markdown`);
    return markdown;
    
  } catch (error) {
    console.error(`[Error] Error processing Swagger to Markdown: ${error instanceof Error ? error.message : String(error)}`);
    return `# Error\n\n${error instanceof Error ? error.message : String(error)}`;
  }
}

// Create API Group Tool
server.tool(
  "create-api-group",
  "Create a new API group in the Xano workspace",
  {
    name: z.string().describe("Name of the API group"),
    description: z.string().describe("Description of the API group"),
    swagger: z.boolean().describe("Whether to enable Swagger documentation"),
    docs: z.string().optional().describe("Documentation for the API group"),
    tag: z.array(z.string()).optional().nullable().describe("Tags to associate with the API group"),
    branch: z.string().optional().describe("Branch name for the API group")
  },
  async ({ name, description, swagger, docs, tag, branch }) => {
    console.error(`[Tool] Executing create-api-group for name: ${name}`);
    try {
      const requestBody = {
        name,
        description,
        swagger,
        ...(docs !== undefined && { docs }),
        ...(tag !== undefined && { tag }),
        ...(branch !== undefined && { branch })
      };
      
      const response = await makeXanoRequest<XanoApiGroup>(
        `/workspace/${XANO_WORKSPACE}/apigroup`,
        'POST',
        requestBody
      );
      
      console.error(`[Tool] Successfully created API group "${name}" with ID: ${response.id}`);
      
      const formattedContent = `# API Group Created\n\n` +
        `**Name**: ${response.name}\n` +
        `**ID**: ${response.id}\n` +
        `**Description**: ${response.description || 'No description'}\n` +
        `${response.docs ? `**Documentation**: ${response.docs}\n` : ''}` +
        `**Swagger Documentation**: ${response.swagger ? 'Enabled' : 'Disabled'}\n` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}\n` +
        `**Updated**: ${new Date(response.updated_at).toLocaleString()}\n` +
        `${response.guid ? `**GUID**: ${response.guid}\n` : ''}` +
        `${response.canonical ? `**Canonical**: ${response.canonical}\n` : ''}` +
        `${response.branch ? `**Branch**: ${response.branch}\n` : ''}` +
        `${response.tag && response.tag.length > 0 ? `**Tags**: ${response.tag.join(', ')}\n` : ''}`;
      
      return {
        content: [
          {
            type: "text",
            text: formattedContent
          }
        ]
      };
    } catch (error) {
      console.error(`[Error] Failed to create API group: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [
          {
            type: "text",
            text: `Error creating API group: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// List API Groups Tool
server.tool(
  "list-api-groups",
  "Browse all API groups in the Xano workspace",
  {
    page: z.number().optional().describe("Page number for pagination"),
    per_page: z.number().optional().describe("Number of items per page"),
    search: z.string().optional().describe("Search term to filter API groups"),
    sort: z.enum(["created_at", "updated_at", "name"]).optional().describe("Field to sort by"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order")
  },
  async ({ page, per_page, search, sort, order }) => {
    console.error('[Tool] Executing list-api-groups');
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (page !== undefined) queryParams.append("page", page.toString());
      if (per_page !== undefined) queryParams.append("per_page", per_page.toString());
      if (search) queryParams.append("search", search);
      if (sort) queryParams.append("sort", sort);
      if (order) queryParams.append("order", order);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      const response = await makeXanoRequest<{ items: XanoApiGroup[], curPage: number, nextPage?: number, prevPage?: number }>(
        `/workspace/${XANO_WORKSPACE}/apigroup${queryString}`
      );
      
      const apiGroups = response.items;
      
      // Format API groups into a readable structure
      const formattedContent = `# Xano API Groups\n\n` +
        `Page ${response.curPage}${response.nextPage ? ` (Next: ${response.nextPage})` : ''}${response.prevPage ? ` (Prev: ${response.prevPage})` : ''}\n\n` +
        `${apiGroups.map(group =>
          `## ${group.name}\n` +
          `**ID**: ${group.id}\n` +
          `**Description**: ${group.description || 'No description'}\n` +
          `**Created**: ${new Date(group.created_at).toLocaleString()}\n` +
          `**Updated**: ${new Date(group.updated_at).toLocaleString()}\n` +
          `${group.guid ? `**GUID**: ${group.guid}\n` : ''}`
        ).join('\n\n')}`;

      console.error(`[Tool] Successfully listed ${apiGroups.length} API groups`);
      return {
        content: [
          {
            type: "text",
            text: formattedContent
          }
        ]
      };
    } catch (error) {
      console.error(`[Error] Failed to list API groups: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [
          {
            type: "text",
            text: `Error listing API groups: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Browse APIs in an API Group Tool
server.tool(
  "browse-apis",
  "Browse APIs in a specific API group",
  {
    apigroup_id: z.string().describe("ID of the API group to browse"),
    page: z.number().optional().describe("Page number for pagination"),
    per_page: z.number().optional().describe("Number of items per page"),
    search: z.string().optional().describe("Search term to filter APIs"),
    sort: z.enum(["created_at", "updated_at", "name"]).optional().describe("Field to sort by"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order")
  },
  async ({ apigroup_id, page, per_page, search, sort, order }) => {
    console.error(`[Tool] Executing browse-apis for API group ID: ${apigroup_id}`);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (page !== undefined) queryParams.append("page", page.toString());
      if (per_page !== undefined) queryParams.append("per_page", per_page.toString());
      if (search) queryParams.append("search", search);
      if (sort) queryParams.append("sort", sort);
      if (order) queryParams.append("order", order);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      const response = await makeXanoRequest<{ items: XanoApi[], curPage: number, nextPage?: number, prevPage?: number }>(
        `/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}/api${queryString}`
      );
      
      const apis = response.items;
      
      // Format APIs into a readable structure
      const formattedContent = `# APIs in API Group ID: ${apigroup_id}\n\n` +
        `Page ${response.curPage}${response.nextPage ? ` (Next: ${response.nextPage})` : ''}${response.prevPage ? ` (Prev: ${response.prevPage})` : ''}\n\n` +
        `${apis.map(api =>
          `## ${api.name}\n` +
          `**ID**: ${api.id}\n` +
          `**Verb**: ${api.verb}\n` +
          `**Description**: ${api.description || 'No description'}\n` +
          `${api.docs ? `**Documentation**: ${api.docs}\n` : ''}` +
          `**Created**: ${new Date(api.created_at).toLocaleString()}\n` +
          `**Updated**: ${new Date(api.updated_at).toLocaleString()}\n` +
          `${api.guid ? `**GUID**: ${api.guid}\n` : ''}` +
          `${api.tag && api.tag.length > 0 ? `**Tags**: ${api.tag.join(', ')}\n` : ''}`
        ).join('\n\n')}`;

      console.error(`[Tool] Successfully listed ${apis.length} APIs for API group ID: ${apigroup_id}`);
      return {
        content: [
          {
            type: "text",
            text: formattedContent
          }
        ]
      };
    } catch (error) {
      console.error(`[Error] Failed to browse APIs: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [
          {
            type: "text",
            text: `Error browsing APIs: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add API to API Group Tool
server.tool(
  "add-api",
  "Add a new API to an API group",
  {
    apigroup_id: z.string().describe("ID of the API group to add the API to"),
    name: z.string().describe("Name of the API"),
    description: z.string().describe("Description of the API"),
    docs: z.string().optional().describe("Documentation for the API"),
    verb: z.enum(["GET", "POST", "DELETE", "PUT", "PATCH", "HEAD"]).describe("HTTP verb for the API"),
    tag: z.array(z.string()).optional().describe("Tags to associate with the API")
  },
  async ({ apigroup_id, name, description, docs, verb, tag }) => {
    console.error(`[Tool] Executing add-api for API group ID: ${apigroup_id}`);
    try {
      const requestBody = {
        name,
        description,
        verb,
        ...(docs !== undefined && { docs }),
        ...(tag !== undefined && { tag })
      };
      
      const response = await makeXanoRequest<XanoApi>(
        `/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}/api`,
        'POST',
        requestBody
      );
      
      console.error(`[Tool] Successfully added API "${name}" with ID: ${response.id} to API group ID: ${apigroup_id}`);
      
      const formattedContent = `# API Added\n\n` +
        `**Name**: ${response.name}\n` +
        `**ID**: ${response.id}\n` +
        `**API Group ID**: ${apigroup_id}\n` +
        `**Verb**: ${response.verb}\n` +
        `**Description**: ${response.description}\n` +
        `${response.docs ? `**Documentation**: ${response.docs}\n` : ''}` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}\n` +
        `${response.guid ? `**GUID**: ${response.guid}\n` : ''}` +
        `${response.tag && response.tag.length > 0 ? `**Tags**: ${response.tag.join(', ')}\n` : ''}`;
      
      return {
        content: [
          {
            type: "text",
            text: formattedContent
          }
        ]
      };
    } catch (error) {
      console.error(`[Error] Failed to add API: ${error instanceof Error ? error.message : String(error)}`);
      return {
        content: [
          {
            type: "text",
            text: `Error adding API: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Start the server
async function main() {
  console.error("Starting MCP server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Xano MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
