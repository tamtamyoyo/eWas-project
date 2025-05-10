// Declare Deno types needed for edge functions
declare namespace Deno {
  // Environment variables
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): Record<string, string>;
  };

  // Add more Deno namespace types as needed
  export interface DenoNamespace {
    env: typeof env;
    // Add other Deno namespaces as needed
  }
} 