/**
 * Configuration module
 * Stores configuration loaded from config-server at startup
 * 
 * Strategy: Fetch once at startup, store in memory
 * - Reduces config-server load
 * - Fast in-memory access
 * - No network latency on requests
 * - Works even if config-server goes down after startup
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
  /**
   * Refresh configuration from config-server (optional)
   * Useful for hot-reloading config without restarting service
   */
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

