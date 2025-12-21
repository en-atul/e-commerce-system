/**
 * Configuration module
 * Stores configuration loaded from config-server at startup
 */

let config = null;
let pool = null;
let configClient = null;

module.exports = {
  setConfig: (newConfig) => {
    config = newConfig;
  },
  getConfig: () => {
    if (!config) {
      throw new Error('Configuration not initialized. Call setConfig() first.');
    }
    return config;
  },
  setPool: (newPool) => {
    pool = newPool;
  },
  getPool: () => {
    if (!pool) {
      throw new Error('Database pool not initialized. Call setPool() first.');
    }
    return pool;
  },
  setConfigClient: (client) => {
    configClient = client;
  },
  refreshConfig: async (serviceName, profile = 'default') => {
    if (!configClient) {
      throw new Error('ConfigClient not set. Cannot refresh config.');
    }
    const newConfig = await configClient.refreshConfig(serviceName, profile);
    config = newConfig;
    console.log('Configuration refreshed from Config Server');
    return newConfig;
  }
};

