// Declaration files for Deno-specific imports
declare module "https://deno.land/std@0.177.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.49.4" {
  export * from "@supabase/supabase-js";
}

// Add additional module declarations for any other imports used in the edge functions
declare module "https://deno.land/x/xhr@0.3.0/mod.ts" {
  export class XMLHttpRequest extends EventTarget {
    open(method: string, url: string, async?: boolean): void;
    send(body?: any): void;
    setRequestHeader(header: string, value: string): void;
    readonly readyState: number;
    readonly status: number;
    readonly statusText: string;
    readonly responseText: string;
    readonly responseXML: Document | null;
    readonly response: any;
    responseType: XMLHttpRequestResponseType;
    onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null;
  }

  export default XMLHttpRequest;
} 