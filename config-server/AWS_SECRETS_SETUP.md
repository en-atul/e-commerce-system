# AWS Secrets Manager Setup Guide

This guide will help you set up AWS Secrets Manager integration for the Config Server.

**Note**: Development configs (`-dev.json`) use plain text values and do not require AWS Secrets Manager. This guide is for production/default configurations only.

## Prerequisites

1. AWS Account with Secrets Manager access
2. AWS CLI installed and configured
3. IAM permissions for Secrets Manager

## Quick Start

### 1. Install AWS CLI (if not already installed)

```bash
# macOS
brew install awscli

# Linux
sudo apt-get install awscli

# Or use pip
pip install awscli
```

### 2. Configure AWS Credentials

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

### 3. Create Secrets in AWS Secrets Manager

#### Option A: Use the Setup Script

```bash
cd config-server/scripts
chmod +x setup-secrets.sh
./setup-secrets.sh
```

#### Option B: Manual Creation

**Create Database Password Secret:**
```bash
aws secretsmanager create-secret \
  --name ecommerce/database/password \
  --secret-string "your-secure-database-password" \
  --region us-east-1
```

**Create JWT Secret:**
```bash
aws secretsmanager create-secret \
  --name ecommerce/jwt/secret \
  --secret-string "your-super-secret-jwt-key" \
  --region us-east-1
```

**Create Service-Specific Database Passwords:**
```bash
# User Service
aws secretsmanager create-secret \
  --name ecommerce/user-service/database/password \
  --secret-string "user-db-password" \
  --region us-east-1

# Product Service
aws secretsmanager create-secret \
  --name ecommerce/product-service/database/password \
  --secret-string "product-db-password" \
  --region us-east-1

# Order Service
aws secretsmanager create-secret \
  --name ecommerce/order-service/database/password \
  --secret-string "order-db-password" \
  --region us-east-1

# Payment Service
aws secretsmanager create-secret \
  --name ecommerce/payment-service/database/password \
  --secret-string "payment-db-password" \
  --region us-east-1
```

### 4. Configure IAM Permissions

Create an IAM policy with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:ecommerce/*"
    }
  ]
}
```

Attach this policy to:
- **EC2/ECS**: IAM role attached to your instance/task
- **Lambda**: Execution role
- **Local Development**: IAM user

### 5. Enable AWS Secrets Manager in Config Server

Set environment variables:

```bash
export USE_AWS_SECRETS=true
export AWS_REGION=us-east-1
```

Or in Docker Compose:

```yaml
config-server:
  environment:
    - USE_AWS_SECRETS=true
    - AWS_REGION=us-east-1
    # Option 1: Use IAM role (recommended for ECS/EC2)
    # Option 2: Use environment variables
    - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
    - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
```

### 6. Verify Configuration

Start the config server and test:

```bash
# Start config server
npm start

# Test configuration retrieval
curl http://localhost:8888/api/config/user-service/dev/simple
```

The response should include resolved secrets (not the `aws-secrets-manager:` references).

## Secret Reference Format

In your configuration files, use these formats:

### Simple Secret (Plain Text)
```json
{
  "database": {
    "password": "aws-secrets-manager:ecommerce/database/password"
  }
}
```

### JSON Secret with Key Extraction
```json
{
  "jwt": {
    "secret": "aws-secrets-manager:ecommerce/jwt:secret"
  }
}
```

## Secret Naming Convention

We recommend the following naming pattern:

```
ecommerce/{service-name}/{secret-type}
ecommerce/{service-name}/{secret-type}/{key}
```

Examples:
- `ecommerce/database/password` - Shared database password
- `ecommerce/jwt/secret` - Shared JWT secret
- `ecommerce/user-service/database/password` - Service-specific password
- `ecommerce/payment-service/api-key` - Service-specific API key

## Troubleshooting

### Error: "Unable to locate credentials"

**Solution**: Ensure AWS credentials are configured:
- Check `~/.aws/credentials` file
- Verify environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- For EC2/ECS, ensure IAM role is attached

### Error: "User is not authorized to perform: secretsmanager:GetSecretValue"

**Solution**: Add the required IAM permissions (see step 4)

### Secrets not resolving

**Solution**: 
1. Check `USE_AWS_SECRETS` is set to `true`
2. Verify secret names match exactly (case-sensitive)
3. Check AWS region matches
4. Review config server logs for detailed error messages

### Local Development Without AWS

For local development:
1. **Use dev profile** (`-dev.json` configs) - These already use plain text values
2. Keep `USE_AWS_SECRETS=false` (default) - Not needed for dev configs
3. Dev configs are designed for local development without AWS setup

**Example**: Request dev config instead of default:
```bash
curl http://localhost:8888/api/config/user-service/dev/simple
```

This will return config with plain text values, no AWS Secrets Manager required.

## Best Practices

1. **Never commit secrets** to version control
2. **Use different secrets** for dev/staging/production
3. **Rotate secrets regularly** using AWS Secrets Manager rotation
4. **Use IAM roles** instead of access keys when possible
5. **Enable CloudTrail** to audit secret access
6. **Use least privilege** IAM policies
7. **Monitor secret access** via CloudWatch

## Cost Considerations

AWS Secrets Manager pricing:
- $0.40 per secret per month
- $0.05 per 10,000 API calls

For cost optimization:
- Cache secrets (already implemented - 5 minute TTL)
- Reuse shared secrets across services
- Consider AWS Systems Manager Parameter Store for non-sensitive configs (free tier available)

## Next Steps

1. Set up secret rotation for database passwords
2. Configure CloudWatch alarms for secret access failures
3. Set up different secrets for different environments (dev/staging/prod)
4. Implement secret versioning for rollback capability

