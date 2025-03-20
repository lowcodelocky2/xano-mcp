import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// No unused imports
import {} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Verify required environment variables are set
const requiredEnvVars = ["XANO_API_KEY", "XANO_WORKSPACE", "XANO_API_BASE"];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`[Error] Missing required environment variables: ${missingEnvVars.join(", ")}`);
  console.error("[Error] Please add these variables to your .env file");
  process.exit(1);
}

// Configuration - Using environment variables
const XANO_API_KEY = process.env.XANO_API_KEY!; // API key from environment variables
const XANO_WORKSPACE = parseInt(process.env.XANO_WORKSPACE!) || 1; // Workspace ID from environment variables
const XANO_API_BASE = process.env.XANO_API_BASE!; // API base URL from environment variables

// Xano specific types
interface XanoTable {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// Removed unused interface

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
  verb: "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "HEAD";
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
async function makeXanoRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any
): Promise<T> {
  try {
    console.error(`[API] Making ${method} request to endpoint: ${endpoint}`);
    if (body) {
      console.error(`[API] Request body: ${JSON.stringify(body, null, 2)}`);
    }

    const url = new URL(`${XANO_API_BASE}${endpoint}`);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XANO_API_KEY}`,
      "X-Workspace": String(XANO_WORKSPACE),
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
    console.error(
      `[Error] Failed to make Xano request to ${endpoint}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}

