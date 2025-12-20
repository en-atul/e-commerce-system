const fs = require('fs-extra');
const path = require('path');

const CONFIG_DIR = process.env.CONFIG_DIR || path.join(__dirname, '../../config-repo');

/**
 * Get configuration for a service and profile
 * @param {string} serviceName - Name of the service
 * @param {string} profile - Environment profile (dev, prod, default)
 * @returns {Object} Merged configuration object
 */
const getConfig = async (serviceName, profile = 'default') => {
  try {
    const config = {};

    // Load default configuration
    const defaultConfigPath = path.join(CONFIG_DIR, serviceName, `${serviceName}.json`);
    if (await fs.pathExists(defaultConfigPath)) {
      const defaultConfig = await fs.readJson(defaultConfigPath);
      Object.assign(config, defaultConfig);
    }

    // Load profile-specific configuration and merge
    if (profile !== 'default') {
      const profileConfigPath = path.join(CONFIG_DIR, serviceName, `${serviceName}-${profile}.json`);
      if (await fs.pathExists(profileConfigPath)) {
        const profileConfig = await fs.readJson(profileConfigPath);
        Object.assign(config, profileConfig);
      }
    }

    return config;
  } catch (error) {
    console.error(`Error loading config for ${serviceName}/${profile}:`, error);
    throw error;
  }
};

/**
 * Get all available services
 * @returns {Array} List of service names
 */
const getAvailableServices = async () => {
  try {
    const services = await fs.readdir(CONFIG_DIR);
    return services.filter(item => {
      const itemPath = path.join(CONFIG_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    });
  } catch (error) {
    console.error('Error reading services:', error);
    return [];
  }
};

/**
 * Get all available profiles for a service
 * @param {string} serviceName - Name of the service
 * @returns {Array} List of profile names
 */
const getAvailableProfiles = async (serviceName) => {
  try {
    const serviceDir = path.join(CONFIG_DIR, serviceName);
    if (!(await fs.pathExists(serviceDir))) {
      return [];
    }

    const files = await fs.readdir(serviceDir);
    const profiles = new Set(['default']);

    files.forEach(file => {
      const match = file.match(new RegExp(`^${serviceName}-(.+)\\.json$`));
      if (match) {
        profiles.add(match[1]);
      }
    });

    return Array.from(profiles);
  } catch (error) {
    console.error(`Error reading profiles for ${serviceName}:`, error);
    return [];
  }
};

/**
 * Initialize default configuration files if they don't exist
 */
const initializeDefaultConfigs = async () => {
  try {
    await fs.ensureDir(CONFIG_DIR);

    const services = [
      'api-gateway',
      'user-service',
      'product-service',
      'order-service',
      'payment-service',
      'notification-service'
    ];

    for (const service of services) {
      const serviceDir = path.join(CONFIG_DIR, service);
      await fs.ensureDir(serviceDir);

      const defaultConfigPath = path.join(serviceDir, `${service}.json`);
      if (!(await fs.pathExists(defaultConfigPath))) {
        const defaultConfig = getDefaultConfig(service);
        await fs.writeJson(defaultConfigPath, defaultConfig, { spaces: 2 });
        console.log(`Created default config for ${service}`);
      }

      // Create dev profile
      const devConfigPath = path.join(serviceDir, `${service}-dev.json`);
      if (!(await fs.pathExists(devConfigPath))) {
        const devConfig = getDevConfig(service);
        await fs.writeJson(devConfigPath, devConfig, { spaces: 2 });
        console.log(`Created dev config for ${service}`);
      }
    }
  } catch (error) {
    console.error('Error initializing default configs:', error);
  }
};

/**
 * Get default configuration for a service
 */
const getDefaultConfig = (serviceName) => {
  const baseConfig = {
    server: {
      port: getServicePort(serviceName)
    },
    database: {
      host: `postgres-${serviceName.split('-')[0]}`,
      port: 5432,
      user: 'postgres',
      password: 'postgres'
    },
    kafka: {
      broker: 'kafka:29092'
    },
    jwt: {
      secret: 'your-super-secret-jwt-key-change-in-production',
      expiresIn: '24h'
    }
  };

  // Service-specific defaults
  switch (serviceName) {
    case 'api-gateway':
      return {
        ...baseConfig,
        server: { port: 3000 },
        services: {
          user: 'http://user-service:3001',
          product: 'http://product-service:3002',
          order: 'http://order-service:3003',
          payment: 'http://payment-service:3004'
        },
        rateLimit: {
          windowMs: 15 * 60 * 1000,
          max: 100
        }
      };
    case 'user-service':
      return {
        ...baseConfig,
        server: { port: 3001 },
        database: { ...baseConfig.database, name: 'userdb' }
      };
    case 'product-service':
      return {
        ...baseConfig,
        server: { port: 3002 },
        database: { ...baseConfig.database, name: 'productdb' }
      };
    case 'order-service':
      return {
        ...baseConfig,
        server: { port: 3003 },
        database: { ...baseConfig.database, name: 'orderdb' },
        services: {
          user: 'http://user-service:3001',
          product: 'http://product-service:3002',
          payment: 'http://payment-service:3004'
        }
      };
    case 'payment-service':
      return {
        ...baseConfig,
        server: { port: 3004 },
        database: { ...baseConfig.database, name: 'paymentdb' }
      };
    case 'notification-service':
      return {
        ...baseConfig,
        server: { port: 3005 }
      };
    default:
      return baseConfig;
  }
};

/**
 * Get development configuration for a service
 */
const getDevConfig = (serviceName) => {
  const defaultConfig = getDefaultConfig(serviceName);
  return {
    ...defaultConfig,
    environment: 'development',
    logging: {
      level: 'debug'
    },
    database: {
      ...defaultConfig.database,
      host: 'localhost'
    },
    kafka: {
      broker: 'localhost:9092'
    }
  };
};

/**
 * Get service port number
 */
const getServicePort = (serviceName) => {
  const ports = {
    'api-gateway': 3000,
    'user-service': 3001,
    'product-service': 3002,
    'order-service': 3003,
    'payment-service': 3004,
    'notification-service': 3005
  };
  return ports[serviceName] || 3000;
};

module.exports = {
  getConfig,
  getAvailableServices,
  getAvailableProfiles,
  initializeDefaultConfigs
};

