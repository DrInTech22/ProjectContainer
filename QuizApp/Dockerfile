FROM node:20-slim

WORKDIR /app

# Install dependencies first (for better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Add wait-for-db script
COPY wait-for-db.sh /app/wait-for-db.sh
RUN chmod +x /app/wait-for-db.sh

# Create a startup script
RUN echo '#!/bin/sh\n\
echo "Waiting for database to be ready..."\n\
/app/wait-for-db.sh\n\
echo "Running database migrations..."\n\
npm run db:push\n\
echo "Starting application..."\n\
node dist/index.js\n\
' > /app/start.sh

RUN chmod +x /app/start.sh

# Run the application with migrations
CMD ["/app/start.sh"]