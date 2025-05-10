import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateEnvironment, SERVER_CONFIG, IS_DEVELOPMENT } from "./utils/env-config";

// Check environment variables before starting
const { valid, missingVars } = validateEnvironment();
if (!valid) {
  console.error("🚨 CRITICAL ERROR: Missing required environment variables:", missingVars.join(", "));
  console.error("The application will continue to run, but some features may not work correctly.");
  console.error("Please set these environment variables in your Railway dashboard or .env file.");
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Only log response bodies in development mode
      if (capturedJsonResponse && IS_DEVELOPMENT) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        
        // Truncate long responses
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
      }

      log(logLine);
    }
  });

  next();
});

// Add a health check endpoint for Docker/Railway
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    version: process.env.npm_package_version || "unknown",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString() 
  });
});

(async () => {
  try {
    const server = await registerRoutes(app);

    // Enhanced error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Log the error
      console.error(`Error [${status}]:`, err.stack || err);
      
      res.status(status).json({ message });
    });

    // Importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (IS_DEVELOPMENT) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Get port from environment config
    const port = SERVER_CONFIG.PORT || 5000;
    
    // For Docker/Windows compatibility
    const host = SERVER_CONFIG.HOST || '0.0.0.0';
    
    server.listen(port, host, () => {
      log(`🚀 Server running at http://${host}:${port}`);
      log(`📄 API available at http://${host}:${port}/api`);
      
      // Log deployment environment
      log(`🌍 Environment: ${SERVER_CONFIG.NODE_ENV}`);
    });
  } catch (error) {
    console.error("🔥 Failed to start server:", error);
    process.exit(1);
  }
})();
