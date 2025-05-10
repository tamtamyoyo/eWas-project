# Use Node.js 18 as the base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies for both client and server
RUN npm install

# Copy project files
COPY . .

# Copy env.example as a fallback if no env is provided
COPY env.example .env.example

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Create a directory for uploads
RUN mkdir -p /app/public/uploads && \
    chmod 777 /app/public/uploads

# Copy built assets and needed files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/env.example ./.env.example
COPY --from=builder /app/public ./public

# Install production dependencies AND vite (needed at runtime)
RUN npm install --omit=dev && npm install vite

# Create a startup script
RUN echo '#!/bin/sh\n\
echo "Starting eWas.com application..."\n\
\n\
# Check if required environment variables are set\n\
if [ -z "$DATABASE_URL" ]; then\n\
  echo "WARNING: DATABASE_URL is not set. Using a default or mock value."\n\
fi\n\
\n\
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then\n\
  echo "WARNING: Supabase configuration is incomplete. Some features may not work."\n\
fi\n\
\n\
# Set default port if not provided\n\
export PORT=${PORT:-3000}\n\
\n\
# Start the application\n\
echo "Server starting on port $PORT"\n\
exec node dist/index.js\n\
' > /app/start.sh && chmod +x /app/start.sh

# Set environment variables
ENV NODE_ENV=production
# Default port can be overridden at runtime
ENV PORT=3000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/health || exit 1

# Start the application
CMD ["/app/start.sh"] 