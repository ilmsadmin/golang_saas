# Development Dockerfile
FROM golang:1.24-alpine AS base

WORKDIR /app

# Install air for hot reloading
RUN go install github.com/air-verse/air@latest

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Command for development with hot reload
CMD ["air"]