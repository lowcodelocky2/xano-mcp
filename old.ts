import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// import * as dotenv from 'dotenv'; // Comment out dotenv import

// Load environment variables from .env file
// dotenv.config(); // Comment out dotenv.config()

// Hardcoded Xano API credentials for debugging ONLY
const XANO_API_KEY = "eyJhbGciOiJSUzI1NiJ9.eyJ4YW5vIjp7ImRibyI6Im1hc3Rlcjp1c2VyIiwiaWQiOjIyNzMsImFjY2Vzc190b2tlbiI6eyJrZXlpZCI6Ijc3YzgwMjFmLWU1N2EtNDJlMS1iNGZjLTVhNWYxYTUxZjVmOSIsInNjb3BlIjp7IndvcmtzcGFjZTphZGRvbiI6MTUsIndvcmtzcGFjZTphcGkiOjE1LCJ3b3Jrc3BhY2U6Y29udGVudCI6MTUsIndvcmtzcGFjZTpkYXRhYmFzZSI6MTUsIndvcmtzcGFjZTpkYXRhc291cmNlOmxpdmUiOjE1LCJ3b3Jrc3BhY2U6ZmlsZSI6MTUsIndvcmtzcGFjZTpmdW5jdGlvbiI6MTUsIndvcmtzcGFjZTpyZXF1ZXN0aGlzdG9yeSI6MTUsIndvcmtzcGFjZTp0YXNrIjoxNX19fSwiaWF0IjoxNzM4MzY0NDcyLCJuYmYiOjE3MzgzNjQ0NzIsImF1ZCI6Inhhbm86bWV0YSJ9.vouISGScMloQr0iBJl8NYVYolngHUM2gd6vbJPHmet1zwb3IueDOFeX5jN2G_t3LjJEYb9Fm965Ee6uSYMtGBWhoZq_sDeRyiJIDOjW1hHp4lqEDjTtd7owxAzTyn3sULsMvjkPn-HJzu3y26KezuMJF32zpj9kVqosi4OuQoC9UTpRlPVZwkrekgamksMo8vG8IdhYXDSLNlT45QHbLjhNAd3R-CgjrUSh4DPF3P5fhsoi-W4uY3GC0vuLyjBp3W3yNILlEN2kk2q8gOeJSpndxQnhU_nYPb-yWizDWSE0VBDNRtJbaq8E8mnWKE_AbOInupxW-jtd7Cz8ydSLiCUmB6cxfZPIoW_Vd3kKe4IFkdCttw1Yoe90pDuXOs3a-yxarPcdQ9BYk5Lng7QhXTolxvll-utiYWZaNYvlv8opiLU2MgCO2lUV_hsHynqRnhG4HLJGvFUrjnMd1_gZ1y_SbXqD3ldmEyfVnHLixt2OWtx0ACGXm9Kxf8gYnfc_c8o6jOciDj74J87ascvdSE0ByHqeszYBYzRBGKm5Hic37EOp2HucibO4owRTluVt2y31ILjP1UEjuOOKGV9j9JO_bO5KQxkq2V4OpBggbnGsSwjezpG5L77bpYERoTOPaVVSiPK5GG12tlva6OzFt6Aa9LxuQw-37U-wA1wgH6uQ"; // Replace with your actual API key (temporarily!)
const XANO_WORKSPACE = 6; // Replace with your Workspace ID
const XANO_API_BASE = "https://xovr-dnoq-mt6l.d2.dev.xano.io/api:meta"; // Replace with your API base URL (e.g., "https://example.xano.io/api:v1")

// Add type definition at the top of the file, after imports
interface TableCreateResponse {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  docs: string;
  guid: string;
  auth: boolean;
  tag: string[];
}

// Add type definition at the top of the file, after imports
interface ApiResponse {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  docs: string;
  guid: string;
  cache?: {
    active?: boolean;
    ttl?: number;
    input?: boolean;
    auth?: boolean;
    datasource?: boolean;
    ip?: boolean;
    headers?: string[];
    env?: string[];
  };
  auth?: Record<string, any>;
  verb: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH' | 'HEAD';
  input?: any[];
  tag?: string[];
}