// List Tables Tool
server.tool("list-tables", "Browse all tables in the Xano workspace", {}, async () => {
  console.error("[Tool] Executing list-tables");
  try {
    const response = await makeXanoRequest<{ items: XanoTable[] }>(
      `/workspace/${XANO_WORKSPACE}/table`
    );
    const tables = response.items; // Access the 'items' property

    // Format tables into a more readable structure
    const formattedContent = `# Xano Database Tables\n\n${tables
      .map(
        table =>
          `## ${table.name}\n` +
          `**ID**: ${table.id}\n` +
          `**Description**: ${table.description || "No description"}\n` +
          `**Created**: ${new Date(table.created_at).toLocaleString()}\n` +
          `**Updated**: ${new Date(table.updated_at).toLocaleString()}\n` +
          `${table.tags && table.tags.length > 0 ? `**Tags**: ${table.tags.join(", ")}\n` : ""}`
      )
      .join("\n\n")}`;

    console.error(`[Tool] Successfully listed ${tables.length} tables`);
    return {
      content: [
        {
          type: "text",
          text: formattedContent,
        },
      ],
    };
  } catch (error) {
    console.error(
      `[Error] Failed to list tables: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      content: [
        {
          type: "text",
          text: `Error listing tables: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Get Table Schema Tool
server.tool(
  "get-table-schema",
  "Browse the schema of a table",
  {
    table_id: z.string().describe("ID of the table to get schema from"),
    format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe(
        "Output format: 'markdown' for readable documentation or 'json' for complete schema"
      ),
  },
  async ({ table_id, format }) => {
    console.error(
      `[Tool] Executing get-table-schema for table ID: ${table_id} with format: ${format}`
    );
    try {
      const schema = await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/table/${table_id}/schema`);

      if (format === "json") {
        // Return the complete JSON schema
        return {
          content: [
            {
              type: "text",
              text: `# Table Schema (Full JSON)\n\n\`\`\`json\n${JSON.stringify(
                schema,
                null,
                2
              )}\n\`\`\``,
            },
          ],
        };
      } else {
        // Format schema into readable structure
        const formattedContent =
          `# Schema for Table ID: ${table_id}\n\n` +
          (Array.isArray(schema)
            ? schema
                .map(field => {
                  let content = `## ${field.name} (${field.type})\n`;
                  content += `**Required**: ${field.required ? "Yes" : "No"}\n`;
                  content += `**Nullable**: ${field.nullable ? "Yes" : "No"}\n`;
                  content += `**Access**: ${field.access || "public"}\n`;
                  content += `**Style**: ${field.style || "single"}\n`;
                  if (field.description) content += `**Description**: ${field.description}\n`;
                  if (field.default !== undefined) content += `**Default**: ${field.default}\n`;
                  if (field.config && Object.keys(field.config).length > 0) {
                    content += `**Config**:\n\`\`\`json\n${JSON.stringify(
                      field.config,
                      null,
                      2
                    )}\n\`\`\`\n`;
                  }
                  if (field.validators && Object.keys(field.validators).length > 0) {
                    content += `**Validators**:\n\`\`\`json\n${JSON.stringify(
                      field.validators,
                      null,
                      2
                    )}\n\`\`\`\n`;
                  }
                  if (field.children && field.children.length > 0) {
                    content += `**Children**:\n\`\`\`json\n${JSON.stringify(
                      field.children,
                      null,
                      2
                    )}\n\`\`\`\n`;
                  }
                  return content;
                })
                .join("\n\n")
            : `Error: Unexpected schema format: ${JSON.stringify(schema)}`);

        console.error(`[Tool] Successfully retrieved schema for table ID: ${table_id}`);
        return {
          content: [
            {
              type: "text",
              text: formattedContent,
            },
          ],
        };
      }
    } catch (error) {
      console.error(
        `[Error] Failed to get table schema: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error getting table schema: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Create Table Tool with Complete Schema Support
server.tool(
  "create-table",
  "Add a new table to the Xano database",
  {
    name: z.string().describe("Name of the table"),
    description: z.string().optional().describe("Description of the table"),
    schema: z
      .array(
        z.object({
          name: z.string().describe("Name of the schema element"),
          type: z
            .enum([
              "attachment",
              "audio",
              "bool",
              "date",
              "decimal",
              "email",
              "enum",
              "geo_linestring",
              "geo_multilinestring",
              "geo_multipoint",
              "geo_multipolygon",
              "geo_point",
              "geo_polygon",
              "image",
              "int",
              "json",
              "object",
              "password",
              "tablerefuuid",
              "text",
              "timestamp",
              "uuid",
              "vector",
              "video",
            ])
            .describe("Type of the schema element"),
          description: z.string().optional().describe("Description of the schema element"),
          nullable: z.boolean().optional().default(false).describe("Whether the field can be null"),
          required: z.boolean().optional().default(false).describe("Whether the field is required"),
          access: z
            .enum(["public", "private", "internal"])
            .optional()
            .default("public")
            .describe("Access level for the field"),
          style: z
            .enum(["single", "list"])
            .optional()
            .default("single")
            .describe("Whether the field is a single value or a list"),
          default: z.string().optional().describe("Default value for the field"),
          config: z
            .record(z.any())
            .optional()
            .describe("Additional configuration for specific field types"),
          validators: z
            .object({
              lower: z.boolean().optional(),
              max: z.number().optional(),
              maxLength: z.number().optional(),
              min: z.number().optional(),
              minLength: z.number().optional(),
              pattern: z.string().optional(),
              precision: z.number().optional(),
              scale: z.number().optional(),
              trim: z.boolean().optional(),
            })
            .optional()
            .describe("Validation rules for the field"),
          children: z.array(z.any()).optional().describe("Nested fields for object types"),
          tableref_id: z
            .string()
            .optional()
            .describe("ID of the referenced table (only valid when type is 'int')"),
          values: z
            .array(z.string())
            .optional()
            .describe("Array of allowed values (only for enum type)"),
        })
      )
      .optional()
      .describe(`Schema configuration for the table. For foreign key relationships, use type 'int' with tableref_id. Example:
    {
      "name": "contact_id",
      "type": "int",
      "description": "Reference to contact table",
      "nullable": false,
      "required": false,
      "access": "public",
      "style": "single",
      "default": "0",
      "tableref_id": "100"  // ID of the table to reference
    }`),
  },
  async ({ name, description, schema }) => {
    console.error(`[Tool] Executing add-table for table: ${name}`);
    try {
      // Step 1: Create the table
      const createTableResponse = await makeXanoRequest<{ id: string }>(
        `/workspace/${XANO_WORKSPACE}/table`,
        "POST",
        { name, description }
      );

      const tableId = createTableResponse.id;
      console.error(`[Tool] Table created with ID: ${tableId}`);

      // Step 2: If schema is provided, process and add it to the table
      if (schema && schema.length > 0) {
        try {
          // Process schema fields to handle relationships
          const processedSchema = schema.map(field => {
            // Validate relationship fields
            if (field.tableref_id && field.type !== "int") {
              throw new Error(
                `Field "${field.name}" has tableref_id but type is not "int". Foreign key fields must be of type "int".`
              );
            }

            return field;
          });

          // Update the schema with processed fields
          await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/table/${tableId}/schema`, "PUT", {
            schema: processedSchema,
          });
          console.error(`[Tool] Schema successfully added to table ID: ${tableId}`);
        } catch (schemaError) {
          console.error(
            `[Error] Failed to add schema: ${
              schemaError instanceof Error ? schemaError.message : String(schemaError)
            }`
          );
          return {
            content: [
              {
                type: "text",
                text: `Table created with ID ${tableId}, but failed to add schema: ${
                  schemaError instanceof Error ? schemaError.message : String(schemaError)
                }`,
              },
            ],
            isError: true,
          };
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Successfully created table "${name}" with ID: ${tableId}${
              schema ? " and added the specified schema." : "."
            }`,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to create table: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error creating table: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Delete Table Tool
/*
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
*/

// Update Table Schema Tool
server.tool(
  "update-table-schema",
  "Edit the schema of an existing table (add, remove, or modify columns)",
  {
    table_id: z.string().describe("ID of the table to edit"),
    operation: z
      .enum(["update", "add_column", "rename_column", "remove_column"])
      .describe("Type of schema operation to perform"),

    // For updating the entire schema
    schema: z
      .array(
        z.object({
          name: z.string().describe("Name of the schema element"),
          type: z
            .enum([
              "attachment",
              "audio",
              "bool",
              "date",
              "decimal",
              "email",
              "enum",
              "geo_linestring",
              "geo_multilinestring",
              "geo_multipoint",
              "geo_multipolygon",
              "geo_point",
              "geo_polygon",
              "image",
              "int",
              "json",
              "object",
              "password",
              "tableref",
              "tablerefuuid",
              "text",
              "timestamp",
              "uuid",
              "vector",
              "video",
            ])
            .describe("Type of the schema element"),
          description: z.string().optional().describe("Description of the schema element"),
          nullable: z.boolean().optional().default(false).describe("Whether the field can be null"),
          required: z.boolean().optional().default(false).describe("Whether the field is required"),
          access: z
            .enum(["public", "private", "internal"])
            .optional()
            .default("public")
            .describe("Access level for the field"),
          style: z
            .enum(["single", "list"])
            .optional()
            .default("single")
            .describe("Whether the field is a single value or a list"),
          default: z.string().optional().describe("Default value for the field"),
          config: z
            .record(z.any())
            .optional()
            .describe("Additional configuration for specific field types"),
          children: z.array(z.any()).optional().describe("Nested fields for object types"),
        })
      )
      .optional()
      .describe("Full schema specification (for 'update' operation)"),

    // For adding a single column
    column: z
      .object({
        name: z.string().describe("Name of the column"),
        type: z
          .enum([
            "attachment",
            "audio",
            "bool",
            "date",
            "decimal",
            "email",
            "enum",
            "geo_linestring",
            "geo_multilinestring",
            "geo_multipoint",
            "geo_multipolygon",
            "geo_point",
            "geo_polygon",
            "image",
            "int",
            "json",
            "object",
            "password",
            "tableref",
            "tablerefuuid",
            "text",
            "timestamp",
            "uuid",
            "vector",
            "video",
          ])
          .describe("Type of the column"),
        description: z.string().optional().describe("Description of the column"),
        nullable: z.boolean().optional().default(false).describe("Whether the field can be null"),
        required: z.boolean().optional().default(false).describe("Whether the field is required"),
        access: z
          .enum(["public", "private", "internal"])
          .optional()
          .default("public")
          .describe("Access level for the field"),
        style: z
          .enum(["single", "list"])
          .optional()
          .default("single")
          .describe("Whether the field is a single value or a list"),
        default: z.string().optional().describe("Default value for the field"),
        config: z.record(z.any()).optional().describe("Additional configuration for the column"),
      })
      .optional()
      .describe("Column specification (for 'add_column' operation)"),

    // For renaming a column
    rename: z
      .object({
        old_name: z.string().describe("Current name of the column"),
        new_name: z.string().describe("New name for the column"),
      })
      .optional()
      .describe("Rename specification (for 'rename_column' operation)"),

    // For removing a column
    column_name: z
      .string()
      .optional()
      .describe("Name of the column to remove (for 'remove_column' operation)"),
  },
  async ({ table_id, operation, schema, column, rename, column_name }) => {
    console.error(
      `[Tool] Executing edit-table-schema for table ID: ${table_id}, operation: ${operation}`
    );

    try {
      let successMessage = "";

      switch (operation) {
        case "update":
          if (!schema || schema.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Schema array must be provided for 'update' operation",
                },
              ],
              isError: true,
            };
          }

          // PUT request to update the entire schema
          await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/table/${table_id}/schema`, "PUT", {
            schema,
          });

          successMessage = `Successfully updated the entire schema for table ID: ${table_id}`;
          break;

        case "add_column":
          if (!column) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Column specification must be provided for 'add_column' operation",
                },
              ],
              isError: true,
            };
          }

          // POST request to add a new column of the specified type
          await makeXanoRequest(
            `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/type/${column.type}`,
            "POST",
            column
          );

          successMessage = `Successfully added column '${column.name}' of type '${column.type}' to table ID: ${table_id}`;
          break;

        case "rename_column":
          if (!rename) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Rename specification must be provided for 'rename_column' operation",
                },
              ],
              isError: true,
            };
          }

          // POST request to rename a column
          await makeXanoRequest(
            `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/rename`,
            "POST",
            rename
          );

          successMessage = `Successfully renamed column from '${rename.old_name}' to '${rename.new_name}' in table ID: ${table_id}`;
          break;

        case "remove_column":
          if (!column_name) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Column name must be provided for 'remove_column' operation",
                },
              ],
              isError: true,
            };
          }

          // DELETE request to remove a column
          await makeXanoRequest(
            `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/${column_name}`,
            "DELETE"
          );

          successMessage = `Successfully removed column '${column_name}' from table ID: ${table_id}`;
          break;
      }

      console.error(`[Tool] ${successMessage}`);
      return {
        content: [{ type: "text", text: successMessage }],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to edit table schema: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error editing table schema: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Get API Specification Tool
server.tool(
  "get-api-specification",
  "Get and convert Swagger specification for an API group to a minified markdown format",
  {
    apigroup_id: z.string().describe("ID of the API group to get specification for"),
    format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe(
        "Output format: 'markdown' for concise documentation or 'json' for full specification"
      ),
  },
  async ({ apigroup_id, format }) => {
    console.error(
      `[Tool] Executing get-api-spec for API group ID: ${apigroup_id} with format: ${format}`
    );
    try {
      // Step 1: Get the API group details to find the Swagger spec link
      const apiGroup = await makeXanoRequest<XanoApiGroup>(
        `/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}`
      );

      if (!apiGroup.swagger || !apiGroup.documentation || !apiGroup.documentation.link) {
        return {
          content: [
            {
              type: "text",
              text: `API group (ID: ${apigroup_id}) does not have Swagger documentation available.`,
            },
          ],
          isError: true,
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
              text: `# ${
                apiGroup.name
              } API Specification (Full JSON)\n\n\`\`\`json\n${JSON.stringify(
                swaggerSpec,
                null,
                2
              )}\n\`\`\``,
            },
          ],
        };
      } else {
        // Process the Swagger spec into a minified markdown format
        const markdown = processSwaggerToMarkdown(swaggerSpec, apiGroup.name);

        return {
          content: [
            {
              type: "text",
              text: markdown,
            },
          ],
        };
      }
    } catch (error) {
      console.error(
        `[Error] Failed to get API spec: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error getting API specification: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
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
    const server = swaggerSpec.servers?.[0]?.url || "https://";
    const baseUrl = server;

    // Build the markdown content
    let markdown = `# ${apiGroupName} API\n\n`;
    markdown += `## API Info\n`;
    markdown += `- Title: ${info.title || apiGroupName}\n`;
    markdown += `- Version: ${info.version || "N/A"}\n`;
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
      const methods = Object.keys(pathInfo).filter(m =>
        ["get", "post", "put", "delete", "patch"].includes(m.toLowerCase())
      );

      for (const method of methods) {
        const operation = pathInfo[method];
        markdown += `### ${method.toUpperCase()} ${path}\n`;
        markdown += `${operation.summary || "No summary"}\n`;

        // Parameters
        const parameters = operation.parameters || [];
        if (parameters.length > 0) {
          markdown += `| Param | In | Req | Type |\n`;
          markdown += `|-------|----|-----|------|\n`;
          for (const param of parameters) {
            markdown += `| ${param.name} | ${param.in} | ${param.required ? "Y" : "N"} | ${
              param.schema?.type || "unknown"
            } |\n`;
          }
        }
        markdown += "\n";
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
        markdown += "\n";
      }
    }

    console.error(`[Process] Successfully converted Swagger spec to markdown`);
    return markdown;
  } catch (error) {
    console.error(
      `[Error] Error processing Swagger to Markdown: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
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
    branch: z.string().optional().describe("Branch name for the API group"),
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
        ...(branch !== undefined && { branch }),
      };

      const response = await makeXanoRequest<XanoApiGroup>(
        `/workspace/${XANO_WORKSPACE}/apigroup`,
        "POST",
        requestBody
      );

      console.error(`[Tool] Successfully created API group "${name}" with ID: ${response.id}`);

      const formattedContent =
        `# API Group Created\n\n` +
        `**Name**: ${response.name}\n` +
        `**ID**: ${response.id}\n` +
        `**Description**: ${response.description || "No description"}\n` +
        `${response.docs ? `**Documentation**: ${response.docs}\n` : ""}` +
        `**Swagger Documentation**: ${response.swagger ? "Enabled" : "Disabled"}\n` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}\n` +
        `**Updated**: ${new Date(response.updated_at).toLocaleString()}\n` +
        `${response.guid ? `**GUID**: ${response.guid}\n` : ""}` +
        `${response.canonical ? `**Canonical**: ${response.canonical}\n` : ""}` +
        `${response.branch ? `**Branch**: ${response.branch}\n` : ""}` +
        `${
          response.tag && response.tag.length > 0 ? `**Tags**: ${response.tag.join(", ")}\n` : ""
        }`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to create API group: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error creating API group: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
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
    order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
  },
  async ({ page, per_page, search, sort, order }) => {
    console.error("[Tool] Executing list-api-groups");
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (page !== undefined) queryParams.append("page", page.toString());
      if (per_page !== undefined) queryParams.append("per_page", per_page.toString());
      if (search) queryParams.append("search", search);
      if (sort) queryParams.append("sort", sort);
      if (order) queryParams.append("order", order);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

      const response = await makeXanoRequest<{
        items: XanoApiGroup[];
        curPage: number;
        nextPage?: number;
        prevPage?: number;
      }>(`/workspace/${XANO_WORKSPACE}/apigroup${queryString}`);

      const apiGroups = response.items;

      // Format API groups into a readable structure
      const formattedContent =
        `# Xano API Groups\n\n` +
        `Page ${response.curPage}${response.nextPage ? ` (Next: ${response.nextPage})` : ""}${
          response.prevPage ? ` (Prev: ${response.prevPage})` : ""
        }\n\n` +
        `${apiGroups
          .map(
            group =>
              `## ${group.name}\n` +
              `**ID**: ${group.id}\n` +
              `**Description**: ${group.description || "No description"}\n` +
              `**Created**: ${new Date(group.created_at).toLocaleString()}\n` +
              `**Updated**: ${new Date(group.updated_at).toLocaleString()}\n` +
              `${group.guid ? `**GUID**: ${group.guid}\n` : ""}`
          )
          .join("\n\n")}`;

      console.error(`[Tool] Successfully listed ${apiGroups.length} API groups`);
      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to list API groups: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error listing API groups: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// List APIs in an API Group Tool
server.tool(
  "list-apis",
  "Browse APIs in a specific API group",
  {
    apigroup_id: z.string().describe("ID of the API group to browse"),
    page: z.number().optional().describe("Page number for pagination"),
    per_page: z.number().optional().describe("Number of items per page"),
    search: z.string().optional().describe("Search term to filter APIs"),
    sort: z.enum(["created_at", "updated_at", "name"]).optional().describe("Field to sort by"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
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

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

      const response = await makeXanoRequest<{
        items: XanoApi[];
        curPage: number;
        nextPage?: number;
        prevPage?: number;
      }>(`/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}/api${queryString}`);

      const apis = response.items;

      // Format APIs into a readable structure
      const formattedContent =
        `# APIs in API Group ID: ${apigroup_id}\n\n` +
        `Page ${response.curPage}${response.nextPage ? ` (Next: ${response.nextPage})` : ""}${
          response.prevPage ? ` (Prev: ${response.prevPage})` : ""
        }\n\n` +
        `${apis
          .map(
            api =>
              `## ${api.name}\n` +
              `**ID**: ${api.id}\n` +
              `**Verb**: ${api.verb}\n` +
              `**Description**: ${api.description || "No description"}\n` +
              `${api.docs ? `**Documentation**: ${api.docs}\n` : ""}` +
              `**Created**: ${new Date(api.created_at).toLocaleString()}\n` +
              `**Updated**: ${new Date(api.updated_at).toLocaleString()}\n` +
              `${api.guid ? `**GUID**: ${api.guid}\n` : ""}` +
              `${api.tag && api.tag.length > 0 ? `**Tags**: ${api.tag.join(", ")}\n` : ""}`
          )
          .join("\n\n")}`;

      console.error(
        `[Tool] Successfully listed ${apis.length} APIs for API group ID: ${apigroup_id}`
      );
      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to browse APIs: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error browsing APIs: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Add API to API Group Tool
server.tool(
  "create-api",
  "Add a new API to an API group",
  {
    apigroup_id: z.string().describe("ID of the API group to add the API to"),
    name: z.string().describe("Name of the API"),
    description: z.string().describe("Description of the API"),
    docs: z.string().optional().describe("Documentation for the API"),
    verb: z
      .enum(["GET", "POST", "DELETE", "PUT", "PATCH", "HEAD"])
      .describe("HTTP verb for the API"),
    tag: z.array(z.string()).optional().describe("Tags to associate with the API"),
  },
  async ({ apigroup_id, name, description, docs, verb, tag }) => {
    console.error(`[Tool] Executing create-api for API group ID: ${apigroup_id}`);
    try {
      const requestBody = {
        name,
        description,
        verb,
        ...(docs !== undefined && { docs }),
        ...(tag !== undefined && { tag }),
      };

      const response = await makeXanoRequest<XanoApi>(
        `/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}/api`,
        "POST",
        requestBody
      );

      console.error(
        `[Tool] Successfully added API "${name}" with ID: ${response.id} to API group ID: ${apigroup_id}`
      );

      const formattedContent =
        `# API Added\n\n` +
        `**Name**: ${response.name}\n` +
        `**ID**: ${response.id}\n` +
        `**API Group ID**: ${apigroup_id}\n` +
        `**Verb**: ${response.verb}\n` +
        `**Description**: ${response.description}\n` +
        `${response.docs ? `**Documentation**: ${response.docs}\n` : ""}` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}\n` +
        `${response.guid ? `**GUID**: ${response.guid}\n` : ""}` +
        `${
          response.tag && response.tag.length > 0 ? `**Tags**: ${response.tag.join(", ")}\n` : ""
        }`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to add API: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error adding API: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Get API details
server.tool(
  "get-api-details",
  "Get details for a specific API endpoint",
  {
    apigroup_id: z.string().describe("ID of the API group containing the API"),
    api_id: z.string().describe("ID of the API to get details for"),
  },
  async ({ apigroup_id, api_id }) => {
    console.error(
      `[Tool] Executing get-api-details for API ID: ${api_id} in API group: ${apigroup_id}`
    );
    try {
      const response = await makeXanoRequest<XanoApi>(
        `/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}/api/${api_id}`,
        "GET"
      );

      console.error(`[Tool] Successfully retrieved API "${response.name}" details`);

      const formattedContent =
        `# API Details: ${response.name}\n\n` +
        `**ID**: ${response.id}\n` +
        `**API Group ID**: ${apigroup_id}\n` +
        `**Verb**: ${response.verb}\n` +
        `**Description**: ${response.description || "No description"}\n` +
        `${response.docs ? `**Documentation**: ${response.docs}\n` : ""}` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}\n` +
        `**Updated**: ${new Date(response.updated_at).toLocaleString()}\n` +
        `${response.guid ? `**GUID**: ${response.guid}\n` : ""}` +
        `${
          response.tag && response.tag.length > 0 ? `**Tags**: ${response.tag.join(", ")}\n` : ""
        }` +
        `${
          response.cache && response.cache.active
            ? `**Cache**: Active (TTL: ${response.cache.ttl}s)\n`
            : "**Cache**: Inactive\n"
        }`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to get API details: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error getting API details: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Update API details
server.tool(
  "update-api",
  "Update an existing API endpoint",
  {
    apigroup_id: z.string().describe("ID of the API group containing the API"),
    api_id: z.string().describe("ID of the API to update"),
    name: z.string().describe("Updated name of the API"),
    description: z.string().describe("Updated description of the API"),
    docs: z.string().optional().describe("Updated documentation for the API"),
    verb: z
      .enum(["GET", "POST", "DELETE", "PUT", "PATCH", "HEAD"])
      .describe("Updated HTTP verb for the API"),
    tag: z
      .array(z.string())
      .optional()
      .nullable()
      .describe("Updated tags to associate with the API"),
    cache: z
      .object({
        active: z.boolean().describe("Whether caching is active"),
        ttl: z.number().optional().describe("Cache time-to-live in seconds (default: 3600)"),
        input: z.boolean().optional().describe("Whether to include request input in cache key"),
        auth: z.boolean().optional().describe("Whether to include auth in cache key"),
        datasource: z.boolean().optional().describe("Whether to include datasource in cache key"),
        ip: z.boolean().optional().describe("Whether to include IP address in cache key"),
        headers: z.array(z.string()).optional().describe("Headers to include in cache key"),
      })
      .optional()
      .describe("Cache configuration for the API"),
  },
  async ({ apigroup_id, api_id, name, description, docs, verb, tag, cache }) => {
    console.error(`[Tool] Executing update-api for API ID: ${api_id}`);
    try {
      const requestBody = {
        name,
        description,
        verb,
        ...(docs !== undefined && { docs }),
        ...(tag !== undefined && { tag }),
        ...(cache !== undefined && { cache }),
      };

      await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}/api/${api_id}`,
        "PUT",
        requestBody
      );

      console.error(`[Tool] Successfully updated API ID: ${api_id}`);

      // Fetch updated API details to return
      const updatedApi = await makeXanoRequest<XanoApi>(
        `/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}/api/${api_id}`,
        "GET"
      );

      const formattedContent =
        `# API Updated\n\n` +
        `**Name**: ${updatedApi.name}\n` +
        `**ID**: ${updatedApi.id}\n` +
        `**API Group ID**: ${apigroup_id}\n` +
        `**Verb**: ${updatedApi.verb}\n` +
        `**Description**: ${updatedApi.description}\n` +
        `${updatedApi.docs ? `**Documentation**: ${updatedApi.docs}\n` : ""}` +
        `**Updated**: ${new Date(updatedApi.updated_at).toLocaleString()}\n` +
        `${updatedApi.guid ? `**GUID**: ${updatedApi.guid}\n` : ""}` +
        `${
          updatedApi.tag && updatedApi.tag.length > 0
            ? `**Tags**: ${updatedApi.tag.join(", ")}\n`
            : ""
        }` +
        `${
          updatedApi.cache && updatedApi.cache.active
            ? `**Cache**: Active (TTL: ${updatedApi.cache.ttl}s)\n`
            : "**Cache**: Inactive\n"
        }`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to update API: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error updating API: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Delete API endpoint
