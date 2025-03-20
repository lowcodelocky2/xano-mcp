// Main tools index file
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tableTools } from "./tables/index.js";
import { apiGroupTools } from "./apiGroups/index.js";
import { apiEndpointTools } from "./apiEndpoints/index.js";

export function registerAllTools(server: McpServer) {
  // Register table tools
  for (const tool of tableTools) {
    server.tool(tool.name, tool.description, tool.parameters, tool.handler);
  }

  // Register API Group tools
  for (const tool of apiGroupTools) {
    server.tool(tool.name, tool.description, tool.parameters, tool.handler);
  }

  // Register API Endpoint tools
  for (const tool of apiEndpointTools) {
    server.tool(tool.name, tool.description, tool.parameters, tool.handler);
  }

  // Could add more tool categories here as they are implemented

  console.error("[Setup] Registered all tools successfully");
}
