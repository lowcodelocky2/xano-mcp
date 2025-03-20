import { type RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { z } from "zod";
import { XanoApi, McpToolResponse } from "../types.js";
import { makeXanoRequest } from "../api.js";

const XANO_WORKSPACE = parseInt(process.env.XANO_WORKSPACE!) || 1;

// List APIs in an API Group
export const listApis = {
  name: "list-apis",
  description: "Browse APIs in a specific API group",
  parameters: {
    apigroup_id: z.string().describe("ID of the API group to browse"),
    page: z.number().optional().describe("Page number for pagination"),
    per_page: z.number().optional().describe("Number of items per page"),
    search: z.string().optional().describe("Search term to filter APIs"),
    sort: z.enum(["created_at", "updated_at", "name"]).optional().describe("Field to sort by"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
  },
  handler: async (
    {
      apigroup_id,
      page,
      per_page,
      search,
      sort,
      order,
    }: {
      apigroup_id: string;
      page?: number;
      per_page?: number;
      search?: string;
      sort?: "created_at" | "updated_at" | "name";
      order?: "asc" | "desc";
    },
    __: RequestHandlerExtra
  ): Promise<McpToolResponse> => {
    console.error(`[Tool] Executing list-apis for API group ID: ${apigroup_id}`);
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
            type: "text" as const,
            text: formattedContent,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[Error] Failed to list APIs: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing APIs: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Create API in an API Group
export const createApi = {
  name: "create-api",
  description: "Add a new API to an API group",
  parameters: {
    apigroup_id: z.string().describe("ID of the API group to add the API to"),
    name: z.string().describe("Name of the API"),
    description: z.string().describe("Description of the API"),
    docs: z.string().optional().describe("Documentation for the API"),
    verb: z
      .enum(["GET", "POST", "DELETE", "PUT", "PATCH", "HEAD"])
      .describe("HTTP verb for the API"),
    tag: z.array(z.string()).optional().describe("Tags to associate with the API"),
  },
  handler: async (
    {
      apigroup_id,
      name,
      description,
      docs,
      verb,
      tag,
    }: {
      apigroup_id: string;
      name: string;
      description: string;
      docs?: string;
      verb: "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "HEAD";
      tag?: string[];
    },
    __: RequestHandlerExtra
  ) => {
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
            type: "text" as const,
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
            type: "text" as const,
            text: `Error adding API: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Get API Details
export const getApiDetails = {
  name: "get-api-details",
  description: "Get details for a specific API endpoint",
  parameters: {
    apigroup_id: z.string().describe("ID of the API group containing the API"),
    api_id: z.string().describe("ID of the API to get details for"),
  },
  handler: async (
    {
      apigroup_id,
      api_id,
    }: {
      apigroup_id: string;
      api_id: string;
    },
    __: RequestHandlerExtra
  ) => {
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
            type: "text" as const,
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
            type: "text" as const,
            text: `Error getting API details: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Interface for cache configuration
interface CacheConfig {
  active: boolean;
  ttl?: number;
  input?: boolean;
  auth?: boolean;
  datasource?: boolean;
  ip?: boolean;
  headers?: string[];
}

// Update API
export const updateApi = {
  name: "update-api",
  description: "Update an existing API endpoint",
  parameters: {
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
  handler: async (
    {
      apigroup_id,
      api_id,
      name,
      description,
      docs,
      verb,
      tag,
      cache,
    }: {
      apigroup_id: string;
      api_id: string;
      name: string;
      description: string;
      docs?: string;
      verb: "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "HEAD";
      tag?: string[] | null;
      cache?: CacheConfig;
    },
    __: RequestHandlerExtra
  ) => {
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
            type: "text" as const,
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
            type: "text" as const,
            text: `Error updating API: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Delete API
export const deleteApi = {
  name: "delete-api",
  description: "Delete an API endpoint from an API group",
  parameters: {
    apigroup_id: z.string().describe("ID of the API group containing the API"),
    api_id: z.string().describe("ID of the API to delete"),
  },
  handler: async (
    {
      apigroup_id,
      api_id,
    }: {
      apigroup_id: string;
      api_id: string;
    },
    __: RequestHandlerExtra
  ) => {
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
            type: "text" as const,
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
            type: "text" as const,
            text: `Error deleting API: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};

export const apiEndpointTools = [listApis, createApi, getApiDetails, updateApi, deleteApi];