server.tool(
  "delete-api",
  "Delete an API endpoint from an API group",
  {
    apigroup_id: z.string().describe("ID of the API group containing the API"),
    api_id: z.string().describe("ID of the API to delete"),
  },
  async ({ apigroup_id, api_id }) => {
    console.error(`[Tool] Executing delete-api for API ID: ${api_id} in API group: ${apigroup_id}`);
    try {
      // First get the API details to confirm what's being deleted
      const apiDetails = await makeXanoRequest<XanoApi>(
        `/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}/api/${api_id}`,
        "GET"
      );

      // Delete the API
      await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}/api/${api_id}`,
        "DELETE"
      );

      console.error(`[Tool] Successfully deleted API "${apiDetails.name}" (ID: ${api_id})`);

      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted API "${apiDetails.name}" (ID: ${api_id}) from API group ${apigroup_id}`,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to delete API: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error deleting API: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Get workspace details
server.tool(
  "get-workspace-details",
  "Get details for a specific workspace",
  {
    workspace_id: z
      .string()
      .optional()
      .describe(
        "ID of the workspace to get details for. If not provided, uses the configured workspace."
      ),
  },
  async ({ workspace_id }) => {
    const workspaceId = workspace_id || String(XANO_WORKSPACE);
    console.error(`[Tool] Executing get-workspace-details for workspace ID: ${workspaceId}`);
    try {
      const response = await makeXanoRequest<{
        id: string;
        name: string;
        description: string;
        branch?: string;
      }>(`/workspace/${workspaceId}`, "GET");

      console.error(`[Tool] Successfully retrieved workspace "${response.name}" details`);

      const formattedContent =
        `# Workspace: ${response.name}\n\n` +
        `**ID**: ${response.id}\n` +
        `**Description**: ${response.description || "No description"}\n` +
        `${response.branch ? `**Branch**: ${response.branch}\n` : ""}`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to get workspace details: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error getting workspace details: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// List workspaces
server.tool("list-workspaces", "List all available workspaces", {}, async () => {
  console.error("[Tool] Executing list-workspaces");
  try {
    const response = await makeXanoRequest<
      Array<{ id: number; name: string; description: string; branch: string }>
    >(`/workspace`, "GET");

    console.error(`[Tool] Successfully listed ${response.length} workspaces`);

    const formattedContent =
      `# Available Workspaces\n\n` +
      response
        .map(
          workspace =>
            `## ${workspace.name}\n` +
            `**ID**: ${workspace.id}\n` +
            `**Description**: ${workspace.description || "No description"}\n` +
            `${workspace.branch ? `**Branch**: ${workspace.branch}\n` : ""}`
        )
        .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: formattedContent,
        },
      ],
    };
  } catch (error) {
    console.error(
      `[Error] Failed to list workspaces: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      content: [
        {
          type: "text",
          text: `Error listing workspaces: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
});

// List branches
server.tool("list-branches", "List all branches in the workspace", {}, async () => {
  console.error("[Tool] Executing list-branches");
  try {
    const response = await makeXanoRequest<{
      items: Array<{ id: string; name: string; description: string }>;
    }>(`/workspace/${XANO_WORKSPACE}/branch`, "GET");

    console.error(`[Tool] Successfully listed ${response.items.length} branches`);

    const formattedContent =
      `# Workspace Branches\n\n` +
      response.items
        .map(
          branch =>
            `## ${branch.name}\n` +
            `**ID**: ${branch.id}\n` +
            `**Description**: ${branch.description || "No description"}`
        )
        .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: formattedContent,
        },
      ],
    };
  } catch (error) {
    console.error(
      `[Error] Failed to list branches: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      content: [
        {
          type: "text",
          text: `Error listing branches: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Get table details
server.tool(
  "get-table-details",
  "Get details for a specific table",
  {
    table_id: z.string().describe("ID of the table to get details for"),
  },
  async ({ table_id }) => {
    console.error(`[Tool] Executing get-table-details for table ID: ${table_id}`);
    try {
      const response = await makeXanoRequest<XanoTable>(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}`,
        "GET"
      );

      console.error(`[Tool] Successfully retrieved table "${response.name}" details`);

      const formattedContent =
        `# Table: ${response.name}\n\n` +
        `**ID**: ${response.id}\n` +
        `**Description**: ${response.description || "No description"}\n` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}\n` +
        `**Updated**: ${new Date(response.updated_at).toLocaleString()}\n` +
        `${
          response.tags && response.tags.length > 0 ? `**Tags**: ${response.tags.join(", ")}\n` : ""
        }`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to get table details: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error getting table details: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Update table details
server.tool(
  "update-table",
  "Update an existing table's details",
  {
    table_id: z.string().describe("ID of the table to update"),
    name: z.string().describe("Updated name of the table"),
    description: z.string().optional().describe("Updated description of the table"),
    tags: z
      .array(z.string())
      .optional()
      .nullable()
      .describe("Updated tags to associate with the table"),
  },
  async ({ table_id, name, description, tags }) => {
    console.error(`[Tool] Executing update-table for table ID: ${table_id}`);
    try {
      const requestBody = {
        name,
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
      };

      await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/table/${table_id}`, "PUT", requestBody);

      console.error(`[Tool] Successfully updated table ID: ${table_id}`);

      // Fetch updated table details to return
      const updatedTable = await makeXanoRequest<XanoTable>(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}`,
        "GET"
      );

      const formattedContent =
        `# Table Updated\n\n` +
        `**Name**: ${updatedTable.name}\n` +
        `**ID**: ${updatedTable.id}\n` +
        `**Description**: ${updatedTable.description || "No description"}\n` +
        `**Updated**: ${new Date(updatedTable.updated_at).toLocaleString()}\n` +
        `${
          updatedTable.tags && updatedTable.tags.length > 0
            ? `**Tags**: ${updatedTable.tags.join(", ")}\n`
            : ""
        }`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to update table: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error updating table: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Add column to table
server.tool(
  "add-column",
  "Add a new column to an existing table",
  {
    table_id: z.string().describe("ID of the table to add the column to"),
    name: z.string().describe("Name of the new column"),
    type: z
      .enum([
        "attachment",
        "audio",
        "bool",
        "date",
        "decimal",
        "email",
        "enum",
        "geo_linestring",
        "geo_multilinestring",
        "geo_multipoint",
        "geo_multipolygon",
        "geo_point",
        "geo_polygon",
        "image",
        "int",
        "json",
        "object",
        "password",
        "tableref",
        "tablerefuuid",
        "text",
        "timestamp",
        "uuid",
        "vector",
        "video",
      ])
      .describe("Data type of the new column"),
    description: z.string().optional().describe("Description of the new column"),
    nullable: z.boolean().optional().default(false).describe("Whether the field can be null"),
    required: z.boolean().optional().default(false).describe("Whether the field is required"),
    access: z
      .enum(["public", "private", "internal"])
      .optional()
      .default("public")
      .describe("Access level for the field"),
    style: z
      .enum(["single", "list"])
      .optional()
      .default("single")
      .describe("Whether the field is a single value or a list"),
    default_value: z.string().optional().describe("Default value for the field"),
    config: z.record(z.any()).optional().describe("Additional configuration for the column"),
  },
  async ({
    table_id,
    name,
    type,
    description,
    nullable,
    required,
    access,
    style,
    default_value,
    config,
  }) => {
    console.error(`[Tool] Executing add-column for table ID: ${table_id}`);
    try {
      const columnData = {
        name,
        description,
        nullable,
        required,
        access,
        style,
        default: default_value,
        ...(config && { config }),
      };

      await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/type/${type}`,
        "POST",
        columnData
      );

      console.error(
        `[Tool] Successfully added column "${name}" of type "${type}" to table ID: ${table_id}`
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully added column "${name}" of type "${type}" to table ID: ${table_id}`,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to add column: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error adding column: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Rename column
server.tool(
  "rename-column",
  "Rename a column in an existing table",
  {
    table_id: z.string().describe("ID of the table containing the column"),
    old_name: z.string().describe("Current name of the column"),
    new_name: z.string().describe("New name for the column"),
  },
  async ({ table_id, old_name, new_name }) => {
    console.error(`[Tool] Executing rename-column for table ID: ${table_id}`);
    try {
      await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/rename`,
        "POST",
        { old_name, new_name }
      );

      console.error(
        `[Tool] Successfully renamed column from "${old_name}" to "${new_name}" in table ID: ${table_id}`
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully renamed column from "${old_name}" to "${new_name}" in table ID: ${table_id}`,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to rename column: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error renaming column: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Delete column
server.tool(
  "delete-column",
  "Delete a column from an existing table",
  {
    table_id: z.string().describe("ID of the table containing the column"),
    column_name: z.string().describe("Name of the column to delete"),
  },
  async ({ table_id, column_name }) => {
    console.error(`[Tool] Executing delete-column for table ID: ${table_id}`);
    try {
      await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/${column_name}`,
        "DELETE"
      );

      console.error(
        `[Tool] Successfully deleted column "${column_name}" from table ID: ${table_id}`
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted column "${column_name}" from table ID: ${table_id}`,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to delete column: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error deleting column: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// List functions
server.tool("list-functions", "List all functions in the workspace", {}, async () => {
  console.error("[Tool] Executing list-functions");
  try {
    const response = await makeXanoRequest<{
      items: Array<{
        id: string;
        name: string;
        description: string;
        branch: string;
        created_at: string;
        updated_at: string;
      }>;
    }>(`/workspace/${XANO_WORKSPACE}/function`, "GET");

    console.error(`[Tool] Successfully listed ${response.items.length} functions`);

    const formattedContent =
      `# Workspace Functions\n\n` +
      response.items
        .map(
          fn =>
            `## ${fn.name}\n` +
            `**ID**: ${fn.id}\n` +
            `**Description**: ${fn.description || "No description"}\n` +
            `**Created**: ${new Date(fn.created_at).toLocaleString()}\n` +
            `**Updated**: ${new Date(fn.updated_at).toLocaleString()}\n` +
            `${fn.branch ? `**Branch**: ${fn.branch}\n` : ""}`
        )
        .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: formattedContent,
        },
      ],
    };
  } catch (error) {
    console.error(
      `[Error] Failed to list functions: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      content: [
        {
          type: "text",
          text: `Error listing functions: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
});

// Get function details
server.tool(
  "get-function-details",
  "Get details for a specific function",
  {
    function_id: z.string().describe("ID of the function to get details for"),
  },
  async ({ function_id }) => {
    console.error(`[Tool] Executing get-function-details for function ID: ${function_id}`);
    try {
      const response = await makeXanoRequest<{
        id: string;
        name: string;
        description: string;
        docs?: string;
        branch?: string;
        created_at: string;
        updated_at: string;
      }>(`/workspace/${XANO_WORKSPACE}/function/${function_id}`, "GET");

      console.error(`[Tool] Successfully retrieved function "${response.name}" details`);

      const formattedContent =
        `# Function: ${response.name}\n\n` +
        `**ID**: ${response.id}\n` +
        `**Description**: ${response.description || "No description"}\n` +
        `${response.docs ? `**Documentation**: ${response.docs}\n` : ""}` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}\n` +
        `**Updated**: ${new Date(response.updated_at).toLocaleString()}\n` +
        `${response.branch ? `**Branch**: ${response.branch}\n` : ""}`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to get function details: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error getting function details: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Create function
server.tool(
  "create-function",
  "Create a new function in the workspace",
  {
    name: z.string().describe("Name of the function"),
    description: z.string().describe("Description of the function"),
    docs: z.string().optional().describe("Documentation for the function"),
    branch: z.string().optional().describe("Branch name for the function"),
  },
  async ({ name, description, docs, branch }) => {
    console.error(`[Tool] Executing create-function for name: ${name}`);
    try {
      const requestBody = {
        name,
        description,
        ...(docs !== undefined && { docs }),
        ...(branch !== undefined && { branch }),
      };

      const response = await makeXanoRequest<{
        id: string;
        name: string;
        description: string;
        docs?: string;
        branch?: string;
        created_at: string;
        updated_at: string;
      }>(`/workspace/${XANO_WORKSPACE}/function`, "POST", requestBody);

      console.error(`[Tool] Successfully created function "${name}" with ID: ${response.id}`);

      const formattedContent =
        `# Function Created\n\n` +
        `**Name**: ${response.name}\n` +
        `**ID**: ${response.id}\n` +
        `**Description**: ${response.description}\n` +
        `${response.docs ? `**Documentation**: ${response.docs}\n` : ""}` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}\n` +
        `${response.branch ? `**Branch**: ${response.branch}\n` : ""}`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to create function: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error creating function: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Update function
server.tool(
  "update-function",
  "Update an existing function",
  {
    function_id: z.string().describe("ID of the function to update"),
    name: z.string().describe("Updated name of the function"),
    description: z.string().describe("Updated description of the function"),
    docs: z.string().optional().describe("Updated documentation for the function"),
  },
  async ({ function_id, name, description, docs }) => {
    console.error(`[Tool] Executing update-function for function ID: ${function_id}`);
    try {
      const requestBody = {
        name,
        description,
        ...(docs !== undefined && { docs }),
      };

      await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/function/${function_id}`,
        "PUT",
        requestBody
      );

      console.error(`[Tool] Successfully updated function ID: ${function_id}`);

      // Fetch updated function details to return
      const updatedFunction = await makeXanoRequest<{
        id: string;
        name: string;
        description: string;
        docs?: string;
        branch?: string;
        created_at: string;
        updated_at: string;
      }>(`/workspace/${XANO_WORKSPACE}/function/${function_id}`, "GET");

      const formattedContent =
        `# Function Updated\n\n` +
        `**Name**: ${updatedFunction.name}\n` +
        `**ID**: ${updatedFunction.id}\n` +
        `**Description**: ${updatedFunction.description}\n` +
        `${updatedFunction.docs ? `**Documentation**: ${updatedFunction.docs}\n` : ""}` +
        `**Updated**: ${new Date(updatedFunction.updated_at).toLocaleString()}\n` +
        `${updatedFunction.branch ? `**Branch**: ${updatedFunction.branch}\n` : ""}`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to update function: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error updating function: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Delete function
server.tool(
  "delete-function",
  "Delete a function from the workspace",
  {
    function_id: z.string().describe("ID of the function to delete"),
  },
  async ({ function_id }) => {
    console.error(`[Tool] Executing delete-function for function ID: ${function_id}`);
    try {
      // First get the function details to confirm what's being deleted
      const functionDetails = await makeXanoRequest<{
        id: string;
        name: string;
      }>(`/workspace/${XANO_WORKSPACE}/function/${function_id}`, "GET");

      // Delete the function
      await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/function/${function_id}`, "DELETE");

      console.error(
        `[Tool] Successfully deleted function "${functionDetails.name}" (ID: ${function_id})`
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted function "${functionDetails.name}" (ID: ${function_id})`,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to delete function: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error deleting function: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Create branch
server.tool(
  "create-branch",
  "Create a new branch in the workspace",
  {
    name: z.string().describe("Name of the branch"),
    description: z.string().optional().describe("Description of the branch"),
  },
  async ({ name, description }) => {
    console.error(`[Tool] Executing create-branch for name: ${name}`);
    try {
      const requestBody = {
        name,
        ...(description !== undefined && { description }),
      };

      const response = await makeXanoRequest<{
        id: string;
        name: string;
        description?: string;
        created_at: string;
        updated_at: string;
      }>(`/workspace/${XANO_WORKSPACE}/branch`, "POST", requestBody);

      console.error(`[Tool] Successfully created branch "${name}" with ID: ${response.id}`);

      const formattedContent =
        `# Branch Created\n\n` +
        `**Name**: ${response.name}\n` +
        `**ID**: ${response.id}\n` +
        `${response.description ? `**Description**: ${response.description}\n` : ""}` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to create branch: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error creating branch: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Get branch details
server.tool(
  "get-branch-details",
  "Get details for a specific branch",
  {
    branch_id: z.string().describe("ID of the branch to get details for"),
  },
  async ({ branch_id }) => {
    console.error(`[Tool] Executing get-branch-details for branch ID: ${branch_id}`);
    try {
      const response = await makeXanoRequest<{
        id: string;
        name: string;
        description?: string;
        created_at: string;
        updated_at: string;
      }>(`/workspace/${XANO_WORKSPACE}/branch/${branch_id}`, "GET");

      console.error(`[Tool] Successfully retrieved branch "${response.name}" details`);

      const formattedContent =
        `# Branch: ${response.name}\n\n` +
        `**ID**: ${response.id}\n` +
        `${response.description ? `**Description**: ${response.description}\n` : ""}` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}\n` +
        `**Updated**: ${new Date(response.updated_at).toLocaleString()}`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to get branch details: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error getting branch details: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Update branch
server.tool(
  "update-branch",
  "Update an existing branch",
  {
    branch_id: z.string().describe("ID of the branch to update"),
    name: z.string().describe("Updated name of the branch"),
    description: z.string().optional().describe("Updated description of the branch"),
  },
  async ({ branch_id, name, description }) => {
    console.error(`[Tool] Executing update-branch for branch ID: ${branch_id}`);
    try {
      const requestBody = {
        name,
        ...(description !== undefined && { description }),
      };

      await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/branch/${branch_id}`, "PUT", requestBody);

      console.error(`[Tool] Successfully updated branch ID: ${branch_id}`);

      // Fetch updated branch details to return
      const updatedBranch = await makeXanoRequest<{
        id: string;
        name: string;
        description?: string;
        created_at: string;
        updated_at: string;
      }>(`/workspace/${XANO_WORKSPACE}/branch/${branch_id}`, "GET");

      const formattedContent =
        `# Branch Updated\n\n` +
        `**Name**: ${updatedBranch.name}\n` +
        `**ID**: ${updatedBranch.id}\n` +
        `${updatedBranch.description ? `**Description**: ${updatedBranch.description}\n` : ""}` +
        `**Updated**: ${new Date(updatedBranch.updated_at).toLocaleString()}`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to update branch: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error updating branch: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Delete branch
server.tool(
  "delete-branch",
  "Delete a branch from the workspace",
  {
    branch_id: z.string().describe("ID of the branch to delete"),
  },
  async ({ branch_id }) => {
    console.error(`[Tool] Executing delete-branch for branch ID: ${branch_id}`);
    try {
      // First get the branch details to confirm what's being deleted
      const branchDetails = await makeXanoRequest<{
        id: string;
        name: string;
      }>(`/workspace/${XANO_WORKSPACE}/branch/${branch_id}`, "GET");

      // Delete the branch
      await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/branch/${branch_id}`, "DELETE");

      console.error(
        `[Tool] Successfully deleted branch "${branchDetails.name}" (ID: ${branch_id})`
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted branch "${branchDetails.name}" (ID: ${branch_id})`,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to delete branch: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error deleting branch: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Get API group details
server.tool(
  "get-api-group-details",
  "Get details for a specific API group",
  {
    apigroup_id: z.string().describe("ID of the API group to get details for"),
  },
  async ({ apigroup_id }) => {
    console.error(`[Tool] Executing get-api-group-details for API group ID: ${apigroup_id}`);
    try {
      const response = await makeXanoRequest<XanoApiGroup>(
        `/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}`,
        "GET"
      );

      console.error(`[Tool] Successfully retrieved API group "${response.name}" details`);

      let formattedContent =
        `# API Group: ${response.name}\n\n` +
        `**ID**: ${response.id}\n` +
        `**Description**: ${response.description || "No description"}\n` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}\n` +
        `**Updated**: ${new Date(response.updated_at).toLocaleString()}\n` +
        `**Swagger Documentation**: ${response.swagger ? "Enabled" : "Disabled"}\n` +
        `${response.guid ? `**GUID**: ${response.guid}\n` : ""}` +
        `${response.canonical ? `**Canonical**: ${response.canonical}\n` : ""}` +
        `${response.branch ? `**Branch**: ${response.branch}\n` : ""}` +
        `${
          response.tag && response.tag.length > 0 ? `**Tags**: ${response.tag.join(", ")}\n` : ""
        }`;

      if (response.documentation) {
        formattedContent +=
          `\n**Documentation Link**: ${response.documentation.link}\n` +
          `**Documentation Token Required**: ${
            response.documentation.require_token ? "Yes" : "No"
          }\n`;
      }

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to get API group details: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error getting API group details: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Update API group
server.tool(
  "update-api-group",
  "Update an existing API group",
  {
    apigroup_id: z.string().describe("ID of the API group to update"),
    name: z.string().describe("Updated name of the API group"),
    description: z.string().describe("Updated description of the API group"),
    swagger: z.boolean().describe("Whether to enable Swagger documentation"),
    docs: z.string().optional().describe("Updated documentation for the API group"),
    tag: z
      .array(z.string())
      .optional()
      .nullable()
      .describe("Updated tags to associate with the API group"),
    branch: z.string().optional().describe("Updated branch name for the API group"),
  },
  async ({ apigroup_id, name, description, swagger, docs, tag, branch }) => {
    console.error(`[Tool] Executing update-api-group for API group ID: ${apigroup_id}`);
    try {
      const requestBody = {
        name,
        description,
        swagger,
        ...(docs !== undefined && { docs }),
        ...(tag !== undefined && { tag }),
        ...(branch !== undefined && { branch }),
      };

      await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}`,
        "PUT",
        requestBody
      );

      console.error(`[Tool] Successfully updated API group ID: ${apigroup_id}`);

      // Fetch updated API group details to return
      const updatedApiGroup = await makeXanoRequest<XanoApiGroup>(
        `/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}`,
        "GET"
      );

      const formattedContent =
        `# API Group Updated\n\n` +
        `**Name**: ${updatedApiGroup.name}\n` +
        `**ID**: ${updatedApiGroup.id}\n` +
        `**Description**: ${updatedApiGroup.description || "No description"}\n` +
        `**Updated**: ${new Date(updatedApiGroup.updated_at).toLocaleString()}\n` +
        `**Swagger Documentation**: ${updatedApiGroup.swagger ? "Enabled" : "Disabled"}\n` +
        `${updatedApiGroup.guid ? `**GUID**: ${updatedApiGroup.guid}\n` : ""}` +
        `${updatedApiGroup.canonical ? `**Canonical**: ${updatedApiGroup.canonical}\n` : ""}` +
        `${updatedApiGroup.branch ? `**Branch**: ${updatedApiGroup.branch}\n` : ""}` +
        `${
          updatedApiGroup.tag && updatedApiGroup.tag.length > 0
            ? `**Tags**: ${updatedApiGroup.tag.join(", ")}\n`
            : ""
        }`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to update API group: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error updating API group: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Delete API group
server.tool(
  "delete-api-group",
  "Delete an API group from the workspace",
  {
    apigroup_id: z.string().describe("ID of the API group to delete"),
  },
  async ({ apigroup_id }) => {
    console.error(`[Tool] Executing delete-api-group for API group ID: ${apigroup_id}`);
    try {
      // First get the API group details to confirm what's being deleted
      const apiGroupDetails = await makeXanoRequest<{
        id: string;
        name: string;
      }>(`/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}`, "GET");

      // Delete the API group
      await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/apigroup/${apigroup_id}`, "DELETE");

      console.error(
        `[Tool] Successfully deleted API group "${apiGroupDetails.name}" (ID: ${apigroup_id})`
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted API group "${apiGroupDetails.name}" (ID: ${apigroup_id})`,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to delete API group: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error deleting API group: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Update column
server.tool(
  "update-column",
  "Update a column in an existing table",
  {
    table_id: z.string().describe("ID of the table containing the column"),
    column_name: z.string().describe("Name of the column to update"),
    description: z.string().optional().describe("Updated description of the column"),
    nullable: z.boolean().optional().describe("Whether the field can be null"),
    required: z.boolean().optional().describe("Whether the field is required"),
    access: z
      .enum(["public", "private", "internal"])
      .optional()
      .describe("Updated access level for the field"),
    style: z
      .enum(["single", "list"])
      .optional()
      .describe("Whether the field is a single value or a list"),
    default_value: z.string().optional().describe("Updated default value for the field"),
    config: z.record(z.any()).optional().describe("Updated configuration for the column"),
  },
  async ({
    table_id,
    column_name,
    description,
    nullable,
    required,
    access,
    style,
    default_value,
    config,
  }) => {
    console.error(
      `[Tool] Executing update-column for column "${column_name}" in table ID: ${table_id}`
    );
    try {
      const columnData = {
        ...(description !== undefined && { description }),
        ...(nullable !== undefined && { nullable }),
        ...(required !== undefined && { required }),
        ...(access !== undefined && { access }),
        ...(style !== undefined && { style }),
        ...(default_value !== undefined && { default: default_value }),
        ...(config !== undefined && { config }),
      };

      await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/${column_name}`,
        "PUT",
        columnData
      );

      console.error(`[Tool] Successfully updated column "${column_name}" in table ID: ${table_id}`);

      return {
        content: [
          {
            type: "text",
            text: `Successfully updated column "${column_name}" in table ID: ${table_id}`,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to update column: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error updating column: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// List tasks
server.tool("list-tasks", "List all tasks in the workspace", {}, async () => {
  console.error("[Tool] Executing list-tasks");
  try {
    const response = await makeXanoRequest<{
      items: Array<{
        id: string;
        name: string;
        description: string;
        docs?: string;
        datasource: string;
        active: boolean;
        branch?: string;
        created_at: string;
        updated_at: string;
      }>;
    }>(`/workspace/${XANO_WORKSPACE}/task`, "GET");

    console.error(`[Tool] Successfully listed ${response.items.length} tasks`);

    const formattedContent =
      `# Workspace Tasks\n\n` +
      response.items
        .map(
          task =>
            `## ${task.name}\n` +
            `**ID**: ${task.id}\n` +
            `**Description**: ${task.description || "No description"}\n` +
            `**Datasource**: ${task.datasource}\n` +
            `**Active**: ${task.active ? "Yes" : "No"}\n` +
            `**Created**: ${new Date(task.created_at).toLocaleString()}\n` +
            `**Updated**: ${new Date(task.updated_at).toLocaleString()}\n` +
            `${task.branch ? `**Branch**: ${task.branch}\n` : ""}` +
            `${task.docs ? `**Documentation**: ${task.docs}\n` : ""}`
        )
        .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: formattedContent,
        },
      ],
    };
  } catch (error) {
    console.error(
      `[Error] Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      content: [
        {
          type: "text",
          text: `Error listing tasks: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Get task details
server.tool(
  "get-task-details",
  "Get details for a specific task",
  {
    task_id: z.string().describe("ID of the task to get details for"),
  },
  async ({ task_id }) => {
    console.error(`[Tool] Executing get-task-details for task ID: ${task_id}`);
    try {
      const response = await makeXanoRequest<{
        id: string;
        name: string;
        description: string;
        docs?: string;
        datasource: string;
        active: boolean;
        branch?: string;
        created_at: string;
        updated_at: string;
      }>(`/workspace/${XANO_WORKSPACE}/task/${task_id}`, "GET");

      console.error(`[Tool] Successfully retrieved task "${response.name}" details`);

      const formattedContent =
        `# Task: ${response.name}\n\n` +
        `**ID**: ${response.id}\n` +
        `**Description**: ${response.description || "No description"}\n` +
        `**Datasource**: ${response.datasource}\n` +
        `**Active**: ${response.active ? "Yes" : "No"}\n` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}\n` +
        `**Updated**: ${new Date(response.updated_at).toLocaleString()}\n` +
        `${response.branch ? `**Branch**: ${response.branch}\n` : ""}` +
        `${response.docs ? `**Documentation**: ${response.docs}\n` : ""}`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to get task details: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error getting task details: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Create task
server.tool(
  "create-task",
  "Create a new task in the workspace",
  {
    name: z.string().describe("Name of the task"),
    description: z.string().describe("Description of the task"),
    datasource: z.string().describe("Datasource for the task"),
    active: z.boolean().describe("Whether the task is active"),
    docs: z.string().optional().describe("Documentation for the task"),
    branch: z.string().optional().describe("Branch name for the task"),
  },
  async ({ name, description, datasource, active, docs, branch }) => {
    console.error(`[Tool] Executing create-task for name: ${name}`);
    try {
      const requestBody = {
        name,
        description,
        datasource,
        active,
        ...(docs !== undefined && { docs }),
        ...(branch !== undefined && { branch }),
      };

      const response = await makeXanoRequest<{
        id: string;
        name: string;
        description: string;
        docs?: string;
        datasource: string;
        active: boolean;
        branch?: string;
        created_at: string;
        updated_at: string;
      }>(`/workspace/${XANO_WORKSPACE}/task`, "POST", requestBody);

      console.error(`[Tool] Successfully created task "${name}" with ID: ${response.id}`);

      const formattedContent =
        `# Task Created\n\n` +
        `**Name**: ${response.name}\n` +
        `**ID**: ${response.id}\n` +
        `**Description**: ${response.description}\n` +
        `**Datasource**: ${response.datasource}\n` +
        `**Active**: ${response.active ? "Yes" : "No"}\n` +
        `**Created**: ${new Date(response.created_at).toLocaleString()}\n` +
        `${response.branch ? `**Branch**: ${response.branch}\n` : ""}` +
        `${response.docs ? `**Documentation**: ${response.docs}\n` : ""}`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to create task: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error creating task: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Update task
server.tool(
  "update-task",
  "Update an existing task",
  {
    task_id: z.string().describe("ID of the task to update"),
    name: z.string().describe("Updated name of the task"),
    description: z.string().describe("Updated description of the task"),
    datasource: z.string().describe("Updated datasource for the task"),
    active: z.boolean().describe("Whether the task is active"),
    docs: z.string().optional().describe("Updated documentation for the task"),
  },
  async ({ task_id, name, description, datasource, active, docs }) => {
    console.error(`[Tool] Executing update-task for task ID: ${task_id}`);
    try {
      const requestBody = {
        name,
        description,
        datasource,
        active,
        ...(docs !== undefined && { docs }),
      };

      await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/task/${task_id}`, "PUT", requestBody);

      console.error(`[Tool] Successfully updated task ID: ${task_id}`);

      // Fetch updated task details to return
      const updatedTask = await makeXanoRequest<{
        id: string;
        name: string;
        description: string;
        docs?: string;
        datasource: string;
        active: boolean;
        branch?: string;
        created_at: string;
        updated_at: string;
      }>(`/workspace/${XANO_WORKSPACE}/task/${task_id}`, "GET");

      const formattedContent =
        `# Task Updated\n\n` +
        `**Name**: ${updatedTask.name}\n` +
        `**ID**: ${updatedTask.id}\n` +
        `**Description**: ${updatedTask.description}\n` +
        `**Datasource**: ${updatedTask.datasource}\n` +
        `**Active**: ${updatedTask.active ? "Yes" : "No"}\n` +
        `**Updated**: ${new Date(updatedTask.updated_at).toLocaleString()}\n` +
        `${updatedTask.branch ? `**Branch**: ${updatedTask.branch}\n` : ""}` +
        `${updatedTask.docs ? `**Documentation**: ${updatedTask.docs}\n` : ""}`;

      return {
        content: [
          {
            type: "text",
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to update task: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error updating task: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Delete task
server.tool(
  "delete-task",
  "Delete a task from the workspace",
  {
    task_id: z.string().describe("ID of the task to delete"),
  },
  async ({ task_id }) => {
    console.error(`[Tool] Executing delete-task for task ID: ${task_id}`);
    try {
      // First get the task details to confirm what's being deleted
      const taskDetails = await makeXanoRequest<{
        id: string;
        name: string;
      }>(`/workspace/${XANO_WORKSPACE}/task/${task_id}`, "GET");

      // Delete the task
      await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/task/${task_id}`, "DELETE");

      console.error(`[Tool] Successfully deleted task "${taskDetails.name}" (ID: ${task_id})`);

      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted task "${taskDetails.name}" (ID: ${task_id})`,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to delete task: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text",
            text: `Error deleting task: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
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

main().catch(error => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
