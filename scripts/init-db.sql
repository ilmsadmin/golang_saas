-- Initialize database for development
-- This script runs when PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- System-wide schema is 'public' by default
-- Tenant schemas will be created by the application

-- Sample system data (for development only)
-- This will be replaced by proper migrations in the Go application

-- Note: Actual table creation and data seeding should be done
-- through the Go application's migration system