// Create a recursive type for schema elements
interface SchemaElement {
  name: string;
  type: string;
  description?: string;
  nullable?: boolean;
  default?: string;
  required?: boolean;
  access?: 'public' | 'private' | 'internal';
  style?: 'single' | 'list';
  config?: Record<string, any>;
  validators?: {
    trim?: boolean;
    lower?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    precision?: number;
    scale?: number;
  };
  children?: SchemaElement[];
}

// Add after the SchemaElement interface definition
const baseSchemaFields = {
  name: z.string().describe("Name of the schema element"),
  type: z.enum([
    'attachment', 'audio', 'bool', 'date', 'decimal', 'email', 
    'enum', 'geo_linestring', 'geo_multilinestring', 'geo_multipoint', 
    'geo_multipolygon', 'geo_point', 'geo_polygon', 'image', 'int', 
    'json', 'object', 'password', 'tableref', 'tablerefuuid', 'text', 
    'timestamp', 'uuid', 'vector', 'video'
  ]).describe("Type of the schema element"),
  description: z.string().optional().describe("Description of the schema element"),
  nullable: z.boolean().optional().describe("Whether the field can be null").default(false),
  default: z.string().optional().describe("Default value for the field"),
  required: z.boolean().optional().describe("Whether the field is required").default(false),
  access: z.enum(['public', 'private', 'internal']).optional().describe("Access level for the field").default('public'),
  style: z.enum(['single', 'list']).optional().describe("Whether the field is a single value or a list").default('single'),
  config: z.record(z.any()).optional().describe("Additional configuration for specific field types"),
  validators: z.object({
    trim: z.boolean().optional(),
    lower: z.boolean().optional(),
    maxLength: z.number().optional(),
    minLength: z.number().optional(),
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    precision: z.number().optional(),
    scale: z.number().optional()
  }).optional().describe("Validation rules for the field")
} as const;

const schemaElement: z.ZodType<SchemaElement> = z.lazy(() => 
  z.object({
    ...baseSchemaFields,
    children: z.array(schemaElement).optional().describe("Nested fields for object types")
  })
);

// Create server instance
const server = new McpServer({
  name: "xano-mcp",
  version: "1.0.0",
});

