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

# Create a better startup script with more verbose output
RUN echo '#!/bin/sh\n\
echo "Starting eWas.com application..."\n\
\n\
# Check for required environment variables and provide better error messages\n\
if [ -z "$DATABASE_URL" ]; then\n\
  echo "ERROR: DATABASE_URL is not set. This is required for the application to connect to the database."\n\
  echo "Please set this in Railway environment variables."\n\
  exit 1\n\
fi\n\
\n\
if [ -z "$SUPABASE_URL" ]; then\n\
  echo "ERROR: SUPABASE_URL is not set. This is required for Supabase client to function."\n\
  echo "Please set this in Railway environment variables."\n\
  exit 1\n\
fi\n\
\n\
if [ -z "$SUPABASE_ANON_KEY" ]; then\n\
  echo "ERROR: SUPABASE_ANON_KEY is not set. This is required for Supabase client to function."\n\
  echo "Please set this in Railway environment variables."\n\
  exit 1\n\
fi\n\
\n\
if [ -z "$SESSION_SECRET" ]; then\n\
  echo "WARNING: SESSION_SECRET is not set. Generating a random value (will change on restart)."\n\
  export SESSION_SECRET=$(openssl rand -hex 32)\n\
fi\n\
\n\
# Set default port if not provided\n\
export PORT=${PORT:-3000}\n\
export HOST=${HOST:-0.0.0.0}\n\
\n\
# Print environment check\n\
echo "Environment check:"\n\
echo "- DATABASE_URL: ${DATABASE_URL:0:15}..."\n\
echo "- SUPABASE_URL: ${SUPABASE_URL}"\n\
echo "- SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:5}..."\n\
echo "- PORT: ${PORT}"\n\
echo "- HOST: ${HOST}"\n\
\n\
# Start the application\n\
echo "Starting server on ${HOST}:${PORT}"\n\
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
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/health || exit 1

# Start the application
CMD ["/app/start.sh"] 