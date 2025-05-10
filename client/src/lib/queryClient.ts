import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Enhanced error handling to provide better details
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // First try to parse as JSON for structured error
      const jsonData = await res.json();
      const errorMessage = jsonData.message || jsonData.error || res.statusText;
      throw new Error(`${res.status}: ${errorMessage}`);
    } catch (jsonError) {
      // If not valid JSON, get as text
      try {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      } catch (textError) {
        // Last resort if both fail
        throw new Error(`${res.status}: Request failed`);
      }
    }
  }
}

// Add cache-busting functionality to avoid stale responses
function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_=${Date.now()}`;
}

// Enhanced API request function
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: {
    withCacheBuster?: boolean;
    retry?: boolean;
  } = {}
): Promise<Response> {
  const { withCacheBuster = true, retry = true } = options;
  const finalUrl = withCacheBuster ? addCacheBuster(url) : url;
  
  let retries = 0;
  const maxRetries = retry ? 2 : 0;
  
  while (retries <= maxRetries) {
    try {
      const res = await fetch(finalUrl, {
        method,
        headers: {
          ...(data ? { "Content-Type": "application/json" } : {}),
          // Add these headers to handle CORS and auth properly
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include", // This ensures cookies are sent with the request
        // Disable caching mechanisms
        cache: "no-store",
      });

      console.log(`API ${method} request to ${url} completed with status: ${res.status}`);
      
      // Special handling for 401 errors to provide better error messages
      if (res.status === 401) {
        console.warn(`Authentication failed for ${url}. User needs to login.`);
      }

      if (!res.ok && res.status >= 500 && retries < maxRetries) {
        // Server error, try again after a delay
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        console.log(`Retrying ${method} request to ${url} (attempt ${retries})`);
        continue;
      }

      // Don't throw here, just return the response for more flexible handling
      return res;
    } catch (error) {
      // Network error
      if (retries < maxRetries) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        console.log(`Retrying ${method} request to ${url} after network error (attempt ${retries})`);
      } else {
        console.error(`API request failed after ${retries} retries:`, error);
        throw error;
      }
    }
  }

  // This should never be reached due to the throw in the catch block
  throw new Error(`Request to ${url} failed after ${maxRetries} retries`);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Add cache buster to prevent cached responses
    const noCacheUrl = addCacheBuster(url);
    
    try {
      const res = await fetch(noCacheUrl, {
        method: 'GET',
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        },
        cache: "no-store"
      });

      console.log(`Query function request to ${url} completed with status: ${res.status}`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Returning null for ${url} due to 401 status`);
        return null;
      }

      if (!res.ok) {
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
        } catch (parseError) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
      }

      return await res.json();
    } catch (error) {
      console.error(`Query function error for ${url}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
