import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { registerAllTools } from "./tools/index.js";

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

// Register all tools from the tools directory
registerAllTools(server);

// Configure server transport
const transport = new StdioServerTransport();
server.connect(transport);

console.error("[Setup] Server started and listening for requests");
