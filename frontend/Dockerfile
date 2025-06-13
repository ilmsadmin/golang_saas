# Development Dockerfile for Next.js
FROM node:18-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Command for development with hot reload
CMD ["npm", "run", "dev"]
