/**
 * Shared Service Initialization Helper
 * Provides common initialization logic for all services
 */

const ConfigClient = require('@ecommerce/config-client');
const { ensureDatabaseExists, createPool } = require('@ecommerce/db-utils');

/**
 * Initialize service with config from config-server
 * @param {Object} options - Initialization options
 * @param {string} options.serviceName - Name of the service
 * @param {string} options.profile - Environment profile (default: 'dev')
 * @param {Function} options.onConfigLoaded - Callback when config is loaded (receives config)
 * @param {Function} options.onServiceReady - Callback when service is ready (receives app, config, pool)
 * @returns {Promise<Object>} Object with { config, pool, configClient }
 */
const initializeService = async (options) => {
  const {
    serviceName,
    profile = process.env.NODE_ENV === 'production' ? 'default' : 'dev',
    onConfigLoaded = null,
    onServiceReady = null
  } = options;

  try {
    // Fetch configuration from config server ONCE at startup
    const configClient = new ConfigClient();
    const config = await configClient.getConfig(serviceName, profile);
    console.log(`Configuration loaded from Config Server (profile: ${profile})`);

    // Callback for config loaded
    if (onConfigLoaded) {
      await onConfigLoaded(config, configClient);
    }

    // Ensure database exists if database config is present
    let pool = null;
    if (config.database && config.database.name) {
      await ensureDatabaseExists(config.database);
      pool = createPool(config.database);
    }

    // Callback for service ready
    if (onServiceReady) {
      await onServiceReady(config, pool, configClient);
    }

    return { config, pool, configClient };
  } catch (error) {
    console.error('Failed to initialize service:', error);
    throw error;
  }
};

module.exports = {
  initializeService
};

