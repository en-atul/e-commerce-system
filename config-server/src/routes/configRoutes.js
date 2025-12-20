const express = require('express');
const router = express.Router();
const {
  getServiceConfig,
  getServices,
  getServiceProfiles,
  getConfigSpringFormat
} = require('../controllers/configController');

// Get all available services
router.get('/services', getServices);

// Get available profiles for a service
router.get('/:serviceName/profiles', getServiceProfiles);

// Get configuration (Spring Cloud Config format)
router.get('/:serviceName/:profile', getConfigSpringFormat);

// Get configuration (simple format)
router.get('/:serviceName/:profile/simple', getServiceConfig);

// Get default configuration
router.get('/:serviceName', (req, res, next) => {
  req.params.profile = 'default';
  next();
}, getConfigSpringFormat);

module.exports = router;

