// Helper function for making Xano API requests
export async function makeXanoRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any
): Promise<T> {
  const XANO_API_KEY = process.env.XANO_API_KEY!;
  const XANO_API_BASE = process.env.XANO_API_BASE!;

  const url = `${XANO_API_BASE}${endpoint}`;
  const headers = {
    "X-Api-Key": XANO_API_KEY,
    "Content-Type": "application/json",
  };

  try {
    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Xano API Error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`[Error] ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
