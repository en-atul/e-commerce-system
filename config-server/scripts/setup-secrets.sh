#!/bin/bash

# AWS Secrets Manager Setup Script
# This script helps you create the necessary secrets in AWS Secrets Manager

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGION=${AWS_REGION:-us-east-1}
PREFIX="ecommerce"

echo -e "${GREEN}AWS Secrets Manager Setup for E-Commerce Microservices${NC}"
echo "Region: $REGION"
echo "Prefix: $PREFIX"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured. Please run 'aws configure'${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating secrets...${NC}"
echo ""

# Function to create or update secret
create_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    if aws secretsmanager describe-secret --secret-id "$secret_name" --region "$REGION" &> /dev/null; then
        echo -e "${YELLOW}Secret $secret_name already exists. Updating...${NC}"
        aws secretsmanager update-secret \
            --secret-id "$secret_name" \
            --secret-string "$secret_value" \
            --region "$REGION" \
            --description "$description" \
            > /dev/null
        echo -e "${GREEN}✓ Updated: $secret_name${NC}"
    else
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --secret-string "$secret_value" \
            --region "$REGION" \
            --description "$description" \
            > /dev/null
        echo -e "${GREEN}✓ Created: $secret_name${NC}"
    fi
}

# Database Password (shared across services)
echo "Creating database secrets..."
create_secret "$PREFIX/database/password" "postgres" "Database password for all services"

# JWT Secret (shared across services)
echo ""
echo "Creating JWT secrets..."
create_secret "$PREFIX/jwt/secret" "your-super-secret-jwt-key-change-in-production" "JWT secret key for authentication"

# Service-specific database passwords (if needed)
echo ""
echo "Creating service-specific secrets..."
create_secret "$PREFIX/user-service/database/password" "postgres" "User service database password"
create_secret "$PREFIX/product-service/database/password" "postgres" "Product service database password"
create_secret "$PREFIX/order-service/database/password" "postgres" "Order service database password"
create_secret "$PREFIX/payment-service/database/password" "postgres" "Payment service database password"

# Payment service API keys (example)
echo ""
echo "Creating payment service secrets..."
create_secret "$PREFIX/payment-service/api-key" "your-payment-api-key" "Payment service API key"

# Kafka credentials (if needed)
echo ""
echo "Creating Kafka secrets..."
create_secret "$PREFIX/kafka/password" "kafka-password" "Kafka broker password"

echo ""
echo -e "${GREEN}✓ All secrets created successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update your configuration files to use secret references:"
echo "   Example: \"aws-secrets-manager:$PREFIX/database/password\""
echo ""
echo "2. Set environment variables in your config server:"
echo "   USE_AWS_SECRETS=true"
echo "   AWS_REGION=$REGION"
echo ""
echo "3. Ensure your IAM role/user has secretsmanager:GetSecretValue permission"