// Helper function for making Xano API requests
async function makeXanoRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any): Promise<T> {
  const url = new URL(`${XANO_API_BASE}${endpoint}`);
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${XANO_API_KEY}`,
    'X-Workspace': String(XANO_WORKSPACE)
  };

  const options: RequestInit = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) })
  };

  const response = await fetch(url.toString(), options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

console.error("Registering tools...");

const registeredTools = [];

// Register add-table tool
server.tool(
  "add-table",
  "Add a new table to the Xano database",
  {
    name: z.string().describe("Name of the table"),
    description: z.string().optional().describe("Description of the table"),
    schema: z.array(schemaElement).optional().describe("Schema configuration for the table")
  },
  async ({ name, description, schema }) => {
    console.error(`Adding table: ${name}`);
    try {
      // Make a single request with both table and schema
      const createTableResult = await makeXanoRequest<TableCreateResponse>(
        `/workspace/${XANO_WORKSPACE}/table`, 
        'POST', 
        {
          name,
          description,
          schema: schema || []
        }
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully created table "${name}"${description ? ` with description: ${description}` : ''}${schema ? ` and ${schema.length} schema elements` : ''}`
          }
        ]
      };
    } catch (error) {
      console.error('Error adding table:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to add table: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("add-table");

// Register list-tables tool
server.tool(
  "list-tables",
  "Browse all tables in the Xano workspace",
  {},
  async () => {
    console.error("Listing tables");
    try {
      const result = await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/table`);
      
      return {
        content: [
          {
            type: "text",
            text: `Tables in workspace:\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error listing tables:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to list tables: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("list-tables");

// Register get-table tool
server.tool(
  "get-table",
  "Get details of a specific table in the Xano workspace",
  {
    table_id: z.string().describe("ID of the table to retrieve")
  },
  async ({ table_id }) => {
    console.error(`Getting table: ${table_id}`);
    try {
      const result = await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/table/${table_id}`);
      
      return {
        content: [
          {
            type: "text",
            text: `Table details:\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error getting table:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get table: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("get-table");

// Register delete-table tool
server.tool(
  "delete-table",
  "Delete a table from the Xano workspace",
  {
    table_id: z.string().describe("ID of the table to delete")
  },
  async ({ table_id }) => {
    console.error(`[delete-table] Tool handler START - table_id: ${table_id}`);
    try {
      console.error(`[delete-table] Making Xano API request to delete table: ${table_id}`);
      await makeXanoRequest(`/workspace/${XANO_WORKSPACE}/table/${table_id}`, 'DELETE');
      console.error(`[delete-table] Xano API request SUCCESSFUL for table_id: ${table_id}`);
      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted table with ID: ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error(`[delete-table] Xano API request ERROR for table_id: ${table_id}`, error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to delete table: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    } finally {
      console.error(`[delete-table] Tool handler END - table_id: ${table_id}`);
    }
  }
);
registeredTools.push("delete-table");

// Register update-table-meta tool
server.tool(
  "update-table-meta",
  "Update table metadata",
  {
    table_id: z.string().describe("ID of the table to update metadata for"),
    metadata: z.object({
      name: z.string().optional().describe("New table name"),
      description: z.string().optional().describe("New table description"),
      tags: z.array(z.string()).optional().describe("Table tags")
    }).describe("Metadata to update")
  },
  async ({ table_id, metadata }) => {
    console.error(`Updating metadata for table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/meta`,
        'PUT',
        metadata
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully updated metadata for table ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error updating table metadata:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to update table metadata: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("update-table-meta");


// Register create-table-content tool
server.tool(
  "create-table-content",
  "Create new content in a table",
  {
    table_id: z.string().describe("ID of the table to create content in"),
    content: z.record(z.any()).describe("Content to create in the table")
  },
  async ({ table_id, content }) => {
    console.error(`Creating content in table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/content`,
        'POST',
        content
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully created content in table ${table_id}: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error creating table content:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to create table content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("create-table-content");

// Register browse-table-content tool
server.tool(
  "browse-table-content",
  "Browse content in a table",
  {
    table_id: z.string().describe("ID of the table to browse content from"),
    page: z.number().optional().describe("Page number for pagination"),
    per_page: z.number().optional().describe("Number of items per page")
  },
  async ({ table_id, page, per_page }) => {
    console.error(`Browsing content in table: ${table_id}`);
    try {
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', String(page));
      if (per_page) queryParams.append('per_page', String(per_page));
      
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/content${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Table content: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error browsing table content:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to browse table content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("browse-table-content");

// Register get-table-content tool
server.tool(
  "get-table-content",
  "Get specific content from a table",
  {
    table_id: z.string().describe("ID of the table"),
    content_id: z.string().describe("ID of the content to retrieve")
  },
  async ({ table_id, content_id }) => {
    console.error(`Getting content ${content_id} from table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/content/${content_id}`
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Content details: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error getting table content:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get table content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("get-table-content");

// Register update-table-content tool
server.tool(
  "update-table-content",
  "Update existing content in a table",
  {
    table_id: z.string().describe("ID of the table"),
    content_id: z.string().describe("ID of the content to update"),
    content: z.record(z.any()).describe("Updated content data")
  },
  async ({ table_id, content_id, content }) => {
    console.error(`Updating content ${content_id} in table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/content/${content_id}`,
        'PUT',
        content
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully updated content ${content_id} in table ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error updating table content:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to update table content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("update-table-content");

// Register delete-table-content tool
server.tool(
  "delete-table-content",
  "Delete content from a table",
  {
    table_id: z.string().describe("ID of the table"),
    content_id: z.string().describe("ID of the content to delete")
  },
  async ({ table_id, content_id }) => {
    console.error(`Deleting content ${content_id} from table: ${table_id}`);
    try {
      await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/content/${content_id}`,
        'DELETE'
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted content ${content_id} from table ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error deleting table content:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to delete table content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("delete-table-content");

// Register search-table-content tool
server.tool(
  "search-table-content",
  "Search content in a table with filtering and sorting",
  {
    table_id: z.string().describe("ID of the table to search in"),
    search_params: z.object({
      filter: z.record(z.any()).optional().describe("Filter criteria"),
      sort: z.array(z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc'])
      })).optional().describe("Sort criteria"),
      page: z.number().optional().describe("Page number"),
      per_page: z.number().optional().describe("Items per page")
    }).describe("Search parameters")
  },
  async ({ table_id, search_params }) => {
    console.error(`Searching content in table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/content/search`,
        'POST',
        search_params
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Search results: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error searching table content:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to search table content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("search-table-content");

// Register patch-table-content-by-search tool
server.tool(
  "patch-table-content-by-search",
  "Update content matching search criteria",
  {
    table_id: z.string().describe("ID of the table"),
    search_params: z.object({
      filter: z.record(z.any()).describe("Filter criteria to match records")
    }).describe("Search parameters"),
    patch_data: z.record(z.any()).describe("Data to update in matching records")
  },
  async ({ table_id, search_params, patch_data }) => {
    console.error(`Patching content by search in table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/content/search/patch`,
        'POST',
        {
          search: search_params,
          patch: patch_data
        }
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully patched matching content in table ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error patching table content by search:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to patch table content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("patch-table-content-by-search");

// Register delete-table-content-by-search tool
server.tool(
  "delete-table-content-by-search",
  "Delete content matching search criteria",
  {
    table_id: z.string().describe("ID of the table"),
    search_params: z.object({
      filter: z.record(z.any()).describe("Filter criteria to match records to delete")
    }).describe("Search parameters")
  },
  async ({ table_id, search_params }) => {
    console.error(`Deleting content by search in table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/content/search/delete`,
        'POST',
        search_params
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted matching content in table ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error deleting table content by search:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to delete table content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("delete-table-content-by-search");

// Register bulk-create-table-content tool
server.tool(
  "bulk-create-table-content",
  "Create multiple content records at once",
  {
    table_id: z.string().describe("ID of the table"),
    records: z.array(z.record(z.any())).describe("Array of records to create")
  },
  async ({ table_id, records }) => {
    console.error(`Bulk creating content in table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/content/bulk`,
        'POST',
        { records }
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully created ${records.length} records in table ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error bulk creating table content:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to bulk create content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("bulk-create-table-content");

// Register bulk-patch-table-content tool
server.tool(
  "bulk-patch-table-content",
  "Update multiple content records at once",
  {
    table_id: z.string().describe("ID of the table"),
    operations: z.array(z.object({
      id: z.string().describe("ID of the record to update"),
      patch: z.record(z.any()).describe("Data to update in the record")
    })).describe("Array of update operations")
  },
  async ({ table_id, operations }) => {
    console.error(`Bulk patching content in table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/content/bulk/patch`,
        'POST',
        { operations }
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully patched ${operations.length} records in table ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error bulk patching table content:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to bulk patch content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("bulk-patch-table-content");

// Register bulk-delete-table-content tool
server.tool(
  "bulk-delete-table-content",
  "Delete multiple content records at once",
  {
    table_id: z.string().describe("ID of the table"),
    record_ids: z.array(z.string()).describe("Array of record IDs to delete")
  },
  async ({ table_id, record_ids }) => {
    console.error(`Bulk deleting content in table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/content/bulk/delete`,
        'POST',
        { ids: record_ids }
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted ${record_ids.length} records from table ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error bulk deleting table content:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to bulk delete content: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("bulk-delete-table-content");

// Register truncate-table tool
server.tool(
  "truncate-table",
  "Delete all content from a table",
  {
    table_id: z.string().describe("ID of the table to truncate"),
    reset_primary_key: z.boolean().optional().describe("Whether to reset the primary key sequence")
  },
  async ({ table_id, reset_primary_key }) => {
    console.error(`Truncating table: ${table_id}`);
    try {
      await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/truncate`,
        'DELETE',
        reset_primary_key ? { reset_primary_key } : undefined
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully truncated table ${table_id}${reset_primary_key ? ' and reset primary key' : ''}`
          }
        ]
      };
    } catch (error) {
      console.error('Error truncating table:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to truncate table: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("truncate-table");

// Register browse-table-schema tool
server.tool(
  "browse-table-schema",
  "Browse the schema of a table",
  {
    table_id: z.string().describe("ID of the table to get schema from")
  },
  async ({ table_id }) => {
    console.error(`Browsing schema for table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema`
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Table schema: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error browsing table schema:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to browse table schema: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("browse-table-schema");

// Register replace-table-schema tool
server.tool(
  "replace-table-schema",
  "Replace the entire schema of a table",
  {
    table_id: z.string().describe("ID of the table"),
    schema: z.array(z.object({
      name: z.string().describe("Name of the schema element"),
      type: z.enum([
        'attachment', 'audio', 'bool', 'date', 'decimal', 'email', 
        'enum', 'geo_linestring', 'geo_multilinestring', 'geo_multipoint', 
        'geo_multipolygon', 'geo_point', 'geo_polygon', 'image', 'int', 
        'json', 'object', 'password', 'tableref', 'tablerefuuid', 'text', 
        'timestamp', 'uuid', 'vector', 'video'
      ]).describe("Type of the schema element"),
      config: z.record(z.any()).optional().describe("Configuration for the schema element")
    })).describe("New schema definition")
  },
  async ({ table_id, schema }) => {
    console.error(`Replacing schema for table: ${table_id}`);
    try {
      // Validate schema configurations based on type
      const validatedSchema = schema.map(element => {
        const config = element.config || {};
        
        // Add type-specific validation and defaults
        switch (element.type) {
          case 'text':
            config.maxLength = config.maxLength || 255;
            break;
          case 'int':
            config.min = typeof config.min === 'number' ? config.min : null;
            config.max = typeof config.max === 'number' ? config.max : null;
            break;
          case 'decimal':
            config.precision = config.precision || 10;
            config.scale = config.scale || 2;
            break;
          case 'enum':
            if (!Array.isArray(config.values) || config.values.length === 0) {
              throw new Error(`Enum type '${element.name}' must have values array`);
            }
            break;
          case 'tableref':
          case 'tablerefuuid':
            if (!config.table) {
              throw new Error(`Table reference '${element.name}' must specify target table`);
            }
            break;
          // Add more type-specific validation as needed
        }

        return {
          ...element,
          config
        };
      });

      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema`,
        'PUT',
        validatedSchema
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully replaced schema for table ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error replacing table schema:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to replace table schema: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("replace-table-schema");

// Register get-schema-element tool
server.tool(
  "get-schema-element",
  "Get details of a specific schema element",
  {
    table_id: z.string().describe("ID of the table"),
    schema_name: z.string().describe("Name of the schema element to retrieve")
  },
  async ({ table_id, schema_name }) => {
    console.error(`Getting schema element ${schema_name} from table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/${schema_name}`
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Schema element details: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error getting schema element:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get schema element: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("get-schema-element");

// Register delete-schema-element tool
server.tool(
  "delete-schema-element",
  "Delete a specific schema element",
  {
    table_id: z.string().describe("ID of the table"),
    schema_name: z.string().describe("Name of the schema element to delete")
  },
  async ({ table_id, schema_name }) => {
    console.error(`Deleting schema element ${schema_name} from table: ${table_id}`);
    try {
      await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/${schema_name}`,
        'DELETE'
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted schema element ${schema_name} from table ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error deleting schema element:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to delete schema element: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("delete-schema-element");

// Register rename-schema-column tool
server.tool(
  "rename-schema-column",
  "Rename a column in the table schema",
  {
    table_id: z.string().describe("ID of the table"),
    rename_params: z.object({
      old_name: z.string().describe("Current name of the column"),
      new_name: z.string().describe("New name for the column")
    }).describe("Column rename parameters")
  },
  async ({ table_id, rename_params }) => {
    console.error(`Renaming schema column in table: ${table_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/rename`,
        'POST',
        rename_params
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully renamed column from ${rename_params.old_name} to ${rename_params.new_name} in table ${table_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error renaming schema column:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to rename schema column: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("rename-schema-column");

// Helper function to create schema element
async function createSchemaElement(table_id: string, element: { name: string, type: string, config?: any }) {
  console.error(`Creating schema element ${element.name} of type ${element.type} in table: ${table_id}`);
  try {
    const result = await makeXanoRequest(
      `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/type/${element.type}`,
      'POST',
      {
        name: element.name,
        ...element.config
      }
    );
    
    return {
      content: [
        {
          type: "text" as const,
          text: `Successfully created ${element.type} schema element '${element.name}' in table ${table_id}`
        }
      ]
    };
  } catch (error) {
    console.error(`Error creating schema element: ${error}`);
    return {
      content: [
        {
          type: "text" as const,
          text: `Failed to create schema element: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}

// Register batch-update-schema tool
server.tool(
  "batch-update-schema",
  "Batch update schema elements in a table",
  {
    table_id: z.string().describe("ID of the table"),
    updates: z.array(z.object({
      action: z.enum(['create', 'update', 'delete']).describe("Action to perform on the schema element"),
      name: z.string().describe("Name of the schema element"),
      type: z.enum([
        'attachment', 'audio', 'bool', 'date', 'decimal', 'email', 
        'enum', 'geo_linestring', 'geo_multilinestring', 'geo_multipoint', 
        'geo_multipolygon', 'geo_point', 'geo_polygon', 'image', 'int', 
        'json', 'object', 'password', 'tableref', 'tablerefuuid', 'text', 
        'timestamp', 'uuid', 'vector', 'video'
      ]).optional().describe("Type of the schema element (required for create)"),
      config: z.record(z.any()).optional().describe("Configuration for the schema element")
    })).describe("Array of schema updates to apply")
  },
  async ({ table_id, updates }) => {
    console.error(`Batch updating schema for table: ${table_id}`);

    let results = [];
    for (const update of updates) {
      try {
        let result;
        if (update.action === 'create') {
          if (!update.type) throw new Error(`Type is required for creating schema element ${update.name}`);
          result = await createSchemaElement(table_id, { name: update.name, type: update.type, config: update.config });
          results.push({ name: update.name, success: true, message: `Created schema element ${update.name}` });
        } else if (update.action === 'update') {
          await makeXanoRequest(
            `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/${update.name}`,
            'PUT',
            update.config
          );
          results.push({ name: update.name, success: true, message: `Updated schema element ${update.name}` });
        } else if (update.action === 'delete') {
          await makeXanoRequest(
            `/workspace/${XANO_WORKSPACE}/table/${table_id}/schema/${update.name}`,
            'DELETE'
          );
          results.push({ name: update.name, success: true, message: `Deleted schema element ${update.name}` });
        } else {
          throw new Error(`Invalid action: ${update.action}`);
        }
      } catch (error) {
        console.error(`Error processing schema update for ${update.name}:`, error);
        results.push({ name: update.name, success: false, message: error instanceof Error ? error.message : String(error) });
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Batch schema update completed:\n${JSON.stringify(results, null, 2)}`
        }
      ]
    };
  }
);
registeredTools.push("batch-update-schema");

// Register list-api-groups tool
server.tool(
  "list-api-groups",
  "Browse API groups within a workspace",
  {
    workspace_id: z.number().describe("ID of the workspace"),
    branch: z.string().optional().describe("Branch name to filter by"),
    page: z.number().optional().describe("Page number for pagination"),
    per_page: z.number().optional().describe("Number of items per page"),
    search: z.string().optional().describe("Search term"),
    sort: z.enum(['created_at', 'updated_at', 'name']).optional().describe("Field to sort by"),
    order: z.enum(['asc', 'desc']).optional().describe("Sort order")
  },
  async ({ workspace_id, branch, page, per_page, search, sort, order }) => {
    console.error(`Listing API groups for workspace: ${workspace_id}`);
    try {
      const queryParams = new URLSearchParams();
      if (branch) queryParams.append('branch', branch);
      if (page) queryParams.append('page', String(page));
      if (per_page) queryParams.append('per_page', String(per_page));
      if (search) queryParams.append('search', search);
      if (sort) queryParams.append('sort', sort);
      if (order) queryParams.append('order', order);

      const result = await makeXanoRequest(
        `/workspace/${workspace_id}/apigroup${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      
      return {
        content: [
          {
            type: "text",
            text: `API Groups: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error listing API groups:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to list API groups: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("list-api-groups");

// Register get-api-group tool
server.tool(
  "get-api-group",
  "Get details of a specific API group",
  {
    workspace_id: z.number().describe("ID of the workspace"),
    apigroup_id: z.number().describe("ID of the API group")
  },
  async ({ workspace_id, apigroup_id }) => {
    console.error(`Getting API group ${apigroup_id} from workspace: ${workspace_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${workspace_id}/apigroup/${apigroup_id}`
      );
      
      return {
        content: [
          {
            type: "text",
            text: `API Group details: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error getting API group:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get API group: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("get-api-group");

// Register add-api-group tool
server.tool(
  "add-api-group",
  "Create a new API group",
  {
    workspace_id: z.number().describe("ID of the workspace"),
    name: z.string().describe("Name of the API group"),
    description: z.string().describe("Description of the API group"),
    docs: z.string().optional().describe("Documentation for the API group"),
    swagger: z.boolean().describe("Whether to enable Swagger documentation"),
    tag: z.array(z.string()).optional().describe("Tags for the API group"),
    branch: z.string().optional().describe("Branch name")
  },
  async ({ workspace_id, name, description, docs, swagger, tag, branch }) => {
    console.error(`Creating API group in workspace: ${workspace_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${workspace_id}/apigroup`,
        'POST',
        {
          name,
          description,
          docs,
          swagger,
          tag,
          branch
        }
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully created API group: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error creating API group:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to create API group: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("add-api-group");

// Register update-api-group tool
server.tool(
  "update-api-group",
  "Update an existing API group",
  {
    workspace_id: z.number().describe("ID of the workspace"),
    apigroup_id: z.number().describe("ID of the API group"),
    name: z.string().describe("New name for the API group"),
    description: z.string().describe("New description for the API group"),
    docs: z.string().optional().describe("New documentation for the API group"),
    swagger: z.boolean().describe("Whether to enable Swagger documentation"),
    tag: z.array(z.string()).optional().describe("New tags for the API group")
  },
  async ({ workspace_id, apigroup_id, name, description, docs, swagger, tag }) => {
    console.error(`Updating API group ${apigroup_id} in workspace: ${workspace_id}`);
    try {
      const result = await makeXanoRequest(
        `/workspace/${workspace_id}/apigroup/${apigroup_id}`,
        'PUT',
        {
          name,
          description,
          docs,
          swagger,
          tag
        }
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully updated API group ${apigroup_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error updating API group:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to update API group: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("update-api-group");

// Register delete-api-group tool
server.tool(
  "delete-api-group",
  "Delete an API group",
  {
    workspace_id: z.number().describe("ID of the workspace"),
    apigroup_id: z.number().describe("ID of the API group")
  },
  async ({ workspace_id, apigroup_id }) => {
    console.error(`Deleting API group ${apigroup_id} from workspace: ${workspace_id}`);
    try {
      await makeXanoRequest(
        `/workspace/${workspace_id}/apigroup/${apigroup_id}`,
        'DELETE'
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted API group ${apigroup_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error deleting API group:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to delete API group: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("delete-api-group");

// Register list-apis tool
server.tool(
  "list-apis",
  "Browse APIs within an API group",
  {
    workspace_id: z.number().describe("ID of the workspace"),
    apigroup_id: z.number().describe("ID of the API group"),
    page: z.number().optional().describe("Page number for pagination"),
    per_page: z.number().optional().describe("Number of items per page"),
    search: z.string().optional().describe("Search term"),
    sort: z.enum(['created_at', 'updated_at', 'name']).optional().describe("Field to sort by"),
    order: z.enum(['asc', 'desc']).optional().describe("Sort order")
  },
  async ({ workspace_id, apigroup_id, page, per_page, search, sort, order }) => {
    console.error(`Listing APIs for group ${apigroup_id} in workspace: ${workspace_id}`);
    try {
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', String(page));
      if (per_page) queryParams.append('per_page', String(per_page));
      if (search) queryParams.append('search', search);
      if (sort) queryParams.append('sort', sort);
      if (order) queryParams.append('order', order);

      const result = await makeXanoRequest(
        `/workspace/${workspace_id}/apigroup/${apigroup_id}/api${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      
      return {
        content: [
          {
            type: "text",
            text: `APIs in group: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error listing APIs:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to list APIs: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("list-apis");

// Register get-api tool
server.tool(
  "get-api",
  "Get details of a specific API",
  {
    workspace_id: z.number().describe("ID of the workspace"),
    apigroup_id: z.number().describe("ID of the API group"),
    api_id: z.number().describe("ID of the API")
  },
  async ({ workspace_id, apigroup_id, api_id }) => {
    console.error(`Getting API ${api_id} from group ${apigroup_id} in workspace: ${workspace_id}`);
    try {
      const result = await makeXanoRequest(
        `/beta/workspace/${workspace_id}/apigroup/${apigroup_id}/api/${api_id}`
      );
      
      return {
        content: [
          {
            type: "text",
            text: `API details: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error getting API:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get API: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("get-api");

// Register add-api tool
server.tool(
  "add-api",
  "Create a new API",
  {
    workspace_id: z.number().describe("ID of the workspace"),
    apigroup_id: z.number().describe("ID of the API group"),
    name: z.string().describe("Name of the API"),
    description: z.string().describe("Description of the API"),
    docs: z.string().optional().describe("Documentation for the API"),
    verb: z.enum(['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'HEAD']).describe("HTTP verb for the API"),
    tag: z.array(z.string()).optional().describe("Tags for the API"),
    type: z.enum(['xs', 'json', 'yaml']).default('xs').describe("Type of API script"),
    script: z.string().describe("API implementation script")
  },
  async ({ workspace_id, apigroup_id, name, description, docs, verb, tag, type, script }) => {
    console.error(`Creating API in group ${apigroup_id} in workspace: ${workspace_id}`);
    try {
      // First create the API metadata
      const metadataResult = await makeXanoRequest<ApiResponse>(
        `/workspace/${workspace_id}/apigroup/${apigroup_id}/api`,
        'POST',
        {
          name,
          description,
          docs,
          verb,
          tag
        }
      );

      // Then update the API implementation if script is provided
      if (script) {
        await makeXanoRequest(
          `/beta/workspace/${workspace_id}/apigroup/${apigroup_id}/api/${metadataResult.id}`,
          'PUT',
          {
            type,
            script
          }
        );
      }
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully created API: ${JSON.stringify(metadataResult, null, 2)}`
          }
        ]
      };
    } catch (error) {
      console.error('Error creating API:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to create API: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("add-api");

// Register update-api tool
server.tool(
  "update-api",
  "Update an existing API",
  {
    workspace_id: z.number().describe("ID of the workspace"),
    apigroup_id: z.number().describe("ID of the API group"),
    api_id: z.number().describe("ID of the API"),
    name: z.string().optional().describe("New name for the API"),
    description: z.string().optional().describe("New description for the API"),
    docs: z.string().optional().describe("New documentation for the API"),
    verb: z.enum(['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'HEAD']).optional().describe("New HTTP verb for the API"),
    tag: z.array(z.string()).optional().describe("New tags for the API"),
    cache: z.object({
      active: z.boolean().optional(),
      ttl: z.number().optional(),
      input: z.boolean().optional(),
      auth: z.boolean().optional(),
      datasource: z.boolean().optional(),
      ip: z.boolean().optional(),
      headers: z.array(z.string()).optional(),
      env: z.array(z.string()).optional()
    }).optional().describe("Cache configuration"),
    type: z.enum(['xs', 'json', 'yaml']).optional().describe("Type of API script"),
    script: z.string().optional().describe("New API implementation script")
  },
  async ({ workspace_id, apigroup_id, api_id, name, description, docs, verb, tag, cache, type, script }) => {
    console.error(`Updating API ${api_id} in group ${apigroup_id} in workspace: ${workspace_id}`);
    try {
      // Update API metadata if any metadata fields are provided
      if (name || description || docs || verb || tag || cache) {
        await makeXanoRequest(
          `/workspace/${workspace_id}/apigroup/${apigroup_id}/api/${api_id}`,
          'PUT',
          {
            name,
            description,
            docs,
            verb,
            tag,
            cache
          }
        );
      }

      // Update API implementation if script is provided
      if (script) {
        await makeXanoRequest(
          `/beta/workspace/${workspace_id}/apigroup/${apigroup_id}/api/${api_id}`,
          'PUT',
          {
            type: type || 'xs',
            script
          }
        );
      }
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully updated API ${api_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error updating API:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to update API: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("update-api");

// Register delete-api tool
server.tool(
  "delete-api",
  "Delete an API",
  {
    workspace_id: z.number().describe("ID of the workspace"),
    apigroup_id: z.number().describe("ID of the API group"),
    api_id: z.number().describe("ID of the API")
  },
  async ({ workspace_id, apigroup_id, api_id }) => {
    console.error(`Deleting API ${api_id} from group ${apigroup_id} in workspace: ${workspace_id}`);
    try {
      await makeXanoRequest(
        `/workspace/${workspace_id}/apigroup/${apigroup_id}/api/${api_id}`,
        'DELETE'
      );
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted API ${api_id}`
          }
        ]
      };
    } catch (error) {
      console.error('Error deleting API:', error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to delete API: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
);
registeredTools.push("delete-api");

console.error("Tools registered successfully");

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
