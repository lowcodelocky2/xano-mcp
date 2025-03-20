import { type RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { z } from "zod";
import { XanoApiGroup } from "../types.js";
import { makeXanoRequest } from "../api.js";
import { processSwaggerToMarkdown } from "../utils.js";

const XANO_WORKSPACE = parseInt(process.env.XANO_WORKSPACE!) || 1;

// Create API Group Tool
export const createApiGroup = {
  name: "create-api-group",
  description: "Create a new API group in the Xano workspace",
  parameters: {
    name: z.string().describe("Name of the API group"),
    description: z.string().describe("Description of the API group"),
    swagger: z.boolean().describe("Whether to enable Swagger documentation"),
    docs: z.string().optional().describe("Documentation for the API group"),
    tag: z.array(z.string()).optional().nullable().describe("Tags to associate with the API group"),
    branch: z.string().optional().describe("Branch name for the API group"),
  },
  handler: async (
    {
      name,
      description,
      swagger,
      docs,
      tag,
      branch,
    }: {
      name: string;
      description: string;
      swagger: boolean;
      docs?: string;
      tag?: string[] | null;
      branch?: string;
    },
    __: RequestHandlerExtra
  ) => {
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
            type: "text" as const,
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
            type: "text" as const,
            text: `Error creating API group: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  },
};

// List API Groups Tool
export const listApiGroups = {
  name: "list-api-groups",
  description: "Browse all API groups in the Xano workspace",
  parameters: {
    page: z.number().optional().describe("Page number for pagination"),
    per_page: z.number().optional().describe("Number of items per page"),
    search: z.string().optional().describe("Search term to filter API groups"),
    sort: z.enum(["created_at", "updated_at", "name"]).optional().describe("Field to sort by"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
  },
  handler: async (
    {
      page,
      per_page,
      search,
      sort,
      order,
    }: {
      page?: number;
      per_page?: number;
      search?: string;
      sort?: "created_at" | "updated_at" | "name";
      order?: "asc" | "desc";
    },
    __: RequestHandlerExtra
  ) => {
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
            type: "text" as const,
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
            type: "text" as const,
            text: `Error listing API groups: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Get API Group Details
export const getApiGroupDetails = {
  name: "get-api-group-details",
  description: "Get details for a specific API group",
  parameters: {
    apigroup_id: z.string().describe("ID of the API group to get details for"),
  },
  handler: async ({ apigroup_id }: { apigroup_id: string }, __: RequestHandlerExtra) => {
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
            type: "text" as const,
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
            type: "text" as const,
            text: `Error getting API group details: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Update API Group
export const updateApiGroup = {
  name: "update-api-group",
  description: "Update an existing API group",
  parameters: {
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
  handler: async (
    {
      apigroup_id,
      name,
      description,
      swagger,
      docs,
      tag,
      branch,
    }: {
      apigroup_id: string;
      name: string;
      description: string;
      swagger: boolean;
      docs?: string;
      tag?: string[] | null;
      branch?: string;
    },
    __: RequestHandlerExtra
  ) => {
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
            type: "text" as const,
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
            type: "text" as const,
            text: `Error updating API group: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Delete API Group
export const deleteApiGroup = {
  name: "delete-api-group",
  description: "Delete an API group from the workspace",
  parameters: {
    apigroup_id: z.string().describe("ID of the API group to delete"),
  },
  handler: async ({ apigroup_id }: { apigroup_id: string }, __: RequestHandlerExtra) => {
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
            type: "text" as const,
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
            type: "text" as const,
            text: `Error deleting API group: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  },
};

// Get API Specification
export const getApiSpecification = {
  name: "get-api-specification",
  description:
    "Get and convert Swagger specification for an API group to a minified markdown format",
  parameters: {
    apigroup_id: z.string().describe("ID of the API group to get specification for"),
    format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe(
        "Output format: 'markdown' for concise documentation or 'json' for full specification"
      ),
  },
  handler: async (
    {
      apigroup_id,
      format,
    }: {
      apigroup_id: string;
      format: "markdown" | "json";
    },
    __: RequestHandlerExtra
  ) => {
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
              type: "text" as const,
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
              type: "text" as const,
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
              type: "text" as const,
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
            type: "text" as const,
            text: `Error getting API specification: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  },
};

export const apiGroupTools = [
  createApiGroup,
  listApiGroups,
  getApiGroupDetails,
  updateApiGroup,
  deleteApiGroup,
  getApiSpecification,
];
