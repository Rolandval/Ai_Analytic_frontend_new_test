# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npx vite build

# Expose port 5174
EXPOSE 5174

# Start the application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5174"]
