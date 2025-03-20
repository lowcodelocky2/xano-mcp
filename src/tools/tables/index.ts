import { z } from "zod";
import { XanoTable, McpToolResponse } from "../types.js";
import { makeXanoRequest } from "../api.js";
import { type RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

const XANO_WORKSPACE = parseInt(process.env.XANO_WORKSPACE!) || 1;

// List Tables Tool
export const listTables = {
  name: "list-tables",
  description: "Browse all tables in the Xano workspace",
  parameters: {},
  handler: async (_: Record<string, never>, __: RequestHandlerExtra): Promise<McpToolResponse> => {
    console.error("[Tool] Executing list-tables");
    try {
      const response = await makeXanoRequest<{ items: XanoTable[] }>(
        `/workspace/${XANO_WORKSPACE}/table`
      );
      const tables = response.items;

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
            type: "text" as const,
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
            type: "text" as const,
            text: `Error listing tables: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Get Table Schema Tool
export const getTableSchema = {
  name: "get-table-schema",
  description: "Browse the schema of a table",
  parameters: {
    table_id: z.string().describe("ID of the table to get schema from"),
    format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe(
        "Output format: 'markdown' for readable documentation or 'json' for complete schema"
      ),
  },
  handler: async (
    { table_id, format }: { table_id: string; format: "markdown" | "json" },
    __: RequestHandlerExtra
  ) => {
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
              type: "text" as const,
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
                .map((field: any) => {
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
              type: "text" as const,
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
            type: "text" as const,
            text: `Error getting table schema: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Type for the schema field
type SchemaField = {
  name: string;
  type: string;
  description?: string;
  nullable?: boolean;
  required?: boolean;
  access?: "public" | "private" | "internal";
  style?: "single" | "list";
  default?: string;
  config?: Record<string, any>;
  validators?: {
    lower?: boolean;
    max?: number;
    maxLength?: number;
    min?: number;
    minLength?: number;
    pattern?: string;
    precision?: number;
    scale?: number;
    trim?: boolean;
  };
  children?: any[];
  tableref_id?: string;
  values?: string[];
};

// Create Table Tool with Complete Schema Support
export const createTable = {
  name: "create-table",
  description: "Add a new table to the Xano database",
  parameters: {
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
  handler: async (
    {
      name,
      description,
      schema,
    }: {
      name: string;
      description?: string;
      schema?: SchemaField[];
    },
    __: RequestHandlerExtra
  ) => {
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
                type: "text" as const,
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
            type: "text" as const,
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
            type: "text" as const,
            text: `Error creating table: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Delete Table Tool (commented out in original code)
export const deleteTable = {
  name: "delete-table",
  description: "Delete a table from the Xano workspace",
  parameters: {
    table_id: z.string().describe("ID of the table to delete"),
  },
  handler: async ({ table_id }: { table_id: string }, __: RequestHandlerExtra) => {
    console.error(`[Tool] Executing delete-table for table ID: ${table_id}`);
    try {
      await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/table/${table_id}`, "DELETE");

      console.error(`[Tool] Successfully deleted table ID: ${table_id}`);
      return {
        content: [
          {
            type: "text" as const,
            text: `Successfully deleted table with ID: ${table_id}`,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to delete table: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `Error deleting table: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Update Table Schema Tool
export const updateTableSchema = {
  name: "update-table-schema",
  description: "Edit the schema of an existing table (add, remove, or modify columns)",
  parameters: {
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
  handler: async (
    {
      table_id,
      operation,
      schema,
      column,
      rename,
      column_name,
    }: {
      table_id: string;
      operation: "update" | "add_column" | "rename_column" | "remove_column";
      schema?: SchemaField[];
      column?: {
        name: string;
        type: string;
        description?: string;
        nullable?: boolean;
        required?: boolean;
        access?: "public" | "private" | "internal";
        style?: "single" | "list";
        default?: string;
        config?: Record<string, any>;
      };
      rename?: {
        old_name: string;
        new_name: string;
      };
      column_name?: string;
    },
    __: RequestHandlerExtra
  ) => {
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
                  type: "text" as const,
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
                  type: "text" as const,
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
                  type: "text" as const,
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
                  type: "text" as const,
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
        content: [{ type: "text" as const, text: successMessage }],
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
            type: "text" as const,
            text: `Error editing table schema: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  },
};

export const tableTools = [
  listTables,
  getTableSchema,
  createTable,
  updateTableSchema,
  // Note: deleteTable is commented out in the original code
];
