// Xano specific types
export interface XanoTable {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// API Group and API interfaces
export interface XanoApiGroup {
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

export interface XanoApi {
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

// MCP Tool response type
export interface McpToolResponse {
  content: Array<
    | {
        type: "text";
        text: string;
      }
    | {
        type: "image";
        data: string;
        mimeType: string;
      }
    | {
        type: "resource";
        resource:
          | {
              text: string;
              uri: string;
              mimeType?: string;
            }
          | {
              uri: string;
              blob: string;
              mimeType?: string;
            };
      }
  >;
  isError?: boolean;
  [key: string]: unknown;
}
