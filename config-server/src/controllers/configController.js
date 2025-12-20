const configService = require('../services/configService');

/**
 * Get configuration for a specific service and profile
 * GET /api/config/{serviceName}/{profile}
 */
const getServiceConfig = async (req, res) => {
  try {
    const { serviceName, profile = 'default' } = req.params;
    const config = await configService.getConfig(serviceName, profile);
    res.json({
      service: serviceName,
      profile,
      config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to retrieve configuration' });
  }
};

/**
 * Get all available services
 * GET /api/config/services
 */
const getServices = async (req, res) => {
  try {
    const services = await configService.getAvailableServices();
    res.json({ services });
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({ error: 'Failed to retrieve services' });
  }
};

/**
 * Get available profiles for a service
 * GET /api/config/{serviceName}/profiles
 */
const getServiceProfiles = async (req, res) => {
  try {
    const { serviceName } = req.params;
    const profiles = await configService.getAvailableProfiles(serviceName);
    res.json({ service: serviceName, profiles });
  } catch (error) {
    console.error('Error getting profiles:', error);
    res.status(500).json({ error: 'Failed to retrieve profiles' });
  }
};

/**
 * Get configuration in Spring Cloud Config format
 * GET /api/config/{serviceName}/{profile}
 * Returns format compatible with Spring Cloud Config Server
 */
const getConfigSpringFormat = async (req, res) => {
  try {
    const { serviceName, profile = 'default' } = req.params;
    const config = await configService.getConfig(serviceName, profile);
    
    // Format response similar to Spring Cloud Config Server
    res.json({
      name: serviceName,
      profiles: [profile],
      label: null,
      version: null,
      state: null,
      propertySources: [
        {
          name: `${serviceName}-${profile}.json`,
          source: config
        }
      ]
    });
  } catch (error) {
    console.error('Error getting config (Spring format):', error);
    res.status(500).json({ error: 'Failed to retrieve configuration' });
  }
};

module.exports = {
  getServiceConfig,
  getServices,
  getServiceProfiles,
  getConfigSpringFormat
};

