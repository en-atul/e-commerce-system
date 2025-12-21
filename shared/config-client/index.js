/**
 * Config Client Utility
 * Shared utility for services to fetch configuration from Config Server
 * Used across all microservices in the monorepo
 */

const axios = require('axios');

class ConfigClient {
  constructor(configServerUrl = null) {
    // Determine config server URL based on environment
    if (configServerUrl) {
      this.configServerUrl = configServerUrl;
    } else {
      // Use Docker service name in production, localhost in development
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.NODE_ENV === '';
      this.configServerUrl = process.env.CONFIG_SERVER_URL || 
        (isDevelopment ? 'http://localhost:8888' : 'http://config-server:8888');
    }
    this.cache = null;
    this.cacheExpiry = null;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch configuration for a service
   * @param {string} serviceName - Name of the service
   * @param {string} profile - Environment profile (dev, prod, default)
   * @param {boolean} useCache - Whether to use cached config
   * @returns {Promise<Object>} Configuration object
   */
  async getConfig(serviceName, profile = 'default', useCache = true) {
    // Check cache
    if (useCache && this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const response = await axios.get(
        `${this.configServerUrl}/api/config/${serviceName}/${profile}/simple`,
        { timeout: 5000 }
      );

      const config = response.data.config;

      // Cache the config
      if (useCache) {
        this.cache = config;
        this.cacheExpiry = Date.now() + this.cacheTTL;
      }

      return config;
    } catch (error) {
      console.error(`Failed to fetch config from Config Server: ${error.message}`);
      
      // Return cached config if available, even if expired
      if (this.cache) {
        console.warn('Using cached config due to Config Server unavailability');
        return this.cache;
      }

      // Fallback to environment variables
      console.warn('Falling back to environment variables');
      return this.getConfigFromEnv(serviceName);
    }
  }

  /**
   * Get configuration from environment variables (fallback)
   * This is only used when config-server is unavailable
   * All configuration should come from config-server in normal operation
   * 
   * IMPORTANT: Each service runs in its own process/container with its own environment variables.
   * So process.env.PORT will be different for each service:
   * - user-service container: process.env.PORT = 3001
   * - product-service container: process.env.PORT = 3002
   * - etc.
   * 
   * Service-specific values (PORT, DB_NAME) MUST be set via environment variables in each service's container
   * Generic shared values (database host/user/password, kafka, jwt) have defaults
   * 
   * @param {string} serviceName - Name of the service (unused in fallback, but kept for API compatibility)
   * @returns {Object} Configuration from environment
   * @throws {Error} If required service-specific environment variables are missing
   */
  getConfigFromEnv(serviceName = 'service') {
    // Service-specific values - each service's container has its own process.env
    // user-service container: process.env.PORT = 3001, process.env.DB_NAME = userdb
    // product-service container: process.env.PORT = 3002, process.env.DB_NAME = productdb
    // etc.
    const port = process.env.PORT;
    const dbName = process.env.DB_NAME;
    
    if (!port) {
      throw new Error('PORT environment variable is required when config-server is unavailable');
    }
    if (!dbName) {
      throw new Error('DB_NAME environment variable is required when config-server is unavailable');
    }

    // Generic shared values - have sensible defaults
    return {
      server: {
        port: parseInt(port)
      },
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        name: dbName,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
      },
      kafka: {
        broker: process.env.KAFKA_BROKER || 'localhost:9092'
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'default-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    };
  }

  /**
   * Clear the configuration cache
   */
  clearCache() {
    this.cache = null;
    this.cacheExpiry = null;
  }

  /**
   * Refresh configuration from Config Server
   * @param {string} serviceName - Name of the service
   * @param {string} profile - Environment profile
   * @returns {Promise<Object>} Fresh configuration
   */
  async refreshConfig(serviceName, profile = 'default') {
    this.clearCache();
    return await this.getConfig(serviceName, profile, false);
  }
}

module.exports = ConfigClient;

