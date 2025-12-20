/**
 * Config Client Utility
 * Helper utility for services to fetch configuration from Config Server
 */

const axios = require('axios');

class ConfigClient {
  constructor(configServerUrl = 'http://config-server:8888') {
    this.configServerUrl = configServerUrl;
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
      return this.getConfigFromEnv();
    }
  }

  /**
   * Get configuration from environment variables (fallback)
   * @returns {Object} Configuration from environment
   */
  getConfigFromEnv() {
    return {
      server: {
        port: process.env.PORT || 3000
      },
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        name: process.env.DB_NAME || 'db',
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

