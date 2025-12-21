/**
 * Configuration module
 * Stores configuration loaded from config-server at startup
 */

let config = null;
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

