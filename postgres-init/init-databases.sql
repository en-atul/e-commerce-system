-- Initialize all databases for microservices
-- This script runs automatically when PostgreSQL container starts for the first time

-- Create databases for each microservice
CREATE DATABASE userdb;
CREATE DATABASE productdb;
CREATE DATABASE orderdb;
CREATE DATABASE paymentdb;

-- Grant privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE userdb TO postgres;
GRANT ALL PRIVILEGES ON DATABASE productdb TO postgres;
GRANT ALL PRIVILEGES ON DATABASE orderdb TO postgres;
GRANT ALL PRIVILEGES ON DATABASE paymentdb TO postgres;

