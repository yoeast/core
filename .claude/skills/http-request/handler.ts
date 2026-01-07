/**
 * HTTP Request Skill
 * 
 * Make HTTP requests to external APIs.
 */

interface Input {
  url: string;
  method?: string;
  body?: string;
  headers?: string;
  query?: string;
  timeout?: number;
}

interface Output {
  success: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
  error?: string;
}

export async function execute(input: Input): Promise<Output> {
  const { url, method = "GET", body, timeout = 30000 } = input;

  if (!url) {
    return { success: false, error: "URL is required" };
  }

  // Build URL with query params
  let finalUrl = url;
  if (input.query) {
    try {
      const queryParams = JSON.parse(input.query);
      const urlObj = new URL(url);
      for (const [key, value] of Object.entries(queryParams)) {
        urlObj.searchParams.set(key, String(value));
      }
      finalUrl = urlObj.toString();
    } catch {
      return { success: false, error: "Invalid query JSON" };
    }
  }

  // Parse headers
  let headers: Record<string, string> = {};
  if (input.headers) {
    try {
      headers = JSON.parse(input.headers);
    } catch {
      return { success: false, error: "Invalid headers JSON" };
    }
  }

  // Set content-type for JSON body
  if (body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(finalUrl, {
      method,
      headers,
      body: body || undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Parse response body
    let responseBody: unknown;
    const contentType = response.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      try {
        responseBody = await response.json();
      } catch {
        responseBody = await response.text();
      }
    } else {
      responseBody = await response.text();
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { success: false, error: `Request timed out after ${timeout}ms` };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: String(error) };
  }
}
