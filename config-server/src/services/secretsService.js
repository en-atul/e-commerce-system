const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

/**
 * AWS Secrets Manager Service
 * Handles fetching secrets from AWS Secrets Manager
 */
class SecretsService {
  constructor() {
    this.client = null;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    this.initialize();
  }

  /**
   * Initialize AWS Secrets Manager client
   */
  initialize() {
    const region = process.env.AWS_REGION || 'us-east-1';
    
    this.client = new SecretsManagerClient({
      region,
      // Credentials can be provided via:
      // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
      // 2. IAM role (when running on EC2/ECS/Lambda)
      // 3. AWS credentials file (~/.aws/credentials)
      // 4. Explicit credentials in config (not recommended for production)
    });

    console.log(`AWS Secrets Manager client initialized for region: ${region}`);
  }

  /**
   * Get secret value from AWS Secrets Manager
   * @param {string} secretName - Name or ARN of the secret
   * @param {boolean} useCache - Whether to use cached value
   * @returns {Promise<string|Object>} Secret value (parsed JSON if applicable)
   */
  async getSecret(secretName, useCache = true) {
    // Check cache first
    if (useCache && this.cache.has(secretName)) {
      const cached = this.cache.get(secretName);
      if (Date.now() < cached.expiry) {
        return cached.value;
      }
      // Cache expired, remove it
      this.cache.delete(secretName);
    }

    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName
      });

      const response = await this.client.send(command);
      
      // Parse JSON if the secret is a JSON string
      let secretValue;
      if (response.SecretString) {
        try {
          secretValue = JSON.parse(response.SecretString);
        } catch (e) {
          // Not JSON, return as string
          secretValue = response.SecretString;
        }
      } else if (response.SecretBinary) {
        secretValue = Buffer.from(response.SecretBinary, 'base64').toString('utf-8');
      } else {
        throw new Error('Secret has no value');
      }

      // Cache the secret
      if (useCache) {
        this.cache.set(secretName, {
          value: secretValue,
          expiry: Date.now() + this.cacheTTL
        });
      }

      return secretValue;
    } catch (error) {
      console.error(`Error fetching secret ${secretName}:`, error.message);
      
      // Return cached value even if expired, as fallback
      if (this.cache.has(secretName)) {
        console.warn(`Using expired cached secret for ${secretName}`);
        return this.cache.get(secretName).value;
      }
      
      throw error;
    }
  }

  /**
   * Get a specific key from a JSON secret
   * @param {string} secretName - Name or ARN of the secret
   * @param {string} key - Key to extract from JSON secret
   * @param {boolean} useCache - Whether to use cached value
   * @returns {Promise<string>} Secret value for the key
   */
  async getSecretKey(secretName, key, useCache = true) {
    const secret = await this.getSecret(secretName, useCache);
    
    if (typeof secret === 'object' && secret !== null) {
      if (key in secret) {
        return secret[key];
      }
      throw new Error(`Key "${key}" not found in secret "${secretName}"`);
    }
    
    throw new Error(`Secret "${secretName}" is not a JSON object. Cannot extract key "${key}"`);
  }

  /**
   * Resolve secret reference in format: aws-secrets-manager:secret-name or aws-secrets-manager:secret-name:key
   * @param {string} reference - Secret reference string
   * @returns {Promise<string>} Resolved secret value
   */
  async resolveSecretReference(reference) {
    if (!reference || typeof reference !== 'string') {
      return reference;
    }

    // Check if it's a secret reference
    if (!reference.startsWith('aws-secrets-manager:')) {
      return reference; // Not a secret reference, return as-is
    }

    const parts = reference.replace('aws-secrets-manager:', '').split(':');
    const secretName = parts[0];
    const key = parts[1]; // Optional key for JSON secrets

    try {
      if (key) {
        return await this.getSecretKey(secretName, key);
      } else {
        const secret = await this.getSecret(secretName);
        // If it's an object, return as JSON string; otherwise return as string
        return typeof secret === 'object' ? JSON.stringify(secret) : secret;
      }
    } catch (error) {
      console.error(`Failed to resolve secret reference: ${reference}`, error);
      throw new Error(`Failed to resolve secret reference: ${reference}. ${error.message}`);
    }
  }

  /**
   * Recursively resolve all secret references in a configuration object
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} Configuration with resolved secrets
   */
  async resolveSecretsInConfig(config) {
    if (!config || typeof config !== 'object') {
      return config;
    }

    const resolved = Array.isArray(config) ? [...config] : { ...config };

    for (const key in resolved) {
      const value = resolved[key];
      
      if (typeof value === 'string' && value.startsWith('aws-secrets-manager:')) {
        resolved[key] = await this.resolveSecretReference(value);
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = await this.resolveSecretsInConfig(value);
      }
    }

    return resolved;
  }

  /**
   * Clear the secrets cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear cache for a specific secret
   * @param {string} secretName - Name of the secret to clear from cache
   */
  clearSecretCache(secretName) {
    this.cache.delete(secretName);
  }
}

// Export singleton instance
module.exports = new SecretsService();

