// Helper function to process Swagger spec into concise markdown
export function processSwaggerToMarkdown(swaggerSpec: any, apiGroupName: string): string {
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
